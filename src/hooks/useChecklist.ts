import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Task, ChecklistItem, ChecklistSection, InboxMessage, Settings, TimeLogEntry, ChecklistTemplate, RichTextBlock } from '../types';
import { extractUrlFromText, formatChecklistForCopy, formatDate, formatTime, indentChecklistItem, outdentChecklistItem, deleteChecklistItemAndChildren, moveChecklistItemAndChildren, formatChecklistItemsForRawCopy, moveCategory } from '../utils';
import { useChecklistState } from './useChecklistState';
import { useChecklistItemManagement } from './useChecklistItemManagement';
import { useChecklistHierarchy } from './useChecklistHierarchy';
import { useChecklistBlockManagement } from './useChecklistBlockManagement';
import { useChecklistIPC } from './useChecklistIPC';
import { useChecklistSectionManagement } from './useChecklistSectionManagement';
import { useChecklistTimer } from './useChecklistTimer';
import { useChecklistHistory } from './useChecklistHistory';
import { useChecklistGlobalActions } from './useChecklistGlobalActions';

interface UseChecklistProps {
    sections: (ChecklistSection | RichTextBlock)[] | ChecklistItem[];
    onUpdate: (newSections: (ChecklistSection | RichTextBlock)[]) => void;
    isEditable: boolean;
    onComplete: (item: ChecklistItem, sectionId: number, updatedSections: ChecklistSection[]) => void;
    tasks: Task[];
    completedTasks: Task[];
    setInboxMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
    task: Task;
    taskId: number;
    onTaskUpdate: (updatedTask: Task) => void;    
    checklistRef?: React.MutableRefObject<{ handleUndo: () => void; handleRedo: () => void; resetHistory: (sections: (ChecklistSection | RichTextBlock)[]) => void; handleGlobalChecklistCommand: (payload: { command: string; }) => void; handleSectionCommand: (payload: { command: string; sectionId?: number; blockId?: number; }) => void; handleItemCommand: (payload: { command: string; sectionId: number; itemId: number; color?: string; }) => void; }>;
    showToast: (message: string, duration?: number) => void;
    focusItemId: number | null;
    onFocusHandled: () => void;
    settings: Settings;
    onSettingsChange: (update: Partial<Settings> | ((prevSettings: Settings) => Partial<Settings>)) => void;
    handleGlobalToggleTimer: (taskId: number, entryId: number, entry?: TimeLogEntry, newTimeLog?: TimeLogEntry[]) => void;
    handleClearActiveTimer: () => void;
    handlePrimeTask: (taskId: number) => void;
    activeTimerEntry: TimeLogEntry | null;
    activeTimerLiveTime: number;
    handlePrimeTaskWithNewLog: (taskId: number, newTimeLog: TimeLogEntry[], timeLogTitle?: string) => void;
}

export const useChecklist = ({
    sections,
    onUpdate,
    isEditable,
    onComplete,
    tasks,
    completedTasks,
    setInboxMessages,
    task,
    taskId,
    onTaskUpdate,
    checklistRef,
    showToast,
    focusItemId,
    onFocusHandled,
    settings,
    onSettingsChange,
    handleGlobalToggleTimer,
    handleClearActiveTimer,
    handlePrimeTask,
    handlePrimeTaskWithNewLog,
    activeTimerEntry,
    activeTimerLiveTime
}: UseChecklistProps) => {
    const getNextChecklistId = useCallback(() => {
        let maxId = 0;
        const allTasks = [...tasks, ...completedTasks];

        for (const t of allTasks) {
            if (t.checklist && t.checklist.length > 0) {
                // Normalize legacy format for scanning
                const checklist = ('isCompleted' in t.checklist[0])
                    ? [{ id: 1, title: 'Checklist', items: t.checklist as ChecklistItem[] }]
                    : t.checklist as (ChecklistSection | RichTextBlock)[];

                for (const block of checklist) {
                    if (block.id > maxId) maxId = block.id;
                    if ('items' in block) {
                        for (const item of block.items) {
                            if (item.id > maxId) maxId = item.id;
                        }
                    }
                }
            }
        }
        return maxId + 1;
    }, [tasks, completedTasks]);

    // Create a derived map of checklist item times from the single source of truth: task.timeLog
    const timeLogDurations = useMemo(() => {
        const durations = new Map<number, number>();
        if (!task.timeLog) return durations;

        for (const entry of task.timeLog) {
            if (entry.checklistItemId) {
                const currentDuration = durations.get(entry.checklistItemId) || 0;
                const isRunning = activeTimerEntry?.id === entry.id;
                const displayDuration = isRunning ? activeTimerLiveTime : entry.duration;
                durations.set(entry.checklistItemId, currentDuration + displayDuration);
            }
        }
        return durations;
    }, [task.timeLog, activeTimerEntry, activeTimerLiveTime]);

    // Data Migration: Handle old format (ChecklistItem[]) and convert to new format (ChecklistSection[])
    const normalizedSections: (ChecklistSection | RichTextBlock)[] = React.useMemo(() => {
        if (!sections || sections.length === 0) {
            return [];
        }
        // Check if the first element is a ChecklistItem (old format)
        if ('isCompleted' in sections[0]) {
            return [{ id: 1, title: 'Checklist', items: sections as ChecklistItem[] }];
        }
        return sections as (ChecklistSection | RichTextBlock)[];
    }, [sections]);

    const {
        history, setHistory,
        historyIndex, setHistoryIndex,
        newItemTexts, setNewItemTexts,
        editingSectionId, setEditingSectionId,
        editingSectionTitle, setEditingSectionTitle,
        editingItemId, setEditingItemId,
        editingItemText, setEditingItemText,
        editingResponseForItemId, setEditingResponseForItemId,
        editingNoteForItemId, setEditingNoteForItemId,
        editingContentBlockId, setEditingContentBlockId,
        focusSubInputKey, setFocusSubInputKey,
        focusEditorKey, setFocusEditorKey,
        hiddenNotesSections, setHiddenNotesSections,
        hiddenResponsesSections, setHiddenResponsesSections,
        checklistSortKey, setChecklistSortKey,
        confirmingDeleteSectionNotes, setConfirmingDeleteSectionNotes,
        confirmingDeleteSectionResponses, setConfirmingDeleteSectionResponses,
        confirmingDeleteNotes, setConfirmingDeleteNotes,
        confirmingDeleteAllSections, setConfirmingDeleteAllSections,
        confirmingDeleteResponses, setConfirmingDeleteResponses,
        confirmingDeleteSectionId, setConfirmingDeleteSectionId,
        confirmingDeleteChecked, setConfirmingDeleteChecked,
        bulkAddChecklistText, setBulkAddChecklistText,
        isSaveTemplatePromptOpen, setIsSaveTemplatePromptOpen,
        templateSectionsToSave, setTemplateSectionsToSave,
        isManageTemplatesOpen, setIsManageTemplatesOpen,
        subInputRefs, confirmTimeoutRef, addItemInputRef, isUndoingRedoing, historyRef, editingItemInputRef,
        updateHistory,
    } = useChecklistState({ normalizedSections, taskId });

    const {
        handleAddItem,
        handleToggleItem,
        handleUpdateItemText,
        handleUpdateItemResponse,
        handleUpdateItemNote,
        handleDeleteItemResponse,
        handleDeleteItemNote,
        handleUpdateItemDueDate,
        handleUpdateItemDueDateFromPicker,
        handleDeleteItem,
        handleDuplicateChecklistItem,
    } = useChecklistItemManagement({
        history, historyIndex, newItemTexts, isUndoingRedoing, addItemInputRef,
        setNewItemTexts, updateHistory, onUpdate, onComplete, showToast, setEditingItemId, setEditingItemText, 
        setInboxMessages, tasks
    });

    const {
        sortedSections,
        handleSortChange,
        moveSection,
        handleMoveBlock,
        handlePromoteItemToHeader,
        handleIndent,
        handleOutdent,
        handleIndentChecked,
        handleTabOnChecklistItem,
    } = useChecklistHierarchy({
        history,
        historyIndex,
        checklistSortKey,
        isUndoingRedoing,
        setChecklistSortKey,
        updateHistory,
        onUpdate,
        showToast,
    });

    const {
        handleAddRichTextBlock,
        handleUpdateRichTextBlockContent,
        handleDeleteRichTextBlock,
        handleAssociateBlock,
        handleCopyBlock,
        handleCopyBlockRaw,
        handleDetachFromBlock,
    } = useChecklistBlockManagement({
        history,
        historyIndex,
        updateHistory,
        getNextChecklistId,
        onUpdate,
        showToast,
        setEditingContentBlockId,
    });

    const {
        handleAddSection, handleUpdateSectionTitle, handleDuplicateSection, handleDeleteSection, handleDeleteAllSections,
        handleCompleteAllInSection, handleToggleAllSections, handleToggleSectionCollapse, handleCollapseAllSections,
        handleExpandAllSections, handleAddNotes, handleAddResponses, handleDeleteAllNotes, handleDeleteAllResponses,
        handleDeleteAllSectionNotes, handleDeleteAllSectionResponses, handleToggleSectionNotes, handleToggleSectionResponses
    } = useChecklistSectionManagement({
        history, historyIndex, isUndoingRedoing, confirmingDeleteAllSections, confirmTimeoutRef, historyRef, settings,
        updateHistory, onUpdate, onComplete, showToast, onSettingsChange, setInboxMessages, tasks,
        setEditingSectionId, setEditingSectionTitle, setConfirmingDeleteSectionId, setConfirmingDeleteAllSections,
        setHiddenNotesSections, setHiddenResponsesSections
    });

    const {
        handleSendAllItemsToTimer,
        handleSendSectionToTimer,
        handleSendToTimer,
    } = useChecklistTimer({
        history, historyIndex, task, taskId, showToast, updateHistory, onUpdate, onTaskUpdate,
        handleGlobalToggleTimer, handlePrimeTaskWithNewLog
    });

    const { handleUndo, handleRedo } = useChecklistHistory({
        history, historyIndex, isUndoingRedoing, checklistRef,
        setHistory, setHistoryIndex, onUpdate
    });

    const {
        handleBulkAddChecklist, handleLoadChecklistTemplate, handleDeleteChecked,
        handleSaveChecklistTemplate, handleGlobalChecklistCommand
    } = useChecklistGlobalActions({
        history, historyIndex, settings, bulkAddChecklistText, templateSectionsToSave, confirmingDeleteChecked, confirmTimeoutRef, getNextChecklistId,
        updateHistory, onUpdate, onSettingsChange, showToast,
        setBulkAddChecklistText, setTemplateSectionsToSave, setIsSaveTemplatePromptOpen,
        setConfirmingDeleteChecked, setConfirmingDeleteSectionId, setConfirmingDeleteNotes, setConfirmingDeleteResponses,
        setConfirmingDeleteSectionNotes, setConfirmingDeleteSectionResponses, setConfirmingDeleteAllSections,
        handleExpandAllSections, handleCollapseAllSections, handleAddNotes, handleAddResponses,
        handleDeleteAllNotes, handleDeleteAllResponses, handleDeleteAllSections, handleSendAllItemsToTimer
    });
    
    const handleSectionCommand = useCallback((payload: { command: string, sectionId?: number, blockId?: number }) => {
        const { command, sectionId } = payload;
        if (!sectionId) {
            handleGlobalChecklistCommand(payload);
            return;
        }
        switch (command) {
            case 'move_section_up': onUpdate(moveSection(history[historyIndex], sectionId, 'up')); break;
            case 'move_section_down': onUpdate(moveSection(history[historyIndex], sectionId, 'down')); break;
            case 'edit_title': { const section = history[historyIndex].find(s => 'items' in s && s.id === sectionId) as (ChecklistSection | undefined); if (section) { setEditingSectionId(section.id); setEditingSectionTitle(section.title); } break; }
            case 'toggle_all_in_section': handleCompleteAllInSection(sectionId); break;
            case 'toggle_collapse': handleToggleSectionCollapse(sectionId); break;
            case 'add_note_to_section': handleAddNotes(sectionId); break;
            case 'add_response_to_section': handleAddResponses(sectionId); break;
            case 'toggle_section_notes': handleToggleSectionNotes(sectionId); break;
            case 'toggle_section_responses': handleToggleSectionResponses(sectionId); break;
            case 'duplicate_section': handleDuplicateSection(sectionId); break;
            case 'delete_section': handleDeleteSection(sectionId); break;
        }
    }, [history, historyIndex, onUpdate, moveSection, setEditingSectionId, setEditingSectionTitle, handleCompleteAllInSection, handleToggleSectionCollapse, handleAddNotes, handleAddResponses, handleToggleSectionNotes, handleToggleSectionResponses, handleDuplicateSection, handleDeleteSection, handleGlobalChecklistCommand]);

    const handleItemCommand = useCallback((payload: { command: string, sectionId: number, itemId: number, color?: string }) => {
        const { command, sectionId, itemId, color } = payload;
        const currentSections = history[historyIndex];
        const section = currentSections.find(s => 'items' in s && s.id === sectionId) as (ChecklistSection | undefined);
        if (!section) return;

        const itemIndex = section.items.findIndex(item => item.id === itemId);
        if (itemIndex === -1 && !['edit', 'edit_response', 'edit_note'].includes(command)) return;

        let newItems = [...section.items];
        let newSections = [...currentSections];

        switch (command) {
            case 'toggle_complete': handleToggleItem(sectionId, itemId); return;
            case 'delete': handleDeleteItem(sectionId, itemId); return;
            case 'copy': navigator.clipboard.writeText(section.items.find(i => i.id === itemId)?.text || ''); showToast('Checklist item copied!'); return;
            case 'duplicate': handleDuplicateChecklistItem(sectionId, itemId); return;
            case 'add_before': newItems.splice(itemIndex, 0, { id: Date.now() + Math.random(), text: 'New Item', isCompleted: false, level: section.items[itemIndex].level, parentId: section.items[itemIndex].parentId }); break;
            case 'add_after': newItems.splice(itemIndex + 1, 0, { id: Date.now() + Math.random(), text: 'New Item', isCompleted: false, level: section.items[itemIndex].level, parentId: section.items[itemIndex].parentId }); break;
            case 'indent': newSections = indentChecklistItem(currentSections, sectionId, itemId); break;
            case 'outdent': newSections = outdentChecklistItem(currentSections, sectionId, itemId); break;
            case 'move_up': newSections = moveChecklistItemAndChildren(currentSections, sectionId, itemId, 'up'); break;
            case 'move_down': newSections = moveChecklistItemAndChildren(currentSections, sectionId, itemId, 'down'); break;
            case 'highlight': newSections = newSections.map(s => 'items' in s && s.id === sectionId ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, highlightColor: color } : i) } : s); break;
            case 'delete_note': handleDeleteItemNote(sectionId, itemId); return;
            case 'delete_response': handleDeleteItemResponse(sectionId, itemId); return;
            case 'promote_to_header': handlePromoteItemToHeader(sectionId, itemId); return;
        }

        if (command === 'open_link') { return; }

        if (!['highlight', 'move_up', 'move_down', 'indent', 'outdent'].includes(command)) { newSections = newSections.map(s => 'items' in s && s.id === sectionId ? { ...s, items: newItems } : s); }
        updateHistory(newSections);
    }, [history, historyIndex, handleToggleItem, handleDeleteItem, showToast, handleDuplicateChecklistItem, updateHistory, handleDeleteItemNote, handleDeleteItemResponse, handlePromoteItemToHeader]);

    // Expose undo/redo functions via the passed-in ref
    if (checklistRef) {
        checklistRef.current = {
            handleUndo,
            handleRedo,
            handleGlobalChecklistCommand,
            handleSectionCommand,
            handleItemCommand,
            resetHistory: (sections: (ChecklistSection | RichTextBlock)[]) => {
                isUndoingRedoing.current = true;
                setHistory([sections]);
                setHistoryIndex(0);
                setTimeout(() => isUndoingRedoing.current = false, 0);
            },
        };
    }

    useChecklistIPC({
        history, historyIndex, tasks, settings, taskId, onUpdate, onSettingsChange, showToast, updateHistory, handleItemCommand,
        handleToggleItem,
        handleDeleteItem,
        handleDuplicateChecklistItem,
        handleUpdateItemResponse,
        handleUpdateItemNote,
        handleDeleteItemNote,
        handleDeleteItemResponse,
        handleSendToTimer,
        handlePromoteItemToHeader,
        moveSection,
        handleUndo,
        handleRedo,
        handleCompleteAllInSection,
        handleToggleSectionCollapse,
        handleAddNotes,
        handleAddResponses,
        handleToggleSectionNotes,
        handleToggleSectionResponses,
        handleDuplicateSection,
        handleDeleteSection,
        handleSendSectionToTimer,
        handleAssociateBlock,
        handleDetachFromBlock,
        handleGlobalChecklistCommand,
        setEditingItemId,
        setEditingItemText,
        setEditingResponseForItemId,
        setEditingNoteForItemId,
        setEditingSectionId,
        setEditingSectionTitle,
        setTemplateSectionsToSave,
        setIsSaveTemplatePromptOpen,
    });
    // This ref needs to be kept in sync manually for now.
    // In a later refactor, we can see if this can be moved into the state hook as well.
    useEffect(() => {
        historyRef.current = history;
    }, [history]);

    useEffect(() => {
        // This effect now specifically focuses the input whose key is stored in `focusSubInputKey`.
        if (isEditable && focusSubInputKey && subInputRefs.current[focusSubInputKey]) {
            subInputRefs.current[focusSubInputKey].focus();
            // Reset the focus request after it's been handled.
            setFocusSubInputKey(null);
        }
    }, [isEditable, normalizedSections, focusSubInputKey]);

    useEffect(() => {
        if (focusItemId && editingItemId === focusItemId && editingItemInputRef.current) {
            editingItemInputRef.current.focus();
            // Once focused, notify the parent to clear the focus request
            onFocusHandled();
        }
    }, [editingItemId, focusItemId, onFocusHandled]);

    return {
        newItemTexts, setNewItemTexts,
        editingSectionId, setEditingSectionId,
        editingSectionTitle, setEditingSectionTitle,
        editingItemId, setEditingItemId,
        editingItemText, setEditingItemText,
        editingResponseForItemId, setEditingResponseForItemId,
        editingNoteForItemId, setEditingNoteForItemId,
        editingContentBlockId, 
        setEditingContentBlockId,
        focusEditorKey,
        setFocusEditorKey,
        focusSubInputKey, setFocusSubInputKey,
        subInputRefs,
        hiddenNotesSections, setHiddenNotesSections,
        hiddenResponsesSections, setHiddenResponsesSections,
        confirmingDeleteSectionNotes, setConfirmingDeleteSectionNotes,
        confirmingDeleteSectionResponses, setConfirmingDeleteSectionResponses,
        confirmingDeleteNotes, setConfirmingDeleteNotes,
        confirmingDeleteAllSections, setConfirmingDeleteAllSections,
        confirmingDeleteResponses, setConfirmingDeleteResponses,
        confirmingDeleteSectionId, setConfirmingDeleteSectionId,
        confirmingDeleteChecked, setConfirmingDeleteChecked,
        confirmTimeoutRef,
        addItemInputRef,
        bulkAddChecklistText, setBulkAddChecklistText,
        isSaveTemplatePromptOpen, setIsSaveTemplatePromptOpen,
        templateSectionsToSave, setTemplateSectionsToSave,
        isManageTemplatesOpen, setIsManageTemplatesOpen,
        history, historyIndex,
        editingItemInputRef,
        timeLogDurations,
        handleSendAllItemsToTimer,
        handleSendSectionToTimer,
        handleSendToTimer,
        handleToggleSectionNotes,
        handleToggleSectionResponses,
        handleUpdateItemText,
        handleUpdateItemResponse,
        handleUpdateItemNote,
        handleDeleteItemResponse,
        handleDeleteItemNote,
        handleUpdateItemDueDate,
        handleUpdateItemDueDateFromPicker,
        handleAddSection,
        handleAddRichTextBlock,
        handleCopyBlock,
        handleCopyBlockRaw,
        handleMoveBlock,
        handleUpdateRichTextBlockContent,
        handleDeleteRichTextBlock,
        handleUpdateSectionTitle,
        handleDuplicateSection,
        handleDeleteSection,
        handleDeleteAllSections,
        handleBulkAddChecklist,
        handleLoadChecklistTemplate,
        handleSaveChecklistTemplate,
        handleAddItem,
        handleToggleItem,
        moveSection,
        handleCompleteAllInSection,
        handleToggleAllSections,
        handleDeleteChecked,
        handleDeleteItem,
        handleUndo,
        handleRedo,
        handleIndent,
        handleOutdent,
        sortedSections,
        handleSortChange,
        handleTabOnChecklistItem,
        handleIndentChecked,
        handlePromoteItemToHeader,
        handleToggleSectionCollapse,
        handleCollapseAllSections,
        handleExpandAllSections,
        handleAddNotes,
        handleAddResponses,
        handleDeleteAllResponses,
        handleDeleteAllNotes,
        handleDeleteAllSectionResponses,
        handleDeleteAllSectionNotes,
        handleDuplicateChecklistItem,
        handleItemCommand,
        handleGlobalChecklistCommand,
        updateHistory, // Expose for the IPC hook
    };
};