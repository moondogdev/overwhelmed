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
-   **Manual Work Timer**: Added a manual stopwatch to each task to track active work time.
-   **Data Persistence**: Replaced `localStorage` with `electron-store` for robust, file-based data persistence, following secure Electron patterns.
-   **Save State Management**: The application now tracks an "unsaved changes" (dirty) state, providing clear visual feedback to the user.
-   **Dynamic Save Button**: Implemented a single save button that dynamically changes its text and color (red for "Unsaved", green for "Saved") to reflect the current project state.
-   **`Control+S` Shortcut**: Added a keyboard shortcut for `Control+S` to quickly save the project.
-   **Smart Quit Dialog**: When closing the app with unsaved changes, a dialog now prompts the user to "Save and Quit", "Don't Save", or "Cancel". The app closes instantly if there are no unsaved changes.

### Fixed
-   **Build System Overhaul**: Resolved a complex and persistent build loop involving conflicting TypeScript module configurations (`Cannot redeclare block-scoped variable` vs. `module is not defined`). The final solution involved renaming configuration files to `.cts` to enforce CommonJS module resolution, correcting `require` paths, and aligning all `@electron-forge` package versions in `package.json`. This stabilized the development environment and resolved the final `ERR_CONNECTION_REFUSED` white screen issue.
-   **Data Integrity on Quit**: Fixed a critical race condition where clicking "Save and Quit" would close the application before the save operation completed, leading to data loss. The main process now takes full control of the save sequence during shutdown to guarantee data integrity.
-   **Word Placement on Save**: Fixed a bug where words added in "List View" would not appear on the "Meme View" canvas after relaunching. The save logic (for both the save button and the quit dialog) now ensures all words have valid canvas coordinates before being persisted.
-   **List View Input**: Fixed a bug that prevented adding new words by pressing "Enter" while in "List View".
-   **Canvas Redraw**: Fixed a bug where the background image would disappear when switching from "List View" back to "Meme View".
-   **UI/UX Improvements**: Refined the UI with consistent icons, non-intrusive toast notifications for user actions, and improved layout for the task list to be cleaner and more intuitive.
-   **External Link Handling**: Fixed a bug where hyperlinks created in the description field would navigate inside the app instead of opening in the user's default browser.
-   **Context Menu Logic**: Resolved event propagation conflicts to ensure the correct context menu (for links vs. tickets) appears reliably.