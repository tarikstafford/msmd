// ====================
// STATE MANAGEMENT
// ====================

const STORAGE_KEY = 'habit_hang_meditation_v1';

const state = {
    players: [],
    entries: {}
};

// ====================
// UTILITY FUNCTIONS
// ====================

function generateId() {
    return 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getTodayISO() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDuration(seconds) {
    if (seconds < 60) {
        return `${seconds}s`;
    } else if (seconds < 3600) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        let result = `${hours}h`;
        if (mins > 0) result += ` ${mins}m`;
        if (secs > 0) result += ` ${secs}s`;
        return result;
    }
}

function formatStreak(days) {
    return days === 1 ? '1 day' : `${days} days`;
}

function dateDiff(date1ISO, date2ISO) {
    const d1 = new Date(date1ISO);
    const d2 = new Date(date2ISO);
    const diffMs = d2 - d1;
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// ====================
// PERSISTENCE
// ====================

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error('Failed to save state:', e);
    }
}

function loadState() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            state.players = parsed.players || [];
            state.entries = parsed.entries || {};
        }
    } catch (e) {
        console.error('Failed to load state:', e);
    }
}

// ====================
// PLAYER MANAGEMENT
// ====================

function addPlayer(name) {
    const trimmed = name.trim();

    if (!trimmed) {
        alert('Player name cannot be empty');
        return false;
    }

    // Check for duplicates (case-insensitive)
    const exists = state.players.some(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
        alert('Name already exists');
        return false;
    }

    const player = {
        id: generateId(),
        name: trimmed
    };

    state.players.push(player);
    saveState();
    return true;
}

function removePlayer(playerId) {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;

    if (!confirm(`Remove ${player.name} and delete all their history?`)) {
        return;
    }

    // Remove from players array
    state.players = state.players.filter(p => p.id !== playerId);

    // Remove all entries for this player
    for (const date in state.entries) {
        delete state.entries[date][playerId];

        // Clean up empty date objects
        if (Object.keys(state.entries[date]).length === 0) {
            delete state.entries[date];
        }
    }

    saveState();
    render();
}

// ====================
// ENTRY MANAGEMENT
// ====================

function ensureEntry(dateISO, playerId) {
    if (!state.entries[dateISO]) {
        state.entries[dateISO] = {};
    }
    if (!state.entries[dateISO][playerId]) {
        state.entries[dateISO][playerId] = { hang: 0, med: 0 };
    }
}

function updateEntry(dateISO, playerId, field, value) {
    ensureEntry(dateISO, playerId);

    // Parse and clamp value
    let numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) {
        numValue = 0;
    }

    state.entries[dateISO][playerId][field] = numValue;
    saveState();
    renderLeaderboard();
}

function getEntry(dateISO, playerId) {
    if (!state.entries[dateISO] || !state.entries[dateISO][playerId]) {
        return { hang: 0, med: 0 };
    }
    return state.entries[dateISO][playerId];
}

// ====================
// STATS CALCULATION
// ====================

function calculateStats() {
    const statsByPlayer = [];

    for (const player of state.players) {
        const stats = {
            player: player,
            totalHang: 0,
            totalMed: 0,
            activeDays: 0,
            currentStreak: 0,
            bestStreak: 0,
            datesWithActivity: []
        };

        // Get all dates sorted
        const allDates = Object.keys(state.entries).sort();

        // Collect totals and active days
        for (const date of allDates) {
            const entry = state.entries[date][player.id];
            if (!entry) continue;

            stats.totalHang += entry.hang;
            stats.totalMed += entry.med;

            // Check if this is an active day (both >= 1)
            if (entry.hang >= 1 && entry.med >= 1) {
                stats.activeDays++;
                stats.datesWithActivity.push(date);
            }
        }

        // Calculate best streak
        if (stats.datesWithActivity.length > 0) {
            let currentRun = 1;
            let bestRun = 1;

            for (let i = 1; i < stats.datesWithActivity.length; i++) {
                const diff = dateDiff(stats.datesWithActivity[i - 1], stats.datesWithActivity[i]);
                if (diff === 1) {
                    currentRun++;
                    bestRun = Math.max(bestRun, currentRun);
                } else {
                    currentRun = 1;
                }
            }

            stats.bestStreak = bestRun;

            // Calculate current streak (working backwards from last active day)
            currentRun = 1;
            for (let i = stats.datesWithActivity.length - 2; i >= 0; i--) {
                const diff = dateDiff(stats.datesWithActivity[i], stats.datesWithActivity[i + 1]);
                if (diff === 1) {
                    currentRun++;
                } else {
                    break;
                }
            }
            stats.currentStreak = currentRun;
        }

        statsByPlayer.push(stats);
    }

    return statsByPlayer;
}

function sortLeaderboard(stats) {
    return stats.sort((a, b) => {
        // Primary: current streak (descending)
        if (b.currentStreak !== a.currentStreak) {
            return b.currentStreak - a.currentStreak;
        }
        // Tie-breaker: total hang (descending)
        return b.totalHang - a.totalHang;
    });
}

// ====================
// RENDERING
// ====================

function renderDailyLog() {
    const dateInput = document.getElementById('date-picker');
    const selectedDate = dateInput.value;
    const tbody = document.getElementById('daily-log-tbody');
    const noPlayersMsg = document.getElementById('no-players-msg');

    tbody.innerHTML = '';

    if (state.players.length === 0) {
        noPlayersMsg.style.display = 'block';
        document.getElementById('daily-log-table').style.display = 'none';
        return;
    }

    noPlayersMsg.style.display = 'none';
    document.getElementById('daily-log-table').style.display = 'table';

    for (const player of state.players) {
        const entry = getEntry(selectedDate, player.id);

        const tr = document.createElement('tr');

        // Player name
        const tdName = document.createElement('td');
        tdName.textContent = player.name;
        tr.appendChild(tdName);

        // Hang input
        const tdHang = document.createElement('td');
        const hangInput = document.createElement('input');
        hangInput.type = 'number';
        hangInput.min = '0';
        hangInput.step = '1';
        hangInput.value = entry.hang || '';
        hangInput.addEventListener('input', (e) => {
            updateEntry(selectedDate, player.id, 'hang', e.target.value);
        });
        tdHang.appendChild(hangInput);
        tr.appendChild(tdHang);

        // Meditation input
        const tdMed = document.createElement('td');
        const medInput = document.createElement('input');
        medInput.type = 'number';
        medInput.min = '0';
        medInput.step = '1';
        medInput.value = entry.med || '';
        medInput.addEventListener('input', (e) => {
            updateEntry(selectedDate, player.id, 'med', e.target.value);
        });
        tdMed.appendChild(medInput);
        tr.appendChild(tdMed);

        // Remove button
        const tdAction = document.createElement('td');
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.className = 'danger';
        removeBtn.addEventListener('click', () => removePlayer(player.id));
        tdAction.appendChild(removeBtn);
        tr.appendChild(tdAction);

        tbody.appendChild(tr);
    }
}

function renderLeaderboard() {
    const tbody = document.getElementById('leaderboard-tbody');
    const noLeaderboardMsg = document.getElementById('no-leaderboard-msg');

    tbody.innerHTML = '';

    if (state.players.length === 0) {
        noLeaderboardMsg.style.display = 'block';
        document.getElementById('leaderboard-table').style.display = 'none';
        return;
    }

    const stats = calculateStats();
    const sorted = sortLeaderboard(stats);

    noLeaderboardMsg.style.display = 'none';
    document.getElementById('leaderboard-table').style.display = 'table';

    sorted.forEach((stat, index) => {
        const tr = document.createElement('tr');

        // Rank
        const tdRank = document.createElement('td');
        tdRank.textContent = index + 1;
        tr.appendChild(tdRank);

        // Player name
        const tdName = document.createElement('td');
        tdName.textContent = stat.player.name;

        // Add badges
        const maxHang = Math.max(...sorted.map(s => s.totalHang));
        const maxMed = Math.max(...sorted.map(s => s.totalMed));
        const maxStreak = Math.max(...sorted.map(s => s.currentStreak));

        let badges = '';
        if (stat.totalHang > 0 && stat.totalHang === maxHang) badges += ' 💪';
        if (stat.totalMed > 0 && stat.totalMed === maxMed) badges += ' 🧘';
        if (stat.currentStreak > 0 && stat.currentStreak === maxStreak) badges += ' 🔥';

        tdName.textContent += badges;
        tr.appendChild(tdName);

        // Total hang
        const tdHang = document.createElement('td');
        tdHang.textContent = stat.totalHang > 0 ? formatDuration(stat.totalHang) : '-';
        tr.appendChild(tdHang);

        // Total meditation
        const tdMed = document.createElement('td');
        tdMed.textContent = stat.totalMed > 0 ? formatDuration(stat.totalMed) : '-';
        tr.appendChild(tdMed);

        // Current streak
        const tdCurrent = document.createElement('td');
        tdCurrent.textContent = stat.currentStreak > 0 ? formatStreak(stat.currentStreak) : '-';
        tr.appendChild(tdCurrent);

        // Best streak
        const tdBest = document.createElement('td');
        tdBest.textContent = stat.bestStreak > 0 ? formatStreak(stat.bestStreak) : '-';
        tr.appendChild(tdBest);

        // Active days
        const tdActive = document.createElement('td');
        tdActive.textContent = stat.activeDays > 0 ? stat.activeDays : '-';
        tr.appendChild(tdActive);

        tbody.appendChild(tr);
    });
}

function render() {
    renderDailyLog();
    renderLeaderboard();
}

// ====================
// EVENT HANDLERS
// ====================

function initEventHandlers() {
    // Date picker
    const datePicker = document.getElementById('date-picker');
    datePicker.value = getTodayISO();
    datePicker.addEventListener('change', renderDailyLog);

    // Add player
    const addPlayerBtn = document.getElementById('add-player-btn');
    const playerNameInput = document.getElementById('player-name');

    addPlayerBtn.addEventListener('click', () => {
        if (addPlayer(playerNameInput.value)) {
            playerNameInput.value = '';
            render();
        }
    });

    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (addPlayer(playerNameInput.value)) {
                playerNameInput.value = '';
                render();
            }
        }
    });

    // Reset all data
    const resetBtn = document.getElementById('reset-btn');
    resetBtn.addEventListener('click', () => {
        if (confirm('Reset ALL players and history? This cannot be undone.')) {
            state.players = [];
            state.entries = {};
            saveState();
            render();
        }
    });
}

// ====================
// INITIALIZATION
// ====================

function init() {
    loadState();
    initEventHandlers();
    render();
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
