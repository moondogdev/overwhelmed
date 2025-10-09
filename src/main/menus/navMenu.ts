import { ipcMain, Menu, BrowserWindow } from 'electron';

export function setupNavMenuHandlers() {
  ipcMain.on('show-nav-button-context-menu', (event, payload) => {
    const { x, y, canGoBack, canGoForward } = payload;
    const webContents = event.sender;
    const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
      {
        label: 'Go Back',
        enabled: canGoBack,
        click: () => webContents.send('nav-context-menu-command', { command: 'back' }),
      },
      {
        label: 'Go Forward',
        enabled: canGoForward,
        click: () => webContents.send('nav-context-menu-command', { command: 'forward' }),
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