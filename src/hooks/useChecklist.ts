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
    setInboxMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
    task: Task;
    taskId: number;
    onTaskUpdate: (updatedTask: Task) => void;
    checklistRef?: React.MutableRefObject<{ handleUndo: () => void; handleRedo: () => void; resetHistory: (sections: ChecklistSection[]) => void; }>;
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
        onUpdate,
        showToast,
        setEditingContentBlockId,
    });

    const {
        handleAddSection, handleUpdateSectionTitle, handleDuplicateSection, handleDeleteSection, handleDeleteAllSections,
        handleCompleteAllInSection, handleToggleAllSections, handleToggleSectionCollapse, handleCollapseAllSections,
        handleExpandAllSections, handleAddNotes, handleAddResponses, handleDeleteAllNotes, handleDeleteAllResponses,
        handleDeleteAllSectionNotes, handleDeleteAllSectionResponses, handleToggleSectionNotes, handleToggleSectionResponses,
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
        history, historyIndex, settings, bulkAddChecklistText, templateSectionsToSave, confirmingDeleteChecked, confirmTimeoutRef,
        updateHistory, onUpdate, onSettingsChange, showToast,
        setBulkAddChecklistText, setTemplateSectionsToSave, setIsSaveTemplatePromptOpen,
        setConfirmingDeleteChecked, setConfirmingDeleteSectionId, setConfirmingDeleteNotes, setConfirmingDeleteResponses,
        setConfirmingDeleteSectionNotes, setConfirmingDeleteSectionResponses, setConfirmingDeleteAllSections,
        handleExpandAllSections, handleCollapseAllSections, handleAddNotes, handleAddResponses,
        handleDeleteAllNotes, handleDeleteAllResponses, handleDeleteAllSections, handleSendAllItemsToTimer
    });

    // Expose undo/redo functions via the passed-in ref
    if (checklistRef) {
        checklistRef.current = {
            handleUndo,
            handleRedo,
            resetHistory: (sections: (ChecklistSection | RichTextBlock)[]) => {
                isUndoingRedoing.current = true;
                setHistory([sections]);
                setHistoryIndex(0);
                setTimeout(() => isUndoingRedoing.current = false, 0);
            },
        };
    }

    useChecklistIPC({
        history, historyIndex, tasks, settings, taskId, onUpdate, onSettingsChange, showToast, updateHistory,
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
        handleGlobalChecklistCommand,
        updateHistory, // Expose for the IPC hook
    };
};