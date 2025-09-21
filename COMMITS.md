# Commits

A log of what was commited to git.

---

## Index
- **[1.0.5] - 2025-09-21: Task Types & Templated Forms**: feat(tasks): Implement Task Types and Templated Forms
- **[1.0.4] - 2025-09-21: Inbox Archive & Trash + Documentation Workflow**: feat(inbox): Implement full Archive and Trash system with UI polish 
- **[1.0.3] - 2024-09-20: Inbox Protection & Full Task View**:
- **[1.0.2] - 2024-09-19: Advanced Checklists, UI Polish, & Documentation**:
- **[1.0.1] - 2024-09-18: Notification System & Inbox View**:
- **[1.0.0] - 2024-09-15: Core Task Management & Data Persistence**:

---

### **[1.0.5] - 2025-09-21: Task Types & Templated Forms**
**feat(tasks): Implement Task Types and Templated Forms**

This feature introduces a "Task Types" system, allowing users to create templated forms that show only the fields relevant to a specific type of task, significantly streamlining the task creation process.

## Features:
-   **Task Types System**: Implemented the core data structures to support user-definable task types, each with a specific set of visible fields.
-   **Dynamic "Add Task" Form**: The "Add New Task" form now dynamically renders fields based on the selected task type, hiding irrelevant inputs and creating a more focused workflow.
-   **Task Type Manager**: Added a new manager to the sidebar, allowing users to create, rename, delete, and configure the visible fields for each task type, offering full customization of the templating system.

#### Summary:
This commit adds a powerful layer of customization to task creation, making the application more flexible and efficient for managing different kinds of work.

---

### **[1.0.4] - 2025-09-21: Inbox Archive & Trash + Documentation Workflow**
**feat(inbox): Implement full Archive and Trash system with UI polish**

This major update introduces a complete, non-destructive workflow for managing inbox messages, including "Important," "Archive," and "Trash" states.

## Features:

- Inbox Archive: Adds an "Archive" tab and functionality to move messages out of the active inbox for later reference. Includes "Archive" and "Un-archive" actions for single messages and "Un-archive All" / "Trash All" for bulk operations.
- Inbox Trash: Replaces permanent deletion with a "Trash" system. Dismissed messages are now moved to a "Trash" tab, providing a safety net. The trash view includes "Restore," "Delete Permanently," "Restore All," and "Empty Trash" actions.
- Important Flag: Adds a star icon to messages to flag them as "important," protecting them from "Clear All" and "Dismiss" actions.
- UI Refinements: Relocates bulk action buttons ("Clear All," "Empty Trash," etc.) into their respective tabs for a more intuitive user experience. Fixes several UI rendering bugs and improves hover effects on action buttons.

## Documentation:

- `DEFINITIONS.md`: Creates a new central glossary to document all key project handlers, state variables, and architectural patterns.
- `GEMINI.md`: Adds new developer guide rules for state management (Rule 40.0) and UI action handlers (Rule 41.0). Also adds a log of lessons learned from recent UI rendering bugs.

#### Summary

This commit finalizes the core functionality of the expanded inbox system, making it more powerful, resilient, and user-friendly.

