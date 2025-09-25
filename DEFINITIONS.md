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

### `settings.openChecklistSectionIds: number[]`
-   **Description**: An array within the `settings` object that stores the IDs of checklist sections that are currently expanded. This allows the UI to remember which sections are open or collapsed.

### `settings.openChecklistSectionIds: number[]`
-   **Description**: An array within the `settings` object that stores the IDs of checklist sections that are currently expanded. This allows the UI to remember which sections are open or collapsed.

### `settings.showChecklistResponses: boolean`
-   **Description**: A boolean flag within the `settings` object that controls the global visibility of all `response` fields in checklists.

### `settings.showChecklistNotes: boolean`
-   **Description**: A boolean flag within the `settings` object that controls the global visibility of all `note` fields in checklists.

### `editingItemId: number | null`
-   **Description**: A state variable that holds the `id` of the checklist item currently being edited directly in the list. This enables the in-place editing feature in both "Task" and "Edit" views.

### `editingItemText: string`
-   **Description**: A state variable that holds the text content for the checklist item identified by `editingItemId`.

### `focusChecklistItemId: number | null`
-   **Description**: A state variable used to programmatically set focus on a specific checklist item's input field, typically after it has been newly created.
---
### `editingResponseForItemId: number | null` / `editingNoteForItemId: number | null`
-   **Description**: State variables that hold the `id` of a checklist item for which a `response` or `note` is being edited in the read-only "Task" view. This enables the quick-add/edit feature without switching the entire task to "Edit" mode.

### `focusSubInputKey: string | null`
-   **Description**: A state variable that holds a unique key (e.g., `"response-123"`) for a checklist sub-input field (`response` or `note`). It is used in the "Edit" view to programmatically focus the correct input field immediately after it is created.

### `Checklist` Component State
-   **Description**: The following state variables are managed locally within the `Checklist` component to handle its UI interactions.

#### `editingSectionId: number | null`
-   **Description**: Holds the `id` of the checklist section whose title is currently being edited in-line.

#### `editingSectionTitle: string`
-   **Description**: Holds the text content for the section title input field identified by `editingSectionId`.

#### `confirmingDelete...: number | null` or `boolean`
-   **Description**: A family of state variables (`confirmingDeleteNotes`, `confirmingDeleteSectionResponses`, etc.) that track the two-click confirmation state for destructive actions. They hold a section ID or a boolean to indicate that the next click should confirm the deletion.

#### `history: ChecklistSection[][]` / `historyIndex: number`
-   **Description**: State variables that manage the local undo/redo history for all changes made to the checklist. `history` is an array of snapshots, and `historyIndex` points to the current state within that array.

---
### `subInputRefs: RefObject`
-   **Description**: A React `ref` object that stores references to all the dynamically rendered `response` and `note` input fields in the checklist, keyed by a unique string (e.g., `"response-123"`). This allows for programmatic focusing of specific inputs.
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
  dueDate?: number;
  highlightColor?: string;

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
  openChecklistSectionIds?: number[];
  allCategoryColor?: string;
}
```
---
### `Word` Interface
```ts
interface Word {
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
---
## Interface Descriptions

### `Word`
-   **Description**: The primary data object representing a single task.
-   **`startsTaskIdOnComplete?: number`**: An optional field that holds the `id` of another task. When the current task is completed, the task with this ID will have its `openDate` set to `Date.now()`, effectively activating it.

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

### `handleDeleteChecked(sectionId?: number)`
-   **Description**: Deletes all completed (`isCompleted: true`) checklist items. If a `sectionId` is provided, it only deletes checked items within that specific section. If no `sectionId` is provided, it deletes all checked items across the entire checklist.

### `handleUpdateItemDueDate(sectionId: number, itemId: number, newDueDate: number | undefined)`
-   **Description**: Updates the `dueDate` for a specific checklist item. Setting `newDueDate` to `undefined` clears the date.

### `handleUpdateItemText(sectionId: number, itemId: number, newText: string)`
-   **Description**: Updates the `text` for a specific checklist item. This is used by the in-place editing input field.

### `handleUpdateItemResponse(sectionId: number, itemId: number, newResponse: string)` / `handleUpdateItemNote(sectionId: number, itemId: number, newNote: string)`
-   **Description**: Updates the `response` or `note` field for a specific checklist item. If the field does not exist, it is created.

### `handleDeleteItemResponse(sectionId: number, itemId: number)` / `handleDeleteItemNote(sectionId: number, itemId: number)`
-   **Description**: Deletes the `response` or `note` for a specific checklist item by setting its value to `undefined`.

### `handleDeleteItem(sectionId: number, itemId: number)`
-   **Description**: Deletes an entire checklist item from a specific section.

### `handleUpdateItemDueDateFromPicker(sectionId: number, itemId: number, dateString: string)`
-   **Description**: A dedicated handler for the checklist item's date picker input. It correctly parses the `YYYY-MM-DD` string to a local timezone timestamp to prevent off-by-one-day errors.

### `checklist-item-command` Listener
-   **Description**: A `useEffect` hook in `renderer.tsx` that listens for commands sent from the various checklist-related context menus. It acts as a central router to perform actions on checklist items, notes, and responses.
-   **Commands Handled**:
    -   `edit_note` / `edit_response`: Creates the note/response field if it doesn't exist, then puts it into an inline-editable state directly in the UI, eliminating the need for a modal.
    -   `copy_note` / `copy_response`: Copies the text content of the note/response to the clipboard.
    -   `delete_note` / `delete_response`: Deletes the note/response from the item.
    -   `open_link` / `copy_link`: Opens or copies the first URL found in the main item text.
    -   `open_note_link` / `copy_note_link`: Opens or copies the first URL found in a note.
    -   `open_response_link` / `copy_response_link`: Opens or copies the first URL found in a response.
---
### `checklist-section-command` Listener
-   **Description**: A `useEffect` hook in `renderer.tsx` that listens for commands sent from the checklist section context menu.
-   **Commands Handled**:
    -   `edit_title`: Puts the section title into an inline-editable state.
    -   `toggle_collapse`: Expands or collapses the section.
    -   `expand_all` / `collapse_all`: Expands or collapses all checklist sections.
    -   `add_note_to_section` / `add_note_to_all`: Adds an empty note field to items in a specific section or all sections.
    -   `add_response_to_section` / `add_response_to_all`: Adds an empty response field to items in a specific section or all sections.
    -   `copy_section_raw` / `copy_all_sections_raw`: Copies the raw text content of a section or all sections to the clipboard.
    -   `clear_all_highlights`: Removes the highlight color from all items in a section.

### `Checklist` Component Handlers
-   **Description**: The following handlers are defined within the `Checklist` component to manage its local state and UI.

#### `handleUpdateSectionTitle(sectionId: number, newTitle: string)`
-   **Description**: Updates the `title` for a specific checklist section.

#### `handleToggleSectionCollapse(sectionId: number)`
-   **Description**: Toggles the collapsed/expanded state of a single checklist section by updating `settings.openChecklistSectionIds`.

#### `handleDeleteAllNotes()` / `handleDeleteAllResponses()`
-   **Description**: Implements the logic for the two-click confirmation pattern to delete all notes or responses from every item in the checklist.

---

---

## Components

### `TaskAccordionHeader`
-   **Description**: A dedicated component that renders the title and subtitle area for a task in the list view. It includes the task title, category pills, priority, and time-related information in a compact, organized layout.

### `Dropdown`
-   **Description**: A reusable component that displays a menu of items when a trigger element is hovered over. Used for the recurring task options in the task action controls.

### `ClickableText`
-   **Description**: A React component that takes a text string as a prop. It uses `extractUrlFromText` to find any URL within the text. If a URL is found, it renders the text with the URL as a clickable `<a>` tag that opens the link externally. Otherwise, it renders the text as a normal `<span>`.

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

### `(keyof Interface)[]` (e.g., `(keyof Word)[]`)

-   **`keyof Word`**: This TypeScript operator creates a union type of all the property names (keys) from the `Word` interface. For example: `'id' | 'text' | 'priority' | ...`.
-   **`(...)[]`**: This denotes an array of the type inside the parentheses.
-   **Together**: `(keyof Word)[]` defines a type for an array that can *only* contain strings that are valid keys of the `Word` interface. We use this in our `TaskType` interface to ensure that when we define which fields a task type should show, we can only use valid field names, preventing typos and runtime errors.