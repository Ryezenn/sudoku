# Sudoku Auto-Solver

A web-based Sudoku auto-solver that uses your webcam or screen-share to read a Sudoku board via OCR (Tesseract.js) and solves it automatically.

## Features
- Screen sharing input via `getDisplayMedia`
- Draggable and resizable alignment box to target the grid
- AI OCR to read digits from the video feed
- Backtracking algorithm to solve the Sudoku puzzle
- Overlays the answer directly on your screen

## How to use
1. Open `public/index.html` via a Live Server.
2. Mirror your phone to your PC.
3. Click "Mulai Bagikan Layar" and select your mirrored phone window.
4. Align the blue grid to match the Sudoku grid in the video.
5. Click "Scan & Solve".
