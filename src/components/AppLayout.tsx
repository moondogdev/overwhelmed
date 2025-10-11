import React from 'react';
import { AppHeader as Header } from './AppHeader';
import { Sidebar } from './Sidebar';
import { ListView } from './ListView';
import { ReportsView } from './ReportsView';
import { InboxView } from './InboxView';
import { FullTaskView } from './TaskView';
import { Footer } from './Footer';
import { NotificationCenter as OverdueNotifications } from './NotificationCenter';
import { MiniPlayer } from './MiniPlayer';
import { WorkSessionManager } from './WorkSessionManager';
import { BulkActionBar } from './BulkActionBar';
import { PromptModal } from './Editors';
import { useAppLayout } from '../hooks/useAppLayout';

interface AppLayoutProps {
  contentAreaRef: React.RefObject<HTMLDivElement>;
}

export function AppLayout({ contentAreaRef }: AppLayoutProps) {
  const {
    settings, navigateToView, historyIndex, viewHistory, isDirty, lastSaveTime,
    autoSaveCountdown, handleSaveProject, isPromptOpen, setIsPromptOpen,
    createManualBackup, showToast, setFullTaskViewId, handleTaskUpdate, setSettings,
    isWorkSessionManagerOpen, nonTransactionTasksCount, selectedTaskIds, isLoading,
    inboxMessages, transactionCount, fullTask, sidebarClass
  } = useAppLayout();

  const renderView = () => {
    switch (settings.currentView) {
      case 'list':
        return <ListView />;
      case 'transactions':
        return <ListView />; // The ListView component handles the 'transactions' view logic
      case 'reports':
        return <ReportsView />;
      case 'inbox':
        return <InboxView />;
      default:
        return <ListView />;
    }
  };

  return (
    <div className={`app ${sidebarClass ? `sidebar-${sidebarClass}` : ''}`}>
      <Header
        settings={settings}
        currentView={settings.currentView}
        onNavigate={navigateToView}
        isDirty={isDirty}
        lastSaveTime={lastSaveTime}
        autoSaveCountdown={autoSaveCountdown}
        onSave={handleSaveProject}
        nonTransactionTasksCount={nonTransactionTasksCount}
        transactionCount={transactionCount}
        inboxCount={inboxMessages.length}
        historyIndex={historyIndex} viewHistory={viewHistory}
      />
      <div className="main-content">
        {selectedTaskIds.length > 0 && <BulkActionBar />}
        <Sidebar sidebarState={settings.sidebarState || 'visible'} />
        <div className="content-area" ref={contentAreaRef}>          
          {isLoading ? (
            <div className="loading-indicator">Loading...</div>
          ) : fullTask ? (
            <FullTaskView
              task={fullTask}
              onClose={() => setFullTaskViewId(null)}
              onUpdate={handleTaskUpdate}
              onSettingsChange={setSettings}
            />            
          ) : (
            renderView()
          )}
        </div>
      </div>
      <Footer />
      <OverdueNotifications />
      {settings.isMiniPlayerVisible && <MiniPlayer />}
      {isWorkSessionManagerOpen && (
        <WorkSessionManager />
      )}
      {isPromptOpen && (
        <PromptModal
          isOpen={isPromptOpen}
          title="Create Manual Backup"
          placeholder="Enter a name for your backup..."
          onClose={() => setIsPromptOpen(false)}
          onConfirm={(name) => {
            if (name) {
              createManualBackup(name).then(result => {
                if (result.success) {
                  showToast(`Manual backup "${name}" created!`);
                } else {
                  showToast('Failed to create backup.', 5000);
                }
              });
            }
          }}
        />
      )}
    </div>
  );
}