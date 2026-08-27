# 🎨 DrawDo ✨

> A beautiful, glassmorphic visual approach to task management built for Hack Club Stardance.

**Live Demo:** *(Insert GitHub Pages link here)*

## 🌟 The Story (Why DrawDo?)

Traditional to-do lists feel like work. You type text into a box, check a box, and move on. It's sterile, monotonous, and frankly, a bit boring. 

I built **DrawDo** to inject creativity into daily tasks. Instead of typing "Buy Milk", you can draw a little carton of milk. Instead of writing "Fix bug", you can draw a squashed bug. It taps into visual memory and makes productivity *fun*. 

For Hack Club Stardance, I wanted to build something highly interactive but technically contained within a fast-paced 1-day ship. The result is a lightweight, zero-dependency progressive web app (PWA) built entirely with Vanilla JavaScript, HTML5 Canvas, and modern CSS.

## 🛠️ Technical Implementation

**1. Glassmorphism & UI Design**
The UI leverages modern CSS techniques—specifically `backdrop-filter: blur()`, CSS grids, and animated CSS gradients to create a floating, translucent "frosted glass" aesthetic. This significantly improves the user experience and ensures the app looks incredible.

**2. The Drawing Engine**
I built a custom drawing engine using the HTML5 `<canvas>` API. It features:
- **Responsive Coordinate Tracking:** Uses `getBoundingClientRect()` and internal scaling so drawings stay accurate and crisp even if the window is resized.
- **Dynamic Brush Controls:** Users can select brush thickness and color on a per-task basis using built-in HTML5 color pickers and range sliders.
- **Touch Support:** Added passive event listeners for `touchstart`, `touchmove`, and `touchend` so it works flawlessly on mobile devices.

**3. Client-Side Persistence**
To keep things fast and serverless, tasks are saved instantly as Base64 image strings via `canvas.toDataURL()` and stored in the browser's `localStorage`. No accounts, no database latency—your tasks are just *there* when you open the page.

## 🚀 How to Run Locally

1. Clone the repository: `git clone <your-repo-url>`
2. Open `index.html` in any modern web browser.
3. Start drawing! No build steps, `npm install`, or backend required.
