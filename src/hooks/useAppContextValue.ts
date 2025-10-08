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

// Use Omit to derive StandaloneProps from AppContextType by removing the keys
// that are provided by the other hooks. This makes it fully automatic.
type StandaloneProps = Omit<AppContextType, 
  keyof Omit<ReturnType<typeof useTaskState>, 'handleCompleteTask'> | 
  keyof ReturnType<typeof useInboxState> |
  keyof ReturnType<typeof useSettings> |
  keyof ReturnType<typeof useEditingState> |
  keyof ReturnType<typeof useNotifications> |
  keyof ReturnType<typeof useGlobalTimer> |
  keyof ReturnType<typeof useNavigation> |
  keyof ReturnType<typeof useDataPersistence> |
  keyof ReturnType<typeof useUIState>
>;
type AppContextProps = {
  taskState: ReturnType<typeof useTaskState>;
  inboxState: ReturnType<typeof useInboxState>;
  settingsState: ReturnType<typeof useSettings>;
  editingState: ReturnType<typeof useEditingState>;
  notificationsState: ReturnType<typeof useNotifications>;
  globalTimerState: ReturnType<typeof useGlobalTimer>;
  navigationState: ReturnType<typeof useNavigation>;
  dataPersistenceState: ReturnType<typeof useDataPersistence>;
  uiState: ReturnType<typeof useUIState>;
} & StandaloneProps;

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