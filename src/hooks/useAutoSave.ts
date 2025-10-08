import { useEffect } from 'react';
import { Task, Settings, InboxMessage } from '../types';

const AUTO_SAVE_INTERVAL_SECONDS = 300;

interface UseAutoSaveProps {
  isLoading: boolean;
  isDirty: boolean;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  tasks: Task[];
  completedTasks: Task[];
  settings: Settings;
  inboxMessages: InboxMessage[];
  archivedMessages: InboxMessage[];
  trashedMessages: InboxMessage[];
  lastSavedState: any;
  handleSaveProject: () => Promise<void>;
  setAutoSaveCountdown: React.Dispatch<React.SetStateAction<number>>;
}

export function useAutoSave({
  isLoading, isDirty, setIsDirty, tasks, completedTasks, settings,
  inboxMessages, archivedMessages, trashedMessages, lastSavedState,
  handleSaveProject, setAutoSaveCountdown
}: UseAutoSaveProps) {

  useEffect(() => {
    if (isLoading || !lastSavedState) return;
    const currentState = { tasks, completedTasks, settings, inboxMessages, archivedMessages, trashedMessages };
    const hasChanges = JSON.stringify(currentState) !== JSON.stringify(lastSavedState);
    setIsDirty(hasChanges);
  }, [tasks, completedTasks, settings, inboxMessages, archivedMessages, trashedMessages, isLoading, lastSavedState, setIsDirty]);

  useEffect(() => {
    window.electronAPI.notifyDirtyState(isDirty);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) {
      setAutoSaveCountdown(AUTO_SAVE_INTERVAL_SECONDS);
      return;
    }
    const countdownInterval = setInterval(() => {
      setAutoSaveCountdown(prevCountdown => {
        if (prevCountdown <= 1) { handleSaveProject(); return AUTO_SAVE_INTERVAL_SECONDS; }
        return prevCountdown - 1;
      });
    }, 1000);
    return () => clearInterval(countdownInterval);
  }, [isDirty, handleSaveProject, setAutoSaveCountdown]);
}