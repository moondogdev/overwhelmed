import { ipcMain, dialog, shell, net, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import Store from 'electron-store';

const attachmentsPath = path.join(app.getPath('userData'), 'attachments');

export function setupIpcHandlers(store: Store) {
    // Ensure attachments directory exists
    if (!fs.existsSync(attachmentsPath)) fs.mkdirSync(attachmentsPath, { recursive: true });

    ipcMain.handle('dialog:exportProject', async (_event, data: string) => {
        const { canceled, filePath } = await dialog.showSaveDialog({
            title: 'Export Project',
            defaultPath: 'overwhelmed-project.json',
            filters: [{ name: 'JSON Files', extensions: ['json'] }],
        });
        if (!canceled && filePath) {
            fs.writeFile(filePath, data, 'utf-8', (err) => {
            if (err) console.error('Failed to export project:', err);
            });
        }
    });

    ipcMain.handle('dialog:importProject', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            title: 'Import Project',
            properties: ['openFile'],
            filters: [{ name: 'JSON Files', extensions: ['json'] }],
        });
        if (!canceled && filePaths.length > 0) {
            try {
            return fs.readFileSync(filePaths[0], 'utf-8');
            } catch (err) {
            console.error('Failed to import project:', err);
            return null;
            }
        }
        return null;
    });

    ipcMain.on('open-external-link', (_event, { url, browserPath }) => {
        if (browserPath) {
            exec(`"${browserPath}" "${url}"`);
        } else {
            shell.openExternal(url);
        }
    });

    ipcMain.handle('electron-store-get', (_event, key) => store.get(key));
    ipcMain.handle('electron-store-set', (_event, key, val) => store.set(key, val));

    ipcMain.on('auto-save-data', (_event, data) => {
        store.set('overwhelmed-tasks', data.tasks);
        store.set('overwhelmed-completed-tasks', data.completedTasks);
        store.set('overwhelmed-settings', data.settings);
        store.set('overwhelmed-inbox-messages', data.inboxMessages);
        store.set('active-timer-taskId', data.activeTimerTaskId);
        store.set('active-timer-entry', data.activeTimerEntry);
        console.log('Auto-save complete.');
    });

    ipcMain.handle('download-image', async (_event, url: string) => {
        try {
            const request = net.request(url);
            const chunks: Buffer[] = [];

            const httpResponse = await new Promise<Electron.IncomingMessage>((resolve) => {
                request.on('response', (response: Electron.IncomingMessage) => {
                    response.on('data', (chunk: Buffer) => {
                        chunks.push(chunk);
                    });
                    resolve(response);
                });
                request.end();
            });

            const imageBuffer = Buffer.concat(chunks);
            const { filePath } = await dialog.showSaveDialog({
                title: 'Save Image',
                defaultPath: `downloaded-image-${Date.now()}.jpg`,
            });
            if (filePath) fs.writeFileSync(filePath, imageBuffer);
        } catch (error) { console.error('Failed to download image:', error); }
    });
    
    ipcMain.handle('print-to-pdf', async (event, options) => {
        const webContents = event.sender;
        const year = options.year || new Date().getFullYear();
        const { canceled, filePath } = await dialog.showSaveDialog({
          title: 'Save Tax Report as PDF',    
          defaultPath: `tax-report-${year}-${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`,
          filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
        });
      
        if (!canceled && filePath) {
          try {
            const pdfData = await webContents.printToPDF({
              printBackground: true,
              pageSize: 'Letter'
            });
            fs.writeFileSync(filePath, pdfData);
            shell.openPath(filePath); // Open the saved PDF for the user
          } catch (error) { console.error('Failed to print to PDF:', error); }
        }
    });

    ipcMain.handle('save-csv', async (event, csvData: string) => {
        const { canceled, filePath } = await dialog.showSaveDialog({
            title: 'Export Report to CSV',
            defaultPath: `overwhelmed-report-${Date.now()}.csv`,
            filters: [{ name: 'CSV Files', extensions: ['csv'] }],
        });

        if (!canceled && filePath) {
            try {
                fs.writeFileSync(filePath, csvData, 'utf-8');
            } catch (error) {
                console.error('Failed to save CSV file:', error);        
            }
        }
    });

    ipcMain.handle('manage-file', async (_event, { action, filePath, fileName }) => {
        switch (action) {
            case 'select': {
                const result = await dialog.showOpenDialog({ properties: ['openFile'] });
                if (result.canceled || result.filePaths.length === 0) return null;
                const sourcePath = result.filePaths[0];
                const originalFileName = path.basename(sourcePath);
                const uniqueFileName = `${Date.now()}-${originalFileName}`;
                const destinationPath = path.join(attachmentsPath, uniqueFileName);
                try {
                    fs.copyFileSync(sourcePath, destinationPath);
                    return { name: originalFileName, path: destinationPath };
                } catch (error) {
                    console.error('Failed to copy file:', error);
                    return null;
                }
            }
            case 'open': {
                if (filePath && fs.existsSync(filePath)) shell.openPath(filePath);
                else dialog.showErrorBox('File Not Found', `The file at ${filePath} could not be found.`);
                return;
            }
        }
    });
}