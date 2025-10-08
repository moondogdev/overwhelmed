import { useMemo } from 'react';
import { Task, Settings } from '../../types';

interface UseListViewCalculationsProps {
    tasks: Task[];
    filteredTasks: Task[];
    settings: Settings;
    searchQuery: string;
    isTransactionsView: boolean;
}

export function useListViewCalculations({
    tasks,
    filteredTasks,
    settings,
    searchQuery,
    isTransactionsView,
}: UseListViewCalculationsProps) {
    const { activeCategoryId, activeSubCategoryId, activeTaxCategoryId } = settings;

    const nonTransactionTasksCount = useMemo(() => {
        const transactionsCategory = settings.categories.find(c => c.name === 'Transactions');
        if (!transactionsCategory) return tasks.length;
        const transactionSubCategoryIds = settings.categories.filter(c => c.parentId === transactionsCategory.id).map(c => c.id);
        const allTransactionCategoryIds = new Set([transactionsCategory.id, ...transactionSubCategoryIds]);
        return tasks.filter(task => !task.categoryId || !allTransactionCategoryIds.has(task.categoryId)).length;
    }, [tasks, settings.categories]);

    const tasksBeforeTaxFilter = useMemo(() => {
        const transactionsCategory = settings.categories.find(c => c.name === 'Transactions');
        const transactionSubCategoryIds = transactionsCategory ? settings.categories.filter(c => c.parentId === transactionsCategory.id).map(c => c.id) : [];
        const allTransactionCategoryIds = new Set(transactionsCategory ? [transactionsCategory.id, ...transactionSubCategoryIds] : []);

        let filtered = tasks.filter(task => {
            const isTransactionTask = task.categoryId ? allTransactionCategoryIds.has(task.categoryId) : false;
            if (activeCategoryId === 'all' && isTransactionTask) return false;
            const matchesSearch = searchQuery ? task.text.toLowerCase().includes(searchQuery.toLowerCase()) : true;
            if (!matchesSearch) return false;
            if (activeCategoryId === 'all') return true;
            const activeCategory = settings.categories.find(c => c.id === activeCategoryId);
            const parentId = activeCategory?.parentId || activeCategoryId;
            const subCategoriesForParent = settings.categories.filter(c => c.parentId === parentId);
            if (activeSubCategoryId !== 'all') return task.categoryId === activeSubCategoryId;
            const categoryIdsToShow = [parentId, ...subCategoriesForParent.map(sc => sc.id)];
            return categoryIdsToShow.includes(task.categoryId);
        });

        if (isTransactionsView && settings.selectedReportYear !== null && settings.selectedReportYear !== 'all') {
            filtered = filtered.filter(task => new Date(task.openDate).getFullYear() === Number(settings.selectedReportYear));
        }
        return filtered;
    }, [tasks, activeCategoryId, activeSubCategoryId, searchQuery, settings.categories, settings.selectedReportYear, isTransactionsView]);

    const transactionTotal = useMemo(() => {
        return filteredTasks.reduce((sum, task) => sum + (task.transactionAmount || 0), 0);
    }, [filteredTasks]);

    const tasksForAccountCounting = useMemo(() => {
        if (!isTransactionsView) return [];
        let filtered = tasks.filter(task => {
            const matchesSearch = searchQuery ? task.text.toLowerCase().includes(searchQuery.toLowerCase()) : true;
            if (!matchesSearch) return false;
            if (activeCategoryId === 'all') return true;
            if (activeSubCategoryId !== 'all') return task.categoryId === activeSubCategoryId;
            const parentCategory = settings.categories.find(c => c.id === activeCategoryId);
            const subCategoryIds = settings.categories.filter(sc => sc.parentId === parentCategory?.id).map(sc => sc.id);
            return task.categoryId === activeCategoryId || subCategoryIds.includes(task.categoryId);
        });
        if (isTransactionsView && activeTaxCategoryId !== 'all') {
            filtered = filtered.filter(task => task.taxCategoryId === activeTaxCategoryId);
        }
        return filtered;
    }, [tasks, activeCategoryId, activeSubCategoryId, searchQuery, settings.categories, isTransactionsView, activeTaxCategoryId]);

    const transactionYears = useMemo(() => {
        if (!isTransactionsView) return [];
        const years = new Set<number>();
        tasks.forEach(task => {
            if (task.transactionAmount && task.transactionAmount !== 0) {
                years.add(new Date(task.openDate).getFullYear());
            }
        });
        return Array.from(years).sort((a, b) => b - a);
    }, [tasks, isTransactionsView]);

    const uncategorizeTaxCount = useMemo(() => {
        if (!isTransactionsView) return 0;
        return filteredTasks.filter(t => t.taxCategoryId !== undefined).length;
    }, [filteredTasks, isTransactionsView]);

    const uncategorizeIncomeCount = useMemo(() => {
        if (!isTransactionsView) return 0;
        return filteredTasks.filter(t => t.incomeType !== undefined && t.incomeType !== null).length;
    }, [filteredTasks, isTransactionsView]);

    return {
        nonTransactionTasksCount,
        tasksBeforeTaxFilter,
        transactionTotal,
        tasksForAccountCounting,
        transactionYears,
        uncategorizeTaxCount,
        uncategorizeIncomeCount,
    };
}