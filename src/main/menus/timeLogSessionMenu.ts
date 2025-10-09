import { ipcMain, Menu, BrowserWindow } from 'electron';

export function setupTimeLogSessionMenuHandlers() {
    ipcMain.on('show-time-log-session-context-menu', (event, payload) => {
        const { session, x, y } = payload;
        const webContents = event.sender;
        const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
        {
            label: 'Edit Title',
            click: () => webContents.send('time-log-session-command', { command: 'edit_title', session }),
        },
        { type: 'separator' },
        {
            label: 'Clear Entries',
            click: () => webContents.send('time-log-session-command', { command: 'clear_entries', session }),
        },
        { type: 'separator' },
        {
            label: 'Restart Session (Load to Timer)',
            click: () => webContents.send('time-log-session-command', { command: 'restart_session', session }),
        },
        { type: 'separator' },
        {
            label: 'Duplicate Session',
            click: () => webContents.send('time-log-session-command', { command: 'duplicate_session', session }),
        },
        {
            label: 'Copy Session as Text',
            click: () => webContents.send('time-log-session-command', { command: 'copy_session', session }),
        },
        { type: 'separator' },
        {
            label: 'Delete Session',
            click: () => webContents.send('time-log-session-command', { command: 'delete_session', session }),
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