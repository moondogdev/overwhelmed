/// <reference path="./declarations.d.ts" />
import React, { useRef, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import "./index.css";
// Import the placeholder image
import placeholderImage from "./assets/placeholder-image.jpg";

// Define the API exposed by the preload script
declare global {
  interface Window { electronAPI: { 
    saveFile: (dataUrl: string) => Promise<void>;
    exportProject: (data: string) => Promise<void>;
    importProject: () => Promise<string | null>;
    openExternalLink: (payload: { url: string, browserPath?: string }) => void;
    showContextMenu: () => void;
    getStoreValue: (key: string) => Promise<any>;
    setStoreValue: (key: string, value: any) => Promise<void>;
    send: (channel: string, data?: any) => void;
    on: (channel: string, callback: (...args: any[]) => void) => (() => void) | undefined;
    downloadImage: (url: string) => Promise<void>;
    showTicketContextMenu: (wordId: number) => void;
    notifyDirtyState: (isDirty: boolean) => void;
  } }
}

// Define the structure of a Word object for TypeScript
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
  manualTimeRunning?: boolean;
  manualTimeStart?: number; // Timestamp when manual timer was started
}

interface Browser {
  name: string;
  path: string;
}

interface Category {
  id: number;
  name: string;
}

interface ExternalLink {
  name: string;
  url: string;
  openInDefault?: boolean;
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
  currentView: 'meme' | 'list';
}


interface AccordionProps {
  title: React.ReactNode;
  children: React.ReactNode;
}

interface TabbedViewProps {
  word: Word;
  onUpdate: (updatedWord: Word) => void;
  formatTimestamp: (ts: number) => string;
  setCopyStatus: (message: string) => void;
  handleRichTextKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  settings: Settings; // Pass down settings for browser selection
  startInEditMode?: boolean;
}

function SimpleAccordion({ title, children, startOpen = false, onToggle }: AccordionProps & { startOpen?: boolean, onToggle?: (isOpen: boolean) => void }) {
  const [isOpen, setIsOpen] = useState(startOpen);

  useEffect(() => {
    // If the startOpen prop is used to control the accordion, update its internal state.
    setIsOpen(startOpen);
  }, [startOpen]);

  return (
    <div className="accordion">
      <div className="accordion-header" onClick={() => { setIsOpen(!isOpen); if(onToggle) onToggle(!isOpen); }}>
        <h4>{title}</h4>
        <span className="accordion-icon">{isOpen ? '−' : '+'}</span>
      </div>
      {isOpen && <div className="accordion-content">{children}</div>}
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

function TabbedView({ word, onUpdate, formatTimestamp, setCopyStatus, handleRichTextKeyDown, settings, startInEditMode = false }: TabbedViewProps) {
  const [activeTab, setActiveTab] = useState<'ticket' | 'edit'>(word.completedDuration ? 'ticket' : 'ticket'); // Default to ticket view

  useEffect(() => {
    // If the startInEditMode prop becomes true, switch to the edit tab
    if (startInEditMode) setActiveTab('edit');
  }, [startInEditMode]);

  const handleFieldChange = (field: keyof Word, value: any) => {
    onUpdate({ ...word, [field]: value });
  };

  const handleTicketContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    window.electronAPI.showTicketContextMenu(word.id);
  };

  // Hooks must be called at the top level, not inside conditionals.
  const descriptionRef = useRef<HTMLDivElement>(null);
  const handleCopyDescription = () => {
    if (descriptionRef.current) {
      // To copy rich text, we need to use the Clipboard API with a Blob.
      const html = descriptionRef.current.innerHTML;
      const blob = new Blob([html], { type: 'text/html' });
      const data = [new ClipboardItem({ 'text/html': blob })];

      navigator.clipboard.write(data).then(() => {
        setCopyStatus('Description copied!');
      });
    }
  };

  const tabContentRef = useRef<HTMLDivElement>(null);

  const tabHeaders = (
    <div className="tab-headers">
      <button onClick={() => setActiveTab('ticket')} className={activeTab === 'ticket' ? 'active' : ''}>Ticket</button>
      {!word.completedDuration && ( // Only show Edit tab for non-completed items
        <button onClick={() => setActiveTab('edit')} className={activeTab === 'edit' ? 'active' : ''}>Edit</button>
      )}
    </div>
  );

  return (
    <div className="tab-container">
      {tabHeaders}
      <div className="tab-content" ref={tabContentRef}>
        {activeTab === 'ticket' && (
          <div className="ticket-display-view">
            <h3 onContextMenu={handleTicketContextMenu}>{word.text}</h3>
            {word.url && <p><strong>URL:</strong> <span className="link-with-copy"><a href="#" onClick={(e) => { e.preventDefault(); window.electronAPI.openExternalLink({ url: word.url, browserPath: settings.browsers[settings.activeBrowserIndex]?.path }); }}>{word.url}</a><button className="copy-btn" title="Copy URL" onClick={() => { navigator.clipboard.writeText(word.url); setCopyStatus('URL copied!'); }}>📋</button></span></p>}
            <p><strong>Category:</strong> {settings.categories.find(c => c.id === word.categoryId)?.name || 'Uncategorized'}</p>
            <p><strong>Priority:</strong> {word.priority || 'Medium'}</p>
            <p><strong>Open Date:</strong> {formatTimestamp(word.openDate)}</p>
            <p><strong>Time Open:</strong> <TimeOpen startDate={word.createdAt} /></p>
            {word.completeBy && <p><strong>Complete By:</strong> {formatTimestamp(word.completeBy)}</p>}
            {word.completeBy && <p><strong>Time Left:</strong> <TimeLeft completeBy={word.completeBy} /></p>}
            {word.company && <p><strong>Company:</strong> <span className="link-with-copy">{word.company}<button className="copy-btn" title="Copy Company" onClick={() => { navigator.clipboard.writeText(word.company); setCopyStatus('Company copied!'); }}>📋</button></span></p>}
            <div><strong>Work Timer:</strong>
              <ManualStopwatch word={word} onUpdate={(updatedWord) => onUpdate(updatedWord)} />
            </div>
            <div><strong>Task Cost:</strong>
              <span> ${(((word.manualTime || 0) / (1000 * 60 * 60)) * (word.payRate || 0)).toFixed(2)}</span>
            </div>
            {word.websiteUrl && <p><strong>Website URL:</strong> <span className="link-with-copy"><a href="#" onClick={(e) => { e.preventDefault(); window.electronAPI.openExternalLink({ url: word.websiteUrl, browserPath: settings.browsers[settings.activeBrowserIndex]?.path }); }}>{word.websiteUrl}</a><button className="copy-btn" title="Copy URL" onClick={() => { navigator.clipboard.writeText(word.websiteUrl); setCopyStatus('Website URL copied!'); }}>📋</button></span></p>}
            <div><strong>Image Links:</strong>
              <div className="image-links-display">
                {(word.imageLinks || []).map((link, index) => (
                  <div key={index} className="image-link-item">
                    <img src={link} alt={`Image ${index + 1}`} />
                    <div className="image-link-actions">
                      <button onClick={() => window.electronAPI.downloadImage(link)} title="Download Image">⬇️</button>
                      <button onClick={() => { navigator.clipboard.writeText(link); setCopyStatus('Image URL copied!'); }} title="Copy URL">📋</button>
                    </div>
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
                handleTicketContextMenu(e);
              }
            }} onClick={(e) => { // Also handle left-clicks for links
              const target = e.target as HTMLElement;
              if (target.tagName === 'A') {
                e.preventDefault();
                const url = target.getAttribute('href');
                if (url) window.electronAPI.openExternalLink({ url, browserPath: settings.browsers[settings.activeBrowserIndex]?.path });
              }
            }}>
              <div className="description-header" onContextMenu={handleTicketContextMenu}>
                <strong>Description:</strong>
                <button className="copy-btn" title="Copy Description Text" onClick={handleCopyDescription}>📋</button>
              </div>
              <div ref={descriptionRef} className="description-display" dangerouslySetInnerHTML={{ __html: word.description || 'N/A' }} />
            </div>
          </div>
        )}
        {activeTab === 'edit' && !word.completedDuration && (
          <div className="word-item-details-form">
            <label><h4>Task Title:</h4>
              <input type="text" value={word.text} onChange={(e) => handleFieldChange('text', e.target.value)} />
            </label>
            <label><h4>Category:</h4>
              <select value={word.categoryId} onChange={(e) => handleFieldChange('categoryId', Number(e.target.value))}>
                {settings.categories.map((cat: Category) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </label>
            <label><h4>Task Title URL:</h4>
              <input type="text" value={word.url || ''} onChange={(e) => handleFieldChange('url', e.target.value)} placeholder="https://example.com" />
            </label>
            <label><h4>Priority:</h4>
              <select value={word.priority || 'Medium'} onChange={(e) => handleFieldChange('priority', e.target.value as any)}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>
            <label><h4>Open Date:</h4>
              <input type="date" value={new Date(word.openDate).toISOString().split('T')[0]} onChange={(e) => handleFieldChange('openDate', new Date(e.target.valueAsNumber).getTime())} />
            </label>
            <label><h4>Complete By:</h4>
              <div className="date-input-group">
                <input type="datetime-local" value={formatTimestampForInput(word.completeBy)} onChange={(e) => handleFieldChange('completeBy', parseInputTimestamp(e.target.value))} />
                <div className="button-group">
                  <button onClick={() => handleFieldChange('completeBy', new Date().getTime() + 15 * 60 * 1000)}>+15m</button>
                  <button onClick={() => handleFieldChange('completeBy', new Date().getTime() + 30 * 60 * 1000)}>+30m</button>
                  <button onClick={() => handleFieldChange('completeBy', new Date().getTime() + 60 * 60 * 1000)}>+1h</button>
                  <button onClick={() => handleFieldChange('completeBy', new Date().getTime() + 2 * 60 * 60 * 1000)}>+2h</button>
                  <button onClick={() => { const d = new Date(); d.setDate(d.getDate() + 1); handleFieldChange('completeBy', d.getTime()); }}>+1d</button>
                  <button onClick={() => { const d = new Date(); d.setDate(d.getDate() + 3); handleFieldChange('completeBy', d.getTime()); }}>+3d</button>
                </div>
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
                  }} />
                  <button onClick={() => handleFieldChange('imageLinks', (word.imageLinks || []).filter((_, i) => i !== index))}>-</button>
                </div>
              ))}
            </label>
            <button className="add-link-btn" onClick={() => handleFieldChange('imageLinks', [...(word.imageLinks || []), ''])}>
              + Add Image Link
            </button>
            {tabHeaders}
            <label><h4>Description:</h4>
              <div className="rich-text-editor" contentEditable dangerouslySetInnerHTML={{ __html: word.description || '' }} onBlur={(e: React.FocusEvent<HTMLDivElement>) => handleFieldChange('description', e.target.innerHTML)} onKeyDown={handleRichTextKeyDown} />
              <div className="shortcut-key">
                <span>Shortcuts:</span>
                <span><b>Ctrl+B</b>: Bold</span>
                <span><i>Ctrl+I</i>: Italic</span>
                <span><u>Ctrl+U</u>: Underline</span>
                <span><b>Ctrl+K</b>: Link</span>
                <span><b>Ctrl+L</b>: List</span>
              </div>
            </label>
            <label className="checkbox-label flexed-column">
              <input type="checkbox" checked={word.isRecurring || false} onChange={(e) => handleFieldChange('isRecurring', e.target.checked)} /> 
              <span className="checkbox-label-text">Re-occurring Task</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

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
function TaskAccordion({ title, children, startOpen = false, word }: AccordionProps & { startOpen?: boolean, word: Word }) {
  const [isOpen, setIsOpen] = useState(startOpen);
  const [content, headerActions] = React.Children.toArray(children);

  useEffect(() => {
    // If the startOpen prop becomes true, force the accordion to open.
    if (startOpen) setIsOpen(true);
  }, [startOpen]);

  return (
    <div className="accordion">
      <div className="accordion-header-container 2">
        <div
          className="accordion-header"
          onClick={() => setIsOpen(!isOpen)}
          onContextMenu={(e) => {
            e.preventDefault();
            window.electronAPI.showTicketContextMenu(word.id);
          }}
        >
          <span className="accordion-icon">{isOpen ? '−' : '+'}</span>
          <h4 className="accordion-title">{title}</h4>          
        </div>
        {headerActions}
      </div>
      {isOpen && <div className="accordion-content">{content}</div>}
    </div>
  );
}

function TimeLeft({ completeBy }: { completeBy: number | undefined }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!completeBy) {
      setTimeLeft('No Deadline');
      return;
    }

    const update = () => {
      const ms = completeBy - Date.now();
      if (ms < 0) {
        setTimeLeft('Overdue');
        return;
      }
      setTimeLeft(formatTime(ms));
    };

    update();
    const interval = setInterval(update, 1000); // Update every second
    return () => clearInterval(interval);
  }, [completeBy]);

  return <span className={timeLeft === 'Overdue' ? 'priority-high' : ''}>{timeLeft}</span>;
}

function TimeOpen({ startDate }: { startDate: number }) {
  const [timeOpen, setTimeOpen] = useState('');

  useEffect(() => {
    const update = () => {
      const ms = Date.now() - startDate;
      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      setTimeOpen(`${days}d ${hours}h ${minutes}m`);
    };

    update();
    const interval = setInterval(update, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [startDate]);

  return <span>{timeOpen}</span>;
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
      <span className="time-display">{formatTime(displayTime)}</span>
      <button onClick={handleToggle} title={word.manualTimeRunning ? 'Stop Timer' : 'Start Timer'}>{word.manualTimeRunning ? '⏹️' : '▶️'}</button>
      <button onClick={handleReset} title="Reset Timer">⟳</button>
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
};

function App() {
  // Create a ref to hold the canvas DOM element
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
  // State for inline editing
  const [editingWordId, setEditingWordId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  // State for bulk add
  const [bulkAddText, setBulkAddText] = useState("");
  // State for hover effects
  const [hoveredWordId, setHoveredWordId] = useState<number | null>(null);
  // State for copy feedback
  const [copyStatus, setCopyStatus] = useState('');
  // Ref to track if the initial load is complete to prevent overwriting saved data
  const isInitialLoad = useRef(true);
  // State to track if the app is still loading initial data
  const [isLoading, setIsLoading] = useState(true);
  // State to track if there are unsaved changes
  const [isDirty, setIsDirty] = useState(false);

  // State for the new detailed task form
  const [activeCategoryId, setActiveCategoryId] = useState<number | 'all'>('all');

  const [editingViaContext, setEditingViaContext] = useState<number | null>(null);

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);

  // Refs for autofocus functionality
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const newTaskTitleInputRef = useRef<HTMLInputElement>(null);


  const [newTask, setNewTask] = useState({
    text: '',
    url: '',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    categoryId: 1,
    openDate: new Date().toISOString().split('T')[0],
    completeBy: undefined, // No deadline by default
    company: '',
    websiteUrl: '',
    imageLinks: [],
    manualTime: 0,
    manualTimeRunning: false,
    manualTimeStart: 0,
    payRate: 0,
    isRecurring: false,
    description: '',
  });

  // Load words from localStorage on initial component mount
  useEffect(() => {
    const loadDataFromStore = async () => {
      try {
        const savedWords = await window.electronAPI.getStoreValue('overwhelmed-words');
        const savedCompletedWords = await window.electronAPI.getStoreValue('overwhelmed-completed-words');
        const savedSettings = await window.electronAPI.getStoreValue('overwhelmed-settings');

        if (savedWords) setWords(savedWords);
        if (savedCompletedWords) setCompletedWords(savedCompletedWords);
        if (savedSettings) {
          setSettings(prevSettings => ({ ...prevSettings, ...savedSettings }));
        }
        setIsLoading(false); // Mark loading as complete
      } catch (error) {
        console.error("Failed to load data from electron-store", error);
        setIsLoading(false); // Also mark as complete on error to avoid getting stuck
      }
    };
    loadDataFromStore();
    // isInitialLoad will be managed by the isLoading state now
  }, []); // Empty dependency array means this runs only once

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

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) setIsDirty(true);
  }, [settings]);

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

      window.electronAPI.send('data-for-quit', { words: wordsToSave, completedWords, settings });
    };

    const cleanup = window.electronAPI.on('get-data-for-quit', handleGetDataForQuit);
    // Cleanup the listener when the component unmounts
    return cleanup;
  }, [words, completedWords, settings]); // Re-bind if state changes to send the latest version

  // Effect to handle commands from the ticket context menu
  useEffect(() => {
    const handleMenuCommand = (_event: any, { command, wordId }: { command: string, wordId: number }) => {
      const targetWord = words.find(w => w.id === wordId);
      if (!targetWord) return;

      switch (command) {
        case 'edit':
          // Set the ID of the word to be edited, which will trigger a re-render.
          // We also need to ensure the accordion is open if it's not already.
          // The `TaskAccordion` component's `startOpen` prop handles this.
          setEditingViaContext(wordId);
          break;
        case 'complete':
          handleCompleteWord(targetWord);
          break;
        case 'copy':
          handleCopyTask(targetWord);
          break;
        case 'trash':
          removeWord(wordId);
          break;
      }
    };
    const cleanup = window.electronAPI.on('context-menu-command', handleMenuCommand);
    return cleanup;
  }, [words]); // Dependency on words ensures the handler has the latest list

  // Effect to reset the context menu editing state after it has been applied
  useEffect(() => {
    if (editingViaContext !== null) {
      // Reset after a short delay to allow the UI to update
      const timer = setTimeout(() => setEditingViaContext(null), 100);
      return () => clearTimeout(timer);
    }
  }, [editingViaContext]);

  const handleConfirmLink = (url: string) => {
    // Ensure the URL has a protocol, otherwise it will be treated as a relative path.
    let fullUrl = url;
    if (!/^https/i.test(fullUrl) && !/^http/i.test(fullUrl)) {
      fullUrl = `https://${fullUrl}`;
    }

    if (selectionRange) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(selectionRange);
      document.execCommand('createLink', false, fullUrl);
    }
  };

  const focusAddTaskInput = () => {
    setIsAddTaskOpen(true);
    // Use a timeout to ensure the accordion is open before focusing.
    // This works even if the accordion was already open.
    setTimeout(() => {
      newTaskTitleInputRef.current?.focus();
    });
  };

  const handleRichTextKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        setSelectionRange(selection.getRangeAt(0));
        setIsLinkModalOpen(true);
      }
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      document.execCommand('insertUnorderedList', false, null);
    } else if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      document.execCommand('bold', false, null);
    } else if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      document.execCommand('bold', false, null);
    }
  };

  // Effect to handle browser toggle hotkey
  useEffect(() => {
    const handleBrowserToggle = (e: KeyboardEvent) => {
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
        id: Date.now(),
        text: newTask.text.trim(),
        // Use the value from the form, or default to now if it's empty
        openDate: newTask.openDate ? new Date(newTask.openDate + 'T00:00:00').getTime() : Date.now(),
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

      setCopyStatus('Task added!');
      setTimeout(() => setCopyStatus(''), 2000);
      setWords((prevWords) => [...prevWords, newWord]);
      // Reset the new task form
      setNewTask({
        text: '',
        url: '',
        priority: 'Medium',
        categoryId: settings.categories[0]?.id || 1,
        openDate: new Date().toISOString().split('T')[0],
        completeBy: undefined,
        company: '',
        websiteUrl: '',
        manualTime: 0,
        manualTimeRunning: false,
        manualTimeStart: 0,
        payRate: 0,
        isRecurring: false,
        imageLinks: [],
        description: '',
      });
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
    setCopyStatus('Task completed!');
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
      };
      currentWords.push(newWord);
      currentPlacementIndex++;
    });
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


  const removeWord = (idToRemove: number) => {
    setWords(words.filter(word => word.id !== idToRemove));
    setCopyStatus('Task removed.');
    setTimeout(() => setCopyStatus(''), 2000);
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

  const handleCopyTask = (taskToCopy: Word) => {
    // Create a new task with a new ID and open date, but keep the content
    const newTask: Word = {
      ...taskToCopy,
      id: Date.now(),
      openDate: Date.now(),
      createdAt: Date.now(),
      completedDuration: undefined,
    };
    setWords([newTask, ...words]);
    setCopyStatus('Task copied to active list!');
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
    
    setIsDirty(false); // Mark the state as clean/saved

    setCopyStatus('Project saved!');
    setTimeout(() => setCopyStatus(''), 2000); // Clear message after 2 seconds
  };

  const moveWord = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === words.length - 1)) {
      return; // Can't move further
    }

    const newWords = [...words];
    const item = newWords.splice(index, 1)[0];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    newWords.splice(newIndex, 0, item);

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

  return (
    <div className="app-container">
      <LinkModal 
        isOpen={isLinkModalOpen} 
        onClose={() => setIsLinkModalOpen(false)} 
        onConfirm={handleConfirmLink} 
      />
      {copyStatus && <div className="copy-status-toast">{copyStatus}</div>}
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
          <button onClick={() => setSettings(prev => ({ ...prev, currentView: 'meme' }))} disabled={settings.currentView === 'meme'}>Meme View</button>
          <div className="header-center-stack">
            <div className="current-browser-display">Active Browser: <b>{settings.browsers[settings.activeBrowserIndex]?.name || 'Default'}</b></div>
            <LiveClock />
          </div>
          <button onClick={() => setSettings(prev => ({ ...prev, currentView: 'list' }))} disabled={settings.currentView === 'list'}>List View</button>
        </header>
        {settings.currentView === 'meme' && (
          <div className="canvas-container">
            <div className="canvas-actions">
              <button onClick={handleRandomizeLayout} title="Randomize Layout">🔀 Randomize Layout</button>
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
        {settings.currentView === 'list' && (
          <div className="list-view-container">
            {(() => {
              const filteredWords = words.filter(word => activeCategoryId === 'all' || word.categoryId === activeCategoryId);
              return (
                <>
                  <div className="category-tabs">
                    <button onClick={() => setActiveCategoryId('all')} className={activeCategoryId === 'all' ? 'active' : ''}>
                      All ({words.length})
                    </button>
                    {settings.categories.map((cat: Category) => {
                      const count = words.filter(w => w.categoryId === cat.id).length;
                      return (
                        <button key={cat.id} onClick={() => setActiveCategoryId(cat.id)} className={activeCategoryId === cat.id ? 'active' : ''}>
                          {cat.name} ({count})
                        </button>
                      );
                    })}
                  </div>
                  {filteredWords.length > 0 ? (
                    <>
                      <div className="list-header">
                        <h3>Priority List</h3>
                        <div className="list-header-actions" onContextMenu={(e) => { e.stopPropagation(); }}>
                          <button onClick={() => {
                            focusAddTaskInput();
                            if (activeCategoryId !== 'all') {
                              setNewTask(prev => ({ ...prev, categoryId: activeCategoryId }));
                            }
                          }} title="Add New Task">+</button>
                          <button onClick={handleClearAll} title="Clear All Tasks">🗑️</button>
                          <button onClick={handleCopyList} title="Copy Open Tasks">📋</button>
                        </div>
                      </div>
                      <div className="priority-list-main">
                        {filteredWords.map((word, index) => (
                          <div key={word.id} className="priority-list-item">
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
                                startOpen={editingViaContext === word.id}
                                title={
                                <>
                                  <div className="accordion-title-container">
                                    <span className="accordion-main-title">{word.text}</span>
                                    {word.categoryId && (
                                      <span className="category-pill" onClick={(e) => { e.stopPropagation(); setActiveCategoryId(word.categoryId); }}>
                                        {settings.categories.find(c => c.id === word.categoryId)?.name}
                                      </span>
                                    )}
                                  </div>
                                  <div className="accordion-subtitle">
                                    {word.company && <span>{word.company}</span>}
                                    <span>{formatTimestamp(word.openDate)}</span>
                                    <span><TimeLeft completeBy={word.completeBy} /></span>
                                    <span className={`priority-indicator priority-${(word.priority || 'Medium').toLowerCase()}`}>
                                      <span className="priority-dot"></span>
                                      {word.priority || 'Medium'}
                                    </span>
                                  </div>
                                </>
                              }>
                                <>
                                  <TabbedView 
                                    startInEditMode={editingViaContext === word.id}
                                    word={word} 
                                    onUpdate={(updatedWord) => setWords(words.map(w => w.id === updatedWord.id ? updatedWord : w))}
                                    formatTimestamp={formatTimestamp}
                                    setCopyStatus={(msg) => { setCopyStatus(msg); setTimeout(() => setCopyStatus(''), 2000); }}
                                    settings={settings}
                                    handleRichTextKeyDown={handleRichTextKeyDown}
                                  />
                                  <div className="word-item-display">
                                    <span className="stopwatch date-opened">
                                      Started at: {formatTimestamp(word.createdAt)}
                                    </span>
                                    <Stopwatch word={word} onTogglePause={handleTogglePause} />
                                  </div>
                                </>
                                <div className="list-item-controls">
                                <button onClick={() => setWords(words.map(w => w.id === word.id ? { ...w, isRecurring: !w.isRecurring } : w))} title="Toggle Re-occurring" className={`recurring-toggle ${word.isRecurring ? 'active' : ''}`}>
                                  🔁
                                </button>
                                  <button onClick={() => handleCompleteWord(word)} className="complete-btn">✓</button>
                                  <button onClick={() => handleEdit(word)}>Rename</button>
                                  <button onClick={() => moveWord(index, 'up')} disabled={index === 0}>↑</button>
                                  <button onClick={() => moveWord(index, 'down')} disabled={index === words.length - 1}>↓</button>
                                  <button onClick={() => removeWord(word.id)} className="remove-btn">×</button>
                                </div>
                              </TaskAccordion>
                            )}
                          </div>
                        ))}
                        <div className="add-task-row">
                          <button className="add-task-button" onClick={() => {
                            focusAddTaskInput();
                            if (activeCategoryId !== 'all') {
                              setNewTask(prev => ({ ...prev, categoryId: activeCategoryId }));
                            }
                          }}>+ Open Task</button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="empty-list-placeholder">
                      <h3>No Open Tasks for {activeCategoryId === 'all' ? 'any category' : settings.categories.find(c => c.id === activeCategoryId)?.name || 'this category'}</h3>
                      <button onClick={() => {
                        focusAddTaskInput();
                        if (activeCategoryId !== 'all') {
                          setNewTask(prev => ({ ...prev, categoryId: activeCategoryId }));
                        }
                      }}>+ Open Task</button>
                    </div>
                  )}
                </>
              );
            })()}
            {completedWords.filter(word => activeCategoryId === 'all' || word.categoryId === activeCategoryId).length > 0 && (
              <SimpleAccordion title="Completed Items">
                <div className="completed-actions">
                  <button onClick={handleClearCompleted} title="Clear Completed List">🗑️</button>
                  <button onClick={handleCopyReport} title="Copy Report">📋</button>
                </div>
                <div className="priority-list-main">
                  {completedWords
                    .filter(word => activeCategoryId === 'all' || word.categoryId === activeCategoryId)
                    .map((word) => {
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
                        <TaskAccordion word={word} title={title} startOpen={false}>
                          {/* This first child is the 'content' for the accordion */}
                          <TabbedView 
                            word={word} 
                            onUpdate={() => {}} // No updates for completed items
                            formatTimestamp={formatTimestamp}
                            setCopyStatus={(msg) => { setCopyStatus(msg); setTimeout(() => setCopyStatus(''), 2000); }}
                            settings={settings}
                            handleRichTextKeyDown={() => {}} // Pass a no-op for completed items
                          />
                          {/* This second child is the 'headerActions' for the accordion */}
                          <div className="list-item-controls">
                            <button onClick={() => handleReopenTask(word)} title="Reopen Task">↩️</button>
                            <button onClick={() => handleCopyTask(word)} title="Copy Task">📋</button>
                          </div>
                        </TaskAccordion>
                      </div>
                    );
                  })}
                </div>
              </SimpleAccordion>
            )}
          </div>
        )}
      </div>
      <div className="sidebar">
        <button
          onClick={handleSaveProject}
          className={`dynamic-save-button ${isDirty ? 'unsaved' : 'saved'}`}
          disabled={isLoading}
        >
          {isDirty ? 'Save Project (Unsaved)' : 'Project Saved'}
        </button>
        <SimpleAccordion title="Add New Task" startOpen={isAddTaskOpen} onToggle={setIsAddTaskOpen}>
          <div className="new-task-form">
            <label><h4>Task Title:</h4>
              <input ref={newTaskTitleInputRef} type="text" placeholder="Enter a title and press Enter" value={newTask.text} onChange={(e) => setNewTask({ ...newTask, text: e.target.value })} onKeyDown={handleInputKeyDown} />
            </label>
            <label><h4>URL:</h4>
              <input type="text" placeholder="https://example.com" value={newTask.url} onChange={(e) => setNewTask({ ...newTask, url: e.target.value })} />
            </label>
            <label><h4>Category:</h4>
              <select value={newTask.categoryId} onChange={(e) => setNewTask({ ...newTask, categoryId: Number(e.target.value) })}>
                {settings.categories.map((cat: Category) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </label>
            <label><h4>Priority:</h4>
              <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>
            <label><h4>Open Date:</h4>
              <input type="date" value={newTask.openDate} onChange={(e) => setNewTask({ ...newTask, openDate: e.target.value })} />
            </label>
            <label><h4>Complete By:</h4>
            <input type="datetime-local" value={formatTimestampForInput(newTask.completeBy)} onChange={(e) => setNewTask({ ...newTask, completeBy: parseInputTimestamp(e.target.value) })} />
              <div className="button-group">
                <button onClick={() => setNewTask({ ...newTask, completeBy: new Date().getTime() + 15 * 60 * 1000 })}>+15m</button>
                <button onClick={() => setNewTask({ ...newTask, completeBy: new Date().getTime() + 30 * 60 * 1000 })}>+30m</button>
                <button onClick={() => setNewTask({ ...newTask, completeBy: new Date().getTime() + 60 * 60 * 1000 })}>+1h</button>
                <button onClick={() => setNewTask({ ...newTask, completeBy: new Date().getTime() + 2 * 60 * 60 * 1000 })}>+2h</button>
                <button onClick={() => { const d = new Date(); d.setDate(d.getDate() + 1); setNewTask({ ...newTask, completeBy: d.getTime() }); }}>+1d</button>
                <button onClick={() => { const d = new Date(); d.setDate(d.getDate() + 3); setNewTask({ ...newTask, completeBy: d.getTime() }); }}>+3d</button>
              </div>
            </label>
            <label><h4>Company:</h4>
              <input type="text" value={newTask.company} onChange={(e) => setNewTask({ ...newTask, company: e.target.value })} />
            </label>
            <label><h4>Pay Rate ($/hr):</h4>
              <input type="number" value={newTask.payRate || 0} onChange={(e) => setNewTask({ ...newTask, payRate: Number(e.target.value) })} />
            </label>
            <label><h4>Website URL:</h4>
              <input type="text" placeholder="https://company.com" value={newTask.websiteUrl} onChange={(e) => setNewTask({ ...newTask, websiteUrl: e.target.value })} />
            </label>
            <label><h4>Image Links:</h4>
              {(newTask.imageLinks || []).map((link, index) => (
                <div key={index} className="image-link-edit">
                  <input type="text" value={link} onChange={(e) => {
                    const newLinks = [...(newTask.imageLinks || [])];
                    newLinks[index] = e.target.value;
                    setNewTask({ ...newTask, imageLinks: newLinks });
                  }} />
                  <button onClick={() => setNewTask({ ...newTask, imageLinks: (newTask.imageLinks || []).filter((_, i) => i !== index) })}>-</button>
                </div>
              ))}
              <button className="add-link-btn" onClick={() => setNewTask({ ...newTask, imageLinks: [...(newTask.imageLinks || []), ''] })}>
                + Add Image Link
              </button>
            </label>
            <label><h4>Description:</h4>
              <div 
                className="rich-text-editor" 
                contentEditable 
                onBlur={(e: React.FocusEvent<HTMLDivElement>) => setNewTask({ ...newTask, description: e.target.innerHTML })} onKeyDown={handleRichTextKeyDown}
              />
              <div className="shortcut-key">
                <span>Shortcuts:</span>
                <span><b>Ctrl+B</b>: Bold</span>
                <span><i>Ctrl+I</i>: Italic</span>
                <span><u>Ctrl+U</u>: Underline</span>
                <span><b>Ctrl+K</b>: Link</span>
                <span><b>Ctrl+L</b>: List</span>
              </div>
            </label>
            <label className="checkbox-label flexed-column">
              <input type="checkbox" checked={newTask.isRecurring || false} onChange={(e) => setNewTask({ ...newTask, isRecurring: e.target.checked })} />
              <span className='checkbox-label-text'>Re-occurring Task</span>              
            </label>
            <button onClick={() => handleInputKeyDown({ key: 'Enter' } as React.KeyboardEvent<HTMLInputElement>)}>
              Add Task
            </button>
          </div>
        </SimpleAccordion>

        {/* Moved Bulk Add and Project Actions to be globally available */}
        <div className="bulk-add-container">
          <textarea
            placeholder="Paste comma-separated words here..."
            value={bulkAddText}
            onChange={(e) => setBulkAddText(e.target.value)}
            rows={3}
          />
          <button onClick={handleBulkAdd}>Add Words</button>
        </div>
        <SimpleAccordion title="Project Actions">
          <button onClick={handleExport}>Export Project</button>
          <button onClick={handleImport}>Import Project</button>
        </SimpleAccordion>

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
            <SimpleAccordion title="Browser Settings">
              {settings.browsers.map((browser, index) => (
                <div key={index} className="browser-setting-item">
                  <input 
                    type="text" 
                    placeholder="Browser Name" 
                    value={browser.name} 
                    onChange={(e) => {
                      const newBrowsers = [...settings.browsers];
                      newBrowsers[index].name = e.target.value;
                      setSettings(prev => ({ ...prev, browsers: newBrowsers }));
                    }} 
                  />
                  <input 
                    type="text" 
                    placeholder="C:\path\to\browser.exe" 
                    value={browser.path} 
                    onChange={(e) => {
                      const newBrowsers = [...settings.browsers];
                      newBrowsers[index].path = e.target.value;
                      setSettings(prev => ({ ...prev, browsers: newBrowsers }));
                    }} 
                  />
                  <button onClick={() => setSettings(prev => ({ ...prev, browsers: prev.browsers.filter((_, i) => i !== index) }))}>-</button>
                </div>
              ))}
              <button className="add-link-btn" onClick={() => setSettings(prev => ({ ...prev, browsers: [...prev.browsers, { name: '', path: '' }] }))}>+ Add Browser</button>
            </SimpleAccordion>
            <SimpleAccordion title="Category Manager">
              {settings.categories.map((cat: Category, index: number) => (
                <div key={cat.id} className="category-manager-item">
                  <input 
                    type="text" 
                    value={cat.name}
                    onChange={(e) => {
                      const newCategories = [...settings.categories];
                      newCategories[index].name = e.target.value;
                      setSettings(prev => ({ ...prev, categories: newCategories }));
                    }}
                  />
                  <button onClick={() => {
                    const newCategories = settings.categories.filter((c: Category) => c.id !== cat.id);
                    // Also un-categorize any words that were in this category
                    setWords(words.map(w => w.categoryId === cat.id ? { ...w, categoryId: undefined } : w));
                    setSettings(prev => ({ ...prev, categories: newCategories }));
                  }}>-</button>
                </div>
              ))}
              <button className="add-link-btn" onClick={() => setSettings(prev => ({ ...prev, categories: [...prev.categories, { id: Date.now(), name: 'New Category' }] }))}>
                + Add Category
              </button>
            </SimpleAccordion>
            <SimpleAccordion title="External Link Manager">
              {settings.externalLinks.map((link, index) => (
                <div key={index} className="external-link-manager-item">
                  <input type="checkbox" checked={link.openInDefault || false} onChange={(e) => {
                    const newLinks = [...settings.externalLinks];
                    newLinks[index].openInDefault = e.target.checked;
                    setSettings(prev => ({ ...prev, externalLinks: newLinks }));
                  }} />
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
                  <button onClick={() => setSettings(prev => ({ ...prev, externalLinks: prev.externalLinks.filter((_, i) => i !== index) }))}>-</button>
                </div>
              ))}
              <button className="add-link-btn" onClick={() => setSettings(prev => ({ ...prev, externalLinks: [...prev.externalLinks, { name: '', url: '', openInDefault: false }] }))}>
                + Add Link
              </button>
            </SimpleAccordion>
          </>
        )}
      </div>
    </div>
  );
}

// Create a root element for React to mount into
const rootElement = document.createElement('div');
rootElement.id = 'root';
document.body.appendChild(rootElement);

const root = createRoot(rootElement);
root.render(<React.StrictMode><App /></React.StrictMode>);