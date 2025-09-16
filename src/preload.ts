// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (dataUrl: string) => ipcRenderer.invoke('dialog:saveFile', dataUrl),
  exportProject: (data: string) => ipcRenderer.invoke('dialog:exportProject', data),
  importProject: () => ipcRenderer.invoke('dialog:importProject'),
  openExternalLink: (url: string) => ipcRenderer.send('open-external-link', url),
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
  getStoreValue: (key: string) => ipcRenderer.invoke('electron-store-get', key),
  setStoreValue: (key: string, value: any) => ipcRenderer.send('electron-store-set', key, value),
  send: (channel: string) => ipcRenderer.send(channel), // Expose a generic send method
  notifyDirtyState: (isDirty: boolean) => ipcRenderer.send('notify-dirty-state', isDirty),
  // It's good practice to define which channels are allowed for two-way communication
  on: (channel: string, callback: (...args: any[]) => void) => {
    const validChannels = ['prepare-for-shutdown', 'save-and-shutdown'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
      return () => ipcRenderer.removeListener(channel, callback);
    }
  },
});
