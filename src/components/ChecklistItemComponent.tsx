import React from 'react';
import { ChecklistItem, Settings, TimeLogEntry } from '../types';
import { formatDate, formatTime, extractUrlFromText } from '../utils';

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

interface ChecklistItemProps {
    item: ChecklistItem;
    sectionId: number;
    wordId: number;
    isEditable: boolean;
    settings: Settings;
    timeLogDurations: Map<number, number>;
    editingItemId: number | null;
    editingItemText: string;
    editingResponseForItemId: number | null;
    editingNoteForItemId: number | null;
    hiddenNotesSections: Set<number>;
    hiddenResponsesSections: Set<number>;
    editingItemInputRef: React.RefObject<HTMLInputElement>;
    subInputRefs: React.MutableRefObject<{ [key: string]: HTMLInputElement; }>;
    onToggleItem: (sectionId: number, itemId: number) => void;
    onUpdateItemText: (sectionId: number, itemId: number, newText: string) => void;
    onUpdateItemResponse: (sectionId: number, itemId: number, newResponse: string) => void;
    onUpdateItemNote: (sectionId: number, itemId: number, newNote: string) => void;
    onDeleteItemResponse: (sectionId: number, itemId: number) => void;
    onDeleteItemNote: (sectionId: number, itemId: number) => void;
    onDeleteItem: (sectionId: number, itemId: number) => void;
    onUpdateItemDueDateFromPicker: (sectionId: number, itemId: number, dateString: string) => void;
    onUpdateItemDueDate: (sectionId: number, itemId: number, newDueDate: number | undefined) => void;
    onSendToTimer: (item: ChecklistItem, startImmediately: boolean) => void;
    onDuplicateChecklistItem: (sectionId: number, itemId: number) => void;
    onSetEditingItemId: (id: number | null) => void;
    onSetEditingItemText: (text: string) => void;
    onSetEditingResponseForItemId: (id: number | null) => void;
    onSetEditingNoteForItemId: (id: number | null) => void;
    onSetFocusSubInputKey: (key: string | null) => void;
}

export const ChecklistItemComponent: React.FC<ChecklistItemProps> = ({
    item, sectionId, wordId, isEditable, settings, timeLogDurations,
    editingItemId, editingItemText, editingResponseForItemId, editingNoteForItemId,
    hiddenNotesSections, hiddenResponsesSections, editingItemInputRef, subInputRefs,
    onToggleItem, onUpdateItemText, onUpdateItemResponse, onUpdateItemNote,
    onDeleteItemResponse, onDeleteItemNote, onDeleteItem, onUpdateItemDueDateFromPicker,
    onUpdateItemDueDate, onSendToTimer, onDuplicateChecklistItem, onSetEditingItemId,
    onSetEditingItemText, onSetEditingResponseForItemId, onSetEditingNoteForItemId, onSetFocusSubInputKey
}) => {
    return (
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
                    sectionId: sectionId,
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
            {editingItemId === item.id ? (
                <input
                    type="text"
                    value={editingItemText}
                    onChange={(e) => onSetEditingItemText(e.target.value)}
                    onBlur={() => {
                        onUpdateItemText(sectionId, item.id, editingItemText);
                        onSetEditingItemId(null);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            onUpdateItemText(sectionId, item.id, editingItemText);
                            onSetEditingItemId(null);
                        } else if (e.key === 'Escape') {
                            onSetEditingItemId(null);
                        }
                    }}
                    autoFocus
                    ref={editingItemInputRef}
                    className="checklist-item-text-input"
                />
            ) : (
                <>
                    <div className="checklist-item-main-content">
                        <label className="checklist-item-label">
                            <input
                                type="checkbox"
                                checked={item.isCompleted}
                                onChange={() => onToggleItem(sectionId, item.id)}
                            />
                            {isEditable ? (
                                <input
                                    type="text"
                                    value={item.text}
                                    onChange={(e) => onUpdateItemText(sectionId, item.id, e.target.value)}
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
                                    onSetEditingItemId(item.id);
                                    onSetEditingItemText(item.text);
                                }} title="Edit Item"><i className="fas fa-pencil-alt"></i></button>
                                <button className="icon-button" onClick={() => onDuplicateChecklistItem(sectionId, item.id)} title="Duplicate Item"><i className="fas fa-clone"></i></button>
                                {item.response === undefined ? (
                                    <button className="icon-button" onClick={() => { onUpdateItemResponse(sectionId, item.id, ''); onSetEditingResponseForItemId(item.id); }} title="Add Response"><i className="fas fa-reply"></i></button>
                                ) : (
                                    <button className="icon-button" onClick={() => onDeleteItemResponse(sectionId, item.id)} title="Delete Response"><i className="fas fa-reply active-icon"></i></button>
                                )}
                                {item.note === undefined ? (
                                    <button className="icon-button" onClick={() => { onUpdateItemNote(sectionId, item.id, ''); onSetEditingNoteForItemId(item.id); }} title="Add Note"><i className="fas fa-sticky-note"></i></button>
                                ) : (
                                    <button className="icon-button" onClick={() => onDeleteItemNote(sectionId, item.id)} title="Delete Note"><i className="fas fa-sticky-note active-icon"></i></button>
                                )}
                                <button className="icon-button" onClick={() => onSendToTimer(item, false)} title="Add to Timer"><i className="fas fa-plus-circle"></i></button>
                                <button className="icon-button" onClick={() => onSendToTimer(item, true)} title="Add to Timer and Start"><i className="fas fa-play"></i></button>
                                <button className="icon-button" onClick={() => onDeleteItem(sectionId, item.id)} title="Delete Item"><i className="fas fa-trash-alt delete-icon"></i></button>
                            </div>
                        )}
                    </div>
                    {isEditable ? (
                        <>
                            {timeLogDurations.has(item.id) ? (
                                <span className="checklist-item-logged-time">
                                    (Logged: {formatTime(timeLogDurations.get(item.id) || 0)})
                                </span>
                            ) : null}
                            {settings.showChecklistResponses && !hiddenResponsesSections.has(sectionId) && (item.response !== undefined) && (
                                <div className="checklist-item-response" onContextMenu={(e) => {
                                    e.preventDefault(); e.stopPropagation();
                                    const url = extractUrlFromText(item.response);
                                    window.electronAPI.showChecklistResponseContextMenu({ sectionId: sectionId, itemId: item.id, hasUrl: !!url, hasResponse: !!item.response, x: e.clientX, y: e.clientY });
                                }}>
                                    <strong><i className="fas fa-reply"></i> Response:</strong>
                                    <input type="text" value={item.response || ''} onChange={(e) => onUpdateItemResponse(sectionId, item.id, e.target.value)} placeholder="Add a response..." ref={el => subInputRefs.current[`response-${item.id}`] = el} className="checklist-item-sub-input" />
                                </div>
                            )}
                            {settings.showChecklistNotes && !hiddenNotesSections.has(sectionId) && (item.note !== undefined) && (
                                <div className="checklist-item-note" onContextMenu={(e) => {
                                    e.preventDefault(); e.stopPropagation();
                                    const url = extractUrlFromText(item.note);
                                    window.electronAPI.showChecklistNoteContextMenu({ sectionId: sectionId, itemId: item.id, hasUrl: !!url, hasNote: !!item.note, x: e.clientX, y: e.clientY });
                                }}>
                                    <strong><i className="fas fa-sticky-note"></i> Note:</strong>
                                    <input type="text" value={item.note || ''} onChange={(e) => onUpdateItemNote(sectionId, item.id, e.target.value)} placeholder="Add a private note..." ref={el => subInputRefs.current[`note-${item.id}`] = el} className="checklist-item-sub-input" />
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {timeLogDurations.has(item.id) ? (
                                <span className="checklist-item-logged-time">
                                    (Logged: {formatTime(timeLogDurations.get(item.id) || 0)})
                                </span>
                            ) : null}
                            {settings.showChecklistResponses && !hiddenResponsesSections.has(sectionId) && item.response !== undefined ? (
                                <div className="checklist-item-response" onContextMenu={(e) => {
                                    e.preventDefault(); e.stopPropagation();
                                    const url = extractUrlFromText(item.response);
                                    window.electronAPI.showChecklistResponseContextMenu({ sectionId: sectionId, itemId: item.id, hasUrl: !!url, hasResponse: !!item.response, x: e.clientX, y: e.clientY });
                                }}>
                                    <strong><i className="fas fa-reply"></i> Response:</strong>{editingResponseForItemId === item.id ? (
                                        <input type="text" value={item.response || ''} onBlur={() => onSetEditingResponseForItemId(null)} onChange={(e) => onUpdateItemResponse(sectionId, item.id, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') onSetEditingResponseForItemId(null); }} className="checklist-item-sub-input" autoFocus />
                                    ) : (
                                        <ClickableText text={item.response} settings={settings} />
                                    )}
                                </div>
                            ) : null}
                            {settings.showChecklistNotes && !hiddenNotesSections.has(sectionId) && item.note !== undefined ? (
                                <div className="checklist-item-note" onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); const url = extractUrlFromText(item.note); window.electronAPI.showChecklistNoteContextMenu({ sectionId: sectionId, itemId: item.id, hasUrl: !!url, hasNote: !!item.note, x: e.clientX, y: e.clientY }); }}>
                                    <strong><i className="fas fa-sticky-note"></i> Note:</strong>{editingNoteForItemId === item.id ? (
                                        <input type="text" value={item.note || ''} onBlur={() => onSetEditingNoteForItemId(null)} onChange={(e) => onUpdateItemNote(sectionId, item.id, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') onSetEditingNoteForItemId(null); }} className="checklist-item-sub-input" autoFocus />
                                    ) : (<ClickableText text={item.note} settings={settings} />)}
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
                                onChange={(e) => onUpdateItemDueDateFromPicker(sectionId, item.id, e.target.value)}
                                title="Set Due Date"
                            />
                            {settings.showChecklistResponses && (item.response === undefined ? (
                                <button className="icon-button" onClick={() => { onUpdateItemResponse(sectionId, item.id, ''); onSetFocusSubInputKey(`response-${item.id}`); }} title="Add Response"><i className="fas fa-reply"></i></button>
                            ) : (<button className="icon-button" onClick={() => onDeleteItemResponse(sectionId, item.id)} title="Delete Response"><i className="fas fa-reply active-icon"></i></button>))}
                            {settings.showChecklistNotes && (item.note === undefined ? (
                                <button className="icon-button" onClick={() => { onUpdateItemNote(sectionId, item.id, ''); onSetFocusSubInputKey(`note-${item.id}`); }} title="Add Note"><i className="fas fa-sticky-note"></i></button>
                            ) : (<button className="icon-button" onClick={() => onDeleteItemNote(sectionId, item.id)} title="Delete Note"><i className="fas fa-sticky-note active-icon"></i></button>))}
                            <button className="icon-button" onClick={() => onUpdateItemDueDate(sectionId, item.id, undefined)} title="Clear Due Date"><i className="fas fa-times"></i></button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};