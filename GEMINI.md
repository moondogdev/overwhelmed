# Gemini Instruction Manual for Development

The following is a manual for the guided development of a hybrid task management application using Google's Gemini Code Assist.

## Index
- **Application Information**
- **Coding with Gemini**
- **Gemini Guidelines (GGl)**
- **Developer Guide Index**

---

## Application Information:
### Application Name: Overwhelmed
**Developer**: Moondog Development, LLC

### Current Application Features:

-   **Advanced Task Management**: Create and manage tasks with detailed fields including priority, due dates with live countdowns, pay rates, recurring schedules, and local file attachments.
-   **Task Types & Templates**: A "Task Type" system allows users to create templated forms that show only the fields relevant to a specific type of task (e.g., "Billing", "Research"), streamlining task creation.
-   **Hierarchical Categories**: Organize tasks with a full-featured, two-level category and sub-category system.
-   **Robust Checklist System**: Add multi-section checklists to any task, with progress bars, undo/redo history, and full context menu support for item management.
-   **Rich Text Editing**: A full WYSIWYG editor for task descriptions and notes, with support for headers, lists, hyperlinks, and more.
-   **Full Task View**: A dedicated, full-screen view for focusing on, viewing, and editing a single task without distractions.
-   **Data Persistence & Backups**: All data is saved locally using `electron-store`. The system includes automatic startup backups and a full manual backup/restore/merge manager to prevent data loss.
-   **Intelligent Notification System**: A centralized, non-blocking notification system provides configurable alerts for overdue tasks and approaching deadlines, with actionable toasts for snoozing or completing tasks directly.
-   **Inbox & Audit Trail**: A persistent inbox logs all major task events (created, completed, updated, overdue), providing a complete history of all activity.
    -   **Important Flag**: Users can mark inbox messages as "important" to protect them from being dismissed.
    -   **Archive**: Users can archive messages to move them from the main inbox to a separate "Archived" view.
    -   **Trash**: A full non-destructive trash system allows users to restore or permanently delete dismissed messages.
-   **Data Reporting & Visualization**: A dedicated "Reports" view with `recharts` integration provides charts and raw data tables for task completions, earnings, and activity over time, with filtering and CSV export.
-   **Customizable UI**: Features a collapsible sidebar, multiple views (Meme, List, Reports), and extensive settings for managing external links, browser integrations, and UI behavior.
-   **"Meme View" Word Cloud**: The original word cloud feature remains, dynamically generating a visual representation of active tasks on a canvas, with clickable words and customizable text styling.

### Usage:

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
│   ├── assets.d.ts       # (Rule 16) TypeScript type definitions for non-code assets.
│   ├── components/       # Reusable React components.
│   │   ├── AppLayout.tsx # The main layout component for the application.
│   │   ├── Checklist.tsx # The component for rendering and managing checklists.
│   │   ├── Editors.tsx   # Contains rich text editors and modals.
│   │   └── ...           # Other UI components like ReportsView, TimeTrackerLog, etc.
│   ├── config.ts         # Contains the default settings configuration for the application.
│   ├── contexts/         # React context definitions.
│   │   └── AppContext.ts # Defines the shape of the global application context.
│   ├── hooks/            # Custom React hooks that contain all application logic.
│   │   ├── useTaskState.ts # Manages all state related to tasks.
│   │   ├── useUIState.ts   # Manages global UI state (modals, toasts, etc.).
│   │   └── ...             # All other single-responsibility hooks.
│   ├── index.css         # (Rule 26) Global stylesheet for the entire application.
│   ├── index.html        # (Rule 26) The simple HTML shell for our React app.
│   ├── index.ts          # (Rule 27) The Electron main process entry point (the "backend").
│   ├── preload.ts        # (Rule 28) The secure bridge between the main and renderer processes.
│   ├── renderer.tsx      # (Rule 29) The React application entry point, now a clean "orchestrator".
│   ├── types.ts          # Contains all shared TypeScript interfaces for the application.
│   └── utils.ts          # Contains globally shared helper functions (e.g., formatTime).
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
### Future Features
See `CHANGELOG.md` for a list of future features to implement. Strickly follow `## Gemini Code Assist Communication`, `### Other Guidelines for Gemini Code Assist to follow:`, `### Log of Issues and Lessons`, and `## Developer Guide Index` sections.

---

### Log of Changes

All notable changes to this project will be documented in this file @CHANGELOG.md. Please update the separate changelog as development progresses. 
- **[1.0.31] - 2025-10-08: Reports View Refactor**: refactor(reports): Decompose monolithic `ReportsView` component into smaller components and a custom hook.
- **[1.0.30] - 2025-10-08: Tax Reporting & Sidebar Management Overhaul**: feat(core): Overhaul tax reporting UI and sidebar component management.
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

## Coding with Gemini
The following section is an evolving document regarding details on coding with Gemini.

---

### Critical Errors with Gemini
While coding with Gemini, it will frequently make suggestions based on what it thinks we should do next, which are mostly great. 

However, be wary of large feature changes as they sometimes come with errors both in implementation and in accepting code changes from Gemini due to system errors. You can try to copy the code manually but its not initially descriptive enough on where exactly to make the change so you might need to ask it specifically how to implement code its erroring. 

This seems to be a caching issue where the chat is looking at an older file than what is current. Gemini should hopefully attempt to prompt us to commit these changes to github before large feature requests but I suggest doing so manually every so often when we have a working version.

---

### Gemini Code Assist Communication
Hello `@Gemini Code Assist`, if you can read this, please, before we make large feature changes & we have a stable application, lets use your 'Prompts to try' to push a commit to github so we can backtrack safely. Unless there are other ways to undo large sessions.

---

### Prompts for Gemini
These are a collection of prompts we use for coding with Gemini:

---

#### Start Feature Implementation
We've committed to git and ready to begin working on implementing new features from our @CHANGELOG.md from the list in `## Future Features`. 

Could you check out our @GEMINI.md before we get started and make sure we are implementing the new features with keeping our specs in mind. Specifically, please review our `# Critical Errors with Gemini`, `## Gemini Code Assist Communication`, and `### Other Guidelines for Gemini Code Assist to follow:` before suggesting prompts, code, or logic. 

- See `### Log of Issues and Lessons` for a breakdown of issues encountered and what we can avoid in the future. 
- See @DEFINITIONS.md for a central glossary for the project's key functions (handlers), state variables, and constants.
- See @COMMITS.md for a record of what we've done so far to get a scope of the project up to this point.

We've also made a `# Developer Guide Index` to help guide the development and provide a clear perspective of the codebase. 

The current project structure can be found in our `### Project Structure` section.

The main files to for context are:

Main Files:
- `/src/index.css`: @index.css
- `/src/index.ts`: @index.ts
- `/src/index.html`: @index.html
- `/src/preload.ts`: @preload.ts
- `/src/renderer.tsx`: @renderer.tsk
Config:
- `.eslintrc.json`: @.eslintrc.json
- `.gitignore`: @.gitignore
- `forge.config.cts`: @forge.config.cts
- `package-lock.json`: @package-lock.json
- `package.json`: @package.json
- `tsconfig.json`: @tsconfig.json
- `tsconfig.node.json`: @tsconfig.node.json
- `webpack.main.config.cts`: @webpack.main.config.cts
- `webpack.renderer.config.cts`: @webpack.renderer.config.cts
- `/src/declarations.d.ts`: @declarations.d.ts
Documentation:
- `CHANGELOG.md`: @CHANGELOG.md
- `GEMINI.md`: @GEMINI.md
- `DEFINITIONS.md`: @DEFINITIONS.md
- `COMMITS.md`: @COMMITS.md

These files can be understood better in the `# Developer Guide Index` section.

---

@renderer.tsx @preload.ts @index.ts @index.html @index.css @CHANGELOG.md @GEMINI.md @DEFINITIONS.md @COMMITS.md

---

#### Implement New Feature from @CHANGELOG.md
We're ready to add a new feature. Can you check our @CHANGELOG.md and suggest something from the list of `## Future Features`?

---


#### Detailed Documentation Prompt
Now that this last change is complete and all documentation is updated, is there anything we can add to `### Other Guidelines for Gemini Code Assist to follow`, `### Log of Issues and Lessons`, and `## Developer Guide Index` in our @GEMINI.md file.

---

#### Log of Issues and Lessons
Now that we're done adding this new feature, is there anything we can add to our `### Log of Issues and Lessons` in @GEMINI.md

---

#### DEFINITIONS.md update
With one final pass at the changes we made before commit, could you please verify if there are any new definitions or logic to add to our @DEFINITIONS.md

---

#### Update all documents and Commit
Everything seems to be working as intended so far. Could we make a final round of updates on @GEMINI.md @CHANGELOG.md @DEFINITIONS.md and add a new section for our @COMMITS.md explaining what was done with this new entry.

---

#### GEMINI.md update
With one final pass at the changes we made before commit, could you please verify if there are any new Rules or logic to add to `## Developer Guide Index` in @GEMINI.md

---

#### Response Bugged Out
Your reponse bugged out.

Please send the text explaining the rule in an individual copy plain text block. Then, provide the relative code examples separate in its own copy code block.

#### New Rule Update
Everything sent over except the new rule's content. It tends to bug out when we mix code examples in the .md file once it renders to chat. Could you please send just the rule content again but:
- separate the content and the code examples of the rule, and;
- send all the content text copy in its own .md copy block, then;
- provide the relative code examples in their own code copy block. 

Don't worry about changing the code, I'll just paste it to the bottom of the @GEMINI.md file.

The example should look like this 

```markdown
markdown [copy] [+ insert]

---

### Developer Guide - Rule ...

This guide...

#### Featured

etc...

---

```

Please excuse my rough drawing but I tried to illustrate the proper response. I hope this helps.

---

## Gemini Guidelines (GGl)
Other Guidelines for Gemini Code Assist to follow:
  - **GGl 1.00: Gemini Thinks its 2024**: The current year is `2025` and the current month is September. Gemini frequently forgets the date based on its training data and will source 2024 examples, documents, and use those dates erroneously. @Gemini, please before we implement anything with dates, we check the current year date as of TODAY. We don't need to source the most relevant information but it would be nice, and most certainly we should always use the current year when including it anywhere in this codebase.
  - **GGl 1.01.00: Gemini should take microsteps**: Implement code in microsteps rather than large code changes so the user can understand whats changing and make it easier for them to see what exactly is happening with the changes.  
  - **GGl 1.02.00: Level User Knowledge of Code on a Scale: 1 out of 10**: Assume the user has a very low knowledge of the code being used and help explain what is going on with each change we are making. 
  - **GGl 1.03.00: Gemini should prompt to update CHANGELOG.md & GEMINI.md frequently**: Frequently suggest changelog and GEMINI.md (this file) changes so we can keep a log of what exactly is occuring during development.
  - **GGl 1.04.00: Use CHANGELOG.md & GEMINI.md frequently**: Refrence both the changelog and GEMINI.md (this file) frequently through development and prompt suggestions to avoid conflicts with existing structure as Gemini Code Assist will lose scope of the project for suggestions outside the existing support.
  - **GGl 1.05.00: Gemini forgets sessions when searching for solutions**: Not all chat sessions will be remembered, so Gemini Code Assist should attempt to update the changelog and GEMINI.md frequently to offload its memory into these static documents without having to maintain constant codebase knowledge.  
  - **GGl 1.06.00: State the Goal First**: When requesting a new feature, state the high-level user goal first before describing the specific implementation. This provides better context for architectural decisions.
  - **GGl 1.07.00: Provide Full Error Messages**: When a bug occurs, always provide the full error message and stack trace from the console. This is the fastest way to debug the issue.
  - **GGl 1.08.00: Enforce a Step-by-Step Plan**: For new features, first ask Gemini to outline all the required steps (e.g., "1. Add interface, 2. Update main process, 3. Update renderer"). Then, proceed through the plan step-by-step. This prevents incomplete implementations.
  - **GGl 1.09.00: Regularly check `DEFINITIONS.md`**: Reference our `DEFINITIONS.md` for existing delcariations and logic.
  - **GGl 1.10.00: Regularly add & update `DEFINITIONS.md`**: Reference our `DEFINITIONS.md` and add & update new delcariations and logic as needed.
  - **GGl 1.11.00: Check for Existing Logic First**: Before adding new functions or state, explicitly ask Gemini to check if similar logic already exists that can be reused or extended. This prevents duplicate code and state management conflicts.
  - **GGl 1.12.00: Request Code Comments for Learning**: When a complex code block is provided, ask Gemini to add comments to it. This helps explain the purpose of each part of the code, which is a great way to learn.
  - **GGl 1.13.00: Gemini should update the `### Other Guidelines for Gemini Code Assist to follow` section**: As we add new guidelines, Gemini should attempt to update this list we are currently in to provide more context for development philosophy and approach.
  - **GGl 1.14.00: Gemini should update the `### Log of Issues and Lessons` section**: Create a new `[1.0.x]` for each error and lesson we learn.
  - **GGl 1.15.00: Gemini should update the `## Developer Guide Index` section**: Create a rule for each new logic we implement or learn through the development process.
    - **GGl 1.15.01:: Developer Guide Index: Prompt Reply Example**: `@Gemini`, this will routinely fail due to comment code and trying to generate code examples. Please copy the blocks of content to add to the Developer Guide separately:
      - **GGl 1.15.01.01**: For example, provide the Rule Change in one block of copy code:
        - **GGl 1.15.01.01.01**: Provide the content of the `### Developer Guide - Rule XX.X:` separately but also;
        - **GGl 1.15.01.01.02**: Provide the code example of the `### Developer Guide - Rule XX.X:` content separately in.
      - **GGl 1.15.01.02**: This should ensure all parts of the `### Developer Guide - Rule XX.X` updates are rendered without errors; (e.g) "Here is the title of the new rule", "Here is the content for the new rule without code examples", "here are the code examples for the new rule".
  - **GGl 1.16.00: Gemini should perform a "wrap up"**: When we are finishing implementing a new feature, Gemini should prompt to update the previous mentioned areas in the `CHANGELOG.md`, `DEFINITIONS.md`, and `GEMINI.md`, specifically the `Other Guidelines for Gemini Code Assist to follow`, `Log of Issues and Lessons`, and `Developer Guide Index` sections. The `CHANGELOG.md` and `GEMINI.md` should reflect a persistent log of our activity and look to perform these wrap up prompts at the end of each new implementation just prior to making a new commit. 
    - **GGl 1.16.01**: Gemini should update `DEFINITIONS.md`**: As new handlers, state variables, or other key declaratives are created, they should be added to the `DEFINITIONS.md` file to maintain a project glossary.
    - **GGl 1.16.02**: Example Workflow**: Implement change > Update `Other Guidelines for Gemini Code Assist to follow`, `Log of Issues and Lessons`, and `Developer Guide Index` sections > update `GEMINI.md`, `DEFINITIONS.md`, and `CHANGELOG.md` sections to reflect the implemented feature AND the documentation updates.

  - **GGl 1.17.00: Prop Drilling Awareness**: When a child component needs access to state from a high-level parent (like `settings` from `App`), explicitly trace the component tree and add the prop to each intermediate component's props interface and call site.
---

### Follow GGl 1.15.01 & GGl 1.15.02
Please follow GGl 1.15.01 and GGl 1.15.02 to ensure new rules for the `## Developer Guide Index` are generated without errors. 

#### Adding a new rule
A quick guideline on how the content should be formatted to match the current markup using # should be as followed:

New rule to add to `## Developer Guide Index`
`  - Rule xx.x: ` uses bullet to append new rule to list

New content for rule to add to `### Developer Guide - Rule `
`### Developer Guide - Rule xx.x:`: Uses h3 ###
`#### Some Title for New Rule`: Uses h4 ####
`##### Nested Title for New Rule`: Uses h5 #####

Please keep this consistent to keep the maintainer from having to make frequent edits.

---

#### [1.0.17] - `switch` Statement Fall-Through
-   **Issue**: The "Move Down" action for checklist items was crashing the app.
-   **Lesson**: The `case 'move_down'` block in the `switch` statement was missing a `break;`. This caused execution to "fall through" into the next `case`, running unintended code. Always ensure every `case` in a `switch` statement that is not intentionally falling through is terminated with a `break;` or `return;`.

---

#### [1.0.16] - Type Definition Mismatches
-   **Issue**: We encountered numerous TypeScript errors like `Cannot find name 'X'` and `Property 'Y' does not exist on type 'Z'`.
-   **Lesson**: These errors consistently occurred when we changed a function's signature or an object's shape in one part of the application (e.g., adding a `color` property to a payload in `index.ts`) but forgot to update the corresponding type definitions or function calls in other files (`renderer.tsx`, `preload.ts`). The lesson is to be meticulous and update all related parts of the "contract" between components or processes: the interface/type, the function signature, and all call sites.

---

#### [1.0.14] - Prop Naming and Refactoring Errors
-   **Issue**: While refactoring the `TaskAccordionHeader` to detect task loops, we introduced several TypeScript errors. We changed the prop name from `words` to `allWords` in the component's function signature but failed to update it in the component's props interface, or vice-versa. This led to a series of `Property 'X' does not exist on type 'Y'` errors that were difficult to trace.
-   **Lesson**: When refactoring a component's props, it is critical to update the prop name in all three key places simultaneously:
    1.  The **component's interface/type definition**.
    2.  The **destructuring in the component's function signature**.
    3.  The **prop being passed at the call site** where the component is used.
    A mismatch in any of these places will cause TypeScript errors. This highlights the need for careful, step-by-step refactoring, especially when changing the "public API" of a component.

---
#### [1.0.13] - Variable Scope and Atomic State Updates
-   **Issue**: While implementing the logic for re-occurring task loops, we repeatedly encountered `Cannot find name 'recurringTask'` errors. This was because the `recurringTask` variable was created inside an `if` block, making it unavailable to the subsequent logic block that needed to update the successor task.
-   **Lesson**: This reinforced the importance of Rule 52.0. To solve complex, interdependent state changes (like creating a new task and updating another task that depends on the new one's ID), all related logic must be handled within a single, atomic state update (`setWords(prev => ...)`). This ensures all necessary variables (like the newly created task) are available within the same scope, preventing race conditions and reference errors.

---

### Log of Issues and Lessons

#### [1.0.32] - TypeScript Inference with Hook Composition
-   **Issue**: After refactoring a large hook (`useTaskState`) into smaller, single-responsibility hooks and combining their return values with the spread operator (`...`), TypeScript failed to correctly infer the shape of the final, combined object. This led to `Property 'X' does not exist on type 'Y'` errors, even though the property was correctly defined and returned by one of the child hooks.
-   **Lesson**: When composing multiple custom hooks, especially when using the spread operator, it is crucial to provide **explicit return type interfaces** for each child hook. This provides a clear "contract" for TypeScript to follow, ensuring it can correctly assemble the final type and preventing inference failures. Without explicit return types, TypeScript may only infer a partial or incorrect type for the combined object. See `Rule 76.0` for a full explanation.

---

#### [1.0.24] - Decomposing Monolithic Hooks
-   **Issue**: The `useChecklist.ts` hook had grown into a massive, monolithic file containing all state, event handlers, and side effects for the entire checklist feature. This made it extremely difficult to debug, maintain, and add new functionality without risking unintended side effects.
-   **Lesson**: This was a practical application of `Rule 70.0: Refactoring Monolithic Components`. The solution was to systematically decompose the large hook into a suite of smaller, single-responsibility hooks (`useChecklistState`, `useChecklistItemManagement`, `useChecklistHierarchy`, `useChecklistIPC`, etc.). The original `useChecklist` hook was transformed into a clean "orchestrator" whose only job is to initialize these smaller hooks and wire them together. This architectural pattern is crucial for managing complexity in a growing React application.

---

#### [1.0.23] - Keyboard Events on Non-Interactive Elements
-   **Issue**: We needed to capture `Tab` and `Shift+Tab` key presses on a `div` representing a checklist item to implement indent/outdent keyboard shortcuts. By default, `div` elements cannot receive focus and therefore do not fire keyboard events.
-   **Lesson**: To make a non-interactive element like a `div` or `span` capable of receiving keyboard focus and events, you must add the `tabIndex={0}` attribute to it. This adds the element to the natural tab order of the page, allowing it to be focused and to trigger `onKeyDown` handlers. This is a crucial accessibility pattern for creating keyboard-navigable custom components. See `Rule 74.0` for a full explanation.

---

#### [1.0.22] - The Perils of `contentEditable`
-   **Issue**: While building the rich text editor, attempts to add custom formatting features (like lists, headers, and custom undo/redo for native actions) led to a cascade of unpredictable bugs, including cursor jumping, random content deletion, and state desynchronization.
-   **Lesson**: A `contentEditable` `div` is a "black box" with its own internal state and rules. Manually manipulating its DOM while the browser is also trying to manage it is a losing battle. The correct architectural decision is to either use a dedicated editor library (like Tiptap or Slate) that manages its own state model, or to drastically simplify the feature set to avoid conflicting with native browser behavior. We chose the latter for stability, removing our custom formatting shortcuts. See `Rule 72.0` for a full explanation.

---

#### [1.0.22] - Falsy `0` Rendering in React
-   **Issue**: A stray "0" was being rendered in the UI when a task's pay rate was zero. The conditional rendering logic `{task.payRate && task.payRate > 0 && ...}` was returning `0` when `task.payRate` was `0`, and React rendered it as a text node.
-   **Lesson**: The `&&` operator in JavaScript returns the value of the first "falsy" operand it encounters. If that value is `0`, React will render the number `0`. To prevent this, conditional rendering logic must always evaluate to a clean boolean (`true`/`false`) or `null`/`undefined`. The fix was to simplify the condition to just `task.payRate > 0`, which correctly evaluates to `false` when the pay rate is `0`. See `Rule 73.0` for a full explanation.

---

#### [1.0.20] - State Replacement vs. State Merging
-   **Issue**: Updating a single setting (like expanding a checklist section) would wipe out the entire `settings` object, causing data loss on the next save. This happened because we were calling `onSettingsChange({ openChecklistSectionIds: newOpenIds })`, which replaces the state object instead of merging with it.
-   **Lesson**: When updating a piece of a complex state object, **always** use the functional update form to ensure the new value is merged with the previous state, not replacing it.
    -   **Incorrect (Replaces State)**: `setState({ myKey: 'newValue' })`
    -   **Correct (Merges State)**: `setState(prevState => ({ ...prevState, myKey: 'newValue' }))`
    -   This was the root cause of the conflict between the checklist template manager and the section collapse feature. See `Rule 71.0` for a full explanation.

#### [1.0.19] - The "Orchestrator" Component Pattern
-   **Issue**: The main `App` component in `renderer.tsx` had grown to thousands of lines, mixing state management, UI logic, event handling, and data persistence. This made it extremely difficult to maintain, debug, and add new features without introducing side effects.
-   **Lesson**: The solution was a complete refactoring into a **hook-based architecture**. All related state and logic were extracted into dedicated, single-responsibility custom hooks (e.g., `useTaskState`, `useUIState`, `useSettings`, `useDataPersistence`). The `App` component was reduced to a clean **"orchestrator"** whose only job is to initialize these hooks and provide their state to the rest of the application via the `AppContext`. This pattern dramatically improves code organization, maintainability, and scalability. It also makes individual pieces of logic easier to test and reuse.

---

#### [1.0.12] - State Management for Duplication
-   **Issue**: When duplicating a checklist section or item, the new items were created with the same unique IDs as the originals. This caused a critical bug where updating a duplicated item (e.g., adding a note) would incorrectly apply the change to the original item as well.
-   **Lesson**: This was a classic "shallow copy" vs. "deep copy" problem. Simply spreading an object (`{...itemToCopy}`) only copies the top-level properties. For nested data like checklist items, we must perform a "deep copy" to ensure that all nested items also receive new, unique IDs. The fix was to explicitly map over the nested `items` array and generate a new `id` for each one during the duplication process.

---

#### [1.0.12] - Gemini State Caching and Inaccurate Diffs
- **Issue**: Gemini will frequently suggest code changes based on a cached or outdated version of the project files. This leads to suggested diffs that cannot be applied, or that cause errors because they don't match the current state of the code. The diff shown in the chat may not accurately represent the changes being applied.
- **Lesson**: This is a limitation of the tool's context window. To mitigate this, it's crucial to be vigilant. Always carefully examine the code changes suggested by Gemini before accepting them. If a change fails to apply or seems incorrect, it's best to manually copy the code blocks. Restarting the VS Code session or the chat can sometimes help refresh the context, but manual verification is the most reliable safeguard.

##### Gemini on this matter
I don't have a live, real-time copy of your files. My "knowledge" is based on the context of our conversation and the files you've provided in previous prompts. When you make changes locally without me "seeing" them in a prompt, my context becomes outdated, which leads to the errors and bad suggestions we've seen.
  - **Solution**:Your idea is the best solution. The most reliable way to avoid these caching issues is to explicitly include the file(s) you want me to modify in the prompt, even if you think I should already have them.
    - For example, instead of saying "Add a button to the Checklist component," a much safer prompt would be:
    - "Here is the latest version of src/renderer.tsx. Please add a button to the Checklist component."
    - `ts // Paste the full, current content of renderer.tsx here`

##### Large Files
When a file like renderer.tsx becomes too large to paste into a single prompt, providing the full context becomes difficult. You are correct that simply using @ can be unreliable if my internal context is stale.

The best strategy in this situation is to provide targeted context. Instead of pasting the entire file, you can paste only the most relevant sections.

Here’s a breakdown of what that looks like:
  - The Component/Function to be Modified: Always include the full source code of the specific component or function you want to change. For example, if we're adding a feature to the Checklist component, you would paste the entire function Checklist(...) { ... } block.
  - Related State and Type Definitions: If the change involves state or data structures, include those definitions from the top of the file.
    - State: `const [words, setWords] = useState<Word[]>([]);`
    - Interfaces: `interface Word { ... }, interface ChecklistItem { ... }`
    - Handlers: If the new feature calls an existing handler like `handleWordUpdate`, include that function as well.
  - A Clear Prompt: Your prompt should explicitly state that you are providing only a partial file.

Here is an example of what a good prompt would look like for a large file:

"Hello Gemini, I want to add a "Copy All" button to the Checklist component in src/renderer.tsx.

The file is too large to paste, so here are the relevant sections: the ChecklistItem and ChecklistSection interfaces, and the Checklist component itself."

```ts
// From: src/renderer.tsx

// INTERFACES
interface ChecklistItem {
  id: number;
  text: string;
  isCompleted: boolean;
  response?: string;
  note?: string;
}

interface ChecklistSection {
  id: number;
  title: string;
  items: ChecklistItem[];
}

// COMPONENT TO MODIFY
function Checklist({ sections, onUpdate, isEditable, ... }: { ... }) {
  // ... existing component code ...
}
```
This approach gives me the direct context I need to make the change accurately, without requiring the entire file. It's a great middle-ground between providing no context and providing too much.

---

#### [1.0.11] - State Immutability Errors
-   **Issue**: While adding the checklist response/note feature, we encountered a `TypeError: Cannot assign to 'newSections' because it is a constant.` This happened because we initially declared a state-derived variable with `const` but then needed to reassign it based on further user input (from the prompt modal).
-   **Lesson**: When a variable that holds a transformed state array might need to be further modified within the same function scope, it must be declared with `let` instead of `const`. Using `const` is best practice for initial declarations, but `let` is necessary if the variable itself needs to be reassigned, not just its contents mutated.

---
#### [1.0.10] - Component and Function Scope Errors
-   **Issue**: While creating new helper functions (`getContrastColor`) and components (`Dropdown`), we encountered multiple `Cannot find name 'X'` errors. This was because the new code was defined inside a component, making it inaccessible to other components that needed it.
-   **Lesson**: All reusable helper functions and components within a single file should be defined at the top level of the file, outside and before the main `App` component. This ensures they are properly hoisted and available throughout the component's scope, preventing reference errors.
---
#### [1.0.9] - JSX Syntax Errors from Complex Conditional Rendering
-   **Issue**: While implementing the tabbed inbox views (Active, Archive, Trash), multiple cascading syntax errors occurred (e.g., `Unexpected token`, `JSX element has no corresponding closing tag`). These were difficult to pinpoint and were caused by incorrectly structured conditional rendering blocks.
-   **Lesson**: When a component has multiple complex return paths (e.g., one for a "grouped" view and another for a "flat list" view), it's easy to make structural mistakes. The best practice is to simplify the rendering logic. Instead of having large, separate `return` statements inside each `if` block, it's better to define common elements (like headers) once and then conditionally render only the parts that change. This reduces code duplication and makes the component's JSX structure much easier to read and debug.
---
#### [1.0.8] - UI Lag on State Update in Large Component (unfounded)
-   **Developer Note**: This was misinterpreted due to our hover state styling matching the styling of toggle state, making it seem like the element was not toggling off quickly but was actually awaiting for a mouseexit. The following issue is not founded yet but its something we should be mindful of as expanding and refactoring the codebase.
-   **Issue**: After implementing the "Inbox Important" toggle, a noticeable lag occurred when clicking the star icon. The state updated, but the UI took a moment to reflect the change.
-   **Lesson**: This is a classic React performance issue. When a single component (like our main `App` in `renderer.tsx`) becomes too large, any state update can trigger a slow and expensive re-render of the entire component tree. The solution is to refactor distinct pieces of UI (like the Inbox) into their own smaller, memoized components. This ensures that only the relevant component re-renders, making the UI feel instantaneous. This will be addressed in a future refactoring task.
---
#### [1.0.7] - Critical Build System Module Conflict
-   **Issue**: The application failed to start due to a conflict between how the IDE's TypeScript server and Electron Forge's Node.js runtime interpreted the build configuration files (`forge.config.ts`, etc.). This created a loop of "Cannot redeclare block-scoped variable" and "module is not defined in ES module scope" errors.
-   **Lesson**: The definitive solution was to rename all build configuration files from `.ts` to `.cts` (CommonJS TypeScript) and update the `require` statements in `forge.config.cts` to include the new extension. This provided an unambiguous signal to all tools that these files are CommonJS modules, permanently resolving the conflict. (See `GEMINILOOP.md` for a full history).
---
#### [1.0.6] - Stale State in Re-used Components
-   **Issue**: Components with internal state (like the `DescriptionEditor`) would show stale data when re-used by React for a different task.
-   **Lesson**: Force a component to completely reset its state by passing a unique `key` prop. When the key changes, React destroys the old instance and creates a new one. (See Rule 14.0).

#### [1.0.5] - Data Structure Evolution
-   **Issue**: The app would crash when trying to render old data after a data structure was updated (e.g., `ChecklistItem[]` to `ChecklistSection[]`).
-   **Lesson**: Build backward compatibility directly into components using `React.useMemo` to perform on-the-fly data migration. (See Rule 07.0).
---
#### [1.0.4] - Child-to-Parent Imperative Actions
-   **Issue**: The "Undo/Redo" context menu action, handled in the parent `App`, couldn't trigger the `handleUndo` function inside the specific child `Checklist` component.
-   **Lesson**: Use a `ref` in the parent to create a "bridge" that can hold and call functions on a specific, active child component. (See Rule 05.0).
---
#### [1.0.3] - Notification Spam and Race Conditions
-   **Issue**: The app suffered from notification spam due to race conditions between multiple timers.
-   **Lesson**: Centralized all time-based logic into a single "heartbeat" `useEffect` hook to ensure predictable, atomic state updates. (See Rule 06.0 & 12.0).
---
#### [1.0.2] - Duplicate Key Generation
-   **Issue**: Using `Date.now()` for keys caused console errors and UI bugs when items were created in quick succession.
-   **Lesson**: Guarantee key uniqueness by using `Date.now() + Math.random()`. (See Rule 02.0).
---
#### [1.0.1] - "Copy Checklist" Implementation Issues
-   **Issue**: An attempt to implement a "Copy Checklist" feature resulted in critical, hard-to-resolve errors.
-   **Lesson**: For complex features that cause instability, it's best to revert to a stable version and re-approach the feature from a fresh start.
---
#### [1.0.0] - `package.json` Versioning Data Loss
-   **Issue**: An attempt to read the version number from `package.json` caused a change in `electron-store`'s behavior, leading to a complete wipe of all application data.
-   **Lesson**: Do not alter the core `electron-store` initialization. This led to the creation of the robust automatic and manual backup systems we now have.

---

## Developer Guide Index
  - Rule 01.0: Adding a New Context Menu
  - Rule 02.0: Generating Unique Keys in React
  - Rule 03.0: Handling `onClick` with Function Arguments (Still Relevant)
  - Rule 04.0: Preventing Data Loss with `electron-store`
  - Rule 05.0: Child-to-Parent Communication with Refs (Partially Deprecated)
  - Rule 06.0: Centralized Notification Logic
  - Rule 07.0: Data Migration for Component Props
  - Rule 08.0: Codebase Naming Conventions (`Word` vs. `Task`)
  - Rule 09.0: Graceful Shutdown and Data Integrity
  - Rule 10.0: Debouncing Notifications for Frequent Updates
  - Rule 11.0: Disabling Interactive Elements in `contentEditable` (Still an Open Issue)
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
  - Rule 39.0: Central Toast Notifications (`setCopyStatus` - To be refactored)
  - Rule 40.0: State Management for Tabbed Views (e.g., Inbox/Archive)
  - Rule 41.0: Prefer Named Handlers for UI Actions
  - Rule 42.0: Creating Reusable Components and Helpers
  - Rule 43.0: The Electron Process Model (Main vs. Renderer)
  - Rule 44.0: Managing Unsaved State with `isDirty`
  - Rule 45.0: The Auto-Save Timer
  - Rule 46.0: The `TaskAccordionHeader` Component
  - Rule 47.0: The `Dropdown` Component
  - Rule 48.0: Handling Events on Nested Elements
  - Rule 49.0: Prefer `outline` for Hover Effects on Interactive Items (UI/UX Best Practice)
  - Rule 50.0: State Management for Modals Editing Nested Data (Superseded by In-Place Editing)
  - Rule 51.0: Formatting Text for Clipboard
  - Rule 52.0: Atomic State Updates for Looping Tasks
  - Rule 53.0: Understanding Event Propagation (Bubbling)
  - Rule 54.0: State Management for In-Place Editing
  - Rule 55.0: Creating Stable Hover-Action Menus
  - Rule 56.0: Component Definition and Re-Renders
  - Rule 57.0: Creating Focused Context Menus for Nested Elements (Application of Rule 53.0)
  - Rule 58.0: Prop Drilling (Superseded by Rule 69.0)
  - Rule 59.0: Switch Statement Fall-Through
  - Rule 60.0: Synchronizing `Checklist` State with `updateHistory`
  - Rule 61.0: Avoiding Native Modals for Confirmations and Actions
  - Rule 62.0: Maintaining the IPC Contract for Type Safety
  - Rule 63.0: Child-to-Parent State Updates via Callback Props
  - Rule 64.0: The `useEffect` Dependency Array and Stale Closures
  - Rule 65.0: On-the-Fly Data Migration in Components
  - Rule 66.0: Enforcing Business Logic in State Handlers
  - Rule 67.0: Live UI Updates with `setInterval`
  - Rule 68.0: Cross-Component State Updates (Application of Rule 69.0)
  - Rule 69.0: The Orchestrator Component and Custom Hooks
  - Rule 70.0: Refactoring Monolithic Components
  - Rule 71.0: State Replacement vs. State Merging
  - Rule 72.0: The Perils of `contentEditable`
  - Rule 73.0: Safe Conditional Rendering in JSX
  - Rule 74.0: Keyboard Interactivity with `onKeyDown` and `tabIndex`
  - Rule 75.0: Decoupling Actions from Editing State with Hover Menus
  - Rule 76.0: Explicit Return Types for Composable Hooks

---

### Developer Guide - Rule 01.0: Adding a New Context Menu

This guide outlines the three main steps required to add a new right-click context menu to the application. We will use the "Checklist Item" menu as an example.

---

#### Step 1: Trigger the Menu from the UI (Renderer Process)

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

#### Step 2: Expose the API (Preload Script)

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

#### Step 3: Build and Handle the Menu (Main Process)

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

### Developer Guide - Rule 02.0: Generating Unique Keys in React

This guide explains how to avoid a common React warning: `Warning: Encountered two children with the same key`.

#### The Problem: `Date.now()` is Not Always Unique

We frequently use `Date.now()` to generate IDs for new items like tasks or inbox messages. While this often works, it is **not guaranteed to be unique** and was the source of extensive console log errors and "ghost" inbox messages in the past.

If multiple items are created in a loop or in very quick succession (e.g., using the "Complete All" button on a checklist), the code can execute so fast that `Date.now()` returns the *exact same millisecond timestamp* for multiple items. This results in duplicate keys, which causes React to show a warning and can lead to unpredictable UI behavior like missing or duplicated elements.

#### The Solution: Add a Random Element

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

### Developer Guide - Rule 3.0: Handling `onClick` with Function Arguments

This guide explains a common issue in React where an `onClick` handler behaves unexpectedly and how to fix it using an arrow function.

#### The Problem: Unexpected Arguments
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

#### The Solution: Arrow Functions
To fix this, we wrap the function call in an anonymous arrow function. This creates a new function that, when executed by onClick, calls our handleSnoozeAll function with the exact arguments we want (in this case, no arguments, so it uses the default).

```jsx
// This calls handleSnoozeAll() with no arguments, as intended.
<button onClick={() => handleSnoozeAll()}>Snooze All</button>

// This correctly calls it with the 'high' argument.
<button onClick={() => handleSnoozeAll('high')}>Snooze All 10m</button>
```

Always use this arrow function () => ... pattern for onClick handlers when you need to call a function that either takes arguments or should be called with no arguments.

---

### Developer Guide - Rule 4.0: Preventing Data Loss with `electron-store`

This guide documents a critical data loss bug we encountered and the systems we built to fix it and prevent it from ever happening again.

#### The Problem: Accidental Data Wipe on Startup

We discovered a catastrophic bug where making a seemingly minor change to the `electron-store` initialization logic in `src/index.ts` caused the application to start with a blank session. Because the app was configured to auto-save, this blank session would then immediately overwrite the user's existing `config.json` file, resulting in **total data loss**.

This happened because `electron-store`, if not given an explicit filename, can sometimes create a new, empty configuration file if it detects a change in its initialization parameters.

#### The Solution: A Multi-Layered Defense

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

### Developer Guide - Rule 05.0: Child-to-Parent Communication with Refs

This guide explains an advanced React pattern for when a parent component needs to call a function that exists inside a specific child component. This is often called "imperative programming" in React and should be used sparingly, but it was the perfect solution for our checklist's context menu.

#### The Problem: Calling a Child's Function from a Parent

We needed the "Undo" and "Redo" actions in the checklist section's context menu to work. The challenge was:

1.  **The Event is Global**: The context menu click is handled by `ipcMain` in `index.ts` and sent to the main `App` component.
2.  **The Logic is Local**: The `handleUndo()` and `handleRedo()` functions, along with the `history` state they manage, exist inside the `Checklist` component.
3.  **Multiple Children**: There are many `Checklist` instances on the screen (one for each task). The `App` component needed a way to call `handleUndo()` on the *one specific, currently open* checklist.

The standard "props down, events up" data flow doesn't work here because the parent needs to initiate the action on the child.

#### The Solution: Exposing Child Functions with a Ref

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

### Developer Guide - Rule 06.0: Centralized Notification Logic

This guide explains the architecture of our notification system and why we centralized all time-based logic into a single `useEffect` hook.

#### The Problem: Race Conditions and Duplicate Notifications

In earlier versions, different components or functions tried to manage their own timers. For example, the `TimeLeft` component had its own `setInterval` to check if a task was overdue, and another piece of logic handled "approaching deadline" warnings.

This created several critical bugs:

1.  **Notification Spam**: If multiple tasks became overdue at the same time, multiple timers would fire simultaneously, each trying to update the state. This race condition caused a flood of duplicate "overdue" messages in the inbox.
2.  **Ghost Messages**: An "approaching deadline" alert and an "overdue" alert could fire for the same task in rapid succession, creating conflicting state updates and non-functional "ghost" messages.
3.  **Performance Issues**: Having many independent `setInterval` timers running (one for every active task) is inefficient and can degrade performance.

#### The Solution: A Single, Centralized Timer

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

#### Why This Works

-   **No Race Conditions**: By processing all time-based events in a single loop, we ensure that state updates happen in a predictable order. There is only one source of truth for time-based changes.
-   **Atomic Updates**: We can collect all necessary changes for a given second and then perform one single, comprehensive state update, which is much safer and more performant for React.
-   **Efficiency**: We replaced dozens of potential timers with just one, significantly improving the application's performance.

This centralized pattern is the standard for handling all time-based events in the application.

---

### Developer Guide - Rule 07.0: Data Migration for Component Props

This guide explains how to safely evolve a component's data structure without crashing the application when it encounters old data.

#### The Problem: Breaking Changes in Props

As an application grows, you will inevitably need to change the shape of your data. We faced this when we upgraded the `Checklist` component.

-   **Old Format**: The `checklist` prop was a simple array of items: `ChecklistItem[]`.
-   **New Format**: We introduced sections, changing the prop to a more complex structure: `ChecklistSection[]`.

This created a critical problem: any existing task in a user's `config.json` file that had a checklist in the old format would crash the application, because the newly updated `Checklist` component was not designed to handle the old `ChecklistItem[]` array.

#### The Solution: On-the-Fly Migration with `useMemo`

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

#### Why This Works

-   **Resilience**: The component can handle both old and new data formats gracefully without crashing.
-   **Transparency**: The migration is completely transparent to the parent component. It doesn't need to know or care about the data version.
-   **Efficiency**: `useMemo` ensures that the migration logic only runs when the `checklist` data actually changes, not on every single render.

This pattern is the standard for handling breaking changes in a component's props.

---

### Developer Guide - Rule 08.0: Codebase Naming Conventions (`Word` vs. `Task`)

This guide clarifies a core naming convention in the codebase to prevent confusion.

#### The Issue: `Word` means `Task`

The application began as a simple "word cloud" generator. As such, the primary data object was named `Word`, and the main state arrays were `words` and `completedWords`.

Over time, the project evolved into a full-featured task manager. We added properties like `priority`, `checklist`, `completeBy`, etc., to the original `Word` interface. While the UI now refers to these items as "Tasks," the underlying code still uses the original `Word` type and variable names.

#### The Convention

When you see a variable or type named `word`, `words`, or a function like `handleWordUpdate`, you should interpret it as referring to a **Task**.

**Example**: `const [words, setWords] = useState<Word[]>([]);` is the primary state for the list of active **Tasks**.

While refactoring all instances of `Word` to `Task` would be ideal, it is a large undertaking. For now, this guide serves as the official clarification.

---

### Developer Guide - Rule 09.0: Graceful Shutdown and Data Integrity

This guide explains the process the application uses to prevent data loss when being closed with unsaved changes.

#### The Problem: Race Conditions on Quit

When a user with unsaved changes clicks the "close" button, a simple "save then quit" approach is dangerous. A race condition can occur where the application window is destroyed *before* the file I/O operation to save `config.json` has fully completed, leading to data corruption or loss.

#### The Solution: Main Process Controlled Shutdown

To solve this, we implemented a robust, asynchronous shutdown sequence that is entirely controlled by the main process (`index.ts`), which is the only process that can safely manage file operations and the application lifecycle.

Here is the sequence of events when a user with unsaved changes clicks "Save and Quit":

1.  **Intercept Close Event (`index.ts`)**: The `mainWindow.on('close', ...)` event handler in `index.ts` intercepts the close request and prevents the window from closing immediately (`e.preventDefault()`).

2.  **Show Dialog (`index.ts`)**: The main process shows the "Save and Quit" dialog to the user.

3.  **Request Data from Renderer (`index.ts`)**: Upon user confirmation, the main process sends a message to the renderer process: `mainWindow.webContents.send('get-data-for-quit');`

4.  **Renderer Gathers State (`renderer.tsx`)**: The `App` component in the renderer has a `useEffect` hook listening for `get-data-for-quit`. It gathers all current state (`words`, `settings`, etc.) and sends it back to the main process: `window.electronAPI.send('data-for-quit', { ... });`

5.  **Main Process Saves Data (`index.ts`)**: The main process has a one-time listener `ipcMain.once('data-for-quit', ...)` that waits for the data from the renderer. Once the data is received, the main process itself writes the files to disk using `store.set(...)`.

6.  **Force Quit (`index.ts`)**: **Only after** the data has been received and saved does the main process call `forceQuit(mainWindow)`, which safely destroys the window and quits the application.

#### Why This Works

-   **No Race Condition**: The application window is not destroyed until the main process has explicitly confirmed that the save operation is complete.
-   **Single Source of Truth**: The main process, which owns the application lifecycle, is the single source of truth for the shutdown sequence. This prevents conflicts and ensures data integrity.

This pattern is the standard for all shutdown procedures in the application.

---

### Developer Guide - Rule 10.0: Debouncing Notifications for Frequent Updates

This guide explains how we prevent notification spam when a user makes many rapid changes to a task.

#### The Problem: Notification Flooding

When a user edits a task, the `handleWordUpdate` function is called on every single change (e.g., for each keystroke in a text field). If we sent an "Updated" message to the Inbox on every call, a single editing session could generate dozens of notifications, which is noisy and unhelpful.

#### The Solution: Debouncing with `setTimeout`

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

#### Why This Works

-   **User Experience**: The user receives a single, meaningful "Task updated" notification after they are finished editing, not during.
-   **Performance**: This prevents the application from trying to process dozens of state updates to the `inboxMessages` array in rapid succession.

This pattern is the standard for handling notifications triggered by high-frequency events.

---

### Developer Guide - Rule 11.0: Disabling Interactive Elements in `contentEditable`

This guide explains why we must prevent user interaction with form elements (like checkboxes) inside our rich text editor.

#### The Problem: React State vs. Direct DOM Manipulation

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

### Developer Guide - Rule 12.0: Preventing Overdue Notification Race Conditions

This guide explains how we prevent the application from creating duplicate "overdue" notifications for the same task.

#### The Problem: Race Conditions with Multiple Timers

The application's "heartbeat" timer (see Rule 06.0) checks for overdue tasks every second. However, other events (like loading the app with already-overdue tasks) could also trigger an overdue check. This created a race condition:

1.  Two different parts of the code would detect that `Task A` is overdue at nearly the same time.
2.  Both would independently call the logic to create a toast notification and an inbox message.
3.  The user would see two identical toasts and two identical inbox messages for the same overdue task, which is confusing and incorrect.

#### The Solution: A Single Gatekeeper Function

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
#### Why This Works

-   **No Race Condition**:
  -   **Idempotent**: No matter how many times `handleTaskOverdue` is called for the same task, the `overdueMessageSentRef` check ensures that the expensive and user-visible action (creating an inbox message) only ever happens once per session.
  -   **Atomic**: By using functional state updates (`setOverdueNotifications(prev => ...)`), we ensure that even if multiple calls happen in the same render cycle, React handles them safely without conflicts.

---

### Developer Guide - Rule 13.0: Data Persistence and State Management

This guide defines the single, authoritative pattern for saving and loading application data. Following this rule is critical to prevent data corruption and conflicting sources of truth.

#### The Architecture: `electron-store` in the Main Process

All application data (`words`, `settings`, `inboxMessages`, etc.) is persisted in a single `config.json` file managed exclusively by `electron-store` in the main process (`src/index.ts`).

-   **The Renderer does NOT save files.** The React application (`src/renderer.tsx`) holds the state in memory but never directly writes to the filesystem. This is a critical security and stability measure.
-   **The Main Process is the Gatekeeper.** The main process is the only part of the application with the authority to read from or write to `config.json`.

#### The Golden Rule: Add New State to the Existing Flow

**Do not introduce new persistence methods.** Any new piece of data that needs to be saved across sessions (e.g., a new settings option, a new data array) must be integrated into the existing `settings` object or the top-level state in the `App` component.

#### How to Add New Persistent State (Example: A New Setting)

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

### Developer Guide - Rule 14.0: Forcing Component State Reset with `key`

This guide explains a crucial React pattern for ensuring a component's internal state is reset when its context changes.

#### The Problem: Stale State in Re-used Components

We encountered a bug in our `DescriptionEditor` component. This component has its own internal state to manage the HTML content (`htmlContent`). When a user switched from editing one task to another, the editor would sometimes briefly show the content from the *previous* task.

This happens because React is efficient. To avoid unnecessary work, it tries to re-use the existing `DescriptionEditor` component instance and just pass it new props. However, it does not automatically reset the component's internal state, leading to this "stale state" bug.

#### The Solution: The `key` Prop

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

#### Why This Works

-   **Explicit Identity**: The `key` prop gives each component instance a stable and unique identity.
-   **Predictable State**: It guarantees that whenever the identity of the data changes, the component will start with a fresh state, preventing bugs caused by stale, left-over data.

This is the standard pattern to use whenever you have a stateful component that needs to be completely reset when the data it represents changes.

---

### Developer Guide - Rule 15.0: Handling Build and Dependency Issues

This guide explains how to resolve strange, hard-to-diagnose errors by performing a "clean slate" reinstall of the project's dependencies and build cache.

#### The Problem: Stale Caches and Corrupted Dependencies

Sometimes, the application will fail to start or will throw bizarre errors that don't seem related to any recent code changes. This often happens after:
-   Switching branches in Git.
-   Updating packages with `npm install`.
-   Changing build configurations (e.g., in `webpack.config.cts`).

The cause is usually stale or corrupted files in two key directories:
-   `node_modules`: Contains all the third-party packages the project depends on.
-   `.webpack`: A cache directory created by Electron Forge to speed up the build process.

#### The Solution: The "Clean Slate" Reinstall

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

### Developer Guide - Rule 16.0: Handling Non-Code Asset Imports

This guide explains the purpose of the `declarations.d.ts` file and how it allows us to import non-code assets like images directly into our TypeScript files.

#### The Problem: TypeScript Only Understands Code

By default, the TypeScript compiler only knows how to handle `.ts`, `.tsx`, and `.js` files. When you try to import a different file type, like an image, you will get a compiler error: `Cannot find module './assets/placeholder-image.jpg' or its corresponding type declarations.`

TypeScript doesn't know what the "type" of a JPG file is or what it should do with it.

#### The Solution: Ambient Module Declarations

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

### Developer Guide - Rule 17.0: Code Linting with ESLint

This guide explains the purpose of the `.eslintrc.json` file and how it helps us maintain high-quality, consistent code.

#### The Problem: Inconsistent Code and Potential Bugs

As a project grows, it's easy for different developers (or even the same developer on different days) to write code in slightly different styles. This can lead to code that is hard to read and, more importantly, can hide potential bugs (like unused variables or incorrect imports).

#### The Solution: ESLint for Automatic Code Analysis

ESLint is a "linter" that automatically analyzes our code as we write it. It checks for common problems and enforces a consistent style based on a set of rules defined in our `.eslintrc.json` file.

Our current configuration does the following:

-   **`"parser": "@typescript-eslint/parser"`**: This is the most important part. It tells ESLint to use a special parser that allows it to understand TypeScript syntax, which standard ESLint cannot do on its own.

-   **`"env": { ... }`**: This section tells ESLint about the global variables that are available in our different environments. For example, `"browser": true` means it won't flag errors for using `window` or `document`, and `"node": true` means it understands `require` and `process`.

-   **`"extends": [ ... ]`**: This is where we import pre-made sets of rules. Instead of configuring hundreds of rules manually, we "extend" from standard configurations:
    -   `"eslint:recommended"`: A baseline set of common best practices.
    -   `"plugin:@typescript-eslint/recommended"`: Best practice rules specifically for TypeScript code.
    -   `"plugin:import/recommended"`: Rules that help prevent issues with `import` and `export` statements, like incorrect file paths.

#### How to Use and Expand It

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

### Developer Guide - Rule 18.0: Electron Forge Build Configuration

This guide explains the purpose of the `forge.config.cts` file, which is the central configuration for Electron Forge, our application's build and packaging tool.

#### What It Does

The `forge.config.cts` file tells Electron Forge everything it needs to know to take our source code (`.ts`, `.tsx`, `.css`) and turn it into a runnable development application (`npm start`) or a distributable, installable application (`npm run make`).

#### Key Sections Explained

1.  **`packagerConfig`**:
    -   This section contains options for `electron-packager`. We use `asar: true` to bundle our application's source code into a single, more efficient archive file, which is standard practice for production builds.

2.  **`makers`**:
    -   This array defines the types of installers we want to create when we run `npm run make`. We have it configured to create installers for Windows (`MakerSquirrel`), macOS (`MakerZIP`), and Linux (`MakerDeb`, `MakerRpm`).

3.  **`plugins`**:
    -   This is the most important section. It configures the plugins that transform our code.
    -   **`WebpackPlugin`**: This is the core plugin. It tells Electron Forge to use Webpack to bundle our code.
        -   `mainConfig`: Points to `webpack.main.config.cts` to handle the main process code.
        -   `renderer`: Points to `webpack.renderer.config.cts` and defines the "entry points" for our UI, telling Webpack where to find the `index.html`, `renderer.tsx` (our React app), and `preload.ts` files.

#### Why We Use `.cts`

As noted in our "Log of Issues and Lessons," we use the `.cts` (CommonJS TypeScript) extension for all our build configuration files. This is a critical rule to prevent module conflicts between the Node.js runtime (which expects CommonJS) and our application code (which uses ES Modules). See Rule 04.0 for more details.

#### When Would We Change This File?

We would typically only modify `forge.config.cts` for major architectural changes, such as:
-   Adding a new window (e.g., a dedicated settings window with its own HTML and JS files).
-   Changing the application icon.
-   Adding code signing for production builds.
-   Integrating a new plugin into the build process.

This file is critical to the build process and should be edited with caution.

---

### Developer Guide - Rule 19.0: Understanding `package-lock.json`

This guide explains the purpose of the `package-lock.json` file and why it is critical to the project's stability.

#### What It Does

The `package-lock.json` file is automatically generated by `npm` whenever you run `npm install`. Its primary purpose is to **lock down the exact versions** of every single package and sub-package that the project depends on.

#### The Problem It Solves: "Dependency Drift"

Our `package.json` file often specifies a version range for dependencies (e.g., `"react": "^18.3.1"`). The `^` means that `npm install` is allowed to install any version from `18.3.1` up to, but not including, `19.0.0`.

Without a lockfile, this could cause major problems:
-   Developer A runs `npm install` and gets version `18.3.1`.
-   A week later, Developer B runs `npm install` and gets a newly released version `18.4.0`, which might contain a breaking change.
-   The application now works for Developer A but is broken for Developer B, leading to "it works on my machine" bugs that are very hard to track down.

The `package-lock.json` file prevents this by recording the exact version (`18.3.1`) that was installed. When Developer B runs `npm install`, `npm` sees the lockfile and installs the exact same version, ensuring a consistent and reproducible environment for everyone.

#### The Golden Rule

**`package-lock.json` must be committed to version control (Git).** It should almost never be edited manually. It is managed by `npm` and is the single source of truth for the project's dependency tree.

---

### Developer Guide - Rule 20.0: Understanding `package.json`

This guide explains the purpose of the `package.json` file, which serves as the manifest for our Node.js project.

#### What It Does

The `package.json` file is the central metadata file for the application. It contains essential information such as the project's name and version, but its most critical roles are:

1.  **Defining Scripts**: It holds the `npm` commands we use to start, build, and package the application.
2.  **Managing Dependencies**: It lists all the third-party packages required for the project to run.

#### Key Sections Explained

-   **`"main": "./.webpack/main"`**: This tells Electron where to find the main entry point of our application after it has been compiled by Webpack.

-   **`"scripts": { ... }`**: This section defines the command-line shortcuts we use.
    -   **`"start": "electron-forge start"`**: This is the command we run to launch the application in development mode.
    -   **`"package": "electron-forge package"`**: This command bundles the application code without creating an installer.
    -   **`"make": "electron-forge make"`**: This command creates the final, distributable installers for Windows, macOS, and Linux.
    -   **`"lint": "eslint --ext .ts,.tsx ."`**: This command runs ESLint to check our entire codebase for style and syntax errors.

-   **`"dependencies": { ... }`**: This lists all the packages that are required for the application to **run in production**. These are bundled into the final application. Examples include `react`, `react-dom`, and `electron-store`.

-   **`"devDependencies": { ... }`**: This lists all the packages that are only needed for **development and building**. These are not included in the final, packaged application. This is where our build tools (`electron-forge`, `webpack`, `ts-loader`) and code quality tools (`eslint`, `typescript`) live.

#### The Golden Rule

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

### Developer Guide - Rule 21.0: Understanding `tsconfig.json`

This guide explains the purpose of the `tsconfig.json` file, which is the main configuration file for the TypeScript compiler.

#### What It Does

The `tsconfig.json` file tells the TypeScript compiler (`tsc`) how to convert our TypeScript code (`.ts`, `.tsx`) into JavaScript that can be understood by browsers and Node.js. It also defines the strictness rules for the type-checking process, which helps us catch errors before the code is even run. This file is primarily for our application source code, while our build-related files use `tsconfig.node.json`.

#### Key Sections Explained

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

### Developer Guide - Rule 22.0: Understanding `tsconfig.node.json`

This guide explains the purpose of the `tsconfig.node.json` file and why it is separate from our main `tsconfig.json`.

#### What It Does

The `tsconfig.node.json` file is a dedicated TypeScript configuration used exclusively for our **build-time scripts**. This includes `forge.config.cts`, `webpack.main.config.cts`, and `webpack.renderer.config.cts`.

Its sole purpose is to tell `ts-node` (the tool Electron Forge uses to run these files) how to compile them into JavaScript that the Node.js environment can execute.

#### Why It's Separate from `tsconfig.json`

We need two separate configuration files because our project has two different JavaScript environments with conflicting module systems:

1.  **The Application Code (`src/`)**: This is our React application. It is written using modern **ES Modules** (`import`/`export`) and is eventually bundled by Webpack to run in the browser-like renderer process. It is configured by `tsconfig.json`.
2.  **The Build Scripts (`*.config.cts`)**: These scripts are run directly by Node.js during the build process. Node.js, in this context, expects **CommonJS** modules (`require`/`module.exports`). These scripts are configured by `tsconfig.node.json`.

#### Key Sections Explained

-   **`"compilerOptions": { ... }`**:
    -   **`"module": "CommonJS"`**: This is the most important setting. It instructs the TypeScript compiler to output CommonJS-style JavaScript, which is required for our build tools to function correctly.
    -   **`"moduleResolution": "node"`**: This tells TypeScript to use the classic Node.js algorithm for finding modules, which is appropriate for this environment.

-   **`"include": [ ... ]`**: This array explicitly lists which files should be compiled using these rules. By isolating our build configuration files here, we prevent them from being accidentally processed by the rules in our main `tsconfig.json`, which would cause the module system conflicts we've seen in the past.

This separation of concerns is critical for the stability of our build process.

---

### Developer Guide - Rule 23.0: Understanding `webpack.main.config.cts`

This guide explains the purpose of the `webpack.main.config.cts` file, which is the Webpack configuration specifically for Electron's **main process**.

#### What It Does

The main process is the Node.js backend of our Electron application. It's responsible for creating browser windows and handling all operating system interactions (like file I/O and native dialogs).

The `webpack.main.config.cts` file's job is to take our main process source code, which starts at `src/index.ts`, and bundle it into a single, optimized JavaScript file (`.webpack/main/index.js`). This bundled file is what Electron actually runs when the application starts.

#### Key Sections Explained

-   **`target: 'electron-main'`**: This is a crucial setting that tells Webpack to bundle the code for the Electron main process environment. It ensures that Node.js-specific features and Electron APIs are handled correctly and are not bundled in a way that would only work in a browser.

-   **`entry: './src/index.ts'`**: This tells Webpack where to start bundling. It will read `src/index.ts` and follow all of its `require` statements to build a complete dependency graph.

-   **`module: { rules: [...] }`**: This section defines how different types of files should be processed.
    -   **`ts-loader`**: The most important rule here tells Webpack to use `ts-loader` to compile all `.ts` and `.tsx` files it encounters. This is how our TypeScript code gets turned into JavaScript.

-   **`resolve: { ... }`**: This tells Webpack which file extensions to look for when resolving `require` or `import` statements (e.g., allowing us to write `require('./my-module')` instead of `require('./my-module.ts')`).

This file is essential for preparing our backend Node.js code to be run by Electron.

---

### Developer Guide - Rule 24.0: Understanding `webpack.renderer.config.cts`

This guide explains the purpose of the `webpack.renderer.config.cts` file, which is the Webpack configuration for Electron's **renderer process**.

#### What It Does

The renderer process is the user interface of our application—it's the "webpage" that runs inside the Electron window. The `webpack.renderer.config.cts` file's job is to take all the files that make up our UI (React `.tsx` files, `.css` files, images, etc.), starting from `src/renderer.tsx`, and bundle them into a single JavaScript file that can be loaded by our `index.html`.

This is where all of our React application code is processed.

#### Key Sections Explained

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

### Developer Guide - Rule 25.0: Understanding `.gitignore`

This guide explains the purpose of the `.gitignore` file and why it's critical for both a clean repository and user privacy.

#### What It Does

The `.gitignore` file is a simple text file that tells Git (our version control system) which files and directories it should intentionally ignore. Any file or folder listed in `.gitignore` will not be tracked by Git, meaning it won't be staged, committed, or pushed to the remote repository (like GitHub).

#### Key Ignored Directories

Our `.gitignore` file is configured to ignore several types of files and directories:

-   **`node_modules/`**: This directory contains all of our third-party dependencies. It can be very large and is not committed because it can be perfectly recreated by any developer simply by running `npm install`.

-   **`.webpack/`**: This is a temporary cache directory created by Webpack during the build process. It is specific to each developer's machine and should not be shared.

-   **`out/`**: This directory is created by Electron Forge when we run `npm run make`. It contains the final, packaged application installers. We only commit the source code, not the compiled output.

-   **Logs and System Files**: We also ignore various log files (`*.log`) and system-specific files (like `.DS_Store` on macOS) to keep the repository clean.

#### User Data, Backups, and Privacy

This is the most critical aspect of our `.gitignore` strategy.

**The user's data file (`config.json`) and all automatic and manual backups are NOT tracked by Git.**

These files are stored locally on the user's machine in the Electron `appData` directory (e.g., `C:\Users\YourUser\AppData\Roaming\overwhelmed` on Windows). This is intentional and crucial for the following reasons:

1.  **Privacy**: It prevents any user's personal task list, settings, or other data from ever being accidentally uploaded to a public or private repository.
2.  **Security**: It ensures that sensitive information that might be stored in tasks remains local to the user's machine.
3.  **Repository Cleanliness**: It keeps the Git history free of user-specific data, focusing only on the application's source code.

Because these files are not part of the repository, they are not included when a developer clones the project. The application will generate a fresh, empty `config.json` on its first run for a new user.

---

### Developer Guide - Rule 26.0: Understanding `index.html` and `index.css`

This guide explains the roles of our two core user interface files, `src/index.html` and `src/index.css`.

#### `index.html`: The Application Shell

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

#### `index.css`: Global Stylesheet

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

### Developer Guide - Rule 27.0: Understanding `src/index.ts` (The Main Process)

This guide explains the role of `src/index.ts`, which is the main process entry point for our Electron application. Think of it as the "backend" server that manages the application's lifecycle and all interactions with the user's operating system.

#### What It Does

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

### Developer Guide - Rule 28.0: Understanding `src/preload.ts` (The Preload Script)

This guide explains the role of `src/preload.ts`, which is a special script that runs in a unique, privileged environment before the renderer process (our React app) is loaded.

#### The Problem: Security and Context Isolation

For security reasons, modern Electron applications run with **Context Isolation** enabled. This means that the renderer process (the "webpage" part of the app) and the main process (the "Node.js backend") are completely isolated from each other. The renderer cannot directly access Node.js APIs or the user's filesystem.

This creates a problem: How does our React UI (renderer) ask the main process to do things like save a file or show a context menu?

#### The Solution: The Preload Script as a Secure Bridge

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

### Developer Guide - Rule 29.0: Understanding `src/renderer.tsx` (The Renderer Process)

This guide explains the role of `src/renderer.tsx`, which is the entry point for our application's **renderer process**. Think of it as the "frontend" of our application—it's the React code that runs inside the Electron window and is responsible for everything the user sees and interacts with.

#### What It Does

The `renderer.tsx` file contains our root React component, `<App />`. This single component is responsible for:

1.  **State Management**: It holds all of the application's primary state in memory using React hooks like `useState` and `useRef`. This includes the list of active tasks (`words`), completed tasks (`completedWords`), user settings (`settings`), and inbox messages (`inboxMessages`).

2.  **UI Rendering**: It renders all other components based on the current state. It contains the logic for switching between the "Meme View," "List View," and "Reports View," and it passes down the necessary data and functions as props to all child components (like `TaskAccordion`, `TabbedView`, `Checklist`, etc.).

3.  **Event Handling**: It contains the top-level event handlers for most user interactions, such as `handleCompleteWord`, `handleWordUpdate`, and `handleSaveProject`.

4.  **Communication with Main Process**: It uses `useEffect` hooks to set up listeners for messages coming *from* the main process (e.g., context menu commands, shutdown requests). It calls functions on the `window.electronAPI` object (exposed by `preload.ts`) to send requests *to* the main process.

#### The Data Flow

The renderer process follows a strict data flow:

1.  **Load**: On startup, it requests all persisted data from the main process via `window.electronAPI.getStoreValue`.
2.  **Hold in Memory**: It holds this data in React state.
3.  **Update in Memory**: As the user interacts with the app, the renderer updates its local state, causing the UI to re-render.
4.  **Request to Save**: When a save is triggered (manually, on auto-save, or on quit), the renderer sends its current state back to the main process via `window.electronAPI.setStoreValue` or a dedicated IPC channel.

The renderer process **never** directly accesses the filesystem or other native resources. It is a sandboxed web environment that communicates with the trusted main process (`src/index.ts`) via the secure bridge provided by the preload script (`src/preload.ts`).

---

### Developer Guide - Rule 30.0: Understanding `.webpack/main/index.js`

This guide explains the purpose of the `.webpack/main/index.js` file, which is a temporary build artifact and not part of our source code.

#### What It Is

The `.webpack/main/index.js` file is the **compiled and bundled JavaScript output** of our main process source code (`src/index.ts`).

#### How It's Created

1.  When you run `npm start`, Electron Forge invokes Webpack.
2.  Webpack reads its configuration from `webpack.main.config.cts`.
3.  It finds the entry point specified: `entry: './src/index.ts'`.
4.  It reads `src/index.ts` and all the files it `require`s, compiling all the TypeScript into standard JavaScript.
5.  It bundles all of that JavaScript into a single, optimized file: `.webpack/main/index.js`.

#### What It's Used For

This single file is what Electron actually executes to start the application's main process. The `"main"` property in our `package.json` points directly to it:

**File**: `package.json`
```json
"main": "./.webpack/main",

```
(Electron automatically looks for an index.js file inside that directory).

#### The Golden Rule
You should never edit this file directly. It is a temporary, machine-generated file that is completely overwritten every time you start or build the application.

Because it's a build artifact, the entire .webpack/ directory is (and should be) listed in our .gitignore file (see Rule 25.0).

---

### Developer Guide - Rule 31.0: Understanding `.webpack/main/index.js.map`

This guide explains the purpose of the `.webpack/main/index.js.map` file, which is a "source map" for our main process code.

#### What It Is

A source map is a special file that creates a mapping between the compiled, bundled JavaScript code (in `.webpack/main/index.js`) and the original TypeScript source code we wrote (in `src/index.ts` and its imports).

#### The Problem It Solves: Debugging Compiled Code

When we debug our application, the code that is actually running is the single, large `index.js` file. This file is machine-generated and can be very difficult to read and understand.

If an error occurred, the stack trace would point to a line number in this compiled file, which would be almost useless for finding the bug in our original, well-structured TypeScript code.

#### How It Works

The `.js.map` file contains all the information needed for debugging tools (like the one in VS Code or the browser's DevTools) to reverse-engineer the compiled code. When you set a breakpoint or an error occurs:

1.  The debugger sees the error at `index.js:12345`.
2.  It looks at the source map file (`index.js.map`).
3.  The source map tells the debugger, "Line 12345 in the compiled file actually corresponds to line 50 in `src/my-module.ts`."
4.  The debugger then shows you the error in the correct place in your original, readable source code.

This functionality is enabled by the `"sourceMap": true` option in our `tsconfig.json` file.

#### The Golden Rule

Like `.webpack/main/index.js`, this is a temporary, machine-generated file. It should **never be edited directly** and is correctly ignored by our `.gitignore` file.

---

### Developer Guide - Rule 32.0: Understanding `.webpack/renderer/main_window/index.html`

This guide explains the purpose of the `.webpack/renderer/main_window/index.html` file, which is a temporary build artifact and not part of our source code.

#### What It Is

This file is the **final, processed HTML output** that is loaded into the main application window. It is generated by Webpack using our `src/index.html` file as a template.

#### How It's Created

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
#### What It's Used For
This generated HTML file is the actual "webpage" that Electron loads to display our user interface. The mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY) call in src/index.ts points directly to this file.

#### The Golden Rule
Like all files in the .webpack directory, you should never edit this file directly. It is a temporary, machine-generated file that is completely overwritten on every build. It is correctly ignored by our .gitignore file.

---

### Developer Guide - Rule 33.0: Understanding `.webpack/renderer/main_window/index.js`

This guide explains the purpose of the `.webpack/renderer/main_window/index.js` file, which is a temporary build artifact and not part of our source code.

#### What It Is

This file is the **final, compiled, and bundled JavaScript output** of our entire React application. It contains all the code from `src/renderer.tsx` and every component and library it imports, all processed and optimized into a single file that the browser environment can execute.

#### How It's Created

1.  When you run `npm start`, Electron Forge invokes Webpack.
2.  Webpack reads its configuration from `webpack.renderer.config.cts`.
3.  It finds the entry point specified for the renderer: `entry: './src/renderer.tsx'`.
4.  It processes `renderer.tsx`, compiling all the JSX and TypeScript into JavaScript. It follows every `import` statement, bundling React, our components, CSS, images, and other dependencies into one large file.
5.  The final output is saved as `.webpack/renderer/main_window/index.js`.

#### What It's Used For

This file is the "application" that runs inside the `index.html` shell. The `<script>` tag that Webpack automatically injects into the generated `index.html` (see Rule 32.0) points directly to this file. When Electron loads the HTML, this script runs, and our React app comes to life.

#### The Golden Rule

Like all files in the `.webpack` directory, you should **never edit this file directly**. It is a temporary, machine-generated file that is completely overwritten on every build. It is correctly ignored by our `.gitignore` file.

---

### Developer Guide - Rule 34.0: Understanding `.webpack/renderer/main_window/preload.js`

This guide explains the purpose of the `.webpack/renderer/main_window/preload.js` file, which is a temporary build artifact and not part of our source code.

#### What It Is

This file is the **final, compiled JavaScript output** of our preload script source code (`src/preload.ts`).

#### How It's Created

1.  When you run `npm start`, Electron Forge invokes Webpack.
2.  Webpack's configuration in `forge.config.cts` defines a `preload` entry point pointing to `src/preload.ts`.
3.  Webpack uses `ts-loader` to compile the TypeScript code from `src/preload.ts` into standard JavaScript.
4.  The final output is saved as `.webpack/renderer/main_window/preload.js`.

#### What It's Used For

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

#### The Golden Rule

Like all files in the .webpack directory, you should never edit this file directly. It is a temporary, machine-generated file that is completely overwritten on every build. It is correctly ignored by our .gitignore file.

---

### Developer Guide - Rule 35.0: Understanding `node_modules`

This guide explains the purpose of the `node_modules` directory and our best practices for managing it.

#### What It Is

The `node_modules` directory is where `npm` (Node Package Manager) downloads and stores all the third-party code (packages) that our project depends on to function. This includes everything from our core framework, React, to our build tools, like Webpack and Electron Forge.

#### How It Works

1.  **`package.json`**: This file lists our project's **direct** dependencies. For example, it says we need `react` and `electron`. (See Rule 20.0).
2.  **`package-lock.json`**: This file is a detailed "lockfile" that records the **exact version** of every single package installed, including the dependencies of our dependencies (the "dependency tree"). This ensures that every developer has the exact same set of packages. (See Rule 19.0).
3.  **`npm install`**: When you run this command, `npm` reads `package-lock.json` and downloads all the specified packages into the `node_modules` directory.

#### What Needs to Be Done With It?

**Almost nothing.** The `node_modules` directory is entirely managed by `npm`.

-   **You should never edit files inside `node_modules` directly.** Any changes will be overwritten the next time `npm install` is run.
-   If you encounter strange build errors, the best practice is to delete the `node_modules` directory completely and run `npm install` again to get a fresh copy of all packages. (See Rule 15.0).

#### Why It's Ignored by Git

The `node_modules` directory can be very large (hundreds of megabytes) and contains thousands of files. We explicitly tell Git to ignore it for several key reasons:

1.  **Redundancy**: The entire directory can be perfectly and reliably recreated by anyone with our `package.json` and `package-lock.json` files just by running `npm install`.
2.  **Repository Size**: Committing `node_modules` would bloat our repository, making it extremely slow to clone and work with.
3.  **Noise**: It would create an enormous amount of noise in our commit history, making it difficult to see our actual source code changes.

Our `.gitignore` file contains the line `node_modules/`, which ensures this directory is never accidentally added to our version control history. (See Rule 25.0).

---

### Developer Guide - Rule 36.0: Committing Changes to GitHub

This guide outlines the standard workflow for committing and pushing code changes to the `main` branch of our GitHub repository. Following these steps ensures a clean and consistent version history.

#### The Workflow

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

### Developer Guide - Rule 37.0: Using the VS Code Source Control UI

This guide explains how to use the built-in Source Control panel in Visual Studio Code to commit and push changes to GitHub. This is a graphical alternative to the command-line workflow described in Rule 36.0.

#### The Workflow

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

### Developer Guide - Rule 38.0: Using Font Awesome Icons

This guide explains how to use Font Awesome icons in the application to ensure a consistent and professional UI, replacing plain text or emojis.

#### How It Works

We have included the Font Awesome 5 Free stylesheet in our global `index.css` file. This gives us access to a wide range of icons that can be easily added and styled.

```css
/* File: src/index.css */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');
```

---

#### Step 1: Find an Icon

1.  Go to the Font Awesome 5 Free Icons Gallery.
2.  Search for an icon that fits your need (e.g., "plus", "trash", "arrow-up").
3.  Click on the icon to see its details. The name you need is the part after `fa-` (e.g., for `fa-trash-alt`, the name is `trash-alt`).

---

#### Step 2: Add the Icon to Your Component

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

#### Step 3: Add Custom Styling (Optional)

We can add custom hover effects for icons inside specific buttons for better user feedback. Add a new rule to `index.css`.

**File**: `src/index.css`

```css
/* Make the 'broom' icon turn yellow on hover inside a .checklist-action-btn */
.checklist-action-btn:hover .fa-broom {
  color: #f4d03f !important;
}
```
---

### Developer Guide - Rule 39.0: Central Toast Notifications (`setCopyStatus`)

This guide clarifies the purpose of the `copyStatus` state and its setter function, `setCopyStatus`, which serves as the application's central toast notification system.

#### The History and Naming Convention

Originally, this state was created for a single purpose: to show a "Copied!" message when a user copied text. As the application grew, it became the quickest and most convenient way to provide feedback for *any* user action (e.g., "Project Saved!", "Task Completed!", "Cannot dismiss an important message.").

The name `setCopyStatus` is therefore a historical artifact. It should be interpreted as `setToastMessage`.

#### How It Works

1.  **State**: The `copyStatus` state is a simple string defined in the root `App` component:
    `const [copyStatus, setCopyStatus] = useState('');`

2.  **Rendering**: A toast notification is conditionally rendered at the bottom of the screen whenever `copyStatus` is not an empty string:
    `<div className="copy-status-toast">{copyStatus}</div>`

3.  **Usage**: To display a toast, call `setCopyStatus` with the desired message. To hide it, call it with an empty string, usually after a `setTimeout`.

    ```jsx
    setCopyStatus('This is my toast message!');
    setTimeout(() => setCopyStatus(''), 2000); // Hide after 2 seconds
    ```

#### Refactoring Goal

As part of our ongoing refactoring efforts (see `CHANGELOG.md`), this state and its related functions and components should eventually be renamed to something more descriptive, such as `toastMessage` and `setToastMessage`, to avoid confusion.

---

### Developer Guide - Rule 40.0: State Management for Tabbed Views (e.g., Inbox/Archive)

This guide explains the standard pattern for managing items that can exist in different states or views, such as the "Active" and "Archived" tabs in the Inbox.

#### The Problem: A Single Array is Inefficient

One way to implement an archive feature would be to use a single array for all messages and add a flag like `isArchived: boolean`. Then, for each view, we would filter the entire array:
-   Active View: `messages.filter(msg => !msg.isArchived)`
-   Archived View: `messages.filter(msg => msg.isArchived)`

While simple, this becomes inefficient as the number of messages grows. Filtering a large array on every render can lead to performance issues.

#### The Solution: Separate State Arrays

A more performant and scalable solution is to maintain separate state arrays for each view. This is the pattern we used for the Inbox Archive feature.

```typescript
const [inboxMessages, setInboxMessages] = useState<InboxMessage[]>([]);
const [archivedMessages, setArchivedMessages] = useState<InboxMessage[]>([]);
```

When a user archives a message, we perform two state updates: one to remove the item from the `inboxMessages` array and another to add it to the `archivedMessages` array. This way, each tab only needs to render its own, pre-filtered list, which is much more efficient. This pattern should be used for similar features in the future (e.g., an Inbox Trash).

---

### Developer Guide - Rule 41.0: Prefer Named Handlers for UI Actions
This guide establishes a best practice for handling user interactions in React components to improve code clarity and maintainability.

#### The Problem: Inline Logic in `onClick`
It is possible to write complex logic directly inside an `onClick` handler as an inline arrow function. While this works, it can make the JSX difficult to read and the logic harder to find and debug.

#### Less Readable:

```jsx
<button onClick={() => { if (window.confirm('Are you sure?')) { setState([]); setCopyStatus('Done.'); } }}>Do Thing</button>
```

#### The Solution: Extract Logic to Named Handlers
The preferred pattern is to extract all but the simplest logic into a named handler function within the component. This keeps the JSX clean and the logic centralized and easy to understand.

#### More Readable (Preferred):

```jsx
const handleDoThing = () => {
  if (window.confirm('Are you sure?')) {
    setState([]);
    setCopyStatus('Done.');
  }
};

<button onClick={handleDoThing}>Do Thing</button>
```
**Result**: This convention makes our components more predictable and easier to refactor in the future.

---

### Developer Guide - Rule 42.0: Creating Reusable Components and Helpers

This guide establishes the standard for creating new, reusable components and helper functions within a single file like `renderer.tsx`.

#### The Problem: Scope and Organization

As a file like `renderer.tsx` grows, it's tempting to define helper functions or small components inside the main `App` component. This can lead to two problems:
1.  **Scope Errors**: A component or function defined inside `App` is not accessible to other components outside of it, leading to `Cannot find name 'X'` errors.
2.  **Poor Readability**: Burying component definitions inside other components makes the file structure hard to follow.

#### The Solution: Define at the Top Level

The standard pattern is to define all reusable helper functions and components at the **top level of the file**, before the main `App` component that uses them.

---

### Developer Guide - Rule 43.0: The Electron Process Model (Main vs. Renderer)

This guide explains the fundamental architectural concept of Electron: the separation between the Main and Renderer processes. Understanding this is critical for security and for knowing where to implement new features.

#### The Main Process (The "Backend")

-   **File**: `src/index.ts`
-   **Environment**: Full Node.js.
-   **Responsibilities**:
    -   Manages the application's lifecycle (starting, quitting).
    -   Creates and manages all `BrowserWindow` instances.
    -   Has direct access to all of Electron's and Node.js's powerful APIs.
    -   Handles all interactions with the native operating system: creating native menus, showing file dialogs, accessing the filesystem (`fs`), etc.
-   **Security**: It is the only process trusted with direct access to the user's system.

#### The Renderer Process (The "Frontend")

-   **File**: `src/renderer.tsx`
-   **Environment**: A sandboxed Chromium browser environment.
-   **Responsibilities**:
    -   Renders the user interface (our React application).
    -   Handles all user interactions within the window (clicks, typing, etc.).
    -   **Does NOT** have direct access to Node.js APIs or the user's filesystem.

#### The Preload Script (The Secure Bridge)

-   **File**: `src/preload.ts`
-   **Environment**: A unique, privileged script that runs in the renderer process but *has access* to Node.js APIs.
-   **Responsibilities**:
    -   Acts as a secure bridge between the Main and Renderer processes.
    -   It uses `contextBridge.exposeInMainWorld` to expose a carefully selected, secure API to the renderer (`window.electronAPI`).
    -   The renderer calls functions on this API, which then use `ipcRenderer` to send messages to the main process, asking it to perform privileged actions.

This separation is why we define native menus in `index.ts` and trigger them from `renderer.tsx`—the renderer *requests* the menu, and the main process *creates* it.

---

### Developer Guide - Rule 44.0: Managing Unsaved State with `isDirty`

This guide explains the `isDirty` state management pattern, which is crucial for providing clear user feedback about unsaved changes and preventing data loss.

#### The `isDirty` State

-   **File**: `src/renderer.tsx`
-   **State**: `const [isDirty, setIsDirty] = useState(false);`
-   **Purpose**: A simple boolean flag in the renderer process that tracks whether the application's in-memory state has changed since the last save.

#### How It Works

1.  **Setting the State**: We use a `useEffect` hook for each major piece of state (`words`, `settings`, `inboxMessages`, etc.). When any of these change, the effect sets `isDirty` to `true`.
    ```typescript
    useEffect(() => {
      if (!isLoading) setIsDirty(true);
    }, [words, settings, inboxMessages, ...]);
    ```

2.  **Informing the Main Process**: A separate `useEffect` hook watches for changes to the `isDirty` flag. Whenever it changes, it immediately notifies the main process via a dedicated IPC channel.
    ```typescript
    useEffect(() => {
      window.electronAPI.notifyDirtyState(isDirty);
    }, [isDirty]);
    ```

3.  **Controlling the UI**: The `isDirty` state controls the appearance of the "Save Project" button, changing its color and text to visually indicate that there are unsaved changes.

4.  **Graceful Shutdown**: The main process (`src/index.ts`) keeps its own copy of the `isDirty` flag. This is critical because it allows the main process to know whether to show the "Save and Quit" dialog **without** having to asynchronously ask the renderer first. This makes the shutdown process faster and more reliable. See Rule 09.0 for more on the shutdown sequence.

### Resetting the State

The `isDirty` flag is set back to `false` only after a successful save operation, either through a manual save (`handleSaveProject`) or an auto-save.

---

### Developer Guide - Rule 45.0: The Auto-Save Timer

This guide explains the periodic auto-save feature, which provides a crucial safety net against data loss from unexpected application crashes or power failures.

#### How It Works

The auto-save system is driven by a single `useEffect` hook in the main `App` component (`src/renderer.tsx`).

1.  **The Countdown**: A state variable, `autoSaveCountdown`, is initialized to `300` seconds (5 minutes). A `setInterval` decrements this counter every second, and the remaining time is displayed in the UI.

2.  **The Trigger**: When the countdown reaches zero, it checks the `isDirty` flag (see Rule 44.0).
    -   If `isDirty` is `true`, it means there are unsaved changes. The renderer sends the entire application state to the main process via the `auto-save-data` IPC channel. The main process then writes the data to `config.json`.
    -   If `isDirty` is `false`, no save operation is performed, as the data on disk is already up-to-date.

3.  **The Reset**: After the 5-minute interval, the countdown timer is reset back to `300` seconds, and the cycle begins again. The timer is also reset whenever a user performs a manual save.

### The `auto-save-data` IPC Channel

-   **File**: `src/index.ts`
-   **Handler**: `ipcMain.on('auto-save-data', ...)`
-   **Purpose**: This is a dedicated, one-way "fire-and-forget" channel. The renderer sends its data, and the main process handles the save operation in the background without sending a confirmation back. This ensures the auto-save process is lightweight and does not interfere with the user's workflow.

---

### Developer Guide - Rule 46.0: The `TaskAccordionHeader` Component

This guide explains the purpose of the `TaskAccordionHeader` component, which was created to solve UI complexity and improve code modularity in the task list.

#### The Problem: A Complex and Cluttered Header

Originally, the title area of the `TaskAccordion` was built directly inside the main `.map()` loop in the `App` component. It contained complex JSX with conditional logic for displaying:
-   The task title.
-   Parent and child category pills.
-   The priority indicator.
-   The "Time Open" pill.
-   The "Due Date" and "Time Left" pills.

This made the main render loop in `App.tsx` very cluttered, hard to read, and difficult to maintain.

#### The Solution: A Dedicated Component

We refactored this entire block of JSX into its own dedicated component, `TaskAccordionHeader`.

**File**: `src/renderer.tsx`
```jsx
<TaskAccordion
  title={
    <TaskAccordionHeader
      word={word}
      settings={settings}
      onCategoryClick={...}
    />
  }
  // ... other props
>
```

#### Why This Works

-   **Modularity**: It isolates the complex logic for rendering the header into a self-contained unit, making it easier to manage and modify in the future.
-   **Readability**: It dramatically cleans up the main `TaskAccordion` component in the list view, making the parent component's structure much easier to understand at a glance.
-   **Reusability**: While currently only used in one place, it follows the best practice of creating small, single-responsibility components.

---

### Developer Guide - Rule 47.0: The `Dropdown` Component

This guide explains the `Dropdown` component, a simple, reusable component created to de-clutter UI action areas.

#### The Problem: Too Many Buttons

The task action controls in the list view were becoming cluttered with individual buttons for each recurring task option (Daily, Weekly, Monthly, etc.). This took up too much space and was not scalable.

#### The Solution: A Reusable Hover-Triggered Dropdown

We created a generic `Dropdown` component that displays its children in a menu when a `trigger` element is hovered over.

**File**: `src/renderer.tsx`
```jsx
<Dropdown trigger={
  <button title="Recurring Options" className="icon-button">
    <i className="fas fa-sync-alt"></i>
  </button>
}>
  <button onClick={...}>Repeat Daily</button>
  <button onClick={...}>Repeat Weekly</button>
</Dropdown>
```

#### Why This Works

-   **Reusability**: It's a simple, presentational component that can be used anywhere in the application to create a hover-triggered menu.
-   **UI Cleanup**: It consolidates multiple actions into a single, clean icon, saving valuable screen space and making the UI less overwhelming.

---

### Developer Guide - Rule 48.0: Handling Events on Nested Elements

This guide explains how to resolve event propagation conflicts, particularly with `onContextMenu`.

#### The Problem: Conflicting Context Menus

We had a bug where right-clicking a hyperlink (`<a>`) inside a task's description would incorrectly trigger the parent's context menu (the "Task" menu) instead of a "Copy Link" menu.

This happens because when you right-click the link, the event "bubbles up" from the child (`<a>` tag) to the parent (`<div>`). If both have `onContextMenu` listeners, the parent's might fire unexpectedly.

#### The Solution: `e.stopPropagation()` and Specific Targeting

The solution is to handle the event at the most specific level possible and stop it from bubbling up.

```jsx
<div className="description-container" onContextMenu={(e) => {
  const target = e.target as HTMLElement;
  // If the click was on a link, handle it here and stop.
  if (target.tagName === 'A') {
    e.preventDefault();
    e.stopPropagation(); // CRITICAL: Stop the event from bubbling to the parent.
    // ... logic to show link-specific menu
  } else {
    // Otherwise, let the event bubble up or handle the parent's menu here.
    handleTaskContextMenu(e);
  }
}}>
  <p>Some text with <a href="...">a link</a> inside.</p>
</div>
```

---

### Developer Guide - Rule 49.0: Prefer `outline` for Hover Effects on Interactive Items

This guide explains a subtle UI/UX best practice for hover effects.

#### The Problem: `background-color` on Hover Can Be Misleading

Originally, hovering over an inbox item would change its `background-color`. However, this caused a UX issue with the "Important" star icon. When the star was toggled (turning it yellow), the background hover color would visually interfere, making it hard to see the result of the click.

#### The Solution: Use `outline` Instead

By changing the hover effect from `background-color` to a subtle `outline`, we provide clear visual feedback for the hover state without affecting the content *inside* the item. This ensures that the state changes of interactive elements within the item (like the star icon) are always clearly visible to the user.

```css
.inbox-item.clickable:hover {
  /* background-color: #3a3f4b;  <-- Old way */
  outline: 1px solid #4a4f5b; /* <-- New, better way */
}
```
---

### Developer Guide - Rule 50.0: State Management for Modals Editing Nested Data

This guide explains the standard pattern for handling modals that need to modify a specific, deeply nested piece of data.

#### The Problem: Where Should Modal/Editing State Live?

We needed a modal (`PromptModal`) to edit the `response` or `note` of a `ChecklistItem`. The challenge is that the `ChecklistItem` is deeply nested: `words` -> `Word` -> `checklist` -> `ChecklistSection` -> `ChecklistItem`.

If the modal's state (e.g., `isOpen`) were managed by a low-level component, it would be very difficult to pass the final edited data all the way back up to the root `App` component, which is the single source of truth for the `words` array. This same principle applies to non-modal, in-place editing state.

#### The Solution: Lift State Up (Even for In-Place Editing)

The correct pattern is to "lift" the state required to manage the editing context up to the nearest common ancestor component that owns the data being modified.

Initially, we used a `PromptModal` for editing notes/responses, and the state for that modal (`isChecklistPromptOpen`, `editingChecklistItem`) lived in the main `App` component. We have since refactored this to a much better user experience: **in-place editing**.

The state for this in-place editing (`editingNoteForItemId`, `editingResponseForItemId`) still follows the "lift state up" pattern, but it lives in the `Checklist` component itself. This is the ideal location because the `Checklist` component is the "nearest common ancestor" that manages all its items and can efficiently handle the re-render for a single item switching into an editable state.

```ts
// In the Checklist component (src/renderer.tsx)

// 1. State for the in-place editing is defined in the component that owns the list.
const [editingResponseForItemId, setEditingResponseForItemId] = useState<number | null>(null);
const [editingNoteForItemId, setEditingNoteForItemId] = useState<number | null>(null);

// 2. The event to start editing is triggered from a deep child (context menu or button).
//    It calls a handler that sets the state in the `Checklist` component.
const handleEditNote = (itemId) => {
  setEditingNoteForItemId(itemId);
};

// 3. The component uses conditional rendering to show an <input> for the specific item.
items.map(item => (
  editingNoteForItemId === item.id 
    ? <input autoFocus onBlur={() => setEditingNoteForItemId(null)} /> 
    : <span>{item.note}</span>
))
```
---

### Developer Guide - Rule 51.0: Formatting Text for Clipboard

This guide establishes the standard for formatting any application data that is copied to the user's clipboard.

#### The Goal: Readability and Compatibility

When a user copies content (like a checklist or a report), the primary goal is to produce a clean, human-readable, plain-text string that can be pasted into any other application (e.g., an email, a text document, a messaging app) without formatting issues.

#### The Problem: HTML is Unreliable

While copying raw HTML can preserve rich formatting like colors and font sizes, it is unreliable. Many applications do not interpret pasted HTML correctly, resulting in broken layouts, un-styled text, or visible HTML tags, which provides a poor user experience.

#### The Solution: Plain Text with Simple Formatting

All "copy" functions should generate a plain text string using standard characters for formatting.

-   **Use Indentation**: Use spaces or tabs to create a clear visual hierarchy (e.g., indenting checklist items under their section title).
-   **Use Punctuation for Lists**: Use standard list markers like hyphens (`-`), asterisks (`*`), or bullets (`•`) for list items.
-   **Indicate State with Brackets**: For items with a state (like a completed checklist item), use bracketed characters like `[✔]` for complete and `[✗]` or `[ ]` for incomplete. Avoid using strikethrough text, as it can be hard to read when pasted.
-   **Exclude Internal Notes**: Private or internal-only fields (like a checklist item's `note`) should always be excluded from the copied text. Publicly visible fields (like a `response`) should be included.
---

### Developer Guide - Rule 52.0: Atomic State Updates for Looping Tasks

This guide explains the complex state management required to correctly maintain a loop between two or more re-occurring tasks.

#### The Problem: Broken Links in Re-occurring Loops

We encountered a bug with the "Alternating Tasks" feature where a loop between two re-occurring tasks would break after one cycle.

1.  **Task A** (re-occurring) completes and starts **Task B**.
2.  **Task B** (re-occurring) completes and starts **Task A**.

When Task A was completed, a *new* Task A was created with a *new ID*. However, Task B was still linked to the *old, completed* Task A's ID. When Task B was subsequently completed, it could not find its successor, and the loop was broken.

This was caused by performing state updates in separate, non-atomic `setWords()` calls. The logic that created the new re-occurring task was separate from the logic that updated the successor task, and the latter did not have access to the newly created task's ID.

#### The Solution: A Single, Atomic State Update

The definitive solution is to perform all related state changes within a single, atomic `setWords()` call. This ensures all parts of the logic have access to the necessary data within the same scope.

**File**: `src/renderer.tsx` (inside `handleCompleteWord`)
```ts
let newRecurringTask: Word | null = null;
// ... logic to prepare the newRecurringTask object ...

setWords(prevWords => {
  let newWords = prevWords.map(w => {
    // ... logic to find and update the successor task ...
    if (w.startsTaskIdOnComplete === wordToComplete.id && newRecurringTask) {
      // CRITICAL: Update the successor to point to the NEW task's ID.
      updatedSuccessor.startsTaskIdOnComplete = newRecurringTask.id;
    }
    return updatedSuccessor;
  });

  // Add the new recurring task to the array in the same operation.
  if (newRecurringTask) {
    newWords = [newRecurringTask, ...newWords];
  }
  return newWords;
});

```
---

### Developer Guide - Rule 53.0: Understanding Event Propagation (Bubbling)

This guide explains the concept of "event bubbling" and how to control it, which is critical for handling events on nested elements.

#### The Problem: Unexpected Parent Handlers Firing

We encountered a bug where right-clicking a `ChecklistItem` (which has its own context menu) was also trying to trigger the context menu of the parent `ChecklistSection`. This happened because of a browser behavior called **event bubbling**.

When an event (like a click or right-click) occurs on an element, the browser doesn't just fire the event on that specific element. It then "bubbles up" to the element's parent, then to the parent's parent, and so on, all the way up to the `document` root. If any of those parent elements also have a listener for the same event, they will fire too.

**Example Scenario:**
```html
<div onContextMenu={handleSectionMenu}> <!-- Parent: Checklist Section -->
  <div onContextMenu={handleItemMenu}>   <!-- Child: Checklist Item -->
    Click Me
  </div>
</div>
```
When you right-click "Click Me", the browser does the following:
1.  Fires `handleItemMenu` on the child `div`.
2.  **Bubbles up** to the parent `div`.
3.  Fires `handleSectionMenu` on the parent `div`.

This caused the "flickering" we saw, as both menus were trying to open and were canceling each other out.

#### The Solution: `event.stopPropagation()`

To fix this, you can call `event.stopPropagation()` inside the child's event handler. This tells the browser to handle the event on the specific element that was clicked and to **stop the bubbling process**, preventing the event from ever reaching the parent elements.

**Correct Implementation:**
```jsx
// In the child element's event handler (e.g., the Checklist Item)
onContextMenu={(e) => {
  e.preventDefault(); // Always prevent the default browser menu
  e.stopPropagation(); // CRITICAL: Stop the event from bubbling up.
  
  // Now, only this element's logic will run.
  window.electronAPI.showChecklistItemContextMenu(...);
}}
```
By using `stopPropagation()`, we ensure that only the most specific event handler is executed, creating predictable and bug-free user interactions.

---

### Developer Guide - Rule 54.0: State Management for In-Place Editing

This guide explains the standard pattern for allowing a user to edit a single item directly within a list, without switching the entire view to an "edit mode." We implemented this for checklist items.

#### The Problem: How to Edit One Item in a Read-Only View?

We needed to allow users to edit a checklist item's text directly from the read-only "Task" view. This required a way to switch just one specific item into an editable `<input>` field while the rest of the list remained as static text.

#### The Solution: Dedicated State for Editing Context

The solution is to use dedicated state variables in the component to track the "editing context."

1.  **`editingItemId: number | null`**: This state variable stores the `id` of the item currently being edited. If it's `null`, no item is in edit mode.
2.  **`editingItemText: string`**: This state variable holds the current text value for the input field. This prevents the main data source from being updated on every single keystroke, which would be inefficient.

When a user triggers the "Edit Item" action (e.g., from a context menu), we set `editingItemId` to that item's ID and populate `editingItemText` with its current text. This causes React to re-render and display the input field for just that one item.

```jsx
// File: src/renderer.tsx (inside the Checklist component)

// 1. State to track the editing context
const [editingItemId, setEditingItemId] = useState<number | null>(null);
const [editingItemText, setEditingItemText] = useState('');

// ... inside the component's return ...
{section.items.map(item => (
  <div key={item.id}>
    {/* 2. Conditional rendering based on the editing context */}
    {editingItemId === item.id ? (
      // If this is the item being edited, render an input
      <input
        type="text"
        value={editingItemText}
        onChange={(e) => setEditingItemText(e.target.value)}
        onBlur={() => {
          // 3. On blur or Enter, call the main update handler
          handleUpdateItemText(section.id, item.id, editingItemText);
          // 4. Clear the editing context to switch back to view mode
          setEditingItemId(null);
        }}
        autoFocus
      />
    ) : (
      // Otherwise, render the static text view
      <span>{item.text}</span>
    )}
  </div>
))}

```

---

### Developer Guide - Rule 55.0: Creating Stable Hover-Action Menus

This guide explains how to create a common UI pattern: a set of action buttons that appear on hover over a list item, without causing the layout to shift when the actions add new content.

#### The Problem: Layout Shift on Hover Actions

We implemented a "quick actions" menu for checklist items that appears on hover. However, when an action (like "Add Note") added a new element to the DOM, it would increase the height of the main item container. This pushed the action buttons down, moving them out from under the user's cursor and causing them to disappear, which is a frustrating user experience.

#### The Solution: Separate the Stable and Growing Content

The solution is to structure the JSX so that the main interactive row (which contains the hover-triggered actions) is in a separate container from the content that can grow or shrink.

#### Why This Works

-   The `checklist-item-main-content` `div` has a stable height. The `checklist-item-quick-actions` are part of this stable row, so their position is never affected by content changes.
-   When a note or response is added, it appears *below* the main row. This pushes the *next* checklist item in the list down, but it does not change the layout of the current item's action buttons, which remain fixed under the user's cursor.

```jsx
// File: src/renderer.tsx
// Inside the .map() loop for each checklist item

<div className="checklist-item">
  {/* 1. The Main, Stable Row */}
  <div className="checklist-item-main-content">
    {/* Checkbox, item text, due date, etc. go here */}
    <label>...</label>

    {/* The hover menu is INSIDE the stable row */}
    <div className="checklist-item-quick-actions">
      <button>Edit</button>
      <button>Add Note</button>
    </div>
  </div>

  {/* 2. The Dynamic, Growing Content */}
  {/* The note and response fields are OUTSIDE the main row */}
  {item.note && <div className="checklist-item-note">...</div>}
  {item.response && <div className="checklist-item-response">...</div>}
</div>
```

---

### Developer Guide - Rule 56.0: Component Definition and Re-Renders

This guide explains a critical React performance principle: **never define a component inside the render function of another component.**

#### The Problem: Constant Re-Renders and State Loss

We observed that our `Footer` component was flickering in the React DevTools, indicating it was re-rendering on every single state change in the main `App` component (e.g., every second from the clock update).

This was happening because the `Footer` component was defined *inside* the `App` function. Every time `App` re-renders due to a state change, the `Footer` function is re-declared from scratch. From React's perspective, this "new" `Footer` is a completely different component type than the previous one. This forces React to unmount the old `Footer` and mount a new one, which is inefficient and can cause issues like losing internal state or triggering unnecessary effects.

#### The Solution: Define Components at the Top Level

The solution is to move the component definition outside of the parent component. This makes it a stable, reusable component that React recognizes as the same entity across renders.

For stateless components or components that only re-render when their props change, we can also wrap them in `React.memo` for an additional performance optimization. By following this pattern, the `Footer` component is only defined once. It will no longer re-render unnecessarily when the `App` component's state changes, fixing the performance issue.

```jsx
// The correct pattern

// 1. Define the component at the top level, outside of App.
// 2. Wrap it in React.memo to prevent re-renders if props don't change.
const Footer = React.memo(() => {
  // ... footer JSX ...
});


function App() {
  // ... all the App's state and logic ...

  return (
    <div>
      {/* ... other components ... */}
      <Footer />
    </div>
  );
}
```
---

### Developer Guide - Rule 57.0: Creating Focused Context Menus for Nested Elements

This guide explains how to create a specific context menu for a child element that is different from its parent's context menu. This is an application of `Rule 53.0: Understanding Event Propagation (Bubbling)`.

#### The Problem: Inheriting the Wrong Context Menu

We have a `ChecklistItem` component that has a context menu for managing the entire item. Inside this item, we have `note` and `response` fields. When a user right-clicked on the note, it would incorrectly show the context menu for the whole item, which was confusing. We wanted a smaller, more focused menu with only "Copy Note" and "Delete Note" actions.

#### The Solution: A Specific Handler with `stopPropagation`

The solution is to add a new, dedicated `onContextMenu` handler to the specific child element (the `note` or `response` `div`). This handler will:
1.  Call a new, dedicated IPC channel (e.g., `show-checklist-note-context-menu`).
2.  Crucially, call `event.stopPropagation()` to prevent the event from "bubbling up" to the parent `ChecklistItem` and triggering its context menu as well.

```jsx
// File: src/renderer.tsx

// The parent element has its own context menu
<div className="checklist-item-interactive-area" onContextMenu={handleItemMenu}>

  {/* ... other item content ... */}

  {/* The child element gets its OWN context menu handler */}
  <div className="checklist-item-note" onContextMenu={(e) => {
    e.preventDefault();
    // CRITICAL: This stops the parent's `handleItemMenu` from firing.
    e.stopPropagation(); 
    // Call the new, specific channel for the note menu.
    window.electronAPI.showChecklistNoteContextMenu(...);
  }}>
    <strong>Note:</strong> {item.note}
  </div>

</div>
```
---

### Developer Guide - Rule 58.0: Prop Drilling

This guide explains the concept of "prop drilling" and the standard pattern for resolving it in our application.

#### The Problem: `Cannot find name 'settings'`

We encountered an error, `Cannot find name 'settings'`, when we tried to use the `settings` object inside our new `ClickableText` component. This happened because:
1.  The `settings` state lives in the top-level `App` component.
2.  The `ClickableText` component is rendered deep inside the component tree (`App` -> `TabbedView` -> `Checklist` -> `ClickableText`).
3.  The intermediate components (`TabbedView` and `Checklist`) did not receive the `settings` object as a prop, so they could not pass it down.

This process of passing props down through multiple layers of components is known as **prop drilling**.

#### The Solution: Pass Props Through the Component Tree

The solution is to explicitly pass the required prop through each intermediate component in the chain.

1.  **Identify the Path**: Trace the component hierarchy from the parent that owns the state (`App`) to the child that needs it (`ClickableText`).
2.  **Update Each Component**: For each component in the path (`TabbedView`, `Checklist`), add the prop to its props interface and pass it along.

This ensures that the data is available where it's needed and resolves the "Cannot find name" error. While more advanced state management libraries can mitigate prop drilling, for our current architecture, this is the standard and correct pattern to follow.

---

### Developer Guide - Rule 59.0: Switch Statement Fall-Through

This guide explains a common and critical bug in JavaScript `switch` statements known as "fall-through" and how to prevent it.

#### The Problem: Missing `break` Statement

We had a bug where using the "Move Down" action on a checklist item would crash the application, even though the logic for moving the item was correct.

The issue was in our `checklist-item-command` handler's `switch` statement:
```javascript
// The incorrect pattern
switch (command) {
  case 'move_up':
    // ... logic to move item up ...
    break; // This case correctly exits.
  
  case 'move_down':
    // ... logic to move item down ...
    // !!! BUG: Missing break statement !!!
  
  case 'edit_response':
    // ... logic to handle editing a response ...
    break;
}
```

In JavaScript, if a case block does not end with a break or return statement, execution will fall through to the next case block and execute its code as well. In our bug, after successfully moving the item down, the code would fall through and incorrectly try to run the logic for edit_response, causing a crash.

#### The Solution: Always Terminate a case

The solution is to ensure that every case block that is not intentionally designed to fall through is explicitly terminated.

```javascript
// The correct pattern
switch (command) {
  // ...
  case 'move_down':
    // ... logic to move item down ...
    break; // CORRECT: This now exits the switch statement.
  // ...
}
```
---

### Developer Guide - Rule 60.0: Synchronizing `Checklist` State with `updateHistory`

This guide explains a critical state management pattern within the `Checklist` component that is necessary to prevent infinite re-render loops.

#### The Problem: Stale Local History vs. New Props

The `Checklist` component maintains its own internal `history` state array to manage its local Undo/Redo functionality. When a handler function inside the `Checklist` component modifies the checklist data (e.g., `handleDeleteAllNotes`), it does two things:

1.  It calculates the new state of the checklist (`newSections`).
2.  It calls `onUpdate(newSections)` to pass this new state up to the parent `App` component.

The `App` component then updates its master `words` state, which flows back down to the `Checklist` component as new props.

The bug occurs if the handler **only** calls `onUpdate` without also updating its own internal `history` state. When the `Checklist` component re-renders with the new props, its internal `history` is now out of sync with the data it's receiving. This discrepancy can trigger other `useEffect` hooks within the component that try to reconcile the state, leading to an infinite re-render loop that freezes the UI.

#### The Solution: Always Call `updateHistory` with `onUpdate`

The rule is simple: **Any function inside the `Checklist` component that modifies the checklist data and calls `onUpdate` MUST also call `updateHistory` with the exact same new data.**

This ensures that the component's internal state and its incoming props are always synchronized, preventing the re-render loop.

#### Example

```tsx
// Incorrect (Buggy):
const handleDeleteAllNotes = () => {
  // ... confirmation logic ...
  const newSections = ...;
  onUpdate(newSections); // BUG: The local history is now stale.
};

// Correct:
const handleDeleteAllNotes = () => {
  // ... confirmation logic ...
  const newSections = ...;
  updateHistory(newSections); // CORRECT: The local history is updated first.
  onUpdate(newSections);
};

```
---

### Developer Guide - Rule 61.0: Avoiding Native Modals for Confirmations and Actions

This guide explains why we must avoid using native, blocking browser modals (`window.confirm()`, `window.alert()`, `window.prompt()`) and instead use custom, in-app UI components for user confirmations.

#### The Problem: Focus-Stealing and UI Freezes

Native modals are problematic in an Electron/React application for a critical reason: **they steal focus from the application window**.

1.  **Blocking Execution**: When `window.confirm()` is called, it pauses all JavaScript execution in the renderer process and hands control over to the operating system to display the dialog.
2.  **Focus Hijacking**: The OS dialog becomes the focused element. When the user clicks "OK" or "Cancel," focus is returned to the application's top-level window, not to any specific element within it.
3.  **The Race Condition**: If a significant React state update and re-render is triggered in the same synchronous block of code immediately after the dialog closes, a race condition occurs. The browser's rendering engine can get "stuck" trying to process the re-render while also handling the return of window focus. This results in the UI becoming unresponsive to clicks and focus events, requiring a window focus reset (like alt-tabbing) to fix.

While we have used `setTimeout(..., 0)` as a patch for this in the past, it is a workaround, not a robust solution.

#### The Solution: In-App, State-Driven Confirmations

The standard pattern is to build the confirmation flow directly into the UI using React state. This keeps the entire interaction within our application's control, providing a seamless user experience and completely avoiding focus-related bugs.

The "two-click delete" pattern is our primary implementation of this:
1.  A component maintains a local state, e.g., `const [isConfirming, setIsConfirming] = useState(false);`.
2.  The first click on a button sets `isConfirming` to `true`.
3.  The UI conditionally renders a different button style or text (e.g., "Are you sure?") based on the `isConfirming` state.
4.  A second click on the button (while in the confirming state) executes the destructive action.
5.  A `setTimeout` is used to automatically revert the button to its normal state if the user doesn't confirm within a few seconds.

This approach is safer, more reliable, and provides a better user experience.

#### Example
```tsx
// --- INCORRECT: Avoid this pattern ---
const handleDelete = () => {
  if (window.confirm('Are you sure?')) {
    // This state update can cause the UI to freeze.
    performDestructiveAction();
  }
};

// --- CORRECT: Use this state-driven pattern ---
function MyComponent() {
  const [isConfirming, setIsConfirming] = useState(false);
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDeleteClick = () => {
    if (isConfirming) {
      // 2. Second click: perform the action.
      performDestructiveAction();
      setIsConfirming(false);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    } else {
      // 1. First click: enter confirmation state.
      setIsConfirming(true);
      // 3. Set a timeout to automatically cancel confirmation.
      confirmTimeoutRef.current = setTimeout(() => setIsConfirming(false), 3000);
    }
  };

  return (
    <button
      onClick={handleDeleteClick}
      className={isConfirming ? 'confirm-delete' : ''}
    >
      {isConfirming ? 'Sure?' : 'Delete'}
    </button>
  );
}
```
---

### Developer Guide - Rule 62.0: Maintaining the IPC Contract for Type Safety

This guide explains how to prevent and resolve TypeScript errors related to Inter-Process Communication (IPC) payloads.

#### The Problem: Payload Mismatches

We encountered an error where an object we passed to an `electronAPI` function did not match the type definition in the `Window` interface.

`Argument of type '{...}' is not assignable to parameter of type '{...}'. Type '{...}' is missing the following properties: ...`

This happens when the "contract" between the renderer and the main process is broken. This contract has three parts that must always be kept in sync:

1.  **The Interface (Renderer)**: The TypeScript type definition in `renderer.tsx` that defines the shape of the payload.
2.  **The Invocation (Renderer)**: The actual object passed to the `window.electronAPI` function call.
3.  **The Handler (Main Process)**: The `ipcMain.on` handler in `index.ts` that receives and destructures the payload.

If you add a property to the interface, you must also add it to the object you're sending.

#### The Solution: Keep the Contract Synchronized

Always treat these three parts as a single unit. When you modify one, you must check the other two.

##### 1. The Interface Definition (`renderer.tsx`)
This is the source of truth for the payload's shape.

##### 2. The Invocation in the UI (`renderer.tsx`)
The object being passed must now include the new properties.

##### 3. The Handler in the Main Process (`index.ts`)
The main process handler should be updated to receive and use the new properties.

```tsx
// 1. The Interface Definition (renderer.tsx)
showChecklistMainHeaderContextMenu: (payload: { 
  wordId: number, 
  isNotesHidden: boolean, // Added this property
  isResponsesHidden: boolean, // Added this property
  x: number, 
  y: number 
}) => void;

```
```tsx
// 2. The Invocation in the UI (renderer.tsx)
window.electronAPI.showChecklistMainHeaderContextMenu({
  wordId,
  isNotesHidden: !settings.showChecklistNotes, // Must add this
  isResponsesHidden: !settings.showChecklistResponses, // Must add this
  x: e.clientX, 
  y: e.clientY
});
```
```tsx
// 3. The Handler in the Main Process (index.ts)
ipcMain.on('show-checklist-main-header-context-menu', (event, payload) => {
  const { wordId, isNotesHidden, isResponsesHidden, x, y } = payload; // Destructure new properties
  const template = [
    {
      label: isNotesHidden ? 'Show All Notes' : 'Hide All Notes',
      // ... use the new properties
    },
    // ...
  ];
  // ...
});
```

---

### Developer Guide - Rule 63.0: Child-to-Parent State Updates via Callback Props

This guide explains the standard React pattern for allowing a child component to update state that lives in a parent component, which is essential for avoiding "prop drilling" errors like `Cannot find name 'setState'`.

#### The Problem: Child Components Cannot Directly Modify Parent State

We encountered an error where the `Checklist` component tried to call `setSettings`, but `setSettings` only exists in the parent `App` component. A child component has no direct access to its parent's state or state-setter functions.

#### The Solution: "Props Down, Events Up"

The correct pattern is to pass a **callback function** from the parent to the child as a prop. The child then calls this function to "request" a state change from the parent.

##### Step 1: Define the Callback Handler in the Parent (`App.tsx`)

The parent component defines a function that knows how to update its own state.

##### Step 2: Pass the Handler Down as a Prop

The parent passes this function down to the child component as a prop (e.g., `onSettingsChange`).

##### Step 3: The Child Calls the Prop to Request a Change

The child component receives `onSettingsChange` as a prop and calls it whenever it needs to update the parent's state. It passes the desired changes as an argument.

This pattern maintains a clear, one-way data flow and is the standard way to manage state between parent and child components in React.

```tsx
// Step 1: Define the Callback Handler in the Parent (App.tsx)
const handleSettingsChange = (newSettings: Partial<Settings>) => {
  setSettings(prev => ({ ...prev, ...newSettings }));
};

```
```tsx
// Step 2: Pass the Handler Down as a Prop
// In the App component's return statement
<Checklist
  // ... other props
  onSettingsChange={handleSettingsChange}
/>
```
```tsx
// Step 3: The Child Calls the Prop to Request a Change
function Checklist({ onSettingsChange, ... }) {
  // ...
  const handleSomeAction = () => {
    // Instead of trying to call setSettings directly...
    // ...we call the function passed down from the parent.
    onSettingsChange({ showChecklistNotes: false });
  };
  // ...
}
```
---

### Developer Guide - Rule 64.0: The `useEffect` Dependency Array and Stale Closures

This guide explains the importance of the `useEffect` dependency array for preventing bugs caused by "stale closures."

#### The Problem: Functions Using Outdated State

We created a new handler function (`handleMainHeaderCommand`) inside a `useEffect` hook in the `Checklist` component. This handler needed to access props like `settings`, `words`, and `onSettingsChange`.

If we don't tell React that our effect *depends* on these props, a subtle but critical bug occurs:
1.  The component renders for the first time, and the `useEffect` runs. It creates the `handleMainHeaderCommand` function, which "closes over" the initial values of `settings`, `words`, etc.
2.  Later, the parent `App` component updates the `settings` state.
3.  The `Checklist` component re-renders with the new `settings` prop, but the `useEffect` **does not run again** because its dependency array is empty (`[]`).
4.  When a user triggers the context menu, the old `handleMainHeaderCommand` function is called. It is still referencing the **stale, initial** value of `settings`, not the new one. This leads to incorrect behavior.

#### The Solution: Declare All Dependencies

The rule is simple: **Any prop or state variable from the component's scope that is used inside a `useEffect` hook (or any function defined inside it) MUST be included in the dependency array.**

By including them in the array, we tell React to re-create the `useEffect` (and the `handleMainHeaderCommand` function inside it) whenever any of those dependencies change. This ensures the handler always has access to the latest, freshest props and state.

```tsx
// In the Checklist component
useEffect(() => {
  const handleMainHeaderCommand = (payload) => {
    // This function USES `onSettingsChange`, `settings`, and `words`.
    if (payload.command === 'edit' && payload.wordId) {
      const targetWord = words.find(w => w.id === payload.wordId);
      if (targetWord) {
        onSettingsChange({ openAccordionIds: [...settings.openAccordionIds, payload.wordId] });
      }
    }
  };

  const cleanup = window.electronAPI.on('checklist-main-header-command', handleMainHeaderCommand);
  return cleanup;

}, [onSettingsChange, settings.activeTaskTabs, settings.openAccordionIds, words, /* ...other dependencies... */]); // They MUST be in the dependency array.

```

---

### Developer Guide - Rule 65.0: On-the-Fly Data Migration in Components

This guide explains how to safely evolve a component's data structure without crashing the application when it encounters old data. This is an extension of Rule 07.0.

#### The Problem: Breaking Changes in Data Structures

As an application grows, you will inevitably need to change the shape of your data. We faced this when we upgraded the `TimeTrackerLog` component.

-   **Old Format**: Time was stored in a single `manualTime: number` property on the `Word` object.
-   **New Format**: We introduced a more complex `timeLog: TimeLogEntry[]` array to store individual timed entries.

This created a critical problem: any existing task with time tracked using the old `manualTime` property would lose that data because the new component only knew how to read from the `timeLog` array.

#### The Solution: On-the-Fly Migration with `useEffect`

Instead of writing a complex, one-time migration script for the entire `config.json` file, we built the migration logic directly into the `TimeTrackerLog` component. This makes the component resilient and backward-compatible. We use a `useEffect` hook that runs once to perform this check.

This pattern ensures that the component can handle both old and new data formats gracefully, preserves user data, and is transparent to the rest of the application.

```tsx
// File: src/components/TimeTrackerLog.tsx

// Phase 4.4: One-time data migration from old system
useEffect(() => {
  // If timeLog is missing/empty AND there's legacy manualTime data...
  if ((!word.timeLog || word.timeLog.length === 0) && (word.manualTime || 0) > 0 && !word.timeLogSessions) {
    // ...create a new entry from the old data.
    const legacyEntry: TimeLogEntry = {
      id: Date.now(),
      description: 'Legacy Timed Entry',
      duration: word.manualTime || 0,
      isRunning: false,
      createdAt: Date.now(),
    };
    // Update the word object with the new timeLog array.
    onUpdate({ ...word, timeLog: [legacyEntry] });
  }
}, [word.timeLog, word.manualTime, onUpdate, word.timeLogSessions]);

```

---

### Developer Guide - Rule 66.0: Enforcing Business Logic in State Handlers

This guide establishes a best practice for writing state update handlers: they should not just set state, but also enforce the application's business rules.

#### The Problem: Unchecked State Updates

It's easy to write a handler that simply updates state without any checks. For example, a "Dismiss Message" button could just filter an item out of an array. However, this can lead to unintended consequences if there are business rules that should prevent the action.

For our Inbox, we have a rule: **"Important messages cannot be dismissed."** A simple handler that just removes the message from the `inboxMessages` array would violate this rule.

#### The Solution: Add Guard Clauses to Handlers

The correct pattern is to add "guard clauses" at the beginning of your state handler functions. These clauses check for business rules and exit early if a condition is not met, often providing feedback to the user.

This makes our state management more robust and predictable. The component calling `handleDismissInboxMessage` doesn't need to know about the "important" rule; the rule is enforced by the state handler itself, which is the single source of truth for that piece of logic.

```tsx
// File: src/hooks/useInboxState.ts

const handleDismissInboxMessage = useCallback((messageId: number) => {
  const messageToTrash = inboxMessages.find(m => m.id === messageId);
  if (!messageToTrash) return;

  // This is the guard clause that enforces the business rule.
  if (messageToTrash.isImportant) {
    showToast("Cannot dismiss an important message.");
    return; // Exit the function early.
  }

  // If the guard clause passes, proceed with the state update.
  setTrashedMessages(prev => [messageToTrash, ...prev]);
  setInboxMessages(prev => prev.filter(m => m.id !== messageId));
  showToast("Message moved to trash.");
  setIsDirty(true);
}, [inboxMessages, showToast, setIsDirty]);

```

---

### Developer Guide - Rule 67.0: Live UI Updates with `setInterval`

This guide explains the standard pattern for creating a live-updating timer in the UI, as seen in our `TimeTrackerLog` and `MiniPlayer`.

#### The Problem: Displaying Real-Time Elapsed Time

When a timer is running, we need the UI to tick up every second. We can't just rely on React re-renders, as they may not happen on a consistent schedule.

#### The Solution: `useEffect` with `setInterval`

The standard React pattern for this is to use a `useEffect` hook to set up an interval that updates a local state variable.

1.  **The `useEffect` Hook**: This hook runs when the component mounts. It sets up a `setInterval` that executes a function every 1000 milliseconds (1 second).
2.  **The State Update**: Inside the interval, we calculate the new "live" time by taking the entry's saved `duration` and adding the time that has passed since it started (`Date.now() - entry.startTime`). We then update a local state variable (e.g., `activeTimerLiveTime`) with this new value.
3.  **The UI**: The component's JSX then renders this local state variable, which causes the displayed time to update every second.
4.  **Cleanup**: The `useEffect` hook returns a cleanup function that calls `clearInterval`. This is critical to prevent memory leaks by ensuring the interval is destroyed when the component unmounts.

This pattern provides a reliable and efficient way to create live-updating elements in a React application.

```tsx
// File: src/hooks/useGlobalTimer.ts

useEffect(() => {
  // 1. Set up the interval.
  const timerInterval = setInterval(() => {
    // Check if there is an active timer entry.
    if (activeTimerEntry && activeTimerEntry.startTime) {
      // 2. Calculate the live time and update state.
      const liveTime = activeTimerEntry.duration + (Date.now() - activeTimerEntry.startTime);
      setActiveTimerLiveTime(liveTime);
    }
  }, 1000);

  // 4. Return the cleanup function.
  return () => clearInterval(timerInterval);
}, [activeTimerEntry]); // Re-run the effect if the active entry changes.

```

---

### Developer Guide - Rule 68.0: Cross-Component State Updates

This guide explains how an action in one component can trigger a state update in a completely different, unrelated component using our central `AppContext`.

#### The Problem: How Does the Checklist Talk to the MiniPlayer?

We needed a way for the "Send to Timer & Start" button in the `Checklist` component to make the `MiniPlayer` appear and start its timer. These two components are not direct parent/child and have no knowledge of each other.

#### The Solution: Centralized Handlers in Context

Our hook-based architecture solves this problem cleanly.

1.  **The Global State Hook (`useGlobalTimer`)**: This hook defines the state for the active timer (`activeTimerWordId`, etc.) and the function that knows how to change it (`handleAddNewTimeLogEntryAndStart`).

2.  **The Orchestrator (`App.tsx`)**: The root `App` component initializes `useGlobalTimer` and passes the `handleAddNewTimeLogEntryAndStart` function into the `AppContext`.

3.  **The Action Component (`Checklist.tsx`)**: The `Checklist` component consumes the `AppContext` and gets access to `handleAddNewTimeLogEntryAndStart`. Its "Start" button simply calls this function.

4.  **The Display Component (`MiniPlayer.tsx`)**: The `MiniPlayer` component also consumes the `AppContext`. It reads the `activeTimerWordId` state. When the `Checklist` component's action updates this state, the `MiniPlayer` sees the change and automatically re-renders to show the active timer.

This pattern creates a "one-way data flow" where components don't talk to each other directly. Instead, they either call functions from a central source of truth (the context) or react to state changes from it. This makes the application architecture much easier to understand and maintain.

```tsx
// File: src/hooks/useGlobalTimer.ts
export function useGlobalTimer(...) {
  // ...
  const handleAddNewTimeLogEntryAndStart = useCallback((wordId: number, description: string) => {
    // ... logic to stop the old timer and start a new one ...
    setActiveTimerWordId(wordId);
    setActiveTimerEntry(newEntry);
  }, [/* ... */]);
  // ...
}

// File: src/renderer.tsx
function App() {
  // ...
  const globalTimerState = useGlobalTimer({ words, setWords });
  const appContextValue = {
    // ... other values
    handleAddNewTimeLogEntryAndStart: globalTimerState.handleAddNewTimeLogEntryAndStart,
  };
  // ...
}

// File: src/components/Checklist.tsx
export function Checklist(...) {
  const { handleAddNewTimeLogEntryAndStart } = useAppContext(); // Consume from context
  // ...
  const handleSendToTimerAndStart = (itemText: string) => {
    // Call the global handler from the context.
    handleAddNewTimeLogEntryAndStart(wordId, itemText);
  };
  // ...
}

```

---

### Developer Guide - Rule 69.0: The Orchestrator Component and Custom Hooks

This guide explains the primary architectural pattern of the application: the **Orchestrator Component** pattern, which leverages custom React hooks for state management.

#### The Problem: The Monolithic Component

Originally, the root `<App>` component in `renderer.tsx` was a massive, monolithic file responsible for everything: managing task state, handling UI interactions, running timers, sending notifications, and persisting data. This made the code difficult to read, debug, and maintain. Any small change had the potential to break unrelated features.

#### The Solution: Custom Hooks and an Orchestrator

We refactored the entire application to follow a modern, hook-based architecture.

1.  **Single-Responsibility Hooks**: All application logic was extracted into a suite of custom hooks, each with a single, clear responsibility. These hooks live in the `src/hooks/` directory.
    -   `useTaskState`: Manages all state and handlers for creating, updating, and deleting tasks.
    -   `useUIState`: Manages global UI state like modals, toasts, and loading indicators.
    -   `useSettings`: Manages all user-configurable settings.
    -   `useDataPersistence`: Handles all data loading, saving, import, and export.
    -   ...and others for notifications, navigation, etc.

2.  **The Orchestrator Component**: The `<App>` component in `renderer.tsx` was transformed into a clean "orchestrator." Its only job is to:
    -   Initialize all the custom hooks in the correct order.
    -   Pass the necessary state and setters between them (e.g., passing `showToast` from `useUIState` to `useTaskState`).
    -   Assemble the final, comprehensive context value using `useAppContextValue`.
    -   Render the top-level `AppLayout` within the `AppContext.Provider`.

This pattern makes the codebase highly modular, scalable, and easy to navigate. To understand how a specific feature works, you can now go directly to its dedicated hook file.

```tsx
// File: src/renderer.tsx

function App() {  
  // =================================================================================
  // I. STATE & REFS (The Orchestration)
  // =================================================================================

  // Initialize all the single-responsibility hooks.
  const uiState = useUIState({ ... });  
  const settingsState = useSettings({ ... });
  const inboxState = useInboxState({ ... });
  const taskState = useTaskState({ ... });
  const globalTimerState = useGlobalTimer({ ... });
  // ... and so on for all other hooks.

  // Pass state between hooks where necessary.
  // e.g., `taskState` needs `settings` from `settingsState`.

  // =================================================================================
  // II. RENDER LOGIC
  // =================================================================================
  
  // Set up global event listeners.
  useAppListeners({ ... });

  // Assemble the final context value from all the hooks.
  const appContextValue = useAppContextValue({
    taskState,
    inboxState,
    settingsState,
    // ... all other hook states
  });    

  // Render the AppLayout inside the provider.
  return (
    <AppContext.Provider value={appContextValue}>
      <AppLayout />      
    </AppContext.Provider>
  );
}

```

---
### Developer Guide - Rule 70.0: Refactoring Monolithic Components

This guide outlines the standard process for refactoring a large, "monolithic" component into a more maintainable, modular structure using custom hooks and presentational components. This is an extension of `Rule 69.0: The Orchestrator Component and Custom Hooks`.

#### The Problem: The Monolithic Component

A monolithic component is one that has grown too large and handles too many responsibilities. Symptoms include:
-   **State Overload**: Dozens of `useState` and `useRef` hooks managing disparate pieces of state.
-   **Handler Proliferation**: A vast number of `handle...` functions for every possible user interaction.
-   **Complex, Nested JSX**: A long and deeply nested `return` statement that is difficult to read and modify.
-   **Mixed Concerns**: UI rendering logic, state management, and side effects (like IPC listeners) are all intertwined in one massive file.

This makes the component difficult to debug, maintain, and extend without introducing new bugs. Our `Checklist.tsx` component is a prime example of this problem.

#### The Solution: The Three-Phase Refactor

The solution is to systematically separate the component's concerns (UI vs. Logic) into smaller, single-responsibility modules.

##### Phase 1: Extract UI into "Dumb" Presentational Components

The first step is to break the large JSX structure into smaller, "dumb" components whose only job is to render UI based on the props they receive.

1.  **Identify Repeated UI**: Look for `.map()` loops in your JSX. The content inside these loops is an excellent candidate for a new component (e.g., `ChecklistSection` becomes `ChecklistSectionItem`).
2.  **Create New Components**: Create new component files (e.g., `src/components/ChecklistSectionItem.tsx`).
3.  **Define Props**: Define the props interface for the new component. It should accept the data it needs to render (e.g., `section: ChecklistSection`) and all the handler functions it needs to call (e.g., `onDeleteSection`, `onUpdateTitle`).
4.  **Move JSX**: Cut the JSX from the original component's loop and paste it into the new component's return statement, replacing direct state access with props.

##### Phase 2: Extract Logic into a Custom Hook

Once the UI is separated, extract all the state management and handler functions into a dedicated custom hook.

1.  **Create the Hook File**: Create a new file (e.g., `src/hooks/useChecklist.ts`).
2.  **Move State and Logic**: Move all related `useState`, `useRef`, `useEffect`, and `handle...` functions from the original component into the new custom hook.
3.  **Define Inputs and Outputs**: The hook will take any necessary parent props as arguments (e.g., `initialSections`, `onUpdate`). It should return a single object containing all the state and handlers that the new UI components will need.

##### Phase 3: Re-assemble as an Orchestrator

Finally, rewrite the original component file to be a clean "orchestrator."

1.  **Call the Hook**: The component's only job is to call the new custom hook to get all the state and logic.
2.  **Render Presentational Components**: It then renders the new, "dumb" UI components, passing them the state and handlers they need from the object returned by the hook.

The final result is a highly organized, maintainable, and scalable feature.

```tsx
// Example: The final, refactored Checklist.tsx as an "Orchestrator"

import { useChecklist } from '../hooks/useChecklist';
import { ChecklistHeader } from './ChecklistHeader';
import { ChecklistSectionItem } from './ChecklistSectionItem';

export function Checklist(props: ChecklistOrchestratorProps) {
  // 1. All logic and state is now contained in the custom hook.
  const {
    sections,
    editingSectionId,
    editingSectionTitle,
    handleUpdateSectionTitle,
    handleDeleteSection,
    // ... and all other state and handlers
  } = useChecklist({
    initialSections: props.sections,
    onUpdate: props.onUpdate,
  });

  // 2. The component now only orchestrates the rendering of dumb UI components.
  return (
    <div className="checklist-container">
      <ChecklistHeader 
        // ... pass necessary global actions
      />
      {sections.map(section => (
        <ChecklistSectionItem
          key={section.id}
          section={section}
          isEditing={editingSectionId === section.id}
          editingTitle={editingSectionTitle}
          onUpdateTitle={handleUpdateSectionTitle}
          onDelete={handleDeleteSection}
          // ... pass all other necessary props and handlers
        />
      ))}
    </div>
  );
}
```

---

### Developer Guide - Rule 71.0: State Replacement vs. State Merging

This guide explains a critical and common React state management bug: accidentally replacing a complex state object instead of merging changes into it. This was the root cause of the bug where expanding a checklist section would wipe all other application settings.

#### The Problem: Accidental State Wipes

When you have a complex state object (like our `settings` object), it's easy to make a mistake when updating just one piece of it.

**The Buggy Pattern (State Replacement):**

When you call a `useState` setter with a plain object, you are telling React: **"Throw away the entire old state object and replace it with this new one."**

In our case, the `settings` object contains dozens of properties (`categories`, `fontFamily`, `taskTypes`, etc.). The buggy code was throwing all of that away and replacing it with a tiny new object that *only* contained the `openChecklistSectionIds` key. When the project was saved, this corrupted, minimal settings object was written to disk, causing the data loss we observed on reload.

#### The Solution: Functional Updates for Merging

The correct and safe way to update a single property in a state object is to use the **functional update** form. This form gives you the most current version of the previous state, which you can then merge your changes into.

**The Correct Pattern (State Merging):**

This tells React: **"Give me the previous settings object (`prevSettings`). I will create a new object, copy all of its existing properties (`...prevSettings`), and then overwrite just the `openChecklistSectionIds` property with my new value."**

This returns a complete, merged object to React, preserving all other settings and preventing the catastrophic state wipe.

**Golden Rule**: Whenever you are updating only a part of a state object, always use the functional `setState(prevState => ({ ...prevState, ...yourChanges }))` pattern to avoid accidental data loss.

```tsx
// Incorrect (Replaces State):
onSettingsChange({ openChecklistSectionIds: newOpenIds });

```
```tsx
// Correct (Merges State):
onSettingsChange(prevSettings => ({ ...prevSettings, openChecklistSectionIds: newOpenIds }));
```

---

### Developer Guide - Rule 72.0: The Perils of `contentEditable`

This guide documents the significant challenges encountered while building our custom rich text editor and the architectural lessons learned.

#### The Problem: The `contentEditable` Black Box

A `div` with the `contentEditable` attribute is not a simple input field. It's a complex "black box" where the browser maintains its own internal, hidden state model of the content. When we tried to add custom features by manually manipulating the DOM (e.g., creating `<ul>` or `<h1>` elements), we were directly fighting the browser's internal model.

This conflict was the root cause of numerous bugs:
-   **State Desynchronization**: The browser's internal state would no longer match what was on the screen, causing native actions like `Backspace` to behave erratically (e.g., deleting an entire word instead of a character).
-   **Cursor Loss**: After our code manually inserted a node, the browser would lose track of the cursor's position and reset it to the beginning of the editor.
-   **Unpredictable Formatting**: The browser would sometimes automatically wrap our new elements in `<p>` or `<div>` tags we didn't ask for, breaking our logic on subsequent edits.

#### The Solution: Strategic Retreat and Future Direction

After numerous attempts to patch these issues, we concluded that fighting the browser's native behavior is an unstable and unscalable approach. The industry-standard solutions follow one of two paths:

1.  **Use a Dedicated Library**: Frameworks like **Tiptap**, **Slate.js**, or **Quill.js** were created specifically to solve this problem. They use `contentEditable` only as a "view" layer while maintaining their own, predictable data model of the document. This is the recommended approach for any feature-rich editor.

2.  **Drastic Simplification**: If a full library is not an option, the only stable path is to drastically simplify the feature set and avoid any custom logic that conflicts with core editing behavior.

We chose the second path for immediate stability. We removed all custom formatting shortcuts (`Ctrl+L`, `Alt+1-6`, etc.) and our attempts to add native actions (`Backspace`) to our undo history. We kept only the features that were stable and did not interfere with the browser's core text manipulation, such as our paste-to-link functionality.

**Golden Rule**: Do not fight `contentEditable`. Either embrace its limitations and keep custom features minimal, or use a dedicated library that abstracts away its complexities.

---

### Developer Guide - Rule 73.0: Safe Conditional Rendering in JSX

This guide explains a common pitfall in React's conditional rendering that can lead to unexpected output in the UI, specifically the rendering of a stray `0`.

#### The Problem: The `&&` Operator and Falsy Values

A common and convenient pattern for conditional rendering in JSX is `condition && <Component />`. This works because in JavaScript, `true && expression` evaluates to `expression`, and `false && expression` evaluates to `false`. React does not render `false`, `null`, or `undefined`, so the component correctly disappears.

However, a bug occurs when the condition can be the number `0`. In JavaScript, `0` is a "falsy" value.

Consider this code:
`{task.payRate && task.payRate > 0 && <MyComponent />}`

If `task.payRate` is `0`:
1.  The expression starts evaluating: `0 && ...`
2.  The `&&` operator sees the first operand is `0` (which is falsy).
3.  It immediately stops and returns the value of that falsy operand, which is `0`.
4.  React receives the value `0` and, unlike `false` or `null`, **React renders the number `0` as a text node.**

This is why we saw a stray "0" appearing in our UI with no styling.

#### The Solution: Ensure a Boolean Evaluation

To prevent this, you must ensure your conditional expression always evaluates to a true boolean (`true` or `false`), or to a value that React doesn't render (like `null` or `undefined`).

**Incorrect (Unsafe):**
```jsx
{task.payRate && task.payRate > 0 && <MyComponent />}

```
---
### Developer Guide - Rule 74.0: Keyboard Interactivity with `onKeyDown` and `tabIndex`

This guide explains how to make non-interactive elements like `<div>`s respond to keyboard events, which is essential for implementing custom keyboard shortcuts like `Tab` for indentation.

#### The Problem: Non-Interactive Elements Don't Get Focus

By default, only interactive elements like `<input>`, `<button>`, and `<a>` can receive keyboard focus. This means that if you attach an `onKeyDown` handler to a `<div>` or a `<span>`, it will never fire because the user can't "focus" on it with their keyboard.

We encountered this when trying to implement the `Tab` and `Shift+Tab` shortcuts for indenting and outdenting our `ChecklistItemComponent`, which is rendered as a `<div>`.

#### The Solution: The `tabIndex` Attribute

The `tabIndex` attribute is the standard HTML solution to this problem. It controls whether an element can be focused and how it participates in the page's tab order.

-   **`tabIndex={-1}`**: The element can be focused programmatically (e.g., with `element.focus()`), but it is **not** included in the natural tab order. This is useful for elements that should be focusable but not reachable by tabbing through the page.
-   **`tabIndex={0}`**: The element can be focused, and it is included in the natural tab order of the page, based on its position in the DOM. This is the value we use.
-   **`tabIndex` > 0**: The element can be focused, but it creates a separate, priority-based tab order, which is generally discouraged as it can be confusing for accessibility.

By adding `tabIndex={0}` to our `div`, we make it a focusable element that can receive keyboard events.

#### Implementation: Capturing the `Tab` Key

Once the element is focusable, we can add an `onKeyDown` handler. To capture the `Tab` key specifically, we check `e.key === 'Tab'`.

It is **critical** to call `e.preventDefault()` inside this handler. If we don't, the browser will perform its default action for the `Tab` key, which is to move focus to the next focusable element on the page, and our custom indent/outdent logic will not work as expected.

This pattern is essential for creating accessible, keyboard-navigable custom components in React.

```tsx
// File: src/components/ChecklistItemComponent.tsx

export const ChecklistItemComponent: React.FC<ChecklistItemProps> = ({ onTab, ... }) => {
    return (
        <div
            // ... other props
            
            // 1. Make the div focusable so it can receive keyboard events.
            tabIndex={0} 

            // 2. Add the onKeyDown handler.
            onKeyDown={(e) => {
                if (e.key === 'Tab') {
                    // 3. Prevent the browser's default focus-switching behavior.
                    e.preventDefault();
                    
                    // 4. Call our custom handler for indent/outdent.
                    onTab(e.shiftKey);
                }
            }}
        >
            {/* ... component content ... */}
        </div>
    );
};

```

---

### Developer Guide - Rule 75.0: Decoupling Actions from Editing State with Hover Menus

This guide explains a robust UI pattern for providing actions on an item (like "Move" or "Delete") without conflicting with its in-place editing state.

#### The Problem: `onBlur` vs. `onClick` Race Condition

We encountered a bug where clicking an action button (like "Move Up") inside an active editor component would cause the editor to immediately close before the action could be registered. This happens because:
1.  The user clicks the "Move Up" button.
2.  The editor's main container fires its `onBlur` event because focus is leaving it.
3.  The `onBlur` handler immediately sets the editing state to `null`, causing the component to re-render in its read-only view.
4.  The "Move Up" button is unmounted from the DOM before its `onClick` event has a chance to fire.

While using `onMouseDown` instead of `onClick` can sometimes fix this for a single button, it's a fragile solution that doesn't scale well.

#### The Solution: Decouple Actions from the Edit State

The best practice is to completely decouple organizational actions (Move, Copy, Delete) from the editing state. We achieve this by moving those action buttons out of the "editing" view and into a **hover-activated menu** on the "read-only" view.

This pattern provides several benefits:
-   **No Race Condition**: Since the "Move" and "Delete" buttons are part of the read-only view, they exist outside the `onBlur` context of the editor, completely avoiding the event conflict.
-   **Improved UX**: The user can organize, copy, and delete items without first having to enter an edit mode, which is a much faster and more intuitive workflow.
-   **Clear Separation of Concerns**: "Editing" is for changing the content of an item. "Actions" are for managing the item's position and existence within the list. This pattern enforces that separation in the UI.

```jsx
// The hover menu is part of the read-only view, completely separate from the editor's onBlur.
<div className="rich-text-block-view-wrapper">
  <div className="rich-text-block-view" onDoubleClick={() => onSetEditing(true)} />
  <div className="rich-text-block-quick-actions">
    <button onClick={onMove}>Move</button>
    <button onClick={onDelete}>Delete</button>
  </div>
</div>
```

---

### Developer Guide - Rule 76.0: Explicit Return Types for Composable Hooks

This guide explains a critical TypeScript pattern for ensuring type safety when building complex state logic by composing multiple custom hooks.

#### The Problem: Type Inference Failure with Spread Syntax

We encountered a significant issue after refactoring the monolithic `useTaskState` hook into smaller, single-responsibility hooks (`useCoreTaskState`, `useTaskManagement`, `useBulkTaskActions`). The new `useTaskState` acted as an "orchestrator," combining the return values of the smaller hooks using the spread operator:

```typescript
// The orchestrator hook
export function useTaskState(...) {
  const coreState = useCoreTaskState(...);
  const taskManagement = useTaskManagement(...); // Returns { handleCompleteTask, ... }
  const bulkTaskActions = useBulkTaskActions(...); // Returns { handleBulkDelete, ... }

  return {
    ...coreState,
    ...taskManagement,
    ...bulkTaskActions,
  };
}
```

The bug occurred because TypeScript struggled to infer the complete shape of the final returned object. It would sometimes only "see" the properties from one of the spread objects, leading to errors like `Property 'handleBulkDelete' does not exist on type '{ handleCompleteTask: ... }'`.

#### The Solution: Explicit Return Type Interfaces

The definitive solution is to provide an explicit return type interface for each of the child hooks. This acts as a clear "contract" that tells TypeScript the exact shape of the object that the hook will return.

By doing this, TypeScript no longer has to *infer* the type; it can simply read the contract. When the orchestrator hook then spreads these objects, TypeScript can correctly combine the well-defined types into a final, complete type.

**Golden Rule**: Any custom hook that is intended to be composed or spread into a larger object should have an explicit return type interface. This prevents type inference failures and ensures robust type safety.

```typescript
// File: src/hooks/useBulkTaskActions.ts

// 1. Define the explicit return type interface.
interface UseBulkTaskActionsReturn {
  handleBulkAdd: (options: {...}) => void;
  handleBulkDelete: (taskIds: number[]) => void;
  // ... all other handlers
}

// 2. Apply the return type to the hook's function signature.
export function useBulkTaskActions({...}: UseBulkTaskActionsProps): UseBulkTaskActionsReturn {
  // ... hook logic
  return {
    handleBulkAdd,
    handleBulkDelete,
    // ...
  };
}
```