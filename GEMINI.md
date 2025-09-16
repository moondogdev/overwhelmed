# Overwhelmed

A small desktop app that creates a word cloud around a 640x640 image.

### Features

-   **Image Display**: The app will feature a central **640x640 image view** where the word cloud will be generated.
-   **Text Input**: Users can enter new text to be added to the word cloud.
-   **Dynamic Sizing**: A **priority list** will determine the text size. Words at the top of the list will be larger, while those at the bottom will be smaller. Users can reorder this list to change the size of the text.
-   **Customization**: A **settings section** will allow users to choose the font and color of the text.
-   **Interactive Text**: Clicking on a word in the cloud will open the user's default browser and perform a Google search for that word.
-   **Automatic Placement**: The app's logic will automatically place new text in a random location around the image, avoiding the center, to create a "cloud" effect.

### Usage

1.  **Launch the App**: Open the `Overwhelmed` application.
2.  **Add Text**: Type a word or phrase into the input field and press Enter. The text will appear in the word cloud and be added to the priority list.
3.  **Adjust Text Size**: Use the up and down arrows next to each item in the priority list to change its order and, consequently, its size in the word cloud.
4.  **Customize**: Use the settings menu to change the font and color of the text.
5.  **Search**: Click on any word in the word cloud to perform a Google search.

### Dependencies

-   An image rendering library to display the 640x640 image.
-   A text rendering library to draw text layers on top of the image.
-   A library for handling user input, such as a text field and an interactive list.
-   A way to interact with the system's default browser to open new search queries.

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
-   **UI Consistency**: Refined the UI by replacing text buttons with icons, unifying the appearance of the active and completed task lists, and implementing non-intrusive toast notifications for user feedback.

## Future Features
-   **Comments/Notes**: Add a dedicated section within each ticket for ongoing comments or notes.
-   **Categories**: Implement a categorization system for tickets (e.g., work, personal, life, other) to allow for better organization and filtering.
-   **User Assignment**: Add a feature to create users and assign tickets to them, with the ability to filter the list to view tickets assigned to a specific user.