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
3.  **Adjust Text Size**: Drag and drop items in the priority list to change their order and, consequently, their size in the word cloud.
4.  **Customize**: Use the settings menu to change the font and color of the text.
5.  **Search**: Click on any word in the word cloud to perform a Google search.

### Dependencies

-   An image rendering library to display the 640x640 image.
-   A text rendering library to draw text layers on top of the image.
-   A library for handling user input, such as a text field and a draggable list.
-   A way to interact with the system's default browser to open new search queries.