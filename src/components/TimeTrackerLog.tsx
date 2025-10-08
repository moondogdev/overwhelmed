import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Task, TimeLogEntry, TimeLogSession, ChecklistSection } from '../types';
import { formatTime, parseTime, formatTimeLogSessionForCopy } from '../utils';
import { useTimeTracker } from '../hooks/useTimeTracker';
import { TimeLogHeader } from './TimeLogHeader';
import { TimeLogSessionItem } from './TimeLogSessionItem';
import { TimeLogEntryItem } from './TimeLogEntryItem';
import './styles/TimeTrackerLog.css';
interface TimeTrackerLogProps {
  task: Task;
  onUpdate: (updatedTask: Task) => void;
  showToast: (message: string, duration?: number, type?: 'success' | 'error' | 'info') => void;
  handleGlobalToggleTimer: (taskId: number, entryId: number) => void;
  activeTimerTaskId: number | null;
  activeTimerEntry: TimeLogEntry | null;
  activeTimerLiveTime: number;
  handleGlobalStopTimer: () => void;  
  handleClearActiveTimer: () => void;
  handleGlobalResetTimer: (taskId: number, entryId: number) => void;
  handleNextEntry: () => void;
  handlePreviousEntry: () => void;
  handlePostLog: (taskId: number) => void;
  handlePostAndResetLog: (taskId: number) => void;
  handleResetAllLogEntries: (taskId: number) => void;
  handlePostAndComplete: (taskId: number, entryId: number, onUpdate: (updatedTask: Task) => void) => void;
  settings: any; // Add settings to props
  checklistRef?: React.MutableRefObject<{ handleUndo: () => void; handleRedo: () => void; resetHistory: (sections: ChecklistSection[]) => void; }>;
}

export function TimeTrackerLog({ 
  task, 
  onUpdate, 
  showToast,
  handleGlobalToggleTimer,
  activeTimerTaskId,
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
  const {
    editingEntryId, editingEntryDescription, setEditingEntryDescription, editingEntryDuration, setEditingEntryDuration, confirmingDeleteEntry,
    bulkAddText, setBulkAddText, confirmingDeleteAll, confirmingResetAll, liveTimerTitle,
    setLiveTimerTitle, editingSessionId, editingSessionTitle, setEditingSessionTitle, openSessionIds, isEditingTitle,
    setIsEditingTitle, confirmingDeleteSessionEntry, confirmingDeleteSession, setConfirmingDeleteSession,
    confirmingDeleteAllSessions, confirmingClearSession, editingSessionEntry,
    editingSessionEntryValue, setEditingSessionEntryValue, entryInputRef, sessionInputRef, handleResetAllEntries,
    handleUpdateLog, handleAddNewEntry, handleDeleteEntry, handleSessionCommand, handleStartEditing,
    handleStartEditingDuration, handleMoveEntry, handleItemCommand, handleSaveEdit,
    handleSaveDurationEdit, handleDeleteAll, handleClearEntries, handleBulkAdd,
    handleUpdateSessionTitle, handleClearAllSessions, handleClearSessionEntries,
    handleStartEditingSessionEntry, handleSaveSessionEntry, handleDeleteSessionEntry,
    handleToggleSession, calculateSessionDuration, totalSessionsTime, sessionSortConfig,
    setSessionSortConfig, sortedSessions,
  } = useTimeTracker({ task, onUpdate, showToast, checklistRef, handlePostAndComplete, handleResetAllLogEntries });

  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to handle commands from the context menus
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
        case 'clear_entries': handleClearEntries(); break;
        case 'delete_all': handleDeleteAll(); showToast('Timer Wiped!'); break;
        case 'add_new_line': handleAddNewEntry(); showToast('New Timer Line Added!'); break;
      }
    };

    const cleanupItem = window.electronAPI.on('time-log-item-command', handleItemCommand);
    const cleanupHeader = window.electronAPI.on('time-log-header-command', handleHeaderCommand);
    return () => { cleanupItem?.(); cleanupHeader?.(); };
  }, [task.timeLog, handleUpdateLog, handleAddNewEntry, showToast, handleItemCommand, handleClearEntries, handleDeleteAll]);

  const timeLog = task.timeLog || [];
  const runningEntry = timeLog.find(entry => entry.isRunning);

  const totalTime = timeLog.reduce((sum, entry) => {
    const isThisEntryRunning = activeTimerTaskId === task.id && activeTimerEntry?.id === entry.id;
    return sum + entry.duration + (isThisEntryRunning ? (activeTimerLiveTime - entry.duration) : 0);
  }, 0);

  return (
    <div className="time-tracker-log" style={{width: '100%'}}>
      <TimeLogHeader
        task={task}
        onUpdate={onUpdate}
        showToast={showToast}
        totalTime={totalTime}
        timeLog={timeLog}
        isEditingTitle={isEditingTitle}
        setIsEditingTitle={setIsEditingTitle}
        liveTimerTitle={liveTimerTitle}
        setLiveTimerTitle={setLiveTimerTitle}
        activeTimerTaskId={activeTimerTaskId}
        activeTimerEntry={activeTimerEntry}
        handlePreviousEntry={handlePreviousEntry}
        handleNextEntry={handleNextEntry}
        handlePostLog={handlePostLog}
        handlePostAndResetLog={handlePostAndResetLog}
        handleAddNewEntry={handleAddNewEntry}
        handleResetAllEntries={handleResetAllEntries}
        confirmingResetAll={confirmingResetAll}
        handleClearEntries={handleClearEntries}
        confirmingDeleteAll={confirmingDeleteAll}
        handleDeleteAll={handleDeleteAll}
      />
      <div className="time-log-entries">
        {timeLog.map((entry, index) => {
          return (
            <TimeLogEntryItem
              key={entry.id}
              task={task} entry={entry} index={index} timeLog={timeLog}
              activeTimerTaskId={activeTimerTaskId} activeTimerEntry={activeTimerEntry} activeTimerLiveTime={activeTimerLiveTime}
              editingEntryId={editingEntryId} editingEntryDescription={editingEntryDescription} setEditingEntryDescription={setEditingEntryDescription}
              editingEntryDuration={editingEntryDuration} setEditingEntryDuration={setEditingEntryDuration}
              confirmingDeleteEntry={confirmingDeleteEntry} entryInputRef={entryInputRef}
              handleGlobalToggleTimer={handleGlobalToggleTimer} handleStartEditing={handleStartEditing}
              handleSaveEdit={handleSaveEdit} handleStartEditingDuration={handleStartEditingDuration}
              handleSaveDurationEdit={handleSaveDurationEdit} handlePostAndComplete={handlePostAndComplete}
              onUpdate={onUpdate} handleGlobalResetTimer={handleGlobalResetTimer}
              handleUpdateLog={handleUpdateLog} handleMoveEntry={handleMoveEntry} handleDeleteEntry={handleDeleteEntry}
            />
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
      {(task.timeLogSessions && task.timeLogSessions.length > 0) && (
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
                <TimeLogSessionItem
                  key={session.id}
                  session={session}
                  isOpen={openSessionIds.has(session.id)}
                  onToggle={handleToggleSession}
                  editingSessionId={editingSessionId}
                  editingSessionTitle={editingSessionTitle}
                  setEditingSessionTitle={setEditingSessionTitle}
                  handleUpdateSessionTitle={handleUpdateSessionTitle}
                  sessionInputRef={sessionInputRef}
                  confirmingDeleteSession={confirmingDeleteSession}
                  setConfirmingDeleteSession={setConfirmingDeleteSession}
                  handleSessionCommand={handleSessionCommand}
                  calculateSessionDuration={calculateSessionDuration}
                  showToast={showToast}
                  handleClearSessionEntries={handleClearSessionEntries}
                  confirmingClearSession={confirmingClearSession}
                  editingSessionEntry={editingSessionEntry}
                  editingSessionEntryValue={editingSessionEntryValue}
                  setEditingSessionEntryValue={setEditingSessionEntryValue}
                  handleStartEditingSessionEntry={handleStartEditingSessionEntry}
                  handleSaveSessionEntry={handleSaveSessionEntry}
                  handleDeleteSessionEntry={handleDeleteSessionEntry}
                  confirmingDeleteSessionEntry={confirmingDeleteSessionEntry}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* --- END NEW SESSION RENDERING LOGIC --- */}
    </div>    
  );
}