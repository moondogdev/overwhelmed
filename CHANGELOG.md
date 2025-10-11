# Changelog

All notable changes to this project will be documented in this file. See `## Log of Changes` below.

---


## Future Features
-   ### **Reports & Analytics**:
    -   **Calculate Net Business Revenue**: Implement a calculation in the tax report that determines net business revenue by subtracting total business expenses, asset depreciation, and vehicle expenses from total business income.
    -   **Refine "Finances" View Expense Reporting**:
        -   Incorporate calculated vehicle mileage deductions and asset depreciation values into the total expense calculations to provide a more comprehensive financial overview.
    -   **Yearly Tax Breakdown**: Enhance the "Lifetime Tax Summary" in the `ReportsView` "Taxes" tab to include a year-by-year breakdown of total deductible expenses.

-   ### **Vehicle & Mileage**:
    -   **Mileage Log**: Implement a mileage log within the `VehicleInformationManager` to allow users to record individual trips (date, purpose, start/end odometer) instead of just a yearly total.

-   ### **Automated Transaction Importing (via Plaid Integration)**
    -   **Phase 1: Research & Backend Setup**:
        -   Research and select a third-party financial data aggregator (e.g., Plaid, Yodlee).
        -   Set up a secure backend server (e.g., using Node.js/Express or a serverless function) to manage API keys and user access tokens.
        -   Create a simple database to securely store the `access_token` for each user, linking it to their Overwhelmed instance.
    -   **Phase 2: Client-Side Integration**:
        -   Integrate the aggregator's front-end widget (e.g., Plaid Link) into the Overwhelmed application.
        -   Add a "Connect Bank Account" button that launches the widget.
        -   Implement the client-side logic to receive the temporary `public_token` from the widget and send it to our backend to be exchanged for a permanent `access_token`.
    -   **Phase 3: Data Fetching & Syncing**:
        -   On the backend, create a scheduled job (e.g., a cron job) that runs periodically (e.g., daily).
        -   The job will iterate through all stored `access_token`s and fetch any new transactions from the aggregator's API since the last check.
        -   Store the new, standardized transaction data in our database.
    -   **Phase 4: App Synchronization**:
        -   When the Overwhelmed app starts, it will make an authenticated API call to our backend to request new transactions.
        -   The backend will return any new transactions it has stored.
        -   The app will then process these transactions and add them to the user's task list, ready for categorization.

-   ### **Transactions**:
    -   Clean up transaction UI further. Simplify accordion details.

-   ### **Table View**: 
    -   Implement a new "Table View" for tasks, similar to a spreadsheet.
    -   Allow for inline editing of task properties (title, due date, priority, etc.) directly from the table cells.
    -   Include features like column sorting, filtering, and resizing.
    -   Allow for bulk editing of task properties (title, due date, priority, etc.) directly from the table cells.

-   ### **Checklist & Editor Enhancements**:
    -   **Paste Image into Rich Text Editor**: Allow pasting an image from the clipboard directly into the editor.
    -   **Image Support in Checklist**: Add the ability to include images in checklist item notes and responses.

-   ### **Linked / Looped Tasks**:
    -   **Task Series Loop**: Expand the linked task feature to support multi-step series (A -> B -> C), not just two-task loops.

-   ### **Standalone Application**: 
    Package the application into a distributable and installable format for major operating systems (Windows, macOS, Linux).

-   ### **Users**: 
    -    Add a feature to create users and assign tickets to them, with the ability to filter the list to view tickets assigned to a specific user.

-   ### **Themes**: 
    -   Different style layouts

-   ### **Settings & Data Management**: 
    -   Build a full, dedicated "Settings" view instead of having them in the sidebar.
    -   Implement "Export Settings" and "Import Settings" functionality to allow users to save, load, and share their application configuration independently of their task data.

-   ### **Calendar**: 
    -   Task view in Calendar form. Can start new task on a specific due date by using the calendar

-   ### **System Integration & Quick Actions**:
    -   **Launch Program Buttons**: Add the ability to create custom buttons or links within the app that can launch external programs on the user's system.
    -   **Open File Path Buttons**: Add a feature to create buttons or links that open a specific folder path in the system's file explorer.

-   ### Budgeting System
    -   #### **Phase 1: Foundational Budgeting Model**
        -   **Data Model**:
            -   Add a `budgets` array to the `Settings` interface.
            -   Define a `Budget` interface: `{ id: number; name: string; categoryIds: number[]; amount: number; period: 'monthly' | 'yearly'; }`.
        -   **UI**:
            -   Create a `BudgetManager` in the sidebar to allow users to create, edit, and delete budgets.
            -   For each budget, users should be able to set a name, a monetary amount, a period (monthly/yearly), and associate it with one or more expense categories.
    -   #### **Phase 2: Budget Tracking & Reporting**
        -   **Reporting**: In the "Finances" tab of the `ReportsView`, add a new "Budgets" section.
        -   For each defined budget, display a progress bar showing `(total spent in associated categories for the period) / (budgeted amount)`.
        -   Display the amount remaining or the amount over budget.
        -   Allow the user to filter the report view by the time period of the budget (e.g., show this month's data for a monthly budget).
    -   #### **Phase 3: Notifications & Insights**
        -   **Notifications**: Create new `InboxMessage` types for budget alerts.
        -   Trigger notifications when a budget reaches 75%, 90%, and 100% of its limit for the current period.
        -   **Insights**: In the "Reports" view, provide simple insights, such as "You are on track for your 'Groceries' budget this month" or "Warning: You have exceeded your 'Entertainment' budget."

-   ### **Response to Ticket**: 
    -   Maybe expand this section to include some details from the task and likely where we could tie in the "scripted responses" from the next request so we can use a dropdown to input a variety of responses which we can edit in the response field to either leave there or copy for use externally. like hello these tasks were completed on xxx. please blah blah blah. 

-   ### **Filtered search of Scripted responses**: 
    -   Similar to above and likely used for the Response to Ticket but also allowing the user to user from a variety of responses and oneliners for Tasks functioning as Tickets. 

-   ### **Send Notifications externally**: Attempts to hook the various toast alerts to external sources
    -   **Send to Desktop Notifications**: See whats possible with Electron
    -   **Send to Email Notifications**: See whats possible with Electron
    -   **Send to SMS Notifications**: See whats possible with Electron

---

## Log of Changes

- **[1.0.34] - 2025-10-11: Code Snippets & UI Polish**: feat(core): Add code snippet editor and in-place editing for task details. Deprecate MemeView and fix IPC stability.
- **[1.0.33] - 2025-10-08: Main Process Refactor**: refactor(main): Decompose monolithic `index.ts` and `contextMenuManager.ts` into feature-specific modules.
- **[1.0.32] - 2025-10-08: Core Architecture & Data Persistence Refactor**: refactor(core): Decompose `AppLayout` and `useDataPersistence` and improve context type safety.
- **[1.0.31] - 2025-10-08: Component Refactor**: refactor(multiple): Decompose monolithic components into individual component files.
    - **[1.0.31.05] - 2025-10-08: Sidebar Component Refactor**: refactor(sidebar): Decompose monolithic `SidebarComponents.tsx` into individual component files.
    - **[1.0.31.04] - 2025-10-08: ListView & useListView Refactor**: refactor(list): Decompose `ListView` component and `useListView` hook into smaller, single-responsibility modules.
    - **[1.0.31.03] - 2025-10-08: Time Tracker Log Refactor**: refactor(time): Decompose monolithic `TimeTrackerLog` component into a custom hook and smaller components.
    - **[1.0.31.02] - 2025-10-08: Task State Management Refactor**: refactor(tasks): Decompose monolithic useTaskState hook into smaller, single-responsibility hooks.
    - **[1.0.31.01] - 2025-10-08: Reports View Refactor**: refactor(reports): Decompose monolithic `ReportsView` component into smaller components and a custom hook.
- **[1.0.30] - 2025-10-07: Tax Reporting & Sidebar Management Overhaul**: feat(core): Overhaul tax reporting UI and sidebar component management.
- **[1.0.29] - 2025-10-06: Tax Workflow & Reporting Polish**: feat(taxes): Enhance tax workflow with new actions, filters, and reporting UI.
- **[1.0.28] - 2025-10-05: Financial Tracking & Reporting**: feat(finances): Implement comprehensive financial tracking and reporting.
- **[1.0.27] - 2025-10-04: Checklist Hook Refactor**: refactor(checklist): Decompose monolithic `useChecklist` hook into smaller, single-responsibility hooks.
- **[1.0.26] - 2025-10-04: Advanced Checklist Structuring & Organization**: feat(checklist): Implement content blocks, hierarchical sorting, nesting, bulk actions, and named hyperlinks.
- **[1.0.25] - 2025-10-03: Inbox Expansion & Auto-Save Logic**: feat(core): Complete Inbox expansion and fix auto-save logic.
- **[1.0.24] - 2025-10-03: Data Export & Advanced Notification Controls**: feat(core): Implement comprehensive data export and advanced notification management.
- **[1.0.23] - 2025-10-03: Bulk Task Management**: feat(tasks): Implement bulk task actions and enhanced bulk add.
- **[1.0.22] - 2025-10-03: Workflow Features & UI Overhaul**: feat(core): Enhance task workflows, stabilize editor, and overhaul UI.
- **[1.0.21] - 2025-10-02: Codebase Cleanup & Bug Fixes**: refactor(core): Standardize naming conventions (Word->Task) and Checklist.tsx refactor fix data loading
- **[1.0.20] - 2025-10-02: MiniPlayer V2: Work Session Manager**: feat(player): Implement Work Session Manager and MiniPlayer V2
- **[1.0.19] - 2025-09-27: Full Refactor to Hook-Based Architecture**: refactor: Complete full refactor to hook-based architecture and MiniPlayer
- **[1.0.18] - 2025-09-26: Time Log Sessions & Advanced Timer Controls**: feat(time): Implement Time Log Sessions and advanced timer controls
- **[1.0.17] - 2025-09-26: Time Tracker Log & Checklist Integration**: feat(time): Implement detailed time tracker log and checklist integration
- **[1.0.16] - 2025-09-25: Checklist Main Header Context Menu & Command Refactor**: feat(checklist): Add main header context menu and refactor command handling
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
- **[1.0.04] - 2025-09-21: Inbox Archive & Trash + Documentation Workflow**: feat(inbox): Implement full Archive and Trash system with UI polish 
- **[1.0.03] - 2025-09-20: Inbox Protection & Full Task View**:
- **[1.0.02] - 2025-09-19: Advanced Checklists, UI Polish, & Documentation**:
- **[1.0.01] - 2025-09-18: Notification System & Inbox View**:
- **[1.0.00] - 2025-09-15: Core Task Management & Data Persistence**:

---

- **[1.0.34] - 2025-10-11: Code Snippets & UI Polish**
**feat(core): Add code snippet editor and in-place editing for task details. Deprecate MemeView and fix IPC stability.**

This update introduces a powerful new Code Snippet manager within tasks and significantly improves the editing workflow with in-place editing for rich text fields. It also completes the removal of the legacy `MemeView` and resolves a critical stability issue with checklist context menus.

#### Added
-   **Code Snippets**: A new "Code Snippets" accordion has been added to the task view, allowing users to add multiple, distinct code blocks to a task.
    -   **In-Place Editing**: Snippets can be edited directly in the task view.
    -   **Language Selection & Syntax Highlighting**: Each snippet has a language selector that provides appropriate syntax highlighting in both view and edit modes.
-   **In-Place Editing for Task Details**: The `Description`, `Notes`, and `Responses` fields in the "Task" view can now be edited in-place by double-clicking the content or using a new pencil icon, eliminating the need to switch to the main "Edit" tab for quick changes.
-   **Collapsible Task Sections**: All content sections within the "Task" and "Edit" views (e.g., "Task Details," "Description," "Checklist") are now collapsible accordions. The open/closed state for each section is saved on a per-task basis, allowing for persistent, customized layouts.

This update completes the removal of the original "Meme View" word cloud feature. The feature was superseded by the more powerful `ListView` and `TaskView` components. This refactor simplifies the codebase, data model, and settings configuration.

#### Removed
-   **Data Model Cleanup**: Removed canvas-specific properties (`x`, `y`, `width`, `height`) from the `Task` interface.
-   **Settings Cleanup**: Removed all `MemeView`-specific settings from the `Settings` interface and `config.ts` (e.g., `fontFamily`, `shadowColor`, `overlayColor`).
-   **Component Deletion**: Deleted the `MemeView.tsx` and `MemeViewSettings.tsx` component files.
-   **IPC Handler Removal**: Removed the `dialog:saveFile` IPC handler, which was only used to save the canvas image.
-   **UI & Navigation Removal**: Removed all UI elements related to `MemeView`, including the main navigation button in the header and the settings panel in the sidebar. The application now defaults to the `ListView`.

#### Fixed
-   **IPC Listener Stability**: Resolved a critical `MaxListenersExceededWarning` that occurred when multiple tasks with checklists were open. All checklist-related IPC listeners (`checklist-main-header-command`, `checklist-section-command`, `checklist-item-command`) have been centralized into a single `useEffect` hook in `TaskView.tsx`. This new architecture uses a ref to delegate commands to the currently active checklist, eliminating memory leaks and improving application stability.
-   **Loading Indicator**: The application now displays a simple "Loading..." message on startup. It waits for the user's settings to be fully loaded from disk before rendering the main UI, ensuring a smooth and direct transition to the correct view without any intermediate flashing.

#### Changed
-   **Data Layer Logic**: The `useReports` hook now contains centralized logic to identify and exclude transactions tagged with a "Charitable" tax category from all business expense calculations (`lifetimeTaxDeductibleExpenses`, `taxReportData`).
-   **UI Simplification**: The `TaxesTab` component has been simplified. It no longer performs its own filtering and instead relies on the pre-calculated data from the `useReports` hook, making the component cleaner and more aligned with our orchestrator pattern.
-   **Consistent Reporting**: All relevant report summaries and totals now accurately reflect the separation between business expenses and charitable giving.

---

- **[1.0.33] - 2025-10-08: Main Process Refactor**
**refactor(main): Decompose monolithic `index.ts` into feature-specific modules.**

This update completes a major architectural refactor of the Electron main process, significantly improving its organization and maintainability. The previously monolithic `index.ts` file, which contained all main process logic, has been broken down into smaller, single-responsibility modules.

#### Refactored
-   **Decomposed `index.ts`**: All logic related to backups, general IPC handling, and context menu creation has been extracted from `index.ts`.
-   **Created `backupManager.ts`**: This new module now exclusively handles all logic for creating, managing, and restoring automatic and manual backups.
-   **Created `ipcHandlers.ts`**: This module now contains all general-purpose IPC handlers that don't fit into other specific managers (e.g., file dialogs, data storage access).
-   **Created `contextMenuManager.ts`**: This module is now responsible for building and displaying all of the application's numerous right-click context menus. This module has itself been refactored to act as a clean "orchestrator" that initializes all context menu logic.
-   **Decomposed `contextMenuManager.ts`**: The `contextMenuManager.ts` file, which was created in the initial refactor, has itself been refactored. It now acts as a clean "orchestrator" that initializes all context menu logic.
-   **Created `menus/` Modules**: All logic for building individual context menus has been extracted into dedicated modules within a new `src/main/menus/` directory (e.g., `taskMenu.ts`, `checklistItemMenu.ts`, `linkMenu.ts`).
-   **Orchestrator Pattern**: The main `index.ts` file now acts as a clean "orchestrator." Its only job is to initialize the application, create the main window, and call the setup functions for the new, dedicated manager modules.

#### Summary
This refactor brings the main process architecture in line with the modular, hook-based architecture of the renderer process. By separating concerns, the codebase is now significantly more organized, easier to navigate, and safer to modify.

---

- **[1.0.32] - 2025-10-08: Core Architecture & Data Persistence Refactor**
**refactor(core): Decompose `AppLayout` and `useDataPersistence` and improve context type safety.**

This update continues the major architectural refactoring of the application, focusing on the main app layout and the critical data persistence layer. It also enhances the type safety of the global application context.

---

## [1.0.31.05] - 2025-10-08: Sidebar Component Refactor
**refactor(sidebar): Decompose monolithic `SidebarComponents.tsx` into individual component files.**

This update completes a major architectural refactor of the sidebar, significantly improving its organization and maintainability. The previously monolithic `SidebarComponents.tsx` file, which contained numerous unrelated components, has been broken down into smaller, single-responsibility modules.


---

## [1.0.31.04] - 2025-10-08: ListView & useListView Refactor
**refactor(list): Decompose `ListView` component and `useListView` hook into smaller, single-responsibility modules.**

This update completes a major architectural refactor of the `ListView` component and its associated `useListView` hook, following the successful "Orchestrator" pattern established in previous refactors (`useTaskState`, `useChecklist`, `useReports`). This significantly improves the maintainability, readability, and modularity of the list view feature.

#### Refactored
-   **Decomposed `ListView.tsx`**: The monolithic `ListView.tsx` component, which previously contained all rendering logic for both active and completed tasks, has been broken down into smaller, single-responsibility components:
    -   **`ListViewHeader.tsx`**: Manages category filters, search, and sorting controls.
    -   **`TaskList.tsx`**: Renders the list of active tasks.
    -   **`CompletedTasks.tsx`**: Renders the list of completed tasks.
-   **Decomposed `useListView.ts`**: The monolithic `useListView.ts` hook, which previously contained all state management, filtering, sorting, and action logic for the list view, has been broken down into a suite of smaller, single-responsibility custom hooks:
    -   **`useTaskFiltering.ts`**: Encapsulates the core logic for filtering both active and completed tasks based on various criteria (category, search, transaction details).
    -   **`useSelectionManagement.ts`**: Manages the "select all" functionality and state for both active and completed task lists.
    -   **`useListViewCalculations.ts`**: Handles all derived state and memoized calculations (e.g., `nonTransactionTasksCount`, `transactionTotal`, `uncategorizeTaxCount`).
    -   **`useListViewActions.ts`**: Consolidates user action handlers specific to the list view, such as sorting and various "copy" functions.
-   **Orchestrator Pattern**:
    -   The main `ListView.tsx` component now acts as a clean "orchestrator." Its only job is to initialize the `useListView` hook and render the new presentational components, passing down the necessary data and handlers as props.
    -   The `useListView.ts` hook itself also acts as an orchestrator, composing the functionality of the smaller hooks.
-   **Context-Driven Child Components**: `TaskList.tsx` and `CompletedTasks.tsx` now directly consume the `AppContext` for common props (e.g., `settings`, `handleTaskUpdate`, `showToast`), further reducing prop drilling from `ListView.tsx`.

#### Summary
This refactor was a critical step in managing the complexity of the list view feature. By separating concerns into dedicated hooks and smaller UI components, the codebase is now significantly more organized and easier to navigate. This modular architecture will make it much simpler to add new list-related features and fix bugs in the future.

---

## [1.0.31.03] - 2025-10-08: Time Tracker Log Refactor
**refactor(time): Decompose monolithic `TimeTrackerLog` component into a custom hook and smaller components.**

This update completes a major architectural refactor of the `TimeTrackerLog` component, following the successful "Orchestrator" pattern established in previous refactors (`useTaskState`, `useChecklist`, `useReports`). This significantly improves the maintainability, readability, and modularity of the time tracking feature.

#### Refactored
-   **Decomposed `TimeTrackerLog.tsx`**: The monolithic `TimeTrackerLog.tsx` component, which previously contained all state management and rendering logic for the time log, has been broken down into a suite of smaller, single-responsibility modules.
    -   **`useTimeTracker.ts`**: A new custom hook was created to encapsulate all state management (`useState`, `useRef`), data processing (`useMemo`), and event handlers related to the time log and saved sessions.
    -   **Presentational Components**: The UI has been extracted into smaller, "dumb" presentational components:
        -   **`TimeLogHeader.tsx`**: Renders the main header, including the title, total time, and all global action buttons.
        -   **`TimeLogEntryItem.tsx`**: Renders a single entry in the current time log, including its play/pause button, description, duration, and action buttons.
        -   **`TimeLogSessionItem.tsx`**: Renders a single row in the "Time Logs" history table, including its collapsible details view for nested entries.
-   **Orchestrator Pattern**: The main `TimeTrackerLog.tsx` component now acts as a clean "orchestrator." Its only job is to initialize the `useTimeTracker` hook and render the new presentational components, passing down the necessary data and handlers as props.

#### Summary
This refactor was a critical step in managing the complexity of the time tracking feature. By separating concerns into a dedicated hook and smaller UI components, the codebase is now significantly more organized and easier to navigate. This modular architecture will make it much simpler to add new time tracking features and fix bugs in the future.

---

## [1.0.31.02] - 2025-10-08: Task State Management Refactor
**refactor(tasks): Decompose monolithic `useTaskState` hook into smaller, single-responsibility hooks.**

This update completes a major architectural refactor of the application's core task state management, significantly improving its maintainability, readability, and testability.

#### Refactored
-   **Decomposed `useTaskState.ts`**: The monolithic `useTaskState.ts` hook, which previously contained all logic for task creation, updates, bulk actions, and ID management, has been broken down into a suite of smaller, single-responsibility custom hooks.
    -   **`useCoreTaskState.ts`**: Manages the fundamental state arrays (`tasks`, `completedTasks`) and the core ID generation logic (`getNextId`, `handleSyncIds`).
    -   **`useTaskManagement.ts`**: Encapsulates all handlers for managing *individual* tasks, such as `handleCompleteTask`, `removeTask`, `handleTaskUpdate`, and `handleCreateNewTask`.
    -   **`useBulkTaskActions.ts`**: Consolidates all handlers that operate on *multiple* tasks at once, including `handleBulkDelete`, `handleBulkSetCategory`, `handleBulkAdd`, and all CSV export functions.
-   **Orchestrator Pattern**: The main `useTaskState.ts` hook now acts as a clean "orchestrator." Its only job is to initialize these new hooks and combine their returned state and handlers into a single, comprehensive object for the rest of the application to consume.

#### Summary
This refactor was a critical step in managing the complexity of the application's core logic. By separating concerns into dedicated hooks, the codebase is now significantly more organized and easier to navigate. This modular architecture will make it much simpler to add new task-related features and fix bugs in the future, following the same successful pattern used in the `useChecklist` and `useReports` refactors.

---

## [1.0.31.01] - 2025-10-08: Reports View Refactor
**refactor(reports): Decompose monolithic `ReportsView` component into smaller components and a custom hook.**

This update completes a major architectural refactor of the `ReportsView` system, significantly improving its maintainability, readability, and performance, following the "Orchestrator" pattern.

#### Refactored
-   **Decomposed `ReportsView.tsx`**: The monolithic `ReportsView.tsx` component, which previously contained all reporting logic, has been broken down into a suite of smaller, single-responsibility modules.
    -   **`useReports.ts`**: A new custom hook was created to encapsulate all state management (`useState`), data processing (`useMemo`), and event handlers related to the reports feature.
    -   **Presentational Components**: The UI for each report tab has been extracted into its own "dumb" presentational component (e.g., `SummaryTab.tsx`, `FinancesTab.tsx`, `TaxesTab.tsx`) located in a new `src/components/reports/` directory.
-   **Orchestrator Pattern**: The main `ReportsView.tsx` component now acts as a clean "orchestrator." Its only job is to initialize the `useReports` hook and render the appropriate presentational components, passing down the necessary data and handlers as props.

#### Summary
This refactor was a critical step in managing the complexity of the reporting feature. By separating concerns into a dedicated hook and smaller UI components, the codebase is now significantly more organized and easier to navigate. This modular architecture will make it much simpler to add new reporting features and fix bugs in the future.

---

## [1.0.30] - 2025-10-08: Tax Reporting & Sidebar Management Overhaul
**feat(core): Overhaul tax reporting UI and sidebar component management.**

This update introduces a significant refactor to the Tax Reporting view for improved clarity and usability. It also enhances the sidebar's component structure and adds several quality-of-life features for financial management.

#### Features & UI Improvements:
-   **Tax Report Overhaul**:
    -   The main summary blocks in the yearly tax report (Total Income, Taxes Withheld, Deductible Expenses) are now collapsible accordions, allowing users to expand them to see a detailed breakdown.
    -   The "Final Net Calculations" section has been redesigned into a clear, stacked list for better readability.
    -   All monetary values in the summary are now accompanied by a one-click "copy" button.
    -   The report now correctly separates "Charitable Donations" from "Deductible Business Expenses" in all totals and text exports, preventing double-counting.
    -   **Report Item Navigation**: Clicking on a transaction or income item within the detailed tax report tables will now navigate directly to the associated task in the list view, expanding its accordion for quick review.
    -   **Text Export Actions**: Added "Copy Summary" and "Copy Full Text" buttons to the yearly tax report, allowing users to easily export a clean, text-based version of their financial data for external use.
-   **Sidebar Component Refactor**:
    -   Created a new `SidebarComponents.tsx` file to house smaller, reusable components that were previously defined within larger files.
    -   Moved `SimpleAccordion`, `LiveClock`, `TaskTypeManager`, `W2Manager`, `BusinessInfoManager`, `DepreciableAssetsManager`, `VehicleInformationManager`, `TaxCategoryManager`, and `AccountManager` into this new centralized file for better organization.
-   **Financial Management Enhancements**:
    -   **Deductible Percentage**: Added a "Deductible %" field to both Transaction sub-categories and Tax Categories, allowing for partial deductions (e.g., "Meals - 50%"). The tax report now automatically calculates and displays the correct deductible amounts based on these percentages.
    -   **Depreciable Assets**: Implemented a full `DepreciableAssetsManager` in the sidebar, allowing users to track assets, their cost, acquisition date, and business use percentage for tax purposes. The tax report now includes a dedicated section to display these assets.
    -   **Vehicle & Mileage**: Added a `VehicleInformationManager` to the sidebar for tracking business mileage and other vehicle-related expenses (parking, tolls, property tax, loan interest), which are now included in the tax report.
    -   **Automated Depreciation Calculation**: The `DepreciableAssetsManager` now automatically calculates the current year's depreciation deduction for each asset based on its category and the MACRS schedule. This value is displayed in the manager and used in the final tax report.
    -   **Business Information**: Added a `BusinessInfoManager` to the sidebar for tracking core business details (Name, EIN, Business Code) and year-specific financial data like `Returns and Allowances` and `Miscellaneous Income` for tax reporting.

#### UI/UX & Hotkeys:
-   **Sidebar View States**: The sidebar now supports three states: `visible` (default), `focused` (wide view for detailed management), and `hidden`.
-   **Sidebar Toggle Hotkey**: Added an `Alt+S` hotkey to cycle through the sidebar's three view states (`visible` -> `focused` -> `hidden`).
-   **MiniPlayer Toggle Hotkey**: Added an `Alt+T` hotkey to quickly show or hide the MiniPlayer/Work Session Manager.

#### Summary
This release delivers a more powerful and accurate tax reporting experience, with a cleaner UI and more granular control over deductions. The underlying code has been made more modular and maintainable through the strategic refactoring of sidebar components.

---

## [1.0.29] - 2025-10-06: Tax Workflow & Reporting Polish
**feat(taxes): Enhance tax workflow with new actions, filters, and reporting UI.**

This update introduces a series of quality-of-life improvements to the tax and transaction management workflows, making categorization faster and reporting clearer.

#### Features & UI Improvements:
-   **Centralized Auto-Tagging Actions**: The "Auto-Tag for Taxes" and "Auto-Tag Income" buttons have been added directly to the `Tax Category Manager` in the sidebar, allowing users to run categorization rules while managing keywords.
-   **Filter by Income Tag**: A new filter has been added to the "Transactions" view. When filtering by "Income," users can now further drill down by specific income tags (W-2, Business, Reimbursement) or find items that are still "Untagged."
-   **Streamlined Keyword Workflow**:
    -   A new "Copy Titles as Keywords" button has been added to the "Transactions" view header. This copies the titles of all visible transactions as a comma-separated list, perfect for pasting directly into a category's keyword field.
    -   A "Copy Title" option has been added to the right-click context menu on individual tasks for quick and easy text grabbing.
-   **Unified "Uncategorize All"**: An "Uncategorize All" button is now available for both Tax Categories and Income Types in the main list view and the sidebar manager, providing a consistent way to reset tags.
-   **Polished Tax Reports**:
    -   The yearly tax report has been redesigned with a single, unified header that provides a clean summary of total income, expenses, and the estimated net.
    -   The layout of tables within the tax report has been improved, ensuring the "Description" column properly expands to fill available space for better readability.
-   **Sidebar Refactor**: The `TaxCategoryManager` in the sidebar was refactored to be aware of the main list view's filters. The auto-tagging buttons now show accurate counts based on the currently visible tasks, making the feature more intuitive and context-aware.
-   **Architectural Refactor**: The sidebar's structure has been extracted from `AppLayout.tsx` into its own dedicated `Sidebar.tsx` component, improving code organization and modularity.

#### Summary
This update delivers a suite of targeted enhancements that make the process of tagging transactions, managing keywords, and reviewing financial reports a much more efficient and pleasant experience.

---

## [1.0.28] - 2025-10-05: Financial Tracking & Reporting
**feat(finances): Implement comprehensive financial tracking and reporting.**

This is a major feature release that introduces a full suite of tools for tracking income and expenses directly within tasks, along with a powerful new reporting dashboard to visualize financial data.

#### How to Use:
1.  **Add a Transaction**: When creating or editing a task, use the new "Transaction" field. Enter an amount and toggle between "Income" and "Expense". The amount will appear as a colored pill (green for income, red for expense) in the task header.
2.  **Bulk Import Transactions**: Use the "Bulk Add" feature to quickly import a list of transactions. Set a "Default Transaction Type" and then type or paste your list. The parser will automatically find monetary values (e.g., `Pay electric bill $75.50`, `Client payment +$500`).
3.  **View Reports**: Navigate to the "Reports" view and click the new "Finances" tab. Here you will find a complete dashboard with summary cards, an income vs. expense pie chart, a cash flow line chart, and a detailed, sortable table of every transaction.

#### Features:
-   **Core Transaction Tracking (Phase 1)**:
    -   Added a `transactionAmount` field to all tasks.
    -   The "Add New Task" form now includes a "Transaction" input with an "Income/Expense" toggle.
    -   Tasks with a transaction now display a color-coded currency pill in the list view for at-a-glance information.
-   **Bulk Transaction Import (Phase 2)**:
    -   The "Bulk Add" feature now includes a "Default Transaction Type" dropdown (`None`, `Income`, `Expense`).
    -   The parser is now "money-aware" and can automatically extract monetary values (e.g., `$50`, `-$10.25`, `+100`) from each line, assigning them as transactions and cleaning the task title.
-   **Financial Reporting Dashboard (Phase 3)**:
    -   Created a new "Finances" tab in the `ReportsView`.
    -   **Financial Summary**: Displays high-level cards for Total Income, Total Expenses, and Net Profit calculated from all tasks.
    -   **Income vs. Expense Chart**: A new pie chart provides a clear visual breakdown of income versus expenses.
    -   **Cash Flow Over Time**: A new line chart tracks daily income, expenses, and net cash flow, providing insight into financial trends.
    -   **Transaction Log**: A detailed, sortable table lists every individual transaction, including the associated task, date, category, and amount.

#### Features (Phase 4):
-   **Account Management**:
    -   Added a full `Account Manager` to the sidebar, allowing users to create, rename, and delete financial accounts (e.g., "Personal," "Business").
    -   Tasks with transactions can now be assigned to a specific account.
    -   The `Bulk Add` form now includes an option to assign all new transactions to a specific account.
-   **Advanced Transaction Filtering**:
    -   The main `List View` now includes powerful, context-aware filters when viewing the "Transactions" category.
    -   Users can filter transactions by **Year**, **Account**, and **Type** (Income/Expense).
-   **Transaction Auto-Categorization**:
    -   A new "Transaction Autocategorize Settings" panel has been added to the sidebar.
    -   Users can define comma-separated keywords for any sub-category under "Transactions" (e.g., "starbucks, dunkin" for a "Coffee" sub-category).
    -   A new UI appears in the `List View` when viewing uncategorized transactions, allowing users to auto-categorize all visible items with a single click.
    -   A new setting, "Auto-categorize on Bulk Add," automatically runs these rules on new transactions imported via the bulk add feature.

#### Fixed & UI/UX Improvements:
-   **Dynamic Filter Counts**: The filter counts in the "Finances" report now dynamically update based on the current selection, ensuring all numbers are accurate and context-aware.
-   **UI Flicker Fix**: Resolved a UI flicker that occurred when switching to the "Finances" tab by pre-selecting the "Transactions" category in a single state update.
-   **Streamlined Filter UI**:
    -   The redundant "Transactions" category tab in the "Finances" report has been replaced with a cleaner title.
    -   Sub-category filter buttons with a zero count are now hidden to reduce clutter.
    -   The "Filter by Type" buttons have been styled as distinct pills to differentiate them from other filter groups.
-   **Context-Aware Lifetime Summary**: The "Lifetime Summary" at the top of the reports view now intelligently displays a financial overview (Income, Expenses, Net) when on the "Finances" tab.
-   **TypeScript & Prop-Drilling Fixes**: Resolved numerous TypeScript errors related to missing props and incorrect type definitions that arose during the feature's development, ensuring component stability.

#### Summary
This update integrates powerful yet simple financial tracking directly into the task management workflow. From individual entries to bulk imports and a comprehensive reporting dashboard, users now have a complete toolset to monitor their financial activity alongside their productivity.

---

## [1.0.27] - 2025-10-04: Checklist Hook Refactor
**refactor(checklist): Decompose monolithic `useChecklist` hook into smaller, single-responsibility hooks.**

This update completes a major architectural refactor of the checklist system, significantly improving its maintainability, readability, and testability.

#### Refactored
-   **Decomposed `useChecklist.ts`**: The monolithic `useChecklist.ts` hook, which previously contained all checklist-related logic, has been broken down into a suite of smaller, single-responsibility custom hooks.
    -   **`useChecklistState.ts`**: Manages all core state variables for the checklist, including history, editing states, and confirmation dialogs.
    -   **`useChecklistItemManagement.ts`**: Handles all item-level CRUD (Create, Read, Update, Delete) operations and property updates (e.g., `handleUpdateItemText`, `handleDeleteItem`).
    -   **`useChecklistSectionManagement.ts`**: Manages all section-level actions, such as adding, deleting, duplicating, and toggling section properties (notes, responses, collapse state).
    -   **`useChecklistHierarchy.ts`**: Contains all logic related to the structural organization of the checklist, including item nesting (indent/outdent), reordering (move up/down), and promoting items to section headers.
    -   **`useChecklistBlockManagement.ts`**: Manages all interactions with `RichTextBlock`s, including their creation, deletion, and association with checklist sections.
    -   **`useChecklistTimer.ts`**: Encapsulates all logic for sending checklist items or sections to the Work Timer.
    -   **`useChecklistHistory.ts`**: Manages the undo/redo history stack for all checklist actions.
    -   **`useChecklistGlobalActions.ts`**: Contains handlers for global checklist commands that affect the entire checklist, such as bulk adding, template management, and clearing all highlights.
    -   **`useChecklistIPC.ts`**: Consolidates all Inter-Process Communication (IPC) listeners, acting as the single entry point for commands coming from native context menus.
-   **Orchestrator Pattern**: The main `useChecklist.ts` hook now acts as a clean "orchestrator." Its only job is to initialize these new hooks and wire them together, passing state and handlers between them as needed.

#### Summary
This refactor was a critical step in managing the complexity of the checklist feature. By separating concerns into dedicated hooks, the codebase is now significantly more organized and easier to navigate. This modular architecture will make it much simpler to add new features and fix bugs in the checklist system in the future.

---

## [1.0.26] - 2025-10-04: Advanced Checklist Structuring & Organization
**feat(checklist): Implement content blocks, hierarchical sorting, nesting, bulk actions, and named hyperlinks.**

This is a major feature release that transforms the checklist from a simple to-do list into a powerful, hierarchical outlining tool with advanced sorting and formatting capabilities.

#### Features:
-   **Content Blocks**: Users can now add rich text "Content Blocks" above checklist sections to serve as titles, descriptions, or introductions.
    -   **Visual Grouping**: The UI now visually groups a content block and any checklist sections immediately following it into a single container with a border.
    -   **In-Place Editing**: Content blocks can be edited directly in the task view without switching to the main "Edit" tab.
    -   **Group Actions**: A new hover menu on content blocks allows for moving the entire group (content block + sections) up/down, copying the group's content (formatted or raw), and deleting the group.
    -   **Section Association**: A new context menu action allows standalone checklist sections to be moved and associated with an existing content block.
    -   **Section Detachment**: A corresponding "Detach" action allows a section to be broken out from a group into its own new block.
-   **In-Place Editing for Task Details**: The `Description`, `Notes`, and `Responses` fields in the main "Task" view now display as clean, rendered content. Users can double-click or use a new edit icon to instantly switch to an in-place editor for quick modifications without needing to navigate to the main "Edit" tab.
-   **Hierarchical Nesting**: Implemented the core functionality for indenting and outdenting checklist items. This includes updating the data structure with `level` and `parentId` properties, adding UI buttons, and enabling keyboard shortcuts (`Tab`/`Shift+Tab`).
-   **Promote Item to Section**: Added a "Promote to Section Header" context menu action. This powerful feature converts a checklist item into a new section, automatically moving all of its sub-items into the new section with their indentation levels correctly adjusted.
-   **Bulk Indent/Outdent**:
    -   Users can now check multiple items and use the new "Indent Checked" and "Outdent Checked" buttons in the main checklist header to modify them all at once.
    -   The `Tab` and `Shift+Tab` keyboard shortcuts are now context-aware. If any items are checked, the shortcut will perform a bulk action on the checked items; otherwise, it will act only on the focused item.
-   **Hierarchical Sorting**: A new sort dropdown has been added to the main checklist header, allowing users to sort items within each section.
    -   **Sort Options**: Default (manual), Alphabetical, By Highlight, and By Status.
    -   **Hierarchy-Preserving**: The sorting logic is hierarchy-aware. It sorts items at the same nesting level under their respective parents, ensuring that the nested structure of sub-tasks is always maintained.
-   **Named Hyperlinks**: Checklist items, notes, and responses now support a `Name: url` format. For example, typing `Google: https://google.com` will automatically render a clean, clickable link that just says "Google". The old behavior of automatically linking raw URLs is still supported.

#### Fixes & UX Improvements:
-   **Sibling Indentation**: Fixed a bug where bulk-indenting multiple items would incorrectly create a nested chain. The logic now correctly indents all selected items as siblings under the same parent.
-   **Selection Persistence**: Fixed a UX issue where performing a bulk action would uncheck the selected items. The items now remain checked, allowing for multiple consecutive bulk actions without re-selection.
-   **Bulk Add Enhancement**: The "Bulk Add" feature now supports parsing and creating `RichTextBlock`s, allowing for seamless copy/paste of entire structured checklists between tasks.

#### Summary
This update transforms both tasks and checklists into powerful outlining tools. Checklists gain rich text introductions and advanced organization, while core task fields (`Description`, `Notes`) now support a streamlined in-place editing workflow, improving readability and speeding up quick edits.

---

## [1.0.25] - 2025-10-03: Inbox Expansion & Auto-Save Logic
**feat(core): Complete Inbox expansion and fix auto-save logic.**

This update finalizes the "Inbox Expansion" feature set by adding comprehensive display and sorting options. It also includes a critical fix to the auto-save logic to prevent unnecessary file writes.

#### Features & UI Improvements:
-   **Inbox Display Filters**:
    -   A new "Inbox & Notifications" accordion has been added to the sidebar settings.
    -   This panel contains checkboxes for all message types ('Task Created', 'Task Completed', 'Task Updated', 'Task Deleted', 'Task Overdue', and 'Deadline Warnings'), giving users full control over what appears in their Inbox.
    -   This filtering is non-destructive; messages are always logged but only displayed based on user preference.
-   **Inbox Sorting Overhaul**:
    -   The sorting dropdown (`Date`, `Message Type`) now correctly applies to all tabs in the Inbox, including "Archived" and "Trash".
    -   Added a new "Important First" sort option to bring starred messages to the top of the list.
-   **Improved Auto-Save Logic**:
    -   The auto-save timer will now only start its countdown when there are actual unsaved changes (`isDirty` is true).
    -   The "Autosaving in..." UI text is now correctly hidden when the project is saved, providing a clearer status indication.
-   **UI Stability**: Replaced all native `window.confirm()` dialogs in the Inbox view with the application's standard, non-blocking two-click confirmation pattern, preventing potential UI freezes.
-   **UI/UX Refinements**:
    -   The redundant "Shortcuts: Ctrl+B..." text that appeared under every rich text editor has been removed. It is now displayed just once at the bottom of the task view for a cleaner interface.

#### Summary
This release gives users full control over their Inbox, with powerful sorting and filtering capabilities. The refined auto-save logic makes the application more efficient and the UI more intuitive.

---
## [1.0.24] - 2025-10-03: Data Export & Advanced Notification Controls
**feat(core): Implement comprehensive data export and advanced notification management.**

This is a major feature update that rolls up two key areas of development: a powerful new data export system and a complete overhaul of the overdue notification controls.

#### Features & UI Improvements:
-   **Advanced Data Export ("Copy to Sheets")**:
    -   **Bulk Export**: The `BulkActionBar` now includes a "Copy to Sheet" button (`fa-file-excel`) to copy selected tasks as TSV and a "Download as CSV" button (`fa-file-csv`) for file downloads.
    -   **Single Task Export**: A "Copy as Row" option has been added to the individual task context menu.
    -   **Comprehensive Data Columns**: The export is highly detailed, including:
        -   Basic Info (ID, Name, URL, Priority, Dates)
        -   Categorization (Parent and Sub-Category)
        -   Financials (Time Tracked, Pay Rate, Earnings)
        -   Details (Company, Website, Image Links, Attachments)
        -   Automation (All recurring and autocomplete flags as TRUE/FALSE)
        -   Linked Tasks (Successor ID, Name, and Offset)
        -   Full Content (Description, Notes, Responses, Checklist Content, and Time Log Sessions)
-   **Advanced Notification Controls**:
-   **Long Snooze Option**: Added a "Snooze 1hr" option to individual overdue toasts and a corresponding "Snooze All 1hr" button to the summary actions. This is now also a configurable default in the Time Management settings.
-   **Icon-Based Actions**: Replaced all text-based buttons in the overdue notification toasts with a cleaner, icon-based design, using tooltips to maintain clarity. The order of the bulk action icons now matches the order on individual toasts.
-   **Dismiss & Reveal Silenced**:
    -   Added a "Dismiss" action (`fa-eye-slash`) to individual toasts, which silences the alert for the current session without completing the task.
    -   A new "Dismissed: X" button appears in the summary area, which can be clicked to reveal a list of all silenced tasks.
    -   Users can "Un-silence" a task from this list to make its overdue alert reappear.
-   **Reveal Snoozed**:
    -   A "Snoozed: X" button now appears in the summary area, allowing users to see a list of all currently snoozed tasks and their remaining snooze time.
    -   Users can "Un-snooze" a task individually or "Un-snooze All" tasks at once to bring their alerts back immediately.
-   **Bulk Skip & Dismiss**: Added "Skip All" and "Dismiss All" icon buttons to the summary actions for more efficient bulk management of overdue tasks.
-   **UI/UX Fixes**:
    -   The "Overdue" summary bar now remains visible even when all alerts are snoozed or dismissed, ensuring the "Reveal" buttons are always accessible.
    -   The main "Overdue" counter now accurately reflects the total number of overdue tasks, including those that are actively showing, snoozed, or dismissed.

#### Summary
This update provides a robust bridge between Overwhelmed and other data analysis tools with a comprehensive export system. It also delivers a complete set of tools for managing notifications, giving users full visibility and control over tasks that have been temporarily snoozed or dismissed.

---
### [1.0.23] - 2025-10-03: Bulk Task Management
**feat(tasks): Implement bulk task actions and enhanced bulk add.**

This update introduces a powerful set of features for managing multiple tasks at once, significantly improving workflow efficiency.

#### Features & UI Improvements:
-   **Bulk Task Selection**:
    -   Added checkboxes to every task in both the active and completed lists.
    -   Implemented "Select All" checkboxes in the headers for both the active and completed task lists, with support for an "indeterminate" state.
-   **Bulk Action Bar**:
    -   A new `BulkActionBar` appears at the top of the screen whenever one or more tasks are selected.
    -   **Change Category**: A clean, single-level dropdown allows for moving all selected tasks to a new category.
    -   **Set Due Date**: A pop-up date/time picker allows for setting a new due date for all selected tasks.
    -   **Change Priority**: A dropdown allows for setting the priority (High, Medium, Low) for all selected tasks.
    -   **Complete/Reopen Selected**: The action bar intelligently shows a "Complete Selected" button for active tasks and a "Reopen Selected" button for completed tasks.
    -   **Delete Selected**: A two-click confirmation button allows for safe bulk deletion of any selected tasks.
-   **Enhanced Bulk Add**:
    -   The "Bulk Add" accordion in the sidebar now includes options to set a **Category**, **Priority**, and **Due Date** for all tasks being created.
    -   The "Use Current View" option for categories is now smarter, correctly defaulting to the active sub-category if one is selected.

#### Fixed
-   **UI/UX Refinements**:
    -   Fixed multiple UI bugs related to the `BulkActionBar`, including positioning, dropdown menu behavior, and styling to ensure a smooth and intuitive user experience.
    -   Resolved several "Rules of Hooks" errors that occurred when conditionally rendering components with hooks, ensuring component stability.

#### Summary
This update delivers a comprehensive suite of bulk editing tools, empowering users to select and modify multiple tasks with just a few clicks. The enhanced "Bulk Add" feature further streamlines the process of creating structured tasks.

---
### [1.0.22] - 2025-10-03: Workflow Features & UI Overhaul
**feat(core): Enhance task workflows, stabilize editor, and overhaul UI.**

This update rolls up a significant number of features and bug fixes, focusing on stabilizing the rich text editor and implementing a series of UI/UX improvements for a more polished and intuitive experience.

#### Features & UI Improvements:
-   **Rich Text Editor Stabilization**: To resolve numerous conflicts with native browser behavior, the editor has been simplified.
    -   Conflicting custom shortcuts for lists (`Ctrl+L`) and headers (`Alt+1-6`) have been removed. The editor now reliably supports basic browser formatting (`Ctrl+B/I/U`).
    -   A custom undo/redo history (`Ctrl+Z/Y`) has been implemented that correctly tracks our custom paste-to-link actions.
-   **Linked Task Offset**: Added an "Offset" input field to linked tasks, allowing a delay to be set for when the successor task becomes due.
-   **Task Navigation**: Implemented "Goto Next/Previous Task" actions in the task context menu and MiniPlayer for easier navigation through the task list.
-   **Skipped Task Status**: Added a "Skip" action for tasks. Skipped tasks are moved to the "Completed" list but are visually distinct, allowing re-occurring tasks to advance without being marked as successfully completed.
-   **Re-occurring Task Display**: The task header now clearly displays the next scheduled date and time for any re-occurring task, making it easy to forecast and verify recurrence settings.
-   **Cleaner Task Headers**: The task accordion header has been streamlined by:
    -   Removing the redundant Task ID.
    -   Removing the text label for "Priority," relying on the colored dot and a new tooltip.
    -   Replacing the "Time Open" display with a clearer "Due Date" and "Due Time" pill.
-   **Conditional Task Fields**: The "Image Links," "Attachments," and "Pay Rate"/"Task Cost" fields in the read-only task view are now hidden if they are empty, reducing clutter.
-   **Improved Link Styling**: Links in the rich text editor no longer use the default browser blue and are now styled to match the application's theme.

#### Fixed
-   **Pasting Bugs**: Resolved a series of critical bugs related to pasting plain text and links. The cursor now correctly remains at the end of the pasted content, and multi-line text is inserted with proper line breaks.
-   **Re-occurring Task Logic**: Fixed a bug where the `openDate` for re-occurring tasks was not being calculated correctly, ensuring that the start time is preserved for scheduled tasks.
-   **Sort by Due Date**: Fixed a critical timezone-related bug that caused tasks due "today" to sometimes appear under the "Tomorrow" heading.
-   **Pay Rate Display**: Fixed a UI bug where a "0" would appear without context if a task's pay rate was set to zero.

#### Summary
This update stabilizes the rich text editor and delivers a wide range of UI/UX enhancements, resulting in a significantly more polished, predictable, and usable application.

---

### [1.0.21] - 2025-09-28: Codebase Cleanup & Bug Fixes
**refactor(core): Standardize naming conventions (Word->Task) and fix data loading**

This commit completes a major codebase cleanup initiative, standardizing legacy naming conventions and fixing a critical data loading bug.

#### Refactored
-   **`Checklist.tsx` Component**: The monolithic `Checklist.tsx` component was refactored into a clean "Orchestrator" component. All state management and logic were extracted into a dedicated `useChecklist` custom hook, and all UI rendering was moved into smaller, single-responsibility presentational components (`ChecklistHeader`, `ChecklistSection`, `ChecklistItemComponent`). This dramatically improves maintainability and readability.
-   **`Word` -> `Task`**: Completed a global refactor to rename the core data object from the legacy `Word` to the more accurate `Task`. This includes all related type definitions, state variables (`words` -> `tasks`), and handler functions (`handleWordUpdate` -> `handleTaskUpdate`) across the entire application. This significantly improves code clarity and maintainability.
-   **`copyStatus` -> `toastMessage`**: Refactored the global `copyStatus` state to the more descriptive `toastMessage`. This accurately reflects its role as the application's central toast notification system.

#### Fixed
-   **Critical Data Loading Bug**: Fixed a critical bug where users' existing tasks would not load after the `Word` -> `Task` refactor. The data persistence logic in `useDataPersistence.ts` now implements a "smart loading" fallback, first checking for the new `overwhelmed-tasks` key and then checking for the old `overwhelmed-words` key. This ensures a seamless, non-destructive migration for all existing users.

#### Summary
This update finalizes the transition to a more modern and intuitive codebase. By refactoring the checklist system, standardizing naming conventions, and ensuring backward compatibility for data loading, the application is now more robust and easier for future development.

---

### [1.0.20] - 2025-10-2: MiniPlayer V2: Work Session Manager
**feat(player): Implement Work Session Manager and MiniPlayer V2**

This commit evolves the `MiniPlayer` from a simple timer display into an interactive "Work Session Manager," allowing users to queue up tasks and navigate between them seamlessly.

#### Features:
-   **MiniPlayer UI Overhaul**: Redesigned the MiniPlayer for a more structured layout, clearly displaying the task title, current log entry, and timer.
-   **Work Session Manager**: Created a new modal, accessible via a playlist icon, to manage the work session queue.
-   **Work Session State**: Implemented the `workSessionQueue` state to manage the list of task IDs in the current session.
-   **Add to Session**: Added an "Add to Work Session" option to the task context menu.
-   **In-Modal Task Search**: The Work Session Manager now includes a search bar to find and add any open task to the queue.
-   **Player Navigation**: Added "Next" and "Previous" task buttons to the MiniPlayer to navigate through the work session queue.
-   **Autoplay Next Task**: Implemented a new "Autoplay Next in Session" setting. When enabled, completing a task in the session automatically starts the next one.
-   **Bulk Add Checklist Sections/Items**: Added functionality to bulk add multiple checklist sections and items by parsing text with `### Title` for sections.
-   **Save Checklist as Template**: Users can now save the current checklist as a reusable template.
-   **Load Checklist from Template**: Implemented an "Add from Template" option to quickly load saved checklist templates into a task.
-   **Manage Checklist Templates**: Added a modal to manage saved templates, allowing users to rename and delete them.
-   **Rename Template Item**: Functionality to rename individual checklist templates.
-   **Search Stock Photos**: Added a "Search Stock Photos" option to the context menu for any selected text.
-   **Delete Template Item**: Functionality to delete individual checklist templates.
-   **Rich Text Editor Paste Fix**: Fixed a bug where pasting content would incorrectly move the cursor to the beginning of the editor. The cursor now correctly remains at the end of the pasted content.
-   **Enhanced Link Context Menu**: The context menu for hyperlinks now provides dynamic options to open the link in the currently active browser, the system's default browser, or any other user-configured browser.
-   **State Merging Fix**: Resolved a critical bug where updating a single setting (e.g., expanding a checklist section) would wipe out the entire settings object due to incorrect state update patterns. All settings updates now correctly merge changes, preserving data integrity.
-   **Refactored `index.css`**:  Split each components style into its own stylesheet.

#### Summary:
This update transforms the MiniPlayer into a powerful tool for focused work. Users can now build a playlist of tasks, navigate between them with dedicated controls, and automate their workflow with the new autoplay feature, creating a true "work session" experience.

---

### [1.0.17] - 2025-09-25: Time Tracker Log & Checklist Integration
**feat(time): Implement detailed time tracker log and checklist integration**

This commit introduces a complete overhaul of the task timer, evolving it from a simple stopwatch into a detailed `TimeTrackerLog`. It also deeply integrates this new system with the `Checklist`, creating a seamless workflow for time tracking.

#### Time Tracker Log Features:
-   **Entry-Based System**: The timer is now a log of individual entries, each with its own description and duration.
-   **Full CRUD & Timer Functionality**:
    -   Users can add, edit, and delete log entries.
    -   Each entry has its own start/pause button, with a live-updating timer. Only one entry can be running at a time.
    -   The total time for the task is now the sum of all log entries and updates in real-time.
-   **Advanced UX**:
    -   **Reordering**: Entries can be moved up and down in the log.
    -   **Bulk Add**: A `textarea` allows for pasting multiple lines to create several entries at once.
    -   **Context Menus**: A right-click menu on the header provides actions like "Copy Total Time" and "Delete All". A menu on each item provides "Duplicate," "Edit," "Delete," and reordering actions.
-   **Data Migration**: A one-time migration automatically converts any time tracked with the old stopwatch into the first entry in the new log system, ensuring no data is lost.

#### Checklist Integration Features:
-   **Send Individual Items to Timer**:
    -   A new "Add to Timer" button (`+`) and "Add to Timer & Start" button (`▶`) have been added to the quick-actions menu for each checklist item.
    -   The same options are available in the checklist item's right-click context menu.
-   **Send Sections to Timer**:
    -   A new "Send All to Timer" button (`✓`) has been added to each section header and its context menu, which adds all active items from that section to the log.
-   **Send All Items to Timer**:
    -   A "Send All Items to Timer" button (`⏱️`) and a "Send All & Start" button (`▶`) have been added to the main checklist header and its context menu, allowing for one-click population of the time log from the entire checklist.

#### Summary
This is a major feature release that transforms time tracking in the application from a basic utility into a core, detailed, and highly usable feature. The deep integration with the checklist system creates a powerful and efficient workflow for users to track their work against specific to-do items.

---

### [1.0.16] - 2025-09-24: Checklist Main Header Context Menu & Command Refactor

#### Added
-   **Main Header Context Menu**: Implemented a new right-click context menu on the main "Checklist" header. This menu provides global actions such as "Expand/Collapse All Sections," "Add/Delete All Notes/Responses," "Copy All Sections," and "Delete All Sections."

#### Changed
-   **Command Handling Refactor**:
    -   Created a new, dedicated command handler (`handleMainHeaderCommand`) in the `Checklist` component to correctly process actions from the new main header menu.
    -   The "View Task" and "Edit Task" options in the new menu now correctly switch the task's view mode.
-   **Toast Notifications**: The `setCopyStatus` function has been refactored into a more robust `showToast` utility function with a default duration, cleaning up code and improving consistency.

#### Fixed
-   **Context Menu State Bug**: Fixed a critical bug where "View Task" and "Edit Task" commands from the new main header menu were not working. The new handler now correctly routes these commands to update the parent `App` component's state.
-   **Prop Drilling Error**: Resolved a `Cannot find name 'setSettings'` error by refactoring the command handler to use the `onSettingsChange` prop, following the correct pattern for child-to-parent state updates.
-   **IPC & Type Safety**: Fixed a TypeScript error by ensuring the payload sent to `showChecklistMainHeaderContextMenu` correctly matched its interface definition.

#### Summary
This commit adds a powerful global context menu to the main checklist header and refactors the underlying command handling system to be more robust and correct. It resolves a key bug preventing view-switching from the new menu and improves the overall state management architecture.

---

### [1.0.15] - 2025-09-24: Checklist Usability & Collapsible Sections

#### Added
-   **Collapsible Sections**:
    -   Implemented expand/collapse functionality for individual checklist sections via a new arrow icon in the section header.
    -   Added "Expand All Sections" and "Collapse All Sections" buttons and context menu actions to the main checklist header for global control.
-   **In-Line Section Title Editing**: Checklist section titles can now be edited directly in both "Task" and "Edit" views by double-clicking the title text.
-   **Enhanced Copy/Paste**: Added "Copy Section Raw" and "Copy All Sections Raw" options to the UI and context menus to copy checklist content as plain text without any formatting or checkboxes.
-   **Bulk Note Creation**: Added "Add Note to All Items" (global) and "Add Note to All Items in Section" (per-section) to the UI and context menus.

#### Changed
-   **Context Menu Overhaul**: Refactored the context menu actions for adding/editing notes and responses to use the same non-blocking, in-place editing UI as the quick-action buttons, removing the reliance on disruptive native `prompt()` dialogs.
-   **UI/UX Polish**:
    -   Refactored the main checklist header and section header buttons for a more uniform and consistent appearance.
    -   Added "Hide/Show Notes" and "Hide/Show Responses" toggles to section context menus and as global buttons in the main checklist header.
    -   When adding a new section, the "New Section" placeholder text is now automatically selected for immediate renaming.
-   **Context Menu State**: The "View Task" / "Edit Task" option in context menus now correctly toggles based on the current view mode.

#### Fixed
-   **Native Prompt Issues**: Began the process of replacing native, blocking `window.prompt()` and `window.confirm()` dialogs with custom, non-blocking UI elements to prevent UI freezes and improve user experience. The "Add/Edit Note/Response" context menu actions are the first to be fully refactored.

#### Documentation
-   **Developer Guides**: Added `Rule 60.0` (Synchronizing Checklist State) and `Rule 61.0` (Avoiding Native Modals) to `GEMINI.md`.
-   **Project Glossary**: Updated `DEFINITIONS.md` with new handlers and state related to collapsible sections and improved context menus.

#### Summary
This commit introduces major usability enhancements to the checklist system, including collapsible sections, in-line editing for section titles, and a move away from disruptive native prompts for context menu actions, creating a smoother and more intuitive workflow.

---

### [1.0.14] - 2025-09-23: Interactive Checklists & Link Handling

#### Added
-   **Interactive Items**: Implemented full in-place editing for checklist items, notes, and responses. Added a hover-activated quick-action menu for editing, deleting, and adding notes/responses.
-   **Clickable Links**: URLs in the text of a checklist item, note, or response are now automatically rendered as clickable `<a>` links in the "Task" view.
-   **Link Context Menus**: Right-clicking an item, note, or response containing a URL now shows "Open Link" and "Copy Link" options.
-   **Checklist Item Highlighting**: Added a "Highlight" submenu to the item context menu to apply a colored border, with a "Clear All Highlights" action in the section menu.
-   **Dedicated Context Menus**: Added focused context menus for notes and responses, including "Edit" actions for quick modifications from the "Task" view.

#### Fixed
-   **Checklist Item "Move Down"**: Fixed a critical bug where using the "Move Down" action would cause a crash due to a missing `break;` statement.
-   **Checklist Item Edit Button**: Fixed a bug where the "Edit Item" quick-action button would incorrectly clear the item's text field.
-   **Context Menu State**: Fixed multiple bugs where "Copy Note" and "Copy Response" options were incorrectly enabled in context menus even when the fields were empty.
-   **Checklist Due Date Picker**: Fixed a timezone-related bug where selecting a date would sometimes save it as the previous day.
-   **Footer Component Performance**: Fixed a performance issue where the `Footer` component was re-rendering on every state change by moving its definition outside the main `App` component.
-   **TypeScript Errors**: Resolved various TypeScript errors related to prop drilling and mismatched type definitions during feature implementation.

#### Documentation
-   **Developer Guides**: Added new rules to `GEMINI.md` for Prop Drilling (`58.0`) and Switch Statement Fall-Through (`59.0`).
-   **Project Glossary**: Updated `DEFINITIONS.md` to include all new context menu commands and helper functions related to the new features.



---

### [1.0.13] - 2025-09-23: Interactive Checklist Items

#### Added
-   **In-Place Editing in "Edit" Mode**: When a task is in "Edit" mode, all checklist items, including their notes and responses, are now rendered as editable `<input>` fields by default.
-   **Quick Actions on Hover**: In the read-only "Task" view, hovering over a checklist item now reveals a set of quick-action icon buttons:
    -   **Edit Item**: A pencil icon that allows for in-place editing of the main item text.
    -   **Add/Remove Note**: A note icon that adds a note field. The icon becomes "active" (colored) to indicate it can be clicked again to remove the note.
    -   **Add/Remove Response**: A reply icon that functions identically to the note button for responses.
    -   **Delete Item**: A trash icon to delete the entire checklist item.

#### Fixed
-   **Autofocus Consistency**: When a note or response field is created in either "Task" or "Edit" view, it is now automatically focused so the user can begin typing immediately.
-   **UI Stability**: The layout has been refactored to prevent the "quick actions" menu from shifting or disappearing when a note or response is added, creating a stable and non-frustrating user experience.

#### Documentation
-   **Developer Guide**: Added `Rule 55.0` to `GEMINI.md` to document the pattern for creating stable hover-action menus.
-   **Project Glossary**: Updated `DEFINITIONS.md` with all new state variables (`editingResponseForItemId`, `focusSubInputKey`, etc.) and handlers (`handleDeleteItem`, `handleDeleteItemResponse`, etc.) related to these new features.

#### Known Issues
-   **Checklist Item Autofocus**: The context menu actions "Add Item Before" and "Add Item After" do not automatically focus the newly created item for immediate editing. While the new UI makes editing easy, this specific autofocus-on-create feature remains an unresolved technical challenge.

#### Summary
These changes transform the checklist from a static list into a fully interactive and dynamic component. Users can now manage all aspects of a checklist item—text, notes, and responses—directly from the list view with intuitive hover actions, significantly improving workflow speed and usability.

---

### [1.0.12] - 2025-09-23: Checklist Enhancements

#### Added
-   **Individual Due Dates**: Implemented a feature to add an optional due date to each individual checklist item.
    -   **Date Picker UI**: Added a date picker input next to each checklist item in the "Edit" view for easy date selection.
    -   **Due Date Display**: Due dates are now displayed cleanly next to the checklist item text in the "Task" view, with visual cues for urgency (red for overdue, yellow for due today).
-   **Bulk Deletion**: Added a "Delete Checked" button to both individual section headers and the main checklist header, allowing for bulk deletion of completed items either per-section or globally.
-   **Item Duplication**: Added a dedicated "Duplicate Item" option to the checklist item's context menu for clarity and ease of use.

#### Fixed
-   **Checklist Duplication Bug**: Resolved a critical bug where duplicating a checklist section or a single checklist item would result in the new items sharing the same unique ID as the originals. This caused issues where adding a note or response to a duplicated item would incorrectly apply it to the original item as well. The duplication logic now performs a "deep copy," ensuring all new items receive their own unique IDs.
-   **In-Place Checklist Item Editing**: Fixed a bug where the "Edit Item" context menu action would not work from the read-only "Task" view. Now, selecting "Edit Item" from the context menu will correctly switch just that single item into an editable text field, even while the rest of the task remains in view mode.

#### Changed
-   **Improved Layout & Interaction**:
    -   **Full-Width Items**: The entire row for a checklist item is now a full-width, clickable area, providing a larger target for interaction.
    -   **Enhanced Editing Experience**: The text input field for editing a checklist item is now significantly larger, expanding to the full width of the item with increased padding and font size for better readability.

#### Known Issues
-   **Context Menu Quick Actions**: The "Set Due Date" submenu in the checklist item's context menu (with actions like "Today", "Tomorrow") is currently non-functional due to an error and has been disabled pending a future fix.

---

### [1.0.11] - 2025-09-23: Checklist UI/UX and Context Menu Polish

#### Changed
-   **Checklist Item Click Behavior**: Fixed a bug where clicking on a checklist item's note or response would incorrectly toggle the item's completion status. The note and response are now outside the main label.
-   **Checklist Item Hover Effect**: The entire area for a checklist item (including its text, note, and response) now has a subtle background hover effect, making it clear that the entire block is interactive.
-   **Checklist Item Context Menu**: The right-click context menu can now be triggered from anywhere on the checklist item (text, note, or response area), not just the item text, creating a more intuitive user experience.

#### Added
-   **Delete Note/Response**: Added "Delete Note" and "Delete Response" options to the checklist item context menu. These options are dynamically enabled only if a note or response exists.

#### Fixed
-   **Context Menu Flickering**: Resolved a bug where right-clicking a checklist item would cause the UI to flicker. This was due to an event propagation conflict between the item's context menu and the parent section's context menu, which was fixed by adding `event.stopPropagation()`.

#### Documentation
-   **Event Propagation Guide**: Added a new developer guide (`Rule 53.0`) to `GEMINI.md` explaining the concept of event bubbling and the use of `event.stopPropagation()` to prevent it.
-   **Project Glossary**: Updated `DEFINITIONS.md` with an entry for "Event Propagation (Bubbling)" that links to the new developer guide.

---

### [1.0.10] - 2025-09-22: Alternating Tasks
#### Added
-   **Alternating Tasks**: Implemented a system to link tasks together. A new "Starts Task on Complete" dropdown in the "Edit Task" view allows a user to select a successor task. When the predecessor is completed, the successor task is automatically activated.
-   **Task Loops**: The system now visually detects and indicates when two tasks are linked to each other, forming a loop. A spinning `fa-sync-alt` icon is displayed instead of the standard link icon.
-   **Loop Persistence**: When a re-occurring task in a two-task loop is completed, the logic now correctly updates the successor task to point to the *newly created* re-occurring task, ensuring the loop is not broken.
-   **Debug IDs**: Added the unique Task ID to the accordion header and "Edit" view to make debugging task relationships easier.

---

### [1.0.9] - 2025-09-22: Copy Checklist

#### Added
-   **Copy Checklist**: Implemented a feature to copy checklist data to the clipboard as formatted plain text.
    -   Added "Copy Section" and "Copy All Sections" buttons to the UI and the section header context menu.
    -   Created a `formatChecklistForCopy` helper function that formats the checklist according to `Rule 51.0`, including completion status (`[✔]`/`[✗]`) and public `response` fields, while excluding private `note` fields.
    -   The copied section title now includes the completion count (e.g., "Section Title (2/5)").

#### Changed
-   The checklist section header in the UI now displays the completion count (e.g., "Section Title (2/5)").

---

### [1.0.8] - 2025-09-22: Checklist Responses & Notes

#### Added
-   **Checklist Responses & Notes**: Added the ability to add a "Response" and a private "Note" to each individual checklist item.
    -   These fields are accessible via a right-click context menu on the checklist item.
    -   A custom `PromptModal` is used for a consistent UI when adding or editing the text.
    -   The "Response" and "Note" are displayed cleanly below the checklist item, each with a unique icon and color for easy identification.
    -   Added a "Copy Response" option to the context menu for convenience.


---

### [1.0.7] - 2025-09-21: UI Polish & Category Color-Coding

#### Added
-   **Category Color-Coding**:
    -   Added a color picker to the "Category Manager" for each category and sub-category.
    -   Category pills in the task list and category filter tabs in the header now display their assigned custom color.
    -   Pill text color (black or white) is now automatically calculated for optimal contrast against the custom background color.
    -   Added a "Reset Color" button to the Category Manager.

#### Changed
-   **Accordion Header UI Cleanup**: Refactored the task accordion header into a cleaner, more organized layout.
    -   Created a dedicated `TaskAccordionHeader` component to improve code modularity.
    -   Moved Category and Priority information to the main title line for a more compact view.
-   **Action Button UI Cleanup**: The action buttons for each task have been redesigned for a more uniform look. Recurring task options (Daily, Weekly, etc.) are now consolidated into a space-saving dropdown menu.

### [1.0.6] - 2025-09-21: Grouped Task View by Day

#### Added
-   **Grouped Task View by Day**: When sorting the list view by "Due Date (Soonest First)", tasks are now grouped under headers for each day.
    -   **Relative Date Headers**: Headers use relative terms like "Today" and "Tomorrow" for clarity. The full date and year are shown for other dates.
    -   **Task Count**: Each date header displays a count of the tasks due on that day (e.g., "Today (3 tasks)").
    -   **"No Due Date" Group**: Tasks without a due date are now grouped at the top for high visibility, with a distinct style to differentiate them.
-   **UI Polish**: Added custom styling for the new date headers to improve readability and visual organization.


### [1.0.5] - 2025-09-21: Task Types & Templated Forms

#### Added
-   **Task Types**: Implemented a "Task Types" system to create templated forms. Users can now define different types of tasks (e.g., "Billing", "Research") and specify which form fields are visible for each type.
-   **Task Type Manager**: Added a new manager to the sidebar, allowing users to create, rename, delete, and configure fields for each task type.
-   **Dynamic "Add Task" Form**: The "Add New Task" form now dynamically shows or hides fields based on the selected "Task Type," streamlining the task creation process.

### [1.0.4] - 2025-09-21: Inbox Archive & Trash + Documentation Workflow

#### Added
-   **Inbox Archive**: Implemented an "Archive" feature in the Inbox. Users can now move messages from the "Active" view to a separate, persistent "Archived" tab.
-   **Inbox Trash**: Implemented a full "Trash" system for the Inbox. Dismissed messages are now moved to a "Trash" tab instead of being permanently deleted, providing a safety net. The Trash view includes options to restore individual messages, restore all, or permanently empty the trash.

#### Updated
-   **Project Glossary**: Created a new `DEFINITIONS.md` file to serve as a central glossary for project-specific functions and state variables. Added a new guideline to `GEMINI.md` to ensure this file is kept up-to-date.
-   **Developer Documentation**: Added a new guide to `GEMINI.md` (Rule 40.0) explaining the state management pattern for tabbed views like the new Inbox/Archive system.
-   **Developer Documentation**: Added a new guide to `GEMINI.md` (Rule 41.0) to enforce using named handlers for UI actions, improving code clarity and maintainability.

### [1.0.3] - 2025-09-20: Inbox Protection & Full Task View
 
#### Added
-   **Inbox Important Flag**: Added a star icon to each inbox message, allowing users to flag it as "important." Important messages are protected from being dismissed individually or by the "Clear All" action.
    -   *Note: Context Menu support for toggling the important flag will be added in a future update.*
-   **Full Task View**: Implemented a "Full Task View" mode, allowing a single task to be viewed and edited in a dedicated, full-screen layout. This is accessible via an "expand" icon in the list view.

#### Changed
-   **Inbox Item Hover Effect**: Changed the hover effect on inbox items from a `background-color` change to a subtle `outline`. This improves the perceived responsiveness of action icons (like the "important" star) by preventing the background color change from visually interfering with the icon's own color state.

#### Fixed
-   **Inbox Important Flag Persistence**: Ensured that the "important" status of inbox messages is correctly saved and restored across application restarts.

### [1.0.2] - 2025-09-19

Critical errors trying to implement a Gemini prompt again... this time with "Copy Checklist" so I rolled back some changes from this version to salve what we've worked on. The following "Needs to be added" section is what is left from this chat session.        

#### Added
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

#### Changed
-   **Checklist UI Modernization**: The checklist UI was refined to better match the application's modern aesthetic, with improved spacing, alignment, and input controls.
-   **Checklist Section Actions**: Grouped all section-level action buttons (Complete, Clear, Move, Delete) into a single, unified block in the section header for a cleaner layout.
-   **Interactive Checklists**: Checklist items and "Complete All" buttons are now fully interactive in the read-only "Task" view, allowing for quick updates without entering "Edit" mode.
-   **Consistent Context Menus**: Checklist item and section context menus now work consistently in both "Task" and "Edit" views.

#### Fixed
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

#### Updated
-   **Extensive Developer Documentation**: Added comprehensive developer guides to `GEMINI.md`, covering critical architectural patterns, common pitfalls, and solutions for data persistence, state management, UI interactions, and more.

### [1.0.1] - 2025-09-18

#### Added
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

#### Changed
-   **Notification System Refactor**: Centralized all time-based notification logic into a single, robust `useEffect` hook in the main `App` component. This resolves numerous race conditions and bugs related to duplicate or missing notifications.
-   **UI Modernization**: Updated the styling of the "Inbox" page with better spacing, typography, and a cleaner, more modern container for messages.

#### Fixed
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

### [1.0.0] - 2025-09-15

#### Added
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



#### Changed
-   **UI Terminology**: Standardized the term "Ticket" to "Task" throughout the application, including context menus and UI labels, for better clarity and consistency.
-   **Duplicate Task**: Renamed the "Copy Task" feature to "Duplicate Task" to more accurately describe its function of creating a new, editable copy of an existing task.
-   **Overdue Timer**: The "Time Left" countdown now displays how long a task is overdue (e.g., "Overdue by 01:15:30") instead of just a static "Overdue" message.
-   **Backup Data Structure**: The format of backup files was harmonized to use clean keys (`words`, `settings`) instead of the raw `electron-store` format (`overwhelmed-words`, etc.), ensuring consistency across import, export, and restore features.
-   **Backup Folder Organization**: Backups are now organized into `automatic` and `manual` sub-folders within the application's data directory for better clarity and safer pruning logic.


#### Fixed
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