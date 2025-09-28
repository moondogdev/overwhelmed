import React from 'react';
import { LiveClock } from './SidebarComponents';
import { useAppContext } from '../contexts/AppContext';

export function AppHeader() {
  const {
    settings,
    setSettings,
    historyIndex,
    viewHistory,
    navigateToView,
    inboxMessages
  } = useAppContext();

  return (
    <header className="app-header">
      <div className="external-links">
        {settings.externalLinks.map((link, index) => (
          <button key={index} onClick={() => {
            const payload = {
              url: link.url,
              browserPath: link.openInDefault ? undefined : settings.browsers[settings.activeBrowserIndex]?.path
            };
            window.electronAPI.openExternalLink(payload);
          }}>
            {link.name}
          </button>
        ))}
      </div>
      <div className='app-header-nav-centered'>
        <div className='clock-header-container'><LiveClock /></div>
        <div className="app-nav-buttons">
          <button onContextMenu={(e) => window.electronAPI.showNavButtonContextMenu({ x: e.clientX, y: e.clientY, canGoBack: historyIndex > 0, canGoForward: historyIndex < viewHistory.length - 1 })}
            onClick={() => navigateToView('meme')}
            disabled={settings.currentView === 'meme'}>
            Meme View
          </button>
          <button onContextMenu={(e) => window.electronAPI.showNavButtonContextMenu({ x: e.clientX, y: e.clientY, canGoBack: historyIndex > 0, canGoForward: historyIndex < viewHistory.length - 1 })}
            onClick={() => navigateToView('list')}
            disabled={settings.currentView === 'list'}>List View</button>
          <button onContextMenu={(e) => window.electronAPI.showNavButtonContextMenu({ x: e.clientX, y: e.clientY, canGoBack: historyIndex > 0, canGoForward: historyIndex < viewHistory.length - 1 })}
            onClick={() => navigateToView('reports')}
            disabled={settings.currentView === 'reports'}>Reports View</button>
          <button onContextMenu={(e) => window.electronAPI.showNavButtonContextMenu({ x: e.clientX, y: e.clientY, canGoBack: historyIndex > 0, canGoForward: historyIndex < viewHistory.length - 1 })}
            onClick={() => navigateToView('inbox')}
            disabled={settings.currentView === 'inbox'}>Inbox ({inboxMessages.length})</button>
        </div>
      </div>
      <button className="icon-button" onClick={() => setSettings(prev => ({ ...prev, isSidebarVisible: !prev.isSidebarVisible }))} title="Toggle Sidebar (Alt+S)"><i className="fas fa-cog"></i></button>
    </header>
  );
}