import { ipcMain, Menu, BrowserWindow } from 'electron';

export function setupChecklistMainHeaderMenuHandlers() {
    ipcMain.on('show-checklist-main-header', (event, payload) => {
        const { taskId, areAllComplete, isSectionOpen, isNotesHidden, isResponsesHidden, x, y, isInEditMode, isConfirmingDelete } = payload;
        const webContents = event.sender;
        const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [];
        template.push(      
        {
            label: 'Expand All',
            click: () => webContents.send('checklist-main-header-command', { command: 'expand_all_header' }),
        },
        {
            label: 'Collapse All Sections',
            click: () => webContents.send('checklist-main-header-command', { command: 'collapse_all' }),
        },            
        { type: 'separator' },      
        {
            label: 'Add Notes to All Sections',
            click: () => webContents.send('checklist-main-header-command', { command: 'add_note_to_all' }),
        },      
        {
            label: 'Delete All Notes',
            click: () => webContents.send('checklist-main-header-command', { command: 'delete_all_notes' }),
        },      
        { type: 'separator' },      
        {
            label: 'Add Response to All Items',
            click: () => webContents.send('checklist-main-header-command', { command: 'add_response_to_all' }),
        },      
        {
            label: 'Delete All Responses',
            click: () => webContents.send('checklist-main-header-command', { command: 'delete_all_responses' }),
        },
        { type: 'separator' },      
        {
            label: 'Clear All Highlights',
            click: () => webContents.send('checklist-main-header-command', { command: 'clear_all_highlights' }),
        },      
        { type: 'separator' },
        {
            label: 'Copy All Sections',
            click: () => webContents.send('checklist-main-header-command', { command: 'copy_all_sections' }),
        },      
        {
            label: 'Copy All Sections Raw',
            click: () => webContents.send('checklist-main-header-command', { command: 'copy_all_sections_raw' }),
        },
        { type: 'separator' },
        {
            label: 'Save Checklist as Template...',
            click: () => webContents.send('checklist-main-header-command', { command: 'save_checklist_as_template' }),
        },
        { type: 'separator' },
        {
            label: 'Send All Items to Timer',
            click: () => webContents.send('checklist-main-header-command', { command: 'send_all_to_timer' }),
        },
        {
            label: 'Send All Items to Timer and Start',
            click: () => webContents.send('checklist-main-header-command', { command: 'send_all_to_timer_and_start' }),
        },      
        { type: 'separator' },   
        {
            label: 'Delete All Sections',
            click: () => webContents.send('checklist-main-header-command', { command: 'delete_all_sections' }),        
        },      
        { type: 'separator' },
        );
        // Dynamically add 'View' or 'Edit' based on the current mode
        if (isInEditMode) {
        template.push({
            label: 'View Task',
            click: () => webContents.send('checklist-main-header-command', { command: 'view', taskId }),
        });
        } else {
        template.push({
            label: 'Edit Task',
            click: () => webContents.send('checklist-main-header-command', { command: 'edit', taskId }),
        });
        }
        template.push(    
        { type: 'separator' },
        {
            label: 'Undo Last Action',
            // We don't know if it's enabled from here, but we can send the command. The renderer will handle it.
            click: () => webContents.send('checklist-main-header-command', { command: 'undo_checklist' }),
        },
        {
            label: 'Redo Last Action',
            click: () => webContents.send('checklist-main-header-command', { command: 'redo_checklist' }),
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