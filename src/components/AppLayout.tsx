import React, { useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { AppHeader as Header } from './AppHeader';
import { Sidebar } from './Sidebar';
import { ListView } from './ListView';
import { ReportsView } from './ReportsView';
import { MemeView } from './MemeView';
import { InboxView } from './InboxView';
import { FullTaskView } from './TaskView';
import { Footer } from './Footer';
import { NotificationCenter as OverdueNotifications } from './NotificationCenter';
import { MiniPlayer } from './MiniPlayer';
import { WorkSessionManager } from './WorkSessionManager';
import { BulkActionBar } from './BulkActionBar';
import { PromptModal } from './Editors';

interface AppLayoutProps {
  contentAreaRef: React.RefObject<HTMLDivElement>;
}

export function AppLayout({ contentAreaRef }: AppLayoutProps) {
  const {
    settings,
    navigateToView,
    historyIndex,
    viewHistory,
    isDirty,
    lastSaveTime,
    autoSaveCountdown,
    handleSaveProject,
    isPromptOpen,
    setIsPromptOpen,
    createManualBackup,
    showToast,
    fullTaskViewId,
    setFullTaskViewId,
    tasks,
    handleTaskUpdate,
    setSettings,
    isWorkSessionManagerOpen,
    setIsWorkSessionManagerOpen,
    nonTransactionTasksCount,
    selectedTaskIds,
    inboxMessages,
  } = useAppContext();

  const transactionCount = useMemo(() => {
    const transactionsCategory = settings.categories.find(c => c.name === 'Transactions');
    if (!transactionsCategory) return 0;
    const transactionSubCategoryIds = new Set(settings.categories.filter(c => c.parentId === transactionsCategory.id).map(c => c.id));
    return tasks.filter(t => t.categoryId === transactionsCategory.id || (t.categoryId && transactionSubCategoryIds.has(t.categoryId))).length;
  }, [tasks, settings.categories]);

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
      case 'meme':
      default:
        return <MemeView />;
    }
  };

  const fullTask = fullTaskViewId ? tasks.find(t => t.id === fullTaskViewId) : null;

  const sidebarClass = settings.sidebarState === 'hidden' ? 'hidden' : (settings.sidebarState === 'focused' ? 'focused' : '');

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
          {fullTask ? (
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