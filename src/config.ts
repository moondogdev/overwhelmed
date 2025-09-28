import { Settings } from './types';

export const defaultSettings: Settings = {
  fontFamily: "Arial",
  fontColor: "#FFFFFF",
  shadowColor: "#000000",
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  isOverlayEnabled: false,
  overlayColor: "#000000",
  overlayOpacity: 0.3,
  isDebugModeEnabled: false,
  minFontSize: 20,
  maxFontSize: 80,
  browsers: [
    { name: 'Default', path: '' },
    { name: 'Chrome', path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' },
  ],
  activeBrowserIndex: 0,
  categories: [
    { id: 1, name: 'Work' },
    { id: 2, name: 'Projects' },
    { id: 3, name: 'Development' },
  ],
  externalLinks: [
    { name: 'Ticket Site', url: 'https://americancreative.freshdesk.com/a/tickets/filters/search?label=Unresolved%20tickets&q[]=status%3Fis_in%3A%5B0%5D&q[]=agent%3Fis_in%3A%5B0%5D&ref=unresolved' },
    { name: 'GitHub', url: 'https://github.com/moondogdev/overwhelmed' },
  ],
  currentView: 'meme',
  activeCategoryId: 'all',
  activeSubCategoryId: 'all',
  warningTime: 60, // Default to 60 minutes
  isSidebarVisible: true,
  openAccordionIds: [], // Default to no accordions open
  activeTaskTabs: {}, // Default to no specific tabs active
  timerNotificationLevel: 'medium', // Default to medium alerts
  snoozeTime: 'medium', // Default to 5 minutes
  prioritySortConfig: {}, // Now an object to store sort configs per category
  inboxSort: 'date-desc', // Default inbox sort  
  openInboxGroupTypes: [], // Default to no groups open
  taskTypes: [ // Default task types
    { id: 'default', name: 'Default', fields: ['text', 'url', 'priority', 'categoryId', 'openDate', 'completeBy', 'company', 'websiteUrl', 'imageLinks', 'payRate', 'isRecurring', 'isDailyRecurring', 'isWeeklyRecurring', 'isMonthlyRecurring', 'isYearlyRecurring', 'isAutocomplete', 'description', 'attachments', 'checklist', 'notes'] },
    { id: 'billing', name: 'Billing', fields: ['text', 'payRate', 'manualTime', 'company', 'openDate', 'completeBy'] },
    { id: 'research', name: 'Research', fields: ['text', 'url', 'notes', 'description', 'attachments'] },
  ],
  showChecklistNotes: true, // Default to showing notes
};