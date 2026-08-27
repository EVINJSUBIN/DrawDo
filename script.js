
let tasks = JSON.parse(localStorage.getItem('drawdo_pro_tasks')) || [];
let currentFilter = 'all'; 
function saveTasks() {
    localStorage.setItem('drawdo_pro_tasks', JSON.stringify(tasks));
    updateCounters();
}
function showToast(message, icon = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i data-lucide="${icon}"></i> ${message}`;
    container.appendChild(toast);
    if(window.lucide) { lucide.createIcons(); }
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
const grid = document.getElementById('grid');
const addBtn = document.getElementById('add-btn');
function updateCounters() {
    const activeCount = tasks.filter(t => !t.done).length;
    document.getElementById('task-counter').textContent = `${activeCount} Active Task${activeCount !== 1 ? 's' : ''}`;
}
function setupCanvasDrawing(card, canvas, task) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const colorPicker = card.querySelector('.color-picker');
    const sizeSlider = card.querySelector('.size-slider');
    canvas.width = 600;
    canvas.height = 600;
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
        if (task.isNeon) {
            ctx.shadowBlur = parseInt(sizeSlider.value) * 1.5;
            ctx.shadowColor = colorPicker.value;
            ctx.strokeStyle = '#ffffff'; 
        } else {
            ctx.shadowBlur = 0;
            ctx.strokeStyle = colorPicker.value;
        }
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
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
}
function setup3DTilt(card) {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left; 
        const y = e.clientY - rect.top;  
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -8; 
        const rotateY = ((x - centerX) / centerX) * 8;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });
}
function renderTaskCard(task) {
    if (task.isNeon === undefined) task.isNeon = false; 
    const card = document.createElement('div');
    card.className = `card ${task.done ? 'done' : ''}`;
    card.id = `task-${task.id}`;
    card.innerHTML = `
        <div class="card-header">
            <input type="text" class="card-title" placeholder="What's the mission?" value="${task.title || ''}">
            <div class="card-actions">
                <button class="icon-btn check-btn" title="Complete Mission">
                    <i data-lucide="${task.done ? 'check-circle-2' : 'circle'}"></i>
                </button>
                <button class="icon-btn danger delete-btn" title="Obliterate Task">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        </div>
        <div class="task-content">
            <canvas style="display: ${task.isText ? 'none' : 'block'};"></canvas>
            <textarea class="text-mode-input" style="display: ${task.isText ? 'block' : 'none'};" placeholder="Type coordinates...">${task.textContent || ''}</textarea>
        </div>
        <div class="toolbar">
            <div class="draw-tools" style="visibility: ${task.isText ? 'hidden' : 'visible'};">
                <input type="color" class="color-picker" value="#3b82f6" title="Brush Color">
                <input type="range" class="size-slider" min="1" max="40" value="6" title="Brush Thickness">
                <button class="icon-btn neon-btn ${task.isNeon ? 'active-neon' : ''}" title="Toggle Neon Glow" style="margin-left:8px;">
                    <i data-lucide="zap"></i>
                </button>
                <button class="icon-btn clear-btn" title="Wipe Slate" style="margin-left:4px;">
                    <i data-lucide="eraser"></i>
                </button>
            </div>
            <button class="mode-toggle">
                ${task.isText ? 'Draw Mode' : 'Type Mode'}
            </button>
        </div>
    `;
    const titleInput = card.querySelector('.card-title');
    const checkBtn = card.querySelector('.check-btn');
    const deleteBtn = card.querySelector('.delete-btn');
    const clearBtn = card.querySelector('.clear-btn');
    const neonBtn = card.querySelector('.neon-btn');
    const modeToggle = card.querySelector('.mode-toggle');
    const canvas = card.querySelector('canvas');
    const textarea = card.querySelector('.text-mode-input');
    const drawTools = card.querySelector('.draw-tools');
    setupCanvasDrawing(card, canvas, task);
    setup3DTilt(card);
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
        renderAll(); 
        showToast(task.done ? 'Mission Accomplished' : 'Mission Reactivated', 'check-circle');
    });
    deleteBtn.addEventListener('click', () => {
        card.classList.add('shattering'); 
        setTimeout(() => {
            tasks = tasks.filter(t => t.id !== task.id);
            saveTasks();
            card.remove(); 
            updateCounters();
            showToast('Task Obliterated', 'zap');
        }, 550); 
    });
    clearBtn.addEventListener('click', () => {
        if (task.done || task.isText) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        task.dataUrl = canvas.toDataURL();
        saveTasks();
    });
    neonBtn.addEventListener('click', () => {
        if (task.done || task.isText) return;
        task.isNeon = !task.isNeon;
        if(task.isNeon) {
            neonBtn.classList.add('active-neon');
            showToast('Neon Brush Activated', 'sparkles');
        } else {
            neonBtn.classList.remove('active-neon');
        }
        saveTasks();
    });
    modeToggle.addEventListener('click', () => {
        if (task.done) return;
        task.isText = !task.isText;
        canvas.style.display = task.isText ? 'none' : 'block';
        textarea.style.display = task.isText ? 'block' : 'none';
        drawTools.style.visibility = task.isText ? 'hidden' : 'visible';
        modeToggle.textContent = task.isText ? 'Draw Mode' : 'Type Mode';
        saveTasks();
    });
    return card;
}
function renderAll() {
    grid.innerHTML = '';
    let filteredTasks = tasks;
    if (currentFilter === 'active') filteredTasks = tasks.filter(t => !t.done);
    if (currentFilter === 'completed') filteredTasks = tasks.filter(t => t.done);
    filteredTasks.sort((a, b) => {
        if (a.done === b.done) return b.id - a.id;
        return a.done ? 1 : -1;
    });
    filteredTasks.forEach(task => grid.appendChild(renderTaskCard(task)));
    if(window.lucide) { lucide.createIcons(); }
    updateCounters();
}
addBtn.addEventListener('click', () => {
    const newTask = { 
        id: Date.now(), 
        title: '',
        dataUrl: null, 
        done: false, 
        isText: false, 
        textContent: "",
        isNeon: false
    };
    tasks.unshift(newTask); 
    saveTasks();
    if(currentFilter === 'completed') {
        document.getElementById('filter-all').click();
    } else {
        renderAll();
    }
    setTimeout(() => {
        const firstCardTitle = grid.querySelector('.card-title');
        if (firstCardTitle) firstCardTitle.focus();
    }, 50);
});
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
if (tasks.length === 0) {
    tasks.push({ 
        id: Date.now(), 
        title: 'Try the GOATED Features', 
        dataUrl: null, 
        done: false, 
        isText: false, 
        textContent: "",
        isNeon: true 
    });
    saveTasks();
}
renderAll();
