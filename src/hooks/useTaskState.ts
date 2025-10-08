import { useState, useCallback, useRef, useEffect } from 'react';
import { Task, Settings, InboxMessage, TimeLogSession, TimeLogEntry, ChecklistSection, RichTextBlock, ChecklistItem } from '../types';
import { useCoreTaskState } from './useCoreTaskState';
import { useBulkTaskActions } from './useBulkTaskActions';
import { useTaskManagement } from './useTaskManagement';

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
  const { tasks, setTasks, completedTasks, setCompletedTasks, getNextId, handleSyncIds } = useCoreTaskState({
    initialTasks,
    initialCompletedTasks,
    showToast,
  });

  const bulkTaskActions = useBulkTaskActions({
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
  });

  const tasksRefForDebounce = useRef(tasks);
  tasksRefForDebounce.current = tasks;

  const taskManagement = useTaskManagement({
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
  });

  // New refs to hold the latest state for background processes like auto-save
  const tasksRef = useRef(tasks);
  const completedTasksRef = useRef(completedTasks);

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
    ...taskManagement,
    ...bulkTaskActions,
    handleSyncIds,
    tasksRef, // Expose the ref
    completedTasksRef, // Expose the ref
  };
}