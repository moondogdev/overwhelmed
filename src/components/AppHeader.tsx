import React from 'react';
import { LiveClock } from './SidebarComponents';
import './styles/AppHeader.css';
import { SaveStatus } from './SaveStatus';
import { Settings } from '../types';

interface AppHeaderProps {
  settings: Settings;
  currentView: 'meme' | 'list' | 'reports' | 'inbox' | 'transactions';
  onNavigate: (view: 'meme' | 'list' | 'reports' | 'inbox' | 'transactions') => void;
  isDirty: boolean;
  lastSaveTime: number | null;
  autoSaveCountdown: number;
  onSave: () => void;
  nonTransactionTasksCount: number;
  inboxCount: number;
  transactionCount: number;
  historyIndex: number;
  viewHistory: string[];
}

export function AppHeader({
  settings,
  currentView,
  onNavigate,
  nonTransactionTasksCount,
  inboxCount,
  transactionCount,
  historyIndex, viewHistory
}: AppHeaderProps) {

  return (
    <header className="app-header">
      <div className="external-links">
        {(settings.externalLinks || []).map((link, index) => (
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
          <button onContextMenu={(e) => window.electronAPI.showNavButtonContextMenu({ x: e.clientX, y: e.clientY, canGoBack: historyIndex > 0, canGoForward: historyIndex < viewHistory.length - 1})}
            onClick={() => onNavigate('meme')}
            disabled={currentView === 'meme'}>
            Meme View
          </button>
          <button onContextMenu={(e) => window.electronAPI.showNavButtonContextMenu({ x: e.clientX, y: e.clientY, canGoBack: historyIndex > 0, canGoForward: historyIndex < viewHistory.length - 1})}
            onClick={() => onNavigate('list')}
            disabled={currentView === 'list'}>List ({nonTransactionTasksCount})</button>
          <button onContextMenu={(e) => window.electronAPI.showNavButtonContextMenu({ x: e.clientX, y: e.clientY, canGoBack: historyIndex > 0, canGoForward: historyIndex < viewHistory.length - 1})}
            onClick={() => onNavigate('reports')}
            disabled={currentView === 'reports'}>Reports</button>
          <button onContextMenu={(e) => window.electronAPI.showNavButtonContextMenu({ x: e.clientX, y: e.clientY, canGoBack: historyIndex > 0, canGoForward: historyIndex < viewHistory.length - 1})}
            onClick={() => onNavigate('transactions')}
            disabled={currentView === 'transactions'}>Transactions ({transactionCount})</button>
          <button onContextMenu={(e) => window.electronAPI.showNavButtonContextMenu({ x: e.clientX, y: e.clientY, canGoBack: historyIndex > 0, canGoForward: historyIndex < viewHistory.length - 1})}
            onClick={() => onNavigate('inbox')}
            disabled={currentView === 'inbox'}>Inbox ({inboxCount})</button>
        </div>
      </div>
      <SaveStatus />
    </header>
  );
}