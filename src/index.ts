import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import Store from 'electron-store';
import windowStateKeeper from 'electron-window-state';
import { setupBackupHandlers } from './main/backupManager';
import { setupIpcHandlers } from './main/ipcHandlers';
import { setupContextMenuHandlers } from './main/contextMenuManager';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
if (require('electron-squirrel-startup')) {
  app.quit();
}

const store = new Store({
  name: 'config', // This ensures the file is named 'config.json' and loads your data.
  migrations: {
    '>=1.0.21': (store) => {
      // This migration renames 'word' related keys to 'task' for clarity.
      const words = store.get('overwhelmed-words');
      if (words) {
        store.set('overwhelmed-tasks', words);
        store.delete('overwhelmed-words');
      }
      const completedWords = store.get('overwhelmed-completed-words');
      if (completedWords) {
        store.set('overwhelmed-completed-tasks', completedWords);
        store.delete('overwhelmed-completed-words');
      }
    }
  },
});
let isQuitting = false; 
let isDirty = false; 
function forceQuit(mainWindow: BrowserWindow) {
  isQuitting = true;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.destroy();
  }
}

const createWindow = (): void => {  
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1024,
    defaultHeight: 768,
  });  
  const mainWindow = new BrowserWindow({    
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  mainWindowState.manage(mainWindow);
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.on('close', async (e: Electron.Event) => {    
    e.preventDefault();    
    mainWindow.webContents.send('get-data-for-quit');    
    ipcMain.once('data-for-quit', async (_event, data) => {
      // This helper function calculates the final timer state. It will be used in all quit paths.
      const saveTimerState = () => {
        let entryToSave = data.activeTimerEntryRef.current;
        if (entryToSave && entryToSave.isRunning && entryToSave.startTime) {
          const finalDuration = entryToSave.duration + (Date.now() - entryToSave.startTime);
          entryToSave = { ...entryToSave, duration: finalDuration, isRunning: true, startTime: Date.now() };
        }
        store.set('active-timer-taskId', data.activeTimerTaskIdRef.current);
        store.set('active-timer-entry', entryToSave); // This key is generic, no change needed.
      };

      if (!isDirty) {
        saveTimerState();
        forceQuit(mainWindow);
        return;
      }
      
      const { response } = await dialog.showMessageBox(mainWindow, {
        type: 'question',
        buttons: ['Save and Quit', "Don't Save", 'Cancel'],
        title: 'Quit',
        message: 'You have unsaved changes. Do you want to save them before quitting?',
        defaultId: 0,
        cancelId: 2,
      });

      if (response === 0) { 
        store.set('overwhelmed-tasks', data.tasks);
        store.set('overwhelmed-completed-tasks', data.completedTasks);
        store.set('overwhelmed-settings', data.settingsRef.current);
        store.set('overwhelmed-inbox-messages', data.inboxMessagesRef.current);
        store.set('overwhelmed-archived-messages', data.archivedMessagesRef.current);
        store.set('overwhelmed-trashed-messages', data.trashedMessagesRef.current);
        saveTimerState();
        forceQuit(mainWindow);
      } else if (response === 1) {  
        saveTimerState();
        forceQuit(mainWindow);
      }
  
    });
  });
};

app.whenReady().then(() => {
  setupBackupHandlers(store);
  setupIpcHandlers(store);
  setupContextMenuHandlers();    
  ipcMain.on('save-and-quit-no-prompt', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) forceQuit(win);
  });
  ipcMain.on('notify-dirty-state', (_event, dirtyState) => {
    isDirty = dirtyState;
  });            
  createWindow();
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', () => {  
  if (BrowserWindow.getAllWindows().length === 0 && !isQuitting) {
    createWindow();
  }
});