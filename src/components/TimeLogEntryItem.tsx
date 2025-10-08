import React from 'react';
import { Task, TimeLogEntry } from '../types';
import { formatTime } from '../utils';

interface TimeLogEntryItemProps {
    task: Task;
    entry: TimeLogEntry;
    index: number;
    timeLog: TimeLogEntry[];
    activeTimerTaskId: number | null;
    activeTimerEntry: TimeLogEntry | null;
    activeTimerLiveTime: number;
    editingEntryId: number | null;
    editingEntryDescription: string;
    setEditingEntryDescription: (value: string) => void;
    editingEntryDuration: string;
    setEditingEntryDuration: (value: string) => void;
    confirmingDeleteEntry: number | null;
    entryInputRef: React.RefObject<HTMLInputElement>;
    handleGlobalToggleTimer: (taskId: number, entryId: number) => void;
    handleStartEditing: (entry: TimeLogEntry) => void;
    handleSaveEdit: () => void;
    handleStartEditingDuration: (entry: TimeLogEntry) => void;
    handleSaveDurationEdit: () => void;
    handlePostAndComplete: (taskId: number, entryId: number, onUpdate: (updatedTask: Task) => void) => void;
    onUpdate: (updatedTask: Task) => void;
    handleGlobalResetTimer: (taskId: number, entryId: number) => void;
    handleUpdateLog: (newTimeLog: TimeLogEntry[]) => void;
    handleMoveEntry: (entryId: number, direction: 'up' | 'down') => void;
    handleDeleteEntry: (entryId: number) => void;
}

export const TimeLogEntryItem: React.FC<TimeLogEntryItemProps> = ({
    task,
    entry,
    index,
    timeLog,
    activeTimerTaskId,
    activeTimerEntry,
    activeTimerLiveTime,
    editingEntryId,
    editingEntryDescription,
    setEditingEntryDescription,
    editingEntryDuration,
    setEditingEntryDuration,
    confirmingDeleteEntry,
    entryInputRef,
    handleGlobalToggleTimer,
    handleStartEditing,
    handleSaveEdit,
    handleStartEditingDuration,
    handleSaveDurationEdit,
    handlePostAndComplete,
    onUpdate,
    handleGlobalResetTimer,
    handleUpdateLog,
    handleMoveEntry,
    handleDeleteEntry,
}) => {
    if (entry.type === 'header') {
        return (
            <div key={entry.id} className="time-log-header-entry">
                {entry.description}
            </div>
        );
    }

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
                <button onClick={() => handleGlobalToggleTimer(task.id, entry.id)} className="icon-button-small" title={entry.isRunning ? 'Pause' : 'Start'}>
                    <i className={`fas ${entry.isRunning ? 'fa-pause-circle' : 'fa-play-circle'}`} style={{ color: entry.isRunning ? (activeTimerEntry?.id === entry.id ? '#f44336' : '#4CAF50') : '#4CAF50' }}></i>
                </button>
                <div className="entry-description" onDoubleClick={() => handleStartEditing(entry)}>
                    {editingEntryId === entry.id ? (
                        <input ref={entryInputRef} type="text" value={editingEntryDescription} onChange={(e) => setEditingEntryDescription(e.target.value)} onBlur={handleSaveEdit} onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()} className="inline-edit-input" />
                    ) : (<span>{entry.description}</span>)}
                </div>
                {editingEntryId === entry.id && editingEntryDuration ? (
                    <input type="text" value={editingEntryDuration} onChange={(e) => setEditingEntryDuration(e.target.value)} onBlur={handleSaveDurationEdit} onKeyDown={(e) => e.key === 'Enter' && handleSaveDurationEdit()} className="inline-edit-input" style={{ textAlign: 'right', minWidth: '80px' }} autoFocus />
                ) : (
                    <span className="entry-duration" onDoubleClick={() => handleStartEditingDuration(entry)}>
                        {formatTime(activeTimerTaskId === task.id && activeTimerEntry?.id === entry.id ? activeTimerLiveTime : entry.duration)}
                    </span>
                )}
            </div>
            <div className="time-log-entry-actions">
                {entry.checklistItemId && (
                    <button onClick={() => handlePostAndComplete(task.id, entry.id, onUpdate)} className="icon-button-small" title="Toggle Checklist Item Complete"><i className="fas fa-check-square"></i></button>
                )}
                <button onClick={() => handleStartEditing(entry)} className="icon-button-small" title="Edit Description"><i className="fas fa-pencil-alt"></i></button>
                <button onClick={() => handleGlobalResetTimer(task.id, entry.id)} className="icon-button-small" title="Reset Duration"><i className="fas fa-undo"></i></button>
                <button onClick={() => {
                    const newEntry: TimeLogEntry = { ...entry, id: Date.now() + Math.random(), isRunning: false, startTime: undefined };
                    const newTimeLog = [...(task.timeLog || [])];
                    newTimeLog.splice(index + 1, 0, newEntry);
                    handleUpdateLog(newTimeLog);
                }} className="icon-button-small" title="Duplicate Entry"><i className="fas fa-copy"></i></button>
                <button onClick={() => handleMoveEntry(entry.id, 'up')} className="icon-button-small" title="Move Up" disabled={index === 0}><i className="fas fa-arrow-up"></i></button>
                <button onClick={() => handleMoveEntry(entry.id, 'down')} className="icon-button-small" title="Move Down" disabled={index === timeLog.length - 1}><i className="fas fa-arrow-down"></i></button>
                <button onClick={() => handleDeleteEntry(entry.id)} className={`icon-button-small ${confirmingDeleteEntry === entry.id ? 'confirm-delete' : ''}`} title="Delete Entry"><i className={`fas ${confirmingDeleteEntry === entry.id ? 'fa-check' : 'fa-trash'}`}></i></button>
            </div>
        </div>
    );
};