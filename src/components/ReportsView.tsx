import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { Task, Category, Account } from '../types';
import { formatTime, formatTimestamp } from '../utils';
import './styles/ReportsView.css';
import { useAppContext } from '../contexts/AppContext';
import { SimpleAccordion } from './SidebarComponents';

// --- Chart Helper ---
const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, payload } = props;
  const { name } = payload;

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6; // Adjust label position
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// --- Sub-Components ---
function ReportFilters({ startDate, setStartDate, endDate, setEndDate, onExportCsv, exportDisabled = false, categories, activeCategoryId, setActiveCategoryId, activeSubCategoryId, activeTab, accounts, activeAccountId, setActiveAccountId, activeTransactionTypeFilter, setActiveTransactionTypeFilter, tasksForCounting, setActiveSubCategoryId, dateFilteredTasks, activeTaxCategoryId, setActiveTaxCategoryId }: {
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  onExportCsv: () => void;
  exportDisabled?: boolean;
  categories: Category[];
  activeCategoryId: number | 'all';
  setActiveCategoryId: (id: number | 'all') => void;
  activeSubCategoryId: number | 'all';
  activeTransactionTypeFilter: 'all' | 'income' | 'expense' | 'transfer';
  setActiveTransactionTypeFilter: (type: 'all' | 'income' | 'expense' | 'transfer') => void;
  tasksForCounting: Task[];
  activeTab: string;
  accounts: Account[];
  activeAccountId: number | 'all';
  setActiveAccountId: (id: number | 'all') => void;
  activeTaxCategoryId: number | 'all';
  setActiveTaxCategoryId: (id: number | 'all') => void;
  setActiveSubCategoryId: (id: number | 'all') => void;
  dateFilteredTasks: Task[];
}) {
  const parentCategories = categories.filter(c => !c.parentId);
  const subCategoriesForActive = activeCategoryId !== 'all' ? categories.filter(c => c.parentId === activeCategoryId) : [];

  return (
    <>
      <div className="report-filters">
        <label>
          Start Date:
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          End Date:
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <button onClick={() => { setStartDate(''); setEndDate(''); }} className="clear-filter-btn">
          Clear Filter
        </button>
        <button onClick={onExportCsv} className="export-csv-btn" disabled={exportDisabled}>
          Export to CSV
        </button>
      </div>
      {activeTab !== 'finances' && activeTab !== 'taxes' ? (
        <div className="category-tabs">
          <button onClick={() => { setActiveCategoryId('all'); setActiveSubCategoryId('all'); }} className={activeCategoryId === 'all' ? 'active' : ''}>
            All ({dateFilteredTasks.length})
          </button>
          {parentCategories.map((cat: Category) => {
            const subCatIds = categories.filter(sc => sc.parentId === cat.id).map(sc => sc.id);
            const count = dateFilteredTasks.filter(t => t.categoryId === cat.id || (t.categoryId && subCatIds.includes(t.categoryId))).length;
            return (
              <button key={cat.id} onClick={() => { setActiveCategoryId(cat.id); setActiveSubCategoryId('all'); }} className={activeCategoryId === cat.id ? 'active' : ''}>
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      ) : (
        <div className="report-filter-title-container">
          <h4 className="report-filter-title">Filter by Category:</h4>
        </div>
      )}
      {subCategoriesForActive.length > 0 && (
        <div className="sub-category-tabs">
          {(() => {
            const parentCategory = categories.find(c => c.id === activeCategoryId);
            const subCatIds = categories.filter(sc => sc.parentId === parentCategory?.id).map(sc => sc.id);
            const totalCount = dateFilteredTasks.filter(t => t.categoryId === parentCategory?.id || (t.categoryId && subCatIds.includes(t.categoryId))).length;
            return (
              <button onClick={() => setActiveSubCategoryId('all')} className={activeSubCategoryId === 'all' ? 'active' : ''}>All ({totalCount})</button>
            );
          })()}
          {subCategoriesForActive.map(subCat => {
            const count = dateFilteredTasks.filter(t => t.categoryId === subCat.id).length;
            if (activeTab === 'finances' && count === 0) {
              return null;
            }
            return (
              <button key={subCat.id} onClick={() => setActiveSubCategoryId(subCat.id)} className={activeSubCategoryId === subCat.id ? 'active' : ''}>
                {subCat.name} ({count})
              </button>
            );
          })}
        </div>
      )}
      {(activeTab === 'finances' || activeTab === 'taxes') && accounts.length > 0 && (
        <div className="category-tabs">
          <button onClick={() => setActiveAccountId('all')} className={activeAccountId === 'all' ? 'active' : ''}>
            All Accounts ({tasksForCounting.filter(t => t.transactionAmount && (activeTab === 'taxes' ? t.transactionAmount < 0 : true)).length})
          </button>
          {accounts.map(account => {
            const count = tasksForCounting.filter(t => t.accountId === account.id && (activeTab === 'taxes' ? t.transactionAmount < 0 : true)).length;
            return (<button key={account.id} onClick={() => setActiveAccountId(account.id)} className={activeAccountId === account.id ? 'active' : ''}>{account.name} ({count})</button>);
          })}
        </div>
      )}
      {(activeTab === 'finances' || activeTab === 'taxes') && (
        <div className="report-filter-group filter-group-transaction-type" style={{border: '0px solid var(--border-color)'}}>
          {
            //<span className="list-filter-title" style={{alignSelf: 'center'}}>Filter by Type:</span>
          }
          <div className="category-tabs">
            <button onClick={() => setActiveTransactionTypeFilter('all')} className={activeTransactionTypeFilter === 'all' ? 'active' : ''}>
              All ({tasksForCounting.filter(t => t.transactionAmount && (activeAccountId === 'all' || t.accountId === activeAccountId)).length})
            </button>
            <button onClick={() => setActiveTransactionTypeFilter('income')} className={activeTransactionTypeFilter === 'income' ? 'active' : ''}>
              Income ({tasksForCounting.filter(t => t.transactionType === 'income' && (activeAccountId === 'all' || t.accountId === activeAccountId)).length})
            </button>
            <button onClick={() => setActiveTransactionTypeFilter('expense')} className={activeTransactionTypeFilter === 'expense' ? 'active' : ''}>
              Expense ({tasksForCounting.filter(t => t.transactionType === 'expense' && (activeAccountId === 'all' || t.accountId === activeAccountId)).length})
            </button>
            <button onClick={() => setActiveTransactionTypeFilter('transfer')} className={activeTransactionTypeFilter === 'transfer' ? 'active' : ''}>
              Transfers ({tasksForCounting.filter(t => t.transactionType === 'transfer' && (activeAccountId === 'all' || t.accountId === activeAccountId)).length})
            </button>
          </div>
        </div>
      )}
      {activeTab === 'taxes' && categories.length > 0 && (
        <div className="category-tabs tax-category-tabs">
          <button onClick={() => setActiveTaxCategoryId('all')} className={activeTaxCategoryId === 'all' ? 'active' : ''}>
            All Tax Categories
          </button>
          {categories.map(taxCat => {
            // In reports, tasksForCounting is the relevant source for counts
            const count = tasksForCounting.filter(t => t.taxCategoryId === taxCat.id && (t.transactionAmount || 0) < 0).length;
            if (count === 0) return null;
            return (<button key={taxCat.id} onClick={() => setActiveTaxCategoryId(taxCat.id)} className={activeTaxCategoryId === taxCat.id ? 'active' : ''}>{taxCat.name} ({count})</button>);
          })}
        </div>
      )}
    </>
  );
}

// --- Main Exported Component ---
export function ReportsView() {
  const { tasks, completedTasks, settings, setSettings, showToast, navigateToTask } = useAppContext();
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

  // Effect to handle initial tab selection from navigation
  useEffect(() => {
    if (settings.initialReportTab) {
      handleTabChange(settings.initialReportTab);
      // Clear the initial tab setting so it doesn't trigger on subsequent views
      // Use a functional update to avoid dependency on setSettings
      setSettings(prev => ({ ...prev, initialReportTab: undefined }));
    }
  }, [settings.initialReportTab]);

  const activeTab = settings.activeReportTab || 'summary';
  const selectedTaxYear = settings.selectedReportYear || null;

  const handleTabChange = (tab: 'summary' | 'earnings' | 'activity' | 'raw' | 'history' | 'finances' | 'taxes') => {    
    // Update the global settings instead of local state
    setSettings(prev => ({ ...prev, activeReportTab: tab, selectedReportYear: null }));
    if (tab === 'finances' || tab === 'taxes') {
      const transactionsCategory = categories.find(c => c.name === 'Transactions');
      if (transactionsCategory) {
        setActiveCategoryId(transactionsCategory.id);
      }
    } else {
      // Reset filters when leaving the finances tab
      setActiveAccountId('all');
      setActiveCategoryId('all');
      setActiveTransactionTypeFilter('all');
      setActiveTaxCategoryId('all');
    }
    setActiveSubCategoryId('all');
  };

  const categoriesForFilter = useMemo(() => {
    if (activeTab !== 'finances' && activeTab !== 'taxes') {
      return categories; // For all other tabs, show all categories.
    }

    // For the Finances tab, only show the "Transactions" category and its children.
    const transactionsCategory = categories.find(c => c.name === 'Transactions');
    if (!transactionsCategory) {
      return []; // Return empty if "Transactions" category doesn't exist.
    }

    return [transactionsCategory, ...categories.filter(c => c.parentId === transactionsCategory.id)];
  }, [activeTab, categories]);

  // First, filter by date range
  const dateFilteredTasks = useMemo(() => {
    // For finances, we want to filter ALL tasks (open and completed) by their openDate.
    // For other reports, we filter COMPLETED tasks by their completionDate.    
    const sourceTasks = activeTab === 'finances' || activeTab === 'taxes' ? [...tasks, ...completedTasks] : completedTasks;

    return sourceTasks.filter(task => {
      let taskDate: number;
      if (activeTab === 'finances' || activeTab === 'taxes') {
        taskDate = task.openDate; // Use openDate for transactions
      } else {
        if (!task.completedDuration) return false;
        taskDate = task.createdAt + task.completedDuration; // Use completionDate for other reports
      }

      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
      return taskDate >= start && taskDate <= end;
    });
  }, [tasks, completedTasks, startDate, endDate, activeTab]);

  // Then, filter by the selected category
  const filteredCompletedTasks = dateFilteredTasks.filter(task => {
    if (activeCategoryId === 'all') return true;

    const activeCategory = categories.find(c => c.id === activeCategoryId);
    const parentId = activeCategory?.parentId || activeCategoryId;
    const subCategoriesForActive = categories.filter(c => c.parentId === parentId);

    if (activeSubCategoryId !== 'all') return task.categoryId === activeSubCategoryId;

    const categoryIdsToShow = [parentId, ...subCategoriesForActive.map(sc => sc.id)];
    return categoryIdsToShow.includes(task.categoryId);
  });

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

  // Then, sort the data for the table
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

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredCompletedTasks, sortConfig, categories]);

  // Calculate grand total earnings from ALL completed tasks, ignoring filters
  const grandTotalEarnings = completedTasks.reduce((sum, task) => {
    const hours = (task.manualTime || 0) / (1000 * 60 * 60);
    return sum + (hours * (task.payRate || 0));
  }, 0);

  // Calculate grand total tasks from ALL completed tasks, ignoring filters
  const grandTotalTasks = completedTasks.length;

  // Calculate grand total time tracked from ALL completed tasks, ignoring filters
  const grandTotalTimeTracked = completedTasks.reduce((sum, task) => sum + (task.manualTime || 0), 0);

  // --- NEW: Lifetime Financial Summary Calculation ---
  const lifetimeFinancialSummary = useMemo(() => {
    const allTransactions = [...tasks, ...completedTasks].filter(task => task.transactionAmount && task.transactionAmount !== 0);
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalTransfers = 0;

    for (const task of allTransactions) {
      const amount = task.transactionAmount || 0;
      if (task.transactionType === 'income') {
        totalIncome += amount;
      } else if (task.transactionType === 'expense') {
        totalExpenses += Math.abs(amount);
      } else if (task.transactionType === 'transfer') {
        if (amount < 0) { // Only sum up outgoing (negative) transfers
          totalTransfers += Math.abs(amount);
        }
      }
    }

    return {
      totalIncome,
      totalExpenses,
      totalTransfers,
      netProfit: totalIncome - totalExpenses,
    };
  }, [tasks, completedTasks]);

  // --- NEW: Lifetime Tax Summary Calculation ---
  const lifetimeTaxDeductibleExpenses = useMemo(() => {
    const allTransactions = [...tasks, ...completedTasks];
    const taxCategorized = allTransactions.filter(task => 
      task.taxCategoryId && (task.transactionAmount || 0) < 0
    );
    const total = taxCategorized.reduce((sum, task) => {
      const transactionCategory = settings.categories.find(c => c.id === task.categoryId);
      const taxCategory = settings.taxCategories?.find(tc => tc.id === task.taxCategoryId);
      // Prioritize the transaction category's percentage, then fall back to the tax category's, then default to 100.
      const percentageValue = transactionCategory?.deductiblePercentage ?? taxCategory?.deductiblePercentage ?? 100;
      const percentage = percentageValue / 100;
      return sum + (Math.abs(task.transactionAmount || 0) * percentage);
    }, 0);
    const count = taxCategorized.length;
    return { total, count };
  }, [tasks, completedTasks]);


  // --- NEW: Financial Summary Calculation ---
  const filteredTransactions = useMemo(() => {
    let transactions = dateFilteredTasks.filter(task => task.transactionAmount && task.transactionAmount !== 0);

    // Filter by account first
    if (activeAccountId !== 'all') {
      transactions = transactions.filter(task => task.accountId === activeAccountId);
    }

    // Then filter by transaction type
    if (activeTransactionTypeFilter !== 'all') {
      if (activeTransactionTypeFilter === 'income') { // Already correct
        transactions = transactions.filter(task => task.transactionType === 'income');
      } else if (activeTransactionTypeFilter === 'expense') { // Already correct
        transactions = transactions.filter(task => task.transactionType === 'expense');
      } else if (activeTransactionTypeFilter === 'transfer') { // Already correct
        transactions = transactions.filter(task => task.transactionType === 'transfer');
      }
    }

    // Filter by tax category if one is selected
    if (activeTab === 'taxes' && activeTaxCategoryId !== 'all') {
      transactions = transactions.filter(task => task.taxCategoryId === activeTaxCategoryId);
    }

    if (activeCategoryId === 'all') {
      return transactions;
    }

    const activeCategory = categories.find(c => c.id === activeCategoryId);
    const parentId = activeCategory?.parentId || activeCategoryId;
    const subCategoriesForActive = categories.filter(c => c.parentId === parentId);

    if (activeSubCategoryId !== 'all') {
      return transactions.filter(task => task.categoryId === activeSubCategoryId);
    }

    const categoryIdsToShow = [parentId, ...subCategoriesForActive.map(sc => sc.id)];
    return transactions.filter(task => categoryIdsToShow.includes(task.categoryId));
  }, [dateFilteredTasks, activeCategoryId, activeSubCategoryId, categories, activeAccountId, activeTransactionTypeFilter, activeTab, activeTaxCategoryId]);

  const financialSummary = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalTransfers = 0;

    for (const task of filteredTransactions) {
      const amount = task.transactionAmount || 0;
      if (task.transactionType === 'income') {
        totalIncome += amount;
      } else if (task.transactionType === 'expense') {
        totalExpenses += Math.abs(amount);
      } else if (task.transactionType === 'transfer') {
        if (amount < 0) { // Only sum up outgoing (negative) transfers
          totalTransfers += Math.abs(amount);
        }
      }
    }

    return {
      totalIncome,
      totalExpenses,
      totalTransfers,
      netProfit: totalIncome - totalExpenses,
    };
  }, [filteredTransactions]);

  const summaryByAccount = useMemo(() => {
    const accountSummary: { [accountId: string]: { name: string; totalIn: number; totalOut: number; net: number } } = {};

    filteredTransactions.forEach(task => {
      const accountId = task.accountId === undefined ? 'unassigned' : String(task.accountId);

      if (!accountSummary[accountId]) {
        const account = settings.accounts.find(a => String(a.id) === accountId);
        accountSummary[accountId] = {
          name: account ? account.name : 'Unassigned',
          totalIn: 0,
          totalOut: 0,
          net: 0,
        };
      }

      const amount = task.transactionAmount || 0;
      if (amount > 0) {
        accountSummary[accountId].totalIn += amount;
      } else {
        accountSummary[accountId].totalOut += Math.abs(amount);
      }
      // Net change includes income, expenses, and transfers
      accountSummary[accountId].net += amount;
    });
    return Object.values(accountSummary).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredTransactions, settings.accounts]);

  const mileageCalculation = useMemo(() => {
    const { vehicleGasCategoryId, vehicleGasPrice, vehicleMpgLow, vehicleMpgHigh } = settings;
    if (!vehicleGasCategoryId || !vehicleGasPrice || !vehicleMpgLow || !vehicleMpgHigh) {
      return null;
    }

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

    // We only care about expenses for tax deductions
    const expenseTransactions = filteredTransactions.filter(task => (task.transactionAmount || 0) < 0);

    for (const task of expenseTransactions) {
      if (task.taxCategoryId) {
        if (!summary[task.taxCategoryId]) {
          const category = settings.taxCategories.find(tc => tc.id === task.taxCategoryId);
          summary[task.taxCategoryId] = {
            name: category?.name || 'Unknown Category',
            total: 0,
            count: 0,
          };
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
          grouped.set(task.taxCategoryId, {
            name: category?.name || 'Unknown Category',
            tasks: [],
            total: 0,
          });
        }
        const group = grouped.get(task.taxCategoryId);
        if (group) {
          const transactionCategory = settings.categories.find(c => c.id === task.categoryId);
          group.tasks.push(task);
          // Prioritize the transaction category's percentage, then fall back to the tax category's, then default to 100.
          const percentageValue = transactionCategory?.deductiblePercentage ?? category?.deductiblePercentage ?? 100;
          const percentage = percentageValue / 100;
          group.total += (Math.abs(task.transactionAmount || 0) * percentage);
        }
      }
    }
    return grouped;
  }, [filteredTransactions, settings.taxCategories, activeTab]);

  const taxReportData = useMemo(() => {
    if (!selectedTaxYear || !settings.taxCategories) return null;

    const yearTasks = [...tasks, ...completedTasks].filter(task => {
      const taskYear = new Date(task.openDate).getFullYear();
      return taskYear === selectedTaxYear && (task.transactionAmount || 0) < 0 && task.taxCategoryId;
    });

    const groupedByTaxCategory = yearTasks.reduce((acc, task) => {
      const catId = task.taxCategoryId;
      const taxCategory = settings.taxCategories.find(tc => tc.id === catId);
      const transactionCategory = settings.categories.find(c => c.id === task.categoryId);
      if (!acc[catId]) {
        acc[catId] = { name: taxCategory?.name || 'Unknown', tasks: [], total: 0 };
      }
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

    const yearTasks = [...tasks, ...completedTasks].filter(task => {
      const taskYear = new Date(task.openDate).getFullYear();
      return taskYear === selectedTaxYear;
    });

    const getTaskIncome = (task: Task) => ((task.transactionAmount || 0) > 0 ? (task.transactionAmount || 0) : 0) + ((task.completedDuration && (task.manualTime || 0) > 0 && (task.payRate || 0) > 0) ? (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)) : 0);

    // Get W-2 data from settings for the selected year
    const w2DataForYear = settings.w2Data?.[selectedTaxYear];
    const w2TotalFromSettings = w2DataForYear?.wages || 0;

    // Find all relevant tasks for the year
    const w2Tasks = yearTasks.filter(task => task.incomeType === 'w2' && getTaskIncome(task) > 0);
    const businessTasks = yearTasks.filter(task => task.incomeType === 'business' && getTaskIncome(task) > 0);
    const reimbursementTasks = yearTasks.filter(task => task.incomeType === 'reimbursement' && getTaskIncome(task) > 0);

    const w2TransactionsTotal = w2Tasks.reduce((sum, t) => sum + getTaskIncome(t), 0);

    return [
      { name: 'Business Income (1099)', tasks: businessTasks, total: businessTasks.reduce((sum, t) => sum + getTaskIncome(t), 0) },
      // The main total comes from settings, but we also pass the transaction total for display.
      { name: 'W-2 Wages', tasks: w2Tasks, total: w2TotalFromSettings, transactionTotal: w2TransactionsTotal },
      { name: 'Reimbursements', tasks: reimbursementTasks, total: reimbursementTasks.reduce((sum, t) => sum + getTaskIncome(t), 0) }
    ].filter(group => group.tasks.length > 0);
  }, [selectedTaxYear, tasks, completedTasks, settings.w2Data]);
  // --- NEW: Cash Flow Over Time Calculation ---
  const taxIncomeSummary = useMemo(() => {
    if (activeTab !== 'taxes') return { transactionalIncome: 0, trackedEarnings: 0 };

    let filteredForAccount = [...dateFilteredTasks];
    if (activeAccountId !== 'all') {
      filteredForAccount = filteredForAccount.filter(task => task.accountId === activeAccountId);
    }

    // 1. W-2 Wages: Sum of time-tracked earnings AND manual transactions marked as 'w2'.
    const w2Tasks = filteredForAccount.filter(task => task.incomeType === 'w2');
    const w2Earnings = w2Tasks
      .reduce((sum, task) => {
        const tracked = (task.completedDuration && (task.manualTime || 0) > 0 && (task.payRate || 0) > 0) ? (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)) : 0;
        const transactional = (task.transactionAmount || 0) > 0 ? (task.transactionAmount || 0) : 0;
        return sum + tracked + transactional;
      }, 0);

    // 2. Business Income: Sum of time-tracked earnings AND manual transactions marked as 'business'.
    const businessTasks = filteredForAccount.filter(task => task.incomeType === 'business');
    const businessIncome = businessTasks.reduce((sum, task) => {
        const tracked = (task.completedDuration && (task.manualTime || 0) > 0 && (task.payRate || 0) > 0) ? (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)) : 0;
        const transactional = (task.transactionAmount || 0) > 0 ? (task.transactionAmount || 0) : 0;
        return sum + tracked + transactional;
    }, 0);

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

      if (!dailyData[date]) {
        dailyData[date] = { income: 0, expenses: 0 };
      }

      if (amount > 0) {
        dailyData[date].income += amount;
      } else {
        dailyData[date].expenses += Math.abs(amount);
      }
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
      
      if (aValue < bValue) {
        return transactionSortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return transactionSortConfig.direction === 'ascending' ? 1 : -1;
      }
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
        categorySummary[categoryId] = {
          name: category?.name || 'Uncategorized',
          sent: 0,
          received: 0,
          net: 0,
        };
      }

      const amount = task.transactionAmount || 0;
      if (amount < 0) categorySummary[categoryId].sent += Math.abs(amount);
      else categorySummary[categoryId].received += amount;
      categorySummary[categoryId].net += amount;
    });
    return Object.values(categorySummary).sort((a, b) => a.name.localeCompare(b.name));
  }, [sortedTransferTransactions, categories]);

  
  
  const transferSummary = useMemo(() => {
    const sent = sortedTransferTransactions
      .filter(t => (t.transactionAmount || 0) < 0)
      .reduce((sum, t) => sum + Math.abs(t.transactionAmount || 0), 0);
    
    const received = sortedTransferTransactions
      .filter(t => (t.transactionAmount || 0) > 0)
      .reduce((sum, t) => sum + (t.transactionAmount || 0), 0);

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

      if (aValue < bValue) {
        return transactionSortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return transactionSortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredTransactions, transactionSortConfig, categories]);

  const incomeExpenseData = [
    { name: 'Income', value: financialSummary.totalIncome },
    { name: 'Expenses', value: financialSummary.totalExpenses },
    { name: 'Transfers', value: financialSummary.totalTransfers },
  ];
  const PIE_CHART_COLORS = ['#28a745', '#dc3545', '#ffc107']; // Green for Income, Red for Expense, Yellow for Transfers

  if (filteredCompletedTasks.length === 0 && activeTab !== 'finances' && activeTab !== 'taxes') {
    return (
      <div className="reports-view">
        <h2>Reports</h2>
        <div className="report-section grand-total-summary">
          <h3>Lifetime Summary</h3>
          <p><strong>Total Tasks Completed (All Time):</strong> {grandTotalTasks}</p>
          <p><strong>Total Time Tracked (All Time):</strong> {formatTime(grandTotalTimeTracked)}</p>
          <p><strong>Grand Total Earnings (All Time):</strong> ${grandTotalEarnings.toFixed(2)}</p></div>
        <hr />
      {/* Keep filters visible even when there's no data. Pass all required props. */}
      <ReportFilters 
        startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} 
        onExportCsv={() => {}} exportDisabled={true} 
        categories={categories} activeCategoryId={activeCategoryId} setActiveCategoryId={setActiveCategoryId} 
        activeSubCategoryId={activeSubCategoryId} setActiveSubCategoryId={setActiveSubCategoryId} 
        dateFilteredTasks={dateFilteredTasks} activeTab={activeTab} 
        accounts={settings.accounts} activeAccountId={activeAccountId} setActiveAccountId={setActiveAccountId} 
        activeTransactionTypeFilter={activeTransactionTypeFilter} setActiveTransactionTypeFilter={setActiveTransactionTypeFilter} 
        tasksForCounting={tasksForFinanceCounts} 
        activeTaxCategoryId={activeTaxCategoryId} setActiveTaxCategoryId={setActiveTaxCategoryId as (id: number | 'all') => void} />
        <p>No completed tasks in the selected date range to generate a report from.</p>
      </div>
    );
  }

  // --- Data Processing ---

  // 1. Tasks completed per day
  const completionsByDay = filteredCompletedTasks.reduce((acc, task) => {
    const completionDate = new Date(task.createdAt + (task.completedDuration || 0)).toLocaleDateString();
    acc[completionDate] = (acc[completionDate] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 2. Task completion frequency by name
  const completionsByName = filteredCompletedTasks.reduce((acc, task) => {
    acc[task.text] = (acc[task.text] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 3. Task completion by category
  const completionsByCategory = filteredCompletedTasks.reduce((acc, task) => {
    const category = categories.find(c => c.id === task.categoryId);
    const categoryName = category?.name || 'Uncategorized';
    acc[categoryName] = (acc[categoryName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxCompletionsByCategory = Math.max(...Object.values(completionsByCategory), 1);
  const maxCompletionsByDay = Math.max(...Object.values(completionsByDay), 1);

  // 4. Aggregate stats
  const totalTasksCompleted = filteredCompletedTasks.length;
  const totalTimeTracked = filteredCompletedTasks.reduce((sum, task) => sum + (task.manualTime || 0), 0);
  const totalEarnings = filteredCompletedTasks.reduce((sum, task) => {
    const hours = (task.manualTime || 0) / (1000 * 60 * 60);
    return sum + (hours * (task.payRate || 0));
  }, 0);

  // 5. Earnings by category
  const earningsByCategory = filteredCompletedTasks.reduce((acc, task) => {
    const category = categories.find(c => c.id === task.categoryId);
    const categoryName = category?.name || 'Uncategorized';
    const hours = (task.manualTime || 0) / (1000 * 60 * 60);
    const earnings = hours * (task.payRate || 0);
    acc[categoryName] = (acc[categoryName] || 0) + earnings;
    return acc;
  }, {} as Record<string, number>);

  // 6. Earnings over time
  const earningsOverTime = filteredCompletedTasks.reduce((acc, task) => {
    const completionDate = new Date(task.createdAt + (task.completedDuration || 0)).toLocaleDateString();
    const hours = (task.manualTime || 0) / (1000 * 60 * 60);
    const earnings = hours * (task.payRate || 0);
    acc[completionDate] = (acc[completionDate] || 0) + earnings;
    return acc;
  }, {} as Record<string, number>);
  const chartDataEarnings = Object.entries(earningsOverTime).map(([date, earnings]) => ({ date, earnings })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 7. Data for the activity bar chart based on the filtered date range
  const activityByDay = filteredCompletedTasks.reduce((acc, task) => {
    if (task.completedDuration) {
      const completionDate = new Date(task.createdAt + task.completedDuration).toLocaleDateString();
      acc[completionDate] = (acc[completionDate] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const activityChartData = Object.entries(activityByDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Determine the title for the activity chart
  let activityChartTitle = 'Activity Over Time';
  if (startDate && endDate) {
    activityChartTitle = `Activity from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
  } else if (startDate) {
    activityChartTitle = `Activity since ${new Date(startDate).toLocaleDateString()}`;
  } else if (endDate) {
    activityChartTitle = `Activity until ${new Date(endDate).toLocaleDateString()}`;
  }

  const handleExportCsv = () => {
    const header = [
      "Task ID", "Task Name", "Category", "Company", 
      "Open Date", "Completion Date", "Time Tracked (HH:MM:SS)", 
      "Pay Rate ($/hr)", "Earnings ($)"
    ];

    const rows = filteredCompletedTasks.map(task => {
      const category = categories.find(c => c.id === task.categoryId);
      const categoryName = category?.name || 'Uncategorized';
      const completionTime = task.createdAt + (task.completedDuration || 0);
      const earnings = (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)).toFixed(2);

      // Escape commas in text fields to prevent CSV corruption
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
  return (
    <div className="reports-view">
      <h2>Reports</h2>
      <div className="category-tabs report-main-tabs">
        <button onClick={() => handleTabChange('summary')} className={activeTab === 'summary' ? 'active' : ''}>Summary</button>
        <button onClick={() => handleTabChange('earnings')} className={activeTab === 'earnings' ? 'active' : ''}>Earnings</button>
        <button onClick={() => handleTabChange('activity')} className={activeTab === 'activity' ? 'active' : ''}>Activity</button>
        <button onClick={() => handleTabChange('raw')} className={activeTab === 'raw' ? 'active' : ''}>Raw Data</button>
        <button onClick={() => handleTabChange('history')} className={activeTab === 'history' ? 'active' : ''}>History</button>
        <button onClick={() => handleTabChange('finances')} className={activeTab === 'finances' ? 'active' : ''}>Finances</button>
        <button onClick={() => handleTabChange('taxes')} className={activeTab === 'taxes' ? 'active' : ''}>Taxes</button>
      </div>
      {activeTab === 'finances' ? (
        <div className="report-section grand-total-summary">
          <h3>Lifetime Financial Summary</h3>
          <div className="financial-summary-grid lifetime">
            <div className="summary-item">
              <span className="summary-label">Total Income</span>
              <span className="summary-value income">${lifetimeFinancialSummary.totalIncome.toFixed(2)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Expenses</span>
              <span className="summary-value expense">${lifetimeFinancialSummary.totalExpenses.toFixed(2)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Transfers</span>
              <span className="summary-value transfer">${lifetimeFinancialSummary.totalTransfers.toFixed(2)}</span>
            </div>
            <div className="summary-item">
              <span className={`summary-label ${lifetimeFinancialSummary.netProfit >= 0 ? 'income' : 'expense'}`}>Net Profit</span>
              <span className={`summary-value ${lifetimeFinancialSummary.netProfit >= 0 ? 'income' : 'expense'}`}>${lifetimeFinancialSummary.netProfit.toFixed(2)}</span>
            </div>
          </div>
        </div>
      ) : activeTab === 'taxes' ? (
        <div className="report-section grand-total-summary">
          <h3>Lifetime Tax Summary</h3>
          <div className="financial-summary-grid lifetime">
            <div className="summary-item">
              <span className="summary-label">Total Deductible Business (1099) Expenses</span>
              <span className="summary-value expense">${lifetimeTaxDeductibleExpenses.total.toFixed(2)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label"># of Deductible Items</span>
              <span className="summary-value">{lifetimeTaxDeductibleExpenses.count}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="report-section grand-total-summary">
          <h3>Lifetime Summary</h3>
          <p><strong>Total Tasks Completed (All Time):</strong> {grandTotalTasks}</p>
          <p><strong>Total Time Tracked (All Time):</strong> {formatTime(grandTotalTimeTracked)}</p>
          <p><strong>Grand Total Earnings (All Time):</strong> ${grandTotalEarnings.toFixed(2)}</p>
        </div>
      )}
      <hr />
      <ReportFilters 
        startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate}
        onExportCsv={handleExportCsv} 
        categories={activeTab === 'taxes' ? (settings.taxCategories || []) : categoriesForFilter} 
        activeCategoryId={activeCategoryId} 
        activeTab={activeTab} 
        accounts={settings.accounts} activeAccountId={activeAccountId} setActiveAccountId={setActiveAccountId} tasksForCounting={tasksForFinanceCounts}
        activeTransactionTypeFilter={activeTransactionTypeFilter} setActiveTransactionTypeFilter={setActiveTransactionTypeFilter} 
        setActiveCategoryId={setActiveCategoryId} activeSubCategoryId={activeSubCategoryId} setActiveSubCategoryId={setActiveSubCategoryId} 
        dateFilteredTasks={dateFilteredTasks}
        activeTaxCategoryId={activeTaxCategoryId} setActiveTaxCategoryId={setActiveTaxCategoryId as (id: number | 'all') => void}
      />       
      {activeTab === 'summary' && (
        <>
          <div className="report-section">
            <h3>Overall Summary (Filtered)</h3>
            <p><strong>Total Tasks Completed:</strong> {totalTasksCompleted}</p>
            <p><strong>Total Time Tracked:</strong> {formatTime(totalTimeTracked)}</p>
            <p><strong>Total Earnings:</strong> ${totalEarnings.toFixed(2)}</p>
          </div>
          <div className="report-section">
            <h3>{activityChartTitle}</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={activityChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    formatter={(value: number) => [`${value} tasks`, 'Completed']}
                    labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'earnings' && (
        <>
          <div className="report-section">
            <h3>Earnings by Category</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={Object.entries(earningsByCategory).map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(earningsByCategory).map(([name], index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="report-section">
            <h3>Earnings Over Time</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={chartDataEarnings} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Earnings']}
                    labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="earnings" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'activity' && (
        <>
          <div className="report-section">
            <h3>Completed Tasks by Category</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={Object.entries(completionsByCategory).map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#82ca9d"
                    dataKey="value"
                  >
                    {Object.entries(completionsByCategory).map(([name], index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 45 + 120}, 60%, 50%)`} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value} tasks`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'taxes' && (
        <div className="report-section">
          <div className="report-section-header">
            <h3>Tax Report</h3>
            <div className="tax-report-year-selector">
              <label>View Report for:</label>
              <select onChange={(e) => setSettings(prev => ({ ...prev, selectedReportYear: e.target.value ? Number(e.target.value) : null }))} value={selectedTaxYear || ''}>
                <option value="">-- Select Year --</option>
                {[...new Set([...tasks, ...completedTasks].map(t => new Date(t.openDate).getFullYear()))]
                  .sort((a, b) => b - a)
                  .map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
          </div>
          {selectedTaxYear && taxReportData ? (
            (() => {
              const w2DataForYear = settings.w2Data?.[selectedTaxYear];
              const totalWithheld = (w2DataForYear?.federalWithholding || 0) + (w2DataForYear?.socialSecurityWithholding || 0) + (w2DataForYear?.medicareWithholding || 0);
              const totalIncome = (taxIncomeReportData || []).reduce((sum, cat) => sum + cat.total, 0);
              const totalDeductibleExpenses = taxReportData.reduce((sum, cat) => sum + cat.total, 0);
              const businessIncome = (taxIncomeReportData || []).find(cat => cat.name === 'Business Income (1099)')?.total || 0;
              const w2WagesAfterTaxes = (w2DataForYear?.wages || 0) - totalWithheld;
              const reimbursementIncome = (taxIncomeReportData || []).find(g => g.name === 'Reimbursements')?.total || 0;
              const allYearExpenses = [...tasks, ...completedTasks].filter(task => new Date(task.openDate).getFullYear() === selectedTaxYear && task.transactionType === 'expense');
              const totalYearExpenses = allYearExpenses.reduce((sum, task) => sum + Math.abs(task.transactionAmount || 0), 0);
              const nonDeductibleSpending = totalYearExpenses - totalDeductibleExpenses;
              const finalTakeHome = w2WagesAfterTaxes + businessIncome + reimbursementIncome - totalYearExpenses;

              const handleCopySimplifiedReportAsText = () => {
                let reportText = `Tax Report Summary for ${selectedTaxYear}\n`;
                if (settings.businessName) {
                  reportText += `${settings.businessName}\n`;
                }
                if (w2DataForYear?.taxpayerPin) {
                  reportText += `Taxpayer PIN: ${w2DataForYear.taxpayerPin}\n`;
                }
                reportText += `\n--- SUMMARY ---\n`;
                reportText += `Total Income: $${totalIncome.toFixed(2)}\n`;
                if (totalWithheld > 0) {
                  reportText += `Total W-2 Taxes Withheld: $${totalWithheld.toFixed(2)}\n`;
                }
                reportText += `Total Deductible Business (1099) Expenses: $${totalDeductibleExpenses.toFixed(2)}\n`;
                reportText += `\n--- FINAL NET CALCULATIONS ---\n`;
                if (w2DataForYear?.wages > 0) {
                  reportText += `W2 Wages: $${(w2DataForYear.wages).toFixed(2)}\n`;
                  if (totalWithheld > 0) {
                    reportText += `W-2 Taxes Withheld: $${totalWithheld.toFixed(2)}\n`;
                  }
                }
                reportText += `Non-Deductible Spending: $${nonDeductibleSpending.toFixed(2)}\n`;
                reportText += `Reimbursements / Non-Taxable: $${reimbursementIncome.toFixed(2)}\n`;
                reportText += `Business Income: $${businessIncome.toFixed(2)}\n`;
                reportText += `Deductible Business Expenses: $${totalDeductibleExpenses.toFixed(2)}\n`;
                reportText += `Estimated Net (Take-Home): $${finalTakeHome.toFixed(2)}\n`;

                reportText += `\n\n--- INCOME CATEGORY TOTALS ---\n`;
                (taxIncomeReportData || []).forEach(cat => reportText += `${cat.name}: $${cat.total.toFixed(2)}\n`);

                reportText += `\n\n--- DEDUCTIBLE EXPENSE CATEGORY TOTALS ---\n`;
                taxReportData.forEach(cat => reportText += `${cat.name}: $${cat.total.toFixed(2)}\n`);

                if (w2DataForYear && totalWithheld > 0) {
                  reportText += `\n\n--- W-2 TAX WITHHELD DETAILS ---\n`;
                  if (w2DataForYear.federalWithholding > 0) reportText += `Federal Tax Withheld: $${w2DataForYear.federalWithholding.toFixed(2)}\n`;
                  if (w2DataForYear.socialSecurityWithholding > 0) reportText += `Social Security Tax Withheld: $${w2DataForYear.socialSecurityWithholding.toFixed(2)}\n`;
                  if (w2DataForYear.medicareWithholding > 0) reportText += `Medicare Tax Withheld: $${w2DataForYear.medicareWithholding.toFixed(2)}\n`;
                }

                navigator.clipboard.writeText(reportText).then(() => showToast('Report summary copied as text!'));
              };

              const handleCopyReportAsText = () => {
                let reportText = `Tax Report for ${selectedTaxYear}\n`;
                if (settings.businessName) {
                  reportText += `${settings.businessName}\n`;
                }
                if (w2DataForYear?.taxpayerPin) {
                  reportText += `Taxpayer PIN: ${w2DataForYear.taxpayerPin}\n`;
                }
                reportText += `\n--- SUMMARY ---\n`;
                reportText += `Total Income: $${totalIncome.toFixed(2)}\n`;
                if (totalWithheld > 0) {
                  reportText += `Total W-2 Taxes Withheld: $${totalWithheld.toFixed(2)}\n`;
                }
                reportText += `Total Deductible Business (1099) Expenses: $${totalDeductibleExpenses.toFixed(2)}\n`;
                reportText += `\n--- FINAL NET CALCULATIONS ---\n`;
                if (w2DataForYear?.wages > 0) {
                  reportText += `W2 Wages: $${(w2DataForYear.wages).toFixed(2)}\n`;
                  if (totalWithheld > 0) {
                    reportText += `W-2 Taxes Withheld: $${totalWithheld.toFixed(2)}\n`;
                  }
                }
                reportText += `Non-Deductible Spending: $${nonDeductibleSpending.toFixed(2)}\n`;
                reportText += `Reimbursements / Non-Taxable: $${reimbursementIncome.toFixed(2)}\n`;
                reportText += `Business Income: $${businessIncome.toFixed(2)}\n`;
                reportText += `Deductible Business Expenses: $${totalDeductibleExpenses.toFixed(2)}\n`;
                reportText += `Estimated Net (Take-Home): $${finalTakeHome.toFixed(2)}\n`;

                reportText += `\n\n--- INCOME DETAILS ---\n`;
                (taxIncomeReportData || []).forEach(cat => {
                  reportText += `${cat.name} - Total: $${cat.total.toFixed(2)}\n`;
                  cat.tasks.forEach(task => {
                    const income = (((task.transactionAmount || 0) > 0 ? (task.transactionAmount || 0) : 0) + ((task.completedDuration && (task.manualTime || 0) > 0 && (task.payRate || 0) > 0) ? (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)) : 0));
                    reportText += `  - ${new Date(task.openDate).toLocaleDateString()}: ${task.text} - $${income.toFixed(2)}\n`;
                  });
                });

                reportText += `\n\n--- DEDUCTIBLE EXPENSE DETAILS ---\n`;
                taxReportData.forEach(cat => {
                  reportText += `${cat.name} - Total: $${cat.total.toFixed(2)}\n`;
                  cat.tasks.forEach(task => reportText += `  - ${new Date(task.openDate).toLocaleDateString()}: ${task.text} - $${Math.abs(task.transactionAmount || 0).toFixed(2)}\n`);
                });

                if (w2DataForYear && totalWithheld > 0) {
                  reportText += `\n\n--- W-2 TAX WITHHELD DETAILS ---\n`;
                  if (w2DataForYear.federalWithholding > 0) reportText += `Federal Tax Withheld: $${w2DataForYear.federalWithholding.toFixed(2)}\n`;
                  if (w2DataForYear.socialSecurityWithholding > 0) reportText += `Social Security Tax Withheld: $${w2DataForYear.socialSecurityWithholding.toFixed(2)}\n`;
                  if (w2DataForYear.medicareWithholding > 0) reportText += `Medicare Tax Withheld: $${w2DataForYear.medicareWithholding.toFixed(2)}\n`;
                }

                navigator.clipboard.writeText(reportText).then(() => showToast('Report copied as text!'));
              };

              return (
                <div className="tax-year-report">
                  <div className="tax-report-main-header">
                    {w2DataForYear?.employerName && (
                      <div className="tax-report-employer-info">
                        <div><strong>Employer:</strong> {w2DataForYear.employerName}</div>
                        {w2DataForYear.employerEin && <div><strong>EIN:</strong> {w2DataForYear.employerEin}</div>}
                        {w2DataForYear.employerAddress && <div><strong>Address:</strong> {w2DataForYear.employerAddress.replace(/\n/g, ', ')}</div>}
                      </div>
                    )}
                    {w2DataForYear?.employeeName && (
                      <div className="tax-report-employee-info">
                        <div><strong>Employee:</strong> {w2DataForYear.employeeName}</div>
                        {w2DataForYear.employeeAddress && <div><strong>Address:</strong> {w2DataForYear.employeeAddress.replace(/\n/g, ', ')}</div>}
                      </div>
                    )}
                    <h4>Tax Report for {selectedTaxYear}</h4>
                    {w2DataForYear?.taxpayerPin && (
                      <div className="tax-report-pin">
                        <strong>Taxpayer PIN:</strong> {w2DataForYear.taxpayerPin}
                      </div>
                    )}
                    <SimpleAccordion title="View Full Summary" startOpen={true} className="tax-report-summary-accordion">
                      <div className="tax-report-summary-stack">                  
                        <SimpleAccordion
                          className="summary-block-accordion"
                          title={
                            <div className="summary-item stacked">
                              <span className="summary-label">Total Income</span>
                              <span className="summary-value income">
                                ${totalIncome.toFixed(2)}
                                <button className="icon-button copy-btn" title="Copy Value" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(totalIncome.toFixed(2)); showToast('Copied!'); }}>
                                  <i className="fas fa-copy"></i>
                                </button>
                              </span>
                            </div>
                          }
                        >
                          <div className="tax-withheld-breakdown">
                            {(taxIncomeReportData || []).map(cat => (
                              <span key={cat.name}>{cat.name}: <strong>${cat.total.toFixed(2)}</strong></span>
                            ))}
                          </div>
                        </SimpleAccordion>

                        {/* 2. Total Taxes Withheld */}
                        {totalWithheld > 0 && (
                          <SimpleAccordion
                            className="summary-block-accordion"
                            title={
                              <div className="summary-item stacked">
                                <span className="summary-label">Total W-2 Taxes Withheld</span>
                                <span className="summary-value expense">
                                  ${totalWithheld.toFixed(2)}
                                  <button className="icon-button copy-btn" title="Copy Value" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(totalWithheld.toFixed(2)); showToast('Copied!'); }}>
                                    <i className="fas fa-copy"></i>
                                  </button>
                                </span>
                              </div>
                            }
                          >
                            <div className="tax-withheld-breakdown">
                              {w2DataForYear.federalWithholding > 0 && <span>Federal: <strong>${w2DataForYear.federalWithholding.toFixed(2)}</strong></span>}
                              {w2DataForYear.socialSecurityWithholding > 0 && <span>Social Security: <strong>${w2DataForYear.socialSecurityWithholding.toFixed(2)}</strong></span>}
                              {w2DataForYear.medicareWithholding > 0 && <span>Medicare: <strong>${w2DataForYear.medicareWithholding.toFixed(2)}</strong></span>}
                            </div>
                          </SimpleAccordion>
                        )}

                        {/* 3. Total Deductible Expenses */}
                        <SimpleAccordion
                          className="summary-block-accordion"
                          title={
                            <div className="summary-item stacked">
                              <span className="summary-label">Total Deductible Business (1099) Expenses</span>
                              <span className="summary-value expense">
                                ${totalDeductibleExpenses.toFixed(2)}
                                <button className="icon-button copy-btn" title="Copy Value" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(totalDeductibleExpenses.toFixed(2)); showToast('Copied!'); }}>
                                  <i className="fas fa-copy"></i>
                                </button>
                              </span>
                            </div>
                          }
                        >
                          <div className="tax-withheld-breakdown">
                            {taxReportData.map(cat => (
                              <span key={cat.name}>{cat.name}: <strong>${cat.total.toFixed(2)}</strong></span>
                            ))}
                          </div>
                        </SimpleAccordion>

                        {/* Final Net Calculations */}
                        <div className="summary-block final-net-block">
                          {w2DataForYear?.wages > 0 && (<>
                            <div className="summary-item stacked">
                              <span className="summary-label">W2 Wages</span>                          
                              <span className="summary-value income">
                                ${(w2DataForYear.wages).toFixed(2)}
                                <button className="icon-button copy-btn" title="Copy Value" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText((w2DataForYear.wages).toFixed(2)); showToast('Copied!'); }}>
                                  <i className="fas fa-copy"></i>
                                </button>
                              </span>
                            </div>
                            {totalWithheld > 0 && (
                              <div className="summary-item stacked">
                                  <span className="summary-label">W-2 Taxes Withheld</span>
                                  <span className="summary-value expense">
                                    ${totalWithheld.toFixed(2)}
                                    <button className="icon-button copy-btn" title="Copy Value" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(totalWithheld.toFixed(2)); showToast('Copied!'); }}>
                                      <i className="fas fa-copy"></i>
                                    </button>
                                  </span>
                              </div>
                            )}
                          </>)}
                          <div className="summary-item stacked">
                            <span className="summary-label">Non-Deductible Spending</span>
                            <span className="summary-value expense">
                              ${nonDeductibleSpending.toFixed(2)}
                              <button className="icon-button copy-btn" title="Copy Value" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(nonDeductibleSpending.toFixed(2)); showToast('Copied!'); }}>
                                <i className="fas fa-copy"></i>
                              </button>
                            </span>
                          </div>
                          <div className="summary-item stacked">
                            <span className="summary-label">Reimbursements / Non-Taxable</span>
                            <span className="summary-value income">
                              ${reimbursementIncome.toFixed(2)}
                              <button className="icon-button copy-btn" title="Copy Value" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(reimbursementIncome.toFixed(2)); showToast('Copied!'); }}>
                                <i className="fas fa-copy"></i>
                              </button>
                            </span>
                          </div>
                          <div className="summary-item stacked">
                            <span className="summary-label">Business Income</span>
                            <span className="summary-value income">
                              ${businessIncome.toFixed(2)}
                              <button className="icon-button copy-btn" title="Copy Value" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(businessIncome.toFixed(2)); showToast('Copied!'); }}>
                                <i className="fas fa-copy"></i>
                              </button>
                            </span>
                          </div>                    
                          <div className="summary-item stacked">
                            <span className="summary-label">Deductible Business Expenses</span>
                            <span className="summary-value expense">
                              ${totalDeductibleExpenses.toFixed(2)}
                              <button className="icon-button copy-btn" title="Copy Value" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(totalDeductibleExpenses.toFixed(2)); showToast('Copied!'); }}>
                                <i className="fas fa-copy"></i>
                              </button>
                            </span>
                          </div>
                          <div className="summary-item stacked summary-final-item">
                            <span className="summary-label">Estimated Net (Take-Home)</span>
                            <span className={`summary-value ${finalTakeHome >= 0 ? 'income' : 'expense'}`}>
                              ${finalTakeHome.toFixed(2)}
                              <button className="icon-button copy-btn" title="Copy Value" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(finalTakeHome.toFixed(2)); showToast('Copied!'); }}>
                                <i className="fas fa-copy"></i>
                              </button>
                            </span>
                          </div>
                        </div>
                      </div>
                    </SimpleAccordion>
                    <div className="tax-report-actions">
                      <button onClick={handleCopySimplifiedReportAsText} className="print-pdf-btn" style={{ backgroundColor: '#16a085' }}><i className="fas fa-clipboard-list"></i> Copy Summary</button>
                      <button onClick={handleCopyReportAsText} className="print-pdf-btn" style={{ backgroundColor: '#3498db' }}><i className="fas fa-copy"></i> Copy Full Text</button>
                      <button onClick={() => window.electronAPI.printToPdf({ year: selectedTaxYear })} className="print-pdf-btn"><i className="fas fa-file-pdf"></i> Print to PDF</button>
                      <button onClick={() => setSettings(prev => ({ ...prev, selectedReportYear: null }))} className="back-to-summary-btn"><i className="fas fa-arrow-left"></i> Back to Summary</button>
                    </div>
                  </div>
                  <SimpleAccordion className="tax-category-accordion" title={
                    <h4 className="tax-section-title">
                      Income Details
                      <span className="tax-accordion-total">
                        Total: ${(taxIncomeReportData || []).reduce((sum, cat) => sum + cat.total, 0).toFixed(2)}
                      </span>
                    </h4>
                  }>
                    <div className="tax-report-category-section">
                      {(taxIncomeReportData || []).map(category => (
                        <SimpleAccordion key={category.name} className="summary-block-accordion" title={
                          <h5>
                            {category.name} - Total: <span className="income-text">${category.total.toFixed(2)}</span>
                            {category.name === 'W-2 Wages' && category.transactionTotal > 0 && (
                              <span className="tax-report-subtotal">(Transactions Received: ${category.transactionTotal.toFixed(2)})</span>
                            )}
                          </h5>
                        }>
                          <div className="tax-report-table-container">
                            <table className="report-table">
                              <thead><tr><th>Date</th><th>Description</th><th className="amount-column">Amount</th></tr></thead>
                              <tbody>
                                {category.tasks.sort((a: Task, b: Task) => a.openDate - b.openDate).map((task: Task) => (
                              <tr key={task.id} onClick={() => navigateToTask(task.id)} className="clickable-row">
                                    <td>{new Date(task.openDate).toLocaleDateString()}</td>
                                    <td>{task.text}</td>
                                    <td className="amount-column income-text">${(((task.transactionAmount || 0) > 0 ? (task.transactionAmount || 0) : 0) + ((task.completedDuration && (task.manualTime || 0) > 0 && (task.payRate || 0) > 0) ? (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)) : 0)).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </SimpleAccordion>
                      ))}
                    </div>
                  </SimpleAccordion>

                  <SimpleAccordion className="tax-category-accordion" title={
                    <div className="tax-accordion-title">
                      <span>Deductible Expense Details</span>
                      <span className="tax-accordion-total expense-text">
                        Total: ${taxReportData.filter(c => !c.name.toLowerCase().includes('charitable')).reduce((sum, cat) => sum + cat.total, 0).toFixed(2)}
                      </span>
                    </div>
                  }>
                    <div className="tax-report-category-section">
                      {taxReportData.filter(cat => !cat.name.toLowerCase().includes('charitable')).map(category => (
                        <SimpleAccordion key={category.name} className="summary-block-accordion" title={
                          <h5>
                            {category.name} - Total:
                            <span className="expense-text">
                              ${category.total.toFixed(2)}
                              <button className="icon-button copy-btn" title="Copy Value" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(category.total.toFixed(2)); showToast('Copied!'); }}>
                                <i className="fas fa-copy"></i>
                              </button>
                            </span>
                          </h5>
                        }>
                          <div className="tax-report-table-container">
                            <table className="report-table">
                              <thead><tr><th>Date</th><th>Description</th><th className="amount-column">Amount</th></tr></thead>
                              <tbody>
                                {category.tasks.sort((a: Task, b: Task) => a.openDate - b.openDate).map((task: Task) => (
                                  (() => {
                                    const transactionCategory = settings.categories.find(c => c.id === task.categoryId);
                                    const taxCategory = settings.taxCategories?.find(tc => tc.id === task.taxCategoryId);
                                    const percentageValue = transactionCategory?.deductiblePercentage ?? taxCategory?.deductiblePercentage ?? 100;
                                    const deductibleAmount = (Math.abs(task.transactionAmount || 0) * (percentageValue / 100));

                                    return (
                                  <tr key={task.id} onClick={() => navigateToTask(task.id)} className="clickable-row">
                                        <td>{new Date(task.openDate).toLocaleDateString()}</td>
                                        <td>{task.text}</td>
                                        <td className="amount-column expense-text">
                                          {percentageValue < 100 ? (
                                            <span title={`Original: $${Math.abs(task.transactionAmount || 0).toFixed(2)}`}>${deductibleAmount.toFixed(2)} <span className="deductible-percentage">({percentageValue}%)</span></span>
                                          ) : (
                                            `$${Math.abs(task.transactionAmount || 0).toFixed(2)}`
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })()
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </SimpleAccordion>
                      ))}
                    </div>
                  </SimpleAccordion>

                  {w2DataForYear && (w2DataForYear.federalWithholding > 0 || w2DataForYear.socialSecurityWithholding > 0 || w2DataForYear.medicareWithholding > 0) && (
                    (() => {
                      const totalWithheld = (w2DataForYear.federalWithholding || 0) + (w2DataForYear.socialSecurityWithholding || 0) + (w2DataForYear.medicareWithholding || 0);
                      return (
                        <SimpleAccordion className="tax-category-accordion" title={
                          <h4 className="tax-section-title">
                              W-2 Tax Withheld Details
                              <span className="tax-accordion-total">Total: ${totalWithheld.toFixed(2)}</span>
                          </h4>
                        }>
                          <div className="tax-report-category-section">
                            <table className="report-table">
                              <thead>
                                <tr>
                                  <th>Description</th>
                                  <th className="amount-column">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {w2DataForYear.federalWithholding > 0 && (
                                  <tr>
                                    <td>Federal Tax Withheld</td>
                                    <td className="amount-column expense-text">${w2DataForYear.federalWithholding.toFixed(2)}</td>
                                  </tr>
                                )}
                                {w2DataForYear.socialSecurityWithholding > 0 && (
                                  <tr>
                                    <td>Social Security Tax Withheld</td>
                                    <td className="amount-column expense-text">${w2DataForYear.socialSecurityWithholding.toFixed(2)}</td>
                                  </tr>
                                )}
                                {w2DataForYear.medicareWithholding > 0 && (
                                  <tr>
                                    <td>Medicare Tax Withheld</td>
                                    <td className="amount-column expense-text">${w2DataForYear.medicareWithholding.toFixed(2)}</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </SimpleAccordion>
                      );
                    })()
                  )}
                  {(settings.depreciableAssets && settings.depreciableAssets.length > 0) && (
                    <SimpleAccordion className="tax-category-accordion" title={
                      <h4 className="tax-section-title">
                        Depreciable Assets
                        <span className="tax-accordion-total">
                          Total Cost: ${settings.depreciableAssets.reduce((sum, asset) => sum + asset.cost, 0).toFixed(2)}
                        </span>
                      </h4>
                    }>
                      <div className="tax-report-table-container">
                        <table className="report-table">
                          <thead>
                            <tr>
                              <th>Description</th>
                              <th>Date Acquired</th>
                              <th className="amount-column">Cost</th>
                              <th className="amount-column">Business Use %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {settings.depreciableAssets.map(asset => (
                              <tr key={asset.id}>
                                <td>
                                  {asset.description} {(() => { // Display recovery period
                                    let recoveryPeriodText = '';
                                    const period = asset.recoveryPeriod || (asset.assetCategory === 'computer_etc' ? '5-year' : asset.assetCategory === 'equipment' ? '7-year' : '');
                                    if (period === '5-year') recoveryPeriodText = '(5-Year Property)';
                                    else if (period === '7-year') recoveryPeriodText = '(7-Year Property)';
                                    return recoveryPeriodText ? <span className="asset-details-subtext" style={{ marginLeft: '8px' }}>{recoveryPeriodText}</span> : null;
                                  })()}
                                  <div className="asset-details-subtext">
                                    Purchased New: {asset.purchasedNew ? 'Yes' : 'No'} | 
                                    Bonus Depreciation Taken: {asset.priorYearBonusDepreciationTaken ? 'Yes' : 'No'} |
                                    Fully Depreciated: {(() => {
                                      const recoveryYears = asset.recoveryPeriod === '7-year' ? 7 : 5;
                                      const acquiredDate = new Date(asset.dateAcquired);
                                      if (isNaN(acquiredDate.getTime())) return 'No';

                                      const fullyDepreciatedDate = new Date(acquiredDate);
                                      fullyDepreciatedDate.setFullYear(acquiredDate.getFullYear() + recoveryYears);

                                      return new Date() > fullyDepreciatedDate ? 'Yes' : 'No';
                                    })()}
                                    {asset.dateSold && ` | Sold: ${new Date(asset.dateSold).toLocaleDateString()}`}
                                  </div>
                                </td>
                                <td>{new Date(asset.dateAcquired).toLocaleDateString()}</td>
                                <td className="amount-column">${asset.cost.toFixed(2)}</td>
                                <td className="amount-column">{asset.businessUsePercentage || 100}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </SimpleAccordion>
                  )}
                  {(() => {
                    const standardMileageDeduction = (settings.vehicleBusinessMiles || 0) * 0.67;
                    const otherVehicleExpenses = [
                      { name: 'Business Parking Fees/Tolls', amount: settings.vehicleParkingTollsAmount || 0, categoryId: settings.vehicleParkingTollsTaxCategoryId },
                      { name: 'Property Taxes Paid', amount: settings.vehiclePropertyTaxesAmount || 0, categoryId: settings.vehiclePropertyTaxesTaxCategoryId },
                      { name: 'Car Loan Interest Paid', amount: settings.vehicleLoanInterestAmount || 0, categoryId: settings.vehicleLoanInterestTaxCategoryId },
                    ];
                    const totalOtherExpenses = otherVehicleExpenses.reduce((sum, exp) => sum + exp.amount, 0);
                    const totalVehicleDeduction = standardMileageDeduction + totalOtherExpenses;

                    if (totalVehicleDeduction > 0) {
                      return (
                        <SimpleAccordion className="tax-category-accordion" title={
                          <h4 className="tax-section-title">
                            Vehicle Expenses
                            <span className="tax-accordion-total">
                              Total Deduction: ${totalVehicleDeduction.toFixed(2)}
                            </span>
                          </h4>
                        }>
                          <div className="tax-report-table-container">
                            <table className="report-table">
                              <thead><tr><th>Description</th><th className="amount-column">Amount</th></tr></thead>
                              <tbody>
                                {standardMileageDeduction > 0 && (
                                  <tr>
                                    <td>Standard Mileage Deduction ({settings.vehicleBusinessMiles} miles)</td>
                                    <td className="amount-column expense-text">${standardMileageDeduction.toFixed(2)}</td>
                                  </tr>
                                )}
                                {otherVehicleExpenses.map(expense => expense.amount > 0 && (
                                  <tr key={expense.name}>
                                    <td>{expense.name}{settings.taxCategories?.find(tc => tc.id === expense.categoryId) && <div className="asset-details-subtext">Tax Category: {settings.taxCategories.find(tc => tc.id === expense.categoryId)?.name}</div>}</td>
                                    <td className="amount-column expense-text">${expense.amount.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </SimpleAccordion>
                      );
                    }
                    return null;
                  })()}
                  {(() => {
                    if (!taxReportData) return null;
                    const charitableDonations = taxReportData.find(cat => cat.name.toLowerCase().includes('charitable'));
                    if (!charitableDonations || charitableDonations.total === 0) return null;

                    return (
                      <SimpleAccordion className="tax-category-accordion" title={(
                        <div className="tax-accordion-title">
                          <span>Charitable Donations</span>
                          <span className="tax-accordion-total expense-text">
                            Total: ${charitableDonations.total.toFixed(2)}
                          </span>
                        </div>
                      )}>                
                        <div className="tax-report-table-container">
                          <table className="report-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th className="amount-column">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {charitableDonations.tasks.sort((a, b) => a.openDate - b.openDate).map(task => (
                                <tr key={task.id} onClick={() => navigateToTask(task.id)} className="clickable-row">
                                  <td>{new Date(task.openDate).toLocaleDateString()}</td>
                                  <td>{task.text}</td>
                                  <td className="amount-column expense-text">${Math.abs(task.transactionAmount || 0).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </SimpleAccordion>
                    );
                  })()}
                </div>
              );
            })()
          ) : (
            <>
              <div className="report-section-header">
                <h3>Income Summary</h3>
              </div>
              {incomeByType.map(group => (
                <SimpleAccordion key={group.name} className="tax-category-accordion" title={
                  <div className="tax-accordion-title">
                    <span>{group.name}</span>
                    <span className="tax-accordion-total income-text">${group.total.toFixed(2)}</span>
                  </div>
                }>
                  <table className="report-table">
                    <thead><tr><th>Date</th><th>Description</th><th className="amount-column">Amount</th></tr></thead>
                    <tbody>
                      {group.tasks.sort((a: Task, b: Task) => a.openDate - b.openDate).map((task: Task) => (
                        <tr key={task.id}>
                          <td>{new Date(task.openDate).toLocaleDateString()}</td>
                          <td>{task.text}</td>
                          <td className="amount-column income-text">${(((task.transactionAmount || 0) > 0 ? (task.transactionAmount || 0) : 0) + ((task.completedDuration && (task.manualTime || 0) > 0 && (task.payRate || 0) > 0) ? (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)) : 0)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </SimpleAccordion>
              ))}
              <div className="report-section-header">
                <h3>Tax-Deductible Expenses</h3>
              </div>
              {Array.from(transactionsByTaxCategory.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name)).map(([categoryId, group]) => (
                <SimpleAccordion key={categoryId} className="tax-category-accordion" title={
                    <div className="tax-accordion-title">
                      <span>{group.name}</span>
                      <span className="tax-accordion-total expense-text">${group.total.toFixed(2)}</span>
                    </div>
                  }>
                  <table className="report-table">
                    <thead><tr><th>Date</th><th>Description</th><th className="amount-column">Amount</th></tr></thead>
                    <tbody>
                      {group.tasks.sort((a: Task, b: Task) => a.openDate - b.openDate).map((task: Task) => (
                        <tr key={task.id}><td>{new Date(task.openDate).toLocaleDateString()}</td><td>{task.text}</td><td className="amount-column expense-text">${Math.abs(task.transactionAmount || 0).toFixed(2)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </SimpleAccordion>
              ))}
            </>
          )}
        </div>
      )}

      {activeTab === 'finances' && (
        <>
          <div className="report-section">
            <h3>Financial Summary (All Time)</h3>
            <div className="financial-details-grid">
              <div className="financial-summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Total Income</span>
                  <span className="summary-value income">${financialSummary.totalIncome.toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Expenses</span>
                  <span className="summary-value expense">${financialSummary.totalExpenses.toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Transfers</span>
                  <span className="summary-value transfer">${financialSummary.totalTransfers.toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Net Profit</span>
                  <span className={`summary-value ${financialSummary.netProfit >= 0 ? 'income' : 'expense'}`}>${financialSummary.netProfit.toFixed(2)}</span>
                </div>
              </div>
              <div className="financial-chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={incomeExpenseData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={100}
                      isAnimationActive={false}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {incomeExpenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="report-section">
            <h3>Cash Flow Over Time</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={cashFlowData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => `$${value.toFixed(2)}`}
                    labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="income" name="Income" stroke="#28a745" activeDot={{ r: 8 }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#dc3545" activeDot={{ r: 8 }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="net" name="Net" stroke="#61dafb" strokeWidth={2} activeDot={{ r: 8 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="report-section">
            <h3>Summary by Account</h3>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th className="amount-column">Total In</th>
                  <th className="amount-column">Total Out</th>
                  <th className="amount-column">Net Change</th>
                </tr>
              </thead>
              <tbody>
                {summaryByAccount.map(summary => (
                  <tr key={summary.name}>
                    <td>{summary.name}</td>
                    <td className="amount-column income" title="Income + Incoming Transfers">
                      {summary.totalIn > 0 ? `+$${summary.totalIn.toFixed(2)}` : '$0.00'}
                    </td>
                    <td className="amount-column expense" title="Expenses + Outgoing Transfers">
                      {summary.totalOut > 0 ? `-$${summary.totalOut.toFixed(2)}` : '$0.00'}
                    </td>
                    <td className={`amount-column ${summary.net >= 0 ? 'income' : 'expense'}`}>
                      {summary.net >= 0 ? '+' : '-'}${Math.abs(summary.net).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid #555' }}>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Grand Total:</td>
                  <td className="amount-column income">
                    +${summaryByAccount.reduce((sum, acc) => sum + acc.totalIn, 0).toFixed(2)}
                  </td>
                  <td className="amount-column expense">
                    -${summaryByAccount.reduce((sum, acc) => sum + acc.totalOut, 0).toFixed(2)}
                  </td>
                  <td className={`amount-column ${summaryByAccount.reduce((sum, acc) => sum + acc.net, 0) >= 0 ? 'income' : 'expense'}`}>
                    {summaryByAccount.reduce((sum, acc) => sum + acc.net, 0) >= 0 ? '+' : '-'}${Math.abs(summaryByAccount.reduce((sum, acc) => sum + acc.net, 0)).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {mileageCalculation && (
            <div className="report-section">
              <h3>Vehicle Information & Mileage Estimate</h3>
              <div className="mileage-summary">
                <p>
                  The average mileage range for <strong>${mileageCalculation.totalSpentOnGas.toFixed(2)}</strong> spent on {mileageCalculation.gasCategoryName},
                  at <strong>${mileageCalculation.gasPricePerGallon.toFixed(2)}</strong> per gallon, with a vehicle getting between <strong>{mileageCalculation.gasMpgLow}</strong> and <strong>{mileageCalculation.gasMpgHigh}</strong> MPG is:
                </p>
                <div className="mileage-result">
                  <span>{mileageCalculation.milesLow.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  <span className="to-text">to</span>
                  <span>{mileageCalculation.milesHigh.toLocaleString(undefined, { maximumFractionDigits: 0 })} miles</span>
                </div>
              </div>
              <p className="report-footnote">
                This is an estimate based on the transactions visible in the current report filter.
                You can change the calculator settings in the sidebar.
              </p>
            </div>
          )}
          {sortedTransferTransactions.length > 0 && (
            <div className="report-section">
              <h3>Transfers by Category</h3>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Category / Account</th>
                    <th className="amount-column">Total Sent</th>
                    <th className="amount-column">Total Received</th>
                    <th className="amount-column">Net Change</th>
                  </tr>
                </thead>
                <tbody>
                  {transfersByCategory.map(summary => (
                    <tr key={summary.name}>
                      <td>{summary.name}</td>
                      <td className="amount-column expense">
                        {summary.sent > 0 ? `-$${summary.sent.toFixed(2)}` : '$0.00'}
                      </td>
                      <td className="amount-column income">
                        {summary.received > 0 ? `+$${summary.received.toFixed(2)}` : '$0.00'}
                      </td>
                      <td className={`amount-column ${summary.net >= 0 ? 'income' : 'expense'}`}>
                        {summary.net >= 0 ? '+' : '-'}${Math.abs(summary.net).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h3>Transfer Details</h3>
              <table className="report-table">
                <thead>
                  <tr>
                    <th onClick={() => requestTransactionSort('text')}>Task / Item{getTransactionSortIndicator('text')}</th>
                    <th onClick={() => requestTransactionSort('openDate')}>Date{getTransactionSortIndicator('openDate')}</th>
                    <th onClick={() => requestTransactionSort('categoryName')}>Category{getTransactionSortIndicator('categoryName')}</th>
                    <th onClick={() => requestTransactionSort('transactionAmount')} className="amount-column">Amount{getTransactionSortIndicator('transactionAmount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTransferTransactions.map(task => {
                    const category = categories.find(c => c.id === task.categoryId);
                    const categoryName = category?.name || 'Uncategorized';
                    const amount = task.transactionAmount || 0;
                    return (
                      <tr key={task.id}>
                        <td>{task.text}</td>
                        <td>{new Date(task.openDate).toLocaleDateString()}</td>
                        <td>{categoryName}</td>
                        <td className={`amount-column ${amount >= 0 ? 'income' : 'expense'}`}>
                          {amount >= 0 ? '+' : '-'}${Math.abs(amount).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Sent:</td>
                    <td className="amount-column expense">-${transferSummary.sent.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Received:</td>
                    <td className="amount-column income">+${transferSummary.received.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold', borderTop: '1px solid #555' }}>Net Transfer:</td>
                    <td className={`amount-column ${transferSummary.net >= 0 ? 'income' : 'expense'}`} style={{ borderTop: '1px solid #555' }}>
                      {transferSummary.net >= 0 ? '+' : '-'}${Math.abs(transferSummary.net).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          {taxCategorizedExpenses.length > 0 && (
            <div className="report-section">
              <h3>Deductible Expenses by Tax Category</h3>
              <table className="report-table">
                <thead>
                  <tr>
                    <th onClick={() => setTaxSortConfig(prev => ({ key: 'name', direction: prev.key === 'name' && prev.direction === 'ascending' ? 'descending' : 'ascending' }))}>
                      Tax Category {taxSortConfig.key === 'name' && (taxSortConfig.direction === 'ascending' ? '▲' : '▼')}
                    </th>
                    <th className="amount-column" onClick={() => setTaxSortConfig(prev => ({ key: 'total', direction: prev.key === 'total' && prev.direction === 'ascending' ? 'descending' : 'ascending' }))}>
                      Total Expenses {taxSortConfig.key === 'total' && (taxSortConfig.direction === 'ascending' ? '▲' : '▼')}
                    </th>
                    <th className="amount-column" onClick={() => setTaxSortConfig(prev => ({ key: 'count', direction: prev.key === 'count' && prev.direction === 'ascending' ? 'descending' : 'ascending' }))}>
                      # of Transactions {taxSortConfig.key === 'count' && (taxSortConfig.direction === 'ascending' ? '▲' : '▼')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {taxCategorizedExpenses.map(summary => (
                    <tr key={summary.name}>
                      <td>{summary.name}</td>
                      <td className="amount-column expense-text">${summary.total.toFixed(2)}</td>
                      <td className="amount-column">{summary.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="report-section">
            <h3>All Transactions</h3>
            <table className="report-table">
              <thead>
                <tr>
                  <th onClick={() => requestTransactionSort('text')}>Task / Item{getTransactionSortIndicator('text')}</th>
                  <th onClick={() => requestTransactionSort('openDate')}>Date{getTransactionSortIndicator('openDate')}</th>
                  <th onClick={() => requestTransactionSort('categoryName')}>Category{getTransactionSortIndicator('categoryName')}</th>
                  <th onClick={() => requestTransactionSort('transactionAmount')} className="amount-column">Amount{getTransactionSortIndicator('transactionAmount')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.map(task => {
                  const category = categories.find(c => c.id === task.categoryId);
                  const categoryName = category?.name || 'Uncategorized';
                  const amount = task.transactionAmount || 0;
                  return (
                    <tr key={task.id}>
                      <td>{task.text}</td>
                      <td>{new Date(task.openDate).toLocaleDateString()}</td>
                      <td>{categoryName}</td>
                      <td className={`amount-column ${amount > 0 ? 'income' : 'expense'}`}>
                        {amount > 0 ? '+' : '-'}${Math.abs(amount).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <div className="report-section">
          <div className="report-section-header">
            <h3>Recent Task History</h3>
            <label className="history-count-control">
              Show:
              <input type="number" value={historyCount} onChange={(e) => setHistoryCount(Number(e.target.value))} min="1" />
              most recent
            </label>
          </div>
          <table className="report-table">
            <thead>
              <tr>
                <th>Task Name</th>
                <th onClick={() => requestSort('categoryName')}>Category{getSortIndicator('categoryName')}</th>
                <th>Completion Date</th>
                <th onClick={() => requestSort('manualTime')}>Time Tracked{getSortIndicator('manualTime')}</th>
                <th onClick={() => requestSort('earnings')}>Earnings{getSortIndicator('earnings')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedFilteredTasks.slice(0, 20).map(task => {
                const category = categories.find(c => c.id === task.categoryId);
                const categoryName = category?.name || 'Uncategorized';                
                const completionTime = task.createdAt + (task.completedDuration || 0);
                const earnings = (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0));
                return (
                  <tr key={task.id}>
                    <td>
                      <span className="link-with-copy">
                        {task.text}
                        <button className="copy-btn" title="Copy Row Data" onClick={() => {
                          const rowData = [task.text, categoryName, formatTimestamp(completionTime), formatTime(task.manualTime || 0), `$${earnings.toFixed(2)}`].join('\t');
                          navigator.clipboard.writeText(rowData).then(() => 
                            showToast('Row data copied!'));
                        }}>
                          <i className="fas fa-copy"></i>
                        </button>
                      </span>
                    </td>
                    <td>{categoryName}</td>
                    <td>{formatTimestamp(completionTime)}</td>
                    <td>{formatTime(task.manualTime || 0)}</td>
                    <td>${earnings.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {activeTab === 'raw' && (
        <>
          <div className="report-section">
            <h3>Completions per Day</h3>
            <div className="chart-container">
              {Object.entries(completionsByDay).map(([date, count]) => (
                <div key={date} className="chart-bar-item">
                  <span className="chart-label">{date}</span>
                  <div className="chart-bar-wrapper">
                    <div className="chart-bar" style={{ width: `${(count / maxCompletionsByDay) * 100}%` }}></div>
                  </div>
                  <span className="chart-value">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="report-section">
            <h3>Completions by Category</h3>
            <div className="chart-container">
              {Object.entries(completionsByCategory).sort(([, a], [, b]) => b - a).map(([name, count]) => (
                <div key={name} className="chart-bar-item">
                  <span className="chart-label">{name}</span>
                  <div className="chart-bar-wrapper">
                    <div className="chart-bar" style={{ width: `${(count / maxCompletionsByCategory) * 100}%` }}></div>
                  </div>
                  <span className="chart-value">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="report-section">
            <h3>Most Completed Tasks</h3>
            <ul>
              {Object.entries(completionsByName).sort(([, a], [, b]) => b - a).slice(0, 15).map(([name, count]) => (
                <li key={name}>{name}: {count} time(s)</li>
              ))}
            </ul>
          </div>

          <div className="report-section">
            <h3>Filtered Task Data</h3>
            <div className="report-section-actions">
              <button onClick={() => {
                const header = ["Task Name", "Category", "Completion Date", "Time Tracked (HH:MM:SS)", "Earnings ($)"].join('\t');
                const rows = sortedFilteredTasks.map(task => {
                  const category = categories.find(c => c.id === task.categoryId)?.name || 'Uncategorized';
                  const completionTime = formatTimestamp(task.createdAt + (task.completedDuration || 0));
                  const timeTracked = formatTime(task.manualTime || 0);
                  const earnings = (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)).toFixed(2);
                  return [task.text, category, completionTime, timeTracked, earnings].join('\t');
                });
                const tableText = [header, ...rows].join('\n');
                navigator.clipboard.writeText(tableText).then(() => {
                  showToast('Table data copied!');                  
                });
              }}>Copy Table</button>
            </div>
            <table className="report-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort('text')}>Task Name{getSortIndicator('text')}</th>
                  <th onClick={() => requestSort('categoryName')}>Category{getSortIndicator('categoryName')}</th>
                  <th onClick={() => requestSort('completionDate')}>Completion Date{getSortIndicator('completionDate')}</th>
                  <th onClick={() => requestSort('manualTime')}>Time Tracked{getSortIndicator('manualTime')}</th>
                  <th onClick={() => requestSort('earnings')}>Earnings{getSortIndicator('earnings')}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedFilteredTasks.map(task => {
                  const category = categories.find(c => c.id === task.categoryId);
                  const categoryName = category?.name || 'Uncategorized';
                  const completionTime = task.createdAt + (task.completedDuration || 0);
                  const earnings = (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0));

                  return (
                    <tr key={task.id}>
                      <td>{task.text}</td>
                      <td>{categoryName}</td>
                      <td>{formatTimestamp(completionTime)}</td>
                      <td>{formatTime(task.manualTime || 0)}</td>
                      <td>${earnings.toFixed(2)}</td>
                      <td>
                        <button className="copy-btn" title="Copy Row" onClick={() => {
                          const rowData = [task.text, categoryName, formatTimestamp(completionTime), formatTime(task.manualTime || 0), `$${earnings.toFixed(2)}`].join('\t');;
                          navigator.clipboard.writeText(rowData);;
                          showToast('Row copied!');                          
                        }}>
                          <i className="fas fa-copy"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}