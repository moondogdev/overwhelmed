import React, { useRef } from 'react';
import { TimeLogSession, TimeLogEntry } from '../types';
import { formatTime } from '../utils';

interface TimeLogSessionItemProps {
    session: TimeLogSession;
    isOpen: boolean;
    onToggle: (sessionId: number) => void;
    editingSessionId: number | null;
    editingSessionTitle: string;
    setEditingSessionTitle: (title: string) => void;
    handleUpdateSessionTitle: (sessionId: number) => void;
    sessionInputRef: React.RefObject<HTMLInputElement>;
    confirmingDeleteSession: number | null;
    setConfirmingDeleteSession: (id: number | null) => void;
    handleSessionCommand: (payload: { command: string; session: TimeLogSession }) => void;
    calculateSessionDuration: (session: TimeLogSession) => number;
    showToast: (message: string) => void;
    handleClearSessionEntries: (sessionId: number) => void;
    confirmingClearSession: number | null;
    editingSessionEntry: { sessionId: number; entryId: number; field: 'description' | 'duration' } | null;
    editingSessionEntryValue: string;
    setEditingSessionEntryValue: (value: string) => void;
    handleStartEditingSessionEntry: (session: TimeLogSession, entry: TimeLogEntry, field: 'description' | 'duration') => void;
    handleSaveSessionEntry: () => void;
    handleDeleteSessionEntry: (sessionId: number, entryId: number) => void;
    confirmingDeleteSessionEntry: number | null;
}

export const TimeLogSessionItem: React.FC<TimeLogSessionItemProps> = ({
    session, isOpen, onToggle, editingSessionId, editingSessionTitle, setEditingSessionTitle,
    handleUpdateSessionTitle, sessionInputRef, confirmingDeleteSession, setConfirmingDeleteSession,
    handleSessionCommand, calculateSessionDuration, showToast, handleClearSessionEntries,
    confirmingClearSession, editingSessionEntry, editingSessionEntryValue, setEditingSessionEntryValue,
    handleStartEditingSessionEntry, handleSaveSessionEntry, handleDeleteSessionEntry, confirmingDeleteSessionEntry
}) => {
    const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    return (
        <React.Fragment>
            <tr
                className="time-log-session-item"
                onClick={() => onToggle(session.id)}
                onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.electronAPI.showTimeLogSessionContextMenu({ session, x: e.clientX, y: e.clientY });
                }}
            >
                <td onDoubleClick={(e) => { e.stopPropagation(); handleSessionCommand({ command: 'edit_title', session }); }}>
                    <i className={`fas ${isOpen ? 'fa-chevron-down' : 'fa-chevron-right'}`} style={{ marginRight: '8px' }}></i>
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
                            if (confirmingDeleteSession === session.id) {
                                handleSessionCommand({ command: 'delete_session', session });
                                setConfirmingDeleteSession(null);
                                if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
                            } else {
                                setConfirmingDeleteSession(session.id);
                                if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
                                confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteSession(null), 3000);
                            }
                        }} className={`icon-button-small ${confirmingDeleteSession === session.id ? 'confirm-delete' : ''}`} title="Delete Session">
                            <i className={`fas ${confirmingDeleteSession === session.id ? 'fa-check' : 'fa-trash'}`}></i>
                        </button>
                    </div>
                </td>
            </tr>
            {isOpen && (
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
                                                ) : (<span>{entry.description}</span>)}
                                            </div>
                                            <div className="entry-duration" onDoubleClick={() => handleStartEditingSessionEntry(session, entry, 'duration')}>
                                                {isEditingDuration ? (
                                                    <input type="text" value={editingSessionEntryValue} onChange={(e) => setEditingSessionEntryValue(e.target.value)} onBlur={handleSaveSessionEntry} onKeyDown={(e) => e.key === 'Enter' && handleSaveSessionEntry()} className="inline-edit-input" style={{ textAlign: 'right', minWidth: '80px' }} autoFocus />
                                                ) : (<span>{formatTime(entry.duration)}</span>)}
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
                                )
                            })}
                        </div>
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
};