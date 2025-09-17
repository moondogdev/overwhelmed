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


### Changed
-   **UI Terminology**: Standardized the term "Ticket" to "Task" throughout the application, including context menus and UI labels, for better clarity and consistency.
-   **Duplicate Task**: Renamed the "Copy Task" feature to "Duplicate Task" to more accurately describe its function of creating a new, editable copy of an existing task.
-   **Overdue Timer**: The "Time Left" countdown now displays how long a task is overdue (e.g., "Overdue by 01:15:30") instead of just a static "Overdue" message.

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