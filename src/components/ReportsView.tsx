import React from 'react';
import { formatTime } from '../utils';
import './styles/ReportsView.css';
import { useAppContext } from '../contexts/AppContext';
import { useReports } from '../hooks/useReports';
import { SummaryTab } from './reports/SummaryTab';
import { EarningsTab } from './reports/EarningsTab';
import { ActivityTab } from './reports/ActivityTab';
import { RawDataTab } from './reports/RawDataTab';
import { ReportFilters } from './reports/ReportFilters';
import { HistoryTab } from './reports/HistoryTab';
import { FinancesTab } from './reports/FinancesTab';
import { TaxesTab } from './reports/TaxesTab';

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

// --- Main Exported Component ---
export function ReportsView() {
  const { tasks, completedTasks, settings, setSettings, showToast, navigateToTask } = useAppContext();
  const { categories } = settings;

  const {
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
    completionsByDay,
    completionsByName,
    completionsByCategory,
    totalTasksCompleted,
    totalTimeTracked,
    totalEarnings,
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
    earningsByCategory,
    activityByDay,
    earningsByCategoryPieData,
    earningsOverTimeLineData,
    completionsByCategoryPieData,
    completionsByDayChartData,
    completionsByCategoryChartData,
    completionsByNameChartData,
  } = useReports({ tasks, completedTasks, settings, setSettings, showToast });

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

  const activityChartData = Object.entries(activityByDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let activityChartTitle = 'Activity Over Time';
  if (startDate && endDate) {
    activityChartTitle = `Activity from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
  } else if (startDate) {
    activityChartTitle = `Activity since ${new Date(startDate).toLocaleDateString()}`;
  } else if (endDate) {
    activityChartTitle = `Activity until ${new Date(endDate).toLocaleDateString()}`;
  }
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
        <SummaryTab
          totalTasksCompleted={totalTasksCompleted}
          totalTimeTracked={totalTimeTracked}
          totalEarnings={totalEarnings}
          activityChartTitle={activityChartTitle}
          activityChartData={activityChartData}
        />
      )}

      {activeTab === 'earnings' && (
        <EarningsTab
          pieChartData={earningsByCategoryPieData}
          lineChartData={earningsOverTimeLineData}
          renderCustomizedLabel={renderCustomizedLabel}
        />
      )}

      {activeTab === 'activity' && (
        <ActivityTab
          pieChartData={completionsByCategoryPieData}
          renderCustomizedLabel={renderCustomizedLabel}
        />
      )}

      {activeTab === 'raw' && (
        <RawDataTab
          completionsByDayChartData={completionsByDayChartData}
          completionsByCategoryChartData={completionsByCategoryChartData}
          completionsByName={completionsByNameChartData}
          sortedFilteredTasks={sortedFilteredTasks}
          categories={categories}
          showToast={showToast}
          requestSort={requestSort}
          getSortIndicator={getSortIndicator}
        />
      )}

      {activeTab === 'taxes' && (
        <TaxesTab
          settings={settings}
          setSettings={setSettings}
          tasks={tasks}
          completedTasks={completedTasks}
          selectedTaxYear={selectedTaxYear}
          taxReportData={taxReportData}
          taxIncomeReportData={taxIncomeReportData}
          incomeByType={incomeByType}
          transactionsByTaxCategory={transactionsByTaxCategory}
          navigateToTask={navigateToTask}
          showToast={showToast}
        />
      )}

      {activeTab === 'finances' && ( // Render FinancesTab
        <FinancesTab
          financialSummary={financialSummary}
          incomeExpenseData={incomeExpenseData}
          renderCustomizedLabel={renderCustomizedLabel}
          PIE_CHART_COLORS={PIE_CHART_COLORS}
          cashFlowData={cashFlowData}
          summaryByAccount={summaryByAccount}
          mileageCalculation={mileageCalculation}
          sortedTransferTransactions={sortedTransferTransactions}
          transfersByCategory={transfersByCategory}
          requestTransactionSort={requestTransactionSort}
          getTransactionSortIndicator={getTransactionSortIndicator}
          transferSummary={transferSummary}
          taxCategorizedExpenses={taxCategorizedExpenses}
          requestTaxSort={requestTaxSort}
          taxSortConfig={taxSortConfig}
          sortedTransactions={sortedTransactions}
          categories={categories}
          settings={settings}
        />
      )}

      {activeTab === 'history' && (
        <HistoryTab
          historyCount={historyCount}
          setHistoryCount={setHistoryCount}
          sortedFilteredTasks={sortedFilteredTasks}
          categories={categories}
          showToast={showToast}
          requestSort={requestSort}
          getSortIndicator={getSortIndicator}
        />
      )}
    </div>
  );
}