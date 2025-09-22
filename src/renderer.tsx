/// <reference path="./declarations.d.ts" />
import React, { useRef, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import "./index.css";
// Import the placeholder image
import placeholderImage from "./assets/placeholder-image.jpg";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';

// Define the API exposed by the preload script
declare global {
  interface Window { electronAPI: { 
    saveFile: (dataUrl: string) => Promise<void>;
    exportProject: (data: string) => Promise<void>;
    importProject: () => Promise<string | null>;
    saveCsv: (csvData: string) => Promise<void>;
    openExternalLink: (payload: { url: string, browserPath?: string }) => void;
    showContextMenu: () => void;
    getStoreValue: (key: string) => Promise<any>;
    setStoreValue: (key: string, value: any) => Promise<void>;
    getBackups: () => Promise<{ name: string, path: string, time: number, size: number }[]>;
    restoreBackup: (filePath: string) => Promise<string | null>;
    createManualBackup: (backupName: string) => Promise<{ success: boolean, path: string }>;
    deleteBackup: (filePath: string) => Promise<{ success: boolean, error?: string }>;
    exportBackup: (payload: { backupPath: string, backupName: string }) => Promise<void>;
    openBackupsFolder: () => void;
    send: (channel: string, data?: any) => void;
    on: (channel: string, callback: (...args: any[]) => void) => (() => void) | undefined;
    manageFile: (args: { action: 'select' } | { action: 'open', filePath: string }) => Promise<{ name: string, path: string } | null>;
    downloadImage: (url: string) => Promise<void>;
    showTaskContextMenu: (payload: { wordId: number, x: number, y: number }) => void;
    showSelectionContextMenu: (payload: { selectionText: string, x: number, y: number }) => void;
    showToastContextMenu: (payload: { wordId: number, x: number, y: number }) => void;
    showInboxItemContextMenu: (payload: { message: InboxMessage, x: number, y: number }) => void;
    showNavButtonContextMenu: (payload: { x: number, y: number, canGoBack: boolean, canGoForward: boolean }) => void;
    showSaveButtonContextMenu: (payload: { x: number, y: number }) => void;    
    showChecklistItemContextMenu: (payload: { sectionId: number, itemId: number, isCompleted: boolean, x: number, y: number }) => void;
    showChecklistSectionContextMenu: (payload: { wordId: number, sectionId: number, areAllComplete: boolean, x: number, y: number }) => void;
    notifyDirtyState: (isDirty: boolean) => void;
  } }
}

// Define the structure of a Word object for TypeScript
interface Attachment {
  name: string;
  path: string;
}

interface ChecklistItem {
  id: number;
  text: string;
  isCompleted: boolean;
  response?: string;
  note?: string;
}

interface ChecklistSection {
  id: number;
  title: string;
  items: ChecklistItem[];
}


interface Word {
  id: number;
  text: string;
  x: number; // Add x coordinate
  y: number; // Add y coordinate
  // New Task Manager Fields
  url?: string;
  priority?: 'High' | 'Medium' | 'Low';
  categoryId?: number;
  completeBy?: number; // Storing as a timestamp
  company?: string;
  websiteUrl?: string;
  imageLinks?: string[];
  description?: string;
  attachments?: Attachment[];
  checklist?: ChecklistSection[] | ChecklistItem[]; // Support both for migration
  notes?: string;
  // Add dimensions for hit detection
  width?: number;
  height?: number;
  openDate: number; // Use a separate field for the editable open date
  createdAt: number; // Timestamp of when the word was created
  isPaused?: boolean;
  pausedDuration?: number;
  completedDuration?: number; // The final duration when completed
  manualTime?: number; // Manually tracked time in ms
  payRate?: number; // Dollars per hour
  isRecurring?: boolean;
  isDailyRecurring?: boolean;
  isWeeklyRecurring?: boolean;
  isMonthlyRecurring?: boolean;
  isYearlyRecurring?: boolean;
  isAutocomplete?: boolean;
  lastNotified?: number; // Timestamp of the last notification sent for this task
  snoozeCount?: number; // How many times the task has been snoozed
  snoozedAt?: number; // Timestamp of when the last snooze was initiated
  manualTimeRunning?: boolean;
  taskType?: string; // New property for task types
  manualTimeStart?: number; // Timestamp when manual timer was started
}

interface InboxMessage {
  id: number;
  type: 'overdue' | 'timer-alert' | 'created' | 'completed' | 'deleted' | 'updated';
  text: string;
  timestamp: number;
  wordId?: number; // Optional: link back to the task
  sectionId?: number; // Optional: for checklist items
  isImportant?: boolean;
  isArchived?: boolean;
}

interface Browser {
  name: string;
  path: string;
}

interface Category {
  id: number;
  name: string;
  parentId?: number; // If present, this is a sub-category
  color?: string; // Add color property
}

interface TaskType {
  id: string; // e.g., 'billing', 'research'
  name: string; // e.g., 'Billing', 'Research'
  fields: (keyof Word)[]; // Array of field names to show for this type
}

interface ExternalLink {
  name: string;
  url: string;
  openInDefault?: boolean;
}

interface PrioritySortConfig {
  [key: string]: { key: keyof Word | 'timeOpen', direction: 'ascending' | 'descending' } | null;
}

interface Settings {
  fontFamily: string;
  fontColor: string;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  isOverlayEnabled: boolean;
  overlayColor: string;
  overlayOpacity: number;
  isDebugModeEnabled: boolean;
  minFontSize: number;
  maxFontSize: number;
  browsers: Browser[];
  activeBrowserIndex: number;
  categories: Category[];
  externalLinks: ExternalLink[];
  currentView: 'meme' | 'list' | 'reports' | 'inbox';
  activeCategoryId?: number | 'all';
  activeSubCategoryId?: number | 'all';
  warningTime: number; // in minutes
  isSidebarVisible: boolean;
  openAccordionIds: number[]; // Persist open accordions
  activeTaskTabs: { [key: number]: 'ticket' | 'edit' }; // Persist active tab per task
  timerNotificationLevel: 'silent' | 'low' | 'medium' | 'high';
  prioritySortConfig?: PrioritySortConfig;
  autoBackupLimit?: number;
  snoozeTime: 'low' | 'medium' | 'high'; // New setting for snooze duration
  editorHeights?: { [key: string]: string };
  useDefaultBrowserForSearch?: boolean; // New global setting
  inboxSort?: 'date-desc' | 'date-asc' | 'type';
  openInboxGroupTypes?: string[];
  taskTypes?: TaskType[];
  allCategoryColor?: string;
}


interface AccordionProps {
  title: React.ReactNode;
  children: React.ReactNode;
}

interface TabbedViewProps {
  word: Word;
  onUpdate: (updatedWord: Word) => void;
  onTabChange: (wordId: number, tab: 'ticket' | 'edit') => void;
  onNotify: (word: Word) => void;
  formatTimestamp: (ts: number) => string;
  setCopyStatus: (message: string) => void;  
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  onDescriptionChange: (html: string) => void;
  settings: Settings; // Pass down settings for browser selection
  startInEditMode?: boolean;
  words: Word[]; // Add words to props
  onComplete: (item: ChecklistItem, sectionId: number, updatedSections: ChecklistSection[]) => void; // Add this prop
  setInboxMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>; // Add setInboxMessages to props
  className?: string;
  wordId: number;
  checklistRef?: React.MutableRefObject<{ handleUndo: () => void; handleRedo: () => void; }>;
}

interface FullTaskViewProps {
  task: Word;
  onClose: () => void;
  onUpdate: (updatedWord: Word) => void;
  onNotify: (word: Word) => void;
  formatTimestamp: (ts: number) => string;
  setCopyStatus: (message: string) => void;
  settings: Settings;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  words: Word[];
  setInboxMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
  onComplete: (item: ChecklistItem, sectionId: number, updatedSections: ChecklistSection[]) => void;
  onTabChange: (wordId: number, tab: 'ticket' | 'edit') => void;
  onDescriptionChange: (html: string) => void; // Add the missing prop
}

function FullTaskView({ task, onClose, setCopyStatus, ...props }: FullTaskViewProps) {
  return (
    <div className="full-task-view-container">
      <div className="full-task-view-header">
        <button onClick={onClose} className="back-to-list-btn">
          <i className="fas fa-arrow-left"></i> Back to List
        </button>
      </div>
      <div className="full-task-view-content">
        <TabbedView
          word={task}
          wordId={task.id}
          setCopyStatus={setCopyStatus}
          {...props}
          // These are already in props, but being explicit for clarity
          onUpdate={props.onUpdate}
          onDescriptionChange={props.onDescriptionChange} // Pass it down
        />
      </div>
    </div>
  );
}

function SimpleAccordion({ title, children, startOpen = false, onToggle, className }: AccordionProps & { startOpen?: boolean, onToggle?: (isOpen: boolean) => void, className?: string }) {
  const [isOpen, setIsOpen] = useState(startOpen);

  useEffect(() => {
    // If the startOpen prop is used to control the accordion, update its internal state.
    setIsOpen(startOpen);
  }, [startOpen]);

  return (
    <div className={`accordion ${className || ''}`}>
      <div className="accordion-header" onClick={() => { setIsOpen(!isOpen); if(onToggle) onToggle(!isOpen); }}>
        <h4>{title}</h4>
        <span className="accordion-icon">
          <i className={`fas ${isOpen ? 'fa-minus' : 'fa-plus'}`}></i>
        </span>
      </div>
      <div className={`accordion-content ${isOpen ? 'open' : 'closed'}`}>
        {isOpen && children}
      </div>
    </div>
  );
}

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (url: string) => void;
}

function LinkModal({ isOpen, onClose, onConfirm }: LinkModalProps) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    // When the modal is opened, reset the URL state.
    if (isOpen) {
      setUrl('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (url) {
      onConfirm(url);
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h4>Enter URL</h4>
        <input 
          type="text" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
          onKeyDown={(e) => { 
            if (e.key === 'Enter') {
              e.preventDefault(); // Stop the event from propagating
              handleConfirm(); 
            }
          }}
          placeholder="https://example.com" 
          autoFocus />
        <div className="modal-actions">
          <button onClick={handleConfirm}>Confirm</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

interface PromptModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (inputValue: string) => void;
  placeholder?: string;
  initialValue?: string;
}

function PromptModal({ isOpen, title, onClose, onConfirm, placeholder, initialValue = '' }: PromptModalProps) {
  const [inputValue, setInputValue] = useState(initialValue);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (inputValue.trim()) {
      onConfirm(inputValue.trim());
      setInputValue(''); // Reset for next time
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h4>{title}</h4>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          placeholder={placeholder}
          autoFocus
        />
        <div className="modal-actions">
          <button onClick={handleConfirm}>Confirm</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function TabbedView({ word, onUpdate, onTabChange, onNotify, formatTimestamp, setCopyStatus, settings, startInEditMode = false, onDescriptionChange, onSettingsChange, words, setInboxMessages, onComplete, wordId, checklistRef, ...rest }: TabbedViewProps) {
  const initialTab = settings.activeTaskTabs[word.id] || (word.completedDuration ? 'ticket' : 'ticket');
  const [activeTab, setActiveTab] = useState<'ticket' | 'edit'>(initialTab);

  const handleTabClick = (tab: 'ticket' | 'edit') => {
    setActiveTab(tab);
    onTabChange(word.id, tab);
  };

  const handleFieldChange = (field: keyof Word, value: any) => {
    onUpdate({ ...word, [field]: value });
  };

  const handleTaskContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    window.electronAPI.showTaskContextMenu({ wordId: word.id, x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    // If the startInEditMode prop becomes true, switch to the edit tab
    if (startInEditMode) setActiveTab('edit');
  }, [startInEditMode]);

  // Hooks must be called at the top level, not inside conditionals.
  const descriptionRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);
  const handleCopyDescription = async () => {
    if (descriptionRef.current) {
      try {
        // Request permission to write to the clipboard
        await navigator.permissions.query({ name: 'clipboard-write' as PermissionName });
        const html = descriptionRef.current.innerHTML;
        const text = descriptionRef.current.innerText;
        const htmlBlob = new Blob([html], { type: 'text/html' });
        const textBlob = new Blob([text], { type: 'text/plain' });
        const data = [new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })];
        await navigator.clipboard.write(data);
        setCopyStatus('Description copied!');
        setTimeout(() => setCopyStatus(''), 2000);
      } catch (err) {
        console.error('Failed to copy description: ', err);
        setCopyStatus('Copy failed!');
        setTimeout(() => setCopyStatus(''), 2000);
      }
    }
  };

  const handleCopyNotes = async () => {
    if (notesRef.current) {
      try {
        await navigator.permissions.query({ name: 'clipboard-write' as PermissionName });
        // The notes are inside a DescriptionEditor, which has a content-editable div.
        // We need to find that div to get its innerHTML and innerText.
        const editorDiv = notesRef.current.querySelector('.rich-text-editor');
        if (editorDiv) {
          const html = editorDiv.innerHTML;
          const text = (editorDiv as HTMLElement).innerText;
          const htmlBlob = new Blob([html], { type: 'text/html' });
          const textBlob = new Blob([text], { type: 'text/plain' });
          const data = [new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })];
          await navigator.clipboard.write(data);
          setCopyStatus('Notes copied!');
          setTimeout(() => setCopyStatus(''), 2000);
        }
      } catch (err) {
        console.error('Failed to copy notes: ', err);
        setCopyStatus('Copy failed!');
        setTimeout(() => setCopyStatus(''), 2000);
      }
    }
  };

  const handleCopyAll = async () => {
    if (descriptionRef.current && notesRef.current) {
      try {
        await navigator.permissions.query({ name: 'clipboard-write' as PermissionName });
        const descriptionHtml = `<h3>Description</h3>${descriptionRef.current.innerHTML}`;
        const editorDiv = notesRef.current.querySelector('.rich-text-editor');
        const notesHtml = editorDiv ? `<h3>Notes</h3>${editorDiv.innerHTML}` : '';
        const combinedHtml = `${descriptionHtml}<hr>${notesHtml}`;

        const descriptionText = `Description\n${descriptionRef.current.innerText}`;
        const notesText = editorDiv ? `\n\nNotes\n${(editorDiv as HTMLElement).innerText}` : '';
        const combinedText = `${descriptionText}${notesText}`;

        const htmlBlob = new Blob([combinedHtml], { type: 'text/html' });
        const textBlob = new Blob([combinedText], { type: 'text/plain' });
        const data = [new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })];
        await navigator.clipboard.write(data);
        setCopyStatus('All content copied!');
        setTimeout(() => setCopyStatus(''), 2000);
      } catch (err) {
        console.error('Failed to copy all: ', err);
        setCopyStatus('Copy failed!');
        setTimeout(() => setCopyStatus(''), 2000);
      }
    }
  };

  const tabContentRef = useRef<HTMLDivElement>(null);

  const tabHeaders = (
    <div className="tab-headers" style={{ marginTop: '5px' }}>
      <button onClick={() => handleTabClick('ticket')} className={activeTab === 'ticket' ? 'active' : ''}>Task</button>
      {!word.completedDuration && ( // Only show Edit tab for non-completed items
        <button onClick={() => handleTabClick('edit')} className={activeTab === 'edit' ? 'active' : ''}>Edit</button>
      )}
    </div>
  );

  return (
    <div className="tab-container">
      {tabHeaders}
      <div className="tab-content" ref={tabContentRef}>
        {activeTab === 'ticket' && (
          <div className="ticket-display-view">            
            <h3 onContextMenu={handleTaskContextMenu}>{word.text}</h3>            
            {word.url && <p><strong>URL:</strong> <span className="link-with-copy"><a href="#" onClick={(e) => { e.preventDefault(); window.electronAPI.openExternalLink({ url: word.url, browserPath: settings.browsers[settings.activeBrowserIndex]?.path }); }}>{word.url}</a><button className="icon-button copy-btn" title="Copy URL" onClick={() => { navigator.clipboard.writeText(word.url); setCopyStatus('URL copied!'); setTimeout(() => setCopyStatus(''), 2000); }}><i className="fas fa-copy"></i></button></span></p>}
            <p><strong>Category:</strong> {settings.categories.find(c => c.id === word.categoryId)?.name || 'Uncategorized'}</p>
            <p><strong>Priority:</strong> {word.priority || 'Medium'}</p>
            <p><strong>Open Date:</strong> {formatTimestamp(word.openDate)}</p>
            <p><strong>Time Open:</strong> <TimeOpen startDate={word.createdAt} /></p>
            {word.completeBy && <p><strong>Complete By:</strong> {formatTimestamp(word.completeBy)}</p>}            
            {word.completeBy && <p><strong>Time Left:</strong> <TimeLeft word={word} onUpdate={onUpdate} onNotify={onNotify} settings={settings} /></p>}            
            {word.company && <p><strong>Company:</strong> <span className="link-with-copy">{word.company}<button className="icon-button copy-btn" title="Copy Company" onClick={() => { navigator.clipboard.writeText(word.company); setCopyStatus('Company copied!'); setTimeout(() => setCopyStatus(''), 2000); }}><i className="fas fa-copy"></i></button></span></p>}
            <div className="work-timer-container"><strong>Work Timer:</strong>
              <ManualStopwatch word={word} onUpdate={(updatedWord) => onUpdate(updatedWord)} />
            </div>
            <div><strong>Task Cost:</strong>
              <span> ${(((word.manualTime || 0) / (1000 * 60 * 60)) * (word.payRate || 0)).toFixed(2)}</span>
            </div>
            {word.websiteUrl && <p><strong>Website URL:</strong> <span className="link-with-copy"><a href="#" onClick={(e) => { e.preventDefault(); window.electronAPI.openExternalLink({ url: word.websiteUrl, browserPath: settings.browsers[settings.activeBrowserIndex]?.path }); }}>{word.websiteUrl}</a><button className="icon-button copy-btn" title="Copy URL" onClick={() => { navigator.clipboard.writeText(word.websiteUrl); setCopyStatus('Website URL copied!'); setTimeout(() => setCopyStatus(''), 2000); }}><i className="fas fa-copy"></i></button></span></p>}
            <div><strong>Image Links:</strong>
              <div className="image-links-display">
                {(word.imageLinks || []).map((link, index) => (
                  <div key={index} className="image-link-item">
                    <img src={link} alt={`Image ${index + 1}`} />
                    <div className="image-link-actions">
                      <button className="icon-button" onClick={() => window.electronAPI.downloadImage(link)} title="Download Image"><i className="fas fa-download"></i></button>
                      <button className="icon-button" onClick={() => { navigator.clipboard.writeText(link); setCopyStatus('Image URL copied!'); setTimeout(() => setCopyStatus(''), 2000); }} title="Copy URL"><i className="fas fa-copy"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div><strong>Attachments:</strong>
              <div className="attachments-display">
                {(word.attachments || []).map((file, index) => (
                  <div key={index} className="attachment-item">
                    <span className="attachment-name" onClick={() => window.electronAPI.manageFile({ action: 'open', filePath: file.path })} title={`Open ${file.name}`}>
                      📄 {file.name}
                    </span>
                    {/* The remove button is only shown in the edit view for clarity */}
                  </div>
                ))}
              </div>
            </div>
            {tabHeaders}
            <div className="description-container" onContextMenu={(e) => {
              const target = e.target as HTMLElement;
              // If the user right-clicks a link, show the link menu. Otherwise, show the ticket menu.
              if (target.tagName === 'A') {
                e.preventDefault();
                e.stopPropagation();
                const url = target.getAttribute('href');
                if (url) window.electronAPI.send('show-link-context-menu', url);
              } else {
                handleTaskContextMenu(e);
              }
            }} onClick={(e) => { // Also handle left-clicks for links
              const target = e.target as HTMLElement;
              if (target.tagName === 'A') {
                e.preventDefault();
                const url = target.getAttribute('href');
                if (url) window.electronAPI.openExternalLink({ url, browserPath: settings.browsers[settings.activeBrowserIndex]?.path });
              }
            }}>
              <div className="description-header" onContextMenu={handleTaskContextMenu}>
                <strong>Description:</strong>
                <button className="icon-button copy-btn" title="Copy Description Text" onClick={handleCopyDescription}><i className="fas fa-copy"></i></button>
                <button className="icon-button copy-btn" title="Copy Description HTML" onClick={() => {
                  navigator.clipboard.writeText(word.description || ''); setCopyStatus('Description HTML copied!');
                  setTimeout(() => setCopyStatus(''), 2000);
                }}><i className="fas fa-code"></i></button>
                <button className="icon-button copy-btn" title="Copy All (Description + Notes)" onClick={handleCopyAll}><i className="fas fa-copy"></i> All</button>
              </div>
              <Checklist 
                sections={word.checklist || []} 
                onUpdate={(newSections) => handleFieldChange('checklist', newSections)} 
                onComplete={onComplete}
                words={words}
                setInboxMessages={setInboxMessages}
                wordId={wordId}
                checklistRef={checklistRef}
                setCopyStatus={setCopyStatus}
                isEditable={false} />
              <DescriptionEditor 
                description={word.description || ''} 
                onDescriptionChange={(html) => handleFieldChange('description', html)} 
                settings={settings} 
                onSettingsChange={onSettingsChange} 
                editorKey={`task-description-${word.id}`} />
            </div>
            <div className="description-container" ref={notesRef}>
              <div className="description-header">
                <strong>Notes:</strong>
                <button className="icon-button copy-btn" title="Copy Notes Text" onClick={handleCopyNotes}><i className="fas fa-copy"></i></button>
                <button className="icon-button copy-btn" title="Copy Notes HTML" onClick={() => {
                  navigator.clipboard.writeText(word.notes || ''); setCopyStatus('Notes HTML copied!');
                  setTimeout(() => setCopyStatus(''), 2000);
                }}><i className="fas fa-code"></i></button>
              </div>
              <DescriptionEditor 
                description={word.notes || ''} 
                onDescriptionChange={(html) => handleFieldChange('notes', html)} 
                settings={settings} 
                onSettingsChange={onSettingsChange} 
                editorKey={`task-notes-${word.id}`} />
            </div>
          </div>
        )}
        {activeTab === 'edit' && !word.completedDuration && (
          <div className="word-item-details-form">
            <label><h4>Task Title:</h4>
              <input type="text" value={word.text} onChange={(e) => handleFieldChange('text', e.target.value)} />
            </label>
            <label><h4>Category:</h4>
              <select value={word.categoryId || ''} onChange={(e) => handleFieldChange('categoryId', Number(e.target.value))}>
                <CategoryOptions categories={settings.categories} />
              </select>
            </label>
            <label><h4>Task Title URL:</h4>
              <input type="text" value={word.url || ''} onChange={(e) => handleFieldChange('url', e.target.value)} placeholder="https://example.com" />
            </label>
            <label><h4>Priority:</h4><select value={word.priority || 'Medium'} onChange={(e) => handleFieldChange('priority', e.target.value as any)}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>
            <label><h4>Open Date:</h4>
              <div className="date-input-group">
                <input type="datetime-local" value={formatTimestampForInput(word.openDate)} onChange={(e) => handleFieldChange('openDate', parseInputTimestamp(e.target.value))} />
                <div className="button-group">{(() => {
                    const subtractTime = (amount: number, unit: 'minutes' | 'hours' | 'days') => {
                      const baseTime = word.openDate ? new Date(word.openDate) : new Date();
                      if (unit === 'minutes') baseTime.setMinutes(baseTime.getMinutes() - amount);
                      if (unit === 'hours') baseTime.setHours(baseTime.getHours() - amount);
                      if (unit === 'days') baseTime.setDate(baseTime.getDate() - amount);
                      handleFieldChange('openDate', baseTime.getTime());
                    };
                    return <><button className="icon-button" onClick={() => handleFieldChange('openDate', undefined)} title="Clear Date"><i className="fas fa-times"></i></button>
                      <button onClick={() => handleFieldChange('openDate', new Date().getTime())} title="Set to Now">NOW</button>
                      <button onClick={() => { const d = new Date(word.openDate || Date.now()); d.setMinutes(0,0,0); handleFieldChange('openDate', d.getTime()); }} title="Round to Hour">:00</button>
                      <button onClick={() => subtractTime(15, 'minutes')}>-15m</button> <button onClick={() => subtractTime(30, 'minutes')}>-30m</button>
                      <button onClick={() => subtractTime(1, 'hours')}>-1h</button> <button onClick={() => subtractTime(2, 'hours')}>-2h</button>
                      <button onClick={() => subtractTime(1, 'days')}>-1d</button> <button onClick={() => subtractTime(3, 'days')}>-3d</button>
                    </>;
                  })()}
                </div>
              </div>
            </label>
            <label><h4>Complete By:</h4>
              <div className="date-input-group">
                <input type="datetime-local" value={formatTimestampForInput(word.completeBy)} onChange={(e) => handleFieldChange('completeBy', parseInputTimestamp(e.target.value))} />
                <div className="button-group">{(() => {
                    const addTime = (amount: number, unit: 'minutes' | 'hours' | 'days') => {
                      const baseTime = word.completeBy ? new Date(word.completeBy) : new Date();
                      if (unit === 'minutes') baseTime.setMinutes(baseTime.getMinutes() + amount);
                      if (unit === 'hours') baseTime.setHours(baseTime.getHours() + amount);
                      if (unit === 'days') baseTime.setDate(baseTime.getDate() + amount);
                      handleFieldChange('completeBy', baseTime.getTime());
                    };
                    return <><button className="icon-button" onClick={() => handleFieldChange('completeBy', undefined)} title="Clear Date"><i className="fas fa-times"></i></button>
                      <button onClick={() => handleFieldChange('completeBy', new Date().getTime())} title="Set to Now">NOW</button>
                      <button onClick={() => {
                        const baseTime = word.completeBy ? new Date(word.completeBy) : new Date();
                        baseTime.setMinutes(0, 0, 0); // Set minutes, seconds, and ms to 0
                        handleFieldChange('completeBy', baseTime.getTime());
                      }} title="Round to Hour">:00</button>
                      <button onClick={() => addTime(15, 'minutes')}>+15m</button> <button onClick={() => addTime(30, 'minutes')}>+30m</button>
                      <button onClick={() => addTime(1, 'hours')}>+1h</button> <button onClick={() => addTime(2, 'hours')}>+2h</button>
                      <button onClick={() => addTime(1, 'days')}>+1d</button> <button onClick={() => addTime(3, 'days')}>+3d</button>
                    </>;
                  })()}</div>
              </div>
            </label>
            <label><h4>Company:</h4>
              <input type="text" value={word.company || ''} onChange={(e) => handleFieldChange('company', e.target.value)} />
            </label>
            <label><h4>Pay Rate ($/hr):</h4>
              <input type="number" value={word.payRate || 0} onChange={(e) => handleFieldChange('payRate', Number(e.target.value))} />
            </label>
            <label><h4>Website URL:</h4>
              <input type="text" value={word.websiteUrl || ''} onChange={(e) => handleFieldChange('websiteUrl', e.target.value)} placeholder="https://company.com" />
            </label>
            <label><h4>Image Links:</h4>
              {(word.imageLinks || []).map((link, index) => (
                <div key={index} className="image-link-edit">
                  <input type="text" value={link} onChange={(e) => {
                    const newLinks = [...(word.imageLinks || [])];
                    newLinks[index] = e.target.value;
                    handleFieldChange('imageLinks', newLinks);
                  }} /><button className="icon-button" onClick={() => handleFieldChange('imageLinks', (word.imageLinks || []).filter((_, i) => i !== index))}><i className="fas fa-minus"></i></button>
                </div>
              ))}
            </label><button className="add-link-btn" onClick={() => handleFieldChange('imageLinks', [...(word.imageLinks || []), ''])}>
              <i className="fas fa-plus"></i> Add Image Link
            </button>
            <label><h4>Attachments:</h4>
              {(word.attachments || []).map((file, index) => (
                <div key={index} className="attachment-edit">
                  <span className="attachment-name" onClick={() => window.electronAPI.manageFile({ action: 'open', filePath: file.path })} title={`Open ${file.name}`}>
                    📄 {file.name}
                  </span>
                  <button className="icon-button" onClick={() => handleFieldChange('attachments', (word.attachments || []).filter((_, i) => i !== index))}><i className="fas fa-minus"></i></button>
                </div>
              ))}
            </label><button className="add-link-btn" onClick={async () => {
              const newFile = await window.electronAPI.manageFile({ action: 'select' });
              if (newFile) {
                handleFieldChange('attachments', [...(word.attachments || []), newFile]);
              }
            }}><i className="fas fa-plus"></i> Attach File</button>
            {tabHeaders}
            <div className="description-header" style={{ marginBottom: '10px' }}>
              <strong>Description:</strong>
              <button className="icon-button copy-btn" title="Copy Description Text" onClick={handleCopyDescription}><i className="fas fa-copy"></i></button>
              <button className="icon-button copy-btn" title="Copy Description HTML" onClick={() => {
                navigator.clipboard.writeText(word.description || ''); setCopyStatus('Description HTML copied!');
                setTimeout(() => setCopyStatus(''), 2000);
              }}><i className="fas fa-code"></i></button>
              <button className="icon-button copy-btn" title="Copy All (Description + Notes)" onClick={handleCopyAll}><i className="fas fa-copy"></i> All</button>
            </div>
            <Checklist 
              sections={word.checklist || []} 
              onUpdate={(newSections) => handleFieldChange('checklist', newSections)} 
              onComplete={onComplete}
              isEditable={true} 
              words={words}
              setInboxMessages={setInboxMessages}
              checklistRef={checklistRef}
              wordId={wordId}
              setCopyStatus={setCopyStatus}
              />
            <DescriptionEditor 
              description={word.description || ''} 
              onDescriptionChange={(html) => handleFieldChange('description', html)} 
                settings={settings} 
              onSettingsChange={onSettingsChange}
              editorKey={`edit-description-${word.id}`} />
            <div className="description-container">
              <strong>Notes:</strong>
              <DescriptionEditor 
                description={word.notes || ''} 
                onDescriptionChange={(html) => handleFieldChange('notes', html)} 
                settings={settings}
                onSettingsChange={onSettingsChange}
                editorKey={`edit-notes-${word.id}`} />
            </div>
            <label className="checkbox-label flexed-column">
              <input type="checkbox" checked={word.isRecurring || false} onChange={(e) => handleFieldChange('isRecurring', e.target.checked)} /> 
              <span className="checkbox-label-text">Re-occurring Task</span>
            </label>
            <label className="checkbox-label flexed-column">
              <input type="checkbox" checked={word.isDailyRecurring || false} onChange={(e) => handleFieldChange('isDailyRecurring', e.target.checked)} />
              <span className="checkbox-label-text">Repeat Daily</span>
            </label>
            <label className="checkbox-label flexed-column">
              <input type="checkbox" checked={word.isWeeklyRecurring || false} onChange={(e) => handleFieldChange('isWeeklyRecurring', e.target.checked)} />
              <span className="checkbox-label-text">Repeat Weekly</span>
            </label>
            <label className="checkbox-label flexed-column">
              <input type="checkbox" checked={word.isMonthlyRecurring || false} onChange={(e) => handleFieldChange('isMonthlyRecurring', e.target.checked)} />
              <span className="checkbox-label-text">Repeat Monthly</span>
            </label>
            <label className="checkbox-label flexed-column">
              <input type="checkbox" checked={word.isYearlyRecurring || false} onChange={(e) => handleFieldChange('isYearlyRecurring', e.target.checked)} />
              <span className="checkbox-label-text">Repeat Yearly</span>
            </label>
            <label className="checkbox-label flexed-column">
              <input type="checkbox" checked={word.isAutocomplete || false} onChange={(e) => handleFieldChange('isAutocomplete', e.target.checked)} />
              <span className="checkbox-label-text">Autocomplete on Deadline</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}


function DescriptionEditor({ description, onDescriptionChange, settings, onSettingsChange, editorKey }: { description: string, onDescriptionChange: (html: string) => void, settings: Settings, onSettingsChange: (newSettings: Partial<Settings>) => void, editorKey: string }) {
  const [activeView, setActiveView] = useState<'view' | 'html'>('view');
  const [htmlContent, setHtmlContent] = useState(description);
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // State for link modal
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);

  const handleBlur = (e: React.FocusEvent<HTMLDivElement | HTMLTextAreaElement>) => {
    const newHtml = activeView === 'view' ? (e.target as HTMLDivElement).innerHTML : (e.target as HTMLTextAreaElement).value;
    setHtmlContent(newHtml);
    onDescriptionChange(newHtml);
  };

  const handleConfirmLink = (url: string) => {
    // Ensure the URL has a protocol
    let fullUrl = url;
    if (!/^https?:\/\//i.test(fullUrl)) {
      fullUrl = `https://${fullUrl}`;
    }

    if (selectionRange) {
      const selection = window.getSelection();
      // CRITICAL FIX: The selection is lost when the modal is used.
      // We must re-add our saved range to the selection before executing a command.
      selection.removeAllRanges();
      selection.addRange(selectionRange);
      document.execCommand('createLink', false, fullUrl);
      // After command, update state
      if (editorRef.current) {
        onDescriptionChange(editorRef.current.innerHTML);
      }
    }
    setIsLinkModalOpen(false);
  };

  const handleRichTextKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let commandExecuted = false;
  
    if (e.altKey && !e.shiftKey && !e.ctrlKey && headerShortcutKeys.includes(e.key)) {
      e.preventDefault();
      const headerLevel = e.key;
      document.execCommand('removeFormat', false, null);
      document.execCommand('formatBlock', false, `H${headerLevel}`);
      commandExecuted = true;
    } else if (e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case 'k':
          e.preventDefault();
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            setSelectionRange(selection.getRangeAt(0));
            setIsLinkModalOpen(true);
          }
          break;
        case 'l': e.preventDefault(); document.execCommand('insertUnorderedList', false, null); commandExecuted = true; break;
        case '\\': e.preventDefault(); document.execCommand('removeFormat', false, null); commandExecuted = true; break;
        case 'p': e.preventDefault(); document.execCommand('formatBlock', false, 'P'); commandExecuted = true; break;
        default:
          // Allow default browser behavior for Ctrl+C, Ctrl+V, etc.
      }
    }
  
    if (commandExecuted) {
      // Use a timeout to ensure the DOM has been updated by the browser before we read it.
      setTimeout(() => {
        if (editorRef.current) {
          onDescriptionChange(editorRef.current.innerHTML);
        }
      }, 0);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain');

    // Simple URL regex to check if the pasted content is a link
    const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i;

    const selection = window.getSelection();
    // Check if it's a URL and if there's currently text selected
    if (urlRegex.test(pastedText) && selection && !selection.isCollapsed && selectionRange) {
      // It's a URL and text is highlighted.
      // Restore the selection that was active *before* the paste event.
      selection.removeAllRanges();
      selection.addRange(selectionRange);

      // Now create the link.
      document.execCommand('createLink', false, pastedText);
    } else {
      // It's not a URL or no text is selected, so just paste the text
      document.execCommand('insertText', false, pastedText);
    }

    // After the command, the DOM is updated. We need to sync React's state.
    // We use a timeout to ensure the DOM update has completed.
    setTimeout(() => {
      if (editorRef.current) {
        const newHtml = editorRef.current.innerHTML;
        setHtmlContent(newHtml);
        onDescriptionChange(newHtml);
      }
    }, 0);
  };

  // We need to capture the selection on mouse up, because by the time
  // the onPaste event fires, the selection might already be collapsed.
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setSelectionRange(selection.getRangeAt(0));
    }
  };

  const handleKeyUp = () => {
    handleMouseUp(); // Also capture on key up for keyboard selections
  };

  return (
    <div className="description-editor-container">
      <div className="description-editor-tabs">
        <button onClick={() => setActiveView('view')} className={activeView === 'view' ? 'active' : ''}>View</button>
        <button onClick={() => setActiveView('html')} className={activeView === 'html' ? 'active' : ''}>Edit HTML</button>
      </div>
      <LinkModal 
        isOpen={isLinkModalOpen} 
        onClose={() => setIsLinkModalOpen(false)} 
        onConfirm={handleConfirmLink} 
      />
      {activeView === 'view' ? (
        <div
          className="rich-text-editor"
          contentEditable
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          onBlur={handleBlur}
          onKeyDown={handleRichTextKeyDown}
          onPaste={handlePaste}
          onMouseUp={handleMouseUp}
          onKeyUp={handleKeyUp}
          ref={editorRef}
        />
      ) : (
        <textarea
          className="html-editor"
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          onBlur={handleBlur}
          ref={textareaRef}
        />
      )}
      <div className="shortcut-key">
        <span>Shortcuts:</span>
        <span dangerouslySetInnerHTML={{ __html: `${headerShortcutKeyDisplay}, ${otherShortcutKeys}` }} />
      </div>
    </div>
  );
}

function Checklist({ sections, onUpdate, isEditable, onComplete, words, setInboxMessages, wordId, checklistRef, setCopyStatus }: { sections: ChecklistSection[] | ChecklistItem[], onUpdate: (newSections: ChecklistSection[]) => void, isEditable: boolean, onComplete: (item: ChecklistItem, sectionId: number, updatedSections: ChecklistSection[]) => void, words: Word[], setInboxMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>, wordId: number, checklistRef?: React.MutableRefObject<{ handleUndo: () => void; handleRedo: () => void; }>, setCopyStatus: (message: string) => void }) {
  const [newItemTexts, setNewItemTexts] = useState<{ [key: number]: string }>({});
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingItemText, setEditingItemText] = useState('');

  // State for local undo/redo history of checklist changes
  const [history, setHistory] = useState<ChecklistSection[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoingRedoing = useRef(false); // Ref to prevent feedback loops


  // Data Migration: Handle old format (ChecklistItem[]) and convert to new format (ChecklistSection[])
  const normalizedSections: ChecklistSection[] = React.useMemo(() => {
    if (!sections || sections.length === 0) { 
      return [];
    }
    // Check if the first element is a ChecklistItem (old format)
    if ('isCompleted' in sections[0]) {
      return [{ id: 1, title: 'Checklist', items: sections as ChecklistItem[] }];
    }
    return sections as ChecklistSection[];
  }, [sections]);

  // Initialize history when sections are loaded
  useEffect(() => {
    setHistory([normalizedSections]);
    setHistoryIndex(0);
  }, [wordId]); // Re-initialize history only when the task itself changes

  const updateHistory = (newSections: ChecklistSection[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, newSections]);
    setHistoryIndex(newHistory.length);
  };
  // Effect to handle commands from the context menu that require local state changes
  useEffect(() => {
    const handleChecklistCommand = (payload: { command: string, sectionId: number, itemId: number }) => {
      if (payload.command === 'edit') {
        const section = normalizedSections.find(s => s.id === payload.sectionId);
        const item = section?.items.find(i => i.id === payload.itemId);
        if (item) {
          setEditingItemId(item.id);
          setEditingItemText(item.text);
        }
      }
    };

    // We listen for the generic command, but only act on 'edit'
    const cleanup = window.electronAPI.on('checklist-item-command', handleChecklistCommand);
    return cleanup;
  }, [normalizedSections]); // Re-bind if the sections change

  const handleUpdateItemText = (sectionId: number, itemId: number, newText: string) => {
    const newSections = normalizedSections.map(sec => sec.id === sectionId ? { ...sec, items: sec.items.map(item => item.id === itemId ? { ...item, text: newText } : item) } : sec);
    if (!isUndoingRedoing.current) {
      updateHistory(newSections);
    }
    onUpdate(newSections);
  };

  const handleAddSection = () => {
    const newId = Date.now();
    const newSection: ChecklistSection = {
      id: newId,
      title: 'New Section',
      items: [],
    };
    const newSections = [...normalizedSections, newSection];
    updateHistory(newSections);
    onUpdate(newSections);
    setEditingSectionId(newId); // Set the new section to be in edit mode
    setEditingSectionTitle('New Section'); // Initialize the input with the default title
  };

  const handleUpdateSectionTitle = (sectionId: number, newTitle: string) => {
    const newSections = normalizedSections.map(sec => 
      sec.id === sectionId ? { ...sec, title: newTitle } : sec
    );
    if (!isUndoingRedoing.current) {
      updateHistory(newSections);
    }
    onUpdate(newSections);
  };

  const handleDeleteAllSections = () => {
    if (window.confirm('Are you sure you want to delete all checklist sections and their items?')) {
      updateHistory([]);
      onUpdate([]);
    }
  };
  
  const handleAddItem = (sectionId: number) => {
    const text = newItemTexts[sectionId] || '';
    const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
    if (lines.length === 0) return;

    const newItems: ChecklistItem[] = lines.map((line, index) => ({
      id: Date.now() + Math.random(), // Use Math.random() to guarantee a unique ID
      text: line,
      isCompleted: false,
    }));

    const newSections = normalizedSections.map(sec =>
      sec.id === sectionId ? { ...sec, items: [...sec.items, ...newItems] } : sec
    );

    if (!isUndoingRedoing.current) {
      updateHistory(newSections);
    }
    onUpdate(newSections);
    setNewItemTexts(prev => ({ ...prev, [sectionId]: '' })); // Clear only this section's input
  };

  const handleToggleItem = (sectionId: number, itemId: number) => {
    let toggledItem: ChecklistItem | null = null;
    const newSections = normalizedSections.map(sec => {
      if (sec.id !== sectionId) return sec;

      const newItems = sec.items.map(item => {
        if (item.id !== itemId) return item;

        const isNowCompleted = !item.isCompleted;

        // If the item is being marked as complete, send a notification.
        if (isNowCompleted) {
          toggledItem = item; // Store the item that was toggled
        }
        return { ...item, isCompleted: isNowCompleted };
      });
      return { ...sec, items: newItems };
    });

    // Now that newSections is fully initialized, we can safely use it.
    if (toggledItem) {
      onComplete(toggledItem, sectionId, newSections);
    }

    if (!isUndoingRedoing.current) {
      updateHistory(newSections);
    }
    onUpdate(newSections);
  };

  const moveSection = (sections: ChecklistSection[], sectionId: number, direction: 'up' | 'down'): ChecklistSection[] => {
    const newSections = [...sections];
    const index = newSections.findIndex(s => s.id === sectionId);
    if (direction === 'up' && index > 0) {
      [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    } else if (direction === 'down' && index < newSections.length - 1) {
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    }
    if (!isUndoingRedoing.current) {
      updateHistory(newSections);
    }
    return newSections;
  };

  const handleCompleteAllInSection = (sectionId: number) => {
    const sectionToUpdate = normalizedSections.find(sec => sec.id === sectionId);
    if (!sectionToUpdate) return;

    const areAllCurrentlyCompleted = sectionToUpdate.items.every(item => item.isCompleted);

    // If un-checking all, just update state and return.
    if (!areAllCurrentlyCompleted) {
      // Send notifications for each item that is about to be completed.
      sectionToUpdate.items.forEach(item => {
        if (!item.isCompleted) {
          onComplete(item, sectionId, []); // Pass empty array as updatedSections is not needed here.
        }
      });

      // Send the single "Section Completed" notification.
      const parentWord = words.find((w: Word) => w.checklist?.some((s: any) => 'items' in s && s.id === sectionId)); 
      if (parentWord) {
        setInboxMessages((prev: InboxMessage[]) => [{ id: Date.now() + Math.random(), type: 'completed', text: `Section completed: "${sectionToUpdate.title}" in task "${parentWord.text}"`, timestamp: Date.now(), wordId: parentWord.id, sectionId: sectionId }, ...prev]);
      }
    }

    // Finally, update the state to toggle all items.
    const newSections = normalizedSections.map(sec => sec.id === sectionId ? { ...sec, items: sec.items.map(i => ({ ...i, isCompleted: !areAllCurrentlyCompleted })) } : sec);
    if (!isUndoingRedoing.current) {
      updateHistory(newSections);
    }
    onUpdate(newSections);
  };

  const handleClearCompleted = (sectionId: number) => {
    const newSections = normalizedSections.map(sec => {
      if (sec.id === sectionId) {
        const newItems = sec.items.filter(item => !item.isCompleted);
        return { ...sec, items: newItems };
      }
      return sec;
    });
    if (!isUndoingRedoing.current) {
      updateHistory(newSections);
    }
    onUpdate(newSections);
  };

  const handleToggleAllSections = () => {
    const allItems = normalizedSections.flatMap(sec => sec.items);
    if (allItems.length === 0) return;

    const areAllItemsComplete = allItems.every(item => item.isCompleted);

    const newSections = normalizedSections.map(sec => ({
      ...sec,
      items: sec.items.map(item => {
        // If we are completing all, and this item isn't complete yet, send a notification
        if (!areAllItemsComplete && !item.isCompleted) {
          onComplete(item, sec.id, []);
        }
        return { ...item, isCompleted: !areAllItemsComplete };
      })
    }));
    if (!isUndoingRedoing.current) {
      updateHistory(newSections);
    }
    onUpdate(newSections);
  };

  const handleDeleteItem = (sectionId: number, itemId: number) => {
    const newSections = normalizedSections.map(sec => {
      if (sec.id === sectionId) {
        const newItems = sec.items.filter(item => item.id !== itemId);
        return { ...sec, items: newItems };
      }
      return sec;
    });
    if (!isUndoingRedoing.current) {
      updateHistory(newSections);
    }
    onUpdate(newSections);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoingRedoing.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      // Find the parent word and update it with the historical checklist state
      onUpdate(history[newIndex]);
      setTimeout(() => isUndoingRedoing.current = false, 0);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoingRedoing.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      // Find the parent word and update it with the historical checklist state
      onUpdate(history[newIndex]);
      setTimeout(() => isUndoingRedoing.current = false, 0);
    }
  };

  // Expose undo/redo functions via the passed-in ref
  if (checklistRef) {
    checklistRef.current = {
      handleUndo,
      handleRedo,
    };
  }

  return (
    <div className="checklist-container">
      <div className="checklist-main-header">
        <h4>Checklist</h4>
        {(() => {
          const allItems = normalizedSections.flatMap(sec => sec.items);
          if (allItems.length === 0) return null;
          const areAllItemsComplete = allItems.every(item => item.isCompleted);
          return (
            <div className="checklist-section-actions">
              <button 
                onClick={handleToggleAllSections} 
                className="checklist-action-btn"
                title={areAllItemsComplete ? 'Re-Open All Items in All Sections' : 'Complete All Items in All Sections'}
              >
                <i className={`fas ${areAllItemsComplete ? 'fa-undo' : 'fa-check-square'}`}></i>
              </button>
              {/* Move Undo/Redo buttons here */}
              <button className="checklist-action-btn" onClick={handleUndo} disabled={historyIndex === 0} title="Undo Last Checklist Action">
                <i className="fas fa-undo-alt"></i>
              </button>
              <button className="checklist-action-btn" onClick={handleRedo} disabled={historyIndex === history.length - 1} title="Redo Checklist Action">
                <i className="fas fa-redo-alt"></i>
              </button>
              <button className="checklist-action-btn" onClick={() => {
                const textToCopy = formatChecklistForCopy(normalizedSections);
                navigator.clipboard.writeText(textToCopy);
                setCopyStatus('All sections copied to clipboard!');
              }} title="Copy All Sections">
                <i className="fas fa-copy"></i>
              </button>
            </div>
          );
        })()}
      </div>
      {normalizedSections.map(section => {
        const completedCount = section.items.filter(item => item.isCompleted).length;
        const totalCount = section.items.length;
        const areAllComplete = totalCount > 0 && completedCount === totalCount;
        const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
        return (
          <div key={section.id} className="checklist-section" data-section-id={section.id} onContextMenu={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); // Stop the event from bubbling up to the parent TaskAccordion
              window.electronAPI.showChecklistSectionContextMenu({ wordId, sectionId: section.id, areAllComplete, x: e.clientX, y: e.clientY }); 
            }}>
            <div className="checklist-header">
              {editingSectionId === section.id && isEditable ? (
                <input
                  type="text"
                  value={editingSectionTitle}
                  onChange={(e) => setEditingSectionTitle(e.target.value)}
                  onBlur={() => {
                    handleUpdateSectionTitle(section.id, editingSectionTitle);
                    setEditingSectionId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateSectionTitle(section.id, editingSectionTitle);
                      setEditingSectionId(null);
                    }
                  }}
                  autoFocus
                  className="checklist-section-title-input"
                />
              ) : (
                <strong
                  className={isEditable ? 'editable-title' : ''}
                  onClick={() => {
                    if (isEditable) {
                      setEditingSectionId(section.id);
                      setEditingSectionTitle(section.title);
                    }
                  }}
                >
                  {section.title} ({completedCount}/{totalCount})
                </strong> 
              )}
              {totalCount > 0 && (
                <span className="checklist-progress">
                  ({completedCount} / {totalCount} completed)
                </span>
              )}
              <div className="checklist-section-actions">
                {totalCount > 0 && (
                  <button className="checklist-action-btn" onClick={() => handleCompleteAllInSection(section.id)} title={areAllComplete ? "Reopen All Items" : "Complete All Items"}>
                    <i className={`fas ${areAllComplete ? 'fa-undo' : 'fa-check-square'}`}></i>
                  </button>
                )}
                {isEditable && completedCount > 0 && (
                  <button className="checklist-action-btn clear-completed-btn" onClick={() => handleClearCompleted(section.id)} title="Clear Completed Items">
                    <i className="fas fa-broom"></i>
                  </button>
                )}
                <button className="checklist-action-btn" onClick={() => {
                  const sectionToCopy = normalizedSections.find(s => s.id === section.id);
                  if (sectionToCopy) {
                    const textToCopy = formatChecklistForCopy([sectionToCopy]);
                    navigator.clipboard.writeText(textToCopy);
                    setCopyStatus('Section copied to clipboard!');
                  }
                }} title="Copy Section"><i className="fas fa-copy"></i></button>
                <button className="checklist-action-btn" onClick={() => onUpdate(moveSection(normalizedSections, section.id, 'up'))} title="Move Section Up"><i className="fas fa-arrow-up"></i></button>
                <button className="checklist-action-btn" onClick={() => onUpdate(moveSection(normalizedSections, section.id, 'down'))} title="Move Section Down"><i className="fas fa-arrow-down"></i></button>
                {isEditable && (
                  <>
                    <button className="checklist-delete-btn" onClick={() => {
                      if (window.confirm('Are you sure you want to delete this entire section and all its items?')) onUpdate(normalizedSections.filter(sec => sec.id !== section.id));
                    }} title="Delete Section">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="checklist-progress-bar-container">
              <div 
                className={`checklist-progress-bar-fill ${areAllComplete ? 'complete' : ''}`} 
                style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <div className="checklist-items">
              {section.items.map(item => (
                <div key={item.id} className={`checklist-item ${item.isCompleted ? 'completed' : ''}`}>
                  {editingItemId === item.id && isEditable ? (
                    <input
                      type="text"
                      value={editingItemText}
                      onChange={(e) => setEditingItemText(e.target.value)}
                      onBlur={() => {
                        handleUpdateItemText(section.id, item.id, editingItemText);
                        setEditingItemId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateItemText(section.id, item.id, editingItemText);
                          setEditingItemId(null);
                        } else if (e.key === 'Escape') {
                          setEditingItemId(null);
                        }
                      }}
                      autoFocus
                      className="checklist-item-text-input"
                    />
                  ) : (
                    <label className="checklist-item-label flexed-column">
                      <div className="checklist-item-checkbox">
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={() => handleToggleItem(section.id, item.id)}
                        />
                        <span className="checklist-item-text" onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation(); // Stop the event from bubbling up to the parent task
                          window.electronAPI.showChecklistItemContextMenu({ sectionId: section.id, itemId: item.id, isCompleted: item.isCompleted, x: e.clientX, y: e.clientY });
                        }}>{item.text}</span>
                      </div>
                      {item.response && (
                        <div className="checklist-item-response"><strong><i className="fas fa-reply"></i> Response:</strong> {item.response}</div>
                      )}
                      {item.note && (
                        <div className="checklist-item-note"><strong><i className="fas fa-sticky-note"></i> Note:</strong> {item.note}</div>
                      )}
                    </label>
                  )}
                </div>
              ))}
            </div>
            {isEditable && (
              <div className="checklist-add-item">
                <textarea
                  value={newItemTexts[section.id] || ''}
                  onChange={(e) => setNewItemTexts(prev => ({ ...prev, [section.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    // Submit on Enter, but allow new lines with Shift+Enter
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault(); // Prevent default newline behavior
                      handleAddItem(section.id);
                    }
                  }}
                  placeholder="Add item(s)... (Shift+Enter for new line)"
                />
                <button onClick={() => handleAddItem(section.id)}>+</button>
              </div>
            )}
          </div>
        );
      })}
      {isEditable && (
        <div className="checklist-actions">
          <div className="checklist-main-actions">
            <button onClick={handleAddSection} className="add-section-btn"><i className='fas fa-plus'></i> Add Section</button>
            {normalizedSections.length > 0 && (
              <button onClick={handleDeleteAllSections} className="add-section-btn delete-btn">Delete All Sections</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const moveCategory = (categories: Category[], categoryId: number, direction: 'up' | 'down'): Category[] => {
  const newCategories = [...categories];
  const category = newCategories.find(c => c.id === categoryId);
  if (!category) return categories;

  const siblings = newCategories.filter(c => c.parentId === category.parentId);
  const currentIndex = siblings.findIndex(c => c.id === categoryId);

  if ((direction === 'up' && currentIndex === 0) || (direction === 'down' && currentIndex === siblings.length - 1)) {
    return categories; // Cannot move further
  }

  const swapWithIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  const swapWithCategory = siblings[swapWithIndex];

  // Find original indices in the main array
  const originalIndex = newCategories.findIndex(c => c.id === categoryId);
  const originalSwapWithIndex = newCategories.findIndex(c => c.id === swapWithCategory.id);

  // Swap them in the main array
  [newCategories[originalIndex], newCategories[originalSwapWithIndex]] = [newCategories[originalSwapWithIndex], newCategories[originalIndex]];

  return newCategories;
};

const headerShortcutKeys = ['1', '2', '3', '4', '5', '6'];
const headerShortcutKeyDisplay = headerShortcutKeys.map(key => `<b>Alt+${key}</b>: H${key}`).join(', ');
const otherShortcutKeys = `<span><b>Ctrl+B</b>: Bold, <i>Ctrl+I</i>: Italic, <u>Ctrl+U</u>: Underline, <b>Ctrl+K</b>: Link, <b>Ctrl+L</b>: List, <b>Ctrl+P</b>: Paragraph, <b>Ctrl+\\</b>: Clear Format</span>`;


const formatTimestampForInput = (ts: number | undefined) => {
  if (!ts) return '';
  const date = new Date(ts);
  // Adjust for timezone offset to display correctly in the user's local time
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - timezoneOffset);
  // Format to 'YYYY-MM-DDTHH:mm'
  return localDate.toISOString().slice(0, 16);
};

const parseInputTimestamp = (datetime: string) => {
  return new Date(datetime).getTime();
};
function TaskAccordion({ title, children, isOpen, onToggle, word }: AccordionProps & { isOpen: boolean, onToggle: () => void, word: Word }) {
  const [content, headerActions] = React.Children.toArray(children);

  useEffect(() => {
    // If the startOpen prop becomes true, force the accordion to open.
    // This effect is no longer needed as the parent controls the open state.
  }, []);

  return (
    <div className="accordion">
      <div className="accordion-header-container">
        <div
          className="accordion-header"
          onClick={onToggle}
          onContextMenu={(e: React.MouseEvent) => {
            e.preventDefault();
            window.electronAPI.showTaskContextMenu({ wordId: word.id, x: e.clientX, y: e.clientY });
          }}
        >
          <span className="accordion-icon"><i className={`fas ${isOpen ? 'fa-minus' : 'fa-plus'}`}></i></span>
          <h4 className="accordion-title">{title}</h4>          
        </div>
        {headerActions}
      </div>
      {isOpen && <div className="accordion-content">{content}</div>}
    </div>
  );
}

function TimeLeft({ word, onUpdate, onNotify, settings }: { 
  word: Word, 
  onUpdate: (updatedWord: Word) => void, 
  onNotify: (word: Word) => void, 
  settings: Settings
}) {
  const [timeLeft, setTimeLeft] = useState('');
  const [className, setClassName] = useState('');

  useEffect(() => {
    // If the task is completed, calculate its final state and stop the timer.
    if (word.completedDuration) {
      if (word.completeBy) {
        const completionTime = word.createdAt + word.completedDuration;
        const ms = word.completeBy - completionTime;
        if (ms < 0) {
          setClassName('priority-high');
          setTimeLeft(`Overdue by ${formatTime(Math.abs(ms))}`);
        } else {
          setTimeLeft(`Time left: ${formatTime(ms)}`);
        }
      }
      return; // Exit the effect, no interval needed.
    }

    if (!word.completeBy) {
      setTimeLeft('N/A');
      return;
    }

    const update = () => {
      const ms = word.completeBy - Date.now();

      if (ms < 0) {
        setClassName('priority-high');
        setTimeLeft(`Overdue by ${formatTime(Math.abs(ms))}`);
      } else {
        setTimeLeft(formatTime(ms));
        if (ms < (settings.warningTime * 60000)) {
          setClassName('priority-medium');
        } else {
          setClassName('');
        }
      }
    };

    update(); // Run once immediately to set the initial state
    const interval = setInterval(update, 1000); // Update every second
    return () => clearInterval(interval);
  }, [word, settings.warningTime]);

  return <span className={className}>{timeLeft}</span>;
}

function TimeOpen({ startDate }: { startDate: number }) {
  const [timeOpen, setTimeOpen] = useState('');
  const [className, setClassName] = useState('');

  useEffect(() => {
    const update = () => {
      const ms = Date.now() - startDate;
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

      if (ms > sevenDaysInMs) {
        setClassName('priority-high'); // This class makes the text red
      } else {
        setClassName('');
      }

      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      setTimeOpen(`${days}d ${hours}h ${minutes}m`);
    };

    update();
    const interval = setInterval(update, 60000); // Update every minute is sufficient
    return () => clearInterval(interval);
  }, [startDate]);

  return <span className={className}>{timeOpen}</span>;
}

const formatTime = (ms: number) => {
  if (typeof ms !== 'number') return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const formatTimestamp = (ts: number) => {
  if (typeof ts !== 'number') return 'N/A';
  return new Date(ts).toLocaleString();
};

const formatDate = (ts: number) => {
  if (typeof ts !== 'number') return 'N/A';
  return new Date(ts).toLocaleDateString();
};

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

function BackupManager({ onRestore, setCopyStatus, words, completedWords, settings, onSettingsChange, isPromptOpen, setIsPromptOpen }: { 
  onRestore: (data: any) => void, 
  setCopyStatus: (message: string) => void,
  words: Word[],
  completedWords: Word[],
  settings: Settings,
  onSettingsChange: (newSettings: Partial<Settings>) => void,
  isPromptOpen: boolean,
  setIsPromptOpen: (isOpen: boolean) => void
}) {
  const [backups, setBackups] = useState<{ name: string, path: string, time: number, size: number }[]>([]);
  const [backupSearchQuery, setBackupSearchQuery] = useState('');
  const [activeBackupTab, setActiveBackupTab] = useState<'automatic' | 'manual'>('automatic');
  const [selectedBackup, setSelectedBackup] = useState<{ name: string, path: string } | null>(null);
  const [backupPreview, setBackupPreview] = useState<any>(null);

  const fetchBackups = async () => {
    const backupFiles = await window.electronAPI.getBackups();
    setBackups(backupFiles);
  };

  const handleRestoreClick = () => {
    fetchBackups();
    setActiveBackupTab('automatic'); // Default to automatic tab on open
    setSelectedBackup(null); // Clear any previous selection    
    setBackupSearchQuery(''); // Clear search on open
  };

  const handleManualBackupConfirm = async (backupName: string) => {
    const result = await window.electronAPI.createManualBackup(backupName);
    setIsPromptOpen(false); // Close the prompt modal
    if (result.success) {
      setCopyStatus(`Manual backup "${backupName}" created!`);
      setTimeout(() => setCopyStatus(''), 2000);
      fetchBackups(); // Refresh the backup list if the modal is open
    } else {
      setCopyStatus('Failed to create manual backup.');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  const handleSelectBackupForRestore = async (backup: { name: string, path: string }) => {
    setSelectedBackup(backup);
    const jsonString = await window.electronAPI.restoreBackup(backup.path);
    if (jsonString) {
      try {
        const data = JSON.parse(jsonString);
        setBackupPreview(data);
      } catch (e) {
        console.error("Failed to parse backup preview", e);
        setBackupPreview({ error: "Could not read backup file." });
      }
    }
  };

  const handleRestoreConfirm = () => {
    if (backupPreview && !backupPreview.error) {
      onRestore(backupPreview);
    }
  };

  const handleMergeConfirm = () => {
    if (backupPreview && !backupPreview.error) {
      const backupWords = backupPreview.words || [];
      const backupCompletedWords = backupPreview.completedWords || [];

      // Combine and de-duplicate based on task ID
      const mergedWords = [...words, ...backupWords];
      const uniqueWords = Array.from(new Map(mergedWords.map(item => [item.id, item])).values());

      const mergedCompletedWords = [...completedWords, ...backupCompletedWords];
      const uniqueCompletedWords = Array.from(new Map(mergedCompletedWords.map(item => [item.id, item])).values());

      onRestore({ words: uniqueWords, completedWords: uniqueCompletedWords, settings: settings }); // Keep current settings
    }
  };

  const handleDeleteBackup = async (backup: { name: string, path: string }) => {
    if (window.confirm(`Are you sure you want to permanently delete the backup "${backup.name}"?`)) {
      const result = await window.electronAPI.deleteBackup(backup.path);
      if (result.success) {
        setCopyStatus('Backup deleted.');
        fetchBackups(); // Refresh the list
      } else {
        alert(`Failed to delete backup: ${result.error || 'Unknown error'}`);
      }
    }
  };

  const getFilteredBackups = (type: 'automatic' | 'manual') => {
    return backups.filter(backup => {
      const isManual = backup.name.startsWith('manual-');
      if ((type === 'manual' && !isManual) || (type === 'automatic' && isManual)) {
        return false;
      }

      const searchQuery = backupSearchQuery.toLowerCase();
      if (isManual) {
        const parts = backup.name.replace('.json', '').split('-');
        const manualName = parts.slice(3).join(' ').toLowerCase();
        return manualName.includes(searchQuery);
      } else {
        return new Date(backup.time).toLocaleString().toLowerCase().includes(searchQuery);
      }
    });
  };
  const displayedBackups = getFilteredBackups(activeBackupTab);

  return (
    <SimpleAccordion title="Backups & Recovery">
      <PromptModal
        isOpen={isPromptOpen}
        title="Create Manual Backup"
        placeholder="Enter a name for this backup..."
        onClose={() => setIsPromptOpen(false)}
        onConfirm={handleManualBackupConfirm}
      />            
      <div className="button-group" style={{ margin: '10px 0' }}>
        <button style={{ fontSize: '10px' }} onClick={() => setIsPromptOpen(true)}>Create Manual Backup</button>
        <button style={{ fontSize: '10px' }} onClick={handleRestoreClick}>Restore from Backup</button>                
      </div>      
      <label className="backup-setting-label">
        Automatic Backups to Keep:        
        <div className="button-group" style={{ margin: '10px 0 0' }}>
          <input type="number" min="1" value={settings.autoBackupLimit} onChange={(e) => onSettingsChange({ autoBackupLimit: Number(e.target.value) })} /><button className="icon-button" style={{ fontSize: '10px', margin: '0 0 10px' }} onClick={() => window.electronAPI.openBackupsFolder()} title="Open backups folder in your file explorer"><i className="fas fa-folder-open"></i></button>
        </div>
        <p style={{ fontSize: '12px', margin: '0' }}>Automatic backups are taken every session start.</p>
      </label>

      {false && (
        <div className="modal-overlay" onClick={() => setIsPromptOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h4>Select a backup to restore</h4>
            <div className="tab-headers">
              <button onClick={() => setActiveBackupTab('automatic')} className={activeBackupTab === 'automatic' ? 'active' : ''}>Automatic</button>
              <button onClick={() => setActiveBackupTab('manual')} className={activeBackupTab === 'manual' ? 'active' : ''}>Manual</button>
            </div>
            <input
              type="text"
              placeholder="Search backups..."
              value={backupSearchQuery}
              onChange={(e) => setBackupSearchQuery(e.target.value)}
              style={{ margin: '10px 0' }}
            />
            <ul className="backup-list">
              {displayedBackups.length > 0 ? displayedBackups.map(backup => (
                <li key={backup.path} className={backup.name.startsWith('manual-') ? 'manual-backup' : ''}>
                  <div className="backup-info" onClick={() => handleSelectBackupForRestore(backup)} title={`Restore ${backup.name}`}>
                    <span className="backup-date">
                      {(() => {
                        if (backup.name.startsWith('manual-')) {
                          // Extracts the user-given name from 'manual-YYYY-MM-DD-the-name.json'
                          const parts = backup.name.replace('.json', '').split('-');
                          return parts.slice(3).join(' ');
                        }
                        // For automatic backups, show the full date/time
                        return new Date(backup.time).toLocaleString();
                      })()}
                    </span>
                    <span className="backup-size">{formatBytes(backup.size)}</span>
                  </div>
                  <button className="icon-button delete-backup-btn" title="Delete this backup" onClick={(e) => { e.stopPropagation(); handleDeleteBackup(backup); }}><i className="fas fa-trash"></i>
                  </button>
                  <button className="icon-button export-backup-btn" title="Export this backup" onClick={(e) => { e.stopPropagation(); window.electronAPI.exportBackup({ backupPath: backup.path, backupName: backup.name }); }}><i className="fas fa-file-export"></i>
                  </button>
                </li>
              )) : (
                <li className="no-backups-message">No {activeBackupTab} backups found.</li>
              )}
            </ul>
            <button onClick={() => setIsPromptOpen(false)}>Cancel</button>
          </div>
          {selectedBackup && backupPreview && (
            <div className="modal-overlay" onClick={() => setSelectedBackup(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h4>Restore Confirmation</h4>
                <p>Are you sure you want to restore this backup? This will overwrite your current session.</p>
                <div className="backup-preview">
                  <strong>Backup Details:</strong>
                  <p>Name: {selectedBackup.name}</p>
                  <p>Open Tasks: {backupPreview.words?.length || 0}</p>
                  <p>Completed Tasks: {backupPreview.completedWords?.length || 0}</p>
                </div>
                <div className="modal-actions">
                  <button onClick={handleMergeConfirm}>Merge with Session</button>
                  <button onClick={handleRestoreConfirm} className="confirm-btn">Restore</button>
                  <button onClick={() => setSelectedBackup(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </SimpleAccordion>
  );
}

function Stopwatch({ word, onTogglePause }: { word: Word, onTogglePause: (id: number) => void }) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const calculateElapsedTime = () => {
      if (word.isPaused) {
        return word.pausedDuration || 0;
      }
      const now = Date.now();
      const elapsed = (word.pausedDuration || 0) + (now - word.createdAt);
      return elapsed;
    };

    setElapsedTime(calculateElapsedTime());

    if (word.isPaused) {
      return; // Don't start the interval if paused
    }

    const interval = setInterval(() => {
      setElapsedTime(calculateElapsedTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [word.isPaused, word.createdAt, word.pausedDuration]);

  return (
    <div className="stopwatch-container">
      <span className="stopwatch">{formatTime(elapsedTime)}</span>
      <button onClick={() => onTogglePause(word.id)} className="pause-btn">
        {word.isPaused ? '▶' : '❚❚'}
      </button>
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="live-clock">{time.toLocaleString()}</div>
  );
}

function ManualStopwatch({ word, onUpdate }: { word: Word, onUpdate: (updatedWord: Word) => void }) {
  const [displayTime, setDisplayTime] = useState(word.manualTime || 0);

  useEffect(() => {
    if (!word.manualTimeRunning) {
      setDisplayTime(word.manualTime || 0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - (word.manualTimeStart || 0);
      setDisplayTime((word.manualTime || 0) + elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [word.manualTimeRunning, word.manualTime, word.manualTimeStart]);

  const handleToggle = () => {
    if (word.manualTimeRunning) {
      // Stopping
      const elapsed = Date.now() - (word.manualTimeStart || 0);
      onUpdate({ ...word, manualTime: (word.manualTime || 0) + elapsed, manualTimeRunning: false });
    } else {
      // Starting
      onUpdate({ ...word, manualTimeStart: Date.now(), manualTimeRunning: true });
    }
  };

  const handleReset = () => {
    onUpdate({ ...word, manualTime: 0, manualTimeRunning: false, manualTimeStart: 0 });
  };

  return (
    <div className="manual-stopwatch">
      <span className="time-display">{formatTime(displayTime)}</span><button className="icon-button" onClick={handleToggle} title={word.manualTimeRunning ? 'Stop Timer' : 'Start Timer'}><i className={`fas ${word.manualTimeRunning ? 'fa-stop' : 'fa-play'}`}></i></button>
      <button className="icon-button" onClick={handleReset} title="Reset Timer"><i className="fas fa-undo"></i></button>
    </div>
  );
}

const defaultSettings: Settings = {
  fontFamily: "Arial",
  fontColor: "#FFFFFF",
  shadowColor: "#000000",
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  isOverlayEnabled: false,
  overlayColor: "#000000",
  overlayOpacity: 0.3,
  isDebugModeEnabled: false,
  minFontSize: 20,
  maxFontSize: 80,
  browsers: [
    { name: 'Default', path: '' },
    { name: 'Chrome', path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' },
  ],
  activeBrowserIndex: 0,
  categories: [
    { id: 1, name: 'Work' },
    { id: 2, name: 'Projects' },
    { id: 3, name: 'Development' },
  ],
  externalLinks: [
    { name: 'Ticket Site', url: 'https://americancreative.freshdesk.com/a/tickets/filters/search?label=Unresolved%20tickets&q[]=status%3Fis_in%3A%5B0%5D&q[]=agent%3Fis_in%3A%5B0%5D&ref=unresolved' },
    { name: 'GitHub', url: 'https://github.com/moondogdev/overwhelmed' },
  ],
  currentView: 'meme',
  activeCategoryId: 'all',
  activeSubCategoryId: 'all',
  warningTime: 60, // Default to 60 minutes
  isSidebarVisible: true,
  openAccordionIds: [], // Default to no accordions open
  activeTaskTabs: {}, // Default to no specific tabs active
  timerNotificationLevel: 'medium', // Default to medium alerts
  snoozeTime: 'medium', // Default to 5 minutes
  prioritySortConfig: {}, // Now an object to store sort configs per category
  inboxSort: 'date-desc', // Default inbox sort  
  openInboxGroupTypes: [], // Default to no groups open
  taskTypes: [ // Default task types
    { id: 'default', name: 'Default', fields: ['text', 'url', 'priority', 'categoryId', 'openDate', 'completeBy', 'company', 'websiteUrl', 'imageLinks', 'payRate', 'isRecurring', 'isDailyRecurring', 'isWeeklyRecurring', 'isMonthlyRecurring', 'isYearlyRecurring', 'isAutocomplete', 'description', 'attachments', 'checklist', 'notes'] },
    { id: 'billing', name: 'Billing', fields: ['text', 'payRate', 'manualTime', 'company', 'openDate', 'completeBy'] },
    { id: 'research', name: 'Research', fields: ['text', 'url', 'notes', 'description', 'attachments'] },
  ],
};

const getRelativeDateHeader = (dateStr: string): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to the start of the day

  // The date string from the grouping logic is 'YYYY-MM-DD'.
  // We need to parse it carefully to avoid timezone issues.
  const [year, month, day] = dateStr.split('-').map(Number);
  const taskDate = new Date(year, month - 1, day);

  const diffTime = taskDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';

  // For other dates, return the full formatted date
  // return taskDate.toLocaleDateString(undefined, {
  // For other dates, format the date. Include the year only if it's not the current year.
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric', // Always display the year
  };
  if (taskDate.getFullYear() !== today.getFullYear()) {
    // options.year = 'numeric';
    // Option to only show year on previous years
  }

  return taskDate.toLocaleDateString(undefined, options);
}

const getContrastColor = (hexColor: string) => {
  if (!hexColor) return '#FFFFFF'; // Default to white if no color
  // Remove the hash at the start if it's there
  const hex = hexColor.replace('#', '');

  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance (per W3C standards)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

const formatChecklistForCopy = (sections: ChecklistSection[]): string => {
  let output = '';
  for (const section of sections) {
    const completedCount = section.items.filter(item => item.isCompleted).length;
    const totalCount = section.items.length;
    output += `${section.title} (${completedCount}/${totalCount}):\n`;
    for (const item of section.items) {
      const status = item.isCompleted ? '[✔]' : '[✗]';
      output += `  ${status} ${item.text}\n`;

      if (item.response) {
        output += `      Response: ${item.response}\n`;
      }
      // The 'note' field is intentionally excluded per Rule 51.0
    }
    output += '\n'; // Add a blank line between sections
  }
  return output.trim();
};


function Dropdown({ trigger, children }: { trigger: React.ReactNode, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="dropdown-container" 
      onMouseEnter={() => setIsOpen(true)} 
      onMouseLeave={() => setIsOpen(false)}>
      {trigger}
      {isOpen && <div className="dropdown-menu">{children}</div>}
    </div>
  );
}

function TaskAccordionHeader({
  word, 
  settings, 
  onCategoryClick,
  onUpdate,
  onNotify
}: { 
  word: Word, settings: Settings, onCategoryClick: (e: React.MouseEvent, catId: number, parentId?: number) => void, onUpdate?: (updatedWord: Word) => void, onNotify?: (word: Word) => void
}) {
  return (
    <>
      <div className="accordion-title-container">
        <span className="accordion-main-title">{word.text}</span>
        {/* Category Pills - MOVED HERE */}
        {(() => {
          if (!word.categoryId) return null;
          const category = settings.categories.find(c => c.id === word.categoryId);
          if (!category) return null;

          const parentCategory = category.parentId ? settings.categories.find(c => c.id === category.parentId) : null;

          return (
            <>
              {parentCategory && (
                <span 
                  className="category-pill parent-category-pill" 
                  onClick={(e) => onCategoryClick(e, parentCategory.id, undefined)}
                  style={{ 
                    backgroundColor: parentCategory.color || '#555',
                    color: getContrastColor(parentCategory.color) 
                  }}
                >
                  {parentCategory.name}
                </span>
              )}
              <span 
                className="category-pill child-category-pill" 
                onClick={(e) => onCategoryClick(e, category.id, parentCategory?.id)}
                style={{ 
                  backgroundColor: category.color || '#555',
                  color: getContrastColor(category.color) 
                }}
              >
                {category.name}
              </span>
            </>
          );
        })()}
        {/* Priority Indicator - MOVED HERE */}
        <span className={`priority-indicator priority-${(word.priority || 'Medium').toLowerCase()}`}>
          <span className="priority-dot"></span>
          {word.priority || 'Medium'}
        </span>
      </div>
      <div className="accordion-subtitle">
        {/* Time Open */}
        <span className="timer-pill">
          <i className="fas fa-clock"></i>
          <TimeOpen startDate={word.createdAt} />
        </span>

        {/* Due Date */}
        {word.completeBy && (
          <>
            <span className="due-date-pill">
              <i className="fas fa-calendar-alt"></i>
              Due: {new Date(word.completeBy).toLocaleDateString()}
            </span>
            <span className="timer-pill">
              <i className="fas fa-hourglass-half"></i>
              <TimeLeft word={word} onUpdate={onUpdate || (() => {})} onNotify={onNotify || (() => {})} settings={settings} />
            </span>
          </>
        )}
      </div>
    </>
  );
}

function App() {
  // Create a ref to hold the canvas DOM element
  const [fullTaskViewId, setFullTaskViewId] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // A ref to hold the latest word data for the click handler
  const wordsRef = useRef<Word[]>([]);

  // State for the input field
  const [inputValue, setInputValue] = useState("");
  // State for the list of words
  const [words, setWords] = useState<Word[]>([]);
  // State for word placement algorithm
  const [wordPlacementIndex, setWordPlacementIndex] = useState(0);
  // State for completed words
  const [completedWords, setCompletedWords] = useState<Word[]>([]);
  // Consolidated settings state
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  // State for the new inbox
  const [inboxMessages, setInboxMessages] = useState<InboxMessage[]>([]);
  const [archivedMessages, setArchivedMessages] = useState<InboxMessage[]>([]);
  const [trashedMessages, setTrashedMessages] = useState<InboxMessage[]>([]);
  // State for inline editing
  const [activeInboxTab, setActiveInboxTab] = useState<'active' | 'archived' | 'trash'>('active');
  // State for navigation history
  const [viewHistory, setViewHistory] = useState(['meme']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [editingWordId, setEditingWordId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  // State for bulk add
  const [bulkAddText, setBulkAddText] = useState("");
  // State for the manual backup prompt modal
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  // State for hover effects
  const [hoveredWordId, setHoveredWordId] = useState<number | null>(null);
  // State for copy feedback.
  const [copyStatus, setCopyStatus] = useState('');
  // Ref to track if the initial load is complete to prevent overwriting saved data
  const isInitialLoad = useRef(true);
  // State to track if the app is still loading initial data
  const [isLoading, setIsLoading] = useState(true);
  // State to track if the app is still loading initial data
  const [isDirty, setIsDirty] = useState(false);

  // State for debouncing task update notifications
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);
  const [autoSaveCountdown, setAutoSaveCountdown] = useState(300); // 5 minutes in seconds
  const AUTO_SAVE_INTERVAL_SECONDS = 300;

  const [updateTimers, setUpdateTimers] = useState<{ [key: number]: NodeJS.Timeout }>({});

  // Ref to hold the latest words state for the debounced function
  const wordsRefForDebounce = useRef(words);
  wordsRefForDebounce.current = words;
  // State for the new detailed task form
  const activeCategoryId = settings.activeCategoryId ?? 'all';
  const activeSubCategoryId = settings.activeSubCategoryId ?? 'all';

  const [editingViaContext, setEditingViaContext] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const newTaskTitleInputRef = useRef<HTMLInputElement>(null);
  const sortSelectRef = useRef<HTMLSelectElement>(null);
  const snoozeTimeSelectRef = useRef<HTMLSelectElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // State for timer notifications
  const [timerNotifications, setTimerNotifications] = useState<Word[]>([]);
  // State for persistent overdue notifications
  const [overdueNotifications, setOverdueNotifications] = useState<Set<number>>(new Set());

  // Ref to hold the functions of the currently active checklist for context menu actions
  const activeChecklistRef = useRef<{ handleUndo: () => void; handleRedo: () => void; } | null>(null);

  // Refs to hold the latest state for saving, preventing stale data in closures.
  const inboxMessagesRef = useRef(inboxMessages);
  inboxMessagesRef.current = inboxMessages;

  // Ref for archived messages
  const archivedMessagesRef = useRef(archivedMessages);
  archivedMessagesRef.current = archivedMessages;

  // Ref for trashed messages
  const trashedMessagesRef = useRef(trashedMessages);
  trashedMessagesRef.current = trashedMessages;

  // Ref to prevent duplicate 'overdue' inbox messages from being created in rapid succession.
  const overdueMessageSentRef = useRef(new Set<number>());

  // State for the checklist item response/note editing modal
  const [isChecklistPromptOpen, setIsChecklistPromptOpen] = useState(false);
  const [editingChecklistItem, setEditingChecklistItem] = useState<{ sectionId: number; itemId: number; field: 'response' | 'note'; currentText: string; } | null>(null);


  const handleToggleImportant = (messageId: number) => {
    let isNowImportant: boolean;
    setInboxMessages(prevMessages => {
      return prevMessages.map(msg => {
        if (msg.id === messageId) {
          isNowImportant = !msg.isImportant;
          return { ...msg, isImportant: isNowImportant };
        }
        return msg;
      });
    });
    setCopyStatus(isNowImportant ? "Message marked as important." : "Message unmarked as important.");
    setTimeout(() => setCopyStatus(''), 2000);
    setIsDirty(true); // Mark that we have unsaved changes
  };

  const handleArchiveInboxMessage = (messageId: number) => {
    const messageToArchive = inboxMessages.find(msg => msg.id === messageId);
    if (!messageToArchive) return;

    // Add to archived list and remove from active inbox
    setArchivedMessages(prev => [{ ...messageToArchive, isArchived: true }, ...prev]);
    setInboxMessages(prev => prev.filter(msg => msg.id !== messageId));

    setCopyStatus("Message archived.");
    setTimeout(() => setCopyStatus(''), 2000);
    setIsDirty(true);
  };

  const handleUnarchiveInboxMessage = (messageId: number) => {
    const messageToUnarchive = archivedMessages.find(msg => msg.id === messageId);
    if (!messageToUnarchive) return;

    // Add back to active inbox and remove from archived list
    setInboxMessages(prev => [{ ...messageToUnarchive, isArchived: false }, ...prev]);
    setArchivedMessages(prev => prev.filter(msg => msg.id !== messageId));

    setCopyStatus("Message un-archived.");
    setTimeout(() => setCopyStatus(''), 2000);
    setIsDirty(true);
  };

  const handleRestoreFromTrash = (messageId: number) => {
    const messageToRestore = trashedMessages.find(msg => msg.id === messageId);
    if (!messageToRestore) return;

    // Add back to active inbox and remove from trash
    setInboxMessages(prev => [messageToRestore, ...prev]);
    setTrashedMessages(prev => prev.filter(msg => msg.id !== messageId));

    setCopyStatus("Message restored from trash.");
    setTimeout(() => setCopyStatus(''), 2000);
    setIsDirty(true);
  };

  const handleDeletePermanently = (messageId: number) => {
    // Permanently remove the message from the trash
    setTrashedMessages(prev => prev.filter(msg => msg.id !== messageId));

    setCopyStatus("Message permanently deleted.");
    setTimeout(() => setCopyStatus(''), 2000);
    setIsDirty(true);
  };

  const handleEmptyTrash = () => {
    if (window.confirm(`Are you sure you want to permanently delete all ${trashedMessages.length} items in the trash? This cannot be undone.`)) {
      setTrashedMessages([]);
      setCopyStatus("Trash has been emptied.");
      setTimeout(() => setCopyStatus(''), 2000);
      setIsDirty(true);
    }
  };

  const handleDismissArchivedMessage = (messageId: number) => {
    const messageToTrash = archivedMessages.find(m => m.id === messageId);
    if (!messageToTrash) return;

    // Move the message from archive to the trash state
    setTrashedMessages(prev => [messageToTrash, ...prev]);
    setArchivedMessages(prev => prev.filter(m => m.id !== messageId));

    setCopyStatus("Message moved from archive to trash.");
    setTimeout(() => setCopyStatus(''), 2000);
    setIsDirty(true);
  };
  const handleRestoreAllFromTrash = () => {
    if (window.confirm('Are you sure you want to restore all items from the trash?')) {
      setInboxMessages(prev => [...prev, ...trashedMessages]);
      setTrashedMessages([]);
      setIsDirty(true);
      setCopyStatus('All messages restored from trash.');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };
  const handleTrashAllArchived = () => {
    if (window.confirm(`Are you sure you want to move all ${archivedMessages.length} archived messages to the trash?`)) {
      setTrashedMessages(prev => [...prev, ...archivedMessages]);
      setArchivedMessages([]);
      setIsDirty(true);
      setCopyStatus('All archived messages moved to trash.');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };
  const handleTaskOverdue = (wordId: number) => {
    // This function is now the single gatekeeper for creating overdue alerts. It uses
    // functional state updates for both state setters to prevent race conditions.
    setOverdueNotifications(prev => {
      // If a toast for this task is already on screen, do absolutely nothing.
      if (prev.has(wordId)) {
        return prev;
      }
      
      // Use the ref to check if a message has already been sent for this task.
      if (!overdueMessageSentRef.current.has(wordId)) {
        const word = words.find(w => w.id === wordId);
        setInboxMessages(currentInbox => [{ id: Date.now() + Math.random(), type: 'overdue', text: `Task is overdue: ${word?.text || 'Unknown Task'}`, timestamp: Date.now(), wordId: wordId }, ...currentInbox]);
        // Immediately mark this task as having had its message sent.
        overdueMessageSentRef.current.add(wordId);
      }

      // Then, return the new Set to show the toast on screen.
      return new Set(prev).add(wordId);
    });
  };


  const [newTask, setNewTask] = useState({
    text: '',
    url: '',
    taskType: 'default',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    categoryId: 1, // Default to first category
    openDate: new Date().getTime(),
    completeBy: undefined, // No deadline by default
    company: '',
    websiteUrl: '',
    imageLinks: [],
    manualTime: 0,
    manualTimeRunning: false,
    manualTimeStart: 0,
    payRate: 0,
    isRecurring: false,
    isDailyRecurring: false,
    isWeeklyRecurring: false,
    isMonthlyRecurring: false,
    isYearlyRecurring: false,
    isAutocomplete: false,
    description: '',
    attachments: [],
    checklist: [],
    lastNotified: undefined,
    snoozedAt: undefined,
    notes: '',
  });

  // Load words from localStorage on initial component mount
  useEffect(() => {
    const loadDataFromStore = async () => {
      try {
        const savedWords = await window.electronAPI.getStoreValue('overwhelmed-words');
        const savedCompletedWords = await window.electronAPI.getStoreValue('overwhelmed-completed-words');
        const savedSettings = await window.electronAPI.getStoreValue('overwhelmed-settings');
        const savedInboxMessages = await window.electronAPI.getStoreValue('overwhelmed-inbox-messages');
        const savedArchivedMessages = await window.electronAPI.getStoreValue('overwhelmed-archived-messages');
        const savedTrashedMessages = await window.electronAPI.getStoreValue('overwhelmed-trashed-messages');

        if (savedWords) {
            // Ensure lastNotified is initialized if it's missing from saved data
            const wordsWithDefaults = savedWords.map((w: Word) => ({ ...w, lastNotified: w.lastNotified || undefined }));
            setWords(wordsWithDefaults);
        }
        if (savedCompletedWords) setCompletedWords(savedCompletedWords);
        if (savedSettings) {
          setSettings(prevSettings => ({ ...prevSettings, ...savedSettings }));
        }
        if (savedInboxMessages) { setInboxMessages(savedInboxMessages);
        }
        if (savedArchivedMessages) { setArchivedMessages(savedArchivedMessages);
        }
        if (savedTrashedMessages) { setTrashedMessages(savedTrashedMessages);
        }
        setIsLoading(false); // Mark loading as complete
        // Now that all data is loaded, signal the main process that it can create a startup backup.
        window.electronAPI.send('renderer-ready-for-startup-backup', { words: savedWords, completedWords: savedCompletedWords, settings: savedSettings, inboxMessages: savedInboxMessages, archivedMessages: savedArchivedMessages, trashedMessages: savedTrashedMessages });
      } catch (error) {
        console.error("Failed to load data from electron-store", error);
        setIsLoading(false); // Also mark as complete on error to avoid getting stuck
      }
    };
    loadDataFromStore();
    // isInitialLoad will be managed by the isLoading state now
  }, []); // Empty dependency array means this runs only once

  // Effect to handle mouse back/forward navigation
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 3) goBack(); // Back button
      if (e.button === 4) goForward(); // Forward button
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [viewHistory, historyIndex]); // Re-bind when history changes

  // Effect to handle keyboard back/forward navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent hotkey from firing if an input field is focused
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || (activeElement as HTMLElement).isContentEditable)) {
        return;
      }

      if (e.altKey && e.key === 'ArrowLeft') {
        goBack();
      } else if (e.altKey && e.key === 'ArrowRight') {
        goForward();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewHistory, historyIndex]); // Re-bind when history changes

  const handleDuplicateTask = (taskToCopy: Word) => {
    // Create a new task with a new ID and open date, but keep the content
    const newTask: Word = {
      ...taskToCopy,
      id: Date.now() + Math.random(),
      openDate: Date.now(),
      createdAt: Date.now(),
      completedDuration: undefined,
    };
    setWords(prevWords => [newTask, ...prevWords]);
    setInboxMessages(prev => [{
      id: Date.now() + Math.random(),
      type: 'created',
      text: `Task duplicated: "${newTask.text}"`,
      timestamp: Date.now(),
      wordId: newTask.id,
    }, ...prev]);
    setCopyStatus('Task duplicated!');
    setTimeout(() => setCopyStatus(''), 2000);
  };

  const removeWord = (idToRemove: number) => {    
    // Remove from either list, whichever one it's in.
    const wasInActive = words.some(w => w.id === idToRemove);
    const wordToRemove = words.find(w => w.id === idToRemove) || completedWords.find(w => w.id === idToRemove);
    if (wasInActive) {
      setWords(prev => prev.filter(word => word.id !== idToRemove));
    } else {
      setCompletedWords(prev => prev.filter(word => word.id !== idToRemove));
    }
    setCopyStatus('Task removed.');
    if (wordToRemove) {
      setInboxMessages(prev => [{
        id: Date.now() + Math.random(),
        type: 'deleted',
        text: `Task deleted: "${wordToRemove.text}"`,
        timestamp: Date.now(),
      }, ...prev]);
    }
    setTimeout(() => setCopyStatus(''), 2000);
  }; 

  const setActiveCategoryId = (id: number | 'all') => {
    setSettings(prev => ({ ...prev, activeCategoryId: id }));
  };

  const setActiveSubCategoryId = (id: number | 'all') => {
    setSettings(prev => ({ ...prev, activeSubCategoryId: id }));
  };

  // Effect to notify the main process whenever the dirty state changes
  useEffect(() => {
    window.electronAPI.notifyDirtyState(isDirty);
  }, [isDirty]);

  // Save words to localStorage whenever the words array changes
  useEffect(() => {
    if (!isLoading) setIsDirty(true);
  }, [words]);

  // Save completed words to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) setIsDirty(true);
  }, [completedWords]);

  // Save inbox messages whenever they change
  useEffect(() => {
    if (!isLoading) setIsDirty(true);
  }, [inboxMessages]);

  // Save archived messages whenever they change
  useEffect(() => {
    if (!isLoading) setIsDirty(true);
  }, [archivedMessages]);

  // Save trashed messages whenever they change
  useEffect(() => {
    if (!isLoading) setIsDirty(true);
  }, [trashedMessages]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) setIsDirty(true);
  }, [settings]);

  // Effect for auto-save countdown and trigger
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setAutoSaveCountdown(prevCountdown => {
        if (prevCountdown <= 1) {
          // Countdown reached zero, trigger auto-save if dirty
          if (isDirty) {
            window.electronAPI.send('auto-save-data', { words, completedWords, settings, inboxMessages, archivedMessages, trashedMessages });
            setIsDirty(false);
            setLastSaveTime(Date.now());
          }
          // Reset the countdown regardless of whether a save happened
          return AUTO_SAVE_INTERVAL_SECONDS;
        }
        // Otherwise, just decrement
        return prevCountdown - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [isDirty, words, completedWords, settings, inboxMessages, archivedMessages, trashedMessages]); // Re-bind if state changes

  // Centralized effect for all time-based notifications (overdue & approaching)
  useEffect(() => {
    // Do not run any timer logic until the initial data load is complete.
    if (isLoading) return;

    const notificationInterval = setInterval(() => {
      const now = Date.now();
      const newlyOverdueIds = new Set<number>();
      const approachingWords: Word[] = [];

      // First, collect all events for this tick
      for (const word of words) {
        if (!word.completeBy) continue;

        const ms = word.completeBy - now;
        if (ms < 0) { // Task is overdue
          const snoozedUntil = word.lastNotified || 0;
          if (now > snoozedUntil) {
            newlyOverdueIds.add(word.id);
          }
        } else { // Task is not yet due, check for approaching deadline
          if (settings.timerNotificationLevel === 'silent') continue;

          const minutesLeft = Math.floor(ms / 60000);
          const lastNotifiedMinutes = word.lastNotified ? Math.floor((word.completeBy - word.lastNotified) / 60000) : Infinity;

          let shouldNotify = false;
          if (settings.timerNotificationLevel === 'high' && minutesLeft > 0 && (minutesLeft % 60 === 0 || (minutesLeft <= 60 && minutesLeft % 15 === 0)) && lastNotifiedMinutes > minutesLeft) {
            shouldNotify = true;
          } else if (settings.timerNotificationLevel === 'medium' && minutesLeft > 0 && minutesLeft <= 60 && minutesLeft % 15 === 0 && lastNotifiedMinutes > minutesLeft) {
            shouldNotify = true;
          } else if (settings.timerNotificationLevel === 'low' && minutesLeft > 0 && minutesLeft <= 15 && lastNotifiedMinutes > 15) {
            shouldNotify = true;
          }

          if (shouldNotify) {
            approachingWords.push(word);
          }
        }
      }

      // Now, process the collected events in single state updates
      if (newlyOverdueIds.size > 0) {
        newlyOverdueIds.forEach(id => handleTaskOverdue(id));
      }
      if (approachingWords.length > 0) {
        approachingWords.forEach(word => handleTimerNotify(word));
        setWords(prev => prev.map(w => approachingWords.find(aw => aw.id === w.id) ? { ...w, lastNotified: now } : w));
      }
    }, 1000); // Check every second
    return () => clearInterval(notificationInterval);
  }, [isLoading, words, settings.timerNotificationLevel, settings.snoozeTime, handleTaskOverdue]); // Rerun if words or settings change

  // Effect to handle different shutdown signals from the main process
  useEffect(() => {
    // NEW APPROACH: Listen for a request from the main process for our data.
    const handleGetDataForQuit = () => {
      // Before sending data, ensure all words have valid positions.
      // --- FIX: Create an off-screen canvas if the main one isn't available ---
      let tempCanvas: HTMLCanvasElement;
      if (canvasRef.current) {
        tempCanvas = canvasRef.current;
      } else {
        tempCanvas = document.createElement('canvas');
        tempCanvas.width = 640; // Use the same dimensions as the real canvas
        tempCanvas.height = 640;
      }
      const context = tempCanvas.getContext('2d');

      let wordsToSave = [...words];

      if (context) { // We only need the context to proceed
        wordsToSave = words.map((word, index) => {
          if (word.x === 0 && word.y === 0) {
            // This word needs a position.
            const fontSize = getFontSize(index, words.length);
            context.font = `${fontSize}px ${settings.fontFamily}`;
            const metrics = context.measureText(word.text);
            const newWordMetrics = { width: metrics.width, height: fontSize };
            const { x, y } = getNewWordPosition(tempCanvas.width, tempCanvas.height, newWordMetrics);
            return { ...word, x, y, width: newWordMetrics.width, height: newWordMetrics.height };
          }
          return word;
        });
      }

      window.electronAPI.send('data-for-quit', { words: wordsToSave, completedWords, settings, inboxMessages, archivedMessages, trashedMessages });
    };

    const cleanup = window.electronAPI.on('get-data-for-quit', handleGetDataForQuit);
    // Cleanup the listener when the component unmounts
    return cleanup;
  }, [words, completedWords, settings, inboxMessages, archivedMessages, trashedMessages ]); // Re-bind if state changes to send the latest version

  // Effect to handle commands from the ticket context menu
  useEffect(() => {
    // This is the definitive handler for all context menu commands.
    const handleMenuCommand = (payload: { command: string, wordId: number }) => {
      const { command, wordId } = payload;

      // Find the target word in EITHER the active or completed list.
      const targetWord = [...words, ...completedWords].find(w => w.id === wordId);

      if (!targetWord) return;

      switch (command) {
        case 'edit':
          // Guard: Only edit active (non-completed) tasks.
          if (!targetWord.completedDuration) {
             setEditingViaContext(wordId);
          }
          break;
        case 'complete':
          // Guard: Only complete active tasks.
          if (!targetWord.completedDuration) {
            handleCompleteWord(targetWord);
          }
          break;
        case 'duplicate':
          handleDuplicateTask(targetWord);
          break;
        case 'trash':
          // This works for both active and completed tasks.
          removeWord(wordId);
          break;
      }
    };
    const cleanup = window.electronAPI.on('context-menu-command', handleMenuCommand);
    return cleanup;
  }, [words, completedWords]); // Dependency on words ensures the handler has the latest list

  // Effect to handle commands from the toast context menu
  useEffect(() => {
    const handleMenuCommand = (payload: { command: string, wordId?: number }) => {
      const { command, wordId } = payload;
      const targetWord = words.find(w => w.id === wordId);
      if (!targetWord) return;

      switch (command) {
        case 'view':
          handleInboxItemClick({ id: 0, type: 'overdue', text: '', timestamp: 0, wordId }); // Re-use the existing "go to task" logic
          break;
        case 'edit':
          setEditingViaContext(wordId);
          break;
        case 'snooze':
          handleSnooze(targetWord);
          break;
        case 'complete':
          handleCompleteWord(targetWord);
          break;
        case 'view-inbox':
          navigateToView('inbox');
          break;
        case 'edit-settings':
          // This logic is the same as the settings cog button
          const timeManagementAccordionId = -2;
          setSettings(prev => ({ ...prev, openAccordionIds: [...new Set([...prev.openAccordionIds, timeManagementAccordionId])] }));
          setTimeout(() => {
            snoozeTimeSelectRef.current?.focus();
            snoozeTimeSelectRef.current?.classList.add('highlight-setting');
            setTimeout(() => snoozeTimeSelectRef.current?.classList.remove('highlight-setting'), 2000);
          }, 100);
          break;
      }
    };
    const cleanup = window.electronAPI.on('toast-context-menu-command', handleMenuCommand);
    return cleanup;
  }, [words]); // Dependency on words ensures the handler has the latest list

  // Effect to handle commands from the inbox context menu
  useEffect(() => {
    const handleMenuCommand = (payload: { command: string, wordId?: number, messageId?: number }) => {
      const { command, wordId, messageId } = payload;
      const targetWord = words.find(w => w.id === wordId);

      switch (command) {
        case 'view':
          if (wordId) handleInboxItemClick({ id: 0, type: 'overdue', text: '', timestamp: 0, wordId });
          break;
        case 'snooze':
          if (targetWord) handleSnooze(targetWord);
          break;
        case 'complete':
          if (targetWord) handleCompleteWord(targetWord);
          break;
        case 'dismiss':
          if (messageId) setInboxMessages(prev => prev.filter(m => m.id !== messageId));
          break;
      }
    };
    const cleanup = window.electronAPI.on('inbox-context-menu-command', handleMenuCommand);
    return cleanup;
  }, [words]); // Dependency on words ensures the handler has the latest list

  // Effect to handle commands from the navigation context menu
  useEffect(() => {
    const handleMenuCommand = (payload: { command: string }) => {
      const { command } = payload;
      switch (command) {
        case 'back':
          goBack();
          break;
        case 'forward':
          goForward();
          break;
      }
    };
    const cleanup = window.electronAPI.on('nav-context-menu-command', handleMenuCommand);
    return cleanup;
  }, [viewHistory, historyIndex]); // Re-bind when history changes

  // Effect to handle commands from the save button context menu
  useEffect(() => {
    const handleMenuCommand = (payload: { command: string }) => {
      const { command } = payload;
      switch (command) {
        case 'save':
          handleSaveProject();
          break;
        case 'backup':
          setIsPromptOpen(true); // This now correctly calls the state setter in App
          break;
      }
    };
    const cleanup = window.electronAPI.on('save-context-menu-command', handleMenuCommand); // eslint-disable-line
    return cleanup;
  }, [words, completedWords, settings, inboxMessages]); // Re-bind if state changes to save the latest version

  const handleWordUpdate = (updatedWord: Word) => {
    // Clear any existing timer for this word to debounce
    if (updateTimers[updatedWord.id]) {
      clearTimeout(updateTimers[updatedWord.id]);
    }

    // Set a new timer
    const newTimer = setTimeout(() => {
      // Check if the word still exists before adding to inbox
      if (wordsRefForDebounce.current.some(w => w.id === updatedWord.id)) { 
        setInboxMessages(prev => [{
          id: Date.now() + Math.random(),
          type: 'updated',
          text: `Task updated: "${updatedWord.text}"`,
          timestamp: Date.now(),
          wordId: updatedWord.id,
        }, ...prev]);
      }
      // Clean up the timer from state
      setUpdateTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[updatedWord.id];
        return newTimers;
      });
    }, 5000); // 5-second debounce window

    setUpdateTimers(prev => ({ ...prev, [updatedWord.id]: newTimer }));
    setWords(words.map(w => w.id === updatedWord.id ? updatedWord : w));
  };

  // Effect to handle commands from the new checklist item context menu
  useEffect(() => {
    let editingPayload: { sectionId: number, itemId: number } | null = null;
    const handleMenuCommand = (payload: { command: string, sectionId: number, itemId: number }) => {
      const { command, sectionId, itemId } = payload;

      // Find the word that contains this checklist
      const wordContainingChecklist = words.find(w => w.checklist?.some(sec => 'items' in sec && sec.items.some(item => item.id === itemId)));
      if (!wordContainingChecklist || !wordContainingChecklist.checklist) return;

      if (command === 'edit') {
        // The actual state change will be handled inside the Checklist component itself
        // We just need to trigger a re-render of the parent to pass down the editing state.
        // A simple way is to find the word and re-set it.
        handleWordUpdate({ ...wordContainingChecklist }); // This triggers the update flow
        return; // Stop here for edit command
      }
      let newSections = (wordContainingChecklist.checklist as ChecklistSection[]).map(sec => {
        if (sec.id !== sectionId) return sec;

        const itemIndex = sec.items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return sec;

        let newItems = [...sec.items];
        const newItemTemplate = { id: Date.now() + Math.random(), text: 'New Item', isCompleted: false };

        switch (command) {
          case 'toggle_complete':
            let toggledItem: ChecklistItem | null = null;
            newItems = newItems.map(item => {
              if (item.id !== itemId) return item;
              const isNowCompleted = !item.isCompleted;
              if (isNowCompleted) {
                toggledItem = item;
              }
              return { ...item, isCompleted: isNowCompleted };
            });
            // Now that newItems is created, we can call the handler
            if (toggledItem) {
              handleChecklistCompletion(toggledItem, sectionId, [{...sec, items: newItems}]);
            }
            break;
          case 'delete':
            newItems.splice(itemIndex, 1);
            break;
          case 'copy':
            navigator.clipboard.writeText(newItems[itemIndex].text);
            setCopyStatus('Checklist item copied!');
            setTimeout(() => setCopyStatus(''), 2000);
            break;
          case 'add_before':
            newItems.splice(itemIndex, 0, newItemTemplate);
            break;
          case 'add_after':
            newItems.splice(itemIndex + 1, 0, newItemTemplate);
            break;
          case 'move_up':
            if (itemIndex > 0) {
              const temp = newItems[itemIndex];
              newItems[itemIndex] = newItems[itemIndex - 1];
              newItems[itemIndex - 1] = temp;
            }
            break;
          case 'move_down':
            if (itemIndex < newItems.length - 1) {
              const temp = newItems[itemIndex];
              newItems[itemIndex] = newItems[itemIndex + 1];
              newItems[itemIndex + 1] = temp;
            }
            break;
        }
        return { ...sec, items: newItems };
      });

      // Handle response and note editing
      if (command === 'edit_response' || command === 'edit_note') {
        const itemToUpdate = newSections.flatMap(s => s.items).find(i => i.id === itemId);
        if (itemToUpdate) {
          const fieldToEdit = command === 'edit_response' ? 'response' : 'note';
          setEditingChecklistItem({ sectionId, itemId, field: fieldToEdit, currentText: itemToUpdate[fieldToEdit] || '' });
          setIsChecklistPromptOpen(true);
          return; // Stop further processing, the modal will handle the update
        }
      }


      if (command === 'copy_response') {
        const itemToCopy = newSections.flatMap(s => s.items).find(i => i.id === itemId);
        if (itemToCopy?.response) {
          navigator.clipboard.writeText(itemToCopy.response);
          setCopyStatus('Response copied!');
          setTimeout(() => setCopyStatus(''), 2000);
        }
      }

      handleWordUpdate({ ...wordContainingChecklist, checklist: newSections });
    };

    const cleanup = window.electronAPI.on('checklist-item-command', handleMenuCommand);
    return cleanup;
  }, [words, handleWordUpdate]); // Re-bind if words state changes

  // Effect to handle commands from the new checklist section context menu
  useEffect(() => {
    const handleMenuCommand = (payload: { command: string, sectionId: number }) => {
      const { command, sectionId } = payload;
      const wordContainingChecklist = words.find(w => w.checklist?.some(sec => 'items' in sec && sec.id === sectionId));
      if (!wordContainingChecklist || !wordContainingChecklist.checklist) return;

      let newSections = [...(wordContainingChecklist.checklist as ChecklistSection[])];
      const sectionIndex = newSections.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) return;

      switch (command) {
        case 'copy_section': {
          const sectionToCopy = newSections.find(s => s.id === sectionId);
          if (sectionToCopy) {
            const textToCopy = formatChecklistForCopy([sectionToCopy]);
            navigator.clipboard.writeText(textToCopy);
            setCopyStatus('Section copied to clipboard!');
          }
          return; // Don't update state, just copy
        }
        case 'copy_all_sections': {
          const textToCopy = formatChecklistForCopy(newSections);
          navigator.clipboard.writeText(textToCopy);
          setCopyStatus('All sections copied to clipboard!');
          return; // Don't update state, just copy
        }
        case 'duplicate_section':
          const newSection = { ...newSections[sectionIndex], id: Date.now(), title: `${newSections[sectionIndex].title} (Copy)` };
          newSections.splice(sectionIndex + 1, 0, newSection);
          break;
        case 'toggle_all_in_section':
          // Find the correct Checklist instance and call its handler
          // This is complex, for now, we can call the button's handler if we can find it.
          // Or, we can just call the handler directly.
        case 'delete_section':
          if (window.confirm(`Are you sure you want to delete this section?`)) {
            newSections = newSections.filter(s => s.id !== sectionId);
          } else {
            return; // Do not proceed with update if user cancels
          }
          break;
        case 'move_section_up':
          if (sectionIndex > 0) {
            [newSections[sectionIndex - 1], newSections[sectionIndex]] = [newSections[sectionIndex], newSections[sectionIndex - 1]];
          }
          break;
        case 'move_section_down':
          if (sectionIndex < newSections.length - 1) {
            [newSections[sectionIndex], newSections[sectionIndex + 1]] = [newSections[sectionIndex + 1], newSections[sectionIndex]];
          } else {
            return; // Do not proceed with update if user cancels
          }
          break;
        case 'undo_checklist':
          activeChecklistRef.current?.handleUndo();
          break;
        case 'redo_checklist':
          activeChecklistRef.current?.handleRedo();
          break;
      }
      handleWordUpdate({ ...wordContainingChecklist, checklist: newSections });
    };

    const cleanup = window.electronAPI.on('checklist-section-command', handleMenuCommand);
    return cleanup;
  }, [words, handleWordUpdate]);

  const handleChecklistCompletion = (item: ChecklistItem, sectionId: number, updatedSections: ChecklistSection[]) => {
    // This handler is now ONLY for individual item completions.
    const parentWord = words.find(w => w.checklist?.some(s => 'items' in s && s.id === sectionId));
    if (parentWord) {
      setInboxMessages(prev => [{
        id: Date.now() + Math.random(), type: 'completed', text: `Checklist item completed: "${item.text}" in task "${parentWord.text}"`,
        timestamp: Date.now(), wordId: parentWord.id, sectionId: sectionId
      }, ...prev]);
    }
  };

  // Effect to reset the context menu editing state after it has been applied
  useEffect(() => {
    if (editingViaContext !== null) {
      // Reset after a short delay to allow the UI to update
      setSettings(prev => ({
        ...prev,
        openAccordionIds: [...new Set([...prev.openAccordionIds, editingViaContext])]
      }));
      const timer = setTimeout(() => setEditingViaContext(null), 100);
      return () => clearTimeout(timer);
    }
  }, [editingViaContext]);

  const handleAccordionToggle = (wordId: number) => {
    setOpenAccordionIds(prev => {
      const isOpen = prev.includes(wordId);
      if (isOpen) {
        return prev.filter(id => id !== wordId);
      } else {
        return [...prev, wordId];
      }
    });
  };
  const setOpenAccordionIds = (updater: (prev: number[]) => number[]) => setSettings(prev => ({ ...prev, openAccordionIds: updater(prev.openAccordionIds) }));

  const focusAddTaskInput = () => {
    setIsAddTaskOpen(true);
    setSettings(prev => ({ ...prev, isSidebarVisible: true }));
    // Use a timeout to ensure the accordion is open before focusing.
    // This works even if the accordion was already open.
    setTimeout(() => {
      newTaskTitleInputRef.current?.focus();
    }, 50); // A small delay helps ensure the element is visible
  };

  // Effect to handle sidebar toggle hotkey
  useEffect(() => {
    const handleSidebarToggle = (e: KeyboardEvent) => {
      // Prevent hotkey from firing if an input field is focused
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || (activeElement as HTMLElement).isContentEditable)) {
        return;
      }

      if (e.altKey && e.key.toLowerCase() === 's') {
        setSettings(prev => ({ ...prev, isSidebarVisible: !prev.isSidebarVisible }));
      }
    };
    window.addEventListener('keydown', handleSidebarToggle);
    return () => window.removeEventListener('keydown', handleSidebarToggle);
  }, []); // Empty dependency array, runs once

  // Effect to handle browser toggle hotkey
  useEffect(() => {
    const handleBrowserToggle = (e: KeyboardEvent) => {
      // Prevent hotkey from firing if an input field is focused
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || (activeElement as HTMLElement).isContentEditable)) {
        return;
      }

      if (e.key === '`') {
        const newIndex = (settings.activeBrowserIndex + 1) % settings.browsers.length;
        setSettings(prev => ({ ...prev, activeBrowserIndex: newIndex }));
        const newBrowserName = settings.browsers[newIndex].name;
        setCopyStatus(`Browser set to: ${newBrowserName}`);
        setTimeout(() => setCopyStatus(''), 2000);
      }
    };
    window.addEventListener('keydown', handleBrowserToggle);
    return () => window.removeEventListener('keydown', handleBrowserToggle);
  }, [settings.activeBrowserIndex, settings.browsers]);

  // Effect to handle search command from selection context menu
  useEffect(() => {
    const handleSearchSelection = (selectionText: string) => {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(selectionText)}`;
      
      // Check if any external link is configured to override the browser for search
      const useDefault = settings.useDefaultBrowserForSearch;
      const activeBrowser = settings.browsers[settings.activeBrowserIndex];

      const payload = {
        url: searchUrl,
        browserPath: useDefault ? undefined : activeBrowser?.path,
      };
      window.electronAPI.openExternalLink(payload);
    };
    const cleanup = window.electronAPI.on('search-google-selection', handleSearchSelection);
    return cleanup;
  }, [settings.browsers, settings.activeBrowserIndex, settings.useDefaultBrowserForSearch]);

  // Effect for global context menu on text selection
  useEffect(() => {
    const handleGlobalContextMenu = (e: MouseEvent) => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      if (selectedText) {
        // If text is selected, prevent default and show our menu
        e.preventDefault();
        window.electronAPI.showSelectionContextMenu({ selectionText: selectedText, x: e.clientX, y: e.clientY });
      }
    };
    document.addEventListener('contextmenu', handleGlobalContextMenu);
    return () => document.removeEventListener('contextmenu', handleGlobalContextMenu);
  }, []); // Empty array ensures this runs only once

  const getFontSize = (index: number, total: number) => {
    if (total <= 1) {
      return settings.maxFontSize; // Only one word, make it the max size.
    }
    // This creates a linear scale from MAX_FONT_SIZE down to MIN_FONT_SIZE.
    const size = settings.maxFontSize - (index / (total - 1)) * (settings.maxFontSize - settings.minFontSize);
    return Math.round(size);
  };


  // Effect to handle the Ctrl+S shortcut for saving
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault(); // Prevent the browser's default save action
        handleSaveProject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, words, completedWords, settings]); // Re-bind if state changes to save the latest version

  // This single effect handles all canvas drawing and updates when `words` changes.
  useEffect(() => {
    const canvas = canvasRef.current; // This is fine to get ref
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const redrawCanvas = (image: HTMLImageElement) => {
      // 1. Draw the background image.
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      // 2. Draw the semi-transparent overlay if it's enabled
      if (settings.isOverlayEnabled) {
        context.globalAlpha = settings.overlayOpacity;
        context.fillStyle = settings.overlayColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
        // Reset alpha so it doesn't affect the text
        context.globalAlpha = 1.0;
      }

      // 2. Draw all the words on top.
      const updatedWords = words.map((word, index) => {
        let fontSize = getFontSize(index, words.length);
        context.font = `${fontSize}px ${settings.fontFamily}`;

        // --- New Scaling Logic ---
        // Check if the word is too wide for the canvas and scale it down if necessary.
        const metrics = context.measureText(word.text);
        const availableWidth = canvas.width - 100; // 50px padding on each side
        if (metrics.width > availableWidth) {
          fontSize = Math.floor(fontSize * (availableWidth / metrics.width));
          context.font = `${fontSize}px ${settings.fontFamily}`; // Re-set the font with the new size
        }

        // Apply shadow properties
        context.shadowColor = settings.shadowColor;
        context.shadowBlur = settings.shadowBlur;
        context.shadowOffsetX = settings.shadowOffsetX;
        context.shadowOffsetY = settings.shadowOffsetY;

        // Highlight the word if it's being hovered over
        context.fillStyle = word.id === hoveredWordId ? '#FFD700' : settings.fontColor; // Gold highlight
        context.textAlign = "center";
        context.fillText(word.text, word.x, word.y);

        // Re-measure metrics in case font size changed
        const finalMetrics = context.measureText(word.text);

        // If debug mode is on, draw the bounding box
        if (settings.isDebugModeEnabled && settings.currentView === 'meme') {
          context.strokeStyle = 'red';
          context.lineWidth = 1;
          context.strokeRect(word.x - finalMetrics.width / 2, word.y - fontSize, finalMetrics.width, fontSize);
        }

        return {
          ...word,
          width: finalMetrics.width,
          height: fontSize, // Approximate height with font size
        };
      });
      // Update the ref for the click handler
      wordsRef.current = updatedWords;
    };

    const image = new Image();
    image.src = placeholderImage;
    image.onload = () => redrawCanvas(image);
    // If the image is already cached by the browser, onload might not fire.
    // This line ensures the redraw happens even if the src hasn't changed.
    if (image.complete) {
      redrawCanvas(image);
    }
  }, [words, settings, wordPlacementIndex, hoveredWordId]); // Redraw when words, settings, or hover state change
  
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const getNewWordPosition = (canvasWidth: number, canvasHeight: number, newWordMetrics: { width: number, height: number }) => {
    if (!canvasWidth || !canvasHeight) { // Guard against 0 dimensions
      return { x: 320, y: 320 }; // Fallback to center
    }
    const padding = 50; // Keep a safe distance from the edges
    let placementAttempts = 0;

    // Function to check for collision
    const checkCollision = (x: number, y: number) => {
      for (const placedWord of wordsRef.current) {
        if (!placedWord.width || !placedWord.height) continue;
        const newWordRect = { left: x - newWordMetrics.width / 2, right: x + newWordMetrics.width / 2, top: y - newWordMetrics.height, bottom: y };
        const placedWordRect = { left: placedWord.x - placedWord.width / 2, right: placedWord.x + placedWord.width / 2, top: placedWord.y - placedWord.height, bottom: placedWord.y };

        // Check for overlap
        if (newWordRect.left < placedWordRect.right && newWordRect.right > placedWordRect.left && newWordRect.top < placedWordRect.bottom && newWordRect.bottom > placedWordRect.top) {
          return true; // Collision detected
        }
      }
      return false; // No collision
    };

    // Try to find a non-colliding position along the spiral
    while (placementAttempts < 500) { // Limit attempts to prevent infinite loops      
      // Generate a completely random position within the padded area
      // This calculation now accounts for the word's own width and height to ensure it doesn't get cut off.
      const halfWidth = newWordMetrics.width / 2;
      const x = padding + halfWidth + Math.random() * (canvasWidth - (padding + halfWidth) * 2);
      
      const halfHeight = newWordMetrics.height / 2;
      const y = padding + halfHeight + Math.random() * (canvasHeight - (padding + halfHeight) * 2);
      
      if (!checkCollision(x, y)) {
        return { x, y }; // Found a good spot
      }
      placementAttempts++;
    }

    // Fallback if no spot is found after many attempts
    return { x: Math.random() * canvasWidth, y: Math.random() * canvasHeight };
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && newTask.text.trim() !== "") {
      let x = 0, y = 0, width = 0, height = 0;

      // Only perform canvas-related calculations if in 'meme' view
      if (settings.currentView === 'meme') {
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context) return; // Still need this guard for meme view

        const newWordIndex = words.length;
        const newFontSize = getFontSize(newWordIndex, newWordIndex + 1);
        context.font = `${newFontSize}px ${settings.fontFamily}`;
        const metrics = context.measureText(newTask.text.trim());
        const newWordMetrics = { width: metrics.width, height: newFontSize };

        const pos = getNewWordPosition(canvas.width, canvas.height, newWordMetrics);
        x = pos.x;
        y = pos.y;
        width = newWordMetrics.width;
        height = newWordMetrics.height;
      }

      const newWord: Word = {
        ...newTask,
        id: Date.now() + Math.random(),
        text: newTask.text.trim(),
        // Use the value from the form, or default to now if it's empty
        openDate: newTask.openDate || Date.now(),
        x, 
        y,
        manualTime: 0,
        manualTimeRunning: false,
        manualTimeStart: 0,
        width,
        height,
        createdAt: Date.now(),
        pausedDuration: 0,
      };

    setInboxMessages(prev => [{
      id: Date.now() + Math.random(),
      type: 'created',
      text: `Task created: "${newWord.text}"`,
      timestamp: Date.now(),
      wordId: newWord.id,
    }, ...prev]);
      setCopyStatus('Task added!');
      setTimeout(() => setCopyStatus(''), 2000);
      setWords((prevWords) => [...prevWords, newWord]);
      // Reset the new task form
      setNewTask({
        text: '',
        url: '',
        taskType: newTask.taskType, // Keep the selected task type
        priority: 'Medium' as 'High' | 'Medium' | 'Low',
        categoryId: newTask.categoryId, // Keep the selected category
        openDate: new Date().getTime(),
        completeBy: undefined,
        company: '',
        websiteUrl: '',
        imageLinks: [],
        attachments: [],
        checklist: [],
        notes: '',
        description: '',
        manualTime: 0,
        manualTimeRunning: false,
        manualTimeStart: 0,
        payRate: 0,
        isRecurring: false,
        isDailyRecurring: false,
        isWeeklyRecurring: false,
        isMonthlyRecurring: false,
        isYearlyRecurring: false,
        isAutocomplete: false,
        lastNotified: undefined,
        snoozedAt: undefined,
      }); // The syntax error was a misplaced comma in the original source before this line.
    }
  };

  const handleSaveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get the canvas content as a PNG data URL
    const dataUrl = canvas.toDataURL('image/png');
    // Send the data to the main process to be saved
    window.electronAPI.saveFile(dataUrl);
  };

  const applyDefaultShadow = () => {
    setSettings(prev => ({
      ...prev,
      shadowColor: "#000000",
      shadowBlur: 7,
      shadowOffsetX: 5,
      shadowOffsetY: 5,
    }));
  };

  const resetShadow = () => {
    setSettings(prev => ({
      ...prev,
      shadowColor: "#000000",
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
    }));
  };

  const handleClearAll = () => {
    setWords([]);
    setCopyStatus('All open tasks cleared!');
    setTimeout(() => setCopyStatus(''), 2000);
    setWordPlacementIndex(0); // Reset the placement index
  };

  const handleResetSettings = () => {
    setSettings(defaultSettings);
    setCopyStatus('Settings have been reset!');
    setTimeout(() => setCopyStatus(''), 2000);
  };

  const handleFontScaleChange = (scale: 'small' | 'medium' | 'large') => {
    const scales = {
      small: { minFontSize: 12, maxFontSize: 40 },
      medium: { minFontSize: 20, maxFontSize: 80 },
      large: { minFontSize: 30, maxFontSize: 120 },
    };
    setSettings(prev => ({ ...prev, ...scales[scale] }));
  };

  const handleCompleteWord = (wordToComplete: Word) => {
    // Calculate final duration
    const finalDuration = wordToComplete.isPaused
      ? wordToComplete.pausedDuration
      : (wordToComplete.pausedDuration || 0) + (Date.now() - wordToComplete.createdAt);

    const completedWord = { ...wordToComplete, completedDuration: finalDuration };

    // Add to completed list and remove from active list
    setCompletedWords(prev => [completedWord, ...prev]);
    setWords(words.filter(word => word.id !== wordToComplete.id));
    setInboxMessages(prev => [{ 
      id: Date.now() + Math.random(),
      type: 'completed',
      text: `Task completed: "${completedWord.text}"`,
      timestamp: Date.now(),
      wordId: completedWord.id,
    }, ...prev]);
    setCopyStatus('Task completed!');

    // Also remove it from any active notifications to hide the toast
    setOverdueNotifications(prev => {
      const newSet = new Set(prev);
      newSet.delete(wordToComplete.id);
      return newSet;
    });
    setTimeout(() => setCopyStatus(''), 2000);

    // If the task is re-occurring, create a new one
    if (wordToComplete.isRecurring) {
      let newCompleteBy: number | undefined = undefined;
      if (wordToComplete.completeBy && wordToComplete.createdAt) {
        // Calculate the original duration and add it to the current time
        const originalDuration = wordToComplete.completeBy - wordToComplete.createdAt;
        newCompleteBy = Date.now() + originalDuration;
      }

      const recurringTask: Word = {
        ...wordToComplete,
        id: Date.now(),
        createdAt: Date.now(),
        openDate: Date.now(),
        completedDuration: undefined,
        completeBy: newCompleteBy,
      };
      setWords(prev => [recurringTask, ...prev]);
    }

    // If the task is a daily recurring one, create a new one for the next day
    if (wordToComplete.isDailyRecurring) {
      const oneDay = 24 * 60 * 60 * 1000;
      const newOpenDate = wordToComplete.openDate + oneDay;
      const newCompleteBy = wordToComplete.completeBy ? wordToComplete.completeBy + oneDay : undefined;

      const dailyTask: Word = {
        ...wordToComplete,
        id: Date.now(),
        createdAt: newOpenDate, // Set createdAt to the new open date
        openDate: newOpenDate,
        completeBy: newCompleteBy,
        completedDuration: undefined, // Reset completion status
      };
      setWords(prev => [dailyTask, ...prev]);
    }

    // If the task is a weekly recurring one, create a new one for the next week
    if (wordToComplete.isWeeklyRecurring) {
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      const newOpenDate = wordToComplete.openDate + oneWeek;
      const newCompleteBy = wordToComplete.completeBy ? wordToComplete.completeBy + oneWeek : undefined;

      const weeklyTask: Word = {
        ...wordToComplete,
        id: Date.now(),
        createdAt: newOpenDate, // Set createdAt to the new open date
        openDate: newOpenDate,
        completeBy: newCompleteBy,
        completedDuration: undefined, // Reset completion status
      };
      setWords(prev => [weeklyTask, ...prev]);
    }

    // If the task is a monthly recurring one, create a new one for the next month
    if (wordToComplete.isMonthlyRecurring) {
      const newOpenDate = new Date(wordToComplete.openDate);
      newOpenDate.setMonth(newOpenDate.getMonth() + 1);

      let newCompleteBy: number | undefined = undefined;
      if (wordToComplete.completeBy) {
        const completeByDate = new Date(wordToComplete.completeBy);
        completeByDate.setMonth(completeByDate.getMonth() + 1);
        newCompleteBy = completeByDate.getTime();
      }

      const monthlyTask: Word = {
        ...wordToComplete,
        id: Date.now(),
        openDate: newOpenDate.getTime(),
        completeBy: newCompleteBy,
        completedDuration: undefined,
      };
      setWords(prev => [monthlyTask, ...prev]);
    }

    // If the task is a yearly recurring one, create a new one for the next year
    if (wordToComplete.isYearlyRecurring) {
      const newOpenDate = new Date(wordToComplete.openDate);
      newOpenDate.setFullYear(newOpenDate.getFullYear() + 1);

      let newCompleteBy: number | undefined = undefined;
      if (wordToComplete.completeBy) {
        const completeByDate = new Date(wordToComplete.completeBy);
        completeByDate.setFullYear(completeByDate.getFullYear() + 1);
        newCompleteBy = completeByDate.getTime();
      }

      const yearlyTask: Word = {
        ...wordToComplete,
        id: Date.now(),
        openDate: newOpenDate.getTime(),
        completeBy: newCompleteBy,
        completedDuration: undefined,
      };
      setWords(prev => [yearlyTask, ...prev]);
    }
  };

  const handleClearCompleted = () => {
    setCompletedWords([]);
    setCopyStatus('Completed list cleared!');
    setTimeout(() => setCopyStatus(''), 2000);
  };

  const handleRandomizeLayout = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const newWords: Word[] = [];
    const tempWordsRef = { current: newWords }; // Use a temporary ref for collision checking

    // Temporarily replace wordsRef for getNewWordPosition to use
    const originalWordsRef = wordsRef.current;
    wordsRef.current = tempWordsRef.current;

    words.forEach(word => {
      const { x, y } = getNewWordPosition(canvas.width, canvas.height, { width: word.width ?? 0, height: word.height ?? 0 });
      const newWord = { ...word, x, y };
      newWords.push(newWord);
    });

    // Restore the original wordsRef
    wordsRef.current = originalWordsRef;

    setWords(newWords);
  };

  const handleCopyList = () => {
    const reportHeader = "Open Tasks Report\n===================\n";
    const reportBody = words.map(word => {
      const now = Date.now();
      const currentDuration = word.isPaused 
        ? (word.pausedDuration || 0) 
        : (word.pausedDuration || 0) + (now - word.createdAt);
      return `- ${word.text}\n    - Date Opened: ${formatTimestamp(word.createdAt)}\n    - Current Timer: ${formatTime(currentDuration)}`;
    }).join('\n\n');

    const wordList = reportHeader + reportBody;
    navigator.clipboard.writeText(wordList).then(() => {
      setCopyStatus('Open tasks copied!');
      setTimeout(() => setCopyStatus(''), 2000); // Clear message after 2 seconds
    }).catch(err => {
      console.error('Failed to copy list: ', err);
    });
  };

  const handleCopyReport = () => {
    const reportHeader = "Completed Tasks Report\n======================\n";
    const reportBody = completedWords.map(word => {
      const closedAt = word.createdAt + (word.completedDuration ?? 0);
      return `- ${word.text}\n    - Date Opened: ${formatTimestamp(word.createdAt)}\n    - Closed at: ${formatTimestamp(closedAt)}\n    - Total Time: ${formatTime(word.completedDuration ?? 0)}`;
    }).join('\n\n');

    const fullReport = reportHeader + reportBody;
    navigator.clipboard.writeText(fullReport).then(() => {
      setCopyStatus('Report copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    }).catch(err => {
      console.error('Failed to copy report: ', err);
    });
  };

  const handleBulkAdd = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    // The context is only needed for measurements, which are only relevant for Meme View placement.
    // For List View, we can add words without position data initially.
    if (bulkAddText.trim() === "") return;
    if (settings.currentView === 'meme' && (!canvas || !context)) {
      return; // In meme view, we need the canvas to proceed.
    }

    // Split by comma or newline, then trim whitespace from each item, and filter out any empty strings.
    const wordsToAdd = bulkAddText
      .split(/[\n,]+/)
      .map(w => w.trim()).filter(w => w);
    let currentWords = [...words];
    let currentPlacementIndex = wordPlacementIndex;

    wordsToAdd.forEach(text => {
      const newWordIndex = currentWords.length;
      let x = 0, y = 0, width = 0, height = 0;

      // Only calculate position and size if in meme view
      if (settings.currentView === 'meme' && canvas && context) {
        const newFontSize = getFontSize(newWordIndex, newWordIndex + 1);
        context.font = `${newFontSize}px ${settings.fontFamily}`;
        const metrics = context.measureText(text);
        const newWordMetrics = { width: metrics.width, height: newFontSize };
        ({ x, y } = getNewWordPosition(canvas.width, canvas.height, newWordMetrics));
        width = newWordMetrics.width;
        height = newWordMetrics.height;
      }

      const newWord: Word = {
        id: Date.now() + Math.random(), // Add random to avoid collision in fast loops
        text,
        x, y,
        categoryId: activeCategoryId === 'all' ? (settings.categories[0]?.id || 1) : activeCategoryId,
        manualTime: 0,
        manualTimeRunning: false,
        manualTimeStart: 0,
        imageLinks: [],
        openDate: Date.now(),
        width,
        height,
        createdAt: Date.now(),
        pausedDuration: 0,
        checklist: [],
      };
      currentWords.push(newWord);
      currentPlacementIndex++;
    });
    setInboxMessages(prev => [{
      id: Date.now() + Math.random(),
      type: 'created',
      text: `Bulk added ${wordsToAdd.length} tasks.`,
      timestamp: Date.now(),
    }, ...prev]);

    setWords(currentWords);
    setWordPlacementIndex(currentPlacementIndex);
    setBulkAddText(""); // Clear the textarea
  };

  const handleTogglePause = (wordId: number) => {
    setWords(words.map(word => {
      if (word.id === wordId) {
        if (word.isPaused) {
          // Resuming: adjust createdAt to account for the time it was paused
          const now = Date.now();
          const newCreatedAt = now - (word.pausedDuration || 0);
          return { ...word, isPaused: false, createdAt: newCreatedAt, pausedDuration: 0 };
        } else {
          // Pausing: calculate and store the elapsed duration
          const elapsed = (word.pausedDuration || 0) + (Date.now() - word.createdAt);
          return { ...word, isPaused: true, pausedDuration: elapsed };
        }
      }
      return word;
    }));
  };

  const handleEdit = (word: Word) => {
    setEditingWordId(word.id);
    setEditingText(word.text);
  };

  const handleEditChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditingText(event.target.value);
  };

  const handleEditKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, wordId: number) => {
    if (event.key === 'Enter') {
      const newWords = words.map(word => 
        word.id === wordId ? { ...word, text: editingText.trim() } : word
      );
      setWords(newWords);
      setEditingWordId(null);
      setEditingText("");
    } else if (event.key === 'Escape') {
      setEditingWordId(null);
      setEditingText("");
    }
  };

  const handleReopenTask = (taskToReopen: Word) => {
    // Remove from completed list
    setCompletedWords(completedWords.filter(w => w.id !== taskToReopen.id));

    // Reset completion data and add to the top of the active list
    const reopenedTask: Word = { ...taskToReopen, completedDuration: undefined };
    setWords([reopenedTask, ...words]);

    setCopyStatus('Task reopened!');
    setTimeout(() => setCopyStatus(''), 2000);
  };

  const handleExport = () => {
    const projectData = {
      words,
      settings,
    };
    const jsonString = JSON.stringify(projectData, null, 2); // Pretty print the JSON
    window.electronAPI.exportProject(jsonString);
  };

  const handleImport = async () => {
    const jsonString = await window.electronAPI.importProject();
    if (jsonString) {
      try {
        const projectData = JSON.parse(jsonString);
        setWords(projectData.words || []);
        setSettings(prev => ({ ...defaultSettings, ...projectData.settings }));
      } catch (error) {
        console.error("Failed to parse imported project file:", error);
      }
    }
  };

  const handleSaveProject = async () => {
    // Prevent any save operations while the app is still loading its initial data.
    if (isLoading) return;

    // --- FIX FOR BUG #2 ---
    // Before saving, check for any words that were added in list view and don't have positions.
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    let wordsToSave = [...words];

    if (canvas && context) {
      wordsToSave = words.map((word, index) => {
        if (word.x === 0 && word.y === 0) {
          // This word needs a position.
          const fontSize = getFontSize(index, words.length);
          context.font = `${fontSize}px ${settings.fontFamily}`;
          const metrics = context.measureText(word.text);
          const newWordMetrics = { width: metrics.width, height: fontSize };
          const { x, y } = getNewWordPosition(canvas.width, canvas.height, newWordMetrics);
          return { ...word, x, y, width: newWordMetrics.width, height: newWordMetrics.height };
        }
        return word;
      });
    }

    // Explicitly save all parts of the state to the store. This is the single source of truth for a manual save.
    await window.electronAPI.setStoreValue('overwhelmed-words', wordsToSave);
    await window.electronAPI.setStoreValue('overwhelmed-completed-words', completedWords);
    await window.electronAPI.setStoreValue('overwhelmed-settings', settings);
    await window.electronAPI.setStoreValue('overwhelmed-inbox-messages', inboxMessagesRef.current);
    await window.electronAPI.setStoreValue('overwhelmed-archived-messages', archivedMessagesRef.current);
    await window.electronAPI.setStoreValue('overwhelmed-trashed-messages', trashedMessagesRef.current);
    
    setIsDirty(false); // Mark the state as clean/saved
    setLastSaveTime(Date.now());
    setAutoSaveCountdown(AUTO_SAVE_INTERVAL_SECONDS); // Reset countdown on manual save

    setCopyStatus('Project saved!');
    setTimeout(() => setCopyStatus(''), 2000); // Clear message after 2 seconds
  };

  const moveWord = (wordIdToMove: number, targetWordId: number) => {
    const newWords = [...words];
    const indexToMove = newWords.findIndex(w => w.id === wordIdToMove);
    const indexToSwap = newWords.findIndex(w => w.id === targetWordId);

    if (indexToMove === -1 || indexToSwap === -1) {
      console.error("Could not find one or both words to swap.");
      return; // One of the words wasn't found, abort.
    }

    // Simple and robust swap
    const temp = newWords[indexToMove];
    newWords[indexToMove] = newWords[indexToSwap];
    newWords[indexToSwap] = temp;
    
    setWords(newWords);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const foundWord = [...wordsRef.current].reverse().find(word => {
      if (!word.width || !word.height) return false;
      const wordLeft = word.x - word.width / 2;
      const wordRight = word.x + word.width / 2;
      const wordTop = word.y - word.height;
      const wordBottom = word.y;
      return x >= wordLeft && x <= wordRight && y >= wordTop && y <= wordBottom;
    });

    if (foundWord) {
      setHoveredWordId(foundWord.id);
      canvas.style.cursor = 'pointer';
    } else {
      setHoveredWordId(null);
      canvas.style.cursor = 'default';
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find if a word was clicked (iterate in reverse to find the top-most word)
    const clickedWord = [...wordsRef.current].reverse().find(word => {
      if (!word.width || !word.height) return false;
      
      // Calculate bounding box, accounting for textAlign='center'
      const wordLeft = word.x - word.width / 2;
      const wordRight = word.x + word.width / 2;
      const wordTop = word.y - word.height; // Approximation
      const wordBottom = word.y;

      return x >= wordLeft && x <= wordRight && y >= wordTop && y <= wordBottom;
    });

    if (clickedWord) {
      // Use the specific URL if it exists, otherwise fall back to Google search.
      const activeBrowser = settings.browsers[settings.activeBrowserIndex];
      if (clickedWord.url) {
        window.electronAPI.openExternalLink({ url: clickedWord.url, browserPath: activeBrowser?.path });
      } else {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(clickedWord.text)}`;
        window.electronAPI.openExternalLink({ url: searchUrl, browserPath: activeBrowser?.path });
      }
    }
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // Only show the custom menu in debug mode
    if (!settings.isDebugModeEnabled) {
      return;
    }

    event.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedWord = [...wordsRef.current].reverse().find(word => {
      if (!word.width || !word.height) return false;
      const wordLeft = word.x - word.width / 2;
      const wordRight = word.x + word.width / 2;
      const wordTop = word.y - word.height;
      const wordBottom = word.y;
      return x >= wordLeft && x <= wordRight && y >= wordTop && y <= wordBottom;
    });

    if (clickedWord) {
      console.log('Inspecting word:', clickedWord);
      window.electronAPI.showContextMenu();
    }
  };

  const handleTimerNotify = (word: Word) => {
    setTimerNotifications(prev => [...prev, word]);
    // Automatically remove the notification after some time
    setTimeout(() => {
      setTimerNotifications(prev => prev.filter(n => n.id !== word.id));
    }, 8000); // Keep on screen for 8 seconds
  };

  const handleSnooze = (wordToSnooze: Word, duration?: 'low' | 'medium' | 'high') => {
    const snoozeDurations = {
      low: 1 * 60 * 1000,     // 1 minute
      medium: 5 * 60 * 1000,  // 5 minutes
      high: 10 * 60 * 1000,   // 10 minutes
    };
    const snoozeDurationMs = snoozeDurations[duration || settings.snoozeTime];
    const snoozedUntil = Date.now() + snoozeDurationMs;

    // Update the word's `lastNotified` property to act as the "snoozed until" timestamp
    setWords(prevWords => prevWords.map(w => 
      w.id === wordToSnooze.id ? { ...w, lastNotified: snoozedUntil, snoozeCount: (w.snoozeCount || 0) + 1, snoozedAt: Date.now() } : w
    ));

    // Remove the notification from the screen
    setOverdueNotifications(prev => {
      const newSet = new Set(prev);
      newSet.delete(wordToSnooze.id);
      return newSet;
    });
  };

  const navigateToView = (view: 'meme' | 'list' | 'reports' | 'inbox') => {
    // If we are navigating to a new view from the current point in history
    const newHistory = viewHistory.slice(0, historyIndex + 1);
    newHistory.push(view);
    setViewHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setSettings(prev => ({ ...prev, currentView: view }));
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSettings(prev => ({ ...prev, currentView: viewHistory[newIndex] as any }));
    }
  };

  const goForward = () => {
    if (historyIndex < viewHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSettings(prev => ({ ...prev, currentView: viewHistory[newIndex] as any }));
    }
  };

  const handleSnoozeAll = (duration?: 'low' | 'medium' | 'high') => {
    const now = Date.now(); 
    const snoozeDurations = {
      low: 1 * 60 * 1000,
      medium: 5 * 60 * 1000,
      high: 10 * 60 * 1000,
    };
    // const snoozeDurationMs = snoozeDurations[settings.snoozeTime]; 
    const snoozeDurationMs = snoozeDurations[duration || settings.snoozeTime]; 
    const snoozedUntil = now + snoozeDurationMs;
    

    const overdueIds = Array.from(overdueNotifications);
    setWords(prevWords => prevWords.map(w => 
      // overdueIds.includes(w.id) ? { ...w, lastNotified: snoozedUntil, snoozeCount: (w.snoozeCount || 0) + 1 } : w
      overdueIds.includes(w.id) ? { ...w, lastNotified: snoozedUntil, snoozeCount: (w.snoozeCount || 0) + 1, snoozedAt: now } : w
    ));
    setOverdueNotifications(new Set()); // Clear all toasts
  };

  const handleCompleteAllOverdue = () => {
    const overdueIds = Array.from(overdueNotifications);
    overdueIds.forEach(id => {
      const wordToComplete = words.find(w => w.id === id);
      if (wordToComplete) handleCompleteWord(wordToComplete);
    });
  };

  const handleDeleteAllOverdue = () => {
    const overdueIds = Array.from(overdueNotifications);
    overdueIds.forEach(id => {
      const wordToDelete = words.find(w => w.id === id);
      if (wordToDelete) removeWord(wordToDelete.id);
    });
  };

  const handleInboxItemClick = (message: InboxMessage) => {
    if (!message || !message.wordId) return;

    const { wordId, sectionId } = message;

    // Find the word to determine its category
    const word = words.find(w => w.id === wordId);
    if (!word || !word.categoryId) return;

    const category = settings.categories.find(c => c.id === word.categoryId); 
    if (!category) return;

    // Determine the parent and sub-category to activate
    const parentId = category.parentId || category.id;
    const subId = category.parentId ? category.id : 'all';

    // Switch to the list view and set the correct category/sub-category filters
    setSettings(prev => ({
      ...prev,
      currentView: 'list',
      activeCategoryId: parentId,
      activeSubCategoryId: subId,
      openAccordionIds: [...new Set([...prev.openAccordionIds, wordId])]
    }));

    // Use a timeout to ensure the list view has rendered before we try to scroll
    setTimeout(() => {
      const element = document.querySelector(`[data-word-id='${wordId}']`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // If a sectionId is provided, scroll to and highlight the checklist section
        if (message.sectionId) {
          setTimeout(() => {
            const sectionElement = element.querySelector(`[data-section-id='${sectionId}']`);
            if (sectionElement) {
              sectionElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              sectionElement.classList.add('highlight-section');
              setTimeout(() => sectionElement.classList.remove('highlight-section'), 2500); // Highlight for 2.5s
            }
          }, 300); // Wait for accordion to open
        }
      }
    }, 100);
  };

  const handleDismissInboxMessage = (messageId: number) => {
    const messageToTrash = inboxMessages.find(m => m.id === messageId);
    if (!messageToTrash) return;

    if (messageToTrash.isImportant) {
      setCopyStatus("Cannot dismiss an important message.");
      setTimeout(() => setCopyStatus(''), 2000);
      return;
    }

    // Move the message to the trash state
    setTrashedMessages(prev => [messageToTrash, ...prev]);
    setInboxMessages(prev => prev.filter(m => m.id !== messageId));

    setCopyStatus("Message moved to trash.");
    setTimeout(() => setCopyStatus(''), 2000);
    setIsDirty(true);
  };

  const handleDismissAllInboxMessages = () => {
    const messagesToTrash = inboxMessages.filter(m => !m.isImportant);
    setTrashedMessages(prev => [...messagesToTrash, ...prev]);
    setInboxMessages(prev => prev.filter(m => m.isImportant));

    setCopyStatus(`Moved ${messagesToTrash.length} non-important message(s) to trash.`);
    setTimeout(() => setCopyStatus(''), 2000);
    setIsDirty(true);
  };
  const Footer = () => {
    const currentYear = new Date().getFullYear();
    const version = '1.0.0'; // You can update this manually or pull from package.json
    const companyUrl = 'https://moondogdevelopment.com';
    const githubUrl = 'https://github.com/moondogdev/overwhelmed';

    return (
    
      <div className='footer-credit'>        
        <div className='version'>
          <a href="#" onClick={() => window.electronAPI.openExternalLink({ url: githubUrl, browserPath: undefined })}><span className='app-name'>Overwhelmed</span> • Version: {version}</a>
        </div>
        <div>
          Copyright © {currentYear} • <a href="#" onClick={() => window.electronAPI.openExternalLink({ url: companyUrl, browserPath: undefined })}>Moondog Development, LLC</a>
        </div>        
      </div>
    );
  };

  // --- Full Task View Logic ---
  if (fullTaskViewId) {
    const taskToShow = words.find(w => w.id === fullTaskViewId) || completedWords.find(w => w.id === fullTaskViewId);
    if (taskToShow) {
      return (
        <FullTaskView
          task={taskToShow}
          onClose={() => setFullTaskViewId(null)}
          onUpdate={handleWordUpdate}
          onNotify={handleTimerNotify}
          formatTimestamp={formatTimestamp}
          setCopyStatus={setCopyStatus}
          settings={settings}
          onSettingsChange={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
          words={words}
          setInboxMessages={setInboxMessages}
          onComplete={handleChecklistCompletion}
          onTabChange={(wordId, tab) => setSettings(prev => ({ ...prev, activeTaskTabs: { ...prev.activeTaskTabs, [wordId]: tab } }))}
          onDescriptionChange={(html) => handleWordUpdate({ ...taskToShow, description: html })}          
        />
      );
    }
  }
  // --- End Full Task View Logic ---

  return (
    <div className="app-container">
      <div className="clock-save-container"> 
        <div className="header-center-stack">
          <div className="current-browser-display">Active Browser: <b>{settings.browsers[settings.activeBrowserIndex]?.name || 'Default'}</b></div>        
        </div>
        <div className="save-status-container">
          <button
            onClick={handleSaveProject}
            onContextMenu={(e) => { e.preventDefault(); window.electronAPI.showSaveButtonContextMenu({ x: e.clientX, y: e.clientY }); }}
            className={`dynamic-save-button ${isDirty ? 'unsaved' : 'saved'}`}
            disabled={isLoading}
          >
            {isDirty ? 'Save Project (Unsaved)' : 'Project Saved'}
          </button>
          {lastSaveTime && <div className="save-timestamp">Last saved at {formatTimestamp(lastSaveTime)}</div>}
          <div className="save-timestamp">
            Autosaving in {Math.floor(autoSaveCountdown / 60)}:{(autoSaveCountdown % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>
      {copyStatus && <div className="copy-status-toast">{copyStatus}</div>}
      {timerNotifications.length > 0 && (
        <div className="timer-notification-container">
          {timerNotifications.map(word => (
            <div key={word.id} className="timer-notification-toast">
              <span className="toast-icon">⏳</span>
              <div>
                <strong>Timer Alert:</strong> {word.text}
                <br />
                <TimeLeft word={word} onUpdate={() => {}} onNotify={() => {}} settings={settings} /> remaining.
              </div>
            </div>
          ))}
        </div>
      )}
      {overdueNotifications.size > 0 && (
        <div className="overdue-notification-container">
          <div className="overdue-notification-summary">
            Overdue: {overdueNotifications.size}
            {overdueNotifications.size > 1 && (
              <div className="overdue-summary-actions">
                <button onClick={() => handleSnoozeAll()}>Snooze All</button>
                <button onClick={() => handleSnoozeAll('high')}>Snooze All 10m</button>
                <button onClick={handleCompleteAllOverdue}>Complete All</button>
                <button onClick={handleDeleteAllOverdue}>Delete All</button>
              </div>
            )}
          </div>
          <div className="overdue-notification-list">
            {Array.from(overdueNotifications).map(wordId => {
              const word = words.find(w => w.id === wordId);
              if (!word) return null;
              return (
                <div 
                  key={word.id} 
                  className="overdue-notification-toast"
                    onContextMenu={(e) => { e.preventDefault(); window.electronAPI.showToastContextMenu({ wordId: word.id, x: e.clientX, y: e.clientY }); }} 
                >
                  <div className="overdue-notification-content">
                    <div className="overdue-title-bar">
                      <span 
                        className="clickable" 
                        onClick={() => handleInboxItemClick({ wordId: word.id, id: 0, type: 'overdue', text: '', timestamp: 0 })} 
                        title="Go to task">
                        <span className="toast-icon">🚨</span>
                        <strong>{word.text}</strong> is Due!
                      </span><button className="icon-button overdue-settings-btn" title="Edit Notification Settings" onClick={() => {
                        // Find the ID for the Time Management accordion to open it
                        const timeManagementAccordionId = -2; // Using a hardcoded negative ID for settings accordions
                        setSettings(prev => ({ ...prev, openAccordionIds: [...new Set([...prev.openAccordionIds, timeManagementAccordionId])] }));
                        // Use a timeout to ensure the element is visible before focusing
                        setTimeout(() => {
                          snoozeTimeSelectRef.current?.focus();
                          snoozeTimeSelectRef.current?.classList.add('highlight-setting');
                          setTimeout(() => snoozeTimeSelectRef.current?.classList.remove('highlight-setting'), 2000);
                        }, 100);;
                      }}><i className="fas fa-cog"></i></button>
                    </div>
                    <div 
                      className="overdue-timer clickable"
                      onClick={() => handleInboxItemClick({ wordId: word.id, id: 0, type: 'overdue', text: '', timestamp: 0 })}
                      title="Go to task">
                      <TimeLeft word={word} onUpdate={(updatedWord) => setWords(words.map(w => w.id === updatedWord.id ? updatedWord : w))} onNotify={handleTimerNotify} settings={settings} />
                    </div>
                    <div className="overdue-inbox-link">
                      Notification sent to <a href="#" onClick={(e) => { e.preventDefault(); navigateToView('inbox'); }}>Inbox</a> 
                    </div>
                    <div className="overdue-notification-actions">
                      <button onClick={() => handleSnooze(word)} title={`Snooze for ${settings.snoozeTime === 'low' ? '1' : settings.snoozeTime === 'medium' ? '5' : '10'} minutes`}>Snooze</button>
                      <button onClick={() => handleSnooze(word, 'high')} title="Snooze for 10 minutes">Snooze 10m</button>
                      <button onClick={() => handleCompleteWord(word)} title="Complete this task">Complete</button>                                   
                      <button onClick={() => removeWord(word.id)} title="Delete this task">Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {isChecklistPromptOpen && editingChecklistItem && (
        <PromptModal
          isOpen={isChecklistPromptOpen}
          title={`Edit ${editingChecklistItem.field}`}
          placeholder={`Enter ${editingChecklistItem.field}...`}
          initialValue={editingChecklistItem.currentText}
          onClose={() => setIsChecklistPromptOpen(false)}
          onConfirm={(newText) => {
            const { sectionId, itemId, field } = editingChecklistItem;
            const wordContainingChecklist = words.find(w => w.checklist?.some(sec => 'items' in sec && sec.items.some(item => item.id === itemId)));
            if (wordContainingChecklist) {
              const newSections = (wordContainingChecklist.checklist as ChecklistSection[]).map(sec => ({
                ...sec,
                items: sec.items.map(item =>
                  item.id === itemId ? { ...item, [field]: newText } : item
                )
              }));
              handleWordUpdate({ ...wordContainingChecklist, checklist: newSections });
            }
            setIsChecklistPromptOpen(false);
            setEditingChecklistItem(null);
          }}
        />
      )}
      <Footer />
      <div className="main-content">
        <header className="app-header">
          <div className="external-links">
            {settings.externalLinks.map((link, index) => (
              <button key={index} onClick={() => {
                const payload = {
                  url: link.url,
                  browserPath: link.openInDefault ? undefined : settings.browsers[settings.activeBrowserIndex]?.path
                };
                window.electronAPI.openExternalLink(payload);
              }}>
                {link.name}
              </button>
            ))}
          </div>      
          <div className='app-header-nav-centered'>
            <div className='clock-header-container'><LiveClock /></div>
            <div className="app-nav-buttons">
              <button onContextMenu={(e) => window.electronAPI.showNavButtonContextMenu({ x: e.clientX, y: e.clientY, canGoBack: historyIndex > 0, canGoForward: historyIndex < viewHistory.length - 1 })} 
                onClick={() => navigateToView('meme')} 
                disabled={settings.currentView === 'meme'}>
                  Meme View
              </button>          
              <button onContextMenu={(e) => window.electronAPI.showNavButtonContextMenu({ x: e.clientX, y: e.clientY, canGoBack: historyIndex > 0, canGoForward: historyIndex < viewHistory.length - 1 })} 
                onClick={() => navigateToView('list')} 
                disabled={settings.currentView === 'list'}>
                  List View</button>
              <button onContextMenu={(e) => window.electronAPI.showNavButtonContextMenu({ x: e.clientX, y: e.clientY, canGoBack: historyIndex > 0, canGoForward: historyIndex < viewHistory.length - 1 })} 
                onClick={() => navigateToView('reports')} 
                disabled={settings.currentView === 'reports'}>
                  Reports View</button>
              <button onContextMenu={(e) => window.electronAPI.showNavButtonContextMenu({ x: e.clientX, y: e.clientY, canGoBack: historyIndex > 0, canGoForward: historyIndex < viewHistory.length - 1 })} 
                onClick={() => navigateToView('inbox')} 
                disabled={settings.currentView === 'inbox'}>Inbox ({inboxMessages.length})</button>
            </div>
          </div>
          <button className="icon-button" onClick={() => setSettings(prev => ({ ...prev, isSidebarVisible: !prev.isSidebarVisible }))} title="Toggle Sidebar (Alt+S)"><i className="fas fa-cog"></i></button>
        </header>
        {settings.currentView === 'meme' && (
          <div className="canvas-container">
            <div className="canvas-actions">
              <button onClick={handleRandomizeLayout} title="Randomize Layout">
                <i className="fas fa-random"></i> Randomize Layout
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={640} height={640}
              className="word-cloud-canvas"
              onClick={handleCanvasClick}
              onContextMenu={handleContextMenu}
              onMouseMove={handleMouseMove}
              title={hoveredWordId ? 'Search Google' : ''} />
          </div>
        )}
        {settings.currentView === 'reports' && <ReportsView completedWords={completedWords} categories={settings.categories} setCopyStatus={setCopyStatus} />}
        {settings.currentView === 'inbox' && (
          <div className="inbox-view">
            <div className="list-header">
              <h3>Inbox</h3>
              <div className="list-header-actions">
                <div className="inbox-sort-control">
                  <label>Sort by:</label>
                  <select value={settings.inboxSort || 'date-desc'} onChange={(e) => setSettings(prev => ({ ...prev, inboxSort: e.target.value as any }))}>
                    <option value="date-desc">Date (Newest First)</option>;
                    <option value="date-asc">Date (Oldest First)</option>
                    <option value="type">Message Type</option>
                  </select>
                </div>
                <button onClick={() => {
                  handleDismissAllInboxMessages();
                }} title="Clear All Non-Important Messages"><i className="fas fa-trash"></i> Clear All</button>
              </div>
            </div>
            <div className="tab-headers">
              <button onClick={() => setActiveInboxTab('active')} className={activeInboxTab === 'active' ? 'active' : ''}>Active ({inboxMessages.length})</button>
              <button onClick={() => setActiveInboxTab('archived')} className={activeInboxTab === 'archived' ? 'active' : ''}>Archived ({archivedMessages.length})</button>
              <button onClick={() => setActiveInboxTab('trash')} className={activeInboxTab === 'trash' ? 'active' : ''}>Trash ({trashedMessages.length})</button>
            </div>
            {activeInboxTab === 'active' && (() => {
                const activeHeader = (
                  <div className="list-header">
                    <button onClick={handleDismissAllInboxMessages} title="Move all non-important messages to trash"><i className="fas fa-trash"></i> Clear All</button>
                  </div>
                );

                if (inboxMessages.length === 0) {
                  return <p>Your inbox is empty.</p>;
                }
  
                if (settings.inboxSort === 'type') {
                  const groupedMessages = inboxMessages.reduce((acc, message) => {
                    const type = message.type;
                    if (!acc[type]) {
                      acc[type] = [];
                    }
                    acc[type].push(message);
                    return acc;
                  }, {} as Record<string, InboxMessage[]>);
  
                  // Sort each group internally by timestamp
                  for (const type in groupedMessages) {
                    groupedMessages[type].sort((a, b) => b.timestamp - a.timestamp);
                  }
  
                  return (
                    <div className="inbox-list">
                      {Object.entries(groupedMessages).map(([type, messages]) => (
                        <SimpleAccordion
                          key={`${type}-${messages[0]?.id || 0}`} 
                          title={`${type.charAt(0).toUpperCase() + type.slice(1)} (${messages.length})`} 
                          startOpen={(settings.openInboxGroupTypes || []).includes(type)}
                          onToggle={(isOpen) => {
                            const newOpenTypes = isOpen ? [...(settings.openInboxGroupTypes || []), type] : (settings.openInboxGroupTypes || []).filter(t => t !== type);
                            setSettings(prev => ({ ...prev, openInboxGroupTypes: newOpenTypes }));
                          }}>
                          <div className="inbox-group">
                            {messages.map(message => (
                              <div key={message.id} className={`inbox-item inbox-item-${message.type} ${message.wordId ? 'clickable' : ''}`} onClick={() => handleInboxItemClick(message)} onContextMenu={(e) => { if (message.type !== 'created' && message.type !== 'deleted' && message.type !== 'updated' && message.type !== 'completed') { e.preventDefault(); window.electronAPI.showInboxItemContextMenu({ message, x: e.clientX, y: e.clientY }); } else { e.preventDefault(); } }}>
                                <span className="inbox-item-icon"><i className={`fas ${message.type === 'overdue' ? 'fa-exclamation-triangle' : message.type === 'timer-alert' ? 'fa-bell' : message.type === 'created' ? 'fa-magic' : message.type === 'completed' ? 'fa-check-circle' : message.type === 'deleted' ? 'fa-trash-alt' : 'fa-pencil-alt'}`}></i></span>
                                <span className="inbox-item-text">{message.text}</span><span className="inbox-item-timestamp">{formatTimestamp(message.timestamp)}</span>
                                <div className="inbox-message-actions">
                                  <button className="inbox-message-action-btn important-btn" title={message.isImportant ? "Unmark as important" : "Mark as important"} onClick={(e) => { e.stopPropagation(); handleToggleImportant(message.id); }}>
                                    <i className={`fas fa-star ${message.isImportant ? 'important' : ''}`}></i>
                                  </button>
                                  <button className="inbox-message-action-btn archive-btn" title="Archive Message" onClick={(e) => { e.stopPropagation(); handleArchiveInboxMessage(message.id); }}>
                                    <i className="fas fa-archive"></i>
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDismissInboxMessage(message.id); }} className="inbox-message-action-btn remove-btn" title="Dismiss Message">
                                    <i className="fas fa-times"></i>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </SimpleAccordion>
                      ))}
                    </div>
                  );
                }
  
                const sortedMessages = [...inboxMessages].sort((a, b) => {
                  if (settings.inboxSort === 'date-asc') {
                    return a.timestamp - b.timestamp;
                  }
                  if (settings.inboxSort === 'type') {
                    return a.type.localeCompare(b.type) || b.timestamp - a.timestamp;
                  }
                  return b.timestamp - a.timestamp; // Default 'date-desc'
                });
  
                return (
                  <div className="inbox-list">
                    {sortedMessages.map(message => (
                      <div key={message.id} className={`inbox-item inbox-item-${message.type} ${message.wordId ? 'clickable' : ''}`} onClick={() => handleInboxItemClick(message)} onContextMenu={(e) => { if (message.type !== 'created' && message.type !== 'deleted' && message.type !== 'updated' && message.type !== 'completed') { e.preventDefault(); window.electronAPI.showInboxItemContextMenu({ message, x: e.clientX, y: e.clientY }); } else { e.preventDefault(); } }}>
                        <span className="inbox-item-icon"><i className={`fas ${message.type === 'overdue' ? 'fa-exclamation-triangle' : message.type === 'timer-alert' ? 'fa-bell' : message.type === 'created' ? 'fa-magic' : message.type === 'completed' ? 'fa-check-circle' : message.type === 'deleted' ? 'fa-trash-alt' : 'fa-pencil-alt'}`}></i></span>
                        <span className="inbox-item-text">{message.text}</span><span className="inbox-item-timestamp">{formatTimestamp(message.timestamp)}</span>
                        <div className="inbox-message-actions">
                          <button className="inbox-message-action-btn important-btn" title={message.isImportant ? "Unmark as important" : "Mark as important"} onClick={(e) => { e.stopPropagation(); handleToggleImportant(message.id); }}>
                            <i className={`fas fa-star ${message.isImportant ? 'important' : ''}`}></i>
                          </button>
                          <button className="inbox-message-action-btn archive-btn" title="Archive Message" onClick={(e) => { e.stopPropagation(); handleArchiveInboxMessage(message.id); }}>
                            <i className="fas fa-archive"></i>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDismissInboxMessage(message.id); }} className="inbox-message-action-btn" title="Dismiss Message">
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            {activeInboxTab === 'archived' && (() => {
              if (archivedMessages.length === 0) {
                return <p>Your archive is empty.</p>;
              }
              const sortedArchived = [...archivedMessages].sort((a, b) => b.timestamp - a.timestamp);
              const archiveHeader = (
                <div className="list-header">
                  <button onClick={() => { if(window.confirm('Are you sure you want to un-archive all messages?')) { setInboxMessages(prev => [...prev, ...archivedMessages]); setArchivedMessages([]); setIsDirty(true); } }} title="Un-archive all messages"><i className="fas fa-undo-alt"></i> Un-archive All</button><button onClick={handleTrashAllArchived} title="Move all archived messages to trash"><i className="fas fa-trash"></i> Trash All</button>
                </div>
              );
              return (
                <div className="inbox-list">
                  {archiveHeader}
                  {sortedArchived.map(message => (
                    <div key={message.id} className={`inbox-item inbox-item-${message.type} ${message.wordId ? 'clickable' : ''}`} onClick={() => handleInboxItemClick(message)}>
                      <span className="inbox-item-icon"><i className={`fas ${message.type === 'overdue' ? 'fa-exclamation-triangle' : message.type === 'timer-alert' ? 'fa-bell' : 'fa-info-circle'}`}></i></span>
                      <span className="inbox-item-text">{message.text}</span>
                      <span className="inbox-item-timestamp">{formatTimestamp(message.timestamp)}</span>
                      <div className="inbox-message-actions">
                        <button 
                          className="inbox-message-action-btn archive-btn" 
                          title="Un-archive Message" 
                          onClick={(e) => { e.stopPropagation(); handleUnarchiveInboxMessage(message.id); }}>
                          <i className="fas fa-undo-alt"></i>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDismissArchivedMessage(message.id); }} className="inbox-message-action-btn remove-btn" title="Move to Trash">
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
            {activeInboxTab === 'trash' && (() => {
              if (trashedMessages.length === 0) {
                return <p>Your trash is empty.</p>;
              }
              const sortedTrashed = [...trashedMessages].sort((a, b) => b.timestamp - a.timestamp);
              const trashHeader = (
                <div className="list-header">
                  <button onClick={handleRestoreAllFromTrash} title="Restore all messages from trash"><i className="fas fa-undo-alt"></i> Restore All</button><button onClick={handleEmptyTrash} title="Permanently delete all items in trash"><i className="fas fa-dumpster-fire"></i> Empty Trash</button>
                </div>
              );
              return (
                <div className="inbox-list">
                  {trashHeader}
                  {sortedTrashed.map(message => (
                    <div key={message.id} className={`inbox-item inbox-item-${message.type} ${message.wordId ? 'clickable' : ''}`} onClick={() => handleInboxItemClick(message)}>
                      <span className="inbox-item-icon"><i className={`fas ${message.type === 'overdue' ? 'fa-exclamation-triangle' : message.type === 'timer-alert' ? 'fa-bell' : 'fa-info-circle'}`}></i></span>
                      <span className="inbox-item-text">{message.text}</span>
                      <span className="inbox-item-timestamp">{formatTimestamp(message.timestamp)}</span>
                      <div className="inbox-message-actions">
                        <button 
                          className="inbox-message-action-btn restore-btn" 
                          title="Restore Message" 
                          onClick={(e) => { e.stopPropagation(); handleRestoreFromTrash(message.id); }}>
                          <i className="fas fa-undo-alt"></i>
                        </button>
                        <button 
                          className="inbox-message-action-btn remove-btn" 
                          title="Delete Permanently"
                          onClick={(e) => { e.stopPropagation(); handleDeletePermanently(message.id); }}>
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
        {settings.currentView === 'list' && (
          <div className="list-view-container">
            {(() => {
              const parentCategories = settings.categories.filter(c => !c.parentId);
              const subCategoriesForActive = activeCategoryId !== 'all' ? settings.categories.filter(c => c.parentId === activeCategoryId) : [];

              const filteredWords = words.filter(word => {                
                // Category filter
                if (activeCategoryId === 'all') return true; // Show all words
                
                // Find the parent category if the active one is a sub-category
                const activeCategory = settings.categories.find(c => c.id === activeCategoryId);
                const parentId = activeCategory?.parentId || activeCategoryId;

                // Search filter
                const matchesSearch = searchQuery ? word.text.toLowerCase().includes(searchQuery.toLowerCase()) : true;
                if (!matchesSearch) return false;

                const subCategoriesForActive = settings.categories.filter(c => c.parentId === parentId);

                // If a sub-category is selected, filter by it directly
                if (activeSubCategoryId !== 'all') {
                  return word.categoryId === activeSubCategoryId;
                }

                // If 'all' sub-categories are selected for a parent, show all words in that parent and its children
                const categoryIdsToShow = [parentId, ...subCategoriesForActive.map(sc => sc.id)];
                return categoryIdsToShow.includes(word.categoryId);
              });

              const currentSortConfig = settings.prioritySortConfig?.[String(activeCategoryId)] || null;
              // Apply sorting to the filtered words
              if (currentSortConfig) {
                filteredWords.sort((a, b) => {
                  let aValue: any;
                  let bValue: any;

                  // Handle special case for 'timeOpen' which is derived from 'createdAt'
                  if (currentSortConfig.key === 'timeOpen') {
                    aValue = a.createdAt;
                    bValue = b.createdAt;
                  } else if (currentSortConfig.key === 'priority') {
                    const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
                    aValue = priorityOrder[a.priority || 'Medium'];
                    bValue = priorityOrder[b.priority || 'Medium'];
                  } else {
                    aValue = a[currentSortConfig.key as keyof Word] || 0;
                    bValue = b[currentSortConfig.key as keyof Word] || 0;
                  }

                  if (aValue < bValue) {
                    return currentSortConfig.direction === 'ascending' ? -1 : 1;
                  }
                  if (aValue > bValue) {
                    return currentSortConfig.direction === 'ascending' ? 1 : -1;
                  }
                  return 0;
                });
              }

              return (
                <>
                  <div className="category-tabs">                    
                     <button 
                      onClick={() => { setActiveCategoryId('all'); setActiveSubCategoryId('all'); setSearchQuery(''); }} 
                      className={`all-category-btn ${activeCategoryId === 'all' ? 'active' : ''}`}
                      style={{
                        backgroundColor: settings.allCategoryColor || '#4a4f5b',
                        color: getContrastColor(settings.allCategoryColor || '#4a4f5b')
                      }}
                     >
                      All ({words.length})
                    </button>
                    {parentCategories.map((cat: Category) => {
                      // Count words in parent AND its sub-categories
                      const subCatIds = settings.categories.filter(sc => sc.parentId === cat.id).map(sc => sc.id);
                      const count = words.filter(w => 
                        w.categoryId === cat.id || 
                        (w.categoryId && subCatIds.includes(w.categoryId))
                      ).length;
                      return (
                        <button 
                          key={cat.id} 
                          onClick={() => { setActiveCategoryId(cat.id); setActiveSubCategoryId('all'); setSearchQuery(''); }} 
                          className={activeCategoryId === cat.id ? 'active' : ''}
                          style={{ 
                            backgroundColor: cat.color || 'transparent', 
                            color: getContrastColor(cat.color || '#282c34') 
                          }}>
                          {cat.name} ({count})
                        </button>
                      );
                    })}
                  </div>
                  {subCategoriesForActive.length > 0 && (
                    <div className="sub-category-tabs">
                      {(() => {
                        const parentCategory = settings.categories.find(c => c.id === activeCategoryId);
                        const subCatIds = settings.categories.filter(sc => sc.parentId === parentCategory?.id).map(sc => sc.id);
                        const totalCount = words.filter(w => w.categoryId === parentCategory?.id || (w.categoryId && subCatIds.includes(w.categoryId))).length;
                        return (
                          <button 
                            onClick={() => { setActiveSubCategoryId('all'); setSearchQuery(''); }} 
                            className={`all-category-btn ${activeSubCategoryId === 'all' ? 'active' : ''}`}
                            style={{
                              backgroundColor: parentCategory?.color || '#3a3f4b',
                              color: getContrastColor(parentCategory?.color || '#3a3f4b')
                            }}
                          >All ({totalCount})</button>
                        );
                      })()}
                      {subCategoriesForActive.map(subCat => (
                        (() => {
                          const count = words.filter(w => w.categoryId === subCat.id).length;
                          return <button 
                            key={subCat.id} 
                            onClick={() => { setActiveSubCategoryId(subCat.id); setSearchQuery(''); }} 
                            className={activeSubCategoryId === subCat.id ? 'active' : ''}
                            style={{ 
                              backgroundColor: subCat.color || '#3a3f4b', 
                              color: getContrastColor(subCat.color || '#3a3f4b') 
                            }}
                          >
                            {subCat.name} ({count})
                          </button>
                        })()
                      ))}
                    </div>
                  )}
                  <div className="list-view-controls">
                    <div className="list-header-search" style={{width: '100%'}}>
                      <input 
                        ref={searchInputRef}
                        type="text" 
                        placeholder="Search tasks..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setSearchQuery('');
                          }
                        }} 
                      />
                      <button className="clear-search-btn" onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }} title="Clear Search"><i className="fas fa-times"></i></button>                      
                    </div>
                  </div>
                  {filteredWords.length > 0 ? (
                    <>
                      <div className="list-header">
                        <h3>
                          {(() => {
                            if (activeCategoryId === 'all') return 'All Open Tasks';
                            if (activeSubCategoryId !== 'all') {
                              return `${settings.categories.find(c => c.id === activeSubCategoryId)?.name || 'Sub-Category'}: Priority List`;
                            }
                        const parentCategory = settings.categories.find(c => c.id === activeCategoryId);;
                            return `${parentCategory?.name || 'Category'}: Priority List`;
                          })()} ({filteredWords.length})
                        </h3>
                        <div className="list-header-actions" onContextMenu={(e) => { e.stopPropagation(); }}>
                          <button className="icon-button" onClick={handleClearAll} title="Clear All Tasks"><i className="fas fa-trash"></i></button>
                          <button className="icon-button" onClick={handleCopyList} title="Copy Open Tasks"><i className="fas fa-copy"></i></button>
                        </div>
                        <div className="button-group">
                          <button className="icon-button" onClick={() => {
                            const allVisibleIds = filteredWords.map(w => w.id);
                            setSettings(prev => ({ ...prev, openAccordionIds: allVisibleIds }))
                          }} title="Expand All"><i className="fas fa-folder-open"></i></button>
                          <button className="icon-button" onClick={() => setSettings(prev => ({ ...prev, openAccordionIds: [] }))} title="Collapse All"><i className="fas fa-folder"></i></button>
                        </div>
                      </div>
                      <div className="list-header-sort">
                        <label>Sort by:
                          <select ref={sortSelectRef} onChange={(e) => {
                            const value = e.target.value;
                            const newSortConfig = { ...settings.prioritySortConfig };
                            if (value === 'none') {
                              newSortConfig[String(activeCategoryId)] = null;
                            } else {
                              const [key, direction] = value.split('-');
                              newSortConfig[String(activeCategoryId)] = { key: key as any, direction: direction as any };
                            }
                            setSettings(prev => ({ ...prev, prioritySortConfig: newSortConfig }));
                          }} value={currentSortConfig ? `${currentSortConfig.key}-${currentSortConfig.direction}` : 'none'}>
                            <option value="none">Default (Manual)</option>
                            <option value="completeBy-ascending">Due Date (Soonest First)</option>
                            <option value="priority-ascending">Priority (High to Low)</option>
                            <option value="openDate-descending">Open Date (Newest First)</option>
                            <option value="openDate-ascending">Open Date (Oldest First)</option>
                          </select>
                        </label>
                        {currentSortConfig && (
                          <button className="clear-sort-btn" onClick={() => { setSettings(prev => ({ ...prev, prioritySortConfig: { ...prev.prioritySortConfig, [String(activeCategoryId)]: null } })); if (sortSelectRef.current) sortSelectRef.current.value = 'none'; }} title="Clear Sort"><i className="fas fa-times"></i></button>
                        )}
                      </div>
                      <div className="priority-list-main">
                        {currentSortConfig?.key === 'completeBy' && currentSortConfig.direction === 'ascending' ? (
                          (() => {
                            const wordsByDate = filteredWords.reduce((acc, word) => {
                              // Use a consistent, sortable key for dates, and a special key for no-date items.
                              const date = word.completeBy ? new Date(word.completeBy).toISOString().split('T')[0] : '0000-no-due-date';
                              if (!acc[date]) {
                                acc[date] = [];
                              }
                              acc[date].push(word);
                              return acc;
                            }, {} as Record<string, Word[]>);
 
                            // Sort the date groups. The 'zzzz' prefix ensures 'No Due Date' comes last.
                            // Sort the date groups. The '0000' prefix ensures 'No Due Date' comes first.
                            const sortedDates = Object.keys(wordsByDate).sort();
 
                            return sortedDates.map(dateStr => {
                              const wordsOnDate = wordsByDate[dateStr];
                              // const isNoDueDate = dateStr === 'zzzz-no-due-date';
                              const isNoDueDate = dateStr === '0000-no-due-date';
                              let headerText = isNoDueDate
                                ? 'No Due Date' : getRelativeDateHeader(dateStr);
                              const taskCountText = `(${wordsOnDate.length} ${wordsOnDate.length === 1 ? 'task' : 'tasks'})`;
                              return (
                              <div key={dateStr} className="date-group-container">
                                <h4 className={`date-group-header ${isNoDueDate ? 'no-due-date-header' : ''}`}>
                                  {headerText}
                                  <span className="date-group-task-count">{taskCountText}</span>
                                </h4>
                                {wordsOnDate.map((word, index) => (
                                  // The rest of your TaskAccordion rendering logic goes here
                                  // We are now copying it from the original map below
                                  <div key={word.id} className="priority-list-item" data-word-id={word.id}>
                                    {editingWordId === word.id ? (
                                      <input
                                        type="text"
                                        value={editingText}
                                        onChange={handleEditChange}
                                        onKeyDown={(e) => handleEditKeyDown(e, word.id)}
                                        onBlur={() => setEditingWordId(null)}
                                        autoFocus
                                      />
                                    ) : (
                                      <TaskAccordion
                                        word={word}
                                        isOpen={settings.openAccordionIds.includes(word.id)}
                                        onToggle={() => handleAccordionToggle(word.id)}
                                        title={
                                          <TaskAccordionHeader
                                            word={word}
                                            settings={settings}
                                            onCategoryClick={(e, catId, parentId) => {
                                              e.stopPropagation();
                                              setActiveCategoryId(parentId || catId);
                                              // If a parentId is provided, it's a sub-category click.
                                              // If not, it's a parent category click, so reset the sub-category filter.
                                              if (parentId) {
                                                setActiveSubCategoryId(catId);
                                              } else {
                                                setActiveSubCategoryId('all');
                                              }
                                            }}
                                          />
                                      }>
                                        <>
                                          <TabbedView 
                                            startInEditMode={editingViaContext === word.id}
                                            word={word} 
                                            onTabChange={(wordId, tab) => setSettings(prev => ({
                                              ...prev,
                                              activeTaskTabs: { ...prev.activeTaskTabs, [wordId]: tab }
                                            }))}
                                            onUpdate={handleWordUpdate}
                                            onNotify={handleTimerNotify}
                                            formatTimestamp={formatTimestamp}
                                            setCopyStatus={setCopyStatus}
                                            words={words}
                                            setInboxMessages={setInboxMessages}
                                            settings={settings} 
                                            onDescriptionChange={() => {}} 
                                            onSettingsChange={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
                                            onComplete={handleChecklistCompletion}
                                            wordId={word.id}
                                            checklistRef={activeChecklistRef}
                                          />
                                          <div className="word-item-display">
                                            <span className="stopwatch date-opened">
                                              Started at: {formatTimestamp(word.createdAt)}
                                            </span>
                                            <Stopwatch word={word} onTogglePause={handleTogglePause} />
                                          </div>
                                        </>
                                        <div className="list-item-controls">
                                          <button onClick={() => {
                                            const newAutocompleteState = !word.isAutocomplete;
                                            setWords(words.map(w => w.id === word.id ? { ...w, isAutocomplete: newAutocompleteState } : w));
                                            setCopyStatus(`Autocomplete ${newAutocompleteState ? 'enabled' : 'disabled'}.`);
                                            setTimeout(() => setCopyStatus(''), 2000);
                                          }} title="Toggle Autocomplete" className={`icon-button recurring-toggle ${word.isAutocomplete ? 'active' : ''}`}>
                                            <i className="fas fa-robot"></i>
                                          </button>
                                          <Dropdown trigger={
                                            <button title="Recurring Options" className={`icon-button recurring-toggle ${word.isRecurring || word.isDailyRecurring || word.isWeeklyRecurring || word.isMonthlyRecurring || word.isYearlyRecurring ? 'active' : ''}`}>
                                              <i className="fas fa-sync-alt"></i>
                                            </button>
                                          }>
                                            <button onClick={() => handleWordUpdate({ ...word, isRecurring: !word.isRecurring })} className={word.isRecurring ? 'active' : ''}>Re-occur on Complete</button>
                                            <button onClick={() => handleWordUpdate({ ...word, isDailyRecurring: !word.isDailyRecurring })} className={word.isDailyRecurring ? 'active' : ''}>Repeat Daily</button>
                                            <button onClick={() => handleWordUpdate({ ...word, isWeeklyRecurring: !word.isWeeklyRecurring })} className={word.isWeeklyRecurring ? 'active' : ''}>Repeat Weekly</button>
                                            <button onClick={() => handleWordUpdate({ ...word, isMonthlyRecurring: !word.isMonthlyRecurring })} className={word.isMonthlyRecurring ? 'active' : ''}>Repeat Monthly</button>
                                            <button onClick={() => handleWordUpdate({ ...word, isYearlyRecurring: !word.isYearlyRecurring })} className={word.isYearlyRecurring ? 'active' : ''}>Repeat Yearly</button>
                                          </Dropdown>
                                          <button
                                            className="icon-button"
                                            title="View Full Page"
                                            onClick={(e) => { e.stopPropagation(); setFullTaskViewId(word.id); }}>
                                            <i className="fas fa-expand-arrows-alt"></i>
                                          </button>                                  
                                          <button onClick={() => handleCompleteWord(word)} className="icon-button complete-btn" title="Complete Task">
                                            <i className="fas fa-check"></i>
                                          </button>
                                          {currentSortConfig === null && (
                                            <>
                                              <button className="icon-button" onClick={() => {
                                                const targetWord = filteredWords[index - 1];
                                                if (targetWord) moveWord(word.id, targetWord.id);
                                              }} disabled={index === 0} title="Move Up"><i className="fas fa-arrow-up"></i></button>
                                              <button className="icon-button" onClick={() => {
                                                const targetWord = filteredWords[index + 1];
                                                if (targetWord) moveWord(word.id, targetWord.id);
                                              }} disabled={index === filteredWords.length - 1} title="Move Down"><i className="fas fa-arrow-down"></i></button>
                                            </>
                                          )}
                                          <button onClick={() => removeWord(word.id)} className="icon-button remove-btn" title="Delete Task">
                                            <i className="fas fa-trash"></i>
                                          </button>
                                        </div>
                                      </TaskAccordion>
                                    )}
                                  </div>
                                ))}
                              </div>
                              );
                            });
                          })()
                        ) : (filteredWords.map((word, index) => (
                          <div key={word.id} className="priority-list-item" data-word-id={word.id}>
                            {editingWordId === word.id ? (
                              <input
                                type="text"
                                value={editingText}
                                onChange={handleEditChange}
                                onKeyDown={(e) => handleEditKeyDown(e, word.id)}
                                onBlur={() => setEditingWordId(null)}
                                autoFocus
                              />
                            ) : (
                              <TaskAccordion
                                word={word}
                                isOpen={settings.openAccordionIds.includes(word.id)}
                                onToggle={() => handleAccordionToggle(word.id)}
                                title={
                                  <TaskAccordionHeader
                                    word={word}
                                    settings={settings}
                                    onCategoryClick={(e, catId, parentId) => {
                                      e.stopPropagation();
                                      setActiveCategoryId(parentId || catId);
                                      // If a parentId is provided, it's a sub-category click.
                                      // If not, it's a parent category click, so reset the sub-category filter.
                                      if (parentId) {
                                        setActiveSubCategoryId(catId);
                                      } else {
                                        setActiveSubCategoryId('all');
                                      }
                                    }} 
                                    onUpdate={handleWordUpdate}
                                    onNotify={handleTimerNotify}
                                  />
                              }>
                                <>
                                  <TabbedView 
                                    startInEditMode={editingViaContext === word.id}
                                    word={word} 
                                    onTabChange={(wordId, tab) => setSettings(prev => ({
                                      ...prev,
                                      activeTaskTabs: { ...prev.activeTaskTabs, [wordId]: tab }
                                    }))}
                                    onUpdate={handleWordUpdate}
                                    onNotify={handleTimerNotify}
                                    formatTimestamp={formatTimestamp}
                                    setCopyStatus={setCopyStatus}
                                    words={words}
                                    setInboxMessages={setInboxMessages}
                                    settings={settings} 
                                    onDescriptionChange={() => {}} 
                                    onSettingsChange={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
                                    onComplete={handleChecklistCompletion}
                                    wordId={word.id}
                                    checklistRef={activeChecklistRef}
                                  />
                                  <div className="word-item-display">
                                    <span className="stopwatch date-opened">
                                      Started at: {formatTimestamp(word.createdAt)}
                                    </span>
                                    <Stopwatch word={word} onTogglePause={handleTogglePause} />
                                  </div>
                                </>
                                <div className="list-item-controls">
                                  <button onClick={() => {
                                    const newAutocompleteState = !word.isAutocomplete;
                                    setWords(words.map(w => w.id === word.id ? { ...w, isAutocomplete: newAutocompleteState } : w));
                                    setCopyStatus(`Autocomplete ${newAutocompleteState ? 'enabled' : 'disabled'}.`);
                                    setTimeout(() => setCopyStatus(''), 2000);
                                  }} title="Toggle Autocomplete" className={`icon-button recurring-toggle ${word.isAutocomplete ? 'active' : ''}`}>
                                    <i className="fas fa-robot"></i>
                                  </button>
                                  <Dropdown trigger={
                                    <button title="Recurring Options" className={`icon-button recurring-toggle ${word.isRecurring || word.isDailyRecurring || word.isWeeklyRecurring || word.isMonthlyRecurring || word.isYearlyRecurring ? 'active' : ''}`}>
                                      <i className="fas fa-sync-alt"></i>
                                    </button>
                                  }>
                                    <button onClick={() => handleWordUpdate({ ...word, isRecurring: !word.isRecurring })} className={word.isRecurring ? 'active' : ''}>Re-occur on Complete</button>
                                    <button onClick={() => handleWordUpdate({ ...word, isDailyRecurring: !word.isDailyRecurring })} className={word.isDailyRecurring ? 'active' : ''}>Repeat Daily</button>
                                    <button onClick={() => handleWordUpdate({ ...word, isWeeklyRecurring: !word.isWeeklyRecurring })} className={word.isWeeklyRecurring ? 'active' : ''}>Repeat Weekly</button>
                                    <button onClick={() => handleWordUpdate({ ...word, isMonthlyRecurring: !word.isMonthlyRecurring })} className={word.isMonthlyRecurring ? 'active' : ''}>Repeat Monthly</button>
                                    <button onClick={() => handleWordUpdate({ ...word, isYearlyRecurring: !word.isYearlyRecurring })} className={word.isYearlyRecurring ? 'active' : ''}>Repeat Yearly</button>
                                  </Dropdown>
                                  <button
                                    className="icon-button"
                                    title="View Full Page"
                                    onClick={(e) => { e.stopPropagation(); setFullTaskViewId(word.id); }}>
                                    <i className="fas fa-expand-arrows-alt"></i>
                                  </button>                                  
                                  <button onClick={() => handleCompleteWord(word)} className="icon-button complete-btn" title="Complete Task">
                                    <i className="fas fa-check"></i>
                                  </button>
                                  {currentSortConfig === null && (
                                    <>
                                      <button className="icon-button" onClick={() => {
                                        const targetWord = filteredWords[index - 1];
                                        if (targetWord) moveWord(word.id, targetWord.id);
                                      }} disabled={index === 0} title="Move Up"><i className="fas fa-arrow-up"></i></button>
                                      <button className="icon-button" onClick={() => {
                                        const targetWord = filteredWords[index + 1];
                                        if (targetWord) moveWord(word.id, targetWord.id);
                                      }} disabled={index === filteredWords.length - 1} title="Move Down"><i className="fas fa-arrow-down"></i></button>
                                    </>
                                  )}
                                  <button onClick={() => removeWord(word.id)} className="icon-button remove-btn" title="Delete Task">
                                    <i className="fas fa-trash"></i>
                                  </button>
                                </div>
                              </TaskAccordion>
                            )}
                          </div>
                        )))}
                        <div className="add-task-row">
                          <button className="add-task-button" onClick={() => {
                            focusAddTaskInput();
                            // Prioritize the active sub-category, otherwise fall back to the parent category
                            const defaultCategoryId = activeSubCategoryId !== 'all' 
                              ? activeSubCategoryId 
                          : (activeCategoryId !== 'all' ? activeCategoryId : undefined);;

                            if (defaultCategoryId) {
                              setNewTask(prev => ({ ...prev, categoryId: defaultCategoryId }));
                            }
                          }}><i className="fas fa-plus"></i> Open Task</button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="empty-list-placeholder">
                      <h3>No Open Tasks for {(() => {
                        if (activeCategoryId === 'all') return 'any category';
                        if (activeSubCategoryId !== 'all') {
                          return settings.categories.find(c => c.id === activeSubCategoryId)?.name || 'this category';
                        }
                        const parentCategory = settings.categories.find(c => c.id === activeCategoryId);
                        return parentCategory?.name || 'this category';
                      })()}</h3>
                      <button onClick={() => {
                        focusAddTaskInput();
                        // Prioritize the active sub-category, otherwise fall back to the parent category
                        const defaultCategoryId = activeSubCategoryId !== 'all' 
                          ? activeSubCategoryId 
                          : (activeCategoryId !== 'all' ? activeCategoryId : undefined);

                        if (defaultCategoryId) {;
                          setNewTask(prev => ({ ...prev, categoryId: defaultCategoryId }));
                        }
                      }}><i className="fas fa-plus"></i> Open Task</button>
                    </div>
                  )}
                </>
              );
            })()}
            {(() => {
              const filteredCompletedWords = completedWords.filter(word => {                
                // Search filter first
                const matchesSearch = searchQuery ? word.text.toLowerCase().includes(searchQuery.toLowerCase()) : true;
                if (!matchesSearch) return false;

                // Then category filter
                if (activeCategoryId === 'all') return true;

                const activeCategory = settings.categories.find(c => c.id === activeCategoryId);
                const parentId = activeCategory?.parentId || activeCategoryId;
                const subCategoriesForActive = settings.categories.filter(c => c.parentId === parentId);

                if (activeSubCategoryId !== 'all') {
                  return word.categoryId === activeSubCategoryId;
                }

                const categoryIdsToShow = [parentId, ...subCategoriesForActive.map(sc => sc.id)];
                return categoryIdsToShow.includes(word.categoryId);
              });

              if (filteredCompletedWords.length === 0) return null;

              const totalTrackedTime = filteredCompletedWords.reduce((acc, word) => acc + (word.manualTime || 0), 0);
              const totalEarnings = filteredCompletedWords.reduce((sum, word) => {
                const hours = (word.manualTime || 0) / (1000 * 60 * 60);
                return sum + (hours * (word.payRate || 0));
              }, 0);

              const completedTitle = (() => {
                if (activeCategoryId === 'all') return 'All Completed Tasks';
                if (activeSubCategoryId !== 'all') {
                  return `${settings.categories.find(c => c.id === activeSubCategoryId)?.name || 'Sub-Category'}: Completed List`;
                }
                const parentCategory = settings.categories.find(c => c.id === activeCategoryId);
                return `${parentCategory?.name || 'Category'}: Completed List`;
              })();

              return (
              <SimpleAccordion title={(
                <>
                  {completedTitle} ({filteredCompletedWords.length})
                  <span className="accordion-title-summary">Total Time Tracked: {formatTime(totalTrackedTime)}</span>
                  <span className="accordion-title-summary">Total Earnings: ${totalEarnings.toFixed(2)}</span>
                </>
              )}>
                <div className="completed-actions">
                  <button className="icon-button" onClick={handleClearCompleted} title="Clear Completed List"><i className="fas fa-trash"></i></button>
                  <button className="icon-button" onClick={handleCopyReport} title="Copy Report"><i className="fas fa-copy"></i></button>
                </div>
                <div className="priority-list-main">
                  {filteredCompletedWords.map((word) => {
                    const title = (
                      <>
                        <div className="accordion-main-title">{word.text}</div>
                        <div className="accordion-subtitle">
                          {word.company && <span>{word.company}</span>}
                          <span>{formatTimestamp(word.openDate)}</span>
                          <span>Completed in: {formatTime(word.completedDuration ?? 0)}</span>
                        </div>
                      </>
                    );
                    return (
                      <div key={word.id} className="priority-list-item completed-item">
                        <TaskAccordion word={word} title={title} isOpen={settings.openAccordionIds.includes(word.id)} onToggle={() => handleAccordionToggle(word.id)}>
                          {/* This first child is the 'content' for the accordion */}
                          <TabbedView 
                            word={word} 
                            onTabChange={() => {}} // No tab state persistence for completed items
                            onUpdate={() => {}} // No updates for completed items, this is correct
                            onNotify={() => {}} // No notifications for completed items
                            formatTimestamp={formatTimestamp}
                            setCopyStatus={setCopyStatus}
                            onSettingsChange={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
                            onDescriptionChange={() => {}}                            
                            settings={settings}
                            words={words}
                            onComplete={handleChecklistCompletion}
                            checklistRef={activeChecklistRef}
                            wordId={word.id}
                            setInboxMessages={setInboxMessages}
                          />
                          {/* This second child is the 'headerActions' for the accordion */}
                          <div className="list-item-controls">
                            <button className="icon-button" onClick={() => handleReopenTask(word)} title="Reopen Task"><i className="fas fa-undo"></i></button>
                            <button className="icon-button" onClick={() => handleDuplicateTask(word)} title="Duplicate Task"><i className="fas fa-copy"></i></button>
                          </div>
                        </TaskAccordion>
                      </div>
                    );
                  })}
                </div>
              </SimpleAccordion>
              );
            })()}
          </div>
        )}
      </div>
      <div className={`sidebar ${settings.isSidebarVisible ? '' : 'hidden'}`}>
        <SimpleAccordion title="Add New Task" startOpen={isAddTaskOpen} onToggle={setIsAddTaskOpen}>
          <div className="new-task-form">
            {(() => {
              const selectedTaskType = (settings.taskTypes || []).find(type => type.id === newTask.taskType);
              const visibleFields = selectedTaskType ? selectedTaskType.fields : [];

              const shouldShow = (fieldName: keyof Word) => visibleFields.includes(fieldName);

              return (
                <>
            <label><h4>Task Type:</h4>
              <select value={newTask.taskType} onChange={(e) => setNewTask({ ...newTask, taskType: e.target.value })}>
                {(settings.taskTypes || []).map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </label>
                  {shouldShow('text') && <label><h4>Task Title:</h4><input ref={newTaskTitleInputRef} type="text" placeholder="Enter a title and press Enter" value={newTask.text} onChange={(e) => setNewTask({ ...newTask, text: e.target.value })} onKeyDown={handleInputKeyDown} /></label>}
                  {shouldShow('url') && <label><h4>URL:</h4><input type="text" placeholder="https://example.com" value={newTask.url} onChange={(e) => setNewTask({ ...newTask, url: e.target.value })} /></label>}
                  {shouldShow('categoryId') && <label><h4>Category:</h4>
              <select value={newTask.categoryId} onChange={(e) => setNewTask({ ...newTask, categoryId: Number(e.target.value) })}>
                <CategoryOptions categories={settings.categories} />
              </select>
                  </label>}
                  {shouldShow('priority') && <label><h4>Priority:</h4>
              <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
                  </label>}
                  {shouldShow('openDate') && <label><h4>Open Date:</h4>
              <div className="date-input-group">
                <input type="datetime-local" value={formatTimestampForInput(newTask.openDate)} onChange={(e) => setNewTask({ ...newTask, openDate: parseInputTimestamp(e.target.value) })} />
                <div className="button-group">{(() => {
                    const subtractTime = (amount: number, unit: 'minutes' | 'hours' | 'days') => {
                      const baseTime = newTask.openDate ? new Date(newTask.openDate) : new Date();
                      if (unit === 'minutes') baseTime.setMinutes(baseTime.getMinutes() - amount);
                      if (unit === 'hours') baseTime.setHours(baseTime.getHours() - amount);
                      if (unit === 'days') baseTime.setDate(baseTime.getDate() - amount);
                      setNewTask({ ...newTask, openDate: baseTime.getTime() });
                    };
                    return <><button className="icon-button" onClick={() => setNewTask({ ...newTask, openDate: undefined })} title="Clear Date"><i className="fas fa-times"></i></button>
                      <button onClick={() => setNewTask({ ...newTask, openDate: new Date().getTime() })} title="Set to Now">NOW</button>
                      <button onClick={() => { const d = new Date(newTask.openDate || Date.now()); d.setMinutes(0,0,0); setNewTask({ ...newTask, openDate: d.getTime() }); }} title="Round to Hour">:00</button>
                      <button onClick={() => subtractTime(15, 'minutes')}>-15m</button> <button onClick={() => subtractTime(30, 'minutes')}>-30m</button>
                      <button onClick={() => subtractTime(1, 'hours')}>-1h</button> <button onClick={() => subtractTime(2, 'hours')}>-2h</button>
                      <button onClick={() => subtractTime(1, 'days')}>-1d</button> <button onClick={() => subtractTime(3, 'days')}>-3d</button>
                    </>;
                  })()}
                </div>
              </div>
                  </label>}
                  {shouldShow('completeBy') && <label><h4>Complete By:</h4>
            <input type="datetime-local" value={formatTimestampForInput(newTask.completeBy)} onChange={(e) => setNewTask({ ...newTask, completeBy: parseInputTimestamp(e.target.value) })} />
              <div className="button-group">{(() => {
                  const addTime = (amount: number, unit: 'minutes' | 'hours' | 'days') => {
                    const baseTime = newTask.completeBy ? new Date(newTask.completeBy) : new Date();
                    if (unit === 'minutes') baseTime.setMinutes(baseTime.getMinutes() + amount);
                    if (unit === 'hours') baseTime.setHours(baseTime.getHours() + amount);
                    if (unit === 'days') baseTime.setDate(baseTime.getDate() + amount);
                    setNewTask({ ...newTask, completeBy: baseTime.getTime() });
                  };
                  return <><button className="icon-button" onClick={() => setNewTask({ ...newTask, completeBy: undefined })} title="Clear Date"><i className="fas fa-times"></i></button>
                    <button onClick={() => setNewTask({ ...newTask, completeBy: new Date().getTime() })} title="Set to Now">NOW</button>
                    <button onClick={() => {
                      const baseTime = newTask.completeBy ? new Date(newTask.completeBy) : new Date();
                      baseTime.setMinutes(0, 0, 0); // Set minutes, seconds, and ms to 0
                      setNewTask({ ...newTask, completeBy: baseTime.getTime() });
                    }} title="Round to Hour">:00</button>
                    <button onClick={() => addTime(15, 'minutes')}>+15m</button> <button onClick={() => addTime(30, 'minutes')}>+30m</button>
                    <button onClick={() => addTime(1, 'hours')}>+1h</button> <button onClick={() => addTime(2, 'hours')}>+2h</button>
                    <button onClick={() => addTime(1, 'days')}>+1d</button> <button onClick={() => addTime(3, 'days')}>+3d</button>
                  </>;
                })()}</div>
                  </label>}
                  {shouldShow('company') && <label><h4>Company:</h4><input type="text" value={newTask.company} onChange={(e) => setNewTask({ ...newTask, company: e.target.value })} /></label>}
                  {shouldShow('payRate') && <label><h4>Pay Rate ($/hr):</h4><input type="number" value={newTask.payRate || 0} onChange={(e) => setNewTask({ ...newTask, payRate: Number(e.target.value) })} /></label>}
                  {shouldShow('websiteUrl') && <label><h4>Website URL:</h4><input type="text" placeholder="https://company.com" value={newTask.websiteUrl} onChange={(e) => setNewTask({ ...newTask, websiteUrl: e.target.value })} /></label>}
                  {shouldShow('imageLinks') && <label><h4>Image Links:</h4>
              {(newTask.imageLinks || []).map((link, index) => (
                <div key={index} className="image-link-edit">
                  <input type="text" value={link} onChange={(e) => {
                    const newLinks = [...(newTask.imageLinks || [])];
                    newLinks[index] = e.target.value;
                    setNewTask({ ...newTask, imageLinks: newLinks });
                  }} /><button className="icon-button" onClick={() => setNewTask({ ...newTask, imageLinks: (newTask.imageLinks || []).filter((_, i) => i !== index) })}><i className="fas fa-minus"></i></button>
                </div>
              ))}
              <button className="add-link-btn" onClick={() => setNewTask({ ...newTask, imageLinks: [...(newTask.imageLinks || []), ''] })}>                <i className="fas fa-plus"></i> Add Image Link
              </button>
                  </label>}
                  {shouldShow('checklist') && <Checklist 
              sections={newTask.checklist || []} 
              onUpdate={(newSections) => setNewTask({ ...newTask, checklist: newSections })} 
              onComplete={handleChecklistCompletion} 
              isEditable={true}
              words={words}
              setInboxMessages={setInboxMessages}
              checklistRef={activeChecklistRef}
              wordId={Date.now()} // Use a temporary ID for the new task context
              setCopyStatus={setCopyStatus}
                  />}
                  {shouldShow('description') && <DescriptionEditor 
              description={newTask.description || ''} 
              onDescriptionChange={(html) => setNewTask({ ...newTask, description: html })} 
              settings={settings} 
              onSettingsChange={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
              editorKey="new-task-description"
                  />}
                  {shouldShow('attachments') && <div className="description-container">
              <strong>Attachments:</strong>
              {(newTask.attachments || []).map((file, index) => (
                <div key={index} className="attachment-edit">
                  <span className="attachment-name" title={file.path}>📄 {file.name}</span><button className="icon-button" onClick={() => setNewTask({ ...newTask, attachments: (newTask.attachments || []).filter((_, i) => i !== index) })}><i className="fas fa-minus"></i></button>
                </div>
              ))}
              <button className="add-link-btn" onClick={async () => {
                const newFile = await window.electronAPI.manageFile({ action: 'select' });
                if (newFile) {
                  setNewTask({ ...newTask, attachments: [...(newTask.attachments || []), newFile] });
                }
              }}><i className="fas fa-plus"></i> Attach File</button>
                  </div>}
                  {shouldShow('notes') && <div className="description-container">
              <strong>Notes:</strong>
              <DescriptionEditor 
                description={newTask.notes || ''} 
                onDescriptionChange={(html) => setNewTask({ ...newTask, notes: html })} 
                settings={settings} 
                onSettingsChange={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
                editorKey="new-task-notes" />
                  </div>}
                  {shouldShow('isRecurring') && <label className="checkbox-label flexed-column"><input type="checkbox" checked={newTask.isRecurring || false} onChange={(e) => setNewTask({ ...newTask, isRecurring: e.target.checked })} /><span className='checkbox-label-text'>Re-occurring Task</span></label>}
                  {shouldShow('isDailyRecurring') && <label className="checkbox-label flexed-column"><input type="checkbox" checked={newTask.isDailyRecurring || false} onChange={(e) => setNewTask({ ...newTask, isDailyRecurring: e.target.checked })} /><span className='checkbox-label-text'>Repeat Daily</span></label>}
                  {shouldShow('isWeeklyRecurring') && <label className="checkbox-label flexed-column"><input type="checkbox" checked={newTask.isWeeklyRecurring || false} onChange={(e) => setNewTask({ ...newTask, isWeeklyRecurring: e.target.checked })} /><span className='checkbox-label-text'>Repeat Weekly</span></label>}
                  {shouldShow('isMonthlyRecurring') && <label className="checkbox-label flexed-column"><input type="checkbox" checked={newTask.isMonthlyRecurring || false} onChange={(e) => setNewTask({ ...newTask, isMonthlyRecurring: e.target.checked })} /><span className='checkbox-label-text'>Repeat Monthly</span></label>}
                  {shouldShow('isYearlyRecurring') && <label className="checkbox-label flexed-column"><input type="checkbox" checked={newTask.isYearlyRecurring || false} onChange={(e) => setNewTask({ ...newTask, isYearlyRecurring: e.target.checked })} /><span className='checkbox-label-text'>Repeat Yearly</span></label>}
                  {shouldShow('isAutocomplete') && <label className="checkbox-label flexed-column"><input type="checkbox" checked={newTask.isAutocomplete || false} onChange={(e) => setNewTask({ ...newTask, isAutocomplete: e.target.checked })} /><span className='checkbox-label-text'>Autocomplete on Deadline</span></label>}
                </>
              );
            })()}
            <button onClick={() => handleInputKeyDown({ key: 'Enter' } as React.KeyboardEvent<HTMLInputElement>)}><i className="fas fa-plus"></i> Add Task
            </button>
          </div>
        </SimpleAccordion>
        <TaskTypeManager settings={settings} setSettings={setSettings} />

        <SimpleAccordion title="Global Category Settings">
          <div className="category-manager-item">
            <span>"All" Category Color:</span>
            <input
              type="color"
              value={settings.allCategoryColor || '#4a4f5b'}
              className="category-color-picker"
              onChange={(e) => setSettings(prev => ({ ...prev, allCategoryColor: e.target.value }))}
            />
            <button className="icon-button" onClick={() => setSettings(prev => ({ ...prev, allCategoryColor: undefined }))} title="Reset Color">
              <i className="fas fa-times-circle"></i>
            </button>
          </div>
        </SimpleAccordion>

        <SimpleAccordion className="accordion-category-manager" title="Category Manager">
          {settings.categories.filter(c => !c.parentId).map((parentCat: Category) => (
            <div key={parentCat.id} className="category-manager-group">
              <div className="category-manager-item parent">
                <input 
                  type="text" 
                  value={parentCat.name}
                  onChange={(e) => {
                    const newCategories = settings.categories.map(c => c.id === parentCat.id ? { ...c, name: e.target.value } : c);
                    setSettings(prev => ({ ...prev, categories: newCategories }));
                  }}
                />
                <input
                  type="color"
                  value={parentCat.color || '#555555'} // Default to gray
                  className="category-color-picker"
                  onChange={(e) => {
                    const newCategories = settings.categories.map(c => c.id === parentCat.id ? { ...c, color: e.target.value } : c);
                    setSettings(prev => ({ ...prev, categories: newCategories }));
                  }}
                />
                <button className="icon-button" onClick={() => setSettings(prev => ({ ...prev, categories: moveCategory(prev.categories, parentCat.id, 'up') }))} title="Move Up"><i className="fas fa-arrow-up"></i></button>
                <button className="icon-button" onClick={() => setSettings(prev => ({ ...prev, categories: moveCategory(prev.categories, parentCat.id, 'down') }))} title="Move Down"><i className="fas fa-arrow-down"></i></button>
                <button className="remove-link-btn" onClick={() => {
                  const subCategoryCount = settings.categories.filter(c => c.parentId === parentCat.id).length;
                  const confirmationMessage = `Are you sure you want to delete the category "${parentCat.name}"? This will also delete its ${subCategoryCount} sub-categories.`;
                  if (window.confirm(confirmationMessage)) {
                    const newCategories = settings.categories.filter(c => c.id !== parentCat.id && c.parentId !== parentCat.id);
                    setWords(words.map(w => w.categoryId === parentCat.id ? { ...w, categoryId: undefined } : w));
                    setSettings(prev => ({ ...prev, categories: newCategories }));
                  }
                }}><i className="fas fa-minus"></i></button>
                <button className="add-link-btn" onClick={() => {
                  const newSubCategory = { id: Date.now(), name: 'New Sub-Category', parentId: parentCat.id };
                  setSettings(prev => ({ ...prev, categories: [...prev.categories, newSubCategory] }));
                }} title="Add Sub-Category"><i className="fas fa-plus"></i></button>
              </div>
              {settings.categories.filter(c => c.parentId === parentCat.id).map((subCat: Category) => (
                <div key={subCat.id} className="category-manager-item sub">
                  <input 
                    type="text" 
                    value={subCat.name}
                    onChange={(e) => {
                      const newCategories = settings.categories.map(c => 
                          c.id === subCat.id ? { ...c, name: e.target.value } : c
                      );
                      setSettings(prev => ({ ...prev, categories: newCategories }));
                  }}
                  />
                  <input
                    type="color"
                    value={subCat.color || '#555555'} // Default to gray
                    className="category-color-picker"
                    onChange={(e) => {
                      const newCategories = settings.categories.map(c => c.id === subCat.id ? { ...c, color: e.target.value } : c);
                      setSettings(prev => ({ ...prev, categories: newCategories }));
                    }}
                  />
                  <button className="icon-button" onClick={() => setSettings(prev => ({ ...prev, categories: moveCategory(prev.categories, subCat.id, 'up') }))} title="Move Up"><i className="fas fa-arrow-up"></i></button>
                  <button className="icon-button" onClick={() => setSettings(prev => ({ ...prev, categories: moveCategory(prev.categories, subCat.id, 'down') }))} title="Move Down"><i className="fas fa-arrow-down"></i></button>
                  <button className="remove-link-btn" onClick={() => {
                    if (window.confirm(`Are you sure you want to delete the sub-category "${subCat.name}"?`)) {
                      const newCategories = settings.categories.filter(c => c.id !== subCat.id);
                      // Also un-categorize any words that were in this sub-category by moving them to the parent
                      setWords(words.map(w => w.categoryId === subCat.id ? { ...w, categoryId: parentCat.id } : w));
                      setSettings(prev => ({ ...prev, categories: newCategories }));
                    }
                  }}><i className="fas fa-minus"></i></button>
                </div>
              ))}
            </div>
          ))}
          <button className="add-link-btn" onClick={() => setSettings(prev => ({ ...prev, categories: [...prev.categories, { id: Date.now(), name: 'New Category' }] }))}><i className="fas fa-plus"></i> Add Category
          </button>
        </SimpleAccordion>
        <SimpleAccordion className="accordion-external-link-manager" title="External Link Manager">
          <div className="link-manager-section">
            <h4>Header Links</h4>
            {settings.externalLinks.map((link, index) => (
              <div key={index} className="external-link-manager-item">                                                
                <div className="link-manager-item">
                  <label className='flexed'>                    
                    <span>Link Name</span>
                    <input 
                      type="text" 
                      placeholder="Link Name" 
                      value={link.name} 
                      onChange={(e) => {
                        const newLinks = [...settings.externalLinks];
                        newLinks[index].name = e.target.value;
                        setSettings(prev => ({ ...prev, externalLinks: newLinks }));
                      }} 
                    />
                  </label>
                </div>
                <div className="link-manager-item">
                  <label className='flexed'>
                    <span>Link URL</span>
                    <input 
                      type="text" 
                      placeholder="https://example.com" 
                      value={link.url} 
                      onChange={(e) => {
                        const newLinks = [...settings.externalLinks];
                        newLinks[index].url = e.target.value;
                        setSettings(prev => ({ ...prev, externalLinks: newLinks }));
                      }} 
                    />
                  </label>
                </div>
                <button className="remove-link-btn" onClick={() => setSettings(prev => ({ ...prev, externalLinks: prev.externalLinks.filter((_, i) => i !== index) }))}>Remove Link</button>
                <label title="Open this link in the system's default browser, ignoring the active browser setting.">
                  <input type="checkbox" checked={link.openInDefault || false} onChange={(e) => {
                    const newLinks = [...settings.externalLinks];
                    newLinks[index].openInDefault = e.target.checked;
                    setSettings(prev => ({ ...prev, externalLinks: newLinks }));
                  }} /> <span className='checkbox-label-text' style={{fontSize: '12px'}}>Open Default</span>
                </label>

              </div>
            ))}
            <button className="add-link-btn-full" onClick={() => setSettings(prev => ({ ...prev, externalLinks: [...prev.externalLinks, { name: '', url: '', openInDefault: false }] }))}>
              <i className="fas fa-plus"></i> Add Link
            </button>
          </div>
          <div className="link-manager-section">
            <h4>Context Menu</h4>
            <label title="Use default browser for the 'Search Google' context menu action.">
              <input type="checkbox" checked={settings.useDefaultBrowserForSearch || false} onChange={(e) => {
                setSettings(prev => ({ ...prev, useDefaultBrowserForSearch: e.target.checked }));
              }} /> Open "Search Google" in default browser
            </label>
          </div>
        </SimpleAccordion>        
        <SimpleAccordion title="Time Management" startOpen={settings.openAccordionIds.includes(-2)} onToggle={(isOpen) => { const id = -2; if (isOpen) { setSettings(prev => ({ ...prev, openAccordionIds: [...prev.openAccordionIds, id] })); } else { setSettings(prev => ({ ...prev, openAccordionIds: prev.openAccordionIds.filter(i => i !== id) })); } }}>
          <label>
            Warning Time (minutes):
            <input type="number" value={settings.warningTime} onChange={(e) => setSettings(prev => ({ ...prev, warningTime: Number(e.target.value) }))} />
          </label>
          <label>
            Timer Alert Level:
            <select value={settings.timerNotificationLevel} onChange={(e) => setSettings(prev => ({ ...prev, timerNotificationLevel: e.target.value as any }))}>
              <option value="silent">Silent</option>
              <option value="low">Low (Once at 15m)</option>
              <option value="medium">Medium (Every 15m in last hour)</option>
              <option value="high">High (Hourly + every 15m in last hour)</option>
            </select>
          </label>
          <label>
            Snooze Time:
            <select ref={snoozeTimeSelectRef} value={settings.snoozeTime} onChange={(e) => setSettings(prev => ({ ...prev, snoozeTime: e.target.value as any }))}>
              <option value="low">Low (1 minute)</option>
              <option value="medium">Medium (5 minutes)</option>
              <option value="high">High (10 minutes)</option>
            </select>
            <p style={{ fontSize: '12px', margin: '0' }}>How long to hide an overdue alert when you click "Snooze".</p>
          </label>
        </SimpleAccordion>

        {/* Moved Bulk Add and Project Actions to be globally available */}
        <SimpleAccordion title="Bulk Add">
          <textarea
            placeholder="Paste comma-separated words here..."
            value={bulkAddText}
            onChange={(e) => setBulkAddText(e.target.value)}
            rows={3}
          />
          <button onClick={handleBulkAdd}>Add Words</button>
        </SimpleAccordion>
        <SimpleAccordion title="Project Actions">
          <div className='button-group'>
            <button onClick={handleExport}>Export Project</button>
            <button onClick={handleImport}>Import Project</button>
          </div>
        </SimpleAccordion>
        <BackupManager 
          setCopyStatus={setCopyStatus} 
          words={words} 
          completedWords={completedWords} 
          settings={settings} 
          onSettingsChange={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))} 
          isPromptOpen={isPromptOpen}
          setIsPromptOpen={setIsPromptOpen} onRestore={(data) => {
          // This logic is similar to handleImport
          setWords(data.words || []);
          setCompletedWords(data.completedWords || []);
          setSettings(prev => ({ ...defaultSettings, ...data.settings }));
          if (data.inboxMessages) setInboxMessages(data.inboxMessages);
            setCopyStatus('Backup restored successfully!');
            setTimeout(() => setCopyStatus(''), 2000);
        }} />

        {settings.currentView === 'meme' && (
          <>
            <h2>Settings</h2>
            <button onClick={handleResetSettings}>Reset All Settings</button>
            <SimpleAccordion title="Overlay Settings">
              <label className="checkbox-label flexed-column">
                <input type="checkbox" checked={settings.isOverlayEnabled} onChange={(e) => setSettings(prev => ({ ...prev, isOverlayEnabled: e.target.checked }))} />
                <span className='checkbox-label-text'>Enable Overlay</span>
              </label>
              {settings.isOverlayEnabled && (
                <>
                  <label>
                    Overlay Color:
                    <input type="color" value={settings.overlayColor} onChange={(e) => setSettings(prev => ({ ...prev, overlayColor: e.target.value }))} />
                  </label>
                  <label>
                    Overlay Opacity: {Math.round(settings.overlayOpacity * 100)}%
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.overlayOpacity}
                      onChange={(e) => setSettings(prev => ({ ...prev, overlayOpacity: Number(e.target.value) }))}
                    />
                  </label>
                </>
              )}
            </SimpleAccordion>
            <SimpleAccordion title="General Settings">
              <label>
                Font Family:
                <input
                  type="text"
                  value={settings.fontFamily}
                  onChange={(e) => setSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
                />
              </label>
              <label>
                Font Color:
                <input type="color" value={settings.fontColor} onChange={(e) => setSettings(prev => ({ ...prev, fontColor: e.target.value }))} />
              </label>
              <label>
                Font Scale:
                <div className="button-group">
                  <button onClick={() => handleFontScaleChange('small')}>Small</button>
                  <button onClick={() => handleFontScaleChange('medium')}>Medium</button>
                  <button onClick={() => handleFontScaleChange('large')}>Large</button>
                </div>
              </label>
              <label className="checkbox-label flexed-column">
                <input type="checkbox" checked={settings.isDebugModeEnabled} onChange={(e) => setSettings(prev => ({ ...prev, isDebugModeEnabled: e.target.checked }))} />
                <span className='checkbox-label-text'>Debug Mode</span>
              </label>
              <button onClick={handleSaveImage}>Save Image</button>
            </SimpleAccordion>

            <SimpleAccordion title="Shadow Settings">
              <button onClick={applyDefaultShadow}>Apply Default Shadow</button>
              <button onClick={resetShadow}>Reset Shadow</button>
              <label>
                Shadow Color:
                <input type="color" value={settings.shadowColor} onChange={(e) => setSettings(prev => ({ ...prev, shadowColor: e.target.value }))} />
              </label>
              <label>
                Shadow Blur: {settings.shadowBlur}px
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={settings.shadowBlur}
                  onChange={(e) => setSettings(prev => ({ ...prev, shadowBlur: Number(e.target.value) }))}
                />
              </label>
              <label>
                Offset X: {settings.shadowOffsetX}px
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={settings.shadowOffsetX}
                  onChange={(e) => setSettings(prev => ({ ...prev, shadowOffsetX: Number(e.target.value) }))}
                />
              </label>
              <label>
                Offset Y: {settings.shadowOffsetY}px
                <input type="range" min="-50" max="50" value={settings.shadowOffsetY} onChange={(e) => setSettings(prev => ({ ...prev, shadowOffsetY: Number(e.target.value) }))} />
              </label>
            </SimpleAccordion>
          </>
        )}
      </div>
    </div>
  );
}

function TaskTypeManager({ settings, setSettings }: { settings: Settings, setSettings: React.Dispatch<React.SetStateAction<Settings>> }) {
  const allPossibleFields: (keyof Word)[] = [
    'text', 'url', 'priority', 'categoryId', 'openDate', 'completeBy', 'company', 'websiteUrl', 'imageLinks', 'payRate', 'isRecurring', 'isDailyRecurring', 'isWeeklyRecurring', 'isMonthlyRecurring', 'isYearlyRecurring', 'isAutocomplete', 'description', 'attachments', 'checklist', 'notes'
  ];

  const handleUpdateTaskType = (updatedType: TaskType) => {
    const newTypes = (settings.taskTypes || []).map(t => t.id === updatedType.id ? updatedType : t);
    setSettings(prev => ({ ...prev, taskTypes: newTypes }));
  };

  const handleAddTaskType = () => {
    const newType: TaskType = {
      id: `custom-${Date.now()}`,
      name: 'New Task Type',
      fields: ['text', 'priority', 'completeBy'], // A sensible default
    };
    const newTypes = [...(settings.taskTypes || []), newType];
    setSettings(prev => ({ ...prev, taskTypes: newTypes }));
  };

  const handleDeleteTaskType = (typeId: string) => {
    if (window.confirm('Are you sure you want to delete this task type?')) {
      const newTypes = (settings.taskTypes || []).filter(t => t.id !== typeId);
      setSettings(prev => ({ ...prev, taskTypes: newTypes }));
    }
  };

  const handleFieldToggle = (typeId: string, fieldName: keyof Word) => {
    const taskType = (settings.taskTypes || []).find(t => t.id === typeId);
    if (!taskType) return;

    const newFields = taskType.fields.includes(fieldName)
      ? taskType.fields.filter(f => f !== fieldName)
      : [...taskType.fields, fieldName];

    handleUpdateTaskType({ ...taskType, fields: newFields });
  };

  return (
    <SimpleAccordion title="Task Type Manager">
      {(settings.taskTypes || []).map(type => (
        <div key={type.id} className="category-manager-group">
          <div className="category-manager-item parent">
            <input
              type="text"
              value={type.name}
              onChange={(e) => handleUpdateTaskType({ ...type, name: e.target.value })}
              disabled={type.id === 'default'} // Don't allow renaming the default type
            />
            {type.id !== 'default' && (
              <button className="remove-link-btn" onClick={() => handleDeleteTaskType(type.id)}>
                <i className="fas fa-minus"></i>
              </button>
            )}
          </div>
          <div className="task-type-fields">
            {allPossibleFields.map(field => (
              <label key={field} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={type.fields.includes(field)}
                  onChange={() => handleFieldToggle(type.id, field)}
                />
                <span className="checkbox-label-text">{field}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      <button className="add-link-btn" onClick={handleAddTaskType}>
        <i className="fas fa-plus"></i> Add Task Type
      </button>
    </SimpleAccordion>
  );
}

function CategoryOptions({ categories }: { categories: Category[] }) {
  const parentCategories = categories.filter(c => !c.parentId);

  return (
    <>
      {parentCategories.map(parent => {
        const children = categories.filter(sub => sub.parentId === parent.id);
        return (
          <React.Fragment key={parent.id}>
            <option value={parent.id}>{parent.name}</option>
            {children.map(child => <option key={child.id} value={child.id}>&nbsp;&nbsp;{child.name}</option>)}
          </React.Fragment>
        )})}
    </>
  );
}

const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, payload } = props;
  const { name } = payload;

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6; // Adjust label position
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

function ReportsView({ completedWords, categories, setCopyStatus }: { completedWords: Word[], categories: Category[], setCopyStatus: (message: string) => void }) {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState('summary');
  const [activeCategoryId, setActiveCategoryId] = useState<number | 'all'>('all');
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<number | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Word | 'earnings' | 'categoryName' | 'completionDate', direction: 'ascending' | 'descending' } | null>({ key: 'completionDate', direction: 'descending' });

  const [historyCount, setHistoryCount] = useState<number>(20);

  // First, filter by date range
  const dateFilteredWords = completedWords.filter(word => {
    if (!word.completedDuration) return false;
    const completionTime = word.createdAt + word.completedDuration;
    const start = startDate ? new Date(startDate).getTime() : 0;
    // Set end date to the end of the selected day
    const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
    return completionTime >= start && completionTime <= end;
  });

  // Then, filter by the selected category
  const filteredCompletedWords = dateFilteredWords.filter(word => {
    if (activeCategoryId === 'all') return true;

    const activeCategory = categories.find(c => c.id === activeCategoryId);
    const parentId = activeCategory?.parentId || activeCategoryId;
    const subCategoriesForActive = categories.filter(c => c.parentId === parentId);

    if (activeSubCategoryId !== 'all') return word.categoryId === activeSubCategoryId;

    const categoryIdsToShow = [parentId, ...subCategoriesForActive.map(sc => sc.id)];
    return categoryIdsToShow.includes(word.categoryId);
  });

  // Then, sort the data for the table
  const sortedFilteredWords = React.useMemo(() => {
    let sortableItems = [...filteredCompletedWords];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'earnings') {
          aValue = ((a.manualTime || 0) / (1000 * 60 * 60)) * (a.payRate || 0);
          bValue = ((b.manualTime || 0) / (1000 * 60 * 60)) * (b.payRate || 0);
        } else if (sortConfig.key === 'categoryName') {
          aValue = categories.find(c => c.id === a.categoryId)?.name || 'Uncategorized';
          bValue = categories.find(c => c.id === b.categoryId)?.name || 'Uncategorized';
        } else if (sortConfig.key === 'completionDate') {
          aValue = a.createdAt + (a.completedDuration || 0);
          bValue = b.createdAt + (b.completedDuration || 0);
        } else {
          aValue = a[sortConfig.key as keyof Word];
          bValue = b[sortConfig.key as keyof Word];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredCompletedWords, sortConfig, categories]);

  // Calculate grand total earnings from ALL completed words, ignoring filters
  const grandTotalEarnings = completedWords.reduce((sum, word) => {
    const hours = (word.manualTime || 0) / (1000 * 60 * 60);
    return sum + (hours * (word.payRate || 0));
  }, 0);

  // Calculate grand total tasks from ALL completed words, ignoring filters
  const grandTotalTasks = completedWords.length;

  // Calculate grand total time tracked from ALL completed words, ignoring filters
  const grandTotalTimeTracked = completedWords.reduce((sum, word) => sum + (word.manualTime || 0), 0);

  if (filteredCompletedWords.length === 0) {
    return (
      <div className="reports-view">
        <h2>Reports</h2>
        <div className="report-section grand-total-summary">
          <h3>Lifetime Summary</h3>
          <p><strong>Total Tasks Completed (All Time):</strong> {grandTotalTasks}</p>
          <p><strong>Total Time Tracked (All Time):</strong> {formatTime(grandTotalTimeTracked)}</p>
          <p><strong>Grand Total Earnings (All Time):</strong> ${grandTotalEarnings.toFixed(2)}</p></div>
        <hr />
        {/* Keep filters visible even when there's no data */}
        <ReportFilters startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} onExportCsv={() => {}} exportDisabled={true} categories={categories} activeCategoryId={activeCategoryId} setActiveCategoryId={setActiveCategoryId} activeSubCategoryId={activeSubCategoryId} setActiveSubCategoryId={setActiveSubCategoryId} dateFilteredWords={dateFilteredWords} />
        <p>No completed tasks in the selected date range to generate a report from.</p>
      </div>
    );
  }

  // --- Data Processing ---

  // 1. Tasks completed per day
  const completionsByDay = filteredCompletedWords.reduce((acc, word) => {
    const completionDate = new Date(word.createdAt + (word.completedDuration || 0)).toLocaleDateString();
    acc[completionDate] = (acc[completionDate] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 2. Task completion frequency by name
  const completionsByName = filteredCompletedWords.reduce((acc, word) => {
    acc[word.text] = (acc[word.text] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 3. Task completion by category
  const completionsByCategory = filteredCompletedWords.reduce((acc, word) => {
    const category = categories.find(c => c.id === word.categoryId);
    const categoryName = category?.name || 'Uncategorized';
    acc[categoryName] = (acc[categoryName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxCompletionsByCategory = Math.max(...Object.values(completionsByCategory), 1);
  const maxCompletionsByDay = Math.max(...Object.values(completionsByDay), 1);

  // 4. Aggregate stats
  const totalTasksCompleted = filteredCompletedWords.length;
  const totalTimeTracked = filteredCompletedWords.reduce((sum, word) => sum + (word.manualTime || 0), 0);
  const totalEarnings = filteredCompletedWords.reduce((sum, word) => {
    const hours = (word.manualTime || 0) / (1000 * 60 * 60);
    return sum + (hours * (word.payRate || 0));
  }, 0);

  // 5. Earnings by category
  const earningsByCategory = filteredCompletedWords.reduce((acc, word) => {
    const category = categories.find(c => c.id === word.categoryId);
    const categoryName = category?.name || 'Uncategorized';
    const hours = (word.manualTime || 0) / (1000 * 60 * 60);
    const earnings = hours * (word.payRate || 0);
    acc[categoryName] = (acc[categoryName] || 0) + earnings;
    return acc;
  }, {} as Record<string, number>);

  // 6. Earnings over time
  const earningsOverTime = filteredCompletedWords.reduce((acc, word) => {
    const completionDate = new Date(word.createdAt + (word.completedDuration || 0)).toLocaleDateString();
    const hours = (word.manualTime || 0) / (1000 * 60 * 60);
    const earnings = hours * (word.payRate || 0);
    acc[completionDate] = (acc[completionDate] || 0) + earnings;
    return acc;
  }, {} as Record<string, number>);
  const chartDataEarnings = Object.entries(earningsOverTime).map(([date, earnings]) => ({ date, earnings })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 7. Data for the activity bar chart based on the filtered date range
  const activityByDay = filteredCompletedWords.reduce((acc, word) => {
    if (word.completedDuration) {
      const completionDate = new Date(word.createdAt + word.completedDuration).toLocaleDateString();
      acc[completionDate] = (acc[completionDate] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const activityChartData = Object.entries(activityByDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Determine the title for the activity chart
  let activityChartTitle = 'Activity Over Time';
  if (startDate && endDate) {
    activityChartTitle = `Activity from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
  } else if (startDate) {
    activityChartTitle = `Activity since ${new Date(startDate).toLocaleDateString()}`;
  } else if (endDate) {
    activityChartTitle = `Activity until ${new Date(endDate).toLocaleDateString()}`;
  }

  const handleExportCsv = () => {
    const header = [
      "Task ID", "Task Name", "Category", "Company", 
      "Open Date", "Completion Date", "Time Tracked (HH:MM:SS)", 
      "Pay Rate ($/hr)", "Earnings ($)"
    ];

    const rows = filteredCompletedWords.map(word => {
      const category = categories.find(c => c.id === word.categoryId);
      const categoryName = category?.name || 'Uncategorized';
      const completionTime = word.createdAt + (word.completedDuration || 0);
      const earnings = (((word.manualTime || 0) / (1000 * 60 * 60)) * (word.payRate || 0)).toFixed(2);

      // Escape commas in text fields to prevent CSV corruption
      const escapeCsv = (str: string | undefined) => `"${(str || '').replace(/"/g, '""')}"`;

      return [
        word.id,
        escapeCsv(word.text),
        escapeCsv(categoryName),
        escapeCsv(word.company),
        formatTimestamp(word.openDate),
        formatTimestamp(completionTime),
        formatTime(word.manualTime || 0),
        word.payRate || 0,
        earnings
      ].join(',');
    });
    window.electronAPI.saveCsv([header.join(','), ...rows].join('\n'));
  };

  const requestSort = (key: keyof Word | 'earnings' | 'categoryName' | 'completionDate') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof Word | 'earnings' | 'categoryName' | 'completionDate') => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };
  return (
    <div className="reports-view">
      <h2>Reports</h2>

      <div className="category-tabs report-main-tabs">
        <button onClick={() => setActiveTab('summary')} className={activeTab === 'summary' ? 'active' : ''}>Summary</button>
        <button onClick={() => setActiveTab('earnings')} className={activeTab === 'earnings' ? 'active' : ''}>Earnings</button>
        <button onClick={() => setActiveTab('activity')} className={activeTab === 'activity' ? 'active' : ''}>Activity</button>
        <button onClick={() => setActiveTab('raw')} className={activeTab === 'raw' ? 'active' : ''}>Raw Data</button>
        <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'active' : ''}>History</button>
      </div>

      <div className="report-section grand-total-summary">
        <h3>Lifetime Summary</h3>
        <p><strong>Total Tasks Completed (All Time):</strong> {grandTotalTasks}</p>
        <p><strong>Total Time Tracked (All Time):</strong> {formatTime(grandTotalTimeTracked)}</p>
        <p><strong>Grand Total Earnings (All Time):</strong> ${grandTotalEarnings.toFixed(2)}</p>
      </div>

      <hr />

      <ReportFilters 
        startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} 
        onExportCsv={handleExportCsv} categories={categories} activeCategoryId={activeCategoryId} 
        setActiveCategoryId={setActiveCategoryId} activeSubCategoryId={activeSubCategoryId} setActiveSubCategoryId={setActiveSubCategoryId} dateFilteredWords={dateFilteredWords} 
      />
      {/* The old filter div is now replaced by the ReportFilters component. The content below is now conditionally rendered based on the active tab. */}
      {/* <div className="report-filters">
        <label>
          Start Date:
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          End Date:
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <button onClick={() => { setStartDate(''); setEndDate(''); }} className="clear-filter-btn">
          Clear Filter
        </button>
        <button onClick={handleExportCsv} className="export-csv-btn">
          Export to CSV
        </button>
      </div> */}
      
      {activeTab === 'summary' && (
        <>
          <div className="report-section">
            <h3>Overall Summary (Filtered)</h3>
            <p><strong>Total Tasks Completed:</strong> {totalTasksCompleted}</p>
            <p><strong>Total Time Tracked:</strong> {formatTime(totalTimeTracked)}</p>
            <p><strong>Total Earnings:</strong> ${totalEarnings.toFixed(2)}</p>
          </div>
          <div className="report-section">
            <h3>{activityChartTitle}</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={activityChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    formatter={(value: number) => [`${value} tasks`, 'Completed']}
                    labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'earnings' && (
        <>
          <div className="report-section">
            <h3>Earnings by Category</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={Object.entries(earningsByCategory).map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(earningsByCategory).map(([name], index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="report-section">
            <h3>Earnings Over Time</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={chartDataEarnings} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Earnings']}
                    labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="earnings" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'activity' && (
        <>
          <div className="report-section">
            <h3>Completed Tasks by Category</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={Object.entries(completionsByCategory).map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#82ca9d"
                    dataKey="value"
                  >
                    {Object.entries(completionsByCategory).map(([name], index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 45 + 120}, 60%, 50%)`} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value} tasks`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <div className="report-section">
          <div className="report-section-header">
            <h3>Recent Task History</h3>
            <label className="history-count-control">
              Show:
              <input type="number" value={historyCount} onChange={(e) => setHistoryCount(Number(e.target.value))} min="1" />
              most recent
            </label>
          </div>
          <table className="report-table">
            <thead>
              <tr>
                <th>Task Name</th>
                <th onClick={() => requestSort('categoryName')}>Category{getSortIndicator('categoryName')}</th>
                <th>Completion Date</th>
                <th onClick={() => requestSort('manualTime')}>Time Tracked{getSortIndicator('manualTime')}</th>
                <th onClick={() => requestSort('earnings')}>Earnings{getSortIndicator('earnings')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedFilteredWords.slice(0, 20).map(word => {
                const category = categories.find(c => c.id === word.categoryId);
                const categoryName = category?.name || 'Uncategorized';                
                const completionTime = word.createdAt + (word.completedDuration || 0);
                const earnings = (((word.manualTime || 0) / (1000 * 60 * 60)) * (word.payRate || 0));
                return (
                  <tr key={word.id}>
                    <td>
                      <span className="link-with-copy">
                        {word.text}
                        <button className="copy-btn" title="Copy Row Data" onClick={() => {
                          const rowData = [word.text, categoryName, formatTimestamp(completionTime), formatTime(word.manualTime || 0), `$${earnings.toFixed(2)}`].join('\t');
                          navigator.clipboard.writeText(rowData).then(() => setCopyStatus('Row data copied!'));
                        }}><i className="fas fa-copy"></i></button>;
                      </span>
                    </td>
                    <td>{categoryName}</td>
                    <td>{formatTimestamp(completionTime)}</td>
                    <td>{formatTime(word.manualTime || 0)}</td>
                    <td>${earnings.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {activeTab === 'raw' && (
        <>
          <div className="report-section">
            <h3>Completions per Day</h3>
            <div className="chart-container">
              {Object.entries(completionsByDay).map(([date, count]) => (
                <div key={date} className="chart-bar-item">
                  <span className="chart-label">{date}</span>
                  <div className="chart-bar-wrapper">
                    <div className="chart-bar" style={{ width: `${(count / maxCompletionsByDay) * 100}%` }}></div>
                  </div>
                  <span className="chart-value">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="report-section">
            <h3>Completions by Category</h3>
            <div className="chart-container">
              {Object.entries(completionsByCategory).sort(([, a], [, b]) => b - a).map(([name, count]) => (
                <div key={name} className="chart-bar-item">
                  <span className="chart-label">{name}</span>
                  <div className="chart-bar-wrapper">
                    <div className="chart-bar" style={{ width: `${(count / maxCompletionsByCategory) * 100}%` }}></div>
                  </div>
                  <span className="chart-value">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="report-section">
            <h3>Most Completed Tasks</h3>
            <ul>
              {Object.entries(completionsByName).sort(([, a], [, b]) => b - a).slice(0, 15).map(([name, count]) => (
                <li key={name}>{name}: {count} time(s)</li>
              ))}
            </ul>
          </div>

          <div className="report-section">
            <h3>Filtered Task Data</h3>
            <div className="report-section-actions">
              <button onClick={() => {
                const header = ["Task Name", "Category", "Completion Date", "Time Tracked (HH:MM:SS)", "Earnings ($)"].join('\t');
                const rows = sortedFilteredWords.map(word => {
                  const category = categories.find(c => c.id === word.categoryId)?.name || 'Uncategorized';
                  const completionTime = formatTimestamp(word.createdAt + (word.completedDuration || 0));
                  const timeTracked = formatTime(word.manualTime || 0);
                  const earnings = (((word.manualTime || 0) / (1000 * 60 * 60)) * (word.payRate || 0)).toFixed(2);
                  return [word.text, category, completionTime, timeTracked, earnings].join('\t');
                });
                const tableText = [header, ...rows].join('\n');
                navigator.clipboard.writeText(tableText).then(() => {
                  setCopyStatus('Table data copied!');
                  setTimeout(() => setCopyStatus(''), 2000);
                });
              }}>Copy Table</button>
            </div>
            <table className="report-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort('text')}>Task Name{getSortIndicator('text')}</th>
                  <th onClick={() => requestSort('categoryName')}>Category{getSortIndicator('categoryName')}</th>
                  <th onClick={() => requestSort('completionDate')}>Completion Date{getSortIndicator('completionDate')}</th>
                  <th onClick={() => requestSort('manualTime')}>Time Tracked{getSortIndicator('manualTime')}</th>
                  <th onClick={() => requestSort('earnings')}>Earnings{getSortIndicator('earnings')}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedFilteredWords.map(word => {
                  const category = categories.find(c => c.id === word.categoryId);
                  const categoryName = category?.name || 'Uncategorized';
                  const completionTime = word.createdAt + (word.completedDuration || 0);
                  const earnings = (((word.manualTime || 0) / (1000 * 60 * 60)) * (word.payRate || 0));

                  return (
                    <tr key={word.id}>
                      <td>{word.text}</td>
                      <td>{categoryName}</td>
                      <td>{formatTimestamp(completionTime)}</td>
                      <td>{formatTime(word.manualTime || 0)}</td>
                      <td>${earnings.toFixed(2)}</td>
                      <td>
                        <button className="copy-btn" title="Copy Row" onClick={() => {
                          const rowData = [word.text, categoryName, formatTimestamp(completionTime), formatTime(word.manualTime || 0), `$${earnings.toFixed(2)}`].join('\t');;
                          navigator.clipboard.writeText(rowData);;
                          setCopyStatus('Row copied!');
                          setTimeout(() => {
                            setCopyStatus('');
                          }, 2000);
                        }}>📋</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function ReportFilters({ startDate, setStartDate, endDate, setEndDate, onExportCsv, exportDisabled = false, categories, activeCategoryId, setActiveCategoryId, activeSubCategoryId, setActiveSubCategoryId, dateFilteredWords }: {
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  onExportCsv: () => void;
  exportDisabled?: boolean;
  categories: Category[];
  activeCategoryId: number | 'all';
  setActiveCategoryId: (id: number | 'all') => void;
  activeSubCategoryId: number | 'all';
  setActiveSubCategoryId: (id: number | 'all') => void;
  dateFilteredWords: Word[];
}) {
  const parentCategories = categories.filter(c => !c.parentId);
  const subCategoriesForActive = activeCategoryId !== 'all' ? categories.filter(c => c.parentId === activeCategoryId) : [];

  return (
    <>
      <div className="report-filters">
        <label>
          Start Date:
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          End Date:
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <button onClick={() => { setStartDate(''); setEndDate(''); }} className="clear-filter-btn">
          Clear Filter
        </button>
        <button onClick={onExportCsv} className="export-csv-btn" disabled={exportDisabled}>
          Export to CSV
        </button>
      </div>
      <div className="category-tabs">
        <button onClick={() => { setActiveCategoryId('all'); setActiveSubCategoryId('all'); }} className={activeCategoryId === 'all' ? 'active' : ''}>
          All ({dateFilteredWords.length})
        </button>
        {parentCategories.map((cat: Category) => {
          const subCatIds = categories.filter(sc => sc.parentId === cat.id).map(sc => sc.id);
          const count = dateFilteredWords.filter(w => w.categoryId === cat.id || (w.categoryId && subCatIds.includes(w.categoryId))).length;
          return (
            <button key={cat.id} onClick={() => { setActiveCategoryId(cat.id); setActiveSubCategoryId('all'); }} className={activeCategoryId === cat.id ? 'active' : ''}>
              {cat.name} ({count})
            </button>
          );
        })}
      </div>
      {subCategoriesForActive.length > 0 && (
        <div className="sub-category-tabs">
          {(() => {
            const parentCategory = categories.find(c => c.id === activeCategoryId);
            const subCatIds = categories.filter(sc => sc.parentId === parentCategory?.id).map(sc => sc.id);
            const totalCount = dateFilteredWords.filter(w => w.categoryId === parentCategory?.id || (w.categoryId && subCatIds.includes(w.categoryId))).length;
            return (
              <button onClick={() => setActiveSubCategoryId('all')} className={activeSubCategoryId === 'all' ? 'active' : ''}>All ({totalCount})</button>
            );
          })()}
          {subCategoriesForActive.map(subCat => {
            const count = dateFilteredWords.filter(w => w.categoryId === subCat.id).length;
            return <button key={subCat.id} onClick={() => setActiveSubCategoryId(subCat.id)} className={activeSubCategoryId === subCat.id ? 'active' : ''}>
              {subCat.name} ({count})
            </button>
          })}
        </div>
      )}
    </>
  );
}

// Create a root element for React to mount into
const rootElement = document.createElement('div');
rootElement.id = 'root';
document.body.appendChild(rootElement);

const root = createRoot(rootElement);
root.render(<React.StrictMode><App /></React.StrictMode>);