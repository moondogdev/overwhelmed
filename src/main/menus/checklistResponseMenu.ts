import { ipcMain, Menu, BrowserWindow } from 'electron';

export function setupChecklistResponseMenuHandlers() {
  ipcMain.on('show-checklist-response-context-menu', (event, payload) => {
    const { sectionId, itemId, hasUrl, hasResponse, x, y } = payload;
    const webContents = event.sender;
    const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
      {
        label: 'Open Link',
        enabled: hasUrl,
        click: () => webContents.send('checklist-item-command', { command: 'open_response_link', sectionId, itemId }),
      },
      {
        label: 'Copy Link',
        enabled: hasUrl,
        click: () => webContents.send('checklist-item-command', { command: 'copy_response_link', sectionId, itemId }),
      },
      { type: 'separator' },
      {
        label: 'Edit Response',
        click: () => webContents.send('checklist-item-command', { command: 'edit_response', sectionId, itemId }),
      },
      {
        label: 'Copy Response',
        enabled: hasResponse,
        click: () => webContents.send('checklist-item-command', { command: 'copy_response', sectionId, itemId }),
      },
      { type: 'separator' },
      {
        label: 'Delete Response',
        click: () => webContents.send('checklist-item-command', { command: 'delete_response', sectionId, itemId }),
      },
      { type: 'separator' },
      {
        label: 'Inspect Element',
        click: () => webContents.inspectElement(x, y),
      },
    ];
    Menu.buildFromTemplate(template).popup({ window: BrowserWindow.fromWebContents(webContents) });
  });
}