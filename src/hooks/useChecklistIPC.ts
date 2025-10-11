import { useEffect, useCallback } from 'react';
import { ChecklistItem, ChecklistSection, RichTextBlock, Settings, Task } from '../types';
import { formatChecklistForCopy, moveChecklistItemAndChildren, indentChecklistItem, outdentChecklistItem, formatChecklistItemsForRawCopy } from '../utils';

interface UseChecklistIPCHandlers {
    history: (ChecklistSection | RichTextBlock)[][];
    historyIndex: number;
    tasks: Task[];
    settings: Settings;
    taskId: number;
    onUpdate: (newSections: (ChecklistSection | RichTextBlock)[]) => void;
    onSettingsChange: (update: Partial<Settings> | ((prevSettings: Settings) => Partial<Settings>)) => void;
    showToast: (message: string) => void;
    updateHistory: (newSections: (ChecklistSection | RichTextBlock)[]) => void;
    // Item Handlers
    handleToggleItem: (sectionId: number, itemId: number) => void;
    handleDeleteItem: (sectionId: number, itemId: number) => void;
    handleDuplicateChecklistItem: (sectionId: number, itemId: number) => void;
    handleUpdateItemResponse: (sectionId: number, itemId: number, newResponse: string) => void;
    handleUpdateItemNote: (sectionId: number, itemId: number, newNote: string) => void;
    handleDeleteItemNote: (sectionId: number, itemId: number) => void;
    handleDeleteItemResponse: (sectionId: number, itemId: number) => void;
    handleSendToTimer: (item: ChecklistItem, startImmediately: boolean) => void;
    // Hierarchy Handlers
    handlePromoteItemToHeader: (sectionId: number, itemId: number) => void;
    // Section Handlers
    moveSection: (sections: (ChecklistSection | RichTextBlock)[], sectionId: number, direction: 'up' | 'down') => (ChecklistSection | RichTextBlock)[];
    handleUndo: () => void;
    handleRedo: () => void;
    handleCompleteAllInSection: (sectionId: number) => void;
    handleToggleSectionCollapse: (sectionId: number) => void;
    handleAddNotes: (sectionId?: number) => void;
    handleAddResponses: (sectionId?: number) => void;
    handleToggleSectionNotes: (sectionId: number) => void;
    handleToggleSectionResponses: (sectionId: number) => void;
    handleDuplicateSection: (sectionId: number) => void;
    handleDeleteSection: (sectionId: number) => void;
    handleSendSectionToTimer: (section: ChecklistSection, startImmediately: boolean) => void;
    // Block Handlers
    handleAssociateBlock: (sectionId: number, blockId: number) => void;
    handleDetachFromBlock: (sectionId: number) => void;
    // Global Handlers
    handleGlobalChecklistCommand: (payload: { command: string }) => void;
    handleItemCommand: (payload: { command: string; sectionId: number; itemId: number; color?: string; }) => void;
    // State Setters for Editing
    setEditingItemId: (id: number | null) => void;
    setEditingItemText: (text: string) => void;
    setEditingResponseForItemId: (id: number | null) => void;
    setEditingNoteForItemId: (id: number | null) => void;
    setEditingSectionId: (id: number | null) => void;
    setEditingSectionTitle: (title: string) => void;
    setTemplateSectionsToSave: (sections: ChecklistSection[] | null) => void;
    setIsSaveTemplatePromptOpen: (isOpen: boolean) => void;
}

export const useChecklistIPC = (props: UseChecklistIPCHandlers) => {
    const { history, historyIndex, tasks, settings, taskId, onUpdate, onSettingsChange, showToast, updateHistory, ...handlers } = props;

    useEffect(() => {
        const handleChecklistCommand = (payload: { command: string, sectionId: number, itemId: number, color?: string }) => {
            handlers.handleItemCommand(payload);

            const { command, sectionId, itemId } = payload;
            const currentSections = history[historyIndex];
            const section = currentSections.find(s => 'items' in s && s.id === sectionId) as (ChecklistSection | undefined);

            if (payload.command === 'edit') {
                const item = section?.items.find(i => i.id === payload.itemId);
                if (item) { handlers.setEditingItemId(item.id); handlers.setEditingItemText(item.text); }
            } else if (payload.command === 'edit_response') {
                const item = section?.items.find(i => i.id === payload.itemId);
                if (item) { if (item.response === undefined) handlers.handleUpdateItemResponse(payload.sectionId, payload.itemId, ''); handlers.setEditingResponseForItemId(payload.itemId); }
            } else if (payload.command === 'edit_note') {
                const item = section?.items.find(i => i.id === payload.itemId);
                if (item) { if (item.note === undefined) handlers.handleUpdateItemNote(payload.sectionId, payload.itemId, ''); handlers.setEditingNoteForItemId(payload.itemId); }
            } else if (command === 'send_to_timer') {
                const item = section.items.find(i => i.id === itemId);
                if (item) handlers.handleSendToTimer(item, false);
            } else if (command === 'send_to_timer_and_start') {
                const item = section.items.find(i => i.id === itemId);
                if (item) handlers.handleSendToTimer(item, true);
            } else if (command === 'view' && taskId) {
                onSettingsChange({ activeTaskTabs: { ...settings.activeTaskTabs, [taskId]: 'ticket' } });
                if (!settings.openAccordionIds.includes(taskId)) onSettingsChange({ openAccordionIds: [...new Set([...settings.openAccordionIds, taskId])] });
            }
        };

        const handleSectionCommand = (payload: { command: string, sectionId?: number, blockId?: number }) => {
            const { command, sectionId } = payload;
            if (!sectionId) {
                handlers.handleGlobalChecklistCommand(payload);
                return;
            }
            switch (command) {
                case 'move_section_up': onUpdate(handlers.moveSection(history[historyIndex], sectionId, 'up')); break;
                case 'move_section_down': onUpdate(handlers.moveSection(history[historyIndex], sectionId, 'down')); break;
                case 'undo_checklist': handlers.handleUndo(); break;
                case 'redo_checklist': handlers.handleRedo(); break;
                case 'edit_title': { const section = history[historyIndex].find(s => 'items' in s && s.id === sectionId) as (ChecklistSection | undefined); if (section) { handlers.setEditingSectionId(section.id); handlers.setEditingSectionTitle(section.title); } break; }
                case 'toggle_all_in_section': handlers.handleCompleteAllInSection(sectionId); break;
                case 'toggle_collapse': handlers.handleToggleSectionCollapse(sectionId); break;
                case 'add_note_to_section': handlers.handleAddNotes(sectionId); break;
                case 'add_response_to_section': handlers.handleAddResponses(sectionId); break;
                case 'toggle_section_notes': handlers.handleToggleSectionNotes(sectionId); break;
                case 'toggle_section_responses': handlers.handleToggleSectionResponses(sectionId); break;
                case 'copy_section': { const sectionToCopy = history[historyIndex].find(s => s.id === sectionId); if (sectionToCopy && 'items' in sectionToCopy) { const textToCopy = formatChecklistForCopy([sectionToCopy as ChecklistSection]); navigator.clipboard.writeText(textToCopy); showToast('Section copied to clipboard!'); } break; }
                case 'copy_section_raw': { const sectionToCopy = history[historyIndex].find(s => 'items' in s && s.id === sectionId) as (ChecklistSection | undefined); if (sectionToCopy) { const header = `### ${sectionToCopy.title}`; const itemsText = formatChecklistItemsForRawCopy(sectionToCopy.items); const textToCopy = `${header}\n${itemsText}`; navigator.clipboard.writeText(textToCopy); showToast('Section raw content copied!'); } break; }
                case 'clear_all_highlights': { const newSections = history[historyIndex].map(sec => 'items' in sec && sec.id === sectionId ? { ...sec, items: sec.items.map(item => ({ ...item, highlightColor: undefined } as ChecklistItem)) } : sec); updateHistory(newSections); onUpdate(newSections); showToast('Highlights cleared for section.'); break; }
                case 'duplicate_section': handlers.handleDuplicateSection(sectionId); break;
                case 'delete_section': handlers.handleDeleteSection(sectionId); break;
                case 'send_section_to_timer': { const section = history[historyIndex].find(s => 'items' in s && s.id === sectionId) as (ChecklistSection | undefined); if (section) handlers.handleSendSectionToTimer(section, false); break; }
                case 'send_section_to_timer_and_start': { const section = history[historyIndex].find(s => 'items' in s && s.id === sectionId) as (ChecklistSection | undefined); if (section) handlers.handleSendSectionToTimer(section, true); break; }
                case 'associate_with_block': handlers.handleAssociateBlock(payload.sectionId, payload.blockId); break;
                case 'detach_from_block': handlers.handleDetachFromBlock(sectionId); break;
                case 'save_section_as_template': { const sectionToSave = history[historyIndex].find(s => 'items' in s && s.id === sectionId) as (ChecklistSection | undefined); if (sectionToSave) { handlers.setTemplateSectionsToSave([sectionToSave]); handlers.setIsSaveTemplatePromptOpen(true); } break; }
            }
        };

        const handleMainHeaderCommand = (payload: { command: string, taskId?: number }) => {
            if (payload.command === 'view' && payload.taskId) { onSettingsChange({ activeTaskTabs: { ...settings.activeTaskTabs, [payload.taskId]: 'ticket' } }); if (!settings.openAccordionIds.includes(payload.taskId)) { onSettingsChange({ openAccordionIds: [...new Set([...settings.openAccordionIds, payload.taskId])] }); } }
            else if (payload.command === 'edit' && payload.taskId) { const targetTask = tasks.find(w => w.id === payload.taskId); if (targetTask && !targetTask.completedDuration) { onSettingsChange({ activeTaskTabs: { ...settings.activeTaskTabs, [payload.taskId]: 'edit' }, openAccordionIds: [...new Set([...settings.openAccordionIds, payload.taskId])] }); } }
            else { handlers.handleGlobalChecklistCommand(payload); }
        };

        const cleanupItem = window.electronAPI.on('checklist-item-command', handleChecklistCommand);
        const cleanupMainHeader = window.electronAPI.on('checklist-main-header-command', handleMainHeaderCommand);

        return () => { cleanupItem?.(); cleanupMainHeader?.(); };
    }, [history, historyIndex, onUpdate, tasks, settings, onSettingsChange, showToast, handlers, updateHistory, taskId]);
};