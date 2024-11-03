let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let notifiedTasks = new Set();

document.addEventListener('DOMContentLoaded', () => {
    requestNotificationPermission(); // Request permission on load
    renderTasks();
    checkUpcomingTasks();
});

// Function to request notification permission
function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
}

// Function to check for upcoming tasks and notify
function checkUpcomingTasks() {
    const now = new Date();
    const notificationTime = 60 * 60 * 1000; // 1 jam dalam milidetik
    const oneDayTime = 24 * 60 * 60 * 1000; // 1 hari dalam milidetik

    tasks.forEach((task) => {
        const dueDate = new Date(task.dueDate);
        const timeDifference = dueDate - now;
        const notificationKey = `task_${task.id}_notified`;

        // Notifikasi untuk tugas yang akan jatuh tempo dalam waktu kurang dari 1 jam
        if (timeDifference > 0 && timeDifference <= notificationTime && !task.completed && !localStorage.getItem(notificationKey)) {
            showNotification(`Task "${task.text}" is due in less than 1 hour!`);
            localStorage.setItem(notificationKey, 'true');
        }

        // Notifikasi untuk tugas yang akan jatuh tempo dalam waktu kurang dari 1 hari
        const oneDayNotificationKey = `task_${task.id}_one_day_notified`;
        if (timeDifference > 0 && timeDifference <= oneDayTime && !task.completed && !localStorage.getItem(oneDayNotificationKey)) {
            showNotification(`Task "${task.text}" is due in less than 1 day!`);
            localStorage.setItem(oneDayNotificationKey, 'true');
        }
    });
}

// Function to show notification
function showNotification(message) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(message);
    } else if ("Notification" in window && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(message);
            } else {
                alert(message); // Fallback to alert if permission denied
            }
        });
    } else {
        alert(message); // Alert as fallback
    }
}

// Set interval to check for upcoming tasks every minute
setInterval(checkUpcomingTasks, 60000);

// Open the popup
function openPopup() {
    document.getElementById('task-popup').style.display = 'block';
}

// Close the popup
function closePopup() {
    document.getElementById('task-popup').style.display = 'none';
}

function getAdjustedToday() {
    const today = new Date();
    
    // Tentukan bulan dan tahun
    const month = today.getMonth();
    const year = today.getFullYear();

    // Cek apakah bulan saat ini memiliki 31 hari
    if (month === 1) { // Februari
        // Jika tahun kabisat, atur ke 29, jika tidak, atur ke 28
        today.setDate(year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28);
    } else if ([3, 5, 8, 10].includes(month)) { // April, Juni, September, November
        today.setDate(30); // Bulan ini hanya memiliki 30 hari
    } else {
        today.setDate(31); // Bulan lainnya memiliki 31 hari
    }

    today.setHours(0, 0, 0, 0); // Set waktu menjadi 00:00:00 untuk perbandingan yang tepat
    return today;
}

function addTask() {
    const taskInput = document.getElementById('task-input').value;
    const category = document.getElementById('category-select').value;
    const priority = document.getElementById('priority-select').value;
    const dueDateInput = document.getElementById('due-date').value;
    const dueTimeInput = document.getElementById('due-time').value;
    const repeat = document.getElementById('repeat-select').value;
    const dueDate = new Date(`${dueDateInput}T${dueTimeInput}`);
    
    if (!taskInput || isNaN(dueDate.getTime())) {
        alert("Please enter a task name and a valid due date.");
        return;
    }

    const now = new Date();
    if (dueDate < now) {
        alert("The date and time cannot be before the current time. Please select a valid date and time.");
        return;
    }

    const taskItem = {
        id: Date.now().toString(), // Tambahkan ID unik
        text: taskInput,
        category: category,
        priority: priority,
        dueDate: dueDate.toISOString(),
        repeat: repeat,
        completed: false
    };

    tasks.push(taskItem);
    tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    saveTasks();
    renderTasks();
    checkUpcomingTasks();
    clearInputs();
    closePopup();
    filterTasks();
}

function handleRecurringTasks() {
    const now = new Date();

    tasks.forEach(task => {
        const dueDate = new Date(task.dueDate);

        if (task.completed && task.repeat !== "none") {
            switch (task.repeat) {
                case "daily":
                    dueDate.setDate(dueDate.getDate() + 1);
                    break;
                case "weekly":
                    dueDate.setDate(dueDate.getDate() + 7);
                    break;
                case "monthly":
                    dueDate.setMonth(dueDate.getMonth() + 1);
                    break;
            }

            if (dueDate > now) {
                task.dueDate = dueDate.toISOString();
                task.completed = false;
            }
        }
    });

    saveTasks();
    renderTasks();
}

// Panggil handleRecurringTasks di setInterval atau setelah renderTasks
setInterval(handleRecurringTasks, 60000); // Periksa setiap menit

// Function to create task list item elements
function createTaskListItem(task, index) {
    const listItem = document.createElement('li');
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    
    if (now - dueDate > 60000) {
        listItem.className = `priority-${task.priority.toLowerCase()} overdue`;
    } else {
        listItem.className = `priority-${task.priority.toLowerCase()}`;
    }

    const formattedDate = dueDate.toLocaleDateString();
    const formattedTime = dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const completedClass = task.completed ? 'completed' : '';

    listItem.innerHTML = `
        <div class="task-item ${completedClass}">
            <div>
                <span class="task-text">${task.text}</span>
                ${now - dueDate > 60000 && !task.completed ? '<span class="not-completed">Not Completed</span>' : ''}
            </div>
            <div class="task-category ${task.completed ? 'category-completed' : ''}">${task.category}</div>
            <span class="task-due-date">📅 ${formattedDate}</span>
            <span class="task-due-time">⏰ ${formattedTime}</>
        </div>
        <div class="button-group">
            <button class="done-btn" onclick="finishTask(${tasks.indexOf(task)})" ${task.completed ? 'disabled' : ''}>
                ${task.completed ? 'Completed' : 'finish'}
            </button>
            <button onclick="editTask(${tasks.indexOf(task)})" ${task.completed ? 'disabled' : ''}>Edit</button>
            <button onclick="removeTask(${tasks.indexOf(task)})">Delete</button>
        </div>
    `;

    return listItem;
}

function editTask(index) {
    const task = tasks[index]; // Ambil tugas berdasarkan indeks asli
    const taskId = task.id;
    
    // Hapus status notifikasi berdasarkan ID task
    localStorage.removeItem(`task_${taskId}_notified`);
    
    document.getElementById('task-input').value = task.text;
    document.getElementById('category-select').value = task.category;
    document.getElementById('priority-select').value = task.priority;
    const dueDate = new Date(task.dueDate);
    document.getElementById('due-date').value = dueDate.toISOString().split('T')[0];
    document.getElementById('due-time').value = dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    openPopup();
    removeTask(index); // Menghapus tugas dari daftar
    filterTasks(); // Memperbarui tampilan setelah penghapusan
}

function removeTask(index) {
    const taskId = tasks[index].id;
    // Hapus status notifikasi berdasarkan ID task
    localStorage.removeItem(`task_${taskId}_notified`);
    tasks.splice(index, 1);
    saveTasks();
    filterTasks();
    checkUpcomingTasks();
}

function renderTasks(filteredTasks = tasks) {
    const todayTasks = document.getElementById('today-tasks');
    const thisWeekTasks = document.getElementById('this-week-tasks'); // Ubah ID
    const upcomingTasks = document.getElementById('upcoming-tasks'); // Ubah ID
    const overdueTasks = document.getElementById('overdue-tasks');

    todayTasks.innerHTML = '';
    thisWeekTasks.innerHTML = ''; // Ubah
    upcomingTasks.innerHTML = ''; // Ubah
    overdueTasks.innerHTML = '';

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const nextWeekEnd = new Date(now);
    nextWeekEnd.setDate(now.getDate() + 7); // Menghitung akhir minggu ini

    let todayCount = 0;
    let thisWeekCount = 0; // Ubah
    let upcomingCount = 0; // Ubah
    let overdueCount = 0;

    filteredTasks.forEach((task, index) => {
        const dueDate = new Date(task.dueDate);
        
        // Cek apakah tugas terlewati (lebih dari 1 menit dari waktu jatuh tempo)
        if (now - dueDate > 60000) { // 60000 ms = 1 menit
            overdueTasks.appendChild(createTaskListItem(task, index));
            overdueCount++;
        } else if (dueDate >= todayStart && dueDate <= todayEnd) {
            todayTasks.appendChild(createTaskListItem(task, index));
            todayCount++;
        } else if (dueDate >= todayEnd && dueDate <= nextWeekEnd) { // Ubah logika untuk minggu ini
            thisWeekTasks.appendChild(createTaskListItem(task, index));
            thisWeekCount++; // Ubah
        } else {
            upcomingTasks.appendChild(createTaskListItem(task, index)); // Tugas yang akan datang
            upcomingCount++; // Ubah
        }
    });

    // Update jumlah tugas di setiap kelompok
    updateTaskCount('today', todayCount);
    updateTaskCount('this-week', thisWeekCount); // Ubah
    updateTaskCount('upcoming', upcomingCount); // Ubah
    updateTaskCount('overdue', overdueCount);

    renderStatistics(filteredTasks);
}

function filterTasks() {
    const filterCategory = document.getElementById('filter-category').value;
    const filterPriority = document.getElementById('filter-priority').value;

    // Filter tasks based on selected category and priority
    const filteredTasks = tasks.filter(task => {
        const categoryMatch = filterCategory === 'All' || task.category === filterCategory;
        const priorityMatch = filterPriority === 'All' || task.priority === filterPriority;
        return categoryMatch && priorityMatch;
    });
    
    renderTasks(filteredTasks); // Render filtered tasks
}

function finishTask(index) {
    const task = tasks[index];
    
    if (!task.completed) {
        task.completed = true;
        
        // Jika tugas berulang, atur ulang tanggal jatuh tempo berdasarkan frekuensi pengulangan
        if (task.repeat !== "none") {
            const dueDate = new Date(task.dueDate);

            // Mengatur ulang tanggal jatuh tempo berdasarkan pengaturan pengulangan
            switch (task.repeat) {
                case "daily":
                    dueDate.setDate(dueDate.getDate() + 1);
                    break;
                case "weekly":
                    dueDate.setDate(dueDate.getDate() + 7);
                    break;
                case "monthly":
                    dueDate.setMonth(dueDate.getMonth() + 1);
                    break;
            }

            // Setel tanggal jatuh tempo baru dan tandai sebagai belum selesai
            task.dueDate = dueDate.toISOString();
            task.completed = false; // Tandai tugas berulang sebagai belum selesai
        }

        // Hapus notifikasi berdasarkan ID task jika ada
        const taskId = task.id;
        localStorage.removeItem(`task_${taskId}_notified`);

        // Simpan perubahan ke localStorage dan render ulang tampilan
        saveTasks();
        filterTasks();
    }
}


function renderStatistics(filteredTasks) {
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;

    document.getElementById('total-tasks').innerText = `Total Task: ${totalTasks}`;
    document.getElementById('completed-tasks').innerText = `Completed Task: ${completedTasks}`;
    document.getElementById('pending-tasks').innerText = `Pending Task: ${pendingTasks}`;
}

document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
    toggle.addEventListener('click', function() {
        // Toggle class active pada judul
        this.classList.toggle('active');
        
        // Ambil daftar tugas yang terkait
        const taskList = this.nextElementSibling;
        
        // Toggle class show pada daftar tugas
        taskList.classList.toggle('show');
    });
});

function updateTaskCount(groupId, count) {
    document.getElementById(groupId + '-count').textContent = `(${count})`;
}

// Panggil fungsi ini setiap kali Anda menambah atau menghapus tugas
// Contoh: updateTaskCount('today', 5);

function clearInputs() {
    document.getElementById('task-input').value = '';
    document.getElementById('category-select').value = 'Personal';
    document.getElementById('priority-select').value = 'Low';
    document.getElementById('due-date').value = '';
    document.getElementById('due-time').value = ''; // Reset waktu
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

document.addEventListener('DOMContentLoaded', () => {
    renderTasks();
});