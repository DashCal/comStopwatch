// State
const state = {
    count: 0,
    letters: 0,
    spaces: 0,
    records: []
};

// Elements
const els = {
    clock: document.getElementById('clock'),
    date: document.getElementById('date'),
    total: document.getElementById('total'),
    letters: document.getElementById('letters'),
    spaces: document.getElementById('spaces'),
    list: document.getElementById('list'),
    empty: document.getElementById('empty'),
    status: document.getElementById('status')
};

// Clock update (seconds only, no ms)
function updateClock() {
    const now = new Date();
    els.clock.textContent = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    els.date.textContent = now.toLocaleDateString('en-CA'); // ISO format
}
setInterval(updateClock, 1000);
updateClock();

// Format precise time for records (with ms)
function formatPrecise(date) {
    const iso = date.toISOString(); // 2024-01-15T10:30:45.123Z
    return {
        time: iso.slice(11, 19),     // 10:30:45
        ms: iso.slice(20, 23),       // 123
        full: iso.replace('T', ' ').replace('Z', '').slice(0, 23)
    };
}

// Add record
function log(key, isSpace) {
    const now = new Date();
    const precise = formatPrecise(now);

    // Update counts
    state.count++;
    isSpace ? state.spaces++ : state.letters++;

    // Update stats
    els.total.textContent = state.count;
    els.letters.textContent = state.letters;
    els.spaces.textContent = state.spaces;

    // Create record
    const record = {
        id: state.count,
        key: isSpace ? 'Space' : key.toUpperCase(),
        isSpace: isSpace,
        time: precise.time,
        ms: precise.ms,
        full: precise.full
    };
    state.records.unshift(record);

    // Render
    render(record);
    showStatus(key, isSpace);
}

// Render single record
function render(r) {
    if (state.count === 1) {
        els.empty.remove();
    }

    const div = document.createElement('div');
    div.className = 'record';
    div.innerHTML = `
                <div class="col-index">${r.id.toString().padStart(3, '0')}</div>
                <div class="col-key ${r.isSpace ? 'space' : 'letter'}">${r.key}</div>
                <div class="col-full">${r.full}</div>
                <button class="btn col-copy">Copy</button>
            `;
    // <div class="col-time">${r.time}<span style="color:var(--text-muted)">.${r.ms}</span></div>
    els.list.insertBefore(div, els.list.firstChild);

    // Limit to 50 records for performance
    if (els.list.children.length > 50) {
        els.list.removeChild(els.list.lastChild);
    }
}

// Status feedback
function showStatus(key, isSpace) {
    els.status.textContent = `Captured: ${isSpace ? 'Space' : key.toUpperCase()}`;
    els.status.className = 'status active' + (isSpace ? '' : ' letter');

    setTimeout(() => {
        els.status.className = 'status';
        els.status.textContent = 'Ready';
    }, 300);
}

// Clear all
function clearAll() {
    state.count = 0;
    state.letters = 0;
    state.spaces = 0;
    state.records = [];

    els.total.textContent = '0';
    els.letters.textContent = '0';
    els.spaces.textContent = '0';

    els.list.innerHTML = '<div class="empty" id="empty">Press any letter or space to begin</div>';
    els.empty = document.getElementById('empty');

    els.status.textContent = 'Cleared';
    els.status.className = 'status active';
    setTimeout(() => {
        els.status.className = 'status';
        els.status.textContent = 'Ready';
    }, 300);
}

// Keyboard handler
document.addEventListener('keydown', e => {
    // Ignore if typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key;

    // Space
    if (key === ' ') {
        e.preventDefault();
        log('Space', true);
        return;
    }

    // Letters only (a-z, A-Z)
    if (key.length === 1 && /[a-zA-Z]/.test(key)) {
        log(key, false);
    }
});

// Prevent space scroll
window.addEventListener('keydown', e => {
    if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
    }
});

// log('Space', true);
// log('a', false);
// log('Space', true);
// log('u', false);
// log('Space', true);
// log('R', false);
// log('E', false);
// log('Space', true);
// log('F', false);
// log('Space', true);
