// Get references to DOM elements
const grid = document.getElementById('grid');
const addBtn = document.getElementById('add-btn');

// --- GAMIFICATION SYSTEM ---
// Load player stats from local storage
let stats = JSON.parse(localStorage.getItem('drawdo_stats')) || { level: 1, xp: 0 };
const xpPerTask = 20; // How much XP you get for finishing a task
const xpToNextLevel = 100;

function saveStats() {
    localStorage.setItem('drawdo_stats', JSON.stringify(stats));
}

// Update the UI Header with current XP and Level
function updateStatsUI() {
    document.getElementById('level-display').textContent = stats.level;
    document.getElementById('xp-display').textContent = stats.xp;
    const progress = (stats.xp / xpToNextLevel) * 100;
    document.getElementById('xp-fill').style.width = `${progress}%`;
}

// Simple Web Audio Synth for retro sound effects (No external audio files needed!)
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSuccessSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'square'; // 8-bit retro sound
    osc.frequency.setValueAtTime(440, audioCtx.currentTime); // Pitch start
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // Pitch slide up
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Volume start
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2); // Fade out
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

// Handle giving XP and Leveling Up
function giveXP(amount) {
    stats.xp += amount;
    if (stats.xp >= xpToNextLevel) {
        // LEVEL UP!
        stats.level += 1;
        stats.xp -= xpToNextLevel;
        
        // Massive Confetti Explosion!
        confetti({ 
            particleCount: 200, 
            spread: 120, 
            origin: { y: 0.4 }, 
            colors: ['#fbbf24', '#f87171', '#34d399', '#60a5fa'] 
        });
    }
    saveStats();
    updateStatsUI();
}

// Initialize Stats UI on load
updateStatsUI();


// --- TASK MANAGEMENT SYSTEM ---
// Load tasks from localStorage or start with one empty task
let tasks = JSON.parse(localStorage.getItem('drawdo_tasks')) || [
    { id: Date.now().toString(), dataUrl: null, done: false, isText: false, textContent: "" }
];

function saveTasks() {
    localStorage.setItem('drawdo_tasks', JSON.stringify(tasks));
}

// Setup the Canvas Drawing Engine
function setupCanvasDrawing(card, canvas, task) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const colorPicker = card.querySelector('.color-picker');
    const sizeSlider = card.querySelector('.size-slider');
    
    canvas.width = 300;
    canvas.height = 300;

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

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
        if (task.done || task.isText) return; // Prevent drawing if done or in text mode
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
            task.dataUrl = canvas.toDataURL(); // Save canvas as image
            saveTasks();
        }
    }

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
}

// Build and render a single task card
function renderTaskCard(task) {
    // Backwards compatibility for old saved tasks
    if(task.isText === undefined) task.isText = false;
    if(task.textContent === undefined) task.textContent = "";

    const card = document.createElement('div');
    card.className = `card ${task.done ? 'done-task' : ''}`;
    card.id = `task-${task.id}`;
    
    card.innerHTML = `
        <div class="tools">
            <div class="draw-tools" style="display: ${task.isText ? 'none' : 'flex'}; gap: 0.5rem; align-items: center;">
                <input type="color" class="color-picker" value="#1a202c" title="Brush Color">
                <input type="range" class="size-slider" min="1" max="25" value="4" title="Brush Size">
            </div>
            <div class="text-tools" style="display: ${task.isText ? 'flex' : 'none'}; font-weight: bold; color: rgba(0,0,0,0.5);">
                ⌨️ Typing Mode
            </div>
            <button class="btn-toggle-mode">${task.isText ? '🖌️ Draw' : '⌨️ Type'}</button>
        </div>
        <div class="task-content-area">
            <canvas style="display: ${task.isText ? 'none' : 'block'};"></canvas>
            <textarea class="text-mode-input" style="display: ${task.isText ? 'block' : 'none'};" placeholder="Type your quest here...">${task.textContent}</textarea>
        </div>
        <div class="controls">
            <button class="btn-clear">🗑️ Clear</button>
            <button class="btn-done">${task.done ? '↩️ Undo' : '⭐ Done!'}</button>
        </div>
    `;
    
    const canvas = card.querySelector('canvas');
    const textarea = card.querySelector('.text-mode-input');
    const clearBtn = card.querySelector('.btn-clear');
    const doneBtn = card.querySelector('.btn-done');
    const toggleBtn = card.querySelector('.btn-toggle-mode');
    const drawTools = card.querySelector('.draw-tools');
    const textTools = card.querySelector('.text-tools');
    
    setupCanvasDrawing(card, canvas, task);
    
    // Toggle Mode Logic (Draw <-> Type)
    toggleBtn.addEventListener('click', () => {
        if (task.done) return;
        task.isText = !task.isText; // flip the mode
        
        // Update visibility
        canvas.style.display = task.isText ? 'none' : 'block';
        textarea.style.display = task.isText ? 'block' : 'none';
        drawTools.style.display = task.isText ? 'none' : 'flex';
        textTools.style.display = task.isText ? 'flex' : 'none';
        toggleBtn.textContent = task.isText ? '🖌️ Draw' : '⌨️ Type';
        
        saveTasks();
    });

    // Save typing automatically
    textarea.addEventListener('input', (e) => {
        task.textContent = e.target.value;
        saveTasks();
    });

    // Clear Button Logic
    clearBtn.addEventListener('click', () => {
        if (task.done) return;
        if (task.isText) {
            textarea.value = "";
            task.textContent = "";
        } else {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            task.dataUrl = canvas.toDataURL();
        }
        saveTasks();
    });

    // Gamified Done Logic!
    doneBtn.addEventListener('click', () => {
        task.done = !task.done;
        
        if (task.done) {
            card.classList.add('done-task');
            doneBtn.textContent = '↩️ Undo';
            textarea.disabled = true;
            
            // GAMIFICATION PAYOFF
            playSuccessSound(); // Play 8-bit sound
            
            // Pop confetti from the card's location on screen
            const rect = card.getBoundingClientRect();
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { 
                    x: (rect.left + (rect.width/2)) / window.innerWidth,
                    y: (rect.top + (rect.height/2)) / window.innerHeight 
                }
            });
            
            giveXP(xpPerTask); // Award XP!

        } else {
            card.classList.remove('done-task');
            doneBtn.textContent = '⭐ Done!';
            textarea.disabled = false;
        }
        
        saveTasks();
    });

    return card;
}

// Render all tasks onto the grid
function renderAll() {
    grid.innerHTML = ''; 
    tasks.forEach(task => grid.appendChild(renderTaskCard(task)));
}

// "Add New Quest" button logic
addBtn.addEventListener('click', () => {
    tasks.push({ id: Date.now().toString(), dataUrl: null, done: false, isText: false, textContent: "" });
    saveTasks();
    renderAll();
});

renderAll();
