// ====================
// SUPABASE CLIENT
// ====================

let supabase;

function initSupabase() {
    const config = window.SUPABASE_CONFIG;

    console.log('Initializing Supabase...');
    console.log('Config loaded:', config ? 'Yes' : 'No');

    if (!config) {
        console.error('ERROR: window.SUPABASE_CONFIG is undefined');
        console.error('Make sure config.generated.js is loaded before app.js');
        return false;
    }

    console.log('URL present:', config.url ? 'Yes' : 'No');
    console.log('Key present:', config.anonKey ? 'Yes' : 'No');

    if (!config.url || !config.anonKey) {
        console.error('ERROR: Supabase configuration incomplete');
        console.error('URL:', config.url || 'MISSING');
        console.error('Key:', config.anonKey ? 'Present' : 'MISSING');
        return false;
    }

    // Check for placeholder values
    if (config.url.includes('YOUR_SUPABASE') || config.url.includes('__SUPABASE')) {
        console.error('ERROR: Placeholder values detected in config');
        console.error('Environment variables may not be set in Vercel');
        return false;
    }

    try {
        supabase = window.supabase.createClient(config.url, config.anonKey);
        console.log('✓ Supabase client initialized successfully');
        return true;
    } catch (error) {
        console.error('ERROR: Failed to create Supabase client:', error);
        return false;
    }
}

// ====================
// STATE MANAGEMENT
// ====================

const state = {
    user: null,
    currentGroup: null,
    groups: [],
    players: [],
    entries: {},
    isLoading: true
};

// ====================
// UTILITY FUNCTIONS
// ====================

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

function generateJoinCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ====================
// UI STATE MANAGEMENT
// ====================

function showLoading() {
    document.getElementById('loading-screen').style.display = 'flex';
    document.getElementById('signin-screen').style.display = 'none';
    document.getElementById('app-container').style.display = 'none';
}

function showSignIn() {
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('signin-screen').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
}

function showApp() {
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('signin-screen').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
}

// ====================
// AUTHENTICATION
// ====================

async function signInWithGoogle() {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) throw error;
    } catch (error) {
        console.error('Sign in error:', error);
        alert('Failed to sign in. Please try again.');
    }
}

async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        // Reset state
        state.user = null;
        state.currentGroup = null;
        state.groups = [];
        state.players = [];
        state.entries = {};

        showSignIn();
    } catch (error) {
        console.error('Sign out error:', error);
        alert('Failed to sign out. Please try again.');
    }
}

let isInitializing = false;

async function handleAuthStateChange(event, session) {
    console.log('Auth state change:', event, 'Session:', session ? 'exists' : 'none');
    window._authListenerFired = true;

    // Skip if we're already initializing to prevent race conditions
    if (isInitializing && event === 'INITIAL_SESSION') {
        console.log('Already initializing, skipping duplicate INITIAL_SESSION event');
        return;
    }

    if (event === 'SIGNED_IN') {
        console.log('User signed in:', session.user.email);
        isInitializing = true;
        state.user = session.user;
        await onUserSignedIn();
        isInitializing = false;
    } else if (event === 'INITIAL_SESSION' && session) {
        // Only process if not already initialized
        if (!state.user) {
            console.log('Initial session, user:', session.user.email);
            isInitializing = true;
            state.user = session.user;
            await onUserSignedIn();
            isInitializing = false;
        } else {
            console.log('Initial session but already have user, skipping');
        }
    } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        isInitializing = false;
        showSignIn();
    } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed');
    }
}

async function onUserSignedIn() {
    console.log('========================================');
    console.log('[INIT] Starting onUserSignedIn...');
    console.log('[INIT] User:', state.user.email);
    console.log('========================================');
    showLoading();

    try {
        // Upsert profile (skip for now - has RLS issues causing hangs)
        console.log('[INIT] Step 1: Skipping profile upsert (has RLS issues)');
        // try {
        //     await upsertProfile();
        //     console.log('[INIT] ✓ Step 1 complete');
        // } catch (profileError) {
        //     console.warn('[INIT] ⚠️ Profile upsert failed, continuing anyway:', profileError);
        //     // Don't throw - continue with app load
        // }

        // Load user's groups
        console.log('[INIT] Step 2: Loading groups...');
        await loadGroups();
        console.log('[INIT] ✓ Step 2 complete - Groups loaded:', state.groups.length);

        // Check if user has groups
        if (state.groups.length === 0) {
            // First time user - create default group
            console.log('[INIT] Step 3: Creating default group (user has no groups)...');
            try {
                await createDefaultGroup();
                console.log('[INIT] ✓ Step 3 complete - Groups count:', state.groups.length);
            } catch (groupError) {
                console.error('[INIT] ❌ Step 3 failed - Error creating default group:', groupError);
                // Show error but continue - user can create manually
                showApp();
                alert('Welcome! Unable to create default troop. Please create one manually using the "+ New Troop" button.\n\nError: ' + groupError.message);
                return;
            }
        } else {
            console.log('[INIT] Step 3: Skipped (user already has groups)');
        }

        // Set current group to first group
        if (state.groups.length > 0) {
            state.currentGroup = state.groups[0];
            console.log('[INIT] Step 4: Loading group data for:', state.currentGroup.name);
            await loadGroupData();
            console.log('[INIT] ✓ Step 4 complete');
        } else {
            console.warn('[INIT] ⚠️ Step 4: No groups available after creation attempt');
        }

        // Check for localStorage migration
        console.log('[INIT] Step 5: Checking for localStorage migration...');
        await checkLocalStorageMigration();
        console.log('[INIT] ✓ Step 5 complete');

        // Show app
        console.log('[INIT] Step 6: Rendering app...');
        updateUserProfile();
        renderGroupSelector();
        render();
        showApp();
        console.log('[INIT] ✓ Step 6 complete');

        console.log('========================================');
        console.log('[INIT] ✅ App loaded successfully!');
        console.log('========================================');

    } catch (error) {
        console.error('========================================');
        console.error('[INIT] ❌ Error loading user data:', error);
        console.error('[INIT] Error message:', error.message);
        console.error('[INIT] Error stack:', error.stack);
        console.error('========================================');
        showSignIn();
        alert('Failed to load your data: ' + error.message + '\n\nPlease refresh and try again.');
    }
}

async function upsertProfile() {
    const user = state.user;
    console.log('[PROFILE] Starting upsert for user:', user.id, user.email);

    try {
        console.log('[PROFILE] Sending upsert request...');
        const { data, error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                email: user.email,
                display_name: user.user_metadata.full_name || user.email,
                avatar_url: user.user_metadata.avatar_url || null
            }, {
                onConflict: 'id',
                ignoreDuplicates: false
            })
            .select();

        console.log('[PROFILE] Upsert request completed');

        if (error) {
            console.error('[PROFILE] Upsert error:', error);
            throw error;
        }

        console.log('[PROFILE] ✓ Profile upserted successfully:', data);
    } catch (error) {
        console.error('[PROFILE] ❌ Profile upsert failed:', error);
        throw error;
    }
}

function updateUserProfile() {
    const user = state.user;
    document.getElementById('user-name').textContent = user.user_metadata.full_name || user.email;

    const avatar = document.getElementById('user-avatar');
    if (user.user_metadata.avatar_url) {
        avatar.src = user.user_metadata.avatar_url;
        avatar.style.display = 'block';
    } else {
        avatar.style.display = 'none';
    }
}

// ====================
// GROUP MANAGEMENT
// ====================

async function loadGroups() {
    console.log('[GROUPS] Loading groups for user:', state.user.id);

    // Add timeout wrapper
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Groups query timeout after 5s')), 5000)
    );

    const query = supabase
        .from('group_members')
        .select('groups(*)')
        .eq('user_id', state.user.id);

    try {
        const { data, error } = await Promise.race([query, timeout]);

        console.log('[GROUPS] Query completed, data:', data, 'error:', error);

        if (error) {
            console.error('[GROUPS] ❌ Error loading groups:', error);
            throw error;
        }

        state.groups = data.map(gm => gm.groups);
        console.log('[GROUPS] ✓ Loaded', state.groups.length, 'groups');
    } catch (err) {
        if (err.message.includes('timeout')) {
            console.error('[GROUPS] ❌ Query timed out - likely RLS policy issue');
            console.error('[GROUPS] Falling back to empty groups array');
            state.groups = [];
        } else {
            throw err;
        }
    }
}

async function createDefaultGroup() {
    const firstName = state.user.user_metadata.full_name?.split(' ')[0] || 'My';
    const groupName = `${firstName}'s Board`;

    console.log('[CREATE_GROUP] Creating default group:', groupName);
    const group = await createGroup(groupName);
    state.groups.push(group);
    console.log('[CREATE_GROUP] ✓ Default group created and added to state');
}

async function createGroup(name) {
    console.log('[CREATE_GROUP] Starting creation for:', name);
    console.log('[CREATE_GROUP] User ID:', state.user.id);

    // Verify we have a valid session
    console.log('[CREATE_GROUP] Verifying session...');
    const { data: { session } } = await supabase.auth.getSession();
    console.log('[CREATE_GROUP] Session user ID:', session?.user?.id);
    console.log('[CREATE_GROUP] Match?', session?.user?.id === state.user.id);

    // Create group
    console.log('[CREATE_GROUP] Inserting group into database...');
    const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
            name: name,
            owner_id: state.user.id,
            join_code: generateJoinCode()
        })
        .select()
        .single();

    console.log('[CREATE_GROUP] Insert completed');

    if (groupError) {
        console.error('[CREATE_GROUP] ❌ Group creation error:', groupError);
        throw groupError;
    }

    console.log('[CREATE_GROUP] ✓ Group created:', group);

    // Add user as member
    console.log('[CREATE_GROUP] Adding user as member...');
    const { error: memberError } = await supabase
        .from('group_members')
        .insert({
            group_id: group.id,
            user_id: state.user.id
        });

    console.log('[CREATE_GROUP] Member insert completed');

    if (memberError) {
        console.error('[CREATE_GROUP] ❌ Member insert error:', memberError);
        throw memberError;
    }

    console.log('[CREATE_GROUP] ✓ User added as member');

    return group;
}

async function joinGroupByCode(code) {
    // Find group by join code
    const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('join_code', code.toUpperCase())
        .single();

    if (groupError || !group) {
        throw new Error('Group not found. Check the code and try again.');
    }

    // Check if already a member
    const { data: existing } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', group.id)
        .eq('user_id', state.user.id)
        .single();

    if (existing) {
        throw new Error('You are already a member of this board.');
    }

    // Add user as member
    const { error: memberError } = await supabase
        .from('group_members')
        .insert({
            group_id: group.id,
            user_id: state.user.id
        });

    if (memberError) throw memberError;

    return group;
}

async function switchGroup(groupId) {
    const group = state.groups.find(g => g.id === groupId);
    if (!group) return;

    state.currentGroup = group;
    await loadGroupData();
    render();
}

function renderGroupSelector() {
    const select = document.getElementById('group-select');
    select.innerHTML = '';

    for (const group of state.groups) {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        if (state.currentGroup && group.id === state.currentGroup.id) {
            option.selected = true;
        }
        select.appendChild(option);
    }
}

// ====================
// PLAYER MANAGEMENT
// ====================

async function loadPlayers() {
    if (!state.currentGroup) {
        console.log('[PLAYERS] No current group, skipping load');
        return;
    }

    console.log('[PLAYERS] Loading players for group:', state.currentGroup.id);

    const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('group_id', state.currentGroup.id)
        .order('created_at', { ascending: true });

    console.log('[PLAYERS] Query completed, data:', data, 'error:', error);

    if (error) {
        console.error('[PLAYERS] ❌ Error loading players:', error);
        throw error;
    }

    state.players = data || [];
    console.log('[PLAYERS] ✓ Loaded', state.players.length, 'players');
}

async function addPlayer(name) {
    const trimmed = name.trim();

    if (!trimmed) {
        alert('Player name cannot be empty');
        return false;
    }

    // Check for duplicates (case-insensitive)
    const exists = state.players.some(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
        alert('Name already exists in this board');
        return false;
    }

    try {
        const { data: player, error } = await supabase
            .from('players')
            .insert({
                group_id: state.currentGroup.id,
                name: trimmed
            })
            .select()
            .single();

        if (error) throw error;

        state.players.push(player);
        return true;
    } catch (error) {
        console.error('Error adding player:', error);
        alert('Failed to add player. Please try again.');
        return false;
    }
}

async function removePlayer(playerId) {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;

    if (!confirm(`Remove ${player.name} and delete all their history?`)) {
        return;
    }

    try {
        // Delete player (entries will cascade delete via FK)
        const { error } = await supabase
            .from('players')
            .delete()
            .eq('id', playerId);

        if (error) throw error;

        // Update local state
        state.players = state.players.filter(p => p.id !== playerId);

        // Reload entries
        await loadEntries();

        render();
    } catch (error) {
        console.error('Error removing player:', error);
        alert('Failed to remove player. Please try again.');
    }
}

// ====================
// ENTRY MANAGEMENT
// ====================

async function loadEntries() {
    if (!state.currentGroup) {
        console.log('[ENTRIES] No current group, skipping load');
        return;
    }

    console.log('[ENTRIES] Loading entries for group:', state.currentGroup.id);

    const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('group_id', state.currentGroup.id);

    console.log('[ENTRIES] Query completed, data count:', data?.length, 'error:', error);

    if (error) {
        console.error('[ENTRIES] ❌ Error loading entries:', error);
        throw error;
    }

    // Convert to nested object: { date: { playerId: { hang, med } } }
    state.entries = {};
    for (const entry of data || []) {
        if (!state.entries[entry.date]) {
            state.entries[entry.date] = {};
        }
        state.entries[entry.date][entry.player_id] = {
            hang: entry.hang_seconds,
            med: entry.med_seconds
        };
    }
    console.log('[ENTRIES] ✓ Loaded', data?.length || 0, 'entries');
}

async function updateEntry(dateISO, playerId, field, value) {
    // Parse and clamp value
    let numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) {
        numValue = 0;
    }

    // Update local state
    if (!state.entries[dateISO]) {
        state.entries[dateISO] = {};
    }
    if (!state.entries[dateISO][playerId]) {
        state.entries[dateISO][playerId] = { hang: 0, med: 0 };
    }
    state.entries[dateISO][playerId][field] = numValue;

    // Prepare data for upsert
    const upsertData = {
        group_id: state.currentGroup.id,
        player_id: playerId,
        date: dateISO,
        hang_seconds: state.entries[dateISO][playerId].hang,
        med_seconds: state.entries[dateISO][playerId].med
    };

    try {
        const { error } = await supabase
            .from('entries')
            .upsert(upsertData, {
                onConflict: 'group_id,player_id,date'
            });

        if (error) throw error;

        // Update leaderboard
        renderLeaderboard();
    } catch (error) {
        console.error('Error updating entry:', error);
        alert('Failed to save entry. Please try again.');
    }
}

function getEntry(dateISO, playerId) {
    if (!state.entries[dateISO] || !state.entries[dateISO][playerId]) {
        return { hang: 0, med: 0 };
    }
    return state.entries[dateISO][playerId];
}

// ====================
// LOAD GROUP DATA
// ====================

async function loadGroupData() {
    if (!state.currentGroup) {
        console.log('[LOAD_GROUP] No current group, skipping');
        return;
    }

    console.log('[LOAD_GROUP] Loading data for group:', state.currentGroup.name);
    showLoading();

    try {
        console.log('[LOAD_GROUP] Starting parallel load of players and entries...');
        await Promise.all([
            loadPlayers(),
            loadEntries()
        ]);
        console.log('[LOAD_GROUP] ✓ Group data loaded successfully');
    } catch (error) {
        console.error('[LOAD_GROUP] ❌ Error loading group data:', error);
        alert('Failed to load board data. Please try again.');
    } finally {
        console.log('[LOAD_GROUP] Showing app...');
        showApp();
    }
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
// LOCALSTORAGE MIGRATION
// ====================

const LEGACY_STORAGE_KEY = 'habit_hang_meditation_v1';

async function checkLocalStorageMigration() {
    console.log('[MIGRATION] Checking for localStorage data...');
    try {
        const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (!stored) {
            console.log('[MIGRATION] No localStorage data found');
            return;
        }

        console.log('[MIGRATION] Found localStorage data, parsing...');
        const legacy = JSON.parse(stored);

        if (!legacy.players || legacy.players.length === 0) {
            console.log('[MIGRATION] No players to migrate, removing key');
            // No data to migrate
            localStorage.removeItem(LEGACY_STORAGE_KEY);
            return;
        }

        console.log('[MIGRATION] Found', legacy.players.length, 'players to migrate');

        // Ask user if they want to import
        const shouldImport = confirm(
            `Found local data from before you signed in.\n\n` +
            `Import ${legacy.players.length} player(s) and their history into your cloud board?`
        );

        if (!shouldImport) {
            localStorage.removeItem(LEGACY_STORAGE_KEY);
            return;
        }

        showLoading();

        // Create a mapping of old player IDs to new player IDs
        const playerIdMap = {};

        // Import players
        for (const oldPlayer of legacy.players) {
            const { data: newPlayer, error } = await supabase
                .from('players')
                .insert({
                    group_id: state.currentGroup.id,
                    name: oldPlayer.name
                })
                .select()
                .single();

            if (error) {
                console.error('Error importing player:', error);
                continue;
            }

            playerIdMap[oldPlayer.id] = newPlayer.id;
        }

        // Import entries
        const entriesToImport = [];
        for (const date in legacy.entries) {
            for (const oldPlayerId in legacy.entries[date]) {
                const newPlayerId = playerIdMap[oldPlayerId];
                if (!newPlayerId) continue;

                const entry = legacy.entries[date][oldPlayerId];
                entriesToImport.push({
                    group_id: state.currentGroup.id,
                    player_id: newPlayerId,
                    date: date,
                    hang_seconds: entry.hang || 0,
                    med_seconds: entry.med || 0
                });
            }
        }

        if (entriesToImport.length > 0) {
            const { error } = await supabase
                .from('entries')
                .upsert(entriesToImport, {
                    onConflict: 'group_id,player_id,date'
                });

            if (error) {
                console.error('Error importing entries:', error);
            }
        }

        // Clear localStorage
        localStorage.removeItem(LEGACY_STORAGE_KEY);

        // Reload data
        await loadGroupData();
        render();

        alert('Successfully imported your local data!');

    } catch (error) {
        console.error('Error during migration:', error);
        alert('Failed to import local data. Your cloud data is safe.');
    }
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
    if (!state.currentGroup) return;

    renderDailyLog();
    renderLeaderboard();
}

// ====================
// EVENT HANDLERS
// ====================

function initEventHandlers() {
    // Sign in
    document.getElementById('google-signin-btn').addEventListener('click', signInWithGoogle);

    // Sign out
    document.getElementById('signout-btn').addEventListener('click', signOut);

    // Group selector
    document.getElementById('group-select').addEventListener('change', (e) => {
        switchGroup(e.target.value);
    });

    // Create group
    document.getElementById('create-group-btn').addEventListener('click', async () => {
        const name = prompt('Enter board name:');
        if (!name || !name.trim()) return;

        try {
            showLoading();
            const group = await createGroup(name.trim());
            state.groups.push(group);
            state.currentGroup = group;
            await loadGroupData();
            renderGroupSelector();
            render();
            showApp();
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Failed to create board. Please try again.');
            showApp();
        }
    });

    // Join group
    document.getElementById('join-group-btn').addEventListener('click', async () => {
        const code = prompt('Enter join code:');
        if (!code || !code.trim()) return;

        try {
            showLoading();
            const group = await joinGroupByCode(code.trim());
            state.groups.push(group);
            state.currentGroup = group;
            await loadGroupData();
            renderGroupSelector();
            render();
            showApp();
            alert(`Successfully joined "${group.name}"!`);
        } catch (error) {
            console.error('Error joining group:', error);
            alert(error.message || 'Failed to join board. Please try again.');
            showApp();
        }
    });

    // Share group code
    document.getElementById('share-group-btn').addEventListener('click', () => {
        if (!state.currentGroup) return;

        const code = state.currentGroup.join_code;
        const message = `Join code for "${state.currentGroup.name}":\n\n${code}\n\nShare this code with others to invite them!`;

        // Try to copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code).then(() => {
                alert(message + '\n\n✓ Code copied to clipboard!');
            }).catch(() => {
                alert(message);
            });
        } else {
            alert(message);
        }
    });

    // Date picker
    const datePicker = document.getElementById('date-picker');
    datePicker.value = getTodayISO();
    datePicker.addEventListener('change', renderDailyLog);

    // Add player
    const addPlayerBtn = document.getElementById('add-player-btn');
    const playerNameInput = document.getElementById('player-name');

    addPlayerBtn.addEventListener('click', async () => {
        if (await addPlayer(playerNameInput.value)) {
            playerNameInput.value = '';
            render();
        }
    });

    playerNameInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            if (await addPlayer(playerNameInput.value)) {
                playerNameInput.value = '';
                render();
            }
        }
    });
}

// ====================
// INITIALIZATION
// ====================

async function init() {
    console.log('🚀 Initializing app...');

    // Initialize Supabase
    if (!initSupabase()) {
        document.body.innerHTML = '<div style="text-align: center; padding: 50px;"><h1>Configuration Error</h1><p>Please update config.js with your Supabase credentials.</p></div>';
        return;
    }

    // Set up event handlers
    initEventHandlers();

    // Set up auth state listener
    console.log('Setting up auth state listener...');
    supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Check current session
    console.log('Checking for existing session...');
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Error getting session:', error);
            showSignIn();
            return;
        }

        console.log('Session check result:', session ? 'Session exists' : 'No session');

        if (!session) {
            console.log('No session, showing sign in screen');
            showSignIn();
        } else {
            console.log('Session exists, user:', session.user.email);
            // Set a timeout fallback in case auth state listener doesn't fire
            const fallbackTimeout = setTimeout(() => {
                console.warn('Auth state listener did not fire after 2s, manually loading user...');
                if (!state.user && session) {
                    state.user = session.user;
                    onUserSignedIn();
                }
            }, 2000);

            // Clear timeout if auth listener fires
            const originalHandler = handleAuthStateChange;
            window._authListenerFired = false;

            // Wait a bit to see if auth listener fires
            setTimeout(() => {
                if (window._authListenerFired) {
                    console.log('Auth listener fired, clearing fallback');
                    clearTimeout(fallbackTimeout);
                }
            }, 100);
        }
    } catch (error) {
        console.error('Error during initialization:', error);
        showSignIn();
    }
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
