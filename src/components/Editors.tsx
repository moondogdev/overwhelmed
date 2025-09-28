import React, { useState, useEffect, useRef } from 'react';
import { Settings } from '../types';

// --- Editor Constants ---
const headerShortcutKeys = ['1', '2', '3', '4', '5', '6'];
const headerShortcutKeyDisplay = headerShortcutKeys.map(key => `<b>Alt+${key}</b>: H${key}`).join(', ');
const otherShortcutKeys = `<span><b>Ctrl+B</b>: Bold, <i>Ctrl+I</i>: Italic, <u>Ctrl+U</u>: Underline, <b>Ctrl+K</b>: Link, <b>Ctrl+L</b>: List, <b>Ctrl+P</b>: Paragraph, <b>Ctrl+\\</b>: Clear Format</span>`;

// --- Modals ---

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

export function PromptModal({ isOpen, title, onClose, onConfirm, placeholder, initialValue = '' }: PromptModalProps) {
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

// --- Main Editor Component ---

export function DescriptionEditor({ description, onDescriptionChange, settings, onSettingsChange, editorKey }: { description: string, onDescriptionChange: (html: string) => void, settings: Settings, onSettingsChange: (newSettings: Partial<Settings>) => void, editorKey: string }) {
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