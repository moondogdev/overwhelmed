import { useMemo, useEffect, useRef } from 'react';
import { Task, Settings } from '../types';
import { useTaskFiltering } from './listView/useTaskFiltering';
import { useSelectionManagement } from './listView/useSelectionManagement';
import { useListViewCalculations } from './listView/useListViewCalculations';
import { useListViewActions } from './listView/useListViewActions';

interface UseListViewProps {
    tasks: Task[];
    completedTasks: Task[];
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
    searchQuery: string;
    setActiveCategoryId: (id: number | 'all') => void;
    setSelectedTaskIds: React.Dispatch<React.SetStateAction<number[]>>;
    setVisibleTaskIds: React.Dispatch<React.SetStateAction<number[]>>;
    showToast: (message: string) => void;
    selectedTaskIds: number[];
    visibleTaskIds: number[];
}

interface UseListViewReturn {
    isTransactionsView: boolean;
    nonTransactionTasksCount: number;
    tasksBeforeTaxFilter: Task[];
    filteredTasks: Task[];
    filteredCompletedTasks: Task[];
    selectAllCheckboxRef: React.RefObject<HTMLInputElement>;
    allVisibleSelected: boolean;
    someVisibleSelected: boolean;
    handleToggleSelectAll: () => void;
    handleSortPillClick: (key: string, direction: 'asc' | 'desc') => void;
    selectAllCompletedCheckboxRef: React.RefObject<HTMLInputElement>;
    allCompletedVisibleSelected: boolean;
    handleToggleSelectAllCompleted: () => void;
    transactionTotal: number;
    tasksForAccountCounting: Task[];
    autoTaxCategorizeCounts: { [key: string]: number };
    transactionYears: number[];
    autoCategorizeCounts: { [key: string]: number };
    uncategorizeTaxCount: number;
    uncategorizeIncomeCount: number;
    handleCopyFilteredDetails: () => void;
    handleCopyFilteredTitles: () => void;
    handleCopyTitlesByCategory: () => void;
    handleCopyTransactionTitlesAsKeywords: () => void;
}

export function useListView({
    tasks,
    completedTasks,
    settings,
    setSettings,
    searchQuery,
    setActiveCategoryId,
    setSelectedTaskIds,
    setVisibleTaskIds,
    showToast,
    selectedTaskIds,
    visibleTaskIds,
}: UseListViewProps): UseListViewReturn {

    const isTransactionsView = useMemo(() => {
        return settings.currentView === 'transactions';
    }, [settings.currentView]);

    useEffect(() => {
        if (isTransactionsView) {
            const transactionsCategory = settings.categories.find(c => c.name === 'Transactions');
            if (transactionsCategory && settings.activeCategoryId !== transactionsCategory.id) {
                setActiveCategoryId(transactionsCategory.id);
            }
        }
    }, [isTransactionsView, settings.categories, settings.activeCategoryId, setActiveCategoryId]);

    const { filteredTasks, filteredCompletedTasks } = useTaskFiltering({
        tasks, completedTasks, settings, searchQuery, isTransactionsView
    });

    const {
        nonTransactionTasksCount, tasksBeforeTaxFilter, transactionTotal,
        tasksForAccountCounting, transactionYears, uncategorizeTaxCount,
        uncategorizeIncomeCount
    } = useListViewCalculations({
        tasks, filteredTasks, settings, searchQuery, isTransactionsView
    });

    const {
        handleSortPillClick, handleCopyFilteredDetails, handleCopyFilteredTitles,
        handleCopyTitlesByCategory, handleCopyTransactionTitlesAsKeywords
    } = useListViewActions({ filteredTasks, settings, setSettings, showToast });

    useEffect(() => {
        setVisibleTaskIds(filteredTasks.map(task => task.id));
    }, [filteredTasks, setVisibleTaskIds]);

    const visibleCompletedTaskIds = useMemo(() => filteredCompletedTasks.map(task => task.id), [filteredCompletedTasks]);

    const {
        selectAllCheckboxRef, allVisibleSelected, someVisibleSelected, handleToggleSelectAll,
        selectAllCompletedCheckboxRef, allCompletedVisibleSelected, handleToggleSelectAllCompleted
    } = useSelectionManagement({
        visibleTaskIds, selectedTaskIds, setSelectedTaskIds, visibleCompletedTaskIds
    });

    const autoCategorizeCounts = useMemo(() => {
        if (!isTransactionsView) return {};
        const transactionsCategory = settings.categories.find(c => c.name === 'Transactions');
        if (!transactionsCategory) return {};
        const subCategoriesWithKeywords = settings.categories.filter(c => c.parentId === transactionsCategory.id && c.autoCategorizationKeywords && c.autoCategorizationKeywords.length > 0);
        const counts: { [key: string]: number } = {};
        const categorizableIds = new Set<number>();
        for (const subCat of subCategoriesWithKeywords) {
            counts[subCat.id] = 0;
            for (const task of filteredTasks) {
                if (task.categoryId !== subCat.id && (subCat.autoCategorizationKeywords || []).some(kw => task.text.toLowerCase().includes(kw.toLowerCase().trim()))) {
                    counts[subCat.id]++;
                    if (!categorizableIds.has(task.id)) categorizableIds.add(task.id);
                }
            }
        }
        counts['all'] = categorizableIds.size;
        return counts;
    }, [filteredTasks, settings.categories, isTransactionsView]);

    const autoTaxCategorizeCounts = useMemo(() => {
        if (!isTransactionsView || !settings.taxCategories || settings.taxCategories.length === 0) return {};
        const counts: { [key: string]: number } = {};
        const taggableIds = new Set<number>();

        for (const taxCat of settings.taxCategories) {
            counts[taxCat.id] = 0;
            for (const task of filteredTasks) {
                if (!task.taxCategoryId && (taxCat.keywords || []).some(kw => task.text.toLowerCase().includes(kw.toLowerCase().trim()))) {
                    counts[taxCat.id]++;
                    if (!taggableIds.has(task.id)) {
                        taggableIds.add(task.id);
                    }
                }
            }
        }
        counts['all'] = taggableIds.size;
        return counts;
    }, [filteredTasks, settings.taxCategories, isTransactionsView]);


    return {
        isTransactionsView,
        nonTransactionTasksCount,
        tasksBeforeTaxFilter,
        filteredTasks,
        filteredCompletedTasks,
        selectAllCheckboxRef,
        allVisibleSelected,
        someVisibleSelected,
        handleToggleSelectAll,
        handleSortPillClick,
        selectAllCompletedCheckboxRef,
        allCompletedVisibleSelected,
        handleToggleSelectAllCompleted,
        transactionTotal,
        tasksForAccountCounting,
        autoTaxCategorizeCounts,
        transactionYears,
        autoCategorizeCounts,
        uncategorizeTaxCount,
        uncategorizeIncomeCount,
        handleCopyFilteredDetails,
        handleCopyFilteredTitles,
        handleCopyTitlesByCategory,
        handleCopyTransactionTitlesAsKeywords,
    };
}