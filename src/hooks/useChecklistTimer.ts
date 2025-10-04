import { useCallback } from 'react';
import { ChecklistItem, ChecklistSection, RichTextBlock, Task, TimeLogEntry } from '../types';

interface UseChecklistTimerProps {
    history: (ChecklistSection | RichTextBlock)[][];
    historyIndex: number;
    task: Task;
    taskId: number;
    showToast: (message: string, duration?: number) => void;
    updateHistory: (newSections: (ChecklistSection | RichTextBlock)[]) => void;
    onUpdate: (newSections: (ChecklistSection | RichTextBlock)[]) => void;
    onTaskUpdate: (updatedTask: Task) => void;
    handleGlobalToggleTimer: (taskId: number, entryId: number, entry?: TimeLogEntry, newTimeLog?: TimeLogEntry[]) => void;
    handlePrimeTaskWithNewLog: (taskId: number, newTimeLog: TimeLogEntry[], timeLogTitle?: string) => void;
}

export const useChecklistTimer = ({
    history, historyIndex, task, taskId, showToast, updateHistory, onUpdate, onTaskUpdate,
    handleGlobalToggleTimer, handlePrimeTaskWithNewLog
}: UseChecklistTimerProps) => {

    const handleSendAllItemsToTimer = useCallback((startImmediately: boolean) => {
        const allSections = history[historyIndex];
        if (!allSections || allSections.length === 0) {
            showToast('Checklist is empty.');
            return;
        }
        const newTimeLogEntries: TimeLogEntry[] = [];
        const itemIdsToAdd = new Set<number>();
        allSections.forEach(block => {
            if ('items' in block) {
                block.items.forEach(item => {
                    if (!item.isCompleted) itemIdsToAdd.add(item.id);
                });
            }
        });
        allSections.forEach(block => {
            if (!('items' in block)) return;
            const itemsToAdd = block.items.filter(item => !item.isCompleted);
            if (itemsToAdd.length > 0) {
                newTimeLogEntries.push({ id: block.id + Math.random(), description: block.title, duration: 0, type: 'header' });
                itemsToAdd.forEach(item => {
                    newTimeLogEntries.push({ id: item.id + Math.random(), description: item.text, duration: item.loggedTime || 0, type: 'entry', checklistItemId: item.id, isRunning: false, createdAt: Date.now() });
                });
            }
        });
        if (newTimeLogEntries.filter(e => e.type === 'entry').length === 0) {
            showToast('No active checklist items to send to timer.');
            return;
        }
        const updatedSections = allSections.map(block => {
            if ('items' in block) {
                return { ...block, items: block.items.map(item => itemIdsToAdd.has(item.id) && item.loggedTime === undefined ? { ...item, loggedTime: 0 } : item) };
            }
            return block;
        });
        if (startImmediately) {
            const firstEntry = newTimeLogEntries.find(e => e.type === 'entry');
            if (firstEntry) {
                setTimeout(() => handleGlobalToggleTimer(task.id, firstEntry.id, firstEntry, newTimeLogEntries), 100);
                updateHistory(updatedSections);
            }
        } else {
            handlePrimeTaskWithNewLog(task.id, newTimeLogEntries, task.text);
            updateHistory(updatedSections);
        }
        showToast('Checklist sent to Work Timer!');
    }, [history, historyIndex, showToast, task.id, task.text, handleGlobalToggleTimer, handlePrimeTaskWithNewLog, updateHistory]);

    const handleSendSectionToTimer = useCallback((section: ChecklistSection, startImmediately: boolean) => {
        const itemsToSend = section.items.filter(item => !item.isCompleted);
        if (itemsToSend.length === 0) {
            showToast('No active items in this section to send to timer.');
            return;
        }
        const newTimeLogEntries: TimeLogEntry[] = [
            { id: section.id + Math.random(), description: section.title, duration: 0, type: 'header' },
            ...itemsToSend.map(item => ({ id: item.id + Math.random(), description: item.text, duration: item.loggedTime || 0, type: 'entry' as 'entry', isRunning: false, createdAt: Date.now(), checklistItemId: item.id }))
        ];
        const updatedSections = history[historyIndex].map(s => ('items' in s && s.id === section.id) ? { ...s, items: s.items.map(i => itemsToSend.find(it => it.id === i.id) && i.loggedTime === undefined ? { ...i, loggedTime: 0 } : i) } : s);

        if (startImmediately) {
            const firstEntry = newTimeLogEntries.find(e => e.type === 'entry');
            if (firstEntry) {
                setTimeout(() => handleGlobalToggleTimer(task.id, firstEntry.id, firstEntry, newTimeLogEntries), 100);
                updateHistory(updatedSections);
                onUpdate(updatedSections);
            }
        } else {
            handlePrimeTaskWithNewLog(task.id, newTimeLogEntries, section.title);
            updateHistory(updatedSections);
        }
        showToast(`${itemsToSend.length} item(s) sent to timer!`);
    }, [history, historyIndex, showToast, task.id, handleGlobalToggleTimer, handlePrimeTaskWithNewLog, updateHistory, onUpdate]);

    const handleSendToTimer = useCallback((item: ChecklistItem, startImmediately: boolean) => {
        const newEntry: TimeLogEntry = { id: Date.now() + Math.random(), description: item.text, duration: item.loggedTime || 0, checklistItemId: item.id, type: 'entry', createdAt: Date.now() };
        const updatedSections = history[historyIndex].map(section => {
            if ('items' in section) {
                return { ...section, items: section.items.map(i => i.id === item.id && i.loggedTime === undefined ? { ...i, loggedTime: 0 } : i) };
            }
            return section;
        });
        if (startImmediately) {
            const newTimeLog = [...(task.timeLog || []), newEntry];
            setTimeout(() => handleGlobalToggleTimer(taskId, newEntry.id, newEntry, newTimeLog), 100);
        } else {
            onTaskUpdate({ ...task, timeLog: [...(task.timeLog || []), newEntry] });
        }
        updateHistory(updatedSections);
        onUpdate(updatedSections);
        showToast(`'${item.text}' sent to timer!`);
    }, [history, historyIndex, task, taskId, onTaskUpdate, handleGlobalToggleTimer, updateHistory, onUpdate, showToast]);

    return { handleSendAllItemsToTimer, handleSendSectionToTimer, handleSendToTimer };
};