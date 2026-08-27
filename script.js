// --- STATE MANAGEMENT ---
// We use a new key to avoid conflicts with the old gamified data
let tasks = JSON.parse(localStorage.getItem('drawdo_pro_tasks')) || [];
let currentFilter = 'all'; // Filters: 'all', 'active', 'completed'

function saveTasks() {
    localStorage.setItem('drawdo_pro_tasks', JSON.stringify(tasks));
    updateCounters();
}

// Commercial-grade Toast Notification System
function showToast(message, icon = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i data-lucide="${icon}"></i> ${message}`;
    container.appendChild(toast);
    
    // Render the injected icon
    if(window.lucide) { lucide.createIcons(); }

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- UI LOGIC ---
const grid = document.getElementById('grid');
const addBtn = document.getElementById('add-btn');

function updateCounters() {
    const activeCount = tasks.filter(t => !t.done).length;
    document.getElementById('task-counter').textContent = `${activeCount} Active Task${activeCount !== 1 ? 's' : ''}`;
}

// Draw engine logic (Optimized for robustness)
function setupCanvasDrawing(card, canvas, task) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const colorPicker = card.querySelector('.color-picker');
    const sizeSlider = card.querySelector('.size-slider');
    
    // High-resolution internal canvas for crisp drawing
    canvas.width = 600;
    canvas.height = 600;

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    // Load saved image
    if (task.dataUrl) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        img.src = task.dataUrl;
    }

    function getCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    function startDrawing(e) {
        if (task.done || task.isText) return;
        isDrawing = true;
        const { x, y } = getCoordinates(e);
        lastX = x;
        lastY = y;
        e.preventDefault();
    }

    function draw(e) {
        if (!isDrawing || task.done || task.isText) return;
        const { x, y } = getCoordinates(e);
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = colorPicker.value;
        ctx.lineWidth = sizeSlider.value;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke(); 
        
        lastX = x;
        lastY = y;
        e.preventDefault();
    }

    function stopDrawing() {
        if (isDrawing) {
            isDrawing = false;
            task.dataUrl = canvas.toDataURL();
            saveTasks();
        }
    }

    // Event Listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
}

// Component Renderer for a Task Card
function renderTaskCard(task) {
    const card = document.createElement('div');
    card.className = `card ${task.done ? 'done' : ''}`;
    card.id = `task-${task.id}`;
    
    card.innerHTML = `
        <div class="card-header">
            <input type="text" class="card-title" placeholder="Task Title..." value="${task.title || ''}">
            <div class="card-actions">
                <button class="icon-btn check-btn" title="Mark Status">
                    <i data-lucide="${task.done ? 'check-circle-2' : 'circle'}"></i>
                </button>
                <button class="icon-btn danger delete-btn" title="Delete Task">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        </div>

        <div class="task-content">
            <canvas style="display: ${task.isText ? 'none' : 'block'};"></canvas>
            <textarea class="text-mode-input" style="display: ${task.isText ? 'block' : 'none'};" placeholder="Add details...">${task.textContent || ''}</textarea>
        </div>

        <div class="toolbar">
            <div class="draw-tools" style="visibility: ${task.isText ? 'hidden' : 'visible'};">
                <input type="color" class="color-picker" value="#111827" title="Brush Color">
                <input type="range" class="size-slider" min="1" max="40" value="6" title="Brush Size">
                <button class="icon-btn clear-btn" title="Clear Canvas" style="margin-left:4px;">
                    <i data-lucide="eraser"></i>
                </button>
            </div>
            <button class="mode-toggle">
                ${task.isText ? 'Switch to Draw' : 'Switch to Type'}
            </button>
        </div>
    `;
    
    // Dom Elements
    const titleInput = card.querySelector('.card-title');
    const checkBtn = card.querySelector('.check-btn');
    const deleteBtn = card.querySelector('.delete-btn');
    const clearBtn = card.querySelector('.clear-btn');
    const modeToggle = card.querySelector('.mode-toggle');
    const canvas = card.querySelector('canvas');
    const textarea = card.querySelector('.text-mode-input');
    const drawTools = card.querySelector('.draw-tools');

    // Init Engine
    setupCanvasDrawing(card, canvas, task);

    // Event Bindings
    titleInput.addEventListener('input', (e) => {
        task.title = e.target.value;
        saveTasks();
    });

    textarea.addEventListener('input', (e) => {
        task.textContent = e.target.value;
        saveTasks();
    });

    checkBtn.addEventListener('click', () => {
        task.done = !task.done;
        saveTasks();
        renderAll(); // Full re-render to apply filtering/sorting
        showToast(task.done ? 'Task marked complete' : 'Task restored to active', 'check-circle');
    });

    deleteBtn.addEventListener('click', () => {
        tasks = tasks.filter(t => t.id !== task.id);
        saveTasks();
        card.remove(); // Remove immediately for UX
        updateCounters();
        showToast('Task deleted successfully', 'trash');
    });

    clearBtn.addEventListener('click', () => {
        if (task.done || task.isText) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        task.dataUrl = canvas.toDataURL();
        saveTasks();
    });

    modeToggle.addEventListener('click', () => {
        if (task.done) return;
        task.isText = !task.isText;
        
        canvas.style.display = task.isText ? 'none' : 'block';
        textarea.style.display = task.isText ? 'block' : 'none';
        drawTools.style.visibility = task.isText ? 'hidden' : 'visible';
        modeToggle.textContent = task.isText ? 'Switch to Draw' : 'Switch to Type';
        
        saveTasks();
    });

    return card;
}

// Master Render Function (Handles filtering and sorting)
function renderAll() {
    grid.innerHTML = '';
    
    // Apply Sidebar Filters
    let filteredTasks = tasks;
    if (currentFilter === 'active') filteredTasks = tasks.filter(t => !t.done);
    if (currentFilter === 'completed') filteredTasks = tasks.filter(t => t.done);

    // Sort: Active tasks first, completed at the bottom. Then sort by ID (newest first).
    filteredTasks.sort((a, b) => {
        if (a.done === b.done) return b.id - a.id;
        return a.done ? 1 : -1;
    });

    filteredTasks.forEach(task => grid.appendChild(renderTaskCard(task)));
    
    // Re-initialize SVG icons for newly rendered elements
    if(window.lucide) { lucide.createIcons(); }
    updateCounters();
}

// --- GLOBAL BINDINGS ---

// Add New Task
addBtn.addEventListener('click', () => {
    const newTask = { 
        id: Date.now(), 
        title: '',
        dataUrl: null, 
        done: false, 
        isText: false, 
        textContent: "" 
    };
    tasks.unshift(newTask); // Push to front
    saveTasks();
    
    // Switch filter to 'All' or 'Active' to ensure new task is visible
    if(currentFilter === 'completed') {
        document.getElementById('filter-all').click();
    } else {
        renderAll();
    }
    
    // Auto-focus the new task's title for immediate typing
    setTimeout(() => {
        const firstCardTitle = grid.querySelector('.card-title');
        if (firstCardTitle) firstCardTitle.focus();
    }, 50);
});

// Sidebar Filter Navigation
const filters = {
    'filter-all': 'all',
    'filter-active': 'active',
    'filter-completed': 'completed'
};

Object.keys(filters).forEach(btnId => {
    document.getElementById(btnId).addEventListener('click', (e) => {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        e.currentTarget.classList.add('active');
        currentFilter = filters[btnId];
        renderAll();
    });
});

// Theme Toggle System
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.body.removeAttribute('data-theme');
        themeToggle.innerHTML = '<i data-lucide="moon"></i>';
    } else {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i data-lucide="sun"></i>';
    }
    if(window.lucide) { lucide.createIcons(); }
});

// Initialization
if (tasks.length === 0) {
    // Seed with a professional onboarding task
    tasks.push({ 
        id: Date.now(), 
        title: 'Welcome to DrawDo Workspace', 
        dataUrl: null, 
        done: false, 
        isText: true, 
        textContent: "This is your new professional visual workspace.\n\n- Add titles to your tasks.\n- Sketch visual ideas or toggle to Text Mode for notes.\n- Use the sidebar to filter Active/Completed work.\n- Actually delete tasks using the trash icon.\n- Try the Dark Mode toggle in the top right." 
    });
    saveTasks();
}
renderAll();
