# Project Definitions & Declaratives

This file serves as a central glossary for the project's key functions (handlers), state variables, and constants. Its purpose is to provide a clear, at-a-glance understanding of the application's logic and naming conventions.

This document should be updated whenever new declarative logic is implemented.

---

## State Variables

### `words: Word[]`
-   **Description**: The primary state array holding all active, open tasks.
-   **Note**: The name `words` is a historical artifact from the application's origin as a word cloud generator. It should be interpreted as `tasks`. See Rule 08.0.

### `completedWords: Word[]`
-   **Description**: The state array holding all completed tasks.

### `inboxMessages: InboxMessage[]`
-   **Description**: The state array holding all active messages in the user's inbox.

### `archivedMessages: InboxMessage[]`
-   **Description**: The state array holding all archived messages, separate from the active inbox.

### `trashedMessages: InboxMessage[]`
-   **Description**: The state array holding all trashed messages, separate from the active inbox and archive.

### `copyStatus: string`
-   **Description**: The state variable that controls the application's central toast notification system.
-   **Note**: The name is a historical artifact. It should be interpreted as `toastMessage`. See Rule 39.0.

### `settings: Settings`
-   **Description**: A large state object that holds all user-configurable settings, such as UI preferences, categories, external links, and notification levels.

### `isDirty: boolean`
-   **Description**: A boolean flag that tracks if there are unsaved changes in the application state. It controls the "Save Project" button's appearance and the "Save and Quit" dialog.

### `settings.taskTypes: TaskType[]`
-   **Description**: An array within the `settings` object that stores the user-defined task types, including their name and the list of fields they display.

### `isChecklistPromptOpen: boolean`
-   **Description**: A boolean flag that controls the visibility of the `PromptModal` used for editing a checklist item's `response` or `note` field.

### `editingChecklistItem: object | null`
-   **Description**: A state object that holds the context for the checklist item currently being edited via the `PromptModal`. It stores the `sectionId`, `itemId`, the `field` being edited ('response' or 'note'), and the `currentText`. It is `null` when the modal is closed.

---

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
  color: string;
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
### `FullTaskViewProps` Interface
```ts
interface FullTaskViewProps {
  task: Word;
  onClose: () => void;
  onUpdate: (updatedWord: Word) => void;
  onNotify: (word: Word) => void;
  formatTimestamp: (ts: number) => string;
  setCopyStatus?: (message: string) => void;
  settings: Settings;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  words: Word[];
  setInboxMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
  onComplete: (item: ChecklistItem, sectionId: number, updatedSections: ChecklistSection[]) => void;
  onTabChange: (wordId: number, tab: 'ticket' | 'edit') => void;
  onDescriptionChange: (html: string) => void;
}
```
---
### `InboxMessage` Interface
```ts
interface InboxMessage {
  id: number;
  type: 'overdue' | 'timer-alert' | 'created' | 'completed' | 'deleted' | 'updated';
  text: string;
  timestamp: number;
  wordId?: number;
  sectionId?: number;
  isImportant?: boolean;
  isArchived?: boolean;
}
```
---
### `PrioritySortConfig` Interface
```ts
interface PrioritySortConfig {
  [key: string]: { key: keyof Word | 'timeOpen', direction: 'ascending' | 'descending' } | null;
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
### `TabbedViewProps` Interface
```ts
interface TabbedViewProps {
  word: Word;
  onUpdate: (updatedWord: Word) => void;
  onTabChange: (wordId: number, tab: 'ticket' | 'edit') => void;
  onNotify: (word: Word) => void;
  formatTimestamp: (ts: number) => string;
  setCopyStatus: (message: string) => void;  
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  onDescriptionChange: (html: string) => void;
  settings: Settings;
  startInEditMode?: boolean;
  words: Word[];
  onComplete: (item: ChecklistItem, sectionId: number, updatedSections: ChecklistSection[]) => void;
  setInboxMessages: React.Dispatch<React.SetStateAction<InboxMessage[]>>;
  className?: string;
  wordId: number;
  checklistRef?: React.MutableRefObject<{ handleUndo: () => void; handleRedo: () => void; }>;
}
```
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
  allCategoryColor?: string;
}
```
---
### `Word` Interface
```ts
interface Word {
  id: number;
  text: string;
  x: number;
  y: number;
  url?: string;
  priority?: 'High' | 'Medium' | 'Low';
  categoryId?: number;
  completeBy?: number;
  company?: string;
  websiteUrl?: string;
  imageLinks?: string[];
  description?: string;
  attachments?: Attachment[];
  checklist?: ChecklistSection[] | ChecklistItem[];
  notes?: string;
  width?: number;
  height?: number;
  openDate: number;
  createdAt: number;
  isPaused?: boolean;
  pausedDuration?: number;
  completedDuration?: number;
  manualTime?: number;
  payRate?: number;
  isRecurring?: boolean;
  isDailyRecurring?: boolean;
  isWeeklyRecurring?: boolean;
  isMonthlyRecurring?: boolean;
  isYearlyRecurring?: boolean;
  isAutocomplete?: boolean;
  lastNotified?: number;
  snoozedAt?: number;
}
```
---
## Interface Descriptions

### `ChecklistItem`
-   **Description**: An object representing a single item within a `Checklist`.
-   **`response?: string`**: An optional public response or comment related to the checklist item. This field is intended to be visible when copying or exporting the checklist.
-   **`note?: string`**: An optional private note for the checklist item. This field is for internal use and should not be included in copied or exported content.

---

## Handlers (Functions)

### `handleSaveProject()`
-   **Description**: The central function for manually saving the entire application state (`words`, `settings`, `inboxMessages`, etc.) to the `config.json` file via `electron-store`.

### `handleCompleteWord(wordToComplete: Word)`
-   **Description**: Handles the logic for completing a task. It moves the task from the `words` array to the `completedWords` array, calculates its final duration, and handles the creation of recurring tasks if applicable.

### `handleWordUpdate(updatedWord: Word)`
-   **Description**: The primary handler for updating any property of an existing task. It also includes debouncing logic to prevent spamming the inbox with "Task updated" messages during rapid edits.

### `handleTaskOverdue(wordId: number)`
-   **Description**: The single gatekeeper function for processing an overdue task. It creates a persistent toast notification and sends a message to the inbox, using a `ref` to prevent duplicate notifications for the same task. See Rule 12.0.

### `handleSnooze(wordToSnooze: Word, duration?: 'low' | 'medium' | 'high')`
-   **Description**: Snoozes an overdue task for a configured duration. It updates the task's `lastNotified` timestamp to prevent it from re-triggering an alert until the snooze period is over.

### `navigateToView(view: 'meme' | 'list' | 'reports' | 'inbox')`
-   **Description**: Handles navigation between the main application views. It manages the browser-style back/forward history state.

### `getRelativeDateHeader(dateStr: string)`
-   **Description**: A helper function that takes a date string (e.g., "2025-09-22") and returns a user-friendly, relative date format. It produces outputs like "Today", "Tomorrow", or "Saturday, September 27, 2025" and includes the year if it's not the current year.

### `getContrastColor(hexColor: string)`
-   **Description**: A helper function that takes a hex color string and returns either black ('#000000') or white ('#FFFFFF') to ensure the highest contrast for text readability against that color.

### `formatChecklistForCopy(sections: ChecklistSection[]): string`
-   **Description**: A helper function that takes an array of checklist sections and formats them into a clean, plain-text string suitable for copying to the clipboard. It follows the rules in `Rule 51.0`, including completion status (`[✔]`) and public `response` fields, while excluding private `note` fields.

---

## Components

### `TaskAccordionHeader`
-   **Description**: A dedicated component that renders the title and subtitle area for a task in the list view. It includes the task title, category pills, priority, and time-related information in a compact, organized layout.

### `Dropdown`
-   **Description**: A reusable component that displays a menu of items when a trigger element is hovered over. Used for the recurring task options in the task action controls.

#### Inbox Handlers

### `handleToggleImportant(messageId: number)`
-   **Description**: Toggles the `isImportant` boolean flag on a specific message within the `inboxMessages` state array.

### `handleArchiveInboxMessage(messageId: number)`
-   **Description**: Moves a message from the `inboxMessages` array to the `archivedMessages` array.

### `handleUnarchiveInboxMessage(messageId: number)`
-   **Description**: Moves a message from the `archivedMessages` array back to the `inboxMessages` array.

### `handleDismissInboxMessage(messageId: number)`
-   **Description**: Moves a message from the active `inboxMessages` array to the `trashedMessages` array. It will not move messages flagged as important.

### `handleDismissArchivedMessage(messageId: number)`
-   **Description**: Moves a message from the `archivedMessages` array to the `trashedMessages` array.

### `handleRestoreFromTrash(messageId: number)`
-   **Description**: Restores a single message from the `trashedMessages` array back to the active `inboxMessages` array.

### `handleDeletePermanently(messageId: number)`
-   **Description**: Permanently deletes a single message from the `trashedMessages` array.

### `handleEmptyTrash()`
-   **Description**: Permanently deletes all messages from the `trashedMessages` array after a user confirmation.

### `handleRestoreAllFromTrash()`
-   **Description**: Restores all messages from the `trashedMessages` array back to the active `inboxMessages` array.

### `handleTrashAllArchived()`
-   **Description**: Moves all messages from the `archivedMessages` array to the `trashedMessages` array after a user confirmation.

#### Task Type Handlers

### `handleUpdateTaskType(updatedType: TaskType)`
-   **Description**: Updates a specific task type in the `settings.taskTypes` array with new data (e.g., a new name or a different set of fields).

### `handleAddTaskType()`
-   **Description**: Adds a new, blank task type to the `settings.taskTypes` array.

### `handleDeleteTaskType(typeId: string)`
-   **Description**: Deletes a task type from the `settings.taskTypes` array after user confirmation.

### `handleFieldToggle(typeId: string, fieldName: keyof Word)`
-   **Description**: Toggles the visibility of a specific field for a given task type by adding or removing it from the type's `fields` array.

---

## IPC Channels (Main <-> Renderer Communication)

These are the channels defined in `preload.ts` and handled in `index.ts` that allow the frontend (Renderer) to communicate with the backend (Main).

### `electron-store-get` / `electron-store-set`
-   **Description**: The primary channels for reading from and writing to the `config.json` data file. The renderer invokes these to request data persistence from the main process.

### `show-*-context-menu`
-   **Description**: A family of channels (`show-task-context-menu`, `show-inbox-item-context-menu`, etc.) used to request that the main process build and display a native right-click context menu.

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

## TypeScript Patterns

### `(keyof Interface)[]` (e.g., `(keyof Word)[]`)

-   **`keyof Word`**: This TypeScript operator creates a union type of all the property names (keys) from the `Word` interface. For example: `'id' | 'text' | 'priority' | ...`.
-   **`(...)[]`**: This denotes an array of the type inside the parentheses.
-   **Together**: `(keyof Word)[]` defines a type for an array that can *only* contain strings that are valid keys of the `Word` interface. We use this in our `TaskType` interface to ensure that when we define which fields a task type should show, we can only use valid field names, preventing typos and runtime errors.