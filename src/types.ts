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
  x: number; // Add x coordinate
  y: number; // Add y coordinate
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
  // Add dimensions for hit detection
  width?: number;
  height?: number;
  openDate: number; // Use a separate field for the editable open date
  createdAt: number; // Timestamp of when the Task was created
  isPaused?: boolean;
  pausedDuration?: number;
  completedDuration?: number; // The final duration when completed
  completionStatus?: 'completed' | 'skipped'; // To distinguish between completed and skipped tasks
  manualTime?: number; // Manually tracked time in ms
  payRate?: number; // Dollars per hour
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
  startsTaskIdOnComplete?: number; // ID of the task to start when this one is completed
  linkedTaskOffset?: number;
  manualTimeStart?: number; // Timestamp when manual timer was started
  timeLog?: TimeLogEntry[];
  timeLogSessions?: TimeLogSession[];
  timeLogTitle?: string;
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
  [key: string]: { key: keyof Task | 'timeOpen', direction: 'ascending' | 'descending' } | null;
}

export interface Settings {
  fontFamily: string;
  fontColor: string;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  isOverlayEnabled: boolean;
  overlayColor: string;
  overlayOpacity: number;
  isDebugModeEnabled: boolean;
  minFontSize: number;
  maxFontSize: number;
  browsers: Browser[];
  activeBrowserIndex: number;
  categories: Category[];
  externalLinks: ExternalLink[];
  currentView: 'meme' | 'list' | 'reports' | 'inbox';
  activeCategoryId?: number | 'all';
  activeSubCategoryId?: number | 'all';
  warningTime: number; // in minutes
  isSidebarVisible: boolean;
  openAccordionIds: number[]; // Persist open accordions
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
  showChecklistResponses?: boolean; // New setting to toggle response visibility
  showChecklistNotes?: boolean; // New setting to toggle note visibility
  autoplayNextInSession?: boolean; // New setting for MiniPlayer V2
  allCategoryColor?: string;
  inboxMessageFilters?: {
    [key in InboxMessage['type']]?: boolean;
  };
  checklistTemplates?: ChecklistTemplate[];
}

export interface AccordionProps {
  title: React.ReactNode;
  children: React.ReactNode;
}