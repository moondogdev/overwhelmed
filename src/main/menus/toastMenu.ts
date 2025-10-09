import { ipcMain, Menu, BrowserWindow } from 'electron';

export function setupToastMenuHandlers() {
  ipcMain.on('show-toast-context-menu', (event, payload) => {
    const { taskId, x, y, isInEditMode } = payload;
    const webContents = event.sender;
    const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
      // Dynamically add 'View' or 'Edit' based on the current mode    
      {
        label: 'View Task',
        click: () => webContents.send('toast-context-menu-command', { command: 'view', taskId }),
      },
      {
        label: 'Edit Task',
        click: () => webContents.send('toast-context-menu-command', { command: 'edit', taskId }),
      },
      { type: 'separator' },
      {
        label: 'Snooze',
        click: () => webContents.send('toast-context-menu-command', { command: 'snooze', taskId }),
      },
      {
        label: 'Complete Task',
        click: () => webContents.send('toast-context-menu-command', { command: 'complete', taskId }),
      },
      { type: 'separator' },
      {
        label: 'View Inbox',
        click: () => webContents.send('toast-context-menu-command', { command: 'view-inbox' }),
      },
      {
        label: 'Edit Notification Settings',
        click: () => webContents.send('toast-context-menu-command', { command: 'edit-settings' }),
      },
      { type: 'separator' },
      {
        label: 'Inspect Element',
        click: () => webContents.inspectElement(x, y),
      },
    ];
    Menu.buildFromTemplate(template).popup({ window: BrowserWindow.fromWebContents(event.sender) });
  });
}