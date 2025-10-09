import { ipcMain, Menu, BrowserWindow, clipboard, shell } from 'electron';
import { exec } from 'child_process';
import { setupTaskMenuHandlers } from './menus/taskMenu';
import { setupLinkMenuHandlers } from './menus/linkMenu';
import { setupToastMenuHandlers } from './menus/toastMenu';
import { setupInboxMenuHandlers } from './menus/inboxMenu';
import { setupNavMenuHandlers } from './menus/navMenu';
import { setupSaveMenuHandlers } from './menus/saveMenu';
import { setupChecklistItemMenuHandlers } from './menus/checklistItemMenu';
import { setupChecklistSectionMenuHandlers } from './menus/checklistSectionMenu';
import { setupChecklistNoteMenuHandlers } from './menus/checklistNoteMenu';
import { setupChecklistResponseMenuHandlers } from './menus/checklistResponseMenu';
import { setupTimeLogItemMenuHandlers } from './menus/timeLogItemMenu';
import { setupTimeLogHeaderMenuHandlers } from './menus/timeLogHeaderMenu';
import { setupTimeLogSessionMenuHandlers } from './menus/timeLogSessionMenu';
import { setupChecklistMainHeaderMenuHandlers } from './menus/checklistMainHeaderMenu';
import { setupSelectionMenuHandlers } from './menus/selectionMenu';

export function setupContextMenuHandlers() {
    setupTaskMenuHandlers();
    setupLinkMenuHandlers();
    setupToastMenuHandlers();
    setupInboxMenuHandlers();
    setupNavMenuHandlers();
    setupSaveMenuHandlers();
    setupChecklistItemMenuHandlers();
    setupChecklistSectionMenuHandlers();
    setupChecklistNoteMenuHandlers();
    setupChecklistResponseMenuHandlers();
    setupTimeLogItemMenuHandlers();
    setupTimeLogHeaderMenuHandlers();
    setupTimeLogSessionMenuHandlers();
    setupChecklistMainHeaderMenuHandlers();
    setupSelectionMenuHandlers();
}
