import React, { useRef, useEffect, useState } from 'react';
import { CodeSnippet, Settings, RichTextBlock } from '../types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { DescriptionEditor } from './Editors';

interface CodeEditorProps {
  snippet: CodeSnippet;
  onUpdate: (id: number, newSnippet: Partial<CodeSnippet>) => void;
  onDelete: (id: number) => void;
  showToast: (message: string) => void;
  isEditable: boolean;
  onSetEditable: (isEditing: boolean) => void;
  settings: Settings;
  onSettingsChange: (update: Partial<Settings> | ((prevSettings: Settings) => Partial<Settings>)) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ snippet, onUpdate, onDelete, showToast, isEditable, onSetEditable, settings, onSettingsChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionEditorRef = useRef<HTMLDivElement>(null);
  const [isDescriptionEditing, setIsDescriptionEditing] = useState(false);

  useEffect(() => {
    if (isEditable) {
      // If the textarea was what was likely clicked, focus it. Otherwise, default to title.
      // This is a heuristic, but good enough for the UX.
      if (document.activeElement?.tagName !== 'PRE') {
        titleInputRef.current?.focus();
        titleInputRef.current?.select();
      } else if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }
  }, [isEditable]);

  useEffect(() => {
    // When the description editor is revealed, focus it.
    if (isDescriptionEditing) {
      descriptionEditorRef.current?.focus();
    }
  }, [isDescriptionEditing]);

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet.code);
    showToast('Code snippet copied!');
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(snippet.id, { code: e.target.value });
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="code-snippet-container">
      {(() => {
        // In full snippet edit mode, always show the editor.
        if (isEditable) {
          return (
            <div className="code-snippet-description">
              <DescriptionEditor description={snippet.description || ''} onDescriptionChange={(html) => onUpdate(snippet.id, { description: html })} settings={settings} onSettingsChange={onSettingsChange} editorKey={`snippet-desc-edit-${snippet.id}`} />
            </div>
          );
        }
        // In read-only view, show the editor only when actively editing the description.
        if (isDescriptionEditing) {
          return (
            <div className="code-snippet-description">
              <DescriptionEditor description={snippet.description || ''} onDescriptionChange={(html) => onUpdate(snippet.id, { description: html })} settings={settings} onSettingsChange={onSettingsChange} editorKey={`snippet-desc-${snippet.id}`} onBlur={() => setIsDescriptionEditing(false)} editorRef={descriptionEditorRef} />
            </div>
          );
        }
        // Otherwise, show the rendered HTML view if it exists.
        if (snippet.description) {
          return <div className="rich-text-block-view" dangerouslySetInnerHTML={{ __html: snippet.description }} onDoubleClick={() => setIsDescriptionEditing(true)} />;
        }
        return null;
      })()}
      <div className="code-snippet-header">
        <input
          ref={titleInputRef}
          type="text"
          value={snippet.title}
          onChange={(e) => isEditable && onUpdate(snippet.id, { title: e.target.value })}
          placeholder="Snippet Title"
          className="code-snippet-title"
          readOnly={!isEditable}
          onDoubleClick={() => !isEditable && onSetEditable(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              textareaRef.current?.focus();
            }
          }}
        />
        <div className="header-actions">
          <select
            value={snippet.language || 'plaintext'}            
            onChange={(e) => onUpdate(snippet.id, { language: e.target.value })}
            className="code-snippet-language"
          >
            <option value="plaintext">Plain Text</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <optgroup label="Other">
              <option value="json">JSON</option>
              <option value="sql">SQL</option>
              <option value="markdown">Markdown</option>
              <option value="shell">Shell</option>
            </optgroup>
          </select>
          {!isEditable && (
            <button className="icon-button" onClick={() => onSetEditable(true)} title="Edit Snippet">
              <i className="fas fa-pencil-alt"></i>
            </button>
          )}
          {!isEditable && !snippet.description && !isDescriptionEditing && (
            <button className="icon-button" onClick={() => setIsDescriptionEditing(true)} title="Add Description">
              <i className="fas fa-file-alt"></i>
            </button>
          )}
          <button className="icon-button" onClick={handleCopy} title="Copy Code">
            <i className="fas fa-copy"></i>
          </button>
          {isEditable && (
            <button className="icon-button" onClick={() => onDelete(snippet.id)} title="Delete Snippet">
              <i className="fas fa-trash"></i>
            </button>
          )}
        </div>
      </div>
      {isEditable ? (
        <textarea
          ref={textareaRef}
          value={snippet.code}
          onChange={handleTextareaChange}
          onBlur={() => onSetEditable(false)}
          placeholder="Paste your code here..."
          className="code-snippet-textarea"
        />
      ) : (
        <div className="code-snippet-view" onDoubleClick={() => onSetEditable(true)}>
          <SyntaxHighlighter 
            language={snippet.language || 'plaintext'} 
            style={oneDark}
            customStyle={{ margin: 0, padding: '8px', borderRadius: '0 0 4px 4px' }}
            showLineNumbers={true}
            >{snippet.code || 'Double-click to add code...'}</SyntaxHighlighter>
        </div>
      )}
    </div>
  );
};