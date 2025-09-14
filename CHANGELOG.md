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
-   **Draggable Priority List**: Implemented a draggable list for word priorities using `react-beautiful-dnd`. Reordering the list dynamically updates word sizes on the canvas.

### Fixed
-   **Build System Overhaul**: Resolved numerous build and configuration issues by updating Webpack configs, aligning Electron Forge package versions, and ensuring all necessary loaders and plugins are correctly configured. This stabilized the development environment after a significant debugging effort.