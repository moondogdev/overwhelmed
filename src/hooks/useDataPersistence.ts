import { useEffect, useCallback, useRef } from 'react';
import { Word, Settings, InboxMessage, TimeLogEntry } from '../types';
import { defaultSettings } from '../config';

const AUTO_SAVE_INTERVAL_SECONDS = 300;

interface UseDataPersistenceProps {
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isDirty: boolean;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  words: Word[];
  setWords: React.Dispatch<React.SetStateAction<Word[]>>;
  completedWords: Word[];
  setCompletedWords: React.Dispatch<React.SetStateAction<Word[]>>;
  wordsRef: React.RefObject<Word[]>;
  completedWordsRef: React.RefObject<Word[]>;
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
  activeTimerWordId: number | null;
  activeTimerWordIdRef: React.RefObject<number | null>;
  activeTimerEntry: TimeLogEntry | null;
  activeTimerEntryRef: React.RefObject<TimeLogEntry | null>;
  handleGlobalToggleTimer: (wordId: number, entryId: number, entry?: TimeLogEntry, newTimeLog?: TimeLogEntry[]) => void;
  setActiveTimerWordId: React.Dispatch<React.SetStateAction<number | null>>;
  setActiveTimerEntry: React.Dispatch<React.SetStateAction<TimeLogEntry | null>>;
  setActiveTimerLiveTime: React.Dispatch<React.SetStateAction<number>>;
}

export function useDataPersistence({
  isLoading, setIsLoading, isDirty, setIsDirty,
  words, setWords, completedWords, setCompletedWords, settingsRef,
  wordsRef, completedWordsRef, settings, setSettings, inboxMessages, setInboxMessages,
  archivedMessages, setArchivedMessages, trashedMessages, setTrashedMessages, activeTimerWordIdRef, activeTimerEntryRef, handleGlobalToggleTimer,
  inboxMessagesRef, archivedMessagesRef, trashedMessagesRef, setLastSaveTime,
  setAutoSaveCountdown, showToast, activeTimerWordId, activeTimerEntry,
  setActiveTimerWordId, setActiveTimerEntry, setActiveTimerLiveTime
}: UseDataPersistenceProps) {

  // Effect to load all data from the store on initial startup
  useEffect(() => {
    const loadDataFromStore = async () => {
      try {
        const savedWords = await window.electronAPI.getStoreValue('overwhelmed-words');
        const savedCompletedWords = await window.electronAPI.getStoreValue('overwhelmed-completed-words');
        const savedSettings = await window.electronAPI.getStoreValue('overwhelmed-settings');
        const savedInboxMessages = await window.electronAPI.getStoreValue('overwhelmed-inbox-messages');
        const savedArchivedMessages = await window.electronAPI.getStoreValue('overwhelmed-archived-messages');
        const savedTrashedMessages = await window.electronAPI.getStoreValue('overwhelmed-trashed-messages');
        const savedActiveTimerWordId = await window.electronAPI.getStoreValue('active-timer-word-id');
        const savedActiveTimerEntry = await window.electronAPI.getStoreValue('active-timer-entry');

        if (savedWords) {
          const wordsWithDefaults = savedWords.map((w: Word) => ({ ...w, lastNotified: w.lastNotified || undefined }));
          setWords(wordsWithDefaults);
        }
        if (savedCompletedWords) setCompletedWords(savedCompletedWords);
        if (savedSettings) setSettings(prev => ({ ...prev, ...savedSettings }));
        if (savedInboxMessages) setInboxMessages(savedInboxMessages);
        if (savedArchivedMessages) setArchivedMessages(savedArchivedMessages);
        if (savedTrashedMessages) setTrashedMessages(savedTrashedMessages);
        if (savedActiveTimerWordId) setActiveTimerWordId(savedActiveTimerWordId);
        if (savedActiveTimerEntry) {
          // Ensure loaded timer is not running to avoid large time gaps
          // If the timer was running when the app closed, we need to properly resume it.
          if (savedActiveTimerEntry.isRunning && savedActiveTimerEntry.startTime) {
            // Use the main toggle handler to correctly calculate elapsed time and restart the interval.
            // We pass the saved entry directly to ensure the correct state is used.
            handleGlobalToggleTimer(savedActiveTimerWordId, savedActiveTimerEntry.id, savedActiveTimerEntry);
          } else {
            setActiveTimerEntry({ ...savedActiveTimerEntry, isRunning: false, startTime: undefined });
            setActiveTimerLiveTime(savedActiveTimerEntry.duration);
          }
        }

        setIsLoading(false);
        window.electronAPI.send('renderer-ready-for-startup-backup', { words: savedWords, completedWords: savedCompletedWords, settings: savedSettings, inboxMessages: savedInboxMessages, archivedMessages: savedArchivedMessages, trashedMessages: savedTrashedMessages });
      } catch (error) {
        console.error("Failed to load data from electron-store", error);
        setIsLoading(false);
      }
    };
    loadDataFromStore();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to manage the "dirty" state (unsaved changes)
  useEffect(() => {
    // This is the critical fix. By depending on the `.current` value of the ref,
    // this effect will correctly re-evaluate whenever the settings object changes,
    // even though the `settings` variable in this hook's closure is stale.
    // This ensures that changes to templates, categories, etc., properly mark the
    // application as "dirty" and trigger a save.
    if (!isLoading) setIsDirty(true);
  }, [words, completedWords, inboxMessages, archivedMessages, trashedMessages, settings, isLoading, setIsDirty, activeTimerWordId, activeTimerEntry]);

  useEffect(() => {
    window.electronAPI.notifyDirtyState(isDirty);
  }, [isDirty]);

  // Handler for manual project saving
  const handleSaveProject = useCallback(async () => {
    if (isLoading) return;

    let wordsToSave = [...wordsRef.current];
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

      // Update the words array with this final entry state.
      wordsToSave = wordsToSave.map(w => 
        w.id === activeTimerWordIdRef.current 
          ? { ...w, timeLog: (w.timeLog || []).map(e => e.id === entryToSave.id ? entryToSave : e) } 
          : w
      );
    }

    await window.electronAPI.setStoreValue('overwhelmed-words', wordsToSave);
    await window.electronAPI.setStoreValue('overwhelmed-completed-words', completedWordsRef.current);
    await window.electronAPI.setStoreValue('overwhelmed-settings', settingsRef.current);
    await window.electronAPI.setStoreValue('overwhelmed-inbox-messages', inboxMessagesRef.current);
    await window.electronAPI.setStoreValue('overwhelmed-archived-messages', archivedMessagesRef.current);
    await window.electronAPI.setStoreValue('overwhelmed-trashed-messages', trashedMessagesRef.current);
    await window.electronAPI.setStoreValue('active-timer-word-id', activeTimerWordIdRef.current);
    await window.electronAPI.setStoreValue('active-timer-entry', entryToSave);
    setIsDirty(false);
    setLastSaveTime(Date.now());
    setAutoSaveCountdown(AUTO_SAVE_INTERVAL_SECONDS);
    showToast('Project saved!');
  }, [isLoading, wordsRef, completedWordsRef, settingsRef, inboxMessagesRef, archivedMessagesRef, trashedMessagesRef, setIsDirty, setLastSaveTime, setAutoSaveCountdown, showToast, activeTimerWordIdRef, activeTimerEntryRef]);

  // Effect for the auto-save timer
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setAutoSaveCountdown(prevCountdown => {
        if (prevCountdown <= 1) {
          if (isDirty) {
            let wordsToSave = [...wordsRef.current];
            let entryToSave = activeTimerEntryRef.current;
            // Same logic as manual save: finalize running timer before saving.
            if (entryToSave && entryToSave.isRunning && entryToSave.startTime) {
              const now = Date.now();
              const elapsed = now - entryToSave.startTime;
              const finalDuration = entryToSave.duration + elapsed;
              // Same logic as manual save: preserve the running state for restart.
              entryToSave = { ...entryToSave, duration: finalDuration, isRunning: true, startTime: now };
              wordsToSave = wordsToSave.map(w => 
                w.id === activeTimerWordIdRef.current 
                  ? { ...w, timeLog: (w.timeLog || []).map(e => e.id === entryToSave.id ? entryToSave : e) } 
                  : w
              );
            }

            window.electronAPI.send('auto-save-data', { 
              words: wordsToSave, 
              completedWords: completedWordsRef.current, 
              settings: settingsRef.current, 
              inboxMessages: inboxMessagesRef.current, 
              archivedMessages: archivedMessagesRef.current, 
              trashedMessages: trashedMessagesRef.current, 
              activeTimerWordId: activeTimerWordIdRef.current, 
              activeTimerEntry: entryToSave
            });
            setIsDirty(false);
            setLastSaveTime(Date.now());
          }
          return AUTO_SAVE_INTERVAL_SECONDS;
        }
        return prevCountdown - 1;
      });
    }, 1000);
    return () => clearInterval(countdownInterval);
  }, [isDirty, settingsRef, wordsRef, completedWordsRef, inboxMessagesRef, archivedMessagesRef, trashedMessagesRef, setIsDirty, setLastSaveTime, setAutoSaveCountdown, activeTimerWordIdRef, activeTimerEntryRef]);

  const handleExport = useCallback(() => {
    const projectData = {
      words,
      settings,
    };
    const jsonString = JSON.stringify(projectData, null, 2); // Pretty print the JSON
    window.electronAPI.exportProject(jsonString);
  }, [words, settings]);

  const handleImport = useCallback(async () => {
    const jsonString = await window.electronAPI.importProject();
    if (jsonString) {
      try {
        const projectData = JSON.parse(jsonString);
        setWords(projectData.words || []);
        setSettings(prev => ({ ...defaultSettings, ...projectData.settings }));
      } catch (error) {
        console.error("Failed to parse imported project file:", error);
      }
    }
  }, [setWords, setSettings]);

  return { 
    handleSaveProject, 
    handleExport, 
    handleImport 
  };
}