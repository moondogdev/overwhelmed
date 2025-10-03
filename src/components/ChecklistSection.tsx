import React from 'react';
import { ChecklistSection, Settings, Word, ChecklistItem, TimeLogEntry } from '../types';
import { formatChecklistForCopy } from '../utils';
import { ChecklistItemComponent } from './ChecklistItemComponent';

interface ChecklistSectionProps {
    section: ChecklistSection;
    wordId: number;
    isEditable: boolean;
    settings: Settings;
    history: ChecklistSection[][];
    historyIndex: number;
    timeLogDurations: Map<number, number>;
    editingItemId: number | null;
    editingItemText: string;
    editingResponseForItemId: number | null;
    editingNoteForItemId: number | null;
    editingSectionId: number | null;
    editingSectionTitle: string;
    hiddenNotesSections: Set<number>;
    hiddenResponsesSections: Set<number>;
    confirmingDeleteSectionId: number | null;
    confirmingDeleteChecked: number | 'all' | null;
    confirmingDeleteSectionResponses: number | null;
    confirmingDeleteSectionNotes: number | null;
    newItemTexts: { [key: number]: string };
    editingItemInputRef: React.RefObject<HTMLInputElement>;
    subInputRefs: React.MutableRefObject<{ [key: string]: HTMLInputElement; }>;
    addItemInputRef: React.MutableRefObject<{ [key: number]: HTMLTextAreaElement; }>;
    confirmTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;

    // Handlers
    onUpdate: (sections: ChecklistSection[]) => void;
    showToast: (message: string) => void;
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
    onToggleSectionCollapse: (sectionId: number) => void;
    onSetEditingSectionId: (id: number | null) => void;
    onSetEditingSectionTitle: (title: string) => void;
    onUpdateSectionTitle: (sectionId: number, newTitle: string) => void;
    onDeleteChecked: (sectionId?: number) => void;
    onCompleteAllInSection: (sectionId: number) => void;
    onSendSectionToTimer: (section: ChecklistSection, startImmediately: boolean) => void;
    onAddResponses: (sectionId?: number) => void;
    onToggleSectionResponses: (sectionId: number) => void;
    onDeleteAllSectionResponses: (sectionId: number) => void;
    onAddNotes: (sectionId?: number) => void;
    onToggleSectionNotes: (sectionId: number) => void;
    onDeleteAllSectionNotes: (sectionId: number) => void;
    onDuplicateSection: (sectionId: number) => void;
    onDeleteSection: (sectionId: number) => void;
    onAddItem: (sectionId: number) => void;
    onSetNewItemTexts: React.Dispatch<React.SetStateAction<{ [key: number]: string }>>;
    moveSection: (sections: ChecklistSection[], sectionId: number, direction: 'up' | 'down') => ChecklistSection[];
    setConfirmingDeleteSectionResponses: React.Dispatch<React.SetStateAction<number | null>>;
    setConfirmingDeleteSectionNotes: React.Dispatch<React.SetStateAction<number | null>>;
}

export const ChecklistSectionComponent: React.FC<ChecklistSectionProps> = ({
    section, wordId, isEditable, settings, history, historyIndex, timeLogDurations,
    editingItemId, editingItemText, editingResponseForItemId, editingNoteForItemId,
    editingSectionId, editingSectionTitle, hiddenNotesSections, hiddenResponsesSections,
    confirmingDeleteSectionId, confirmingDeleteChecked, confirmingDeleteSectionResponses,
    confirmingDeleteSectionNotes, newItemTexts, editingItemInputRef, subInputRefs,
    addItemInputRef, confirmTimeoutRef, onUpdate, showToast, onToggleItem, onUpdateItemText,
    onUpdateItemResponse, onUpdateItemNote, onDeleteItemResponse, onDeleteItemNote,
    onDeleteItem, onUpdateItemDueDateFromPicker, onUpdateItemDueDate, onSendToTimer,
    onDuplicateChecklistItem, onSetEditingItemId, onSetEditingItemText, onSetEditingResponseForItemId,
    onSetEditingNoteForItemId, onSetFocusSubInputKey, onToggleSectionCollapse, onSetEditingSectionId,
    onSetEditingSectionTitle, onUpdateSectionTitle, onDeleteChecked, onCompleteAllInSection,
    onSendSectionToTimer, onAddResponses, onToggleSectionResponses, onDeleteAllSectionResponses,
    onAddNotes, onToggleSectionNotes, onDeleteAllSectionNotes, onDuplicateSection,
    onDeleteSection, onAddItem, onSetNewItemTexts, moveSection,
    setConfirmingDeleteSectionResponses, setConfirmingDeleteSectionNotes
}) => {
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
                x: e.clientX, y: e.clientY
            });
        }}>
            <header className="checklist-section-header">
                <button
                    className="checklist-collapse-btn"
                    onClick={() => onToggleSectionCollapse(section.id)}
                    title={isSectionOpen ? 'Collapse Section' : 'Expand Section'}>
                    <i className={`fas ${isSectionOpen ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
                </button>
                <div className="checklist-header">
                    <div className="checklist-header-wrap">
                        {editingSectionId === section.id ? (
                            <input
                                type="text"
                                value={editingSectionTitle}
                                onChange={(e) => onSetEditingSectionTitle(e.target.value)}
                                onBlur={() => { onUpdateSectionTitle(section.id, editingSectionTitle); onSetEditingSectionId(null); }}
                                onKeyDown={(e) => { if (e.key === 'Enter') { onUpdateSectionTitle(section.id, editingSectionTitle); onSetEditingSectionId(null); } }}
                                onFocus={(e) => e.target.select()}
                                autoFocus
                                className="checklist-section-title-input"
                            />
                        ) : (
                            <>
                                <h3 className={'editable-title'} title="Double-click to edit" onDoubleClick={() => { onSetEditingSectionId(section.id); onSetEditingSectionTitle(section.title); }}>
                                    {section.title} ({completedCount}/{totalCount})
                                </h3>
                                {hiddenNotesSections.has(section.id) && (<span className="hidden-indicator" title="Notes are hidden in this section"><i className="fas fa-sticky-note disabled-icon"></i></span>)}
                                {hiddenResponsesSections.has(section.id) && (<span className="hidden-indicator" title="Responses are hidden in this section"><i className="fas fa-reply disabled-icon"></i></span>)}
                            </>
                        )}
                        {totalCount > 0 && (<span className="checklist-progress">({completedCount}/{totalCount} completed)</span>)}
                    </div>
                    <div className="checklist-section-actions checklist-section-header-actions">
                        {completedCount > 0 && (<button className={`checklist-action-btn delete-btn ${confirmingDeleteChecked === section.id ? 'confirm-delete' : ''}`} onClick={() => onDeleteChecked(section.id)} title="Delete Checked Items">{confirmingDeleteChecked === section.id ? <i className="fas fa-trash-alt"></i> : <i className="fas fa-trash-alt"></i>}</button>)}
                        {totalCount > 0 && (<button className="checklist-action-btn" onClick={() => onCompleteAllInSection(section.id)} title={areAllComplete ? "Reopen All Items" : "Complete All Items"}><i className={`fas ${areAllComplete ? 'fa-undo' : 'fa-check-square'}`}></i></button>)}
                        <button className="checklist-action-btn" onClick={() => onSendSectionToTimer(section, false)} title="Send All to Timer"><i className="fas fa-tasks"></i></button>
                        <div className="checklist-action-group checklist-action-group-responses">
                            <button className="checklist-action-btn" onClick={() => onAddResponses(section.id)} title="Add Response to All Items in Section"><i className="fas fa-reply"></i></button>
                            <button className="checklist-action-btn" onClick={() => onToggleSectionResponses(section.id)} title={hiddenResponsesSections.has(section.id) ? 'Show Responses in Section' : 'Hide Responses in Section'}><i className={`fas fa-eye ${!hiddenResponsesSections.has(section.id) ? '' : 'disabled-icon'}`}></i></button>
                            <button className={`checklist-action-btn ${confirmingDeleteSectionResponses === section.id ? 'confirm-delete' : ''}`} onClick={() => { if (confirmingDeleteSectionResponses === section.id) { onDeleteAllSectionResponses(section.id); setConfirmingDeleteSectionResponses(null); if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current); } else { setConfirmingDeleteSectionResponses(section.id); setConfirmingDeleteSectionNotes(null); if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current); confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteSectionResponses(null), 3000); } }} title="Delete All Responses in Section">{confirmingDeleteSectionResponses === section.id ? <i className="fas fa-trash-alt delete-icon"></i> : <i className="fas fa-trash-alt delete-icon"></i>}</button>
                        </div>
                        <div className="checklist-action-group checklist-action-group-notes">
                            <button className="checklist-action-btn" onClick={() => onAddNotes(section.id)} title="Add Note to All Items in Section"><i className="fas fa-sticky-note"></i></button>
                            <button className="checklist-action-btn" onClick={() => onToggleSectionNotes(section.id)} title={hiddenNotesSections.has(section.id) ? 'Show Notes in Section' : 'Hide Notes in Section'}><i className={`fas fa-eye ${!hiddenNotesSections.has(section.id) ? '' : 'disabled-icon'}`}></i></button>
                            <button className={`checklist-action-btn ${confirmingDeleteSectionNotes === section.id ? 'confirm-delete' : ''}`} onClick={() => { if (confirmingDeleteSectionNotes === section.id) { onDeleteAllSectionNotes(section.id); setConfirmingDeleteSectionNotes(null); if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current); } else { setConfirmingDeleteSectionNotes(section.id); setConfirmingDeleteSectionResponses(null); if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current); confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteSectionNotes(null), 3000); } }} title="Delete All Notes in Section">{confirmingDeleteSectionNotes === section.id ? <i className="fas fa-trash-alt delete-icon"></i> : <i className="fas fa-trash-alt delete-icon"></i>}</button>
                        </div>
                        <div className="checklist-action-group checklist-action-group-copy">
                            <button className="checklist-action-btn" onClick={() => { const sectionToCopy = history[historyIndex].find(s => s.id === section.id); if (sectionToCopy) { const textToCopy = formatChecklistForCopy([sectionToCopy]); navigator.clipboard.writeText(textToCopy); showToast('Section copied to clipboard!'); } }} title="Copy Section"><i className="fas fa-copy"></i></button>
                            <button className="checklist-action-btn" onClick={() => { const sectionToCopy = history[historyIndex].find(s => s.id === section.id); if (sectionToCopy) { const header = `### ${sectionToCopy.title}`; const itemsText = sectionToCopy.items.map(item => item.text).join('\n'); const textToCopy = `${header}\n${itemsText}`; navigator.clipboard.writeText(textToCopy); showToast('Section raw content copied!'); } }} title="Copy Section Raw"><i className="fas fa-paste"></i></button>
                            <button className="checklist-action-btn" onClick={() => onDuplicateSection(section.id)} title="Duplicate Section"><i className="fas fa-clone"></i></button>
                        </div>
                        <div className="checklist-action-group checklist-action-group-history">
                            <button className="checklist-action-btn" onClick={() => onUpdate(moveSection(history[historyIndex], section.id, 'up'))} title="Move Section Up"><i className="fas fa-arrow-up"></i></button>
                            <button className="checklist-action-btn" onClick={() => onUpdate(moveSection(history[historyIndex], section.id, 'down'))} title="Move Section Down"><i className="fas fa-arrow-down"></i></button>
                        </div>
                        <button className={`checklist-delete-btn ${confirmingDeleteSectionId === section.id ? 'confirm-delete' : ''}`} onClick={() => onDeleteSection(section.id)} title="Delete Section">{confirmingDeleteSectionId === section.id ? <i className="fas fa-trash-alt"></i> : <i className="fas fa-trash-alt"></i>}</button>
                    </div>
                </div>
            </header>
            {isSectionOpen &&
                <>
                    <div className="checklist-progress-bar-container">
                        <div className={`checklist-progress-bar-fill ${areAllComplete ? 'complete' : ''}`} style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <div className="checklist-items">
                        {section.items.map(item => (
                            <ChecklistItemComponent
                                key={item.id}
                                item={item}
                                sectionId={section.id}
                                wordId={wordId}
                                isEditable={isEditable}
                                settings={settings}
                                timeLogDurations={timeLogDurations}
                                editingItemId={editingItemId}
                                editingItemText={editingItemText}
                                editingResponseForItemId={editingResponseForItemId}
                                editingNoteForItemId={editingNoteForItemId}
                                hiddenNotesSections={hiddenNotesSections}
                                hiddenResponsesSections={hiddenResponsesSections}
                                editingItemInputRef={editingItemInputRef}
                                subInputRefs={subInputRefs}
                                onToggleItem={onToggleItem}
                                onUpdateItemText={onUpdateItemText}
                                onUpdateItemResponse={onUpdateItemResponse}
                                onUpdateItemNote={onUpdateItemNote}
                                onDeleteItemResponse={onDeleteItemResponse}
                                onDeleteItemNote={onDeleteItemNote}
                                onDeleteItem={onDeleteItem}
                                onUpdateItemDueDateFromPicker={onUpdateItemDueDateFromPicker}
                                onUpdateItemDueDate={onUpdateItemDueDate}
                                onSendToTimer={onSendToTimer}
                                onDuplicateChecklistItem={onDuplicateChecklistItem}
                                onSetEditingItemId={onSetEditingItemId}
                                onSetEditingItemText={onSetEditingItemText}
                                onSetEditingResponseForItemId={onSetEditingResponseForItemId}
                                onSetEditingNoteForItemId={onSetEditingNoteForItemId}
                                onSetFocusSubInputKey={onSetFocusSubInputKey}
                            />
                        ))}
                    </div>
                    <div className="checklist-add-item">
                        <textarea
                            ref={el => (addItemInputRef.current[section.id] = el)}
                            value={newItemTexts[section.id] || ''}
                            onChange={(e) => onSetNewItemTexts(prev => ({ ...prev, [section.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onAddItem(section.id); } }}
                            placeholder="Add item(s)... (Shift+Enter for new line)"
                        />
                        <button onClick={() => onAddItem(section.id)}>+</button>
                    </div>
                </>
            }
        </div>
    );
};