# Commits

A log of what was commited to git.

---

## Log of Changes

- **[1.0.15] - 2025-09-25: Checklist Usability & Collapsible Sections**: feat(checklist): Add collapsible sections, in-line editing, and remove native prompts
- **[1.0.14] - 2025-09-23: Interactive Checklists & Link Handling**: feat(checklist): Overhaul checklist interactivity, add link handling, and fix bugs
- **[1.0.13] - 2025-09-23: Interactive Checklist Items**: feat(checklist): Implement fully interactive checklist item UI
- **[1.0.12] - 2025-09-23: Checklist Enhancements**: feat(checklist): Add due dates, fix duplication, and improve layout
- **[1.0.11] - 2025-09-23: Checklist UI/UX and Context Menu Polish**: feat(checklist): Improve checklist UX and add delete note/response actions
- **[1.0.10] - 2025-09-22: Alternating & Looping Tasks**: feat(tasks): Add alternating and looping task functionality
- **[1.0.09] - 2025-09-22: Copy Checklist**: feat(checklist): Add copy to clipboard functionality
- **[1.0.08] - 2025-09-22: Checklist Responses & Notes**: feat(checklist): Add response and note fields to items. Doc edits
- **[1.0.07] - 2025-09-21: UI Polish & Category Color-Coding**: feat(ui): Add category colors and refactor task header/actions
- **[1.0.06] - 2025-09-21: Grouped Task View by Day**: feat(tasks): Add grouped view by day when sorting by due date
- **[1.0.05] - 2025-09-21: Task Types & Templated Forms**: feat(tasks): Implement Task Types and Templated Forms
- **[1.0.04] - 2025-09-21: Inbox Archive & Trash + Documentation**: feat(inbox): Implement full Archive and Trash system with UI polish 
- **[1.0.03] - 2025-09-20: Inbox Protection & Full Task View**:
- **[1.0.02] - 2025-09-19: Advanced Checklists, UI Polish, & Documentation**:
- **[1.0.01] - 2025-09-18: Notification System & Inbox View**:
- **[1.0.00] - 2025-09-15: Core Task Management & Data Persistence**:

---

## [1.0.15] - 2025-09-24: Checklist Usability & Collapsible Sections
**feat(checklist): Add collapsible sections, in-line editing, and remove native prompts**

This commit introduces major usability enhancements to the checklist system, including collapsible sections, in-line editing for section titles, and a move away from disruptive native prompts for context menu actions, creating a smoother and more intuitive workflow.

#### Features & Fixes:
-   **Collapsible Sections**:
    -   Implemented expand/collapse functionality for individual checklist sections via a new arrow icon in the section header.
    -   Added "Expand All Sections" and "Collapse All Sections" buttons and context menu actions to the main checklist header for global control.
-   **In-Line Section Title Editing**: Checklist section titles can now be edited directly in both "Task" and "Edit" views by double-clicking the title text.
-   **Context Menu Overhaul**:
    -   Refactored the context menu actions for adding/editing notes and responses to use the same non-blocking, in-place editing UI as the quick-action buttons, removing the reliance on native `prompt()` dialogs.
    -   The "View Task" / "Edit Task" option now correctly toggles based on the current view mode.
-   **UI/UX Polish**:
    -   Refactored the main checklist header and section header buttons for a more uniform and consistent appearance.
    -   Added "Hide/Show Notes" and "Hide/Show Responses" toggles to section context menus and as global buttons in the main checklist header.
    -   When adding a new section, the "New Section" placeholder text is now automatically selected for immediate renaming.
-   **Documentation**:
    -   Added `Rule 60.0` (Synchronizing Checklist State) and `Rule 61.0` (Avoiding Native Modals) to `GEMINI.md`.
    -   Updated `DEFINITIONS.md` with new handlers and state related to collapsible sections and improved context menus.

---

## [1.0.14] - 2025-09-23: Interactive Checklists & Link Handling
**feat(checklist): Overhaul checklist interactivity, add link handling, and fix bugs**

This commit rolls up a significant number of features and fixes for the checklist system, dramatically improving its interactivity, stability, and usability.

#### Features & Fixes:
-   **Interactive Items**: Implemented full in-place editing for checklist items, notes, and responses. Added a hover-activated quick-action menu for editing, deleting, and adding notes/responses.
-   **Link Handling**: URLs in checklist items, notes, and responses are now automatically clickable. Context menus have been added to "Open Link" and "Copy Link".
-   **Item Highlighting**: Added a "Highlight" submenu to the item context menu to apply a colored border, with a "Clear All Highlights" bulk action.
-   **Dedicated Context Menus**: Added focused context menus for notes and responses, including "Edit" actions for quick modifications.
-   **Bug Fixes**:
    -   Resolved a crash caused by a missing `break;` statement in the "Move Down" action.
    -   Fixed a bug where the "Edit Item" button would clear the item's content.
    -   Corrected multiple issues where context menu items were enabled when they should have been disabled.
    -   Fixed a timezone bug in the checklist item date picker.
    -   Resolved a performance issue causing the footer to re-render constantly.
-   **Documentation**: Updated `GEMINI.md` and `DEFINITIONS.md` with new developer guides and definitions for all new features and patterns.

---

---

## [1.0.13] - 2025-09-23: Interactive Checklist Items
**feat(checklist): Implement fully interactive checklist item UI**

This commit introduces a major overhaul of the checklist item UI, making notes and responses first-class, editable fields and adding a full set of quick-action buttons for a more intuitive and efficient workflow.

#### Features & Fixes:
-   **In-Place Editing**: When a task is in "Edit" mode, all checklist items, including their notes and responses, are now rendered as editable `<input>` fields by default.
-   **Quick Actions on Hover**: In the read-only "Task" view, hovering over a checklist item now reveals a set of quick-action icon buttons:
    -   **Edit Item**: A pencil icon that allows for in-place editing of the main item text.
    -   **Add/Remove Note**: A note icon that adds a note field. The icon becomes "active" (colored) to indicate it can be clicked again to remove the note.
    -   **Add/Remove Response**: A reply icon that functions identically to the note button for responses.
    -   **Delete Item**: A trash icon to delete the entire checklist item.
-   **Autofocus**: When a note or response field is created in either "Task" or "Edit" view, it is now automatically focused so the user can begin typing immediately.
-   **Stable UI**: The layout has been refactored to prevent the "quick actions" menu from shifting or disappearing when a note or response is added, creating a stable and non-frustrating user experience.
-   **Documentation**:
    -   Added `Rule 55.0` to `GEMINI.md` to document the pattern for creating stable hover-action menus.
    -   Updated `DEFINITIONS.md` with all new state variables (`editingResponseForItemId`, `focusSubInputKey`, etc.) and handlers (`handleDeleteItem`, `handleDeleteItemResponse`, etc.) related to these new features.

#### Summary:
These changes transform the checklist from a static list into a fully interactive and dynamic component. Users can now manage all aspects of a checklist item—text, notes, and responses—directly from the list view with intuitive hover actions, significantly improving workflow speed and usability.
---

## [1.0.12] - 2025-09-23: Checklist Enhancements
**feat(checklist): Add due dates, fix duplication, and improve layout**

This commit introduces a significant set of enhancements to the checklist system, adding individual due dates, fixing a critical duplication bug, and improving the overall editing experience.

#### Features & Fixes:
-   **Individual Due Dates**: Implemented a feature to add an optional due date to each checklist item. This includes a date picker in the "Edit" view and a clean display in the "Task" view with visual cues for urgency (red for overdue, yellow for due today).
-   **Bulk Deletion**: Added a "Delete Checked" button to both section headers and the main checklist header, allowing for efficient bulk removal of completed items.
-   **In-Place Editing Fix**: Resolved a major bug where the "Edit Item" context menu action would not work from the read-only "Task" view. Now, selecting "Edit Item" correctly switches the specific item into an editable text field, allowing for quick edits without changing the entire task view.
-   **Duplication Bug Fix**: Fixed a critical bug where duplicating a checklist section or item resulted in shared unique IDs, causing updates to a duplicated item to incorrectly affect the original. The duplication logic now performs a "deep copy," ensuring all new items receive their own unique IDs.
-   **Improved Layout & Editing**:
    -   The entire row for a checklist item is now a full-width clickable area, improving interaction.
    -   The text input field for editing an item is now significantly larger, expanding to the full width of the item for a much better editing experience.
-   **Documentation**:
    -   Added `Rule 54.0` to `GEMINI.md` to document the state management pattern for in-place editing.
    -   Added a log of the "shallow copy" vs. "deep copy" lesson learned from the duplication bug.
    -   Updated `DEFINITIONS.md` with new state variables and handlers related to these features.

#### Summary:
These changes make the checklist feature more powerful and robust, adding key functionality for time management and resolving critical bugs related to state management and user interaction.

---

## [1.0.11] - 2025-09-23: Checklist UI/UX and Context Menu Polish
**feat(checklist): Improve checklist UX and add delete note/response actions**

This commit introduces a series of quality-of-life improvements to the checklist system, focusing on fixing annoying UI behaviors and expanding context menu functionality.

#### Features & Fixes:
-   **Click-Through Fix**: Refactored the `ChecklistItem` component to move the `note` and `response` divs outside of the `<label>` element. This prevents the checkbox from being toggled when a user clicks on the note or response text.
-   **Hover & Context Menu Polish**:
    -   Added a `checklist-item-interactive-area` class and a corresponding hover style in CSS to provide clear visual feedback when the mouse is over any part of a checklist item.
    -   Moved the `onContextMenu` handler to the parent `div` of the checklist item, making the entire item area (text, note, response) right-clickable.
    -   Fixed a context menu "flickering" bug by adding `event.stopPropagation()` to the item's context menu handler, preventing it from conflicting with the parent section's menu.
-   **Delete Note/Response**:
    -   The checklist item context menu now includes "Delete Note" and "Delete Response" options.
    -   These menu items are dynamically enabled/disabled based on whether a note or response exists for the item.
    -   The `showChecklistItemContextMenu` IPC call was updated to pass `hasNote` and `hasResponse` booleans to the main process.
    -   Added logic in the renderer to handle the new `delete_note` and `delete_response` commands.
-   **Documentation**:
    -   Added `Rule 53.0` to `GEMINI.md` to document the concept of event propagation (bubbling) and the `stopPropagation()` solution.
    -   Added a corresponding entry to `DEFINITIONS.md`.

#### Summary:
These changes make the checklist feature more robust, intuitive, and user-friendly by fixing key interaction bugs and adding essential management functions.

---

## [1.0.10] - 2025-09-22: Alternating & Looping Tasks
**feat(tasks): Add alternating and looping task functionality**

This feature introduces a system for linking tasks, allowing the completion of one task to automatically activate another, and adds support for self-perpetuating loops between two re-occurring tasks.

#### Features:
-   **Data Structure**: Added a new optional `startsTaskIdOnComplete` field to the `Word` interface to store the ID of the successor task.
-   **UI Implementation**: A new "Starts Task on Complete" dropdown has been added to the "Edit Task" view. This dropdown is populated with all other open tasks, allowing a user to create a dependency.
-   **Core Logic**: The `handleCompleteWord` function was updated to check for the `startsTaskIdOnComplete` field. If a successor task ID is present, it finds that task and updates its `openDate` to `Date.now()`, effectively "starting" it.
-   **Loop Detection**: The `TaskAccordionHeader` now checks if a task's successor links back to the original task. If a two-way link is detected, it displays a spinning "sync" icon to indicate a loop.
-   **Loop Persistence**: Refactored the `handleCompleteWord` function to be a single, atomic state update. When a re-occurring task in a loop is completed, it now correctly finds the successor and updates its `startsTaskIdOnComplete` field to point to the ID of the *newly created* re-occurring task, ensuring the loop integrity is maintained.
-   **Debugging UI**: Added the unique Task ID to the accordion header, edit view, and "Completing starts" display to make tracing task relationships easier.

#### Summary:
This commit adds a powerful workflow feature, enabling users to create simple, sequential dependencies and two-task loops. The logic was carefully refactored to handle the complexities of state updates for re-occurring tasks within a loop.

---

## [1.0.10] - 2025-09-23: Alternating Tasks (Initial)
**feat(tasks): Add alternating tasks functionality**

This feature introduces a system for linking tasks, allowing the completion of one task to automatically activate another.

#### Features:
-   **Data Structure**: Added a new optional `startsTaskIdOnComplete` field to the `Word` interface to store the ID of the successor task.
-   **UI Implementation**: A new "Starts Task on Complete" dropdown has been added to the "Edit Task" view. This dropdown is populated with all other open tasks, allowing a user to create a dependency.
-   **Core Logic**: The `handleCompleteWord` function was updated to check for the `startsTaskIdOnComplete` field. If a successor task ID is present, it finds that task and updates its `openDate` to `Date.now()`, effectively "starting" it.

#### Summary:
This commit adds a powerful workflow feature, enabling users to create simple, sequential dependencies between tasks.

---

### **[1.0.9] - 2025-09-22: Copy Checklist**
**feat(checklist): Add copy to clipboard functionality**

This feature adds the ability to copy checklist data to the clipboard as clean, readable, plain text, making it easy to share or use in other applications.

#### Features:
-   **Copy to Clipboard**: Implemented a `formatChecklistForCopy` helper function to convert checklist data into a plain-text string, following the guidelines in `Rule 51.0`.
-   **Context Menu & UI Buttons**: Added "Copy Section" and "Copy All Sections" actions to both the UI as dedicated buttons and to the right-click context menu on section headers for easy access.
-   **Enhanced Formatting**: The copied text now includes the section's completion count (e.g., "Section Title (3/5)") and includes any public `response` fields while correctly excluding private `note` fields.
-   **UI Improvement**: The checklist section headers in the UI now also display the live completion count, improving at-a-glance progress tracking.

#### Summary:
This commit makes the checklist system more versatile by providing a simple and effective way to export its content for external use.

---

### **[1.0.8] - 2025-09-22: Checklist Responses & Notes**
feat(checklist): Add response and note fields to items

This feature enhances the checklist system by allowing users to add a public "Response" and a private "Note" to any checklist item.

#### Features:
-   **Data Structure**: Updated the `ChecklistItem` interface to include optional `response` and `note` string fields.
-   **Context Menu Integration**: Added "Add/Edit Response", "Add/Edit Note", and "Copy Response" options to the checklist item's right-click context menu.
-   **Custom Modal UI**: Leveraged the existing `PromptModal` component to provide a consistent UI for entering and editing response/note text, replacing the default browser prompt.
-   **UI Display**: The response and note are now displayed cleanly beneath their corresponding checklist item, each with a unique icon (`fa-reply`, `fa-sticky-note`) and background color for clear visual distinction.

#### Summary:
This commit adds a new layer of detail and context to the checklist system, making it more versatile for tracking feedback and internal thoughts on a per-item basis.

### **[1.0.7] - 2025-09-21: UI Polish & Category Color-Coding**
feat(ui): Add category colors and refactor task header/actions

This feature introduces a major UI polish, adding a color-coding system for categories and cleaning up the task accordion header and action buttons.

#### Features:
-   **Category Color-Coding**: Users can now assign a custom color to each category and sub-category via a new color picker in the "Category Manager". These colors are reflected in the task list pills and the main category filter tabs.
-   **Automatic Contrast**: Implemented a helper function (`getContrastColor`) to automatically set pill text to black or white for optimal readability against any user-selected color.
-   **Accordion Header Refactor**: The task header has been refactored into a dedicated `TaskAccordionHeader` component, cleaning up the main `App` component. Category and Priority information was moved to the main title line for a more compact layout.
-   **Action Button Cleanup**: The action buttons in the task accordion have been restyled for a uniform size. Recurring task options are now consolidated into a new, space-saving `Dropdown` component.

#### Summary:
This commit significantly improves the visual organization and clarity of the UI, making it more intuitive and aesthetically pleasing.

---

### **[1.0.6] - 2025-09-21: Grouped Task View by Day**
feat(tasks): Add grouped view by day when sorting by due date

This feature enhances the list view by grouping tasks under distinct date headers when sorting by "Due Date (Soonest First)".

#### Features:
-   **Date Grouping**: Implemented logic to process and group tasks by their `completeBy` date.
-   **Relative Date Headers**: Added a helper function to generate user-friendly headers like "Today", "Tomorrow", and "No Due Date". Headers for other dates include the full date and year.
-   **Task Count Display**: Each date header now includes a count of tasks for that day, with custom styling to differentiate it from the date.
-   **UI/UX Polish**: Added custom CSS for the new date headers, including a different style for the "No Due Date" group to improve scannability and visual organization.

#### Summary:
This commit significantly improves the readability and organization of the task list, making it easier for users to see what's due at a glance.

---

### **[1.0.5] - 2025-09-21: Task Types & Templated Forms**
feat(tasks): Implement Task Types and Templated Forms

This feature introduces a "Task Types" system, allowing users to create templated forms that show only the fields relevant to a specific type of task, significantly streamlining the task creation process.

#### Features:
-   **Task Types System**: Implemented the core data structures to support user-definable task types, each with a specific set of visible fields.
-   **Dynamic "Add Task" Form**: The "Add New Task" form now dynamically renders fields based on the selected task type, hiding irrelevant inputs and creating a more focused workflow.
-   **Task Type Manager**: Added a new manager to the sidebar, allowing users to create, rename, delete, and configure the visible fields for each task type, offering full customization of the templating system.

#### Summary:
This commit adds a powerful layer of customization to task creation, making the application more flexible and efficient for managing different kinds of work.

---

### **[1.0.4] - 2025-09-21: Inbox Archive & Trash + Documentation Workflow**
feat(inbox): Implement full Archive and Trash system with UI polish

This major update introduces a complete, non-destructive workflow for managing inbox messages, including "Important," "Archive," and "Trash" states.

#### Features:

- Inbox Archive: Adds an "Archive" tab and functionality to move messages out of the active inbox for later reference. Includes "Archive" and "Un-archive" actions for single messages and "Un-archive All" / "Trash All" for bulk operations.
- Inbox Trash: Replaces permanent deletion with a "Trash" system. Dismissed messages are now moved to a "Trash" tab, providing a safety net. The trash view includes "Restore," "Delete Permanently," "Restore All," and "Empty Trash" actions.
- Important Flag: Adds a star icon to messages to flag them as "important," protecting them from "Clear All" and "Dismiss" actions.
- UI Refinements: Relocates bulk action buttons ("Clear All," "Empty Trash," etc.) into their respective tabs for a more intuitive user experience. Fixes several UI rendering bugs and improves hover effects on action buttons.

#### Documentation:

- `DEFINITIONS.md`: Creates a new central glossary to document all key project handlers, state variables, and architectural patterns.
- `GEMINI.md`: Adds new developer guide rules for state management (Rule 40.0) and UI action handlers (Rule 41.0). Also adds a log of lessons learned from recent UI rendering bugs.

#### Summary

This commit finalizes the core functionality of the expanded inbox system, making it more powerful, resilient, and user-friendly.

---

### **[1.0.3] - 2025-09-20: Inbox Protection & Full Task View**

---

### **[1.0.2] - 2025-09-19: Advanced Checklists, UI Polish, & Documentation**

---

### **[1.0.1] - 2025-09-18: Notification System & Inbox View**  

---

### **[1.0.0] - 2025-09-15: Core Task Management & Data Persistence**

---