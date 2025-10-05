import React from 'react';
import { AppContextType } from '../contexts/AppContext';
import { Task, ChecklistItem, ChecklistSection, TimeLogEntry } from '../types';
import { useInboxState } from './useInboxState';
import { useTaskState } from './useTaskState';
import { useGlobalTimer } from './useGlobalTimer';
import { useNotifications } from './useNotifications';
import { useEditingState } from './useEditingState';
import { useSettings } from './useSettings';
import { useDataPersistence } from './useDataPersistence';
import { useNavigation } from './useNavigation';
import { useUIState } from './useUIState';

interface StandaloneProps {
  showToast: (message: string, duration?: number) => void;
  handleCompleteTask: (task: Task, status?: 'completed' | 'skipped') => void;
  handleClearAll: () => void;
  handleCopyList: () => void;
  handleTaskUpdate: (updatedTask: Task) => void;
  handleAccordionToggle: (taskId: number) => void;
  focusAddTaskInput: () => void;
  handleBulkDelete: (taskIds: number[]) => void;
  handleBulkAdd: (options: { categoryId: number | 'default'; priority: 'High' | 'Medium' | 'Low'; completeBy?: string; transactionType?: 'none' | 'income' | 'expense' }) => void;
  handleBulkReopen: (taskIds: number[]) => void;
  handleBulkComplete: (taskIds: number[]) => void;
  handleBulkSetPriority: (taskIds: number[], priority: 'High' | 'Medium' | 'Low') => void;
  handleBulkSetDueDate: (taskIds: number[], completeBy: number) => void;
  handleBulkDownloadAsCsv: (taskIds: number[]) => void;
  handleBulkCopyAsCsv: (taskIds: number[]) => void;
  handleBulkSetAccount: (taskIds: number[], accountId: number) => void;
  handleBulkSetCategory: (taskIds: number[], categoryId: number) => void;
  handleToggleTaskSelection: (taskId: number) => void;
  handleChecklistCompletion: (item: ChecklistItem, sectionId: number, updatedSections: ChecklistSection[]) => void;
  handleGlobalToggleTimer: (taskId: number, entryId: number, entry?: TimeLogEntry, newTimeLog?: TimeLogEntry[]) => void;
  handleTogglePause: (taskId: number) => void;
  handleCopyTaskAsCsv: (taskId: number) => void;
  handleGlobalResetTimer: (taskId: number, entryId: number) => void;
  handlePrimeTask: (taskId: number) => void;
  handleClearActiveTimer: () => void;
  handleUnSnooze: (taskId: number) => void;
  handleUnSnoozeAll: () => void;
  handleSilenceTask: (taskId: number) => void;
  handleUnsilenceTask: (taskId: number) => void;
  handleSkipAllOverdue: () => void;
  handleDismissAllOverdue: () => void;
  handleNextEntry: () => void;
  handlePreviousEntry: () => void;
  handleNextChapter: () => void;
  handlePreviousChapter: () => void;
  handleStartSession: () => void;
  handlePostLog: (taskId: number) => void;
  handlePostAndResetLog: (taskId: number) => void;
  handleResetAllLogEntries: (taskId: number) => void;
  handlePostAndComplete: (taskId: number, entryId: number, onUpdate: (updatedTask: Task) => void) => void;
  handleStartTaskFromSession: (taskId: number) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  sortSelectRef: React.RefObject<HTMLSelectElement>;
  snoozeTimeSelectRef: React.RefObject<HTMLSelectElement>;
  activeChecklistRef: React.RefObject<{ handleUndo: () => void; handleRedo: () => void; resetHistory: (sections: ChecklistSection[]) => void; }>;
  filteredTasks: Task[];
  newTaskTitleInputRef: React.RefObject<HTMLInputElement>;
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<number[]>>;
}

type AppContextProps = StandaloneProps & {
  taskState: ReturnType<typeof useTaskState>;
  inboxState: ReturnType<typeof useInboxState>;
  settingsState: ReturnType<typeof useSettings>;
  editingState: ReturnType<typeof useEditingState>;
  notificationsState: ReturnType<typeof useNotifications>;
  globalTimerState: ReturnType<typeof useGlobalTimer>;
  navigationState: ReturnType<typeof useNavigation>;
  dataPersistenceState: ReturnType<typeof useDataPersistence>;
  uiState: ReturnType<typeof useUIState>;
};

/**
 * This custom hook takes all the state and handlers from the main App component
 * (now organized into custom hooks) and assembles them into the final, flat
 * `appContextValue` object for the context provider.
 */
export const useAppContextValue = (
  props: AppContextProps
): AppContextType => {
  const {
    taskState, inboxState, settingsState, editingState, 
    notificationsState, globalTimerState, navigationState, 
    dataPersistenceState, uiState, ...standaloneProps
  } = props;

  // Assemble the final flat object for the context provider
  const finalContextValue: AppContextType = {
    ...taskState,
    ...inboxState,
    ...settingsState,
    ...editingState,
    ...notificationsState,
    ...globalTimerState,
    ...navigationState,
    ...dataPersistenceState,
    ...uiState,
    ...standaloneProps,
  };

  return finalContextValue;
};