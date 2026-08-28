/* ========================================
   JADUAL VIP MAHA 2026 - Main Application
   Dashboard with Tabs: UTAMA, JADUAL PENUH, EKSEKUTIF
   ======================================== */

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRc7xzsRJbCSuCuw7XCk375hx0TiDacveIjE_UknQWJmLkcSaH-S6GUsIvbTf8t_zBbuICRGO-fzitO/pub?output=csv';
const SHEET_ID = '1Wiaz5aiuIkdLDMnqAmT2tQTLWBGXeVM6LpT9lWn1amk';

// Global state
let allData = [];
let filteredDataUtama = [];
let filteredDataFull = [];
let currentDateIndex = 0;
let availableDates = [];
let chartInstances = {};
let datePickerOpen = false;
let autoRefreshInterval = null;

// Day names in Malay
const HARI = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];

// ========== VIEWPORT DETECTION ==========
function isMobile() {
    return window.innerWidth < 768;
}

let previousMobileState = isMobile();

window.addEventListener('resize', () => {
    const currentMobileState = isMobile();
    if (currentMobileState !== previousMobileState) {
        previousMobileState = currentMobileState;
        applyUtamaFilters();
        applyFullFilters();
        if (typeof renderDateTabs === 'function') renderDateTabs();
        updateMobileNav();
    }
});

function updateMobileNav() {
    // Sync bottom nav active state with current tab
    const activeTab = document.querySelector('.nav-tab.active');
    if (activeTab) {
        const tabId = activeTab.dataset.tab;
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabId);
        });
    }
}

// ========== VIP BADGE COLORS ==========
const VIP_BADGE_COLORS = [
    '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12',
    '#1abc9c', '#e67e22', '#16a085', '#8e44ad', '#d35400',
    '#2980b9', '#27ae60', '#c0392b', '#7f8c8d', '#2c3e50'
];

function getVipBadgeColor(vipName) {
    const trimmed = vipName.trim().toUpperCase();
    let hash = 0;
    for (let i = 0; i < trimmed.length; i++) {
        hash = ((hash << 5) - hash) + trimmed.charCodeAt(i);
        hash = hash & hash;
    }
    return VIP_BADGE_COLORS[Math.abs(hash) % VIP_BADGE_COLORS.length];
}

function renderVipBadges(vipString) {
    if (!vipString) return '';
    return vipString.split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0)
        .map(name => `<span class="vip-badge" style="background-color:${getVipBadgeColor(name)}">${escapeHtml(name)}</span>`)
        .join('');
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    updateDateTime();
    setInterval(updateDateTime, 60000);
    loadData();
    setupEventListeners();
    // Auto refresh every 5 seconds
    startAutoRefresh();
});

function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(() => {
        liveRefresh();
    }, 5000);
}

// Live refresh every 5 seconds - pulls fresh data from Google Sheet
function liveRefresh() {
    loadDataViaJSONP(true);
}

function updateDateTime() {
    const now = new Date();
    const hari = HARI[now.getDay()].toUpperCase();
    const day = now.getDate();
    const bulan = BULAN[now.getMonth()].toUpperCase();
    const year = now.getFullYear();
    const hours = now.getHours();
    const mins = String(now.getMinutes()).padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    document.getElementById('currentDateTime').textContent = `${hari}, ${day} ${bulan} ${year} | ${h12}:${mins}${period}`;
}

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Date navigation
    document.getElementById('btnPrevDay').addEventListener('click', () => navigateDate(-1));
    document.getElementById('btnNextDay').addEventListener('click', () => navigateDate(1));

    // Date picker popup
    document.getElementById('dateDisplayBtn').addEventListener('click', toggleDatePicker);
    document.getElementById('btnClosePicker').addEventListener('click', closeDatePicker);

    // Close date picker when clicking outside
    document.addEventListener('click', (e) => {
        const popup = document.getElementById('datePickerPopup');
        const btn = document.getElementById('dateDisplayBtn');
        if (datePickerOpen && !popup.contains(e.target) && !btn.contains(e.target)) {
            closeDatePicker();
        }
    });

    // UTAMA filters
    document.getElementById('filterProgram').addEventListener('change', applyUtamaFilters);
    document.getElementById('filterLokasi').addEventListener('change', applyUtamaFilters);
    document.getElementById('filterVIP').addEventListener('change', applyUtamaFilters);
    document.getElementById('searchInput').addEventListener('input', applyUtamaFilters);

    // JADUAL PENUH filters
    document.getElementById('filterTarikhFull').addEventListener('change', applyFullFilters);
    document.getElementById('filterProgramFull').addEventListener('change', applyFullFilters);
    document.getElementById('filterLokasiFull').addEventListener('change', applyFullFilters);
    document.getElementById('filterVIPFull').addEventListener('change', applyFullFilters);
    document.getElementById('searchInputFull').addEventListener('input', applyFullFilters);

    // Refresh buttons
    document.getElementById('btnRefresh').addEventListener('click', loadData);
    document.getElementById('btnRefreshFull').addEventListener('click', loadData);

    // Download buttons - now generates PDF
    document.getElementById('btnDownloadToday').addEventListener('click', () => generateSchedulePDF('today'));
    document.getElementById('btnDownloadFull').addEventListener('click', () => generateSchedulePDF('full'));

    // Bottom navigation (mobile)
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.addEventListener('click', () => switchTab(item.dataset.tab));
    });

    // Filter sheet (mobile)
    document.getElementById('btnFilterTrigger').addEventListener('click', openFilterSheet);
    document.getElementById('filterSheetClose').addEventListener('click', closeFilterSheet);
    document.getElementById('filterBackdrop').addEventListener('click', closeFilterSheet);

    // TAPIS (apply filter) button in mobile filter sheet
    document.getElementById('btnApplyFilter').addEventListener('click', applyMobileFilters);
    
    // RESET filter button in mobile filter sheet
    document.getElementById('btnResetFilter').addEventListener('click', resetMobileFilters);

    // MUAT SEMULA (reload) button
    document.getElementById('btnReload').addEventListener('click', loadData);

    // Date tabs click delegation (mobile)
    document.getElementById('dateTabsScroll').addEventListener('click', (e) => {
        const tab = e.target.closest('.date-tab');
        if (!tab) return;
        const idx = parseInt(tab.dataset.index);
        if (!isNaN(idx)) {
            selectDate(idx);
            renderDateTabs();
        }
    });
}

// ========== TAB MANAGEMENT ==========
function switchTab(tabId) {
    closeFilterSheet();
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    // Update bottom nav active states
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabId}`);
    });
    if (tabId === 'eksekutif' && allData.length > 0) {
        setTimeout(() => renderCharts(), 100);
    }
}

// ========== FILTER SHEET (MOBILE) ==========
function openFilterSheet() {
    document.getElementById('filterBackdrop').classList.add('active');
    document.getElementById('filterSheet').classList.add('active');
}

function closeFilterSheet() {
    document.getElementById('filterBackdrop').classList.remove('active');
    document.getElementById('filterSheet').classList.remove('active');
}

function applyMobileFilters() {
    // Read mobile filter values and apply them to the desktop filter inputs
    document.getElementById('filterProgram').value = document.getElementById('filterProgramMobile').value;
    document.getElementById('filterLokasi').value = document.getElementById('filterLokasiMobile').value;
    document.getElementById('filterVIP').value = document.getElementById('filterVIPMobile').value;
    document.getElementById('searchInput').value = document.getElementById('searchInputMobile').value;
    
    // Also apply to jadual penuh filters
    document.getElementById('filterProgramFull').value = document.getElementById('filterProgramMobile').value;
    document.getElementById('filterLokasiFull').value = document.getElementById('filterLokasiMobile').value;
    document.getElementById('filterVIPFull').value = document.getElementById('filterVIPMobile').value;
    document.getElementById('searchInputFull').value = document.getElementById('searchInputMobile').value;
    
    applyUtamaFilters();
    applyFullFilters();
    closeFilterSheet();
}

function resetMobileFilters() {
    // Clear all mobile filter values
    document.getElementById('filterProgramMobile').value = '';
    document.getElementById('filterLokasiMobile').value = '';
    document.getElementById('filterVIPMobile').value = '';
    document.getElementById('searchInputMobile').value = '';
    
    // Clear desktop filter values too
    document.getElementById('filterProgram').value = '';
    document.getElementById('filterLokasi').value = '';
    document.getElementById('filterVIP').value = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('filterProgramFull').value = '';
    document.getElementById('filterLokasiFull').value = '';
    document.getElementById('filterVIPFull').value = '';
    document.getElementById('searchInputFull').value = '';
    
    applyUtamaFilters();
    applyFullFilters();
    closeFilterSheet();
}

function populateFiltersMobile() {
    // Mirror desktop filter options into mobile sheet selects
    copySelectOptions('filterProgram', 'filterProgramMobile');
    copySelectOptions('filterLokasi', 'filterLokasiMobile');
    copySelectOptions('filterVIP', 'filterVIPMobile');
}

function copySelectOptions(sourceId, targetId) {
    const source = document.getElementById(sourceId);
    const target = document.getElementById(targetId);
    target.innerHTML = source.innerHTML;
}

// ========== DATE TABS (MOBILE) ==========
function getDateTabLabel(dateInfo, dayDiff) {
    if (dayDiff === -1) return 'SEMALAM';
    if (dayDiff === 0) return 'HARI INI';
    if (dayDiff === 1) return 'ESOK';
    const day = dateInfo.obj.getDate();
    const month = BULAN[dateInfo.obj.getMonth()].substring(0, 3).toUpperCase();
    return `${day} ${month}`;
}

function renderDateTabs() {
    if (!isMobile()) return;
    const container = document.getElementById('dateTabsScroll');
    if (!container) return;
    if (availableDates.length === 0) {
        container.innerHTML = '';
        return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    container.innerHTML = availableDates.map((dateInfo, idx) => {
        const diff = Math.round((dateInfo.obj - today) / (1000 * 60 * 60 * 24));
        const label = getDateTabLabel(dateInfo, diff);
        const activeClass = idx === currentDateIndex ? 'active' : '';
        return `<button class="date-tab ${activeClass}" data-index="${idx}">${label}</button>`;
    }).join('');

    // Auto-scroll active tab into view
    const activeTab = container.querySelector('.date-tab.active');
    if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
}

// ========== DATE PICKER ==========
function toggleDatePicker() {
    if (datePickerOpen) {
        closeDatePicker();
    } else {
        openDatePicker();
    }
}

function openDatePicker() {
    const popup = document.getElementById('datePickerPopup');
    renderDatePickerList();
    popup.style.display = 'block';
    datePickerOpen = true;
}

function closeDatePicker() {
    document.getElementById('datePickerPopup').style.display = 'none';
    datePickerOpen = false;
}

function renderDatePickerList() {
    const list = document.getElementById('datePickerList');
    if (availableDates.length === 0) {
        list.innerHTML = '<p style="padding:1rem;text-align:center;color:#999;">Tiada tarikh tersedia</p>';
        return;
    }

    let html = '';
    availableDates.forEach((dateInfo, idx) => {
        const isActive = idx === currentDateIndex;
        const dayNum = dateInfo.obj.getDate();
        const programCount = allData.filter(item => item.tarikh === dateInfo.key).length;

        html += `<div class="date-picker-item ${isActive ? 'active' : ''}" onclick="selectDate(${idx})">
            <span class="dp-date">${dayNum}</span>
            <div class="dp-info">
                <span class="dp-day">${dateInfo.hari}</span>
                <span class="dp-full">${dateInfo.formatted}</span>
            </div>
            <span class="dp-count">${programCount} program</span>
        </div>`;
    });

    list.innerHTML = html;
}

function selectDate(idx) {
    currentDateIndex = idx;
    updateDateDisplay();
    applyUtamaFilters();
    closeDatePicker();
}

// ========== DATE NAVIGATION ==========
function navigateDate(direction) {
    if (availableDates.length === 0) return;
    currentDateIndex += direction;
    if (currentDateIndex < 0) currentDateIndex = availableDates.length - 1;
    if (currentDateIndex >= availableDates.length) currentDateIndex = 0;
    updateDateDisplay();
    applyUtamaFilters();
}

function updateDateDisplay() {
    if (availableDates.length === 0) return;
    const currentDate = availableDates[currentDateIndex];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateObj = currentDate.obj;
    const diff = Math.round((dateObj - today) / (1000 * 60 * 60 * 24));

    let label = '';
    if (diff === 0) {
        label = 'HARI INI';
    } else if (diff === 1) {
        label = 'ESOK';
    } else if (diff === -1) {
        label = 'SEMALAM';
    } else {
        const hari = HARI[dateObj.getDay()].toUpperCase();
        const day = dateObj.getDate();
        const bulan = BULAN[dateObj.getMonth()].toUpperCase();
        label = `${hari}, ${day} ${bulan}`;
    }
    document.getElementById('currentDayLabel').textContent = label;
}

function findTodayIndex() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayIdx = availableDates.findIndex(d => d.obj.getTime() === today.getTime());
    if (todayIdx !== -1) return todayIdx;

    const futureIdx = availableDates.findIndex(d => d.obj >= today);
    if (futureIdx !== -1) return futureIdx;

    // Closest date
    let closestIdx = 0;
    let closestDiff = Infinity;
    availableDates.forEach((dateInfo, idx) => {
        const diff = Math.abs(dateInfo.obj - today);
        if (diff < closestDiff) { closestDiff = diff; closestIdx = idx; }
    });
    return closestIdx;
}

// ========== DATA LOADING ==========
async function loadData() {
    showLoading(true);
    await loadDataViaJSONP(false);
}

// JSONP-based live data fetch from Google Sheet (works from file:// and web servers)
function loadDataViaJSONP(isSilent) {
    return new Promise((resolve, reject) => {
        const callbackName = 'gvizCb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const scriptUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=responseHandler:${callbackName}`;

        const timeout = setTimeout(() => {
            cleanup();
            if (!isSilent) showLoading(false);
            reject(new Error('Timeout'));
        }, 10000);

        function cleanup() {
            clearTimeout(timeout);
            delete window[callbackName];
            const el = document.getElementById(callbackName);
            if (el) el.remove();
        }

        window[callbackName] = function(response) {
            try {
                if (response && response.table && response.table.rows) {
                    const data = parseGvizResponse(response.table);

                    if (data.length > 0) {
                        // Only update UI if data changed
                        const newFP = data.map(d => d.program + d.tarikh + d.masa + d.vip).join('|');
                        const oldFP = allData.map(d => d.program + d.tarikh + d.masa + d.vip).join('|');

                        if (newFP !== oldFP) {
                            allData = data;
                            initAfterLoad();
                            if (isSilent) {
                                console.log(`[Live] Data dikemaskini: ${allData.length} records @ ${new Date().toLocaleTimeString()}`);
                            } else {
                                console.log(`[Data] Loaded ${allData.length} records from Google Sheet`);
                            }
                        }
                    }
                    cleanup();
                    if (!isSilent) showLoading(false);
                    resolve();
                } else {
                    cleanup();
                    if (!isSilent) showLoading(false);
                    reject(new Error('Invalid response'));
                }
            } catch (e) {
                cleanup();
                if (!isSilent) showLoading(false);
                reject(e);
            }
        };

        const script = document.createElement('script');
        script.id = callbackName;
        script.src = scriptUrl;
        script.onerror = () => {
            cleanup();
            if (!isSilent) showLoading(false);
            reject(new Error('Script load failed'));
        };
        document.head.appendChild(script);
    });
}

function parseGvizResponse(table) {
    const data = [];
    table.rows.forEach(row => {
        if (!row.c || row.c.length < 5) return;
        const values = row.c.map(cell => {
            if (!cell || cell.v === null || cell.v === undefined) return '';
            return String(cell.v);
        });
        if (!values[0].trim()) return;

        let rawDate = values[1];
        let dateObj = null;
        const dateMatch = rawDate.match(/Date\((\d+),(\d+),(\d+)\)/);
        if (dateMatch) {
            const year = parseInt(dateMatch[1]);
            const month = parseInt(dateMatch[2]);
            const day = parseInt(dateMatch[3]);
            dateObj = new Date(year, month, day);
            rawDate = `${month + 1}/${day}/${year}`;
        } else {
            dateObj = parseDate(rawDate);
        }

        data.push({
            program: cleanText(values[0]),
            tarikh: rawDate,
            tarikhObj: dateObj,
            tarikhFormatted: formatDate(dateObj),
            hari: dateObj ? HARI[dateObj.getDay()] : '',
            masa: values[2].trim(),
            lokasi: cleanText(values[3]),
            vip: values[4].trim(),
            status: values.length > 5 ? cleanText(values[5]) : ''
        });
    });

    data.sort((a, b) => {
        if (a.tarikhObj && b.tarikhObj) {
            const d = a.tarikhObj - b.tarikhObj;
            if (d !== 0) return d;
        }
        return compareTimes(a.masa, b.masa);
    });
    return data;
}

function initAfterLoad() {
    buildDatesList();
    currentDateIndex = findTodayIndex();
    updateDateDisplay();
    renderDateTabs();
    populateFilters();
    applyUtamaFilters();
    applyFullFilters();
    updateExecStats();
}

function parseCSV(csvText) {
    // Parse CSV properly handling multiline quoted fields
    const records = parseCSVRecords(csvText);
    if (records.length < 2) return [];

    const data = [];
    for (let i = 1; i < records.length; i++) {
        const values = records[i];
        if (values.length >= 5 && values[0].trim()) {
            const rawDate = values[1].trim();
            const dateObj = parseDate(rawDate);
            data.push({
                program: cleanText(values[0]),
                tarikh: rawDate,
                tarikhObj: dateObj,
                tarikhFormatted: formatDate(dateObj),
                hari: dateObj ? HARI[dateObj.getDay()] : '',
                masa: values[2].trim(),
                lokasi: cleanText(values[3]),
                vip: values[4].trim(),
                status: values.length > 5 ? cleanText(values[5]) : ''
            });
        }
    }
    data.sort((a, b) => {
        if (a.tarikhObj && b.tarikhObj) {
            const d = a.tarikhObj - b.tarikhObj;
            if (d !== 0) return d;
        }
        return compareTimes(a.masa, b.masa);
    });
    return data;
}

function parseCSVRecords(csvText) {
    // Properly handles multiline quoted fields
    const records = [];
    let current = [];
    let field = '';
    let inQuotes = false;
    const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < text.length && text[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                current.push(field);
                field = '';
            } else if (char === '\n') {
                current.push(field);
                field = '';
                records.push(current);
                current = [];
            } else {
                field += char;
            }
        }
    }
    // Last field/record
    if (field || current.length > 0) {
        current.push(field);
        records.push(current);
    }
    return records;
}

function parseDate(dateStr) {
    const parts = dateStr.split('/');
    if (parts.length === 3) return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
    return null;
}

function formatDate(dateObj) {
    if (!dateObj) return '';
    return `${dateObj.getDate()} ${BULAN[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}

function formatDateShort(dateObj) {
    if (!dateObj) return '';
    return `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
}

function cleanText(text) { return text.replace(/\s+/g, ' ').trim(); }

function compareTimes(a, b) {
    const parseTime = (t) => {
        const match = t.match(/(\d+)[\.:](\d+)\s*(AM|PM)/i);
        if (!match) return 0;
        let h = parseInt(match[1]); const m = parseInt(match[2]); const p = match[3].toUpperCase();
        if (p === 'PM' && h !== 12) h += 12;
        if (p === 'AM' && h === 12) h = 0;
        return h * 60 + m;
    };
    return parseTime(a) - parseTime(b);
}

function buildDatesList() {
    const dateMap = new Map();
    allData.forEach(item => {
        if (item.tarikhObj && !dateMap.has(item.tarikh)) {
            dateMap.set(item.tarikh, { key: item.tarikh, obj: new Date(item.tarikhObj), formatted: item.tarikhFormatted, hari: item.hari });
        }
    });
    availableDates = [...dateMap.values()].sort((a, b) => a.obj - b.obj);
}

// ========== FILTERS ==========
function populateFilters() {
    const programSet = new Set(), lokasiSet = new Set(), vipSet = new Set();
    allData.forEach(item => {
        if (item.program) programSet.add(item.program);
        if (item.lokasi) lokasiSet.add(item.lokasi);
        if (item.vip) vipSet.add(item.vip);
    });
    populateSelect('filterProgram', 'PROGRAM', [...programSet].sort());
    populateSelect('filterLokasi', 'LOKASI', [...lokasiSet].sort());
    populateSelect('filterVIP', 'VIP', [...vipSet].sort());
    const tarikhOpts = availableDates.map(d => ({ value: d.key, label: `${d.formatted} (${d.hari})` }));
    populateSelectWithOptions('filterTarikhFull', 'TARIKH', tarikhOpts);
    populateSelect('filterProgramFull', 'PROGRAM', [...programSet].sort());
    populateSelect('filterLokasiFull', 'LOKASI', [...lokasiSet].sort());
    populateSelect('filterVIPFull', 'VIP', [...vipSet].sort());
    // Populate mobile filter sheet selects
    populateFiltersMobile();
}

function populateSelect(id, label, options) {
    const s = document.getElementById(id);
    s.innerHTML = `<option value="">${label}</option>`;
    options.forEach(o => { const opt = document.createElement('option'); opt.value = o; opt.textContent = o; s.appendChild(opt); });
}

function populateSelectWithOptions(id, label, options) {
    const s = document.getElementById(id);
    s.innerHTML = `<option value="">${label}</option>`;
    options.forEach(o => { const opt = document.createElement('option'); opt.value = o.value; opt.textContent = o.label; s.appendChild(opt); });
}

// ========== UTAMA TAB ==========
function applyUtamaFilters() {
    if (availableDates.length === 0) { filteredDataUtama = []; renderUtamaTable([]); return; }
    const currentDate = availableDates[currentDateIndex];
    const program = document.getElementById('filterProgram').value;
    const lokasi = document.getElementById('filterLokasi').value;
    const vip = document.getElementById('filterVIP').value;
    const search = document.getElementById('searchInput').value.toLowerCase().trim();

    filteredDataUtama = allData.filter(item => {
        if (item.tarikh !== currentDate.key) return false;
        if (program && item.program !== program) return false;
        if (lokasi && item.lokasi !== lokasi) return false;
        if (vip && item.vip !== vip) return false;
        if (search && !`${item.program} ${item.lokasi} ${item.vip} ${item.masa}`.toLowerCase().includes(search)) return false;
        return true;
    });
    renderUtamaTable(filteredDataUtama);
}

function renderUtamaTable(data) {
    if (isMobile()) {
        renderUtamaMobileCards(data);
        return;
    }
    const tbody = document.getElementById('scheduleBodyUtama');
    const empty = document.getElementById('emptyStateUtama');
    if (data.length === 0) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    tbody.innerHTML = data.map(item => `<tr>
        <td class="td-masa">${escapeHtml(item.masa)}</td>
        <td class="td-program">${escapeHtml(item.program)}</td>
        <td class="td-lokasi">${escapeHtml(item.lokasi)}</td>
        <td class="td-vip">${escapeHtml(item.vip)}</td>
    </tr>`).join('');
}

// ========== MOBILE CARD RENDERING ==========
function renderUtamaMobileCards(data) {
    const container = document.getElementById('mobileCardsUtama');
    if (!container) return;
    if (data.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-times"></i><p>Tiada program dijumpai.</p></div>';
        return;
    }
    container.innerHTML = data.map(item => `
        <div class="schedule-card">
            <div class="card-time">${escapeHtml(item.masa)}</div>
            <div class="card-body">
                <div class="card-program">${escapeHtml(item.program)}</div>
                <div class="card-lokasi"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(item.lokasi)}</div>
                <div class="card-vips">${renderVipBadges(item.vip)}</div>
            </div>
        </div>
    `).join('');
}

function renderFullMobileCards(data) {
    const container = document.getElementById('mobileCardsFull');
    if (!container) return;
    if (data.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-times"></i><p>Tiada program dijumpai.</p></div>';
        return;
    }
    // Group by date
    const grouped = new Map();
    data.forEach(item => {
        if (!grouped.has(item.tarikh)) {
            grouped.set(item.tarikh, { formatted: item.tarikhFormatted, hari: item.hari, items: [] });
        }
        grouped.get(item.tarikh).items.push(item);
    });

    let html = '';
    grouped.forEach((group) => {
        const hariUpper = group.hari ? group.hari.toUpperCase() : '';
        html += `<div class="mobile-date-header">${hariUpper}, ${group.formatted.toUpperCase()}</div>`;
        html += group.items.map(item => `
            <div class="schedule-card">
                <div class="card-time">${escapeHtml(item.masa)}</div>
                <div class="card-body">
                    <div class="card-program">${escapeHtml(item.program)}</div>
                    <div class="card-lokasi"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(item.lokasi)}</div>
                    <div class="card-vips">${renderVipBadges(item.vip)}</div>
                </div>
            </div>
        `).join('');
    });
    container.innerHTML = html;
}

// ========== JADUAL PENUH TAB ==========
function applyFullFilters() {
    const tarikh = document.getElementById('filterTarikhFull').value;
    const program = document.getElementById('filterProgramFull').value;
    const lokasi = document.getElementById('filterLokasiFull').value;
    const vip = document.getElementById('filterVIPFull').value;
    const search = document.getElementById('searchInputFull').value.toLowerCase().trim();

    filteredDataFull = allData.filter(item => {
        if (tarikh && item.tarikh !== tarikh) return false;
        if (program && item.program !== program) return false;
        if (lokasi && item.lokasi !== lokasi) return false;
        if (vip && item.vip !== vip) return false;
        if (search && !`${item.program} ${item.lokasi} ${item.vip} ${item.masa} ${item.tarikhFormatted}`.toLowerCase().includes(search)) return false;
        return true;
    });
    renderFullSchedule(filteredDataFull);
}

function renderFullSchedule(data) {
    if (isMobile()) {
        renderFullMobileCards(data);
        return;
    }
    const container = document.getElementById('fullScheduleContent');
    if (data.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-times"></i><p>Tiada program dijumpai.</p></div>`;
        return;
    }
    const grouped = new Map();
    data.forEach(item => {
        if (!grouped.has(item.tarikh)) grouped.set(item.tarikh, { formatted: item.tarikhFormatted, hari: item.hari, dateObj: item.tarikhObj, items: [] });
        grouped.get(item.tarikh).items.push(item);
    });

    let html = '';
    grouped.forEach((group) => {
        const hariUpper = group.hari ? group.hari.toUpperCase() : '';
        html += `<div class="date-section">
            <div class="date-section-header" onclick="toggleDateSection(this)">
                <div class="date-info"><i class="fas fa-calendar-day date-icon"></i><span class="date-text">${hariUpper}, ${group.formatted.toUpperCase()}</span></div>
                <i class="fas fa-chevron-up toggle-icon"></i>
            </div>
            <div class="date-section-body"><table class="schedule-table"><thead><tr>
                <th class="th-masa">MASA</th><th class="th-program">PROGRAM</th><th class="th-lokasi">KLUSTER/LOKASI</th><th class="th-vip">VIP</th>
            </tr></thead><tbody>`;
        group.items.forEach(item => {
            html += `<tr><td class="td-masa">${escapeHtml(item.masa)}</td><td class="td-program">${escapeHtml(item.program)}</td><td class="td-lokasi">${escapeHtml(item.lokasi)}</td><td class="td-vip">${escapeHtml(item.vip)}</td></tr>`;
        });
        html += `</tbody></table></div></div>`;
    });
    container.innerHTML = html;
}

function toggleDateSection(header) {
    header.classList.toggle('collapsed');
    const body = header.nextElementSibling;
    body.style.display = header.classList.contains('collapsed') ? 'none' : 'block';
}

// ========== EKSEKUTIF TAB ==========
function updateExecStats() {
    const vipSet = new Set(), lokasiSet = new Set();
    allData.forEach(item => { if (item.vip) vipSet.add(item.vip); if (item.lokasi) lokasiSet.add(item.lokasi); });
    document.getElementById('execVipCount').textContent = vipSet.size;
    document.getElementById('execLokasiCount').textContent = lokasiSet.size;
    document.getElementById('execProgramCount').textContent = allData.length;
}

function renderCharts() { renderVipByDayChart(); renderVipByClusterChart(); renderVipByAdminChart(); }

function renderVipByDayChart() {
    const ctx = document.getElementById('chartVipByDay');
    if (!ctx) return;
    if (chartInstances.vipByDay) chartInstances.vipByDay.destroy();
    const dateCounts = {};
    availableDates.forEach(d => {
        const vips = new Set();
        allData.filter(item => item.tarikh === d.key).forEach(item => { if (item.vip) item.vip.split(',').forEach(v => vips.add(v.trim())); });
        dateCounts[formatDateShort(d.obj)] = vips.size;
    });
    chartInstances.vipByDay = new Chart(ctx, {
        type: 'bar', data: { labels: Object.keys(dateCounts), datasets: [{ data: Object.values(dateCounts), backgroundColor: '#d4a017', borderRadius: 4, barThickness: 28 }] },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f0f0f0' } }, x: { ticks: { font: { size: 9 }, maxRotation: 45 }, grid: { display: false } } } }
    });
}

function renderVipByClusterChart() {
    const ctx = document.getElementById('chartVipByCluster');
    if (!ctx) return;
    if (chartInstances.vipByCluster) chartInstances.vipByCluster.destroy();
    const clusterCounts = {};
    allData.forEach(item => { if (item.lokasi) { if (!clusterCounts[item.lokasi]) clusterCounts[item.lokasi] = new Set(); if (item.vip) item.vip.split(',').forEach(v => clusterCounts[item.lokasi].add(v.trim())); } });
    const sorted = Object.entries(clusterCounts).map(([k, v]) => ({ label: k, count: v.size })).sort((a, b) => b.count - a.count).slice(0, 6);
    const total = sorted.reduce((a, b) => a + b.count, 0);
    const colors = ['#dc2626', '#1a2057', '#1e40af', '#d4a017', '#059669', '#7c3aed'];
    chartInstances.vipByCluster = new Chart(ctx, {
        type: 'doughnut', data: { labels: sorted.map(s => s.label), datasets: [{ data: sorted.map(s => s.count), backgroundColor: colors.slice(0, sorted.length), borderWidth: 2, borderColor: '#fff' }] },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'right', labels: { font: { size: 10 }, padding: 8, usePointStyle: true, pointStyle: 'rect' } }, tooltip: { callbacks: { label: (c) => `${c.label}: ${c.parsed} (${Math.round((c.parsed/total)*100)}%)` } } } }
    });
}

function renderVipByAdminChart() {
    const ctx = document.getElementById('chartVipByAdmin');
    if (!ctx) return;
    if (chartInstances.vipByAdmin) chartInstances.vipByAdmin.destroy();
    const cats = { 'MENTERI': ['YBM', 'YBTM', 'YB '], 'KPKM': ['KSU', 'TKSU', 'TKP', 'PK ', 'SUB'], 'FAMA': ['PENGERUSI FAMA', 'KP FAMA', 'TPKP', 'PKP'] };
    const counts = { 'MENTERI': 0, 'KPKM': 0, 'FAMA': 0 };
    allData.forEach(item => { if (!item.vip) return; const v = item.vip.toUpperCase(); for (const [cat, kw] of Object.entries(cats)) { for (const k of kw) { if (v.includes(k)) { counts[cat]++; break; } } } });
    chartInstances.vipByAdmin = new Chart(ctx, {
        type: 'bar', data: { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: '#d4a017', borderRadius: 4, barThickness: 32 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f0f0f0' } }, y: { ticks: { font: { size: 11, weight: '600' } }, grid: { display: false } } } }
    });
}

// ========== UTILITY ==========
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) overlay.classList.remove('hidden');
    else overlay.classList.add('hidden');
}
