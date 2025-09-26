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
    showTaskContextMenu: (payload: { wordId: number, x: number, y: number, isInEditMode: boolean, hasCompletedTasks: boolean }) => void;
    showSelectionContextMenu: (payload: { selectionText: string, x: number, y: number }) => void;
    showToastContextMenu: (payload: { wordId: number, x: number, y: number, isInEditMode: boolean }) => void;
    showInboxItemContextMenu: (payload: { message: InboxMessage, x: number, y: number }) => void;
    showNavButtonContextMenu: (payload: { x: number, y: number, canGoBack: boolean, canGoForward: boolean }) => void;
    showSaveButtonContextMenu: (payload: { x: number, y: number }) => void;
    showChecklistSectionContextMenu: (payload: { wordId: number, sectionId: number, areAllComplete: boolean, isSectionOpen: boolean, isNotesHidden: boolean, isResponsesHidden: boolean, x: number, y: number, isInEditMode: boolean, isConfirmingDelete: boolean }) => void;
    showChecklistMainHeaderContextMenu: (payload: { wordId: number, sectionId: number, areAllComplete: boolean, isSectionOpen: boolean, isNotesHidden: boolean, isResponsesHidden: boolean, x: number, y: number, isInEditMode: boolean, isConfirmingDelete: boolean }) => void;
    showChecklistItemContextMenu: (payload: { wordId: number, sectionId: number, itemId: number, isCompleted: boolean, hasNote: boolean, hasResponse: boolean, hasUrl: boolean, isInEditMode: boolean, x: number, y: number }) => void;
    showChecklistNoteContextMenu: (payload: { sectionId: number, itemId: number, hasUrl: boolean, hasNote: boolean, x: number, y: number }) => void;
    showChecklistResponseContextMenu: (payload: { sectionId: number, itemId: number, hasUrl: boolean, hasResponse: boolean, x: number, y: number }) => void;
    showTimeLogItemContextMenu: (payload: { entry: TimeLogEntry, index: number, totalEntries: number, x: number, y: number }) => void;
    showTimeLogHeaderContextMenu: (payload: { totalTime: number, timeLog: TimeLogEntry[], x: number, y: number }) => void;
    showTimeLogSessionContextMenu: (payload: { session: TimeLogSession, x: number, y: number }) => void;
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
  dueDate?: number; // Timestamp for individual due date
  highlightColor?: string;
}

interface TimeLogEntry {
  id: number;
  description: string;
  duration: number; // in milliseconds
  startTime?: number; // timestamp for when it started running
  isRunning?: boolean;
  createdAt?: number; // Timestamp for when the entry was created
}

interface TimeLogSession {
  id: number;
  title: string;
  entries: TimeLogEntry[];
  createdAt?: number; // Timestamp for when the session was created
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
  startsTaskIdOnComplete?: number; // ID of the task to start when this one is completed
  manualTimeStart?: number; // Timestamp when manual timer was started
  timeLog?: TimeLogEntry[];
  timeLogSessions?: TimeLogSession[];
  timeLogTitle?: string;
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
  openChecklistSectionIds?: number[]; // New setting to store open/collapsed checklist sections
  showChecklistResponses?: boolean; // New setting to toggle response visibility
  showChecklistNotes?: boolean; // New setting to toggle note visibility
  allCategoryColor?: string;
}


interface AccordionProps {
  title: React.ReactNode;
  children: React.ReactNode;
}

interface TabbedViewProps {
  word: Word;
  onUpdate: (updatedWord: Word) => void;
  onWordUpdate: (updatedWord: Word) => void; // Add this prop
  onTabChange: (wordId: number, tab: 'ticket' | 'edit') => void;
  onNotify: (word: Word) => void;
  formatTimestamp: (ts: number) => string;
  showToast: (message: string, duration?: number) => void;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  onDescriptionChange: (html: string) => void;
  settings: Settings; // Pass down settings for browser selection
  startInEditMode?: boolean;
  words: Word[]; // Add words to props
  completedWords: Word[];
  onComplete: (item: ChecklistItem, sectionId: number, updatedSections: ChecklistSection[]) => void; // Add this prop
  setInboxMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>; // Add setInboxMessages to props
  className?: string;
  wordId: number;
  checklistRef?: React.MutableRefObject<{ handleUndo: () => void; handleRedo: () => void; }>;
  focusChecklistItemId: number | null;
  setFocusChecklistItemId: (id: number | null) => void;
}

interface FullTaskViewProps {
  task: Word;
  onClose: () => void;
  onWordUpdate: (updatedWord: Word) => void;
  onUpdate: (updatedWord: Word) => void;
  onNotify: (word: Word) => void;
  formatTimestamp: (ts: number) => string;
  showToast: (message: string, duration?: number) => void;
  settings: Settings;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  words: Word[];
  setInboxMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
  onComplete: (item: ChecklistItem, sectionId: number, updatedSections: ChecklistSection[]) => void;
  onTabChange: (wordId: number, tab: 'ticket' | 'edit') => void;
  onDescriptionChange: (html: string) => void; // Add the missing prop
  focusChecklistItemId: number | null;
  setFocusChecklistItemId: (id: number | null) => void;
  completedWords: Word[];
}

function FullTaskView({ task, onClose, showToast, onWordUpdate, ...props }: FullTaskViewProps) {
  return (
    <div className="full-task-view-container">
      <div className="full-task-view-header">
        <button onClick={onClose} className="back-to-list-btn">
          <i className="fas fa-arrow-left"></i>
          {' '}
          Back to List
        </button>
      </div>
      <div className="full-task-view-content">
        <TabbedView
          word={task}
          wordId={task.id}
          showToast={showToast}
          onWordUpdate={onWordUpdate}
          {...props}
          // These are already in props, but being explicit for clarity
          onUpdate={props.onUpdate}
          focusChecklistItemId={props.focusChecklistItemId}
          setFocusChecklistItemId={props.setFocusChecklistItemId}
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

function TabbedView({ word, onUpdate, onWordUpdate, onTabChange, onNotify, formatTimestamp, showToast, settings, startInEditMode = false, onDescriptionChange, onSettingsChange, words, completedWords, setInboxMessages, onComplete, wordId, checklistRef, focusChecklistItemId, setFocusChecklistItemId, ...rest }: TabbedViewProps) {
  const initialTab = settings.activeTaskTabs[word.id] || (word.completedDuration ? 'ticket' : 'ticket');
  const [activeTab, setActiveTab] = useState<'ticket' | 'edit'>(initialTab);

  // This effect synchronizes the internal state with the prop from the parent.
  useEffect(() => {
    const newTab = settings.activeTaskTabs[word.id] || 'ticket';
    if (newTab !== activeTab) setActiveTab(newTab);
  }, [settings.activeTaskTabs, word.id, activeTab]);

  const handleTabClick = (tab: 'ticket' | 'edit') => {
    setActiveTab(tab);
    onTabChange(word.id, tab);
  };

  const handleFieldChange = (field: keyof Word, value: any) => {
    onUpdate({ ...word, [field]: value });
  };

  const handleTaskContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const isInEditMode = activeTab === 'edit';
    // We need to check if there are any completed tasks to enable the "Re-Open Last Task" option.
    // Since TabbedView doesn't have `completedWords`, we'll pass it down from `App`.
    //const hasCompletedTasks = rest.completedWords.length > 0;
    const hasCompletedTasks = completedWords.length > 0;
    window.electronAPI.showTaskContextMenu({ wordId: word.id, x: e.clientX, y: e.clientY, isInEditMode, hasCompletedTasks });
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
        showToast('Description copied!');
      } catch (err) {
        console.error('Failed to copy description: ', err);
        showToast('Copy failed!');
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
          showToast('Notes copied!');
        }
      } catch (err) {
        console.error('Failed to copy notes: ', err);
        showToast('Copy failed!');
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
        showToast('All content copied!');
      } catch (err) {
        console.error('Failed to copy all: ', err);
        showToast('Copy failed!');
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
            <h3 onContextMenu={handleTaskContextMenu}>{word.text} (ID: {word.id})</h3>
            {word.url && <p><strong>URL:</strong> <span className="link-with-copy"><a href="#" onClick={(e) => { e.preventDefault(); window.electronAPI.openExternalLink({ url: word.url, browserPath: settings.browsers[settings.activeBrowserIndex]?.path }); }}>{word.url}</a><button className="icon-button copy-btn" title="Copy URL" onClick={() => { navigator.clipboard.writeText(word.url); showToast('URL copied!'); }}><i className="fas fa-copy"></i></button></span></p>}
            <p><strong>Category:</strong> {settings.categories.find(c => c.id === word.categoryId)?.name || 'Uncategorized'}</p>
            <p><strong>Priority:</strong> {word.priority || 'Medium'}</p>
            <p><strong>Open Date:</strong> {formatTimestamp(word.openDate)}</p>
            <p><strong>Time Open:</strong> <TimeOpen startDate={word.createdAt} /></p>
            {word.completeBy && <p><strong>Complete By:</strong> {formatTimestamp(word.completeBy)}</p>}
            {word.completeBy && <p><strong>Time Left:</strong> <TimeLeft word={word} onUpdate={onUpdate} onNotify={onNotify} settings={settings} /></p>}
            {word.company && <p><strong>Company:</strong> <span className="link-with-copy">{word.company}<button className="icon-button copy-btn" title="Copy Company" onClick={() => { navigator.clipboard.writeText(word.company); showToast('Company copied!'); }}><i className="fas fa-copy"></i></button></span></p>}
            <div className="work-timer-container"><strong>Work Timer:</strong>
              <TimeTrackerLog word={word} onUpdate={onUpdate} showToast={showToast} />
            </div>
            <div><strong>Task Cost:</strong>
              <span> ${(((word.manualTime || 0) / (1000 * 60 * 60)) * (word.payRate || 0)).toFixed(2)}</span>
            </div>
            {word.websiteUrl && <p><strong>Website URL:</strong> <span className="link-with-copy"><a href="#" onClick={(e) => { e.preventDefault(); window.electronAPI.openExternalLink({ url: word.websiteUrl, browserPath: settings.browsers[settings.activeBrowserIndex]?.path }); }}>{word.websiteUrl}</a><button className="icon-button copy-btn" title="Copy URL" onClick={() => { navigator.clipboard.writeText(word.websiteUrl); showToast('Website URL copied!'); }}><i className="fas fa-copy"></i></button></span></p>}
            <div><strong>Image Links:</strong>
              <div className="image-links-display">
                {(word.imageLinks || []).map((link, index) => (
                  <div key={index} className="image-link-item">
                    <img src={link} alt={`Image ${index + 1}`} />
                    <div className="image-link-actions">
                      <button className="icon-button" onClick={() => window.electronAPI.downloadImage(link)} title="Download Image"><i className="fas fa-download"></i></button>
                      <button className="icon-button" onClick={() => { navigator.clipboard.writeText(link); showToast('Image URL copied!'); }} title="Copy URL"><i className="fas fa-copy"></i></button>
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
                  navigator.clipboard.writeText(word.description || ''); showToast('Description HTML copied!');
                }}><i className="fas fa-code"></i></button>
                <button className="icon-button copy-btn" title="Copy All (Description + Notes)" onClick={handleCopyAll}><i className="fas fa-copy"></i> All</button>
              </div>
              <Checklist 
                sections={word.checklist || []} 
                onUpdate={(newSections) => handleFieldChange('checklist', newSections)} 
                onComplete={onComplete}
                words={words}
                setInboxMessages={setInboxMessages} 
                word={word}
                wordId={wordId}
                onWordUpdate={onWordUpdate}
                checklistRef={checklistRef}
                showToast={showToast}
                isEditable={false}
                focusItemId={focusChecklistItemId} 
                onFocusHandled={() => setFocusChecklistItemId(null)} 
                settings={settings} 
                onSettingsChange={onSettingsChange}
              />
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
                <button className="icon-button copy-btn" title="Copy Notes HTML" onClick={() => { navigator.clipboard.writeText(word.notes || ''); showToast('Notes HTML copied!');
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
            <label><h4>Task Title (ID: {word.id}):</h4>
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
                navigator.clipboard.writeText(word.description || ''); showToast('Description HTML copied!');
              }}><i className="fas fa-code"></i></button>
              <button className="icon-button copy-btn" title="Copy All (Description + Notes)" onClick={handleCopyAll}><i className="fas fa-copy"></i> All</button>
            </div>
            <Checklist 
              sections={word.checklist || []} 
              onUpdate={(newSections) => handleFieldChange('checklist', newSections)} 
              onComplete={onComplete}
              isEditable={true}
              onWordUpdate={onWordUpdate}
              word={word}
              words={words} 
              setInboxMessages={setInboxMessages}
              checklistRef={checklistRef}
              wordId={wordId}
              showToast={showToast}
              focusItemId={focusChecklistItemId} 
              onFocusHandled={() => setFocusChecklistItemId(null)}
              settings={settings} 
              onSettingsChange={onSettingsChange}
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
            <label><h4>Starts Task on Complete:</h4>
              <select
                value={word.startsTaskIdOnComplete || ''}
                onChange={(e) => handleFieldChange('startsTaskIdOnComplete', e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">-- None --</option>
                {words
                  .filter(w => w.id !== word.id) // Exclude the current task from the list
                  .map(w => (
                    <option key={w.id} value={w.id}>{w.text}</option>
                  ))}
              </select>
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

function Checklist({ sections, onUpdate, isEditable, onComplete, words, setInboxMessages, word, wordId, onWordUpdate, checklistRef, showToast, focusItemId, onFocusHandled, settings, onSettingsChange }: { sections: ChecklistSection[] | ChecklistItem[], onUpdate: (newSections: ChecklistSection[]) => void, isEditable: boolean, onComplete: (item: ChecklistItem, sectionId: number, updatedSections: ChecklistSection[]) => void, words: Word[], setInboxMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>, word: Word, wordId: number, onWordUpdate: (updatedWord: Word) => void, checklistRef?: React.MutableRefObject<{ handleUndo: () => void; handleRedo: () => void; }>, showToast: (message: string, duration?: number) => void, focusItemId: number | null, onFocusHandled: () => void, settings: Settings, onSettingsChange: (newSettings: Partial<Settings>) => void }) {
  const [newItemTexts, setNewItemTexts] = useState<{ [key: number]: string }>({});
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingItemText, setEditingItemText] = useState('');
  const [editingResponseForItemId, setEditingResponseForItemId] = useState<number | null>(null);
  const [editingNoteForItemId, setEditingNoteForItemId] = useState<number | null>(null);
  const [focusSubInputKey, setFocusSubInputKey] = useState<string | null>(null);
  const subInputRefs = useRef<{ [key: string]: HTMLInputElement }>({});
  const [hiddenNotesSections, setHiddenNotesSections] = useState<Set<number>>(new Set());
  const [hiddenResponsesSections, setHiddenResponsesSections] = useState<Set<number>>(new Set());
  const [confirmingDeleteSectionNotes, setConfirmingDeleteSectionNotes] = useState<number | null>(null);
  const [confirmingDeleteSectionResponses, setConfirmingDeleteSectionResponses] = useState<number | null>(null);
  const [confirmingDeleteNotes, setConfirmingDeleteNotes] = useState(false);
  const [confirmingDeleteAllSections, setConfirmingDeleteAllSections] = useState(false);
  const [confirmingDeleteResponses, setConfirmingDeleteResponses] = useState(false);
  const [confirmingDeleteSectionId, setConfirmingDeleteSectionId] = useState<number | null>(null);
  const [confirmingDeleteChecked, setConfirmingDeleteChecked] = useState<number | 'all' | null>(null);
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const addItemInputRef = useRef<{ [key: number]: HTMLTextAreaElement }>({});

  // State for local undo/redo history of checklist changes
  const [history, setHistory] = useState<ChecklistSection[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoingRedoing = useRef(false); // Ref to prevent feedback loops
  const editingItemInputRef = useRef<HTMLInputElement | null>(null);


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

  const handleSendAllItemsToTimer = (startImmediately: boolean) => {
    const now = Date.now();
    const newTitle = 'All Checklist Items';
    let newTimeLog = [...(word.timeLog || [])];

    const allItemsToSend = history[historyIndex].flatMap(section => section.items.filter(item => !item.isCompleted));

    if (allItemsToSend.length === 0) {
      showToast('No active items in any section to send to timer.');
      return;
    }

    // If starting immediately, stop any other running timer first.
    if (startImmediately) {
      newTimeLog = newTimeLog.map(entry => {
        if (entry.isRunning) {
          const elapsed = now - (entry.startTime || now);
          return { ...entry, duration: entry.duration + elapsed, isRunning: false, startTime: undefined };
        }
        return entry;
      });
    }

    const newEntries: TimeLogEntry[] = allItemsToSend.map((item, index) => ({
      id: now + Math.random() + index,
      description: item.text,
      duration: 0,
      isRunning: startImmediately && index === 0, // Only start the first item
      startTime: startImmediately && index === 0 ? now : undefined,
    }));

    onWordUpdate({ ...word, timeLog: [...newTimeLog, ...newEntries], timeLogTitle: newTitle });
    showToast(`${allItemsToSend.length} item(s) sent to timer!`);
  };

  const handleSendSectionToTimer = (section: ChecklistSection, startImmediately: boolean) => {
    const now = Date.now();
    let newTimeLog = [...(word.timeLog || [])];
    const newTitle = section.title;

    const itemsToSend = section.items.filter(item => !item.isCompleted);
    if (itemsToSend.length === 0) {
      showToast('No active items in this section to send to timer.');
      return;
    }

    // If starting immediately, stop any other running timer first.
    if (startImmediately) {
      newTimeLog = newTimeLog.map(entry => {
        if (entry.isRunning) {
          const elapsed = now - (entry.startTime || now);
          return { ...entry, duration: entry.duration + elapsed, isRunning: false, startTime: undefined };
        }
        return entry;
      });
    }

    const newEntries: TimeLogEntry[] = itemsToSend.map((item, index) => ({
      id: now + Math.random() + index,
      description: item.text,
      duration: 0,
      isRunning: startImmediately && index === 0, // Only start the first item
      startTime: startImmediately && index === 0 ? now : undefined,
    }));

    onWordUpdate({ ...word, timeLog: [...newTimeLog, ...newEntries], timeLogTitle: newTitle });
    showToast(`${itemsToSend.length} item(s) sent to timer!`);
  };

  const handleSendToTimer = (itemText: string, startImmediately: boolean) => {
    const now = Date.now();
    let newTimeLog = [...(word.timeLog || [])];

    // If starting immediately, stop any other running timer first.
    if (startImmediately) {
      newTimeLog = newTimeLog.map(entry => {
        if (entry.isRunning) {
          const elapsed = now - (entry.startTime || now);
          return { ...entry, duration: entry.duration + elapsed, isRunning: false, startTime: undefined };
        }
        return entry;
      });
    }

    // Create the new entry from the checklist item.
    const newEntry: TimeLogEntry = {
      id: now + Math.random(),
      description: itemText,
      duration: 0,
      isRunning: startImmediately,
      startTime: startImmediately ? now : undefined,
    };

    newTimeLog.push(newEntry);

    // This is the key: we call the parent's onUpdate with the modified `word` object.
    // Since we don't have direct access to the parent's onUpdate, we'll pass the whole word object
    // through the checklist's onUpdate prop. The parent will handle it.
    onWordUpdate({ ...word, timeLog: newTimeLog });
    showToast(`'${itemText}' sent to timer!`);
  };

  useEffect(() => {
    // This effect now specifically focuses the input whose key is stored in `focusSubInputKey`.
    if (isEditable && focusSubInputKey && subInputRefs.current[focusSubInputKey]) {
      subInputRefs.current[focusSubInputKey].focus();
      // Reset the focus request after it's been handled.
      setFocusSubInputKey(null);
    }
  }, [isEditable, normalizedSections, focusSubInputKey]);
  const updateHistory = (newSections: ChecklistSection[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, newSections]);
    setHistoryIndex(newHistory.length);
  };

  const handleToggleSectionNotes = (sectionId: number) => {
    setHiddenNotesSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleToggleSectionResponses = (sectionId: number) => {
    setHiddenResponsesSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) newSet.delete(sectionId);
      else newSet.add(sectionId);
      return newSet;
    });
  };
  useEffect(() => {
    if (focusItemId && editingItemId === focusItemId && editingItemInputRef.current) {
      editingItemInputRef.current.focus();
      // Once focused, notify the parent to clear the focus request
      onFocusHandled();
    }
  }, [editingItemId, focusItemId, onFocusHandled]);

  const handleUpdateItemText = (sectionId: number, itemId: number, newText: string) => {
    const newSections = history[historyIndex].map(sec => sec.id === sectionId ? { ...sec, items: sec.items.map(item => item.id === itemId ? { ...item, text: newText } : item) } : sec);
    if (!isUndoingRedoing.current) {
      updateHistory(newSections);
    }
    onUpdate(newSections);
  };

  const handleUpdateItemResponse = (sectionId: number, itemId: number, newResponse: string) => {
    const newSections = history[historyIndex].map(sec => sec.id === sectionId ? { ...sec, items: sec.items.map(item => item.id === itemId ? { ...item, response: newResponse } : item) } : sec);
    updateHistory(newSections);
    onUpdate(newSections);
  };

  const handleUpdateItemNote = (sectionId: number, itemId: number, newNote: string) => {
    const newSections = history[historyIndex].map(sec => sec.id === sectionId ? { ...sec, items: sec.items.map(item => item.id === itemId ? { ...item, note: newNote } : item) } : sec);
    updateHistory(newSections);
    onUpdate(newSections);
  };

  const handleDeleteItemResponse = (sectionId: number, itemId: number) => {
    const newSections = history[historyIndex].map(sec => sec.id === sectionId ? { ...sec, items: sec.items.map(item => item.id === itemId ? { ...item, response: undefined } : item) } : sec);
    updateHistory(newSections);
    onUpdate(newSections);
  };

  const handleDeleteItemNote = (sectionId: number, itemId: number) => {
    const newSections = history[historyIndex].map(sec => sec.id === sectionId ? { ...sec, items: sec.items.map(item => item.id === itemId ? { ...item, note: undefined } : item) } : sec);
    updateHistory(newSections);
    onUpdate(newSections);
  };

  const handleUpdateItemDueDate = (sectionId: number, itemId: number, newDueDate: number | undefined) => {
    const newSections = history[historyIndex].map(sec =>
      sec.id === sectionId
        ? { ...sec, items: sec.items.map(item => (item.id === itemId ? { ...item, dueDate: newDueDate } : item)) }
        : sec,
    );
    updateHistory(newSections);
    onUpdate(newSections);
  };

  const handleUpdateItemDueDateFromPicker = (sectionId: number, itemId: number, dateString: string) => {
    const newDueDate = dateString ? new Date(dateString + 'T00:00:00').getTime() : undefined;
    const newSections = history[historyIndex].map(sec =>
      sec.id === sectionId ? { ...sec, items: sec.items.map(item => (item.id === itemId ? { ...item, dueDate: newDueDate } : item)) } : sec
    );
    updateHistory(newSections);
    onUpdate(newSections);
  };

  const handleAddSection = () => {
    const newId = Date.now();
    const newSection: ChecklistSection = {
      id: newId,
      title: 'New Section',
      items: [],
    };
    const newSections = [...history[historyIndex], newSection];
    updateHistory(newSections);
    onUpdate(newSections);
    setEditingSectionId(newId); // Set the new section to be in edit mode
    setEditingSectionTitle('New Section'); // Initialize the input with the default title
  };

  const handleUpdateSectionTitle = (sectionId: number, newTitle: string) => {
    const newSections = history[historyIndex].map(sec => 
      sec.id === sectionId ? { ...sec, title: newTitle } : sec
    );
    if (!isUndoingRedoing.current) {
      updateHistory(newSections);
    }
    onUpdate(newSections);
  };
  const handleDuplicateSection = (sectionId: number) => {
    const currentSections = history[historyIndex];
    const sectionIndex = currentSections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return;

    const sectionToDuplicate = currentSections[sectionIndex];
    const newDuplicatedSection: ChecklistSection = {
      ...sectionToDuplicate,
      id: Date.now() + Math.random(), // Use random to be safe
      title: `${sectionToDuplicate.title} (Copy)`,
      // CRITICAL FIX: Give all duplicated items new, unique IDs
      items: sectionToDuplicate.items.map(item => ({ ...item, id: Date.now() + Math.random() })),
    };

    const newSections = [...currentSections];
    newSections.splice(sectionIndex + 1, 0, newDuplicatedSection);

    updateHistory(newSections);
    onUpdate(newSections);
    showToast('Section Duplicated!');
  };

  const handleDeleteSection = (sectionId: number) => {
    if (confirmingDeleteSectionId === sectionId) {
      // This is the second click, perform deletion
      const newSections = history[historyIndex].filter(sec => sec.id !== sectionId);
      updateHistory(newSections);
      onUpdate(newSections);
      setConfirmingDeleteSectionId(null); // Reset confirmation state
      showToast('Section Deleted!');      
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
    } else {
      // This is the first click, enter confirmation state
      setConfirmingDeleteSectionId(sectionId);
      // Also reset other confirmations to avoid confusion
      setConfirmingDeleteNotes(false);
      setConfirmingDeleteResponses(false);
      setConfirmingDeleteSectionNotes(null);
      setConfirmingDeleteSectionResponses(null);

      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteSectionId(null), 3000);
    }
  };
  const handleDeleteAllSections = () => {
    if (confirmingDeleteAllSections) {
      updateHistory([]);
      onUpdate([]);
      showToast('All sections deleted.');
      setConfirmingDeleteAllSections(false);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    } else {
      setConfirmingDeleteAllSections(true);
      // Reset other confirmations
      setConfirmingDeleteSectionId(null);
      setConfirmingDeleteNotes(false);
      setConfirmingDeleteResponses(false);
      setConfirmingDeleteSectionNotes(null);
      setConfirmingDeleteSectionResponses(null);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteAllSections(false), 3000);
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

    const newSections = history[historyIndex].map(sec =>
      sec.id === sectionId ? { ...sec, items: [...sec.items, ...newItems] } : sec
    );

    if (!isUndoingRedoing.current) {
      updateHistory(newSections);
    }
    onUpdate(newSections);
    setNewItemTexts(prev => ({ ...prev, [sectionId]: '' })); // Clear only this section's input

    // Focus the input after adding items
    setTimeout(() => {
      addItemInputRef.current[sectionId]?.focus();
    }, 0);
  };

  const handleToggleItem = (sectionId: number, itemId: number) => {
    let toggledItem: ChecklistItem | null = null;
    const newSections = history[historyIndex].map(sec => {
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
    const sectionToUpdate = history[historyIndex].find(sec => sec.id === sectionId);
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
    const newSections = history[historyIndex].map(sec => sec.id === sectionId ? { ...sec, items: sec.items.map(i => ({ ...i, isCompleted: !areAllCurrentlyCompleted })) } : sec);
    if (!isUndoingRedoing.current) {
      updateHistory(newSections);
    }
    onUpdate(newSections);
  };  
  
  const handleToggleAllSections = () => {
    const allItems = history[historyIndex].flatMap(sec => sec.items);
    if (allItems.length === 0) return;

    const areAllItemsComplete = allItems.every(item => item.isCompleted);

    const newSections = history[historyIndex].map(sec => ({
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

  const handleDeleteChecked = (sectionId?: number) => {
    const confirmKey = sectionId === undefined ? 'all' : sectionId;
    if (confirmingDeleteChecked === confirmKey) {
      const newSections = history[historyIndex].map(sec =>
        (sectionId === undefined || sec.id === sectionId)
          ? { ...sec, items: sec.items.filter(item => !item.isCompleted) }
          : sec
      );
      updateHistory(newSections);
      onUpdate(newSections);
      showToast('Checked items deleted.');
      setConfirmingDeleteChecked(null);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    } else {
      setConfirmingDeleteChecked(confirmKey);
      // Reset other confirmations to avoid confusion
      setConfirmingDeleteSectionId(null);
      setConfirmingDeleteNotes(false);
      setConfirmingDeleteResponses(false);
      setConfirmingDeleteSectionNotes(null);
      setConfirmingDeleteSectionResponses(null);
      setConfirmingDeleteAllSections(false);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteChecked(null), 3000);
    }

  };

  const handleDeleteItem = (sectionId: number, itemId: number) => {
    const newSections = history[historyIndex].map(sec => {
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

  const handleToggleSectionCollapse = React.useCallback((sectionId: number) => {
    const openIds = settings.openChecklistSectionIds || [];
    const isOpen = openIds.includes(sectionId);
    const newOpenIds = isOpen
      ? openIds.filter(id => id !== sectionId)
      : [...openIds, sectionId];
    
    onSettingsChange({ openChecklistSectionIds: newOpenIds });
  }, [settings.openChecklistSectionIds, onSettingsChange]);

  const handleCollapseAllSections = React.useCallback(() => {
    onSettingsChange({ openChecklistSectionIds: [] });
  }, [onSettingsChange]);

  const handleExpandAllSections = React.useCallback(() => {
    const allSectionIds = history[historyIndex].map(s => s.id);
    onSettingsChange({ openChecklistSectionIds: allSectionIds });
  }, [history, historyIndex, onSettingsChange]);

  const handleAddNotes = React.useCallback((sectionId?: number) => {
    const newSections = history[historyIndex].map(sec => {
      if (sectionId && sec.id !== sectionId) return sec;
      return {
        ...sec,
        items: sec.items.map(item => 
          item.note === undefined ? { ...item, note: '' } : item
        )
      };
    });
    updateHistory(newSections);
    onUpdate(newSections);
    showToast('Note fields added!');
  }, [history, historyIndex, onUpdate, showToast]);

  const handleAddResponses = React.useCallback((sectionId?: number) => {
    const newSections = history[historyIndex].map(sec => {
      if (sectionId && sec.id !== sectionId) return sec;
      return {
        ...sec,
        items: sec.items.map(item => 
          item.response === undefined ? { ...item, response: '' } : item
        )
      };
    });
    updateHistory(newSections);
    onUpdate(newSections);
    showToast('Response fields added!');
  }, [history, historyIndex, onUpdate, showToast]);

  const handleDeleteAllResponses = () => {
    const newSections = history[historyIndex].map(sec => ({
      ...sec,
      items: sec.items.map(item => {
        const { response, ...rest } = item;
        return rest;
      })
    }));
    updateHistory(newSections);
    onUpdate(newSections);
    showToast('All Response deleted!');
  };


  const handleDeleteAllNotes = () => {
    const newSections = history[historyIndex].map(sec => ({
      ...sec,
      items: sec.items.map(item => {
        const { note, ...rest } = item;
        return rest;
      })
    }));
    updateHistory(newSections);
    onUpdate(newSections);
    showToast('All Notes deleted!');
  };

  const handleDeleteAllSectionResponses = (sectionId: number) => {
    const newSections = history[historyIndex].map(sec => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        items: sec.items.map(item => {
          const { response, ...rest } = item;
          return rest;
        })
      };
    });
    updateHistory(newSections);
    onUpdate(newSections);
    showToast('Section Responses deleted!');
  };

  const handleDeleteAllSectionNotes = (sectionId: number) => {
    const newSections = history[historyIndex].map(sec => {
      if (sec.id !== sectionId) return sec;
      return { ...sec, items: sec.items.map(item => { const { note, ...rest } = item; return rest; }) };
    });
    updateHistory(newSections);
    onUpdate(newSections);
    showToast('Section Notes deleted!');
  };
  // Effect to handle commands from the context menu that require local state changes
  useEffect(() => {
    const handleChecklistCommand = (payload: { command: string, sectionId: number, itemId: number, color?: string }) => {
      const { command, sectionId, itemId, color } = payload;
      const currentSections = history[historyIndex];
      const section = currentSections.find(s => s.id === sectionId);
      if (!section) return;

      const itemIndex = section.items.findIndex(item => item.id === itemId);
      if (itemIndex === -1) return;

      let newItems = [...section.items];
      let newSections = [...currentSections];

      switch (command) {
        case 'toggle_complete': {
          let toggledItem: ChecklistItem | null = null;
          newItems = newItems.map(item => {
            if (item.id !== itemId) return item;
            const isNowCompleted = !item.isCompleted;
            if (isNowCompleted) toggledItem = item;
            return { ...item, isCompleted: isNowCompleted };
          });
          if (toggledItem) onComplete(toggledItem, sectionId, [{ ...section, items: newItems }]);
          break;
        }
        case 'delete':
          newItems.splice(itemIndex, 1);
          break;
        case 'copy':
          navigator.clipboard.writeText(newItems[itemIndex].text);
          showToast('Checklist item copied!');
          return; // No state update needed
        case 'duplicate': {
          const itemToDuplicate = { ...newItems[itemIndex] };
          const duplicatedItem = { ...itemToDuplicate, id: Date.now() + Math.random(), text: `${itemToDuplicate.text} (Copy)` };
          newItems.splice(itemIndex + 1, 0, duplicatedItem);
          break;
        }
        case 'add_before':
          newItems.splice(itemIndex, 0, { id: Date.now() + Math.random(), text: 'New Item', isCompleted: false });
          break;
        case 'add_after':
          newItems.splice(itemIndex + 1, 0, { id: Date.now() + Math.random(), text: 'New Item', isCompleted: false });
          break;
        case 'move_up':
          if (itemIndex > 0) {
            [newItems[itemIndex - 1], newItems[itemIndex]] = [newItems[itemIndex], newItems[itemIndex - 1]];
          }
          break;
        case 'move_down':
          if (itemIndex < newItems.length - 1) {
            [newItems[itemIndex], newItems[itemIndex + 1]] = [newItems[itemIndex + 1], newItems[itemIndex]];
          }
          break;
        case 'highlight':
          newSections = newSections.map(s =>
            s.id === sectionId
              ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, highlightColor: color } : i) }
              : s
          );
          break;
        case 'delete_note':
        case 'delete_response': {
          const fieldToClear = command === 'delete_note' ? 'note' : 'response';
          newSections = newSections.map(s => s.id === sectionId ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, [fieldToClear]: undefined } : i) } : s);
          showToast(`${fieldToClear.charAt(0).toUpperCase() + fieldToClear.slice(1)} deleted.`);
          break;
        }
      }
      if (command === 'open_link') {
        const item = section.items.find(i => i.id === itemId);
        if (item) {
          const url = extractUrlFromText(item.text);
          if (url) window.electronAPI.openExternalLink({ url, browserPath: settings.browsers[settings.activeBrowserIndex]?.path });
        }
        return; // No state update needed
      } else if (command === 'copy_link') {
        const item = section.items.find(i => i.id === itemId);
        if (item) {
          const url = extractUrlFromText(item.text);
          if (url) {
            navigator.clipboard.writeText(url);
            showToast('Link copied!');
          }
        }
        return; // No state update needed
      } else if (command === 'copy_note') {
        const item = section.items.find(i => i.id === itemId);
        if (item?.note) {
          navigator.clipboard.writeText(item.note);
          showToast('Note copied!');
        }
        return; // No state update needed
      } else if (command === 'open_note_link' || command === 'copy_note_link') {
        const item = section.items.find(i => i.id === itemId);
        if (item?.note) {
          const url = extractUrlFromText(item.note);
          if (url) {
            if (command === 'open_note_link') window.electronAPI.openExternalLink({ url, browserPath: settings.browsers[settings.activeBrowserIndex]?.path });
            else { navigator.clipboard.writeText(url); showToast('Link copied from note!'); }
          }
        }
        return; // No state update needed
      } else if (command === 'copy_response') {
        const item = section.items.find(i => i.id === itemId);
        if (item?.response) {
          navigator.clipboard.writeText(item.response);
          showToast('Response copied!');
        }
        return; // No state update needed
      } else if (command === 'open_response_link' || command === 'copy_response_link') {
        const item = section.items.find(i => i.id === itemId);
        if (item?.response) {
          const url = extractUrlFromText(item.response);
          if (url) {
            if (command === 'open_response_link') window.electronAPI.openExternalLink({ url, browserPath: settings.browsers[settings.activeBrowserIndex]?.path });
            else { navigator.clipboard.writeText(url); showToast('Link copied from response!'); }
          }
        }
        return; // No state update needed
      }

      if (!['highlight', 'delete_note', 'delete_response'].includes(command)) {
        newSections = newSections.map(s => s.id === sectionId ? { ...s, items: newItems } : s);
      }
      
      updateHistory(newSections); // This is the key: update local history
      onUpdate(newSections); // AND call the parent update function

      if (payload.command === 'edit') {
        const section = history[historyIndex].find(s => s.id === payload.sectionId);
        const item = section?.items.find(i => i.id === payload.itemId);
        if (item) {
          setEditingItemId(item.id);
          setEditingItemText(item.text);
        }
      } else if (payload.command === 'edit_response') {
        const section = history[historyIndex].find(s => s.id === payload.sectionId);
        const item = section?.items.find(i => i.id === payload.itemId);
        if (item) {          
          if (item.response === undefined) handleUpdateItemResponse(payload.sectionId, payload.itemId, '');
          setEditingResponseForItemId(payload.itemId);
        }
      } else if (payload.command === 'edit_note') {
        const section = history[historyIndex].find(s => s.id === payload.sectionId);
        const item = section?.items.find(i => i.id === payload.itemId);
        if (item) {          
          if (item.note === undefined) handleUpdateItemNote(payload.sectionId, payload.itemId, '');
          setEditingNoteForItemId(payload.itemId);
        }
      } else if (command === 'send_to_timer') {
        const item = section.items.find(i => i.id === itemId);
        if (item) handleSendToTimer(item.text, false);
      } else if (command === 'send_to_timer_and_start') {
        const item = section.items.find(i => i.id === itemId);
        if (item) handleSendToTimer(item.text, true);
      } else if (command === 'send_to_timer_and_start') {
        const item = section.items.find(i => i.id === itemId);
        if (item) handleSendToTimer(item.text, true);
      } else if (command === 'view' && wordId) {
        onSettingsChange({ activeTaskTabs: { ...settings.activeTaskTabs, [wordId]: 'ticket' } });
        if (!settings.openAccordionIds.includes(wordId)) onSettingsChange({ openAccordionIds: [...new Set([...settings.openAccordionIds, wordId])] });
      }
    };
    const handleSectionCommand = (payload: { command: string, sectionId?: number }) => {
      switch (payload.command) {
        case 'move_section_up': {
          const newSections = moveSection(history[historyIndex], payload.sectionId, 'up');
          updateHistory(newSections);
          onUpdate(newSections);
          break;
        }
        case 'move_section_down': {
          const newSections = moveSection(history[historyIndex], payload.sectionId, 'down');
          updateHistory(newSections);
          onUpdate(newSections);
          break;
        }
        case 'undo_checklist':
          handleUndo();
          break;
        case 'redo_checklist':
          handleRedo();
          break;
        case 'edit_title': {
          const section = history[historyIndex].find(s => s.id === payload.sectionId);
          if (section) {
            setEditingSectionId(section.id);
            setEditingSectionTitle(section.title);
          }
          break;
        }
        case 'toggle_all_in_section':
          if (payload.sectionId) handleCompleteAllInSection(payload.sectionId);
          break;
        case 'toggle_collapse': handleToggleSectionCollapse(payload.sectionId); break;
        case 'expand_all': handleExpandAllSections(); break;
        case 'collapse_all': handleCollapseAllSections(); break;
        case 'add_note_to_section': handleAddNotes(payload.sectionId); break;
        case 'add_note_to_all': handleAddNotes(); break;
        case 'add_response_to_section': handleAddResponses(payload.sectionId); break;
        case 'add_response_to_all': handleAddResponses(); break;
        case 'delete_all_notes':
          handleDeleteAllNotes();
          break;
        case 'delete_all_responses':
          handleDeleteAllResponses();
          break;
        case 'toggle_section_notes':
          if (payload.sectionId) handleToggleSectionNotes(payload.sectionId);
          break;
        case 'toggle_section_responses':
          if (payload.sectionId) handleToggleSectionResponses(payload.sectionId);
          break;
        case 'copy_section': {
          const sectionToCopy = history[historyIndex].find(s => s.id === payload.sectionId);
          if (sectionToCopy) {
            const textToCopy = formatChecklistForCopy([sectionToCopy]);
            navigator.clipboard.writeText(textToCopy);
            showToast('Section copied to clipboard!');
          }
          break; 
        }
        case 'copy_all_sections': {
          const textToCopy = formatChecklistForCopy(history[historyIndex]);
          navigator.clipboard.writeText(textToCopy);
          showToast('All sections copied to clipboard!');
          break; 
        }
        case 'copy_section_raw': {
          const sectionToCopy = history[historyIndex].find(s => s.id === payload.sectionId);
          if (sectionToCopy) {
            const textToCopy = formatChecklistSectionRawForCopy(sectionToCopy);
            navigator.clipboard.writeText(textToCopy);
            showToast('Section raw content copied!');            
          }
          break;
        }
        case 'copy_all_sections_raw': {
          const allRawText = history[historyIndex]
            .map(section => formatChecklistSectionRawForCopy(section))
            .join('\n\n'); // Separate sections with a double newline
          navigator.clipboard.writeText(allRawText);
          showToast('All sections raw content copied!');          
          break;
        }
        case 'clear_all_highlights': {
          if (payload.sectionId) {
            const newSections = history[historyIndex].map(sec => 
              sec.id === payload.sectionId 
                ? { ...sec, items: sec.items.map(item => ({ ...item, highlightColor: undefined } as ChecklistItem)) }
                : sec
            );
            updateHistory(newSections);
            onUpdate(newSections);
            showToast('Highlights cleared for section.');            
          }
          break;
        }
        case 'duplicate_section': {
          if (payload.sectionId) handleDuplicateSection(payload.sectionId);
          break;
        }
        case 'delete_section': {
          if (payload.sectionId) handleDeleteSection(payload.sectionId);
          break;
        }
        case 'delete_all_sections': {
          handleDeleteAllSections();
          break;
        }
        case 'send_section_to_timer': {
          const section = history[historyIndex].find(s => s.id === payload.sectionId);
          if (section) handleSendSectionToTimer(section, false);
          break;
        }
        case 'send_section_to_timer_and_start': {
          const section = history[historyIndex].find(s => s.id === payload.sectionId);
          if (section) handleSendSectionToTimer(section, true);
          break;
        }
        case 'send_all_to_timer': {
          handleSendAllItemsToTimer(false);
          break;
        }
        case 'send_all_to_timer_and_start': {
          handleSendAllItemsToTimer(true);
          break;
        }
      }
    };

    const handleMainHeaderCommand = (payload: { command: string, wordId?: number }) => {
      // This is a new, combined handler.
      // It first checks for task-level commands like 'view' and 'edit'.
      if (payload.command === 'view' && payload.wordId) {        
        onSettingsChange({ activeTaskTabs: { ...settings.activeTaskTabs, [payload.wordId]: 'ticket' } });
        if (!settings.openAccordionIds.includes(payload.wordId)) {
          onSettingsChange({ openAccordionIds: [...new Set([...settings.openAccordionIds, payload.wordId])] });
        }
      } else if (payload.command === 'edit' && payload.wordId) {
        const targetWord = words.find(w => w.id === payload.wordId);
        if (targetWord && !targetWord.completedDuration) {
          onSettingsChange({ activeTaskTabs: { ...settings.activeTaskTabs, [payload.wordId]: 'edit' }, openAccordionIds: [...new Set([...settings.openAccordionIds, payload.wordId])] });
        }
      } else {
        // If it's not 'view' or 'edit', it must be a section command.
        // We can pass it to the existing handler.
        handleSectionCommand(payload);
      }
    };

    // We listen for the generic command, but only act on 'edit'
    const cleanup = window.electronAPI.on('checklist-item-command', handleChecklistCommand);
    const cleanupSection = window.electronAPI.on('checklist-section-command', handleSectionCommand);
    const cleanupMainHeader = window.electronAPI.on('checklist-main-header-command', handleMainHeaderCommand);
    
    return () => { 
      cleanup?.(); // This was missing the question mark
      cleanupSection?.();
      cleanupMainHeader?.();
    };
  }, [history, historyIndex, handleAddNotes, onUpdate, handleAddResponses, handleCollapseAllSections, handleExpandAllSections, handleToggleSectionCollapse, handleDeleteSection, handleDuplicateSection, handleUndo, handleRedo, onSettingsChange, settings.activeTaskTabs, settings.openAccordionIds, words]);

  return (
    <div className="checklist-container">
      <div className="checklist-main-header" onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const isInEditMode = settings.activeTaskTabs?.[wordId] === 'edit';
        window.electronAPI.showChecklistMainHeaderContextMenu({
          wordId,
          sectionId: 0, // Not relevant for global commands
          areAllComplete: false, // Not relevant for global commands
          // Add the missing properties with dummy/global values
          isSectionOpen: false,
          isNotesHidden: !settings.showChecklistNotes,
          isResponsesHidden: !settings.showChecklistResponses,
          isConfirmingDelete: confirmingDeleteAllSections,
          isInEditMode,
          x: e.clientX, 
          y: e.clientY
        });
      }}>
        <h4>Checklist</h4>
        {(() => {
          const allItems = history[historyIndex].flatMap(sec => sec.items);
          if (allItems.length === 0) return null;
          const areAllItemsComplete = allItems.every(item => item.isCompleted);
          const anyItemsCompleted = allItems.some(item => item.isCompleted);
          return (
            <div className="checklist-section-actions checklist-main-header-actions">
              {anyItemsCompleted && (
                <>
                  <button className={`checklist-action-btn delete-btn ${confirmingDeleteChecked === 'all' ? 'confirm-delete' : ''}`} onClick={() => handleDeleteChecked()} title="Delete All Checked Items">
                    {confirmingDeleteChecked === 'all' ? <i className="fas fa-trash-alt"></i> : <i className="fas fa-trash-alt"></i>}
                  </button>
                </>
              )}
              <button 
                onClick={handleToggleAllSections} 
                className="checklist-action-btn"
                title={areAllItemsComplete ? 'Re-Open All Items in All Sections' : 'Complete All Items in All Sections'}
              >
                <i className={`fas ${areAllItemsComplete ? 'fa-undo' : 'fa-check-square'}`}></i>
              </button>              
              <div className="checklist-action-group checklist-action-group-expand">
                <button 
                  className="checklist-action-btn" 
                  onClick={() => handleSendAllItemsToTimer(false)} 
                  title="Send All Items to Timer">
                  <i className="fas fa-stopwatch"></i>
                </button>
                <button
                  className="checklist-action-btn"
                  onClick={() => handleSendAllItemsToTimer(true)}
                  title="Send All Items to Timer & Start">
                  <i className="fas fa-play-circle"></i>
                </button>
                <button className="checklist-action-btn" onClick={handleExpandAllSections} title="Expand All Sections">
                  <i className="fas fa-folder-open"></i>
                </button>
                <button className="checklist-action-btn" onClick={handleCollapseAllSections} title="Collapse All Sections">
                  <i className="fas fa-folder"></i>
                </button>                         
              </div>
              <div className="checklist-action-group checklist-action-group-responses">
                <button className="checklist-action-btn" onClick={() => handleAddResponses()} title="Add Response to All Items">
                  <i className="fas fa-reply"></i>
                </button>
                <button 
                  className="checklist-action-btn" 
                  onClick={() => onSettingsChange({ showChecklistResponses: !settings.showChecklistResponses })} title={settings.showChecklistResponses ? 'Hide All Responses' : 'Show All Responses'}>
                  <i className={`fas fa-eye ${settings.showChecklistResponses ? '' : 'disabled-icon'}`}></i>
                </button>
                <button className={`checklist-action-btn ${confirmingDeleteResponses ? 'confirm-delete' : ''}`} onClick={() => {
                  if (confirmingDeleteResponses) {
                    handleDeleteAllResponses();
                    setConfirmingDeleteResponses(false);
                    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
                  } else {
                    setConfirmingDeleteResponses(true);
                    setConfirmingDeleteNotes(false); // Cancel other confirmation
                    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
                    confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteResponses(false), 3000);
                  }
                }} title="Delete All Responses">
                  {confirmingDeleteResponses ? <i className="fas fas fa-trash-alt delete-icon"></i> : (                  
                    <i className="fas fas fa-trash-alt delete-icon"></i>                  
                  )}
                </button>
              </div>
              <div className="checklist-action-group checklist-action-group-notes">
                <button className="checklist-action-btn" onClick={() => handleAddNotes()} title="Add Note to All Items">
                  <i className="fas fa-sticky-note"></i>
                </button>                
                <button 
                  className="checklist-action-btn" 
                  onClick={() => onSettingsChange({ showChecklistNotes: !settings.showChecklistNotes })} title={settings.showChecklistNotes ? 'Hide All Notes' : 'Show All Notes'}>
                  <i className={`fas fa-eye ${settings.showChecklistNotes ? '' : 'disabled-icon'}`}></i>
                </button>                   
                <button className={`checklist-action-btn ${confirmingDeleteNotes ? 'confirm-delete' : ''}`} onClick={() => {
                  if (confirmingDeleteNotes) {
                    handleDeleteAllNotes();
                    setConfirmingDeleteNotes(false);
                    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
                  } else {
                    setConfirmingDeleteNotes(true);
                    setConfirmingDeleteResponses(false); // Cancel other confirmation
                    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
                    confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteNotes(false), 3000);
                  }
                }} title="Delete All Notes">
                  {confirmingDeleteNotes ? <i className="fas fas fa-trash-alt delete-icon"></i> : (
                    <i className="fas fas fa-trash-alt delete-icon"></i>
                  )}
                </button>
              </div>                            
              <div className="checklist-action-group checklist-action-group-copy">
                <button className="checklist-action-btn" onClick={() => {
                  const textToCopy = formatChecklistForCopy(history[historyIndex]);
                  navigator.clipboard.writeText(textToCopy);
                  showToast('All sections copied to clipboard!');
                }} title="Copy All Sections">
                  <i className="fas fa-copy"></i>
                </button>
                <button className="checklist-action-btn" onClick={() => {
                  const allRawText = history[historyIndex].map(section => formatChecklistSectionRawForCopy(section)).join('\n\n');
                  navigator.clipboard.writeText(allRawText);
                  showToast('All sections raw content copied!');
                }} title="Copy All Sections Raw">
                  <i className="fas fa-paste"></i>
                </button>
              </div>
              <div className="checklist-action-group checklist-action-group-history">
                <button className="checklist-action-btn" onClick={handleUndo} disabled={historyIndex === 0} title="Undo Last Checklist Action">
                  <i className="fas fa-undo-alt"></i>
                </button>
                <button className="checklist-action-btn" onClick={handleRedo} disabled={historyIndex === history.length - 1} title="Redo Checklist Action">
                  <i className="fas fa-redo-alt"></i>
                </button>
              </div>
              {isEditable && (
                <>
                  <button onClick={handleDeleteAllSections} className={`add-section-btn checklist-delete-btn delete-btn ${confirmingDeleteAllSections ? 'confirm-delete' : ''}`} title="Delete All Sections">
                    {confirmingDeleteAllSections ? <i className="fas fas fa-trash-alt delete-icon color-red"></i> : <i className="fas fas fa-trash-alt delete-icon"></i>}
                  </button>
                </>
              )}                
            </div>
          );
        })()}
      </div>
      {history[historyIndex].map(section => {
        const completedCount = section.items.filter(item => item.isCompleted).length;
        const totalCount = section.items.length;
        const areAllComplete = totalCount > 0 && completedCount === totalCount;
        const isSectionOpen = (settings.openChecklistSectionIds || []).includes(section.id);
        const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
        return (
          <div key={section.id} className="checklist-section" data-section-id={section.id} onContextMenu={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); // Stop the event from bubbling up to the parent TaskAccordion
              const isInEditMode = settings.activeTaskTabs?.[wordId] === 'edit';
              window.electronAPI.showChecklistSectionContextMenu({ 
                wordId, 
                sectionId: section.id, 
                areAllComplete, 
                isSectionOpen, 
                isNotesHidden: hiddenNotesSections.has(section.id), 
                isResponsesHidden: hiddenResponsesSections.has(section.id),
                isConfirmingDelete: confirmingDeleteSectionId === section.id,
                isInEditMode, // This was the missing piece
                x: e.clientX, y: e.clientY }); 
            }}>
            <header className="checklist-section-header">
              <button 
                className="checklist-collapse-btn" 
                onClick={() => handleToggleSectionCollapse(section.id)}
                title={isSectionOpen ? 'Collapse Section' : 'Expand Section'}>
                <i className={`fas ${isSectionOpen ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
              </button>
              <div className="checklist-header">
                <div className="checklist-header-wrap">                            
                  {editingSectionId === section.id ? (
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
                      onFocus={(e) => {
                        // Automatically select the text when the input is focused
                        e.target.select();
                      }}
                      autoFocus
                      className="checklist-section-title-input"
                    />
                  ) : (
                    <>
                      <h3
                        className={'editable-title'}
                        title="Double-click to edit"
                        onDoubleClick={() => { setEditingSectionId(section.id); setEditingSectionTitle(section.title); }}
                      >
                        {section.title} ({completedCount}/{totalCount})
                      </h3> 
                      {hiddenNotesSections.has(section.id) && (
                        <span className="hidden-indicator" title="Notes are hidden in this section">
                          <i className="fas fa-sticky-note disabled-icon"></i>
                        </span>
                      )}
                      {hiddenResponsesSections.has(section.id) && (
                        <span className="hidden-indicator" title="Responses are hidden in this section">
                          <i className="fas fa-reply disabled-icon"></i>
                        </span>
                      )}
                    </>
                  )}
                  {totalCount > 0 && (
                    <span className="checklist-progress">
                      ({completedCount}/{totalCount} completed)
                    </span>
                  )}
                </div>
                <div className="checklist-section-actions checklist-section-header-actions">
                  {completedCount > 0 && (
                    <button className={`checklist-action-btn delete-btn ${confirmingDeleteChecked === section.id ? 'confirm-delete' : ''}`} onClick={() => handleDeleteChecked(section.id)} title="Delete Checked Items">
                      {confirmingDeleteChecked === section.id ? <i className="fas fa-trash-alt"></i> : <i className="fas fa-trash-alt"></i>}
                    </button>
                  )}      
                  {totalCount > 0 && (
                    <button className="checklist-action-btn" onClick={() => handleCompleteAllInSection(section.id)} title={areAllComplete ? "Reopen All Items" : "Complete All Items"}>
                      <i className={`fas ${areAllComplete ? 'fa-undo' : 'fa-check-square'}`}></i>
                    </button>
                  )}                                                
                  <div className="checklist-action-group checklist-action-group-responses">
                    <button className="checklist-action-btn" onClick={() => handleAddResponses(section.id)} title="Add Response to All Items in Section">
                      <i className="fas fa-reply"></i>
                    </button>
                <button 
                  className="checklist-action-btn" 
                  onClick={() => handleSendSectionToTimer(section, false)} 
                  title="Send All to Timer">
                  <i className="fas fa-tasks"></i>
                </button>
                    <button
                      className="checklist-action-btn"
                      onClick={() => handleToggleSectionResponses(section.id)}
                      title={hiddenResponsesSections.has(section.id) ? 'Show Responses in Section' : 'Hide Responses in Section'}
                    >
                      <i className={`fas fa-eye ${!hiddenResponsesSections.has(section.id) ? '' : 'disabled-icon'}`}></i>
                    </button>  
                    <button className={`checklist-action-btn ${confirmingDeleteSectionResponses === section.id ? 'confirm-delete' : ''}`} onClick={() => {
                      if (confirmingDeleteSectionResponses === section.id) {
                        handleDeleteAllSectionResponses(section.id);
                        setConfirmingDeleteSectionResponses(null);
                        if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
                      } else {
                        setConfirmingDeleteSectionResponses(section.id);
                        setConfirmingDeleteSectionNotes(null);
                        if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
                        confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteSectionResponses(null), 3000);
                      }
                    }} title="Delete All Responses in Section">
                      {confirmingDeleteSectionResponses === section.id ? <i className="fas fa-trash-alt delete-icon"></i> : <i className="fas fa-trash-alt delete-icon"></i>}
                    </button>
                  </div>
                  <div className="checklist-action-group checklist-action-group-notes">
                    <button className="checklist-action-btn" onClick={() => handleAddNotes(section.id)} title="Add Note to All Items in Section">
                      <i className="fas fa-sticky-note"></i>
                    </button>
                    <button
                      className="checklist-action-btn"
                      onClick={() => handleToggleSectionNotes(section.id)}
                      title={hiddenNotesSections.has(section.id) ? 'Show Notes in Section' : 'Hide Notes in Section'}
                    >
                      <i className={`fas fa-eye ${!hiddenNotesSections.has(section.id) ? '' : 'disabled-icon'}`}></i>
                    </button>  
                    <button className={`checklist-action-btn ${confirmingDeleteSectionNotes === section.id ? 'confirm-delete' : ''}`} onClick={() => { if (confirmingDeleteSectionNotes === section.id) { handleDeleteAllSectionNotes(section.id); setConfirmingDeleteSectionNotes(null); if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current); } else { setConfirmingDeleteSectionNotes(section.id); setConfirmingDeleteSectionResponses(null); if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current); confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteSectionNotes(null), 3000); } }} title="Delete All Notes in Section">
                      {confirmingDeleteSectionNotes === section.id ? <i className="fas fa-trash-alt delete-icon"></i> : <i className="fas fa-trash-alt delete-icon"></i>}
                    </button>
                  </div>                  
                  <div className="checklist-action-group checklist-action-group-copy">
                    <button className="checklist-action-btn" onClick={() => {
                      const sectionToCopy = history[historyIndex].find(s => s.id === section.id);
                      if (sectionToCopy) {
                        const textToCopy = formatChecklistForCopy([sectionToCopy]);
                        navigator.clipboard.writeText(textToCopy);
                        showToast('Section copied to clipboard!');
                      }
                    }} title="Copy Section"><i className="fas fa-copy"></i>
                    </button>
                    <button className="checklist-action-btn" onClick={() => {
                      const sectionToCopy = history[historyIndex].find(s => s.id === section.id);
                      if (sectionToCopy) {
                        const textToCopy = formatChecklistSectionRawForCopy(sectionToCopy);
                        navigator.clipboard.writeText(textToCopy);
                        showToast('Section raw content copied!');
                      }
                    }} title="Copy Section Raw"><i className="fas fa-paste"></i>
                    </button>                
                  </div>
                  <div className="checklist-action-group checklist-action-group-history">
                    <button className="checklist-action-btn" onClick={() => onUpdate(moveSection(history[historyIndex], section.id, 'up'))} title="Move Section Up"><i className="fas fa-arrow-up"></i></button>
                    <button className="checklist-action-btn" onClick={() => onUpdate(moveSection(history[historyIndex], section.id, 'down'))} title="Move Section Down"><i className="fas fa-arrow-down"></i></button>
                  </div>                  
                  {isEditable && (
                    <>
                      <button 
                        className={`checklist-delete-btn ${confirmingDeleteSectionId === section.id ? 'confirm-delete' : ''}`} 
                        onClick={() => handleDeleteSection(section.id)} 
                        title="Delete Section"
                      >
                        {confirmingDeleteSectionId === section.id ? <i className="fas fa-trash-alt"></i> : <i className="fas fa-trash-alt"></i>}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </header>
            {isSectionOpen && <>
            <div className="checklist-progress-bar-container">
              <div 
                className={`checklist-progress-bar-fill ${areAllComplete ? 'complete' : ''}`} 
                style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <div className="checklist-items">
              {section.items.map(item => { return (
                <div 
                  key={item.id} 
                  className={`checklist-item ${item.isCompleted ? 'completed' : ''} ${item.highlightColor ? 'highlighted' : ''} checklist-item-interactive-area`} 
                  style={{ borderLeftColor: item.highlightColor || 'transparent' }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const url = extractUrlFromText(item.text);
                    const isInEditMode = settings.activeTaskTabs?.[wordId] === 'edit';
                    window.electronAPI.showChecklistItemContextMenu({ 
                      wordId: wordId,
                      sectionId: section.id, 
                      itemId: item.id, 
                      isCompleted: item.isCompleted, 
                      hasNote: !!item.note, 
                      hasResponse: !!item.response, 
                      hasUrl: !!url, 
                      isInEditMode,
                      x: e.clientX, 
                      y: e.clientY 
                    });
                  }}
                >
                  {/*
                    * This is the key change. We check if a specific item is being edited FIRST.
                    * This allows the "Edit Item" context menu action to work even when `isEditable` is false.
                  */}                  
                  {editingItemId === item.id ? (
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
                      ref={editingItemInputRef}
                      className="checklist-item-text-input"
                    />
                  ) : ( // This is the "view" mode for a single item
                    <>
                      <div className="checklist-item-main-content">
                        <label className="checklist-item-label">
                          <input
                            type="checkbox"
                            checked={item.isCompleted}
                            onChange={() => handleToggleItem(section.id, item.id)}
                          />
                          {isEditable ? (
                            <input
                              type="text"
                              value={item.text}
                              onChange={(e) => handleUpdateItemText(section.id, item.id, e.target.value)}
                              className="checklist-item-text-input"
                            />
                          ) : (
                            <ClickableText text={item.text} settings={settings} />
                          )}
                        </label>
                        {item.dueDate && !isEditable && (
                          <span
                            className={`checklist-item-due-date ${(() => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const tomorrow = new Date(today);
                              tomorrow.setDate(tomorrow.getDate() + 1);
                              if (item.dueDate < today.getTime()) return 'overdue';
                              if (item.dueDate < tomorrow.getTime()) return 'due-today';
                              return '';
                            })()}`}
                          >
                            <i className="fas fa-calendar-alt"></i>
                            {formatDate(item.dueDate)}
                          </span>
                        )}
                        {!isEditable && (
                          <div className="checklist-item-quick-actions">
                            <button className="icon-button" onClick={() => {
                              setEditingItemId(item.id);
                              setEditingItemText(item.text); // Set the text for the input field
                            }} title="Edit Item"><i className="fas fa-pencil-alt"></i></button>
                            {item.response === undefined ? (
                              <button className="icon-button" onClick={() => { handleUpdateItemResponse(section.id, item.id, ''); setEditingResponseForItemId(item.id); }} title="Add Response"><i className="fas fa-reply"></i></button>
                            ) : (
                              <button className="icon-button" onClick={() => handleDeleteItemResponse(section.id, item.id)} title="Delete Response"><i className="fas fa-reply active-icon"></i></button>
                            )}
                            {item.note === undefined ? (
                              <button className="icon-button" onClick={() => { handleUpdateItemNote(section.id, item.id, ''); setEditingNoteForItemId(item.id); }} title="Add Note"><i className="fas fa-sticky-note"></i></button>
                            ) : (
                              <button className="icon-button" onClick={() => handleDeleteItemNote(section.id, item.id)} title="Delete Note"><i className="fas fa-sticky-note active-icon"></i></button>
                            )}
                            <button className="icon-button" onClick={() => handleSendToTimer(item.text, false)} title="Add to Timer"><i className="fas fa-plus-circle"></i></button>
                            <button className="icon-button" onClick={() => handleSendToTimer(item.text, true)} title="Add to Timer & Start"><i className="fas fa-play"></i></button>
                            <button className="icon-button" onClick={() => handleDeleteItem(section.id, item.id)} title="Delete Item"><i className="fas fa-trash-alt delete-icon"></i></button>
                          </div>
                        )}
                      </div>
                      {isEditable ? (
                        // In EDIT mode, only show the inputs if they have content or if the user just added them.
                        // The `handleUpdate...` function with an empty string creates the property, making it non-undefined.
                        <>
                          {settings.showChecklistResponses && !hiddenResponsesSections.has(section.id) && (item.response !== undefined) && (
                            <div className="checklist-item-response" onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const url = extractUrlFromText(item.response);
                              window.electronAPI.showChecklistResponseContextMenu({ sectionId: section.id, itemId: item.id, hasUrl: !!url, hasResponse: !!item.response, x: e.clientX, y: e.clientY });
                            }}>
                              <strong><i className="fas fa-reply"></i> Response:</strong>
                              <input
                                type="text"
                                value={item.response || ''}
                                onChange={(e) => handleUpdateItemResponse(section.id, item.id, e.target.value)}
                                placeholder="Add a response..."
                                ref={el => subInputRefs.current[`response-${item.id}`] = el}
                                className="checklist-item-sub-input"
                              />
                            </div>
                          )}
                          {settings.showChecklistNotes && !hiddenNotesSections.has(section.id) && (item.note !== undefined) && (
                            <div className="checklist-item-note" onContextMenu={(e) => { 
                              e.preventDefault();
                              e.stopPropagation();
                              const url = extractUrlFromText(item.note);
                              window.electronAPI.showChecklistNoteContextMenu({ sectionId: section.id, itemId: item.id, hasUrl: !!url, hasNote: !!item.note, x: e.clientX, y: e.clientY });
                            }}>
                              <strong><i className="fas fa-sticky-note"></i> Note:</strong>
                              <input
                                type="text"
                                value={item.note || ''}
                                onChange={(e) => handleUpdateItemNote(section.id, item.id, e.target.value)}
                                placeholder="Add a private note..."
                                ref={el => subInputRefs.current[`note-${item.id}`] = el}
                                className="checklist-item-sub-input"
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {settings.showChecklistResponses && !hiddenResponsesSections.has(section.id) && item.response !== undefined ? (
                            <div className="checklist-item-response" onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const url = extractUrlFromText(item.response);
                              window.electronAPI.showChecklistResponseContextMenu({ sectionId: section.id, itemId: item.id, hasUrl: !!url, hasResponse: !!item.response, x: e.clientX, y: e.clientY });
                            }}>
                              <strong><i className="fas fa-reply"></i> Response:</strong>{editingResponseForItemId === item.id ? (
                                <input
                                  type="text"
                                  value={item.response || ''}
                                  onBlur={() => setEditingResponseForItemId(null)}
                                  onChange={(e) => handleUpdateItemResponse(section.id, item.id, e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingResponseForItemId(null); }}
                                  className="checklist-item-sub-input"
                                  autoFocus
                                />
                              ) : (
                                <ClickableText text={item.response} settings={settings} />
                              )}
                            </div>
                          ) : null}
                          {settings.showChecklistNotes && !hiddenNotesSections.has(section.id) && item.note !== undefined ? (
                            <div className="checklist-item-note" onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); const url = extractUrlFromText(item.note); window.electronAPI.showChecklistNoteContextMenu({ sectionId: section.id, itemId: item.id, hasUrl: !!url, hasNote: !!item.note, x: e.clientX, y: e.clientY }); }}>
                              <strong><i className="fas fa-sticky-note"></i> Note:</strong>{editingNoteForItemId === item.id ? (
                                <input type="text" value={item.note || ''} onBlur={() => setEditingNoteForItemId(null)} onChange={(e) => handleUpdateItemNote(section.id, item.id, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingNoteForItemId(null); }} className="checklist-item-sub-input" autoFocus />
                              ) : ( <ClickableText text={item.note} settings={settings} /> )}
                            </div>
                          ) : null}
                        </>
                      )}
                      {isEditable && (
                        <div className="checklist-item-actions">
                          <input
                            type="date"
                            className="checklist-item-datepicker"
                            value={item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-CA') : ''}
                            onChange={(e) => handleUpdateItemDueDateFromPicker(section.id, item.id, e.target.value)}
                            title="Set Due Date"
                          />
                          {settings.showChecklistResponses && (item.response === undefined ? (
                            <button className="icon-button" onClick={() => { handleUpdateItemResponse(section.id, item.id, ''); setFocusSubInputKey(`response-${item.id}`); }} title="Add Response"><i className="fas fa-reply"></i></button>
                          ) : ( <button className="icon-button" onClick={() => handleDeleteItemResponse(section.id, item.id)} title="Delete Response"><i className="fas fa-reply active-icon"></i></button> )) }
                          {settings.showChecklistNotes && (item.note === undefined ? (
                            <button className="icon-button" onClick={() => { handleUpdateItemNote(section.id, item.id, ''); setFocusSubInputKey(`note-${item.id}`); }} title="Add Note"><i className="fas fa-sticky-note"></i></button>
                          ) : ( <button className="icon-button" onClick={() => handleDeleteItemNote(section.id, item.id)} title="Delete Note"><i className="fas fa-sticky-note active-icon"></i></button> )) }
                          <button className="icon-button" onClick={() => handleUpdateItemDueDate(section.id, item.id, undefined)} title="Clear Due Date"><i className="fas fa-times"></i></button>
                        </div>
                      )}                      
                    </>
                  )}
                </div>
              )})}
            </div>
            {isEditable && (
              <div className="checklist-add-item">
                <textarea
                  ref={el => (addItemInputRef.current[section.id] = el)}
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
            </>}
          </div>
        );
      })}
      {isEditable && (
        <div className="checklist-actions">
          <div className="checklist-main-actions">
            <button onClick={handleAddSection} className="add-section-btn">
              <i className='fas fa-plus'></i> Add Section
            </button>
            {history[historyIndex].length > 0 && (
              <button title="Delete All Sections" onClick={handleDeleteAllSections} className={`add-section-btn delete-btn ${confirmingDeleteAllSections ? 'confirm-delete' : ''}`}>
                {confirmingDeleteAllSections ? <i className="fas fa-trash-alt"></i> : <i className="fas fa-trash-alt"></i>}
              </button>
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

const formatTimeLogSessionForCopy = (session: TimeLogSession): string => {
  let output = `${session.title}\n`;
  output += `Total Duration: ${formatTime(session.entries.reduce((acc, entry) => acc + entry.duration, 0))}\n`;
  output += '-----------------\n';
  for (const entry of session.entries) {
    output += `${entry.description}: ${formatTime(entry.duration)}\n`;
  }
  return output;
};

const parseTime = (timeStr: string): number => {
  const parts = timeStr.split(':').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    // Handle incomplete or invalid input, maybe return original duration or 0
    return 0;
  }
  const [hours, minutes, seconds] = parts;
  return (hours * 3600 + minutes * 60 + seconds) * 1000;
};

const parseInputTimestamp = (datetime: string) => {
  return new Date(datetime).getTime();
};
function TaskAccordion({ title, children, isOpen, onToggle, word, settings, completedWords }: AccordionProps & { isOpen: boolean, onToggle: () => void, word: Word, settings: Settings, completedWords: Word[] }) {
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
            // The settings object holds the active tab state for each task.
            const isInEditMode = settings.activeTaskTabs?.[word.id] === 'edit';
            // We need to check if there are any completed tasks to enable the "Re-Open Last Task" option.
            const hasCompletedTasks = completedWords.length > 0;
            window.electronAPI.showTaskContextMenu({ wordId: word.id, x: e.clientX, y: e.clientY, isInEditMode, hasCompletedTasks });
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

function BackupManager({ onRestore, showToast, words, completedWords, settings, onSettingsChange, isPromptOpen, setIsPromptOpen }: { 
  onRestore: (data: any) => void,   
  showToast: (message: string, duration?: number) => void;
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
      showToast(`Manual backup "${backupName}" created!`);      
      fetchBackups(); // Refresh the backup list if the modal is open
    } else {
      showToast('Failed to create manual backup.');      
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
        showToast('Backup deleted.');
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

function TimeTrackerLog({ word, onUpdate, showToast }: { word: Word, onUpdate: (updatedWord: Word) => void, showToast: (message: string, duration?: number, type?: 'success' | 'error' | 'info') => void }) {
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editingEntryDescription, setEditingEntryDescription] = useState('');
  const [editingEntryDuration, setEditingEntryDuration] = useState('');
  const [confirmingDeleteEntry, setConfirmingDeleteEntry] = useState<number | null>(null);
  const [bulkAddText, setBulkAddText] = useState('');
  const [liveTime, setLiveTime] = useState(0);
  const [confirmingDeleteAll, setConfirmingDeleteAll] = useState(false);

  // New state for session management
  const [liveTimerTitle, setLiveTimerTitle] = useState(word.timeLogTitle || 'Work Timer');
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editingSessionTitle, setEditingSessionTitle] = useState('');
  const [openSessionIds, setOpenSessionIds] = useState<Set<number>>(new Set());
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [confirmingDeleteSessionEntry, setConfirmingDeleteSessionEntry] = useState<number | null>(null);
  // State for in-session entry editing
  const [confirmingDeleteSession, setConfirmingDeleteSession] = useState<number | null>(null);
  const [confirmingDeleteAllSessions, setConfirmingDeleteAllSessions] = useState(false);
  const [confirmingClearSession, setConfirmingClearSession] = useState<number | null>(null);
  const [editingSessionEntry, setEditingSessionEntry] = useState<{ sessionId: number; entryId: number; field: 'description' | 'duration' } | null>(null);
  const [editingSessionEntryValue, setEditingSessionEntryValue] = useState('');


  const entryInputRef = useRef<HTMLInputElement>(null);
  const sessionInputRef = useRef<HTMLInputElement>(null);
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // When the word changes, if we are not editing, sync the title.
  useEffect(() => {
    setLiveTimerTitle(word.timeLogTitle || 'Work Timer');
  }, [word.timeLogTitle]);

  // Phase 4.4: One-time data migration from old system
  useEffect(() => {
    // If timeLog is missing/empty AND there's legacy manualTime data...
    if ((!word.timeLog || word.timeLog.length === 0) && (word.manualTime || 0) > 0 && !word.timeLogSessions) {
      // ...create a new entry from the old data.
      const legacyEntry: TimeLogEntry = {
        id: Date.now(),
        description: 'Legacy Timed Entry',
        duration: word.manualTime || 0,
        isRunning: false,
        createdAt: Date.now(),
      };
      // Update the word object with the new timeLog array.
      onUpdate({ ...word, timeLog: [legacyEntry] });
    }
  }, [word.timeLog, word.manualTime, onUpdate, word.timeLogSessions]);

  // Focus the input when an entry enters edit mode.
  useEffect(() => {
    if (editingEntryId !== null && entryInputRef.current) {
      entryInputRef.current.focus();
    }
  }, [editingEntryId]);

  useEffect(() => {
    if (editingSessionId !== null && sessionInputRef.current) {
      sessionInputRef.current.focus();
    }
  }, [editingSessionId, editingSessionTitle]);

  // Phase 3.3: Live Timer Display
  useEffect(() => {
    const interval = setInterval(() => {
      const runningEntry = (word.timeLog || []).find(entry => entry.isRunning);
      if (runningEntry && runningEntry.startTime) {
        setLiveTime(Date.now() - runningEntry.startTime);
      } else {
        // If no timer is running, ensure elapsed time is zero.
        if (liveTime !== 0) setLiveTime(0);
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
    // We depend on word.timeLog to find the running entry.
  }, [word.timeLog, liveTime]);

  const handleUpdateLog = React.useCallback((newTimeLog: TimeLogEntry[]) => {
    onUpdate({ ...word, timeLog: newTimeLog });
  }, [word, onUpdate]);

  const handleAddNewEntry = React.useCallback(() => {
    const newEntry: TimeLogEntry = {
      id: Date.now() + Math.random(),
      description: 'New Entry',
      duration: 0,
      isRunning: false,
      createdAt: Date.now(),
    };
    const newTimeLog = [...(word.timeLog || []), newEntry];
    handleUpdateLog(newTimeLog);
    // Immediately enter edit mode for the new entry
    setEditingEntryId(newEntry.id);
    setEditingEntryDescription(newEntry.description);
  }, [word.timeLog, handleUpdateLog]);

  const handleDeleteEntry = React.useCallback((id: number) => {
    if (confirmingDeleteEntry === id) {
      const newTimeLog = (word.timeLog || []).filter(entry => entry.id !== id);
      handleUpdateLog(newTimeLog);
      setConfirmingDeleteEntry(null);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    } else {
      setConfirmingDeleteEntry(id);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteEntry(null), 3000);
    }
  }, [confirmingDeleteEntry, word.timeLog, handleUpdateLog]);

  const handleSessionCommand = React.useCallback((payload: { command: string, session: TimeLogSession }) => {
    const { command, session: targetSession } = payload;
    const currentSessions = word.timeLogSessions || [];

    switch (command) {
      case 'edit_title': {
        setEditingSessionId(targetSession.id);
        setEditingSessionTitle(targetSession.title);
        break;
      }
      case 'clear_entries': {
        const updatedSessions = currentSessions.map(s => 
          s.id === targetSession.id ? { ...s, entries: [] } : s
        );
        onUpdate({ ...word, timeLogSessions: updatedSessions });
        showToast('Session entries cleared.');
        break;
      }
      case 'delete_session': {
        const updatedSessions = currentSessions.filter(s => s.id !== targetSession.id);
        onUpdate({ ...word, timeLogSessions: updatedSessions });
        showToast('Session deleted.');
        break;
      }
      case 'duplicate_session': {
        const newSession: TimeLogSession = {
          ...targetSession,
          id: Date.now() + Math.random(),
          title: `${targetSession.title} (Copy)`,
        };
        const updatedSessions = [...currentSessions, newSession];
        onUpdate({ ...word, timeLogSessions: updatedSessions });
        showToast('Session duplicated.');
        break;
      }
      case 'copy_session': {
        const textToCopy = formatTimeLogSessionForCopy(targetSession);
        navigator.clipboard.writeText(textToCopy);
        showToast('Session copied as text!');
        break;
      }
      case 'restart_session': {
        let updatedWord = { ...word };
        if (word.timeLog && word.timeLog.length > 0) {
          const newSession: TimeLogSession = { id: Date.now() + Math.random(), title: word.timeLogTitle || `Unsaved Session - ${new Date().toLocaleTimeString()}`, entries: word.timeLog, createdAt: Date.now() };
          updatedWord.timeLogSessions = [...(word.timeLogSessions || []), newSession];
          updatedWord.timeLog = [];
          updatedWord.timeLogTitle = undefined;
          showToast(`Current session saved as "${newSession.title}".`);
        }
        updatedWord.timeLog = targetSession.entries.map((entry): TimeLogEntry => ({ ...entry, id: Date.now() + Math.random(), isRunning: false, startTime: undefined, createdAt: Date.now() }));
        updatedWord.timeLogTitle = targetSession.title;
        onUpdate(updatedWord);
        showToast(`Session "${targetSession.title}" loaded into timer.`);
        break;
      }
    }
  }, [word, onUpdate, showToast]);

  const handleStartEditing = React.useCallback((entry: TimeLogEntry) => {
    setEditingEntryId(entry.id);
    setEditingEntryDescription(entry.description);
  }, []);

  const handleStartEditingDuration = React.useCallback((entry: TimeLogEntry) => {
    setEditingEntryId(entry.id);
    setEditingEntryDuration(formatTime(entry.duration));
  }, []);

  const handleMoveEntry = React.useCallback((entryId: number, direction: 'up' | 'down') => {
    const newTimeLog = [...(word.timeLog || [])];
    const index = newTimeLog.findIndex(e => e.id === entryId);
    if (index === -1) return;

    const item = newTimeLog[index];

    if (direction === 'up' && index > 0) {
      newTimeLog.splice(index, 1);
      newTimeLog.splice(index - 1, 0, item);
    } else if (direction === 'down' && index < newTimeLog.length - 1) {
      newTimeLog.splice(index, 1);
      newTimeLog.splice(index + 1, 0, item);
    }
    handleUpdateLog(newTimeLog);
  }, [word.timeLog, handleUpdateLog]);
  // Effect to handle commands from the context menus
  const handleItemCommand = React.useCallback((payload: { command: string, entryId?: number }) => {
    const handleItemCommand = (payload: { command: string, entryId?: number }) => {
      const { command, entryId } = payload;
      const entry = (word.timeLog || []).find(e => e.id === entryId);
      switch (command) {
        case 'edit_description':
          if (entry) handleStartEditing(entry);
          break;
        case 'delete':
          if (entryId) handleDeleteEntry(entryId);
          break;
        case 'duplicate': {          
          if (!entry) break; // Add a guard in case the entry isn't found
          const newEntry: TimeLogEntry = { ...entry, id: Date.now() + Math.random(), isRunning: false, startTime: undefined };
          const newTimeLog = [...(word.timeLog || [])];
          // Find the index of the item to duplicate
          const index = newTimeLog.findIndex(e => e.id === entryId);
          if (index === -1) break; // If not found, do nothing
          newTimeLog.splice(index + 1, 0, newEntry); // Insert the new entry after the original
          handleUpdateLog(newTimeLog);
          break;
        }
        case 'move_up':
          if (entryId) handleMoveEntry(entryId, 'up');
          break;
        case 'move_down':
          if (entryId) handleMoveEntry(entryId, 'down');
          break;
      }
    };
  }, [word.timeLog, handleStartEditing, handleDeleteEntry, handleUpdateLog, handleMoveEntry]);

  useEffect(() => {
    const handleHeaderCommand = (payload: { command: string, totalTime: number, timeLog: TimeLogEntry[] }) => {
      const { command, totalTime, timeLog } = payload;
      switch (command) {
        case 'copy_total_time':
          navigator.clipboard.writeText(formatTime(totalTime));
          showToast('Total time copied!');
          break;
        case 'copy_log_as_text': {
          const text = timeLog.map(entry => `${entry.description}: ${formatTime(entry.duration)}`).join('\n');
          navigator.clipboard.writeText(text);
          showToast('Log copied as text!');
          break;
        }
        case 'clear_entries':
          handleClearEntries();
          break;
        case 'delete_all':
          handleDeleteAll();
          showToast('Timer Wiped!');
          break;
        case 'add_new_line':
          handleAddNewEntry();
          showToast('New Timer Line Added!');            
          break;
      }
    };

    const cleanupItem = window.electronAPI.on('time-log-item-command', handleItemCommand);
    const cleanupHeader = window.electronAPI.on('time-log-header-command', handleHeaderCommand);

    return () => {
      cleanupItem?.();
      cleanupHeader?.();
    };
  }, [word.timeLog, handleUpdateLog, handleAddNewEntry, showToast, handleItemCommand]);
  const handleSaveEdit = () => {
    if (editingEntryId === null) return;
    const newTimeLog = (word.timeLog || []).map(entry =>
      entry.id === editingEntryId ? { ...entry, description: editingEntryDescription } : entry
    );
    handleUpdateLog(newTimeLog);
    setEditingEntryId(null);
  };
  const handleSaveDurationEdit = () => {
    if (editingEntryId === null) return;
    const newDuration = parseTime(editingEntryDuration);
    const newTimeLog = (word.timeLog || []).map(entry =>
      entry.id === editingEntryId ? { ...entry, duration: newDuration } : entry
    );
    handleUpdateLog(newTimeLog);
    setEditingEntryId(null);
    setEditingEntryDuration('');
  };

  const handleDeleteAll = () => {
    if (confirmingDeleteAll) {
      onUpdate({ ...word, timeLog: [], timeLogTitle: undefined });
      setLiveTimerTitle('Work Timer'); // Reset local state as well
      showToast('Timer Wiped!');
      setConfirmingDeleteAll(false);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    } else {
      setConfirmingDeleteAll(true);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteAll(false), 3000);
    }
  };

  const handleClearEntries = () => {
    if (confirmingDeleteAll) { // Reuse the same confirmation state for simplicity
      handleUpdateLog([]);
      showToast('Timer entries cleared.');
      setConfirmingDeleteAll(false);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    } else {
      setConfirmingDeleteAll(true);
      showToast('Confirm clear?', 2000);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteAll(false), 3000);
    }
  };

  // Phase 3.1 & 3.2: Single Active Timer and Start/Stop/Resume Logic
  const handleToggleTimer = (toggledEntryId: number) => {
    const now = Date.now();
    let newTimeLog = (word.timeLog || []).map(entry => {
      // First, stop any other entry that might be running.
      if (entry.isRunning && entry.id !== toggledEntryId) {
        const elapsed = now - (entry.startTime || now);
        return { ...entry, duration: entry.duration + elapsed, isRunning: false, startTime: undefined };
      }
      return entry;
    });

    newTimeLog = newTimeLog.map(entry => {
      if (entry.id === toggledEntryId) {
        if (entry.isRunning) {
          // Pause the clicked entry
          const elapsed = now - (entry.startTime || now);
          return { ...entry, duration: entry.duration + elapsed, isRunning: false, startTime: undefined };
        } else {
          // Start the clicked entry
          return { ...entry, isRunning: true, startTime: now };
        }
      }
      return entry;
    });

    handleUpdateLog(newTimeLog);
  };

  const handleBulkAdd = () => {
    if (!bulkAddText.trim()) return;

    const allLines = bulkAddText.split('\n').map(line => line.trim());
    let updatedWord = { ...word };
    let potentialTitle: string | null = null;

    // More flexible title detection: find the first non-empty line before a separator.
    const separatorIndex = allLines.findIndex(line => line.startsWith('---') || line.startsWith('Total Duration:'));
    if (separatorIndex > 0) {
      // Find the first non-empty line before the separator.
      for (let i = 0; i < separatorIndex; i++) {
        if (allLines[i]) {
          potentialTitle = allLines[i];
          break;
        }
      }
    }

    if (potentialTitle) {
      setLiveTimerTitle(potentialTitle);
      updatedWord.timeLogTitle = potentialTitle;
    }

    // Simplified entry filtering: ignore blank lines, separators, and the detected title.
    const entryLines = allLines.filter(line => line && !line.startsWith('---') && !line.startsWith('Total Duration:') && line !== potentialTitle);

    const newEntries: TimeLogEntry[] = entryLines.map(line => {
      const timeRegex = /(\d{2}:\d{2}:\d{2})$/;
      const match = line.match(timeRegex);
      const description = match ? line.substring(0, match.index).trim().replace(/:$/, '').trim() : line.trim();
      const duration = match ? parseTime(match[0]) : 0;      
      return { id: Date.now() + Math.random(), description, duration, isRunning: false, createdAt: Date.now() };
    });

    updatedWord.timeLog = [...(word.timeLog || []), ...newEntries];
    setBulkAddText('');
    onUpdate(updatedWord); // Single update call
  };

  // Central handler for session context menu commands
  useEffect(() => {
    const cleanup = window.electronAPI.on('time-log-session-command', handleSessionCommand);
    return () => cleanup?.();
  }, [handleSessionCommand]);

  // --- NEW SESSION LOGIC ---
  const handlePostTimeLog = () => {
    // First, ensure the latest title from the input is saved to the main word object.
    onUpdate({ ...word, timeLogTitle: liveTimerTitle });

    if (!timeLog || timeLog.length === 0) {
      showToast('Current time log is empty.', 3000, 'error');
      return;
    }

    let finalTimeLog = [...timeLog];
    const runningEntryIndex = finalTimeLog.findIndex(e => e.isRunning);

    // If a timer is running, stop it and add the final elapsed time.
    // This is the potential race condition. We will fix it here.
    if (runningEntryIndex !== -1) {
      const runningEntry = finalTimeLog[runningEntryIndex];
      // Calculate elapsed time atomically at the moment of posting.
      const elapsed = Date.now() - (runningEntry.startTime || Date.now());
      const finalDuration = runningEntry.duration + elapsed;
      finalTimeLog[runningEntryIndex] = { ...runningEntry, duration: finalDuration, isRunning: false, startTime: undefined };
    }

    const newSession: TimeLogSession = {
      id: Date.now() + Math.random(),
      title: liveTimerTitle || 'New Log Session',
      createdAt: Date.now(),
      entries: finalTimeLog // Use the final, updated log
    };

    const updatedSessions = [...(word.timeLogSessions || []), newSession];

    onUpdate({
      ...word,
      timeLogSessions: updatedSessions,
      timeLog: [], // Clear the current log
      timeLogTitle: undefined, // Clear the title
    });

    // Set state to edit the new session's title
    setEditingSessionId(newSession.id);
    setEditingSessionTitle(newSession.title);

    // Reset the live timer's title for the next session.
    setLiveTimerTitle('Work Timer');
  };

  const handleUpdateSessionTitle = (sessionId: number) => {
    const updatedSessions = (word.timeLogSessions || []).map(session =>
      session.id === sessionId ? { ...session, title: editingSessionTitle } : session
    );
    onUpdate({ ...word, timeLogSessions: updatedSessions });
    setEditingSessionId(null);
  };
  const handleClearAllSessions = () => {
    if (confirmingDeleteAllSessions) {
      onUpdate({ ...word, timeLogSessions: [] });
      showToast('All time log sessions cleared.');
      setConfirmingDeleteAllSessions(false);
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
    } else {
      setConfirmingDeleteAllSessions(true);
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
      confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteAllSessions(false), 3000);
    }
  };

  const handleClearSessionEntries = (sessionId: number) => {
    if (confirmingDeleteAllSessions) {
      onUpdate({ ...word, timeLogSessions: [] });
      showToast('All time log sessions cleared.');
      setConfirmingDeleteAllSessions(false);
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
    } else {
      setConfirmingDeleteAllSessions(true);
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
      confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteAllSessions(false), 3000);
    }
    if (confirmingClearSession === sessionId) {
      const updatedSessions = (word.timeLogSessions || []).map(session =>
        session.id === sessionId ? { ...session, entries: [] } : session
      );
      onUpdate({ ...word, timeLogSessions: updatedSessions });
      showToast('Session entries cleared.');
      setConfirmingClearSession(null);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    } else {
      setConfirmingClearSession(sessionId);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmingClearSession(null), 3000);
    }
  };

  const handleStartEditingSessionEntry = (session: TimeLogSession, entry: TimeLogEntry, field: 'description' | 'duration') => {
    setEditingSessionEntry({ sessionId: session.id, entryId: entry.id, field });
    if (field === 'description') {
      setEditingSessionEntryValue(entry.description);
    } else {
      setEditingSessionEntryValue(formatTime(entry.duration));
    }
  };

  const handleSaveSessionEntry = () => {
    if (!editingSessionEntry) return;

    const { sessionId, entryId, field } = editingSessionEntry;

    const updatedSessions = (word.timeLogSessions || []).map(session => {
      if (session.id !== sessionId) return session;

      const updatedEntries = session.entries.map(entry => {
        if (entry.id !== entryId) return entry;

        if (field === 'description') {
          return { ...entry, description: editingSessionEntryValue };
        } else {
          return { ...entry, duration: parseTime(editingSessionEntryValue) };
        }
      });
      return { ...session, entries: updatedEntries };
    });

    onUpdate({ ...word, timeLogSessions: updatedSessions });
    setEditingSessionEntry(null);
    setEditingSessionEntryValue('');
  };

  const handleDeleteSessionEntry = (sessionId: number, entryId: number) => {
    if (confirmingDeleteSessionEntry === entryId) {
      const updatedSessions = (word.timeLogSessions || []).map(session => {
        if (session.id !== sessionId) return session;
        const updatedEntries = session.entries.filter(entry => entry.id !== entryId);
        return { ...session, entries: updatedEntries };
      });
      onUpdate({ ...word, timeLogSessions: updatedSessions });
      showToast('Session entry deleted.');
      setConfirmingDeleteSessionEntry(null);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    } else {
      setConfirmingDeleteSessionEntry(entryId);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteSessionEntry(null), 3000);
    }
  };

  const handleToggleSession = (sessionId: number) => {
    setOpenSessionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) newSet.delete(sessionId);
      else newSet.add(sessionId);
      return newSet;
    });
  };

  const calculateSessionDuration = (session: TimeLogSession) => {
    return session.entries.reduce((acc, entry) => acc + entry.duration, 0);
  };

  const totalSessionsTime = React.useMemo(() => {
    return (word.timeLogSessions || []).reduce((total, session) => {
      return total + calculateSessionDuration(session);
    }, 0);
  }, [word.timeLogSessions]);

  // --- NEW TABLE SORTING LOGIC ---
  const [sessionSortConfig, setSessionSortConfig] = useState<{ key: 'title' | 'createdAt' | 'totalTime', direction: 'ascending' | 'descending' }>({ key: 'createdAt', direction: 'descending' });

  const sortedSessions = React.useMemo(() => {
    const sessions = word.timeLogSessions || [];
    return [...sessions].sort((a, b) => {
      const { key, direction } = sessionSortConfig;
      let aValue: any, bValue: any;

      if (key === 'totalTime') {
        aValue = calculateSessionDuration(a);
        bValue = calculateSessionDuration(b);
      } else {
        aValue = a[key] || (key === 'createdAt' ? 0 : '');
        bValue = b[key] || (key === 'createdAt' ? 0 : '');
      }

      if (aValue < bValue) return direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [word.timeLogSessions, sessionSortConfig]);
  // --- END NEW SESSION LOGIC ---

  const timeLog = word.timeLog || [];
  const runningEntry = timeLog.find(entry => entry.isRunning);

  // Calculate total time by summing the duration of all entries.
  const totalTime = timeLog.reduce((sum, entry) => sum + entry.duration, 0) + (runningEntry ? liveTime : 0);

  return (
    <div className="time-tracker-log" style={{width: '100%'}}>
      <header
        className="time-tracker-header"
        onContextMenu={(e) => {
          e.preventDefault();
          window.electronAPI.showTimeLogHeaderContextMenu({
            totalTime,
            timeLog,
            x: e.clientX,
            y: e.clientY,
          });
        }}
      >
        <div className="time-tracker-header-left">
          <i className="fas fa-stopwatch" onDoubleClick={() => setIsEditingTitle(true)}></i>
          {isEditingTitle ? (
            <input
              type="text"
              value={liveTimerTitle}
              onChange={(e) => setLiveTimerTitle(e.target.value)}
              onBlur={() => {
                onUpdate({ ...word, timeLogTitle: liveTimerTitle });
                setIsEditingTitle(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                  onUpdate({ ...word, timeLogTitle: liveTimerTitle });
                  setIsEditingTitle(false);
                }
              }}
              className="inline-edit-input"
              autoFocus
            />
          ) : (
            <span onDoubleClick={() => setIsEditingTitle(true)}>{liveTimerTitle}</span>
          )}
          <span className="total-time">{formatTime(totalTime)}</span>
        </div>
        <div className="time-tracker-header-right-actions">
          <button onClick={() => {
            navigator.clipboard.writeText(formatTime(totalTime));
            showToast('Total time copied!');
          }} className="icon-button" title="Copy Total Time">
            <i className="fas fa-copy"></i>
          </button>
          <button onClick={() => {
            const text = timeLog.map(entry => `${entry.description}: ${formatTime(entry.duration)}`).join('\n');
            navigator.clipboard.writeText(text);
            showToast('Log copied as text!');
          }} className="icon-button" title="Copy Log as Text">
            <i className="fas fa-paste"></i>
          </button>
        </div>
        <div className="time-tracker-header-right">
          {/* New "Post Log" button */}
          <button onClick={handlePostTimeLog} className="icon-button" title="Post Current Time Log">
            <i className="fas fa-paper-plane"></i>
          </button>
          <button onClick={handleAddNewEntry} className="icon-button" title="Add New Line">
            <i className="fas fa-plus"></i>
          </button>
          <button onClick={handleClearEntries} className={`icon-button ${confirmingDeleteAll ? 'confirm-delete' : ''}`} title="Clear All Entries">
            <i className={`fas ${confirmingDeleteAll ? 'fa-check' : 'fa-broom'}`}></i>
          </button>
          <button onClick={handleDeleteAll} className={`icon-button ${confirmingDeleteAll ? 'confirm-delete' : ''}`} title="Wipe Timer (Delete All & Title)">
            <i className={`fas ${confirmingDeleteAll ? 'fa-check' : 'fa-trash'}`}></i>
          </button>
        </div>
      </header>
      <div className="time-log-entries">
        {timeLog.map((entry, index) => (
          <div
            key={entry.id}
            className="time-log-entry"
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.electronAPI.showTimeLogItemContextMenu({
                entry,
                index,
                totalEntries: timeLog.length,
                x: e.clientX,
                y: e.clientY,
              });
            }}
          >
            <div className="time-log-entry-main">
              <button onClick={() => handleToggleTimer(entry.id)} className="icon-button-small" title={entry.isRunning ? 'Pause' : 'Start'}>
                <i className={`fas ${entry.isRunning ? 'fa-pause-circle' : 'fa-play-circle'}`} style={{ color: entry.isRunning ? '#f44336' : '#4CAF50' }}></i>
              </button>
              <div className="entry-description" onDoubleClick={() => handleStartEditing(entry)}>
                {editingEntryId === entry.id ? (
                  <input
                    ref={entryInputRef}
                    type="text"
                    value={editingEntryDescription}
                    onChange={(e) => setEditingEntryDescription(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                    className="inline-edit-input"
                  />
                ) : (
                  <span>{entry.description}</span>
                )}
              </div>
              {editingEntryId === entry.id && editingEntryDuration ? (
                <input
                  type="text"
                  value={editingEntryDuration}
                  onChange={(e) => setEditingEntryDuration(e.target.value)}
                  onBlur={handleSaveDurationEdit}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveDurationEdit()}
                  className="inline-edit-input"
                  style={{ textAlign: 'right', minWidth: '80px' }}
                  autoFocus
                />
              ) : (
                <span className="entry-duration" onDoubleClick={() => handleStartEditingDuration(entry)}>{formatTime(entry.duration + (entry.isRunning ? liveTime : 0))}</span>
              )}
            </div>
            <div className="time-log-entry-actions">
              <button onClick={() => handleStartEditing(entry)} className="icon-button-small" title="Edit Description">
                <i className="fas fa-pencil-alt"></i>
              </button>
              <button onClick={() => {
                const newEntry: TimeLogEntry = { ...entry, id: Date.now() + Math.random(), isRunning: false, startTime: undefined };
                const newTimeLog = [...(word.timeLog || [])];
                newTimeLog.splice(index + 1, 0, newEntry);
                handleUpdateLog(newTimeLog);
              }} className="icon-button-small" title="Duplicate Entry"><i className="fas fa-copy"></i></button>
              <button onClick={() => handleMoveEntry(entry.id, 'up')} className="icon-button-small" title="Move Up" disabled={index === 0}>
                <i className="fas fa-arrow-up"></i>
              </button>
              <button onClick={() => handleMoveEntry(entry.id, 'down')} className="icon-button-small" title="Move Down" disabled={index === timeLog.length - 1}>
                <i className="fas fa-arrow-down"></i>
              </button>
              <button onClick={() => handleDeleteEntry(entry.id)} className={`icon-button-small ${confirmingDeleteEntry === entry.id ? 'confirm-delete' : ''}`} title="Delete Entry">
                <i className={`fas ${confirmingDeleteEntry === entry.id ? 'fa-check' : 'fa-trash'}`}></i>
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="bulk-add-container">
        <textarea
          value={bulkAddText}
          onChange={(e) => setBulkAddText(e.target.value)}
          placeholder="Paste multiple lines to bulk add entries..."
          rows={3}
        />
        <button onClick={handleBulkAdd}>Add from Text</button>
      </div>

      {/* --- NEW SESSION RENDERING LOGIC --- */}
      {(word.timeLogSessions && word.timeLogSessions.length > 0) && (
        <div className="time-log-sessions-container">
          <header>
            <i className="fas fa-history"></i>
            <span>Time Logs</span>
            <span className="total-time" style={{ marginLeft: '10px', fontSize: '12px' }}>
              (Total: {formatTime(totalSessionsTime)})
            </span>
            <button
              onClick={handleClearAllSessions}
              className={`icon-button-small ${confirmingDeleteAllSessions ? 'confirm-delete' : ''}`}
              title="Clear All Sessions"
              style={{ marginLeft: 'auto' }}
            ><i className={`fas ${confirmingDeleteAllSessions ? 'fa-check' : 'fa-trash'}`}></i></button>
          </header>          
          <table className="report-table time-log-session-table">
            <thead>
              <tr>
                <th onClick={() => setSessionSortConfig(prev => ({ key: 'title', direction: prev.key === 'title' && prev.direction === 'ascending' ? 'descending' : 'ascending' }))}>
                  Title {sessionSortConfig.key === 'title' && (sessionSortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th onClick={() => setSessionSortConfig(prev => ({ key: 'createdAt', direction: prev.key === 'createdAt' && prev.direction === 'ascending' ? 'descending' : 'ascending' }))}>
                  Saved At {sessionSortConfig.key === 'createdAt' && (sessionSortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th onClick={() => setSessionSortConfig(prev => ({ key: 'totalTime', direction: prev.key === 'totalTime' && prev.direction === 'ascending' ? 'descending' : 'ascending' }))}>
                  Total Time {sessionSortConfig.key === 'totalTime' && (sessionSortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedSessions.map(session => (
                <React.Fragment key={session.id}>
                  <tr
                    className="time-log-session-item"
                    onClick={() => handleToggleSession(session.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.electronAPI.showTimeLogSessionContextMenu({ session, x: e.clientX, y: e.clientY });
                    }}
                  >
                    <td onDoubleClick={(e) => { e.stopPropagation(); setEditingSessionId(session.id); setEditingSessionTitle(session.title); }}>
                      <i className={`fas ${openSessionIds.has(session.id) ? 'fa-chevron-down' : 'fa-chevron-right'}`} style={{ marginRight: '8px' }}></i>
                      {editingSessionId === session.id ? (
                        <input ref={sessionInputRef} type="text" value={editingSessionTitle} onChange={(e) => setEditingSessionTitle(e.target.value)} onBlur={() => handleUpdateSessionTitle(session.id)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateSessionTitle(session.id)} onClick={(e) => e.stopPropagation()} className="inline-edit-input" />
                      ) : (
                        <span>{session.title}</span>
                      )}
                    </td>
                    <td>{session.createdAt ? new Date(session.createdAt).toLocaleString() : 'N/A'}</td>
                    <td>{formatTime(calculateSessionDuration(session))}</td>
                    <td>
                      <div className="time-log-entry-actions" style={{ justifyContent: 'center' }}>
                        <button onClick={(e) => { e.stopPropagation(); handleSessionCommand({ command: 'restart_session', session }); }} className="icon-button-small" title="Restart Session (Load to Timer)">
                          <i className="fas fa-play-circle"></i>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleSessionCommand({ command: 'duplicate_session', session }); }} className="icon-button-small" title="Duplicate Session">
                          <i className="fas fa-copy"></i>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleSessionCommand({ command: 'copy_session', session }); }} className="icon-button-small" title="Copy Session as Text">
                          <i className="fas fa-paste"></i>
                        </button>
                        <button onClick={(e) => {
                          e.stopPropagation();
                          if (confirmingDeleteSession === session.id) { handleSessionCommand({ command: 'delete_session', session }); setConfirmingDeleteSession(null); if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
                          } else { setConfirmingDeleteSession(session.id); if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current); confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteSession(null), 3000); }
                        }} className={`icon-button-small ${confirmingDeleteSession === session.id ? 'confirm-delete' : ''}`} title="Delete Session">
                          <i className={`fas ${confirmingDeleteSession === session.id ? 'fa-check' : 'fa-trash'}`}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {openSessionIds.has(session.id) && (
                    <tr className="time-log-session-details-row">
                      <td colSpan={4}>
                        <div className="time-log-session-entries-header">                          
                          <span>Entries ({session.entries.length})</span>                          
                          <div className="time-log-session-header-actions">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const text = session.entries.map(entry => `${entry.description}: ${formatTime(entry.duration)}`).join('\n');
                                navigator.clipboard.writeText(text);
                                showToast('All entries copied!');
                              }}
                              className="icon-button-small"
                              title="Copy All Entries"
                            >
                              <i className="fas fa-paste"></i>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleClearSessionEntries(session.id); }}
                              className={`icon-button-small ${confirmingClearSession === session.id ? 'confirm-delete' : ''}`}
                              title="Clear All Entries in this Session"
                            >
                              <i className={`fas ${confirmingClearSession === session.id ? 'fa-check' : 'fa-broom'}`}></i>
                            </button>
                          </div>
                        </div>
                        <div className="time-log-session-entries">
                          {session.entries.map(entry => {
                            const isEditingDescription = editingSessionEntry?.sessionId === session.id && editingSessionEntry?.entryId === entry.id && editingSessionEntry?.field === 'description';
                            const isEditingDuration = editingSessionEntry?.sessionId === session.id && editingSessionEntry?.entryId === entry.id && editingSessionEntry?.field === 'duration';
                            return (
                            <div key={entry.id} className="time-log-entry">
                              <div className="time-log-entry-main">
                                <div className="entry-description" onDoubleClick={() => handleStartEditingSessionEntry(session, entry, 'description')}>
                                  {isEditingDescription ? (
                                    <input type="text" value={editingSessionEntryValue} onChange={(e) => setEditingSessionEntryValue(e.target.value)} onBlur={handleSaveSessionEntry} onKeyDown={(e) => e.key === 'Enter' && handleSaveSessionEntry()} className="inline-edit-input" autoFocus />
                                  ) : ( <span>{entry.description}</span> )}
                                </div>
                                <div className="entry-duration" onDoubleClick={() => handleStartEditingSessionEntry(session, entry, 'duration')}>
                                  {isEditingDuration ? (
                                    <input type="text" value={editingSessionEntryValue} onChange={(e) => setEditingSessionEntryValue(e.target.value)} onBlur={handleSaveSessionEntry} onKeyDown={(e) => e.key === 'Enter' && handleSaveSessionEntry()} className="inline-edit-input" style={{ textAlign: 'right', minWidth: '80px' }} autoFocus />
                                  ) : ( <span>{formatTime(entry.duration)}</span> )}
                                </div>
                              </div>
                              <div className="time-log-entry-actions" style={{ minWidth: '75px' }}>
                                <button onClick={() => {
                                  const textToCopy = `${entry.description}: ${formatTime(entry.duration)}`;
                                  navigator.clipboard.writeText(textToCopy);
                                  showToast('Entry copied!');
                                }} className="icon-button-small" title="Copy Entry">
                                  <i className="fas fa-copy"></i>
                                </button>
                                <button onClick={() => handleDeleteSessionEntry(session.id, entry.id)} className={`icon-button-small ${confirmingDeleteSessionEntry === entry.id ? 'confirm-delete' : ''}`} title="Delete Entry">
                                  <i className={`fas ${confirmingDeleteSessionEntry === entry.id ? 'fa-check' : 'fa-trash'}`}></i>
                                </button>
                              </div>
                            </div>
                          )})}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* --- END NEW SESSION RENDERING LOGIC --- */}
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
defaultSettings.showChecklistNotes = true; // Default to showing notes
defaultSettings.openChecklistSectionIds = []; // Initialize as empty array
defaultSettings.showChecklistResponses = true; // Default to showing responses

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
const formatChecklistSectionRawForCopy = (section: ChecklistSection): string => {
  return section.items.map(item => item.text).join('\n');
};

const extractUrlFromText = (text: string): string | null => {
  if (!text) return null;
  // A simple regex to find the first http/https URL in a string.
  const urlRegex = /(https?:\/\/[^\s]+)/;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
};
const ClickableText = ({ text, settings }: { text: string, settings: Settings }) => {
  const url = extractUrlFromText(text);

  if (!url) {
    return <span className="checklist-item-text">{text}</span>;
  }

  const parts = text.split(url);
  return (
    <span className="checklist-item-text">
      {parts[0]}
      <a href={url} onClick={(e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent toggling the checkbox
        window.electronAPI.openExternalLink({ url, browserPath: settings.browsers[settings.activeBrowserIndex]?.path });
      }}>{url}</a>
      {parts[1]}
    </span>
  );
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
  onUpdate, // This is correct
  onNotify,
  allWords
}: { 
  word: Word, settings: Settings, onCategoryClick: (e: React.MouseEvent, catId: number, parentId?: number) => void, onUpdate?: (updatedWord: Word) => void, onNotify?: (word: Word) => void, allWords: Word[]
}) {
  return (
    <>
      <div className="accordion-title-container">
        <span className="accordion-main-title">{word.text}</span>
        <span className="task-id-display">(ID: {word.id})</span>
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
      {word.startsTaskIdOnComplete && (
        (() => {
          const successorTask = allWords.find(w => w.id === word.startsTaskIdOnComplete);
          // A loop exists if the successor task links back to the current task.
          const isLoop = successorTask?.startsTaskIdOnComplete === word.id;
          return (
            <div className="linked-task-display">
              <i className={`fas ${isLoop ? 'fa-sync-alt' : 'fa-link'}`} title={isLoop ? 'This task is part of a loop.' : 'This task starts another.'}></i>
              <span>
                Completing starts: <strong>{successorTask?.text || 'Unknown Task'} (ID: {word.startsTaskIdOnComplete})</strong>
              </span>
            </div>
          );
        })()
      )}
    </>
  );
}

const Footer = React.memo(() => {
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
});

function App() {  
  const [inboxMessages, setInboxMessages] = useState<InboxMessage[]>([]);
  const [archivedMessages, setArchivedMessages] = useState<InboxMessage[]>([]);
  const [trashedMessages, setTrashedMessages] = useState<InboxMessage[]>([]);  
  const [activeInboxTab, setActiveInboxTab] = useState<'active' | 'archived' | 'trash'>('active');  
  const [fullTaskViewId, setFullTaskViewId] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);  
  const wordsRef = useRef<Word[]>([]);  
  const [inputValue, setInputValue] = useState("");  
  const [words, setWords] = useState<Word[]>([]);  
  const [wordPlacementIndex, setWordPlacementIndex] = useState(0);  
  const [completedWords, setCompletedWords] = useState<Word[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [viewHistory, setViewHistory] = useState(['meme']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [editingWordId, setEditingWordId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");  
  const [bulkAddText, setBulkAddText] = useState("");  
  const [isPromptOpen, setIsPromptOpen] = useState(false);  
  const [hoveredWordId, setHoveredWordId] = useState<number | null>(null);  
  const copyStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [copyStatus, setToastStatus] = useState('');  
  const isInitialLoad = useRef(true);  
  const [isLoading, setIsLoading] = useState(true);  
  const [isDirty, setIsDirty] = useState(false);  
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);
  const [autoSaveCountdown, setAutoSaveCountdown] = useState(300);
  const AUTO_SAVE_INTERVAL_SECONDS = 300;
  const [updateTimers, setUpdateTimers] = useState<{ [key: number]: NodeJS.Timeout }>({});  
  const wordsRefForDebounce = useRef(words);
  wordsRefForDebounce.current = words;  
  const activeCategoryId = settings.activeCategoryId ?? 'all';
  const activeSubCategoryId = settings.activeSubCategoryId ?? 'all';
  const [editingViaContext, setEditingViaContext] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const newTaskTitleInputRef = useRef<HTMLInputElement>(null);
  const sortSelectRef = useRef<HTMLSelectElement>(null);
  const snoozeTimeSelectRef = useRef<HTMLSelectElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);  
  const [timerNotifications, setTimerNotifications] = useState<Word[]>([]);  
  const [overdueNotifications, setOverdueNotifications] = useState<Set<number>>(new Set());  
  const activeChecklistRef = useRef<{ handleUndo: () => void; handleRedo: () => void; } | null>(null);  
  const inboxMessagesRef = useRef(inboxMessages);
  inboxMessagesRef.current = inboxMessages;  
  const archivedMessagesRef = useRef(archivedMessages);
  archivedMessagesRef.current = archivedMessages;  
  const trashedMessagesRef = useRef(trashedMessages);
  trashedMessagesRef.current = trashedMessages;  
  const overdueMessageSentRef = useRef(new Set<number>());  
  const [isChecklistPromptOpen, setIsChecklistPromptOpen] = useState(false);
  const [editingChecklistItem, setEditingChecklistItem] = useState<{ sectionId: number; itemId: number; field: 'response' | 'note'; currentText: string; } | null>(null);
  const [confirmingClearCompleted, setConfirmingClearCompleted] = useState(false);
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [focusChecklistItemId, setFocusChecklistItemId] = useState<number | null>(null);
  const showToast = (message: string, duration: number = 2000) => {    
    if (copyStatusTimeoutRef.current) {
      clearTimeout(copyStatusTimeoutRef.current);
    }      
    setToastStatus(message);    
    copyStatusTimeoutRef.current = setTimeout(() => {
      setToastStatus('');
      copyStatusTimeoutRef.current = null;
    }, duration);
  };
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
    showToast(isNowImportant ? "Message marked as important." : "Message unmarked as important.");
    setIsDirty(true); // Mark that we have unsaved changes
  };
  const handleArchiveInboxMessage = (messageId: number) => {
    const messageToArchive = inboxMessages.find(msg => msg.id === messageId);
    if (!messageToArchive) return;

    // Add to archived list and remove from active inbox
    setArchivedMessages(prev => [{ ...messageToArchive, isArchived: true }, ...prev]);
    setInboxMessages(prev => prev.filter(msg => msg.id !== messageId));

    showToast("Message archived.");
    setIsDirty(true);
  };
  const handleUnarchiveInboxMessage = (messageId: number) => {
    const messageToUnarchive = archivedMessages.find(msg => msg.id === messageId);
    if (!messageToUnarchive) return;

    // Add back to active inbox and remove from archived list
    setInboxMessages(prev => [{ ...messageToUnarchive, isArchived: false }, ...prev]);
    setArchivedMessages(prev => prev.filter(msg => msg.id !== messageId));

    showToast("Message un-archived.");
    setIsDirty(true);
  };
  const handleRestoreFromTrash = (messageId: number) => {
    const messageToRestore = trashedMessages.find(msg => msg.id === messageId);
    if (!messageToRestore) return;

    // Add back to active inbox and remove from trash
    setInboxMessages(prev => [messageToRestore, ...prev]);
    setTrashedMessages(prev => prev.filter(msg => msg.id !== messageId));

    showToast("Message restored from trash.");
    setIsDirty(true);
  };
  const handleDeletePermanently = (messageId: number) => {
    // Permanently remove the message from the trash
    setTrashedMessages(prev => prev.filter(msg => msg.id !== messageId));

    showToast("Message permanently deleted.");
    setIsDirty(true);
  };
  const handleEmptyTrash = () => {
    if (window.confirm(`Are you sure you want to permanently delete all ${trashedMessages.length} items in the trash? This cannot be undone.`)) {
      setTrashedMessages([]);
      showToast("Trash has been emptied.");
      setIsDirty(true);
    }
  };
  const handleDismissArchivedMessage = (messageId: number) => {
    const messageToTrash = archivedMessages.find(m => m.id === messageId);
    if (!messageToTrash) return;

    // Move the message from archive to the trash state
    setTrashedMessages(prev => [messageToTrash, ...prev]);
    setArchivedMessages(prev => prev.filter(m => m.id !== messageId));

    showToast("Message moved from archive to trash.");
    setIsDirty(true);
  };
  const handleRestoreAllFromTrash = () => {
    if (window.confirm('Are you sure you want to restore all items from the trash?')) {
      setInboxMessages(prev => [...prev, ...trashedMessages]);
      setTrashedMessages([]);
      showToast('All messages restored from trash.');
      setIsDirty(true);
    }
  };
  const handleTrashAllArchived = () => {
    if (window.confirm(`Are you sure you want to move all ${archivedMessages.length} archived messages to the trash?`)) {
      setTrashedMessages(prev => [...prev, ...archivedMessages]);
      setArchivedMessages([]);
      showToast('All archived messages moved to trash.');
      setIsDirty(true);
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
    text: '', // This will be inferred as string, not string | undefined
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
  } as Partial<Word>);
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

  const handleDuplicateTask = React.useCallback((taskToCopy: Word) => {
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
    showToast('Task duplicated!');
  }, []); // No dependencies on state that would cause re-creation
  
  const handleCompleteWord = React.useCallback((wordToComplete: Word) => {
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
    showToast('Task completed!');

    // --- Refactored Recurring and Alternating Task Logic ---

    let newRecurringTask: Word | null = null;

    // Determine if a new recurring task should be created
    if (wordToComplete.isRecurring || wordToComplete.isDailyRecurring || wordToComplete.isWeeklyRecurring || wordToComplete.isMonthlyRecurring || wordToComplete.isYearlyRecurring) {
      let newOpenDate = Date.now();
      let newCompleteBy: number | undefined = undefined;

      if (wordToComplete.isDailyRecurring) {
        newOpenDate += 24 * 60 * 60 * 1000;
        if (wordToComplete.completeBy) newCompleteBy = wordToComplete.completeBy + 24 * 60 * 60 * 1000;
      } else if (wordToComplete.isWeeklyRecurring) {
        newOpenDate += 7 * 24 * 60 * 60 * 1000;
        if (wordToComplete.completeBy) newCompleteBy = wordToComplete.completeBy + 7 * 24 * 60 * 60 * 1000;
      } else if (wordToComplete.isMonthlyRecurring) {
        const d = new Date(newOpenDate);
        d.setMonth(d.getMonth() + 1);
        newOpenDate = d.getTime();
        if (wordToComplete.completeBy) {
          const cbd = new Date(wordToComplete.completeBy);
          cbd.setMonth(cbd.getMonth() + 1);
          newCompleteBy = cbd.getTime();
        }
      } else if (wordToComplete.isYearlyRecurring) {
        const d = new Date(newOpenDate);
        d.setFullYear(d.getFullYear() + 1);
        newOpenDate = d.getTime();
        if (wordToComplete.completeBy) {
          const cbd = new Date(wordToComplete.completeBy);
          cbd.setFullYear(cbd.getFullYear() + 1);
          newCompleteBy = cbd.getTime();
        }
      } else if (wordToComplete.isRecurring && wordToComplete.completeBy && wordToComplete.createdAt) {
        const originalDuration = wordToComplete.completeBy - wordToComplete.createdAt;
        newCompleteBy = Date.now() + originalDuration;
      }

      newRecurringTask = {
        ...wordToComplete,
        id: Date.now() + Math.random(),
        createdAt: newOpenDate,
        openDate: newOpenDate,
        completedDuration: undefined,
        completeBy: newCompleteBy,
        startsTaskIdOnComplete: wordToComplete.startsTaskIdOnComplete,
      };
    }

    // --- Alternating Task & Loop Logic ---
    if (wordToComplete.startsTaskIdOnComplete) {
      const successorTaskId = wordToComplete.startsTaskIdOnComplete;
      setWords(prevWords => {
        let newWords = prevWords.map(w => {
          if (w.id !== successorTaskId) return w;
          
          // This is the successor task. Activate it.
          const updatedSuccessor = { ...w, openDate: Date.now(), completeBy: Date.now() };
          
          // If the successor was part of a loop, we need to update its link.
          if (w.startsTaskIdOnComplete === wordToComplete.id && newRecurringTask) {
            updatedSuccessor.startsTaskIdOnComplete = newRecurringTask.id;
          }
          return updatedSuccessor;
        });

        // Add the new recurring task if it was created
        if (newRecurringTask) {
          newWords = [newRecurringTask, ...newWords];
        }

        return newWords;
      });
    } else if (newRecurringTask) {
      // If there's no successor but there is a recurring task, just add it.
      setWords(prev => [newRecurringTask, ...prev]);
    }
  }, [words]);
  
  const removeWord = React.useCallback((idToRemove: number) => {
    // Remove from either list, whichever one it's in.
    const wasInActive = words.some(w => w.id === idToRemove);
    const wordToRemove = words.find(w => w.id === idToRemove) || completedWords.find(w => w.id === idToRemove);

    if (wasInActive) {
      setWords(prev => prev.filter(word => word.id !== idToRemove));
    } else {
      setCompletedWords(prev => prev.filter(word => word.id !== idToRemove));
    }

    if (wordToRemove) {
      setInboxMessages(prev => [{
        id: Date.now() + Math.random(),
        type: 'deleted',
        text: `Task deleted: "${wordToRemove.text}"`,
        timestamp: Date.now(),
      }, ...prev]);
    }
    showToast('Task removed.');
  }, [words, completedWords]);

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
        case 'view':
          // Set the tab to 'ticket' (view mode)
          setSettings(prev => ({
            ...prev,
            activeTaskTabs: { ...prev.activeTaskTabs, [wordId]: 'ticket' }
          }));
          // Open the accordion if it's closed
          if (!settings.openAccordionIds.includes(wordId)) {
            handleAccordionToggle(wordId);
          }
          break;
        case 'edit':
          // Guard: Only edit active (non-completed) tasks.
          if (!targetWord.completedDuration) {
            // Set the tab to 'edit' and open the accordion
            setSettings(prev => ({ ...prev, activeTaskTabs: { ...prev.activeTaskTabs, [wordId]: 'edit' }, openAccordionIds: [...new Set([...prev.openAccordionIds, wordId])] }));
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
  }, [words, completedWords, handleCompleteWord, handleDuplicateTask, removeWord]); 
  // Dependency on words ensures the handler has the latest list

  const handleSaveProject = React.useCallback(async () => {
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

    showToast('Project saved!');
  }, [isLoading, words, completedWords, settings, inboxMessages, archivedMessages, trashedMessages]);
  
  const navigateToView = (view: 'meme' | 'list' | 'reports' | 'inbox') => {
    // If we are navigating to a new view from the current point in history
    const newHistory = viewHistory.slice(0, historyIndex + 1);
    newHistory.push(view);
    setViewHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setSettings(prev => ({ ...prev, currentView: view }));
  };
  const handleChecklistCompletion = React.useCallback((item: ChecklistItem, sectionId: number, updatedSections: ChecklistSection[]) => {
    // This handler is now ONLY for individual item completions.    
    const parentWord = words.find(w => w.checklist?.some(s => 'items' in s && s.id === sectionId));    
    if (parentWord) {      
      setInboxMessages(prev => [{        
        id: Date.now() + Math.random(), type: 'completed', text: `Checklist item completed: "${item.text}" in task "${parentWord.text}"`,        
        timestamp: Date.now(), wordId: parentWord.id, sectionId: sectionId      
      }, ...prev]);    
    }  
  }, [words]); // Dependency on `words` ensures it has the latest task list  
  const navigateToTask = (wordId: number, sectionId?: number) => {
    // Find the word to determine its category
    const word = words.find(w => w.id === wordId);
    if (!word) return; // Don't require category to navigate
  
    const category = settings.categories.find(c => c.id === word.categoryId); 
  
    // Determine the parent and sub-category to activate
    const parentId = category ? (category.parentId || category.id) : 'all';
    const subId = category?.parentId ? category.id : 'all';
  
    // Switch to the list view and set the correct category/sub-category filters
    setSettings(prev => ({
      ...prev,
      currentView: 'list',
      activeCategoryId: parentId,
      activeSubCategoryId: subId,
      openAccordionIds: [...new Set([...prev.openAccordionIds, wordId])] // Ensure accordion is open
    }));
  
    // Use a timeout to ensure the list view has rendered before we try to scroll
    setTimeout(() => {
      const element = document.querySelector(`[data-word-id='${wordId}']`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
        // If a sectionId is provided, scroll to and highlight the checklist section
        if (sectionId) {
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
    }, 100); // Small delay for view to switch
  };
  const handleInboxItemClick = (message: InboxMessage) => {
    if (!message || !message.wordId) return;
    navigateToTask(message.wordId, message.sectionId);
  };

  const handleSnooze = React.useCallback((wordToSnooze: Word, duration?: 'low' | 'medium' | 'high') => {
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
  }, [settings.snoozeTime, setWords, setOverdueNotifications]);

  const handleWordUpdate = React.useCallback((updatedWord: Word) => {
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
  }, [words, updateTimers, wordsRefForDebounce]);

  // Effect to handle commands from the toast context menu
  useEffect(() => {
    const handleMenuCommand = (payload: { command: string, wordId?: number }) => {
      const { command, wordId } = payload;
      const targetWord = words.find(w => w.id === wordId);
      if (!targetWord) return;

      switch (command) {
        case 'view': {
          navigateToTask(wordId);
          setSettings(prev => ({
            ...prev,
            activeTaskTabs: { ...prev.activeTaskTabs, [wordId]: 'ticket' }
          }));
          break;
        }
        case 'edit': {
          navigateToTask(wordId);
          setSettings(prev => ({ ...prev, activeTaskTabs: { ...prev.activeTaskTabs, [wordId]: 'edit' } }));
          break;
        }
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
  }, [words, handleCompleteWord, handleSnooze, navigateToView]);

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
  }, [words, handleCompleteWord, handleSnooze, handleInboxItemClick]);

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
  }, [handleSaveProject]);

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
        showToast(`Browser set to: ${newBrowserName}`);
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
      showToast('Task added!');
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
    showToast('All open tasks cleared!');
    setWordPlacementIndex(0); // Reset the placement index
  };

  const handleResetSettings = () => {
    setSettings(defaultSettings);
    showToast('Settings have been reset!');
  };

  const handleFontScaleChange = (scale: 'small' | 'medium' | 'large') => {
    const scales = {
      small: { minFontSize: 12, maxFontSize: 40 },
      medium: { minFontSize: 20, maxFontSize: 80 },
      large: { minFontSize: 30, maxFontSize: 120 },
    };
    setSettings(prev => ({ ...prev, ...scales[scale] }));
  };

  const handleClearCompleted = () => {    
    if (confirmingClearCompleted) {
      setCompletedWords([]);
      showToast('Completed list cleared!');
      setConfirmingClearCompleted(false);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    } else {
      setConfirmingClearCompleted(true);
      // It's good practice to reset other confirmations here
      // to avoid user confusion, though none are directly related.
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmingClearCompleted(false), 3000);
    }
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
      showToast('Open tasks copied!');
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
      showToast('Report copied!');
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

    showToast('Task reopened!');
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
  
  const handleDismissInboxMessage = (messageId: number) => {
    const messageToTrash = inboxMessages.find(m => m.id === messageId);
    if (!messageToTrash) return;

    if (messageToTrash.isImportant) {
      showToast("Cannot dismiss an important message.");      
      return;
    }

    // Move the message to the trash state
    setTrashedMessages(prev => [messageToTrash, ...prev]);
    setInboxMessages(prev => prev.filter(m => m.id !== messageId));

    showToast("Message moved to trash.");
    setIsDirty(true);
  };

  const handleDismissAllInboxMessages = () => {
    const messagesToTrash = inboxMessages.filter(m => !m.isImportant);
    setTrashedMessages(prev => [...messagesToTrash, ...prev]);
    setInboxMessages(prev => prev.filter(m => m.isImportant));

    showToast(`Moved ${messagesToTrash.length} non-important message(s) to trash.`);
    setIsDirty(true);
  };

  // --- Full Task View Logic ---
  if (fullTaskViewId) {
    const taskToShow = words.find(w => w.id === fullTaskViewId) || completedWords.find(w => w.id === fullTaskViewId);
    if (taskToShow) {
      return (
        <FullTaskView
          task={taskToShow}
          onClose={() => setFullTaskViewId(null)}
          onWordUpdate={handleWordUpdate}
          onUpdate={handleWordUpdate}
          onNotify={handleTimerNotify}
          formatTimestamp={formatTimestamp}
          showToast={showToast}
          settings={settings}
          onSettingsChange={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
          words={words}
          setInboxMessages={setInboxMessages}
          onComplete={handleChecklistCompletion}
          onTabChange={(wordId, tab) => setSettings(prev => ({ ...prev, activeTaskTabs: { ...prev.activeTaskTabs, [wordId]: tab } }))}
          onDescriptionChange={(html) => handleWordUpdate({ ...taskToShow, description: html })}          
          focusChecklistItemId={focusChecklistItemId}
          completedWords={completedWords}
          setFocusChecklistItemId={setFocusChecklistItemId}
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
      {
       // refactor to name this something regarding a Toast 
       copyStatus && <div className="copy-status-toast toast-notification-central">{copyStatus}</div>
      }
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
                    onContextMenu={(e) => { 
                      e.preventDefault(); 
                      const isInEditMode = settings.activeTaskTabs?.[word.id] === 'edit';
                      window.electronAPI.showToastContextMenu({ wordId: word.id, x: e.clientX, y: e.clientY, isInEditMode }); 
                    }} 
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
        {settings.currentView === 'reports' && 
          <ReportsView 
            completedWords={completedWords} 
            categories={settings.categories} 
            showToast={showToast}
          />
        }
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
                <button onClick={() => {handleDismissAllInboxMessages()}} title="Clear All Non-Important Messages"><i className="fas fa-trash"></i> Clear All</button>
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
                                        settings={settings}
                                        completedWords={completedWords}
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
                                            }} allWords={[...words, ...completedWords]}
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
                                           onWordUpdate={handleWordUpdate}
                                            onUpdate={handleWordUpdate}
                                            onNotify={handleTimerNotify}
                                            formatTimestamp={formatTimestamp}
                                            showToast={showToast}                                            
                                            words={words}
                                            setInboxMessages={setInboxMessages}
                                            settings={settings} 
                                            onDescriptionChange={() => {}} 
                                            onSettingsChange={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
                                            onComplete={handleChecklistCompletion}
                                            wordId={word.id}
                                            checklistRef={activeChecklistRef}
                                            focusChecklistItemId={focusChecklistItemId}
                                            completedWords={completedWords}
                                            setFocusChecklistItemId={setFocusChecklistItemId}
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
                                            showToast(`Autocomplete ${newAutocompleteState ? 'enabled' : 'disabled'}.`);
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
                                settings={settings}
                                completedWords={completedWords}
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
                                    allWords={[...words, ...completedWords]}
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
                                   onWordUpdate={handleWordUpdate}
                                    onUpdate={handleWordUpdate}
                                    onNotify={handleTimerNotify}
                                    formatTimestamp={formatTimestamp}
                                    showToast={showToast}
                                    words={words}
                                    setInboxMessages={setInboxMessages}
                                    settings={settings} 
                                    onDescriptionChange={() => {}} 
                                    onSettingsChange={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
                                    onComplete={handleChecklistCompletion}
                                    wordId={word.id}
                                    checklistRef={activeChecklistRef}
                                    focusChecklistItemId={focusChecklistItemId}
                                    completedWords={completedWords}
                                    setFocusChecklistItemId={setFocusChecklistItemId}
                                    
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
                                    showToast(`Autocomplete ${newAutocompleteState ? 'enabled' : 'disabled'}.`);
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
                  <button className={`icon-button ${confirmingClearCompleted ? 'confirm-delete' : ''}`} onClick={handleClearCompleted} title="Clear Completed List">
                    {confirmingClearCompleted ? <i className="fas fa-trash-alt"></i> : <i className="fas fa-trash-alt"></i>}
                  </button>
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
                      <div key={word.id} className="priority-list-item completed-item" data-word-id={word.id}>                        
                        <TaskAccordionHeader
                          word={word}
                          settings={settings}
                          allWords={[...words, ...completedWords]} // Pass all words here
                          onCategoryClick={() => {}} />
                        <TaskAccordion word={word} 
                          title={title} 
                          isOpen={settings.openAccordionIds.includes(word.id)} 
                          onToggle={() => handleAccordionToggle(word.id)}
                          settings={settings}
                          completedWords={completedWords}>
                          {/* This first child is the 'content' for the accordion */}
                          <TabbedView 
                            word={word} 
                            onTabChange={() => {}} // No tab state persistence for completed items
                            onUpdate={() => {}} // No updates for completed items, this is correct
                            onNotify={() => {}} // No notifications for completed items
                            formatTimestamp={formatTimestamp}
                            showToast={showToast}
                            onSettingsChange={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
                            onDescriptionChange={() => {}}                            
                            settings={settings}
                            onWordUpdate={handleWordUpdate}
                            words={words}
                            onComplete={handleChecklistCompletion}
                            checklistRef={activeChecklistRef}
                            wordId={word.id}
                            focusChecklistItemId={focusChecklistItemId}
                            completedWords={completedWords}
                            setFocusChecklistItemId={setFocusChecklistItemId}
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
                    <button className="add-link-btn" onClick={() => setNewTask({ ...newTask, imageLinks: [...(newTask.imageLinks || []), ''] })}>
                      <i className="fas fa-plus"></i> Add Image Link
                    </button>
                  </label>}
                  {shouldShow('checklist') && <Checklist 
                    sections={newTask.checklist || []} 
                    onUpdate={(newSections) => setNewTask({ ...newTask, checklist: newSections })} 
                    onComplete={handleChecklistCompletion} 
                    isEditable={true}
                    onWordUpdate={(updatedWord) => setNewTask(updatedWord)}
                    word={newTask as Word}
                    words={words}
                    setInboxMessages={setInboxMessages}
                    checklistRef={activeChecklistRef}
                    wordId={Date.now()} // Use a temporary ID for the new task context
                    showToast={showToast}
                    focusItemId={focusChecklistItemId} 
                    onFocusHandled={() => setFocusChecklistItemId(null)}
                    settings={settings} 
                    onSettingsChange={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
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
            <button onClick={() => handleInputKeyDown({ key: 'Enter' } as React.KeyboardEvent<HTMLInputElement>)}>
              <i className="fas fa-plus"></i> Add Task
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
          showToast={showToast}
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
            showToast('Backup restored successfully!');            
          }} 
        />

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

function ReportsView({ completedWords, categories, showToast }: { completedWords: Word[], categories: Category[], showToast: (message: string, duration?: number) => void }) {
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
                          navigator.clipboard.writeText(rowData).then(() => 
                            showToast('Row data copied!'));
                        }}>
                          <i className="fas fa-copy"></i>
                        </button>
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
                  showToast('Table data copied!');                  
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
                          showToast('Row copied!');                          
                        }}>
                          <i className="fas fa-copy"></i>
                        </button>
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