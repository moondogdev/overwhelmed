import { useEffect } from 'react';
import { useTaskState } from './useTaskState';
import { useSettings } from './useSettings';
import { useUIState } from './useUIState';
import { useNavigation } from './useNavigation';
import { useNotifications } from './useNotifications';
import { useDataPersistence } from './useDataPersistence';
import { useInboxState } from './useInboxState';
import { useGlobalTimer } from './useGlobalTimer';

interface UseAppListenersProps {
  taskState: ReturnType<typeof useTaskState>;
  settingsState: ReturnType<typeof useSettings>;
  uiState: ReturnType<typeof useUIState>;
  navigationState: ReturnType<typeof useNavigation>;
  notificationsState: ReturnType<typeof useNotifications>;
  dataPersistenceState: ReturnType<typeof useDataPersistence>;
  inboxState: ReturnType<typeof useInboxState>;
  globalTimerState: ReturnType<typeof useGlobalTimer>;
  snoozeTimeSelectRef: React.RefObject<HTMLSelectElement>;
}

export function useAppListeners({ 
  taskState, 
  settingsState, 
  uiState, 
  navigationState, 
  notificationsState, 
  dataPersistenceState, 
  inboxState, 
  globalTimerState,
  snoozeTimeSelectRef 
}: UseAppListenersProps) {
  // Effect to handle mouse back/forward navigation
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 3) navigationState.goBack(); // Back button
      if (e.button === 4) navigationState.goForward(); // Forward button
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [navigationState.goBack, navigationState.goForward]);

  // Effect to handle keyboard back/forward navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || (activeElement as HTMLElement).isContentEditable)) {
        return;
      }
      if (e.altKey && e.key === 'ArrowLeft') navigationState.goBack();
      else if (e.altKey && e.key === 'ArrowRight') navigationState.goForward();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigationState.goBack, navigationState.goForward]);

  // Effect to handle different shutdown signals from the main process
  useEffect(() => {
    const handleGetDataForQuit = () => {
      // This logic doesn't need the canvas, so it's safe here.
      // It sends the refs, which are guaranteed to have the latest state.
      window.electronAPI.send('data-for-quit', { 
        tasks: taskState.tasksRef.current, 
        completedTasks: taskState.completedTasksRef.current, 
        settings: settingsState.settingsRef.current, 
        inboxMessagesRef: inboxState.inboxMessagesRef, 
        archivedMessagesRef: inboxState.archivedMessagesRef, 
        trashedMessagesRef: inboxState.trashedMessagesRef, 
        activeTimerTaskIdRef: globalTimerState.activeTimerTaskIdRef, 
        activeTimerEntryRef: globalTimerState.activeTimerEntryRef 
      });
    };
    const cleanup = window.electronAPI.on('get-data-for-quit', handleGetDataForQuit);
    return cleanup;
  }, [taskState.tasksRef, taskState.completedTasksRef, settingsState.settingsRef, inboxState.inboxMessagesRef, inboxState.archivedMessagesRef, inboxState.trashedMessagesRef, globalTimerState.activeTimerTaskIdRef, globalTimerState.activeTimerEntryRef]);

  // Effect to handle commands from the ticket context menu
  useEffect(() => {
    const handleMenuCommand = (payload: { command: string, taskId: number, categoryId?: number }) => {
      const { command, taskId, categoryId } = payload;
      const targetTask = [...taskState.tasks, ...taskState.completedTasks].find(w => w.id === taskId);
      if (!targetTask) return;

      switch (command) {
        case 'view':
          settingsState.setSettings(prev => ({ ...prev, activeTaskTabs: { ...prev.activeTaskTabs, [taskId]: 'ticket' } }));
          if (!settingsState.settings.openAccordionIds.includes(taskId)) settingsState.handleAccordionToggle(taskId);
          break;
        case 'edit':
          if (!targetTask.completedDuration) {
            settingsState.setSettings(prev => ({ ...prev, activeTaskTabs: { ...prev.activeTaskTabs, [taskId]: 'edit' }, openAccordionIds: [...new Set([...prev.openAccordionIds, taskId])] }));
          }
          break;
        case 'complete':
          if (!targetTask.completedDuration) taskState.handleCompleteTask(targetTask);
          break;
        case 'skip':
          if (!targetTask.completedDuration) taskState.handleCompleteTask(targetTask, 'skipped');
          break;
        case 'duplicate':
          taskState.handleDuplicateTask(targetTask);
          break;
        case 'copy_as_row':
          taskState.handleCopyTaskAsCsv(taskId);
          break;
        case 'trash':
          taskState.removeTask(taskId);
          break;
        case 'add_to_session':
          settingsState.setSettings(prev => ({
            ...prev,
            workSessionQueue: [...(prev.workSessionQueue || []), taskId]
          }));
          uiState.showToast(`Added "${targetTask.text}" to work session.`);
          break;
        case 'set_category':
          if (categoryId) taskState.handleTaskUpdate({ ...targetTask, categoryId: categoryId });
          uiState.showToast(`Task category updated!`);
          break;
        case 'go_to_next':
          navigationState.handleGoToNextTask(taskId);
          break;
        case 'go_to_previous':
          navigationState.handleGoToPreviousTask(taskId);
          break;
      }
    };
    const cleanup = window.electronAPI.on('context-menu-command', handleMenuCommand);
    return cleanup;
  }, [taskState, settingsState, globalTimerState, uiState]);

  // Effect to handle commands from the toast context menu
  useEffect(() => {
    const handleMenuCommand = (payload: { command: string, taskId?: number }) => {
      const { command, taskId } = payload;
      const targetTask = taskState.tasks.find(w => w.id === taskId);
      if (!targetTask) return;

      switch (command) {
        case 'view':
          navigationState.navigateToTask(taskId);
          settingsState.setSettings(prev => ({ ...prev, activeTaskTabs: { ...prev.activeTaskTabs, [taskId]: 'ticket' } }));
          break;
        case 'edit':
          navigationState.navigateToTask(taskId);
          settingsState.setSettings(prev => ({ ...prev, activeTaskTabs: { ...prev.activeTaskTabs, [taskId]: 'edit' } }));
          break;
        case 'snooze':
          notificationsState.handleSnooze(targetTask);
          break;
        case 'complete':
          taskState.handleCompleteTask(targetTask);
          break;
        case 'view-inbox':
          navigationState.navigateToView('inbox');
          break;
        case 'edit-settings':
          const timeManagementAccordionId = -2;
          settingsState.setSettings(prev => ({ ...prev, openAccordionIds: [...new Set([...prev.openAccordionIds, timeManagementAccordionId])] }));
          setTimeout(() => {
            snoozeTimeSelectRef.current?.focus();
            snoozeTimeSelectRef.current?.classList.add('highlight-setting');
            setTimeout(() => snoozeTimeSelectRef.current?.classList.remove('highlight-setting'), 2000);
          }, 100);
          break;
      }
    };
    const cleanup = window.electronAPI.on('toast-context-menu-command', handleMenuCommand);
    return cleanup;
  }, [taskState, notificationsState, navigationState, settingsState, snoozeTimeSelectRef]);

  // Effect to handle commands from the inbox context menu
  useEffect(() => {
    const handleMenuCommand = (payload: { command: string, taskId?: number, messageId?: number }) => {
      const { command, taskId, messageId } = payload;
      const targetTask = taskState.tasks.find(w => w.id === taskId);

      switch (command) {
        case 'view':
          if (taskId) navigationState.handleInboxItemClick({ id: 0, type: 'overdue', text: '', timestamp: 0, taskId });
          break;
        case 'snooze':
          if (targetTask) notificationsState.handleSnooze(targetTask);
          break;
        case 'complete':
          if (targetTask) taskState.handleCompleteTask(targetTask);
          break;
        case 'dismiss':
          if (messageId) inboxState.setInboxMessages(prev => prev.filter(m => m.id !== messageId));
          break;
      }
    };
    const cleanup = window.electronAPI.on('inbox-context-menu-command', handleMenuCommand);
    return cleanup;
  }, [taskState, notificationsState, navigationState, inboxState]);
  
  useEffect(() => {
    const cleanup = window.electronAPI.on('checklist-section-command', (payload) => { 
      if (payload.command === 'go_to_next') {
        navigationState.handleGoToNextTask(payload.taskId) 
      } else if (payload.command === 'go_to_previous') {
        navigationState.handleGoToPreviousTask(payload.taskId)
      }
    });
    return () => cleanup?.();
  }, [navigationState.handleGoToNextTask]);

  // Effect to handle commands from the navigation context menu
  useEffect(() => {
    const handleMenuCommand = (payload: { command: string }) => {
      const { command } = payload;
      switch (command) {
        case 'back':
          navigationState.goBack();
          break;
        case 'forward':
          navigationState.goForward();
          break;
      }
    };
    const cleanup = window.electronAPI.on('nav-context-menu-command', handleMenuCommand);
    return cleanup;
  }, [navigationState.goBack, navigationState.goForward]);

  // Effect to handle commands from the save button context menu
  useEffect(() => {
    const handleMenuCommand = (payload: { command: string }) => {
      const { command } = payload;
      switch (command) {
        case 'save':
          dataPersistenceState.handleSaveProject();
          break;
        case 'backup':
          uiState.setIsPromptOpen(true);
          break;
      }
    };
    const cleanup = window.electronAPI.on('save-context-menu-command', handleMenuCommand);
    return cleanup;
  }, [dataPersistenceState.handleSaveProject, uiState.setIsPromptOpen]);

  // Effect to handle sidebar toggle hotkey
  useEffect(() => {
    const handleSidebarToggle = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || (activeElement as HTMLElement).isContentEditable)) {
        return;
      }
      if (e.altKey && e.key.toLowerCase() === 's') {
        settingsState.setSettings(prev => ({ ...prev, isSidebarVisible: !prev.isSidebarVisible }));
      }
    };
    window.addEventListener('keydown', handleSidebarToggle);
    return () => window.removeEventListener('keydown', handleSidebarToggle);
  }, [settingsState.setSettings]);

  // Effect to handle browser toggle hotkey
  useEffect(() => {
    const handleBrowserToggle = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || (activeElement as HTMLElement).isContentEditable)) {
        return;
      }
      if (e.key === '`') {
        const newIndex = (settingsState.settings.activeBrowserIndex + 1) % settingsState.settings.browsers.length;
        settingsState.setSettings(prev => ({ ...prev, activeBrowserIndex: newIndex }));
        const newBrowserName = settingsState.settings.browsers[newIndex].name;
        uiState.showToast(`Browser set to: ${newBrowserName}`);
      }
    };
    window.addEventListener('keydown', handleBrowserToggle);
    return () => window.removeEventListener('keydown', handleBrowserToggle);
  }, [settingsState, uiState.showToast]);

  // Effect to handle search command from selection context menu
  useEffect(() => {
    const handleSearchSelection = (selectionText: string) => {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(selectionText)}`;      
      const useDefault = settingsState.settings.useDefaultBrowserForSearch;
      const activeBrowser = settingsState.settings.browsers[settingsState.settings.activeBrowserIndex];
      const payload = {
        url: searchUrl,
        browserPath: useDefault ? undefined : activeBrowser?.path,
      };
      window.electronAPI.openExternalLink(payload);
    };
    const cleanup = window.electronAPI.on('search-google-selection', handleSearchSelection);
    return cleanup;
  }, [settingsState.settings]);

  // Effect to handle search for stock photos from selection context menu
  useEffect(() => {
    const handleStockPhotoSearch = (selectionText: string) => {
      const selectionTextDashes = selectionText.toLowerCase().replace(/\s+/g, '-');
      const searchUrl = `https://depositphotos.com/photos/${selectionTextDashes}.html?filter=all`;
      const activeBrowser = settingsState.settings.browsers[settingsState.settings.activeBrowserIndex];
      const payload = {
        url: searchUrl,
        browserPath: activeBrowser?.path, // Always use the active browser's path.
      };
      window.electronAPI.openExternalLink(payload);
    };
    const cleanup = window.electronAPI.on('search-stock-photos-selection', handleStockPhotoSearch);
    return cleanup;
  }, [settingsState.settings]);

  // Effect for global context menu on text selection
  useEffect(() => {
    const handleGlobalContextMenu = (e: MouseEvent) => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      if (selectedText) {
        e.preventDefault();
        window.electronAPI.showSelectionContextMenu({ selectionText: selectedText, x: e.clientX, y: e.clientY });
      }
    };
    document.addEventListener('contextmenu', handleGlobalContextMenu);
    return () => document.removeEventListener('contextmenu', handleGlobalContextMenu);
  }, []);

  // Effect to handle the Ctrl+S shortcut for saving
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        dataPersistenceState.handleSaveProject();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dataPersistenceState.handleSaveProject]);

  // Effect to handle generic toast messages from the main process
  useEffect(() => {
    const handleShowToast = (message: string) => {
      uiState.showToast(message);
    };
    const cleanup = window.electronAPI.on('show-toast', handleShowToast);
    return cleanup;
  }, [uiState.showToast]);
}