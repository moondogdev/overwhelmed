import React from 'react';
import { Word, Settings, InboxMessage, ChecklistItem, ChecklistSection, TimeLogEntry } from '../types';

export interface AppContextType {
  // State
  words: Word[];
  setWords: React.Dispatch<React.SetStateAction<Word[]>>;
  completedWords: Word[];
  setCompletedWords: React.Dispatch<React.SetStateAction<Word[]>>;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  inboxMessages: InboxMessage[];
  setInboxMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
  archivedMessages: InboxMessage[];
  setArchivedMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
  copyStatus: string;
  timerNotifications: Word[];
  overdueNotifications: Set<number>;
  trashedMessages: InboxMessage[];
  setTrashedMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  editingWordId: number | null;
  setEditingWordId: (id: number | null) => void;
  editingText: string;
  setEditingText: (text: string) => void;
  editingViaContext: number | null;
  confirmingClearCompleted: boolean;
  focusChecklistItemId: number | null;
  setFocusChecklistItemId: (id: number | null) => void;
  activeTimerWordId: number | null;
  activeTimerEntry: TimeLogEntry | null;
  activeTimerLiveTime: number;
  primedTaskId: number | null;
  fullTaskViewId: number | null;
  setFullTaskViewId: (id: number | null) => void;
  newTask: Partial<Word>;
  setNewTask: React.Dispatch<React.SetStateAction<Partial<Word>>>;
  isDirty: boolean;
  isLoading: boolean;
  lastSaveTime: number | null;
  autoSaveCountdown: number;
  bulkAddText: string;
  setBulkAddText: (text: string) => void;
  isPromptOpen: boolean;
  setIsPromptOpen: (isOpen: boolean) => void;
  isAddTaskOpen: boolean;
  setIsAddTaskOpen: (isOpen: boolean) => void;
  isWorkSessionManagerOpen: boolean;
  setIsWorkSessionManagerOpen: (isOpen: boolean) => void;

  // Refs
  historyIndex: number;
  viewHistory: string[];
  newTaskTitleInputRef: React.RefObject<HTMLInputElement>;

  searchInputRef: React.RefObject<HTMLInputElement>;
  sortSelectRef: React.RefObject<HTMLSelectElement>;
  snoozeTimeSelectRef: React.RefObject<HTMLSelectElement>;
  activeChecklistRef: React.RefObject<{ handleUndo: () => void; handleRedo: () => void; resetHistory: (sections: ChecklistSection[]) => void; }>;

  // Handlers
  showToast: (message: string, duration?: number) => void;
  handleClearAll: () => void;
  handleCopyList: () => void;
  handleClearCompleted: () => void;
  handleCompleteWord: (word: Word) => void;
  moveWord: (wordId: number, targetWordId: number) => void;
  removeWord: (id: number) => void;
  handleWordUpdate: (word: Word) => void;
  handleAccordionToggle: (id: number) => void;
  handleReopenTask: (word: Word) => void;
  handleDuplicateTask: (word: Word) => void;
  handleTogglePause: (id: number) => void;
  handleEditChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleEditKeyDown: (event: React.KeyboardEvent<HTMLInputElement>, wordId: number) => void;
  setActiveCategoryId: (id: number | 'all') => void;
  setActiveSubCategoryId: (id: number | 'all') => void;
  focusAddTaskInput: () => void;
  handleChecklistCompletion: (item: ChecklistItem, sectionId: number, updatedSections: ChecklistSection[]) => void;
  handleGlobalToggleTimer: (wordId: number, entryId: number, entry?: TimeLogEntry, newTimeLog?: TimeLogEntry[]) => void;
  handleGlobalStopTimer: () => void;
  handleGlobalResetTimer: (wordId: number, entryId: number) => void;
  handlePrimeTaskWithNewLog: (wordId: number, newTimeLog: TimeLogEntry[], timeLogTitle?: string) => void;
  handlePrimeTask: (wordId: number) => void;
  handleClearActiveTimer: () => void;  
  handleNextTask: () => void;
  handlePreviousTask: () => void;
  handleNextEntry: () => void;
  handleNextChapter: () => void;
  handlePreviousChapter: () => void;
  handleStartSession: () => void;
  handlePostLog: (wordId: number) => void;
  handlePostAndResetLog: (wordId: number) => void;
  handleResetAllLogEntries: (wordId: number) => void;
  handlePostAndComplete: (wordId: number, entryId: number, onUpdate: (updatedWord: Word) => void) => void;
  handleStartTaskFromSession: (taskId: number) => void;
  handlePreviousEntry: () => void;
  handleTimerNotify: (word: Word) => void;
  handleSnooze: (word: Word, duration?: 'low' | 'medium' | 'high') => void;
  handleSnoozeAll: (duration?: 'low' | 'medium' | 'high') => void;
  handleCompleteAllOverdue: () => void;
  handleDeleteAllOverdue: () => void;
  handleCreateNewTask: () => void;
  navigateToTask: (wordId: number, sectionId?: number) => void;
  handleSaveProject: () => void;
  navigateToView: (view: 'meme' | 'list' | 'reports' | 'inbox') => void;
  handleBulkAdd: () => void;
  handleExport: () => void;
  handleImport: () => void;
  handleResetSettings: () => void;
  handleFontScaleChange: (scale: 'small' | 'medium' | 'large') => void;  
  applyDefaultShadow: () => void;
  resetShadow: () => void;
  // Inbox Handlers
  handleInboxItemClick: (message: InboxMessage) => void;
  handleToggleImportant: (messageId: number) => void;
  handleArchiveInboxMessage: (messageId: number) => void;
  handleDismissInboxMessage: (messageId: number) => void;
  handleUnarchiveInboxMessage: (messageId: number) => void;
  handleDismissArchivedMessage: (messageId: number) => void;
  handleRestoreFromTrash: (messageId: number) => void;
  handleDeletePermanently: (messageId: number) => void;
  handleRestoreAllFromTrash: () => void;
  handleEmptyTrash: () => void;
  handleTrashAllArchived: () => void;
  handleDismissAllInboxMessages: () => void;
}

// We provide a default value of `null` and will handle the null check in components.
export const AppContext = React.createContext<AppContextType | null>(null);

// Custom hook for easy access to the context
export const useAppContext = () => {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};