document.addEventListener("DOMContentLoaded", () => {
    let timer;
    let isRunning = false;
    let isWorkTime = true;
    let breakDuration = parseInt(localStorage.getItem('breakDuration')) || 5 * 60;  // default 5 minutes
    let timeLeft = 0;
    let workCounter = parseInt(localStorage.getItem('workCounter')) || 0;
    let breakCounter = parseInt(localStorage.getItem('breakCounter')) || 0;
    let completedTaskCounter = parseInt(localStorage.getItem('completedTaskCounter')) || 0;
    let totalWorkTime = parseInt(localStorage.getItem('totalWorkTime')) || 0;
    let totalBreakTime = parseInt(localStorage.getItem('totalBreakTime')) || 0;
    let pomodoroCycleCounter = parseInt(localStorage.getItem('pomodoroCycleCounter')) || 0;
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentTaskId = null;
    let autoStartNext = localStorage.getItem('autoStartNext') === 'true';
    let idleTime = 0;
    const idleLimit = 5 * 60 * 1000; // 5 minutes

    const timerDisplay = document.getElementById('timer');
    const startButton = document.getElementById('start-button');
    const pauseButton = document.getElementById('pause-button');
    const resetButton = document.getElementById('reset-button');
    const breakInput = document.getElementById('break-duration');
    const workCounterDisplay = document.getElementById('work-counter');
    const breakCounterDisplay = document.getElementById('break-counter');
    const completedTaskCounterDisplay = document.getElementById('completed-task-counter');
    const totalWorkTimeDisplay = document.getElementById('total-work-time');
    const totalBreakTimeDisplay = document.getElementById('total-break-time');
    const pomodoroCycleCounterDisplay = document.getElementById('pomodoro-cycle-counter');
    const notificationSound = document.getElementById('notification-sound');
    const notificationMessageInput = document.getElementById('notification-message');
    const notificationSoundFileInput = document.getElementById('notification-sound-file');
    const progressBar = document.getElementById('progress-bar');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const taskInput = document.getElementById('new-task');
    const taskDurationInput = document.getElementById('task-duration');
    const taskPrioritySelect = document.getElementById('task-priority');
    const taskDeadlineInput = document.getElementById('task-deadline');
    const addTaskButton = document.getElementById('add-task-button');
    const taskList = document.getElementById('task-list');
    const soundNotificationsCheckbox = document.getElementById('sound-notifications');
    const desktopNotificationsCheckbox = document.getElementById('desktop-notifications');
    const autoStartNextCheckbox = document.getElementById('auto-start-next');
    const exportTasksButton = document.getElementById('export-tasks');
    const importTasksButton = document.getElementById('import-tasks');
    const importTasksFileInput = document.getElementById('import-tasks-file');
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const closeButton = document.querySelector('.close-button');
    const saveSettingsButton = document.getElementById('save-settings');
    const progressReportButton = document.getElementById('progress-report-button');
    const progressReportModal = document.getElementById('progress-report-modal');
    const progressCloseButton = document.querySelector('.progress-close-button');
    const progressContent = document.getElementById('progress-content');

    breakInput.value = breakDuration / 60;
    autoStartNextCheckbox.checked = autoStartNext;
    workCounterDisplay.textContent = workCounter;
    breakCounterDisplay.textContent = breakCounter;
    completedTaskCounterDisplay.textContent = completedTaskCounter;
    totalWorkTimeDisplay.textContent = totalWorkTime;
    totalBreakTimeDisplay.textContent = totalBreakTime;
    pomodoroCycleCounterDisplay.textContent = pomodoroCycleCounter;

    function updateDisplay() {
        if (timeLeft <= 0 && !isRunning) {
            timerDisplay.textContent = "00:00";
        } else {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerDisplay.textContent = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
        updateProgressBar();
    }

    function updateProgressBar() {
        const totalDuration = isWorkTime ? getCurrentTaskDuration() : breakDuration;
        const progress = (totalDuration - timeLeft) / totalDuration * 100;
        progressBar.style.width = `${progress}%`;
    }

    function getCurrentTaskDuration() {
        if (currentTaskId !== null) {
            const task = tasks.find(task => task.id === currentTaskId);
            return task ? task.duration : 0;
        }
        return 0;
    }

    function startTimer() {
        if (!isRunning) {
            if (isWorkTime && currentTaskId === null) {
                alert('Please add a task with a duration to start the timer.');
                return;
            }
            timer = setInterval(() => {
                if (timeLeft > 0) {
                    timeLeft--;
                    updateDisplay();
                    idleTime = 0; // Reset idle time on each timer tick
                } else {
                    if (soundNotificationsCheckbox.checked) {
                        notificationSound.play();
                    }
                    if (desktopNotificationsCheckbox.checked) {
                        showDesktopNotification();
                    }
                    clearInterval(timer);
                    isRunning = false;
                    if (isWorkTime) {
                        completeCurrentTask();
                        startBreak();
                    } else {
                        startNextTask();
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
        timeLeft = 0;
        updateDisplay();
    }

    function updateBreakDuration() {
        breakDuration = parseInt(breakInput.value) * 60 || 0;
        if (isNaN(breakDuration) || breakDuration <= 0) {
            alert("Please enter a valid break duration.");
            return;
        }
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
        const taskDuration = parseInt(taskDurationInput.value) || 0;
        const taskPriority = parseInt(taskPrioritySelect.value);
        const taskDeadline = taskDeadlineInput.value;

        if (taskText === '') {
            alert("Task text cannot be empty.");
            return;
        }
        if (isNaN(taskDuration) || taskDuration <= 0) {
            alert("Please enter a valid task duration.");
            return;
        }

        const task = {
            id: Date.now(),
            text: taskText,
            duration: taskDuration * 60,
            priority: taskPriority,
            deadline: taskDeadline,
            completed: false,
            isEditing: false,
            log: []
        };

        tasks.push(task);
        tasks.sort((a, b) => b.priority - a.priority);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
        taskInput.value = '';
        taskDurationInput.value = '';
        taskPrioritySelect.value = '1';
        taskDeadlineInput.value = '';
    }

    function renderTasks() {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            if (task.completed) {
                li.classList.add('completed');
            }
            if (task.isEditing) {
                li.innerHTML = `
                    <div class="task-row">
                        <input type="text" value="${task.text}" id="edit-task-text-${task.id}">
                        <input type="number" value="${task.duration / 60}" id="edit-task-duration-${task.id}">
                        <select id="edit-task-priority-${task.id}">
                            <option value="1" ${task.priority === 1 ? 'selected' : ''}>Low</option>
                            <option value="2" ${task.priority === 2 ? 'selected' : ''}>Medium</option>
                            <option value="3" ${task.priority === 3 ? 'selected' : ''}>High</option>
                        </select>
                        <input type="datetime-local" value="${task.deadline}" id="edit-task-deadline-${task.id}">
                    </div>
                    <div class="task-row">
                        <button onclick="saveTask(${task.id})">💾</button>
                        <button onclick="cancelEdit(${task.id})">✖️</button>
                    </div>
                `;
            } else {
                const deadlineText = task.deadline ? `<span>Deadline: ${new Date(task.deadline).toLocaleString()}</span>` : '';
                li.innerHTML = `
                    <div class="task-row">
                        <span>${task.text}</span>
                        <span>Duration: ${task.duration / 60} min</span>
                        <span>Priority: ${task.priority}</span>
                    </div>
                    <div class="task-row">
                        ${deadlineText}
                        <button onclick="editTask(${task.id})">✏️</button>
                        <button onclick="completeTask(${task.id})">✔️</button>
                        <button onclick="removeTask(${task.id})">❌</button>
                        <button onclick="setTaskDuration(${task.id})">⏲️</button>
                    </div>
                `;
            }
            taskList.appendChild(li);
        });
        updateTimerDisplay();
    }

    function updateTimerDisplay() {
        if (tasks.length === 0) {
            timerDisplay.textContent = "00:00";
        }
    }

    function logCompletedTask(task) {
        let completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || [];
        completedTasks.push(task);
        localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
    }
    

    window.completeTask = function(taskId) {
        tasks = tasks.map(task => {
            if (task.id === taskId) {
                const actualDuration = (task.duration - timeLeft) / 60;
                task.completed = true;
                task.text += ` (completed in ${actualDuration.toFixed(2)} min)`;
                completedTaskCounter++;
                completedTaskCounterDisplay.textContent = completedTaskCounter;
                localStorage.setItem('completedTaskCounter', completedTaskCounter);
                task.log.push({ time: new Date().toLocaleString(), duration: actualDuration.toFixed(2) });
                logCompletedTask(task); // Log the completed task
            }
            return task;
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
        pauseTimer();
        if (autoStartNext) {
            startBreak();
        }
    }

    window.removeTask = function(taskId) {
        tasks = tasks.filter(task => task.id !== taskId);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
    }

    window.editTask = function(taskId) {
        tasks = tasks.map(task => {
            if (task.id === taskId) {
                task.isEditing = true;
            }
            return task;
        });
        renderTasks();
    }

    window.saveTask = function(taskId) {
        const task = tasks.find(task => task.id === taskId);
        if (task) {
            const newText = document.getElementById(`edit-task-text-${task.id}`).value.trim();
            const newDuration = parseInt(document.getElementById(`edit-task-duration-${task.id}`).value) * 60;
            const newPriority = parseInt(document.getElementById(`edit-task-priority-${task.id}`).value);
            const newDeadline = document.getElementById(`edit-task-deadline-${task.id}`).value;

            if (newText === '') {
                alert("Task text cannot be empty.");
                return;
            }
            if (isNaN(newDuration) || newDuration <= 0) {
                alert("Please enter a valid task duration.");
                return;
            }

            task.text = newText;
            task.duration = newDuration;
            task.priority = newPriority;
            task.deadline = newDeadline;
            task.isEditing = false;
            localStorage.setItem('tasks', JSON.stringify(tasks));
            renderTasks();
        }
    }

    window.cancelEdit = function(taskId) {
        tasks = tasks.map(task => {
            if (task.id === taskId) {
                task.isEditing = false;
            }
            return task;
        });
        renderTasks();
    }

    window.setTaskDuration = function(taskId) {
        const task = tasks.find(task => task.id === taskId);
        if (task) {
            currentTaskId = taskId;
            timeLeft = task.duration;
            isWorkTime = true;
            updateDisplay();
        }
    }

    function startBreak() {
        isWorkTime = false;
        timeLeft = breakDuration;
        updateDisplay();
        if (autoStartNext) {
            startTimer();
        }
    }

    function startNextTask() {
        const nextTask = tasks.find(task => !task.completed);
        if (nextTask) {
            setTaskDuration(nextTask.id);
            startTimer();
        } else {
            timeLeft = 0;
            updateDisplay();
        }
    }

    function completeCurrentTask() {
        if (currentTaskId !== null) {
            completeTask(currentTaskId);
            currentTaskId = null;
        }
    }

    function showDesktopNotification() {
        if (Notification.permission === 'granted') {
            const notificationMessage = notificationMessageInput.value || (isWorkTime ? 'Time for a break!' : 'Back to work!');
            const notification = new Notification('Pomodoro Timer', {
                body: notificationMessage,
                icon: 'icon.png'
            });
        }
    }

    function exportTasks() {
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = 'tasks.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    function importTasks(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const importedTasks = JSON.parse(e.target.result);
                tasks = importedTasks;
                localStorage.setItem('tasks', JSON.stringify(tasks));
                renderTasks();
            }
            reader.readAsText(file);
        }
    }

    notificationSoundFileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                notificationSound.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    });

    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }

    startButton.addEventListener('click', startTimer);
    pauseButton.addEventListener('click', pauseTimer);
    resetButton.addEventListener('click', resetTimer);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    addTaskButton.addEventListener('click', addTask);
    autoStartNextCheckbox.addEventListener('change', (e) => {
        autoStartNext = e.target.checked;
        localStorage.setItem('autoStartNext', autoStartNext);
    });
    exportTasksButton.addEventListener('click', exportTasks);
    importTasksButton.addEventListener('click', () => importTasksFileInput.click());
    importTasksFileInput.addEventListener('change', importTasks);

    // Settings modal logic
    settingsButton.addEventListener('click', () => {
        settingsModal.style.display = 'block';
    });

    closeButton.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    saveSettingsButton.addEventListener('click', () => {
        updateBreakDuration();
        localStorage.setItem('notificationMessage', notificationMessageInput.value);
        notificationSound.src = notificationSoundFileInput.value;
        settingsModal.style.display = 'none';
    });

    // Idle detection
    function resetIdleTimer() {
        idleTime = 0;
    }

    function checkIdleTime() {
        idleTime += 1000; // Increase idle time by 1 second
        if (idleTime >= idleLimit) {
            pauseTimer();
            alert("Timer paused due to inactivity.");
            idleTime = 0; // Reset idle time after pausing
        }
    }

    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keypress', resetIdleTimer);
    setInterval(checkIdleTime, 1000); // Check idle time every second

    renderTasks();
    updateDisplay();
});
