import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Task, TimeLogEntry, TimeLogSession, ChecklistSection } from '../types';
import { formatTime, parseTime, formatTimeLogSessionForCopy } from '../utils';

interface UseTimeTrackerProps {
    task: Task;
    onUpdate: (updatedTask: Task) => void;
    showToast: (message: string, duration?: number, type?: 'success' | 'error' | 'info') => void;
    checklistRef?: React.MutableRefObject<{ handleUndo: () => void; handleRedo: () => void; resetHistory: (sections: ChecklistSection[]) => void; }>;
    handlePostAndComplete: (taskId: number, entryId: number, onUpdate: (updatedTask: Task) => void) => void;    
    handleResetAllLogEntries: (taskId: number) => void;
}

interface UseTimeTrackerReturn {
    editingEntryId: number | null;
    editingEntryDescription: string;
    setEditingEntryDescription: React.Dispatch<React.SetStateAction<string>>;
    editingEntryDuration: string;
    setEditingEntryDuration: React.Dispatch<React.SetStateAction<string>>;
    confirmingDeleteEntry: number | null;
    bulkAddText: string;
    setBulkAddText: React.Dispatch<React.SetStateAction<string>>;
    confirmingDeleteAll: boolean;
    confirmingResetAll: boolean;
    liveTimerTitle: string;
    setLiveTimerTitle: React.Dispatch<React.SetStateAction<string>>;
    editingSessionId: number | null;
    editingSessionTitle: string;
    setEditingSessionTitle: React.Dispatch<React.SetStateAction<string>>;
    openSessionIds: Set<number>;
    isEditingTitle: boolean;
    setIsEditingTitle: React.Dispatch<React.SetStateAction<boolean>>;
    confirmingDeleteSessionEntry: number | null;
    confirmingDeleteSession: number | null;
    setConfirmingDeleteSession: React.Dispatch<React.SetStateAction<number | null>>;
    confirmingDeleteAllSessions: boolean;
    confirmingClearSession: number | null;
    editingSessionEntry: { sessionId: number; entryId: number; field: 'description' | 'duration' } | null;
    editingSessionEntryValue: string;
    setEditingSessionEntryValue: React.Dispatch<React.SetStateAction<string>>;
    entryInputRef: React.RefObject<HTMLInputElement>;
    sessionInputRef: React.RefObject<HTMLInputElement>;
    handleUpdateLog: (newTimeLog: TimeLogEntry[]) => void;
    handleAddNewEntry: () => void;
    handleDeleteEntry: (id: number) => void;
    handleSessionCommand: (payload: { command: string; session: TimeLogSession; }) => void;
    handleStartEditing: (entry: TimeLogEntry) => void;
    handleStartEditingDuration: (entry: TimeLogEntry) => void;
    handleMoveEntry: (entryId: number, direction: 'up' | 'down') => void;
    handleItemCommand: (payload: { command: string; entryId?: number; }) => void;
    handleSaveEdit: () => void;
    handleSaveDurationEdit: () => void;
    handleDeleteAll: () => void;
    handleClearEntries: () => void;
    handleResetAllEntries: () => void;
    handleBulkAdd: () => void;
    handleUpdateSessionTitle: (sessionId: number) => void;
    handleClearAllSessions: () => void;
    handleClearSessionEntries: (sessionId: number) => void;
    handleStartEditingSessionEntry: (session: TimeLogSession, entry: TimeLogEntry, field: 'description' | 'duration') => void;
    handleSaveSessionEntry: () => void;
    handleDeleteSessionEntry: (sessionId: number, entryId: number) => void;
    handleToggleSession: (sessionId: number) => void;
    calculateSessionDuration: (session: TimeLogSession) => number;
    totalSessionsTime: number;
    sessionSortConfig: { key: 'title' | 'createdAt' | 'totalTime'; direction: 'ascending' | 'descending'; };
    setSessionSortConfig: React.Dispatch<React.SetStateAction<{ key: 'title' | 'createdAt' | 'totalTime'; direction: 'ascending' | 'descending'; }>>;
    sortedSessions: TimeLogSession[];
}

export function useTimeTracker({ task, onUpdate, showToast, checklistRef, handlePostAndComplete, handleResetAllLogEntries }: UseTimeTrackerProps): UseTimeTrackerReturn {
    const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
    const [editingEntryDescription, setEditingEntryDescription] = useState('');
    const [editingEntryDuration, setEditingEntryDuration] = useState('');
    const [confirmingDeleteEntry, setConfirmingDeleteEntry] = useState<number | null>(null);
    const [bulkAddText, setBulkAddText] = useState('');
    const [confirmingDeleteAll, setConfirmingDeleteAll] = useState(false);
    const [confirmingResetAll, setConfirmingResetAll] = useState(false);

    // State for session management
    const [liveTimerTitle, setLiveTimerTitle] = useState(task.timeLogTitle || 'Work Timer');
    const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
    const [editingSessionTitle, setEditingSessionTitle] = useState('');
    const [openSessionIds, setOpenSessionIds] = useState<Set<number>>(new Set());
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [confirmingDeleteSessionEntry, setConfirmingDeleteSessionEntry] = useState<number | null>(null);
    const [confirmingDeleteSession, setConfirmingDeleteSession] = useState<number | null>(null);
    const [confirmingDeleteAllSessions, setConfirmingDeleteAllSessions] = useState(false);
    const [confirmingClearSession, setConfirmingClearSession] = useState<number | null>(null);
    const [editingSessionEntry, setEditingSessionEntry] = useState<{ sessionId: number; entryId: number; field: 'description' | 'duration' } | null>(null);
    const [editingSessionEntryValue, setEditingSessionEntryValue] = useState('');

    const entryInputRef = useRef<HTMLInputElement>(null);
    const sessionInputRef = useRef<HTMLInputElement>(null);
    const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setLiveTimerTitle(task.timeLogTitle || 'Work Timer');
    }, [task.timeLogTitle]);

    useEffect(() => {
        if ((!task.timeLog || task.timeLog.length === 0) && (task.manualTime || 0) > 0 && !task.timeLogSessions) {
            const legacyEntry: TimeLogEntry = {
                id: Date.now(),
                description: 'Legacy Timed Entry',
                duration: task.manualTime || 0,
                isRunning: false,
                createdAt: Date.now(),
            };
            onUpdate({ ...task, timeLog: [legacyEntry] });
        }
    }, [task.timeLog, task.manualTime, onUpdate, task.timeLogSessions]);

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
        onUpdate({ ...task, timeLog: newTimeLog });
    }, [task, onUpdate]);

    const handleAddNewEntry = useCallback(() => {
        const newEntry: TimeLogEntry = {
            id: Date.now() + Math.random(),
            description: 'New Entry',
            duration: 0,
            isRunning: false,
            createdAt: Date.now(),
        };
        const newTimeLog = [...(task.timeLog || []), newEntry];
        handleUpdateLog(newTimeLog);
        setEditingEntryId(newEntry.id);
        setEditingEntryDescription(newEntry.description);
    }, [task.timeLog, handleUpdateLog]);

    const handleDeleteEntry = useCallback((id: number) => {
        if (confirmingDeleteEntry === id) {
            const newTimeLog = (task.timeLog || []).filter(entry => entry.id !== id);
            handleUpdateLog(newTimeLog);
            setConfirmingDeleteEntry(null);
            if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
        } else {
            setConfirmingDeleteEntry(id);
            if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
            confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteEntry(null), 3000);
        }
    }, [confirmingDeleteEntry, task.timeLog, handleUpdateLog]);

    const handleSessionCommand = useCallback((payload: { command: string, session: TimeLogSession }) => {
        const { command, session: targetSession } = payload;
        const currentSessions = task.timeLogSessions || [];

        switch (command) {
            case 'edit_title':
                setEditingSessionId(targetSession.id);
                setEditingSessionTitle(targetSession.title);
                break;
            case 'clear_entries':
                onUpdate({ ...task, timeLogSessions: currentSessions.map(s => s.id === targetSession.id ? { ...s, entries: [] } : s) });
                showToast('Session entries cleared.');
                break;
            case 'delete_session':
                onUpdate({ ...task, timeLogSessions: currentSessions.filter(s => s.id !== targetSession.id) });
                showToast('Session deleted.');
                break;
            case 'duplicate_session':
                const newSession: TimeLogSession = { ...targetSession, id: Date.now() + Math.random(), title: `${targetSession.title} (Copy)` };
                onUpdate({ ...task, timeLogSessions: [...currentSessions, newSession] });
                showToast('Session duplicated.');
                break;
            case 'copy_session':
                navigator.clipboard.writeText(formatTimeLogSessionForCopy(targetSession));
                showToast('Session copied as text!');
                break;
            case 'restart_session':
                let updatedTask = { ...task };
                if (task.timeLog && task.timeLog.length > 0) {
                    const newSession: TimeLogSession = { id: Date.now() + Math.random(), title: task.timeLogTitle || `Unsaved Session - ${new Date().toLocaleTimeString()}`, entries: task.timeLog, createdAt: Date.now() };
                    updatedTask.timeLogSessions = [...(task.timeLogSessions || []), newSession];
                    showToast(`Current session saved as "${newSession.title}".`);
                }
                updatedTask.timeLog = targetSession.entries.map((entry): TimeLogEntry => ({ ...entry, id: Date.now() + Math.random(), isRunning: false, startTime: undefined, createdAt: Date.now() }));
                updatedTask.timeLogTitle = targetSession.title;
                onUpdate(updatedTask);
                showToast(`Session "${targetSession.title}" loaded into timer.`);
                break;
        }
    }, [task, onUpdate, showToast]);

    const handleStartEditing = useCallback((entry: TimeLogEntry) => {
        setEditingEntryId(entry.id);
        setEditingEntryDescription(entry.description);
    }, []);

    const handleStartEditingDuration = useCallback((entry: TimeLogEntry) => {
        setEditingEntryId(entry.id);
        setEditingEntryDuration(formatTime(entry.duration));
    }, []);

    const handleMoveEntry = useCallback((entryId: number, direction: 'up' | 'down') => {
        const newTimeLog = [...(task.timeLog || [])];
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
    }, [task.timeLog, handleUpdateLog]);

    const handleItemCommand = useCallback((payload: { command: string, entryId?: number }) => {
        const { command, entryId } = payload;
        const entry = (task.timeLog || []).find(e => e.id === entryId);
        switch (command) {
            case 'edit_description': if (entry) handleStartEditing(entry); break;
            case 'delete': if (entryId) handleDeleteEntry(entryId); break;
            case 'duplicate': {
                if (!entry) break;
                const newEntry: TimeLogEntry = { ...entry, id: Date.now() + Math.random(), isRunning: false, startTime: undefined };
                const newTimeLog = [...(task.timeLog || [])];
                const index = newTimeLog.findIndex(e => e.id === entryId);
                if (index === -1) break;
                newTimeLog.splice(index + 1, 0, newEntry);
                handleUpdateLog(newTimeLog);
                break;
            }
            case 'move_up': if (entryId) handleMoveEntry(entryId, 'up'); break;
            case 'move_down': if (entryId) handleMoveEntry(entryId, 'down'); break;
            case 'post_and_complete': if (entryId) handlePostAndComplete(task.id, entryId, onUpdate); break;
        }
    }, [task.id, task.timeLog, handleStartEditing, handleDeleteEntry, handleUpdateLog, handleMoveEntry, handlePostAndComplete, onUpdate]);

    const handleSaveEdit = () => {
        if (editingEntryId === null) return;
        const newTimeLog = (task.timeLog || []).map(entry => entry.id === editingEntryId ? { ...entry, description: editingEntryDescription } : entry);
        handleUpdateLog(newTimeLog);
        setEditingEntryId(null);
    };

    const handleSaveDurationEdit = () => {
        if (editingEntryId === null) return;
        const newDuration = parseTime(editingEntryDuration);
        const newTimeLog = (task.timeLog || []).map(entry => entry.id === editingEntryId ? { ...entry, duration: newDuration } : entry);
        handleUpdateLog(newTimeLog);
        setEditingEntryId(null);
        setEditingEntryDuration('');
    };

    const handleDeleteAll = () => {
        if (confirmingDeleteAll) {
            const updatedChecklist = (task.checklist || []).map(sectionOrItem => {
                if ('items' in sectionOrItem) {
                    return { ...sectionOrItem, items: sectionOrItem.items.map(item => { const { loggedTime, ...rest } = item; return rest; }) };
                }
                return sectionOrItem;
            }) as ChecklistSection[];
            onUpdate({ ...task, timeLog: [], timeLogTitle: undefined, checklist: updatedChecklist as any });
            checklistRef?.current?.resetHistory(updatedChecklist);
            setLiveTimerTitle('Work Timer');
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
        if (confirmingDeleteAll) {
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
            handleResetAllLogEntries(task.id);
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
        let updatedTask = { ...task };
        let potentialTitle: string | null = null;
        const separatorIndex = allLines.findIndex(line => line.startsWith('---') || line.startsWith('Total Duration:'));
        if (separatorIndex > 0) {
            for (let i = 0; i < separatorIndex; i++) {
                if (allLines[i]) {
                    potentialTitle = allLines[i];
                    break;
                }
            }
        }
        if (potentialTitle) {
            setLiveTimerTitle(potentialTitle);
            updatedTask.timeLogTitle = potentialTitle;
        }
        const entryLines = allLines.filter(line => line && !line.startsWith('---') && !line.startsWith('Total Duration:') && line !== potentialTitle);
        const newEntries: TimeLogEntry[] = entryLines.map(line => {
            const timeRegex = /(\d{2}:\d{2}:\d{2})$/;
            const match = line.match(timeRegex);
            const description = match ? line.substring(0, match.index).trim().replace(/:$/, '').trim() : line.trim();
            const duration = match ? parseTime(match[0]) : 0;
            return { id: Date.now() + Math.random(), description, duration, isRunning: false, createdAt: Date.now() };
        });
        updatedTask.timeLog = [...(task.timeLog || []), ...newEntries];
        setBulkAddText('');
        onUpdate(updatedTask);
    };

    const handleUpdateSessionTitle = (sessionId: number) => {
        const updatedSessions = (task.timeLogSessions || []).map(session => session.id === sessionId ? { ...session, title: editingSessionTitle } : session);
        onUpdate({ ...task, timeLogSessions: updatedSessions });
        setEditingSessionId(null);
    };

    const handleClearAllSessions = () => {
        if (confirmingDeleteAllSessions) {
            onUpdate({ ...task, timeLogSessions: [] });
            showToast('All time log sessions cleared.');
            setConfirmingDeleteAllSessions(false);
            if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
        } else {
            setConfirmingDeleteAllSessions(true);
            if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
            confirmTimeoutRef.current = setTimeout(() => setConfirmingDeleteAllSessions(false), 3000);
        }
    };

    const handleClearSessionEntries = (sessionId: number) => {
        if (confirmingClearSession === sessionId) {
            const updatedSessions = (task.timeLogSessions || []).map(session => session.id === sessionId ? { ...session, entries: [] } : session);
            onUpdate({ ...task, timeLogSessions: updatedSessions });
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
        setEditingSessionEntryValue(field === 'description' ? entry.description : formatTime(entry.duration));
    };

    const handleSaveSessionEntry = () => {
        if (!editingSessionEntry) return;
        const { sessionId, entryId, field } = editingSessionEntry;
        const updatedSessions = (task.timeLogSessions || []).map(session => {
            if (session.id !== sessionId) return session;
            const updatedEntries = session.entries.map(entry => {
                if (entry.id !== entryId) return entry;
                return field === 'description' ? { ...entry, description: editingSessionEntryValue } : { ...entry, duration: parseTime(editingSessionEntryValue) };
            });
            return { ...session, entries: updatedEntries };
        });
        onUpdate({ ...task, timeLogSessions: updatedSessions });
        setEditingSessionEntry(null);
        setEditingSessionEntryValue('');
    };

    const handleDeleteSessionEntry = (sessionId: number, entryId: number) => {
        if (confirmingDeleteSessionEntry === entryId) {
            const updatedSessions = (task.timeLogSessions || []).map(session => {
                if (session.id !== sessionId) return session;
                return { ...session, entries: session.entries.filter(entry => entry.id !== entryId) };
            });
            onUpdate({ ...task, timeLogSessions: updatedSessions });
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
            newSet.has(sessionId) ? newSet.delete(sessionId) : newSet.add(sessionId);
            return newSet;
        });
    };

    const calculateSessionDuration = (session: TimeLogSession) => session.entries.reduce((acc, entry) => acc + entry.duration, 0);

    const totalSessionsTime = useMemo(() => (task.timeLogSessions || []).reduce((total, session) => total + calculateSessionDuration(session), 0), [task.timeLogSessions]);

    const [sessionSortConfig, setSessionSortConfig] = useState<{ key: 'title' | 'createdAt' | 'totalTime', direction: 'ascending' | 'descending' }>({ key: 'createdAt', direction: 'descending' });

    const sortedSessions = useMemo(() => {
        const sessions = task.timeLogSessions || [];
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
    }, [task.timeLogSessions, sessionSortConfig]);

    return {
        editingEntryId,
        editingEntryDescription,
        setEditingEntryDescription,
        editingEntryDuration,
        setEditingEntryDuration,
        confirmingDeleteEntry,
        bulkAddText,
        setBulkAddText,
        confirmingDeleteAll,
        confirmingResetAll,
        liveTimerTitle,
        setLiveTimerTitle,
        editingSessionId,
        editingSessionTitle,
        setEditingSessionTitle,
        openSessionIds,
        isEditingTitle,
        setIsEditingTitle,
        confirmingDeleteSessionEntry,
        confirmingDeleteSession,
        setConfirmingDeleteSession,
        confirmingDeleteAllSessions,
        confirmingClearSession,
        editingSessionEntry,
        editingSessionEntryValue,
        setEditingSessionEntryValue,
        entryInputRef,
        sessionInputRef,
        handleUpdateLog,
        handleAddNewEntry,
        handleDeleteEntry,
        handleSessionCommand,
        handleStartEditing,
        handleStartEditingDuration,
        handleMoveEntry,
        handleItemCommand,
        handleSaveEdit,
        handleSaveDurationEdit,
        handleDeleteAll,
        handleClearEntries,
        handleResetAllEntries,
        handleBulkAdd,
        handleUpdateSessionTitle,
        handleClearAllSessions,
        handleClearSessionEntries,
        handleStartEditingSessionEntry,
        handleSaveSessionEntry,
        handleDeleteSessionEntry,
        handleToggleSession,
        calculateSessionDuration,
        totalSessionsTime,
        sessionSortConfig,
        setSessionSortConfig,
        sortedSessions,
    };
}