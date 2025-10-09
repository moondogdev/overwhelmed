import { ipcMain, Menu, BrowserWindow } from 'electron';

export function setupInboxMenuHandlers() {
  ipcMain.on('show-inbox-item-context-menu', (event, payload) => {
    const { message, x, y } = payload;
    const webContents = event.sender;
    const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [];

    if (message.taskId) {
      template.push({
        label: 'View Task',
        click: () => webContents.send('inbox-context-menu-command', { command: 'view', taskId: message.taskId }),
      });
    }

    if (message.type === 'overdue' && message.taskId) {
      template.push({ type: 'separator' });
      template.push({
        label: 'Snooze',
        click: () => webContents.send('inbox-context-menu-command', { command: 'snooze', taskId: message.taskId }),
      });
      template.push({
        label: 'Complete Task',
        click: () => webContents.send('inbox-context-menu-command', { command: 'complete', taskId: message.taskId }),
      });
    }

    template.push({ type: 'separator' });
    template.push({
      label: 'Dismiss Message',
      click: () => webContents.send('inbox-context-menu-command', { command: 'dismiss', messageId: message.id }),
    });
    Menu.buildFromTemplate(template).popup({ window: BrowserWindow.fromWebContents(event.sender) });
  });
}