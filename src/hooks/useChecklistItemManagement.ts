import { useCallback } from 'react';
import { ChecklistItem, ChecklistSection, RichTextBlock, InboxMessage, Task } from '../types';
import { deleteChecklistItemAndChildren } from '../utils';

interface UseChecklistItemManagementProps {
    history: (ChecklistSection | RichTextBlock)[][];
    historyIndex: number;
    newItemTexts: { [key: number]: string };
    isUndoingRedoing: React.MutableRefObject<boolean>;
    addItemInputRef: React.MutableRefObject<{ [key: number]: HTMLTextAreaElement; }>;
    setNewItemTexts: React.Dispatch<React.SetStateAction<{ [key: number]: string }>>;
    updateHistory: (newSections: (ChecklistSection | RichTextBlock)[]) => void;
    onUpdate: (newSections: (ChecklistSection | RichTextBlock)[]) => void;
    onComplete: (item: ChecklistItem, sectionId: number, updatedSections: ChecklistSection[]) => void;
    showToast: (message: string, duration?: number) => void;
    setInboxMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
    setEditingItemId: React.Dispatch<React.SetStateAction<number | null>>;
    setEditingItemText: React.Dispatch<React.SetStateAction<string>>;
    tasks: Task[];
}

export const useChecklistItemManagement = ({
    history,
    historyIndex,
    newItemTexts,
    isUndoingRedoing,
    addItemInputRef,
    setNewItemTexts,
    updateHistory,
    onUpdate,
    onComplete,
    showToast,
    setInboxMessages,
    tasks,
    setEditingItemId,
    setEditingItemText,
}: UseChecklistItemManagementProps) => {

    const handleAddItem = useCallback((sectionId: number) => {
        const text = newItemTexts[sectionId] || '';
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) return;

        const newItems: ChecklistItem[] = [];
        const parentStack: (number | null)[] = [null];

        const currentSection = history[historyIndex].find(s => 'items' in s && s.id === sectionId) as (ChecklistSection | undefined);
        const lastItem = currentSection?.items[currentSection.items.length - 1];
        if (lastItem) {
            parentStack[lastItem.level || 0] = lastItem.id;
        }

        lines.forEach(line => {
            const indentMatch = line.match(/^(\s*|-+|\*+)\s*/);
            const indent = indentMatch ? indentMatch[1] : '';
            const level = indent.includes('-') || indent.includes('*') ? 1 : Math.floor(indent.length / 2);

            const newItem: ChecklistItem = {
                id: Date.now() + Math.random(),
                text: line.trim().replace(/^(-|\*)\s*/, ''),
                isCompleted: false,
                level: level,
                parentId: level > 0 ? parentStack[level - 1] : null,
            };

            newItems.push(newItem);
            parentStack[level] = newItem.id;
            parentStack.splice(level + 1);
        });

        const newSections = history[historyIndex].map(sec =>
            'items' in sec && sec.id === sectionId ? { ...sec, items: [...sec.items, ...newItems] } : sec
        );

        if (!isUndoingRedoing.current) {
            updateHistory(newSections);
        }
        onUpdate(newSections);
        setNewItemTexts(prev => ({ ...prev, [sectionId]: '' }));

        setTimeout(() => {
            addItemInputRef.current[sectionId]?.focus();
        }, 0);
    }, [history, historyIndex, newItemTexts, isUndoingRedoing, addItemInputRef, setNewItemTexts, updateHistory, onUpdate]);

    const handleToggleItem = useCallback((sectionId: number, itemId: number) => {
        let toggledItem: ChecklistItem | null = null;
        const newSections = history[historyIndex].map(sec => {
            if (!('items' in sec) || sec.id !== sectionId) return sec;

            const newItems = sec.items.map(item => {
                if (item.id !== itemId) return item;
                const isNowCompleted = !item.isCompleted;
                if (isNowCompleted) {
                    toggledItem = item;
                }
                return { ...item, isCompleted: isNowCompleted };
            });
            return { ...sec, items: newItems };
        });

        if (toggledItem) {
            const checklistSectionsOnly = newSections.filter(s => 'items' in s) as ChecklistSection[];
            onComplete(toggledItem, sectionId, checklistSectionsOnly);
        }

        if (!isUndoingRedoing.current) {
            updateHistory(newSections);
        }
        onUpdate(newSections);
    }, [history, historyIndex, isUndoingRedoing, onComplete, updateHistory, onUpdate]);

    const handleUpdateItemText = useCallback((sectionId: number, itemId: number, newText: string) => {
        const newSections = history[historyIndex].map(sec =>
            'items' in sec && sec.id === sectionId ? { ...sec, items: sec.items.map(item => item.id === itemId ? { ...item, text: newText } : item) } : sec
        );
        if (!isUndoingRedoing.current) {
            updateHistory(newSections);
        }
        onUpdate(newSections);
    }, [history, historyIndex, isUndoingRedoing, updateHistory, onUpdate]);

    const handleUpdateItemResponse = useCallback((sectionId: number, itemId: number, newResponse: string) => {
        const newSections = history[historyIndex].map(sec =>
            'items' in sec && sec.id === sectionId ? { ...sec, items: sec.items.map(item => item.id === itemId ? { ...item, response: newResponse } : item) } : sec
        );
        updateHistory(newSections);
        onUpdate(newSections);
    }, [history, historyIndex, updateHistory, onUpdate]);

    const handleUpdateItemNote = useCallback((sectionId: number, itemId: number, newNote: string) => {
        const newSections = history[historyIndex].map(sec =>
            'items' in sec && sec.id === sectionId ? { ...sec, items: sec.items.map(item => item.id === itemId ? { ...item, note: newNote } : item) } : sec
        );
        updateHistory(newSections);
        onUpdate(newSections);
    }, [history, historyIndex, updateHistory, onUpdate]);

    const handleDeleteItemResponse = useCallback((sectionId: number, itemId: number) => {
        const newSections = history[historyIndex].map(sec =>
            'items' in sec && sec.id === sectionId ? { ...sec, items: sec.items.map(item => item.id === itemId ? { ...item, response: undefined } : item) } : sec
        );
        updateHistory(newSections);
        onUpdate(newSections);
    }, [history, historyIndex, updateHistory, onUpdate]);

    const handleDeleteItemNote = useCallback((sectionId: number, itemId: number) => {
        const newSections = history[historyIndex].map(sec =>
            'items' in sec && sec.id === sectionId ? { ...sec, items: sec.items.map(item => item.id === itemId ? { ...item, note: undefined } : item) } : sec
        );
        updateHistory(newSections);
        onUpdate(newSections);
    }, [history, historyIndex, updateHistory, onUpdate]);

    const handleUpdateItemDueDate = useCallback((sectionId: number, itemId: number, newDueDate: number | undefined) => {
        const newSections = history[historyIndex].map(sec =>
            'items' in sec && sec.id === sectionId
                ? { ...sec, items: sec.items.map(item => (item.id === itemId ? { ...item, dueDate: newDueDate } : item)) }
                : sec,
        );
        updateHistory(newSections);
        onUpdate(newSections);
    }, [history, historyIndex, updateHistory, onUpdate]);

    const handleUpdateItemDueDateFromPicker = useCallback((sectionId: number, itemId: number, dateString: string) => {
        const newDueDate = dateString ? new Date(dateString + 'T00:00:00').getTime() : undefined;
        handleUpdateItemDueDate(sectionId, itemId, newDueDate);
    }, [handleUpdateItemDueDate]);

    const handleDeleteItem = useCallback((sectionId: number, itemId: number) => {
        const newSections = deleteChecklistItemAndChildren(history[historyIndex], sectionId, itemId);
        if (!isUndoingRedoing.current) {
            updateHistory(newSections);
        }
        onUpdate(newSections);
    }, [history, historyIndex, isUndoingRedoing, updateHistory, onUpdate]);

    const handleDuplicateChecklistItem = useCallback((sectionId: number, itemId: number) => {
        const currentSections = history[historyIndex];
        const section = currentSections.find(s => 'items' in s && s.id === sectionId) as ChecklistSection | undefined;
        if (!section) return;
        const itemIndex = section.items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return;
        const itemToDuplicate = section.items[itemIndex];
        const duplicatedItem = { ...itemToDuplicate, id: Date.now() + Math.random(), text: `${itemToDuplicate.text} (Copy)` };
        const newItems = [...section.items];
        newItems.splice(itemIndex + 1, 0, duplicatedItem);
        const newSections = currentSections.map(s => 'items' in s && s.id === sectionId ? { ...s, items: newItems } : s);
        updateHistory(newSections);
        onUpdate(newSections);
        showToast('Item duplicated!');
        // Set the newly created item to be in edit mode immediately.
        setEditingItemId(duplicatedItem.id);
        setEditingItemText(duplicatedItem.text);
    }, [history, historyIndex, updateHistory, onUpdate, showToast, setEditingItemId, setEditingItemText]);

    return {
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
    };
};