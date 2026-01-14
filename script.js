// Configuration
const defaultConfig = {
  app_title: "My Tasks",
  add_button_text: "Add Task",
  input_placeholder: "What needs to be done?",
  font_family: "Poppins",
  font_size: 16
};

// Application State
let tasks = [];
let currentFilter = 'all';
let isLoading = false;

// 1. Initialization - Runs when the page is ready
function initApp() {
  console.log("App Initializing...");
  loadTasksFromStorage(); 
  setupEventListeners();  
  renderTasks();          
}

// Check if DOM is already loaded, otherwise wait for it
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// --- CORE LOGIC ---

function loadTasksFromStorage() {
  const storedTasks = localStorage.getItem('glassTodoTasks');
  if (storedTasks) {
    tasks = JSON.parse(storedTasks);
  }
}

function saveTasksToStorage() {
  localStorage.setItem('glassTodoTasks', JSON.stringify(tasks));
  renderTasks();
}

async function addTask() {
  const input = document.getElementById('taskInput');
  const text = input.value.trim();

  if (!text || isLoading) return;

  if (tasks.length >= 999) {
    showLimitWarning();
    return;
  }

  setLoadingState(true);
  
  // Simulate a small delay for smooth feel
  await new Promise(r => setTimeout(r, 300)); 

  const newTask = {
    id: Date.now().toString(), // Ensure ID is a string
    text: text,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(newTask); // Add to top of list
  saveTasksToStorage();

  input.value = '';
  setLoadingState(false);
  
  // Re-focus input for typing next task
  input.focus(); 
}

function toggleTask(taskId) {
  // Ensure we are comparing strings to strings
  const taskIndex = tasks.findIndex(t => t.id === String(taskId));
  
  if (taskIndex > -1) {
    tasks[taskIndex].completed = !tasks[taskIndex].completed;
    saveTasksToStorage(); // This triggers a re-render
  } else {
    console.error("Task not found:", taskId);
  }
}

function deleteTask(taskId, taskElement) {
  if (isLoading) return;

  // Visual slide out
  taskElement.classList.add('deleting');

  setTimeout(() => {
    tasks = tasks.filter(t => t.id !== String(taskId));
    saveTasksToStorage();
  }, 400);
}

// --- UI FUNCTIONS ---

function setLoadingState(loading) {
  isLoading = loading;
  const addBtn = document.getElementById('addBtn');
  const addBtnText = document.getElementById('addBtnText');
  const addSpinner = document.getElementById('addSpinner');

  if (loading) {
    addBtn.disabled = true;
    addBtnText.style.display = 'none';
    addSpinner.style.display = 'block';
  } else {
    addBtn.disabled = false;
    addBtnText.style.display = 'inline';
    addSpinner.style.display = 'none';
  }
}

function showLimitWarning() {
  const warning = document.getElementById('limitWarning');
  warning.style.display = 'block';
  setTimeout(() => {
    warning.style.display = 'none';
  }, 3000);
}

function renderTasks() {
  const container = document.getElementById('tasksContainer');
  const emptyState = document.getElementById('emptyState');

  // Filter Logic
  const filteredTasks = tasks.filter(task => {
    if (currentFilter === 'active') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true;
  });

  // Handle Empty State
  if (filteredTasks.length === 0) {
    emptyState.style.display = 'block';
    // If we have tasks but they are hidden by filter, change the message?
    // For simplicity, we just show the empty state or clear container
    if (tasks.length > 0) {
        container.innerHTML = ''; 
        container.appendChild(emptyState);
    } else {
        container.innerHTML = '';
        container.appendChild(emptyState);
    }
  } else {
    emptyState.style.display = 'none';
    container.innerHTML = '';
    
    // Create HTML for tasks
    filteredTasks.forEach(task => {
      const taskEl = createTaskElement(task);
      container.appendChild(taskEl);
    });
  }
}

function createTaskElement(task) {
  const taskEl = document.createElement('div');
  taskEl.className = 'task-item' + (task.completed ? ' completed' : '');
  
  // 1. CHECKBOX CONTAINER
  const checkbox = document.createElement('div');
  checkbox.className = 'task-checkbox' + (task.completed ? ' checked' : '');
  
  // SVG Icon
  checkbox.innerHTML = `
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  `;
  
  // CLICK LISTENER FOR CHECKBOX
  // We use addEventListener instead of onclick for better reliability
  checkbox.addEventListener('click', (e) => {
      e.stopPropagation(); // Stop bubbling
      toggleTask(task.id);
  });

  // 2. TEXT
  const text = document.createElement('div');
  text.className = 'task-text';
  text.textContent = task.text;
  // Allow clicking text to also toggle
  text.addEventListener('click', () => toggleTask(task.id));

  // 3. DELETE BUTTON
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'task-delete';
  deleteBtn.innerHTML = `
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  `;
  deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(task.id, taskEl);
  });

  taskEl.appendChild(checkbox);
  taskEl.appendChild(text);
  taskEl.appendChild(deleteBtn);

  return taskEl;
}

function setFilter(filter) {
  currentFilter = filter;
  
  // Update Visuals on Tabs
  document.querySelectorAll('.filter-btn').forEach(btn => {
    // Remove active class from all
    btn.classList.remove('active');
    btn.setAttribute('aria-selected', 'false');
    
    // Add active class to clicked
    if (btn.dataset.filter === filter) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    }
  });

  // Re-render the list
  renderTasks();
}

function setupEventListeners() {
  // Add Task Button
  const addBtn = document.getElementById('addBtn');
  if(addBtn) addBtn.addEventListener('click', addTask);

  // Enter Key on Input
  const taskInput = document.getElementById('taskInput');
  if(taskInput) {
      taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          addTask();
        }
      });
  }

  // Filter Buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filterValue = e.target.closest('.filter-btn').dataset.filter;
      setFilter(filterValue);
    });
  });
}