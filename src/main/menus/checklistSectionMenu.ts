import { ipcMain, Menu, BrowserWindow } from 'electron';

export function setupChecklistSectionMenuHandlers() {
  ipcMain.on('show-checklist-section-context-menu', (event, payload) => {
    const { taskId, sectionId, areAllComplete, isSectionOpen, isNotesHidden, isResponsesHidden, x, y, isInEditMode, isConfirmingDelete, availableContentBlocks, isPairedWithContentBlock } = payload;
    const webContents = event.sender;
    const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [];

    template.push(
      {
        label: isSectionOpen ? 'Collapse Section' : 'Expand Section',
        click: () => webContents.send('checklist-section-command', { command: 'toggle_collapse', sectionId }),
      },
      { type: 'separator' },
      {
        label: 'Expand All Sections',
        click: () => webContents.send('checklist-section-command', { command: 'expand_all_section' }),
      },
      {
        label: 'Collapse All Sections',
        click: () => webContents.send('checklist-section-command', { command: 'collapse_all' }),
      },
      { type: 'separator' },
      {
        label: areAllComplete ? 'Re-Open All in Section' : 'Complete All in Section',
        click: () => webContents.send('checklist-section-command', { command: 'toggle_all_in_section', sectionId }),
      },
      { type: 'separator' },
      {
        label: 'Edit Section Title',
        click: () => webContents.send('checklist-section-command', { command: 'edit_title', sectionId }),
      },
      {
        label: 'Move to Content Block',
        enabled: availableContentBlocks && availableContentBlocks.length > 0,
        submenu: (availableContentBlocks || []).map((block: { id: number, title: string }) => ({
          label: block.title,
          click: () => webContents.send('checklist-section-command', {
            command: 'associate_with_block',
            sectionId,
            blockId: block.id
          }),
        })),
      },
      {
        label: 'Detach from Content Block',
        visible: isPairedWithContentBlock, // Only show if it's part of a group
        click: () => webContents.send('checklist-section-command', { command: 'detach_from_block', sectionId }),
      },
      { type: 'separator' },
      {
        label: 'Add Notes to All in Section',
        click: () => webContents.send('checklist-section-command', { command: 'add_note_to_section', sectionId }),
      },
      {
        label: 'Add Notes to All Sections',
        click: () => webContents.send('checklist-section-command', { command: 'add_note_to_all' }),
      },
      {
        label: payload.isNotesHidden ? 'Show Notes in Section' : 'Hide Notes in Section',
        click: () => webContents.send('checklist-section-command', { command: 'toggle_section_notes', sectionId }),
      },
      {
        label: 'Delete All Notes',
        click: () => webContents.send('checklist-section-command', { command: 'delete_all_notes' }),
      },
      { type: 'separator' },
      {
        label: 'Add Response to All in Section',
        click: () => webContents.send('checklist-section-command', { command: 'add_response_to_section', sectionId }),
      },
      {
        label: 'Add Response to All Items',
        click: () => webContents.send('checklist-section-command', { command: 'add_response_to_all' }),
      },
      {
        label: payload.isResponsesHidden ? 'Show Responses in Section' : 'Hide Responses in Section',
        click: () => webContents.send('checklist-section-command', { command: 'toggle_section_responses', sectionId }),
      },
      {
        label: 'Delete All Responses',
        click: () => webContents.send('checklist-section-command', { command: 'delete_all_responses' }),
      },
      { type: 'separator' },
      {
        label: 'Clear All Highlights',
        click: () => webContents.send('checklist-section-command', { command: 'clear_all_highlights', sectionId }),
      },
      { type: 'separator' },
      {
        label: 'Copy Section',
        click: () => webContents.send('checklist-section-command', { command: 'copy_section', sectionId }),
      },
      {
        label: 'Copy Section Raw',
        click: () => webContents.send('checklist-section-command', { command: 'copy_section_raw', sectionId }),
      },
      { type: 'separator' },
      {
        label: 'Save Section as Template',
        click: () => webContents.send('checklist-section-command', { command: 'save_section_as_template', sectionId }),
      },
      { type: 'separator' },
      {
        label: 'Duplicate Section',
        click: () => webContents.send('checklist-section-command', { command: 'duplicate_section', sectionId }),
      },
      {
        label: 'Send All to Timer',
        click: () => webContents.send('checklist-section-command', { command: 'send_section_to_timer', sectionId }),
      },
      {
        label: 'Send All to Timer and Start',
        click: () => webContents.send('checklist-section-command', { command: 'send_section_to_timer_and_start', sectionId }),
      },
      { type: 'separator' },
      {
        label: 'Delete All Sections',
        click: () => webContents.send('checklist-section-command', { command: 'delete_all_sections' }),
      },
      {
        label: 'Delete Section',
        click: () => webContents.send('checklist-section-command', { command: 'delete_section', sectionId }),
      },
      { type: 'separator' },
    );

    // Dynamically add 'View' or 'Edit' based on the current mode
    if (isInEditMode) {
      template.push({ label: 'View Task', click: () => webContents.send('checklist-section-command', { command: 'view', taskId }) });
    } else {
      template.push({ label: 'Edit Task', click: () => webContents.send('checklist-section-command', { command: 'edit', taskId }) });
    }
    template.push({ type: 'separator' });
    template.push({ label: 'Go to Previous & Collapse', click: () => webContents.send('checklist-section-command', { command: 'go_to_previous', taskId }) });
    template.push({ label: 'Go to Next Task', click: () => webContents.send('checklist-section-command', { command: 'go_to_next', taskId }) });
    template.push({ type: 'separator' }, { label: 'Move Section Up', click: () => webContents.send('checklist-section-command', { command: 'move_section_up', sectionId }) }, { label: 'Move Section Down', click: () => webContents.send('checklist-section-command', { command: 'move_section_down', sectionId }) }, { type: 'separator' }, { label: 'Undo Last Action', click: () => webContents.send('checklist-section-command', { command: 'undo_checklist', sectionId }) }, { label: 'Redo Last Action', click: () => webContents.send('checklist-section-command', { command: 'redo_checklist', sectionId }) }, { type: 'separator' }, { label: 'Inspect Element', click: () => webContents.inspectElement(x, y) });
    Menu.buildFromTemplate(template).popup({ window: BrowserWindow.fromWebContents(event.sender) });
  });
}