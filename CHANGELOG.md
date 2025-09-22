# Changelog

All notable changes to this project will be documented in this file.

## Future Features
-   **Alternating Tasks**: Link tasks where Completing starts another
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
-   **Inbox Expansion**:
    -   **Inbox Options**: Expand the inbox options to choose which message are received/displayed
    -   **Inbox Context Menus**: We need to add support for all inbox menu types
    -   **Inbox Sort Overhaul**: Currently the sort only works for Active tab.
    -   **Inbox Sort**: Expand sort to include `by: Important` 
    
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
    - **Rename `setCopyStatus`**: The `setCopyStatus` function and `copyStatus` state are used as the central toast notification system. They should be renamed to `setToastMessage` and `toastMessage` respectively to more accurately reflect their purpose.

## [1.0.7] - 2025-09-21: UI Polish & Category Color-Coding

### Added
-   **Category Color-Coding**:
    -   Added a color picker to the "Category Manager" for each category and sub-category.
    -   Category pills in the task list and category filter tabs in the header now display their assigned custom color.
    -   Pill text color (black or white) is now automatically calculated for optimal contrast against the custom background color.
    -   Added a "Reset Color" button to the Category Manager.

### Changed
-   **Accordion Header UI Cleanup**: Refactored the task accordion header into a cleaner, more organized layout.
    -   Created a dedicated `TaskAccordionHeader` component to improve code modularity.
    -   Moved Category and Priority information to the main title line for a more compact view.
-   **Action Button UI Cleanup**: The action buttons for each task have been redesigned for a more uniform look. Recurring task options (Daily, Weekly, etc.) are now consolidated into a space-saving dropdown menu.

## [1.0.6] - 2025-09-21: Grouped Task View by Day

### Added
-   **Grouped Task View by Day**: When sorting the list view by "Due Date (Soonest First)", tasks are now grouped under headers for each day.
    -   **Relative Date Headers**: Headers use relative terms like "Today" and "Tomorrow" for clarity. The full date and year are shown for other dates.
    -   **Task Count**: Each date header displays a count of the tasks due on that day (e.g., "Today (3 tasks)").
    -   **"No Due Date" Group**: Tasks without a due date are now grouped at the top for high visibility, with a distinct style to differentiate them.
-   **UI Polish**: Added custom styling for the new date headers to improve readability and visual organization.


## [1.0.5] - 2025-09-21: Task Types & Templated Forms

### Added
-   **Task Types**: Implemented a "Task Types" system to create templated forms. Users can now define different types of tasks (e.g., "Billing", "Research") and specify which form fields are visible for each type.
-   **Task Type Manager**: Added a new manager to the sidebar, allowing users to create, rename, delete, and configure fields for each task type.
-   **Dynamic "Add Task" Form**: The "Add New Task" form now dynamically shows or hides fields based on the selected "Task Type," streamlining the task creation process.

## [1.0.4] - 2025-09-21: Inbox Archive & Trash + Documentation Workflow

### Added
-   **Inbox Archive**: Implemented an "Archive" feature in the Inbox. Users can now move messages from the "Active" view to a separate, persistent "Archived" tab.
-   **Inbox Trash**: Implemented a full "Trash" system for the Inbox. Dismissed messages are now moved to a "Trash" tab instead of being permanently deleted, providing a safety net. The Trash view includes options to restore individual messages, restore all, or permanently empty the trash.

### Updated
-   **Project Glossary**: Created a new `DEFINITIONS.md` file to serve as a central glossary for project-specific functions and state variables. Added a new guideline to `GEMINI.md` to ensure this file is kept up-to-date.
-   **Developer Documentation**: Added a new guide to `GEMINI.md` (Rule 40.0) explaining the state management pattern for tabbed views like the new Inbox/Archive system.
-   **Developer Documentation**: Added a new guide to `GEMINI.md` (Rule 41.0) to enforce using named handlers for UI actions, improving code clarity and maintainability.

## [1.0.3] - 2025-09-20: Inbox Protection & Full Task View
 
### Added
-   **Inbox Important Flag**: Added a star icon to each inbox message, allowing users to flag it as "important." Important messages are protected from being dismissed individually or by the "Clear All" action.
    -   *Note: Context Menu support for toggling the important flag will be added in a future update.*
-   **Full Task View**: Implemented a "Full Task View" mode, allowing a single task to be viewed and edited in a dedicated, full-screen layout. This is accessible via an "expand" icon in the list view.

### Changed
-   **Inbox Item Hover Effect**: Changed the hover effect on inbox items from a `background-color` change to a subtle `outline`. This improves the perceived responsiveness of action icons (like the "important" star) by preventing the background color change from visually interfering with the icon's own color state.

### Fixed
-   **Inbox Important Flag Persistence**: Ensured that the "important" status of inbox messages is correctly saved and restored across application restarts.

## [1.0.2] - 2025-09-19

Critical errors trying to implement a Gemini prompt again... this time with "Copy Checklist" so I rolled back some changes from this version to salve what we've worked on. The following "Needs to be added" section is what is left from this chat session.        

### Added
-   **Task Lifecycle Logging**: The Inbox now logs all major task events, including `Created`, `Completed`, `Deleted`, and `Updated` tasks, providing a complete audit trail.
-   **Advanced Checklist System**:
    -   Implemented a robust, multi-section checklist system within each task.
-   **Actionable Overdue Toasts**:
    -   Added a "Snooze 10m" button for a longer, one-click snooze option.
    -   Added an "Edit Task" option to the right-click context menu on overdue notifications, allowing for direct access to the edit form.
    -   Added a "Snooze All 10m" button to the bulk overdue actions summary.
    -   Added a right-click context menu to checklist items for actions like "Edit", "Complete", "Copy", "Add Item Before/After", "Move Up/Down", and "Delete".
    -   Added a right-click context menu to checklist section headers for actions like "Complete All", "Duplicate Section", and "Delete Section".
    -   Added a visual progress bar to each section header, which turns green upon completion.
    -   Added a "Clear Completed" button to each section to quickly remove finished items.
    -   Added a "Complete All" / "Re-Open All" toggle button to each section header for bulk actions.
    -   Added a global "Complete All" / "Re-Open All" button to the main checklist header.
    -   Added a "Delete all Sections" button to the checklist actions.
    -   Added section reordering via "Move Up/Down" buttons and context menu actions.
    -   Added "Undo" and "Redo" actions to the checklist section context menu for quick history navigation.
    -   Using 'Add Section' now automatically focuses the title for immediate editing.
-   **Bulk Checklist Item Creation**: The checklist "add item" input now supports pasting or typing multiple lines, automatically creating a separate to-do item for each line.
-   **Save Status Timers**: Added "Last saved at" and "Autosaving in..." timers to the UI to provide clear, real-time feedback on the project's save status. 
-   **Inbox Sorting**: Added a dropdown to the Inbox to sort messages by date (newest/oldest) or by message type. This preference is saved and restored across sessions.
-   **Grouped Inbox View**: When sorting by "Message Type", the inbox now groups messages into collapsible sections for better organization.

### Changed
-   **Checklist UI Modernization**: The checklist UI was refined to better match the application's modern aesthetic, with improved spacing, alignment, and input controls.
-   **Checklist Section Actions**: Grouped all section-level action buttons (Complete, Clear, Move, Delete) into a single, unified block in the section header for a cleaner layout.
-   **Interactive Checklists**: Checklist items and "Complete All" buttons are now fully interactive in the read-only "Task" view, allowing for quick updates without entering "Edit" mode.
-   **Consistent Context Menus**: Checklist item and section context menus now work consistently in both "Task" and "Edit" views.

### Fixed
-   **Inbox Navigation**: Fixed a critical bug where clicking a task in the inbox would not navigate to the correct category/sub-category view, making the task invisible.
-   **Unsaved State Bug**: Resolved an issue where the rich text editor's auto-resize logic was constantly marking the project as "unsaved" (dirty), even with no user changes.
-   **Rich Text Editor Data Loss**: Prevented a data-loss bug by disabling interaction with form elements (like checkboxes) pasted into the rich text editor's "View" mode, which was causing state conflicts with React.
-   **Checklist State Bug**: Fixed an issue where multiple "Add Item" text areas in different checklist sections would incorrectly share the same input text.
-   **Granular Inbox Notifications**: Fixed a logic bug where using the "Complete All" button would send duplicate "Section completed" notifications to the inbox.
-   **Save Status Timers**: Fixed a bug where the "Autosaving in..." countdown timer would get stuck at 0:00 instead of resetting after an auto-save.
-   **Snooze Timer Display**: Fixed a UI bug where the "Last Snoozed at" field was incorrectly showing the future alert time. It has been renamed to "Next Alert at:", and a new, accurate "Last Snoozed at:" field has been added.
-   **Bulk Snooze Action**: Fixed a bug where the "Snooze All" button was not correctly using the user's default snooze time setting.
-   **Checklist Context Menu Undo/Redo**: Fixed a complex state management bug where the Undo/Redo actions in the context menu would not correctly update the checklist's visual state.
-   **Unique Key Generation**: Implemented a more robust ID generation strategy (`Date.now() + Math.random()`) to prevent duplicate key warnings in React, especially when creating multiple items in quick succession.
-   **Checklist Context Menus**: Fixed a bug where the "Delete Section" action in the context menu was not working correctly.
-   **Inbox Rendering**: Fixed a bug where the grouped inbox view could generate non-unique keys for its accordion sections, causing React warnings.
-   **Inbox Data Persistence**: Fixed a critical bug where clearing the inbox would not save correctly if the user was on the Inbox view, causing all messages to reappear on restart.
-   **Overdue Notification Spam**: Fixed a race condition where the app would create a flood of duplicate "overdue" messages in the inbox upon startup or when a task remained overdue.

### Updated
-   **Extensive Developer Documentation**: Added comprehensive developer guides to `GEMINI.md`, covering critical architectural patterns, common pitfalls, and solutions for data persistence, state management, UI interactions, and more.

## [1.0.1] - 2025-09-18

### Added
-   **Inbox View**: Implemented a new "Inbox" view to provide a persistent log of all past notifications (overdue tasks, deadline warnings). Includes functionality to dismiss individual messages or clear the entire inbox.
-   **Actionable Overdue Toasts**: Overdue toast notifications now include "Snooze" and "Complete" buttons, allowing direct interaction from the alert.
-   **Configurable Snooze Timer**: Added a "Snooze Time" setting to the "Time Management" accordion, allowing users to configure how long an overdue alert is hidden.
-   **Overdue Alert Summary**: Added a summary counter (`Overdue: {count}`) to the on-screen notification area to show how many alerts are active.
-   **Snooze Tracking**: Tasks now display a "Snooze Count" and "Last Snoozed at" timestamp in their header if they have been snoozed.
-   **Persistent Editor Height**: The HTML text areas in the rich text editor now remember their manually resized height between application sessions.
-   **Save Button Context Menu**: Added a right-click context menu to the "Save Project" button with options for "Save Project" and "Create Manual Backup...".
-   **"Snooze All" & "Complete All"**: Added "Snooze All" and "Complete All" buttons to the overdue notification summary area when multiple alerts are active.
-   **Quick Settings Access**: Added a settings cog (⚙️) to overdue toast notifications that opens the sidebar and highlights the relevant time management settings.
-   **Browser-Style Navigation**: Added support for back/forward navigation between views using mouse buttons (Back/Forward) and keyboard shortcuts (`Alt + Left/Right Arrow`).
-   **Context Menus**:
    -   Added a right-click context menu to Inbox items with actions like "View Task", "Snooze", "Complete", and "Dismiss".
    -   Added a right-click context menu to the main navigation buttons ("Meme", "List", etc.) with "Go Back" and "Go Forward" options.
    -   Added a right-click context menu to the "Save Project" button with "Save Project" and "Create Manual Backup..." options.

### Changed
-   **Notification System Refactor**: Centralized all time-based notification logic into a single, robust `useEffect` hook in the main `App` component. This resolves numerous race conditions and bugs related to duplicate or missing notifications.
-   **UI Modernization**: Updated the styling of the "Inbox" page with better spacing, typography, and a cleaner, more modern container for messages.

### Fixed
-   **Notification Spam**: Fixed a critical bug where multiple active overdue toasts would cause a flood of inbox messages. The new centralized logic and atomic state updates prevent this race condition.
-   **"Ghost" Inbox Messages**: Resolved an issue where some inbox messages were created without proper data, making them undeletable.
-   **Persistent Toast Notifications**: Fixed numerous bugs where toast notifications (for backups, copy actions, etc.) would remain on screen indefinitely.
-   **Rich Text Editor Bugs**:
    -   Fixed an issue where using the `Ctrl+K` link shortcut multiple times would incorrectly reuse the previous selection and URL.
    -   Fixed a bug where pasting a URL over selected text did not correctly create a hyperlink.
-   **Completed Task Timers**: Timers for completed tasks now correctly freeze to show their final "Overdue by" or "Time left" status at the moment of completion and no longer trigger erroneous notifications.
-   **Inbox Data Persistence**: Fixed a bug where clearing the inbox would not save correctly, causing all messages to reappear on restart.
-   **Inbox Dismissal**: Fixed a bug where dismissing an inbox message would incorrectly navigate to the associated task instead of just closing the notification.
-   **"Ghost" Inbox Messages**: Resolved a race condition where "approaching deadline" and "overdue" notifications could fire simultaneously, creating duplicate, non-functional "ghost" messages in the inbox.
-   **Overdue Toast UI**: Correctly positioned the "Notification sent to Inbox" link to appear inside the overdue task toast notification.

## [1.0.0] - 2024-09-15

### Added
-   **Initial Project Setup**: Configured project with Electron, React, and TypeScript using Electron Forge and Webpack.
-   **Canvas Rendering**: Implemented a 640x640 canvas to display a background image.
-   **Word Input**: Added a text input field to accept new words and add them to a state-managed list.
-   **Word Cloud Drawing**: Words from the list are now drawn onto the canvas.
-   **Dynamic Font Sizing**: Implemented logic to scale word font size based on their order in the priority list. The highest word is the largest.
-   **Clickable Words**: Words on the canvas are now interactive; clicking a word opens a Google search for it in the user's default browser.
-   **Automatic Placement**: New words are automatically placed in a random position that avoids the center of the canvas, creating a "cloud" effect.
-   **Reorderable Priority List**: Implemented a priority list with clickable arrows, allowing users to reorder words and dynamically update their size on the canvas.
-   **Advanced Task Manager**: Transformed the simple word list into a detailed task manager with fields for URL, Priority, Company, Due Dates, Image Links, and a rich-text Description.
-   **Tabbed Ticket View**: Implemented a tabbed interface within each task to separate the read-only "Ticket" display from the "Edit" form, preventing accidental edits.
-   **Rich Text Editing**: Added WYSIWYG support to description fields, including keyboard shortcuts for Bold (`Ctrl+B`), Italic (`Ctrl+I`), Underline (`Ctrl+U`), Link (`Ctrl+K`), and List (`Ctrl+L`).
-   **Task Actions**: Added a context menu and buttons for completing, reopening, copying, and deleting tasks.
-   **Advanced Rich Text Shortcuts**: Added shortcuts for `H1-H6` headers (`Alt+1-6`), Paragraphs (`Ctrl+P`), and clearing format (`Ctrl+\`).
-   **Sub-Category System**: Implemented a full sub-category system, allowing for two-level task organization. This includes management in the sidebar, grouped dropdowns in forms, and a two-tier filtering system in the "List View" with accurate task counts.
-   **Granular Date/Time Control**: Replaced date-only pickers with `datetime-local` inputs for "Open Date" and "Complete By". Added "NOW", "Clear", "Round to Hour" (`:00`), and incremental time adjustment buttons (`+/- 15m, 1h, 1d`, etc.) for rapid deadline and start-time setting.
-   **Window State Persistence**: The application now remembers its window size and position on the screen between sessions.
-   **Manual Work Timer**: Added a manual stopwatch to each task to track active work time.
-   **Category Management**: Implemented a full category system with a manager in the sidebar to add, rename, and delete categories.
-   **Tabbed Task Filtering**: Added a tab bar to the "List View" to filter tasks by category, including counters for open tasks in each tab.
-   **Re-occurring Tasks**: Added a toggle to mark tasks as re-occurring, which automatically recreates them upon completion.
-   **Deadline Timers**: Enhanced the "Complete By" field to include a time, with a live "Time Left" countdown visible in the task header and details.
-   **Pay Rate & Cost Calculation**: Added a "Pay Rate" field to tasks to automatically calculate and display the total task cost based on time tracked.
-   **External Link Manager**: Added a section in the settings to manage a list of quick-access external website links, which are displayed in the main header.
-   **Custom Browser Selection**: Added a new settings section to define a list of browsers. Users can now cycle through the list with a hotkey (` ` `) and open links in the selected browser instead of the system default.
-   **View Persistence**: The application now remembers the last active view ("Meme View" or "List View") and restores it on startup.
-   **Data Persistence**: Replaced `localStorage` with `electron-store` for robust, file-based data persistence, following secure Electron patterns.
-   **Save State Management**: The application now tracks an "unsaved changes" (dirty) state, providing clear visual feedback to the user.
-   **Dynamic Save Button**: Implemented a single save button that dynamically changes its text and color (red for "Unsaved", green for "Saved") to reflect the current project state.
-   **`Control+S` Shortcut**: Added a keyboard shortcut for `Control+S` to quickly save the project.
-   **Smart Quit Dialog**: When closing the app with unsaved changes, a dialog now prompts the user to "Save and Quit", "Don't Save", or "Cancel". The app closes instantly if there are no unsaved changes.
-   **Accordion Management**: Added "Expand All" (📂) and "Collapse All" (📁) buttons to the list view for better task management.
-   **Autocomplete Tasks**: Implemented an "Autocomplete on Deadline" feature. Tasks with this enabled will automatically complete themselves when their deadline passes. This can be combined with "Re-occurring" for self-resetting timers.
-   **Quick Toggles**: Added icons to the task header in list view to quickly toggle "Re-occurring" (🔁) and "Autocomplete" (🤖) status, with toast notifications for feedback.
-   **Configurable Deadline Warnings**: The "Time Left" countdown now turns yellow when a deadline is approaching. This warning time is now configurable in a new "Time Management" section in the sidebar (defaulting to 60 minutes).
-   **Enhanced UI Feedback**: Added confirmation dialogs for deleting sub-categories to prevent accidental data loss.
-   **Improved Task Creation**: When creating a new task from a sub-category view, the new task form now correctly pre-selects that sub-category.
-   **Consistent Sidebar**: The "Category Manager", "External Link Manager", and other settings accordions are now visible in both "Meme View" and "List View".
-   **Advanced Recurring Tasks**: Added "Repeat Daily", "Weekly", "Monthly", and "Yearly" options, which automatically create a new task with an advanced due date upon completion. Quick-toggle buttons ('D', 'W', 'M', 'Y') were also added to the task header.
-   **Collapsible Sidebar**: The sidebar can now be hidden and shown with a toggle button or an `Alt+S` hotkey to maximize screen space. The app remembers the sidebar's state between sessions.
-   **Reports View**: Implemented a new "Reports" view with tabbed navigation to provide analytics on completed tasks.
   **Data Visualization**: Added several charts to the Reports View using the `recharts` library, including pie charts for earnings and completions by category, a line chart for earnings over time, and a bar chart for recent activity.
-   **Report Filtering & Export**: The Reports View now includes a date range filter, a "Clear Filter" button, and an "Export to CSV" feature.
-   **Sort by Functionality**: Implemented a powerful sorting system for the active task list. Users can now sort tasks by Due Date, Priority, or Open Date. The sort preference is saved on a per-category basis, allowing for different default sort orders for different contexts (e.g., sort 'Work' by due date, 'Personal' by priority). Manual reordering is disabled when an automatic sort is active to prevent conflicts. 
-   **Search Functionality**: Implemented a full-featured search bar in the "List View" to instantly filter active and completed tasks by name. The search bar includes a clear button, automatically resets when changing categories, and supports keyboard shortcuts (`Escape` to clear, auto-focus on clear) for a streamlined workflow.
-   **Dynamic List Headers**: The "Priority List" and "Completed Items" headers in the List View are now dynamic, displaying the name of the currently selected category and the total count of visible tasks (e.g., "Work: Priority List (9)").
-   **Task Notes**: Added a dedicated "Notes" section to each task, separate from the main description, allowing for private user notes. This includes a rich text editor and is available in the "Task", "Edit", and "Add New Task" views.
-   **Enhanced Copy Functionality**: Added "Copy Notes", "Copy All" (Description + Notes), and "Copy HTML" buttons to tasks for easier content sharing.
-   **Local File Attachments**: Implemented a feature to attach local files to tasks. Files are securely copied into the application's data directory and can be opened or removed from the task.
-   **Smart Hyperlink Pasting**: Pasting a URL over selected text in the rich text editor now automatically creates a hyperlink.
-   **Selection Context Menu**: Added a global right-click context menu that appears on any selected text, offering "Copy" and "Search Google" options. The search can be configured to use the system's default browser via a new global setting in the "External Link Manager".
-   **Advanced Timer Notifications**: Implemented a granular notification system for task deadlines. Users can now select an alert level ('silent', 'low', 'medium', or 'high') to control the frequency of deadline reminders.
-   **Persistent Overdue Alerts**: Added non-dismissible toast notifications for overdue tasks that require user confirmation to be removed.
-   **Automatic Backup System**: On every application launch, a timestamped backup of the project is automatically created and stored in a dedicated `backups/automatic` folder. The number of backups to retain is now a configurable setting.
-   **Manual Backup & Restore System**: Implemented a full-featured backup manager in the sidebar, allowing users to:
    -   Create named, permanent manual backups.
    -   Restore a session from any backup (automatic or manual).
    -   Merge a backup with the current session without overwriting data.
    -   Delete and export individual backups.
    -   Search and filter backups within a tabbed UI separating `Automatic` and `Manual` restore points.
-   **UI State Persistence**: The application now remembers which task accordions were left open and which tab ('Task' or 'Edit') was active for each task, restoring the UI state on relaunch.
-   **Periodic Auto-Save**: The application now automatically saves any unsaved changes in the background every 5 minutes, providing protection against data loss from unexpected application crashes.
-   **Application Footer**: Added a fixed footer to display copyright information and the application version.



### Changed
-   **UI Terminology**: Standardized the term "Ticket" to "Task" throughout the application, including context menus and UI labels, for better clarity and consistency.
-   **Duplicate Task**: Renamed the "Copy Task" feature to "Duplicate Task" to more accurately describe its function of creating a new, editable copy of an existing task.
-   **Overdue Timer**: The "Time Left" countdown now displays how long a task is overdue (e.g., "Overdue by 01:15:30") instead of just a static "Overdue" message.
-   **Backup Data Structure**: The format of backup files was harmonized to use clean keys (`words`, `settings`) instead of the raw `electron-store` format (`overwhelmed-words`, etc.), ensuring consistency across import, export, and restore features.
-   **Backup Folder Organization**: Backups are now organized into `automatic` and `manual` sub-folders within the application's data directory for better clarity and safer pruning logic.


### Fixed
-   **Build System Overhaul**: Resolved a complex and persistent build loop involving conflicting TypeScript module configurations (`Cannot redeclare block-scoped variable` vs. `module is not defined`). The final solution involved renaming configuration files to `.cts` to enforce CommonJS module resolution, correcting `require` paths, and aligning all `@electron-forge` package versions in `package.json`. This stabilized the development environment and resolved the final `ERR_CONNECTION_REFUSED` white screen issue.
-   **Data Integrity on Quit**: Fixed a critical race condition where clicking "Save and Quit" would close the application before the save operation completed, leading to data loss. The main process now takes full control of the save sequence during shutdown to guarantee data integrity.
-   **Word Placement on Save**: Fixed a bug where words added in "List View" would not appear on the "Meme View" canvas after relaunching. The save logic (for both the save button and the quit dialog) now ensures all words have valid canvas coordinates before being persisted.
-   **List View Input**: Fixed a bug that prevented adding new words by pressing "Enter" while in "List View".
-   **Canvas Redraw**: Fixed a bug where the background image would disappear when switching from "List View" back to "Meme View".
-   **UI/UX Improvements**: Refined the UI with consistent icons, non-intrusive toast notifications for user actions, and improved layout for the task list to be cleaner and more intuitive.
-   **Clickable Category Pills**: Added clickable category "pills" to task headers for quick navigation between category views.
-   **Hierarchical Category Pills**: Task headers now display both parent and child category pills (e.g., "Work" and "Tickets") for better context.
-   **Dynamic UI**: The UI now intelligently hides empty sections (like "Priority List" or "Completed Items") and provides helpful "Open Task" buttons to improve workflow.
-   **External Link Handling**: Fixed a bug where hyperlinks created in the description field would navigate inside the app instead of opening in the user's default browser.
-   **Context Menu Logic**: Resolved event propagation conflicts to ensure the correct context menu (for links vs. tickets) appears reliably.
-   **List Reordering**: Fixed a critical bug where the up/down arrows for reordering tasks in the list view would fail when filters were active. The logic now correctly reorders items based on their visual position on the screen.
-   **UI Polish**: Moved the "Save Project" button to be a fixed element on the screen, ensuring it's always visible. The "Add Task" buttons now automatically open the sidebar if it's closed.
-   **Data Loss on Startup**: Resolved a critical issue where a change in a dependency's default behavior could cause the application to load a blank session and overwrite existing data. The `electron-store` initialization was fixed to explicitly name the data file (`config.json`), ensuring the correct file is always loaded.
-   **Unsupported `prompt()` Dialog**: Replaced the unsupported `window.prompt()` with a custom, reusable modal component for creating named manual backups, resolving a runtime error in Electron.
-   **Backup Restore Toast**: Fixed a bug where the "Backup restored successfully!" toast notification would not automatically disappear.
