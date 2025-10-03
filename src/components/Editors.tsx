import React, { useState, useEffect, useRef } from 'react';
import { Settings } from '../types';
import './styles/Modal.css';

// --- Editor Constants ---
const otherShortcutKeys = `<span><b>Ctrl+B</b>: Bold, <i>Ctrl+I</i>: Italic, <u>Ctrl+U</u>: Underline</span>`;

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

export function DescriptionEditor({ description, onDescriptionChange, settings, onSettingsChange, editorKey }: { 
  description: string, 
  onDescriptionChange: (html: string) => void, 
  settings: Settings, 
  onSettingsChange: (update: Partial<Settings> | ((prevSettings: Settings) => Partial<Settings>)) => void, 
  editorKey: string 
}) {
  const [activeView, setActiveView] = useState<'view' | 'html'>('view');
  const [htmlContent, setHtmlContent] = useState(description);
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // State for link modal
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  // --- NEW: Custom Undo/Redo History State ---
  const [history, setHistory] = useState<string[]>([description]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoingRedoing = useRef(false);

  const [initialCursorPos, setInitialCursorPos] = useState<number | null>(null);

  useEffect(() => {
    // This effect synchronizes the DOM with React's state, especially after undo/redo.
    if (editorRef.current && htmlContent !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = htmlContent;
    }
  }, [htmlContent]);

  const handleBlur = (e: React.FocusEvent<HTMLDivElement | HTMLTextAreaElement>) => {
    const newHtml = activeView === 'view' ? (e.target as HTMLDivElement).innerHTML : (e.target as HTMLTextAreaElement).value;
    setHtmlContent(newHtml);
    onDescriptionChange(newHtml);
  };

  const updateHistory = (newHtml: string) => {
    if (isUndoingRedoing.current) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newHtml);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  const handleConfirmLink = (url: string) => {
    // Ensure the URL has a protocol
    let fullUrl = url;
    if (!/^https?:\/\//i.test(fullUrl)) {
      fullUrl = `https://${fullUrl}`;
    }

    if (selectionRange) {
      // Restore the selection that was lost when the modal opened.
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(selectionRange);

      // Modern link creation: Manually create and insert the link node.
      const selectedText = selectionRange.toString();
      selectionRange.deleteContents();
      const link = document.createElement('a');
      link.href = fullUrl;
      link.textContent = selectedText || fullUrl; // Use URL as text if selection was empty
      selectionRange.insertNode(link);

      // Update state and history
      if (editorRef.current) {
        const newHtml = editorRef.current.innerHTML;
        updateHistory(newHtml);
        onDescriptionChange(editorRef.current.innerHTML);
      }
    }
    setIsLinkModalOpen(false);
  };

  const handleEditorFocus = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      // Store the initial cursor position when the editor gains focus
      setInitialCursorPos(range.startOffset);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' && initialCursorPos !== null) {
      const selection = window.getSelection();
      if (!selection) return;

      const range = selection.getRangeAt(0);
      // Check if the new cursor position would be before the initial position
      if (range.startOffset <= initialCursorPos) {
        // Prevent the default action to keep the cursor in place
        e.preventDefault();
      }
    }
    handleRichTextKeyDown(e);
  };


  const handleRichTextKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let commandExecuted = false;
    const isCtrl = e.ctrlKey || e.metaKey;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    let block = range.startContainer;

    // Traverse up to find the block-level element (or the editor itself)
    while (block.nodeType !== Node.ELEMENT_NODE || window.getComputedStyle(block as Element).display !== 'block') {
      if (block.parentNode === editorRef.current || !block.parentNode) break;
      block = block.parentNode;
    }
  
    // We will only handle Ctrl+K for linking and our custom Undo/Redo.
    // All other formatting commands are removed to prevent conflicts with native behavior.
    if (isCtrl) {
      switch (e.key.toLowerCase()) {
        case 'z': // Undo
          e.preventDefault();
          if (historyIndex > 0) {
            isUndoingRedoing.current = true;
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setHtmlContent(history[newIndex]); // Update local state
            onDescriptionChange(history[newIndex]); // Notify parent
            setTimeout(() => isUndoingRedoing.current = false, 0);
          }
          break;
        case 'y': // Redo
          e.preventDefault();
          if (historyIndex < history.length - 1) {
            isUndoingRedoing.current = true;
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setHtmlContent(history[newIndex]); // Update local state
            onDescriptionChange(history[newIndex]); // Notify parent
            setTimeout(() => isUndoingRedoing.current = false, 0);
          }
          break;
        default:
          // Allow default browser behavior for Ctrl+C, Ctrl+V, etc.
          // We no longer intercept other formatting commands.
      }
    }
  
    if (commandExecuted) {
      // Use a timeout to ensure the DOM has been updated by the browser before we read it.
      setTimeout(() => {
        if (editorRef.current) {
          // This block is now only used for our custom commands (like linking)
          // which already update history internally.
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
    if (!selection) return;

    // Check if it's a URL and if there's currently text selected
    if (urlRegex.test(pastedText) && selection && !selection.isCollapsed && selectionRange) {
      // MODERN LINK CREATION LOGIC:
      // 1. Get the text that was highlighted.
      const selectedText = selectionRange.toString();
      // 2. Delete the highlighted text from the document.
      selectionRange.deleteContents();
      // 3. Create a new <a> element.
      const link = document.createElement('a');
      link.href = pastedText;
      link.textContent = selectedText;
      // 4. Insert the new link node at the cursor's position.
      selectionRange.insertNode(link);
      // 5. Move the cursor to the end of the newly created link.
      selectionRange.setStartAfter(link);
      selectionRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(selectionRange);
    } else {
      // --- ROBUST MODERN PASTE LOGIC ---
      // This manual approach gives us full control over the cursor position.
      const range = selection.getRangeAt(0);
      range.deleteContents();

      // Create a document fragment to hold all the new nodes.
      const fragment = document.createDocumentFragment();
      const lines = pastedText.split('\n');

      lines.forEach((line, index) => {
        if (line) fragment.appendChild(document.createTextNode(line));
        if (index < lines.length - 1) fragment.appendChild(document.createElement('br'));
      });

      const lastNode = fragment.lastChild;
      range.insertNode(fragment);

      // Correctly move the cursor to the end of the pasted content.
      if (lastNode) range.setStartAfter(lastNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // After the command, the DOM is updated. We need to sync React's state.
    // We use a timeout to ensure the DOM update has completed.
    setTimeout(() => {
      if (editorRef.current) {
        const newHtml = editorRef.current.innerHTML;
        // After our manual DOM change, update the history and the parent state.
        updateHistory(newHtml);
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
          onFocus={handleEditorFocus}
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
        <span dangerouslySetInnerHTML={{ __html: `${otherShortcutKeys}` }} />
      </div>
    </div>
  );
}