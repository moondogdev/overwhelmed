import { Settings, Task } from './types';

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
  accounts: [ // Add default accounts
    { id: 1, name: 'Personal' },
    { id: 2, name: 'Business' },
  ],
  activeCategoryId: 'all',
  activeTransactionTypeFilter: 'all', // Default to showing all transaction types
  incomeTypeFilter: 'all', // Default to showing all income types
  activeSubCategoryId: 'all',
  warningTime: 60, // Default to 60 minutes
  sidebarState: 'visible',
  isMiniPlayerVisible: true,
  activeReportTab: 'summary', // Default report tab
  selectedReportYear: null, // Default selected year
  openAccordionIds: [], // Default to no accordions open
  activeTaskTabs: {}, // Default to no specific tabs active
  timerNotificationLevel: 'medium', // Default to medium alerts
  snoozeTime: 'medium', // Default to 5 minutes
  prioritySortConfig: {}, // Now an object to store sort configs per category
  inboxSort: 'date-desc', // Default inbox sort  
  openInboxGroupTypes: [], // Default to no groups open
  taskTypes: [ // Default task types
    { id: 'default', name: 'Default', fields: ['text', 'url', 'priority', 'categoryId', 'openDate', 'completeBy', 'company', 'websiteUrl', 'imageLinks', 'payRate', 'transactionAmount', 'transactionType', 'isRecurring', 'isDailyRecurring', 'isWeeklyRecurring', 'isMonthlyRecurring', 'isYearlyRecurring', 'isAutocomplete', 'description', 'attachments', 'checklist', 'notes'] as (keyof Task)[] },
    { id: 'billing', name: 'Billing', fields: ['text', 'payRate', 'manualTime', 'company', 'openDate', 'completeBy'] as (keyof Task)[] },
    { id: 'research', name: 'Research', fields: ['text', 'url', 'notes', 'description', 'attachments'] as (keyof Task)[] },
  ],
  showChecklistNotes: true, // Default to showing notes
  autoplayNextInSession: false, // Default to off
  workSessionQueue: [],
  checklistTemplates: [],
  inboxMessageFilters: {
    created: true,
    completed: true,
    updated: true,
    deleted: true,
    overdue: true,
    'timer-alert': true,
  },
  autoCategorizeOnBulkAdd: false, // Default to off
  incomeTypeKeywords: { // Initialize income type keywords
    w2: [],
    business: [],
    reimbursement: [],
  },
  taxCategories: [], // Initialize tax categories
  w2Data: {}, // Initialize W-2 data
  // Vehicle & Mileage Information
  vehicleMakeModel: '',
  vehicleType: 'auto_light',
  vehicleDateInService: '',
  vehicleUsedStandardMileage: false,
  vehicleTotalMiles: 0,
  vehicleBusinessMiles: 0,
  vehicleCommutingMiles: 0,
  vehicleAvgDailyCommute: 0,
  vehicleGasPrice: 3.50,
  vehicleMpgLow: 20,
  vehicleMpgHigh: 30,
  vehicleGasCategoryId: undefined,
  vehicleParkingTollsAmount: 0,
  vehicleParkingTollsTaxCategoryId: undefined,
  vehiclePropertyTaxesAmount: 0,
  vehiclePropertyTaxesTaxCategoryId: undefined,
  vehicleLoanInterestAmount: 0,
  vehicleLoanInterestTaxCategoryId: undefined,
  businessName: '',
  businessTypeOfWork: '',
  businessEin: '',
  businessCode: '',
  w2ManagerSelectedYear: new Date().getFullYear(),
  depreciableAssets: [],
  businessData: {},
};