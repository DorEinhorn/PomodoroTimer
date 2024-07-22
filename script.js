let timer;
let isRunning = false;
let isWorkTime = true;
let defaultWorkDuration = 25 * 60; // default 25 minutes
let workDuration = parseInt(localStorage.getItem('workDuration')) || defaultWorkDuration;
let breakDuration = parseInt(localStorage.getItem('breakDuration')) || 5 * 60;  // default 5 minutes
let timeLeft = workDuration;
let workCounter = parseInt(localStorage.getItem('workCounter')) || 0;
let breakCounter = parseInt(localStorage.getItem('breakCounter')) || 0;
let completedTaskCounter = parseInt(localStorage.getItem('completedTaskCounter')) || 0;
let totalWorkTime = parseInt(localStorage.getItem('totalWorkTime')) || 0;
let totalBreakTime = parseInt(localStorage.getItem('totalBreakTime')) || 0;
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentTaskId = null;
let taskStartTime = 0;
let pomodorosBeforeLongBreak = parseInt(localStorage.getItem('pomodorosBeforeLongBreak')) || 4;
let pomodoroCount = 0;

const timerDisplay = document.getElementById('timer');
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const resetButton = document.getElementById('reset-button');
const workInput = document.getElementById('work-duration');
const breakInput = document.getElementById('break-duration');
const workCounterDisplay = document.getElementById('work-counter');
const breakCounterDisplay = document.getElementById('break-counter');
const completedTaskCounterDisplay = document.getElementById('completed-task-counter');
const totalWorkTimeDisplay = document.getElementById('total-work-time');
const totalBreakTimeDisplay = document.getElementById('total-break-time');
const notificationSound = document.getElementById('notification-sound');
const progressBar = document.getElementById('progress-bar');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const taskInput = document.getElementById('new-task');
const taskDurationInput = document.getElementById('task-duration');
const taskPrioritySelect = document.getElementById('task-priority');
const addTaskButton = document.getElementById('add-task-button');
const taskList = document.getElementById('task-list');

workInput.value = workDuration / 60;
breakInput.value = breakDuration / 60;
workCounterDisplay.textContent = workCounter;
breakCounterDisplay.textContent = breakCounter;
completedTaskCounterDisplay.textContent = completedTaskCounter;
totalWorkTimeDisplay.textContent = totalWorkTime;
totalBreakTimeDisplay.textContent = totalBreakTime;

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    updateProgressBar();
}

function updateProgressBar() {
    const totalDuration = isWorkTime ? workDuration : breakDuration;
    const progress = (totalDuration - timeLeft) / totalDuration * 100;
    progressBar.style.width = `${progress}%`;
}

function startTimer() {
    if (!isRunning) {
        timer = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();
            } else {
                notificationSound.play();
                clearInterval(timer);
                isRunning = false;
                if (isWorkTime) {
                    workCounter++;
                    workCounterDisplay.textContent = workCounter;
                    localStorage.setItem('workCounter', workCounter);
                    totalWorkTime += workDuration / 60;
                    totalWorkTimeDisplay.textContent = totalWorkTime;
                    localStorage.setItem('totalWorkTime', totalWorkTime);
                    completeCurrentTask();
                    pomodoroCount++;
                    if (pomodoroCount % pomodorosBeforeLongBreak === 0) {
                        startLongBreak();
                    } else {
                        startBreak();
                    }
                } else {
                    breakCounter++;
                    breakCounterDisplay.textContent = breakCounter;
                    localStorage.setItem('breakCounter', breakCounter);
                    totalBreakTime += breakDuration / 60;
                    totalBreakTimeDisplay.textContent = totalBreakTime;
                    localStorage.setItem('totalBreakTime', totalBreakTime);
                    isWorkTime = true;
                    updateDisplay();
                }
            }
        }, 1000);
        isRunning = true;
    }
}

function pauseTimer() {
    if (isRunning) {
        clearInterval(timer);
        isRunning = false;
    }
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    isWorkTime = true;
    currentTaskId = null;
    workDuration = parseInt(workInput.value) * 60 || defaultWorkDuration;
    breakDuration = parseInt(breakInput.value) * 60 || 0;
    timeLeft = workDuration;
    localStorage.setItem('workDuration', workDuration);
    localStorage.setItem('breakDuration', breakDuration);
    updateDisplay();
}

function updateWorkDuration() {
    workDuration = parseInt(workInput.value) * 60 || 0;
    localStorage.setItem('workDuration', workDuration);
    if (!isRunning && isWorkTime) {
        timeLeft = workDuration;
        updateDisplay();
    }
}

function updateBreakDuration() {
    breakDuration = parseInt(breakInput.value) * 60 || 0;
    localStorage.setItem('breakDuration', breakDuration);
    if (!isRunning && !isWorkTime) {
        timeLeft = breakDuration;
        updateDisplay();
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

function addTask() {
    const taskText = taskInput.value.trim();
    const taskDuration = parseInt(taskDurationInput.value) || defaultWorkDuration / 60;
    const taskPriority = parseInt(taskPrioritySelect.value);
    if (taskText !== '') {
        const task = {
            id: Date.now(),
            text: taskText,
            duration: taskDuration * 60,
            priority: taskPriority,
            completed: false,
        };
        tasks.push(task);
        tasks.sort((a, b) => b.priority - a.priority);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
        taskInput.value = '';
        taskDurationInput.value = '';
        taskPrioritySelect.value = '1';
    }
}

function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item';
        if (task.completed) {
            li.classList.add('completed');
        }
        li.innerHTML = `
            <span>${task.text} (${task.duration / 60} min) [Priority: ${task.priority}]</span>
            <button onclick="completeTask(${task.id})">✔️</button>
            <button onclick="removeTask(${task.id})">❌</button>
            <button onclick="setTaskDuration(${task.id})">⏲️</button>
        `;
        taskList.appendChild(li);
    });
}

function completeTask(taskId) {
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            const actualDuration = (task.duration - timeLeft) / 60;
            task.completed = true;
            task.text += ` (completed in ${actualDuration.toFixed(2)} min)`;
            completedTaskCounter++;
            completedTaskCounterDisplay.textContent = completedTaskCounter;
            localStorage.setItem('completedTaskCounter', completedTaskCounter);
        }
        return task;
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
    pauseTimer();
    startBreak();
}

function removeTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
}

function setTaskDuration(taskId) {
    const task = tasks.find(task => task.id === taskId);
    if (task) {
        currentTaskId = taskId;
        workDuration = task.duration;
        timeLeft = workDuration;
        updateDisplay();
    }
}

function startBreak() {
    isWorkTime = false;
    timeLeft = breakDuration;
    updateDisplay();
}

function startLongBreak() {
    isWorkTime = false;
    timeLeft = breakDuration * 2; // Example of long break being twice the break duration
    updateDisplay();
}

function completeCurrentTask() {
    if (currentTaskId !== null) {
        completeTask(currentTaskId);
        currentTaskId = null;
    }
}

startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
resetButton.addEventListener('click', resetTimer);
workInput.addEventListener('input', updateWorkDuration);
breakInput.addEventListener('input', updateBreakDuration);
darkModeToggle.addEventListener('click', toggleDarkMode);
addTaskButton.addEventListener('click', addTask);

renderTasks();
updateDisplay();
