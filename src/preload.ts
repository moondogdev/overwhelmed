// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (dataUrl: string) => ipcRenderer.invoke('dialog:saveFile', dataUrl),
  // It's good practice to define which channels are allowed for two-way communication
  on: (channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => void) => {
    const validChannels = ['your-valid-channel-here']; // Example, not used yet but good practice
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    }
  },
});
