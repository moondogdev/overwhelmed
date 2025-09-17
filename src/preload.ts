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
  send: (channel: string, data?: any) => ipcRenderer.send(channel, data), // Allow sending data
  notifyDirtyState: (isDirty: boolean) => ipcRenderer.send('notify-dirty-state', isDirty),
  showTaskContextMenu: (wordId: number) => ipcRenderer.send('show-task-context-menu', wordId),
  downloadImage: (url: string) => ipcRenderer.invoke('download-image', url),
  // It's good practice to define which channels are allowed for two-way communication
  on: (channel: string, callback: (...args: any[]) => void) => {
    const validChannels = ['get-data-for-quit', 'context-menu-command', 'show-link-context-menu'];
    if (validChannels.includes(channel)) {
      const listener = (event: IpcRendererEvent, ...args: any[]) => callback(...args);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    }
  },
});
