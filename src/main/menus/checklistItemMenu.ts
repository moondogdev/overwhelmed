import { ipcMain, Menu, BrowserWindow } from 'electron';

export function setupChecklistItemMenuHandlers() {
  ipcMain.on('show-checklist-item-context-menu', (event, payload) => {
    const { sectionId, itemId, isCompleted, hasNote, hasResponse, hasUrl, isInEditMode, level, taskId, x, y } = payload;
    const webContents = event.sender;
    const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [];

    template.push(
      {
        label: isCompleted ? 'Re-Open Item' : 'Complete Item',
        click: () => webContents.send('checklist-item-command', { command: 'toggle_complete', sectionId, itemId }),
      },
      {
        label: 'Edit Item',
        click: () => webContents.send('checklist-item-command', { command: 'edit', sectionId, itemId }),
      },
      {
        label: 'Copy Item Text',
        click: () => webContents.send('checklist-item-command', { command: 'copy', sectionId, itemId }),
      },
      {
        label: 'Duplicate Item',
        click: () => webContents.send('checklist-item-command', { command: 'duplicate', sectionId, itemId }),
      },
      {
        label: 'Delete Item',
        click: () => webContents.send('checklist-item-command', { command: 'delete', sectionId, itemId }),
      },
      { type: 'separator' },
      {
        label: 'Open Link',
        enabled: hasUrl,
        click: () => webContents.send('checklist-item-command', { command: 'open_link', sectionId, itemId }),
      },
      {
        label: 'Copy Link',
        enabled: hasUrl,
        click: () => webContents.send('checklist-item-command', { command: 'copy_link', sectionId, itemId }),
      },
      { type: 'separator' },
      {
        label: 'Highlight',
        submenu: [
          { label: 'Yellow', click: () => webContents.send('checklist-item-command', { command: 'highlight', sectionId, itemId, color: '#f4d03f' }) },
          { label: 'Red', click: () => webContents.send('checklist-item-command', { command: 'highlight', sectionId, itemId, color: '#c94a4a' }) },
          { label: 'Blue', click: () => webContents.send('checklist-item-command', { command: 'highlight', sectionId, itemId, color: '#61dafb' }) },
          { type: 'separator' },
          {
            label: 'Remove Highlight',
            click: () => webContents.send('checklist-item-command', { command: 'highlight', sectionId, itemId, color: undefined }),
          },
        ],
      },
      { type: 'separator' },
      {
        label: 'Add/Edit Response',
        click: () => webContents.send('checklist-item-command', { command: 'edit_response', sectionId, itemId }),
      },
      {
        label: 'Copy Response',
        enabled: hasResponse,
        click: () => webContents.send('checklist-item-command', { command: 'copy_response', sectionId, itemId }),
      },
      {
        label: 'Delete Response',
        enabled: hasResponse,
        click: () => webContents.send('checklist-item-command', { command: 'delete_response', sectionId, itemId })
      },
      { type: 'separator' },
      {
        label: 'Add/Edit Note',
        click: () => webContents.send('checklist-item-command', { command: 'edit_note', sectionId, itemId }),
      },
      {
        label: 'Copy Note',
        enabled: hasNote,
        click: () => webContents.send('checklist-item-command', { command: 'copy_note', sectionId, itemId }),
      },
      {
        label: 'Delete Note',
        enabled: hasNote,
        click: () => webContents.send('checklist-item-command', { command: 'delete_note', sectionId, itemId })
      },
      { type: 'separator' },
      {
        label: 'Add to Timer',
        click: () => webContents.send('checklist-item-command', { command: 'send_to_timer', sectionId, itemId }),
      },
      {
        label: 'Add to Timer and Start',
        click: () => webContents.send('checklist-item-command', { command: 'send_to_timer_and_start', sectionId, itemId }),
      },
      { type: 'separator' },
      {
        label: 'Indent Item',
        accelerator: 'Tab',
        click: () => webContents.send('checklist-item-command', { command: 'indent', sectionId, itemId }),
      },
      {
        label: 'Outdent Item',
        accelerator: 'Shift+Tab',
        enabled: level > 0, // Only enable if the item is not at the top level
        click: () => webContents.send('checklist-item-command', { command: 'outdent', sectionId, itemId }),
      },
      { type: 'separator' },
      {
        label: 'Add Item Before',
        click: () => webContents.send('checklist-item-command', { command: 'add_before', sectionId, itemId }),
      },
      {
        label: 'Add Item After',
        click: () => webContents.send('checklist-item-command', { command: 'add_after', sectionId, itemId }),
      },
      { type: 'separator' },
      {
        label: 'Promote to Section Header',
        click: () => webContents.send('checklist-item-command', { command: 'promote_to_header', sectionId, itemId }),
      },
      { type: 'separator' },
    );
    // Dynamically add 'View' or 'Edit' based on the current mode
    if (isInEditMode) {
      template.push({
        label: 'View Task',
        click: () => webContents.send('checklist-item-command', { command: 'view', taskId }),
      });
    } else {
      template.push({
        label: 'Edit Task',
        click: () => webContents.send('checklist-item-command', { command: 'edit', taskId }),
      });
    }
    template.push(
      { type: 'separator' },
      {
        label: 'Move Up',
        click: () => webContents.send('checklist-item-command', { command: 'move_up', sectionId, itemId }),
      },
      {
        label: 'Move Down',
        click: () => webContents.send('checklist-item-command', { command: 'move_down', sectionId, itemId }),
      },
      { type: 'separator' },
      {
        label: 'Inspect Element',
        click: () => webContents.inspectElement(x, y),
      },
    );
    Menu.buildFromTemplate(template).popup({ window: BrowserWindow.fromWebContents(event.sender) });
  });
}