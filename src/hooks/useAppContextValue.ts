import React from 'react';
import { AppContextType } from '../contexts/AppContext';
import { Word, ChecklistItem, ChecklistSection } from '../types';
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
  handleClearAll: () => void;
  handleCopyList: () => void;
  handleWordUpdate: (updatedWord: Word) => void;
  handleAccordionToggle: (wordId: number) => void;
  focusAddTaskInput: () => void;
  handleChecklistCompletion: (item: ChecklistItem, sectionId: number, updatedSections: ChecklistSection[]) => void;
  handleAddNewTimeLogEntryAndStart: (wordId: number, description: string) => void;
  handleTogglePause: (wordId: number) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  sortSelectRef: React.RefObject<HTMLSelectElement>;
  snoozeTimeSelectRef: React.RefObject<HTMLSelectElement>;
  activeChecklistRef: React.RefObject<{ handleUndo: () => void; handleRedo: () => void; }>;
  newTaskTitleInputRef: React.RefObject<HTMLInputElement>;
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