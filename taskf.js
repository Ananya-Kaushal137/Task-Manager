/* TaskFlow - Task Manager */

const form = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const categorySelect = document.getElementById('task-category');
const priorityBtns = document.querySelectorAll('.priority-btn');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const filterTabs = document.querySelectorAll('.filter-tab');
const searchInput = document.getElementById('search-input');
const clearCompletedBtn = document.getElementById('clear-completed');
const clearAllBtn = document.getElementById('clear-all');
const toast = document.getElementById('toast');

const totalTasksEl = document.getElementById('total-tasks');
const pendingTasksEl = document.getElementById('pending-tasks');
const completedTasksEl = document.getElementById('completed-tasks');
const itemsLeftEl = document.getElementById('items-left');
const currentDateEl = document.getElementById('current-date');

let tasks = JSON.parse(localStorage.getItem('taskflow-tasks')) || [];
let currentFilter = 'all';
let currentPriority = 'low';
let searchQuery = '';

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function saveTasks() {
    localStorage.setItem('taskflow-tasks', JSON.stringify(tasks));
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showToast(message) {
    const toastMessage = toast.querySelector('.toast-message');
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function updateCurrentDate() {
    currentDateEl.textContent = formatDate(new Date());
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    totalTasksEl.textContent = total;
    pendingTasksEl.textContent = pending;
    completedTasksEl.textContent = completed;
    itemsLeftEl.textContent = pending + ' item' + (pending !== 1 ? 's' : '') + ' left';
}

function renderTasks() {
    let filtered = tasks.filter(task => {
        if (currentFilter === 'active' && task.completed) return false;
        if (currentFilter === 'completed' && !task.completed) return false;
        if (searchQuery && !task.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    filtered.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    if (filtered.length === 0) {
        taskList.innerHTML = '';
        emptyState.classList.add('show');
    } else {
        emptyState.classList.remove('show');
        taskList.innerHTML = filtered.map(task => `
            <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-text">${escapeHtml(task.text)}</div>
                    <div class="task-meta">
                        <span class="task-badge priority-${task.priority}">${task.priority}</span>
                        <span class="task-badge category">${task.category}</span>
                        <span class="task-time">${formatTime(task.createdAt)}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn edit" title="Edit">Edit</button>
                    <button class="task-action-btn delete" title="Delete">Del</button>
                </div>
            </li>
        `).join('');
    }
    updateStats();
}

function addTask(text, priority, category) {
    tasks.unshift({
        id: generateId(),
        text: text.trim(),
        priority,
        category,
        completed: false,
        createdAt: Date.now()
    });
    saveTasks();
    renderTasks();
    showToast('Task added');
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        if (task.completed) showToast('Task completed');
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    showToast('Task deleted');
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        const newText = prompt('Edit task:', task.text);
        if (newText !== null && newText.trim()) {
            task.text = newText.trim();
            saveTasks();
            renderTasks();
            showToast('Task updated');
        }
    }
}

function clearCompleted() {
    const count = tasks.filter(t => t.completed).length;
    if (count === 0) {
        showToast('No completed tasks');
        return;
    }
    if (confirm('Clear ' + count + ' completed task' + (count > 1 ? 's' : '') + '?')) {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        renderTasks();
        showToast('Cleared ' + count + ' task' + (count > 1 ? 's' : ''));
    }
}

function clearAll() {
    if (tasks.length === 0) {
        showToast('No tasks to clear');
        return;
    }
    if (confirm('Delete all tasks?')) {
        tasks = [];
        saveTasks();
        renderTasks();
        showToast('All tasks cleared');
    }
}

// Events
form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (taskInput.value.trim()) {
        addTask(taskInput.value, currentPriority, categorySelect.value);
        taskInput.value = '';
        taskInput.focus();
    }
});

priorityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        priorityBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPriority = btn.dataset.priority;
    });
});

filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        renderTasks();
    });
});

searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTasks();
});

taskList.addEventListener('click', (e) => {
    const item = e.target.closest('.task-item');
    if (!item) return;
    const id = item.dataset.id;

    if (e.target.classList.contains('task-checkbox')) toggleTask(id);
    else if (e.target.closest('.delete')) deleteTask(id);
    else if (e.target.closest('.edit')) editTask(id);
});

clearCompletedBtn.addEventListener('click', clearCompleted);
clearAllBtn.addEventListener('click', clearAll);

// Init
updateCurrentDate();
renderTasks();
setInterval(updateCurrentDate, 60000);