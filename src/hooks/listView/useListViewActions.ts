import { useCallback } from 'react';
import { Task, Settings } from '../../types';

interface UseListViewActionsProps {
    filteredTasks: Task[];
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
    showToast: (message: string) => void;
}

export function useListViewActions({
    filteredTasks,
    settings,
    setSettings,
    showToast,
}: UseListViewActionsProps) {
    const { activeCategoryId } = settings;

    const handleSortPillClick = (key: string, direction: 'asc' | 'desc') => {
        const newSortConfig = { ...settings.prioritySortConfig };
        newSortConfig[String(activeCategoryId)] = { key: key as any, direction: direction as any };
        setSettings(prev => ({ ...prev, prioritySortConfig: newSortConfig }));
    };

    const handleCopyFilteredDetails = () => {
        if (filteredTasks.length === 0) { showToast('No tasks to copy.'); return; }
        const report = filteredTasks.map(task => {
            const category = settings.categories.find(c => c.id === task.categoryId);
            let categoryName = 'Uncategorized';
            if (category) {
                const parent = category.parentId ? settings.categories.find(p => p.id === category.parentId) : null;
                categoryName = parent ? `${parent.name} > ${category.name}` : category.name;
            }
            return [`Task Title: ${task.text || 'N/A'}`, `URL: ${task.url || 'N/A'}`, `Category: ${categoryName}`, `Open Date: ${new Date(task.openDate).toLocaleString()}`, `Due Date: ${task.completeBy ? new Date(task.completeBy).toLocaleString() : 'N/A'}`, `Company: ${task.company || 'N/A'}`, `Website URL: ${task.websiteUrl || 'N/A'}`].join('\n');
        }).join('\n\n---\n\n');
        navigator.clipboard.writeText(report).then(() => showToast(`${filteredTasks.length} task(s) details copied!`));
    };

    const handleCopyFilteredTitles = () => {
        if (filteredTasks.length === 0) { showToast('No task titles to copy.'); return; }
        const titles = filteredTasks.map(task => task.text).join('\n');
        navigator.clipboard.writeText(`Tasks:\n${titles}`).then(() => showToast(`${filteredTasks.length} task title(s) copied!`));
    };

    const handleCopyTitlesByCategory = () => {
        if (filteredTasks.length === 0) { showToast('No tasks to copy.'); return; }
        const tasksByCategory = new Map<number | undefined, Task[]>();
        for (const task of filteredTasks) {
            if (!tasksByCategory.has(task.categoryId)) tasksByCategory.set(task.categoryId, []);
            tasksByCategory.get(task.categoryId)!.push(task);
        }
        const reportBlocks: string[] = [];
        tasksByCategory.forEach((tasks, categoryId) => {
            const category = settings.categories.find(c => c.id === categoryId);
            let categoryName = 'Uncategorized';
            if (category) {
                const parent = category.parentId ? settings.categories.find(p => p.id === category.parentId) : null;
                categoryName = parent ? `${parent.name} > ${category.name}` : category.name;
            }
            reportBlocks.push(`${categoryName}:\n${tasks.map(task => task.text).join('\n')}`);
        });
        navigator.clipboard.writeText(reportBlocks.join('\n\n---\n\n')).then(() => showToast(`Categorized task list copied!`));
    };

    const handleCopyTransactionTitlesAsKeywords = () => {
        if (filteredTasks.length === 0) { showToast('No transaction titles to copy.'); return; }
        const titlesAsKeywords = filteredTasks.map(task => task.text.trim()).join(', ');
        navigator.clipboard.writeText(titlesAsKeywords).then(() => showToast(`${filteredTasks.length} transaction title(s) copied as keywords!`));
    };

    return {
        handleSortPillClick,
        handleCopyFilteredDetails,
        handleCopyFilteredTitles,
        handleCopyTitlesByCategory,
        handleCopyTransactionTitlesAsKeywords,
    };
}