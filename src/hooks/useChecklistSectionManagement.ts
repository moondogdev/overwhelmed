import { useCallback } from 'react';
import { ChecklistSection, RichTextBlock, Task, InboxMessage, Settings, ChecklistItem } from '../types';

interface UseChecklistSectionManagementProps {
    history: (ChecklistSection | RichTextBlock)[][];
    historyIndex: number;
    isUndoingRedoing: React.MutableRefObject<boolean>;
    confirmingDeleteAllSections: boolean;
    confirmTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
    historyRef: React.MutableRefObject<(ChecklistSection | RichTextBlock)[][]>;
    settings: Settings;

    updateHistory: (newSections: (ChecklistSection | RichTextBlock)[]) => void;
    onUpdate: (newSections: (ChecklistSection | RichTextBlock)[]) => void;
    onComplete: (item: ChecklistItem, sectionId: number, updatedSections: ChecklistSection[]) => void;
    showToast: (message: string, duration?: number) => void;
    onSettingsChange: (update: Partial<Settings> | ((prevSettings: Settings) => Partial<Settings>)) => void;
    setInboxMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
    tasks: Task[];

    // State Setters
    setEditingSectionId: React.Dispatch<React.SetStateAction<number | null>>;
    setEditingSectionTitle: React.Dispatch<React.SetStateAction<string>>;
    setConfirmingDeleteSectionId: React.Dispatch<React.SetStateAction<number | null>>;
    setConfirmingDeleteAllSections: React.Dispatch<React.SetStateAction<boolean>>;
    setHiddenNotesSections: React.Dispatch<React.SetStateAction<Set<number>>>;
    setHiddenResponsesSections: React.Dispatch<React.SetStateAction<Set<number>>>;
}

export const useChecklistSectionManagement = ({
    history, historyIndex, isUndoingRedoing, confirmingDeleteAllSections, confirmTimeoutRef, historyRef, settings,
    updateHistory, onUpdate, onComplete, showToast, onSettingsChange, setInboxMessages, tasks,
    setEditingSectionId, setEditingSectionTitle, setConfirmingDeleteSectionId, setConfirmingDeleteAllSections,
    setHiddenNotesSections, setHiddenResponsesSections
}: UseChecklistSectionManagementProps) => {

    const handleAddSection = useCallback(() => {
        const newId = Date.now();
        const newSection: ChecklistSection = { id: newId, title: 'New Section', items: [] };
        const newSections = [...history[historyIndex], newSection];
        updateHistory(newSections);
        onUpdate(newSections);
        setEditingSectionId(newId);
        setEditingSectionTitle('New Section');
    }, [history, historyIndex, updateHistory, onUpdate, setEditingSectionId, setEditingSectionTitle]);

    const handleUpdateSectionTitle = useCallback((sectionId: number, newTitle: string) => {
        const newSections = history[historyIndex].map(sec =>
            'items' in sec && sec.id === sectionId ? { ...sec, title: newTitle } : sec
        );
        if (!isUndoingRedoing.current) {
            updateHistory(newSections);
        }
        onUpdate(newSections);
    }, [history, historyIndex, isUndoingRedoing, updateHistory, onUpdate]);

    const handleDuplicateSection = useCallback((sectionId: number) => {
        const currentSections = history[historyIndex];
        const sectionIndex = currentSections.findIndex(s => s.id === sectionId);
        if (sectionIndex === -1) return;
        const sectionToDuplicate = currentSections[sectionIndex];
        if (!('items' in sectionToDuplicate)) return;
        const newDuplicatedSection: ChecklistSection = {
            ...sectionToDuplicate,
            id: Date.now() + Math.random(),
            title: `${sectionToDuplicate.title} (Copy)`,
            items: sectionToDuplicate.items.map(item => ({ ...item, id: Date.now() + Math.random() })),
        };
        const newSections = [...currentSections];
        newSections.splice(sectionIndex + 1, 0, newDuplicatedSection);
        updateHistory(newSections);
        onUpdate(newSections);
        showToast('Section Duplicated!');
        setEditingSectionId(newDuplicatedSection.id);
        setEditingSectionTitle(newDuplicatedSection.title);
    }, [history, historyIndex, updateHistory, onUpdate, showToast, setEditingSectionId, setEditingSectionTitle]);

    const handleDeleteSection = useCallback((sectionId: number) => {
        const newSections = history[historyIndex].filter(sec => sec.id !== sectionId);
        updateHistory(newSections);
        onUpdate(newSections);
        setConfirmingDeleteSectionId(null);
        showToast('Section Deleted!');
        if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    }, [history, historyIndex, updateHistory, onUpdate, showToast, setConfirmingDeleteSectionId, confirmTimeoutRef]);

    const handleDeleteAllSections = useCallback(() => {
        if (confirmingDeleteAllSections) {
            updateHistory([]);
            onUpdate([]);
            showToast('All sections deleted.');
            setConfirmingDeleteAllSections(false);
            if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
        } else {
            setConfirmingDeleteAllSections(true);
            setConfirmingDeleteSectionId(null);
            if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
            confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteAllSections(false), 3000);
        }
    }, [confirmingDeleteAllSections, updateHistory, onUpdate, showToast, setConfirmingDeleteAllSections, setConfirmingDeleteSectionId, confirmTimeoutRef]);

    const handleCompleteAllInSection = useCallback((sectionId: number) => {
        const sectionToUpdate = history[historyIndex].find(sec => 'items' in sec && sec.id === sectionId) as (ChecklistSection | undefined);
        if (!sectionToUpdate) return;
        const areAllCurrentlyCompleted = sectionToUpdate.items.every(item => item.isCompleted);
        if (!areAllCurrentlyCompleted) {
            sectionToUpdate.items.forEach(item => {
                if (!item.isCompleted) onComplete(item, sectionId, []);
            });
            const parentTask = tasks.find((w: Task) => w.checklist?.some((s: any) => 'items' in s && s.id === sectionId));
            if (parentTask) {
                setInboxMessages((prev: InboxMessage[]) => [{ id: Date.now() + Math.random(), type: 'completed', text: `Section completed: "${sectionToUpdate.title}" in task "${parentTask.text}"`, timestamp: Date.now(), taskId: parentTask.id, sectionId: sectionId }, ...prev]);
            }
        }
        const newSections = history[historyIndex].map(sec => 'items' in sec && sec.id === sectionId ? { ...sec, items: sec.items.map(i => ({ ...i, isCompleted: !areAllCurrentlyCompleted })) } : sec);
        if (!isUndoingRedoing.current) updateHistory(newSections);
        onUpdate(newSections);
    }, [history, historyIndex, tasks, isUndoingRedoing, onComplete, setInboxMessages, updateHistory, onUpdate]);

    const handleToggleAllSections = useCallback(() => {
        const allItems = history[historyIndex].flatMap(sec => 'items' in sec ? sec.items : []);
        if (allItems.length === 0) return;
        const areAllItemsComplete = allItems.every(item => item.isCompleted);
        const newSections = history[historyIndex].map(sec => {
            if ('items' in sec) {
                return { ...sec, items: sec.items.map(item => {
                        if (!areAllItemsComplete && !item.isCompleted) onComplete(item, sec.id, []);
                        return { ...item, isCompleted: !areAllItemsComplete };
                    })};
            }
            return sec;
        });
        if (!isUndoingRedoing.current) updateHistory(newSections);
        onUpdate(newSections);
    }, [history, historyIndex, isUndoingRedoing, onComplete, updateHistory, onUpdate]);

    const handleToggleSectionCollapse = useCallback((sectionId: number) => {
        const openIds = settings.openChecklistSectionIds || [];
        const newOpenIds = openIds.includes(sectionId) ? openIds.filter(id => id !== sectionId) : [...openIds, sectionId];
        onSettingsChange(prev => ({ ...prev, openChecklistSectionIds: newOpenIds }));
    }, [settings.openChecklistSectionIds, onSettingsChange]);

    const handleCollapseAllSections = useCallback(() => {
        onSettingsChange(prev => ({ ...prev, openChecklistSectionIds: [] }));
    }, [onSettingsChange]);

    const handleExpandAllSections = useCallback(() => {
        const allSectionIds = historyRef.current[historyIndex].filter(s => 'items' in s).map(s => s.id);
        onSettingsChange(prev => ({ ...prev, openChecklistSectionIds: allSectionIds }));
    }, [historyIndex, onSettingsChange, historyRef]);

    const handleAddNotes = useCallback((sectionId?: number) => {
        const newSections = history[historyIndex].map(sec => {
            if ('items' in sec && (!sectionId || sec.id === sectionId)) {
                return { ...sec, items: sec.items.map(item => item.note === undefined ? { ...item, note: '' } : item) };
            }
            return sec;
        });
        updateHistory(newSections);
        onUpdate(newSections);
        showToast('Note fields added!');
    }, [history, historyIndex, updateHistory, onUpdate, showToast]);

    const handleAddResponses = useCallback((sectionId?: number) => {
        const newSections = history[historyIndex].map(sec => {
            if ('items' in sec && (!sectionId || sec.id === sectionId)) {
                return { ...sec, items: sec.items.map(item => item.response === undefined ? { ...item, response: '' } : item) };
            }
            return sec;
        });
        updateHistory(newSections);
        onUpdate(newSections);
        showToast('Response fields added!');
    }, [history, historyIndex, updateHistory, onUpdate, showToast]);

    const handleDeleteAllNotes = useCallback(() => {
        const newSections = history[historyIndex].map(sec => ('items' in sec) ? { ...sec, items: sec.items.map(item => { const { note, ...rest } = item; return rest; }) } : sec);
        updateHistory(newSections);
        onUpdate(newSections);
        showToast('All Notes deleted!');
    }, [history, historyIndex, updateHistory, onUpdate, showToast]);

    const handleDeleteAllResponses = useCallback(() => {
        const newSections = history[historyIndex].map(sec => ('items' in sec) ? { ...sec, items: sec.items.map(item => { const { response, ...rest } = item; return rest; }) } : sec);
        updateHistory(newSections);
        onUpdate(newSections);
        showToast('All Responses deleted!');
    }, [history, historyIndex, updateHistory, onUpdate, showToast]);

    const handleDeleteAllSectionNotes = useCallback((sectionId: number) => {
        const newSections = history[historyIndex].map(sec => ('items' in sec && sec.id === sectionId) ? { ...sec, items: sec.items.map(item => { const { note, ...rest } = item; return rest; }) } : sec);
        updateHistory(newSections);
        onUpdate(newSections);
        showToast('Section Notes deleted!');
    }, [history, historyIndex, updateHistory, onUpdate, showToast]);

    const handleDeleteAllSectionResponses = useCallback((sectionId: number) => {
        const newSections = history[historyIndex].map(sec => ('items' in sec && sec.id === sectionId) ? { ...sec, items: sec.items.map(item => { const { response, ...rest } = item; return rest; }) } : sec);
        updateHistory(newSections);
        onUpdate(newSections);
        showToast('Section Responses deleted!');
    }, [history, historyIndex, updateHistory, onUpdate, showToast]);

    const handleToggleSectionNotes = useCallback((sectionId: number) => {
        setHiddenNotesSections(prev => { const newSet = new Set(prev); if (newSet.has(sectionId)) newSet.delete(sectionId); else newSet.add(sectionId); return newSet; });
    }, [setHiddenNotesSections]);

    const handleToggleSectionResponses = useCallback((sectionId: number) => {
        setHiddenResponsesSections(prev => { const newSet = new Set(prev); if (newSet.has(sectionId)) newSet.delete(sectionId); else newSet.add(sectionId); return newSet; });
    }, [setHiddenResponsesSections]);

    return {
        handleAddSection, handleUpdateSectionTitle, handleDuplicateSection, handleDeleteSection, handleDeleteAllSections,
        handleCompleteAllInSection, handleToggleAllSections, handleToggleSectionCollapse, handleCollapseAllSections,
        handleExpandAllSections, handleAddNotes, handleAddResponses, handleDeleteAllNotes, handleDeleteAllResponses,
        handleDeleteAllSectionNotes, handleDeleteAllSectionResponses, handleToggleSectionNotes, handleToggleSectionResponses,
    };
};