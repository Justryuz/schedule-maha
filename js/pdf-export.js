/* ========================================
   JADUAL VIP MAHA 2026 - Professional PDF Export
   Fixed: no overlap, gold header, VIP bold color, proper spacing
   ======================================== */

async function generateSchedulePDF(type) {
    let data, dateLabel = '', dateSubtitle = '';

    if (type === 'today') {
        if (availableDates.length > 0) {
            const currentDate = availableDates[currentDateIndex];
            data = allData.filter(item => item.tarikh === currentDate.key);
            dateLabel = `${currentDate.hari.toUpperCase()}, ${currentDate.formatted.toUpperCase()}`;
            dateSubtitle = `${data.length} Program Dijadualkan`;
        } else {
            data = filteredDataUtama;
            dateLabel = 'HARI INI';
        }
    } else {
        data = filteredDataFull.length > 0 ? filteredDataFull : allData;
        dateLabel = 'JADUAL PENUH PROGRAM';
        dateSubtitle = `28 Ogos – 6 September 2026 | ${data.length} Program`;
    }

    if (data.length === 0) { alert('Tiada data untuk dimuat turun.'); return; }
    showLoading(true);

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('portrait', 'mm', 'a4');
        const W = pdf.internal.pageSize.getWidth();
        const H = pdf.internal.pageSize.getHeight();
        const M = 12; // margin
        const CW = W - M * 2; // content width
        const now = new Date();
        const genTime = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;

        // Column widths
        const col = { masa: 25, program: CW - 25 - 38 - 40, lokasi: 38, vip: 40 };
        let pageNum = 0;
        let y = 0;

        // Group by date
        const grouped = new Map();
        data.forEach(item => {
            if (!grouped.has(item.tarikh)) grouped.set(item.tarikh, { formatted: item.tarikhFormatted, hari: item.hari, items: [] });
            grouped.get(item.tarikh).items.push(item);
        });

        // ===== HELPERS =====
        function newPage() {
            if (pageNum > 0) pdf.addPage();
            pageNum++;
            // Gold top bar
            pdf.setFillColor(251, 176, 52);
            pdf.rect(0, 0, W, 2.5, 'F');
            // Gold bottom bar
            pdf.setFillColor(251, 176, 52);
            pdf.rect(0, H - 2.5, W, 2.5, 'F');
        }

        function drawFooter() {
            pdf.setFontSize(6.5);
            pdf.setTextColor(150, 150, 150);
            pdf.text('SULIT - Untuk kegunaan rasmi sahaja', M, H - 6);
            pdf.text('www.fama.gov.my | MAHA 2026', W - M, H - 6, { align: 'right' });
            pdf.text(`${pageNum}`, W / 2, H - 6, { align: 'center' });
        }

        function checkPage(needed) {
            if (y + needed > H - 12) {
                drawFooter();
                newPage();
                y = 8;
                return true;
            }
            return false;
        }

        function getTextHeight(text, maxW) {
            pdf.setFontSize(7);
            const lines = pdf.splitTextToSize(text || '', maxW);
            return Math.max(1, lines.length) * 3.2;
        }

        function getRowH(item) {
            const ph = getTextHeight(item.program, col.program - 3);
            const lh = getTextHeight(item.lokasi, col.lokasi - 3);
            const vh = getTextHeight(item.vip, col.vip - 3);
            return Math.max(ph, lh, vh) + 5;
        }

        // ===== FIRST PAGE HEADER =====
        newPage();
        y = 8;

        // Gold header background
        pdf.setFillColor(251, 176, 52);
        pdf.rect(0, 2.5, W, 32, 'F');

        // Title
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.setTextColor(26, 32, 87);
        pdf.text('JADUAL VIP MAHA 2026', W / 2, 14, { align: 'center' });

        // Date label
        pdf.setFontSize(10);
        pdf.setTextColor(26, 32, 87);
        pdf.text(dateLabel, W / 2, 21, { align: 'center' });

        // Subtitle
        pdf.setFontSize(7.5);
        pdf.setTextColor(60, 60, 60);
        pdf.text(dateSubtitle || '', W / 2, 26, { align: 'center' });

        // Meta
        pdf.setFontSize(6.5);
        pdf.setTextColor(80, 80, 80);
        pdf.text(`MAEPS, Serdang, Selangor  |  28 Ogos - 6 September 2026  |  Dijana: ${genTime}`, W / 2, 31, { align: 'center' });

        y = 38;

        // ===== DRAW DATE SECTION =====
        function drawDateBar(group) {
            checkPage(18);
            y += 3;
            // Navy rounded bar
            pdf.setFillColor(26, 32, 87);
            pdf.roundedRect(M, y, CW, 7, 1.5, 1.5, 'F');
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor(255, 255, 255);
            const hariUpper = group.hari ? group.hari.toUpperCase() : '';
            pdf.text(`${hariUpper}, ${group.formatted.toUpperCase()}`, M + 4, y + 5);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7);
            pdf.text(`${group.items.length} program`, W - M - 4, y + 5, { align: 'right' });
            y += 9;
        }

        function drawColHeader() {
            // Gold table header
            pdf.setFillColor(251, 176, 52);
            pdf.rect(M, y, CW, 6, 'F');
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(6.5);
            pdf.setTextColor(26, 26, 46);
            let x = M + 2;
            pdf.text('MASA', x, y + 4); x += col.masa;
            pdf.text('PROGRAM', x, y + 4); x += col.program;
            pdf.text('KLUSTER/LOKASI', x, y + 4); x += col.lokasi;
            pdf.text('VIP', x, y + 4);
            y += 7;
        }

        function drawRow(item, isAlt) {
            const rh = getRowH(item);

            // Check page break
            if (y + rh > H - 12) {
                drawFooter();
                newPage();
                y = 8;
                drawColHeader(); // Repeat column header on new page
            }

            // Alternating row bg
            if (isAlt) {
                pdf.setFillColor(248, 248, 248);
                pdf.rect(M, y, CW, rh, 'F');
            }

            let x = M + 2;
            const textY = y + 4;

            // Masa - bold navy
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(7);
            pdf.setTextColor(26, 32, 87);
            pdf.text(item.masa || '', x, textY, { maxWidth: col.masa - 2 });

            // Program
            x += col.masa;
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7);
            pdf.setTextColor(40, 40, 40);
            const pLines = pdf.splitTextToSize(item.program || '', col.program - 3);
            pdf.text(pLines, x, textY);

            // Lokasi
            x += col.program;
            pdf.setFontSize(6.5);
            pdf.setTextColor(80, 80, 80);
            const lLines = pdf.splitTextToSize(item.lokasi || '', col.lokasi - 3);
            pdf.text(lLines, x, textY);

            // VIP - bold navy (matches web bold style)
            x += col.lokasi;
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(7);
            pdf.setTextColor(26, 32, 87);
            const vLines = pdf.splitTextToSize(item.vip || '', col.vip - 3);
            pdf.text(vLines, x, textY);

            // Row divider
            pdf.setDrawColor(230, 230, 230);
            pdf.setLineWidth(0.15);
            pdf.line(M, y + rh, W - M, y + rh);

            y += rh;
        }

        // ===== RENDER ALL DATA =====
        grouped.forEach((group) => {
            drawDateBar(group);
            drawColHeader();
            group.items.forEach((item, idx) => {
                drawRow(item, idx % 2 === 1);
            });
        });

        drawFooter();

        // Save
        const filename = `Jadual_VIP_MAHA2026_${type === 'today' ? 'Harian' : 'Penuh'}_${now.toISOString().slice(0,10)}.pdf`;
        pdf.save(filename);

    } catch (error) {
        console.error('PDF generation error:', error);
        alert('Ralat menjana PDF. Sila cuba lagi.');
    } finally {
        showLoading(false);
    }
}
