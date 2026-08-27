const grid = document.getElementById('grid');
let tasks = JSON.parse(localStorage.getItem('drawdo_mini')) || [];

function save() { 
    localStorage.setItem('drawdo_mini', JSON.stringify(tasks)); 
}

function createCard(id, dataUrl = null) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <canvas width="200" height="200"></canvas>
        <div class="controls">
            <button class="clear">Clear</button>
            <button class="delete">Delete</button>
        </div>
    `;
    const canvas = card.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    
    if (dataUrl) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = dataUrl;
    }

    let drawing = false, lastX = 0, lastY = 0;
    
    function getCoords(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function start(e) {
        drawing = true;
        let {x, y} = getCoords(e);
        lastX = x; lastY = y;
        e.preventDefault();
    }
    
    function draw(e) {
        if (!drawing) return;
        let {x, y} = getCoords(e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.lineWidth = 3;
        ctx.stroke();
        lastX = x; lastY = y;
        e.preventDefault();
    }
    
    function stop() {
        if (!drawing) return;
        drawing = false;
        let task = tasks.find(t => t.id === id);
        if (task) task.dataUrl = canvas.toDataURL();
        save();
    }

    canvas.onmousedown = start; canvas.onmousemove = draw; 
    canvas.onmouseup = stop; canvas.onmouseout = stop;
    canvas.ontouchstart = start; canvas.ontouchmove = draw; canvas.ontouchend = stop;

    card.querySelector('.clear').onclick = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stop(); 
    };

    card.querySelector('.delete').onclick = () => {
        tasks = tasks.filter(t => t.id !== id);
        save();
        card.remove();
    };

    grid.appendChild(card);
}

tasks.forEach(t => createCard(t.id, t.dataUrl));

document.getElementById('add-btn').onclick = () => {
    let id = Date.now();
    tasks.push({ id, dataUrl: null });
    save();
    createCard(id);
};
