import { useEffect, useCallback } from 'react';
import { Word, Settings, InboxMessage } from '../types';
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
  settings: Settings;
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
}

export function useDataPersistence({
  isLoading, setIsLoading, isDirty, setIsDirty,
  words, setWords, completedWords, setCompletedWords,
  settings, setSettings, inboxMessages, setInboxMessages,
  archivedMessages, setArchivedMessages, trashedMessages, setTrashedMessages,
  inboxMessagesRef, archivedMessagesRef, trashedMessagesRef,
  setLastSaveTime, setAutoSaveCountdown, showToast
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

        if (savedWords) {
          const wordsWithDefaults = savedWords.map((w: Word) => ({ ...w, lastNotified: w.lastNotified || undefined }));
          setWords(wordsWithDefaults);
        }
        if (savedCompletedWords) setCompletedWords(savedCompletedWords);
        if (savedSettings) setSettings(prev => ({ ...prev, ...savedSettings }));
        if (savedInboxMessages) setInboxMessages(savedInboxMessages);
        if (savedArchivedMessages) setArchivedMessages(savedArchivedMessages);
        if (savedTrashedMessages) setTrashedMessages(savedTrashedMessages);
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
    if (!isLoading) setIsDirty(true);
  }, [words, completedWords, inboxMessages, archivedMessages, trashedMessages, settings, isLoading, setIsDirty]);

  useEffect(() => {
    window.electronAPI.notifyDirtyState(isDirty);
  }, [isDirty]);

  // Handler for manual project saving
  const handleSaveProject = useCallback(async () => {
    if (isLoading) return;
    await window.electronAPI.setStoreValue('overwhelmed-words', words);
    await window.electronAPI.setStoreValue('overwhelmed-completed-words', completedWords);
    await window.electronAPI.setStoreValue('overwhelmed-settings', settings);
    await window.electronAPI.setStoreValue('overwhelmed-inbox-messages', inboxMessagesRef.current);
    await window.electronAPI.setStoreValue('overwhelmed-archived-messages', archivedMessagesRef.current);
    await window.electronAPI.setStoreValue('overwhelmed-trashed-messages', trashedMessagesRef.current);
    setIsDirty(false);
    setLastSaveTime(Date.now());
    setAutoSaveCountdown(AUTO_SAVE_INTERVAL_SECONDS);
    showToast('Project saved!');
  }, [isLoading, words, completedWords, settings, inboxMessages, archivedMessages, trashedMessages, inboxMessagesRef, archivedMessagesRef, trashedMessagesRef, setIsDirty, setLastSaveTime, setAutoSaveCountdown, showToast]);

  // Effect for the auto-save timer
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setAutoSaveCountdown(prevCountdown => {
        if (prevCountdown <= 1) {
          if (isDirty) {
            window.electronAPI.send('auto-save-data', { words, completedWords, settings, inboxMessages, archivedMessages, trashedMessages });
            setIsDirty(false);
            setLastSaveTime(Date.now());
          }
          return AUTO_SAVE_INTERVAL_SECONDS;
        }
        return prevCountdown - 1;
      });
    }, 1000);
    return () => clearInterval(countdownInterval);
  }, [isDirty, words, completedWords, settings, inboxMessages, archivedMessages, trashedMessages, setIsDirty, setLastSaveTime, setAutoSaveCountdown]);

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