import React from 'react';

export interface Attachment {
  name: string;
  path: string;
}

export interface ChecklistItem {
  id: number;
  text: string;
  isCompleted: boolean;
  response?: string;
  note?: string;
  dueDate?: number; // Timestamp for individual due date
  highlightColor?: string;
  loggedTime?: number; // Time logged against this specific item
  parentId?: number | null; // ID of the parent item for nesting
  level?: number; // Nesting level, e.g., 0 for top-level, 1 for child
}

export interface CodeSnippet {
  id: number;
  title: string;
  code: string;
  language?: string;
  description?: string;
}

export interface TimeLogEntry {
  id: number;
  description: string;
  duration: number; // in milliseconds
  startTime?: number; // timestamp for when it started running
  isRunning?: boolean;
  createdAt?: number; // Timestamp for when the entry was created
  type?: 'entry' | 'header';
  checklistItemId?: number; // Link back to the original checklist item
  isCompleted?: boolean; // New flag to mark as completed
}

export interface ChecklistTemplate {
  id: number;
  name: string;
  sections: ChecklistSection[];
}

export interface TimeLogSession {
  id: number;
  title: string;
  entries: TimeLogEntry[];
  createdAt?: number; // Timestamp for when the session was created
}

export interface RichTextBlock {
  id: number;
  type: 'rich-text';
  content: string;
}

export interface ChecklistSection {
  id: number;
  title: string;
  items: ChecklistItem[];
}

export interface Task {
  id: number;
  text: string;
  // New Task Manager Fields
  url?: string;
  priority?: 'High' | 'Medium' | 'Low';
  categoryId?: number;
  completeBy?: number; // Storing as a timestamp
  company?: string;
  websiteUrl?: string;
  imageLinks?: string[];
  description?: string;
  attachments?: Attachment[]; 
  checklist?: (ChecklistSection | RichTextBlock)[] | ChecklistItem[]; // Support both for migration
  notes?: string;
  responses?: string;
  openDate: number; // Use a separate field for the editable open date
  createdAt: number; // Timestamp of when the Task was created
  completedDuration?: number; // The final duration when completed
  completionStatus?: 'completed' | 'skipped'; // To distinguish between completed and skipped tasks
  manualTime?: number; // Manually tracked time in ms
  payRate?: number; // Dollars per hour
  transactionAmount?: number; // For financial tracking. Positive for income, negative for expense.  
  transactionType?: 'income' | 'expense' | 'none' | 'transfer'; // UI toggle for the transaction amount
  isRecurring?: boolean;
  isDailyRecurring?: boolean;
  isWeeklyRecurring?: boolean;
  isMonthlyRecurring?: boolean;
  isYearlyRecurring?: boolean;
  isAutocomplete?: boolean;
  lastNotified?: number; // Timestamp of the last notification sent for this task
  snoozeCount?: number; // How many times the task has been snoozed
  snoozedAt?: number; // Timestamp of when the last snooze was initiated
  isSilenced?: boolean; // To hide overdue toast without snoozing
  manualTimeRunning?: boolean;
  taskType?: string; // New property for task types
  accountId?: number; // New property for financial accounts
  incomeType?: 'w2' | 'business' | 'reimbursement'; // New property to classify earnings
  startsTaskIdOnComplete?: number; // ID of the task to start when this one is completed
  linkedTaskOffset?: number;
  manualTimeStart?: number; // Timestamp when manual timer was started
  timeLog?: TimeLogEntry[];
  timeLogSessions?: TimeLogSession[];
  codeSnippets?: CodeSnippet[]; // New field for code snippets
  timeLogTitle?: string;
  taxCategoryId?: number; // New property for tax categorization
}

export interface InboxMessage {
  id: number;
  type: 'overdue' | 'timer-alert' | 'created' | 'completed' | 'deleted' | 'updated';
  text: string;
  timestamp: number;
  taskId?: number; // Optional: link back to the task
  sectionId?: number; // Optional: for checklist items
  isImportant?: boolean;
  isArchived?: boolean;
}

export interface Browser {
  name: string;
  path: string;
}

export interface Category {
  id: number;
  name: string;
  parentId?: number; // If present, this is a sub-category
  color?: string; // Add color property
  autoCategorizationKeywords?: string[]; // Keywords for auto-categorization
  deductiblePercentage?: number; // New: For transaction sub-categories
}

export interface TaxCategory {
  id: number;
  name: string;
  keywords: string[];
  deductiblePercentage?: number;
}

export interface W2Data {
  wages: number;
  federalWithholding: number;
  socialSecurityWithholding: number;
  medicareWithholding: number;
  taxpayerPin?: string;
  employerEin?: string;
  employerName?: string;
  employerAddress?: string;
  employeeName?: string;
  employeeAddress?: string;
}

export interface DepreciableAsset {
  id: number;
  description: string;
  dateAcquired: string;
  cost: number;
  purchasedNew?: boolean;
  dateSold?: string;
  businessUsePercentage?: number;
  assetCategory?: 'computer_etc' | 'equipment' | 'real_estate' | 'other';
  assetType?: 'computer' | 'cell_phone' | 'photo_video' | 'copier';
  priorYear179Expense?: number;
  recoveryPeriod?: '5-year' | '7-year';
  priorYearDepreciation?: number;
  priorYearAmtDepreciation?: number;
  priorYearBonusDepreciationTaken?: boolean;
  isFullyDepreciated?: boolean;
  currentYearDepreciation?: number;
}

export interface Account {
  id: number;
  name: string;
}

export interface TaskType {
  id: string; // e.g., 'billing', 'research'
  name: string; // e.g., 'Billing', 'Research'
  fields: (keyof Task)[]; // Array of field names to show for this type
}

export interface ExternalLink {
  name: string;
  url: string;
  openInDefault?: boolean;
}

export interface PrioritySortConfig {
  [key:string]: { key: keyof Task | 'timeOpen' | 'price', direction: 'asc' | 'desc' } | null;
}

export interface Settings {
  isDebugModeEnabled: boolean;
  browsers: Browser[];
  activeBrowserIndex: number;
  categories: Category[];
  externalLinks: ExternalLink[];
  accounts: Account[]; // Add accounts to settings
  activeAccountId?: number | 'all'; // Persist active account filter
  activeTransactionTypeFilter?: 'all' | 'income' | 'expense' | 'transfer'; // New filter for income/expense
  incomeTypeFilter?: 'all' | 'w2' | 'business' | 'reimbursement' | 'untagged';
  taxStatusFilter?: 'all' | 'tagged' | 'untagged';
  currentView: 'list' | 'reports' | 'inbox' | 'transactions';
  activeCategoryId?: number | 'all';
  activeSubCategoryId?: number | 'all';
  warningTime: number; // in minutes
  sidebarState?: 'visible' | 'focused' | 'hidden';
  isMiniPlayerVisible?: boolean;
  initialReportTab?: 'summary' | 'earnings' | 'activity' | 'raw' | 'history' | 'finances' | 'taxes';
  activeReportTab?: 'summary' | 'earnings' | 'activity' | 'raw' | 'history' | 'finances' | 'taxes';
  selectedReportYear?: number | 'all' | null;
  openAccordionIds: number[]; // Persist open accordions
  activeTaxCategoryId?: number | 'all';
  activeTaskTabs: { [key: number]: 'ticket' | 'edit' }; // Persist active tab per task
  workSessionQueue: number[];
  timerNotificationLevel: 'silent' | 'low' | 'medium' | 'high';
  prioritySortConfig?: PrioritySortConfig;
  autoBackupLimit?: number;
  snoozeTime: 'low' | 'medium' | 'high' | 'long'; // New setting for snooze duration
  editorHeights?: { [key: string]: string };
  useDefaultBrowserForSearch?: boolean; // New global setting
  inboxSort?: 'date-desc' | 'date-asc' | 'type' | 'important';
  openInboxGroupTypes?: string[];
  taskTypes?: TaskType[];
  openChecklistSectionIds?: number[]; // New setting to store open/collapsed checklist sections
  openTaskViewAccordions?: { [taskId: number]: { [accordionKey: string]: boolean } };
  openTaskEditAccordions?: { [taskId: number]: { [accordionKey: string]: boolean } };
  showChecklistResponses?: boolean; // New setting to toggle response visibility
  showChecklistNotes?: boolean; // New setting to toggle note visibility
  autoplayNextInSession?: boolean; // New setting for MiniPlayer V2
  allCategoryColor?: string;
  inboxMessageFilters?: {
    [key in InboxMessage['type']]?: boolean;
  };
  checklistTemplates?: ChecklistTemplate[];
  autoCategorizeOnBulkAdd?: boolean; // New setting for auto-categorization
  incomeTypeKeywords?: {
    w2: string[];
    business: string[];
    reimbursement: string[];
  };
  taxCategories?: TaxCategory[]; // New setting for tax categories
  w2Data?: { [year: number]: W2Data };
  // Vehicle & Mileage Information
  vehicleMakeModel?: string;
  vehicleType?: 'auto_light' | 'truck_van_suv_light' | 'truck_van_heavy' | 'suv_heavy';
  vehicleDateInService?: string;
  vehicleUsedStandardMileage?: boolean;
  vehicleTotalMiles?: number;
  vehicleBusinessMiles?: number;
  vehicleCommutingMiles?: number;
  vehicleAvgDailyCommute?: number;
  vehicleGasPrice?: number;
  vehicleMpgLow?: number;
  vehicleMpgHigh?: number;
  vehicleGasCategoryId?: number;
  vehicleParkingTollsAmount?: number;
  vehicleParkingTollsTaxCategoryId?: number;
  vehiclePropertyTaxesAmount?: number;
  vehiclePropertyTaxesTaxCategoryId?: number;
  vehicleLoanInterestAmount?: number;
  vehicleLoanInterestTaxCategoryId?: number;
  businessName?: string;
  businessTypeOfWork?: string;
  businessEin?: string;
  businessCode?: string;
  w2ManagerSelectedYear?: number;
  depreciableAssets?: DepreciableAsset[];
  businessData?: {
    [year: number]: {
      otherGrossReceipts?: number;
      returnsAndAllowances?: number;
      miscIncome?: number;
      qbiEffectivelyConnected?: boolean;
      qbiFormerEmployer?: boolean;
    };
  };
}

export interface AccordionProps {
  title: React.ReactNode;
  children: React.ReactNode;
}

export interface TaskContextMenuPayload {
  taskId: number;
  x: number;
  y: number;
  isInEditMode: boolean;
  hasCompletedTasks: boolean;
  categories: Category[];
  taxCategories?: TaxCategory[];
  isIncome?: boolean;
  incomeType?: 'w2' | 'business' | 'reimbursement';
}