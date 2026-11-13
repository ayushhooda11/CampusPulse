
// ==========================================
// CAMPUSPULSE 4.1
// Professional Student Productivity Dashboard
// JavaScript-only interface and styling
// ==========================================

const app = document.createElement("div");
document.body.appendChild(app);

document.body.style.cssText =
    "margin:0;background:#080808;color:white;font-family:Arial,sans-serif;";

const STORAGE_KEY = "campuspulse_v41";

let saved = {};

try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
} catch {
    saved = {};
}

let tasks = saved.tasks || [];
let completedSessions = saved.sessions || [];

let selectedMinutes = 25;
let remainingSeconds = 25 * 60;
let timerInterval = null;
let isRunning = false;


// ==========================================
// SOUND EFFECTS (Web Audio API)
// ==========================================

let audioContext = null;
let alarmOscillator = null;
let alarmGain = null;
let alarmStopTimer = null;

function getAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioContext) audioContext = new AudioContextClass();
    if (audioContext.state === "suspended") audioContext.resume();

    return audioContext;
}

function playClickSound() {
    const context = getAudioContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(720, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(520, context.currentTime + 0.055);

    gain.gain.setValueAtTime(0.045, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.065);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.07);
}

function stopCompletionAlarm() {
    if (alarmStopTimer) {
        clearTimeout(alarmStopTimer);
        alarmStopTimer = null;
    }

    if (alarmOscillator) {
        try { alarmOscillator.stop(); } catch (error) {}
        alarmOscillator.disconnect();
        alarmOscillator = null;
    }

    if (alarmGain) {
        alarmGain.disconnect();
        alarmGain = null;
    }

    if (stopAlarmButton) stopAlarmButton.style.display = "none";
}

function playCompletionAlarm() {
    const context = getAudioContext();
    if (!context) return;

    stopCompletionAlarm();

    alarmOscillator = context.createOscillator();
    alarmGain = context.createGain();

    alarmOscillator.type = "square";
    alarmGain.gain.setValueAtTime(0.0001, context.currentTime);

    // Eight-second repeating two-tone alarm.
    for (let i = 0; i < 16; i++) {
        const start = context.currentTime + i * 0.5;
        alarmOscillator.frequency.setValueAtTime(i % 2 === 0 ? 880 : 660, start);
        alarmGain.gain.setValueAtTime(0.0001, start);
        alarmGain.gain.setValueAtTime(0.055, start + 0.025);
        alarmGain.gain.setValueAtTime(0.055, start + 0.30);
        alarmGain.gain.setValueAtTime(0.0001, start + 0.36);
    }

    alarmOscillator.connect(alarmGain);
    alarmGain.connect(context.destination);
    alarmOscillator.start();
    alarmOscillator.stop(context.currentTime + 8.1);

    if (stopAlarmButton) stopAlarmButton.style.display = "inline-block";
    alarmStopTimer = setTimeout(() => {
        stopCompletionAlarm();
    }, 8200);
}

// ==========================================
// SAVE DATA
// ==========================================

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tasks,
        sessions: completedSessions
    }));
}

// ==========================================
// DESIGN HELPERS
// ==========================================

function create(tag, styles = {}, parent = app) {
    const element = document.createElement(tag);
    Object.assign(element.style, styles);
    parent.appendChild(element);
    return element;
}

function makeText(parent, content, size = "14px", color = "#fff", weight = "400") {
    const element = create("div", {
        fontSize: size,
        color,
        fontWeight: weight,
        lineHeight: "1.5"
    }, parent);

    element.textContent = content;
    return element;
}

function makeCard(parent, padding = "22px") {
    return create("div", {
        background: "#141414",
        border: "1px solid #292929",
        borderRadius: "18px",
        padding,
        boxSizing: "border-box",
        minWidth: "0"
    }, parent);
}

function makeButton(parent, text, action, secondary = false) {
    const button = create("button", {
        padding: "12px 17px",
        borderRadius: "11px",
        border: secondary ? "1px solid #444" : "1px solid #eee",
        background: secondary
            ? "#202020"
            : "linear-gradient(145deg,#fff,#ccc)",
        color: secondary ? "#eee" : "#111",
        fontSize: "13px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "0.2s",
        fontFamily: "Arial,sans-serif"
    }, parent);

    button.textContent = text;

    button.addEventListener("mouseenter", () => {
        button.style.transform = "translateY(-2px)";
        button.style.boxShadow = "0 5px 15px #ffffff18";
    });

    button.addEventListener("mouseleave", () => {
        button.style.transform = "translateY(0)";
        button.style.boxShadow = "none";
    });

    button.addEventListener("click", () => {
        playClickSound();
        action();
    });

    return button;
}

function makeInput(parent, placeholder, type = "text") {
    const input = create("input", {
        width: "100%",
        boxSizing: "border-box",
        padding: "14px 15px",
        borderRadius: "12px",
        border: "1px solid #3c3c3c",
        background: "#202020",
        color: "#fff",
        fontSize: "14px",
        outline: "none",
        marginBottom: "12px",
        fontFamily: "Arial,sans-serif",
        transition: "0.2s"
    }, parent);

    input.type = type;
    input.placeholder = placeholder;

    input.addEventListener("focus", () => {
        input.style.borderColor = "#fff";
        input.style.boxShadow = "0 0 0 3px #ffffff12";
    });

    input.addEventListener("blur", () => {
        input.style.borderColor = "#3c3c3c";
        input.style.boxShadow = "none";
    });

    return input;
}

function makeSelect(parent, options) {
    const select = create("select", {
        width: "100%",
        boxSizing: "border-box",
        padding: "14px 15px",
        borderRadius: "12px",
        border: "1px solid #3c3c3c",
        background: "#202020",
        color: "#fff",
        fontSize: "14px",
        outline: "none",
        marginBottom: "12px",
        cursor: "pointer",
        fontFamily: "Arial,sans-serif"
    }, parent);

    options.forEach(item => {
        const option = document.createElement("option");
        option.value = item.value;
        option.textContent = item.label;
        option.style.background = "#202020";
        option.style.color = "#fff";
        select.appendChild(option);
    });

    select.addEventListener("focus", () => {
        select.style.borderColor = "#fff";
    });

    select.addEventListener("blur", () => {
        select.style.borderColor = "#3c3c3c";
    });

    return select;
}

function makeHeading(parent, title, subtitle = "") {
    const wrapper = create("div", { marginBottom: "18px" }, parent);

    makeText(wrapper, title, "17px", "#fff", "700");

    if (subtitle) {
        makeText(wrapper, subtitle, "12px", "#888");
    }

    return wrapper;
}

// ==========================================
// MAIN LAYOUT
// ==========================================

Object.assign(app.style, {
    maxWidth: "1450px",
    margin: "auto",
    padding: "25px",
    boxSizing: "border-box"
});

// ==========================================
// HEADER
// ==========================================

const header = create("div", {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
    marginBottom: "35px",
    paddingBottom: "20px",
    borderBottom: "1px solid #292929"
});

const brand = create("div", {
    display: "flex",
    alignItems: "center",
    gap: "12px"
}, header);

const logo = create("div", {
    width: "42px",
    height: "42px",
    borderRadius: "13px",
    background: "linear-gradient(145deg,#fff,#aaa)",
    color: "#111",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "21px",
    fontWeight: "900"
}, brand);

logo.textContent = "C";

const brandName = create("div", {}, brand);
makeText(brandName, "CampusPulse", "20px", "#fff", "800");
makeText(brandName, "STUDENT PRODUCTIVITY SPACE", "9px", "#888", "700");

const headerRight = create("div", {
    textAlign: "right"
}, header);

const clock = makeText(headerRight, "--:--:--", "20px", "#fff", "700");
const dateText = makeText(headerRight, "", "12px", "#888");

function updateClock() {
    const now = new Date();

    clock.textContent = now.toLocaleTimeString("en-IN");

    dateText.textContent = now.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

updateClock();
setInterval(updateClock, 1000);

// ==========================================
// WELCOME
// ==========================================

const welcome = create("div", {
    marginBottom: "25px"
});

makeText(welcome, "YOUR PERSONAL STUDY SPACE", "11px", "#888", "700");

const welcomeTitle = makeText(
    welcome,
    "Welcome back!",
    "32px",
    "#fff",
    "800"
);

welcomeTitle.style.margin = "7px 0";

makeText(
    welcome,
    "Plan your day. Focus on your goals. Make every session count.",
    "14px",
    "#999"
);

// ==========================================
// STATISTICS
// ==========================================

const statsGrid = create("div", {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
    gap: "15px",
    marginBottom: "25px"
});

function statCard(title, initialValue, subtitle) {
    const card = makeCard(statsGrid, "20px");

    makeText(card, title.toUpperCase(), "10px", "#888", "700");

    const value = makeText(card, initialValue, "29px", "#fff", "800");
    value.style.margin = "9px 0 3px";

    makeText(card, subtitle, "11px", "#777");

    return value;
}

const totalTasksValue = statCard(
    "Total tasks", "0", "Tasks in your workspace"
);

const completedTasksValue = statCard(
    "Completed", "0", "Tasks successfully finished"
);

const focusSessionsValue = statCard(
    "Focus sessions", "0", "Completed study sessions"
);

const studyMinutesValue = statCard(
    "Study time", "0 min", "Total recorded focus time"
);

// ==========================================
// DASHBOARD GRID
// ==========================================

const mainGrid = create("div", {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))",
    gap: "18px",
    alignItems: "start"
});

// ==========================================
// FOCUS TIMER
// ==========================================

const timerCard = makeCard(mainGrid, "24px");

makeHeading(
    timerCard,
    "Focus timer",
    "Build your concentration, one session at a time."
);

const timerDisplay = create("div", {
    fontSize: "55px",
    fontWeight: "800",
    letterSpacing: "2px",
    textAlign: "center",
    margin: "24px 0 8px",
    background: "linear-gradient(90deg,#fff,#888)",
    color: "transparent",
    backgroundClip: "text"
}, timerCard);

const timerStatus = makeText(
    timerCard,
    "READY TO FOCUS",
    "10px",
    "#999",
    "700"
);

timerStatus.style.textAlign = "center";
timerStatus.style.letterSpacing = "2px";

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(remainingSeconds);
}

// Timer presets

const presets = create("div", {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "8px",
    margin: "22px 0"
}, timerCard);

[5, 15, 25, 45, 60].forEach(minutes => {
    makeButton(presets, `${minutes} min`, () => {
        setTimer(minutes);
    }, true);
});

// Custom timer

makeText(
    timerCard,
    "CUSTOM DURATION (MINUTES)",
    "10px",
    "#999",
    "700"
).style.marginBottom = "9px";

const customRow = create("div", {
    display: "flex",
    gap: "9px"
}, timerCard);

const customInput = makeInput(
    customRow,
    "Enter minutes",
    "number"
);

customInput.style.marginBottom = "0";
customInput.min = "1";
customInput.max = "180";

makeButton(customRow, "Set", () => {
    const value = Number(customInput.value);

    if (!Number.isInteger(value) || value < 1 || value > 180) {
        alert("Enter a duration between 1 and 180 minutes.");
        return;
    }

    setTimer(value);
    customInput.value = "";
}, true);

// Timer controls

const timerControls = create("div", {
    display: "flex",
    gap: "10px",
    marginTop: "18px"
}, timerCard);

const startButton = makeButton(
    timerControls,
    "Start focus",
    toggleTimer
);

startButton.style.flex = "1";

makeButton(timerControls, "Reset", resetTimer, true);

const stopAlarmButton = makeButton(timerControls, "Stop alarm", stopCompletionAlarm, true);
stopAlarmButton.style.display = "none";

// ==========================================
// TIMER LOGIC - FIXED
// ==========================================

function setTimer(minutes) {
    stopTimer();
    stopCompletionAlarm();

    selectedMinutes = minutes;
    remainingSeconds = minutes * 60;

    timerStatus.textContent = "READY TO FOCUS";
    startButton.textContent = "Start focus";

    updateTimerDisplay();
}

function startTimer() {
    if (isRunning || remainingSeconds <= 0) return;
    stopCompletionAlarm();

    isRunning = true;

    timerStatus.textContent = "FOCUS SESSION ACTIVE";
    startButton.textContent = "Pause";

    timerInterval = setInterval(() => {
        if (remainingSeconds > 0) {
            remainingSeconds--;
            updateTimerDisplay();
        }

        if (remainingSeconds <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            isRunning = false;

            completedSessions.push({
                date: new Date().toISOString(),
                minutes: selectedMinutes
            });

            saveData();
            updateStats();
            updateAnalytics();

            timerStatus.textContent = "SESSION COMPLETED — GREAT WORK!";
            startButton.textContent = "Start again";
            playCompletionAlarm();
        }
    }, 1000);
}

function pauseTimer() {
    if (!isRunning) return;

    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;

    timerStatus.textContent = "SESSION PAUSED";
    startButton.textContent = "Resume";
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
}

function resetTimer() {
    stopTimer();
    stopCompletionAlarm();

    remainingSeconds = selectedMinutes * 60;

    timerStatus.textContent = "TIMER RESET";
    startButton.textContent = "Start focus";

    updateTimerDisplay();
}

function toggleTimer() {
    if (isRunning) {
        pauseTimer();
    } else {
        if (remainingSeconds <= 0) {
            remainingSeconds = selectedMinutes * 60;
            updateTimerDisplay();
        }

        startTimer();
    }
}

updateTimerDisplay();

// ==========================================
// TASK MANAGER
// ==========================================

const taskCard = makeCard(mainGrid, "24px");

makeHeading(
    taskCard,
    "Task manager",
    "Organise assignments, subjects and deadlines."
);

const taskNameInput = makeInput(
    taskCard,
    "Enter your task or assignment..."
);

const subjectSelect = makeSelect(taskCard, [
    { value: "Mathematics", label: "Mathematics" },
    { value: "Programming", label: "Programming" },
    { value: "Physics", label: "Physics" },
    { value: "Chemistry", label: "Chemistry" },
    { value: "Digital Electronics", label: "Digital Electronics" },
    { value: "Robotics", label: "Robotics" },
    { value: "Other", label: "Other subject" }
]);

const deadlineInput = makeInput(
    taskCard,
    "Choose deadline",
    "date"
);

makeButton(taskCard, "+ Add task", addTask).style.width = "100%";

const taskList = create("div", {
    marginTop: "23px"
}, taskCard);

function addTask() {
    const name = taskNameInput.value.trim();

    if (!name) {
        alert("Please enter a task name.");
        taskNameInput.focus();
        return;
    }

    tasks.push({
        id: Date.now(),
        name,
        subject: subjectSelect.value,
        deadline: deadlineInput.value,
        completed: false
    });

    taskNameInput.value = "";
    deadlineInput.value = "";

    saveData();
    displayTasks();
    updateStats();
}

function displayTasks() {
    taskList.innerHTML = "";

    if (tasks.length === 0) {
        const empty = create("div", {
            padding: "22px 10px",
            textAlign: "center",
            color: "#777",
            fontSize: "13px"
        }, taskList);

        empty.textContent = "No tasks yet. Add your first task above.";
        return;
    }

    tasks.forEach(task => {
        const item = create("div", {
            background: "#1d1d1d",
            border: "1px solid #333",
            borderRadius: "13px",
            padding: "14px",
            marginBottom: "10px"
        }, taskList);

        const top = create("div", {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "10px"
        }, item);

        const info = create("div", {
            flex: "1",
            minWidth: "0"
        }, top);

        const title = makeText(
            info,
            task.name,
            "14px",
            task.completed ? "#777" : "#fff",
            "700"
        );

        if (task.completed) {
            title.style.textDecoration = "line-through";
        }

        makeText(info, task.subject, "11px", "#999");

        if (task.deadline) {
            makeText(
                info,
                "Due: " + new Date(task.deadline + "T00:00:00")
                    .toLocaleDateString("en-IN"),
                "11px",
                "#888"
            );
        }

        const actions = create("div", {
            display: "flex",
            flexDirection: "column",
            gap: "6px"
        }, top);

        const doneButton = makeButton(
            actions,
            task.completed ? "Undo" : "Done",
            () => {
                task.completed = !task.completed;
                saveData();
                displayTasks();
                updateStats();
            },
            true
        );

        doneButton.style.padding = "7px 10px";
        doneButton.style.fontSize = "11px";

        const deleteButton = makeButton(
            actions,
            "Delete",
            () => {
                tasks = tasks.filter(t => t.id !== task.id);
                saveData();
                displayTasks();
                updateStats();
            },
            true
        );

        deleteButton.style.padding = "7px 10px";
        deleteButton.style.fontSize = "11px";
    });
}

// ==========================================
// DAILY PROGRESS
// ==========================================

const progressCard = makeCard(mainGrid, "24px");

makeHeading(
    progressCard,
    "Daily progress",
    "Your task completion overview."
);

const progressNumber = makeText(
    progressCard,
    "0%",
    "38px",
    "#fff",
    "800"
);

progressNumber.style.margin = "12px 0";

const progressTrack = create("div", {
    width: "100%",
    height: "9px",
    background: "#303030",
    borderRadius: "20px",
    overflow: "hidden"
}, progressCard);

const progressBar = create("div", {
    width: "0%",
    height: "100%",
    background: "linear-gradient(90deg,#888,#fff)",
    borderRadius: "20px",
    transition: "width 0.4s"
}, progressTrack);

const progressDescription = makeText(
    progressCard,
    "Complete your first task to begin.",
    "12px",
    "#888"
);

progressDescription.style.marginTop = "12px";

function updateProgress() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    progressNumber.textContent = percentage + "%";
    progressBar.style.width = percentage + "%";

    progressDescription.textContent =
        `${completed} out of ${total} tasks completed`;
}

// ==========================================
// STUDY ANALYTICS
// ==========================================

const analyticsCard = makeCard(mainGrid, "24px");

makeHeading(
    analyticsCard,
    "Study analytics",
    "Your focus sessions over the last seven days."
);

const chart = create("div", {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-around",
    gap: "10px",
    height: "155px",
    padding: "15px 0 0"
}, analyticsCard);

function localDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function updateAnalytics() {
    chart.innerHTML = "";

    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const day = new Date(today);
        day.setDate(today.getDate() - i);

        const key = localDateKey(day);

        const minutes = completedSessions
            .filter(session => {
                return localDateKey(new Date(session.date)) === key;
            })
            .reduce((sum, session) => sum + session.minutes, 0);

        const column = create("div", {
            flex: "1",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            height: "100%",
            gap: "7px"
        }, chart);

        const barHeight = Math.max(5, Math.min(105, minutes * 2));

        const bar = create("div", {
            width: "100%",
            maxWidth: "35px",
            height: barHeight + "px",
            background: minutes > 0
                ? "linear-gradient(180deg,#fff,#777)"
                : "#333",
            borderRadius: "7px 7px 2px 2px"
        }, column);

        bar.title = `${minutes} minutes`;

        makeText(
            column,
            day.toLocaleDateString("en-IN", { weekday: "short" }),
            "10px",
            "#888"
        );
    }
}

// ==========================================
// GOOGLE SEARCH
// ==========================================

const searchCard = makeCard(mainGrid, "24px");

makeHeading(
    searchCard,
    "Quick Google search",
    "Find study materials and subject explanations."
);

const searchInput = makeInput(searchCard, "Search any topic...");

const searchSubject = makeSelect(searchCard, [
    { value: "all", label: "General search" },
    { value: "Mathematics", label: "Mathematics" },
    { value: "Programming", label: "Programming" },
    { value: "Physics", label: "Physics" },
    { value: "Chemistry", label: "Chemistry" },
    { value: "Robotics", label: "Robotics" },
    { value: "Digital Electronics", label: "Digital Electronics" }
]);

const searchButton = makeButton(searchCard, "Search on Google", () => {
    const query = searchInput.value.trim();

    if (!query) {
        alert("Enter a topic to search.");
        return;
    }

    const subject = searchSubject.value === "all"
        ? ""
        : searchSubject.value + " ";

    window.open(
        "https://www.google.com/search?q=" +
        encodeURIComponent(subject + query),
        "_blank",
        "noopener,noreferrer"
    );
});

searchButton.style.width = "100%";

searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        searchButton.click();
    }
});

// ==========================================
// LEARNING RESOURCES
// ==========================================

const resourcesCard = makeCard(mainGrid, "24px");

makeHeading(
    resourcesCard,
    "Learning resources",
    "Quick access to useful study platforms."
);

const resources = [
    {
        name: "Google",
        description: "Search for study materials",
        url: "https://www.google.com"
    },
    {
        name: "YouTube",
        description: "Watch tutorials and lectures",
        url: "https://www.youtube.com"
    },
    {
        name: "GeeksforGeeks",
        description: "Programming and computer science",
        url: "https://www.geeksforgeeks.org"
    },
    {
        name: "W3Schools",
        description: "Learn web development",
        url: "https://www.w3schools.com"
    },
    {
        name: "Khan Academy",
        description: "Learn mathematics and science",
        url: "https://www.khanacademy.org"
    },
    {
        name: "GitHub",
        description: "Explore coding projects",
        url: "https://github.com"
    }
];

resources.forEach(resource => {
    const item = create("div", {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "10px",
        background: "#1d1d1d",
        border: "1px solid #303030",
        borderRadius: "12px",
        padding: "13px",
        marginBottom: "9px"
    }, resourcesCard);

    const info = create("div", {
        minWidth: "0"
    }, item);

    makeText(info, resource.name, "13px", "#fff", "700");
    makeText(info, resource.description, "11px", "#888");

    const openButton = makeButton(item, "Open ↗", () => {
        window.open(resource.url, "_blank", "noopener,noreferrer");
    }, true);

    openButton.style.padding = "8px 11px";
    openButton.style.fontSize = "11px";
});

// ==========================================
// FOOTER
// ==========================================

const footer = create("div", {
    textAlign: "center",
    borderTop: "1px solid #292929",
    marginTop: "35px",
    padding: "22px 0",
    color: "#777",
    fontSize: "11px"
});

footer.textContent =
    "CAMPUSPULSE 4.2 | STUDY SMARTER. ACHIEVE MORE.";

// ==========================================
// RESPONSIVE LAYOUT
// ==========================================
function adjustLayout() {
    if (window.innerWidth < 600) {
        app.style.padding = "16px";
        welcomeTitle.style.fontSize = "26px";
    } else {
        app.style.padding = "25px";
        welcomeTitle.style.fontSize = "32px";
    }
}

window.addEventListener("resize", adjustLayout);

// ==========================================
// UPDATE STATISTICS
// ==========================================

function updateStats() {
    const completed = tasks.filter(t => t.completed).length;

    totalTasksValue.textContent = tasks.length;
    completedTasksValue.textContent = completed;
    focusSessionsValue.textContent = completedSessions.length;

    const totalMinutes = completedSessions.reduce(
        (sum, session) => sum + session.minutes,
        0
    );

    studyMinutesValue.textContent = totalMinutes + " min";

    updateProgress();
}

// ==========================================
// INITIALIZE WEBSITE
// ==========================================

displayTasks();
updateStats();
updateAnalytics();
adjustLayout();

console.log("CampusPulse 4.2 started successfully.");