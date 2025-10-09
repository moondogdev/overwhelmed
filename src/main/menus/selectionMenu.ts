import { ipcMain, Menu, BrowserWindow } from 'electron';

export function setupSelectionMenuHandlers() {
    ipcMain.on('show-selection-context-menu', (event, payload) => {
        const webContents = event.sender;
        const { selectionText, x, y } = payload;
        const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
        {
            label: 'Copy',
            role: 'copy',
        },
        {
            label: 'Search Google for selection',
            click: () => webContents.send('search-google-selection', selectionText),
        },
        {
            label: 'Search Stock Photos for selection',
            click: () => webContents.send('search-stock-photos-selection', selectionText),
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