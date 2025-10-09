import { ipcMain, dialog, app, shell } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import Store from 'electron-store';

const baseBackupsPath = path.join(app.getPath('userData'), 'backups');
const autoBackupsPath = path.join(baseBackupsPath, 'automatic');
const manualBackupsPath = path.join(baseBackupsPath, 'manual');

export function setupBackupHandlers(store: Store) {
  // Ensure backup directories exist
  if (!fs.existsSync(autoBackupsPath)) fs.mkdirSync(autoBackupsPath, { recursive: true });
  if (!fs.existsSync(manualBackupsPath)) fs.mkdirSync(manualBackupsPath, { recursive: true });

  ipcMain.on('renderer-ready-for-startup-backup', (_event, data) => {
    console.log('Renderer is ready, creating startup backup...');
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilePath = path.join(autoBackupsPath, `backup-${timestamp}.json`);
      fs.writeFileSync(backupFilePath, JSON.stringify({ tasks: data.tasks, completedTasks: data.completedTasks, settings: data.settings, inboxMessages: data.inboxMessages, archivedMessages: data.archivedMessages, trashedMessages: data.trashedMessages }, null, 2));
      console.log(`Backup created at: ${backupFilePath}`);
      
      const settings = store.get('overwhelmed-settings') as any;
      const backupLimit = settings?.autoBackupLimit ?? 10;
      const autoBackups = fs.readdirSync(autoBackupsPath)
        .map(file => ({ file, time: fs.statSync(path.join(autoBackupsPath, file)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);

      if (autoBackups.length > backupLimit) {
        const backupsToDelete = autoBackups.slice(backupLimit);
        backupsToDelete.forEach(backup => {
          fs.unlinkSync(path.join(autoBackupsPath, backup.file));
          console.log(`Deleted old backup: ${backup.file}`);
        });
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  });

  ipcMain.handle('create-manual-backup', async (event, backupName: string) => {
    try {
      // 1. Send a request to the renderer for the latest data.
      event.sender.send('get-data-for-backup');
      // 2. Wait for the renderer to send the data back on a reply channel.
      const data = await new Promise((resolve) => {
        ipcMain.once('data-for-backup-reply', (_event, data) => resolve(data));
      });
      const sanitizedName = backupName.replace(/[^a-z0-9\s-]/gi, '').trim().replace(/\s+/g, '-');
      const timestamp = new Date().toISOString().split('T')[0];
      const backupFilePath = path.join(manualBackupsPath, `manual-${timestamp}-${sanitizedName}.json`);
      fs.writeFileSync(backupFilePath, JSON.stringify(data, null, 2));
      console.log(`Manual backup created at: ${backupFilePath}`);
      return { success: true, path: backupFilePath };
    } catch (error) {
      console.error('Failed to create manual backup:', error);
      return { success: false, path: '' };
    }
  });

  ipcMain.handle('get-backups', async () => {
    try {
      const readBackupsFrom = (dir: string) => fs.readdirSync(dir).map(file => ({
          name: file,
          path: path.join(dir, file),
          time: fs.statSync(path.join(dir, file)).mtime.getTime(),
          size: fs.statSync(path.join(dir, file)).size
      }));
      const autoBackups = readBackupsFrom(autoBackupsPath);
      const manualBackups = readBackupsFrom(manualBackupsPath);
      return [...autoBackups, ...manualBackups].sort((a, b) => b.time - a.time);
    } catch (error) {
      console.error('Failed to get backups:', error);
      return [];
    }
  });

  ipcMain.handle('restore-backup', async (_event, backupPath: string) => {
    try {
      return fs.readFileSync(backupPath, 'utf-8');
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return null;
    }
  });

  ipcMain.handle('delete-backup', async (_event, backupPath: string) => {
    try {
      const resolvedBackupsPath = path.resolve(baseBackupsPath);
      const resolvedBackupPath = path.resolve(backupPath);
      if (!resolvedBackupPath.startsWith(resolvedBackupsPath)) {
        throw new Error('Attempted to delete a file outside the backups directory.');
      }
      if (fs.existsSync(resolvedBackupPath)) {
        fs.unlinkSync(resolvedBackupPath);
        return { success: true };
      }
      return { success: false, error: 'File not found.' };
    } catch (error) {
      console.error('Failed to delete backup:', error);
      return { success: false, error: error.message };
    }
  });

    ipcMain.handle('export-backup', async (_event, { backupPath, backupName }) => {
        try {
            // Security check: Ensure the path is within the backups directory
            const resolvedBackupsPath = path.resolve(baseBackupsPath);
            const resolvedBackupPath = path.resolve(backupPath);
            if (!resolvedBackupPath.startsWith(resolvedBackupsPath)) {
                throw new Error('Attempted to access a file outside the backups directory.');
            }

            const backupData = fs.readFileSync(backupPath, 'utf-8');
            const { canceled, filePath } = await dialog.showSaveDialog({
                title: 'Export Backup',
                defaultPath: backupName,
                filters: [{ name: 'JSON Files', extensions: ['json'] }],
            });

            if (!canceled && filePath) {
                fs.writeFileSync(filePath, backupData, 'utf-8');
            }
        } catch (error) { console.error('Failed to export backup:', error); }
    });

  ipcMain.on('open-backups-folder', () => {
    shell.openPath(baseBackupsPath);
  });
}