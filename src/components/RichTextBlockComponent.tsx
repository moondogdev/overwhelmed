import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RichTextBlock, Settings } from '../types';
import { DescriptionEditor } from './Editors';

interface RichTextBlockComponentProps {
    block: RichTextBlock;
    isEditable: boolean;
    onUpdate: (blockId: number, newContent: string) => void;
    onDelete: (blockId: number) => void;
    settings: Settings;
    onSettingsChange: (update: Partial<Settings> | ((prevSettings: Settings) => Partial<Settings>)) => void;
    editorKey: string;
    isEditing: boolean;
    onMove: (blockId: number, direction: 'up' | 'down') => void;
    onCopy: (blockId: number) => void;
    onCopyRaw: (blockId: number) => void;
    onSetEditing: (blockId: number | null) => void;
}

export const RichTextBlockComponent: React.FC<RichTextBlockComponentProps> = ({ block, isEditable, onUpdate, onDelete, settings, onSettingsChange, editorKey, isEditing, onSetEditing, onMove, onCopy, onCopyRaw }) => {
    const [content, setContent] = useState(block.content);
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setContent(block.content);
    }, [block.content]);
    
    useEffect(() => {
        if (isEditing && editorRef.current) {
            editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            editorRef.current.focus();
        }
    }, [isEditing]);

    const handleContentChange = (newContent: string) => {
        setContent(newContent);
        onUpdate(block.id, newContent);
    };

    const handleBlur = () => {
        // When the editor loses focus, we switch back to view mode.
        onSetEditing(null);
    };

    return (
        <div className="rich-text-block-container">
            {isEditing ? (
                <>
                    <div className="rich-text-block-actions">
                        {/* Actions inside edit mode can be added here if needed in the future */}
                    </div>
                    <DescriptionEditor
                        description={content}
                        onDescriptionChange={handleContentChange} // This updates on every keystroke
                        onBlur={handleBlur} // This handles saving and switching view
                        settings={settings}
                        onSettingsChange={onSettingsChange}
                        editorKey={editorKey}
                        editorRef={editorRef} // Pass the ref to the editor
                    />
                </>
            ) : (
                <div className="rich-text-block-view-wrapper">
                    <div className="rich-text-block-view" 
                        dangerouslySetInnerHTML={{ __html: content }} 
                        onDoubleClick={() => onSetEditing(block.id)} 
                    />
                    <div className="rich-text-block-quick-actions">
                        <button onClick={() => onMove(block.id, 'up')} title="Move Block Up" className="icon-button">
                            <i className="fas fa-arrow-up"></i>
                        </button>
                        <button onClick={() => onMove(block.id, 'down')} title="Move Block Down" className="icon-button">
                            <i className="fas fa-arrow-down"></i>
                        </button>
                        <button onClick={() => onCopy(block.id)} title="Copy Block Content" className="icon-button">
                            <i className="fas fa-copy"></i>
                        </button>
                        <button onClick={() => onCopyRaw(block.id)} title="Copy Block Raw Content" className="icon-button">
                            <i className="fas fa-paste"></i>
                        </button>
                        <button onMouseDown={() => onDelete(block.id)} title="Delete Content Block" className="icon-button">
                            <i className="fas fa-trash-alt delete-icon"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};