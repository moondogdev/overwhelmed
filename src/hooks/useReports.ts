import { useState, useMemo, useEffect } from 'react';
import { Task, Category, Account, Settings } from '../types';
import { formatTime, formatTimestamp } from '../utils';

interface UseReportsProps {
    tasks: Task[];
    completedTasks: Task[];
    settings: Settings;
    setSettings: (update: React.SetStateAction<Settings>) => void;
    showToast: (message: string) => void;
}

export function useReports({ tasks, completedTasks, settings, setSettings, showToast }: UseReportsProps) {
    const { categories } = settings;

    const [activeAccountId, setActiveAccountId] = useState<number | 'all'>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [activeCategoryId, setActiveCategoryId] = useState<number | 'all'>('all');
    const [activeSubCategoryId, setActiveSubCategoryId] = useState<number | 'all'>('all');
    const [activeTransactionTypeFilter, setActiveTransactionTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
    const [activeTaxCategoryId, setActiveTaxCategoryId] = useState<number | 'all'>('all');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Task | 'earnings' | 'categoryName' | 'completionDate', direction: 'ascending' | 'descending' } | null>({ key: 'completionDate', direction: 'descending' });
    const [taxSortConfig, setTaxSortConfig] = useState<{ key: 'name' | 'total' | 'count', direction: 'ascending' | 'descending' }>({ key: 'name', direction: 'ascending' });
    const [transactionSortConfig, setTransactionSortConfig] = useState<{ key: keyof Task | 'categoryName' | 'transactionAmount', direction: 'ascending' | 'descending' }>({ key: 'openDate', direction: 'descending' });
    const [historyCount, setHistoryCount] = useState<number>(20);

    const activeTab = settings.activeReportTab || 'summary';
    const selectedTaxYear = settings.selectedReportYear || null;

    // Effect to handle initial tab selection from navigation
    useEffect(() => {
        if (settings.initialReportTab) {
            handleTabChange(settings.initialReportTab);
            // Clear the initial tab setting so it doesn't trigger on subsequent views
            setSettings(prev => ({ ...prev, initialReportTab: undefined }));
        }
    }, [settings.initialReportTab]);

    const handleTabChange = (tab: 'summary' | 'earnings' | 'activity' | 'raw' | 'history' | 'finances' | 'taxes') => {
        setSettings(prev => ({ ...prev, activeReportTab: tab, selectedReportYear: null }));
        if (tab === 'finances' || tab === 'taxes') {
            const transactionsCategory = categories.find(c => c.name === 'Transactions');
            if (transactionsCategory) {
                setActiveCategoryId(transactionsCategory.id);
            }
        } else {
            setActiveAccountId('all');
            setActiveCategoryId('all');
            setActiveTransactionTypeFilter('all');
            setActiveTaxCategoryId('all');
        }
        setActiveSubCategoryId('all');
    };

    const handleExportCsv = () => {
        const header = [
            "Task ID", "Task Name", "Category", "Company",
            "Open Date", "Completion Date", "Time Tracked (HH:MM:SS)",
            "Pay Rate ($/hr)", "Earnings ($)"
        ];

        const rows = sortedFilteredTasks.map(task => {
            const category = categories.find(c => c.id === task.categoryId);
            const categoryName = category?.name || 'Uncategorized';
            const completionTime = task.createdAt + (task.completedDuration || 0);
            const earnings = (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)).toFixed(2);
            const escapeCsv = (str: string | undefined) => `"${(str || '').replace(/"/g, '""')}"`;

            return [
                task.id,
                escapeCsv(task.text),
                escapeCsv(categoryName),
                escapeCsv(task.company),
                formatTimestamp(task.openDate),
                formatTimestamp(completionTime),
                formatTime(task.manualTime || 0),
                task.payRate || 0,
                earnings
            ].join(',');
        });
        window.electronAPI.saveCsv([header.join(','), ...rows].join('\n'));
    };

    const requestSort = (key: keyof Task | 'earnings' | 'categoryName' | 'completionDate') => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: keyof Task | 'earnings' | 'categoryName' | 'completionDate') => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    };

    const requestTransactionSort = (key: keyof Task | 'categoryName' | 'transactionAmount') => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (transactionSortConfig && transactionSortConfig.key === key && transactionSortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setTransactionSortConfig({ key, direction });
    };

    const getTransactionSortIndicator = (key: keyof Task | 'categoryName' | 'transactionAmount') => {
        if (!transactionSortConfig || transactionSortConfig.key !== key) return null;
        return transactionSortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    };

    const requestTaxSort = (key: 'name' | 'total' | 'count') => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (taxSortConfig && taxSortConfig.key === key && taxSortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setTaxSortConfig({ key, direction });
    };


    const categoriesForFilter = useMemo(() => {
        if (activeTab !== 'finances' && activeTab !== 'taxes') {
            return categories;
        }
        const transactionsCategory = categories.find(c => c.name === 'Transactions');
        if (!transactionsCategory) {
            return [];
        }
        return [transactionsCategory, ...categories.filter(c => c.parentId === transactionsCategory.id)];
    }, [activeTab, categories]);

    const dateFilteredTasks = useMemo(() => {
        const sourceTasks = activeTab === 'finances' || activeTab === 'taxes' ? [...tasks, ...completedTasks] : completedTasks;
        return sourceTasks.filter(task => {
            let taskDate: number;
            if (activeTab === 'finances' || activeTab === 'taxes') {
                taskDate = task.openDate;
            } else {
                if (!task.completedDuration) return false;
                taskDate = task.createdAt + task.completedDuration;
            }
            const start = startDate ? new Date(startDate).getTime() : 0;
            const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
            return taskDate >= start && taskDate <= end;
        });
    }, [tasks, completedTasks, startDate, endDate, activeTab]);

    const filteredCompletedTasks = useMemo(() => dateFilteredTasks.filter(task => {
        if (activeCategoryId === 'all') return true;
        const activeCategory = categories.find(c => c.id === activeCategoryId);
        const parentId = activeCategory?.parentId || activeCategoryId;
        const subCategoriesForActive = categories.filter(c => c.parentId === parentId);
        if (activeSubCategoryId !== 'all') return task.categoryId === activeSubCategoryId;
        const categoryIdsToShow = [parentId, ...subCategoriesForActive.map(sc => sc.id)];
        return categoryIdsToShow.includes(task.categoryId);
    }), [dateFilteredTasks, activeCategoryId, activeSubCategoryId, categories]);

    const tasksForFinanceCounts = useMemo(() => {
        if (activeTab !== 'finances' && activeTab !== 'taxes') return dateFilteredTasks;
        if (activeCategoryId === 'all' || (categories.find(c => c.id === activeCategoryId)?.name !== 'Transactions')) {
            return dateFilteredTasks;
        }
        const activeCategory = categories.find(c => c.id === activeCategoryId);
        const parentId = activeCategory?.parentId || activeCategoryId;
        const subCategoriesForActive = categories.filter(c => c.parentId === parentId);
        if (activeSubCategoryId !== 'all') return dateFilteredTasks.filter(task => task.categoryId === activeSubCategoryId);
        const categoryIdsToShow = [parentId, ...subCategoriesForActive.map(sc => sc.id)];
        return dateFilteredTasks.filter(task => categoryIdsToShow.includes(task.categoryId));
    }, [dateFilteredTasks, activeTab, activeCategoryId, activeSubCategoryId, categories]);

    const sortedFilteredTasks = useMemo(() => {
        let sortableItems = [...filteredCompletedTasks];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue: any;
                let bValue: any;
                if (sortConfig.key === 'earnings') {
                    aValue = ((a.manualTime || 0) / (1000 * 60 * 60)) * (a.payRate || 0);
                    bValue = ((b.manualTime || 0) / (1000 * 60 * 60)) * (b.payRate || 0);
                } else if (sortConfig.key === 'categoryName') {
                    aValue = categories.find(c => c.id === a.categoryId)?.name || 'Uncategorized';
                    bValue = categories.find(c => c.id === b.categoryId)?.name || 'Uncategorized';
                } else if (sortConfig.key === 'completionDate') {
                    aValue = a.createdAt + (a.completedDuration || 0);
                    bValue = b.createdAt + (b.completedDuration || 0);
                } else {
                    aValue = a[sortConfig.key as keyof Task];
                    bValue = b[sortConfig.key as keyof Task];
                }
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredCompletedTasks, sortConfig, categories]);

    const grandTotalEarnings = useMemo(() => completedTasks.reduce((sum, task) => {
        const hours = (task.manualTime || 0) / (1000 * 60 * 60);
        return sum + (hours * (task.payRate || 0));
    }, 0), [completedTasks]);

    const grandTotalTasks = completedTasks.length;

    const grandTotalTimeTracked = useMemo(() => completedTasks.reduce((sum, task) => sum + (task.manualTime || 0), 0), [completedTasks]);

    const lifetimeFinancialSummary = useMemo(() => {
        const allTransactions = [...tasks, ...completedTasks].filter(task => task.transactionAmount && task.transactionAmount !== 0);
        let totalIncome = 0;
        let totalExpenses = 0;
        let totalTransfers = 0;
        for (const task of allTransactions) {
            const amount = task.transactionAmount || 0;
            if (task.transactionType === 'income') totalIncome += amount;
            else if (task.transactionType === 'expense') totalExpenses += Math.abs(amount);
            else if (task.transactionType === 'transfer' && amount < 0) totalTransfers += Math.abs(amount);
        }
        return { totalIncome, totalExpenses, totalTransfers, netProfit: totalIncome - totalExpenses };
    }, [tasks, completedTasks]);

    const lifetimeTaxDeductibleExpenses = useMemo(() => {
        const allTransactions = [...tasks, ...completedTasks];
        const taxCategorized = allTransactions.filter(task => task.taxCategoryId && (task.transactionAmount || 0) < 0);
        const total = taxCategorized.reduce((sum, task) => {
            const transactionCategory = settings.categories.find(c => c.id === task.categoryId);
            const taxCategory = settings.taxCategories?.find(tc => tc.id === task.taxCategoryId);
            const percentageValue = transactionCategory?.deductiblePercentage ?? taxCategory?.deductiblePercentage ?? 100;
            const percentage = percentageValue / 100;
            return sum + (Math.abs(task.transactionAmount || 0) * percentage);
        }, 0);
        return { total, count: taxCategorized.length };
    }, [tasks, completedTasks, settings.categories, settings.taxCategories]);

    const filteredTransactions = useMemo(() => {
        let transactions = dateFilteredTasks.filter(task => task.transactionAmount && task.transactionAmount !== 0);
        if (activeAccountId !== 'all') transactions = transactions.filter(task => task.accountId === activeAccountId);
        if (activeTransactionTypeFilter !== 'all') transactions = transactions.filter(task => task.transactionType === activeTransactionTypeFilter);
        if (activeTab === 'taxes' && activeTaxCategoryId !== 'all') transactions = transactions.filter(task => task.taxCategoryId === activeTaxCategoryId);
        if (activeCategoryId === 'all') return transactions;
        const activeCategory = categories.find(c => c.id === activeCategoryId);
        const parentId = activeCategory?.parentId || activeCategoryId;
        const subCategoriesForActive = categories.filter(c => c.parentId === parentId);
        if (activeSubCategoryId !== 'all') return transactions.filter(task => task.categoryId === activeSubCategoryId);
        const categoryIdsToShow = [parentId, ...subCategoriesForActive.map(sc => sc.id)];
        return transactions.filter(task => categoryIdsToShow.includes(task.categoryId));
    }, [dateFilteredTasks, activeCategoryId, activeSubCategoryId, categories, activeAccountId, activeTransactionTypeFilter, activeTab, activeTaxCategoryId]);

    const financialSummary = useMemo(() => {
        let totalIncome = 0;
        let totalExpenses = 0;
        let totalTransfers = 0;
        for (const task of filteredTransactions) {
            const amount = task.transactionAmount || 0;
            if (task.transactionType === 'income') totalIncome += amount;
            else if (task.transactionType === 'expense') totalExpenses += Math.abs(amount);
            else if (task.transactionType === 'transfer' && amount < 0) totalTransfers += Math.abs(amount);
        }
        return { totalIncome, totalExpenses, totalTransfers, netProfit: totalIncome - totalExpenses };
    }, [filteredTransactions]);

    const summaryByAccount = useMemo(() => {
        const accountSummary: { [accountId: string]: { name: string; totalIn: number; totalOut: number; net: number } } = {};
        filteredTransactions.forEach(task => {
            const accountId = task.accountId === undefined ? 'unassigned' : String(task.accountId);
            if (!accountSummary[accountId]) {
                const account = settings.accounts.find(a => String(a.id) === accountId);
                accountSummary[accountId] = { name: account ? account.name : 'Unassigned', totalIn: 0, totalOut: 0, net: 0 };
            }
            const amount = task.transactionAmount || 0;
            if (amount > 0) accountSummary[accountId].totalIn += amount;
            else accountSummary[accountId].totalOut += Math.abs(amount);
            accountSummary[accountId].net += amount;
        });
        return Object.values(accountSummary).sort((a, b) => a.name.localeCompare(b.name));
    }, [filteredTransactions, settings.accounts]);

    const mileageCalculation = useMemo(() => {
        const { vehicleGasCategoryId, vehicleGasPrice, vehicleMpgLow, vehicleMpgHigh } = settings;
        if (!vehicleGasCategoryId || !vehicleGasPrice || !vehicleMpgLow || !vehicleMpgHigh) return null;
        const totalSpentOnGas = filteredTransactions
            .filter(t => t.categoryId === vehicleGasCategoryId && t.transactionType === 'expense')
            .reduce((sum, t) => sum + Math.abs(t.transactionAmount || 0), 0);
        if (totalSpentOnGas === 0) return null;
        const gallons = totalSpentOnGas / vehicleGasPrice;
        const milesLow = gallons * vehicleMpgLow;
        const milesHigh = gallons * vehicleMpgHigh;
        const gasCategoryName = settings.categories.find(c => c.id === vehicleGasCategoryId)?.name || 'Selected Category';
        return { totalSpentOnGas, gasPricePerGallon: vehicleGasPrice, gasMpgLow: vehicleMpgLow, gasMpgHigh: vehicleMpgHigh, milesLow, milesHigh, gasCategoryName };
    }, [filteredTransactions, settings]);

    const taxCategorizedExpenses = useMemo(() => {
        if (!settings.taxCategories) return [];
        const summary: { [key: number]: { name: string; total: number; count: number } } = {};
        const expenseTransactions = filteredTransactions.filter(task => (task.transactionAmount || 0) < 0);
        for (const task of expenseTransactions) {
            if (task.taxCategoryId) {
                if (!summary[task.taxCategoryId]) {
                    const category = settings.taxCategories.find(tc => tc.id === task.taxCategoryId);
                    summary[task.taxCategoryId] = { name: category?.name || 'Unknown Category', total: 0, count: 0 };
                }
                summary[task.taxCategoryId].total += Math.abs(task.transactionAmount || 0);
                summary[task.taxCategoryId].count += 1;
            }
        }
        return Object.values(summary).sort((a, b) => {
            const { key, direction } = taxSortConfig;
            if (a[key] < b[key]) return direction === 'ascending' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }, [filteredTransactions, settings.taxCategories, taxSortConfig]);

    const transactionsByTaxCategory = useMemo(() => {
        if (activeTab !== 'taxes' || !settings.taxCategories) return new Map();
        const expenseTransactions = filteredTransactions.filter(task => (task.transactionAmount || 0) < 0);
        const grouped = new Map<number, { name: string; tasks: Task[]; total: number }>();
        for (const task of expenseTransactions) {
            if (task.taxCategoryId) {
                const category = settings.taxCategories.find(tc => tc.id === task.taxCategoryId);
                if (!grouped.has(task.taxCategoryId)) {
                    grouped.set(task.taxCategoryId, { name: category?.name || 'Unknown Category', tasks: [], total: 0 });
                }
                const group = grouped.get(task.taxCategoryId);
                if (group) {
                    const transactionCategory = settings.categories.find(c => c.id === task.categoryId);
                    group.tasks.push(task);
                    const percentageValue = transactionCategory?.deductiblePercentage ?? category?.deductiblePercentage ?? 100;
                    const percentage = percentageValue / 100;
                    group.total += (Math.abs(task.transactionAmount || 0) * percentage);
                }
            }
        }
        return grouped;
    }, [filteredTransactions, settings.taxCategories, activeTab, settings.categories]);

    const taxReportData = useMemo(() => {
        if (!selectedTaxYear || !settings.taxCategories) return null;
        const yearTasks = [...tasks, ...completedTasks].filter(task => new Date(task.openDate).getFullYear() === selectedTaxYear && (task.transactionAmount || 0) < 0 && task.taxCategoryId);
        const groupedByTaxCategory = yearTasks.reduce((acc, task) => {
            const catId = task.taxCategoryId;
            const taxCategory = settings.taxCategories.find(tc => tc.id === catId);
            const transactionCategory = settings.categories.find(c => c.id === task.categoryId);
            if (!acc[catId]) acc[catId] = { name: taxCategory?.name || 'Unknown', tasks: [], total: 0 };
            acc[catId].tasks.push(task);
            const percentageValue = transactionCategory?.deductiblePercentage ?? taxCategory?.deductiblePercentage ?? 100;
            const percentage = percentageValue / 100;
            acc[catId].total += (Math.abs(task.transactionAmount || 0) * percentage);
            return acc;
        }, {} as { [key: number]: { name: string; tasks: Task[]; total: number } });
        return Object.values(groupedByTaxCategory).sort((a, b) => a.name.localeCompare(b.name));
    }, [selectedTaxYear, tasks, completedTasks, settings.taxCategories, settings.categories]);

    const taxIncomeReportData = useMemo(() => {
        if (!selectedTaxYear) return null;
        const yearTasks = [...tasks, ...completedTasks].filter(task => new Date(task.openDate).getFullYear() === selectedTaxYear);
        const getTaskIncome = (task: Task) => ((task.transactionAmount || 0) > 0 ? (task.transactionAmount || 0) : 0) + ((task.completedDuration && (task.manualTime || 0) > 0 && (task.payRate || 0) > 0) ? (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)) : 0);
        const w2DataForYear = typeof selectedTaxYear === 'number' ? settings.w2Data?.[selectedTaxYear] : undefined;
        const w2TotalFromSettings = w2DataForYear?.wages || 0;
        const w2Tasks = yearTasks.filter(task => task.incomeType === 'w2' && getTaskIncome(task) > 0);
        const businessTasks = yearTasks.filter(task => task.incomeType === 'business' && getTaskIncome(task) > 0);
        const reimbursementTasks = yearTasks.filter(task => task.incomeType === 'reimbursement' && getTaskIncome(task) > 0);
        const w2TransactionsTotal = w2Tasks.reduce((sum, t) => sum + getTaskIncome(t), 0);
        return [
            { name: 'Business Income (1099)', tasks: businessTasks, total: businessTasks.reduce((sum, t) => sum + getTaskIncome(t), 0), transactionTotal: 0 },
            { name: 'W-2 Wages', tasks: w2Tasks, total: w2TotalFromSettings, transactionTotal: w2TransactionsTotal },
            { name: 'Reimbursements', tasks: reimbursementTasks, total: reimbursementTasks.reduce((sum, t) => sum + getTaskIncome(t), 0), transactionTotal: 0 }
        ].filter(group => group.tasks.length > 0);
    }, [selectedTaxYear, tasks, completedTasks, settings.w2Data]);

    const taxIncomeSummary = useMemo(() => {
        if (activeTab !== 'taxes') return { transactionalIncome: 0, trackedEarnings: 0 };
        let filteredForAccount = [...dateFilteredTasks];
        if (activeAccountId !== 'all') filteredForAccount = filteredForAccount.filter(task => task.accountId === activeAccountId);
        const w2Tasks = filteredForAccount.filter(task => task.incomeType === 'w2');
        const w2Earnings = w2Tasks.reduce((sum, task) => sum + ((task.completedDuration && (task.manualTime || 0) > 0 && (task.payRate || 0) > 0) ? (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)) : 0) + ((task.transactionAmount || 0) > 0 ? (task.transactionAmount || 0) : 0), 0);
        const businessTasks = filteredForAccount.filter(task => task.incomeType === 'business');
        const businessIncome = businessTasks.reduce((sum, task) => sum + ((task.completedDuration && (task.manualTime || 0) > 0 && (task.payRate || 0) > 0) ? (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)) : 0) + ((task.transactionAmount || 0) > 0 ? (task.transactionAmount || 0) : 0), 0);
        return { transactionalIncome: businessIncome, trackedEarnings: w2Earnings };
    }, [activeTab, dateFilteredTasks, activeAccountId]);

    const incomeByType = useMemo(() => {
        if (activeTab !== 'taxes') return [];
        const w2Tasks = dateFilteredTasks.filter(task => task.incomeType === 'w2' && ((task.transactionAmount || 0) > 0 || ((task.payRate || 0) > 0 && task.completedDuration)));
        const businessTasks = dateFilteredTasks.filter(task => task.incomeType === 'business' && ((task.transactionAmount || 0) > 0 || ((task.payRate || 0) > 0 && task.completedDuration)));
        const reimbursementTasks = dateFilteredTasks.filter(task => task.incomeType === 'reimbursement' && (task.transactionAmount || 0) > 0);
        const getTaskIncome = (task: Task) => ((task.transactionAmount || 0) > 0 ? (task.transactionAmount || 0) : 0) + ((task.completedDuration && (task.manualTime || 0) > 0 && (task.payRate || 0) > 0) ? (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)) : 0);
        return [
            { name: 'Business Income (1099)', tasks: businessTasks, total: businessTasks.reduce((sum, t) => sum + getTaskIncome(t), 0) },
            { name: 'W-2 Wages', tasks: w2Tasks, total: w2Tasks.reduce((sum, t) => sum + getTaskIncome(t), 0) },
            { name: 'Reimbursements', tasks: reimbursementTasks, total: reimbursementTasks.reduce((sum, t) => sum + getTaskIncome(t), 0) }
        ].filter(group => group.tasks.length > 0);
    }, [activeTab, dateFilteredTasks]);

    const cashFlowData = useMemo(() => {
        const dailyData: { [date: string]: { income: number; expenses: number } } = {};
        for (const task of filteredTransactions) {
            const date = new Date(task.openDate).toLocaleDateString();
            const amount = task.transactionAmount || 0;
            if (!dailyData[date]) dailyData[date] = { income: 0, expenses: 0 };
            if (amount > 0) dailyData[date].income += amount;
            else dailyData[date].expenses += Math.abs(amount);
        }
        return Object.entries(dailyData)
            .map(([date, { income, expenses }]) => ({ date, income, expenses, net: income - expenses }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [filteredTransactions]);

    const sortedTransferTransactions = useMemo(() => {
        const transfers = filteredTransactions.filter(task => task.transactionType === 'transfer');
        return [...transfers].sort((a, b) => {
            let aValue: any;
            let bValue: any;
            if (transactionSortConfig.key === 'categoryName') {
                aValue = categories.find(c => c.id === a.categoryId)?.name || 'Uncategorized';
                bValue = categories.find(c => c.id === b.categoryId)?.name || 'Uncategorized';
            } else {
                aValue = a[transactionSortConfig.key as keyof Task];
                bValue = b[transactionSortConfig.key as keyof Task];
            }
            if (aValue < bValue) return transactionSortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return transactionSortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }, [filteredTransactions, transactionSortConfig, categories]);

    const transfersByCategory = useMemo(() => {
        const categorySummary: { [categoryId: number]: { name: string; sent: number; received: number; net: number } } = {};
        sortedTransferTransactions.forEach(task => {
            const categoryId = task.categoryId;
            if (!categoryId) return;
            if (!categorySummary[categoryId]) {
                const category = categories.find(c => c.id === categoryId);
                categorySummary[categoryId] = { name: category?.name || 'Uncategorized', sent: 0, received: 0, net: 0 };
            }
            const amount = task.transactionAmount || 0;
            if (amount < 0) categorySummary[categoryId].sent += Math.abs(amount);
            else categorySummary[categoryId].received += amount;
            categorySummary[categoryId].net += amount;
        });
        return Object.values(categorySummary).sort((a, b) => a.name.localeCompare(b.name));
    }, [sortedTransferTransactions, categories]);

    const transferSummary = useMemo(() => {
        const sent = sortedTransferTransactions.filter(t => (t.transactionAmount || 0) < 0).reduce((sum, t) => sum + Math.abs(t.transactionAmount || 0), 0);
        const received = sortedTransferTransactions.filter(t => (t.transactionAmount || 0) > 0).reduce((sum, t) => sum + (t.transactionAmount || 0), 0);
        return { sent, received, net: received - sent };
    }, [sortedTransferTransactions]);

    const sortedTransactions = useMemo(() => {
        return [...filteredTransactions].sort((a, b) => {
            let aValue: any;
            let bValue: any;
            if (transactionSortConfig.key === 'categoryName') {
                aValue = categories.find(c => c.id === a.categoryId)?.name || 'Uncategorized';
                bValue = categories.find(c => c.id === b.categoryId)?.name || 'Uncategorized';
            } else {
                aValue = a[transactionSortConfig.key as keyof Task];
                bValue = b[transactionSortConfig.key as keyof Task];
            }
            if (aValue < bValue) return transactionSortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return transactionSortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }, [filteredTransactions, transactionSortConfig, categories]);

    const incomeExpenseData = useMemo(() => [
        { name: 'Income', value: financialSummary.totalIncome },
        { name: 'Expenses', value: financialSummary.totalExpenses },
        { name: 'Transfers', value: financialSummary.totalTransfers },
    ], [financialSummary]);

    const completionsByDay = useMemo(() => filteredCompletedTasks.reduce((acc, task) => {
        const completionDate = new Date(task.createdAt + (task.completedDuration || 0)).toLocaleDateString();
        acc[completionDate] = (acc[completionDate] || 0) + 1;
        return acc;
    }, {} as Record<string, number>), [filteredCompletedTasks]);

    const completionsByName = useMemo(() => filteredCompletedTasks.reduce((acc, task) => {
        acc[task.text] = (acc[task.text] || 0) + 1;
        return acc;
    }, {} as Record<string, number>), [filteredCompletedTasks]);

    const completionsByCategory = useMemo(() => filteredCompletedTasks.reduce((acc, task) => {
        const category = categories.find(c => c.id === task.categoryId);
        const categoryName = category?.name || 'Uncategorized';
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>), [filteredCompletedTasks, categories]);

    const totalTasksCompleted = filteredCompletedTasks.length;

    const totalTimeTracked = useMemo(() => filteredCompletedTasks.reduce((sum, task) => sum + (task.manualTime || 0), 0), [filteredCompletedTasks]);

    const totalEarnings = useMemo(() => filteredCompletedTasks.reduce((sum, task) => {
        const hours = (task.manualTime || 0) / (1000 * 60 * 60);
        return sum + (hours * (task.payRate || 0));
    }, 0), [filteredCompletedTasks]);

    const earningsByCategory = useMemo(() => filteredCompletedTasks.reduce((acc, task) => {
        const category = categories.find(c => c.id === task.categoryId);
        const categoryName = category?.name || 'Uncategorized';
        const hours = (task.manualTime || 0) / (1000 * 60 * 60);
        const earnings = hours * (task.payRate || 0);
        acc[categoryName] = (acc[categoryName] || 0) + earnings;
        return acc;
    }, {} as Record<string, number>), [filteredCompletedTasks, categories]);

    const earningsOverTime = useMemo(() => filteredCompletedTasks.reduce((acc, task) => {
        const completionDate = new Date(task.createdAt + (task.completedDuration || 0)).toLocaleDateString();
        const hours = (task.manualTime || 0) / (1000 * 60 * 60);
        const earnings = hours * (task.payRate || 0);
        acc[completionDate] = (acc[completionDate] || 0) + earnings;
        return acc;
    }, {} as Record<string, number>), [filteredCompletedTasks]);

    const activityByDay = useMemo(() => filteredCompletedTasks.reduce((acc, task) => {
        if (task.completedDuration) {
            const completionDate = new Date(task.createdAt + task.completedDuration).toLocaleDateString();
            acc[completionDate] = (acc[completionDate] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>), [filteredCompletedTasks]);


    const earningsByCategoryPieData = useMemo(() =>
        Object.entries(earningsByCategory).map(([name, value]) => ({ name, value })),
        [earningsByCategory]
    );

    const earningsOverTimeLineData = useMemo(() =>
        Object.entries(earningsOverTime)
            .map(([date, earnings]) => ({ date, earnings }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        [earningsOverTime]
    );

    const completionsByCategoryPieData = useMemo(() =>
        Object.entries(completionsByCategory).map(([name, value]) => ({ name, value })),
        [completionsByCategory]
    );

    const completionsByDayChartData = useMemo(() =>
        Object.entries(completionsByDay).map(([date, count]) => ({ date, count })),
        [completionsByDay]
    );

    const completionsByCategoryChartData = useMemo(() =>
        Object.entries(completionsByCategory).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        [completionsByCategory]
    );

    const completionsByNameChartData = useMemo(() =>
        Object.entries(completionsByName).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 15),
        [completionsByName]
    );


    return {
        activeAccountId, setActiveAccountId,
        startDate, setStartDate,
        endDate, setEndDate,
        activeCategoryId, setActiveCategoryId,
        activeSubCategoryId, setActiveSubCategoryId,
        activeTransactionTypeFilter, setActiveTransactionTypeFilter,
        activeTaxCategoryId, setActiveTaxCategoryId,
        sortConfig, setSortConfig,
        taxSortConfig, setTaxSortConfig,
        transactionSortConfig, setTransactionSortConfig,
        historyCount, setHistoryCount,
        activeTab,
        selectedTaxYear,
        handleTabChange,
        handleExportCsv,
        requestSort,
        getSortIndicator,
        requestTransactionSort,
        getTransactionSortIndicator,
        requestTaxSort,
        categoriesForFilter,
        dateFilteredTasks,
        filteredCompletedTasks,
        tasksForFinanceCounts,
        sortedFilteredTasks,
        grandTotalEarnings,
        grandTotalTasks,
        grandTotalTimeTracked,
        lifetimeFinancialSummary,
        lifetimeTaxDeductibleExpenses,
        filteredTransactions,
        financialSummary,
        summaryByAccount,
        mileageCalculation,
        taxCategorizedExpenses,
        transactionsByTaxCategory,
        taxReportData,
        taxIncomeReportData,
        taxIncomeSummary,
        incomeByType,
        cashFlowData,
        sortedTransferTransactions,
        transfersByCategory,
        transferSummary,
        sortedTransactions,
        incomeExpenseData,
        completionsByDay,
        completionsByName,
        completionsByCategory,
        totalTasksCompleted,
        totalTimeTracked,
        totalEarnings,
        earningsByCategory,
        earningsOverTime,
        activityByDay,
        earningsByCategoryPieData,
        earningsOverTimeLineData,
        completionsByCategoryPieData,
        completionsByDayChartData,
        completionsByCategoryChartData,
        completionsByNameChartData,
    };
}