import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, TimeLogEntry, Settings, ChecklistSection, ChecklistItem, TimeLogSession, RichTextBlock } from '../types';
import { formatTime } from '../utils';

interface UseGlobalTimerProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  settings: Settings;
}

export function useGlobalTimer({ tasks, setTasks, settings }: UseGlobalTimerProps) {
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<number | null>(null);
  const [activeTimerEntry, setActiveTimerEntry] = useState<TimeLogEntry | null>(null);
  const [activeTimerLiveTime, setActiveTimerLiveTime] = useState<number>(0);  
  const [primedTaskId, setPrimedTaskId] = useState<number | null>(null);

  // Refs to hold the latest timer state for background processes
  const activeTimerTaskIdRef = useRef(activeTimerTaskId);
  const activeTimerEntryRef = useRef(activeTimerEntry);


  useEffect(() => {
    const timerInterval = setInterval(() => {
      if (activeTimerEntry && activeTimerEntry.startTime) {
        const liveTime = activeTimerEntry.duration + (Date.now() - activeTimerEntry.startTime);
        setActiveTimerLiveTime(liveTime);
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [activeTimerEntry]);

  // Keep refs updated with the latest state
  useEffect(() => {
    activeTimerTaskIdRef.current = activeTimerTaskId;
  }, [activeTimerTaskId]);
  useEffect(() => {
    activeTimerEntryRef.current = activeTimerEntry;
  }, [activeTimerEntry]);

  const handleGlobalStopTimer = useCallback(() => {
    if (!activeTimerTaskId || !activeTimerEntry) return;

    const now = Date.now();
    const elapsed = now - (activeTimerEntry.startTime || now);
    const finalDuration = activeTimerEntry.duration + elapsed;

    setTasks(prevTasks =>
      prevTasks.map(t => {
        if (t.id !== activeTimerTaskId) return t;
        const newTimeLog = (t.timeLog || []).map(entry =>
          entry.id === activeTimerEntry.id
            ? { ...entry, duration: finalDuration, isRunning: false, startTime: undefined }
            : entry
        );
        return { ...t, timeLog: newTimeLog };
      })
    );

    setActiveTimerTaskId(null);
    setActiveTimerEntry(null);
    setActiveTimerLiveTime(0);
    setPrimedTaskId(null);
  }, [activeTimerTaskId, activeTimerEntry, setTasks]);

  const handleGlobalToggleTimer = useCallback((taskIdToToggle: number, entryIdToToggle: number, entryToStart?: TimeLogEntry, newTimeLog?: TimeLogEntry[]) => {
    const now = Date.now();

    setTasks(prevTasks => {
      let tasksWithStoppedTimer = [...prevTasks];
      const isSwitchingTimers = activeTimerTaskId && activeTimerEntry && (activeTimerTaskId !== taskIdToToggle || activeTimerEntry.id !== entryIdToToggle);

      // --- Step 1: Gracefully stop the currently running timer if we are switching ---
      if (isSwitchingTimers) {
        const lastActiveTaskId = activeTimerTaskId;
        const lastActiveEntry = activeTimerEntry;
        const elapsed = now - (lastActiveEntry.startTime || now);
        const finalDuration = lastActiveEntry.duration + elapsed;

        tasksWithStoppedTimer = tasksWithStoppedTimer.map(t => {
          if (t.id !== lastActiveTaskId) return t;
          const updatedTimeLog = (t.timeLog || []).map(entry =>
            entry.id === lastActiveEntry.id
              ? { ...entry, duration: finalDuration, isRunning: false, startTime: undefined }
              : entry
          );

          // Find the corresponding checklist item and update its loggedTime.
          let checklistToUpdate = t.checklist || [];
          // Normalize checklist from old format if necessary
          if (checklistToUpdate.length > 0 && 'isCompleted' in checklistToUpdate[0]) {
            checklistToUpdate = [{ id: 1, title: 'Checklist', items: checklistToUpdate as ChecklistItem[] }];
          }
          let updatedChecklist = checklistToUpdate as (ChecklistSection | RichTextBlock)[];

          if (lastActiveEntry.checklistItemId) {
            updatedChecklist = updatedChecklist.map(sectionOrItem => {
              if ('items' in sectionOrItem) { // It's a ChecklistSection
                return { ...sectionOrItem, items: sectionOrItem.items.map(item => item.id === lastActiveEntry.checklistItemId ? { ...item, loggedTime: finalDuration } : item) };
              }
              return sectionOrItem;
            });
          }
          return { ...t, timeLog: updatedTimeLog, checklist: updatedChecklist };
        });
      }

      // --- Step 2: Toggle the target timer ---
      return tasksWithStoppedTimer.map(t => {
        if (t.id !== taskIdToToggle) return t; // Not the task we're interested in.

        let timeLog = newTimeLog ? [...newTimeLog] : [...(t.timeLog || [])];
        const entryIndex = timeLog.findIndex(e => e.id === entryIdToToggle);
        let targetEntry = entryIndex !== -1 ? timeLog[entryIndex] : entryToStart;

        if (!targetEntry) return t;

        const isCurrentlyRunning = targetEntry.isRunning && activeTimerTaskId === taskIdToToggle && activeTimerEntry?.id === entryIdToToggle;

        if (isCurrentlyRunning) {
          // PAUSE: Calculate final duration and update the entry.
          const elapsed = now - (targetEntry.startTime || now);
          const finalDuration = targetEntry.duration + elapsed;

          // Also update the corresponding checklist item's loggedTime
          let checklistToUpdate = t.checklist || [];
          if (checklistToUpdate.length > 0 && 'isCompleted' in checklistToUpdate[0]) {
            checklistToUpdate = [{ id: 1, title: 'Checklist', items: checklistToUpdate as ChecklistItem[] }];
          }
          let updatedChecklist = checklistToUpdate as (ChecklistSection | RichTextBlock)[];

          if (targetEntry.checklistItemId) {
            updatedChecklist = updatedChecklist.map(sectionOrItem => {
              if ('items' in sectionOrItem) {
                return { ...sectionOrItem, items: sectionOrItem.items.map(item => item.id === targetEntry.checklistItemId ? { ...item, loggedTime: finalDuration } : item) };
              }
              return sectionOrItem;
            });
            t.checklist = updatedChecklist;
          }
          targetEntry = { ...targetEntry, duration: finalDuration, isRunning: false, startTime: undefined };
          // Keep the timer "active" but in a paused state.
          setActiveTimerTaskId(taskIdToToggle);
          setActiveTimerEntry(targetEntry);
          setActiveTimerLiveTime(finalDuration);
        } else {
          // START: Set startTime and update the entry. If it was already "running" (from a quit/restart), calculate time since last save.
          let newDuration = targetEntry.duration || 0;
          if (targetEntry.isRunning && targetEntry.startTime) {
            const timeSinceLastSave = now - targetEntry.startTime;
            newDuration += timeSinceLastSave;
          }
          targetEntry = { ...targetEntry, duration: newDuration, isRunning: true, startTime: now };
          setActiveTimerTaskId(taskIdToToggle);
          setActiveTimerEntry(targetEntry);
          setActiveTimerLiveTime(targetEntry.duration);
          setPrimedTaskId(null);
        }
  
        // Update the log array.
        if (entryIndex !== -1) {
          timeLog[entryIndex] = targetEntry;
        } else if (entryToStart) {
          timeLog.push(targetEntry);
        }

        return { ...t, timeLog };
      });
    });
  }, [activeTimerTaskId, activeTimerEntry, setTasks]);

  const handleGlobalResetTimer = useCallback((taskId: number, entryId: number) => {
    setTasks(prevTasks =>
      prevTasks.map(t => {
        if (t.id !== taskId) return t;
        const newTimeLog = (t.timeLog || []).map(entry =>
          entry.id === entryId
            ? { ...entry, duration: 0, isRunning: false, startTime: undefined }
            : entry
        );
        return { ...t, timeLog: newTimeLog };
      })
    );

    // If this was the active timer, clear the global state to stop the player
    if (activeTimerTaskId === taskId && activeTimerEntry && activeTimerEntry.id === entryId) {
      // New Logic: Instead of clearing the player, update it to show the reset (but still active) entry.
      const resetEntry: TimeLogEntry = {
        ...activeTimerEntry,
        duration: 0,
        isRunning: false,
        startTime: undefined,
      };
      setActiveTimerEntry(resetEntry);
      setActiveTimerLiveTime(0);
    }
  }, [tasks, setTasks, activeTimerTaskId, activeTimerEntry]);

  const handleClearActiveTimer = useCallback(() => {
    setActiveTimerTaskId(null);
    setActiveTimerEntry(null);
    setActiveTimerLiveTime(0);
    setPrimedTaskId(null);
  }, []);

  const handlePrimeTask = useCallback((taskId: number) => {
    handleClearActiveTimer(); // Ensure no timer is active
    setPrimedTaskId(taskId);
  }, [handleClearActiveTimer]);

  const handlePrimeTaskWithNewLog = useCallback((taskId: number, newTimeLog: TimeLogEntry[], timeLogTitle?: string) => {
    // Find the first playable entry in the new time log.
    const firstPlayableEntry = newTimeLog.find(e => e.type !== 'header');

    // This is an atomic operation to prevent race conditions.
    setTasks(prevTasks => 
      prevTasks.map(t => 
        t.id === taskId 
          ? { ...t, timeLog: newTimeLog, timeLogTitle: timeLogTitle } 
          : t
      )
    );
    // After the task state is updated, we set the active timer state to reflect the primed task,
    // but in a non-running state. This ensures the MiniPlayer has a concrete entry to display immediately.
    if (firstPlayableEntry) {
      setActiveTimerTaskId(taskId);
      setActiveTimerEntry({ ...firstPlayableEntry, isRunning: false, startTime: undefined }); // Ensure it's not running
      setActiveTimerLiveTime(firstPlayableEntry.duration); // Show its duration
      setPrimedTaskId(null); // It's now "active" (loaded), not just primed.
    } else {
      // If no playable entry, clear everything.
      setActiveTimerTaskId(null);
      setActiveTimerEntry(null);
      setActiveTimerLiveTime(0);
      setPrimedTaskId(null);
    }
  }, [setTasks]);

  const handleNavigateWorkSession = useCallback((direction: 'next' | 'previous') => {
    const workSessionQueue = settings.workSessionQueue || [];
    if (workSessionQueue.length === 0) return;

    const currentIndex = activeTimerTaskId !== null ? workSessionQueue.indexOf(activeTimerTaskId) : -1;
    let nextIndex = -1;

    if (direction === 'next') {
      // If we can go next from the current position
      if (currentIndex < workSessionQueue.length - 1) {
        nextIndex = currentIndex + 1;
      }
    } else { // direction is 'previous'
      // If we can go previous from the current position
      if (currentIndex > 0) {
        nextIndex = currentIndex - 1;
      }
    }

    // If we found a valid next index to move to
    if (nextIndex !== -1) {
      const nextTaskId = workSessionQueue[nextIndex];
      const nextTask = tasks.find(t => t.id === nextTaskId);
      if (nextTask) {
        handleGlobalStopTimer(); // Stop current timer if any
        // Create a new entry and start it using the unified toggle function
        const newEntry: TimeLogEntry = { id: Date.now(), description: `Starting session: ${nextTask.text}`, duration: 0, createdAt: Date.now() };
        setTasks(prev => prev.map(t => t.id === nextTaskId ? { ...t, timeLog: [...(t.timeLog || []), newEntry] } : t));
        setTimeout(() => {
          handleGlobalToggleTimer(nextTaskId, newEntry.id, newEntry);
        }, 100);
      }
    }
  }, [activeTimerTaskId, settings.workSessionQueue, tasks, handleGlobalStopTimer, handleGlobalToggleTimer, setTasks]);

  const handleNextTask = useCallback(() => handleNavigateWorkSession('next'), [handleNavigateWorkSession]);
  const handlePreviousTask = useCallback(() => handleNavigateWorkSession('previous'), [handleNavigateWorkSession]);

  const handleNavigateChapter = useCallback((direction: 'next' | 'previous') => {
    if (!activeTimerTaskId || !activeTimerEntry) return;

    const currentTask = tasks.find(t => t.id === activeTimerTaskId);
    const timeLog = currentTask?.timeLog || [];
    if (timeLog.length < 2) return;

    const currentIndex = timeLog.findIndex(e => e.id === activeTimerEntry.id);
    if (currentIndex === -1) return;

    let targetHeaderIndex = -1;

    if (direction === 'next') {
      for (let i = currentIndex + 1; i < timeLog.length; i++) {
        if (timeLog[i].type === 'header') {
          targetHeaderIndex = i;
          break;
        }
      }
    } else { // direction is 'previous'
      let currentChapterHeaderIndex = -1;
      for (let i = currentIndex; i >= 0; i--) {
        if (timeLog[i].type === 'header') {
          currentChapterHeaderIndex = i;
          break;
        }
      }
      if (currentChapterHeaderIndex > 0) {
        for (let i = currentChapterHeaderIndex - 1; i >= 0; i--) {
          if (timeLog[i].type === 'header') {
            targetHeaderIndex = i;
            break;
          }
        }
      }
    }

    if (targetHeaderIndex !== -1) {
      const firstEntryOfChapter = timeLog.find((entry, index) => index > targetHeaderIndex && entry.type !== 'header');
      if (firstEntryOfChapter) {
        handleGlobalToggleTimer(activeTimerTaskId, firstEntryOfChapter.id);
      }
    }
  }, [activeTimerTaskId, activeTimerEntry, tasks, handleGlobalToggleTimer]);

  const handleNavigateLogEntry = useCallback((direction: 'next' | 'previous') => {
    if (!activeTimerTaskId || !activeTimerEntry) return;

    const currentTask = tasks.find(t => t.id === activeTimerTaskId);
    const timeLog = currentTask?.timeLog || [];
    if (timeLog.length < 2) return;

    const currentIndex = timeLog.findIndex(e => e.id === activeTimerEntry.id);
    if (currentIndex === -1) return;

    let nextIndex = -1;

    if (direction === 'next') {
      // Search for the next valid entry (not a header)
      for (let i = currentIndex + 1; i < timeLog.length; i++) {
        if (timeLog[i].type !== 'header') {
          nextIndex = i;
          break; // Found it, stop searching
        }
      }
    } else { // direction is 'previous'
      // Search for the previous valid entry (not a header)
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (timeLog[i].type !== 'header') {
          nextIndex = i;
          break; // Found it, stop searching
        }
      }
    }

    if (nextIndex !== -1) {
      const nextEntry = timeLog[nextIndex];
      // Use handleGlobalToggleTimer to stop the current and start the next one.
      handleGlobalToggleTimer(activeTimerTaskId, nextEntry.id);
    }
  }, [activeTimerTaskId, activeTimerEntry, tasks, handleGlobalToggleTimer]);

  const handleStartSession = useCallback(() => {
    const workSessionQueue = settings.workSessionQueue || [];
    if (workSessionQueue.length === 0) return;

    const firstTaskId = workSessionQueue[0];
    const firstTask = tasks.find(t => t.id === firstTaskId);
    if (firstTask) {
      // If the task has a pre-existing work timer list, start from the first entry.
      if (firstTask.timeLog && firstTask.timeLog.length > 0) {
        const firstPlayableEntry = firstTask.timeLog.find(e => e.type !== 'header');
        if (firstPlayableEntry) handleGlobalToggleTimer(firstTask.id, firstPlayableEntry.id, firstPlayableEntry, firstTask.timeLog);
      } else {
        // Otherwise, create a new entry to start the session.
        const newEntry: TimeLogEntry = { id: Date.now(), description: `Starting session: ${firstTask.text}`, duration: 0, createdAt: Date.now() };
        setTasks(prev => prev.map(t => t.id === firstTaskId ? { ...t, timeLog: [newEntry] } : t));
        setTimeout(() => {
          handleGlobalToggleTimer(firstTaskId, newEntry.id, newEntry, [newEntry]);
        }, 100);
      }
    }
  }, [settings.workSessionQueue, tasks, handleGlobalToggleTimer, setTasks]);

  const handleStartTaskFromSession = useCallback((taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Case 1: The task already has a populated time log. Start from the first entry.
    if (task.timeLog && task.timeLog.length > 0) {
      const firstPlayableEntry = task.timeLog.find(e => e.type !== 'header');
      if (firstPlayableEntry) handleGlobalToggleTimer(task.id, firstPlayableEntry.id, firstPlayableEntry, task.timeLog);
    } 
    // Case 2: The task has a checklist but no time log. Generate the log from the checklist.
    else if (task.checklist && task.checklist.length > 0) {
      const newTimeLogEntries: TimeLogEntry[] = [];
      // Normalize the checklist to handle both old (ChecklistItem[]) and new (ChecklistSection[]) formats.
      const normalizedSections: ChecklistSection[] = 'isCompleted' in task.checklist[0]
        ? [{ id: 1, title: 'Checklist', items: task.checklist as ChecklistItem[] }]
        : task.checklist as ChecklistSection[];

      // This logic is borrowed from Checklist.tsx to generate the time log
      normalizedSections.forEach(section => {
        const itemsToAdd = section.items.filter(item => !item.isCompleted);
        if (itemsToAdd.length > 0) {
          newTimeLogEntries.push({ id: section.id + Math.random(), description: section.title, duration: 0, type: 'header' });
          itemsToAdd.forEach(item => {
            newTimeLogEntries.push({ id: item.id + Math.random(), description: item.text, duration: 0, type: 'entry', isRunning: false, createdAt: Date.now() });
          });
        }
      });

      const firstPlayableEntry = newTimeLogEntries.find(e => e.type !== 'header');
      if (firstPlayableEntry) {
        // Atomically update the task with the new log and start the timer.
        handleGlobalToggleTimer(task.id, firstPlayableEntry.id, firstPlayableEntry, newTimeLogEntries);
      }
    } else {
      // Case 3: The task has no time log and no checklist. Create a default entry.
      const newEntry: TimeLogEntry = { id: Date.now(), description: `Starting session: ${task.text}`, duration: 0, createdAt: Date.now() };
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, timeLog: [newEntry] } : t));
      setTimeout(() => {
        handleGlobalToggleTimer(taskId, newEntry.id, newEntry, [newEntry]);
      }, 100);
    }
  }, [tasks, handleGlobalToggleTimer, setTasks]);

  const handleNextEntry = useCallback(() => handleNavigateLogEntry('next'), [handleNavigateLogEntry]);
  const handlePreviousEntry = useCallback(() => handleNavigateLogEntry('previous'), [handleNavigateLogEntry]);
  const handleNextChapter = useCallback(() => handleNavigateChapter('next'), [handleNavigateChapter]);
  const handlePreviousChapter = useCallback(() => handleNavigateChapter('previous'), [handleNavigateChapter]);

  const handlePostAndComplete = useCallback((taskId: number, entryId: number, onUpdate: (updatedTask: Task) => void) => {
    // Find the specific task from the current state
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
  
    const entry = task.timeLog?.find(e => e.id === entryId);
    if (!entry || !entry.checklistItemId) return;
  
    // Find the checklist item and toggle its completion status
    const updatedChecklist = (task.checklist || []).map((sectionOrItem): ChecklistItem | ChecklistSection | RichTextBlock => {
      if ('items' in sectionOrItem) { // It's a ChecklistSection
        return { ...sectionOrItem, items: sectionOrItem.items.map(item => item.id === entry.checklistItemId ? { ...item, isCompleted: !item.isCompleted } : item) };
      }
      return sectionOrItem;
    });
  
    // We only need to update the checklist. The time log itself is not changed by this action.
    const updatedTask = { ...task, checklist: updatedChecklist } as Task;
    
    // Use the passed-in onUpdate for an immediate UI refresh in the parent component
    onUpdate(updatedTask);
  }, [tasks, activeTimerTaskId, activeTimerEntry, handleClearActiveTimer]);

  const handlePostLog = useCallback((taskId: number) => {
    setTasks(prevTasks => {
      const task = prevTasks.find(t => t.id === taskId);
      if (!task || !task.timeLog || !task.timeLog.length) return prevTasks;

      let finalTimeLog = [...task.timeLog];
      const runningEntryIndex = finalTimeLog.findIndex(e => e.isRunning);

      if (runningEntryIndex !== -1) {
        const runningEntry = finalTimeLog[runningEntryIndex];
        const elapsed = Date.now() - (runningEntry.startTime || Date.now());
        finalTimeLog[runningEntryIndex] = { ...runningEntry, duration: runningEntry.duration + elapsed, isRunning: false, startTime: undefined };
      }

      const newSession: TimeLogSession = {
        id: Date.now() + Math.random(),
        title: task.timeLogTitle || 'New Log Session',
        createdAt: Date.now(),
        entries: finalTimeLog
      };

      if (activeTimerTaskId === taskId) handleClearActiveTimer();

      return prevTasks.map(t => t.id === taskId ? { ...t, timeLog: [], timeLogTitle: undefined, timeLogSessions: [...(t.timeLogSessions || []), newSession] } : t);
    });
  }, [setTasks, activeTimerTaskId, handleClearActiveTimer]);

  const handlePostAndResetLog = useCallback((taskId: number) => {
    setTasks(prevTasks => {
      const task = prevTasks.find(t => t.id === taskId);
      if (!task || !task.timeLog || !task.timeLog.length) return prevTasks;

      let finalTimeLog = [...task.timeLog];
      const runningEntryIndex = finalTimeLog.findIndex(e => e.isRunning);

      if (runningEntryIndex !== -1) {
        const runningEntry = finalTimeLog[runningEntryIndex];
        const elapsed = Date.now() - (runningEntry.startTime || Date.now());
        finalTimeLog[runningEntryIndex] = { ...runningEntry, duration: runningEntry.duration + elapsed, isRunning: false, startTime: undefined };
      }

      const newSession: TimeLogSession = {
        id: Date.now() + Math.random(),
        title: task.timeLogTitle || 'New Log Session',
        createdAt: Date.now(),
        entries: finalTimeLog,
      };

      const resetTimeLog: TimeLogEntry[] = finalTimeLog.map(entry => ({ ...entry, duration: 0, isRunning: false, startTime: undefined } as TimeLogEntry));

      if (activeTimerTaskId === taskId) handleClearActiveTimer();

      return prevTasks.map(t => t.id === taskId ? { ...t, timeLog: resetTimeLog, timeLogSessions: [...(t.timeLogSessions || []), newSession] } : t);
    });
  }, [setTasks, activeTimerTaskId, handleClearActiveTimer]);

  const handleResetAllLogEntries = useCallback((taskId: number) => {
    setTasks(prevTasks => {
      const task = prevTasks.find(t => t.id === taskId);
      if (!task || !task.timeLog) return prevTasks;

      const newTimeLog: TimeLogEntry[] = task.timeLog.map(entry => ({
        ...entry,
        duration: 0,
        isRunning: false,
        startTime: undefined
      } as TimeLogEntry));

      if (activeTimerTaskId === taskId) {
        handleClearActiveTimer();
      }

      return prevTasks.map(t => t.id === taskId ? { ...t, timeLog: newTimeLog } : t);
    });
  }, [setTasks, activeTimerTaskId, handleClearActiveTimer]);

  return {
    activeTimerTaskId, setActiveTimerTaskId,
    activeTimerEntry, setActiveTimerEntry,
    activeTimerLiveTime, setActiveTimerLiveTime,
    activeTimerTaskIdRef,
    activeTimerEntryRef,
    primedTaskId,
    handlePrimeTask,
    handlePrimeTaskWithNewLog,
    handleGlobalStopTimer,
    handleGlobalToggleTimer,
    handleGlobalResetTimer,
    handleNextTask, handlePreviousTask, handleNextEntry, handlePreviousEntry, 
    handleNextChapter, handlePreviousChapter, handleStartSession, handleStartTaskFromSession, handleClearActiveTimer, handlePostAndComplete,
    handlePostLog, handlePostAndResetLog, handleResetAllLogEntries,
  };
}