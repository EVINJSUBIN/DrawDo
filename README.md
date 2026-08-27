# DrawDo: Visual To-Do List

**Status:** 1-Day Quick Ship Project for Hack Club Stardance.

## Concept
A web-based to-do list where instead of typing tasks, you *draw* them on small canvas squares. It's a fun, visual, and minimalist approach to productivity.

## 1-Day Implementation Plan
1.  **Frontend Layout:** A CSS Grid of blank square "cards".
2.  **Drawing Engine:** Each card contains an HTML5 `<canvas>`. Mouse/touch events allow drawing simple black strokes.
3.  **Actions:**
    *   **Done:** Clicking a checkmark button adds a green overlay or cross-out animation.
    *   **Clear:** Clicking a trash icon clears the canvas.
    *   **Add New:** A '+' button appends a new canvas card to the grid.
4.  **Local Storage:** Save the canvas image data (`canvas.toDataURL()`) to `localStorage` so tasks persist on refresh.

## Devlog / Shipping
- This project is designed to be shipped in a single sitting (3-5 hours). 
- Once the HTML/JS is done, host it immediately on GitHub Pages.
