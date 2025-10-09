import { ipcMain, Menu, BrowserWindow } from 'electron';

export function setupTimeLogItemMenuHandlers() {
    ipcMain.on('show-time-log-item-context-menu', (event, payload) => {
        const { entry, index, totalEntries, isCompleted, x, y } = payload;
        const webContents = event.sender;
        const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
        {
            label: isCompleted ? 'Re-Open' : 'Post and Complete',
            enabled: !!entry.checklistItemId, // Only enable if it's linked to a checklist item
            click: () => webContents.send('time-log-item-command', { command: 'post_and_complete', entryId: entry.id }),
        },
        { type: 'separator' },
        {
            label: 'Edit Description',
            click: () => webContents.send('time-log-item-command', { command: 'edit_description', entry, index }),
        },
        {
            label: 'Duplicate',
            click: () => webContents.send('time-log-item-command', { command: 'duplicate', entry, index }),
        },
        { type: 'separator' },
        {
            label: 'Move Up',
            enabled: index > 0,
            click: () => webContents.send('time-log-item-command', { command: 'move_up', entry, index }),
        },
        {
            label: 'Move Down',
            enabled: index < totalEntries - 1,
            click: () => webContents.send('time-log-item-command', { command: 'move_down', entry, index }),
        },
        { type: 'separator' },
        {
            label: 'Delete',
            click: () => webContents.send('time-log-item-command', { command: 'delete', entry, index }),
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