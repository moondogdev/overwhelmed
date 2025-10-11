import { useCallback } from 'react';
import { Task, Settings, InboxMessage, TimeLogSession, TimeLogEntry, ChecklistSection, RichTextBlock, ChecklistItem } from '../types';
import { formatTime, formatTimestamp, formatChecklistForCsv, formatTimeLogSessionsForCsv } from '../utils';

interface UseBulkTaskActionsProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  completedTasks: Task[];
  setCompletedTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  settings: Settings;
  showToast: (message: string, duration?: number) => void;
  setInboxMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
  getNextId: () => number;
  bulkAddText: string;
  setBulkAddText: React.Dispatch<React.SetStateAction<string>>;
}

interface UseBulkTaskActionsReturn {
  handleBulkAdd: (options: { categoryId: number | 'default'; priority: 'High' | 'Medium' | 'Low'; completeBy?: string; transactionType?: 'none' | 'income' | 'expense' | 'transfer', accountId?: number, taxCategoryId?: number }, contextYear: number) => void;
  handleBulkDelete: (taskIds: number[]) => void;
  handleBulkComplete: (taskIds: number[]) => void;
  handleBulkReopen: (taskIds: number[]) => void;
  handleBulkSetDueDate: (taskIds: number[], completeBy: number) => void;
  handleBulkSetPriority: (taskIds: number[], priority: 'High' | 'Medium' | 'Low') => void;
  handleBulkSetCategory: (taskIds: number[], categoryId: number) => void;
  handleBulkSetAccount: (taskIds: number[], accountId: number) => void;
  handleBulkSetTaxCategory: (taskIds: number[], taxCategoryId: number | undefined) => void;
  handleBulkSetIncomeType: (taskIds: number[], incomeType: 'w2' | 'business' | 'reimbursement' | undefined) => void;
  handleBulkSetOpenDate: (taskIds: number[], openDate: number) => void;
  handleBulkSetYear: (taskIds: number[], year: number) => void;
  handleAutoTagIncomeTypes: (taskIdsToProcess: number[], incomeTypeToProcess?: 'w2' | 'business' | 'reimbursement') => void;
  handleBulkSetTransactionType: (taskIds: number[], transactionType: 'income' | 'expense' | 'none' | 'transfer') => void;
  handleAutoCategorize: (taskIdsToProcess: number[], subCategoryIdToProcess?: number) => void;
  handleAutoTaxCategorize: (taskIdsToProcess: number[], taxCategoryIdToProcess?: number) => void;
  handleBulkDownloadAsCsv: (taskIds: number[]) => void;
  handleBulkCopyAsCsv: (taskIds: number[]) => void;
}

export function useBulkTaskActions({
  tasks,
  setTasks,
  completedTasks,
  setCompletedTasks,
  settings,
  showToast,
  setInboxMessages,
  getNextId,
  bulkAddText,
  setBulkAddText,
}: UseBulkTaskActionsProps): UseBulkTaskActionsReturn {

  const handleAutoCategorize = useCallback((taskIdsToProcess: number[], subCategoryIdToProcess?: number) => {
    const transactionsCategory = settings.categories.find(c => c.name === 'Transactions');
    if (!transactionsCategory) {
      showToast('"Transactions" category not found.', 3000);
      return;
    }

    let subCategoriesWithKeywords = settings.categories.filter(
      c => c.parentId === transactionsCategory.id && c.autoCategorizationKeywords && c.autoCategorizationKeywords.length > 0
    );

    if (subCategoryIdToProcess) {
      subCategoriesWithKeywords = subCategoriesWithKeywords.filter(c => c.id === subCategoryIdToProcess);
    }

    if (subCategoriesWithKeywords.length === 0) {
      showToast('No matching sub-categories with keywords are set up under "Transactions".', 3000);
      return;
    }

    let categorizedCount = 0;
    const transactionSubCategoryIds = settings.categories.filter(c => c.parentId === transactionsCategory.id).map(c => c.id);
    const allTransactionCategoryIds = [transactionsCategory.id, ...transactionSubCategoryIds];

    const updatedTasks = tasks.map(task => {
      if (
        taskIdsToProcess.includes(task.id) &&
        task.categoryId &&
        allTransactionCategoryIds.includes(task.categoryId)
      ) {
        const taskText = task.text.toLowerCase();
        for (const subCategory of subCategoriesWithKeywords) {
          if (task.categoryId === subCategory.id) continue;

          for (const keyword of (subCategory.autoCategorizationKeywords || [])) {
            if (taskText.includes(keyword.toLowerCase().trim())) {
              categorizedCount++;
              return { ...task, categoryId: subCategory.id };
            }
          }
        }
      }
      return task;
    });

    setTasks(updatedTasks);
    if (categorizedCount > 0) {
      showToast(`Successfully auto-categorized ${categorizedCount} transaction(s).`);
    } else {
      showToast('No transactions matched the defined keywords.');
    }
  }, [tasks, settings.categories, setTasks, showToast]);

  const handleBulkAdd = useCallback((options: { categoryId: number | 'default', priority: 'High' | 'Medium' | 'Low', completeBy?: string, transactionType?: 'none' | 'income' | 'expense' | 'transfer', accountId?: number, taxCategoryId?: number }, contextYear: number) => {
    if (bulkAddText.trim() === "") return;

    const tasksToAdd = bulkAddText.split(/[\n,]+/).map(line => line.trim()).filter(line => line);
    if (tasksToAdd.length === 0) return;

    let targetCategoryId: number | undefined;
    if (options.categoryId === 'default') {
      if (settings.activeSubCategoryId && settings.activeSubCategoryId !== 'all') {
        targetCategoryId = settings.activeSubCategoryId;
      } else if (settings.activeCategoryId && settings.activeCategoryId !== 'all') {
        targetCategoryId = settings.activeCategoryId;
      }
    } else { targetCategoryId = options.categoryId; }

    const completeByTimestamp = options.completeBy ? new Date(options.completeBy).getTime() : undefined;

    const newTasks = tasksToAdd.map(line => {
      let text = line;
      let transactionAmount = 0;
      let transactionType: 'income' | 'expense' | 'none' | 'transfer' = options.transactionType || 'none';
      let openDate = Date.now();
      const dateRegex = /(\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?)/;
      const dateMatch = line.match(dateRegex);

      if (dateMatch) {
        const dateString = dateMatch[0];
        const monthDayMatch = dateString.match(/(\d{1,2}[\/-]\d{1,2})/);
        if (monthDayMatch) {
          const monthDay = monthDayMatch[0];
          const yearToUse = contextYear;
          const finalDateString = `${monthDay}/${yearToUse}`;
          const parsedDate = new Date(finalDateString);
          if (!isNaN(parsedDate.getTime())) {
            openDate = parsedDate.getTime();
            text = text.replace(dateString, '').trim();
          }
        }
      }

      const moneyRegex = /((?:[+-]?\s*\$?)\s*(\d+(?:\.\d{1,2})?))$/;
      const match = moneyRegex.exec(text);

      if (match) {
        const fullMatch = match[1];
        const amount = parseFloat(match[2]);
        text = text.replace(fullMatch, '').trim();

        if (fullMatch.includes('-')) {
          transactionAmount = -Math.abs(amount);
          transactionType = 'expense';
        } else if (fullMatch.includes('+')) {
          transactionAmount = Math.abs(amount);
          transactionType = 'income';
        } else if (options.transactionType === 'income') {
          transactionAmount = Math.abs(amount);
          transactionType = 'income';
        } else if (options.transactionType === 'expense') {
          transactionAmount = -Math.abs(amount);
          transactionType = 'expense';
        } else if (options.transactionType === 'transfer') {
          transactionAmount = amount;
          transactionType = 'transfer';
        }
      }

      const newTaskObject: Task = {
        id: getNextId(), text, categoryId: targetCategoryId, priority: options.priority,
        completeBy: completeByTimestamp, manualTime: 0, taxCategoryId: options.taxCategoryId, accountId: options.accountId,
        manualTimeRunning: false, manualTimeStart: 0, transactionAmount, transactionType, openDate,
        createdAt: Date.now(), checklist: [],
      };
      return newTaskObject;
    });

    setInboxMessages(prev => [{ id: Date.now() + Math.random(), type: 'created', text: `Bulk added ${tasksToAdd.length} tasks.`, timestamp: Date.now() }, ...prev]);
    setTasks(prev => [...prev, ...newTasks]);
    setBulkAddText("");

    if (settings.autoCategorizeOnBulkAdd) {
      handleAutoCategorize(newTasks.map(t => t.id));
    }
  }, [bulkAddText, setBulkAddText, settings.activeCategoryId, settings.activeSubCategoryId, settings.autoCategorizeOnBulkAdd, setInboxMessages, setTasks, getNextId, handleAutoCategorize]);

  const handleBulkDelete = useCallback((taskIds: number[]) => {
    if (taskIds.length === 0) return;
    setTasks(prev => prev.filter(task => !taskIds.includes(task.id)));
    setCompletedTasks(prev => prev.filter(task => !taskIds.includes(task.id)));
    setInboxMessages(prev => [{ id: Date.now() + Math.random(), type: 'deleted', text: `Bulk deleted ${taskIds.length} tasks.`, timestamp: Date.now() }, ...prev]);
    showToast(`${taskIds.length} tasks deleted.`);
  }, [setTasks, setCompletedTasks, setInboxMessages, showToast]);

  const handleBulkComplete = useCallback((taskIds: number[]) => {
    if (taskIds.length === 0) return;
    const tasksToComplete = tasks.filter(task => taskIds.includes(task.id));
    if (tasksToComplete.length === 0) return;
    const now = Date.now();
    const completedTasksToAdd = tasksToComplete.map(task => ({ ...task, completedDuration: now - task.createdAt, completionStatus: 'completed' as 'completed' | 'skipped' }));
    setTasks(prev => prev.filter(task => !taskIds.includes(task.id)));
    setCompletedTasks(prev => [...completedTasksToAdd, ...prev]);
    setInboxMessages(prev => [{ id: Date.now() + Math.random(), type: 'completed', text: `Bulk completed ${taskIds.length} tasks.`, timestamp: now }, ...prev]);
    showToast(`${taskIds.length} tasks completed.`);
  }, [tasks, setTasks, setCompletedTasks, setInboxMessages, showToast]);

  const handleBulkReopen = useCallback((taskIds: number[]) => {
    if (taskIds.length === 0) return;
    const tasksToReopen = completedTasks.filter(task => taskIds.includes(task.id));
    if (tasksToReopen.length === 0) return;
    const reopenedTasks = tasksToReopen.map(task => ({ ...task, completedDuration: undefined, completionStatus: undefined } as Task));
    setCompletedTasks(prev => prev.filter(task => !taskIds.includes(task.id)));
    setTasks(prev => [...reopenedTasks, ...prev]);
    showToast(`${taskIds.length} tasks reopened.`);
  }, [completedTasks, setTasks, setCompletedTasks, showToast]);

  const handleBulkSetDueDate = useCallback((taskIds: number[], completeBy: number) => {
    if (taskIds.length === 0) return;
    setTasks(prevTasks => prevTasks.map(task => taskIds.includes(task.id) ? { ...task, completeBy } : task));
    showToast(`${taskIds.length} tasks updated with new due date.`);
  }, [setTasks, showToast]);

  const handleBulkSetPriority = useCallback((taskIds: number[], priority: 'High' | 'Medium' | 'Low') => {
    if (taskIds.length === 0) return;
    setTasks(prevTasks => prevTasks.map(task => taskIds.includes(task.id) ? { ...task, priority } : task));
    showToast(`${taskIds.length} tasks set to ${priority} priority.`);
  }, [setTasks, showToast]);

  const handleBulkSetCategory = useCallback((taskIds: number[], categoryId: number) => {
    if (taskIds.length === 0) return;
    setTasks(prevTasks => prevTasks.map(task => taskIds.includes(task.id) ? { ...task, categoryId } : task));
    const categoryName = settings.categories.find(c => c.id === categoryId)?.name || 'a category';
    showToast(`${taskIds.length} tasks moved to "${categoryName}".`);
  }, [setTasks, showToast, settings.categories]);

  const handleBulkSetAccount = useCallback((taskIds: number[], accountId: number) => {
    if (taskIds.length === 0) return;
    setTasks(prevTasks => prevTasks.map(task => taskIds.includes(task.id) ? { ...task, accountId } : task));
    const accountName = settings.accounts.find(a => a.id === accountId)?.name || 'an account';
    showToast(`${taskIds.length} tasks assigned to "${accountName}".`);
  }, [setTasks, showToast, settings.accounts]);

  const handleBulkSetTaxCategory = useCallback((taskIds: number[], taxCategoryId: number | undefined) => {
    if (taskIds.length === 0) return;
    setTasks(prevTasks => prevTasks.map(task => taskIds.includes(task.id) ? { ...task, taxCategoryId } : task));
    const taxCategoryName = settings.taxCategories?.find(tc => tc.id === taxCategoryId)?.name;
    const message = taxCategoryId !== undefined ? `Tagged ${taskIds.length} tasks with tax category "${taxCategoryName}".` : `Removed tax category from ${taskIds.length} tasks.`;
    showToast(message);
  }, [setTasks, showToast, settings.taxCategories]);

  const handleBulkSetIncomeType = useCallback((taskIds: number[], incomeType: 'w2' | 'business' | 'reimbursement' | undefined) => {
    if (taskIds.length === 0) return;
    setTasks(prevTasks => prevTasks.map(task => taskIds.includes(task.id) ? { ...task, incomeType } : task));
    if (incomeType) {
      const typeName = incomeType === 'w2' ? 'W-2 Wage' : incomeType === 'business' ? 'Business Earning' : 'Reimbursement';
      showToast(`${taskIds.length} tasks' income type set to "${typeName}".`);
    } else {
      showToast(`Income type removed from ${taskIds.length} tasks.`);
    }
  }, [setTasks, showToast]);

  const handleBulkSetOpenDate = useCallback((taskIds: number[], openDate: number) => {
    if (taskIds.length === 0) return;
    setTasks(prevTasks => prevTasks.map(task => taskIds.includes(task.id) ? { ...task, openDate } : task));
    showToast(`${taskIds.length} tasks updated with new open date.`);
  }, [setTasks, showToast]);

  const handleBulkSetYear = useCallback((taskIds: number[], year: number) => {
    if (taskIds.length === 0) return;
    setTasks(prevTasks => prevTasks.map(task => {
      if (taskIds.includes(task.id)) {
        const originalDate = new Date(task.openDate);
        originalDate.setFullYear(year);
        return { ...task, openDate: originalDate.getTime() };
      }
      return task;
    }));
    showToast(`${taskIds.length} tasks' year updated to ${year}.`);
  }, [setTasks, showToast]);

  const handleAutoTagIncomeTypes = useCallback((taskIdsToProcess: number[], incomeTypeToProcess?: 'w2' | 'business' | 'reimbursement') => {
    const incomeKeywords = settings.incomeTypeKeywords;
    if (!incomeKeywords || (!incomeKeywords.w2.length && !incomeKeywords.business.length && !incomeKeywords.reimbursement.length)) {
      showToast('No income type keywords are set up.', 3000);
      return;
    }
    const typesToProcess: ('w2' | 'business' | 'reimbursement')[] = incomeTypeToProcess ? [incomeTypeToProcess] : ['w2', 'business', 'reimbursement'];
    let taggedCount = 0;
    const updatedTasks = tasks.map(task => {
      if (taskIdsToProcess.includes(task.id) && (task.transactionAmount || 0) > 0 && !task.incomeType) {
        const taskText = task.text.toLowerCase();
        for (const type of typesToProcess) {
          const keywords = incomeKeywords[type] || [];
          if (keywords.some(kw => taskText.includes(kw.toLowerCase().trim()))) {
            taggedCount++;
            return { ...task, incomeType: type };
          }
        }
      }
      return task;
    });
    setTasks(updatedTasks);
    if (taggedCount > 0) {
      const typeName = incomeTypeToProcess ? ` as "${incomeTypeToProcess}"` : '';
      showToast(`Successfully auto-tagged ${taggedCount} income transaction(s)${typeName}.`);
    } else {
      showToast('No income transactions matched the defined keywords.');
    }
  }, [tasks, settings.incomeTypeKeywords, setTasks, showToast]);

  const handleBulkSetTransactionType = useCallback((taskIds: number[], transactionType: 'income' | 'expense' | 'none' | 'transfer') => {
    if (taskIds.length === 0) return;
    setTasks(prevTasks => prevTasks.map(task => {
      if (taskIds.includes(task.id)) {
        let newAmount = task.transactionAmount || 0;
        if (transactionType === 'income') newAmount = Math.abs(newAmount);
        else if (transactionType === 'expense') newAmount = -Math.abs(newAmount);
        else if (transactionType === 'none') newAmount = 0;
        return { ...task, transactionType, transactionAmount: newAmount };
      }
      return task;
    }));
    showToast(`${taskIds.length} tasks' transaction type updated.`);
  }, [setTasks, showToast]);

  const handleAutoTaxCategorize = useCallback((taskIdsToProcess: number[], taxCategoryIdToProcess?: number) => {
    let taxCategoriesToProcess = settings.taxCategories || [];
    if (taxCategoriesToProcess.length === 0) {
      showToast('No tax categories with keywords are set up.', 3000);
      return;
    }
    if (taxCategoryIdToProcess) {
      taxCategoriesToProcess = taxCategoriesToProcess.filter(tc => tc.id === taxCategoryIdToProcess);
    }
    let categorizedCount = 0;
    const updatedTasks = tasks.map(task => {
      if (taskIdsToProcess.includes(task.id)) {
        const taskText = task.text.toLowerCase();
        const matchingTaxCategory = taxCategoriesToProcess.find(taxCat => (taxCat.keywords || []).some(keyword => taskText.includes(keyword.toLowerCase().trim())));
        if (matchingTaxCategory && task.taxCategoryId !== matchingTaxCategory.id) {
          categorizedCount++;
          return { ...task, taxCategoryId: matchingTaxCategory.id };
        }
      }
      return task;
    });
    setTasks(updatedTasks);
    showToast(categorizedCount > 0 ? `Successfully auto-tagged ${categorizedCount} transaction(s) for taxes.` : 'No transactions matched the defined tax keywords.');
  }, [tasks, settings.taxCategories, setTasks, showToast]);

  const handleBulkDownloadAsCsv = useCallback((taskIds: number[]) => {
    if (taskIds.length === 0) {
      showToast('No tasks selected to download.');
      return;
    }
    const tasksToDownload = tasks.filter(task => taskIds.includes(task.id));
    if (tasksToDownload.length === 0) {
      showToast('No matching open tasks found to download.');
      return;
    }
    const headers = [
      "ID", "Task", "Task URL", "Parent Category", "Sub-Category", "Tax Category", "Priority", "Open Date", "Due Date",
      "Time Tracked (HH:MM:SS)", "Pay Rate ($/hr)", "Earnings ($)", "Company", "Website URL", "Image Links", "Attachments",
      "Is Recurring", "Repeat Daily", "Repeat Weekly", "Repeat Monthly", "Repeat Yearly", "Autocomplete on Deadline",
      "Links to Task ID", "Linked Task Name", "Linked Task Offset (minutes)",
      "Description", "Checklist Content", "Notes", "Responses", "Time Log Sessions"
    ];
    const rows = tasksToDownload.map(task => {
      const category = settings.categories.find(c => c.id === task.categoryId);
      let parentCategoryName = 'N/A';
      let subCategoryName = '';
      if (category) {
        if (category.parentId) {
          const parentCategory = settings.categories.find(c => c.id === category.parentId);
          parentCategoryName = parentCategory?.name || 'N/A';
          subCategoryName = category.name;
        } else {
          parentCategoryName = category.name;
        }
      }
      const taxCategory = settings.taxCategories?.find(tc => tc.id === task.taxCategoryId);
      const taxCategoryName = taxCategory ? taxCategory.name : '';
      const linkedTask = task.startsTaskIdOnComplete ? tasks.find(t => t.id === task.startsTaskIdOnComplete) : null;
      const linkedTaskName = linkedTask ? linkedTask.text : '';
      const linkedTaskOffsetMinutes = task.linkedTaskOffset ? task.linkedTaskOffset / 60000 : 0;
      const earnings = (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)).toFixed(2);
      const escapeCsv = (str: string | undefined) => `"${(str || '').replace(/"/g, '""')}"`;
      return [
        task.id, escapeCsv(task.text), escapeCsv(task.url),
        escapeCsv(parentCategoryName), escapeCsv(subCategoryName), escapeCsv(taxCategoryName),
        task.priority || 'Medium',
        formatTimestamp(task.openDate), task.completeBy ? formatTimestamp(task.completeBy) : 'N/A',
        formatTime(task.manualTime || 0), task.payRate || 0, earnings, escapeCsv(task.company), escapeCsv(task.websiteUrl),
        escapeCsv(task.imageLinks?.join('; ')), escapeCsv(task.attachments?.map(a => a.name).join('; ')),
        task.isRecurring || false, task.isDailyRecurring || false, task.isWeeklyRecurring || false,
        task.isMonthlyRecurring || false, task.isYearlyRecurring || false, task.isAutocomplete || false,
        task.startsTaskIdOnComplete || '', escapeCsv(linkedTaskName), linkedTaskOffsetMinutes,
        escapeCsv(task.description), escapeCsv(formatChecklistForCsv(task.checklist)),
        escapeCsv(task.notes), escapeCsv(task.responses),
        escapeCsv(formatTimeLogSessionsForCsv(task.timeLogSessions))
      ].join(',');
    });
    window.electronAPI.saveCsv([headers.join(','), ...rows].join('\n'));
  }, [tasks, settings.categories, settings.taxCategories, showToast]);

  const handleBulkCopyAsCsv = useCallback((taskIds: number[]) => {
    if (taskIds.length === 0) {
      showToast('No tasks selected to copy.');
      return;
    }
    const tasksToCopy = tasks.filter(task => taskIds.includes(task.id));
    if (tasksToCopy.length === 0) {
      showToast('No matching open tasks found to copy.');
      return;
    }
    const headers = [
      "ID", "Task", "Task URL", "Parent Category", "Sub-Category", "Tax Category", "Priority", "Open Date", "Due Date",
      "Time Tracked (HH:MM:SS)", "Pay Rate ($/hr)", "Earnings ($)", "Company", "Website URL", "Image Links", "Attachments",
      "Is Recurring", "Repeat Daily", "Repeat Weekly", "Repeat Monthly", "Repeat Yearly", "Autocomplete on Deadline",
      "Links to Task ID", "Linked Task Name", "Linked Task Offset (minutes)",
      "Description", "Checklist Content", "Notes", "Responses", "Time Log Sessions"
    ];
    const rows = tasksToCopy.map(task => {
      const category = settings.categories.find(c => c.id === task.categoryId);
      let parentCategoryName = 'N/A';
      let subCategoryName = '';
      if (category) {
        if (category.parentId) {
          const parentCategory = settings.categories.find(c => c.id === category.parentId);
          parentCategoryName = parentCategory?.name || 'N/A';
          subCategoryName = category.name;
        } else { parentCategoryName = category.name; }
      }
      const taxCategory = settings.taxCategories?.find(tc => tc.id === task.taxCategoryId);
      const taxCategoryName = taxCategory ? taxCategory.name : '';
      const linkedTask = task.startsTaskIdOnComplete ? tasks.find(t => t.id === task.startsTaskIdOnComplete) : null;
      const linkedTaskName = linkedTask ? linkedTask.text : '';
      const linkedTaskOffsetMinutes = task.linkedTaskOffset ? task.linkedTaskOffset / 60000 : 0;
      const earnings = (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)).toFixed(2);
      const escape = (str: string | undefined) => `"${(str || '').replace(/"/g, '""')}"`;
      return [
        task.id, escape(task.text), escape(task.url), escape(parentCategoryName), escape(subCategoryName), escape(taxCategoryName),
        task.priority || 'Medium', formatTimestamp(task.openDate), task.completeBy ? formatTimestamp(task.completeBy) : 'N/A',
        formatTime(task.manualTime || 0), task.payRate || 0, earnings, escape(task.company), escape(task.websiteUrl),
        escape(task.imageLinks?.join('; ')), escape(task.attachments?.map(a => a.name).join('; ')),
        task.isRecurring || false, task.isDailyRecurring || false, task.isWeeklyRecurring || false,
        task.isMonthlyRecurring || false, task.isYearlyRecurring || false, task.isAutocomplete || false,
        task.startsTaskIdOnComplete || '', escape(linkedTaskName), linkedTaskOffsetMinutes, escape(task.description),
        escape(formatChecklistForCsv(task.checklist)), escape(task.notes), escape(task.responses),
        escape(formatTimeLogSessionsForCsv(task.timeLogSessions))
      ].join('\t');
    });
    navigator.clipboard.writeText([headers.join('\t'), ...rows].join('\n'));
    showToast(`${tasksToCopy.length} task(s) copied to clipboard!`);
  }, [tasks, settings.categories, settings.taxCategories, showToast]);

  return {
    handleBulkAdd,
    handleBulkDelete,
    handleBulkComplete,
    handleBulkReopen,
    handleBulkSetDueDate,
    handleBulkSetPriority,
    handleBulkSetCategory,
    handleBulkSetAccount,
    handleBulkSetTaxCategory,
    handleBulkSetIncomeType,
    handleBulkSetOpenDate,
    handleBulkSetYear,
    handleAutoTagIncomeTypes,
    handleBulkSetTransactionType,
    handleAutoCategorize,
    handleAutoTaxCategorize,
    handleBulkDownloadAsCsv,
    handleBulkCopyAsCsv,
  };
}