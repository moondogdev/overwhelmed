import { useState, useCallback } from 'react';
import { Word, Settings, InboxMessage } from '../types';

interface UseNavigationProps {
  words: Word[];
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

export function useNavigation({ words, settings, setSettings }: UseNavigationProps) {
  const [viewHistory, setViewHistory] = useState(['meme']);
  const [historyIndex, setHistoryIndex] = useState(0);

  const navigateToView = useCallback((view: 'meme' | 'list' | 'reports' | 'inbox') => {
    const newHistory = viewHistory.slice(0, historyIndex + 1);
    newHistory.push(view);
    setViewHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setSettings(prev => ({ ...prev, currentView: view }));
  }, [viewHistory, historyIndex, setSettings]);

  const navigateToTask = useCallback((wordId: number, sectionId?: number) => {
    const word = words.find(w => w.id === wordId);
    if (!word) return;

    const category = settings.categories.find(c => c.id === word.categoryId);
    const parentId = category ? (category.parentId || category.id) : 'all';
    const subId = category?.parentId ? category.id : 'all';

    setSettings(prev => ({
      ...prev,
      currentView: 'list',
      activeCategoryId: parentId,
      activeSubCategoryId: subId,
      openAccordionIds: [...new Set([...prev.openAccordionIds, wordId])]
    }));

    setTimeout(() => {
      const element = document.querySelector(`[data-word-id='${wordId}']`);
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
  }, [words, settings.categories, setSettings]);

  const handleInboxItemClick = useCallback((message: InboxMessage) => {
    if (!message || !message.wordId) return;
    navigateToTask(message.wordId, message.sectionId);
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