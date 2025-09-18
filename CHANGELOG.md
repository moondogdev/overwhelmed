 # Changelog

All notable changes to this project will be documented in this file.

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
