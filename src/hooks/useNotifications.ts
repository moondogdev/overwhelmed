import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Word, Settings, InboxMessage } from '../types';

interface UseNotificationsProps {
  words: Word[];
  setWords: React.Dispatch<React.SetStateAction<Word[]>>;
  settings: Settings;
  setInboxMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
  handleCompleteWord: (word: Word) => void;
  removeWord: (id: number) => void;
  isLoading: boolean;
}

export function useNotifications({
  words,
  setWords,
  settings,
  setInboxMessages,
  handleCompleteWord,
  removeWord,
  isLoading,
}: UseNotificationsProps) {
  const [timerNotifications, setTimerNotifications] = useState<Word[]>([]);
  const [overdueNotifications, setOverdueNotifications] = useState<Set<number>>(new Set());
  const overdueMessageSentRef = useRef(new Set<number>());

  const handleTaskOverdue = useCallback((wordId: number) => {
    setOverdueNotifications(prev => {
      if (prev.has(wordId)) {
        return prev;
      }
      if (!overdueMessageSentRef.current.has(wordId)) {
        const word = words.find(w => w.id === wordId);
        setInboxMessages(currentInbox => [{ id: Date.now() + Math.random(), type: 'overdue', text: `Task is overdue: ${word?.text || 'Unknown Task'}`, timestamp: Date.now(), wordId: wordId }, ...currentInbox]);
        overdueMessageSentRef.current.add(wordId);
      }
      return new Set(prev).add(wordId);
    });
  }, [words, setInboxMessages]);

  const handleTimerNotify = useCallback((word: Word) => {
    setTimerNotifications(prev => [...prev, word]);
    setTimeout(() => {
      setTimerNotifications(prev => prev.filter(n => n.id !== word.id));
    }, 8000);
  }, []);

  const handleSnooze = useCallback((wordToSnooze: Word, duration?: 'low' | 'medium' | 'high') => {
    const snoozeDurations = { low: 1 * 60 * 1000, medium: 5 * 60 * 1000, high: 10 * 60 * 1000 };
    const snoozeDurationMs = snoozeDurations[duration || settings.snoozeTime];
    const snoozedUntil = Date.now() + snoozeDurationMs;
    setWords(prevWords => prevWords.map(w => w.id === wordToSnooze.id ? { ...w, lastNotified: snoozedUntil, snoozeCount: (w.snoozeCount || 0) + 1, snoozedAt: Date.now() } : w));
    setOverdueNotifications(prev => { const newSet = new Set(prev); newSet.delete(wordToSnooze.id); return newSet; });
  }, [settings.snoozeTime, setWords]);

  const handleSnoozeAll = useCallback((duration?: 'low' | 'medium' | 'high') => {
    const now = Date.now();
    const snoozeDurations = { low: 1 * 60 * 1000, medium: 5 * 60 * 1000, high: 10 * 60 * 1000 };
    const snoozeDurationMs = snoozeDurations[duration || settings.snoozeTime];
    const snoozedUntil = now + snoozeDurationMs;
    const overdueIds = Array.from(overdueNotifications);
    setWords(prevWords => prevWords.map(w =>
      overdueIds.includes(w.id) ? { ...w, lastNotified: snoozedUntil, snoozeCount: (w.snoozeCount || 0) + 1, snoozedAt: now } : w
    ));
    setOverdueNotifications(new Set());
  }, [overdueNotifications, settings.snoozeTime, setWords]);

  const handleCompleteAllOverdue = useCallback(() => {
    const overdueIds = Array.from(overdueNotifications);
    overdueIds.forEach(id => {
      const wordToComplete = words.find(w => w.id === id);
      if (wordToComplete) handleCompleteWord(wordToComplete);
    });
  }, [overdueNotifications, words, handleCompleteWord]);

  const handleDeleteAllOverdue = useCallback(() => {
    const overdueIds = Array.from(overdueNotifications);
    overdueIds.forEach(id => {
      const wordToDelete = words.find(w => w.id === id);
      if (wordToDelete) removeWord(wordToDelete.id);
    });
  }, [overdueNotifications, words, removeWord]);

  useEffect(() => {
    // Do not run any timer logic until the initial data load is complete.
    if (isLoading) return;

    const notificationInterval = setInterval(() => {
      const now = Date.now();
      const newlyOverdueIds = new Set<number>();
      const approachingWords: Word[] = [];

      // First, collect all events for this tick
      for (const word of words) {
        if (!word.completeBy) continue;

        const ms = word.completeBy - now;
        if (ms < 0) { // Task is overdue
          const snoozedUntil = word.lastNotified || 0;
          if (now > snoozedUntil) {
            newlyOverdueIds.add(word.id);
          }
        } else { // Task is not yet due, check for approaching deadline
          if (settings.timerNotificationLevel === 'silent') continue;

          const minutesLeft = Math.floor(ms / 60000);
          const lastNotifiedMinutes = word.lastNotified ? Math.floor((word.completeBy - word.lastNotified) / 60000) : Infinity;

          let shouldNotify = false;
          if (settings.timerNotificationLevel === 'high' && minutesLeft > 0 && (minutesLeft % 60 === 0 || (minutesLeft <= 60 && minutesLeft % 15 === 0)) && lastNotifiedMinutes > minutesLeft) {
            shouldNotify = true;
          } else if (settings.timerNotificationLevel === 'medium' && minutesLeft > 0 && minutesLeft <= 60 && minutesLeft % 15 === 0 && lastNotifiedMinutes > minutesLeft) {
            shouldNotify = true;
          } else if (settings.timerNotificationLevel === 'low' && minutesLeft > 0 && minutesLeft <= 15 && lastNotifiedMinutes > 15) {
            shouldNotify = true;
          }

          if (shouldNotify) {
            approachingWords.push(word);
          }
        }
      }

      // Now, process the collected events in single state updates
      if (newlyOverdueIds.size > 0) {
        newlyOverdueIds.forEach(id => handleTaskOverdue(id));
      }
      if (approachingWords.length > 0) {
        approachingWords.forEach(word => handleTimerNotify(word));
        setWords(prev => prev.map(w => approachingWords.find(aw => aw.id === w.id) ? { ...w, lastNotified: now } : w));
      }
    }, 1000); // Check every second
    return () => clearInterval(notificationInterval);
  }, [isLoading, words, settings, handleTaskOverdue, handleTimerNotify, setWords]);

  return {
    timerNotifications, overdueNotifications, handleTaskOverdue, handleTimerNotify,
    handleSnooze, handleSnoozeAll, handleCompleteAllOverdue, handleDeleteAllOverdue,
  };
}