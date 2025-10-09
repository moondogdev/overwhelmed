import { ipcMain, Menu, BrowserWindow, clipboard, shell } from 'electron';
import { exec } from 'child_process';

export function setupLinkMenuHandlers() {
  ipcMain.on('show-link-context-menu', (event, payload) => {
    const { url, x, y, browsers, activeBrowserIndex } = payload;
    const webContents = event.sender;
    const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [];

    // 1. Create the primary "Active Browser" menu item
    const activeBrowser = browsers && browsers[activeBrowserIndex];
    if (activeBrowser) {
      template.push({
        label: `Open Link (Active: ${activeBrowser.name})`,
        click: () => {
          if (activeBrowser.path) {
            exec(`"${activeBrowser.path}" "${url}"`);
          } else {
            shell.openExternal(url);
          }
          webContents.send('show-toast', `Opening link in ${activeBrowser.name}...`);
        }
      });
      template.push({ type: 'separator' });
    }

    // 2. Create menu items for all available browsers
    const browserMenuItems = (browsers || []).map((browser: { name: string, path: string }, index: number) => ({
      label: `Open Link in ${browser.name}`,
      click: () => {
        browser.path ? exec(`"${browser.path}" "${url}"`) : shell.openExternal(url);
        webContents.send('show-toast', `Opening link in ${browser.name}...`);
      }
    }));
    template.push(...browserMenuItems);

    // 3. Add the remaining utility actions
    template.push({ type: 'separator' });
    template.push({ label: 'Copy Link', click: () => { clipboard.writeText(url); webContents.send('show-toast', 'Link Copied!'); } });
    template.push({ type: 'separator' });
    template.push({ label: 'Inspect Element', click: () => webContents.inspectElement(x, y) });

    Menu.buildFromTemplate(template).popup({ window: BrowserWindow.fromWebContents(event.sender) });
  });
}