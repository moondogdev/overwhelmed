import { useMemo, useCallback } from 'react';
import { ChecklistItem, ChecklistSection, RichTextBlock } from '../types';
import { indentChecklistItem, outdentChecklistItem } from '../utils';

interface UseChecklistHierarchyProps {
    history: (ChecklistSection | RichTextBlock)[][];
    historyIndex: number;
    checklistSortKey: 'default' | 'alphabetical' | 'highlight' | 'status';
    isUndoingRedoing: React.MutableRefObject<boolean>;
    setChecklistSortKey: React.Dispatch<React.SetStateAction<'default' | 'alphabetical' | 'highlight' | 'status'>>;
    updateHistory: (newSections: (ChecklistSection | RichTextBlock)[]) => void;
    onUpdate: (newSections: (ChecklistSection | RichTextBlock)[]) => void;
    showToast: (message: string, duration?: number) => void;
}

export const useChecklistHierarchy = ({
    history,
    historyIndex,
    checklistSortKey,
    isUndoingRedoing,
    setChecklistSortKey,
    updateHistory,
    onUpdate,
    showToast,
}: UseChecklistHierarchyProps) => {

    const sortedSections = useMemo(() => {
        const currentSections = history[historyIndex] || [];
        if (checklistSortKey === 'default') {
            return currentSections;
        }

        const sortChildrenOf = (parentId: number | null, itemsToSort: ChecklistItem[]): ChecklistItem[] => {
            const items = itemsToSort.filter(item => 'isCompleted' in item);
            const children = items.filter(i => i.parentId === parentId) as ChecklistItem[];
            if (!children.length) return [];

            children.sort((a, b) => {
                switch (checklistSortKey) {
                    case 'alphabetical': return a.text.localeCompare(b.text);
                    case 'status': return (a.isCompleted ? 1 : 0) - (b.isCompleted ? 1 : 0);
                    case 'highlight':
                        if (a.highlightColor && !b.highlightColor) return -1;
                        if (!a.highlightColor && b.highlightColor) return 1;
                        return 0;
                    default: return 0;
                }
            });

            let sortedList: ChecklistItem[] = [];
            for (const child of children) {
                sortedList.push(child);
                sortedList = sortedList.concat(sortChildrenOf(child.id, items));
            }
            return sortedList;
        };

        return currentSections.map(section => {
            if ('items' in section) {
                const sortedItems = sortChildrenOf(null, section.items);
                return { ...section, items: sortedItems };
            }
            return section;
        });
    }, [history, historyIndex, checklistSortKey]);

    const handleSortChange = useCallback((sortKey: 'default' | 'alphabetical' | 'highlight' | 'status') => {
        setChecklistSortKey(sortKey);
        showToast(`Sorted by: ${sortKey.charAt(0).toUpperCase() + sortKey.slice(1)}`);
    }, [setChecklistSortKey, showToast]);

    const moveSection = useCallback((sections: (ChecklistSection | RichTextBlock)[], sectionId: number, direction: 'up' | 'down'): (ChecklistSection | RichTextBlock)[] => {
        const newSections = [...sections];
        const index = newSections.findIndex(s => s.id === sectionId);
        if (direction === 'up' && index > 0) {
            [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
        } else if (direction === 'down' && index < newSections.length - 1) {
            [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
        }
        if (!isUndoingRedoing.current) {
            updateHistory(newSections);
        }
        return newSections;
    }, [isUndoingRedoing, updateHistory]);

    const handleMoveBlock = useCallback((blockId: number, direction: 'up' | 'down') => {
        const currentSections = history[historyIndex];
        const newSections = [...currentSections];
        const index = newSections.findIndex(s => s.id === blockId);
        if (index === -1) return;

        const isPaired = 'type' in newSections[index] && (index + 1 < newSections.length) && !('type' in newSections[index + 1]);
        const itemsToMoveCount = isPaired ? 2 : 1;

        if (direction === 'up' && index > 0) {
            const prevIsPaired = (index - 2 >= 0) && 'type' in newSections[index - 2] && !('type' in newSections[index - 1]);
            const prevItemsCount = prevIsPaired ? 2 : 1;
            const itemsToMove = newSections.splice(index, itemsToMoveCount);
            newSections.splice(index - prevItemsCount, 0, ...itemsToMove);
        } else if (direction === 'down' && (index + itemsToMoveCount) < newSections.length) {
            const itemsToMove = newSections.splice(index, itemsToMoveCount);
            newSections.splice(index + 1, 0, ...itemsToMove);
        }
        updateHistory(newSections);
        onUpdate(newSections);
    }, [history, historyIndex, updateHistory, onUpdate]);

    const handlePromoteItemToHeader = useCallback((sectionId: number, itemId: number) => {
        const currentSections = history[historyIndex];
        const sectionIndex = currentSections.findIndex(s => 'items' in s && s.id === sectionId) as number;
        if (sectionIndex === -1) return;

        const sourceSectionBlock = currentSections[sectionIndex];
        if (!('items' in sourceSectionBlock)) return;
        const sourceSection = sourceSectionBlock;
        const itemIndex = sourceSection.items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return;

        const itemToPromote = sourceSection.items[itemIndex];

        const findDescendants = (items: ChecklistItem[], parentId: number): ChecklistItem[] => {
            const children = items.filter(i => i.parentId === parentId);
            let descendants = [...children];
            children.forEach(child => {
                descendants = [...descendants, ...findDescendants(items, child.id)];
            });
            return descendants;
        };

        const descendants = findDescendants(sourceSection.items, itemId);
        const descendantIds = new Set(descendants.map(d => d.id));

        const newSection: ChecklistSection = {
            id: Date.now() + Math.random(),
            title: itemToPromote.text,
            items: descendants.map(descendant => ({ ...descendant, level: (descendant.level || 0) - ((itemToPromote.level || 0) + 1), parentId: descendant.parentId === itemToPromote.id ? null : descendant.parentId })),
        };
        const newSections = [...currentSections];
        (newSections[sectionIndex] as ChecklistSection).items = sourceSection.items.filter(i => i.id !== itemId && !descendantIds.has(i.id));
        newSections.splice(sectionIndex + 1, 0, newSection);
        updateHistory(newSections);
        onUpdate(newSections);
        showToast('Item promoted to new section!');
    }, [history, historyIndex, updateHistory, onUpdate, showToast]);

    const handleIndent = useCallback((sectionId: number, itemId: number) => {
        const newSections = indentChecklistItem(history[historyIndex], sectionId, itemId);
        updateHistory(newSections);
        onUpdate(newSections);
    }, [history, historyIndex, updateHistory, onUpdate]);

    const handleOutdent = useCallback((sectionId: number, itemId: number) => {
        const newSections = outdentChecklistItem(history[historyIndex], sectionId, itemId);
        updateHistory(newSections);
        onUpdate(newSections);
    }, [history, historyIndex, updateHistory, onUpdate]);

    const handleIndentChecked = useCallback((direction: 'indent' | 'outdent') => {
        let tempSections = JSON.parse(JSON.stringify(history[historyIndex]));
        let itemsProcessed = 0;

        for (const block of tempSections) {
            if (!('items' in block)) continue;
            const section = block as ChecklistSection;
            const itemsToIndent = section.items.filter((i: ChecklistItem) => i.isCompleted);
            if (itemsToIndent.length === 0) continue;
            itemsProcessed += itemsToIndent.length;

            for (let i = section.items.length - 1; i >= 0; i--) {
                const currentItem = section.items[i];
                if (!currentItem.isCompleted) continue;

                if (direction === 'indent') {
                    let potentialParent = null;
                    for (let j = i - 1; j >= 0; j--) {
                        if (!section.items[j].isCompleted) {
                            potentialParent = section.items[j];
                            break;
                        }
                    }
                    if (potentialParent) {
                        currentItem.parentId = potentialParent.id;
                        currentItem.level = (potentialParent.level || 0) + 1;
                    }
                } else { // outdent
                    if ((currentItem.level || 0) > 0) {
                        const parent = section.items.find((p: ChecklistItem) => p.id === currentItem.parentId);
                        currentItem.parentId = parent ? parent.parentId : null;
                        currentItem.level = parent ? (parent.level || 0) : 0;
                    }
                }
            }
        }

        if (itemsProcessed > 0) {
            updateHistory(tempSections);
            onUpdate(tempSections);
            showToast(`${itemsProcessed} item(s) ${direction}ed.`);
        } else {
            showToast('No items are checked.');
        }
    }, [history, historyIndex, updateHistory, onUpdate, showToast]);

    const handleTabOnChecklistItem = useCallback((sectionId: number, itemId: number, shiftKey: boolean) => {
        const direction = shiftKey ? 'outdent' : 'indent';
        const anyItemsChecked = history[historyIndex].some(sec => 'items' in sec && sec.items.some(item => item.isCompleted));

        if (anyItemsChecked) {
            handleIndentChecked(direction);
        } else {
            if (direction === 'indent') handleIndent(sectionId, itemId);
            else handleOutdent(sectionId, itemId);
        }
    }, [history, historyIndex, handleIndentChecked, handleIndent, handleOutdent]);

    return {
        sortedSections,
        handleSortChange,
        moveSection,
        handleMoveBlock,
        handlePromoteItemToHeader,
        handleIndent,
        handleOutdent,
        handleIndentChecked,
        handleTabOnChecklistItem,
    };
};