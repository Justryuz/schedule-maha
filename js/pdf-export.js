/* ========================================
   JADUAL VIP MAHA 2026 - Professional PDF Export
   Untuk pegawai khas & PA Menteri/KSU
   ======================================== */

async function generateSchedulePDF(type) {
    let data;
    let dateLabel = '';
    let dateSubtitle = '';

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
        dateSubtitle = `28 Ogos - 6 September 2026 | ${data.length} Program`;
    }

    if (data.length === 0) {
        alert('Tiada data untuk dimuat turun.');
        return;
    }

    showLoading(true);

    try {
        const pdfHtml = buildProfessionalPDF(data, dateLabel, dateSubtitle, type);
        const container = document.getElementById('pdfContainer');
        const content = document.getElementById('pdfContent');
        content.innerHTML = pdfHtml;
        container.style.display = 'block';

        // Wait for rendering
        await new Promise(resolve => setTimeout(resolve, 800));

        const canvas = await html2canvas(content, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: content.scrollWidth,
            height: content.scrollHeight
        });

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('portrait', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = pdfWidth / imgWidth;
        const scaledHeight = imgHeight * ratio;

        if (scaledHeight <= pdfHeight) {
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, scaledHeight);
        } else {
            const pageHeightPx = pdfHeight / ratio;
            let position = 0;
            let page = 0;
            while (position < imgHeight) {
                if (page > 0) pdf.addPage();
                const sliceH = Math.min(pageHeightPx, imgHeight - position);
                const sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = imgWidth;
                sliceCanvas.height = sliceH;
                const ctx = sliceCanvas.getContext('2d');
                ctx.drawImage(canvas, 0, position, imgWidth, sliceH, 0, 0, imgWidth, sliceH);
                const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
                pdf.addImage(sliceData, 'JPEG', 0, 0, pdfWidth, sliceH * ratio);
                position += sliceH;
                page++;
            }
        }

        const now = new Date();
        const timestamp = now.toISOString().slice(0, 10);
        const filename = `Jadual_VIP_MAHA2026_${type === 'today' ? 'Harian' : 'Penuh'}_${timestamp}.pdf`;
        pdf.save(filename);

        container.style.display = 'none';
        content.innerHTML = '';

    } catch (error) {
        console.error('PDF generation error:', error);
        alert('Ralat menjana PDF. Sila cuba lagi.');
    } finally {
        showLoading(false);
    }
}

function buildProfessionalPDF(data, dateLabel, dateSubtitle, type) {
    const mahaLogo = 'https://mahaofficial.com.my/assets/maha-2026-logo.webp';
    const jataLogo = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Coat_of_arms_of_Malaysia.svg/120px-Coat_of_arms_of_Malaysia.svg.png';

    // Group by date
    const grouped = new Map();
    data.forEach(item => {
        if (!grouped.has(item.tarikh)) {
            grouped.set(item.tarikh, { formatted: item.tarikhFormatted, hari: item.hari, items: [] });
        }
        grouped.get(item.tarikh).items.push(item);
    });

    let bodyHtml = '';
    let dateCount = 0;
    grouped.forEach((group) => {
        dateCount++;
        const hariUpper = group.hari ? group.hari.toUpperCase() : '';

        bodyHtml += `
        <div style="margin-top:${dateCount === 1 ? '0' : '24px'};page-break-inside:avoid;">
            <div style="background:#1a2057;color:#fff;padding:10px 20px;border-radius:6px;display:flex;align-items:center;gap:10px;">
                <span style="font-size:18px;">&#128197;</span>
                <span style="font-weight:700;font-size:13px;letter-spacing:0.5px;">${hariUpper}, ${group.formatted.toUpperCase()}</span>
                <span style="margin-left:auto;font-size:11px;opacity:0.7;">${group.items.length} program</span>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-top:6px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
                <thead>
                    <tr>
                        <th style="background:#fbb034;padding:10px 14px;text-align:left;font-weight:700;font-size:10px;letter-spacing:0.5px;text-transform:uppercase;color:#1a1a2e;border-bottom:2px solid #e5a000;width:110px;">Masa</th>
                        <th style="background:#fbb034;padding:10px 14px;text-align:left;font-weight:700;font-size:10px;letter-spacing:0.5px;text-transform:uppercase;color:#1a1a2e;border-bottom:2px solid #e5a000;">Program</th>
                        <th style="background:#fbb034;padding:10px 14px;text-align:left;font-weight:700;font-size:10px;letter-spacing:0.5px;text-transform:uppercase;color:#1a1a2e;border-bottom:2px solid #e5a000;width:170px;">Kluster/Lokasi</th>
                        <th style="background:#fbb034;padding:10px 14px;text-align:left;font-weight:700;font-size:10px;letter-spacing:0.5px;text-transform:uppercase;color:#1a1a2e;border-bottom:2px solid #e5a000;width:180px;">VIP</th>
                    </tr>
                </thead>
                <tbody>`;

        group.items.forEach((item, i) => {
            const bg = i % 2 === 0 ? '#ffffff' : '#fafafa';
            bodyHtml += `
                    <tr style="background:${bg};">
                        <td style="padding:9px 14px;font-weight:600;font-size:11px;color:#1a2057;border-bottom:1px solid #eee;white-space:nowrap;">${escapeHtml(item.masa)}</td>
                        <td style="padding:9px 14px;font-size:11px;color:#333;border-bottom:1px solid #eee;line-height:1.4;">${escapeHtml(item.program)}</td>
                        <td style="padding:9px 14px;font-size:10.5px;color:#555;border-bottom:1px solid #eee;">${escapeHtml(item.lokasi)}</td>
                        <td style="padding:9px 14px;font-size:10.5px;color:#1a2057;font-weight:600;border-bottom:1px solid #eee;">${escapeHtml(item.vip)}</td>
                    </tr>`;
        });

        bodyHtml += `</tbody></table></div>`;
    });

    // Generated timestamp
    const now = new Date();
    const genTime = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;

    return `
    <div style="font-family:'Inter','Segoe UI',sans-serif;width:900px;background:#fff;padding:0;">
        <!-- Professional Header -->
        <div style="padding:28px 36px 20px;border-bottom:3px solid #fbb034;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
                <div style="display:flex;align-items:center;gap:14px;">
                    <img src="${jataLogo}" style="height:52px;" crossorigin="anonymous">
                    <div>
                        <div style="font-size:9px;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;">Kementerian Pertanian dan Keterjaminan Makanan</div>
                        <div style="font-size:9px;color:#666;text-transform:uppercase;letter-spacing:1px;">Lembaga Pemasaran Pertanian Persekutuan (FAMA)</div>
                    </div>
                </div>
                <img src="${mahaLogo}" style="height:56px;" crossorigin="anonymous">
            </div>
            <div style="margin-top:18px;text-align:center;">
                <h1 style="font-family:'Poppins',sans-serif;font-size:24px;font-weight:900;color:#1a2057;letter-spacing:2px;margin:0;">JADUAL VIP MAHA 2026</h1>
                <div style="margin-top:6px;font-size:14px;font-weight:700;color:#d4a017;letter-spacing:0.5px;">${dateLabel}</div>
                <div style="margin-top:3px;font-size:11px;color:#666;">${dateSubtitle}</div>
            </div>
            <div style="margin-top:12px;display:flex;justify-content:center;gap:24px;font-size:10px;color:#888;">
                <span>&#128205; MAEPS, Serdang, Selangor</span>
                <span>&#128197; 28 Ogos - 6 September 2026</span>
                <span>&#128336; Dijana: ${genTime}</span>
            </div>
        </div>

        <!-- Schedule Body -->
        <div style="padding:20px 36px 30px;">
            ${bodyHtml}
        </div>

        <!-- Clean footer line -->
        <div style="padding:12px 36px;border-top:2px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:9px;color:#999;">SULIT - Untuk kegunaan rasmi sahaja</span>
            <span style="font-size:9px;color:#999;">www.fama.gov.my | MAHA 2026</span>
        </div>
    </div>`;
}
