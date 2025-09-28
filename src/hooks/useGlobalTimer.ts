import { useState, useEffect, useCallback } from 'react';
import { Word, TimeLogEntry } from '../types';

interface UseGlobalTimerProps {
  words: Word[];
  setWords: React.Dispatch<React.SetStateAction<Word[]>>;
}

export function useGlobalTimer({ words, setWords }: UseGlobalTimerProps) {
  const [activeTimerWordId, setActiveTimerWordId] = useState<number | null>(null);
  const [activeTimerEntry, setActiveTimerEntry] = useState<TimeLogEntry | null>(null);
  const [activeTimerLiveTime, setActiveTimerLiveTime] = useState<number>(0);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      if (activeTimerEntry && activeTimerEntry.startTime) {
        const liveTime = activeTimerEntry.duration + (Date.now() - activeTimerEntry.startTime);
        setActiveTimerLiveTime(liveTime);
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [activeTimerEntry]);

  const handleGlobalStopTimer = useCallback(() => {
    if (!activeTimerWordId || !activeTimerEntry) return;

    const now = Date.now();
    const elapsed = now - (activeTimerEntry.startTime || now);
    const finalDuration = activeTimerEntry.duration + elapsed;

    setWords(prevWords =>
      prevWords.map(w => {
        if (w.id !== activeTimerWordId) return w;
        const newTimeLog = (w.timeLog || []).map(entry =>
          entry.id === activeTimerEntry.id
            ? { ...entry, duration: finalDuration, isRunning: false, startTime: undefined }
            : entry
        );
        return { ...w, timeLog: newTimeLog };
      })
    );

    setActiveTimerWordId(null);
    setActiveTimerEntry(null);
    setActiveTimerLiveTime(0);
  }, [activeTimerWordId, activeTimerEntry, setWords]);

  const handleGlobalToggleTimer = useCallback((wordId: number, entryId: number) => {
    const now = Date.now();
    const targetWord = words.find(w => w.id === wordId);
    if (!targetWord) return;

    const targetEntry = (targetWord.timeLog || []).find(e => e.id === entryId);
    if (!targetEntry) return;

    if (activeTimerWordId && (activeTimerWordId !== wordId || activeTimerEntry?.id !== entryId)) {
      handleGlobalStopTimer();
    }

    const isThisTimerRunning = activeTimerWordId === wordId && activeTimerEntry?.id === entryId;

    if (isThisTimerRunning) {
      handleGlobalStopTimer();
    } else {
      const newEntryState = { ...targetEntry, isRunning: true, startTime: now };
      setWords(prev => prev.map(w => w.id === wordId ? { ...w, timeLog: (w.timeLog || []).map(e => e.id === entryId ? { ...e, isRunning: true } : { ...e, isRunning: false }) } : w));
      setActiveTimerWordId(wordId);
      setActiveTimerEntry(newEntryState);
      setActiveTimerLiveTime(newEntryState.duration);
    }
  }, [words, activeTimerWordId, activeTimerEntry, handleGlobalStopTimer, setWords]);

  const handleAddNewTimeLogEntryAndStart = useCallback((wordId: number, description: string) => {
    const now = Date.now();
    const newEntry: TimeLogEntry = {
      id: now + Math.random(),
      description: description,
      duration: 0,
      isRunning: true,
      startTime: now,
      createdAt: now,
    };
    // Stop any other running timer first
    if (activeTimerWordId) {
      handleGlobalStopTimer();
    }
    // Set the new entry as the active one
    setActiveTimerWordId(wordId);
    setActiveTimerEntry(newEntry);
    setActiveTimerLiveTime(0);
  }, [activeTimerWordId, handleGlobalStopTimer]);

  return {
    activeTimerWordId, setActiveTimerWordId,
    activeTimerEntry, setActiveTimerEntry,
    activeTimerLiveTime, setActiveTimerLiveTime,
    handleGlobalStopTimer,
    handleGlobalToggleTimer,
    handleAddNewTimeLogEntryAndStart,
  };
}