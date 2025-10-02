import { useState, useCallback, useRef } from 'react';
import { Word, Settings } from '../types';

interface UseUIStateProps {
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  newTaskTitleInputRef: React.RefObject<HTMLInputElement>;
}

export function useUIState({ setSettings, newTaskTitleInputRef }: UseUIStateProps) {
  const [activeInboxTab, setActiveInboxTab] = useState<'active' | 'archived' | 'trash'>('active');
  const [fullTaskViewId, setFullTaskViewId] = useState<number | null>(null);
  const [bulkAddText, setBulkAddText] = useState("");
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [isWorkSessionManagerOpen, setIsWorkSessionManagerOpen] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);
  const [autoSaveCountdown, setAutoSaveCountdown] = useState(300);
  const [focusChecklistItemId, setFocusChecklistItemId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [editingViaContext, setEditingViaContext] = useState<number | null>(null);
  const [copyStatus, setToastStatus] = useState('');
  const copyStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [newTask, setNewTask] = useState<Partial<Word>>({
    text: '',
    url: '',
    taskType: 'default',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    categoryId: 1,
    openDate: new Date().getTime(),
    completeBy: undefined,
    company: '',
    websiteUrl: '',
    imageLinks: [],
    manualTime: 0,
    manualTimeRunning: false,
    manualTimeStart: 0,
    payRate: 0,
    isRecurring: false,
    isDailyRecurring: false,
    isWeeklyRecurring: false,
    isMonthlyRecurring: false,
    isYearlyRecurring: false,
    isAutocomplete: false,
    description: '',
    attachments: [],
    checklist: [],
    lastNotified: undefined,
    snoozedAt: undefined,
    notes: '',
  });

  const focusAddTaskInput = useCallback(() => {
    setIsAddTaskOpen(true);
    setSettings(prev => ({ ...prev, isSidebarVisible: true }));
    // Use a timeout to ensure the accordion is open before focusing.
    setTimeout(() => {
      newTaskTitleInputRef.current?.focus();
    }, 50); // A small delay helps ensure the element is visible
  }, [setIsAddTaskOpen, setSettings, newTaskTitleInputRef]);

  const showToast = useCallback((message: string, duration: number = 2000) => {
    if (copyStatusTimeoutRef.current) {
      clearTimeout(copyStatusTimeoutRef.current);
    }
    setToastStatus(message);
    copyStatusTimeoutRef.current = setTimeout(() => {
      setToastStatus('');
      copyStatusTimeoutRef.current = null;
    }, duration);
  }, []);

  return {
    activeInboxTab, setActiveInboxTab, fullTaskViewId, setFullTaskViewId, bulkAddText, setBulkAddText,
    isPromptOpen, setIsPromptOpen, isLoading, setIsLoading, isDirty, setIsDirty, lastSaveTime, setLastSaveTime,
    autoSaveCountdown, setAutoSaveCountdown, focusChecklistItemId, setFocusChecklistItemId, searchQuery, setSearchQuery,
    isAddTaskOpen, setIsAddTaskOpen, editingViaContext, setEditingViaContext, newTask, setNewTask,
    isWorkSessionManagerOpen, setIsWorkSessionManagerOpen,
    focusAddTaskInput,
    copyStatus,
    showToast,
  };
}