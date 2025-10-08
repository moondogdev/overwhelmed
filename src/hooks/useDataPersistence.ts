import { useState } from 'react';
import { Task, Settings, InboxMessage, TimeLogEntry } from '../types';
import { useDataLoading } from './useDataLoading';
import { useAutoSave } from './useAutoSave';
import { useDataActions } from './useDataActions';

interface UseDataPersistenceProps {
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isDirty: boolean;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  completedTasks: Task[];
  setCompletedTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  tasksRef: React.RefObject<Task[]>;
  completedTasksRef: React.RefObject<Task[]>;
  settings: Settings;
  settingsRef: React.RefObject<Settings>;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  inboxMessages: InboxMessage[];
  setInboxMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
  archivedMessages: InboxMessage[];
  setArchivedMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
  trashedMessages: InboxMessage[];
  setTrashedMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
  inboxMessagesRef: React.RefObject<InboxMessage[]>;
  archivedMessagesRef: React.RefObject<InboxMessage[]>;
  trashedMessagesRef: React.RefObject<InboxMessage[]>;
  setLastSaveTime: React.Dispatch<React.SetStateAction<number | null>>;
  setAutoSaveCountdown: React.Dispatch<React.SetStateAction<number>>;
  showToast: (message: string, duration?: number) => void;
  activeTimerTaskId: number | null;
  activeTimerTaskIdRef: React.RefObject<number | null>;
  activeTimerEntry: TimeLogEntry | null;
  activeTimerEntryRef: React.RefObject<TimeLogEntry | null>;
  handleGlobalToggleTimer: (taskId: number, entryId: number, entry?: TimeLogEntry, newTimeLog?: TimeLogEntry[]) => void;
  setActiveTimerTaskId: React.Dispatch<React.SetStateAction<number | null>>;
  setActiveTimerEntry: React.Dispatch<React.SetStateAction<TimeLogEntry | null>>;
  setActiveTimerLiveTime: React.Dispatch<React.SetStateAction<number>>;
}

type SavedState = {
  tasks: Task[];
  completedTasks: Task[];
  settings: Settings;
  inboxMessages: InboxMessage[];
  archivedMessages: InboxMessage[];
  trashedMessages: InboxMessage[];
};

export function useDataPersistence(props: UseDataPersistenceProps) {
  const [lastSavedState, setLastSavedState] = useState<SavedState | null>(null);

  useDataLoading({
    ...props,
    setLastSavedState,
  });

  const dataActions = useDataActions({
    ...props,
    setLastSavedState,
  });

  useAutoSave({
    ...props,
    lastSavedState,
    handleSaveProject: dataActions.handleSaveProject,
  });

  return {
    ...dataActions,
  };
}