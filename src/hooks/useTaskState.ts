import { useState, useCallback, useRef, useEffect } from 'react';
import { Task, InboxMessage, ChecklistItem, ChecklistSection, Settings, TimeLogSession, TimeLogEntry } from '../types';
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

  // New refs to hold the latest state for background processes like auto-save
  const tasksRef = useRef(tasks);
  const completedTasksRef = useRef(completedTasks);

  tasksRefForDebounce.current = tasks;

  const handleCompleteTask = useCallback((taskToComplete: Task, status: 'completed' | 'skipped' = 'completed') => {
    const finalDuration = taskToComplete.isPaused
      ? taskToComplete.pausedDuration
      : (taskToComplete.pausedDuration || 0) + (Date.now() - taskToComplete.createdAt);

    const completedTask = { ...taskToComplete, completedDuration: finalDuration, completionStatus: status };

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
        id: Date.now() + Math.random(),
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
      setInboxMessages(prev => [{ id: Date.now() + Math.random(), type: 'deleted', text: `Task deleted: "${taskToRemove.text}"`, timestamp: Date.now() }, ...prev]);
    }
    showToast('Task removed.');
  }, [tasks, completedTasks, setInboxMessages, showToast]);

  const handleDuplicateTask = useCallback((taskToCopy: Task) => {
    const newTask: Task = { ...taskToCopy, id: Date.now() + Math.random(), openDate: Date.now(), createdAt: Date.now(), completedDuration: undefined };
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
      id: Date.now() + Math.random(),
      text: newTask.text.trim(),
      openDate: newTask.openDate || Date.now(),
      x: 0, 
      y: 0,
      width: 0,
      height: 0,
      createdAt: Date.now(),
      pausedDuration: 0,
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
        setInboxMessages(prev => [{
          id: Date.now() + Math.random(),
          type: 'updated',
          text: `Task updated: "${updatedTask.text}"`,
          timestamp: Date.now(),
          taskId: updatedTask.id,
        }, ...prev]);
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

  const handleBulkAdd = useCallback((options: { categoryId: number | 'default', priority: 'High' | 'Medium' | 'Low', completeBy?: string }) => {
    if (bulkAddText.trim() === "") return;

    const tasksToAdd = bulkAddText.split(/[\n,]+/).map(t => t.trim()).filter(t => t);
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

    const newTasks = tasksToAdd.map(text => {
      const newTaskObject: Task = {
        id: Date.now() + Math.random(),
        text,
        x: 0, y: 0,
        categoryId: targetCategoryId,
        priority: options.priority,
        completeBy: completeByTimestamp,
        manualTime: 0,
        manualTimeRunning: false,
        manualTimeStart: 0,
        openDate: Date.now(),
        width: 0,
        height: 0,
        createdAt: Date.now(),
        pausedDuration: 0,
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
  }, [bulkAddText, setBulkAddText, settings.activeCategoryId, settings.activeSubCategoryId, settings.categories, setInboxMessages, setTasks]);

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
        const finalDuration = task.isPaused ? task.pausedDuration : (task.pausedDuration || 0) + (now - task.createdAt);
        return { ...task, completedDuration: finalDuration, completionStatus: 'completed' as 'completed' | 'skipped' };
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

  const formatChecklistForCsv = (checklist: (ChecklistSection | ChecklistItem)[] | undefined): string => {
    if (!checklist || checklist.length === 0) return '';

    // Handle legacy format
    if ('isCompleted' in checklist[0]) {
      return (checklist as ChecklistItem[])
        .map(item => `${item.isCompleted ? '[x]' : '[ ]'} ${item.text}`)
        .join('\n');
    }

    return (checklist as ChecklistSection[]).map(section => {
      const header = `### ${section.title}`;
      const items = section.items.map(item => `${item.isCompleted ? '[x]' : '[ ]'} ${item.text}`).join('\n');
      return `${header}\n${items}\n`;
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
    const linkedTask = taskToCopy.startsTaskIdOnComplete ? tasks.find(t => t.id === taskToCopy.startsTaskIdOnComplete) : null;
    const linkedTaskName = linkedTask ? linkedTask.text : '';
    const linkedTaskOffsetMinutes = taskToCopy.linkedTaskOffset ? taskToCopy.linkedTaskOffset / 60000 : 0;
    const earnings = (((taskToCopy.manualTime || 0) / (1000 * 60 * 60)) * (taskToCopy.payRate || 0)).toFixed(2);

    // Escape tabs, newlines, and quotes within fields to not break the format
    const escape = (str: string | undefined) => `"${(str || '').replace(/"/g, '""')}"`;

    const rowData = [
      taskToCopy.id, escape(taskToCopy.text), escape(taskToCopy.url), 
      escape(parentCategoryName), escape(subCategoryName), 
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
      "ID", "Task", "Task URL", "Parent Category", "Sub-Category", "Priority", "Open Date", "Due Date",
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
      const linkedTask = task.startsTaskIdOnComplete ? tasks.find(t => t.id === task.startsTaskIdOnComplete) : null;
      const linkedTaskName = linkedTask ? linkedTask.text : '';
      const linkedTaskOffsetMinutes = task.linkedTaskOffset ? task.linkedTaskOffset / 60000 : 0;
      const earnings = (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)).toFixed(2);
      
      const escapeCsv = (str: string | undefined) => `"${(str || '').replace(/"/g, '""')}"`;

      return [
        task.id, escapeCsv(task.text), escapeCsv(task.url), 
        escapeCsv(parentCategoryName), escapeCsv(subCategoryName), 
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
  }, [tasks, settings.categories, showToast]);

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
      "ID", "Task", "Task URL", "Parent Category", "Sub-Category", "Priority", "Open Date", "Due Date",
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
      const linkedTask = task.startsTaskIdOnComplete ? tasks.find(t => t.id === task.startsTaskIdOnComplete) : null;
      const linkedTaskName = linkedTask ? linkedTask.text : '';
      const linkedTaskOffsetMinutes = task.linkedTaskOffset ? task.linkedTaskOffset / 60000 : 0;
      const earnings = (((task.manualTime || 0) / (1000 * 60 * 60)) * (task.payRate || 0)).toFixed(2);
      
      // Escape tabs, newlines, and quotes within fields to not break the format
      const escape = (str: string | undefined) => `"${(str || '').replace(/"/g, '""')}"`;

      return [
        task.id, escape(task.text), escape(task.url), 
        escape(parentCategoryName), escape(subCategoryName), 
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
  }, [tasks, settings.categories, showToast]);

  const handleCopyList = useCallback(() => {
    const reportHeader = "Open Tasks Report\n===================\n";
    const reportBody = tasks.map(task => {
      const now = Date.now();
      const currentDuration = task.isPaused
        ? (task.pausedDuration || 0)
        : (task.pausedDuration || 0) + (now - task.createdAt);
      return `- ${task.text}\n    - Date Opened: ${formatTimestamp(task.createdAt)}\n    - Current Timer: ${formatTime(currentDuration)}`;
    }).join('\n\n');

    const taskList = reportHeader + reportBody;
    navigator.clipboard.writeText(taskList).then(() => {
      showToast('Open tasks copied!');
    }).catch(err => {
      console.error('Failed to copy list: ', err);
    });
  }, [tasks, showToast]);

  const handleTogglePause = useCallback((taskId: number) => {
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        if (task.isPaused) {
          // Resuming: adjust createdAt to account for the time it was paused
          const now = Date.now();
          const newCreatedAt = now - (task.pausedDuration || 0);
          return { ...task, isPaused: false, createdAt: newCreatedAt, pausedDuration: 0 };
        } else {
          // Pausing: calculate and store the elapsed duration
          const elapsed = (task.pausedDuration || 0) + (Date.now() - task.createdAt);
          return { ...task, isPaused: true, pausedDuration: elapsed };
        }
      }
      return task;
    }));
  }, [setTasks]);

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
    handleBulkDownloadAsCsv,
    handleCopyTaskAsCsv,
    handleBulkCopyAsCsv,
    handleCopyList,
    handleTogglePause,
    moveTask,
    tasksRef, // Expose the ref
    completedTasksRef, // Expose the ref
  };
}