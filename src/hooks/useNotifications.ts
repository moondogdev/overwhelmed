import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Task, Settings, InboxMessage } from '../types';

interface UseNotificationsProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  settings: Settings;
  setInboxMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;  
  handleCompleteTask: (task: Task, status?: 'completed' | 'skipped') => void;
  removeTask: (id: number) => void;
  isLoading: boolean;
}

export function useNotifications({
  tasks,
  setTasks,
  settings,
  setInboxMessages,
  handleCompleteTask,
  removeTask,
  isLoading,
}: UseNotificationsProps) {
  const [timerNotifications, setTimerNotifications] = useState<Task[]>([]);
  const [overdueNotifications, setOverdueNotifications] = useState<Set<number>>(new Set());
  const overdueMessageSentRef = useRef(new Set<number>());

  const handleTaskOverdue = useCallback((taskId: number) => {
    setOverdueNotifications(prev => {
      if (prev.has(taskId)) {
        return prev;
      }
      if (!overdueMessageSentRef.current.has(taskId)) {
        const task = tasks.find(t => t.id === taskId);
        setInboxMessages(currentInbox => [{ id: Date.now() + Math.random(), type: 'overdue', text: `Task is overdue: ${task?.text || 'Unknown Task'}`, timestamp: Date.now(), taskId: taskId }, ...currentInbox]);
        overdueMessageSentRef.current.add(taskId);
      }
      return new Set(prev).add(taskId);
    });
  }, [tasks, setInboxMessages]);

  const handleTimerNotify = useCallback((task: Task) => {
    setTimerNotifications(prev => [...prev, task]);
    setTimeout(() => {
      setTimerNotifications(prev => prev.filter(n => n.id !== task.id));
    }, 8000);
  }, []);

  const handleSnooze = useCallback((taskToSnooze: Task, duration?: 'low' | 'medium' | 'high' | 'long') => {
    const snoozeDurations = { low: 1 * 60 * 1000, medium: 5 * 60 * 1000, high: 10 * 60 * 1000, long: 60 * 60 * 1000 };
    const snoozeDurationMs = snoozeDurations[duration || settings.snoozeTime];
    const snoozedUntil = Date.now() + snoozeDurationMs;
    setTasks(prevTasks => prevTasks.map(t => t.id === taskToSnooze.id ? { ...t, lastNotified: snoozedUntil, snoozeCount: (t.snoozeCount || 0) + 1, snoozedAt: Date.now() } : t));
    setOverdueNotifications(prev => { const newSet = new Set(prev); newSet.delete(taskToSnooze.id); return newSet; });
  }, [settings.snoozeTime, setTasks]);

  const handleSnoozeAll = useCallback((duration?: 'low' | 'medium' | 'high' | 'long') => {
    const now = Date.now();
    const snoozeDurations = { low: 1 * 60 * 1000, medium: 5 * 60 * 1000, high: 10 * 60 * 1000, long: 60 * 60 * 1000 };
    const snoozeDurationMs = snoozeDurations[duration || settings.snoozeTime];
    const snoozedUntil = now + snoozeDurationMs;
    const overdueIds = Array.from(overdueNotifications);
    setTasks(prevTasks => prevTasks.map(t =>
      overdueIds.includes(t.id) ? { ...t, lastNotified: snoozedUntil, snoozeCount: (t.snoozeCount || 0) + 1, snoozedAt: now } : t
    ));
    setOverdueNotifications(new Set());
  }, [overdueNotifications, settings.snoozeTime, setTasks]);

  const handleUnSnooze = useCallback((taskId: number) => {
    setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId 
            ? { ...t, lastNotified: 0 } // Reset lastNotified to trigger overdue on next tick
            : t
    ));
  }, [setTasks]);

  const handleUnSnoozeAll = useCallback(() => {
    const now = Date.now();
    setTasks(prevTasks => prevTasks.map(t => {
      // Find tasks that are currently snoozed (lastNotified is in the future)
      if (t.lastNotified && t.lastNotified > now) {
        return { ...t, lastNotified: 0 }; // Reset their snooze timer
      }
      return t;
    }));
  }, [setTasks]);

  const handleSilenceTask = useCallback((taskId: number) => {
    setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId ? { ...t, isSilenced: true } : t
    ));
    setOverdueNotifications(prev => { const newSet = new Set(prev); newSet.delete(taskId); return newSet; });
  }, [setTasks]);

  const handleUnsilenceTask = useCallback((taskId: number) => {
    setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId ? { ...t, isSilenced: false } : t
    ));
    // The main notification interval will pick it up as overdue on the next tick.
  }, [setTasks]);

  const handleCompleteAllOverdue = useCallback(() => {
    const overdueIds = Array.from(overdueNotifications);
    overdueIds.forEach(id => {
      const taskToComplete = tasks.find(t => t.id === id);
      if (taskToComplete) handleCompleteTask(taskToComplete);
    });
  }, [overdueNotifications, tasks, handleCompleteTask]);

  const handleSkipAllOverdue = useCallback(() => {
    const overdueIds = Array.from(overdueNotifications);
    overdueIds.forEach(id => {
      const taskToSkip = tasks.find(t => t.id === id);
      if (taskToSkip) handleCompleteTask(taskToSkip, 'skipped');
    });
  }, [overdueNotifications, tasks, handleCompleteTask]);

  const handleDismissAllOverdue = useCallback(() => {
    const overdueIds = Array.from(overdueNotifications);
    setTasks(prevTasks => prevTasks.map(t => 
        overdueIds.includes(t.id) ? { ...t, isSilenced: true } : t
    ));
    setOverdueNotifications(new Set());
  }, [overdueNotifications, setTasks]);

  const handleDeleteAllOverdue = useCallback(() => {
    const overdueIds = Array.from(overdueNotifications);
    overdueIds.forEach(id => {
      const taskToDelete = tasks.find(t => t.id === id);
      if (taskToDelete) removeTask(taskToDelete.id);
    });
  }, [overdueNotifications, tasks, removeTask]);

  useEffect(() => {
    // Do not run any timer logic until the initial data load is complete.
    if (isLoading) return;

    const notificationInterval = setInterval(() => {
      const now = Date.now();
      const newlyOverdueIds = new Set<number>();
      const approachingTasks: Task[] = [];

      // First, collect all events for this tick
      for (const task of tasks) {
        if (!task.completeBy) continue;

        const ms = task.completeBy - now;
        if (ms < 0) { // Task is overdue
          const snoozedUntil = task.lastNotified || 0;
          if (now > snoozedUntil) {
            if (!task.isSilenced) newlyOverdueIds.add(task.id);
          }
        } else { // Task is not yet due, check for approaching deadline
          if (settings.timerNotificationLevel === 'silent') continue;

          const minutesLeft = Math.floor(ms / 60000);
          const lastNotifiedMinutes = task.lastNotified ? Math.floor((task.completeBy - task.lastNotified) / 60000) : Infinity;

          let shouldNotify = false;
          if (settings.timerNotificationLevel === 'high' && minutesLeft > 0 && (minutesLeft % 60 === 0 || (minutesLeft <= 60 && minutesLeft % 15 === 0)) && lastNotifiedMinutes > minutesLeft) {
            shouldNotify = true;
          } else if (settings.timerNotificationLevel === 'medium' && minutesLeft > 0 && minutesLeft <= 60 && minutesLeft % 15 === 0 && lastNotifiedMinutes > minutesLeft) {
            shouldNotify = true;
          } else if (settings.timerNotificationLevel === 'low' && minutesLeft > 0 && minutesLeft <= 15 && lastNotifiedMinutes > 15) {
            shouldNotify = true;
          }

          if (shouldNotify) {
            approachingTasks.push(task);
          }
        }
      }

      // Now, process the collected events in single state updates
      if (newlyOverdueIds.size > 0) {
        newlyOverdueIds.forEach(id => handleTaskOverdue(id));
      }
      if (approachingTasks.length > 0) {
        approachingTasks.forEach(task => handleTimerNotify(task));
        setTasks(prev => prev.map(t => approachingTasks.find(at => at.id === t.id) ? { ...t, lastNotified: now } : t));
      }
    }, 1000); // Check every second
    return () => clearInterval(notificationInterval);
  }, [isLoading, tasks, settings, handleTaskOverdue, handleTimerNotify, setTasks]);

  return {
    timerNotifications, overdueNotifications, handleTaskOverdue, handleTimerNotify,
    handleSnooze, handleSnoozeAll, handleUnSnooze, handleUnSnoozeAll, handleSilenceTask, handleUnsilenceTask, 
    handleCompleteAllOverdue, handleSkipAllOverdue, handleDismissAllOverdue, handleDeleteAllOverdue,
  };
}