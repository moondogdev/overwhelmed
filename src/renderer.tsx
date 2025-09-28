import React, { useRef } from 'react';
import { createRoot } from 'react-dom/client';
import "./index.css";
import { AppLayout } from './components/AppLayout';
import { useAppContextValue } from './hooks/useAppContextValue';
import { useAppListeners } from './hooks/useAppListeners';
import { useInboxState } from './hooks/useInboxState';
import { useTaskState } from './hooks/useTaskState';
import { useGlobalTimer } from './hooks/useGlobalTimer';
import { useNotifications } from './hooks/useNotifications';
import { useEditingState } from './hooks/useEditingState';
import { useSettings } from './hooks/useSettings';
import { useNavigation } from './hooks/useNavigation';
import { useUIState } from './hooks/useUIState';
import { useDataPersistence } from './hooks/useDataPersistence';
import { AppContext } from './contexts/AppContext';

function App() {  
  // =================================================================================
  // I. STATE & REFS
  // =================================================================================

  // --- Refs ---
  // Refs are defined at the top to be available for all hooks and the context value.
  const newTaskTitleInputRef = useRef<HTMLInputElement>(null);
  const sortSelectRef = useRef<HTMLSelectElement>(null);
  const snoozeTimeSelectRef = useRef<HTMLSelectElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);  
  const activeChecklistRef = useRef<{ handleUndo: () => void; handleRedo: () => void; } | null>(null);  
  // These refs track state values for IPC calls where direct state access isn't possible.
  const inboxMessagesRef = useRef<any[]>([]);
  const archivedMessagesRef = useRef<any[]>([]);
  const trashedMessagesRef = useRef<any[]>([]);

  // --- UI, Settings, and Task State (managed by custom hooks) ---
  // We need `setSettings` for `uiState`, but `showToast` from `uiState` for `settingsState`.
  // We can destructure `setSettings` first, then initialize all states.
  const { setSettings: tempSetSettings } = useSettings({ showToast: () => {} });
  const uiState = useUIState({ setSettings: tempSetSettings, newTaskTitleInputRef });  
  // Destructure only the variables needed by other hooks or top-level components.
  const { newTask, setNewTask, bulkAddText, setBulkAddText, isLoading, setIsLoading, isDirty, setIsDirty, setLastSaveTime, setAutoSaveCountdown, showToast, focusAddTaskInput } = uiState;
  
  const settingsState = useSettings({ showToast });
  const { settings, setSettings, handleAccordionToggle } = settingsState;

  // --- Inbox State (managed by custom hook) ---
  const inboxState = useInboxState({ showToast, setIsDirty: uiState.setIsDirty });
  const { inboxMessages, setInboxMessages, archivedMessages, setArchivedMessages, trashedMessages, setTrashedMessages } = inboxState;

  // Keep refs synchronized with the latest state.
  inboxMessagesRef.current = inboxMessages;
  archivedMessagesRef.current = archivedMessages;
  trashedMessagesRef.current = trashedMessages;

  const taskState = useTaskState({
    setInboxMessages, showToast, newTask, setNewTask, bulkAddText, setBulkAddText, settings,
  });
  const { words, setWords, completedWords, setCompletedWords, handleCompleteWord, removeWord, handleWordUpdate, handleChecklistCompletion, handleClearAll, handleCopyList, handleTogglePause } = taskState;

  // --- Global Timer State (managed by custom hook) ---
  const globalTimerState = useGlobalTimer({
    words, setWords,
  });
  const { handleAddNewTimeLogEntryAndStart } = globalTimerState;

  // --- Notifications State (managed by custom hook) ---
  const notificationsState = useNotifications({
    words, setWords, settings, setInboxMessages, handleCompleteWord, removeWord, isLoading
  });

  // --- Editing State (managed by custom hook) ---
  const editingState = useEditingState({
    words, setWords,
  });

  // --- Navigation State (managed by custom hook) ---
  const navigationState = useNavigation({
    words, settings, setSettings,
  });

  // --- Data Persistence Logic (managed by custom hook) ---
  const dataPersistenceState = useDataPersistence({
    isLoading, setIsLoading,
    isDirty, setIsDirty,
    words, setWords,
    completedWords, setCompletedWords,
    settings, setSettings,
    inboxMessages, setInboxMessages,
    archivedMessages, setArchivedMessages,
    trashedMessages, setTrashedMessages,
    inboxMessagesRef,
    archivedMessagesRef,
    trashedMessagesRef,
    setLastSaveTime,
    setAutoSaveCountdown,
    showToast,
  });

  // =================================================================================
  // II. RENDER LOGIC
  // =================================================================================
  useAppListeners({ 
    taskState, 
    settingsState, 
    uiState, 
    navigationState, 
    notificationsState, 
    dataPersistenceState, 
    inboxState, 
    snoozeTimeSelectRef 
  });

  // Create a single context value object to pass down.
  // This avoids having to pass dozens of individual props.
  const appContextValue = useAppContextValue({
    taskState,
    inboxState,
    settingsState,
    editingState,
    notificationsState,
    globalTimerState,
    navigationState,
    dataPersistenceState,
    uiState,
    // Pass remaining standalone props
    showToast,
    handleClearAll,
    handleCopyList,
    handleWordUpdate,
    handleAccordionToggle,
    focusAddTaskInput,
    handleChecklistCompletion,
    handleAddNewTimeLogEntryAndStart,
    handleTogglePause,
    // Pass remaining refs
    searchInputRef, sortSelectRef, snoozeTimeSelectRef, activeChecklistRef, newTaskTitleInputRef,
  });    

  return (
    <AppContext.Provider value={appContextValue}>
      <AppLayout />      
    </AppContext.Provider>
  );
}

// Create a root element for React to mount into
const rootElement = document.createElement('div');
rootElement.id = 'root';
document.body.appendChild(rootElement);

const root = createRoot(rootElement);
root.render(<React.StrictMode><App /></React.StrictMode>);