import { Category, InboxMessage, TimeLogEntry, TimeLogSession } from './types';

declare global {
  interface Window {
    electronAPI: {
      saveFile: (dataUrl: string) => Promise<void>;
      exportProject: (data: string) => Promise<void>;
      importProject: () => Promise<string | null>;
      saveCsv: (csvData: string) => Promise<void>;
      openExternalLink: (payload: { url: string, browserPath?: string }) => void;
      showContextMenu: () => void;
      getStoreValue: (key: string) => Promise<any>;
      setStoreValue: (key: string, value: any) => Promise<void>;
      getBackups: () => Promise<{ name: string, path: string, time: number, size: number }[]>;
      restoreBackup: (filePath: string) => Promise<string | null>;
      createManualBackup: (backupName: string) => Promise<{ success: boolean, path: string }>;
      deleteBackup: (filePath: string) => Promise<{ success: boolean, error?: string }>;
      exportBackup: (payload: { backupPath: string, backupName: string }) => Promise<void>;
      openBackupsFolder: () => void;
      send: (channel: string, data?: any) => void;
      on: (channel: string, callback: (...args: any[]) => void) => (() => void) | undefined;
      manageFile: (args: { action: 'select' } | { action: 'open', filePath: string; fileName: string }) => Promise<{ name: string, path: string } | null>;
      downloadImage: (url: string) => Promise<void>;
      showTaskContextMenu: (payload: { taskId: number, x: number, y: number, isInEditMode: boolean, hasCompletedTasks: boolean, categories: Category[] }) => void;
      showSelectionContextMenu: (payload: { selectionText: string, x: number, y: number }) => void;
      showToastContextMenu: (payload: { taskId: number, x: number, y: number, isInEditMode: boolean }) => void;
      showInboxItemContextMenu: (payload: { message: InboxMessage, x: number, y: number }) => void;
      showNavButtonContextMenu: (payload: { x: number, y: number, canGoBack: boolean, canGoForward: boolean }) => void;
      showSaveButtonContextMenu: (payload: { x: number, y: number }) => void;
      showChecklistSectionContextMenu: (payload: { taskId: number, sectionId: number, areAllComplete: boolean, isSectionOpen: boolean, availableContentBlocks: {id: number, title: string}[], isNotesHidden: boolean, isResponsesHidden: boolean, isPairedWithContentBlock: boolean, x: number, y: number, isInEditMode: boolean, isConfirmingDelete: boolean }) => void;
      showChecklistMainHeaderContextMenu: (payload: { taskId: number, areAllComplete: boolean, isSectionOpen: boolean, isNotesHidden: boolean, isResponsesHidden: boolean, x: number, y: number, isInEditMode: boolean, isConfirmingDelete: boolean }) => void;
      showChecklistItemContextMenu: (payload: { taskId: number, sectionId: number, itemId: number, isCompleted: boolean, hasNote: boolean, hasResponse: boolean, hasUrl: boolean, isInEditMode: boolean, level: number, x: number, y: number }) => void;
      showChecklistNoteContextMenu: (payload: { sectionId: number, itemId: number, hasUrl: boolean, hasNote: boolean, x: number, y: number }) => void;
      showChecklistResponseContextMenu: (payload: { sectionId: number, itemId: number, hasUrl: boolean, hasResponse: boolean, x: number, y: number }) => void;
      showTimeLogItemContextMenu: (payload: { entry: TimeLogEntry, index: number, totalEntries: number, x: number, y: number }) => void;
      showTimeLogHeaderContextMenu: (payload: { totalTime: number, timeLog: TimeLogEntry[], x: number, y: number }) => void;
      showTimeLogSessionContextMenu: (payload: { session: TimeLogSession, x: number, y: number }) => void;
      notifyDirtyState: (isDirty: boolean) => void;
    }
  }
}