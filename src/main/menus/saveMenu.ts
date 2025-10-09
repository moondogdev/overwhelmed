import { ipcMain, Menu, BrowserWindow } from 'electron';

export function setupSaveMenuHandlers() {
  ipcMain.on('show-save-button-context-menu', (event, payload) => {
    const { x, y } = payload;
    const webContents = event.sender;
    const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
      {
        label: 'Save Project',
        click: () => webContents.send('save-context-menu-command', { command: 'save' }),
      },
      {
        label: 'Create Manual Backup...',
        click: () => webContents.send('save-context-menu-command', { command: 'backup' }),
      },
    ];
    Menu.buildFromTemplate(template).popup({ window: BrowserWindow.fromWebContents(event.sender) });
  });
}