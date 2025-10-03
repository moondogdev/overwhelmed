import { useEffect, useCallback } from 'react';
import { ChecklistItem, ChecklistSection, Settings } from '../types';
import { extractUrlFromText, formatChecklistForCopy } from '../utils';

interface UseChecklistIPCHandlers {
    history: ChecklistSection[][];
    historyIndex: number;
    isEditable: boolean;
    settings: Settings;
    wordId: number;
    onUpdate: (newSections: ChecklistSection[]) => void;
    onComplete: (item: ChecklistItem, sectionId: number, updatedSections: ChecklistSection[]) => void;
    showToast: (message: string) => void;
    onSettingsChange: (update: Partial<Settings> | ((prevSettings: Settings) => Partial<Settings>)) => void;
    updateHistory: (newSections: ChecklistSection[]) => void;
    handleDuplicateChecklistItem: (sectionId: number, itemId: number) => void;
    setEditingItemId: (id: number | null) => void;
    setEditingItemText: (text: string) => void;
    handleUpdateItemResponse: (sectionId: number, itemId: number, newResponse: string) => void;
    setEditingResponseForItemId: (id: number | null) => void;
    handleUpdateItemNote: (sectionId: number, itemId: number, newNote: string) => void;
    setEditingNoteForItemId: (id: number | null) => void;
    handleSendToTimer: (item: ChecklistItem, startImmediately: boolean) => void;
    moveSection: (sections: ChecklistSection[], sectionId: number, direction: 'up' | 'down') => ChecklistSection[];
    handleUndo: () => void;
    handleRedo: () => void;
    setEditingSectionId: (id: number | null) => void;
    setEditingSectionTitle: (title: string) => void;
    handleCompleteAllInSection: (sectionId: number) => void;
    handleToggleSectionCollapse: (sectionId: number) => void;
    handleAddNotes: (sectionId?: number) => void;
    handleAddResponses: (sectionId?: number) => void;
    handleToggleSectionNotes: (sectionId: number) => void;
    handleToggleSectionResponses: (sectionId: number) => void;
    handleDuplicateSection: (sectionId: number) => void;
    handleDeleteSection: (sectionId: number) => void;
    handleSendSectionToTimer: (section: ChecklistSection, startImmediately: boolean) => void;
    setTemplateSectionsToSave: (sections: ChecklistSection[] | null) => void;
    setIsSaveTemplatePromptOpen: (isOpen: boolean) => void;
    handleGlobalChecklistCommand: (payload: { command: string }) => void;
    words: any[]; // Simplified for this hook, as it's only used for a lookup
}

/**
 * This hook is responsible for setting up all Inter-Process Communication (IPC) listeners
 * for the checklist feature. It translates commands from the main process (e.g., from
 * context menus) into calls to the core handler functions.
 */
export const useChecklistIPC = (handlers: UseChecklistIPCHandlers) => {
    const {
        history, historyIndex, isEditable, settings, wordId,
        onUpdate, onComplete, showToast, onSettingsChange, updateHistory,
        handleDuplicateChecklistItem, setEditingItemId, setEditingItemText,
        handleUpdateItemResponse, setEditingResponseForItemId, handleUpdateItemNote,
        setEditingNoteForItemId, handleSendToTimer, moveSection, handleUndo, handleRedo,
        setEditingSectionId, setEditingSectionTitle, handleCompleteAllInSection,
        handleToggleSectionCollapse, handleAddNotes, handleAddResponses,
        handleToggleSectionNotes, handleToggleSectionResponses, handleDuplicateSection,
        handleDeleteSection, handleSendSectionToTimer, setTemplateSectionsToSave,
        setIsSaveTemplatePromptOpen, handleGlobalChecklistCommand, words
    } = handlers;

    useEffect(() => {
        const handleChecklistCommand = (payload: { command: string, sectionId: number, itemId: number, color?: string }) => {
            const { command, sectionId, itemId, color } = payload;
            const currentSections = history[historyIndex];
            const section = currentSections.find(s => s.id === sectionId);
            if (!section) return;

            const itemIndex = section.items.findIndex(item => item.id === itemId);
            if (itemIndex === -1) return;

            let newItems = [...section.items];
            let newSections = [...currentSections];

            switch (command) {
                case 'toggle_complete': {
                    let toggledItem: ChecklistItem | null = null;
                    newItems = newItems.map(item => {
                        if (item.id !== itemId) return item;
                        const isNowCompleted = !item.isCompleted;
                        if (isNowCompleted) toggledItem = item;
                        return { ...item, isCompleted: isNowCompleted };
                    });
                    if (toggledItem) onComplete(toggledItem, sectionId, [{ ...section, items: newItems }]);
                    break;
                }
                case 'delete':
                    newItems.splice(itemIndex, 1);
                    break;
                case 'copy':
                    navigator.clipboard.writeText(newItems[itemIndex].text);
                    showToast('Checklist item copied!');
                    return; // No state update needed
                case 'duplicate': {
                    handleDuplicateChecklistItem(sectionId, itemId);
                    break;
                }
                case 'add_before':
                    newItems.splice(itemIndex, 0, { id: Date.now() + Math.random(), text: 'New Item', isCompleted: false });
                    break;
                case 'add_after':
                    newItems.splice(itemIndex + 1, 0, { id: Date.now() + Math.random(), text: 'New Item', isCompleted: false });
                    break;
                case 'move_up':
                    if (itemIndex > 0) {
                        [newItems[itemIndex - 1], newItems[itemIndex]] = [newItems[itemIndex], newItems[itemIndex - 1]];
                    }
                    break;
                case 'move_down':
                    if (itemIndex < newItems.length - 1) {
                        [newItems[itemIndex], newItems[itemIndex + 1]] = [newItems[itemIndex + 1], newItems[itemIndex]];
                    }
                    break;
                case 'highlight':
                    newSections = newSections.map(s =>
                        s.id === sectionId
                            ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, highlightColor: color } : i) }
                            : s
                    );
                    break;
                case 'delete_note':
                case 'delete_response': {
                    const fieldToClear = command === 'delete_note' ? 'note' : 'response';
                    newSections = newSections.map(s => s.id === sectionId ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, [fieldToClear]: undefined } : i) } : s);
                    showToast(`${fieldToClear.charAt(0).toUpperCase() + fieldToClear.slice(1)} deleted.`);
                    break;
                }
            }
            if (command === 'open_link') {
                const item = section.items.find(i => i.id === itemId);
                if (item) {
                    const url = extractUrlFromText(item.text);
                    if (url) window.electronAPI.openExternalLink({ url, browserPath: settings.browsers[settings.activeBrowserIndex]?.path });
                }
                return; // No state update needed
            } else if (command === 'copy_link') {
                const item = section.items.find(i => i.id === itemId);
                if (item) {
                    const url = extractUrlFromText(item.text);
                    if (url) {
                        navigator.clipboard.writeText(url);
                        showToast('Link copied!');
                    }
                }
                return; // No state update needed
            } else if (command === 'copy_note') {
                const item = section.items.find(i => i.id === itemId);
                if (item?.note) {
                    navigator.clipboard.writeText(item.note);
                    showToast('Note copied!');
                }
                return; // No state update needed
            } else if (command === 'open_note_link' || command === 'copy_note_link') {
                const item = section.items.find(i => i.id === itemId);
                if (item?.note) {
                    const url = extractUrlFromText(item.note);
                    if (url) {
                        if (command === 'open_note_link') window.electronAPI.openExternalLink({ url, browserPath: settings.browsers[settings.activeBrowserIndex]?.path });
                        else { navigator.clipboard.writeText(url); showToast('Link copied from note!'); }
                    }
                }
                return; // No state update needed
            } else if (command === 'copy_response') {
                const item = section.items.find(i => i.id === itemId);
                if (item?.response) {
                    navigator.clipboard.writeText(item.response);
                    showToast('Response copied!');
                }
                return; // No state update needed
            } else if (command === 'open_response_link' || command === 'copy_response_link') {
                const item = section.items.find(i => i.id === itemId);
                if (item?.response) {
                    const url = extractUrlFromText(item.response);
                    if (url) {
                        if (command === 'open_response_link') window.electronAPI.openExternalLink({ url, browserPath: settings.browsers[settings.activeBrowserIndex]?.path });
                        else { navigator.clipboard.writeText(url); showToast('Link copied from response!'); }
                    }
                }
                return; // No state update needed
            }

            if (!['highlight', 'delete_note', 'delete_response'].includes(command)) {
                newSections = newSections.map(s => s.id === sectionId ? { ...s, items: newItems } : s);
            }

            updateHistory(newSections); // This is the key: update local history
            onUpdate(newSections); // AND call the parent update function

            if (payload.command === 'edit') {
                const section = history[historyIndex].find(s => s.id === payload.sectionId);
                const item = section?.items.find(i => i.id === payload.itemId);
                if (item) {
                    setEditingItemId(item.id);
                    setEditingItemText(item.text);
                }
            } else if (payload.command === 'edit_response') {
                const section = history[historyIndex].find(s => s.id === payload.sectionId);
                const item = section?.items.find(i => i.id === payload.itemId);
                if (item) {
                    if (item.response === undefined) handleUpdateItemResponse(payload.sectionId, payload.itemId, '');
                    setEditingResponseForItemId(payload.itemId);
                }
            } else if (payload.command === 'edit_note') {
                const section = history[historyIndex].find(s => s.id === payload.sectionId);
                const item = section?.items.find(i => i.id === payload.itemId);
                if (item) {
                    if (item.note === undefined) handleUpdateItemNote(payload.sectionId, payload.itemId, '');
                    setEditingNoteForItemId(payload.itemId);
                }
            } else if (command === 'send_to_timer') {
                const item = section.items.find(i => i.id === itemId);
                if (item) handleSendToTimer(item, false);
            } else if (command === 'send_to_timer_and_start') {
                const item = section.items.find(i => i.id === itemId);
                if (item) handleSendToTimer(item, true);
            } else if (command === 'view' && wordId) {
                onSettingsChange({ activeTaskTabs: { ...settings.activeTaskTabs, [wordId]: 'ticket' } });
                if (!settings.openAccordionIds.includes(wordId)) onSettingsChange({ openAccordionIds: [...new Set([...settings.openAccordionIds, wordId])] });
            }
        };
        const handleSectionCommand = (payload: { command: string, sectionId?: number }) => {
            const { command, sectionId } = payload;
            if (!sectionId) return;

            switch (command) {
                case 'move_section_up': onUpdate(moveSection(history[historyIndex], sectionId, 'up')); break;
                case 'move_section_down': onUpdate(moveSection(history[historyIndex], sectionId, 'down')); break;
                case 'undo_checklist': handleUndo(); break;
                case 'redo_checklist': handleRedo(); break;
                case 'edit_title': {
                    const section = history[historyIndex].find(s => s.id === sectionId);
                    if (section) { setEditingSectionId(section.id); setEditingSectionTitle(section.title); }
                    break;
                }
                case 'toggle_all_in_section': handleCompleteAllInSection(sectionId); break;
                case 'toggle_collapse': handleToggleSectionCollapse(sectionId); break;
                case 'add_note_to_section': handleAddNotes(sectionId); break;
                case 'add_response_to_section': handleAddResponses(sectionId); break;
                case 'toggle_section_notes': handleToggleSectionNotes(sectionId); break;
                case 'toggle_section_responses': handleToggleSectionResponses(sectionId); break;
                case 'copy_section': {
                    const sectionToCopy = history[historyIndex].find(s => s.id === sectionId);
                    if (sectionToCopy) { const textToCopy = formatChecklistForCopy([sectionToCopy]); navigator.clipboard.writeText(textToCopy); showToast('Section copied to clipboard!'); }
                    break;
                }
                case 'copy_section_raw': {
                    const sectionToCopy = history[historyIndex].find(s => s.id === sectionId);
                    if (sectionToCopy) { const header = `### ${sectionToCopy.title}`; const itemsText = sectionToCopy.items.map(item => item.text).join('\n'); const textToCopy = `${header}\n${itemsText}`; navigator.clipboard.writeText(textToCopy); showToast('Section raw content copied!'); }
                    break;
                }
                case 'clear_all_highlights': {
                    if (sectionId) { const newSections = history[historyIndex].map(sec => sec.id === sectionId ? { ...sec, items: sec.items.map(item => ({ ...item, highlightColor: undefined } as ChecklistItem)) } : sec); updateHistory(newSections); onUpdate(newSections); showToast('Highlights cleared for section.'); }
                    break;
                }
                case 'duplicate_section': handleDuplicateSection(sectionId); break;
                case 'delete_section': handleDeleteSection(sectionId); break;
                case 'send_section_to_timer': { const section = history[historyIndex].find(s => s.id === sectionId); if (section) handleSendSectionToTimer(section, false); break; }
                case 'send_section_to_timer_and_start': { const section = history[historyIndex].find(s => s.id === sectionId); if (section) handleSendSectionToTimer(section, true); break; }
                case 'save_section_as_template': { const sectionToSave = history[historyIndex].find(s => s.id === sectionId); if (sectionToSave) setTemplateSectionsToSave([sectionToSave]); setIsSaveTemplatePromptOpen(true); break; }
            }
        };

        const handleMainHeaderCommand = (payload: { command: string, wordId?: number }) => {
            if (payload.command === 'view' && payload.wordId) {
                onSettingsChange({ activeTaskTabs: { ...settings.activeTaskTabs, [payload.wordId]: 'ticket' } });
                if (!settings.openAccordionIds.includes(payload.wordId)) { onSettingsChange({ openAccordionIds: [...new Set([...settings.openAccordionIds, payload.wordId])] }); }
            } else if (payload.command === 'edit' && payload.wordId) {
                const targetWord = words.find(w => w.id === payload.wordId);
                if (targetWord && !targetWord.completedDuration) { onSettingsChange({ activeTaskTabs: { ...settings.activeTaskTabs, [payload.wordId]: 'edit' }, openAccordionIds: [...new Set([...settings.openAccordionIds, payload.wordId])] }); }
            } else {
                handleGlobalChecklistCommand(payload);
            }
        };

        const cleanup = window.electronAPI.on('checklist-item-command', handleChecklistCommand);
        const cleanupSection = window.electronAPI.on('checklist-section-command', (payload) => { payload.sectionId ? handleSectionCommand(payload) : handleGlobalChecklistCommand(payload) });
        const cleanupMainHeader = window.electronAPI.on('checklist-main-header-command', handleMainHeaderCommand);

        return () => {
            cleanup?.();
            cleanupSection?.();
            cleanupMainHeader?.();
        };
    }, [history, historyIndex, onUpdate, onComplete, words, settings, onSettingsChange, showToast, handleAddNotes, handleAddResponses, handleToggleSectionCollapse, handleDeleteSection, handleDuplicateSection, handleUndo, handleRedo, handleGlobalChecklistCommand, handleSendToTimer, handleSendSectionToTimer, handleCompleteAllInSection, handleUpdateItemResponse, handleUpdateItemNote, handleDuplicateChecklistItem, setEditingItemId, setEditingItemText, setEditingResponseForItemId, setEditingNoteForItemId, setEditingSectionId, setEditingSectionTitle, moveSection, isEditable]);
};