// Get references to DOM elements
const grid = document.getElementById('grid');
const addBtn = document.getElementById('add-btn');

// Load tasks from localStorage or start with one empty task
let tasks = JSON.parse(localStorage.getItem('drawdo_tasks')) || [
    { id: Date.now().toString(), dataUrl: null, done: false }
];

// Save the current state of tasks to localStorage
function saveTasks() {
    localStorage.setItem('drawdo_tasks', JSON.stringify(tasks));
}

// Set up the drawing functionality for a specific canvas
function setupCanvasDrawing(card, canvas, task) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const colorPicker = card.querySelector('.color-picker');
    const sizeSlider = card.querySelector('.size-slider');
    
    // We use a fixed internal resolution (300x300) for the canvas to keep it simple!
    canvas.width = 300;
    canvas.height = 300;

    // State variables for drawing
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    // If this task already has a drawing, load it onto the canvas
    if (task.dataUrl) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        img.src = task.dataUrl;
    }

    // Helper function to get mouse/touch coordinates relative to the canvas
    function getCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        // Support both mouse and touch events
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        // Scale the coordinates to match our internal 300x300 resolution
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    function startDrawing(e) {
        if (task.done) return; // Don't draw if marked as done
        isDrawing = true;
        const { x, y } = getCoordinates(e);
        lastX = x;
        lastY = y;
        e.preventDefault(); // Prevent scrolling on touch devices while drawing
    }

    function draw(e) {
        if (!isDrawing || task.done) return;
        const { x, y } = getCoordinates(e);
        
        // Configure brush style
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = colorPicker.value;
        ctx.lineWidth = sizeSlider.value;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke(); // Draw the line!
        
        // Update last coordinates
        lastX = x;
        lastY = y;
        e.preventDefault();
    }

    function stopDrawing() {
        if (isDrawing) {
            isDrawing = false;
            // Save the canvas drawing as an image string to our task object
            task.dataUrl = canvas.toDataURL();
            saveTasks();
        }
    }

    // Mouse events (Desktop)
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events (Mobile)
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
}

// Create a new task card element and add it to the page
function renderTaskCard(task) {
    const card = document.createElement('div');
    // Add classes. If the task is done, add the 'done-task' class
    card.className = `card ${task.done ? 'done-task' : ''}`;
    card.id = `task-${task.id}`;
    
    // Set the HTML structure inside the card
    card.innerHTML = `
        <div class="tools">
            <input type="color" class="color-picker" value="#1a202c" title="Brush Color">
            <input type="range" class="size-slider" min="1" max="25" value="4" title="Brush Size">
        </div>
        <canvas></canvas>
        <div class="controls">
            <button class="btn-clear">🗑️ Clear</button>
            <button class="btn-done">${task.done ? '↩️ Undo' : '✅ Done'}</button>
        </div>
    `;
    
    // Get references to elements inside this specific card
    const canvas = card.querySelector('canvas');
    const clearBtn = card.querySelector('.btn-clear');
    const doneBtn = card.querySelector('.btn-done');
    
    // Initialize the drawing logic for this canvas
    setupCanvasDrawing(card, canvas, task);
    
    // Clear button logic
    clearBtn.addEventListener('click', () => {
        if (task.done) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Wipe the canvas
        task.dataUrl = canvas.toDataURL(); // Save the empty state
        saveTasks();
    });

    // Done button logic
    doneBtn.addEventListener('click', () => {
        task.done = !task.done; // Toggle the done state (true to false, false to true)
        
        // Update the visual appearance based on if it's done or not
        if (task.done) {
            card.classList.add('done-task');
            doneBtn.textContent = '↩️ Undo';
        } else {
            card.classList.remove('done-task');
            doneBtn.textContent = '✅ Done';
        }
        
        saveTasks(); // Save our changes
    });

    return card;
}

// Render all tasks onto the grid
function renderAll() {
    grid.innerHTML = ''; // Clear the grid first
    tasks.forEach(task => {
        const card = renderTaskCard(task); // Build the card
        grid.appendChild(card); // Add it to the screen
    });
}

// "Add New Canvas" button logic
addBtn.addEventListener('click', () => {
    // Create a new empty task
    const newTask = { 
        id: Date.now().toString(), 
        dataUrl: null, 
        done: false 
    };
    tasks.push(newTask); // Add it to our list
    saveTasks(); // Save to local storage
    renderAll(); // Re-render the screen to show the new card
});

// Initial render when the page loads
renderAll();
