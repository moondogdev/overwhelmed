import { useMemo } from 'react';
import { Task, Settings } from '../../types';

interface UseTaskFilteringProps {
    tasks: Task[];
    completedTasks: Task[];
    settings: Settings;
    searchQuery: string;
    isTransactionsView: boolean;
}

export function useTaskFiltering({
    tasks,
    completedTasks,
    settings,
    searchQuery,
    isTransactionsView,
}: UseTaskFilteringProps) {
    const {
        activeCategoryId = 'all',
        activeSubCategoryId = 'all',
        selectedReportYear = null,
        activeAccountId = 'all',
        activeTransactionTypeFilter = 'all',
        taxStatusFilter = 'all',
        activeTaxCategoryId = 'all',
        incomeTypeFilter = 'all',
    } = settings;

    const filteredTasks = useMemo(() => {
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

        if (isTransactionsView && selectedReportYear !== null && selectedReportYear !== 'all') {
            filtered = filtered.filter(task => new Date(task.openDate).getFullYear() === Number(selectedReportYear));
        }
        if (isTransactionsView && activeAccountId !== 'all') {
            filtered = filtered.filter(task => task.accountId === activeAccountId);
        }
        if (isTransactionsView && activeTransactionTypeFilter !== 'all') {
            filtered = filtered.filter(task => task.transactionType === activeTransactionTypeFilter);
        }
        if (isTransactionsView && taxStatusFilter !== 'all') {
            if (taxStatusFilter === 'tagged') {
                filtered = filtered.filter(task => task.taxCategoryId !== undefined && task.taxCategoryId !== null);
            } else if (taxStatusFilter === 'untagged') {
                filtered = filtered.filter(task => task.taxCategoryId === undefined || task.taxCategoryId === null || task.taxCategoryId === 0);
            }
        }
        if (isTransactionsView && activeTaxCategoryId !== 'all') {
            filtered = filtered.filter(task => task.taxCategoryId === activeTaxCategoryId);
        }
        if (isTransactionsView && incomeTypeFilter !== 'all') {
            if (incomeTypeFilter === 'untagged') {
                filtered = filtered.filter(task => (task.transactionAmount || 0) > 0 && !task.incomeType);
            } else {
                filtered = filtered.filter(task => task.incomeType === incomeTypeFilter);
            }
        }

        const currentSortConfig = settings.prioritySortConfig?.[String(activeCategoryId)] || null;
        if (currentSortConfig) {
            filtered.sort((a, b) => {
                let aValue: any, bValue: any;
                if (currentSortConfig.key === 'timeOpen') aValue = a.createdAt;
                else if (currentSortConfig.key === 'priority') aValue = { 'High': 1, 'Medium': 2, 'Low': 3 }[a.priority || 'Medium'];
                else if (currentSortConfig.key === 'text') aValue = a.text.toLowerCase();
                else if (currentSortConfig.key === 'price') aValue = a.transactionAmount && a.transactionAmount !== 0 ? Math.abs(a.transactionAmount) : ((a.manualTime || 0) / (1000 * 60 * 60)) * (a.payRate || 0);
                else aValue = a[currentSortConfig.key as keyof Task] || 0;

                if (currentSortConfig.key === 'timeOpen') bValue = b.createdAt;
                else if (currentSortConfig.key === 'priority') bValue = { 'High': 1, 'Medium': 2, 'Low': 3 }[b.priority || 'Medium'];
                else if (currentSortConfig.key === 'text') bValue = b.text.toLowerCase();
                else if (currentSortConfig.key === 'price') bValue = b.transactionAmount && b.transactionAmount !== 0 ? Math.abs(b.transactionAmount) : ((b.manualTime || 0) / (1000 * 60 * 60)) * (b.payRate || 0);
                else bValue = b[currentSortConfig.key as keyof Task] || 0;

                if (aValue < bValue) return currentSortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return currentSortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [tasks, activeCategoryId, activeSubCategoryId, searchQuery, settings.categories, settings.prioritySortConfig, selectedReportYear, activeAccountId, activeTransactionTypeFilter, activeTaxCategoryId, isTransactionsView, taxStatusFilter, incomeTypeFilter]);

    const filteredCompletedTasks = useMemo(() => {
        return completedTasks.filter(task => {
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
    }, [completedTasks, searchQuery, activeCategoryId, activeSubCategoryId, settings.categories]);

    return { filteredTasks, filteredCompletedTasks };
}