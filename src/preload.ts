// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (dataUrl: string) => ipcRenderer.invoke('dialog:saveFile', dataUrl),
  exportProject: (data: string) => ipcRenderer.invoke('dialog:exportProject', data),
  importProject: () => ipcRenderer.invoke('dialog:importProject'),
  saveCsv: (csvData: string) => ipcRenderer.invoke('save-csv', csvData),
  openExternalLink: (payload: { url: string, browserPath?: string }) => ipcRenderer.send('open-external-link', payload),
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
  getStoreValue: (key: string) => ipcRenderer.invoke('electron-store-get', key),
  setStoreValue: (key: string, value: any) => ipcRenderer.invoke('electron-store-set', key, value),
  getBackups: () => ipcRenderer.invoke('get-backups'),
  restoreBackup: (filePath: string) => ipcRenderer.invoke('restore-backup', filePath),
  createManualBackup: (backupName: string) => ipcRenderer.invoke('create-manual-backup', backupName),
  deleteBackup: (filePath: string) => ipcRenderer.invoke('delete-backup', filePath),
  exportBackup: (payload: { backupPath: string, backupName: string }) => ipcRenderer.invoke('export-backup', payload),
  openBackupsFolder: () => ipcRenderer.send('open-backups-folder'),
  send: (channel: string, data?: any) => ipcRenderer.send(channel, data),
  showTaskContextMenu: (payload: { taskId: number, x: number, y: number, isInEditMode: boolean, hasCompletedTasks: boolean, categories: any[] }) => ipcRenderer.send('show-task-context-menu', payload),
  showSelectionContextMenu: (payload: { selectionText: string, x: number, y: number }) => ipcRenderer.send('show-selection-context-menu', payload),
  showToastContextMenu: (payload: { taskId: number, x: number, y: number, isInEditMode: boolean }) => ipcRenderer.send('show-toast-context-menu', payload),
  showInboxItemContextMenu: (payload: { message: any, x: number, y: number }) => ipcRenderer.send('show-inbox-item-context-menu', payload),
  showNavButtonContextMenu: (payload: { x: number, y: number, canGoBack: boolean, canGoForward: boolean }) => ipcRenderer.send('show-nav-button-context-menu', payload),  
  showSaveButtonContextMenu: (payload: { x: number, y: number }) => ipcRenderer.send('show-save-button-context-menu', payload),  
  showChecklistMainHeaderContextMenu: (payload: { taskId: number, areAllComplete: boolean, isSectionOpen: boolean, isNotesHidden: boolean, isResponsesHidden: boolean, x: number, y: number, isInEditMode: boolean, isConfirmingDelete: boolean }) => ipcRenderer.send('show-checklist-main-header', payload),
  showChecklistSectionContextMenu: (payload: any) => ipcRenderer.send('show-checklist-section-context-menu', payload),
  showChecklistItemContextMenu: (payload: { taskId: number, sectionId: number, itemId: number, isCompleted: boolean, hasNote: boolean, hasResponse: boolean, hasUrl: boolean, isInEditMode: boolean, level: number, x: number, y: number }) => ipcRenderer.send('show-checklist-item-context-menu', payload),
  showChecklistNoteContextMenu: (payload: { sectionId: number, itemId: number, hasUrl: boolean, hasNote: boolean, x: number, y: number }) => ipcRenderer.send('show-checklist-note-context-menu', payload),
  showTimeLogItemContextMenu: (payload: { entry: any, index: number, totalEntries: number, x: number, y: number }) => ipcRenderer.send('show-time-log-item-context-menu', payload),
  showTimeLogHeaderContextMenu: (payload: { totalTime: number, timeLog: any[], x: number, y: number }) => ipcRenderer.send('show-time-log-header-context-menu', payload),
  showTimeLogSessionContextMenu: (payload: { session: any, x: number, y: number }) => ipcRenderer.send('show-time-log-session-context-menu', payload),
  showChecklistResponseContextMenu: (payload: { sectionId: number, itemId: number, hasUrl: boolean, hasResponse: boolean, x: number, y: number }) => ipcRenderer.send('show-checklist-response-context-menu', payload),
  downloadImage: (url: string) => ipcRenderer.invoke('download-image', url),
  // It's good practice to define which channels are allowed for two-way communication
  on: (channel: string, callback: (...args: any[]) => void) => {
    const newCallback = (_: IpcRendererEvent, ...args: any[]) => callback(...args);
    ipcRenderer.on(channel, newCallback);
    // Return a cleanup function
    return () => ipcRenderer.removeListener(channel, newCallback);
  },
  notifyDirtyState: (isDirty: boolean) => ipcRenderer.send('notify-dirty-state', isDirty),
  manageFile: (args: { action: 'select' } | { action: 'open', filePath: string }) => ipcRenderer.invoke('manage-file', args),
});