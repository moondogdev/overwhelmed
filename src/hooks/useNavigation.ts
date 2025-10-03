import { useState, useCallback } from 'react';
import { Task, Settings, InboxMessage } from '../types';

interface UseNavigationProps {
  tasks: Task[];
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

export function useNavigation({ tasks, settings, setSettings }: UseNavigationProps) {
  const [viewHistory, setViewHistory] = useState(['meme']);
  const [historyIndex, setHistoryIndex] = useState(0);

  const navigateToView = useCallback((view: 'meme' | 'list' | 'reports' | 'inbox') => {
    const newHistory = viewHistory.slice(0, historyIndex + 1);
    newHistory.push(view);
    setViewHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setSettings(prev => ({ ...prev, currentView: view }));
  }, [viewHistory, historyIndex, setSettings]);

  const navigateToTask = useCallback((taskId: number, sectionId?: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const category = settings.categories.find(c => c.id === task.categoryId);
    const parentId = category ? (category.parentId || category.id) : 'all';
    const subId = category?.parentId ? category.id : 'all';

    setSettings(prev => ({
      ...prev,
      currentView: 'list',
      activeCategoryId: parentId,
      activeSubCategoryId: subId,
      openAccordionIds: [...new Set([...prev.openAccordionIds, taskId])]
    }));

    setTimeout(() => {
      const element = document.querySelector(`[data-task-id='${taskId}']`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (sectionId) {
          setTimeout(() => {
            const sectionElement = element.querySelector(`[data-section-id='${sectionId}']`);
            if (sectionElement) {
              sectionElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              sectionElement.classList.add('highlight-section');
              setTimeout(() => sectionElement.classList.remove('highlight-section'), 2500);
            }
          }, 300);
        }
      }
    }, 100);
  }, [tasks, settings.categories, setSettings]);

  const handleInboxItemClick = useCallback((message: InboxMessage) => {
    if (!message || !message.taskId) return;
    navigateToTask(message.taskId, message.sectionId);
  }, [navigateToTask]);

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSettings(prev => ({ ...prev, currentView: viewHistory[newIndex] as any }));
    }
  }, [historyIndex, viewHistory, setSettings]);

  const goForward = useCallback(() => {
    if (historyIndex < viewHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSettings(prev => ({ ...prev, currentView: viewHistory[newIndex] as any }));
    }
  }, [historyIndex, viewHistory, setSettings]);

  return {
    viewHistory, historyIndex,
    navigateToView, navigateToTask, handleInboxItemClick,
    goBack, goForward,
  };
}