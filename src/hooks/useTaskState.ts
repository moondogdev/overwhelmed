import { useState, useCallback, useRef, useEffect } from 'react';
import { Word, InboxMessage, ChecklistItem, Settings } from '../types';
import { formatTime, formatTimestamp } from '../utils';

interface UseTaskStateProps {
  initialWords?: Word[];
  initialCompletedWords?: Word[];
  setInboxMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
  showToast: (message: string, duration?: number) => void;
  newTask: Partial<Word>;
  setNewTask: React.Dispatch<React.SetStateAction<Partial<Word>>>;
  bulkAddText: string;
  setBulkAddText: React.Dispatch<React.SetStateAction<string>>;
  settings: Settings;
}

export function useTaskState({
  initialWords = [],
  initialCompletedWords = [],
  setInboxMessages,
  showToast,
  newTask,
  setNewTask,
  bulkAddText,
  setBulkAddText,
  settings,
}: UseTaskStateProps) {
  const [words, setWords] = useState<Word[]>(initialWords);
  const [completedWords, setCompletedWords] = useState<Word[]>(initialCompletedWords);
  const [confirmingClearCompleted, setConfirmingClearCompleted] = useState(false);
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [updateTimers, setUpdateTimers] = useState<{ [key: number]: NodeJS.Timeout }>({});
  const wordsRefForDebounce = useRef(words);

  // New refs to hold the latest state for background processes like auto-save
  const wordsRef = useRef(words);
  const completedWordsRef = useRef(completedWords);

  wordsRefForDebounce.current = words;

  const handleCompleteWord = useCallback((wordToComplete: Word) => {
    const finalDuration = wordToComplete.isPaused
      ? wordToComplete.pausedDuration
      : (wordToComplete.pausedDuration || 0) + (Date.now() - wordToComplete.createdAt);

    const completedWord = { ...wordToComplete, completedDuration: finalDuration };

    setCompletedWords(prev => [completedWord, ...prev]);
    setWords(prev => prev.filter(word => word.id !== wordToComplete.id));
    setInboxMessages(prev => [{ 
      id: Date.now() + Math.random(),
      type: 'completed',
      text: `Task completed: "${completedWord.text}"`,
      timestamp: Date.now(),
      wordId: completedWord.id,
    }, ...prev]);
    showToast('Task completed!');

    let newRecurringTask: Word | null = null;

    if (wordToComplete.isRecurring || wordToComplete.isDailyRecurring || wordToComplete.isWeeklyRecurring || wordToComplete.isMonthlyRecurring || wordToComplete.isYearlyRecurring) {
      let newOpenDate = Date.now();
      let newCompleteBy: number | undefined = undefined;

      if (wordToComplete.isDailyRecurring) {
        newOpenDate += 24 * 60 * 60 * 1000;
        if (wordToComplete.completeBy) newCompleteBy = wordToComplete.completeBy + 24 * 60 * 60 * 1000;
      } else if (wordToComplete.isWeeklyRecurring) {
        newOpenDate += 7 * 24 * 60 * 60 * 1000;
        if (wordToComplete.completeBy) newCompleteBy = wordToComplete.completeBy + 7 * 24 * 60 * 60 * 1000;
      } else if (wordToComplete.isMonthlyRecurring) {
        const d = new Date(newOpenDate);
        d.setMonth(d.getMonth() + 1);
        newOpenDate = d.getTime();
        if (wordToComplete.completeBy) {
          const cbd = new Date(wordToComplete.completeBy);
          cbd.setMonth(cbd.getMonth() + 1);
          newCompleteBy = cbd.getTime();
        }
      } else if (wordToComplete.isYearlyRecurring) {
        const d = new Date(newOpenDate);
        d.setFullYear(d.getFullYear() + 1);
        newOpenDate = d.getTime();
        if (wordToComplete.completeBy) {
          const cbd = new Date(wordToComplete.completeBy);
          cbd.setFullYear(cbd.getFullYear() + 1);
          newCompleteBy = cbd.getTime();
        }
      } else if (wordToComplete.isRecurring && wordToComplete.completeBy && wordToComplete.createdAt) {
        const originalDuration = wordToComplete.completeBy - wordToComplete.createdAt;
        newCompleteBy = Date.now() + originalDuration;
      }

      newRecurringTask = {
        ...wordToComplete,
        id: Date.now() + Math.random(),
        createdAt: newOpenDate,
        openDate: newOpenDate,
        completedDuration: undefined,
        completeBy: newCompleteBy,
        startsTaskIdOnComplete: wordToComplete.startsTaskIdOnComplete,
      };
    }

    if (wordToComplete.startsTaskIdOnComplete) {
      const successorTaskId = wordToComplete.startsTaskIdOnComplete;
      setWords(prevWords => {
        let newWords = prevWords.map(w => {
          if (w.id !== successorTaskId) return w;
          const updatedSuccessor = { ...w, openDate: Date.now(), completeBy: Date.now() };
          if (w.startsTaskIdOnComplete === wordToComplete.id && newRecurringTask) {
            updatedSuccessor.startsTaskIdOnComplete = newRecurringTask.id;
          }
          return updatedSuccessor;
        });
        if (newRecurringTask) {
          newWords = [newRecurringTask, ...newWords];
        }
        return newWords;
      });
    } else if (newRecurringTask) {
      setWords(prev => [newRecurringTask, ...prev]);
    }
  }, [setInboxMessages, showToast]);

  const removeWord = useCallback((idToRemove: number) => {
    const wordToRemove = words.find(w => w.id === idToRemove) || completedWords.find(w => w.id === idToRemove);
    setWords(prev => prev.filter(word => word.id !== idToRemove));
    setCompletedWords(prev => prev.filter(word => word.id !== idToRemove));
    if (wordToRemove) {
      setInboxMessages(prev => [{ id: Date.now() + Math.random(), type: 'deleted', text: `Task deleted: "${wordToRemove.text}"`, timestamp: Date.now() }, ...prev]);
    }
    showToast('Task removed.');
  }, [words, completedWords, setInboxMessages, showToast]);

  const handleDuplicateTask = useCallback((taskToCopy: Word) => {
    const newTask: Word = { ...taskToCopy, id: Date.now() + Math.random(), openDate: Date.now(), createdAt: Date.now(), completedDuration: undefined };
    setWords(prevWords => [newTask, ...prevWords]);
    setInboxMessages(prev => [{ id: Date.now() + Math.random(), type: 'created', text: `Task duplicated: "${newTask.text}"`, timestamp: Date.now(), wordId: newTask.id }, ...prev]);
    showToast('Task duplicated!');
  }, [setInboxMessages, showToast]);

  const handleReopenTask = useCallback((taskToReopen: Word) => {
    setCompletedWords(prev => prev.filter(w => w.id !== taskToReopen.id));
    const reopenedTask: Word = { ...taskToReopen, completedDuration: undefined };
    setWords(prev => [reopenedTask, ...prev]);
    showToast('Task reopened!');
  }, []);

  const handleClearCompleted = useCallback(() => {
    if (confirmingClearCompleted) {
      setCompletedWords([]);
      showToast('Completed list cleared!');
      setConfirmingClearCompleted(false);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    } else {
      setConfirmingClearCompleted(true);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmingClearCompleted(false), 3000);
    }
  }, [confirmingClearCompleted, showToast]);

  const handleCreateNewTask = useCallback(() => {
    if (newTask.text.trim() === "") return;

    const newWord: Word = {
      ...newTask,
      id: Date.now() + Math.random(),
      text: newTask.text.trim(),
      openDate: newTask.openDate || Date.now(),
      x: 0, 
      y: 0,
      width: 0,
      height: 0,
      createdAt: Date.now(),
      pausedDuration: 0,
      manualTime: 0,
      manualTimeRunning: false,
      manualTimeStart: 0,
    };

    setInboxMessages(prev => [{
      id: Date.now() + Math.random(),
      type: 'created',
      text: `Task created: "${newWord.text}"`,
      timestamp: Date.now(),
      wordId: newWord.id,
    }, ...prev]);
    showToast('Task added!');
    setWords((prevWords) => [...prevWords, newWord]);

    // Reset the new task form, preserving the selected category and task type
    setNewTask({
      text: '',
      url: '',
      taskType: newTask.taskType,
      priority: 'Medium' as 'High' | 'Medium' | 'Low',
      categoryId: newTask.categoryId,
      openDate: new Date().getTime(),
      completeBy: undefined,
      company: '',
      websiteUrl: '',
      imageLinks: [],
      attachments: [],
      checklist: [],
      notes: '',
      description: '',
      manualTime: 0,
      manualTimeRunning: false,
      manualTimeStart: 0,
      payRate: 0,
      isRecurring: false,
      isDailyRecurring: false,
      isWeeklyRecurring: false,
      isMonthlyRecurring: false,
      isYearlyRecurring: false,
      isAutocomplete: false,
      lastNotified: undefined,
      snoozedAt: undefined,
    });
  }, [newTask, setInboxMessages, showToast, setWords, setNewTask]);

  const handleWordUpdate = useCallback((updatedWord: Word) => {
    // Clear any existing timer for this word to debounce
    if (updateTimers[updatedWord.id]) {
      clearTimeout(updateTimers[updatedWord.id]);
    }

    // Set a new timer
    const newTimer = setTimeout(() => {
      // Check if the word still exists before adding to inbox
      if (wordsRefForDebounce.current.some(w => w.id === updatedWord.id)) {
        setInboxMessages(prev => [{
          id: Date.now() + Math.random(),
          type: 'updated',
          text: `Task updated: "${updatedWord.text}"`,
          timestamp: Date.now(),
          wordId: updatedWord.id,
        }, ...prev]);
      }
      // Clean up the timer from state
      setUpdateTimers(prev => { const newTimers = { ...prev }; delete newTimers[updatedWord.id]; return newTimers; });
    }, 5000); // 5-second debounce window

    setUpdateTimers(prev => ({ ...prev, [updatedWord.id]: newTimer }));
    setWords(words.map(w => w.id === updatedWord.id ? updatedWord : w));
  }, [words, updateTimers, wordsRefForDebounce, setInboxMessages]);

  const handleChecklistCompletion = useCallback((item: ChecklistItem, sectionId: number) => {
    // This handler is now ONLY for individual item completions.
    const parentWord = words.find(w => w.checklist?.some(s => 'items' in s && s.id === sectionId));
    if (parentWord) {
      setInboxMessages(prev => [{
        id: Date.now() + Math.random(), type: 'completed', text: `Checklist item completed: "${item.text}" in task "${parentWord.text}"`,
        timestamp: Date.now(), wordId: parentWord.id, sectionId: sectionId
      }, ...prev]);
    }
  }, [words, setInboxMessages]); // Dependency on `words` ensures it has the latest task list

  const handleClearAll = useCallback(() => {
    setWords([]);
    showToast('All open tasks cleared!');
    // wordPlacementIndex is no longer used, so we don't need to reset it.
  }, [showToast]);

  const handleBulkAdd = useCallback(() => {
    if (bulkAddText.trim() === "") return;

    const wordsToAdd = bulkAddText.split(/[\n,]+/).map(w => w.trim()).filter(w => w);
    if (wordsToAdd.length === 0) return;

    const newWords = wordsToAdd.map(text => {
      const newWord: Word = {
        id: Date.now() + Math.random(),
        text,
        x: 0, y: 0,
        categoryId: settings.activeCategoryId === 'all' ? (settings.categories[0]?.id || 1) : settings.activeCategoryId,
        manualTime: 0,
        manualTimeRunning: false,
        manualTimeStart: 0,
        openDate: Date.now(),
        width: 0,
        height: 0,
        createdAt: Date.now(),
        pausedDuration: 0,
        checklist: [],
      };
      return newWord;
    });

    setInboxMessages(prev => [{
      id: Date.now() + Math.random(),
      type: 'created',
      text: `Bulk added ${wordsToAdd.length} tasks.`,
      timestamp: Date.now(),
    }, ...prev]);

    setWords(prev => [...prev, ...newWords]);
    setBulkAddText(""); // Clear the textarea
  }, [bulkAddText, setBulkAddText, settings.activeCategoryId, settings.categories, setInboxMessages, setWords]);

  const handleCopyList = useCallback(() => {
    const reportHeader = "Open Tasks Report\n===================\n";
    const reportBody = words.map(word => {
      const now = Date.now();
      const currentDuration = word.isPaused
        ? (word.pausedDuration || 0)
        : (word.pausedDuration || 0) + (now - word.createdAt);
      return `- ${word.text}\n    - Date Opened: ${formatTimestamp(word.createdAt)}\n    - Current Timer: ${formatTime(currentDuration)}`;
    }).join('\n\n');

    const wordList = reportHeader + reportBody;
    navigator.clipboard.writeText(wordList).then(() => {
      showToast('Open tasks copied!');
    }).catch(err => {
      console.error('Failed to copy list: ', err);
    });
  }, [words, showToast]);

  const handleTogglePause = useCallback((wordId: number) => {
    setWords(prevWords => prevWords.map(word => {
      if (word.id === wordId) {
        if (word.isPaused) {
          // Resuming: adjust createdAt to account for the time it was paused
          const now = Date.now();
          const newCreatedAt = now - (word.pausedDuration || 0);
          return { ...word, isPaused: false, createdAt: newCreatedAt, pausedDuration: 0 };
        } else {
          // Pausing: calculate and store the elapsed duration
          const elapsed = (word.pausedDuration || 0) + (Date.now() - word.createdAt);
          return { ...word, isPaused: true, pausedDuration: elapsed };
        }
      }
      return word;
    }));
  }, [setWords]);

  const moveWord = useCallback((wordIdToMove: number, targetWordId: number) => {
    setWords(prevWords => {
      const newWords = [...prevWords];
      const indexToMove = newWords.findIndex(w => w.id === wordIdToMove);
      const indexToSwap = newWords.findIndex(w => w.id === targetWordId);

      if (indexToMove === -1 || indexToSwap === -1) {
        console.error("Could not find one or both words to swap.");
        return prevWords; // Return original state if words not found
      }

      const temp = newWords[indexToMove];
      newWords[indexToMove] = newWords[indexToSwap];
      newWords[indexToSwap] = temp;
      return newWords;
    });
  }, [setWords]);

  // Keep refs updated with the latest state
  useEffect(() => {
    wordsRef.current = words;
  }, [words]);
  useEffect(() => {
    completedWordsRef.current = completedWords;
  }, [completedWords]);

  return {
    words, setWords,
    completedWords, setCompletedWords,
    confirmingClearCompleted,
    handleCompleteWord,
    removeWord,
    handleDuplicateTask,
    handleReopenTask,
    handleClearCompleted,
    handleWordUpdate,
    handleCreateNewTask,
    handleChecklistCompletion,
    handleClearAll,
    handleBulkAdd,
    handleCopyList,
    handleTogglePause,
    moveWord,
    wordsRef, // Expose the ref
    completedWordsRef, // Expose the ref
  };
}