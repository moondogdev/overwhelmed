# Project Definitions & Declaratives

This file serves as a central glossary for the project's key architectural components, primarily its custom hooks. Its purpose is to provide a clear, at-a-glance understanding of where specific logic and state are managed.

This document should be updated whenever new declarative logic is implemented.

---

## Custom Hooks

This application follows an **Orchestrator Component** pattern (see Rule 69.0). The root `<App>` component initializes all the custom hooks below and provides their state to the entire application via the `AppContext`.

### `useTaskState`
-   **File**: `src/hooks/useTaskState.ts`
-   **Responsibility**: Manages all state and logic directly related to creating, updating, deleting, and managing tasks.
-   **Exposed State**: `words`, `completedWords`, `confirmingClearCompleted`.
-   **Exposed Handlers**: `handleCompleteWord`, `removeWord`, `handleDuplicateTask`, `handleReopenTask`, `handleClearCompleted`, `handleCreateNewTask`, `handleWordUpdate`, `handleChecklistCompletion`, `handleClearAll`, `handleBulkAdd`, `handleCopyList`, `handleTogglePause`, `moveWord`.

### `useUIState`
-   **File**: `src/hooks/useUIState.ts`
-   **Responsibility**: Manages all global UI state, such as loading indicators, modals, the "dirty" (unsaved) flag, and the central toast notification system. It also holds the state for the "Add New Task" form.
-   **Exposed State**: `isLoading`, `isDirty`, `lastSaveTime`, `autoSaveCountdown`, `isPromptOpen`, `copyStatus` (toast message), `newTask`, `searchQuery`, etc.
-   **Exposed Handlers**: `setIsLoading`, `setIsDirty`, `showToast`, `focusAddTaskInput`, etc.

### `useSettings`
-   **File**: `src/hooks/useSettings.ts`
-   **Responsibility**: Manages the large `settings` object, which contains all user-configurable preferences for the application.
-   **Exposed State**: `settings`.
-   **Exposed Handlers**: `setSettings`, `setActiveCategoryId`, `handleResetSettings`, `handleAccordionToggle`, etc.

### `useInboxState`
-   **File**: `src/hooks/useInboxState.ts`
-   **Responsibility**: Manages the state for the three inbox tabs (Active, Archived, Trash) and all handlers for moving messages between them.
-   **Exposed State**: `inboxMessages`, `archivedMessages`, `trashedMessages`.
-   **Exposed Handlers**: `handleArchiveInboxMessage`, `handleRestoreFromTrash`, `handleEmptyTrash`, `handleToggleImportant`, etc.

### `useDataPersistence`
-   **File**: `src/hooks/useDataPersistence.ts`
-   **Responsibility**: Manages all interaction with the filesystem via `electron-store`. This includes loading all data on startup, handling manual saves, auto-saves, imports, and exports.
-   **Exposed Handlers**: `handleSaveProject`, `handleExport`, `handleImport`.

### `useNotifications`
-   **File**: `src/hooks/useNotifications.ts`
-   **Responsibility**: Manages the state and logic for all time-based notifications, including overdue task alerts and approaching deadline warnings.
-   **Exposed State**: `timerNotifications`, `overdueNotifications`.
-   **Exposed Handlers**: `handleTaskOverdue`, `handleSnooze`, `handleSnoozeAll`, `handleCompleteAllOverdue`, etc.

### `useGlobalTimer`
-   **File**: `src/hooks/useGlobalTimer.ts`
-   **Responsibility**: Manages the state for the single, globally active timer shown in the "Mini Player."
-   **Exposed State**: `activeTimerWordId`, `activeTimerEntry`, `activeTimerLiveTime`.
-   **Exposed Handlers**: `handleGlobalToggleTimer`, `handleGlobalStopTimer`, `handleAddNewTimeLogEntryAndStart`.

### `useChecklist`
-   **File**: `src/hooks/useChecklist.ts`
-   **Responsibility**: Manages all state and logic for an individual checklist, including item management, section management, content blocks, undo/redo history, and IPC command handling.
-   **Exposed State**: `history`, `historyIndex`, `editingItemId`, `editingSectionId`, `editingContentBlockId`, etc.
-   **Exposed Handlers**: `handleAddItem`, `handleUpdateItemText`, `handleAddSection`, `handleMoveBlock`, `handleAssociateBlock`, `handleDetachFromBlock`, `handleUndo`, `handleRedo`, etc.

### `useEditingState`
-   **File**: `src/hooks/useEditingState.ts`
-   **Responsibility**: Manages the state for in-place editing of a task's title in the main list view.
-   **Exposed State**: `editingWordId`, `editingText`.
-   **Exposed Handlers**: `handleEdit`, `handleEditChange`, `handleEditKeyDown`.

### `useNavigation`
-   **File**: `src/hooks/useNavigation.ts`
-   **Responsibility**: Manages the application's view history for browser-style back/forward navigation.
-   **Exposed State**: `viewHistory`, `historyIndex`.
-   **Exposed Handlers**: `navigateToView`, `navigateToTask`, `goBack`, `goForward`.

### `useAppListeners`
-   **File**: `src/hooks/useAppListeners.ts`
-   **Responsibility**: A special hook that contains no state. Its only job is to set up all the `useEffect` listeners for IPC events coming from the main process (e.g., context menu commands, shutdown requests). It acts as the central hub for all communication received from the backend.

### `useAppContextValue`
-   **File**: `src/hooks/useAppContextValue.ts`
-   **Responsibility**: A helper hook that takes the state objects returned by all the other hooks and assembles them into the final, flat `AppContextType` object that is passed to the `AppContext.Provider`.

## Interfaces

### `AccordionProps` Interface
```ts
interface AccordionProps {
  title: React.ReactNode;
  children: React.ReactNode;
}
```
---
### `Attachment` Interface
```typescript
interface Attachment {
  name: string;
  path: string;
}
```
---
### `Browser` Interface
```typescript
interface Browser {
  name: string;
  path: string;
}
```
---

### `Category` Interface 

```ts
interface Category {
  id: number;
  name: string;
  parentId?: number; // If present, this is a sub-category
  color?: string; // Add color property
}
```
---  
### `ChecklistItem` Interface
```typescript
interface ChecklistItem {
  id: number;
  text: string;
  isCompleted: boolean;
  response?: string;
  note?: string;
  dueDate?: number;
  highlightColor?: string;
  level?: number;
  parentId?: number | null;

}
```
---
### `ChecklistSection` Interface
```ts
interface ChecklistSection {
  id: number;
  title: string;
  items: ChecklistItem[];
}
```
---
### `ChecklistTemplate` Interface
```typescript
interface ChecklistTemplate {
  id: number;
  name: string;
  sections: ChecklistSection[];
}
```
---
### `TimeLogEntry` Interface
```typescript
interface TimeLogEntry {
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
```
---
### `TimeLogSession` Interface
```typescript
interface TimeLogSession {
  id: number;
  title: string;
  entries: TimeLogEntry[];
  createdAt?: number; // Timestamp for when the session was created
}
```
### `FullTaskViewProps` Interface (deprecated)
### `InboxMessage` Interface
```ts
interface InboxMessage {
  id: number;
  type: 'overdue' | 'timer-alert' | 'created' | 'completed' | 'deleted' | 'updated';
  text: string;
  timestamp: number;
  taskId?: number;
  sectionId?: number;
  isImportant?: boolean;
  isArchived?: boolean;
}
```
### `PrioritySortConfig` Interface
```ts
interface PrioritySortConfig {
  [key: string]: { key: keyof Task | 'timeOpen', direction: 'ascending' | 'descending' } | null;
}
```
---
### `PromptModalProps` Interface
```typescript
interface PromptModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (inputValue: string) => void;
  placeholder?: string;
  initialValue?: string;
}
```
---
### `TabbedViewProps` Interface (deprecated)
---
### `TaskType` Interface
```ts
interface TaskType {
  id: string;
  name: string;
  fields: (keyof Word)[];
}
```
---
### `Settings` Interface
```ts
interface Settings {
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
  warningTime: number;
  isSidebarVisible: boolean;
  openAccordionIds: number[];
  activeTaskTabs: { [key: number]: 'ticket' | 'edit' };
  timerNotificationLevel: 'silent' | 'low' | 'medium' | 'high';
  prioritySortConfig?: PrioritySortConfig;
  autoBackupLimit?: number;
  snoozeTime: 'low' | 'medium' | 'high';
  editorHeights?: { [key: string]: string };
  useDefaultBrowserForSearch?: boolean;
  inboxSort?: 'date-desc' | 'date-asc' | 'type';
  openInboxGroupTypes?: string[];
  taskTypes?: TaskType[];
  openChecklistSectionIds?: number[];
  allCategoryColor?: string;
}
```
---
### `Task` Interface
```ts
interface Task {
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
  checklist?: ChecklistSection[] | ChecklistItem[]; // Support both for migration
  notes?: string;
  // Add dimensions for hit detection
  width?: number;
  height?: number;
  openDate: number; // Use a separate field for the editable open date
  createdAt: number; // Timestamp of when the word was created
  isPaused?: boolean;
  pausedDuration?: number;
  completedDuration?: number; // The final duration when completed
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
  manualTimeRunning?: boolean;
  taskType?: string; // New property for task types
  startsTaskIdOnComplete?: number; // ID of the task to start when this one is completed
  manualTimeStart?: number; // Timestamp when manual timer was started
}

```
## Interface Descriptions

### `Task`

---

### `ChecklistItem`
-   **Description**: An object representing a single item within a `Checklist`.
-   **`response?: string`**: An optional public response or comment related to the checklist item. This field is intended to be visible when copying or exporting the checklist.
-   **`note?: string`**: An optional private note for the checklist item. This field is for internal use and should not be included in copied or exported content.

### `ChecklistItem.highlightColor`
-   **Description**: An optional string that stores a hex color code (e.g., `#f4d03f`). If present, the UI will apply a visual highlight of this color to the checklist item.

### `extractUrlFromText(text: string): string | null`
-   **Description**: A helper function that takes a string and uses a regular expression to find and return the first `http` or `https` URL it contains. Returns `null` if no URL is found.

### `formatChecklistSectionRawForCopy(section: ChecklistSection): string`
-   **Description**: A helper function that takes a single checklist section and returns a plain-text string containing only the text of its items, separated by newlines. Used for the "Copy Raw" feature.

---

## Components

### `TaskAccordionHeader`
-   **Description**: A dedicated component that renders the title and subtitle area for a task in the list view. It includes the task title, category pills, priority, and time-related information in a compact, organized layout.

### `Dropdown`
-   **Description**: A reusable component that displays a menu of items when a trigger element is hovered over. Used for the recurring task options in the task action controls.

### `ClickableText`
-   **Description**: A React component that takes a text string as a prop. It uses `extractUrlFromText` to find any URL within the text. If a URL is found, it renders the text with the URL as a clickable `<a>` tag that opens the link externally. Otherwise, it renders the text as a normal `<span>`.

---

## IPC Channels (Main <-> Renderer Communication)

These are the channels defined in `preload.ts` and handled in `index.ts` that allow the frontend (Renderer) to communicate with the backend (Main).

### `electron-store-get` / `electron-store-set`
-   **Description**: The primary channels for reading from and writing to the `config.json` data file. The renderer invokes these to request data persistence from the main process.

### `show-*-context-menu`
-   **Description**: A family of channels (`show-task-context-menu`, `show-inbox-item-context-menu`, etc.) used to request that the main process build and display a native right-click context menu.

### `show-checklist-note-context-menu` / `show-checklist-response-context-menu`
-   **Description**: Specific channels for showing a focused context menu when a user right-clicks directly on a checklist item's note or response field.

### `*-context-menu-command`
-   **Description**: A corresponding family of channels (`context-menu-command`, `inbox-context-menu-command`, etc.) that the main process uses to send the selected menu action *back* to the renderer for it to execute.

### `get-data-for-quit` / `data-for-quit`
-   **Description**: The channels used for the graceful shutdown sequence. The main process sends `get-data-for-quit` to the renderer, which then replies with its current state on the `data-for-quit` channel before the main process saves and quits. See Rule 09.0.


### `auto-save-data`
-   **Description**: The channel used by the renderer's auto-save timer to send the current application state to the main process for a background save.

### `renderer-ready-for-startup-backup`
-   **Description**: A channel sent once by the renderer on startup after it has loaded all its data. This signals the main process that it is safe to create the automatic startup backup.

### `notify-dirty-state`
-   **Description**: A channel the renderer uses to inform the main process whenever the `isDirty` (unsaved changes) flag changes. This allows the main process to know whether to show the "Save and Quit" dialog without having to ask the renderer first.

---

## Architectural Patterns

### State Management for Tabbed Views (Rule 40.0)

This pattern explains why we use separate state arrays for different views (e.g., `inboxMessages`, `archivedMessages`) instead of a single array with flags.

-   **The Problem**: Using a single large array and filtering it on every render (`messages.filter(m => m.isArchived)`) is inefficient and causes UI lag as the number of items grows.

-   **The Solution**: We maintain separate state arrays for each view.
    ```typescript
    const [inboxMessages, setInboxMessages] = useState<InboxMessage[]>([]);
    const [archivedMessages, setArchivedMessages] = useState<InboxMessage[]>([]);
    ```
    Moving an item is a one-time operation (removing from one array, adding to another). This makes rendering each tab view extremely fast, as no filtering is required. This is the standard pattern for features like the Inbox Archive and Trash.

---

### Event Propagation (Bubbling)

-   **Description**: The process where an event fired on a nested element "bubbles up" to its parent elements, potentially triggering their event handlers as well.
-   **Usage**: We must often stop this behavior to prevent unintended side effects, like multiple context menus trying to open at once.
-   **See Also**: `Rule 53.0: Understanding Event Propagation (Bubbling)` in `GEMINI.md` for a detailed explanation and solution using `event.stopPropagation()`.

---

## TypeScript Patterns

### `(keyof Interface)[]` (e.g., `(keyof Task)[]`)

-   **`keyof Task`**: This TypeScript operator creates a union type of all the property names (keys) from the `Task` interface. For example: `'id' | 'text' | 'priority' | ...`.
-   **Together**: `(keyof Task)[]` defines a type for an array that can *only* contain strings that are valid keys of the `Task` interface. We use this in our `TaskType` interface to ensure that when we define which fields a task type should show, we can only use valid field names, preventing typos and runtime errors.