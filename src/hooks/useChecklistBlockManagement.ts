import { useCallback } from 'react';
import { ChecklistSection, RichTextBlock } from '../types';
import { formatChecklistForCopy, formatChecklistItemsForRawCopy } from '../utils';

interface UseChecklistBlockManagementProps {
    history: (ChecklistSection | RichTextBlock)[][];
    historyIndex: number;
    updateHistory: (newSections: (ChecklistSection | RichTextBlock)[]) => void;
    onUpdate: (newSections: (ChecklistSection | RichTextBlock)[]) => void;
    showToast: (message: string, duration?: number) => void;
    setEditingContentBlockId: React.Dispatch<React.SetStateAction<number | null>>;
}

export const useChecklistBlockManagement = ({
    history,
    historyIndex,
    updateHistory,
    onUpdate,
    showToast,
    setEditingContentBlockId,
}: UseChecklistBlockManagementProps) => {

    const handleAddRichTextBlock = useCallback((sectionId: number, contentBlockId?: number | null) => {
        if (contentBlockId) {
            setEditingContentBlockId(contentBlockId);
            return;
        }
        const currentChecklist = history[historyIndex];
        const sectionIndex = currentChecklist.findIndex(s => s.id === sectionId);
        if (sectionIndex === -1) return;
        const newBlock: RichTextBlock = {
            id: Date.now() + Math.random(),
            type: 'rich-text',
            content: '<h3>Section Title</h3><p>Section description...</p>',
        };
        const newChecklist = [...currentChecklist];
        newChecklist.splice(sectionIndex, 0, newBlock);
        updateHistory(newChecklist);
        onUpdate(newChecklist);
        showToast('Content block added!');
    }, [history, historyIndex, setEditingContentBlockId, updateHistory, onUpdate, showToast]);

    const handleUpdateRichTextBlockContent = useCallback((blockId: number, newContent: string) => {
        const newChecklist = history[historyIndex].map(block =>
            'type' in block && block.type === 'rich-text' && block.id === blockId
                ? { ...block, content: newContent }
                : block
        );
        updateHistory(newChecklist);
        onUpdate(newChecklist);
    }, [history, historyIndex, updateHistory, onUpdate]);

    const handleDeleteRichTextBlock = useCallback((blockId: number) => {
        const newChecklist = history[historyIndex].filter(block => block.id !== blockId);
        updateHistory(newChecklist);
        setEditingContentBlockId(null);
        onUpdate(newChecklist);
        showToast('Content block deleted.');
    }, [history, historyIndex, updateHistory, onUpdate, showToast, setEditingContentBlockId]);

    const handleAssociateBlock = useCallback((sectionId: number, blockId: number) => {
        const currentSections = history[historyIndex];
        let newSections = [...currentSections];
        const sectionToMove = newSections.find(s => s.id === sectionId);
        if (!sectionToMove) return;
        newSections = newSections.filter(s => s.id !== sectionId);
        const targetBlockIndex = newSections.findIndex(b => b.id === blockId);
        if (targetBlockIndex === -1) return;
        let insertionIndex = targetBlockIndex + 1;
        while (insertionIndex < newSections.length && !('type' in newSections[insertionIndex])) {
            insertionIndex++;
        }
        newSections.splice(insertionIndex, 0, sectionToMove);
        updateHistory(newSections);
        onUpdate(newSections);
        showToast('Section associated with content block!');
    }, [history, historyIndex, updateHistory, onUpdate, showToast]);

    const handleCopyBlock = useCallback((blockId: number) => {
        const currentSections = history[historyIndex];
        const index = currentSections.findIndex(b => b.id === blockId);
        if (index === -1 || !('type' in currentSections[index])) return;
        const richTextBlock = currentSections[index] as RichTextBlock;
        const associatedSections: ChecklistSection[] = [];
        let j = index + 1;
        while (j < currentSections.length && !('type' in currentSections[j])) {
            associatedSections.push(currentSections[j] as ChecklistSection);
            j++;
        }
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = richTextBlock.content;
        let richTextContent = '';
        tempDiv.childNodes.forEach(node => {
            if (node.textContent) richTextContent += node.textContent + '\n';
        });
        const checklistContent = formatChecklistForCopy(associatedSections);
        const fullContent = `${richTextContent}\n\n---\n\n${checklistContent}`.trim();
        navigator.clipboard.writeText(fullContent);
        showToast('Block content copied!');
    }, [history, historyIndex, showToast]);

    const handleCopyBlockRaw = useCallback((blockId: number) => {
        const currentSections = history[historyIndex];
        const index = currentSections.findIndex(b => b.id === blockId);
        if (index === -1 || !('type' in currentSections[index])) return;
        const blocksToCopy: (RichTextBlock | ChecklistSection)[] = [currentSections[index]];
        let j = index + 1;
        while (j < currentSections.length && !('type' in currentSections[j])) {
            blocksToCopy.push(currentSections[j]);
            j++;
        }
        const allRawText = blocksToCopy.map(block => {
            if ('items' in block) {
                const section = block as ChecklistSection;
                return `### ${section.title}\n${formatChecklistItemsForRawCopy(section.items)}`;
            }
            return `<div>${(block as RichTextBlock).content}</div>`;
        }).join('\n---\n');
        navigator.clipboard.writeText(allRawText);
        showToast('Block raw content copied!');
    }, [history, historyIndex, showToast]);

    const handleDetachFromBlock = useCallback((sectionId: number) => {
        const currentSections = history[historyIndex];
        const sectionIndex = currentSections.findIndex(s => s.id === sectionId);
        if (sectionIndex === -1 || sectionIndex === 0) return;
        const newSeparatorBlock: RichTextBlock = { id: Date.now() + Math.random(), type: 'rich-text', content: '' };
        const newSections = [...currentSections];
        newSections.splice(sectionIndex, 0, newSeparatorBlock);
        updateHistory(newSections);
        onUpdate(newSections);
        showToast('Section detached into a new block.');
    }, [history, historyIndex, updateHistory, onUpdate, showToast]);

    return {
        handleAddRichTextBlock,
        handleUpdateRichTextBlockContent,
        handleDeleteRichTextBlock,
        handleAssociateBlock,
        handleCopyBlock,
        handleCopyBlockRaw,
        handleDetachFromBlock,
    };
};