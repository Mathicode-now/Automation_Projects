// === CONFIG: Edit kids and goals here ===
const KIDS = [
    { id: 'kid1', name: 'Vihana', emoji: '⚡' },
    { id: 'kid2', name: 'Viyan', emoji: '🌟' }
];

const GOALS = {
    daily: [
        { id: 'd1', text: 'Read for 20 minutes', emoji: '📚' },
        { id: 'd2', text: 'Practice math or coding puzzle', emoji: '🧩' },
        { id: 'd3', text: 'Write in journal', emoji: '✏️' },
        { id: 'd4', text: 'Help with a chore', emoji: '🧹' },
        { id: 'd5', text: 'No screens before noon', emoji: '🌅' }
    ],
    physical: [
        { id: 'p1', text: 'Ride bike for 30 minutes', emoji: '🚴' },
        { id: 'p2', text: 'Practice basketball (dribbling + shots)', emoji: '🏀' },
        { id: 'p3', text: 'Practice badminton or tennis', emoji: '🏸' },
        { id: 'p4', text: 'Dance for 15 minutes', emoji: '💃' },
        { id: 'p5', text: 'Stretch or yoga', emoji: '🧘' },
        { id: 'p6', text: 'Play outside for 1 hour total', emoji: '☀️' }
    ],
    social: [
        { id: 's1', text: 'Use kind words all day', emoji: '💬' },
        { id: 's2', text: 'Share something with sibling', emoji: '🤝' },
        { id: 's3', text: 'Say please and thank you', emoji: '🙏' },
        { id: 's4', text: 'No arguing or yelling', emoji: '🕊️' },
        { id: 's5', text: 'Include others in play', emoji: '👫' },
        { id: 's6', text: 'Give a genuine compliment', emoji: '⭐' }
    ],
    selfcare: [
        { id: 'sc1', text: 'Brush teeth (morning)', emoji: '🪥' },
        { id: 'sc2', text: 'Brush teeth (night)', emoji: '🌙' },
        { id: 'sc3', text: 'Shower or bath', emoji: '🚿' },
        { id: 'sc4', text: 'Make bed', emoji: '🛏️' },
        { id: 'sc5', text: 'Put dirty clothes in hamper', emoji: '👕' },
        { id: 'sc6', text: 'Drink 5 glasses of water', emoji: '💧' },
        { id: 'sc7', text: 'In bed by bedtime', emoji: '😴' }
    ]
};

const VIDEOS = {
    stem: [
        { title: 'How Computers Work', url: 'https://www.youtube.com/embed/OAx_6-wdslM' },
        { title: 'Science Experiments You Can Do at Home', url: 'https://www.youtube.com/embed/Hd3PgLbOWMg' },
        { title: 'Coding for Kids - Scratch Tutorial', url: 'https://www.youtube.com/embed/VIpmkeqJhmQ' }
    ],
    basketball: [
        { title: 'Basketball Dribbling for Beginners', url: 'https://www.youtube.com/embed/2uW1a3MBYuY' },
        { title: 'How to Shoot a Basketball', url: 'https://www.youtube.com/embed/GN9asBUMVn8' }
    ],
    badminton: [
        { title: 'Badminton Basics for Kids', url: 'https://www.youtube.com/embed/0IV9WGGvJpg' },
        { title: 'Fun Badminton Drills', url: 'https://www.youtube.com/embed/K055sRcHQYA' }
    ],
    dance: [
        { title: 'Easy Dance Workout for Kids', url: 'https://www.youtube.com/embed/ymigWt5TOV8' },
        { title: 'Learn Hip Hop Dance Moves', url: 'https://www.youtube.com/embed/gCzgc_RelBA' }
    ]
};


// === APP STATE ===
let currentKid = null;
let currentTab = 'daily';

// === LOCAL STORAGE ===
function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

function loadProgress(kidId) {
    const key = `goals_${kidId}_${getTodayKey()}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : {};
}

function saveProgress(kidId, goalId, checked) {
    const key = `goals_${kidId}_${getTodayKey()}`;
    const progress = loadProgress(kidId);
    progress[goalId] = checked;
    localStorage.setItem(key, JSON.stringify(progress));
}

function getStreak(kidId) {
    let streak = 0;
    const today = new Date();
    for (let i = 1; i <= 365; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const key = `goals_${kidId}_${date.toISOString().split('T')[0]}`;
        const data = localStorage.getItem(key);
        if (data) {
            const progress = JSON.parse(data);
            const allGoals = getAllGoalIds();
            const completed = allGoals.filter(id => progress[id]).length;
            if (completed / allGoals.length >= 0.7) {
                streak++;
            } else {
                break;
            }
        } else {
            break;
        }
    }
    // Check today too
    const todayProgress = loadProgress(kidId);
    const allGoals = getAllGoalIds();
    const todayCompleted = allGoals.filter(id => todayProgress[id]).length;
    if (todayCompleted / allGoals.length >= 0.7) streak++;
    return streak;
}

function getAllGoalIds() {
    return Object.values(GOALS).flat().map(g => g.id);
}

// === RENDERING ===
function renderKidSelect() {
    const container = document.querySelector('.kid-buttons');
    container.innerHTML = KIDS.map(kid => `
        <button class="kid-btn" data-kid="${kid.id}">
            <span class="emoji">${kid.emoji}</span>
            ${kid.name}
        </button>
    `).join('');

    container.querySelectorAll('.kid-btn').forEach(btn => {
        btn.addEventListener('click', () => selectKid(btn.dataset.kid));
    });
}

function selectKid(kidId) {
    currentKid = KIDS.find(k => k.id === kidId);
    document.getElementById('kid-select').classList.remove('active');
    document.getElementById('dashboard').classList.add('active');
    document.getElementById('kid-name').textContent = `${currentKid.emoji} ${currentKid.name}'s Goals`;
    updateStreak();
    renderTab(currentTab);
}

function renderTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));

    const content = document.getElementById('tab-content');

    if (tab === 'videos') {
        renderVideos(content);
    } else {
        renderGoals(content, tab);
    }
    updateProgress();
}

function renderGoals(container, category) {
    const goals = GOALS[category];
    const progress = loadProgress(currentKid.id);

    container.innerHTML = goals.map(goal => `
        <div class="goal-card ${progress[goal.id] ? 'checked' : ''}" data-goal="${goal.id}">
            <div class="goal-checkbox">${progress[goal.id] ? '✓' : ''}</div>
            <span class="goal-emoji">${goal.emoji}</span>
            <span class="goal-text">${goal.text}</span>
        </div>
    `).join('');

    container.querySelectorAll('.goal-card').forEach(card => {
        card.addEventListener('click', () => toggleGoal(card.dataset.goal));
    });
}

function renderVideos(container) {
    const categories = {
        stem: '🔬 STEM & Learning',
        basketball: '🏀 Basketball',
        badminton: '🏸 Badminton',
        dance: '💃 Dance'
    };

    container.innerHTML = Object.entries(categories).map(([key, label]) => `
        <div class="video-category">
            <h3>${label}</h3>
            <div class="video-grid">
                ${VIDEOS[key].map(v => `
                    <div class="video-card">
                        <iframe src="${v.url}" title="${v.title}" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen loading="lazy"></iframe>
                        <div class="video-title">${v.title}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function toggleGoal(goalId) {
    const progress = loadProgress(currentKid.id);
    const newState = !progress[goalId];
    saveProgress(currentKid.id, goalId, newState);
    renderTab(currentTab);
    updateStreak();

    if (newState) celebrate();
}

function updateProgress() {
    const progress = loadProgress(currentKid.id);
    const allGoals = getAllGoalIds();
    const completed = allGoals.filter(id => progress[id]).length;
    const pct = Math.round((completed / allGoals.length) * 100);

    document.getElementById('daily-progress').style.width = pct + '%';
    document.getElementById('progress-text').textContent = `${pct}% done today (${completed}/${allGoals.length})`;
}

function updateStreak() {
    document.getElementById('streak-count').textContent = getStreak(currentKid.id);
}

function celebrate() {
    const emojis = ['🎉', '⭐', '🌟', '💪', '🔥', '👏', '🎊'];
    const el = document.createElement('div');
    el.className = 'celebration';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
}

// === EVENT LISTENERS ===
document.getElementById('back-btn').addEventListener('click', () => {
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('kid-select').classList.add('active');
    currentKid = null;
});

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => renderTab(tab.dataset.tab));
});

// === INIT ===
renderKidSelect();
