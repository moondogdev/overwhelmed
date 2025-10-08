import React from 'react';
import { Task, TimeLogEntry } from '../types';
import { formatTime } from '../utils';

interface TimeLogHeaderProps {
    task: Task;
    onUpdate: (updatedTask: Task) => void;
    showToast: (message: string) => void;
    totalTime: number;
    timeLog: TimeLogEntry[];
    isEditingTitle: boolean;
    setIsEditingTitle: (isEditing: boolean) => void;
    liveTimerTitle: string;
    setLiveTimerTitle: (title: string) => void;
    activeTimerTaskId: number | null;
    activeTimerEntry: TimeLogEntry | null;
    handlePreviousEntry: () => void;
    handleNextEntry: () => void;
    handlePostLog: (taskId: number) => void;
    handlePostAndResetLog: (taskId: number) => void;
    handleAddNewEntry: () => void;
    handleResetAllEntries: () => void;
    confirmingResetAll: boolean;
    handleClearEntries: () => void;
    confirmingDeleteAll: boolean;
    handleDeleteAll: () => void;
}

export const TimeLogHeader: React.FC<TimeLogHeaderProps> = ({
    task, onUpdate, showToast, totalTime, timeLog, isEditingTitle, setIsEditingTitle,
    liveTimerTitle, setLiveTimerTitle, activeTimerTaskId, activeTimerEntry,
    handlePreviousEntry, handleNextEntry, handlePostLog, handlePostAndResetLog,
    handleAddNewEntry, handleResetAllEntries, confirmingResetAll, handleClearEntries,
    confirmingDeleteAll, handleDeleteAll
}) => {
    return (
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
                            onUpdate({ ...task, timeLogTitle: liveTimerTitle });
                            setIsEditingTitle(false);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Escape') {
                                onUpdate({ ...task, timeLogTitle: liveTimerTitle });
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
                const timeLog = task.timeLog || [];
                const isTimerActiveForThisTask = activeTimerTaskId === task.id && activeTimerEntry;
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
                    handlePostLog(task.id);
                    showToast('Session logged!');
                }} className="icon-button" title="Post and Clear Log">
                    <i className="fas fa-paper-plane"></i>
                </button>
                <button onClick={() => {
                    handlePostAndResetLog(task.id);
                    showToast('Session logged and timer reset.');
                }} className="icon-button" title="Post and Reset Durations" disabled={!timeLog || timeLog.length === 0}>
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
    );
};