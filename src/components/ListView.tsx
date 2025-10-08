import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ListViewHeader } from './ListViewHeader';
import { TaskList } from './TaskList';
import { CompletedTasks } from './CompletedTasks';
import { useListView } from '../hooks/useListView';
import './styles/ListView.css';
export function ListView() {
  const {
    tasks, completedTasks, settings, setSettings, searchQuery, setSelectedTaskIds, setVisibleTaskIds, showToast, selectedTaskIds, visibleTaskIds, setActiveCategoryId
  } = useAppContext();

  const {
    isTransactionsView, nonTransactionTasksCount, tasksBeforeTaxFilter, filteredTasks,
    filteredCompletedTasks, selectAllCheckboxRef, allVisibleSelected, someVisibleSelected,
    handleToggleSelectAll, handleSortPillClick, selectAllCompletedCheckboxRef,
    allCompletedVisibleSelected, handleToggleSelectAllCompleted, transactionTotal,
    tasksForAccountCounting, transactionYears, autoCategorizeCounts, uncategorizeTaxCount,
    uncategorizeIncomeCount, autoTaxCategorizeCounts, handleCopyFilteredDetails, handleCopyFilteredTitles,
    handleCopyTitlesByCategory, handleCopyTransactionTitlesAsKeywords,
  } = useListView({
    tasks, completedTasks, settings, setSettings, searchQuery, setActiveCategoryId,
    setSelectedTaskIds, setVisibleTaskIds, showToast, selectedTaskIds, visibleTaskIds
  });

  return (
    <div className="list-view-container">
      <ListViewHeader
        isTransactionsView={isTransactionsView}
        nonTransactionTasksCount={nonTransactionTasksCount}
        handleSortPillClick={handleSortPillClick}
        autoCategorizeCounts={autoCategorizeCounts}
        filteredTasks={filteredTasks}
        uncategorizeTaxCount={uncategorizeTaxCount}
        autoTaxCategorizeCounts={autoTaxCategorizeCounts}
        uncategorizeIncomeCount={uncategorizeIncomeCount}
        transactionYears={transactionYears}
        tasksBeforeTaxFilter={tasksBeforeTaxFilter}
        tasksForAccountCounting={tasksForAccountCounting}
      />
      <TaskList
        filteredTasks={filteredTasks}
        isTransactionsView={isTransactionsView}
        transactionTotal={transactionTotal}
        selectAllCheckboxRef={selectAllCheckboxRef}
        allVisibleSelected={allVisibleSelected}
        handleToggleSelectAll={handleToggleSelectAll}
        handleCopyTransactionTitlesAsKeywords={handleCopyTransactionTitlesAsKeywords}
        handleCopyFilteredDetails={handleCopyFilteredDetails}
        handleCopyFilteredTitles={handleCopyFilteredTitles}
        handleCopyTitlesByCategory={handleCopyTitlesByCategory}
      />
      <CompletedTasks
        filteredCompletedTasks={filteredCompletedTasks}
        selectAllCompletedCheckboxRef={selectAllCompletedCheckboxRef}
        allCompletedVisibleSelected={allCompletedVisibleSelected}
        handleToggleSelectAllCompleted={handleToggleSelectAllCompleted}
      />
    </div>
  );
}