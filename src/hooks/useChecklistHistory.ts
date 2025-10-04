import { useCallback, useEffect } from 'react';
import { ChecklistSection, RichTextBlock } from '../types';

interface UseChecklistHistoryProps {
    history: (ChecklistSection | RichTextBlock)[][];
    historyIndex: number;
    isUndoingRedoing: React.MutableRefObject<boolean>;
    checklistRef?: React.MutableRefObject<{ handleUndo: () => void; handleRedo: () => void; resetHistory: (sections: (ChecklistSection | RichTextBlock)[]) => void; }>;
    setHistory: React.Dispatch<React.SetStateAction<(ChecklistSection | RichTextBlock)[][]>>;
    setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
    onUpdate: (newSections: (ChecklistSection | RichTextBlock)[]) => void;
}

export const useChecklistHistory = ({
    history, historyIndex, isUndoingRedoing, checklistRef,
    setHistory, setHistoryIndex, onUpdate
}: UseChecklistHistoryProps) => {

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            isUndoingRedoing.current = true;
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            onUpdate(history[newIndex]);
            setTimeout(() => isUndoingRedoing.current = false, 0);
        }
    }, [history, historyIndex, isUndoingRedoing, setHistoryIndex, onUpdate]);

    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            isUndoingRedoing.current = true;
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            onUpdate(history[newIndex]);
            setTimeout(() => isUndoingRedoing.current = false, 0);
        }
    }, [history, historyIndex, isUndoingRedoing, setHistoryIndex, onUpdate]);

    return { handleUndo, handleRedo };
};