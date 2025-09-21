# Overwhelmed

A hybrid task management and "word cloud" visualization application designed for power users.

### Features

-   **Advanced Task Management**: Create and manage tasks with detailed fields including priority, due dates with live countdowns, pay rates, recurring schedules, and local file attachments.
-   **Hierarchical Categories**: Organize tasks with a full-featured, two-level category and sub-category system.
-   **Robust Checklist System**: Add multi-section checklists to any task, with progress bars, undo/redo history, and full context menu support for item management.
-   **Rich Text Editing**: A full WYSIWYG editor for task descriptions and notes, with support for headers, lists, hyperlinks, and more.
-   **Full Task View**: A dedicated, full-screen view for focusing on, viewing, and editing a single task without distractions.
-   **Data Persistence & Backups**: All data is saved locally using `electron-store`. The system includes automatic startup backups and a full manual backup/restore/merge manager to prevent data loss.
-   **Intelligent Notification System**: A centralized, non-blocking notification system provides configurable alerts for overdue tasks and approaching deadlines, with actionable toasts for snoozing or completing tasks directly.
-   **Inbox & Audit Trail**: A persistent inbox logs all major task events (created, completed, updated, overdue), providing a complete history of all activity.
    -   **Important Flag**: Users can mark inbox messages as "important" to protect them from being dismissed.
-   **Data Reporting & Visualization**: A dedicated "Reports" view with `recharts` integration provides charts and raw data tables for task completions, earnings, and activity over time, with filtering and CSV export.
-   **Customizable UI**: Features a collapsible sidebar, multiple views (Meme, List, Reports), and extensive settings for managing external links, browser integrations, and UI behavior.
-   **"Meme View" Word Cloud**: The original word cloud feature remains, dynamically generating a visual representation of active tasks on a canvas, with clickable words and customizable text styling.

### Usage

> **Note**: Currently, the application runs in a development environment. To launch, navigate to the project directory in your terminal and run `npm start`.

1.  **Create a Task**: Use the "Add New Task" form in the sidebar to create a new task. Fill in details like title, priority, due date, and category. Add a multi-section checklist or attach local files as needed.
2.  **Manage Tasks**: Navigate to the "List View" to see all your open tasks. Use the category tabs and search bar to filter your view. Click on a task to expand its details.
3.  **Interact with Tasks**: In the expanded view, switch between the "Task" (read-only) and "Edit" tabs. Click the "expand" icon to open the "Full Task View" for a focused experience. Complete checklist items, start the manual work timer, or right-click for more options like duplicating or deleting the task.
4.  **Stay Informed**: Keep an eye on the toast notifications for overdue tasks and approaching deadlines. Use the "Inbox" view to see a complete history of all application events.
5.  **Review Progress**: Use the "Reports" view to see charts and data on your completed tasks, earnings, and overall activity.

### Dependencies

-   **Electron**: The core framework for building the cross-platform desktop application.
-   **React**: The library used to build the entire user interface.
-   **TypeScript**: The language used for all source code, providing type safety and improved developer experience.
-   **Electron Forge & Webpack**: The build toolchain used to compile, bundle, and package the application.
-   **`electron-store`**: The library used for all local data persistence, managing the `config.json` file.
-   **`recharts`**: The charting library used to create all the data visualizations in the "Reports" view.

### Project Structure

This section provides a high-level overview of the project's folder and file structure.

```
/
├── .webpack/             # (Ignored) Temporary directory for Webpack's bundled output.
│   ├── main/
│   │   ├── index.js      # (Rule 30) Bundled main process code.
│   │   └── index.js.map  # (Rule 31) Source map for debugging the main process.
│   └── renderer/
│       └── main_window/
│           ├── index.html# (Rule 32) Final HTML file loaded by Electron.
│           ├── index.js  # (Rule 33) Bundled React UI code.
│           └── preload.js# (Rule 34) Bundled preload script.
│
├── node_modules/         # (Ignored) Contains all third-party packages. (Rule 35)
│
├── out/                  # (Ignored) Contains the final application installers (created by `npm run make`).
│
├── src/                  # All of our application's source code lives here.
│   ├── assets/           # Static assets like images.
│   ├── declarations.d.ts # (Rule 16) TypeScript type definitions for non-code assets.
│   ├── index.css         # (Rule 26) Global stylesheet for the entire application.
│   ├── index.html        # (Rule 26) The simple HTML shell for our React app.
│   ├── index.ts          # (Rule 27) The Electron main process entry point (the "backend").
│   ├── preload.ts        # (Rule 28) The secure bridge between the main and renderer processes.
│   └── renderer.tsx      # (Rule 29) The React application entry point (the "frontend").
│
├── .eslintrc.json        # (Rule 17) Configuration for ESLint to enforce code style.
├── .gitignore            # (Rule 25) Tells Git which files and folders to ignore.
├── CHANGELOG.md          # A log of all notable changes to the project.
├── GEMINILOOP.md         # (Archived) A log of the critical build system loop and its resolution.
├── forge.config.cts      # (Rule 18) Main configuration for Electron Forge (build & packaging).
├── GEMINI.md             # This file! Our central documentation hub.
├── package.json          # (Rule 20) Project manifest: scripts, dependencies, etc.
├── package-lock.json     # (Rule 19) Locks dependency versions for reproducible builds.
├── tsconfig.json         # (Rule 21) TypeScript configuration for our application code.
├── tsconfig.node.json    # (Rule 22) TypeScript configuration for our build scripts.
├── webpack.main.config.cts     # (Rule 23) Webpack config for the main process.
└── webpack.renderer.config.cts # (Rule 24) Webpack config for the renderer process (UI).
```

# Advanced Task Manager & UI Polish

## Feature Implementation
The application has been significantly enhanced, evolving from a simple word list into a detailed task manager.
-   **Detailed Forms**: Implemented forms for adding and editing tasks with fields for URLs, priority, company, due dates, image links, and a description.
-   **Rich Text Editor**: The description field was upgraded to support rich text (HTML), with WYSIWYG shortcuts for bold, italic, underline, lists, and creating hyperlinks (`Ctrl+K`).
-   **Tabbed View**: A tabbed interface was created to separate the read-only "Ticket" view from the "Edit" form, preventing accidental changes and improving UI clarity.
-   **Task Actions**: A full suite of actions was added, including completing, reopening, copying, and deleting tasks, accessible via buttons and a right-click context menu.

## Bug Fixes & Refinements
-   **Context Menu Logic**: A persistent bug where the ticket action context menu would not appear was resolved. The issue was caused by an event propagation conflict between a parent listener (for the ticket) and a child listener (for hyperlinks within the description). The final solution involved simplifying the event handling to ensure the correct menu appears based on the right-click target.
-   **State Management for Edit Mode**: Fixed a bug where the "Edit Ticket" context menu option would not work reliably. This was due to React's `useState` initializer only running on the first render. The fix involved adding a `useEffect` hook to the `TaskAccordion` and `TabbedView` components, allowing them to react to prop changes and programmatically open or switch to the edit state.
-   **UI Consistency with Font Awesome**: The UI has been significantly polished by replacing all text-based and emoji icons (`✅`, `🗑️`, `+`, `−`) with a consistent set of icons from Font Awesome. This includes all action buttons in the checklist system, accordion toggles, and various other controls throughout the application. This change provides a more professional, scalable, and maintainable user interface.

## Future Features
-   **Alternating Tasks**: Link tasks where Completing starts another
-   **Autocompletion of Checklists**: Add an option for when all items in a checklist is completed that it completes the task
-   **Task Types**: Templated forms based on categorical dropdown to simplfy the form fields based on the task type
-   **Templated Tasks**: Save a task to use when creating a new task & predefined Templates to choose from:
    -   **Template: Finance**:
    -   **Template: Learning**:
    -   **Template: Cooking**:
    -   **Template: Health & Exercise**:
    -   **Template: Travel**:
    -   **Template: Work**:
    -   **Template: Shopping**:
    -   **Template: Home & Car Maintenance**:
    -   **Template: Billing**:    
-   **Copy to Sheets**: Explore how we could copy a task to sheets possibly or what we'd use this for
-   **Inbox Expansion**
    -   **Inbox Archive**: Move inbox items out of the inbox and into an archived state
    -   **Inbox Trash**: Move inbox items out of the inbox and into a trash state rather than deleting them permanently
    -   **Inbox Options**: Expand the inbox options to choose which message are received
    -   **Inbox Context Menus**: We need to add support for all inbox menu types
    
-   **Standalone Application**: Package the application into a distributable and installable format for major operating systems (Windows, macOS, Linux).
-   **Users**: Add a feature to create users and assign tickets to them, with the ability to filter the list to view tickets assigned to a specific user.
-   **Themes**: Different style layouts
-   **Settings**: Missing a few settings options and probably want to build a full settings view soon
-   **Templated Tasks**: Save a task to use when creating a new task
-   **Calendar**: Task view in Calendar form. Can start new task on a specific due date by using the calendar
-   **Achievements**: Fun goal tracking system
-   **Score**: Add score to tasks
-   **Response to Ticket**: Like a comment but we want this to be a field where we would draft a response to a task acting as a ticket. Ideally we would be able to grab data from the task to help construct the response.
-   **Filtered search of Scripted responses**: Similar to above and likely used for the Response to Ticket but also allowing the user to user from a variety of responses and oneliners for Tasks functioning as Tickets. 
-   **Send Notifications externally**: Attempts to hook the various toast alerts to external sources
    -   **Send to Desktop Notifications**: See whats possible with Electron
    -   **Send to Email Notifications**: See whats possible with Electron
    -   **Send to SMS Notifications**: See whats possible with Electron
-   **Advanced Checklist System**:  This system is already in place but we're still expanding it out.
    -   Checklist Template Management
        -   Implemented a full template system to save, load, and manage reusable checklists:
            -   Phase 1: Data Structure & Storage
            -   Phase 2: UI/UX Implementation
            -   Phase 3: State Management & Logic
        -   Add a "Manage Templates" button to open a modal for renaming/deleting templates.
-   **Total Refactoring**:  The codebase's individual files are getting rather large and likely need to start compartmentalizing structure into individual files to reduce strain on both the developer and code assist tools.
    - **Change "Word" to "Task"**: When the application was first created, its only purpose was to display a "word cloud," so the main data object was fittingly named Word. As we added more and more features, we transformed that simple Word object into a complex Task manager, but the original variable names like Word, words, handleCompleteWord, etc., remained. See "Rule 08.0: Codebase Naming Conventions (Word vs. Task)" for more details.
      - We need to update this handling to avoid confusion moving forward as the application grows from its original intention. The App started as a simple "word cloud" generator on a meme, which still functions as both a Meme Generator and links the tasks to a google search result when clicked. 
      - We can likely overhaul the Meme view into a fullblown Meme Generator by including a different subview that allows the user to choose the image, text, and placement.    
    - **Check for Duplications**: The codebase might have duplication in its declaratives so we'll need to check for that.
    - **Refactor `<App>`**: App is growing too large and will cause performance issues 

---

# Changelog

All notable changes to this project will be documented in this file @CHANGELOG.md. Please update the separate changelog as development progresses.

## [1.0.4] - 2024-09-21: 
## [1.0.3] - 2024-09-20: Inbox Protection & Full Task View
## [1.0.2] - 2024-09-19: Advanced Checklists, UI Polish, & Documentation
## [1.0.1] - 2024-09-18: Notification System & Inbox View
## [1.0.0] - 2024-09-15: Core Task Management & Data Persistence

---

# Critical Errors with Gemini
While coding with Gemini, it will frequently make suggestions based on what it thinks we should do next, which are mostly great. 

However, be wary of large feature changes as they sometimes come with errors both in implementation and in accepting code changes from Gemini due to system errors. You can try to copy the code manually but its not initially descriptive enough on where exactly to make the change so you might need to ask it specifically how to implement code its erroring. 

This seems to be a caching issue where the chat is looking at an older file than what is current. Gemini should hopefully attempt to prompt us to commit these changes to github before large feature requests but I suggest doing so manually every so often when we have a working version.

## Gemini Code Assist Communication
Hello @Gemini Code Assist, if you can read this, please, before we make large feature changes & we have a stable application, lets use your 'Prompts to try' to push a commit to github so we can backtrack safely. Unless there are other ways to undo large sessions.

### Other Guidelines for Gemini Code Assist to follow:
  - **Gemini Thinks its 2024**: The current year is 2025 and the current month is September. Gemini frequently forgets the date based on its training data and will source 2024 examples, documents, and use those dates erroneously. @Gemini, please before we implement anything with dates, we check the current year date as of TODAY. We don't need to source the most relevant information but it would be nice, and most certainly we should always use the current year when including it anywhere in this codebase.
  - **Level User Knowledge of Code on a Scale: 1 out of 10**: Assume the user has a very low knowledge of the code being used and help explain what is going on with each change we are making. 
  - **Gemini should prompt to update CHANGELOG.md & GEMINI.md frequently**: Frequently suggest changelog and GEMINI.md (this file) changes so we can keep a log of what exactly is occuring during development.
  - **Use CHANGELOG.md & GEMINI.md frequently**: Refrence both the changelog and GEMINI.md (this file) frequently through development and prompt suggestions to avoid conflicts with existing structure as Gemini Code Assist will lose scope of the project for suggestions outside the existing support.
  - **Gemini forgets sessions when searching for solutions**: Not all chat sessions will be remembered, so Gemini Code Assist should attempt to update the changelog and GEMINI.md frequently to offload its memory into these static documents without having to maintain constant codebase knowledge.  
  - **State the Goal First**: When requesting a new feature, state the high-level user goal first before describing the specific implementation. This provides better context for architectural decisions.
  - **Provide Full Error Messages**: When a bug occurs, always provide the full error message and stack trace from the console. This is the fastest way to debug the issue.
  - **Enforce a Step-by-Step Plan**: For new features, first ask Gemini to outline all the required steps (e.g., "1. Add interface, 2. Update main process, 3. Update renderer"). Then, proceed through the plan step-by-step. This prevents incomplete implementations.
  - **Check for Existing Logic First**: Before adding new functions or state, explicitly ask Gemini to check if similar logic already exists that can be reused or extended. This prevents duplicate code and state management conflicts.
  - **Request Code Comments for Learning**: When a complex code block is provided, ask Gemini to add comments to it. This helps explain the purpose of each part of the code, which is a great way to learn.

---
### Log of Issues and Lessons
#### [1.0.8] - UI Lag on State Update in Large Component
-   **Issue**: After implementing the "Inbox Important" toggle, a noticeable lag occurred when clicking the star icon. The state updated, but the UI took a moment to reflect the change.
-   **Lesson**: This is a classic React performance issue. When a single component (like our main `App` in `renderer.tsx`) becomes too large, any state update can trigger a slow and expensive re-render of the entire component tree. The solution is to refactor distinct pieces of UI (like the Inbox) into their own smaller, memoized components. This ensures that only the relevant component re-renders, making the UI feel instantaneous. This will be addressed in a future refactoring task.

#### [1.0.7] - Critical Build System Module Conflict
-   **Issue**: The application failed to start due to a conflict between how the IDE's TypeScript server and Electron Forge's Node.js runtime interpreted the build configuration files (`forge.config.ts`, etc.). This created a loop of "Cannot redeclare block-scoped variable" and "module is not defined in ES module scope" errors.
-   **Lesson**: The definitive solution was to rename all build configuration files from `.ts` to `.cts` (CommonJS TypeScript) and update the `require` statements in `forge.config.cts` to include the new extension. This provided an unambiguous signal to all tools that these files are CommonJS modules, permanently resolving the conflict. (See `GEMINILOOP.md` for a full history).

#### [1.0.6] - Stale State in Re-used Components
-   **Issue**: Components with internal state (like the `DescriptionEditor`) would show stale data when re-used by React for a different task.
-   **Lesson**: Force a component to completely reset its state by passing a unique `key` prop. When the key changes, React destroys the old instance and creates a new one. (See Rule 14.0).

#### [1.0.5] - Data Structure Evolution
-   **Issue**: The app would crash when trying to render old data after a data structure was updated (e.g., `ChecklistItem[]` to `ChecklistSection[]`).
-   **Lesson**: Build backward compatibility directly into components using `React.useMemo` to perform on-the-fly data migration. (See Rule 07.0).

#### [1.0.4] - Child-to-Parent Imperative Actions
-   **Issue**: The "Undo/Redo" context menu action, handled in the parent `App`, couldn't trigger the `handleUndo` function inside the specific child `Checklist` component.
-   **Lesson**: Use a `ref` in the parent to create a "bridge" that can hold and call functions on a specific, active child component. (See Rule 05.0).

#### [1.0.3] - Notification Spam and Race Conditions
-   **Issue**: The app suffered from notification spam due to race conditions between multiple timers.
-   **Lesson**: Centralized all time-based logic into a single "heartbeat" `useEffect` hook to ensure predictable, atomic state updates. (See Rule 06.0 & 12.0).

#### [1.0.2] - Duplicate Key Generation
-   **Issue**: Using `Date.now()` for keys caused console errors and UI bugs when items were created in quick succession.
-   **Lesson**: Guarantee key uniqueness by using `Date.now() + Math.random()`. (See Rule 02.0).

#### [1.0.1] - "Copy Checklist" Implementation Issues
-   **Issue**: An attempt to implement a "Copy Checklist" feature resulted in critical, hard-to-resolve errors.
-   **Lesson**: For complex features that cause instability, it's best to revert to a stable version and re-approach the feature from a fresh start.

#### [1.0.0] - `package.json` Versioning Data Loss
-   **Issue**: An attempt to read the version number from `package.json` caused a change in `electron-store`'s behavior, leading to a complete wipe of all application data.
-   **Lesson**: Do not alter the core `electron-store` initialization. This led to the creation of the robust automatic and manual backup systems we now have.

---

# Developer Guide Index
  - Rule 01.0: Adding a New Context Menu
  - Rule 02.0: Generating Unique Keys in React
  - Rule 03.0: Handling `onClick` with Function Arguments
  - Rule 04.0: Preventing Data Loss with `electron-store`
  - Rule 05.0: Child-to-Parent Communication with Refs
  - Rule 06.0: Centralized Notification Logic
  - Rule 07.0: Data Migration for Component Props
  - Rule 08.0: Codebase Naming Conventions (`Word` vs. `Task`)
  - Rule 09.0: Graceful Shutdown and Data Integrity
  - Rule 10.0: Debouncing Notifications for Frequent Updates
  - Rule 11.0: Disabling Interactive Elements in `contentEditable`
  - Rule 12.0: Preventing Overdue Notification Race Conditions
  - Rule 13.0: Data Persistence and State Management
  - Rule 14.0: Forcing Component State Reset with `key`
  - Rule 15.0: Handling Build and Dependency Issues
  - Rule 16.0: Handling Non-Code Asset Imports with `declarations.d.ts`
  - Rule 17.0: Code Linting with ESLint with `eslintrc.json`
  - Rule 18.0: Electron Forge Build Configuration with `forge.config.ts`
  - Rule 19.0: Understanding `package-lock.json`
  - Rule 20.0: Understanding `package.json`
  - Rule 21.0: Understanding `tsconfig.json`
  - Rule 22.0: Understanding `tsconfig.node.json`
  - Rule 23.0: Understanding `webpack.main.config.cts`
  - Rule 24.0: Understanding `webpack.renderer.config.cts`
  - Rule 25.0: Understanding `.gitignore`
  - Rule 26.0: Understanding `index.html` and `index.css`
  - Rule 27.0: Understanding `src/index.ts` (The Main Process)
  - Rule 28.0: Understanding `src/preload.ts` (The Preload Script)
  - Rule 29.0: Understanding `src/renderer.tsx` (The Renderer Process)
  - Rule 30.0: Understanding `.webpack/main/index.js`
  - Rule 31.0: Understanding `.webpack/main/index.js.map`
  - Rule 32.0: Understanding `.webpack/renderer/main_window/index.html`
  - Rule 33.0: Understanding `.webpack/renderer/main_window/index.js`
  - Rule 34.0: Understanding `.webpack/renderer/main_window/preload.js`
  - Rule 35.0: Understanding `node_modules` further
  - Rule 36.0: Commiting Changes
  - Rule 37.0: Using the VS Code Source Control UI
  - Rule 38.0: Using Font Awesome Icons

---

# Developer Guide - Rule 01.0: Adding a New Context Menu

This guide outlines the three main steps required to add a new right-click context menu to the application. We will use the "Checklist Item" menu as an example.

---

### Step 1: Trigger the Menu from the UI (Renderer Process)

First, decide which UI element should trigger the menu. Add an `onContextMenu` event handler to it. This handler will call a function on the `electronAPI` (which we'll define in the next steps) to tell the main process to show the menu.

**File**: `src/renderer.tsx`

```jsx
// Inside the component for the UI element (e.g., a checklist item)
<span
  className="checklist-item-text"
  onContextMenu={(e) => {
    e.preventDefault(); // Stop the default browser menu
    // Call the function we will expose via the preload script
    window.electronAPI.showChecklistItemContextMenu({
      sectionId: section.id, // Pass any necessary data
      itemId: item.id,
      x: e.clientX,        // Pass mouse coordinates
      y: e.clientY,
    });
  }}
>
  {item.text}
</span>
```

---

### Step 2: Expose the API (Preload Script)

For the UI to talk to the main process securely, we must expose the function through the preload script and create a handler in the main process.

#### A. Update TypeScript Definitions

Add the new function signature to the `window.electronAPI` interface in `src/renderer.tsx` so TypeScript recognizes it.

**File**: `src/renderer.tsx`

```typescript
declare global {
  interface Window {
    electronAPI: {
      // ... other functions
      showChecklistItemContextMenu: (payload: { sectionId: number, itemId: number, isCompleted: boolean, x: number, y: number }) => void;
      showChecklistSectionContextMenu: (payload: { wordId: number, sectionId: number, areAllComplete: boolean, x: number, y: number }) => void;
    }
  }
}
```

#### B. Expose the IPC Call

Add the function to the `contextBridge` in the preload script. This creates the bridge between the renderer's `window.electronAPI` call and the main process's event listener.

**File**: `src/preload.ts`

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... other functions
  showChecklistItemContextMenu: (payload) => ipcRenderer.send('show-checklist-item-context-menu', payload),
  showChecklistSectionContextMenu: (payload) => ipcRenderer.send('show-checklist-section-context-menu', payload),
});
```

---

### Step 3: Build and Handle the Menu (Main Process)

Finally, create the logic in the main process to build the menu and listen for the commands it sends back.

#### A. Create the Menu

In `src/index.ts`, add an `ipcMain.on` listener for the channel you defined in the preload script (`show-checklist-item-context-menu`). This code builds the menu structure and defines what command to send back when an item is clicked.

**File**: `src/index.ts`

```typescript
ipcMain.on('show-checklist-item-context-menu', (event, payload) => {
  const { sectionId, itemId, isCompleted, x, y } = payload;
  const webContents = event.sender;
  const template = [
    {
      label: isCompleted ? 'Re-Open Item' : 'Complete Item',
      click: () => webContents.send('checklist-item-command', { command: 'toggle_complete', sectionId, itemId }),
    },
    {
      label: 'Copy Item Text',
      // Send a 'checklist-item-command' back to the renderer with the action
      click: () => webContents.send('checklist-item-command', { command: 'copy', sectionId, itemId }),
    },
    { type: 'separator' },
    {
      label: 'Delete Item',
      click: () => webContents.send('checklist-item-command', { command: 'delete', sectionId, itemId }),
    },
  ];
  Menu.buildFromTemplate(template).popup({ window: BrowserWindow.fromWebContents(webContents) });
});

ipcMain.on('show-checklist-section-context-menu', (event, payload) => {
  const { wordId, sectionId, areAllComplete, x, y } = payload;
  const webContents = event.sender;
  const template = [
    {
      label: areAllComplete ? 'Re-Open All in Section' : 'Complete All in Section',
      click: () => webContents.send('checklist-section-command', { command: 'toggle_all_in_section', sectionId }),
    },
    { type: 'separator' },
    {
      label: 'Duplicate Section',
      click: () => webContents.send('checklist-section-command', { command: 'duplicate_section', sectionId }),
    },
    {
      label: 'Delete Section',
      click: () => webContents.send('checklist-section-command', { command: 'delete_section', sectionId }),
    },
  ];
  Menu.buildFromTemplate(template).popup({ window: BrowserWindow.fromWebContents(event.sender) });
});
```

#### B. Handle the Command in the UI

Back in `src/renderer.tsx`, create a `useEffect` hook to listen for the `checklist-item-command` channel. This is where you'll implement the logic for what happens when a menu item is clicked (e.g., deleting or copying an item).

**File**: `src/renderer.tsx`

```jsx
useEffect(() => {
  const handleMenuCommand = (payload) => {
    const { command, sectionId, itemId } = payload;

    // Find the task and update its state based on the command
    if (command === 'delete') {
      // ... logic to remove the item from the word's checklist
    }
    if (command === 'copy') {
      // ... logic to copy the item's text
    }
  };

  // Listen for the command from the main process
  const cleanup = window.electronAPI.on('checklist-item-command', handleMenuCommand);
  return cleanup; // Cleanup the listener when the component unmounts
}, [words, handleWordUpdate]); // Add dependencies that the handler needs
```
This will generarelly require a restart of the application via `npm start`.
---

# Developer Guide - Rule 02.0: Generating Unique Keys in React

This guide explains how to avoid a common React warning: `Warning: Encountered two children with the same key`.

### The Problem: `Date.now()` is Not Always Unique

We frequently use `Date.now()` to generate IDs for new items like tasks or inbox messages. While this often works, it is **not guaranteed to be unique** and was the source of extensive console log errors and "ghost" inbox messages in the past.

If multiple items are created in a loop or in very quick succession (e.g., using the "Complete All" button on a checklist), the code can execute so fast that `Date.now()` returns the *exact same millisecond timestamp* for multiple items. This results in duplicate keys, which causes React to show a warning and can lead to unpredictable UI behavior like missing or duplicated elements.

### The Solution: Add a Random Element

The most robust and reliable way to ensure unique IDs is to combine the timestamp with a random number. This guarantees uniqueness even when items are created in the same millisecond.

**Incorrect (Unsafe):**
```javascript
const newId = Date.now();
```

**Correct (Safe):**
```javascript
const newId = Date.now() + Math.random();
```

Always use this pattern when generating new IDs for lists of items to prevent duplicate key errors.

---

# Developer Guide - Rule 3.0: Handling `onClick` with Function Arguments

This guide explains a common issue in React where an `onClick` handler behaves unexpectedly and how to fix it using an arrow function.

### The Problem: Unexpected Arguments
  - Snooze All function:** We recently added a "Snooze All 10m" button and updated our `handleSnoozeAll` function to accept an optional `duration` argument:

```typescript
// The function can now be called with or without a duration
const handleSnoozeAll = (duration?: 'low' | 'medium' | 'high') => {
  // ... logic to determine snooze time
};

// Incorrect (Buggy)
<button onClick={handleSnoozeAll}>Snooze All</button>
```
The problem is that the onClick event in HTML passes a MouseEvent object as its first argument. Our handleSnoozeAll function was receiving this MouseEvent object instead of the duration string it was expecting, causing it to fail.

### The Solution: Arrow Functions
To fix this, we wrap the function call in an anonymous arrow function. This creates a new function that, when executed by onClick, calls our handleSnoozeAll function with the exact arguments we want (in this case, no arguments, so it uses the default).

```jsx
// This calls handleSnoozeAll() with no arguments, as intended.
<button onClick={() => handleSnoozeAll()}>Snooze All</button>

// This correctly calls it with the 'high' argument.
<button onClick={() => handleSnoozeAll('high')}>Snooze All 10m</button>
```

Always use this arrow function () => ... pattern for onClick handlers when you need to call a function that either takes arguments or should be called with no arguments.

---

# Developer Guide - Rule 4.0: Preventing Data Loss with `electron-store`

This guide documents a critical data loss bug we encountered and the systems we built to fix it and prevent it from ever happening again.

### The Problem: Accidental Data Wipe on Startup

We discovered a catastrophic bug where making a seemingly minor change to the `electron-store` initialization logic in `src/index.ts` caused the application to start with a blank session. Because the app was configured to auto-save, this blank session would then immediately overwrite the user's existing `config.json` file, resulting in **total data loss**.

This happened because `electron-store`, if not given an explicit filename, can sometimes create a new, empty configuration file if it detects a change in its initialization parameters.

### The Solution: A Multi-Layered Defense

We implemented a robust, multi-layered solution to guarantee data integrity.

#### 1. Stabilized `electron-store` Initialization

The root cause was fixed by explicitly naming the store file in `src/index.ts`. This ensures the application **always** loads the correct `config.json` file, regardless of other changes.

**File**: `src/index.ts`
```typescript
// This is the critical fix that ensures the correct data file is always loaded.
const store = new Store({
  name: 'config', // Explicitly name the file 'config.json'
});
```
#### 2. Stabilized IPC Handlers

The renderer process communicates with electron-store via IPC channels defined in src/preload.ts and handled in src/index.ts. The keys used for storing data (overwhelmed-words, etc.) and the channel names (electron-store-get, electron-store-set) are hardcoded.

```typescript
// These channels are the bridge to the main process for all data storage.
getStoreValue: (key: string) => ipcRenderer.invoke('electron-store-get', key),
setStoreValue: (key: string, value: any) => ipcRenderer.invoke('electron-store-set', key, value),
```
Golden Rule: Do not change the electron-store configuration or the IPC channel names and keys. Altering them will sever the connection to the user's data, causing the app to load a blank session. If the app then auto-saves, it will overwrite the user's data file with the blank session, causing irreversible data loss if no backups exist.

#### 3. Automatic Startup Backups
To protect against any future unforeseen issues, the application now automatically creates a timestamped backup of the entire project every time it launches. This is handled in src/index.ts. These backups are pruned automatically based on a user-configurable limit in the settings.

#### 4. Manual Backup & Restore System
We built a full-featured "Backup & Recovery" manager in the sidebar. This system empowers the user by allowing them to:

  - Create named, permanent manual backups of the current session.
  - Restore the application state from any automatic or manual backup.
  - Merge a backup with the current session, combining tasks without overwriting existing data.
  - Export backups to share or store externally.

This combination of a stable data connection and a comprehensive backup system provides strong protection against accidental data loss.

---

# Developer Guide - Rule 05.0: Child-to-Parent Communication with Refs

This guide explains an advanced React pattern for when a parent component needs to call a function that exists inside a specific child component. This is often called "imperative programming" in React and should be used sparingly, but it was the perfect solution for our checklist's context menu.

### The Problem: Calling a Child's Function from a Parent

We needed the "Undo" and "Redo" actions in the checklist section's context menu to work. The challenge was:

1.  **The Event is Global**: The context menu click is handled by `ipcMain` in `index.ts` and sent to the main `App` component.
2.  **The Logic is Local**: The `handleUndo()` and `handleRedo()` functions, along with the `history` state they manage, exist inside the `Checklist` component.
3.  **Multiple Children**: There are many `Checklist` instances on the screen (one for each task). The `App` component needed a way to call `handleUndo()` on the *one specific, currently open* checklist.

The standard "props down, events up" data flow doesn't work here because the parent needs to initiate the action on the child.

### The Solution: Exposing Child Functions with a Ref

We solved this by creating a "bridge" from the parent to the active child using `React.useRef`.

#### Step 1: Create a Ref in the Parent (`App.tsx`)

We created a ref in the `App` component to hold a reference to the active checklist's functions.

```typescript
// In the App component
const activeChecklistRef = useRef<{ handleUndo: () => void; handleRedo: () => void; } | null>(null);
```

#### Step 2: Pass the Ref to the Child (`TaskAccordion` -> `TabbedView` -> `Checklist`)

We passed this ref down through the component tree. Crucially, we only passed it if the task's accordion was open, ensuring the ref only ever points to the visible checklist.

```jsx
// In TaskAccordion component
<TabbedView checklistRef={isOpen ? activeChecklistRef : null} ... />
```

#### Step 3: The Child Attaches Its Functions to the Ref (`Checklist.tsx`)

Inside the `Checklist` component, we check if the `checklistRef` prop was passed. If it was, we attach its local `handleUndo` and `handleRedo` functions to the ref's `.current` property.

```jsx
// In Checklist component
if (checklistRef) {
  checklistRef.current = {
    handleUndo,
    handleRedo,
  };
}
```

#### Step 4: The Parent Calls the Child's Function

Now, when the `App` component receives the `undo_checklist` command from the context menu, it can directly and safely call the function on the active child through the ref.

```jsx
// In the App component's context menu handler
case 'undo_checklist':
  activeChecklistRef.current?.handleUndo();
  break;
```

This pattern provides a clean and effective way to solve the specific problem of a parent needing to trigger a local action on one of its children.

---

# Developer Guide - Rule 06.0: Centralized Notification Logic

This guide explains the architecture of our notification system and why we centralized all time-based logic into a single `useEffect` hook.

### The Problem: Race Conditions and Duplicate Notifications

In earlier versions, different components or functions tried to manage their own timers. For example, the `TimeLeft` component had its own `setInterval` to check if a task was overdue, and another piece of logic handled "approaching deadline" warnings.

This created several critical bugs:

1.  **Notification Spam**: If multiple tasks became overdue at the same time, multiple timers would fire simultaneously, each trying to update the state. This race condition caused a flood of duplicate "overdue" messages in the inbox.
2.  **Ghost Messages**: An "approaching deadline" alert and an "overdue" alert could fire for the same task in rapid succession, creating conflicting state updates and non-functional "ghost" messages.
3.  **Performance Issues**: Having many independent `setInterval` timers running (one for every active task) is inefficient and can degrade performance.

### The Solution: A Single, Centralized Timer

We refactored the entire system to use a single, centralized `useEffect` hook in the main `App.tsx` component. This hook acts as the application's "heartbeat," running once every second.

**File**: `src/renderer.tsx`
```typescript
// In the App component
useEffect(() => {
  const notificationInterval = setInterval(() => {
    const now = Date.now();
    const eventsToProcess = [];

    // 1. Loop through all tasks and collect all time-based events for this "tick".
    for (const word of words) {
      if (word.isOverdue) { eventsToProcess.push({ type: 'overdue', wordId: word.id }); }
      if (word.isApproachingDeadline) { eventsToProcess.push({ type: 'warning', wordId: word.id }); }
    }

    // 2. Process all collected events in a single, atomic state update.
    if (eventsToProcess.length > 0) {
      // ...logic to update state based on the collected events
    }
  }, 1000); // The "heartbeat" runs every second

  return () => clearInterval(notificationInterval);
}, [isLoading, words, settings]); // Re-run if the data changes
```

### Why This Works

-   **No Race Conditions**: By processing all time-based events in a single loop, we ensure that state updates happen in a predictable order. There is only one source of truth for time-based changes.
-   **Atomic Updates**: We can collect all necessary changes for a given second and then perform one single, comprehensive state update, which is much safer and more performant for React.
-   **Efficiency**: We replaced dozens of potential timers with just one, significantly improving the application's performance.

This centralized pattern is the standard for handling all time-based events in the application.

---

# Developer Guide - Rule 07.0: Data Migration for Component Props

This guide explains how to safely evolve a component's data structure without crashing the application when it encounters old data.

### The Problem: Breaking Changes in Props

As an application grows, you will inevitably need to change the shape of your data. We faced this when we upgraded the `Checklist` component.

-   **Old Format**: The `checklist` prop was a simple array of items: `ChecklistItem[]`.
-   **New Format**: We introduced sections, changing the prop to a more complex structure: `ChecklistSection[]`.

This created a critical problem: any existing task in a user's `config.json` file that had a checklist in the old format would crash the application, because the newly updated `Checklist` component was not designed to handle the old `ChecklistItem[]` array.

### The Solution: On-the-Fly Migration with `useMemo`

Instead of writing a complex, one-time migration script, we built the migration logic directly into the `Checklist` component. This makes the component resilient and backward-compatible. We used `React.useMemo` to perform this check efficiently.

**File**: `src/renderer.tsx`

```typescript
// Inside the Checklist component
const normalizedSections: ChecklistSection[] = React.useMemo(() => {
  // If the checklist is empty, return an empty array.
  if (!sections || sections.length === 0) { 
    return [];
  }

  // Check the shape of the first item to detect the old format.
  if ('isCompleted' in sections[0]) {
    // If it's the old format, wrap it in the new section structure.
    return [{ id: 1, title: 'Checklist', items: sections as ChecklistItem[] }];
  }

  // Otherwise, it's already the new format, so return it as is.
  return sections as ChecklistSection[];
}, [sections]); // This logic only re-runs when the `sections` prop changes.
```

### Why This Works

-   **Resilience**: The component can handle both old and new data formats gracefully without crashing.
-   **Transparency**: The migration is completely transparent to the parent component. It doesn't need to know or care about the data version.
-   **Efficiency**: `useMemo` ensures that the migration logic only runs when the `checklist` data actually changes, not on every single render.

This pattern is the standard for handling breaking changes in a component's props.

---

# Developer Guide - Rule 08.0: Codebase Naming Conventions (`Word` vs. `Task`)

This guide clarifies a core naming convention in the codebase to prevent confusion.

### The Issue: `Word` means `Task`

The application began as a simple "word cloud" generator. As such, the primary data object was named `Word`, and the main state arrays were `words` and `completedWords`.

Over time, the project evolved into a full-featured task manager. We added properties like `priority`, `checklist`, `completeBy`, etc., to the original `Word` interface. While the UI now refers to these items as "Tasks," the underlying code still uses the original `Word` type and variable names.

### The Convention

When you see a variable or type named `word`, `words`, or a function like `handleWordUpdate`, you should interpret it as referring to a **Task**.

**Example**: `const [words, setWords] = useState<Word[]>([]);` is the primary state for the list of active **Tasks**.

While refactoring all instances of `Word` to `Task` would be ideal, it is a large undertaking. For now, this guide serves as the official clarification.

---

# Developer Guide - Rule 09.0: Graceful Shutdown and Data Integrity

This guide explains the process the application uses to prevent data loss when being closed with unsaved changes.

### The Problem: Race Conditions on Quit

When a user with unsaved changes clicks the "close" button, a simple "save then quit" approach is dangerous. A race condition can occur where the application window is destroyed *before* the file I/O operation to save `config.json` has fully completed, leading to data corruption or loss.

### The Solution: Main Process Controlled Shutdown

To solve this, we implemented a robust, asynchronous shutdown sequence that is entirely controlled by the main process (`index.ts`), which is the only process that can safely manage file operations and the application lifecycle.

Here is the sequence of events when a user with unsaved changes clicks "Save and Quit":

1.  **Intercept Close Event (`index.ts`)**: The `mainWindow.on('close', ...)` event handler in `index.ts` intercepts the close request and prevents the window from closing immediately (`e.preventDefault()`).

2.  **Show Dialog (`index.ts`)**: The main process shows the "Save and Quit" dialog to the user.

3.  **Request Data from Renderer (`index.ts`)**: Upon user confirmation, the main process sends a message to the renderer process: `mainWindow.webContents.send('get-data-for-quit');`

4.  **Renderer Gathers State (`renderer.tsx`)**: The `App` component in the renderer has a `useEffect` hook listening for `get-data-for-quit`. It gathers all current state (`words`, `settings`, etc.) and sends it back to the main process: `window.electronAPI.send('data-for-quit', { ... });`

5.  **Main Process Saves Data (`index.ts`)**: The main process has a one-time listener `ipcMain.once('data-for-quit', ...)` that waits for the data from the renderer. Once the data is received, the main process itself writes the files to disk using `store.set(...)`.

6.  **Force Quit (`index.ts`)**: **Only after** the data has been received and saved does the main process call `forceQuit(mainWindow)`, which safely destroys the window and quits the application.

### Why This Works

-   **No Race Condition**: The application window is not destroyed until the main process has explicitly confirmed that the save operation is complete.
-   **Single Source of Truth**: The main process, which owns the application lifecycle, is the single source of truth for the shutdown sequence. This prevents conflicts and ensures data integrity.

This pattern is the standard for all shutdown procedures in the application.

---

# Developer Guide - Rule 10.0: Debouncing Notifications for Frequent Updates

This guide explains how we prevent notification spam when a user makes many rapid changes to a task.

### The Problem: Notification Flooding

When a user edits a task, the `handleWordUpdate` function is called on every single change (e.g., for each keystroke in a text field). If we sent an "Updated" message to the Inbox on every call, a single editing session could generate dozens of notifications, which is noisy and unhelpful.

### The Solution: Debouncing with `setTimeout`

We use a classic "debouncing" technique to solve this. Instead of sending a notification immediately, we start a timer. If another update occurs before the timer finishes, we reset it. A notification is only sent after the user has paused their activity for a set period.

**File**: `src/renderer.tsx`

```typescript
// State to hold the timers for each task
const [updateTimers, setUpdateTimers] = useState<{ [key: number]: NodeJS.Timeout }>({});

const handleWordUpdate = (updatedWord: Word) => {
  // 1. Clear any existing timer for this specific task to cancel the previous notification.
  if (updateTimers[updatedWord.id]) {
    clearTimeout(updateTimers[updatedWord.id]);
  }

  // 2. Set a new timer.
  const newTimer = setTimeout(() => {
    // 3. This code only runs if the timer completes without being cleared.
    setInboxMessages(prev => [{ type: 'updated', ... }, ...prev]);
  }, 5000); // 5-second debounce window

  // 4. Store the new timer's ID and update the task state immediately.
  setUpdateTimers(prev => ({ ...prev, [updatedWord.id]: newTimer }));
  setWords(words.map(w => w.id === updatedWord.id ? updatedWord : w));
};
```

### Why This Works

-   **User Experience**: The user receives a single, meaningful "Task updated" notification after they are finished editing, not during.
-   **Performance**: This prevents the application from trying to process dozens of state updates to the `inboxMessages` array in rapid succession.

This pattern is the standard for handling notifications triggered by high-frequency events.

---

# Developer Guide - Rule 11.0: Disabling Interactive Elements in `contentEditable`

This guide explains why we must prevent user interaction with form elements (like checkboxes) inside our rich text editor.

### The Problem: React State vs. Direct DOM Manipulation

Our `DescriptionEditor` component uses a `contentEditable` `div` and `dangerouslySetInnerHTML` to render HTML content stored in React state. This creates a conflict if that HTML contains interactive elements like `<input type="checkbox">`.

1.  **The Conflict**: A user can paste a checklist from another source into the editor. If they then click a checkbox, they are directly manipulating the browser's DOM.
2.  **React's State is Truth**: React, however, is unaware of this direct DOM change. Its internal state still holds the original HTML string where the checkbox was *unchecked*.
3.  **The Data Loss**: The next time the component re-renders for any reason (e.g., a parent component updates), React will use its "source of truth" state to redraw the `div`, overwriting the user's checkmark and reverting the checkbox to its original state. This appears to the user as if their action was ignored or their content was wiped.

This is the fundamental reason we built a dedicated, state-aware `Checklist` component instead of trying to support checklists inside the rich text editor.

### The (Attempted) Solution & Open Issue

Our initial attempt to solve this was to use CSS to disable pointer events on any form elements inside the editor.

**This solution did not work.** For reasons that are still unclear, the `pointer-events: none;` rule was ignored by the browser, even when verified in the developer tools. Users could still interact with pasted checkboxes, leading to the data-loss bug.

As a result, this remains an **open issue**. The only "fix" is user education: users should be guided to use the dedicated `Checklist` feature instead of pasting interactive elements into the description.

---

# Developer Guide - Rule 12.0: Preventing Overdue Notification Race Conditions

This guide explains how we prevent the application from creating duplicate "overdue" notifications for the same task.

### The Problem: Race Conditions with Multiple Timers

The application's "heartbeat" timer (see Rule 06.0) checks for overdue tasks every second. However, other events (like loading the app with already-overdue tasks) could also trigger an overdue check. This created a race condition:

1.  Two different parts of the code would detect that `Task A` is overdue at nearly the same time.
2.  Both would independently call the logic to create a toast notification and an inbox message.
3.  The user would see two identical toasts and two identical inbox messages for the same overdue task, which is confusing and incorrect.

### The Solution: A Single Gatekeeper Function

We solved this by creating a single, authoritative function, `handleTaskOverdue`, which acts as the sole entry point for processing any overdue task. This function uses a `Set` stored in a `React.useRef` to keep track of which tasks have already had their inbox message created for the current session.

**File**: `src/renderer.tsx`

```typescript
// A ref to hold a Set of task IDs that have already had an inbox message sent.
const overdueMessageSentRef = useRef(new Set<number>());

const handleTaskOverdue = (wordId: number) => {
  // This function is the single gatekeeper for creating overdue alerts.
  setOverdueNotifications(prev => {
    // If a toast for this task is already on screen, do nothing.
    if (prev.has(wordId)) return prev;
    
    // CRITICAL CHECK: If an inbox message has NOT been sent yet...
    if (!overdueMessageSentRef.current.has(wordId)) {
      // ...send the inbox message...
      setInboxMessages(currentInbox => [/* new message */, ...currentInbox]);
      // ...and immediately record that we've sent it.
      overdueMessageSentRef.current.add(wordId);
    }

    // Finally, show the toast on screen.
    return new Set(prev).add(wordId);
  });
};
```
### Why This Works

-   **No Race Condition**:
  -   **Idempotent**: No matter how many times `handleTaskOverdue` is called for the same task, the `overdueMessageSentRef` check ensures that the expensive and user-visible action (creating an inbox message) only ever happens once per session.
  -   **Atomic**: By using functional state updates (`setOverdueNotifications(prev => ...)`), we ensure that even if multiple calls happen in the same render cycle, React handles them safely without conflicts.

---

# Developer Guide - Rule 13.0: Data Persistence and State Management

This guide defines the single, authoritative pattern for saving and loading application data. Following this rule is critical to prevent data corruption and conflicting sources of truth.

### The Architecture: `electron-store` in the Main Process

All application data (`words`, `settings`, `inboxMessages`, etc.) is persisted in a single `config.json` file managed exclusively by `electron-store` in the main process (`src/index.ts`).

-   **The Renderer does NOT save files.** The React application (`src/renderer.tsx`) holds the state in memory but never directly writes to the filesystem. This is a critical security and stability measure.
-   **The Main Process is the Gatekeeper.** The main process is the only part of the application with the authority to read from or write to `config.json`.

### The Golden Rule: Add New State to the Existing Flow

**Do not introduce new persistence methods.** Any new piece of data that needs to be saved across sessions (e.g., a new settings option, a new data array) must be integrated into the existing `settings` object or the top-level state in the `App` component.

### How to Add New Persistent State (Example: A New Setting)

1.  **Add to the `Settings` Interface (`renderer.tsx`)**:
    Define the new property in the `Settings` interface.
    ```typescript
    interface Settings {
      // ... existing settings
      newCoolSetting?: boolean;
    }
    ```

2.  **Add to the `defaultSettings` Object (`renderer.tsx`)**:
    Provide a default value for the new setting.
    ```typescript
    const defaultSettings: Settings = {
      // ... existing defaults
      newCoolSetting: false,
    };
    ```

3.  **Use the Setting in React**:
    The new setting is now part of the main `settings` state object and can be used and updated like any other setting (`settings.newCoolSetting`, `setSettings(...)`).

Because `newCoolSetting` is now part of the main `settings` object, it will be **automatically saved and loaded** by the existing persistence logic (manual save, auto-save, graceful shutdown) with no further work required. This centralized approach ensures data integrity and simplifies development.

---

# Developer Guide - Rule 14.0: Forcing Component State Reset with `key`

This guide explains a crucial React pattern for ensuring a component's internal state is reset when its context changes.

### The Problem: Stale State in Re-used Components

We encountered a bug in our `DescriptionEditor` component. This component has its own internal state to manage the HTML content (`htmlContent`). When a user switched from editing one task to another, the editor would sometimes briefly show the content from the *previous* task.

This happens because React is efficient. To avoid unnecessary work, it tries to re-use the existing `DescriptionEditor` component instance and just pass it new props. However, it does not automatically reset the component's internal state, leading to this "stale state" bug.

### The Solution: The `key` Prop

The definitive solution in React is to use the `key` prop. When React sees that a component's `key` has changed, it treats it as a completely different entity. It will **destroy the old component instance (and all its internal state) and mount a brand new one** with a fresh, clean state.

We use this pattern to ensure our editors are always clean.

**File**: `src/renderer.tsx`

```jsx
// When rendering the editor for a specific task, we give it a unique key.
<DescriptionEditor 
  description={word.description || ''} 
  // ... other props
  editorKey={`task-description-${word.id}`} // The unique key
/>

// When the user switches to a different task, `word.id` changes, the key changes,
// and React creates a fresh editor instance.
```

### Why This Works

-   **Explicit Identity**: The `key` prop gives each component instance a stable and unique identity.
-   **Predictable State**: It guarantees that whenever the identity of the data changes, the component will start with a fresh state, preventing bugs caused by stale, left-over data.

This is the standard pattern to use whenever you have a stateful component that needs to be completely reset when the data it represents changes.

---

# Developer Guide - Rule 15.0: Handling Build and Dependency Issues

This guide explains how to resolve strange, hard-to-diagnose errors by performing a "clean slate" reinstall of the project's dependencies and build cache.

### The Problem: Stale Caches and Corrupted Dependencies

Sometimes, the application will fail to start or will throw bizarre errors that don't seem related to any recent code changes. This often happens after:
-   Switching branches in Git.
-   Updating packages with `npm install`.
-   Changing build configurations (e.g., in `webpack.config.cts`).

The cause is usually stale or corrupted files in two key directories:
-   `node_modules`: Contains all the third-party packages the project depends on.
-   `.webpack`: A cache directory created by Electron Forge to speed up the build process.

### The Solution: The "Clean Slate" Reinstall

When you encounter unexplainable errors, the most reliable solution is to completely delete these directories and reinstall everything from scratch. This ensures you are working with a fresh, clean environment.

**Use the following PowerShell commands in your project's root directory:**

1.  **Delete `node_modules`**: This command recursively (`-r`) and forcefully (`-force`) removes the entire `node_modules` directory.
    ```powershell
    rm -r -force node_modules
    ```

2.  **Delete `.webpack` Cache**: This removes the build cache.
    ```powershell
    rm -r -force .webpack
    ```

3.  **Reinstall All Packages**: This reads your `package.json` and downloads fresh copies of all dependencies.
    ```powershell
    npm install
    ```

After these steps, you can try starting the application again with `npm start`. This process resolves the vast majority of dependency-related and build-caching issues.

---

# Developer Guide - Rule 16.0: Handling Non-Code Asset Imports

This guide explains the purpose of the `declarations.d.ts` file and how it allows us to import non-code assets like images directly into our TypeScript files.

### The Problem: TypeScript Only Understands Code

By default, the TypeScript compiler only knows how to handle `.ts`, `.tsx`, and `.js` files. When you try to import a different file type, like an image, you will get a compiler error: `Cannot find module './assets/placeholder-image.jpg' or its corresponding type declarations.`

TypeScript doesn't know what the "type" of a JPG file is or what it should do with it.

### The Solution: Ambient Module Declarations

The `declarations.d.ts` file solves this problem. It's a special "ambient declaration" file that provides global type information to the TypeScript compiler for the entire project.

**File**: `src/declarations.d.ts`
```typescript
declare module '*.jpg' {
  const value: any;
  export default value;
}
```

This code tells TypeScript: "Hey, whenever you see a file being imported that ends with `.jpg`, don't panic. Treat it as a valid module that has a default export of type `any`." This satisfies the type checker and allows Webpack (our bundler) to process the file correctly.

If we ever need to import other file types (e.g., `.svg`, `.mp3`), we would simply add a similar `declare module '*.svg'` block to this file.

---

# Developer Guide - Rule 17.0: Code Linting with ESLint

This guide explains the purpose of the `.eslintrc.json` file and how it helps us maintain high-quality, consistent code.

### The Problem: Inconsistent Code and Potential Bugs

As a project grows, it's easy for different developers (or even the same developer on different days) to write code in slightly different styles. This can lead to code that is hard to read and, more importantly, can hide potential bugs (like unused variables or incorrect imports).

### The Solution: ESLint for Automatic Code Analysis

ESLint is a "linter" that automatically analyzes our code as we write it. It checks for common problems and enforces a consistent style based on a set of rules defined in our `.eslintrc.json` file.

Our current configuration does the following:

-   **`"parser": "@typescript-eslint/parser"`**: This is the most important part. It tells ESLint to use a special parser that allows it to understand TypeScript syntax, which standard ESLint cannot do on its own.

-   **`"env": { ... }`**: This section tells ESLint about the global variables that are available in our different environments. For example, `"browser": true` means it won't flag errors for using `window` or `document`, and `"node": true` means it understands `require` and `process`.

-   **`"extends": [ ... ]`**: This is where we import pre-made sets of rules. Instead of configuring hundreds of rules manually, we "extend" from standard configurations:
    -   `"eslint:recommended"`: A baseline set of common best practices.
    -   `"plugin:@typescript-eslint/recommended"`: Best practice rules specifically for TypeScript code.
    -   `"plugin:import/recommended"`: Rules that help prevent issues with `import` and `export` statements, like incorrect file paths.

### How to Use and Expand It

Your code editor (like VS Code with the ESLint extension) automatically uses this file to highlight problems directly in your code with red or yellow squiggles.

If we wanted to enforce a new rule in the future (e.g., requiring semicolons at the end of every line), we would add a `"rules"` section to the `.eslintrc.json` file:

```jsonc
// Example of adding a new rule
"rules": {
  "semi": ["error", "always"]
}
```

This file is the single source of truth for our project's coding standards.

---

# Developer Guide - Rule 18.0: Electron Forge Build Configuration

This guide explains the purpose of the `forge.config.cts` file, which is the central configuration for Electron Forge, our application's build and packaging tool.

### What It Does

The `forge.config.cts` file tells Electron Forge everything it needs to know to take our source code (`.ts`, `.tsx`, `.css`) and turn it into a runnable development application (`npm start`) or a distributable, installable application (`npm run make`).

### Key Sections Explained

1.  **`packagerConfig`**:
    -   This section contains options for `electron-packager`. We use `asar: true` to bundle our application's source code into a single, more efficient archive file, which is standard practice for production builds.

2.  **`makers`**:
    -   This array defines the types of installers we want to create when we run `npm run make`. We have it configured to create installers for Windows (`MakerSquirrel`), macOS (`MakerZIP`), and Linux (`MakerDeb`, `MakerRpm`).

3.  **`plugins`**:
    -   This is the most important section. It configures the plugins that transform our code.
    -   **`WebpackPlugin`**: This is the core plugin. It tells Electron Forge to use Webpack to bundle our code.
        -   `mainConfig`: Points to `webpack.main.config.cts` to handle the main process code.
        -   `renderer`: Points to `webpack.renderer.config.cts` and defines the "entry points" for our UI, telling Webpack where to find the `index.html`, `renderer.tsx` (our React app), and `preload.ts` files.

### Why We Use `.cts`

As noted in our "Log of Issues and Lessons," we use the `.cts` (CommonJS TypeScript) extension for all our build configuration files. This is a critical rule to prevent module conflicts between the Node.js runtime (which expects CommonJS) and our application code (which uses ES Modules). See Rule 04.0 for more details.

### When Would We Change This File?

We would typically only modify `forge.config.cts` for major architectural changes, such as:
-   Adding a new window (e.g., a dedicated settings window with its own HTML and JS files).
-   Changing the application icon.
-   Adding code signing for production builds.
-   Integrating a new plugin into the build process.

This file is critical to the build process and should be edited with caution.

---

# Developer Guide - Rule 19.0: Understanding `package-lock.json`

This guide explains the purpose of the `package-lock.json` file and why it is critical to the project's stability.

### What It Does

The `package-lock.json` file is automatically generated by `npm` whenever you run `npm install`. Its primary purpose is to **lock down the exact versions** of every single package and sub-package that the project depends on.

### The Problem It Solves: "Dependency Drift"

Our `package.json` file often specifies a version range for dependencies (e.g., `"react": "^18.3.1"`). The `^` means that `npm install` is allowed to install any version from `18.3.1` up to, but not including, `19.0.0`.

Without a lockfile, this could cause major problems:
-   Developer A runs `npm install` and gets version `18.3.1`.
-   A week later, Developer B runs `npm install` and gets a newly released version `18.4.0`, which might contain a breaking change.
-   The application now works for Developer A but is broken for Developer B, leading to "it works on my machine" bugs that are very hard to track down.

The `package-lock.json` file prevents this by recording the exact version (`18.3.1`) that was installed. When Developer B runs `npm install`, `npm` sees the lockfile and installs the exact same version, ensuring a consistent and reproducible environment for everyone.

### The Golden Rule

**`package-lock.json` must be committed to version control (Git).** It should almost never be edited manually. It is managed by `npm` and is the single source of truth for the project's dependency tree.

---

# Developer Guide - Rule 20.0: Understanding `package.json`

This guide explains the purpose of the `package.json` file, which serves as the manifest for our Node.js project.

### What It Does

The `package.json` file is the central metadata file for the application. It contains essential information such as the project's name and version, but its most critical roles are:

1.  **Defining Scripts**: It holds the `npm` commands we use to start, build, and package the application.
2.  **Managing Dependencies**: It lists all the third-party packages required for the project to run.

### Key Sections Explained

-   **`"main": "./.webpack/main"`**: This tells Electron where to find the main entry point of our application after it has been compiled by Webpack.

-   **`"scripts": { ... }`**: This section defines the command-line shortcuts we use.
    -   **`"start": "electron-forge start"`**: This is the command we run to launch the application in development mode.
    -   **`"package": "electron-forge package"`**: This command bundles the application code without creating an installer.
    -   **`"make": "electron-forge make"`**: This command creates the final, distributable installers for Windows, macOS, and Linux.
    -   **`"lint": "eslint --ext .ts,.tsx ."`**: This command runs ESLint to check our entire codebase for style and syntax errors.

-   **`"dependencies": { ... }`**: This lists all the packages that are required for the application to **run in production**. These are bundled into the final application. Examples include `react`, `react-dom`, and `electron-store`.

-   **`"devDependencies": { ... }`**: This lists all the packages that are only needed for **development and building**. These are not included in the final, packaged application. This is where our build tools (`electron-forge`, `webpack`, `ts-loader`) and code quality tools (`eslint`, `typescript`) live.

### The Golden Rule

When you install a new package, you must decide if it's a `dependency` or a `devDependency`.

-   If the package is used by the application itself (e.g., a new charting library for the UI), install it as a **dependency**:
    ```powershell
    npm install package-name
    ```
-   If the package is only used for building, testing, or development (e.g., a new Webpack loader), install it as a **devDependency**:
    ```powershell
    npm install --save-dev package-name
    ```
---

# Developer Guide - Rule 21.0: Understanding `tsconfig.json`

This guide explains the purpose of the `tsconfig.json` file, which is the main configuration file for the TypeScript compiler.

### What It Does

The `tsconfig.json` file tells the TypeScript compiler (`tsc`) how to convert our TypeScript code (`.ts`, `.tsx`) into JavaScript that can be understood by browsers and Node.js. It also defines the strictness rules for the type-checking process, which helps us catch errors before the code is even run. This file is primarily for our application source code, while our build-related files use `tsconfig.node.json`.

### Key Sections Explained

-   **`"compilerOptions": { ... }`**: This is the most important section, containing all the rules for the compiler.
    -   **`"target": "ES6"`**: Tells TypeScript to compile our code down to the ECMAScript 6 standard, which has wide browser support.
    -   **`"jsx": "react-jsx"`**: Configures how JSX syntax (like `<App />`) is compiled. `"react-jsx"` is the modern standard that doesn't require importing `React` in every file just to use JSX.
    -   **`"allowJs": true`**: Allows `.js` files to be included in our TypeScript project.
    -   **`"module": "ESNext"`**: Specifies that we are using the latest ES Module syntax (`import`/`export`). This is later converted by Webpack into a format browsers can understand.
    -   **`"esModuleInterop": true`**: A critical setting that enables compatibility between CommonJS modules (`require`) and ES Modules (`import`), allowing us to use older packages that haven't been updated to ES Modules.
    -   **`"noImplicitAny": true`**: A strictness setting that forces us to provide a type for every variable. It prevents bugs by not allowing TypeScript to default to the `any` type.
    -   **`"sourceMap": true`**: Generates source maps, which are essential for debugging. They allow us to see our original TypeScript code in the browser's developer tools, even though the browser is running the compiled JavaScript.
    -   **`"moduleResolution": "bundler"`**: This modern setting tells TypeScript to mimic the module resolution strategy used by bundlers like Webpack, which is the most accurate for our project setup.

-   **`"include": ["src/**/*"]`**: This tells the TypeScript compiler to only analyze files within the `src` directory.

-   **`"exclude": [ ... ]`**: This explicitly tells the compiler to ignore the `node_modules` directory and our build configuration files, which are handled separately by `tsconfig.node.json`.

This file is the single source of truth for how our application's source code is type-checked and compiled.

---

# Developer Guide - Rule 22.0: Understanding `tsconfig.node.json`

This guide explains the purpose of the `tsconfig.node.json` file and why it is separate from our main `tsconfig.json`.

### What It Does

The `tsconfig.node.json` file is a dedicated TypeScript configuration used exclusively for our **build-time scripts**. This includes `forge.config.cts`, `webpack.main.config.cts`, and `webpack.renderer.config.cts`.

Its sole purpose is to tell `ts-node` (the tool Electron Forge uses to run these files) how to compile them into JavaScript that the Node.js environment can execute.

### Why It's Separate from `tsconfig.json`

We need two separate configuration files because our project has two different JavaScript environments with conflicting module systems:

1.  **The Application Code (`src/`)**: This is our React application. It is written using modern **ES Modules** (`import`/`export`) and is eventually bundled by Webpack to run in the browser-like renderer process. It is configured by `tsconfig.json`.
2.  **The Build Scripts (`*.config.cts`)**: These scripts are run directly by Node.js during the build process. Node.js, in this context, expects **CommonJS** modules (`require`/`module.exports`). These scripts are configured by `tsconfig.node.json`.

### Key Sections Explained

-   **`"compilerOptions": { ... }`**:
    -   **`"module": "CommonJS"`**: This is the most important setting. It instructs the TypeScript compiler to output CommonJS-style JavaScript, which is required for our build tools to function correctly.
    -   **`"moduleResolution": "node"`**: This tells TypeScript to use the classic Node.js algorithm for finding modules, which is appropriate for this environment.

-   **`"include": [ ... ]`**: This array explicitly lists which files should be compiled using these rules. By isolating our build configuration files here, we prevent them from being accidentally processed by the rules in our main `tsconfig.json`, which would cause the module system conflicts we've seen in the past.

This separation of concerns is critical for the stability of our build process.

---

# Developer Guide - Rule 23.0: Understanding `webpack.main.config.cts`

This guide explains the purpose of the `webpack.main.config.cts` file, which is the Webpack configuration specifically for Electron's **main process**.

### What It Does

The main process is the Node.js backend of our Electron application. It's responsible for creating browser windows and handling all operating system interactions (like file I/O and native dialogs).

The `webpack.main.config.cts` file's job is to take our main process source code, which starts at `src/index.ts`, and bundle it into a single, optimized JavaScript file (`.webpack/main/index.js`). This bundled file is what Electron actually runs when the application starts.

### Key Sections Explained

-   **`target: 'electron-main'`**: This is a crucial setting that tells Webpack to bundle the code for the Electron main process environment. It ensures that Node.js-specific features and Electron APIs are handled correctly and are not bundled in a way that would only work in a browser.

-   **`entry: './src/index.ts'`**: This tells Webpack where to start bundling. It will read `src/index.ts` and follow all of its `require` statements to build a complete dependency graph.

-   **`module: { rules: [...] }`**: This section defines how different types of files should be processed.
    -   **`ts-loader`**: The most important rule here tells Webpack to use `ts-loader` to compile all `.ts` and `.tsx` files it encounters. This is how our TypeScript code gets turned into JavaScript.

-   **`resolve: { ... }`**: This tells Webpack which file extensions to look for when resolving `require` or `import` statements (e.g., allowing us to write `require('./my-module')` instead of `require('./my-module.ts')`).

This file is essential for preparing our backend Node.js code to be run by Electron.

---

# Developer Guide - Rule 24.0: Understanding `webpack.renderer.config.cts`

This guide explains the purpose of the `webpack.renderer.config.cts` file, which is the Webpack configuration for Electron's **renderer process**.

### What It Does

The renderer process is the user interface of our application—it's the "webpage" that runs inside the Electron window. The `webpack.renderer.config.cts` file's job is to take all the files that make up our UI (React `.tsx` files, `.css` files, images, etc.), starting from `src/renderer.tsx`, and bundle them into a single JavaScript file that can be loaded by our `index.html`.

This is where all of our React application code is processed.

### Key Sections Explained

-   **`target: 'web'`**: This is a crucial setting that tells Webpack to bundle the code for a web/browser-like environment. This ensures that it can correctly handle things like CSS and interact with the DOM.

-   **`entry: './src/renderer.tsx'`**: This tells Webpack that our entire React application starts from this single file. Webpack will read it and follow all of its `import` statements to build a complete dependency graph of our UI.

-   **`module: { rules: [...] }`**: This section is the most important. It defines how to handle different file types.
    -   **`ts-loader`**: Compiles our `.tsx` (React) and `.ts` files into standard JavaScript.
    -   **`style-loader` & `css-loader`**: These work together to take our `.css` files and inject them into the DOM as `<style>` tags, making our styles apply to the application.
    -   **`asset/resource`**: This rule handles image files (`.png`, `.jpg`, etc.), allowing us to `import` them directly in our code and get a valid path to use in `<img>` tags.

-   **`plugins: [ ... ]`**:
    -   **`ForkTsCheckerWebpackPlugin`**: This plugin significantly improves build performance. It runs the TypeScript type-checker in a separate process, so Webpack can focus on bundling the code without waiting for the type-checking to finish.

This file is essential for building the entire user-facing part of our application.

---

# Developer Guide - Rule 25.0: Understanding `.gitignore`

This guide explains the purpose of the `.gitignore` file and why it's critical for both a clean repository and user privacy.

### What It Does

The `.gitignore` file is a simple text file that tells Git (our version control system) which files and directories it should intentionally ignore. Any file or folder listed in `.gitignore` will not be tracked by Git, meaning it won't be staged, committed, or pushed to the remote repository (like GitHub).

### Key Ignored Directories

Our `.gitignore` file is configured to ignore several types of files and directories:

-   **`node_modules/`**: This directory contains all of our third-party dependencies. It can be very large and is not committed because it can be perfectly recreated by any developer simply by running `npm install`.

-   **`.webpack/`**: This is a temporary cache directory created by Webpack during the build process. It is specific to each developer's machine and should not be shared.

-   **`out/`**: This directory is created by Electron Forge when we run `npm run make`. It contains the final, packaged application installers. We only commit the source code, not the compiled output.

-   **Logs and System Files**: We also ignore various log files (`*.log`) and system-specific files (like `.DS_Store` on macOS) to keep the repository clean.

### User Data, Backups, and Privacy

This is the most critical aspect of our `.gitignore` strategy.

**The user's data file (`config.json`) and all automatic and manual backups are NOT tracked by Git.**

These files are stored locally on the user's machine in the Electron `appData` directory (e.g., `C:\Users\YourUser\AppData\Roaming\overwhelmed` on Windows). This is intentional and crucial for the following reasons:

1.  **Privacy**: It prevents any user's personal task list, settings, or other data from ever being accidentally uploaded to a public or private repository.
2.  **Security**: It ensures that sensitive information that might be stored in tasks remains local to the user's machine.
3.  **Repository Cleanliness**: It keeps the Git history free of user-specific data, focusing only on the application's source code.

Because these files are not part of the repository, they are not included when a developer clones the project. The application will generate a fresh, empty `config.json` on its first run for a new user.

---

# Developer Guide - Rule 26.0: Understanding `index.html` and `index.css`

This guide explains the roles of our two core user interface files, `src/index.html` and `src/index.css`.

### `index.html`: The Application Shell

The `index.html` file is the entry point for our application's renderer process. It is intentionally very simple:

```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Overwhelmed</title>
  </head>
  <body></body>
</html>
```

#### What It Does:

It provides the basic HTML document structure that Electron loads into the main browser window.
The <body> tag is empty because our entire React application is dynamically injected into it by Webpack during the build process.

#### How It Works:

Our Webpack configuration (webpack.renderer.config.cts) is set up to take this HTML file as a template.
When you run npm start or npm run make, Webpack automatically adds a `<script>` tag to this file that points to our bundled renderer.js (the compiled output of renderer.tsx). This is how our React application gets loaded and executed.

### `index.css`: Global Stylesheet

The index.css file contains all the global CSS rules for the entire application. This includes base styles for the body, scrollbars, and all the shared component styles for buttons, accordions, modals, etc.

####  How It Works:
  - This file is imported directly at the top of our main React file, src/renderer.tsx:    
    ```typescript
    import "./index.css";
    ```
  - Our Webpack configuration (webpack.renderer.config.cts) uses style-loader and css-loader to process this file.
  - During the build, these loaders take all the CSS rules and dynamically inject them into the application's `<head>` as `<style>` tags. This ensures that all our styles are available globally as soon as the application loads.

These two files work together as the foundation upon which our entire React-based user interface is built and styled.

---

# Developer Guide - Rule 27.0: Understanding `src/index.ts` (The Main Process)

This guide explains the role of `src/index.ts`, which is the main process entry point for our Electron application. Think of it as the "backend" server that manages the application's lifecycle and all interactions with the user's operating system.

### What It Does

The main process has several critical responsibilities that the renderer process (our React UI) cannot and should not handle directly:

1.  **Window Management**: It is responsible for creating, managing, and listening to events on the application's `BrowserWindow`. This includes persisting the window's size and position between sessions using `electron-window-state`.

2.  **Application Lifecycle**: It controls the core application lifecycle using `app` events. This includes creating the window when the app is ready (`app.whenReady()`), quitting the app when all windows are closed (on non-macOS platforms), and handling the "graceful shutdown" process to prevent data loss (see Rule 09.0).

3.  **Data Persistence Gatekeeper**: It initializes `electron-store` and is the **only** part of the application that has direct access to the user's `config.json` file on disk. It exposes `get` and `set` methods via IPC handlers, allowing the renderer to request data changes without ever touching the filesystem itself. This is a critical security and stability pattern.

4.  **Native OS Integration**: It handles all interactions that require native operating system APIs. This includes:
    -   Showing native dialogs for saving/opening files (`dialog.showSaveDialog`).
    -   Opening external links or local files in the default application (`shell.openExternal`, `shell.openPath`).
    -   Creating and displaying all native right-click context menus (`Menu.buildFromTemplate`).

5.  **IPC Handler Hub**: It contains all the `ipcMain.on` and `ipcMain.handle` listeners that serve as the backend endpoints for every request sent from the renderer process via the `preload.ts` script.

In short, `src/index.ts` is the trusted, Node.js-powered backend, while `src/renderer.tsx` is the sandboxed, browser-based frontend.

---

# Developer Guide - Rule 28.0: Understanding `src/preload.ts` (The Preload Script)

This guide explains the role of `src/preload.ts`, which is a special script that runs in a unique, privileged environment before the renderer process (our React app) is loaded.

### The Problem: Security and Context Isolation

For security reasons, modern Electron applications run with **Context Isolation** enabled. This means that the renderer process (the "webpage" part of the app) and the main process (the "Node.js backend") are completely isolated from each other. The renderer cannot directly access Node.js APIs or the user's filesystem.

This creates a problem: How does our React UI (renderer) ask the main process to do things like save a file or show a context menu?

### The Solution: The Preload Script as a Secure Bridge

The `preload.ts` script is the answer. It runs in a special context that has access to **both** the renderer's `window` object and the main process's `ipcRenderer` module. We use this bridge to securely expose a limited, well-defined API to our React application.

**File**: `src/preload.ts`

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // This function is now available on `window.electronAPI` in the renderer.
  getStoreValue: (key: string) => ipcRenderer.invoke('electron-store-get', key),

  // This function sends a message to the main process but doesn't expect a direct reply.
  openExternalLink: (payload) => ipcRenderer.send('open-external-link', payload),

  // This function sets up a listener for messages from the main process.
  on: (channel: string, callback: (...args: any[]) => void) => {
    const newCallback = (_: IpcRendererEvent, ...args: any[]) => callback(...args);
    ipcRenderer.on(channel, newCallback);
    // Return a cleanup function to remove the listener.
    return () => ipcRenderer.removeListener(channel, newCallback);
  },
});
```

---

# Developer Guide - Rule 29.0: Understanding `src/renderer.tsx` (The Renderer Process)

This guide explains the role of `src/renderer.tsx`, which is the entry point for our application's **renderer process**. Think of it as the "frontend" of our application—it's the React code that runs inside the Electron window and is responsible for everything the user sees and interacts with.

### What It Does

The `renderer.tsx` file contains our root React component, `<App />`. This single component is responsible for:

1.  **State Management**: It holds all of the application's primary state in memory using React hooks like `useState` and `useRef`. This includes the list of active tasks (`words`), completed tasks (`completedWords`), user settings (`settings`), and inbox messages (`inboxMessages`).

2.  **UI Rendering**: It renders all other components based on the current state. It contains the logic for switching between the "Meme View," "List View," and "Reports View," and it passes down the necessary data and functions as props to all child components (like `TaskAccordion`, `TabbedView`, `Checklist`, etc.).

3.  **Event Handling**: It contains the top-level event handlers for most user interactions, such as `handleCompleteWord`, `handleWordUpdate`, and `handleSaveProject`.

4.  **Communication with Main Process**: It uses `useEffect` hooks to set up listeners for messages coming *from* the main process (e.g., context menu commands, shutdown requests). It calls functions on the `window.electronAPI` object (exposed by `preload.ts`) to send requests *to* the main process.

### The Data Flow

The renderer process follows a strict data flow:

1.  **Load**: On startup, it requests all persisted data from the main process via `window.electronAPI.getStoreValue`.
2.  **Hold in Memory**: It holds this data in React state.
3.  **Update in Memory**: As the user interacts with the app, the renderer updates its local state, causing the UI to re-render.
4.  **Request to Save**: When a save is triggered (manually, on auto-save, or on quit), the renderer sends its current state back to the main process via `window.electronAPI.setStoreValue` or a dedicated IPC channel.

The renderer process **never** directly accesses the filesystem or other native resources. It is a sandboxed web environment that communicates with the trusted main process (`src/index.ts`) via the secure bridge provided by the preload script (`src/preload.ts`).

---

# Developer Guide - Rule 30.0: Understanding `.webpack/main/index.js`

This guide explains the purpose of the `.webpack/main/index.js` file, which is a temporary build artifact and not part of our source code.

### What It Is

The `.webpack/main/index.js` file is the **compiled and bundled JavaScript output** of our main process source code (`src/index.ts`).

### How It's Created

1.  When you run `npm start`, Electron Forge invokes Webpack.
2.  Webpack reads its configuration from `webpack.main.config.cts`.
3.  It finds the entry point specified: `entry: './src/index.ts'`.
4.  It reads `src/index.ts` and all the files it `require`s, compiling all the TypeScript into standard JavaScript.
5.  It bundles all of that JavaScript into a single, optimized file: `.webpack/main/index.js`.

### What It's Used For

This single file is what Electron actually executes to start the application's main process. The `"main"` property in our `package.json` points directly to it:

**File**: `package.json`
```json
"main": "./.webpack/main",

```
(Electron automatically looks for an index.js file inside that directory).

### The Golden Rule
You should never edit this file directly. It is a temporary, machine-generated file that is completely overwritten every time you start or build the application.

Because it's a build artifact, the entire .webpack/ directory is (and should be) listed in our .gitignore file (see Rule 25.0).

---

# Developer Guide - Rule 31.0: Understanding `.webpack/main/index.js.map`

This guide explains the purpose of the `.webpack/main/index.js.map` file, which is a "source map" for our main process code.

### What It Is

A source map is a special file that creates a mapping between the compiled, bundled JavaScript code (in `.webpack/main/index.js`) and the original TypeScript source code we wrote (in `src/index.ts` and its imports).

### The Problem It Solves: Debugging Compiled Code

When we debug our application, the code that is actually running is the single, large `index.js` file. This file is machine-generated and can be very difficult to read and understand.

If an error occurred, the stack trace would point to a line number in this compiled file, which would be almost useless for finding the bug in our original, well-structured TypeScript code.

### How It Works

The `.js.map` file contains all the information needed for debugging tools (like the one in VS Code or the browser's DevTools) to reverse-engineer the compiled code. When you set a breakpoint or an error occurs:

1.  The debugger sees the error at `index.js:12345`.
2.  It looks at the source map file (`index.js.map`).
3.  The source map tells the debugger, "Line 12345 in the compiled file actually corresponds to line 50 in `src/my-module.ts`."
4.  The debugger then shows you the error in the correct place in your original, readable source code.

This functionality is enabled by the `"sourceMap": true` option in our `tsconfig.json` file.

### The Golden Rule

Like `.webpack/main/index.js`, this is a temporary, machine-generated file. It should **never be edited directly** and is correctly ignored by our `.gitignore` file.

---

# Developer Guide - Rule 32.0: Understanding `.webpack/renderer/main_window/index.html`

This guide explains the purpose of the `.webpack/renderer/main_window/index.html` file, which is a temporary build artifact and not part of our source code.

### What It Is

This file is the **final, processed HTML output** that is loaded into the main application window. It is generated by Webpack using our `src/index.html` file as a template.

### How It's Created

1.  When you run `npm start`, Electron Forge invokes Webpack.
2.  Webpack's `HtmlWebpackPlugin` (configured via `webpack.renderer.config.cts` and `forge.config.cts`) reads our simple `src/index.html`.
3.  The plugin then automatically injects `<script>` tags into the body of the HTML. These scripts point to the bundled JavaScript files for the renderer process (`index.js`) and the preload script (`preload.js`).

A simplified view of the generated file looks like this:

```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Overwhelmed</title>
  </head>
  <body>
    <!-- Webpack automatically adds these script tags -->
    <script src="index.js" defer></script>
  </body>
</html>
```
### What It's Used For
This generated HTML file is the actual "webpage" that Electron loads to display our user interface. The mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY) call in src/index.ts points directly to this file.

### The Golden Rule
Like all files in the .webpack directory, you should never edit this file directly. It is a temporary, machine-generated file that is completely overwritten on every build. It is correctly ignored by our .gitignore file.

---

# Developer Guide - Rule 33.0: Understanding `.webpack/renderer/main_window/index.js`

This guide explains the purpose of the `.webpack/renderer/main_window/index.js` file, which is a temporary build artifact and not part of our source code.

### What It Is

This file is the **final, compiled, and bundled JavaScript output** of our entire React application. It contains all the code from `src/renderer.tsx` and every component and library it imports, all processed and optimized into a single file that the browser environment can execute.

### How It's Created

1.  When you run `npm start`, Electron Forge invokes Webpack.
2.  Webpack reads its configuration from `webpack.renderer.config.cts`.
3.  It finds the entry point specified for the renderer: `entry: './src/renderer.tsx'`.
4.  It processes `renderer.tsx`, compiling all the JSX and TypeScript into JavaScript. It follows every `import` statement, bundling React, our components, CSS, images, and other dependencies into one large file.
5.  The final output is saved as `.webpack/renderer/main_window/index.js`.

### What It's Used For

This file is the "application" that runs inside the `index.html` shell. The `<script>` tag that Webpack automatically injects into the generated `index.html` (see Rule 32.0) points directly to this file. When Electron loads the HTML, this script runs, and our React app comes to life.

### The Golden Rule

Like all files in the `.webpack` directory, you should **never edit this file directly**. It is a temporary, machine-generated file that is completely overwritten on every build. It is correctly ignored by our `.gitignore` file.

---

# Developer Guide - Rule 34.0: Understanding `.webpack/renderer/main_window/preload.js`

---

# Developer Guide - Rule 34.0: Understanding `.webpack/renderer/main_window/preload.js`

This guide explains the purpose of the `.webpack/renderer/main_window/preload.js` file, which is a temporary build artifact and not part of our source code.

### What It Is

This file is the **final, compiled JavaScript output** of our preload script source code (`src/preload.ts`).

### How It's Created

1.  When you run `npm start`, Electron Forge invokes Webpack.
2.  Webpack's configuration in `forge.config.cts` defines a `preload` entry point pointing to `src/preload.ts`.
3.  Webpack uses `ts-loader` to compile the TypeScript code from `src/preload.ts` into standard JavaScript.
4.  The final output is saved as `.webpack/renderer/main_window/preload.js`.

### What It's Used For

This is the actual script that Electron injects into the renderer process to set up the secure `contextBridge` (see Rule 28.0).

The `webPreferences` in our `createWindow` function in `src/index.ts` points directly to this generated file:

**File**: `src/index.ts`
```typescript
const mainWindow = new BrowserWindow({
  // ... other options
  webPreferences: {
    preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY, // This constant points to the generated preload.js
    // ...
  },
});
```

### The Golden Rule

Like all files in the .webpack directory, you should never edit this file directly. It is a temporary, machine-generated file that is completely overwritten on every build. It is correctly ignored by our .gitignore file.

---

# Developer Guide - Rule 35.0: Understanding `node_modules`

This guide explains the purpose of the `node_modules` directory and our best practices for managing it.

### What It Is

The `node_modules` directory is where `npm` (Node Package Manager) downloads and stores all the third-party code (packages) that our project depends on to function. This includes everything from our core framework, React, to our build tools, like Webpack and Electron Forge.

### How It Works

1.  **`package.json`**: This file lists our project's **direct** dependencies. For example, it says we need `react` and `electron`. (See Rule 20.0).
2.  **`package-lock.json`**: This file is a detailed "lockfile" that records the **exact version** of every single package installed, including the dependencies of our dependencies (the "dependency tree"). This ensures that every developer has the exact same set of packages. (See Rule 19.0).
3.  **`npm install`**: When you run this command, `npm` reads `package-lock.json` and downloads all the specified packages into the `node_modules` directory.

### What Needs to Be Done With It?

**Almost nothing.** The `node_modules` directory is entirely managed by `npm`.

-   **You should never edit files inside `node_modules` directly.** Any changes will be overwritten the next time `npm install` is run.
-   If you encounter strange build errors, the best practice is to delete the `node_modules` directory completely and run `npm install` again to get a fresh copy of all packages. (See Rule 15.0).

### Why It's Ignored by Git

The `node_modules` directory can be very large (hundreds of megabytes) and contains thousands of files. We explicitly tell Git to ignore it for several key reasons:

1.  **Redundancy**: The entire directory can be perfectly and reliably recreated by anyone with our `package.json` and `package-lock.json` files just by running `npm install`.
2.  **Repository Size**: Committing `node_modules` would bloat our repository, making it extremely slow to clone and work with.
3.  **Noise**: It would create an enormous amount of noise in our commit history, making it difficult to see our actual source code changes.

Our `.gitignore` file contains the line `node_modules/`, which ensures this directory is never accidentally added to our version control history. (See Rule 25.0).

---

# Developer Guide - Rule 36.0: Committing Changes to GitHub

This guide outlines the standard workflow for committing and pushing code changes to the `main` branch of our GitHub repository. Following these steps ensures a clean and consistent version history.

### The Workflow

Before starting, ensure you have a stable, working version of the application. It's best practice to only commit code that successfully runs.

**Use the following commands in your project's root directory via your terminal (like PowerShell or Git Bash):**

1.  **Check the Status**:
    This command shows you which files have been modified, which are new (untracked), and which are staged. It's a good way to review your work before committing.
    ```powershell
    git status
    ```

2.  **Stage All Changes**:
    This command takes all the modified and new files and stages them, which means they are ready to be included in the next commit. The `.` is a shortcut for "all files in the current directory and subdirectories."
    ```powershell
    git add .
    ```

3.  **Commit the Changes**:
    This command saves your staged changes to the local Git history. The `-m` flag allows you to provide a short, descriptive commit message in quotes. Your message should summarize the changes (e.g., "feat: Add checklist template system" or "fix: Resolve notification race condition").
    ```powershell
    git commit -m "Your descriptive commit message here"
    ```

4.  **Push to GitHub**:
    This command uploads your local commits to the `main` branch on the remote GitHub repository, making them available to others and creating a backup of your work.
    ```powershell
    git push origin main
    ```
---

# Developer Guide - Rule 37.0: Using the VS Code Source Control UI

This guide explains how to use the built-in Source Control panel in Visual Studio Code to commit and push changes to GitHub. This is a graphical alternative to the command-line workflow described in Rule 36.0.

### The Workflow

Before starting, ensure you have a stable, working version of the application.

1.  **Open the Source Control Panel**:
    Click on the Source Control icon in the Activity Bar on the left side of VS Code. It looks like a branching path.

2.  **Review and Stage Changes**:
    -   You will see a list of all the files you have modified under a "Changes" section.
    -   You can click on any file to see a "diff" view, which shows you exactly what lines were added or removed.
    -   To stage a file (the equivalent of `git add <file>`), hover over the file name and click the **`+`** (plus) icon.
    -   To stage all modified files at once, hover over the "Changes" section header and click the **`+`** icon there. Staged files will move to a "Staged Changes" section.

3.  **Commit the Changes**:
    -   At the top of the Source Control panel, you will see a "Message" text box. This is where you type your commit message (the equivalent of `git commit -m "..."`).
    -   Your message should be a short, descriptive summary of the changes (e.g., "feat: Add extensive project documentation to GEMINI.md").
    -   Once you've written your message, click the **Commit** button (or the checkmark icon ✔️). This saves your staged changes to your local Git history.

4.  **Push to GitHub**:
    -   After committing, you will see a "Sync Changes" button (or a button with a cloud and an up arrow) at the bottom of the VS Code window in the status bar.
    -   Clicking this button will perform a `git push` (and a `git pull` first, to sync any remote changes), uploading your local commits to the `main` branch on GitHub.

Using the Source Control panel is a great way to have a more visual and interactive Git workflow directly within your editor.

---

# Developer Guide - Rule 38.0: Using Font Awesome Icons

This guide explains how to use Font Awesome icons in the application to ensure a consistent and professional UI, replacing plain text or emojis.

### How It Works

We have included the Font Awesome 5 Free stylesheet in our global `index.css` file. This gives us access to a wide range of icons that can be easily added and styled.

```css
/* File: src/index.css */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');
```

---

### Step 1: Find an Icon

1.  Go to the Font Awesome 5 Free Icons Gallery.
2.  Search for an icon that fits your need (e.g., "plus", "trash", "arrow-up").
3.  Click on the icon to see its details. The name you need is the part after `fa-` (e.g., for `fa-trash-alt`, the name is `trash-alt`).

---

### Step 2: Add the Icon to Your Component

To add an icon, use an `<i>` tag with the appropriate classes. The base class is `fas` (for Font Awesome Solid), followed by the specific icon class `fa-icon-name`.

**Example**: Replacing a text button with an icon.

```jsx
// Before
<button>Add Section</button>

// After
<button><i className="fas fa-plus"></i> Add Section</button>
```

**Conditional Icons**: You can dynamically change an icon based on component state using a template literal in the `className`.

```jsx
// This button's icon will change based on the 'areAllComplete' boolean
<button title={areAllComplete ? "Reopen All" : "Complete All"}>
  <i className={`fas ${areAllComplete ? 'fa-undo' : 'fa-check-square'}`}></i>
</button>
```

---

### Step 3: Add Custom Styling (Optional)

We can add custom hover effects for icons inside specific buttons for better user feedback. Add a new rule to `index.css`.

**File**: `src/index.css`

```css
/* Make the 'broom' icon turn yellow on hover inside a .checklist-action-btn */
.checklist-action-btn:hover .fa-broom {
  color: #f4d03f !important;
}
```
