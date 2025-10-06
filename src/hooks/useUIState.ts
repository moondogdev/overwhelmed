import { useState, useCallback, useRef } from 'react';
import { Task, Settings } from '../types';

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
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<'all' | number>('all');
  // New state for bulk add options
  const [bulkAddCategoryId, setBulkAddCategoryId] = useState<number | 'default'>('default');
  const [bulkAddPriority, setBulkAddPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [bulkAddCompleteBy, setBulkAddCompleteBy] = useState<string>('');
  const [bulkAddTransactionType, setBulkAddTransactionType] = useState<'none' | 'income' | 'expense'>('none');
  const [bulkAddYear, setBulkAddYear] = useState<number>(new Date().getFullYear());
  const [bulkAddAccountId, setBulkAddAccountId] = useState<number | undefined>(undefined);
  const [activeTaxCategoryId, setActiveTaxCategoryId] = useState<number | 'all'>('all');
  const [bulkAddTaxCategoryId, setBulkAddTaxCategoryId] = useState<number | undefined>(undefined);
  const [taxStatusFilter, setTaxStatusFilter] = useState<'all' | 'tagged' | 'untagged'>('all');
  const [focusTaxBulkAdd, setFocusTaxBulkAdd] = useState(false);

  const [visibleTaskIds, setVisibleTaskIds] = useState<number[]>([]);
  const [newTask, setNewTask] = useState<Partial<Task>>({
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
    transactionAmount: 0,
    transactionType: 'none',
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
    responses: '',
    linkedTaskOffset: 0, // Initialize the new property
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
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage('');
      toastTimeoutRef.current = null;
    }, duration);
  }, []);

  const handleToggleTaskSelection = useCallback((taskId: number) => {
    setSelectedTaskIds(prevSelectedIds => {
      if (prevSelectedIds.includes(taskId)) {
        return prevSelectedIds.filter(id => id !== taskId);
      } else {
        return [...prevSelectedIds, taskId];
      }
    });
  }, []);

  return {
    activeInboxTab, setActiveInboxTab, fullTaskViewId, setFullTaskViewId, bulkAddText, setBulkAddText,
    isPromptOpen, setIsPromptOpen, isLoading, setIsLoading, isDirty, setIsDirty, lastSaveTime, setLastSaveTime,
    autoSaveCountdown, setAutoSaveCountdown, focusChecklistItemId, setFocusChecklistItemId, searchQuery, setSearchQuery,
    isAddTaskOpen, setIsAddTaskOpen, editingViaContext, setEditingViaContext, newTask, setNewTask,
    isWorkSessionManagerOpen, setIsWorkSessionManagerOpen,
    focusAddTaskInput, selectedTaskIds, setSelectedTaskIds, handleToggleTaskSelection,
    bulkAddCategoryId, setBulkAddCategoryId, bulkAddPriority, setBulkAddPriority,
    selectedYear, setSelectedYear,
    bulkAddCompleteBy, setBulkAddCompleteBy,
    bulkAddTransactionType, setBulkAddTransactionType,
    bulkAddYear, setBulkAddYear,
    bulkAddAccountId, setBulkAddAccountId,
    bulkAddTaxCategoryId, setBulkAddTaxCategoryId,
    activeTaxCategoryId, setActiveTaxCategoryId,
    taxStatusFilter, setTaxStatusFilter,
    visibleTaskIds, setVisibleTaskIds,
    focusTaxBulkAdd, setFocusTaxBulkAdd,
    toastMessage,
    showToast,
  };
}