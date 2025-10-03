import React from 'react';
import { ChecklistSection, Settings } from '../types';
import { formatChecklistForCopy } from '../utils';

interface ChecklistHeaderProps {
    taskId: number;
    settings: Settings;
    history: ChecklistSection[][];
    historyIndex: number;
    isEditable: boolean;
    confirmingDeleteChecked: number | 'all' | null;
    confirmingDeleteResponses: boolean;
    confirmingDeleteNotes: boolean;
    confirmingDeleteAllSections: boolean;
    confirmTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;

    // Handlers
    onDeleteChecked: (sectionId?: number) => void;
    onToggleAllSections: () => void;
    onSendAllItemsToTimer: (startImmediately: boolean) => void;
    onExpandAllSections: () => void;
    onCollapseAllSections: () => void;
    onAddResponses: (sectionId?: number) => void;
    onSettingsChange: (update: Partial<Settings> | ((prevSettings: Settings) => Partial<Settings>)) => void;
    onDeleteAllResponses: () => void;
    onAddNotes: (sectionId?: number) => void;
    onDeleteAllNotes: () => void;
    showToast: (message: string) => void;
    onGlobalChecklistCommand: (payload: { command: string }) => void;
    onUndo: () => void;
    onRedo: () => void;
    onDeleteAllSections: () => void;
    setConfirmingDeleteResponses: React.Dispatch<React.SetStateAction<boolean>>;
    setConfirmingDeleteNotes: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ChecklistHeader: React.FC<ChecklistHeaderProps> = ({
    taskId, settings, history, historyIndex, isEditable,
    confirmingDeleteChecked, confirmingDeleteResponses, confirmingDeleteNotes,
    confirmingDeleteAllSections, confirmTimeoutRef, onDeleteChecked, onToggleAllSections,
    onSendAllItemsToTimer, onExpandAllSections, onCollapseAllSections, onAddResponses,
    onSettingsChange, onDeleteAllResponses, onAddNotes, onDeleteAllNotes, showToast,
    onGlobalChecklistCommand, onUndo, onRedo, onDeleteAllSections,
    setConfirmingDeleteResponses, setConfirmingDeleteNotes
}) => {
    const allItems = history[historyIndex]?.flatMap(sec => sec.items) || [];
    if (allItems.length === 0) {
        return (
            <div className="checklist-main-header">
                <h4>Checklist</h4>
            </div>
        );
    }

    const areAllItemsComplete = allItems.every(item => item.isCompleted);
    const anyItemsCompleted = allItems.some(item => item.isCompleted);

    return (
        <div className="checklist-main-header" onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const isInEditMode = settings.activeTaskTabs?.[taskId] === 'edit';
            window.electronAPI.showChecklistMainHeaderContextMenu({
                taskId,
                sectionId: 0,
                areAllComplete: false,
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
            <div className="checklist-section-actions checklist-main-header-actions">
                {anyItemsCompleted && (
                    <button className={`checklist-action-btn delete-btn ${confirmingDeleteChecked === 'all' ? 'confirm-delete' : ''}`} onClick={() => onDeleteChecked()} title="Delete All Checked Items">
                        <i className="fas fa-trash-alt"></i>
                    </button>
                )}
                <button onClick={onToggleAllSections} className="checklist-action-btn" title={areAllItemsComplete ? 'Re-Open All Items in All Sections' : 'Complete All Items in All Sections'}>
                    <i className={`fas ${areAllItemsComplete ? 'fa-undo' : 'fa-check-square'}`}></i>
                </button>
                <div className="checklist-action-group checklist-action-group-expand">
                    <button className="checklist-action-btn" onClick={() => onSendAllItemsToTimer(false)} title="Send All Items to Timer">
                        <i className="fas fa-stopwatch"></i>
                    </button>
                    <button className="checklist-action-btn" onClick={() => onSendAllItemsToTimer(true)} title="Send All Items to Timer and Start">
                        <i className="fas fa-play-circle"></i>
                    </button>
                    <button className="checklist-action-btn" onClick={onExpandAllSections} title="Expand All Sections">
                        <i className="fas fa-folder-open"></i>
                    </button>
                    <button className="checklist-action-btn" onClick={onCollapseAllSections} title="Collapse All Sections">
                        <i className="fas fa-folder"></i>
                    </button>
                </div>
                <div className="checklist-action-group checklist-action-group-responses">
                    <button className="checklist-action-btn" onClick={() => onAddResponses()} title="Add Response to All Items">
                        <i className="fas fa-reply"></i>
                    </button>
                    <button className="checklist-action-btn" onClick={() => onSettingsChange(prev => ({ ...prev, showChecklistResponses: !prev.showChecklistResponses }))} title={settings.showChecklistResponses ? 'Hide All Responses' : 'Show All Responses'}>
                        <i className={`fas fa-eye ${settings.showChecklistResponses ? '' : 'disabled-icon'}`}></i>
                    </button>
                    <button className={`checklist-action-btn ${confirmingDeleteResponses ? 'confirm-delete' : ''}`} onClick={() => { if (confirmingDeleteResponses) { onDeleteAllResponses(); setConfirmingDeleteResponses(false); if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current); } else { setConfirmingDeleteResponses(true); setConfirmingDeleteNotes(false); if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current); confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteResponses(false), 3000); } }} title="Delete All Responses">
                        <i className="fas fa-trash-alt delete-icon"></i>
                    </button>
                </div>
                <div className="checklist-action-group checklist-action-group-notes">
                    <button className="checklist-action-btn" onClick={() => onAddNotes()} title="Add Note to All Items">
                        <i className="fas fa-sticky-note"></i>
                    </button>
                    <button className="checklist-action-btn" onClick={() => onSettingsChange(prev => ({ ...prev, showChecklistNotes: !prev.showChecklistNotes }))} title={settings.showChecklistNotes ? 'Hide All Notes' : 'Show All Notes'}>
                        <i className={`fas fa-eye ${settings.showChecklistNotes ? '' : 'disabled-icon'}`}></i>
                    </button>
                    <button className={`checklist-action-btn ${confirmingDeleteNotes ? 'confirm-delete' : ''}`} onClick={() => { if (confirmingDeleteNotes) { onDeleteAllNotes(); setConfirmingDeleteNotes(false); if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current); } else { setConfirmingDeleteNotes(true); setConfirmingDeleteResponses(false); if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current); confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteNotes(false), 3000); } }} title="Delete All Notes">
                        <i className="fas fa-trash-alt delete-icon"></i>
                    </button>
                </div>
                <div className="checklist-action-group checklist-action-group-copy">
                    <button className="checklist-action-btn" onClick={() => { const textToCopy = formatChecklistForCopy(history[historyIndex]); navigator.clipboard.writeText(textToCopy); showToast('All sections copied to clipboard!'); }} title="Copy All Sections">
                        <i className="fas fa-copy"></i>
                    </button>
                    <button className="checklist-action-btn" onClick={() => { const allRawText = history[historyIndex].map(section => { const header = `### ${section.title}`; const itemsText = section.items.map(item => item.text).join('\n'); return `${header}\n${itemsText}`; }).join('\n---\n'); navigator.clipboard.writeText(allRawText); showToast('All sections raw content copied!'); }} title="Copy All Sections Raw">
                        <i className="fas fa-paste"></i>
                    </button>
                    <button className="checklist-action-btn" onClick={() => onGlobalChecklistCommand({ command: 'save_checklist_as_template' })} title="Save Checklist as Template">
                        <i className="fas fa-save"></i>
                    </button>
                </div>
                <div className="checklist-action-group checklist-action-group-history">
                    <button className="checklist-action-btn" onClick={onUndo} disabled={historyIndex === 0} title="Undo Last Checklist Action">
                        <i className="fas fa-undo-alt"></i>
                    </button>
                    <button className="checklist-action-btn" onClick={onRedo} disabled={historyIndex === history.length - 1} title="Redo Checklist Action">
                        <i className="fas fa-redo-alt"></i>
                    </button>
                </div>
                {isEditable && (
                    <button onClick={onDeleteAllSections} className={`add-section-btn checklist-delete-btn delete-btn ${confirmingDeleteAllSections ? 'confirm-delete' : ''}`} title="Delete All Sections">
                        <i className="fas fa-trash-alt delete-icon"></i>
                    </button>
                )}
            </div>
        </div>
    );
};