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