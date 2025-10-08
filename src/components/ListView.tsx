import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Task, Category, ChecklistSection, ChecklistItem } from '../types';
import { getContrastColor, getRelativeDateHeader, formatTimestamp, formatTime, } from '../utils';
import { TaskAccordion, TaskAccordionHeader, Dropdown } from './TaskComponents';
import { TabbedView, CategoryOptions } from './TaskView';
import { useAppContext } from '../contexts/AppContext';
import { SimpleAccordion } from './SidebarComponents';
import './styles/ListView.css';
 
export function ListView() {
  const {
    tasks, completedTasks, setTasks, settings, setSettings, searchQuery, setSearchQuery, editingTaskId, setEditingTaskId,
    editingText, handleEditChange, handleEditKeyDown, editingViaContext, confirmingClearCompleted, handleClearAll,
    handleCopyList, handleClearCompleted, handleCompleteTask, moveTask, removeTask, handleTaskUpdate, handleAccordionToggle, setSelectedTaskIds, handleAutoCategorize, handleBulkSetIncomeType, navigateToView,
    handleReopenTask, handleDuplicateTask, setActiveCategoryId, handleAutoTagIncomeTypes,
    setActiveSubCategoryId, focusAddTaskInput, setNewTask, setFullTaskViewId, searchInputRef, sortSelectRef, selectedTaskIds, handleToggleTaskSelection, handleAutoTaxCategorize, activeTaxCategoryId, setActiveTaxCategoryId, handleBulkSetTaxCategory, visibleTaskIds, setVisibleTaskIds,
    taxStatusFilter, setTaxStatusFilter, setFocusTaxBulkAdd, activeChecklistRef, showToast, setInboxMessages, handleChecklistCompletion, focusChecklistItemId,
    setFocusChecklistItemId, handleGlobalToggleTimer, handleGlobalStopTimer,
    activeTimerTaskId, activeTimerEntry, activeTimerLiveTime, handleTimerNotify
  } = useAppContext();

  const activeCategoryId = settings.activeCategoryId ?? 'all';
  // const activeTaxCategoryId = settings.activeTaxCategoryId ?? 'all';
  const activeAccountId = settings.activeAccountId ?? 'all';
  const activeTransactionTypeFilter = settings.activeTransactionTypeFilter ?? 'all';
  const activeSubCategoryId = settings.activeSubCategoryId ?? 'all';
  const incomeTypeFilter = settings.incomeTypeFilter ?? 'all';
  const selectedYear = settings.selectedReportYear ?? 'all';

  const parentCategories = settings.categories.filter(c => !c.parentId);
  const subCategoriesForActive = activeCategoryId !== 'all' ? settings.categories.filter(c => c.parentId === activeCategoryId) : [];

  const isTransactionsView = useMemo(() => {
    return settings.currentView === 'transactions';
  }, [settings.currentView]);

  // When switching to the transactions view, ensure the correct category is selected internally.
  useEffect(() => {
    if (isTransactionsView) {
      const transactionsCategory = settings.categories.find(c => c.name === 'Transactions');
      if (transactionsCategory && settings.activeCategoryId !== transactionsCategory.id) {
        setActiveCategoryId(transactionsCategory.id);
      }
    }
  }, [isTransactionsView, settings.categories, settings.activeCategoryId, setActiveCategoryId]);

  const nonTransactionTasksCount = useMemo(() => {
    const transactionsCategory = settings.categories.find(c => c.name === 'Transactions');
    if (!transactionsCategory) {
      return tasks.length;
    }
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

      if (activeCategoryId === 'all' && isTransactionTask) {
        return false;
      }

      const matchesSearch = searchQuery ? task.text.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      if (!matchesSearch) return false;

      if (activeCategoryId === 'all') return true;

      const activeCategory = settings.categories.find(c => c.id === activeCategoryId);
      const parentId = activeCategory?.parentId || activeCategoryId;
      const subCategoriesForParent = settings.categories.filter(c => c.parentId === parentId);

      if (activeSubCategoryId !== 'all') {
        return task.categoryId === activeSubCategoryId;
      }

      const categoryIdsToShow = [parentId, ...subCategoriesForParent.map(sc => sc.id)];
      return categoryIdsToShow.includes(task.categoryId);
    });

    if (isTransactionsView && selectedYear !== 'all') {
      filtered = filtered.filter(task => new Date(task.openDate).getFullYear() === Number(selectedYear));
    }
    return filtered;
  }, [tasks, activeCategoryId, activeSubCategoryId, searchQuery, settings.categories, selectedYear, isTransactionsView]);

  const filteredTasks = useMemo(() => {
    const transactionsCategory = settings.categories.find(c => c.name === 'Transactions');
    const transactionSubCategoryIds = transactionsCategory ? settings.categories.filter(c => c.parentId === transactionsCategory.id).map(c => c.id) : [];
    const allTransactionCategoryIds = new Set(transactionsCategory ? [transactionsCategory.id, ...transactionSubCategoryIds] : []);

    let filtered = tasks.filter(task => {
      const isTransactionTask = task.categoryId ? allTransactionCategoryIds.has(task.categoryId) : false;

      // If 'All' categories are selected, explicitly exclude transaction tasks.
      if (activeCategoryId === 'all' && isTransactionTask) {
        return false;
      }

      const matchesSearch = searchQuery ? task.text.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      if (!matchesSearch) return false;

      // If 'All' is selected and it's not a transaction, include it.
      if (activeCategoryId === 'all') return true;

      const activeCategory = settings.categories.find(c => c.id === activeCategoryId);
      const parentId = activeCategory?.parentId || activeCategoryId;
      const subCategoriesForParent = settings.categories.filter(c => c.parentId === parentId);

      if (activeSubCategoryId !== 'all') {
        return task.categoryId === activeSubCategoryId;
      }

      const categoryIdsToShow = [parentId, ...subCategoriesForParent.map(sc => sc.id)];
      return categoryIdsToShow.includes(task.categoryId);
    });

    // NEW: Add year filtering for transactions view
    if (isTransactionsView && selectedYear !== 'all') {
      filtered = filtered.filter(task => { // @ts-ignore
        return new Date(task.openDate).getFullYear() === selectedYear;
      });
    }

    // NEW: Add account filtering for transactions view
    if (isTransactionsView && activeAccountId !== 'all') {
      filtered = filtered.filter(task => task.accountId === activeAccountId);
    }

    // NEW: Add income/expense filtering for transactions view
    if (isTransactionsView && activeTransactionTypeFilter !== 'all') {
      if (activeTransactionTypeFilter === 'income') {
        filtered = filtered.filter(task => task.transactionType === 'income');
      } else if (activeTransactionTypeFilter === 'expense') {
        filtered = filtered.filter(task => task.transactionType === 'expense');
      } else if (activeTransactionTypeFilter === 'transfer') {
        filtered = filtered.filter(task => task.transactionType === 'transfer');
      }
    }

    // NEW: Add tax status filtering
    if (isTransactionsView && taxStatusFilter !== 'all') {
      if (taxStatusFilter === 'tagged') {
        filtered = filtered.filter(task => task.taxCategoryId !== undefined && task.taxCategoryId !== null);
      } else if (taxStatusFilter === 'untagged') {
        // Also check for 0, as it might be a legacy value for 'none'
        filtered = filtered.filter(task => task.taxCategoryId === undefined || task.taxCategoryId === null || task.taxCategoryId === 0);
      }
    }

    // NEW: Add tax category filtering for transactions view
    if (isTransactionsView && activeTaxCategoryId !== 'all') {
      filtered = filtered.filter(task => task.taxCategoryId === activeTaxCategoryId);
    }

    // NEW: Add income type filtering for transactions view
    if (isTransactionsView && incomeTypeFilter !== 'all') {
      if (incomeTypeFilter === 'untagged') {
        // Show income tasks that have no incomeType
        filtered = filtered.filter(task => (task.transactionAmount || 0) > 0 && !task.incomeType);
      } else {
        filtered = filtered.filter(task => task.incomeType === incomeTypeFilter);
      }
    }

    const currentSortConfig = settings.prioritySortConfig?.[String(activeCategoryId)] || null; // This is fine as is
    if (currentSortConfig) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (currentSortConfig.key === 'timeOpen') {
          aValue = a.createdAt;
          bValue = b.createdAt;
        } else if (currentSortConfig.key === 'priority') {
          const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
          aValue = priorityOrder[a.priority || 'Medium'];
          bValue = priorityOrder[b.priority || 'Medium'];
        } else if (currentSortConfig.key === 'text') {
          // Special case for case-insensitive string sorting
          aValue = a.text.toLowerCase();
          bValue = b.text.toLowerCase();
        } else if (currentSortConfig.key === 'price') {
          // For 'price', prioritize transactionAmount, then fall back to calculated earnings.
          aValue = a.transactionAmount && a.transactionAmount !== 0 
            ? Math.abs(a.transactionAmount) 
            : ((a.manualTime || 0) / (1000 * 60 * 60)) * (a.payRate || 0);
          
          bValue = b.transactionAmount && b.transactionAmount !== 0
            ? Math.abs(b.transactionAmount)
            : ((b.manualTime || 0) / (1000 * 60 * 60)) * (b.payRate || 0);
        } else {
          aValue = a[currentSortConfig.key as keyof Task] || 0;
          bValue = b[currentSortConfig.key as keyof Task] || 0;
        }

        if (aValue < bValue) return currentSortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return currentSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [tasks, activeCategoryId, activeSubCategoryId, searchQuery, settings.categories, settings.prioritySortConfig, selectedYear, activeAccountId, activeTransactionTypeFilter, activeTaxCategoryId, isTransactionsView, taxStatusFilter, incomeTypeFilter]);
  
  const filteredCompletedTasks = useMemo(() => {
    return completedTasks.filter(task => {
      const matchesSearch = searchQuery ? task.text.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      if (!matchesSearch) return false;

      if (activeCategoryId === 'all') return true;

      const activeCategory = settings.categories.find(c => c.id === activeCategoryId);
      const parentId = activeCategory?.parentId || activeCategoryId;
      const subCategoriesForParent = settings.categories.filter(c => c.parentId === parentId);

      if (activeSubCategoryId !== 'all') {
        return task.categoryId === activeSubCategoryId;
      }

      const categoryIdsToShow = [parentId, ...subCategoriesForParent.map(sc => sc.id)];
      return categoryIdsToShow.includes(task.categoryId);
    });
  }, [completedTasks, searchQuery, activeCategoryId, activeSubCategoryId, settings.categories]);

  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVisibleTaskIds(filteredTasks.map(task => task.id));
  }, [filteredTasks, setVisibleTaskIds]);

  const allVisibleSelected = useMemo(() => 
    visibleTaskIds.length > 0 && visibleTaskIds.every(id => selectedTaskIds.includes(id)),
    [visibleTaskIds, selectedTaskIds]
  );

  const someVisibleSelected = useMemo(() => 
    visibleTaskIds.length > 0 && visibleTaskIds.some(id => selectedTaskIds.includes(id)),
    [visibleTaskIds, selectedTaskIds]
  );

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
    }
  }, [someVisibleSelected, allVisibleSelected]);

  const handleToggleSelectAll = () => {
    const visibleIdsSet = new Set(visibleTaskIds);
    setSelectedTaskIds(prev => allVisibleSelected ? prev.filter(id => !visibleIdsSet.has(id)) : [...new Set([...prev, ...visibleTaskIds])]);
  };

  const handleSortPillClick = (key: string, direction: 'asc' | 'desc') => {
    const newSortConfig = { ...settings.prioritySortConfig };
    newSortConfig[String(activeCategoryId)] = { key: key as any, direction: direction as any };
    setSettings(prev => ({ ...prev, prioritySortConfig: newSortConfig }));
    if (sortSelectRef.current) sortSelectRef.current.value = `${key}-${direction}`;
  };

  // --- Logic for "Select All" in Completed Tasks (Moved to top level) ---
  const selectAllCompletedCheckboxRef = useRef<HTMLInputElement>(null);

  const visibleCompletedTaskIds = useMemo(() => filteredCompletedTasks.map(task => task.id), [filteredCompletedTasks]);

  const allCompletedVisibleSelected = useMemo(() =>
    visibleCompletedTaskIds.length > 0 && visibleCompletedTaskIds.every(id => selectedTaskIds.includes(id)),
    [visibleCompletedTaskIds, selectedTaskIds]
  );

  const someCompletedVisibleSelected = useMemo(() =>
    visibleCompletedTaskIds.length > 0 && visibleCompletedTaskIds.some(id => selectedTaskIds.includes(id)),
    [visibleCompletedTaskIds, selectedTaskIds]
  );

  useEffect(() => {
    if (selectAllCompletedCheckboxRef.current) {
      selectAllCompletedCheckboxRef.current.indeterminate = someCompletedVisibleSelected && !allCompletedVisibleSelected;
    }
  }, [someCompletedVisibleSelected, allCompletedVisibleSelected]);

  const handleToggleSelectAllCompleted = () => {
    const visibleIdsSet = new Set(visibleCompletedTaskIds);
    setSelectedTaskIds(prev => allCompletedVisibleSelected ? prev.filter(id => !visibleIdsSet.has(id)) : [...new Set([...prev, ...visibleIdsSet])]);
  };

  const transactionTotal = useMemo(() => {
    return filteredTasks.reduce((sum, task) => sum + (task.transactionAmount || 0), 0);
  }, [filteredTasks]);

  const tasksForAccountCounting = useMemo(() => {
    if (!isTransactionsView) return [];

    let filtered = tasks.filter(task => {
      const matchesSearch = searchQuery ? task.text.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      if (!matchesSearch) return false;

      if (activeCategoryId === 'all') return true;

      // If a sub-category is selected, only count tasks within it.
      if (activeSubCategoryId !== 'all') {
        return task.categoryId === activeSubCategoryId;
      }

      // Otherwise, count tasks in the parent category and all its sub-categories.
      const parentCategory = settings.categories.find(c => c.id === activeCategoryId);
      const subCategoryIds = settings.categories.filter(sc => sc.parentId === parentCategory?.id).map(sc => sc.id);
      return task.categoryId === activeCategoryId || subCategoryIds.includes(task.categoryId);
    });

    // Also filter by the active tax category if one is selected.
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
    return Array.from(years).sort((a, b) => b - a); // Sort descending
  }, [tasks, isTransactionsView]);

  const autoCategorizeCounts = useMemo(() => {
    if (!isTransactionsView) return {};

    const transactionsCategory = settings.categories.find(c => c.name === 'Transactions');
    if (!transactionsCategory) return {};

    const subCategoriesWithKeywords = settings.categories.filter(
      c => c.parentId === transactionsCategory.id && c.autoCategorizationKeywords && c.autoCategorizationKeywords.length > 0
    );

    const counts: { [key: string]: number } = {};
    let totalCategorizable = 0;
    const categorizableIds = new Set<number>();

    for (const subCat of subCategoriesWithKeywords) {
      counts[subCat.id] = 0;
      for (const task of filteredTasks) {
        // A task is a candidate if it's not already in this sub-category and its text matches a keyword.
        if (task.categoryId !== subCat.id && (subCat.autoCategorizationKeywords || []).some(kw => task.text.toLowerCase().includes(kw.toLowerCase().trim()))) {
          counts[subCat.id]++;
          if (!categorizableIds.has(task.id)) {
            categorizableIds.add(task.id);
          }
        }
      }
    }
    counts['all'] = categorizableIds.size;
    return counts;
  }, [filteredTasks, settings.categories, isTransactionsView]);

  const uncategorizeTaxCount = useMemo(() => {
    if (!isTransactionsView) return 0;
    return filteredTasks.filter(t => t.taxCategoryId !== undefined).length;
  }, [filteredTasks, isTransactionsView]);

  const uncategorizeIncomeCount = useMemo(() => {
    if (!isTransactionsView) return 0;
    // Count tasks in the current filtered view that have an incomeType set.
    return filteredTasks.filter(t => t.incomeType !== undefined && t.incomeType !== null).length;
  }, [filteredTasks, isTransactionsView]);

  const handleCopyFilteredDetails = () => {
    if (filteredTasks.length === 0) {
      showToast('No tasks to copy.');
      return;
    }

    const report = filteredTasks.map(task => {
      const category = settings.categories.find(c => c.id === task.categoryId);
      let categoryName = 'Uncategorized';
      if (category) {
        if (category.parentId) {
          const parent = settings.categories.find(p => p.id === category.parentId);
          categoryName = `${parent?.name || ''} > ${category.name}`;
        } else {
          categoryName = category.name;
        }
      }

      return [
        `Task Title: ${task.text || 'N/A'}`,
        `URL: ${task.url || 'N/A'}`,
        `Category: ${categoryName}`,
        `Open Date: ${formatTimestamp(task.openDate)}`,
        `Due Date: ${task.completeBy ? formatTimestamp(task.completeBy) : 'N/A'}`,
        `Company: ${task.company || 'N/A'}`,
        `Website URL: ${task.websiteUrl || 'N/A'}`
      ].join('\n');
    }).join('\n\n---\n\n');

    navigator.clipboard.writeText(report).then(() => showToast(`${filteredTasks.length} task(s) details copied!`));
  };

  const handleCopyFilteredTitles = () => {
    if (filteredTasks.length === 0) {
      showToast('No task titles to copy.');
      return;
    }

    const titles = filteredTasks.map(task => task.text).join('\n');
    const report = `Tasks:\n${titles}`;

    navigator.clipboard.writeText(report).then(() => showToast(`${filteredTasks.length} task title(s) copied!`));
  };

  const handleCopyTitlesByCategory = () => {
    if (filteredTasks.length === 0) {
      showToast('No tasks to copy.');
      return;
    }

    const tasksByCategory = new Map<number | undefined, Task[]>();

    // Group tasks by categoryId
    for (const task of filteredTasks) {
      if (!tasksByCategory.has(task.categoryId)) {
        tasksByCategory.set(task.categoryId, []);
      }
      tasksByCategory.get(task.categoryId)!.push(task);
    }

    const reportBlocks: string[] = [];

    // Create a block for each category that has tasks in the filtered list
    tasksByCategory.forEach((tasks, categoryId) => {
      const category = settings.categories.find(c => c.id === categoryId);
      let categoryName = 'Uncategorized';
      if (category) {
        const parent = category.parentId ? settings.categories.find(p => p.id === category.parentId) : null;
        categoryName = parent ? `${parent.name} > ${category.name}` : category.name;
      }

      const taskTitles = tasks.map(task => task.text).join('\n');
      reportBlocks.push(`${categoryName}:\n${taskTitles}`);
    });

    const finalReport = reportBlocks.join('\n\n---\n\n');

    navigator.clipboard.writeText(finalReport).then(() => showToast(`Categorized task list copied!`));
  };

  const handleCopyTransactionTitlesAsKeywords = () => {
    if (filteredTasks.length === 0) {
      showToast('No transaction titles to copy.');
      return;
    }

    // Clean up titles and join by comma for keyword input
    const titlesAsKeywords = filteredTasks.map(task => task.text.trim()).join(', ');

    navigator.clipboard.writeText(titlesAsKeywords).then(() => showToast(`${filteredTasks.length} transaction title(s) copied as keywords!`));
  };

  const autoTaxCategorizeCounts = useMemo(() => {
    if (!isTransactionsView || !settings.taxCategories || settings.taxCategories.length === 0) return {};

    const counts: { [key: string]: number } = {};
    const taggableIds = new Set<number>();

    for (const taxCat of settings.taxCategories) {
      counts[taxCat.id] = 0;
      for (const task of filteredTasks) {
        // A task is a candidate if it doesn't have a tax category yet
        // AND its text matches a keyword.
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


  return (
    <div className="list-view-container">
      {!isTransactionsView && (
        <div className="category-tabs">
          <button onClick={() => { setActiveCategoryId('all'); setActiveSubCategoryId('all'); setSearchQuery(''); setSettings(prev => ({ ...prev, selectedReportYear: null, activeAccountId: 'all', activeTransactionTypeFilter: 'all' })); setActiveTaxCategoryId('all'); }}
            className={`all-category-btn ${activeCategoryId === 'all' ? 'active' : ''}`}
            style={{
              backgroundColor: settings.allCategoryColor || '#4a4f5b',
              color: getContrastColor(settings.allCategoryColor || '#4a4f5b')
            }}
          >
            All ({nonTransactionTasksCount})
          </button>
          {parentCategories
            .filter(cat => cat.name !== 'Transactions') // Exclude "Transactions" from the main tabs
            .map((cat: Category) => {
            const subCatIds = settings.categories.filter(sc => sc.parentId === cat.id).map(sc => sc.id);
            const count = tasks.filter(t => t.categoryId === cat.id || (t.categoryId && subCatIds.includes(t.categoryId))).length;
            return (
              <button
                key={cat.id} onClick={() => { setActiveCategoryId(cat.id); setActiveSubCategoryId('all'); setSearchQuery(''); setSettings(prev => ({ ...prev, selectedReportYear: null, activeAccountId: 'all', activeTransactionTypeFilter: 'all' })); setActiveTaxCategoryId('all'); }}
                className={activeCategoryId === cat.id ? 'active' : ''}
                style={{
                  backgroundColor: cat.color || 'transparent',
                  color: getContrastColor(cat.color || '#282c34')
                }}>
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      )}
      {subCategoriesForActive.length > 0 && (
        <div className="sub-category-tabs">
          {(() => {
            const parentCategory = settings.categories.find(c => c.id === activeCategoryId);
            const subCatIds = settings.categories.filter(sc => sc.parentId === parentCategory?.id).map(sc => sc.id);
            const totalCount = tasks.filter(t => t.categoryId === parentCategory?.id || (t.categoryId && subCatIds.includes(t.categoryId))).length;
            return (
              <button onClick={() => { setActiveSubCategoryId('all'); setSearchQuery(''); setSettings(prev => ({ ...prev, selectedReportYear: null, activeAccountId: 'all', activeTransactionTypeFilter: 'all' })); setActiveTaxCategoryId('all'); }}
                className={`all-category-btn ${activeSubCategoryId === 'all' ? 'active' : ''}`}
                style={{
                  backgroundColor: parentCategory?.color || '#3a3f4b',
                  color: getContrastColor(parentCategory?.color || '#3a3f4b')
                }}
              >All ({totalCount})</button>
            );
          })()}
          {subCategoriesForActive.map(subCat => {
            const count = tasks.filter(t => t.categoryId === subCat.id).length;
            // For transactions view, hide sub-categories with 0 count to reduce clutter.
            if (isTransactionsView && count === 0) {
              return null;
            }
            return (
              <button key={subCat.id} onClick={() => { setActiveSubCategoryId(subCat.id); setSearchQuery(''); setSettings(prev => ({ ...prev, selectedReportYear: null, activeAccountId: 'all', activeTransactionTypeFilter: 'all' })); setActiveTaxCategoryId('all'); }} className={activeSubCategoryId === subCat.id ? 'active' : ''} style={{
                  backgroundColor: subCat.color || '#3a3f4b',
                  color: getContrastColor(subCat.color || '#3a3f4b')
                }}>
                {subCat.name} ({count})
              </button>
            );
          })}
        </div>
      )}
      <div className="list-view-controls">
        <div className="list-header-search" style={{ width: '100%' }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchQuery('');
              }
            }}
          />
          <button className="clear-search-btn" onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }} title="Clear Search"><i className="fas fa-times"></i></button>
        </div>
        <div className="list-header-sort">
          <label>Sort by:
            <select ref={sortSelectRef}
              onChange={(e) => {
                const value = e.target.value;
                const newSortConfig = { ...settings.prioritySortConfig };
                if (value === 'none') {
                  newSortConfig[String(activeCategoryId)] = null;
                } else {
                  const [key, direction] = value.split('-');
                  newSortConfig[String(activeCategoryId)] = { key: key as any, direction: direction as any };
                }
                setSettings(prev => ({ ...prev, prioritySortConfig: newSortConfig }));
              }}
              value={settings.prioritySortConfig?.[String(activeCategoryId)] ? `${settings.prioritySortConfig[String(activeCategoryId)].key}-${settings.prioritySortConfig[String(activeCategoryId)].direction}` : 'none'}
            >
              <option value="none">Default (Manual)</option>
              <option value="completeBy-asc">Due Date (Soonest First)</option>
              <option value="text-asc">Task Name (A-Z)</option>
              <option value="text-desc">Task Name (Z-A)</option>
              <option value="priority-asc">Priority (High to Low)</option>
              <option value="openDate-desc">Open Date (Newest First)</option>
              <option value="openDate-asc">Open Date (Oldest First)</option>
              <option value="timeOpen-desc">Time Open (Longest First)</option>
              <option value="price-desc">Price (Highest First)</option>
              <option value="price-asc">Price (Lowest First)</option>
            </select>
          </label>
        </div>
        <div className="list-header-sort-pills">
          {settings.prioritySortConfig?.[String(activeCategoryId)] && (
            <button className="clear-sort-btn" onClick={() => { setSettings(prev => ({ ...prev, prioritySortConfig: { ...prev.prioritySortConfig, [String(activeCategoryId)]: null } })); if (sortSelectRef.current) sortSelectRef.current.value = 'none'; }} title="Clear Sort"><i className="fas fa-times"></i></button>
          )}
          {(() => {
            const activeCategory = settings.categories.find(c => c.id === activeCategoryId);
            if (activeCategory?.name === 'Transactions') {
              const currentSort = settings.prioritySortConfig?.[String(activeCategoryId)];
              const isActive = (key: keyof Task | 'price', dir: string) => currentSort?.key === key && currentSort?.direction === dir;
              return (
                <>
                  <span className="list-filter-title">Quick Sort:</span>
                  <button className={isActive('price', 'desc') ? 'active' : ''} onClick={() => handleSortPillClick('price', 'desc')}>Price (Highest)</button>
                  <button className={isActive('price', 'asc') ? 'active' : ''} onClick={() => handleSortPillClick('price', 'asc')}>Price (Lowest)</button>
                  <button className={isActive('openDate', 'desc') ? 'active' : ''} onClick={() => handleSortPillClick('openDate', 'desc')}>Date (Newest)</button>
                  <button className={isActive('openDate', 'asc') ? 'active' : ''} onClick={() => handleSortPillClick('openDate', 'asc')}>Date (Oldest)</button>
                  <button className={isActive('text', 'asc') ? 'active' : ''} onClick={() => handleSortPillClick('text', 'asc')}>Name (A-Z)</button>
                  <button className={isActive('text', 'desc') ? 'active' : ''} onClick={() => handleSortPillClick('text', 'desc')}>Name (Z-A)</button>
                </>
              );
            } else {
              const currentSort = settings.prioritySortConfig?.[String(activeCategoryId)];
              const isActive = (key: keyof Task | 'timeOpen', dir: string) => currentSort?.key === key && currentSort?.direction === dir;
              return (
                <>
                  <span className="list-filter-title">Quick Sort:</span>
                  <button className={isActive('completeBy', 'asc') ? 'active' : ''} onClick={() => handleSortPillClick('completeBy', 'asc')}>Due Date</button>
                  <button className={isActive('priority', 'asc') ? 'active' : ''} onClick={() => handleSortPillClick('priority', 'asc')}>Priority</button>
                  <button className={isActive('openDate', 'desc') ? 'active' : ''} onClick={() => handleSortPillClick('openDate', 'desc')}>Newest</button>
                  <button className={isActive('text', 'asc') ? 'active' : ''} onClick={() => handleSortPillClick('text', 'asc')}>Name (A-Z)</button>
                </>
              );
            }
          })()}
        </div>
        {isTransactionsView && (
          <div className="list-header-year-filter filter-group-auto-categorize">
            {(autoCategorizeCounts['all'] || 0) > 0 && (
              <>
                <div className="list-filter-title-container">
                  <span className="list-filter-title">Auto-Categorize:</span>
                  <button className="icon-button" onClick={() => {
                      const autoCategorizeAccordionId = -3;
                      setSettings(prev => ({ ...prev, openAccordionIds: [...new Set([...prev.openAccordionIds, autoCategorizeAccordionId])] }));
                  }} title="Open Transaction Autocategorize Settings">
                      <i className="fas fa-cog"></i>
                  </button>
                </div>
                <div className="list-auto-cat-btn-container">
                  {settings.categories
                    .filter(c => c.parentId === settings.categories.find(p => p.name === 'Transactions')?.id && (autoCategorizeCounts[c.id] || 0) > 0)
                    .map(subCat => (
                      <button key={subCat.id} onClick={() => handleAutoCategorize(filteredTasks.map(t => t.id), subCat.id)} title={`Categorize based on "${subCat.name}" keywords`}>
                        {subCat.name} ({autoCategorizeCounts[subCat.id] || 0})
                      </button>
                    ))}
                </div>
                <div className="list-auto-cat-all-container">
                  <button onClick={() => handleAutoCategorize(filteredTasks.map(t => t.id))} title="Run all auto-categorization rules"><i className="fas fa-magic"></i> Auto-Categorize All ({autoCategorizeCounts['all'] || 0})</button>
                </div>
              </>
            )}
            {(autoCategorizeCounts['all'] || 0) === 0 && (
              <div className="auto-cat-zero-state">
                <span>All visible transactions are categorized.</span>
                <button onClick={() => setSettings(prev => ({ ...prev, openAccordionIds: [...new Set([...prev.openAccordionIds, -3])] }))}>Add Keywords</button>
              </div>
            )}
          </div>
        )}
        {isTransactionsView && settings.taxCategories && settings.taxCategories.length > 0 && (
          <div className="list-header-year-filter filter-group-auto-categorize tax-cat">
            <div className="list-filter-title-container">
              <span className="list-filter-title">Auto-Tag for Taxes:</span>
              <button className="icon-button" onClick={() => {
                  const taxManagerAccordionId = -4;
                  setSettings(prev => ({ ...prev, openAccordionIds: [...new Set([...prev.openAccordionIds, taxManagerAccordionId])] }));
              }} title="Open Tax Category Manager">
                  <i className="fas fa-cog"></i>
              </button>
              {uncategorizeTaxCount > 0 && (
                <button 
                  className="uncategorize-all-btn"
                  onClick={() => {
                    handleBulkSetTaxCategory(filteredTasks.map(t => t.id), undefined);
                    if (activeTaxCategoryId !== 'all') {
                      setActiveTaxCategoryId('all');
                    }
                  }}
                  title="Remove tax category from all visible items"><i className="fas fa-times-circle"></i> Uncategorize All ({uncategorizeTaxCount})</button>
              )}
            </div>
            {(autoTaxCategorizeCounts['all'] || 0) > 0 ? (
              <>
                <div className="list-auto-cat-btn-container">
                    {settings.taxCategories
                      .filter(taxCat => (autoTaxCategorizeCounts[taxCat.id] || 0) > 0)
                      .map(taxCat => (
                        <button key={taxCat.id} onClick={() => handleAutoTaxCategorize(filteredTasks.map(t => t.id), taxCat.id)} title={`Tag based on "${taxCat.name}" keywords`}>
                          {taxCat.name} ({autoTaxCategorizeCounts[taxCat.id] || 0})
                        </button>
                      ))
                    }
                </div>
                <div className="list-auto-cat-all-container">
                  <button 
                    onClick={() => handleAutoTaxCategorize(filteredTasks.map(t => t.id))} 
                    title="Run all tax auto-tagging rules on visible items">
                    <i className="fas fa-tags"></i> Auto-Tag All ({autoTaxCategorizeCounts['all'] || 0})
                  </button>
                </div>
              </>
            ) : (
              filteredTasks.some(t => !t.taxCategoryId) ? (
                <div className="auto-cat-zero-state">
                  <span>No keyword matches found for untagged items.</span>
                  <button onClick={() => {
                    setSettings(prev => ({ ...prev, openAccordionIds: [...new Set([...prev.openAccordionIds, -4])] }));
                    setFocusTaxBulkAdd(true);
                  }}>Add Keywords</button>
                </div>
              ) : (
                <div className="auto-cat-zero-state"><span>All visible transactions are tax-tagged.</span></div>
              )
            )}
          </div>
        )}
        {isTransactionsView && settings.incomeTypeKeywords && (
          <div className="list-header-year-filter filter-group-auto-categorize income-cat">
            <div className="list-filter-title-container">
              <span className="list-filter-title">Auto-Tag Income:</span>
              <button className="icon-button" onClick={() => {
                  const taxManagerAccordionId = -4; // It's in the Tax Manager accordion
                  setSettings(prev => ({ ...prev, openAccordionIds: [...new Set([...prev.openAccordionIds, taxManagerAccordionId])] }));
              }} title="Open Income Keyword Settings">
                  <i className="fas fa-cog"></i>
              </button>
              {uncategorizeIncomeCount > 0 && (
                <button
                  className="uncategorize-all-btn"
                  onClick={() => handleBulkSetIncomeType(filteredTasks.map(t => t.id), undefined)}
                  title="Remove income type from all visible items"
                >
                  <i className="fas fa-times-circle"></i> Uncategorize All ({uncategorizeIncomeCount})
                </button>
              )}
            </div>
            <div className="list-auto-cat-btn-container">
              {(settings.incomeTypeKeywords.w2 || []).length > 0 && (
                <button onClick={() => handleAutoTagIncomeTypes(filteredTasks.map(t => t.id), 'w2')} title="Tag items matching 'W-2' keywords">
                  W-2 Wages
                </button>
              )}
              {(settings.incomeTypeKeywords.business || []).length > 0 && (
                <button onClick={() => handleAutoTagIncomeTypes(filteredTasks.map(t => t.id), 'business')} title="Tag items matching 'Business' keywords">
                  Business
                </button>
              )}
              {(settings.incomeTypeKeywords.reimbursement || []).length > 0 && (
                <button onClick={() => handleAutoTagIncomeTypes(filteredTasks.map(t => t.id), 'reimbursement')} title="Tag items matching 'Reimbursement' keywords">
                  Reimbursement
                </button>
              )}
            </div>
            <div className="list-auto-cat-all-container">
              <button onClick={() => handleAutoTagIncomeTypes(filteredTasks.map(t => t.id))} title="Run all income auto-tagging rules">
                <i className="fas fa-dollar-sign"></i> Auto-Tag All Income
              </button>
            </div>
          </div>
        )}
        {isTransactionsView && transactionYears.length > 1 && (
          <div className="list-header-year-filter filter-group-year"><span className="list-filter-title">Filter by Year:</span><button className={selectedYear === 'all' ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, selectedReportYear: null }))}>All Years</button>
            {transactionYears.map(year => (
              <button key={year} className={selectedYear === year ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, selectedReportYear: year }))}>{year}</button>
            ))}
          </div>
        )}
        {isTransactionsView && settings.taxCategories && settings.taxCategories.length > 0 && (
          <div className="category-tabs tax-category-tabs">
            <button className={activeTaxCategoryId === 'all' ? 'active' : ''} onClick={() => setActiveTaxCategoryId('all')}>
              All Tax Categories
            </button>
            {settings.taxCategories.map(taxCat => {
              const count = tasksBeforeTaxFilter.filter(t => t.taxCategoryId === taxCat.id).length;
              if (count === 0) return null;
              return (
                <button key={taxCat.id} className={activeTaxCategoryId === taxCat.id ? 'active' : ''} onClick={() => setActiveTaxCategoryId(taxCat.id)}>{taxCat.name} ({count})</button>
              );
            })}
          </div>
        )}
        {isTransactionsView && settings.accounts.length > 0 && (
          <div className="list-header-year-filter filter-group-account">
            <span className="list-filter-title">Filter by Account:</span><button className={activeAccountId === 'all' ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, activeAccountId: 'all' }))}>
              All Accounts ({tasksForAccountCounting.length})
            </button>
            {settings.accounts.map(account => {
              const count = tasksForAccountCounting.filter(t => t.accountId === account.id).length;
              if (count === 0) return null;
              return (
                <button key={account.id} className={activeAccountId === account.id ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, activeAccountId: account.id }))}>
                  {account.name} ({count})
                </button>
              );
            })}
          </div>
        )}
        {isTransactionsView && (
          <div className="list-header-year-filter filter-group-transaction-type">
            <span className="list-filter-title">Filter by Type:</span><button className={activeTransactionTypeFilter === 'all' ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, activeTransactionTypeFilter: 'all' }))}>
              All Types ({tasksForAccountCounting.filter(t => activeAccountId === 'all' || t.accountId === activeAccountId).length})
            </button>
            {(() => {              
              const incomeCount = tasksForAccountCounting.filter(t => t.transactionType === 'income' && (activeAccountId === 'all' || t.accountId === activeAccountId)).length;
              if (incomeCount > 0) {
                return <button className={activeTransactionTypeFilter === 'income' ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, activeTransactionTypeFilter: 'income' }))}>Income ({incomeCount})</button>;
              }
              return null;
            })()}
            {(() => {
              const expenseCount = tasksForAccountCounting.filter(t => t.transactionType === 'expense' && (activeAccountId === 'all' || t.accountId === activeAccountId)).length;
              if (expenseCount > 0) {
                return <button className={activeTransactionTypeFilter === 'expense' ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, activeTransactionTypeFilter: 'expense' }))}>Expense ({expenseCount})</button>;
              }
              return null;
            })()}
            {(() => {
              const transferCount = tasksForAccountCounting.filter(t => t.transactionType === 'transfer' && (activeAccountId === 'all' || t.accountId === activeAccountId)).length;
              if (transferCount > 0) {
                return <button className={activeTransactionTypeFilter === 'transfer' ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, activeTransactionTypeFilter: 'transfer' }))}>Transfers ({transferCount})</button>;
              }
            })()}
          </div>
        )}
        {isTransactionsView && (
          <div className="list-header-year-filter filter-group-tax-status">
            <span className="list-filter-title">Tax Status:</span>
            <button className={taxStatusFilter === 'all' ? 'active' : ''} onClick={() => setTaxStatusFilter('all')}>
              All
            </button>
            <button className={taxStatusFilter === 'tagged' ? 'active' : ''} onClick={() => setTaxStatusFilter('tagged')}>
              Tagged
            </button>
            <button className={taxStatusFilter === 'untagged' ? 'active' : ''} onClick={() => setTaxStatusFilter('untagged')}>
              Untagged
            </button>
          </div>
        )}
        {isTransactionsView && activeTransactionTypeFilter === 'income' && (
          <div className="list-header-year-filter filter-group-income-type">
            <span className="list-filter-title">Filter by Income Tag:</span>
            <button className={incomeTypeFilter === 'all' ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, incomeTypeFilter: 'all' }))}>
              All
            </button>
            <button className={incomeTypeFilter === 'w2' ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, incomeTypeFilter: 'w2' }))}>
              W-2
            </button>
            <button className={incomeTypeFilter === 'business' ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, incomeTypeFilter: 'business' }))}>
              Business
            </button>
            <button className={incomeTypeFilter === 'reimbursement' ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, incomeTypeFilter: 'reimbursement' }))}>
              Reimbursement
            </button>
            <button className={incomeTypeFilter === 'untagged' ? 'active' : ''} onClick={() => setSettings(prev => ({ ...prev, incomeTypeFilter: 'untagged' }))}>
              Untagged
            </button>
          </div>
        )}
      </div>
      {isTransactionsView && (
        <div className="list-view-report-shortcuts">
          <button onClick={() => navigateToView('reports', { initialTab: 'finances' })}>
            <i className="fas fa-chart-pie"></i> Go to Finances Report
          </button>
          <button onClick={() => navigateToView('reports', { initialTab: 'taxes' })}>
            <i className="fas fa-file-invoice-dollar"></i> Go to Taxes Report
          </button>
        </div>
      )}
      {filteredTasks.length > 0 ? (
        <>
          <div className="list-header">
            <h3>
              {(() => {
                if (activeCategoryId === 'all') return 'All Open Tasks';
                if (activeSubCategoryId !== 'all') {
                  return `${settings.categories.find(c => c.id === activeSubCategoryId)?.name || 'Sub-Category'}: Priority List`;
                }
                const parentCategory = settings.categories.find(c => c.id === activeCategoryId);;
                return `${parentCategory?.name || 'Category'}: Priority List`;
              })()} ({filteredTasks.length})
              {isTransactionsView && (
                <span className={`transaction-total-pill ${transactionTotal >= 0 ? 'income' : 'expense'}`}>
                  Total: ${transactionTotal.toFixed(2)}
                </span>
              )}
            </h3>
            <div className="list-header-actions" onContextMenu={(e) => { e.stopPropagation(); }}>
              <button className="icon-button" onClick={handleClearAll} title="Clear All Tasks"><i className="fas fa-trash"></i></button>
              <input
                type="checkbox"
                ref={selectAllCheckboxRef}
                checked={allVisibleSelected}
                onChange={handleToggleSelectAll}
                title={allVisibleSelected ? "Deselect All Visible" : "Select All Visible"}
              />
              {isTransactionsView ? (
                <button className="icon-button" onClick={handleCopyTransactionTitlesAsKeywords} title="Copy Visible Titles as Keywords">
                  <i className="fas fa-quote-right"></i>
                </button>
              ) : null}
              {!isTransactionsView ? (
                <button className="icon-button" onClick={handleCopyFilteredDetails} title="Copy Details for Visible Tasks">
                  <i className="fas fa-clipboard-list"></i>
                </button>
              ) : null}
              {!isTransactionsView ? (
                <button className="icon-button" onClick={handleCopyFilteredTitles} title="Copy Titles for Visible Tasks">
                  <i className="fas fa-list-ul"></i>
                </button>
              ) : null}
              {!isTransactionsView ? (
                <button className="icon-button" onClick={handleCopyTitlesByCategory} title="Copy Titles Grouped by Category">
                  <i className="fas fa-sitemap"></i>
                </button>
              ) : null}
              <button className="icon-button" onClick={handleCopyList} title="Copy Task List Summary"><i className="fas fa-copy"></i></button>
            </div>
            <div className="button-group">
              <button className="icon-button" onClick={() => { const allVisibleIds = filteredTasks.map(t => t.id);
                setSettings(prev => ({ ...prev, openAccordionIds: allVisibleIds }))
              }} title="Expand All"><i className="fas fa-folder-open"></i></button>
              <button className="icon-button" onClick={() => setSettings(prev => ({ ...prev, openAccordionIds: [] }))} title="Collapse All"><i className="fas fa-folder"></i></button>
            </div>
          </div>
          
          <div className="priority-list-main">
            {settings.prioritySortConfig?.[String(activeCategoryId)]?.key === 'completeBy' && settings.prioritySortConfig?.[String(activeCategoryId)]?.direction === 'asc' ? (
              (() => {
                const tasksByDate = filteredTasks.reduce((acc, task) => {
                  // This is the corrected logic. It creates a date string based on the local timezone,
                  // not UTC, which prevents tasks from being incorrectly grouped into the next or previous day.
                  let date = '0000-no-due-date';
                  if (task.completeBy) {
                    const d = new Date(task.completeBy);
                    // Format to YYYY-MM-DD in local time
                    date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  }
                  if (!acc[date]) acc[date] = [];
                  acc[date].push(task);
                  return acc;
                }, {} as Record<string, Task[]>);

                const sortedDates = Object.keys(tasksByDate).sort();

                return sortedDates.map(dateStr => {
                  const tasksOnDate = tasksByDate[dateStr];
                  const isNoDueDate = dateStr === '0000-no-due-date';
                  let headerText = isNoDueDate ? 'No Due Date' : getRelativeDateHeader(dateStr);
                  const taskCountText = `(${tasksOnDate.length} ${tasksOnDate.length === 1 ? 'task' : 'tasks'})`;
                  return (
                    <div key={dateStr} className="date-group-container">
                      <h4 className={`date-group-header ${isNoDueDate ? 'no-due-date-header' : ''}`}>
                        {headerText} 
                        <span className="date-group-task-count">{taskCountText}</span>
                      </h4>
                      {tasksOnDate.map((task, index) => (
                        <div key={task.id} className="priority-list-item" data-task-id={task.id}>
                          {editingTaskId === task.id ? (
                            <input type="text" value={editingText} onChange={handleEditChange} onKeyDown={(e) => handleEditKeyDown(e, task.id)} onBlur={() => setEditingTaskId(null)} autoFocus/>
                          ) : (
                            <TaskAccordion task={task} isOpen={settings.openAccordionIds.includes(task.id)} onToggle={() => handleAccordionToggle(task.id)} settings={settings} completedTasks={completedTasks} onUpdate={(updatedTask, options) => {
                              handleTaskUpdate(updatedTask);
                              // If this was the last task in a filtered tax view, reset the view.
                              if (options?.action === 'tax-uncategorize' && activeTaxCategoryId !== 'all' && filteredTasks.length === 1) {
                                setActiveTaxCategoryId('all');
                              }
                            }} onNotify={handleTimerNotify}
                            title={<TaskAccordionHeader task={task} settings={settings} onCategoryClick={(e, catId, parentId) => { e.stopPropagation(); setActiveCategoryId(parentId || catId); if (parentId) { setActiveSubCategoryId(catId); } else { setActiveSubCategoryId('all'); } }} allTasks={[...tasks, ...completedTasks]} onUpdate={handleTaskUpdate} onNotify={handleTimerNotify} isSelected={selectedTaskIds.includes(task.id)} onToggleSelection={handleToggleTaskSelection} />}>
                              <><TabbedView 
                                  task={task}                                   onUpdate={handleTaskUpdate}
                                  onSettingsChange={setSettings} 
                                /></>
                              <div className="list-item-controls">                                
                                {!isTransactionsView && (
                                  <>
                                    <button onClick={() => { const newAutocompleteState = !task.isAutocomplete; setTasks(tasks.map(t => t.id === task.id ? { ...t, isAutocomplete: newAutocompleteState } : t)); showToast(`Autocomplete ${newAutocompleteState ? 'enabled' : 'disabled'}.`); }} title="Toggle Autocomplete" className={`icon-button recurring-toggle ${task.isAutocomplete ? 'active' : ''}`}><i className="fas fa-robot"></i></button>
                                    <Dropdown trigger={<button title="Recurring Options" className={`icon-button recurring-toggle ${task.isRecurring || task.isDailyRecurring || task.isWeeklyRecurring || task.isMonthlyRecurring || task.isYearlyRecurring ? 'active' : ''}`}><i className="fas fa-sync-alt"></i></button>}><button onClick={() => handleTaskUpdate({ ...task, isRecurring: !task.isRecurring })} className={task.isRecurring ? 'active' : ''}>Re-occur on Complete</button><button onClick={() => handleTaskUpdate({ ...task, isDailyRecurring: !task.isDailyRecurring })} className={task.isDailyRecurring ? 'active' : ''}>Repeat Daily</button><button onClick={() => handleTaskUpdate({ ...task, isWeeklyRecurring: !task.isWeeklyRecurring })} className={task.isWeeklyRecurring ? 'active' : ''}>Repeat Weekly</button><button onClick={() => handleTaskUpdate({ ...task, isMonthlyRecurring: !task.isMonthlyRecurring })} className={task.isMonthlyRecurring ? 'active' : ''}>Repeat Monthly</button><button onClick={() => handleTaskUpdate({ ...task, isYearlyRecurring: !task.isYearlyRecurring })} className={task.isYearlyRecurring ? 'active' : ''}>Repeat Yearly</button></Dropdown>
                                    <button onClick={() => handleCompleteTask(task, 'skipped')} className="icon-button skip-btn" title="Skip Task"><i className="fas fa-forward"></i></button>
                                  </>
                                )}
                                <button className="icon-button" title="View Full Page" onClick={(e) => { e.stopPropagation(); setFullTaskViewId(task.id); }}><i className="fas fa-expand-arrows-alt"></i></button>                                
                                <button onClick={() => handleCompleteTask(task)} className="icon-button complete-btn" title="Complete Task"><i className="fas fa-check"></i></button>
                                {settings.prioritySortConfig?.[String(activeCategoryId)] === null && (<><button className="icon-button" onClick={() => { const targetTask = filteredTasks[index - 1]; if (targetTask) moveTask(task.id, targetTask.id); }} disabled={index === 0} title="Move Up"><i className="fas fa-arrow-up"></i></button><button onClick={() => { const targetTask = filteredTasks[index + 1]; if (targetTask) moveTask(task.id, targetTask.id); }} disabled={index === filteredTasks.length - 1} title="Move Down"><i className="fas fa-arrow-down"></i></button></>)}
                                <button onClick={() => removeTask(task.id)} className="icon-button remove-btn" title="Delete Task"><i className="fas fa-trash"></i></button>
                              </div>
                            </TaskAccordion>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                });
              })()
            ) : (filteredTasks.map((task, index) => (
              <div key={task.id} className="priority-list-item" data-task-id={task.id}>
                {editingTaskId === task.id ? (
                  <input type="text" value={editingText} onChange={handleEditChange} onKeyDown={(e) => handleEditKeyDown(e, task.id)} onBlur={() => setEditingTaskId(null)} autoFocus/>
                ) : (
                  <TaskAccordion task={task} isOpen={settings.openAccordionIds.includes(task.id)} onToggle={() => handleAccordionToggle(task.id)} settings={settings} completedTasks={completedTasks} onUpdate={(updatedTask, options) => {
                    handleTaskUpdate(updatedTask);
                    // If this was the last task in a filtered tax view, reset the view.
                    if (options?.action === 'tax-uncategorize' && activeTaxCategoryId !== 'all' && filteredTasks.length === 1) {
                      setActiveTaxCategoryId('all');
                    }
                  }} onNotify={handleTimerNotify}
                  title={<TaskAccordionHeader task={task} settings={settings} onCategoryClick={(e, catId, parentId) => { e.stopPropagation(); setActiveCategoryId(parentId || catId); if (parentId) { setActiveSubCategoryId(catId); } else { setActiveSubCategoryId('all'); } }} allTasks={[...tasks, ...completedTasks]} onUpdate={handleTaskUpdate} onNotify={handleTimerNotify} isSelected={selectedTaskIds.includes(task.id)} onToggleSelection={handleToggleTaskSelection} />}>
                    <><TabbedView 
                        task={task} 
                        onUpdate={handleTaskUpdate}                         onSettingsChange={setSettings} 
                      /></>
                    <div className="list-item-controls">                      
                      {!isTransactionsView && (
                        <>
                          <button onClick={() => { const newAutocompleteState = !task.isAutocomplete; setTasks(tasks.map(t => t.id === task.id ? { ...t, isAutocomplete: newAutocompleteState } : t)); showToast(`Autocomplete ${newAutocompleteState ? 'enabled' : 'disabled'}.`); }} title="Toggle Autocomplete" className={`icon-button recurring-toggle ${task.isAutocomplete ? 'active' : ''}`}><i className="fas fa-robot"></i></button>
                          <Dropdown trigger={<button title="Recurring Options" className={`icon-button recurring-toggle ${task.isRecurring || task.isDailyRecurring || task.isWeeklyRecurring || task.isMonthlyRecurring || task.isYearlyRecurring ? 'active' : ''}`}><i className="fas fa-sync-alt"></i></button>}><button onClick={() => handleTaskUpdate({ ...task, isRecurring: !task.isRecurring })} className={task.isRecurring ? 'active' : ''}>Re-occur on Complete</button><button onClick={() => handleTaskUpdate({ ...task, isDailyRecurring: !task.isDailyRecurring })} className={task.isDailyRecurring ? 'active' : ''}>Repeat Daily</button><button onClick={() => handleTaskUpdate({ ...task, isWeeklyRecurring: !task.isWeeklyRecurring })} className={task.isWeeklyRecurring ? 'active' : ''}>Repeat Weekly</button><button onClick={() => handleTaskUpdate({ ...task, isMonthlyRecurring: !task.isMonthlyRecurring })} className={task.isMonthlyRecurring ? 'active' : ''}>Repeat Monthly</button><button onClick={() => handleTaskUpdate({ ...task, isYearlyRecurring: !task.isYearlyRecurring })} className={task.isYearlyRecurring ? 'active' : ''}>Repeat Yearly</button></Dropdown>
                          <button onClick={() => handleCompleteTask(task, 'skipped')} className="icon-button skip-btn" title="Skip Task"><i className="fas fa-forward"></i></button>
                        </>
                      )}
                      <button className="icon-button" title="View Full Page" onClick={(e) => { e.stopPropagation(); setFullTaskViewId(task.id); }}><i className="fas fa-expand-arrows-alt"></i></button>
                      <button onClick={() => handleCompleteTask(task)} className="icon-button complete-btn" title="Complete Task"><i className="fas fa-check"></i></button>
                      {settings.prioritySortConfig?.[String(activeCategoryId)] === null && (<><button className="icon-button" onClick={() => { const targetTask = filteredTasks[index - 1]; if (targetTask) moveTask(task.id, targetTask.id); }} disabled={index === 0} title="Move Up"><i className="fas fa-arrow-up"></i></button><button className="icon-button" onClick={() => { const targetTask = filteredTasks[index + 1]; if (targetTask) moveTask(task.id, targetTask.id); }} disabled={index === filteredTasks.length - 1} title="Move Down"><i className="fas fa-arrow-down"></i></button></>)}
                      <button onClick={() => removeTask(task.id)} className="icon-button remove-btn" title="Delete Task"><i className="fas fa-trash"></i></button>
                    </div>
                  </TaskAccordion>
                )}
              </div>
            )))}
            <div className="add-task-row"><button className="add-task-button" onClick={() => { focusAddTaskInput(); const defaultCategoryId = activeSubCategoryId !== 'all' ? activeSubCategoryId : (activeCategoryId !== 'all' ? activeCategoryId : undefined);; if (defaultCategoryId) { setNewTask(prev => ({ ...prev, categoryId: defaultCategoryId })); } }}><i className="fas fa-plus"></i> Open Task</button></div>
          </div>
        </>
      ) : (
        <div className="empty-list-placeholder">
          <h3>No Open Tasks for {(() => { if (activeCategoryId === 'all') return 'any category'; if (activeSubCategoryId !== 'all') { return settings.categories.find(c => c.id === activeSubCategoryId)?.name || 'this category'; } const parentCategory = settings.categories.find(c => c.id === activeCategoryId); return parentCategory?.name || 'this category'; })()}</h3>
          <button onClick={() => { focusAddTaskInput(); const defaultCategoryId = activeSubCategoryId !== 'all' ? activeSubCategoryId : (activeCategoryId !== 'all' ? activeCategoryId : undefined); if (defaultCategoryId) { ; setNewTask(prev => ({ ...prev, categoryId: defaultCategoryId })); } }}><i className="fas fa-plus"></i> Open Task</button>
        </div>
      )}
      {filteredCompletedTasks.length > 0 && (() => {
        const totalTrackedTime = filteredCompletedTasks.reduce((acc, task) => acc + (task.manualTime || 0), 0);
        const totalEarnings = filteredCompletedTasks.reduce((sum, task) => { const hours = (task.manualTime || 0) / (1000 * 60 * 60); return sum + (hours * (task.payRate || 0)); }, 0);
        const completedTitle = (() => { if (activeCategoryId === 'all') return 'All Completed Tasks'; if (activeSubCategoryId !== 'all') { return `${settings.categories.find(c => c.id === activeSubCategoryId)?.name || 'Sub-Category'}: Completed List`; } const parentCategory = settings.categories.find(c => c.id === activeCategoryId); return `${parentCategory?.name || 'Category'}: Completed List`; })();
        
        const handleCopyReport = () => {
          const reportHeader = "Completed Tasks Report\n======================\n";
          const reportBody = filteredCompletedTasks.map(task => {
            const closedAt = task.createdAt + (task.completedDuration ?? 0);
            return `- ${task.text}\n    - Date Opened: ${formatTimestamp(task.createdAt)}\n    - Closed at: ${formatTimestamp(closedAt)}\n    - Total Time: ${formatTime(task.completedDuration ?? 0)}`;
          }).join('\n\n');
          const fullReport = reportHeader + reportBody;
          navigator.clipboard.writeText(fullReport).then(() => { showToast('Report copied!'); }).catch(err => { console.error('Failed to copy report: ', err); });
        };

        return (
          <SimpleAccordion title={(<>{completedTitle} ({filteredCompletedTasks.length})<span className="accordion-title-summary">Total Time Tracked: {formatTime(totalTrackedTime)}</span><span className="accordion-title-summary">Total Earnings: ${totalEarnings.toFixed(2)}</span></>)}>            
            <div className="completed-actions">
              <input
                type="checkbox"
                ref={selectAllCompletedCheckboxRef}
                checked={allCompletedVisibleSelected}
                onChange={handleToggleSelectAllCompleted}
                title={allCompletedVisibleSelected ? "Deselect All Visible Completed" : "Select All Visible Completed"}
              />
              <button className={`icon-button ${confirmingClearCompleted ? 'confirm-delete' : ''}`} onClick={handleClearCompleted} title="Clear Completed List">{confirmingClearCompleted ? <i className="fas fa-trash-alt"></i> : <i className="fas fa-trash-alt"></i>}</button><button className="icon-button" onClick={handleCopyReport} title="Copy Report"><i className="fas fa-copy"></i></button></div>
            <div className="priority-list-main">
              {filteredCompletedTasks.map((task) => {
                const isSkipped = task.completionStatus === 'skipped';
                const title = (
                  <>
                    <div className={`accordion-main-title ${isSkipped ? 'skipped-task' : ''}`}>{isSkipped && <i className="fas fa-forward skipped-icon" title="Skipped"></i>}{task.text}
                    </div>
                    <div className="accordion-subtitle">{task.company && <span>{task.company}</span>}<span>{formatTimestamp(task.openDate)}</span><span>{isSkipped ? 'Skipped after:' : 'Completed in:'} {formatTime(task.completedDuration ?? 0)}</span></div>
                  </>);
                return (
                  <div key={task.id} className={`priority-list-item completed-item ${isSkipped ? 'skipped-item' : ''}`} data-task-id={task.id}>
                    <TaskAccordion task={task} title={<TaskAccordionHeader task={task} settings={settings} onCategoryClick={() => {}} allTasks={[...tasks, ...completedTasks]} onUpdate={handleTaskUpdate} onNotify={handleTimerNotify} isSelected={selectedTaskIds.includes(task.id)} onToggleSelection={handleToggleTaskSelection} />} isOpen={settings.openAccordionIds.includes(task.id)} onToggle={() => handleAccordionToggle(task.id)} settings={settings} completedTasks={completedTasks} onUpdate={handleTaskUpdate} onNotify={handleTimerNotify} >
                      <TabbedView task={task} onUpdate={handleTaskUpdate} onSettingsChange={setSettings} />
                      <div className="list-item-controls"><button className="icon-button" onClick={() => handleReopenTask(task)} title="Reopen Task"><i className="fas fa-undo"></i></button><button className="icon-button" onClick={() => handleDuplicateTask(task)} title="Duplicate Task"><i className="fas fa-copy"></i></button></div>
                    </TaskAccordion>
                  </div>
                );
              })}
            </div>
          </SimpleAccordion>
        );
      })()}
    </div>
  );
}