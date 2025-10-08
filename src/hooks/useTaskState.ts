import { useState, useCallback, useRef, useEffect } from 'react';
import { Task, InboxMessage, ChecklistItem, ChecklistSection, Settings, TimeLogSession, TimeLogEntry, RichTextBlock } from '../types';
import { formatTime, formatTimestamp } from '../utils';

interface UseTaskStateProps {
  initialTasks?: Task[];
  initialCompletedTasks?: Task[];
  setInboxMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
  showToast: (message: string, duration?: number) => void;
  newTask: Partial<Task>;
  setNewTask: React.Dispatch<React.SetStateAction<Partial<Task>>>;
  bulkAddText: string;
  setBulkAddText: React.Dispatch<React.SetStateAction<string>>;
  settings: Settings;
}

export function useTaskState({
  initialTasks = [],
  initialCompletedTasks = [],
  setInboxMessages,
  showToast,
  newTask,
  setNewTask,
  bulkAddText,
  setBulkAddText,
  settings,
}: UseTaskStateProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [completedTasks, setCompletedTasks] = useState<Task[]>(initialCompletedTasks);
  const [confirmingClearCompleted, setConfirmingClearCompleted] = useState(false);
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [updateTimers, setUpdateTimers] = useState<{ [key: number]: NodeJS.Timeout }>({});
  const tasksRefForDebounce = useRef(tasks);

  // --- NEW: ID Management System ---
  const nextId = useRef(0);
  // This effect now runs whenever the tasks change, ensuring the counter is always ahead of the highest existing ID.
  useEffect(() => {
    const allTasks = [...tasks, ...completedTasks];
    if (allTasks.length > 0) {
      // Use reduce for safety, and Math.floor to handle legacy float-based IDs.
      const maxId = allTasks.reduce((max, task) => Math.max(max, Math.floor(task.id)), 0);
      nextId.current = maxId + 1;
    } else {
      nextId.current = 1; // Start from 1 if there are no tasks.
    }
  }, [tasks, completedTasks]); // Re-calculates when tasks are loaded, added, or synced.

  const getNextId = () => nextId.current++;

  // New refs to hold the latest state for background processes like auto-save
  const tasksRef = useRef(tasks);
  const completedTasksRef = useRef(completedTasks);

  tasksRefForDebounce.current = tasks;

  const handleCompleteTask = useCallback((taskToComplete: Task, status: 'completed' | 'skipped' = 'completed') => {
    const completedTask = { ...taskToComplete, completedDuration: Date.now() - taskToComplete.createdAt, completionStatus: status };

    setCompletedTasks(prev => [completedTask, ...prev]);
    setTasks(prev => prev.filter(task => task.id !== taskToComplete.id));
    setInboxMessages(prev => [{ 
      id: Date.now() + Math.random(),
      type: 'completed',
      text: `Task ${status}: "${completedTask.text}"`,
      timestamp: Date.now(),
      taskId: completedTask.id,
    }, ...prev]);
    showToast(`Task ${status}!`);

    let newRecurringTask: Task | null = null;

    if (taskToComplete.isRecurring || taskToComplete.isDailyRecurring || taskToComplete.isWeeklyRecurring || taskToComplete.isMonthlyRecurring || taskToComplete.isYearlyRecurring) {
      const newOpenDate = Date.now();
      let newCompleteBy: number | undefined = undefined;
      const originalCompleteBy = taskToComplete.completeBy ? new Date(taskToComplete.completeBy) : new Date(newOpenDate);

      if (taskToComplete.isDailyRecurring) {
        originalCompleteBy.setDate(originalCompleteBy.getDate() + 1);
        newCompleteBy = originalCompleteBy.getTime();
      } else if (taskToComplete.isWeeklyRecurring) {
        originalCompleteBy.setDate(originalCompleteBy.getDate() + 7);
        newCompleteBy = originalCompleteBy.getTime();
      } else if (taskToComplete.isMonthlyRecurring) {
        originalCompleteBy.setMonth(originalCompleteBy.getMonth() + 1);
        newCompleteBy = originalCompleteBy.getTime();
      } else if (taskToComplete.isYearlyRecurring) {
        originalCompleteBy.setFullYear(originalCompleteBy.getFullYear() + 1);
        newCompleteBy = originalCompleteBy.getTime();
      } else if (taskToComplete.isRecurring && taskToComplete.completeBy && taskToComplete.createdAt) {
        // This is the generic "re-occur on complete" which bases the new deadline
        // on when it was completed, not on a fixed interval.
        const originalDuration = taskToComplete.completeBy - taskToComplete.createdAt;
        newCompleteBy = Date.now() + originalDuration;
      }

      newRecurringTask = {
        ...taskToComplete,
        id: getNextId(),
        createdAt: newOpenDate, // The new task is "created" now.
        openDate: newOpenDate,
        completedDuration: undefined,
        completeBy: newCompleteBy,
        startsTaskIdOnComplete: taskToComplete.startsTaskIdOnComplete,
      };
    }

    if (taskToComplete.startsTaskIdOnComplete) {
      const successorTaskId = taskToComplete.startsTaskIdOnComplete;
      setTasks(prevTasks => {
        let newTasks = prevTasks.map(t => {
          if (t.id !== successorTaskId) return t;
          // Use the offset from the *completed* task to set the new due date
          const offset = taskToComplete.linkedTaskOffset || 0; // Default to 0 if not set
          const updatedSuccessor = { 
            ...t, 
            openDate: Date.now(), 
            completeBy: Date.now() + offset };
          if (t.startsTaskIdOnComplete === taskToComplete.id && newRecurringTask) {
            updatedSuccessor.startsTaskIdOnComplete = newRecurringTask.id;
          }
          return updatedSuccessor;
        });
        if (newRecurringTask) {
          newTasks = [newRecurringTask, ...newTasks];
        }
        return newTasks;
      });
    } else if (newRecurringTask) {
      setTasks(prev => [newRecurringTask, ...prev]);
    }
  }, [setInboxMessages, showToast]);

  const removeTask = useCallback((idToRemove: number) => {
    const taskToRemove = tasks.find(t => t.id === idToRemove) || completedTasks.find(t => t.id === idToRemove);
    setTasks(prev => prev.filter(task => task.id !== idToRemove));
    setCompletedTasks(prev => prev.filter(task => task.id !== idToRemove));
    if (taskToRemove) {
      setInboxMessages(prev => [{ id: Date.now() + Math.random(), type: 'deleted', text: `Task deleted: "${taskToRemove.text}"`, timestamp: Date.now(), taskId: idToRemove }, ...prev]);
    }
    showToast('Task removed.');
  }, [tasks, completedTasks, setInboxMessages, showToast]);

  const handleDuplicateTask = useCallback((taskToCopy: Task) => {
    const newTask: Task = { ...taskToCopy, id: getNextId(), openDate: Date.now(), createdAt: Date.now(), completedDuration: undefined };
    setTasks(prevTasks => [newTask, ...prevTasks]);
    setInboxMessages(prev => [{ id: Date.now() + Math.random(), type: 'created', text: `Task duplicated: "${newTask.text}"`, timestamp: Date.now(), taskId: newTask.id }, ...prev]);
    showToast('Task duplicated!');
  }, [setInboxMessages, showToast]);

  const handleReopenTask = useCallback((taskToReopen: Task) => {
    setCompletedTasks(prev => prev.filter(t => t.id !== taskToReopen.id));
    const reopenedTask: Task = { ...taskToReopen, completedDuration: undefined };
    setTasks(prev => [reopenedTask, ...prev]);
    showToast('Task reopened!');
  }, []);

  const handleClearCompleted = useCallback(() => {
    if (confirmingClearCompleted) {
      setCompletedTasks([]);
      showToast('Completed list cleared!');
      setConfirmingClearCompleted(false);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    } else {
      setConfirmingClearCompleted(true);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmingClearCompleted(false), 3000);
    }
  }, [confirmingClearCompleted, showToast]);

  const handleCreateNewTask = useCallback(() => {
    if (newTask.text.trim() === "") return;

    const newTaskObject: Task = {
      ...newTask,
      id: getNextId(),
      text: newTask.text.trim(),
      openDate: newTask.openDate || Date.now(),
      x: 0, y: 0,
      width: 0,
      height: 0,
      createdAt: Date.now(),
      manualTime: 0,
      manualTimeRunning: false,
      manualTimeStart: 0,
    };

    setInboxMessages(prev => [{
      id: Date.now() + Math.random(),
      type: 'created',
      text: `Task created: "${newTaskObject.text}"`,
      timestamp: Date.now(),
      taskId: newTaskObject.id,
    }, ...prev]);
    showToast('Task added!');
    setTasks((prevTasks) => [...prevTasks, newTaskObject]);

    // Reset the new task form, preserving the selected category and task type
    setNewTask({
      text: '',
      url: '',
      taskType: newTask.taskType,
      priority: 'Medium' as 'High' | 'Medium' | 'Low',
      categoryId: newTask.categoryId,
      openDate: new Date().getTime(),
      completeBy: undefined,
      company: '',
      websiteUrl: '',
      imageLinks: [],
      attachments: [],
      checklist: [],
      notes: '',
      responses: '',
      description: '',
      manualTime: 0,
      manualTimeRunning: false,
      manualTimeStart: 0,
      payRate: 0,
      transactionAmount: 0,
      transactionType: 'none',
      isRecurring: false,
      isDailyRecurring: false,
      isWeeklyRecurring: false,
      isMonthlyRecurring: false,
      isYearlyRecurring: false,
      isAutocomplete: false,
      lastNotified: undefined,
      snoozedAt: undefined,
    });
  }, [newTask, setInboxMessages, showToast, setTasks, setNewTask]);

  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    // Clear any existing timer for this task to debounce
    if (updateTimers[updatedTask.id]) {
      clearTimeout(updateTimers[updatedTask.id]);
    }

    // Set a new timer
    const newTimer = setTimeout(() => {
      // Check if the task still exists before adding to inbox
      if (tasksRefForDebounce.current.some(t => t.id === updatedTask.id)) {
        setInboxMessages(prev => {
          // Avoid duplicate 'updated' messages for the same task in a short period
          const recentUpdate = prev.find(msg => msg.taskId === updatedTask.id && msg.type === 'updated' && (Date.now() - msg.timestamp < 60000));
          if (recentUpdate) return prev;
          return [{
            id: Date.now() + Math.random(),
            type: 'updated',
            text: `Task updated: "${updatedTask.text}"`,
            timestamp: Date.now(),
            taskId: updatedTask.id,
          }, ...prev];
        });
      }
      // Clean up the timer from state
      setUpdateTimers(prev => { const newTimers = { ...prev }; delete newTimers[updatedTask.id]; return newTimers; });
    }, 5000); // 5-second debounce window

    setUpdateTimers(prev => ({ ...prev, [updatedTask.id]: newTimer }));
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
  }, [tasks, updateTimers, tasksRefForDebounce, setInboxMessages]);

  const handleChecklistCompletion = useCallback((item: ChecklistItem, sectionId: number) => {
    // This handler is now ONLY for individual item completions.
    const parentTask = tasks.find(t => t.checklist?.some(s => 'items' in s && s.id === sectionId));
    if (parentTask) {
      setInboxMessages(prev => [{
        id: Date.now() + Math.random(), type: 'completed', text: `Checklist item completed: "${item.text}" in task "${parentTask.text}"`,
        timestamp: Date.now(), taskId: parentTask.id, sectionId: sectionId
      }, ...prev]);
    }
  }, [tasks, setInboxMessages]); // Dependency on `tasks` ensures it has the latest task list

  const handleClearAll = useCallback(() => {
    setTasks([]);
    showToast('All open tasks cleared!');
  }, [showToast]);

  const handleBulkAdd = useCallback((options: { categoryId: number | 'default', priority: 'High' | 'Medium' | 'Low', completeBy?: string, transactionType?: 'none' | 'income' | 'expense' | 'transfer', accountId?: number, taxCategoryId?: number }, contextYear: number) => {
    if (bulkAddText.trim() === "") return;

    const tasksToAdd = bulkAddText.split(/[\n,]+/).map(line => line.trim()).filter(line => line);
    if (tasksToAdd.length === 0) return;

    let targetCategoryId: number | undefined;
    if (options.categoryId === 'default') {
      // Prioritize the active sub-category if one is selected.
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

      // --- NEW: Date/Time Parsing ---
      let openDate = Date.now(); // Default to now
      // This regex finds the FIRST occurrence of a date-like string (MM/DD/YY or MM/DD).
      const dateRegex = /(\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?)/;
      const dateMatch = line.match(dateRegex);

      if (dateMatch) {
        const dateString = dateMatch[0];
        // Extract just the month and day part, ignoring any year in the string.
        const monthDayMatch = dateString.match(/(\d{1,2}[\/-]\d{1,2})/);
        
        if (monthDayMatch) {
          const monthDay = monthDayMatch[0];
          // Unconditionally use the year from the "For Year" dropdown.
          const yearToUse = contextYear;
          const finalDateString = `${monthDay}/${yearToUse}`;
          const parsedDate = new Date(finalDateString);
          
        if (!isNaN(parsedDate.getTime())) {
          openDate = parsedDate.getTime();
          text = text.replace(dateString, '').trim(); // Remove date from title
        }
        }
      }

      // This regex looks for a number at the end of the string that optionally has one or two decimal places.
      // This allows it to capture values like `160`, `160.0`, and `160.00`.
      // It's anchored to the end ($) to reliably find transaction amounts from statements.
      const moneyRegex = /((?:[+-]?\s*\$?)\s*(\d+(?:\.\d{1,2})?))$/;
      const match = moneyRegex.exec(text); // Use `text` which may have already been cleaned

      if (match) {
        const fullMatch = match[1]; // e.g., "-$5.75"
        const amount = parseFloat(match[2]); // e.g., 5.75
        text = text.replace(fullMatch, '').trim(); // Remove the monetary value from the task title

        // Determine amount and type based on explicit signs or dropdown default
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
          transactionAmount = amount; // Keep the sign as is for transfers
          transactionType = 'transfer';
        }
      }

      const newTaskObject: Task = {
        id: getNextId(),
        text,
        x: 0, y: 0,
        categoryId: targetCategoryId,
        priority: options.priority,
        completeBy: completeByTimestamp,
        manualTime: 0,
        taxCategoryId: options.taxCategoryId, // Assign the selected tax category
        accountId: options.accountId, // Assign the selected account
        manualTimeRunning: false,
        manualTimeStart: 0,
        transactionAmount, // Parsed monetary value
        transactionType, // Assign the determined transaction type
        openDate: openDate, // Parsed date or now
        width: 0, 
        height: 0,
        createdAt: Date.now(),        
        checklist: [],
      };
      return newTaskObject;
    });

    setInboxMessages(prev => [{
      id: Date.now() + Math.random(),
      type: 'created',
      text: `Bulk added ${tasksToAdd.length} tasks.`,
      timestamp: Date.now(),
    }, ...prev]);

    setTasks(prev => [...prev, ...newTasks]);
    setBulkAddText(""); // Clear the textarea

    // If auto-categorization is enabled, run it on the new tasks.
    if (settings.autoCategorizeOnBulkAdd) {
      handleAutoCategorize(newTasks.map(t => t.id));
    }
  }, [bulkAddText, setBulkAddText, settings.activeCategoryId, settings.activeSubCategoryId, setInboxMessages, setTasks]);

  const handleBulkDelete = useCallback((taskIds: number[]) => {
    if (taskIds.length === 0) return;
    setTasks(prev => prev.filter(task => !taskIds.includes(task.id)));
    setCompletedTasks(prev => prev.filter(task => !taskIds.includes(task.id)));
    setInboxMessages(prev => [{
      id: Date.now() + Math.random(),
      type: 'deleted',
      text: `Bulk deleted ${taskIds.length} tasks.`,
      timestamp: Date.now(),
    }, ...prev]);
    showToast(`${taskIds.length} tasks deleted.`);
  }, [setTasks, setCompletedTasks, setInboxMessages, showToast]);

  const handleBulkComplete = useCallback((taskIds: number[]) => {
    if (taskIds.length === 0) return;

    const tasksToComplete = tasks.filter(task => taskIds.includes(task.id));
    if (tasksToComplete.length === 0) return;

    const now = Date.now();
    const completedTasksToAdd = tasksToComplete.map(task => {
        return { ...task, completedDuration: now - task.createdAt, completionStatus: 'completed' as 'completed' | 'skipped' };
    });

    setTasks(prev => prev.filter(task => !taskIds.includes(task.id)));
    setCompletedTasks(prev => [...completedTasksToAdd, ...prev]);

    setInboxMessages(prev => [{
        id: Date.now() + Math.random(),
        type: 'completed',
        text: `Bulk completed ${taskIds.length} tasks.`,
        timestamp: now,
    }, ...prev]);
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
    setTasks(prevTasks =>
      prevTasks.map(task =>
        taskIds.includes(task.id) ? { ...task, completeBy } : task
      )
    );
    showToast(`${taskIds.length} tasks updated with new due date.`);
  }, [setTasks, showToast]);

  const handleBulkSetPriority = useCallback((taskIds: number[], priority: 'High' | 'Medium' | 'Low') => {
    if (taskIds.length === 0) return;
    setTasks(prevTasks =>
      prevTasks.map(task =>
        taskIds.includes(task.id) ? { ...task, priority } : task
      )
    );
    showToast(`${taskIds.length} tasks set to ${priority} priority.`);
  }, [setTasks, showToast]);

  const handleBulkSetCategory = useCallback((taskIds: number[], categoryId: number) => {
    if (taskIds.length === 0) return;
    setTasks(prevTasks =>
      prevTasks.map(task =>
        taskIds.includes(task.id) ? { ...task, categoryId } : task
      )
    );
    const categoryName = settings.categories.find(c => c.id === categoryId)?.name || 'a category';
    showToast(`${taskIds.length} tasks moved to "${categoryName}".`);
  }, [setTasks, showToast, settings.categories]);

  const handleBulkSetAccount = useCallback((taskIds: number[], accountId: number) => {
    if (taskIds.length === 0) return;
    setTasks(prevTasks =>
      prevTasks.map(task =>
        taskIds.includes(task.id) ? { ...task, accountId } : task
      )
    );
    const accountName = settings.accounts.find(a => a.id === accountId)?.name || 'an account';
    showToast(`${taskIds.length} tasks assigned to "${accountName}".`);
  }, [setTasks, showToast, settings.accounts]);

  const handleBulkSetTaxCategory = useCallback((taskIds: number[], taxCategoryId: number | undefined) => {
    if (taskIds.length === 0) return;
    setTasks(prevTasks =>
      prevTasks.map(task =>
        taskIds.includes(task.id) ? { ...task, taxCategoryId } : task
      )
    );
    const taxCategoryName = settings.taxCategories?.find(tc => tc.id === taxCategoryId)?.name;
    const message = taxCategoryId !== undefined ? `Tagged ${taskIds.length} tasks with tax category "${taxCategoryName}".` : `Removed tax category from ${taskIds.length} tasks.`;

    showToast(message);
  }, [setTasks, showToast, settings.taxCategories]);

  const handleBulkSetIncomeType = useCallback((taskIds: number[], incomeType: 'w2' | 'business' | 'reimbursement' | undefined) => {
    if (taskIds.length === 0) return;
    setTasks(prevTasks =>
      prevTasks.map(task =>
        taskIds.includes(task.id) ? { ...task, incomeType } : task
      )
    );
    if (incomeType) {
      const typeName = incomeType === 'w2' ? 'W-2 Wage' : incomeType === 'business' ? 'Business Earning' : 'Reimbursement';
      showToast(`${taskIds.length} tasks' income type set to "${typeName}".`);
    } else {
      showToast(`Income type removed from ${taskIds.length} tasks.`);
    }
  }, [setTasks, showToast]);

  const handleBulkSetOpenDate = useCallback((taskIds: number[], openDate: number) => {
    if (taskIds.length === 0) return;
    setTasks(prevTasks =>
      prevTasks.map(task =>
        taskIds.includes(task.id) ? { ...task, openDate } : task
      )
    );
    showToast(`${taskIds.length} tasks updated with new open date.`);
  }, [setTasks, showToast]);

  const handleBulkSetYear = useCallback((taskIds: number[], year: number) => {
    if (taskIds.length === 0) return;
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (taskIds.includes(task.id)) {
          const originalDate = new Date(task.openDate);
          originalDate.setFullYear(year);
          return { ...task, openDate: originalDate.getTime() };
        }
        return task;
      })
    );
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
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (taskIds.includes(task.id)) {
          let newAmount = task.transactionAmount || 0;
          if (transactionType === 'income') {
            newAmount = Math.abs(newAmount);
          } else if (transactionType === 'expense') {
            newAmount = -Math.abs(newAmount);
          } else if (transactionType === 'none') {
            newAmount = 0;
          }
          // For 'transfer', we don't change the amount, just the type.
          // If it was -500, it stays -500. If it was +500, it stays +500.
          return { ...task, transactionType, transactionAmount: newAmount };
        }
        return task;
      })
    );
    showToast(`${taskIds.length} tasks' transaction type updated.`);
  }, [setTasks, showToast]);

  const handleSetTaxCategory = useCallback((taskId: number, taxCategoryId: number | undefined) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, taxCategoryId } : task
      )
    );
    const taxCategoryName = settings.taxCategories?.find(tc => tc.id === taxCategoryId)?.name;
    showToast(taxCategoryId !== undefined ? `Task tagged with "${taxCategoryName}".` : 'Tax category removed.');
  }, [setTasks, showToast, settings.taxCategories]);

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
      // Only process tasks that are in the currently visible filtered list AND belong to the Transactions category tree.
      if (
        taskIdsToProcess.includes(task.id) &&
        task.categoryId &&
        allTransactionCategoryIds.includes(task.categoryId)
      ) {
        const taskText = task.text.toLowerCase();
        for (const subCategory of subCategoriesWithKeywords) {
          // If the task is already in the correct sub-category, skip it.
          if (task.categoryId === subCategory.id) continue;

          for (const keyword of (subCategory.autoCategorizationKeywords || [])) {
            if (taskText.includes(keyword.toLowerCase().trim())) {
              categorizedCount++;
              return { ...task, categoryId: subCategory.id }; // Assign to the first matching sub-category
            }
          }
        }
      }
      return task; // Return unchanged if no match
    });

    setTasks(updatedTasks);
    if (categorizedCount > 0) {
      showToast(`Successfully auto-categorized ${categorizedCount} transaction(s).`);
    } else {
      showToast('No transactions matched the defined keywords.');
    }
  }, [tasks, settings.categories, setTasks, showToast]);

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
      // Only process tasks that are in the currently visible filtered list
      if (taskIdsToProcess.includes(task.id)) {
        const taskText = task.text.toLowerCase();

        // Find the first matching tax category
        const matchingTaxCategory = taxCategoriesToProcess.find(taxCat => 
          (taxCat.keywords || []).some(keyword => taskText.includes(keyword.toLowerCase().trim()))
        );

        if (matchingTaxCategory && task.taxCategoryId !== matchingTaxCategory.id) {
          categorizedCount++;
          return { ...task, taxCategoryId: matchingTaxCategory.id };
        }
      }
      return task; // Return unchanged if no match or not in the process list
    });

    setTasks(updatedTasks);
    showToast(categorizedCount > 0 ? `Successfully auto-tagged ${categorizedCount} transaction(s) for taxes.` : 'No transactions matched the defined tax keywords.');
  }, [tasks, settings.taxCategories, setTasks, showToast]);

  const handleSyncTransactionTypes = useCallback(() => {
    let updatedCount = 0;

    const syncType = (task: Task): Task => {
      if (task.transactionAmount && task.transactionAmount !== 0) {
        const newType = task.transactionAmount > 0 ? 'income' : 'expense';
        if (task.transactionType !== newType) {
          updatedCount++;
          return { ...task, transactionType: newType };
        }
      } else if ((!task.transactionAmount || task.transactionAmount === 0) && task.transactionType !== 'none') {
        // Also correct tasks that have a type but amount is 0 or missing
        updatedCount++;
        return { ...task, transactionType: 'none' };
      }
      return task;
    };

    setTasks(prevTasks => prevTasks.map(syncType));
    setCompletedTasks(prevCompleted => prevCompleted.map(syncType));

    showToast(updatedCount > 0 ? `Synced ${updatedCount} transaction type(s).` : 'All transaction types are already up to date.');

  }, [setTasks, setCompletedTasks, showToast]);

  const formatChecklistForCsv = (checklist: (ChecklistSection | RichTextBlock | ChecklistItem)[] | undefined): string => {
    if (!checklist || checklist.length === 0) return '';
  
    // Handle legacy format
    if ('isCompleted' in checklist[0]) {
      return (checklist as ChecklistItem[])
        .map(item => `${item.isCompleted ? '[x]' : '[ ]'} ${item.text}`)
        .join('\n');
    }
  
    // Handle modern format with sections and rich text blocks
    return (checklist as (ChecklistSection | RichTextBlock)[]).map(block => {
      if ('items' in block) { // It's a ChecklistSection
        const header = `### ${block.title}`;
        const items = block.items.map((item: ChecklistItem) => `${item.isCompleted ? '[x]' : '[ ]'} ${item.text}`).join('\n');
        return `${header}\n${items}`;
      }
      return `[Rich Text]: ${block.content.replace(/<[^>]*>?/gm, ' ')}`; // It's a RichTextBlock, strip HTML for CSV
    }).join('\n');
  };

  const formatTimeLogSessionsForCsv = (sessions: TimeLogSession[] | undefined): string => {
    if (!sessions || sessions.length === 0) return '';
    return sessions.map((session: TimeLogSession) => {
      const totalDuration = session.entries.reduce((acc: number, entry: TimeLogEntry) => acc + entry.duration, 0);
      const header = `Session: ${session.title} (Total: ${formatTime(totalDuration)})`;
      const entries = session.entries.map((entry: TimeLogEntry) => `  - ${entry.description}: ${formatTime(entry.duration)}`).join('\n');
      return `${header}\n${entries}`;
    }).join('\n\n');
  };

  const handleCopyTaskAsCsv = useCallback((taskId: number) => {
    const taskToCopy = tasks.find(task => task.id === taskId);
    if (!taskToCopy) {
      showToast('Task not found.');
      return;
    }

    const category = settings.categories.find(c => c.id === taskToCopy.categoryId);
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
    const taxCategory = settings.taxCategories?.find(tc => tc.id === taskToCopy.taxCategoryId);
    const taxCategoryName = taxCategory ? taxCategory.name : '';

    const linkedTask = taskToCopy.startsTaskIdOnComplete ? tasks.find(t => t.id === taskToCopy.startsTaskIdOnComplete) : null;
    const linkedTaskName = linkedTask ? linkedTask.text : '';
    const linkedTaskOffsetMinutes = taskToCopy.linkedTaskOffset ? taskToCopy.linkedTaskOffset / 60000 : 0;
    const earnings = (((taskToCopy.manualTime || 0) / (1000 * 60 * 60)) * (taskToCopy.payRate || 0)).toFixed(2);

    // Escape tabs, newlines, and quotes within fields to not break the format
    const escape = (str: string | undefined) => `"${(str || '').replace(/"/g, '""')}"`;

    const rowData = [
      taskToCopy.id, escape(taskToCopy.text), escape(taskToCopy.url), 
      escape(parentCategoryName), escape(subCategoryName), escape(taxCategoryName),
      taskToCopy.priority || 'Medium',
      formatTimestamp(taskToCopy.openDate), taskToCopy.completeBy ? formatTimestamp(taskToCopy.completeBy) : 'N/A',
      formatTime(taskToCopy.manualTime || 0), taskToCopy.payRate || 0, earnings,
      escape(taskToCopy.company), escape(taskToCopy.websiteUrl), 
      escape(taskToCopy.imageLinks?.join('; ')),
      escape(taskToCopy.attachments?.map(a => a.name).join('; ')),
      taskToCopy.isRecurring || false, taskToCopy.isDailyRecurring || false, 
      taskToCopy.isWeeklyRecurring || false,
      taskToCopy.isMonthlyRecurring || false, taskToCopy.isYearlyRecurring || false, taskToCopy.isAutocomplete || false,
      taskToCopy.startsTaskIdOnComplete || '', escape(linkedTaskName), linkedTaskOffsetMinutes,
      escape(taskToCopy.description), 
      escape(formatChecklistForCsv(taskToCopy.checklist)),
      escape(taskToCopy.notes), escape(taskToCopy.responses),
      escape(formatTimeLogSessionsForCsv(taskToCopy.timeLogSessions))
    ].join('\t'); // Use tabs as the separator

    // For a single row, we typically don't include the header.
    navigator.clipboard.writeText(rowData);
    showToast('Task row copied to clipboard!');    
  }, [tasks, settings.categories, showToast]);

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
      
      // Escape tabs, newlines, and quotes within fields to not break the format
      const escape = (str: string | undefined) => `"${(str || '').replace(/"/g, '""')}"`;

      return [
        task.id, escape(task.text), escape(task.url), 
        escape(parentCategoryName), escape(subCategoryName), escape(taxCategoryName),
        task.priority || 'Medium',
        formatTimestamp(task.openDate), task.completeBy ? formatTimestamp(task.completeBy) : 'N/A',
        formatTime(task.manualTime || 0), task.payRate || 0, earnings, escape(task.company), escape(task.websiteUrl),
        escape(task.imageLinks?.join('; ')), escape(task.attachments?.map(a => a.name).join('; ')),
        task.isRecurring || false, task.isDailyRecurring || false, task.isWeeklyRecurring || false,
        task.isMonthlyRecurring || false, task.isYearlyRecurring || false, task.isAutocomplete || false,
        task.startsTaskIdOnComplete || '', escape(linkedTaskName), linkedTaskOffsetMinutes,
        escape(task.description),
        escape(formatChecklistForCsv(task.checklist)),
        escape(task.notes), escape(task.responses),
        escape(formatTimeLogSessionsForCsv(task.timeLogSessions))
      ].join('\t'); // Use tabs as the separator
    });

    navigator.clipboard.writeText([headers.join('\t'), ...rows].join('\n'));
    showToast(`${tasksToCopy.length} task(s) copied to clipboard!`);
  }, [tasks, settings.categories, settings.taxCategories, showToast]);

  const handleCopyList = useCallback(() => {
    const reportHeader = "Open Tasks Report\n===================\n";
    const reportBody = tasks.map(task => {
      const currentDuration = Date.now() - task.createdAt;
      return `- ${task.text}\n    - Date Opened: ${formatTimestamp(task.createdAt)}\n    - Current Timer: ${formatTime(currentDuration)}`;
    }).join('\n\n');

    const taskList = reportHeader + reportBody;
    navigator.clipboard.writeText(taskList).then(() => {
      showToast('Open tasks copied!');
    }).catch(err => {
      console.error('Failed to copy list: ', err);
    });
  }, [tasks, showToast]);  

  const handleSyncIds = useCallback(() => {
    const idMap = new Map<number, number>();
    let newIdCounter = 1;

    const reIdTasks = (taskArray: Task[]): Task[] => {
      return taskArray.map(task => {
        const newId = newIdCounter++;
        idMap.set(task.id, newId);
        return { ...task, id: newId };
      });
    };

    const newTasks = reIdTasks(tasks);
    const newCompletedTasks = reIdTasks(completedTasks);

    const updateLinkedIds = (taskArray: Task[]): Task[] => {
      return taskArray.map(task => {
        if (task.startsTaskIdOnComplete && idMap.has(task.startsTaskIdOnComplete)) {
          return { ...task, startsTaskIdOnComplete: idMap.get(task.startsTaskIdOnComplete) };
        }
        return task;
      });
    };

    const finalTasks = updateLinkedIds(newTasks);
    const finalCompletedTasks = updateLinkedIds(newCompletedTasks);

    // After re-indexing, immediately update the counter to the next available ID.
    nextId.current = newIdCounter;

    setTasks(finalTasks);
    setCompletedTasks(finalCompletedTasks);

    showToast('All task IDs have been synchronized successfully!', 3000);
  }, [tasks, completedTasks, setTasks, setCompletedTasks, showToast]);

  const moveTask = useCallback((taskIdToMove: number, targetTaskId: number) => {
    setTasks(prevTasks => {
      const newTasks = [...prevTasks];
      const indexToMove = newTasks.findIndex(t => t.id === taskIdToMove);
      const indexToSwap = newTasks.findIndex(t => t.id === targetTaskId);

      if (indexToMove === -1 || indexToSwap === -1) {
        console.error("Could not find one or both tasks to swap.");
        return prevTasks; // Return original state if tasks not found
      }

      const temp = newTasks[indexToMove];
      newTasks[indexToMove] = newTasks[indexToSwap];
      newTasks[indexToSwap] = temp;
      return newTasks;
    });
  }, [setTasks]);

  // Keep refs updated with the latest state
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);
  useEffect(() => {
    completedTasksRef.current = completedTasks;
  }, [completedTasks]);

  return {
    tasks, setTasks,
    completedTasks, setCompletedTasks,
    confirmingClearCompleted,
    handleCompleteTask,
    removeTask,
    handleDuplicateTask,
    handleReopenTask,
    handleClearCompleted,
    handleTaskUpdate,
    handleCreateNewTask,
    handleChecklistCompletion,
    handleClearAll,
    handleBulkAdd,
    handleBulkDelete,
    handleBulkComplete,
    handleBulkReopen,
    handleBulkSetPriority,
    handleBulkSetDueDate,
    handleBulkSetCategory,
    handleBulkSetAccount,
    handleSetTaxCategory,
    handleBulkSetIncomeType,
    handleBulkSetYear,
    handleBulkSetOpenDate,
    handleBulkSetTransactionType,
    handleAutoTagIncomeTypes,
    handleBulkSetTaxCategory,
    handleSyncTransactionTypes,
    handleAutoCategorize,
    handleAutoTaxCategorize,
    handleBulkDownloadAsCsv,
    handleCopyTaskAsCsv,
    handleBulkCopyAsCsv,
    handleSyncIds,
    handleCopyList,    
    moveTask,
    tasksRef, // Expose the ref
    completedTasksRef, // Expose the ref
  };
}