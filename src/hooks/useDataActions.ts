import { useCallback } from 'react';
import { Task, Settings, InboxMessage, TimeLogEntry } from '../types';
import { defaultSettings } from '../config';

const AUTO_SAVE_INTERVAL_SECONDS = 300;

interface UseDataActionsProps {
  isLoading: boolean;
  tasksRef: React.RefObject<Task[]>;
  completedTasksRef: React.RefObject<Task[]>;
  settingsRef: React.RefObject<Settings>;
  inboxMessagesRef: React.RefObject<InboxMessage[]>;
  archivedMessagesRef: React.RefObject<InboxMessage[]>;
  trashedMessagesRef: React.RefObject<InboxMessage[]>;
  activeTimerTaskIdRef: React.RefObject<number | null>;
  activeTimerEntryRef: React.RefObject<TimeLogEntry | null>;
  setLastSavedState: (state: any) => void;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  setLastSaveTime: React.Dispatch<React.SetStateAction<number | null>>;
  setAutoSaveCountdown: React.Dispatch<React.SetStateAction<number>>;
  showToast: (message: string, duration?: number) => void;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

export function useDataActions({
  isLoading, tasksRef, completedTasksRef, settingsRef, inboxMessagesRef,
  archivedMessagesRef, trashedMessagesRef, activeTimerTaskIdRef, activeTimerEntryRef,
  setLastSavedState, setIsDirty, setLastSaveTime, setAutoSaveCountdown, showToast,
  setTasks, setSettings
}: UseDataActionsProps) {

  const handleSaveProject = useCallback(async () => {
    if (isLoading) return;

    let tasksToSave = [...(tasksRef.current || [])];
    let entryToSave = activeTimerEntryRef.current;

    if (entryToSave && entryToSave.isRunning && entryToSave.startTime) {
      const now = Date.now();
      const elapsed = now - entryToSave.startTime;
      const finalDuration = entryToSave.duration + elapsed;
      entryToSave = { ...entryToSave, duration: finalDuration, isRunning: true, startTime: now };
      tasksToSave = tasksToSave.map(t =>
        t.id === activeTimerTaskIdRef.current
          ? { ...t, timeLog: (t.timeLog || []).map(e => e.id === entryToSave!.id ? entryToSave! : e) }
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

    const newSavedState = {
      tasks: tasksToSave, completedTasks: completedTasksRef.current, settings: settingsRef.current,
      inboxMessages: inboxMessagesRef.current, archivedMessages: archivedMessagesRef.current, trashedMessages: trashedMessagesRef.current,
    };
    setLastSavedState(newSavedState);

    setIsDirty(false);
    setLastSaveTime(Date.now());
    setAutoSaveCountdown(AUTO_SAVE_INTERVAL_SECONDS);
    showToast('Project saved!');
  }, [isLoading, tasksRef, completedTasksRef, settingsRef, inboxMessagesRef, archivedMessagesRef, trashedMessagesRef, activeTimerTaskIdRef, activeTimerEntryRef, setLastSavedState, setIsDirty, setLastSaveTime, setAutoSaveCountdown, showToast]);

  const handleExport = useCallback(() => {
    const projectData = { tasks: tasksRef.current, settings: settingsRef.current };
    const jsonString = JSON.stringify(projectData, null, 2);
    window.electronAPI.exportProject(jsonString);
  }, [tasksRef, settingsRef]);

  const handleImport = useCallback(async () => {
    const jsonString = await window.electronAPI.importProject();
    if (jsonString) {
      try {
        const projectData = JSON.parse(jsonString);
        setTasks(projectData.tasks || []);
        setSettings(prev => ({ ...defaultSettings, ...prev, ...projectData.settings }));
      } catch (error) { console.error("Failed to parse imported project file:", error); }
    }
  }, [setTasks, setSettings]);

  const createManualBackup = useCallback(async (backupName: string) => {
    return await window.electronAPI.createManualBackup(backupName);
  }, []);

  return { handleSaveProject, handleExport, handleImport, createManualBackup };
}