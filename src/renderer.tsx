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
import { Task, ChecklistSection } from './types';

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
  const activeChecklistRef = useRef<{ handleUndo: () => void; handleRedo: () => void; resetHistory: (sections: ChecklistSection[]) => void; } | null>(null);  

  // --- UI, Settings, and Task State (managed by custom hooks) ---
  // We need `setSettings` for `uiState`, but `showToast` from `uiState` for `settingsState`.
  // We can destructure `setSettings` first, then initialize all states.
  const { setSettings: tempSetSettings } = useSettings({ showToast: () => {} }); // This is fine, it's just for initialization
  const uiState = useUIState({ setSettings: tempSetSettings, newTaskTitleInputRef });  
  // Destructure only the variables needed by other hooks or top-level components.
  const { newTask, setNewTask, bulkAddText, setBulkAddText, isLoading, setIsLoading, isDirty, setIsDirty, setLastSaveTime, setAutoSaveCountdown, showToast, focusAddTaskInput } = uiState;
  
  const settingsState = useSettings({ showToast });
  const { settings, setSettings, settingsRef, handleAccordionToggle } = settingsState;

  // --- Inbox State (managed by custom hook) ---
  const inboxState = useInboxState({ showToast, setIsDirty: uiState.setIsDirty });
  const { inboxMessages, setInboxMessages, archivedMessages, setArchivedMessages, trashedMessages, setTrashedMessages, inboxMessagesRef, archivedMessagesRef, trashedMessagesRef } = inboxState;

  const taskState = useTaskState({
    setInboxMessages, showToast, newTask, setNewTask, bulkAddText, setBulkAddText, settings,
  });
  const { tasks, setTasks, completedTasks, setCompletedTasks, handleCompleteTask: originalHandleCompleteTask, removeTask, handleTaskUpdate, handleChecklistCompletion, handleClearAll, handleCopyList, handleTogglePause, tasksRef, completedTasksRef } = taskState;

  // --- Global Timer State (managed by custom hook) ---
  const globalTimerState = useGlobalTimer({
    tasks, setTasks, settings
  });
  const { activeTimerTaskId, activeTimerEntry, setActiveTimerTaskId, setActiveTimerEntry, setActiveTimerLiveTime, handleNextEntry, handlePreviousEntry, handleGlobalResetTimer, handleStartSession, handleStartTaskFromSession, handleClearActiveTimer, handleNextChapter, handlePreviousChapter, handleGlobalToggleTimer, handlePrimeTask, handlePostLog, handlePostAndResetLog, handleResetAllLogEntries, handlePostAndComplete, activeTimerTaskIdRef, activeTimerEntryRef } = globalTimerState;

  // --- Notifications State (managed by custom hook) ---
  const notificationsState = useNotifications({
    tasks, setTasks, settings, setInboxMessages, handleCompleteTask: originalHandleCompleteTask, removeTask, isLoading
  });

  // --- Editing State (managed by custom hook) ---
  const editingState = useEditingState({
    tasks, setTasks,
  });

  // This logic is duplicated from ListView to make filteredTasks available to the navigation hook.
  // This is a candidate for future refactoring if more hooks need this data.
  const filteredTasks = tasks.filter(task => {
    const activeCategoryId = settings.activeCategoryId ?? 'all';
    const activeSubCategoryId = settings.activeSubCategoryId ?? 'all';
    const searchQuery = uiState.searchQuery;

    if (activeCategoryId === 'all' && !searchQuery) return true;
    const matchesSearch = searchQuery ? task.text.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    if (!matchesSearch) return false;
    if (activeCategoryId === 'all') return true;
    const activeCategory = settings.categories.find(c => c.id === activeCategoryId);
    const parentId = activeCategory?.parentId || activeCategoryId;
    const subCategoriesForParent = settings.categories.filter(c => c.parentId === parentId);
    if (activeSubCategoryId !== 'all') {
      return task.categoryId === activeSubCategoryId;
    }
    const categoryIdsToShow = [parentId, ...subCategoriesForParent.map(sc => sc.id)];
    return categoryIdsToShow.includes(task.categoryId);
  });

  // --- Navigation State (managed by custom hook) ---
  const navigationState = useNavigation({
    tasks, filteredTasks, settings, setSettings,
  });

  // --- Data Persistence Logic (managed by custom hook) ---
  const dataPersistenceState = useDataPersistence({
    isLoading, setIsLoading,
    isDirty, setIsDirty,
    tasks, setTasks,
    completedTasks, setCompletedTasks,
    tasksRef, 
    completedTasksRef,
    settings, settingsRef, setSettings,
    inboxMessages, setInboxMessages,
    archivedMessages, setArchivedMessages,
    trashedMessages, setTrashedMessages,
    inboxMessagesRef,
    archivedMessagesRef,
    trashedMessagesRef,
    setLastSaveTime,
    setAutoSaveCountdown,
    showToast,
    activeTimerTaskId,
    activeTimerTaskIdRef,
    activeTimerEntry,
    activeTimerEntryRef,
    handleGlobalToggleTimer,
    setActiveTimerTaskId,
    setActiveTimerEntry,
    setActiveTimerLiveTime,
  });

  // --- Combined Handlers for Cross-Hook Logic ---
  const handleCompleteTask = (taskToComplete: Task, status: 'completed' | 'skipped' = 'completed') => {
    originalHandleCompleteTask(taskToComplete, status);
    // If autoplay is on and the completed task was in the session, move to the next one.    
    if (settings.autoplayNextInSession && settings.workSessionQueue.includes(taskToComplete.id)) {
      // A small timeout ensures the state updates from completion settle before starting the next task.
      setTimeout(() => globalTimerState.handleNextTask(), 100);
    }
  };

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
    globalTimerState, 
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
    handleCompleteTask,
    handleCopyList,
    handleTaskUpdate,
    handleAccordionToggle,
    focusAddTaskInput,
    handleChecklistCompletion,
    handleGlobalToggleTimer,
    handleTogglePause,
    handleGlobalResetTimer,
    handleNextEntry,
    handleClearActiveTimer,
    handlePreviousEntry,
    handleStartSession,
    handlePrimeTask,
    handleNextChapter,
    handlePreviousChapter,
    handlePostLog,
    handlePostAndComplete,
    handlePostAndResetLog,
    handleResetAllLogEntries,
    handleStartTaskFromSession,
    filteredTasks,
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