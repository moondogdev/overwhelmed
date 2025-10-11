import React, { useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';

export function useAppLayout() {
  const {
    settings,
    navigateToView,
    historyIndex,
    viewHistory,
    isDirty,
    lastSaveTime,
    autoSaveCountdown,
    handleSaveProject,
    isPromptOpen,
    setIsPromptOpen,
    createManualBackup,
    showToast,
    fullTaskViewId,
    setFullTaskViewId,
    tasks,
    handleTaskUpdate,
    setSettings,
    isWorkSessionManagerOpen,
    nonTransactionTasksCount,
    selectedTaskIds,
    inboxMessages,
    isLoading,
  } = useAppContext();

  const transactionCount = useMemo(() => {
    const transactionsCategory = settings.categories.find(c => c.name === 'Transactions');
    if (!transactionsCategory) return 0;
    const transactionSubCategoryIds = new Set(settings.categories.filter(c => c.parentId === transactionsCategory.id).map(c => c.id));
    return tasks.filter(t => t.categoryId === transactionsCategory.id || (t.categoryId && transactionSubCategoryIds.has(t.categoryId))).length;
  }, [tasks, settings.categories]);

  const fullTask = fullTaskViewId ? tasks.find(t => t.id === fullTaskViewId) : null;

  const sidebarClass = settings.sidebarState === 'hidden' ? 'hidden' : (settings.sidebarState === 'focused' ? 'focused' : '');

  return {
    settings,
    navigateToView,
    historyIndex,
    viewHistory,
    isDirty,
    lastSaveTime,
    autoSaveCountdown,
    handleSaveProject,
    isPromptOpen,
    setIsPromptOpen,
    createManualBackup,
    showToast,
    setFullTaskViewId,
    handleTaskUpdate,
    setSettings,
    isWorkSessionManagerOpen,
    nonTransactionTasksCount,
    selectedTaskIds,
    inboxMessages,
    transactionCount,
    fullTask,
    sidebarClass,    
    isLoading,
  };
}