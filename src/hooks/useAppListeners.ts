import { useEffect } from 'react';
import { useTaskState } from './useTaskState';
import { useSettings } from './useSettings';
import { useUIState } from './useUIState';
import { useNavigation } from './useNavigation';
import { useNotifications } from './useNotifications';
import { useDataPersistence } from './useDataPersistence';
import { useInboxState } from './useInboxState';

interface UseAppListenersProps {
  taskState: ReturnType<typeof useTaskState>;
  settingsState: ReturnType<typeof useSettings>;
  uiState: ReturnType<typeof useUIState>;
  navigationState: ReturnType<typeof useNavigation>;
  notificationsState: ReturnType<typeof useNotifications>;
  dataPersistenceState: ReturnType<typeof useDataPersistence>;
  inboxState: ReturnType<typeof useInboxState>;
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
      // It just sends the current state.
      window.electronAPI.send('data-for-quit', { words: taskState.words, completedWords: taskState.completedWords, settings: settingsState.settings, inboxMessages: inboxState.inboxMessages, archivedMessages: inboxState.archivedMessages, trashedMessages: inboxState.trashedMessages });
    };
    const cleanup = window.electronAPI.on('get-data-for-quit', handleGetDataForQuit);
    return cleanup;
  }, [taskState.words, taskState.completedWords, settingsState.settings, inboxState.inboxMessages, inboxState.archivedMessages, inboxState.trashedMessages]);

  // Effect to handle commands from the ticket context menu
  useEffect(() => {
    const handleMenuCommand = (payload: { command: string, wordId: number }) => {
      const { command, wordId } = payload;
      const targetWord = [...taskState.words, ...taskState.completedWords].find(w => w.id === wordId);
      if (!targetWord) return;

      switch (command) {
        case 'view':
          settingsState.setSettings(prev => ({ ...prev, activeTaskTabs: { ...prev.activeTaskTabs, [wordId]: 'ticket' } }));
          if (!settingsState.settings.openAccordionIds.includes(wordId)) settingsState.handleAccordionToggle(wordId);
          break;
        case 'edit':
          if (!targetWord.completedDuration) {
            settingsState.setSettings(prev => ({ ...prev, activeTaskTabs: { ...prev.activeTaskTabs, [wordId]: 'edit' }, openAccordionIds: [...new Set([...prev.openAccordionIds, wordId])] }));
          }
          break;
        case 'complete':
          if (!targetWord.completedDuration) taskState.handleCompleteWord(targetWord);
          break;
        case 'duplicate':
          taskState.handleDuplicateTask(targetWord);
          break;
        case 'trash':
          taskState.removeWord(wordId);
          break;
      }
    };
    const cleanup = window.electronAPI.on('context-menu-command', handleMenuCommand);
    return cleanup;
  }, [taskState, settingsState]);

  // Effect to handle commands from the toast context menu
  useEffect(() => {
    const handleMenuCommand = (payload: { command: string, wordId?: number }) => {
      const { command, wordId } = payload;
      const targetWord = taskState.words.find(w => w.id === wordId);
      if (!targetWord) return;

      switch (command) {
        case 'view':
          navigationState.navigateToTask(wordId);
          settingsState.setSettings(prev => ({ ...prev, activeTaskTabs: { ...prev.activeTaskTabs, [wordId]: 'ticket' } }));
          break;
        case 'edit':
          navigationState.navigateToTask(wordId);
          settingsState.setSettings(prev => ({ ...prev, activeTaskTabs: { ...prev.activeTaskTabs, [wordId]: 'edit' } }));
          break;
        case 'snooze':
          notificationsState.handleSnooze(targetWord);
          break;
        case 'complete':
          taskState.handleCompleteWord(targetWord);
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
    const handleMenuCommand = (payload: { command: string, wordId?: number, messageId?: number }) => {
      const { command, wordId, messageId } = payload;
      const targetWord = taskState.words.find(w => w.id === wordId);

      switch (command) {
        case 'view':
          if (wordId) navigationState.handleInboxItemClick({ id: 0, type: 'overdue', text: '', timestamp: 0, wordId });
          break;
        case 'snooze':
          if (targetWord) notificationsState.handleSnooze(targetWord);
          break;
        case 'complete':
          if (targetWord) taskState.handleCompleteWord(targetWord);
          break;
        case 'dismiss':
          if (messageId) inboxState.setInboxMessages(prev => prev.filter(m => m.id !== messageId));
          break;
      }
    };
    const cleanup = window.electronAPI.on('inbox-context-menu-command', handleMenuCommand);
    return cleanup;
  }, [taskState, notificationsState, navigationState, inboxState]);

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
}