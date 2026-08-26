/* ========================================
   JADUAL VIP MAHA 2026 - Main Application
   ======================================== */

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRc7xzsRJbCSuCuw7XCk375hx0TiDacveIjE_UknQWJmLkcSaH-S6GUsIvbTf8t_zBbuICRGO-fzitO/pub?output=csv';

// Global state
let allData = [];
let filteredData = [];

// Day names in Malay
const HARI = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    startCountdown();
});

function setupEventListeners() {
    // Filters
    document.getElementById('filterTarikh').addEventListener('change', applyFilters);
    document.getElementById('filterLokasi').addEventListener('change', applyFilters);
    document.getElementById('filterVIP').addEventListener('change', applyFilters);
    document.getElementById('filterStatus').addEventListener('change', applyFilters);

    // Buttons
    document.getElementById('btnResetFilter').addEventListener('click', resetFilters);
    document.getElementById('btnRefresh').addEventListener('click', loadData);
    document.getElementById('btnExportPDF').addEventListener('click', openPDFModal);

    // Modal
    document.getElementById('btnCloseModal').addEventListener('click', closePDFModal);
    document.getElementById('btnCancelPDF').addEventListener('click', closePDFModal);
    document.getElementById('btnGeneratePDF').addEventListener('click', generatePDF);

    // Close modal on overlay click
    document.getElementById('pdfModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closePDFModal();
    });
}

// ========== COUNTDOWN ==========
function startCountdown() {
    const target = new Date('2026-08-28T10:00:00+08:00').getTime();

    function update() {
        const now = Date.now();
        const diff = target - now;

        if (diff <= 0) {
            document.getElementById('cdDays').textContent = '0';
            document.getElementById('cdHours').textContent = '0';
            document.getElementById('cdMins').textContent = '0';
            document.getElementById('cdSecs').textContent = '0';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('cdDays').textContent = String(days).padStart(3, '0');
        document.getElementById('cdHours').textContent = String(hours).padStart(2, '0');
        document.getElementById('cdMins').textContent = String(mins).padStart(2, '0');
        document.getElementById('cdSecs').textContent = String(secs).padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
}

// ========== DATA LOADING ==========
async function loadData() {
    showLoading(true);
    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error('Gagal memuat data');
        const csvText = await response.text();
        allData = parseCSV(csvText);
        populateFilters();
        applyFilters();
        updateStats();
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Ralat memuat data. Sila semak sambungan internet anda dan cuba lagi.');
    } finally {
        showLoading(false);
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = parseCSVLine(lines[0]);
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= 6) {
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
                status: cleanText(values[5])
            });
        }
    }

    // Sort by date then time
    data.sort((a, b) => {
        if (a.tarikhObj && b.tarikhObj) {
            const dateDiff = a.tarikhObj - b.tarikhObj;
            if (dateDiff !== 0) return dateDiff;
        }
        return compareTimes(a.masa, b.masa);
    });

    return data;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

function parseDate(dateStr) {
    // Format: M/D/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const month = parseInt(parts[0]) - 1;
        const day = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        return new Date(year, month, day);
    }
    return null;
}

function formatDate(dateObj) {
    if (!dateObj) return '';
    const day = dateObj.getDate();
    const month = BULAN[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    return `${day} ${month} ${year}`;
}

function formatDateShort(dateObj) {
    if (!dateObj) return '';
    const day = dateObj.getDate();
    const month = BULAN[dateObj.getMonth()].substring(0, 3);
    return `${day} ${month}`;
}

function cleanText(text) {
    return text.replace(/\s+/g, ' ').trim();
}

function compareTimes(a, b) {
    const parseTime = (t) => {
        const match = t.match(/(\d+)\.(\d+)\s*(AM|PM)/i);
        if (!match) return 0;
        let hours = parseInt(match[1]);
        const mins = parseInt(match[2]);
        const period = match[3].toUpperCase();
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + mins;
    };
    return parseTime(a) - parseTime(b);
}

// ========== FILTERS ==========
function populateFilters() {
    const tarikhSet = new Map();
    const lokasiSet = new Set();
    const vipSet = new Set();
    const statusSet = new Set();

    allData.forEach(item => {
        if (item.tarikhObj) {
            const key = item.tarikh;
            if (!tarikhSet.has(key)) {
                tarikhSet.set(key, { obj: item.tarikhObj, formatted: item.tarikhFormatted, hari: item.hari });
            }
        }
        lokasiSet.add(item.lokasi);
        vipSet.add(item.vip);
        statusSet.add(getStatusCategory(item.status));
    });

    // Populate Tarikh
    const tarikhSelect = document.getElementById('filterTarikh');
    tarikhSelect.innerHTML = '<option value="">Semua Tarikh</option>';
    const sortedDates = [...tarikhSet.entries()].sort((a, b) => a[1].obj - b[1].obj);
    sortedDates.forEach(([key, val]) => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = `${val.formatted} (${val.hari})`;
        tarikhSelect.appendChild(opt);
    });

    // Populate Lokasi
    const lokasiSelect = document.getElementById('filterLokasi');
    lokasiSelect.innerHTML = '<option value="">Semua Lokasi</option>';
    [...lokasiSet].sort().forEach(lokasi => {
        const opt = document.createElement('option');
        opt.value = lokasi;
        opt.textContent = lokasi;
        lokasiSelect.appendChild(opt);
    });

    // Populate VIP
    const vipSelect = document.getElementById('filterVIP');
    vipSelect.innerHTML = '<option value="">Semua VIP</option>';
    [...vipSet].sort().forEach(vip => {
        const opt = document.createElement('option');
        opt.value = vip;
        opt.textContent = vip;
        vipSelect.appendChild(opt);
    });

    // Populate Status
    const statusSelect = document.getElementById('filterStatus');
    statusSelect.innerHTML = '<option value="">Semua Status</option>';
    [...statusSet].sort().forEach(status => {
        const opt = document.createElement('option');
        opt.value = status;
        opt.textContent = status;
        statusSelect.appendChild(opt);
    });
}

function getStatusCategory(status) {
    const s = status.toUpperCase();
    if (s.includes('CADANGAN')) return 'CADANGAN';
    if (s.includes('DISAHKAN') || s.includes('TELAH DISAHKAN')) return 'DISAHKAN';
    if (s.includes('JEMPUTAN')) return 'SURAT JEMPUTAN';
    if (s.includes('MEDIA') || s.includes('BERNAMA')) return 'MEDIA';
    if (s.includes('TINDAKAN')) return 'TINDAKAN';
    if (s.includes('PENYELARASAN')) return 'PENYELARASAN';
    return 'LAIN-LAIN';
}

function applyFilters() {
    const tarikh = document.getElementById('filterTarikh').value;
    const lokasi = document.getElementById('filterLokasi').value;
    const vip = document.getElementById('filterVIP').value;
    const status = document.getElementById('filterStatus').value;

    filteredData = allData.filter(item => {
        if (tarikh && item.tarikh !== tarikh) return false;
        if (lokasi && item.lokasi !== lokasi) return false;
        if (vip && item.vip !== vip) return false;
        if (status && getStatusCategory(item.status) !== status) return false;
        return true;
    });

    renderTable(filteredData);
    document.getElementById('resultCount').textContent = filteredData.length;
}

function resetFilters() {
    document.getElementById('filterTarikh').value = '';
    document.getElementById('filterLokasi').value = '';
    document.getElementById('filterVIP').value = '';
    document.getElementById('filterStatus').value = '';
    applyFilters();
}

// ========== TABLE RENDERING (no status column) ==========
function renderTable(data) {
    const tbody = document.getElementById('scheduleBody');
    const emptyState = document.getElementById('emptyState');

    if (data.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    let html = '';
    let currentDate = '';
    let rowNum = 0;

    data.forEach((item) => {
        // Date group header
        if (item.tarikhFormatted !== currentDate) {
            currentDate = item.tarikhFormatted;
            html += `<tr class="date-group-row">
                <td colspan="6"><i class="fas fa-calendar-day"></i> ${item.tarikhFormatted} (${item.hari})</td>
            </tr>`;
        }

        rowNum++;

        html += `<tr>
            <td class="td-no">${rowNum}</td>
            <td class="td-program">${escapeHtml(item.program)}</td>
            <td class="td-tarikh">${formatDateShort(item.tarikhObj)}</td>
            <td class="td-masa">${item.masa}</td>
            <td class="td-lokasi"><span class="lokasi-badge"><i class="fas fa-map-pin"></i> ${escapeHtml(item.lokasi)}</span></td>
            <td class="td-vip">${escapeHtml(item.vip)}</td>
        </tr>`;
    });

    tbody.innerHTML = html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== STATS ==========
function updateStats() {
    const tarikhSet = new Set();
    const vipSet = new Set();
    const lokasiSet = new Set();

    allData.forEach(item => {
        tarikhSet.add(item.tarikh);
        vipSet.add(item.vip);
        lokasiSet.add(item.lokasi);
    });

    document.getElementById('statTarikh').textContent = tarikhSet.size;
    document.getElementById('statProgram').textContent = allData.length;
    document.getElementById('statVIP').textContent = vipSet.size;
    document.getElementById('statLokasi').textContent = lokasiSet.size;
}

// ========== UI HELPERS ==========
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

function openPDFModal() {
    document.getElementById('pdfModal').style.display = 'flex';
}

function closePDFModal() {
    document.getElementById('pdfModal').style.display = 'none';
}
