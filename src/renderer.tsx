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
  isAutocomplete?: boolean;
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
  parentId?: number; // If present, this is a sub-category
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
  activeCategoryId?: number | 'all';
  activeSubCategoryId?: number | 'all';
  warningTime: number; // in minutes
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
  onDescriptionChange: (html: string) => void;
  settings: Settings; // Pass down settings for browser selection
  startInEditMode?: boolean;
  className?: string;
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

function TabbedView({ word, onUpdate, formatTimestamp, setCopyStatus, settings, startInEditMode = false, onDescriptionChange }: TabbedViewProps) {
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
            {word.completeBy && <p><strong>Time Left:</strong> <TimeLeft completeBy={word.completeBy} settings={settings} /></p>}
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
                    return <>
                      <button onClick={() => handleFieldChange('openDate', undefined)} title="Clear Date">❌</button>
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
                    return <>
                      <button onClick={() => handleFieldChange('completeBy', undefined)} title="Clear Date">❌</button>
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
                  }} />
                  <button onClick={() => handleFieldChange('imageLinks', (word.imageLinks || []).filter((_, i) => i !== index))}>-</button>
                </div>
              ))}
            </label>
            <button className="add-link-btn" onClick={() => handleFieldChange('imageLinks', [...(word.imageLinks || []), ''])}>
              + Add Image Link
            </button>
            {tabHeaders}
            <DescriptionEditor description={word.description || ''} onDescriptionChange={(html) => handleFieldChange('description', html)} />
            <label className="checkbox-label flexed-column">
              <input type="checkbox" checked={word.isRecurring || false} onChange={(e) => handleFieldChange('isRecurring', e.target.checked)} /> 
              <span className="checkbox-label-text">Re-occurring Task</span>
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

function DescriptionEditor({ description, onDescriptionChange }: { description: string, onDescriptionChange: (html: string) => void }) {
  const [activeView, setActiveView] = useState<'view' | 'html'>('view');
  const [htmlContent, setHtmlContent] = useState(description);
  const editorRef = useRef<HTMLDivElement>(null);

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
    // Pass a callback to update state after execCommand runs
    handleGlobalRichTextKeyDown(e, () => {
      if (editorRef.current) {
        onDescriptionChange(editorRef.current.innerHTML);
      }
    }, setIsLinkModalOpen, setSelectionRange);
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
          ref={editorRef}
        />
      ) : (
        <textarea
          className="html-editor"
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          onBlur={handleBlur}
        />
      )}
      <div className="shortcut-key">
        <span>Shortcuts:</span>
        <span dangerouslySetInnerHTML={{ __html: `${headerShortcutKeyDisplay}, ${otherShortcutKeys}` }} />
      </div>
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
      <div className="accordion-header-container 2">
        <div
          className="accordion-header"
          onClick={onToggle}
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

function TimeLeft({ completeBy, settings }: { completeBy: number | undefined, settings: Settings }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [className, setClassName] = useState('');

  useEffect(() => {
    if (!completeBy) {
      setTimeLeft('No Deadline');
      return;
    }

    const update = () => {
      const ms = completeBy - Date.now();
      if (ms < 0) {
        setTimeLeft('Overdue');
        setClassName('priority-high');
        return;
      }

      // Set class to yellow if less than an hour left
      if (ms < (settings.warningTime * 60000)) { // Convert minutes to milliseconds
        setClassName('priority-medium');
      } else {
        setClassName('');
      }

      setTimeLeft(formatTime(ms));
    };

    update();
    const interval = setInterval(update, 1000); // Update every second
    return () => clearInterval(interval);
  }, [completeBy, settings.warningTime]);

  return <span className={className}>{timeLeft}</span>;
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

const formatDate = (ts: number) => {
  if (typeof ts !== 'number') return 'N/A';
  return new Date(ts).toLocaleDateString();
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
  activeCategoryId: 'all',
  activeSubCategoryId: 'all',
  warningTime: 60, // Default to 60 minutes
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
  const activeCategoryId = settings.activeCategoryId ?? 'all';
  const activeSubCategoryId = settings.activeSubCategoryId ?? 'all';

  const [editingViaContext, setEditingViaContext] = useState<number | null>(null);
  const [openAccordionIds, setOpenAccordionIds] = useState<Set<number>>(new Set());

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const newTaskTitleInputRef = useRef<HTMLInputElement>(null);


  const [newTask, setNewTask] = useState({
    text: '',
    url: '',
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
    isAutocomplete: false,
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
    case 'open-in-list':
      setOpenAccordionIds(prev => new Set(prev).add(wordId));
      setSettings(prev => ({ ...prev, currentView: 'list' }));
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
      setOpenAccordionIds(prev => new Set(prev).add(editingViaContext));
      const timer = setTimeout(() => setEditingViaContext(null), 100);
      return () => clearTimeout(timer);
    }
  }, [editingViaContext]);

  const handleAccordionToggle = (wordId: number) => {
    setOpenAccordionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(wordId)) {
        newSet.delete(wordId);
      } else {
        newSet.add(wordId);
      }
      return newSet;
    });
  };

  // Effect to handle autocomplete tasks
  useEffect(() => {
    const autocompleteInterval = setInterval(() => {
      const now = Date.now();
      words.forEach(word => {
        if (word.isAutocomplete && word.completeBy && now >= word.completeBy) {
          handleCompleteWord(word);
        }
      });
    }, 1000); // Check every second

    return () => clearInterval(autocompleteInterval);
  }, [words]); // Rerun when words change

  const focusAddTaskInput = () => {
    setIsAddTaskOpen(true);
    // Use a timeout to ensure the accordion is open before focusing.
    // This works even if the accordion was already open.
    setTimeout(() => {
      newTaskTitleInputRef.current?.focus();
    }, 50); // A small delay helps ensure the element is visible
  };

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

      setCopyStatus('Task added!');
      setTimeout(() => setCopyStatus(''), 2000);
      setWords((prevWords) => [...prevWords, newWord]);
      // Reset the new task form
      setNewTask({
        text: '',
        url: '',
        priority: 'Medium',
        categoryId: newTask.categoryId, // Keep the selected category
        openDate: new Date().getTime(),
        completeBy: undefined,
        company: '',
        websiteUrl: '',
        manualTime: 0,
        manualTimeRunning: false,
        manualTimeStart: 0,
        payRate: 0,
        isRecurring: false,
        isAutocomplete: false,
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

  return (
    <div className="app-container">
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
              const parentCategories = settings.categories.filter(c => !c.parentId);
              const subCategoriesForActive = activeCategoryId !== 'all' ? settings.categories.filter(c => c.parentId === activeCategoryId) : [];

              const filteredWords = words.filter(word => {
                if (activeCategoryId === 'all') return true; // Show all words
                
                // Find the parent category if the active one is a sub-category
                const activeCategory = settings.categories.find(c => c.id === activeCategoryId);
                const parentId = activeCategory?.parentId || activeCategoryId;

                const subCategoriesForActive = settings.categories.filter(c => c.parentId === parentId);

                // If a sub-category is selected, filter by it directly
                if (activeSubCategoryId !== 'all') {
                  return word.categoryId === activeSubCategoryId;
                }

                // If 'all' sub-categories are selected for a parent, show all words in that parent and its children
                const categoryIdsToShow = [parentId, ...subCategoriesForActive.map(sc => sc.id)];
                return categoryIdsToShow.includes(word.categoryId);
              });

              return (
                <>
                  <div className="category-tabs">
                    <button onClick={() => { setActiveCategoryId('all'); setActiveSubCategoryId('all'); }} className={activeCategoryId === 'all' ? 'active' : ''}>
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
                        <button key={cat.id} onClick={() => { setActiveCategoryId(cat.id); setActiveSubCategoryId('all'); }} className={activeCategoryId === cat.id ? 'active' : ''}>
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
                          <button onClick={() => setActiveSubCategoryId('all')} className={activeSubCategoryId === 'all' ? 'active' : ''}>All ({totalCount})</button>
                        );
                      })()}
                      {subCategoriesForActive.map(subCat => (
                        (() => {
                          // Calculate count from the full 'words' list, not the filtered one,
                          // to ensure counts are stable regardless of the active sub-filter.
                          const count = words.filter(w => w.categoryId === subCat.id).length;
                          return <button key={subCat.id} onClick={() => setActiveSubCategoryId(subCat.id)} className={activeSubCategoryId === subCat.id ? 'active' : ''}>
                            {subCat.name} ({count})
                          </button>
                        })()
                      ))}
                    </div>
                  )}
                  {filteredWords.length > 0 ? (
                    <>
                      <div className="list-header">
                        <h3>Priority List</h3>
                        <div className="list-header-actions" onContextMenu={(e) => { e.stopPropagation(); }}>
                          <button onClick={() => {
                            focusAddTaskInput();
                            setOpenAccordionIds(new Set()); // Collapse others when adding new
                            // Prioritize the active sub-category, otherwise fall back to the parent category
                            const defaultCategoryId = activeSubCategoryId !== 'all' 
                              ? activeSubCategoryId 
                              : (activeCategoryId !== 'all' ? activeCategoryId : undefined);

                            if (defaultCategoryId) {
                              setNewTask(prev => ({ ...prev, categoryId: defaultCategoryId }));
                            }
                          }} title="Add New Task">+</button>
                          <button onClick={handleClearAll} title="Clear All Tasks">🗑️</button>
                          <button onClick={handleCopyList} title="Copy Open Tasks">📋</button>
                        </div>
                        <div className="button-group">
                          <button onClick={() => {
                            const allVisibleIds = new Set(filteredWords.map(w => w.id));
                            setOpenAccordionIds(allVisibleIds);
                          }} title="Expand All">📂</button>
                          <button onClick={() => setOpenAccordionIds(new Set())} title="Collapse All">📁</button>
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
                                isOpen={openAccordionIds.has(word.id)}
                                onToggle={() => handleAccordionToggle(word.id)}
                                title={
                                <>
                                  <div className="accordion-title-container">
                                    <span className="accordion-main-title">{word.text}</span>
                                    {(() => {
                                      if (!word.categoryId) return null;
                                      const category = settings.categories.find(c => c.id === word.categoryId);
                                      if (!category) return null;

                                      const parentCategory = category.parentId ? settings.categories.find(c => c.id === category.parentId) : null;

                                      const handlePillClick = (e: React.MouseEvent, catId: number, parentId?: number) => {
                                        e.stopPropagation();
                                        setActiveCategoryId(parentId || catId);
                                        if (parentId) setActiveSubCategoryId(catId);
                                      };

                                      return (
                                        <>
                                          {parentCategory && (
                                            <span className="category-pill" onClick={(e) => handlePillClick(e, parentCategory.id)}>{parentCategory.name}</span>
                                          )}
                                          <span className="category-pill" onClick={(e) => handlePillClick(e, category.id, parentCategory?.id)}>{category.name}</span>
                                        </>
                                      );
                                    })()}
                                  </div>
                                  <div className="accordion-subtitle">
                                    {word.company && <span>{word.company}</span>}
                                    <span>{formatDate(word.openDate)} {new Date(word.openDate).toLocaleTimeString()}</span>
                                    {word.completeBy && <span>Due: {formatDate(word.completeBy)} {new Date(word.completeBy).toLocaleTimeString()}</span>}
                                    <span><TimeLeft completeBy={word.completeBy} settings={settings} /></span>
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
                                  onDescriptionChange={(html) => setWords(words.map(w => w.id === word.id ? { ...w, description: html } : w))}
                                    settings={settings}                                    
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
                                }} title="Toggle Autocomplete" className={`recurring-toggle ${word.isAutocomplete ? 'active' : ''}`}>
                                  🤖
                                </button>
                                <button onClick={() => {
                                  const newRecurringState = !word.isRecurring;
                                  setWords(words.map(w => w.id === word.id ? { ...w, isRecurring: newRecurringState } : w));
                                  setCopyStatus(`Re-occurring task ${newRecurringState ? 'enabled' : 'disabled'}.`);
                                  setTimeout(() => setCopyStatus(''), 2000);
                                }} title="Toggle Re-occurring" className={`recurring-toggle ${word.isRecurring ? 'active' : ''}`}>
                                  🔁
                                </button>
                                  <button onClick={() => handleCompleteWord(word)} className="complete-btn" title="Complete Task">✓</button>
                                  <button onClick={() => handleEdit(word)} title="Rename Task">Rename</button>
                                  <button onClick={() => {
                                    const targetWord = filteredWords[index - 1];
                                    if (targetWord) moveWord(word.id, targetWord.id);
                                  }} disabled={index === 0} title="Move Up">↑</button>
                                  <button onClick={() => {
                                    const targetWord = filteredWords[index + 1];
                                    if (targetWord) moveWord(word.id, targetWord.id);
                                  }} disabled={index === filteredWords.length - 1} title="Move Down">↓</button>
                                  <button onClick={() => removeWord(word.id)} className="remove-btn" title="Delete Task">×</button>
                                </div>
                              </TaskAccordion>
                            )}
                          </div>
                        ))}
                        <div className="add-task-row">
                          <button className="add-task-button" onClick={() => {
                            focusAddTaskInput();
                            // Prioritize the active sub-category, otherwise fall back to the parent category
                            const defaultCategoryId = activeSubCategoryId !== 'all' 
                              ? activeSubCategoryId 
                              : (activeCategoryId !== 'all' ? activeCategoryId : undefined);

                            if (defaultCategoryId) {
                              setNewTask(prev => ({ ...prev, categoryId: defaultCategoryId }));
                            }
                          }}>+ Open Task</button>
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

                        if (defaultCategoryId) {
                          setNewTask(prev => ({ ...prev, categoryId: defaultCategoryId }));
                        }
                      }}>+ Open Task</button>
                    </div>
                  )}
                </>
              );
            })()}
            {(() => {
              const filteredCompletedWords = completedWords.filter(word => {
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

              return (
              <SimpleAccordion title="Completed Items">
                <div className="completed-actions">
                  <button onClick={handleClearCompleted} title="Clear Completed List">🗑️</button>
                  <button onClick={handleCopyReport} title="Copy Report">📋</button>
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
                        <TaskAccordion word={word} title={title} isOpen={openAccordionIds.has(word.id)} onToggle={() => handleAccordionToggle(word.id)}>
                          {/* This first child is the 'content' for the accordion */}
                          <TabbedView 
                            word={word} 
                            onUpdate={() => {}} // No updates for completed items
                            formatTimestamp={formatTimestamp}
                            setCopyStatus={(msg) => { setCopyStatus(msg); setTimeout(() => setCopyStatus(''), 2000); }}
                            onDescriptionChange={() => {}}
                            settings={settings}
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
              );
            })()}
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
                <CategoryOptions categories={settings.categories} />
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
                    return <>
                      <button onClick={() => setNewTask({ ...newTask, openDate: undefined })} title="Clear Date">❌</button>
                      <button onClick={() => setNewTask({ ...newTask, openDate: new Date().getTime() })} title="Set to Now">NOW</button>
                      <button onClick={() => { const d = new Date(newTask.openDate || Date.now()); d.setMinutes(0,0,0); setNewTask({ ...newTask, openDate: d.getTime() }); }} title="Round to Hour">:00</button>
                      <button onClick={() => subtractTime(15, 'minutes')}>-15m</button> <button onClick={() => subtractTime(30, 'minutes')}>-30m</button>
                      <button onClick={() => subtractTime(1, 'hours')}>-1h</button> <button onClick={() => subtractTime(2, 'hours')}>-2h</button>
                      <button onClick={() => subtractTime(1, 'days')}>-1d</button> <button onClick={() => subtractTime(3, 'days')}>-3d</button>
                    </>;
                  })()}
                </div>
              </div>
            </label>
            <label><h4>Complete By:</h4>
            <input type="datetime-local" value={formatTimestampForInput(newTask.completeBy)} onChange={(e) => setNewTask({ ...newTask, completeBy: parseInputTimestamp(e.target.value) })} />
              <div className="button-group">{(() => {
                  const addTime = (amount: number, unit: 'minutes' | 'hours' | 'days') => {
                    const baseTime = newTask.completeBy ? new Date(newTask.completeBy) : new Date();
                    if (unit === 'minutes') baseTime.setMinutes(baseTime.getMinutes() + amount);
                    if (unit === 'hours') baseTime.setHours(baseTime.getHours() + amount);
                    if (unit === 'days') baseTime.setDate(baseTime.getDate() + amount);
                    setNewTask({ ...newTask, completeBy: baseTime.getTime() });
                  };
                  return <>
                    <button onClick={() => setNewTask({ ...newTask, completeBy: undefined })} title="Clear Date">❌</button>
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
            <DescriptionEditor 
              description={newTask.description || ''} 
              onDescriptionChange={(html) => setNewTask({ ...newTask, description: html })} 
            />
            <label className="checkbox-label flexed-column">
              <input type="checkbox" checked={newTask.isRecurring || false} onChange={(e) => setNewTask({ ...newTask, isRecurring: e.target.checked })} />
              <span className='checkbox-label-text'>Re-occurring Task</span>
            </label>
            <label className="checkbox-label flexed-column">
              <input type="checkbox" checked={newTask.isAutocomplete || false} onChange={(e) => setNewTask({ ...newTask, isAutocomplete: e.target.checked })} />
              <span className='checkbox-label-text'>Autocomplete on Deadline</span>
            </label>
            <button onClick={() => handleInputKeyDown({ key: 'Enter' } as React.KeyboardEvent<HTMLInputElement>)}>
              Add Task
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
                <button onClick={() => setSettings(prev => ({ ...prev, categories: moveCategory(prev.categories, parentCat.id, 'up') }))} title="Move Up">↑</button>
                <button onClick={() => setSettings(prev => ({ ...prev, categories: moveCategory(prev.categories, parentCat.id, 'down') }))} title="Move Down">↓</button>
                <button className="remove-link-btn" onClick={() => {
                  const subCategoryCount = settings.categories.filter(c => c.parentId === parentCat.id).length;
                  const confirmationMessage = `Are you sure you want to delete the category "${parentCat.name}"? This will also delete its ${subCategoryCount} sub-categories.`;
                  if (window.confirm(confirmationMessage)) {
                    const newCategories = settings.categories.filter(c => c.id !== parentCat.id && c.parentId !== parentCat.id);
                    setWords(words.map(w => w.categoryId === parentCat.id ? { ...w, categoryId: undefined } : w));
                    setSettings(prev => ({ ...prev, categories: newCategories }));
                  }
                }}>-</button>
                <button className="add-link-btn" onClick={() => {
                  const newSubCategory = { id: Date.now(), name: 'New Sub-Category', parentId: parentCat.id };
                  setSettings(prev => ({ ...prev, categories: [...prev.categories, newSubCategory] }));
                }} title="Add Sub-Category">+</button>
              </div>
              {settings.categories.filter(c => c.parentId === parentCat.id).map((subCat: Category) => (
                <div key={subCat.id} className="category-manager-item sub">
                  <input 
                    type="text" 
                    value={subCat.name}
                    onChange={(e) => { // Correctly update sub-category name
                        const newCategories = settings.categories.map(c => 
                            c.id === subCat.id ? { ...c, name: e.target.value } : c
                        );
                        setSettings(prev => ({ ...prev, categories: newCategories }));
                    }}
                  />
                  <button onClick={() => setSettings(prev => ({ ...prev, categories: moveCategory(prev.categories, subCat.id, 'up') }))} title="Move Up">↑</button>
                  <button onClick={() => setSettings(prev => ({ ...prev, categories: moveCategory(prev.categories, subCat.id, 'down') }))} title="Move Down">↓</button>
                  <button className="remove-link-btn" onClick={() => {
                    if (window.confirm(`Are you sure you want to delete the sub-category "${subCat.name}"?`)) {
                      const newCategories = settings.categories.filter(c => c.id !== subCat.id);
                      // Also un-categorize any words that were in this sub-category by moving them to the parent
                      setWords(words.map(w => w.categoryId === subCat.id ? { ...w, categoryId: parentCat.id } : w));
                      setSettings(prev => ({ ...prev, categories: newCategories }));
                    }
                  }}>-</button>
                </div>
              ))}
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

        <SimpleAccordion title="Time Management">
          <label>
            Warning Time (minutes):
            <input type="number" value={settings.warningTime} onChange={(e) => setSettings(prev => ({ ...prev, warningTime: Number(e.target.value) }))} />
          </label>
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
          </>
        )}
      </div>
    </div>
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

// Create a root element for React to mount into
const rootElement = document.createElement('div');
rootElement.id = 'root';
document.body.appendChild(rootElement);

const root = createRoot(rootElement);
root.render(<React.StrictMode><App /></React.StrictMode>);

// A global, reusable handler for rich text key events.
// It accepts a callback to sync state after a DOM command.
const handleGlobalRichTextKeyDown = (
  e: React.KeyboardEvent<HTMLDivElement>, 
  onStateUpdate: () => void,
  setIsLinkModalOpen?: (isOpen: boolean) => void,
  setSelectionRange?: (range: Range) => void
) => {
  let commandExecuted = false;

  // Handle Alt+1-6 for Header tags. We check for !e.ctrlKey to avoid conflicts.
  if (e.altKey && !e.shiftKey && !e.ctrlKey && headerShortcutKeys.includes(e.key)) {
    e.preventDefault();
    const headerLevel = e.key;
    document.execCommand('removeFormat', false, null);
    document.execCommand('formatBlock', false, `H${headerLevel}`);
    commandExecuted = true;
  }
  // Handle Ctrl-based shortcuts
  else if (e.ctrlKey) {
    switch (e.key.toLowerCase()) {
      case 'k': // Link
        if (setIsLinkModalOpen && setSelectionRange) {
          e.preventDefault();
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            setSelectionRange(selection.getRangeAt(0));
            setIsLinkModalOpen(true);
          }
        }
        break;
      // For Bold, Italic, and Underline, we can let the browser do its default action.
      // No 'case' is needed, so they fall through and don't trigger preventDefault().
      case 'l': e.preventDefault(); document.execCommand('insertUnorderedList', false, null); commandExecuted = true; break;      
      case '\\': e.preventDefault(); document.execCommand('removeFormat', false, null); commandExecuted = true; break;
      case 'p': e.preventDefault(); document.execCommand('formatBlock', false, 'P'); commandExecuted = true; break;
      // Other Ctrl+key combinations (like C, V, Z, B, I, U) are allowed to perform their default action.
      default:
        // No-op, allow default browser behavior
    }
  }

  // If a command was executed that changed the DOM, call the state update callback.
  // We use a timeout to ensure the DOM has been updated by the browser before we read it.
  if (commandExecuted) {
    setTimeout(() => {
      onStateUpdate();
    }, 0);
  }
};