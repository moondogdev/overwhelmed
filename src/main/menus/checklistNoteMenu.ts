import { ipcMain, Menu, BrowserWindow } from 'electron';

export function setupChecklistNoteMenuHandlers() {
  ipcMain.on('show-checklist-note-context-menu', (event, payload) => {
    const { sectionId, itemId, hasNote, hasUrl, x, y } = payload;
    const webContents = event.sender;
    const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
      {
        label: 'Open Link',
        enabled: hasUrl,
        click: () => webContents.send('checklist-item-command', { command: 'open_note_link', sectionId, itemId }),
      },
      {
        label: 'Copy Link',
        enabled: hasUrl,
        click: () => webContents.send('checklist-item-command', { command: 'copy_note_link', sectionId, itemId }),
      },
      { type: 'separator' },
      {
        label: 'Edit Note',
        click: () => webContents.send('checklist-item-command', { command: 'edit_note', sectionId, itemId }),
      },
      {
        label: 'Copy Note',
        enabled: hasNote,
        click: () => webContents.send('checklist-item-command', { command: 'copy_note', sectionId, itemId }),
      },
      { type: 'separator' },
      {
        label: 'Delete Note',
        click: () => webContents.send('checklist-item-command', { command: 'delete_note', sectionId, itemId }),
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