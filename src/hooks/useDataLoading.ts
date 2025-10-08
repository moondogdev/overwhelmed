import { useEffect } from 'react';
import { Task, Settings, InboxMessage, TimeLogEntry } from '../types';
import { defaultSettings } from '../config';

interface UseDataLoadingProps {
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setCompletedTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  setInboxMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
  setArchivedMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
  setTrashedMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
  setActiveTimerTaskId: React.Dispatch<React.SetStateAction<number | null>>;
  setActiveTimerEntry: React.Dispatch<React.SetStateAction<TimeLogEntry | null>>;
  setActiveTimerLiveTime: React.Dispatch<React.SetStateAction<number>>;
  handleGlobalToggleTimer: (taskId: number, entryId: number, entry?: TimeLogEntry, newTimeLog?: TimeLogEntry[]) => void;
  setLastSavedState: (state: any) => void;
}

export function useDataLoading({
  setIsLoading,
  setTasks,
  setCompletedTasks,
  setSettings,
  setInboxMessages,
  setArchivedMessages,
  setTrashedMessages,
  setActiveTimerTaskId,
  setActiveTimerEntry,
  setActiveTimerLiveTime,
  handleGlobalToggleTimer,
  setLastSavedState,
}: UseDataLoadingProps) {
  useEffect(() => {
    const loadDataFromStore = async () => {
      try {
        let savedTasks = await window.electronAPI.getStoreValue('overwhelmed-tasks') || await window.electronAPI.getStoreValue('overwhelmed-words');
        let savedCompletedTasks = await window.electronAPI.getStoreValue('overwhelmed-completed-tasks') || await window.electronAPI.getStoreValue('overwhelmed-completed-words');
        const savedSettings = await window.electronAPI.getStoreValue('overwhelmed-settings');
        const savedInboxMessages = await window.electronAPI.getStoreValue('overwhelmed-inbox-messages');
        const savedArchivedMessages = await window.electronAPI.getStoreValue('overwhelmed-archived-messages');
        const savedTrashedMessages = await window.electronAPI.getStoreValue('overwhelmed-trashed-messages');
        const savedActiveTimerTaskId = await window.electronAPI.getStoreValue('active-timer-taskId');
        const savedActiveTimerEntry = await window.electronAPI.getStoreValue('active-timer-entry');

        if (savedTasks) setTasks(savedTasks.map((t: Task) => ({ ...t, lastNotified: t.lastNotified || undefined })));
        if (savedCompletedTasks) setCompletedTasks(savedCompletedTasks);
        if (savedSettings) setSettings(prev => ({ ...prev, ...savedSettings }));
        if (savedInboxMessages) setInboxMessages(savedInboxMessages);
        if (savedArchivedMessages) setArchivedMessages(savedArchivedMessages);
        if (savedTrashedMessages) setTrashedMessages(savedTrashedMessages);
        if (savedActiveTimerTaskId) setActiveTimerTaskId(savedActiveTimerTaskId);

        if (savedActiveTimerEntry) {
          if (savedActiveTimerEntry.isRunning && savedActiveTimerEntry.startTime) {
            handleGlobalToggleTimer(savedActiveTimerTaskId, savedActiveTimerEntry.id, savedActiveTimerEntry);
          } else {
            setActiveTimerEntry({ ...savedActiveTimerEntry, isRunning: false, startTime: undefined });
            setActiveTimerLiveTime(savedActiveTimerEntry.duration);
          }
        }

        const loadedState = {
          tasks: savedTasks || [], completedTasks: savedCompletedTasks || [], settings: savedSettings || defaultSettings,
          inboxMessages: savedInboxMessages || [], archivedMessages: savedArchivedMessages || [], trashedMessages: savedTrashedMessages || [],
        };
        setLastSavedState(loadedState);

        window.electronAPI.send('renderer-ready-for-startup-backup', loadedState);
      } catch (error) {
        console.error("Failed to load data from electron-store", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDataFromStore();
  }, []); // This effect runs only once on mount.
}