import { useEffect, useCallback, useRef } from 'react';
import { Task, Settings, InboxMessage, TimeLogEntry } from '../types';
import { defaultSettings } from '../config';

const AUTO_SAVE_INTERVAL_SECONDS = 300;

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

export function useDataPersistence({
  isLoading, setIsLoading, isDirty, setIsDirty,
  tasks, setTasks, completedTasks, setCompletedTasks, settingsRef,
  tasksRef, completedTasksRef, settings, setSettings, inboxMessages, setInboxMessages,
  archivedMessages, setArchivedMessages, trashedMessages, setTrashedMessages, activeTimerTaskIdRef, activeTimerEntryRef, handleGlobalToggleTimer,
  inboxMessagesRef, archivedMessagesRef, trashedMessagesRef, setLastSaveTime,
  setAutoSaveCountdown, showToast, activeTimerTaskId, activeTimerEntry,
  setActiveTimerTaskId, setActiveTimerEntry, setActiveTimerLiveTime
}: UseDataPersistenceProps) {
  const lastSavedState = useRef<SavedState | null>(null);

  // Effect to load all data from the store on initial startup
  useEffect(() => {
    const loadDataFromStore = async () => {
      try {
        // Smart Loading: Try the new key first, then fall back to the old key.
        let savedTasks = await window.electronAPI.getStoreValue('overwhelmed-tasks');
        if (!savedTasks) savedTasks = await window.electronAPI.getStoreValue('overwhelmed-words');

        let savedCompletedTasks = await window.electronAPI.getStoreValue('overwhelmed-completed-tasks');
        if (!savedCompletedTasks) savedCompletedTasks = await window.electronAPI.getStoreValue('overwhelmed-completed-words');

        const savedSettings = await window.electronAPI.getStoreValue('overwhelmed-settings');
        const savedInboxMessages = await window.electronAPI.getStoreValue('overwhelmed-inbox-messages');
        const savedArchivedMessages = await window.electronAPI.getStoreValue('overwhelmed-archived-messages');
        const savedTrashedMessages = await window.electronAPI.getStoreValue('overwhelmed-trashed-messages');
        const savedActiveTimerTaskId = await window.electronAPI.getStoreValue('active-timer-taskId');
        const savedActiveTimerEntry = await window.electronAPI.getStoreValue('active-timer-entry');

        if (savedTasks) {
          const tasksWithDefaults = savedTasks.map((t: Task) => ({ ...t, lastNotified: t.lastNotified || undefined }));
          setTasks(tasksWithDefaults);
        }
        if (savedCompletedTasks) setCompletedTasks(savedCompletedTasks);
        if (savedSettings) setSettings(prev => ({ ...prev, ...savedSettings }));
        if (savedInboxMessages) setInboxMessages(savedInboxMessages);
        if (savedArchivedMessages) setArchivedMessages(savedArchivedMessages);
        if (savedTrashedMessages) setTrashedMessages(savedTrashedMessages);
        if (savedActiveTimerTaskId) setActiveTimerTaskId(savedActiveTimerTaskId);
        if (savedActiveTimerEntry) {
          // Ensure loaded timer is not running to avoid large time gaps
          // If the timer was running when the app closed, we need to properly resume it.
          if (savedActiveTimerEntry.isRunning && savedActiveTimerEntry.startTime) {
            // Use the main toggle handler to correctly calculate elapsed time and restart the interval.
            // We pass the saved entry directly to ensure the correct state is used.
            handleGlobalToggleTimer(savedActiveTimerTaskId, savedActiveTimerEntry.id, savedActiveTimerEntry);
          } else {
            setActiveTimerEntry({ ...savedActiveTimerEntry, isRunning: false, startTime: undefined });
            setActiveTimerLiveTime(savedActiveTimerEntry.duration);
          }
        }

        // After loading, capture the initial state as the "last saved" state.
        lastSavedState.current = {
          tasks: savedTasks || [],
          completedTasks: savedCompletedTasks || [],
          settings: savedSettings || defaultSettings,
          inboxMessages: savedInboxMessages || [],
          archivedMessages: savedArchivedMessages || [],
          trashedMessages: savedTrashedMessages || [],
        };

        setIsLoading(false);
        window.electronAPI.send('renderer-ready-for-startup-backup', { tasks: savedTasks, completedTasks: savedCompletedTasks, settings: savedSettings, inboxMessages: savedInboxMessages, archivedMessages: savedArchivedMessages, trashedMessages: savedTrashedMessages });
      } catch (error) {
        console.error("Failed to load data from electron-store", error);
        setIsLoading(false);
      }
    };
    loadDataFromStore();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to manage the "dirty" state (unsaved changes) by comparing current state to last saved state
  useEffect(() => {
    if (isLoading || !lastSavedState.current) return;

    const currentState = { tasks, completedTasks, settings, inboxMessages, archivedMessages, trashedMessages };
    const hasChanges = JSON.stringify(currentState) !== JSON.stringify(lastSavedState.current);
    setIsDirty(hasChanges);
  }, [tasks, completedTasks, settings, inboxMessages, archivedMessages, trashedMessages, isLoading]);

  useEffect(() => {
    window.electronAPI.notifyDirtyState(isDirty);
  }, [isDirty]);

  // Handler for manual project saving
  const handleSaveProject = useCallback(async () => {
    if (isLoading) return;

    let tasksToSave = [...tasksRef.current];
    let entryToSave = activeTimerEntryRef.current;

    // If a timer is running, calculate its final duration before saving.
    if (entryToSave && entryToSave.isRunning && entryToSave.startTime) {
      const now = Date.now();
      const elapsed = now - entryToSave.startTime;
      const finalDuration = entryToSave.duration + elapsed;

      // To preserve the running state across restarts, we save the calculated
      // duration and keep the isRunning flag true. The startTime is updated
      // to the moment of saving, so on load, we calculate the time elapsed since quit.
      entryToSave = { ...entryToSave, duration: finalDuration, isRunning: true, startTime: now };

      // Update the tasks array with this final entry state.
      tasksToSave = tasksToSave.map(t => 
        t.id === activeTimerTaskIdRef.current 
          ? { ...t, timeLog: (t.timeLog || []).map(e => e.id === entryToSave.id ? entryToSave : e) } 
          : t
      );
    }

    await window.electronAPI.setStoreValue('overwhelmed-tasks', tasksToSave);
    await window.electronAPI.setStoreValue('overwhelmed-completed-tasks', completedTasksRef.current);
    await window.electronAPI.setStoreValue('overwhelmed-settings', settingsRef.current);
    await window.electronAPI.setStoreValue('overwhelmed-inbox-messages', inboxMessagesRef.current);
    await window.electronAPI.setStoreValue('overwhelmed-archived-messages', archivedMessagesRef.current);
    await window.electronAPI.setStoreValue('overwhelmed-trashed-messages', trashedMessagesRef.current);
    await window.electronAPI.setStoreValue('active-timer-taskId', activeTimerTaskIdRef.current);
    await window.electronAPI.setStoreValue('active-timer-entry', entryToSave);

    // After a successful save, update the last saved state reference.
    lastSavedState.current = {
      tasks: tasksToSave,
      completedTasks: completedTasksRef.current,
      settings: settingsRef.current,
      inboxMessages: inboxMessagesRef.current,
      archivedMessages: archivedMessagesRef.current,
      trashedMessages: trashedMessagesRef.current,
    };
    setIsDirty(false);
    setLastSaveTime(Date.now());
    setAutoSaveCountdown(AUTO_SAVE_INTERVAL_SECONDS);
    showToast('Project saved!');
  }, [isLoading, tasksRef, completedTasksRef, settingsRef, inboxMessagesRef, archivedMessagesRef, trashedMessagesRef, setIsDirty, setLastSaveTime, setAutoSaveCountdown, showToast, activeTimerTaskIdRef, activeTimerEntryRef]);

  // Effect for the auto-save timer
  useEffect(() => {
    // If there are no unsaved changes, reset the countdown and do nothing.
    if (!isDirty) {
      setAutoSaveCountdown(AUTO_SAVE_INTERVAL_SECONDS);
      return;
    }

    // If there are unsaved changes, start the countdown.
    const countdownInterval = setInterval(() => {
      setAutoSaveCountdown(prevCountdown => {
        if (prevCountdown <= 1) {
          // When the countdown hits zero, trigger a manual save.
          // handleSaveProject will automatically handle the "isDirty" flag and reset the timer.
          handleSaveProject();
          return AUTO_SAVE_INTERVAL_SECONDS;
        }
        return prevCountdown - 1;
      });
    }, 1000);

    // Cleanup function to clear the interval if the component unmounts or if isDirty becomes false.
    return () => clearInterval(countdownInterval);
  }, [isDirty, handleSaveProject, setAutoSaveCountdown]);

  const handleExport = useCallback(() => {
    const projectData = {
      tasks,
      settings,
    };
    const jsonString = JSON.stringify(projectData, null, 2); // Pretty print the JSON
    window.electronAPI.exportProject(jsonString);
  }, [tasks, settings]);

  const handleImport = useCallback(async () => {
    const jsonString = await window.electronAPI.importProject();
    if (jsonString) {
      try {
        const projectData = JSON.parse(jsonString);
        setTasks(projectData.tasks || []);
        setSettings(prev => ({ ...defaultSettings, ...projectData.settings }));
      } catch (error) {
        console.error("Failed to parse imported project file:", error);
      }
    }
  }, [setTasks, setSettings]);

  return { 
    handleSaveProject, 
    handleExport, 
    handleImport 
  };
}