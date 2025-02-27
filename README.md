# Electron Multi-Tab Example

This project is an Electron-based multi-tab browser example, primarily demonstrating how to implement browser-like tab switching functionality using WebContentsView's setVisible method.

## Features

- Multi-tab interface, similar to modern browsers
- Using WebContentsView to load web content
- Tab switching implemented with WebContentsView's setVisible method
- Ability to add and close tabs

## Installation and Running

1. Clone or download this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the application:
   ```
   npm start
   ```

## Technical Implementation

- Using Electron's WebContentsView for web content loading and display
- WebContentsView inherits from the View class, providing the setVisible method
- IPC communication between renderer and main processes
- CSS for styling and layout of tabs
- Direct control of tab content visibility using the setVisible method

## Project Structure

- `main.js` - Main process code, handling window creation and WebContentsView management
- `index.html` - Main application interface
- `renderer.js` - Renderer process code, implementing tab management and user interaction

## Electron Version

This project is developed using the latest Electron v34, taking full advantage of its features. 