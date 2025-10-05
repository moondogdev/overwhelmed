import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { Task, Category, Account } from '../types';
import { formatTime, formatTimestamp } from '../utils';
import './styles/ReportsView.css';
import { useAppContext } from '../contexts/AppContext';

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
function ReportFilters({ startDate, setStartDate, endDate, setEndDate, onExportCsv, exportDisabled = false, categories, activeCategoryId, setActiveCategoryId, activeSubCategoryId, activeTab, accounts, activeAccountId, setActiveAccountId, activeTransactionTypeFilter, setActiveTransactionTypeFilter, tasksForCounting, setActiveSubCategoryId, dateFilteredTasks }: {
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
  activeTransactionTypeFilter: 'all' | 'income' | 'expense';
  setActiveTransactionTypeFilter: (type: 'all' | 'income' | 'expense') => void;
  tasksForCounting: Task[];
  activeTab: string;
  accounts: Account[];
  activeAccountId: number | 'all';
  setActiveAccountId: (id: number | 'all') => void;
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
      {activeTab !== 'finances' ? (
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
      {activeTab === 'finances' && accounts.length > 0 && (
        <div className="category-tabs">
          <button onClick={() => setActiveAccountId('all')} className={activeAccountId === 'all' ? 'active' : ''}>
            All Accounts ({tasksForCounting.filter(t => t.transactionAmount).length})
          </button>
          {accounts.map(account => {
            const count = tasksForCounting.filter(t => t.accountId === account.id).length;
            return (<button key={account.id} onClick={() => setActiveAccountId(account.id)} className={activeAccountId === account.id ? 'active' : ''}>{account.name} ({count})</button>);
          })}
        </div>
      )}
      {activeTab === 'finances' && (
        <div className="report-filter-group filter-group-transaction-type" style={{border: '0px solid var(--border-color)'}}>
          {
            //<span className="list-filter-title" style={{alignSelf: 'center'}}>Filter by Type:</span>
          }
          <div className="category-tabs">
            <button onClick={() => setActiveTransactionTypeFilter('all')} className={activeTransactionTypeFilter === 'all' ? 'active' : ''}>
              All ({tasksForCounting.filter(t => t.transactionAmount && (activeAccountId === 'all' || t.accountId === activeAccountId)).length})
            </button>
            <button onClick={() => setActiveTransactionTypeFilter('income')} className={activeTransactionTypeFilter === 'income' ? 'active' : ''}>
              Income ({tasksForCounting.filter(t => (t.transactionAmount || 0) > 0 && (activeAccountId === 'all' || t.accountId === activeAccountId)).length})
            </button>
            <button onClick={() => setActiveTransactionTypeFilter('expense')} className={activeTransactionTypeFilter === 'expense' ? 'active' : ''}>
              Expense ({tasksForCounting.filter(t => (t.transactionAmount || 0) < 0 && (activeAccountId === 'all' || t.accountId === activeAccountId)).length})
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// --- Main Exported Component ---
export function ReportsView() {
  const { tasks, completedTasks, settings, showToast } = useAppContext();
  const { categories } = settings;

  const [activeAccountId, setActiveAccountId] = useState<number | 'all'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'summary' | 'earnings' | 'activity' | 'raw' | 'history' | 'finances'>('summary');
  const [activeCategoryId, setActiveCategoryId] = useState<number | 'all'>('all');
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<number | 'all'>('all');
  const [activeTransactionTypeFilter, setActiveTransactionTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Task | 'earnings' | 'categoryName' | 'completionDate', direction: 'ascending' | 'descending' } | null>({ key: 'completionDate', direction: 'descending' });
  const [transactionSortConfig, setTransactionSortConfig] = useState<{ key: keyof Task | 'categoryName' | 'transactionAmount', direction: 'ascending' | 'descending' }>({ key: 'openDate', direction: 'descending' });

  const [historyCount, setHistoryCount] = useState<number>(20);

  const handleTabChange = (tab: 'summary' | 'earnings' | 'activity' | 'raw' | 'history' | 'finances') => {
    setActiveTab(tab);
    if (tab === 'finances') {
      const transactionsCategory = categories.find(c => c.name === 'Transactions');
      if (transactionsCategory) {
        setActiveCategoryId(transactionsCategory.id);
      }
    } else {
      // Reset filters when leaving the finances tab
      setActiveAccountId('all');
      setActiveCategoryId('all');
      setActiveTransactionTypeFilter('all');
    }
    setActiveSubCategoryId('all');
  };

  const categoriesForFilter = useMemo(() => {
    if (activeTab !== 'finances') {
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
    const sourceTasks = activeTab === 'finances' ? [...tasks, ...completedTasks] : completedTasks;

    return sourceTasks.filter(task => {
      let taskDate: number;
      if (activeTab === 'finances') {
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
    if (activeTab !== 'finances') return [];

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

    for (const task of allTransactions) {
      const amount = task.transactionAmount || 0;
      if (amount > 0) {
        totalIncome += amount;
      } else if (amount < 0) {
        totalExpenses += amount; // This is a negative number
      }
    }

    return {
      totalIncome,
      totalExpenses: Math.abs(totalExpenses), // Display as a positive value
      netProfit: totalIncome + totalExpenses, // `totalExpenses` is negative, so this is correct
    };
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
      if (activeTransactionTypeFilter === 'income') {
        transactions = transactions.filter(task => (task.transactionAmount || 0) > 0);
      } else if (activeTransactionTypeFilter === 'expense') {
        transactions = transactions.filter(task => (task.transactionAmount || 0) < 0);
      }
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
  }, [dateFilteredTasks, activeCategoryId, activeSubCategoryId, categories, activeAccountId, activeTransactionTypeFilter]);

  const financialSummary = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const task of filteredTransactions) {
      const amount = task.transactionAmount || 0;
      if (amount > 0) {
        totalIncome += amount;
      } else if (amount < 0) {
        totalExpenses += amount; // This is a negative number
      }
    }

    return {
      totalIncome,
      totalExpenses: Math.abs(totalExpenses), // Display as a positive value
      netProfit: totalIncome + totalExpenses, // `totalExpenses` is negative, so this is correct
    };
  }, [filteredTransactions]);

  // --- NEW: Cash Flow Over Time Calculation ---
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
  ];
  const PIE_CHART_COLORS = ['#28a745', '#dc3545']; // Green for Income, Red for Expense

  if (filteredCompletedTasks.length === 0) {
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
      <ReportFilters startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} onExportCsv={() => {}} exportDisabled={true} categories={categories} activeCategoryId={activeCategoryId} setActiveCategoryId={setActiveCategoryId} activeSubCategoryId={activeSubCategoryId} setActiveSubCategoryId={setActiveSubCategoryId} dateFilteredTasks={dateFilteredTasks} activeTab={activeTab} accounts={settings.accounts} activeAccountId={activeAccountId} setActiveAccountId={setActiveAccountId} activeTransactionTypeFilter={activeTransactionTypeFilter} setActiveTransactionTypeFilter={setActiveTransactionTypeFilter} tasksForCounting={tasksForFinanceCounts} />
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
              <span className={`summary-label ${lifetimeFinancialSummary.netProfit >= 0 ? 'income' : 'expense'}`}>Net Profit</span>
              <span className={`summary-value ${lifetimeFinancialSummary.netProfit >= 0 ? 'income' : 'expense'}`}>${lifetimeFinancialSummary.netProfit.toFixed(2)}</span>
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
        onExportCsv={handleExportCsv} categories={categoriesForFilter} activeCategoryId={activeCategoryId} activeTab={activeTab} accounts={settings.accounts} activeAccountId={activeAccountId} setActiveAccountId={setActiveAccountId} tasksForCounting={tasksForFinanceCounts}
        activeTransactionTypeFilter={activeTransactionTypeFilter} setActiveTransactionTypeFilter={setActiveTransactionTypeFilter} setActiveCategoryId={setActiveCategoryId} activeSubCategoryId={activeSubCategoryId} setActiveSubCategoryId={setActiveSubCategoryId} dateFilteredTasks={dateFilteredTasks}
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