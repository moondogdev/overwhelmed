import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Word, TimeLogEntry, TimeLogSession, ChecklistSection } from '../types';
import { formatTime, parseTime, formatTimeLogSessionForCopy } from '../utils';
import './styles/TimeTrackerLog.css';

interface TimeTrackerLogProps {
  word: Word;
  onUpdate: (updatedWord: Word) => void;
  showToast: (message: string, duration?: number, type?: 'success' | 'error' | 'info') => void;
  handleGlobalToggleTimer: (wordId: number, entryId: number) => void;
  activeTimerWordId: number | null;
  activeTimerEntry: TimeLogEntry | null;
  activeTimerLiveTime: number;
  handleGlobalStopTimer: () => void;  
  handleClearActiveTimer: () => void;
  handleGlobalResetTimer: (wordId: number, entryId: number) => void;
  handleNextEntry: () => void;
  handlePreviousEntry: () => void;
  handlePostLog: (wordId: number) => void;
  handlePostAndResetLog: (wordId: number) => void;
  handleResetAllLogEntries: (wordId: number) => void;
  handlePostAndComplete: (wordId: number, entryId: number, onUpdate: (updatedWord: Word) => void) => void;
  settings: any; // Add settings to props
  checklistRef?: React.MutableRefObject<{ handleUndo: () => void; handleRedo: () => void; resetHistory: (sections: ChecklistSection[]) => void; }>;
}

export function TimeTrackerLog({ 
  word, 
  onUpdate, 
  showToast,
  handleGlobalToggleTimer,
  activeTimerWordId,
  activeTimerEntry,
  activeTimerLiveTime,
  handleGlobalStopTimer,  
  handleClearActiveTimer,
  handleGlobalResetTimer,
  handleNextEntry,
  handlePreviousEntry,
  handlePostLog,
  handlePostAndResetLog,
  handleResetAllLogEntries,
  handlePostAndComplete,
  settings,
  checklistRef,
}: TimeTrackerLogProps) {
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editingEntryDescription, setEditingEntryDescription] = useState('');
  const [editingEntryDuration, setEditingEntryDuration] = useState('');
  const [confirmingDeleteEntry, setConfirmingDeleteEntry] = useState<number | null>(null);
  const [bulkAddText, setBulkAddText] = useState('');
  const [liveTime, setLiveTime] = useState(0);
  const [confirmingDeleteAll, setConfirmingDeleteAll] = useState(false);
  const [confirmingResetAll, setConfirmingResetAll] = useState(false);

  // New state for session management
  const [liveTimerTitle, setLiveTimerTitle] = useState(word.timeLogTitle || 'Work Timer');
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editingSessionTitle, setEditingSessionTitle] = useState('');
  const [openSessionIds, setOpenSessionIds] = useState<Set<number>>(new Set());
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [confirmingDeleteSessionEntry, setConfirmingDeleteSessionEntry] = useState<number | null>(null);
  // State for in-session entry editing
  const [confirmingDeleteSession, setConfirmingDeleteSession] = useState<number | null>(null);
  const [confirmingDeleteAllSessions, setConfirmingDeleteAllSessions] = useState(false);
  const [confirmingClearSession, setConfirmingClearSession] = useState<number | null>(null);
  const [editingSessionEntry, setEditingSessionEntry] = useState<{ sessionId: number; entryId: number; field: 'description' | 'duration' } | null>(null);
  const [editingSessionEntryValue, setEditingSessionEntryValue] = useState('');


  const entryInputRef = useRef<HTMLInputElement>(null);
  const sessionInputRef = useRef<HTMLInputElement>(null);
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // When the word changes, if we are not editing, sync the title.
  useEffect(() => {
    setLiveTimerTitle(word.timeLogTitle || 'Work Timer');
  }, [word.timeLogTitle]);

  // Phase 4.4: One-time data migration from old system
  useEffect(() => {
    // If timeLog is missing/empty AND there's legacy manualTime data...
    if ((!word.timeLog || word.timeLog.length === 0) && (word.manualTime || 0) > 0 && !word.timeLogSessions) {
      // ...create a new entry from the old data.
      const legacyEntry: TimeLogEntry = {
        id: Date.now(),
        description: 'Legacy Timed Entry',
        duration: word.manualTime || 0,
        isRunning: false,
        createdAt: Date.now(),
      };
      // Update the word object with the new timeLog array.
      onUpdate({ ...word, timeLog: [legacyEntry] });
    }
  }, [word.timeLog, word.manualTime, onUpdate, word.timeLogSessions]);

  // Focus the input when an entry enters edit mode.
  useEffect(() => {
    if (editingEntryId !== null && entryInputRef.current) {
      entryInputRef.current.focus();
    }
  }, [editingEntryId]);

  useEffect(() => {
    if (editingSessionId !== null && sessionInputRef.current) {
      sessionInputRef.current.focus();
    }
  }, [editingSessionId, editingSessionTitle]);

  const handleUpdateLog = useCallback((newTimeLog: TimeLogEntry[]) => {
    onUpdate({ ...word, timeLog: newTimeLog });
  }, [word, onUpdate]);

  const handleAddNewEntry = useCallback(() => {
    const newEntry: TimeLogEntry = {
      id: Date.now() + Math.random(),
      description: 'New Entry',
      duration: 0,
      isRunning: false,
      createdAt: Date.now(),
    };
    const newTimeLog = [...(word.timeLog || []), newEntry];
    handleUpdateLog(newTimeLog);
    // Immediately enter edit mode for the new entry
    setEditingEntryId(newEntry.id);
    setEditingEntryDescription(newEntry.description);
  }, [word.timeLog, handleUpdateLog]);

  const handleDeleteEntry = useCallback((id: number) => {
    if (confirmingDeleteEntry === id) {
      const newTimeLog = (word.timeLog || []).filter(entry => entry.id !== id);
      handleUpdateLog(newTimeLog);
      setConfirmingDeleteEntry(null);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    } else {
      setConfirmingDeleteEntry(id);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteEntry(null), 3000);
    }
  }, [confirmingDeleteEntry, word.timeLog, handleUpdateLog]);

  const handleSessionCommand = useCallback((payload: { command: string, session: TimeLogSession }) => {
    const { command, session: targetSession } = payload;
    const currentSessions = word.timeLogSessions || [];

    switch (command) {
      case 'edit_title': {
        setEditingSessionId(targetSession.id);
        setEditingSessionTitle(targetSession.title);
        break;
      }
      case 'clear_entries': {
        const updatedSessions = currentSessions.map(s => 
          s.id === targetSession.id ? { ...s, entries: [] } : s
        );
        onUpdate({ ...word, timeLogSessions: updatedSessions });
        showToast('Session entries cleared.');
        break;
      }
      case 'delete_session': {
        const updatedSessions = currentSessions.filter(s => s.id !== targetSession.id);
        onUpdate({ ...word, timeLogSessions: updatedSessions });
        showToast('Session deleted.');
        break;
      }
      case 'duplicate_session': {
        const newSession: TimeLogSession = {
          ...targetSession,
          id: Date.now() + Math.random(),
          title: `${targetSession.title} (Copy)`,
        };
        const updatedSessions = [...currentSessions, newSession];
        onUpdate({ ...word, timeLogSessions: updatedSessions });
        showToast('Session duplicated.');
        break;
      }
      case 'copy_session': {
        const textToCopy = formatTimeLogSessionForCopy(targetSession);
        navigator.clipboard.writeText(textToCopy);
        showToast('Session copied as text!');
        break;
      }
      case 'restart_session': {
        let updatedWord = { ...word };
        if (word.timeLog && word.timeLog.length > 0) {
          const newSession: TimeLogSession = { id: Date.now() + Math.random(), title: word.timeLogTitle || `Unsaved Session - ${new Date().toLocaleTimeString()}`, entries: word.timeLog, createdAt: Date.now() };
          updatedWord.timeLogSessions = [...(word.timeLogSessions || []), newSession];
          updatedWord.timeLog = [];
          updatedWord.timeLogTitle = undefined;
          showToast(`Current session saved as "${newSession.title}".`);
        }
        updatedWord.timeLog = targetSession.entries.map((entry): TimeLogEntry => ({ ...entry, id: Date.now() + Math.random(), isRunning: false, startTime: undefined, createdAt: Date.now() }));
        updatedWord.timeLogTitle = targetSession.title;
        onUpdate(updatedWord);
        showToast(`Session "${targetSession.title}" loaded into timer.`);
        break;
      }
    }
  }, [word, onUpdate, showToast]);

  const handleStartEditing = useCallback((entry: TimeLogEntry) => {
    setEditingEntryId(entry.id);
    setEditingEntryDescription(entry.description);
  }, []);

  const handleStartEditingDuration = useCallback((entry: TimeLogEntry) => {
    setEditingEntryId(entry.id);
    setEditingEntryDuration(formatTime(entry.duration));
  }, []);

  const handleMoveEntry = useCallback((entryId: number, direction: 'up' | 'down') => {
    const newTimeLog = [...(word.timeLog || [])];
    const index = newTimeLog.findIndex(e => e.id === entryId);
    if (index === -1) return;

    const item = newTimeLog[index];

    if (direction === 'up' && index > 0) {
      newTimeLog.splice(index, 1);
      newTimeLog.splice(index - 1, 0, item);
    } else if (direction === 'down' && index < newTimeLog.length - 1) {
      newTimeLog.splice(index, 1);
      newTimeLog.splice(index + 1, 0, item);
    }
    handleUpdateLog(newTimeLog);
  }, [word.timeLog, handleUpdateLog]);
  // Effect to handle commands from the context menus
  const handleItemCommand = useCallback((payload: { command: string, entryId?: number }) => {
    const handleItemCommand = (payload: { command: string, entryId?: number }) => {
      const { command, entryId } = payload;
      const entry = (word.timeLog || []).find(e => e.id === entryId);
      switch (command) {
        case 'edit_description':
          if (entry) handleStartEditing(entry);
          break;
        case 'delete':
          if (entryId) handleDeleteEntry(entryId);
          break;
        case 'duplicate': {          
          if (!entry) break; // Add a guard in case the entry isn't found
          const newEntry: TimeLogEntry = { ...entry, id: Date.now() + Math.random(), isRunning: false, startTime: undefined };
          const newTimeLog = [...(word.timeLog || [])];
          // Find the index of the item to duplicate
          const index = newTimeLog.findIndex(e => e.id === entryId);
          if (index === -1) break; // If not found, do nothing
          newTimeLog.splice(index + 1, 0, newEntry); // Insert the new entry after the original
          handleUpdateLog(newTimeLog);
          break;
        }
        case 'move_up':
          if (entryId) handleMoveEntry(entryId, 'up');
          break;
        case 'move_down':
          if (entryId) handleMoveEntry(entryId, 'down');
          break;
        case 'post_and_complete':
          if (entryId) handlePostAndComplete(word.id, entryId, onUpdate);
          break;
      }
    };
  }, [word.id, word.timeLog, handleStartEditing, handleDeleteEntry, handleUpdateLog, handleMoveEntry, handlePostAndComplete, onUpdate]);

  useEffect(() => {
    const handleHeaderCommand = (payload: { command: string, totalTime: number, timeLog: TimeLogEntry[] }) => {
      const { command, totalTime, timeLog } = payload;
      switch (command) {
        case 'copy_total_time':
          navigator.clipboard.writeText(formatTime(totalTime));
          showToast('Total time copied!');
          break;
        case 'copy_log_as_text': {
          const text = timeLog.map(entry => `${entry.description}: ${formatTime(entry.duration)}`).join('\n');
          navigator.clipboard.writeText(text);
          showToast('Log copied as text!');
          break;
        }
        case 'clear_entries':
          handleClearEntries();
          break;
        case 'delete_all':
          handleDeleteAll();
          showToast('Timer Wiped!');
          break;
        case 'add_new_line':
          handleAddNewEntry();
          showToast('New Timer Line Added!');            
          break;
      }
    };

    const cleanupItem = window.electronAPI.on('time-log-item-command', handleItemCommand);
    const cleanupHeader = window.electronAPI.on('time-log-header-command', handleHeaderCommand);

    return () => {
      cleanupItem?.();
      cleanupHeader?.();
    };
  }, [word.timeLog, handleUpdateLog, handleAddNewEntry, showToast, handleItemCommand]);
  const handleSaveEdit = () => {
    if (editingEntryId === null) return;
    const newTimeLog = (word.timeLog || []).map(entry =>
      entry.id === editingEntryId ? { ...entry, description: editingEntryDescription } : entry
    );
    handleUpdateLog(newTimeLog);
    setEditingEntryId(null);
  };
  const handleSaveDurationEdit = () => {
    if (editingEntryId === null) return;
    const newDuration = parseTime(editingEntryDuration);
    const newTimeLog = (word.timeLog || []).map(entry =>
      entry.id === editingEntryId ? { ...entry, duration: newDuration } : entry
    );
    handleUpdateLog(newTimeLog);
    setEditingEntryId(null);
    setEditingEntryDuration('');
  };

  const handleDeleteAll = () => {
    if (confirmingDeleteAll) {
      // This is the fix. We need to clear both the timeLog AND the loggedTime on each checklist item.
      const updatedChecklist = (word.checklist || []).map(sectionOrItem => {
        if ('items' in sectionOrItem) { // It's a ChecklistSection
          return {
            ...sectionOrItem,
            items: sectionOrItem.items.map(item => {
              const { loggedTime, ...rest } = item; // Remove the loggedTime property
              return rest;
            })
          };
        }
        return sectionOrItem; // Should not happen with normalized data, but safe to keep.
      }) as ChecklistSection[]; // Cast to the expected type to resolve the TS error.
      onUpdate({ ...word, timeLog: [], timeLogTitle: undefined, checklist: updatedChecklist as any });
      checklistRef?.current?.resetHistory(updatedChecklist); // Force the checklist to update its internal history
      setLiveTimerTitle('Work Timer'); // Reset local state as well
      showToast('Timer Wiped!');
      setConfirmingDeleteAll(false);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    } else {
      setConfirmingDeleteAll(true);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteAll(false), 3000);
    }
  };

  const handleClearEntries = () => {
    if (confirmingDeleteAll) { // Reuse the same confirmation state for simplicity
      handleUpdateLog([]);
      showToast('Timer entries cleared.');
      setConfirmingDeleteAll(false);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    } else {
      setConfirmingDeleteAll(true);
      showToast('Confirm clear?', 2000);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteAll(false), 3000);
    }
  };

  const handleResetAllEntries = () => {
    if (confirmingResetAll) {
      handleResetAllLogEntries(word.id);
      
      // If the active timer was part of this log, stop it globally.
      if (activeTimerWordId === word.id) {
        handleClearActiveTimer(); // Use the non-saving stop function
      }

      showToast('All timer entries have been reset.');
      setConfirmingResetAll(false);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    } else {
      setConfirmingResetAll(true);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmingResetAll(false), 3000);
    }
  };

  const handleBulkAdd = () => {
    if (!bulkAddText.trim()) return;

    const allLines = bulkAddText.split('\n').map(line => line.trim());
    let updatedWord = { ...word };
    let potentialTitle: string | null = null;

    // More flexible title detection: find the first non-empty line before a separator.
    const separatorIndex = allLines.findIndex(line => line.startsWith('---') || line.startsWith('Total Duration:'));
    if (separatorIndex > 0) {
      // Find the first non-empty line before the separator.
      for (let i = 0; i < separatorIndex; i++) {
        if (allLines[i]) {
          potentialTitle = allLines[i];
          break;
        }
      }
    }

    if (potentialTitle) {
      setLiveTimerTitle(potentialTitle);
      updatedWord.timeLogTitle = potentialTitle;
    }

    // Simplified entry filtering: ignore blank lines, separators, and the detected title.
    const entryLines = allLines.filter(line => line && !line.startsWith('---') && !line.startsWith('Total Duration:') && line !== potentialTitle);

    const newEntries: TimeLogEntry[] = entryLines.map(line => {
      const timeRegex = /(\d{2}:\d{2}:\d{2})$/;
      const match = line.match(timeRegex);
      const description = match ? line.substring(0, match.index).trim().replace(/:$/, '').trim() : line.trim();
      const duration = match ? parseTime(match[0]) : 0;      
      return { id: Date.now() + Math.random(), description, duration, isRunning: false, createdAt: Date.now() };
    });

    updatedWord.timeLog = [...(word.timeLog || []), ...newEntries];
    setBulkAddText('');
    onUpdate(updatedWord); // Single update call
  };

  // Central handler for session context menu commands
  useEffect(() => {
    const cleanup = window.electronAPI.on('time-log-session-command', handleSessionCommand);
    return () => cleanup?.();
  }, [handleSessionCommand]);

  // --- NEW SESSION LOGIC ---

  const handleUpdateSessionTitle = (sessionId: number) => {
    const updatedSessions = (word.timeLogSessions || []).map(session =>
      session.id === sessionId ? { ...session, title: editingSessionTitle } : session
    );
    onUpdate({ ...word, timeLogSessions: updatedSessions });
    setEditingSessionId(null);
  };
  const handleClearAllSessions = () => {
    if (confirmingDeleteAllSessions) {
      onUpdate({ ...word, timeLogSessions: [] });
      showToast('All time log sessions cleared.');
      setConfirmingDeleteAllSessions(false);
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
    } else {
      setConfirmingDeleteAllSessions(true);
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
      confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteAllSessions(false), 3000);
    }
  };

  const handleClearSessionEntries = (sessionId: number) => {
    if (confirmingDeleteAllSessions) {
      onUpdate({ ...word, timeLogSessions: [] });
      showToast('All time log sessions cleared.');
      setConfirmingDeleteAllSessions(false);
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
    } else {
      setConfirmingDeleteAllSessions(true);
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
      confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteAllSessions(false), 3000);
    }
    if (confirmingClearSession === sessionId) {
      const updatedSessions = (word.timeLogSessions || []).map(session =>
        session.id === sessionId ? { ...session, entries: [] } : session
      );
      onUpdate({ ...word, timeLogSessions: updatedSessions });
      showToast('Session entries cleared.');
      setConfirmingClearSession(null);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    } else {
      setConfirmingClearSession(sessionId);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmingClearSession(null), 3000);
    }
  };

  const handleStartEditingSessionEntry = (session: TimeLogSession, entry: TimeLogEntry, field: 'description' | 'duration') => {
    setEditingSessionEntry({ sessionId: session.id, entryId: entry.id, field });
    if (field === 'description') {
      setEditingSessionEntryValue(entry.description);
    } else {
      setEditingSessionEntryValue(formatTime(entry.duration));
    }
  };

  const handleSaveSessionEntry = () => {
    if (!editingSessionEntry) return;

    const { sessionId, entryId, field } = editingSessionEntry;

    const updatedSessions = (word.timeLogSessions || []).map(session => {
      if (session.id !== sessionId) return session;

      const updatedEntries = session.entries.map(entry => {
        if (entry.id !== entryId) return entry;

        if (field === 'description') {
          return { ...entry, description: editingSessionEntryValue };
        } else {
          return { ...entry, duration: parseTime(editingSessionEntryValue) };
        }
      });
      return { ...session, entries: updatedEntries };
    });

    onUpdate({ ...word, timeLogSessions: updatedSessions });
    setEditingSessionEntry(null);
    setEditingSessionEntryValue('');
  };

  const handleDeleteSessionEntry = (sessionId: number, entryId: number) => {
    if (confirmingDeleteSessionEntry === entryId) {
      const updatedSessions = (word.timeLogSessions || []).map(session => {
        if (session.id !== sessionId) return session;
        const updatedEntries = session.entries.filter(entry => entry.id !== entryId);
        return { ...session, entries: updatedEntries };
      });
      onUpdate({ ...word, timeLogSessions: updatedSessions });
      showToast('Session entry deleted.');
      setConfirmingDeleteSessionEntry(null);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    } else {
      setConfirmingDeleteSessionEntry(entryId);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteSessionEntry(null), 3000);
    }
  };

  const handleToggleSession = (sessionId: number) => {
    setOpenSessionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) newSet.delete(sessionId);
      else newSet.add(sessionId);
      return newSet;
    });
  };

  const calculateSessionDuration = (session: TimeLogSession) => {
    return session.entries.reduce((acc, entry) => acc + entry.duration, 0);
  };

  const totalSessionsTime = React.useMemo(() => {
    return (word.timeLogSessions || []).reduce((total, session) => {
      return total + calculateSessionDuration(session);
    }, 0);
  }, [word.timeLogSessions]);

  // --- NEW TABLE SORTING LOGIC ---
  const [sessionSortConfig, setSessionSortConfig] = useState<{ key: 'title' | 'createdAt' | 'totalTime', direction: 'ascending' | 'descending' }>({ key: 'createdAt', direction: 'descending' });

  const sortedSessions = React.useMemo(() => {
    const sessions = word.timeLogSessions || [];
    return [...sessions].sort((a, b) => {
      const { key, direction } = sessionSortConfig;
      let aValue: any, bValue: any;

      if (key === 'totalTime') {
        aValue = calculateSessionDuration(a);
        bValue = calculateSessionDuration(b);
      } else {
        aValue = a[key] || (key === 'createdAt' ? 0 : '');
        bValue = b[key] || (key === 'createdAt' ? 0 : '');
      }

      if (aValue < bValue) return direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [word.timeLogSessions, sessionSortConfig]);
  // --- END NEW SESSION LOGIC ---

  const timeLog = word.timeLog || [];
  const runningEntry = timeLog.find(entry => entry.isRunning);

  const totalTime = timeLog.reduce((sum, entry) => {
    const isThisEntryRunning = activeTimerWordId === word.id && activeTimerEntry?.id === entry.id;
    return sum + entry.duration + (isThisEntryRunning ? (activeTimerLiveTime - entry.duration) : 0);
  }, 0);

  return (
    <div className="time-tracker-log" style={{width: '100%'}}>
      {/* The component JSX remains the same */}
      <header
        className="time-tracker-header"
        onContextMenu={(e) => {
          e.preventDefault();
          window.electronAPI.showTimeLogHeaderContextMenu({
            totalTime,
            timeLog,
            x: e.clientX,
            y: e.clientY,
          });
        }}
      >
        <div className="time-tracker-header-left">
          <i className="fas fa-stopwatch" onDoubleClick={() => setIsEditingTitle(true)}></i>
          {isEditingTitle ? (
            <input
              type="text"
              value={liveTimerTitle}
              onChange={(e) => setLiveTimerTitle(e.target.value)}
              onBlur={() => {
                onUpdate({ ...word, timeLogTitle: liveTimerTitle });
                setIsEditingTitle(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                  onUpdate({ ...word, timeLogTitle: liveTimerTitle });
                  setIsEditingTitle(false);
                }
              }}
              className="inline-edit-input"
              autoFocus
            />
          ) : (
            <span onDoubleClick={() => setIsEditingTitle(true)}>{liveTimerTitle}</span>
          )}
          <span className="total-time">{formatTime(totalTime)}</span>
        </div>
        <div className="time-tracker-header-right-actions">
          <button onClick={() => {
            navigator.clipboard.writeText(formatTime(totalTime));
            showToast('Total time copied!');
          }} className="icon-button" title="Copy Total Time">
            <i className="fas fa-copy"></i>
          </button>
          <button onClick={() => {
            const text = timeLog.map(entry => `${entry.description}: ${formatTime(entry.duration)}`).join('\n');
            navigator.clipboard.writeText(text);
            showToast('Log copied as text!');
          }} className="icon-button" title="Copy Log as Text">
            <i className="fas fa-paste"></i>
          </button>
        </div>
        {/* This block now controls navigation between log entries WITHIN this task */}
        {(() => {
          const timeLog = word.timeLog || [];
          const isTimerActiveForThisTask = activeTimerWordId === word.id && activeTimerEntry;
          const currentIndex = isTimerActiveForThisTask
            ? timeLog.findIndex(e => e.id === activeTimerEntry.id)
            : -1;

          // Enable buttons only if a timer for THIS task is running.
          const canGoPrevious = currentIndex > 0;
          const canGoNext = currentIndex !== -1 && currentIndex < timeLog.length - 1;
          
          return (
            <div className="time-tracker-header-right-actions">
              <button onClick={handlePreviousEntry} className="icon-button" title="Previous Entry" disabled={!canGoPrevious}>
                <i className="fas fa-step-backward"></i>
              </button>
              <button onClick={handleNextEntry} className="icon-button" title="Next Entry" disabled={!canGoNext}>
                <i className="fas fa-step-forward"></i>
              </button>
            </div>
          );
        })()}
        <div className="time-tracker-header-right">
          {/* New "Post Log" button */}
          <button onClick={() => {
            handlePostLog(word.id);
            showToast('Session logged!');
          }} className="icon-button" title="Post and Clear Log">
            <i className="fas fa-paper-plane"></i>
          </button>
          <button onClick={() => {
            handlePostAndResetLog(word.id);
            showToast('Session logged and timer reset.');
          }} className="icon-button" title="Post and Reset Durations">
            <i className="fas fa-clipboard-check"></i>
          </button>
          <button onClick={handleAddNewEntry} className="icon-button" title="Add New Line">
            <i className="fas fa-plus"></i>
          </button>
          <button onClick={handleResetAllEntries} className={`icon-button ${confirmingResetAll ? 'confirm-delete' : ''}`} title="Reset All Durations">
            <i className={`fas ${confirmingResetAll ? 'fa-check' : 'fa-history'}`}></i>
          </button>
          <button onClick={handleClearEntries} className={`icon-button ${confirmingDeleteAll ? 'confirm-delete' : ''}`} title="Clear All Entries">
            <i className={`fas ${confirmingDeleteAll ? 'fa-check' : 'fa-broom'}`}></i>
          </button>
          <button onClick={handleDeleteAll} className={`icon-button ${confirmingDeleteAll ? 'confirm-delete' : ''}`} title="Wipe Timer (Delete All and Title)">
            <i className={`fas ${confirmingDeleteAll ? 'fa-check' : 'fa-trash'}`}></i>
          </button>
        </div>
      </header>
      <div className="time-log-entries">
        {timeLog.map((entry, index) => {
          if (entry.type === 'header') {
            return (
              <div key={entry.id} className="time-log-header-entry">
                {entry.description}
              </div>
            );
          }
          // Default rendering for a regular entry
          return (
            <div
              key={entry.id}
              className="time-log-entry"
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.electronAPI.showTimeLogItemContextMenu({
                  entry,
                  index,
                  totalEntries: timeLog.length,
                  x: e.clientX,
                  y: e.clientY,
                });
              }}
            >
              <div className="time-log-entry-main">
                <button onClick={() => handleGlobalToggleTimer(word.id, entry.id)} className="icon-button-small" title={entry.isRunning ? 'Pause' : 'Start'}>
                  <i className={`fas ${entry.isRunning ? 'fa-pause-circle' : 'fa-play-circle'}`} style={{ color: entry.isRunning ? (activeTimerEntry?.id === entry.id ? '#f44336' : '#4CAF50') : '#4CAF50' }}></i>
                </button>
                <div className="entry-description" onDoubleClick={() => handleStartEditing(entry)}>
                  {editingEntryId === entry.id ? (
                    <input ref={entryInputRef} type="text" value={editingEntryDescription} onChange={(e) => setEditingEntryDescription(e.target.value)} onBlur={handleSaveEdit} onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()} className="inline-edit-input" />
                  ) : ( <span>{entry.description}</span> )}
                </div>
                {editingEntryId === entry.id && editingEntryDuration ? (
                  <input type="text" value={editingEntryDuration} onChange={(e) => setEditingEntryDuration(e.target.value)} onBlur={handleSaveDurationEdit} onKeyDown={(e) => e.key === 'Enter' && handleSaveDurationEdit()} className="inline-edit-input" style={{ textAlign: 'right', minWidth: '80px' }} autoFocus />
                ) : (
                  <span className="entry-duration" onDoubleClick={() => handleStartEditingDuration(entry)}>
                    {formatTime(activeTimerWordId === word.id && activeTimerEntry?.id === entry.id ? activeTimerLiveTime : entry.duration)}
                  </span>
                )}
              </div>
              <div className="time-log-entry-actions">
                {entry.checklistItemId && (
                  <button onClick={() => handlePostAndComplete(word.id, entry.id, onUpdate)} className="icon-button-small" title="Toggle Checklist Item Complete"><i className="fas fa-check-square"></i></button>
                )}
                <button onClick={() => handleStartEditing(entry)} className="icon-button-small" title="Edit Description"><i className="fas fa-pencil-alt"></i></button>
                <button onClick={() => handleGlobalResetTimer(word.id, entry.id)} className="icon-button-small" title="Reset Duration"><i className="fas fa-undo"></i></button>
                <button onClick={() => {
                  const newEntry: TimeLogEntry = { ...entry, id: Date.now() + Math.random(), isRunning: false, startTime: undefined };
                  const newTimeLog = [...(word.timeLog || [])];
                  newTimeLog.splice(index + 1, 0, newEntry);
                  handleUpdateLog(newTimeLog);
                }} className="icon-button-small" title="Duplicate Entry"><i className="fas fa-copy"></i></button>
                <button onClick={() => handleMoveEntry(entry.id, 'up')} className="icon-button-small" title="Move Up" disabled={index === 0}><i className="fas fa-arrow-up"></i></button>
                <button onClick={() => handleMoveEntry(entry.id, 'down')} className="icon-button-small" title="Move Down" disabled={index === timeLog.length - 1}><i className="fas fa-arrow-down"></i></button>
                <button onClick={() => handleDeleteEntry(entry.id)} className={`icon-button-small ${confirmingDeleteEntry === entry.id ? 'confirm-delete' : ''}`} title="Delete Entry"><i className={`fas ${confirmingDeleteEntry === entry.id ? 'fa-check' : 'fa-trash'}`}></i></button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="bulk-add-container">
        <textarea
          value={bulkAddText}
          onChange={(e) => setBulkAddText(e.target.value)}
          placeholder="Paste multiple lines to bulk add entries..."
          rows={3}
        />
        <button onClick={handleBulkAdd}>Add from Text</button>
      </div>

      {/* --- NEW SESSION RENDERING LOGIC --- */}
      {(word.timeLogSessions && word.timeLogSessions.length > 0) && (
        <div className="time-log-sessions-container">
          <header>
            <i className="fas fa-history"></i>
            <span>Time Logs</span>
            <span className="total-time" style={{ marginLeft: '10px', fontSize: '12px' }}>
              (Total: {formatTime(totalSessionsTime)})
            </span>
            <button
              onClick={handleClearAllSessions}
              className={`icon-button-small ${confirmingDeleteAllSessions ? 'confirm-delete' : ''}`}
              title="Clear All Sessions"
              style={{ marginLeft: 'auto' }}
            ><i className={`fas ${confirmingDeleteAllSessions ? 'fa-check' : 'fa-trash'}`}></i></button>
          </header>          
          <table className="report-table time-log-session-table">
            <thead>
              <tr>
                <th onClick={() => setSessionSortConfig(prev => ({ key: 'title', direction: prev.key === 'title' && prev.direction === 'ascending' ? 'descending' : 'ascending' }))}>
                  Title {sessionSortConfig.key === 'title' && (sessionSortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th onClick={() => setSessionSortConfig(prev => ({ key: 'createdAt', direction: prev.key === 'createdAt' && prev.direction === 'ascending' ? 'descending' : 'ascending' }))}>
                  Saved At {sessionSortConfig.key === 'createdAt' && (sessionSortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th onClick={() => setSessionSortConfig(prev => ({ key: 'totalTime', direction: prev.key === 'totalTime' && prev.direction === 'ascending' ? 'descending' : 'ascending' }))}>
                  Total Time {sessionSortConfig.key === 'totalTime' && (sessionSortConfig.direction === 'ascending' ? '▲' : '▼')}
                </th>
                <th>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedSessions.map(session => (
                <React.Fragment key={session.id}>
                  <tr
                    className="time-log-session-item"
                    onClick={() => handleToggleSession(session.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.electronAPI.showTimeLogSessionContextMenu({ session, x: e.clientX, y: e.clientY });
                    }}
                  >
                    <td onDoubleClick={(e) => { e.stopPropagation(); setEditingSessionId(session.id); setEditingSessionTitle(session.title); }}>
                      <i className={`fas ${openSessionIds.has(session.id) ? 'fa-chevron-down' : 'fa-chevron-right'}`} style={{ marginRight: '8px' }}></i>
                      {editingSessionId === session.id ? (
                        <input ref={sessionInputRef} type="text" value={editingSessionTitle} onChange={(e) => setEditingSessionTitle(e.target.value)} onBlur={() => handleUpdateSessionTitle(session.id)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateSessionTitle(session.id)} onClick={(e) => e.stopPropagation()} className="inline-edit-input" />
                      ) : (
                        <span>{session.title}</span>
                      )}
                    </td>
                    <td>{session.createdAt ? new Date(session.createdAt).toLocaleString() : 'N/A'}</td>
                    <td>{formatTime(calculateSessionDuration(session))}</td>
                    <td>
                      <div className="time-log-entry-actions" style={{ justifyContent: 'center' }}>
                        <button onClick={(e) => { e.stopPropagation(); handleSessionCommand({ command: 'restart_session', session }); }} className="icon-button-small" title="Restart Session (Load to Timer)">
                          <i className="fas fa-play-circle"></i>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleSessionCommand({ command: 'duplicate_session', session }); }} className="icon-button-small" title="Duplicate Session">
                          <i className="fas fa-copy"></i>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleSessionCommand({ command: 'copy_session', session }); }} className="icon-button-small" title="Copy Session as Text">
                          <i className="fas fa-paste"></i>
                        </button>
                        <button onClick={(e) => {
                          e.stopPropagation();
                          if (confirmingDeleteSession === session.id) { handleSessionCommand({ command: 'delete_session', session }); setConfirmingDeleteSession(null); if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
                          } else { setConfirmingDeleteSession(session.id); if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current); confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteSession(null), 3000); }
                        }} className={`icon-button-small ${confirmingDeleteSession === session.id ? 'confirm-delete' : ''}`} title="Delete Session">
                          <i className={`fas ${confirmingDeleteSession === session.id ? 'fa-check' : 'fa-trash'}`}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {openSessionIds.has(session.id) && (
                    <tr className="time-log-session-details-row">
                      <td colSpan={4}>
                        <div className="time-log-session-entries-header">                          
                          <span>Entries ({session.entries.length})</span>                          
                          <div className="time-log-session-header-actions">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const text = session.entries.map(entry => `${entry.description}: ${formatTime(entry.duration)}`).join('\n');
                                navigator.clipboard.writeText(text);
                                showToast('All entries copied!');
                              }}
                              className="icon-button-small"
                              title="Copy All Entries"
                            >
                              <i className="fas fa-paste"></i>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleClearSessionEntries(session.id); }}
                              className={`icon-button-small ${confirmingClearSession === session.id ? 'confirm-delete' : ''}`}
                              title="Clear All Entries in this Session"
                            >
                              <i className={`fas ${confirmingClearSession === session.id ? 'fa-check' : 'fa-broom'}`}></i>
                            </button>
                          </div>
                        </div>
                        <div className="time-log-session-entries">
                          {session.entries.map(entry => {
                            const isEditingDescription = editingSessionEntry?.sessionId === session.id && editingSessionEntry?.entryId === entry.id && editingSessionEntry?.field === 'description';
                            const isEditingDuration = editingSessionEntry?.sessionId === session.id && editingSessionEntry?.entryId === entry.id && editingSessionEntry?.field === 'duration';
                            return (
                            <div key={entry.id} className="time-log-entry">
                              <div className="time-log-entry-main">
                                <div className="entry-description" onDoubleClick={() => handleStartEditingSessionEntry(session, entry, 'description')}>
                                  {isEditingDescription ? (
                                    <input type="text" value={editingSessionEntryValue} onChange={(e) => setEditingSessionEntryValue(e.target.value)} onBlur={handleSaveSessionEntry} onKeyDown={(e) => e.key === 'Enter' && handleSaveSessionEntry()} className="inline-edit-input" autoFocus />
                                  ) : ( <span>{entry.description}</span> )}
                                </div>
                                <div className="entry-duration" onDoubleClick={() => handleStartEditingSessionEntry(session, entry, 'duration')}>
                                  {isEditingDuration ? (
                                    <input type="text" value={editingSessionEntryValue} onChange={(e) => setEditingSessionEntryValue(e.target.value)} onBlur={handleSaveSessionEntry} onKeyDown={(e) => e.key === 'Enter' && handleSaveSessionEntry()} className="inline-edit-input" style={{ textAlign: 'right', minWidth: '80px' }} autoFocus />
                                  ) : ( <span>{formatTime(entry.duration)}</span> )}
                                </div>
                              </div>
                              <div className="time-log-entry-actions" style={{ minWidth: '75px' }}>
                                <button onClick={() => {
                                  const textToCopy = `${entry.description}: ${formatTime(entry.duration)}`;
                                  navigator.clipboard.writeText(textToCopy);
                                  showToast('Entry copied!');
                                }} className="icon-button-small" title="Copy Entry">
                                  <i className="fas fa-copy"></i>
                                </button>
                                <button onClick={() => handleDeleteSessionEntry(session.id, entry.id)} className={`icon-button-small ${confirmingDeleteSessionEntry === entry.id ? 'confirm-delete' : ''}`} title="Delete Entry">
                                  <i className={`fas ${confirmingDeleteSessionEntry === entry.id ? 'fa-check' : 'fa-trash'}`}></i>
                                </button>
                              </div>
                            </div>
                          )})}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* --- END NEW SESSION RENDERING LOGIC --- */}
    </div>    
  );
}