import { ipcMain, Menu, BrowserWindow } from 'electron';

export function setupTimeLogHeaderMenuHandlers() {
    ipcMain.on('show-time-log-header-context-menu', (event, payload) => {
        const { totalTime, timeLog, x, y } = payload;
        const webContents = event.sender;
        const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
        { label: 'Copy Total Time', click: () => webContents.send('time-log-header-command', { command: 'copy_total_time', totalTime, timeLog }) },
        { label: 'Copy Log as Text', click: () => webContents.send('time-log-header-command', { command: 'copy_log_as_text', totalTime, timeLog }) },
        { type: 'separator' },
        { label: 'Clear Entries', click: () => webContents.send('time-log-header-command', { command: 'clear_entries', totalTime, timeLog }) },
        { label: 'Wipe Timer (Delete All and Title)', click: () => webContents.send('time-log-header-command', { command: 'delete_all', totalTime, timeLog }) },
        { type: 'separator' },
        { label: 'Add New Line', click: () => webContents.send('time-log-header-command', { command: 'add_new_line', totalTime, timeLog }) },
        { type: 'separator' },
        { label: 'Inspect Element', click: () => webContents.inspectElement(x, y) },
        ];
        Menu.buildFromTemplate(template).popup({ window: BrowserWindow.fromWebContents(webContents) });
    });
}