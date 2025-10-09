import { ipcMain, Menu, BrowserWindow } from 'electron';

export function setupTaskMenuHandlers() {
  ipcMain.on('show-task-context-menu', (event, payload) => {
    const { taskId, x, y, hasCompletedTasks, isInEditMode, categories, taxCategories, isIncome, incomeType } = payload;
    const webContents = event.sender;

    const parentCategories = categories.filter((c: any) => !c.parentId);
    const categorySubmenu = parentCategories.map((parentCat: any) => {
      const subCategories = categories.filter((c: any) => c.parentId === parentCat.id);
      const subMenuItems = subCategories.map((subCat: any) => ({
        label: subCat.name,
        click: () => webContents.send('context-menu-command', { command: 'set_category', taskId, categoryId: subCat.id })
      }));
      return {
        label: parentCat.name,
        submenu: [
          { label: `Assign to "${parentCat.name}"`, click: () => webContents.send('context-menu-command', { command: 'set_category', taskId, categoryId: parentCat.id }) },
          ...(subMenuItems.length > 0 ? [{ type: 'separator' as const }, ...subMenuItems] : [])
        ]
      };
    });

    const taxCategorySubmenu = (taxCategories || []).map((taxCat: any) => ({
      label: taxCat.name,
      click: () => webContents.send('context-menu-command', { command: 'set_tax_category', taskId, taxCategoryId: taxCat.id })
    }));
    if (taxCategorySubmenu.length > 0) {
      taxCategorySubmenu.push({ type: 'separator' });
      taxCategorySubmenu.push({ label: 'Remove Tax Category', click: () => webContents.send('context-menu-command', { command: 'set_tax_category', taskId, taxCategoryId: undefined }) });
    }

    const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
      isInEditMode ? { label: 'View Task', click: () => webContents.send('context-menu-command', { command: 'view', taskId }) } : { label: 'Edit Task', click: () => webContents.send('context-menu-command', { command: 'edit', taskId }) },
      { type: 'separator' },
      { label: 'Add to Work Session', click: () => webContents.send('context-menu-command', { command: 'add_to_session', taskId }) },
      { label: 'Goto Previous Task', click: () => webContents.send('context-menu-command', { command: 'go_to_previous', taskId }) },
      { label: 'Goto Next Task', click: () => webContents.send('context-menu-command', { command: 'go_to_next', taskId }) },
      { type: 'separator' },
      { label: 'Set Category', submenu: categorySubmenu },
      { label: 'Set Tax Category', visible: taxCategorySubmenu.length > 0, submenu: taxCategorySubmenu },
      {
        label: 'Set Income Type',
        visible: isIncome,
        submenu: [
          { label: 'W-2 Wage', type: 'radio', checked: (incomeType || 'w2') === 'w2', click: () => webContents.send('context-menu-command', { command: 'set_income_type', taskId, incomeType: 'w2' }) },
          { label: 'Business Earning', type: 'radio', checked: incomeType === 'business', click: () => webContents.send('context-menu-command', { command: 'set_income_type', taskId, incomeType: 'business' }) },
          { label: 'Reimbursement / Non-Taxable', type: 'radio', checked: incomeType === 'reimbursement', click: () => webContents.send('context-menu-command', { command: 'set_income_type', taskId, incomeType: 'reimbursement' }) },
          { type: 'separator' },
          { label: 'Remove Income Type', type: 'radio', click: () => webContents.send('context-menu-command', { command: 'set_income_type', taskId, incomeType: undefined }) }
        ]
      },
      { type: 'separator' },
      { label: 'Copy as Row', click: () => webContents.send('context-menu-command', { command: 'copy_as_row', taskId }) },
      { label: 'Copy Title', click: () => webContents.send('context-menu-command', { command: 'copy_title', taskId }) },
      { label: 'Complete Task', click: () => webContents.send('context-menu-command', { command: 'complete', taskId }) },
      { label: 'Skip Task', click: () => webContents.send('context-menu-command', { command: 'skip', taskId }) },
      { label: 'Duplicate Task', click: () => webContents.send('context-menu-command', { command: 'duplicate', taskId }) },
      { label: 'Re-Open Last Task', enabled: hasCompletedTasks, click: () => webContents.send('context-menu-command', { command: 'reopen_last' }) },
      { type: 'separator' },
      { label: 'Trash Task', click: () => webContents.send('context-menu-command', { command: 'trash', taskId }) },
      { type: 'separator' },
      { label: 'Inspect Element', click: () => webContents.inspectElement(x, y) },
    ];
    Menu.buildFromTemplate(template).popup({ window: BrowserWindow.fromWebContents(event.sender) });
  });
}