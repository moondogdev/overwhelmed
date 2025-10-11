import { useState, useCallback, useRef } from 'react';
import { Task, InboxMessage, ChecklistItem, ChecklistSection, Settings, TimeLogSession, TimeLogEntry, RichTextBlock } from '../types';
import { formatTime, formatTimestamp, formatChecklistForCsv, formatTimeLogSessionsForCsv } from '../utils';

interface UseTaskManagementProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  completedTasks: Task[];
  setCompletedTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  settings: Settings;
  showToast: (message: string, duration?: number) => void;
  setInboxMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
  getNextId: () => number;
  newTask: Partial<Task>;
  setNewTask: React.Dispatch<React.SetStateAction<Partial<Task>>>;
  tasksRefForDebounce: React.RefObject<Task[]>;
}

interface UseTaskManagementReturn {
  confirmingClearCompleted: boolean;
  handleCompleteTask: (taskToComplete: Task, status?: 'completed' | 'skipped') => void;
  removeTask: (idToRemove: number) => void;
  handleDuplicateTask: (taskToCopy: Task) => void;
  handleReopenTask: (taskToReopen: Task) => void;
  handleClearCompleted: () => void;
  handleCreateNewTask: () => void;
  handleTaskUpdate: (updatedTask: Task) => void;
  handleSetTaxCategory: (taskId: number, taxCategoryId: number | undefined) => void;
  handleSyncTransactionTypes: () => void;
  handleChecklistCompletion: (item: ChecklistItem, sectionId: number) => void;
  handleCopyTaskAsCsv: (taskId: number) => void;
  handleClearAll: () => void;
  handleCopyList: () => void;
  moveTask: (taskIdToMove: number, targetTaskId: number) => void;
}

export function useTaskManagement({
  tasks,
  setTasks,
  completedTasks,
  setCompletedTasks,
  settings,
  showToast,
  setInboxMessages,
  getNextId,
  newTask,
  setNewTask,
  tasksRefForDebounce,
}: UseTaskManagementProps): UseTaskManagementReturn {
  const [confirmingClearCompleted, setConfirmingClearCompleted] = useState(false);
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [updateTimers, setUpdateTimers] = useState<{ [key: number]: NodeJS.Timeout }>({});

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
        const originalDuration = taskToComplete.completeBy - taskToComplete.createdAt;
        newCompleteBy = Date.now() + originalDuration;
      }

      newRecurringTask = {
        ...taskToComplete,
        id: getNextId(),
        createdAt: newOpenDate,
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
          const offset = taskToComplete.linkedTaskOffset || 0;
          const updatedSuccessor = { ...t, openDate: Date.now(), completeBy: Date.now() + offset };
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
  }, [setInboxMessages, showToast, setTasks, setCompletedTasks, getNextId, tasks]);

  const removeTask = useCallback((idToRemove: number) => {
    const taskToRemove = tasks.find(t => t.id === idToRemove) || completedTasks.find(t => t.id === idToRemove);
    setTasks(prev => prev.filter(task => task.id !== idToRemove));
    setCompletedTasks(prev => prev.filter(task => task.id !== idToRemove));
    if (taskToRemove) {
      setInboxMessages(prev => [{ id: Date.now() + Math.random(), type: 'deleted', text: `Task deleted: "${taskToRemove.text}"`, timestamp: Date.now(), taskId: idToRemove }, ...prev]);
    }
    showToast('Task removed.');
  }, [tasks, completedTasks, setInboxMessages, showToast, setTasks, setCompletedTasks]);

  const handleDuplicateTask = useCallback((taskToCopy: Task) => {
    const newTask: Task = { ...taskToCopy, id: getNextId(), openDate: Date.now(), createdAt: Date.now(), completedDuration: undefined };
    setTasks(prevTasks => [newTask, ...prevTasks]);
    setInboxMessages(prev => [{ id: Date.now() + Math.random(), type: 'created', text: `Task duplicated: "${newTask.text}"`, timestamp: Date.now(), taskId: newTask.id }, ...prev]);
    showToast('Task duplicated!');
  }, [setInboxMessages, showToast, setTasks, getNextId]);

  const handleReopenTask = useCallback((taskToReopen: Task) => {
    setCompletedTasks(prev => prev.filter(t => t.id !== taskToReopen.id));
    const reopenedTask: Task = { ...taskToReopen, completedDuration: undefined };
    setTasks(prev => [reopenedTask, ...prev]);
    showToast('Task reopened!'); 
  }, [setCompletedTasks, setTasks, showToast, completedTasks]);

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
  }, [confirmingClearCompleted, showToast, setCompletedTasks]);

  const handleCreateNewTask = useCallback(() => {
    if (newTask.text.trim() === "") return;

    const newTaskObject: Task = {
      ...newTask,
      id: getNextId(),
      text: newTask.text.trim(),
      openDate: newTask.openDate || Date.now(),      
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

    setNewTask({
      text: '', url: '', taskType: newTask.taskType, priority: 'Medium' as 'High' | 'Medium' | 'Low',
      categoryId: newTask.categoryId, openDate: new Date().getTime(), completeBy: undefined, company: '',
      websiteUrl: '', imageLinks: [], attachments: [], checklist: [], notes: '', responses: '',
      description: '', manualTime: 0, manualTimeRunning: false, manualTimeStart: 0, payRate: 0,
      transactionAmount: 0, transactionType: 'none', isRecurring: false, isDailyRecurring: false,
      isWeeklyRecurring: false, isMonthlyRecurring: false, isYearlyRecurring: false, isAutocomplete: false,
      lastNotified: undefined, snoozedAt: undefined,
    });
  }, [newTask, setInboxMessages, showToast, setTasks, setNewTask, getNextId]);

  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    if (updateTimers[updatedTask.id]) {
      clearTimeout(updateTimers[updatedTask.id]);
    }

    const newTimer = setTimeout(() => {
      if (tasksRefForDebounce.current.some(t => t.id === updatedTask.id)) {
        setInboxMessages(prev => {
          const recentUpdate = prev.find(msg => msg.taskId === updatedTask.id && msg.type === 'updated' && (Date.now() - msg.timestamp < 60000));
          if (recentUpdate) return prev;
          return [{
            id: Date.now() + Math.random(), type: 'updated', text: `Task updated: "${updatedTask.text}"`,
            timestamp: Date.now(), taskId: updatedTask.id,
          }, ...prev];
        });
      }
      setUpdateTimers(prev => { const newTimers = { ...prev }; delete newTimers[updatedTask.id]; return newTimers; });
    }, 5000);

    setUpdateTimers(prev => ({ ...prev, [updatedTask.id]: newTimer }));
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
  }, [tasks, updateTimers, tasksRefForDebounce, setInboxMessages, setTasks]);

  const handleSetTaxCategory = useCallback((taskId: number, taxCategoryId: number | undefined) => {
    setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? { ...task, taxCategoryId } : task));
    const taxCategoryName = settings.taxCategories?.find(tc => tc.id === taxCategoryId)?.name;
    showToast(taxCategoryId !== undefined ? `Task tagged with "${taxCategoryName}".` : 'Tax category removed.');
  }, [setTasks, showToast, settings.taxCategories]);

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
        updatedCount++;
        return { ...task, transactionType: 'none' };
      }
      return task;
    };
    setTasks(prevTasks => prevTasks.map(syncType));
    setCompletedTasks(prevCompleted => prevCompleted.map(syncType));
    showToast(updatedCount > 0 ? `Synced ${updatedCount} transaction type(s).` : 'All transaction types are already up to date.');
  }, [setTasks, setCompletedTasks, showToast]);

  const handleChecklistCompletion = useCallback((item: ChecklistItem, sectionId: number) => {
    const parentTask = tasks.find(t => t.checklist?.some(s => 'items' in s && s.id === sectionId));
    if (parentTask) {
      setInboxMessages(prev => [{
        id: Date.now() + Math.random(), type: 'completed', text: `Checklist item completed: "${item.text}" in task "${parentTask.text}"`,
        timestamp: Date.now(), taskId: parentTask.id, sectionId: sectionId
      }, ...prev]);
    }
  }, [tasks, setInboxMessages]);

  const handleCopyTaskAsCsv = useCallback((taskId: number) => {
    const taskToCopy = tasks.find(task => task.id === taskId);
    if (!taskToCopy) { showToast('Task not found.'); return; }
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
    const escape = (str: string | undefined) => `"${(str || '').replace(/"/g, '""')}"`;
    const rowData = [
      taskToCopy.id, escape(taskToCopy.text), escape(taskToCopy.url), escape(parentCategoryName), escape(subCategoryName), escape(taxCategoryName),
      taskToCopy.priority || 'Medium', formatTimestamp(taskToCopy.openDate), taskToCopy.completeBy ? formatTimestamp(taskToCopy.completeBy) : 'N/A',
      formatTime(taskToCopy.manualTime || 0), taskToCopy.payRate || 0, earnings, escape(taskToCopy.company), escape(taskToCopy.websiteUrl),
      escape(taskToCopy.imageLinks?.join('; ')), escape(taskToCopy.attachments?.map(a => a.name).join('; ')),
      taskToCopy.isRecurring || false, taskToCopy.isDailyRecurring || false, taskToCopy.isWeeklyRecurring || false,
      taskToCopy.isMonthlyRecurring || false, taskToCopy.isYearlyRecurring || false, taskToCopy.isAutocomplete || false,
      taskToCopy.startsTaskIdOnComplete || '', escape(linkedTaskName), linkedTaskOffsetMinutes, escape(taskToCopy.description),
      escape(formatChecklistForCsv(taskToCopy.checklist)), escape(taskToCopy.notes), escape(taskToCopy.responses),
      escape(formatTimeLogSessionsForCsv(taskToCopy.timeLogSessions))
    ].join('\t');
    navigator.clipboard.writeText(rowData);
    showToast('Task row copied to clipboard!');
  }, [tasks, settings.categories, settings.taxCategories, showToast]);

  const handleClearAll = useCallback(() => {
    setTasks([]);
    showToast('All open tasks cleared!');
  }, [showToast, setTasks]);

  const handleCopyList = useCallback(() => {
    const reportHeader = "Open Tasks Report\n===================\n";
    const reportBody = tasks.map(task => {
      const currentDuration = Date.now() - task.createdAt;
      return `- ${task.text}\n    - Date Opened: ${formatTimestamp(task.createdAt)}\n    - Current Timer: ${formatTime(currentDuration)}`;
    }).join('\n\n');
    const taskList = reportHeader + reportBody;
    navigator.clipboard.writeText(taskList).then(() => { showToast('Open tasks copied!'); }).catch(err => { console.error('Failed to copy list: ', err); });
  }, [tasks, showToast]);

  const moveTask = useCallback((taskIdToMove: number, targetTaskId: number) => {
    setTasks(prevTasks => {
      const newTasks = [...prevTasks];
      const indexToMove = newTasks.findIndex(t => t.id === taskIdToMove);
      const indexToSwap = newTasks.findIndex(t => t.id === targetTaskId);
      if (indexToMove === -1 || indexToSwap === -1) {
        console.error("Could not find one or both tasks to swap.");
        return prevTasks;
      }
      [newTasks[indexToMove], newTasks[indexToSwap]] = [newTasks[indexToSwap], newTasks[indexToMove]];
      return newTasks;
    });
  }, [setTasks]);

  return {
    confirmingClearCompleted,
    handleCompleteTask,
    removeTask,
    handleDuplicateTask,
    handleReopenTask,
    handleClearCompleted,
    handleCreateNewTask,
    handleTaskUpdate,
    handleSetTaxCategory,
    handleSyncTransactionTypes,
    handleChecklistCompletion,
    handleCopyTaskAsCsv,
    handleClearAll,
    handleCopyList,
    moveTask,
  };
}