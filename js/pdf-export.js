/* ========================================
   JADUAL VIP MAHA 2026 - PDF Export
   Generates infographic poster as PDF
   ======================================== */

async function generatePDF() {
    const format = document.getElementById('posterFormat').value;
    const orientation = document.getElementById('posterOrientation').value;

    // Get data based on selected format
    let exportData = [];
    let filterLabel = '';

    switch (format) {
        case 'filtered':
            exportData = filteredData;
            filterLabel = getActiveFilterLabel();
            break;
        case 'bydate':
            const selectedDate = document.getElementById('filterTarikh').value;
            if (selectedDate) {
                exportData = allData.filter(item => item.tarikh === selectedDate);
                const dateItem = exportData[0];
                filterLabel = dateItem ? `${dateItem.tarikhFormatted} (${dateItem.hari})` : selectedDate;
            } else {
                exportData = filteredData;
                filterLabel = 'Semua Tarikh';
            }
            break;
        case 'byvip':
            const selectedVIP = document.getElementById('filterVIP').value;
            if (selectedVIP) {
                exportData = allData.filter(item => item.vip === selectedVIP);
                filterLabel = selectedVIP;
            } else {
                exportData = filteredData;
                filterLabel = 'Semua VIP';
            }
            break;
        case 'all':
            exportData = allData;
            filterLabel = 'Semua Program';
            break;
    }

    if (exportData.length === 0) {
        alert('Tiada data untuk dicetak. Sila pilih tapisan yang mempunyai data.');
        return;
    }

    closePDFModal();
    showLoading(true);

    try {
        // Build poster content
        buildPosterContent(exportData, filterLabel, orientation);

        // Wait for images to load and DOM to render
        await new Promise(resolve => setTimeout(resolve, 1000));

        const posterEl = document.getElementById('posterContent');
        const container = document.getElementById('posterContainer');

        // Make poster visible for rendering
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.display = 'block';

        // Apply orientation class
        if (orientation === 'landscape') {
            posterEl.classList.add('landscape');
            container.style.width = '1680px';
        } else {
            posterEl.classList.remove('landscape');
            container.style.width = '1190px';
        }

        // Wait for layout
        await new Promise(resolve => setTimeout(resolve, 500));

        // Preload all images in poster
        const posterImages = posterEl.querySelectorAll('img');
        await Promise.all([...posterImages].map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        }));

        // Generate canvas
        const canvas = await html2canvas(posterEl, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#FCFAEE',
            logging: false,
            width: posterEl.scrollWidth,
            height: posterEl.scrollHeight,
            onclone: function(clonedDoc) {
                const clonedPoster = clonedDoc.getElementById('posterContent');
                if (clonedPoster) {
                    clonedPoster.style.display = 'block';
                }
            }
        });

        // Generate PDF
        const { jsPDF } = window.jspdf;
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        let pdf;
        if (orientation === 'landscape') {
            pdf = new jsPDF('landscape', 'mm', 'a3');
        } else {
            pdf = new jsPDF('portrait', 'mm', 'a3');
        }

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // Calculate dimensions to fit content
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

        const finalWidth = imgWidth * ratio;
        const finalHeight = imgHeight * ratio;

        // If content exceeds one page, paginate
        if (finalHeight > pdfHeight) {
            // Multi-page approach
            const pageHeight = pdfHeight;
            const scaledPageHeight = (pageHeight / ratio);
            let position = 0;
            let pageNum = 0;

            while (position < imgHeight) {
                if (pageNum > 0) {
                    pdf.addPage();
                }

                // Create a slice of the canvas for this page
                const sliceHeight = Math.min(scaledPageHeight, imgHeight - position);
                const sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = imgWidth;
                sliceCanvas.height = sliceHeight;
                const ctx = sliceCanvas.getContext('2d');
                ctx.drawImage(canvas, 0, position, imgWidth, sliceHeight, 0, 0, imgWidth, sliceHeight);

                const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
                const sliceFinalHeight = sliceHeight * ratio;
                pdf.addImage(sliceData, 'JPEG', 0, 0, pdfWidth, sliceFinalHeight);

                position += sliceHeight;
                pageNum++;
            }
        } else {
            // Single page - center content
            const xOffset = (pdfWidth - finalWidth) / 2;
            const yOffset = 0;
            pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);
        }

        // Save
        const filename = `Jadual_VIP_MAHA2026_${format}_${new Date().toISOString().slice(0,10)}.pdf`;
        pdf.save(filename);

    } catch (error) {
        console.error('PDF generation error:', error);
        alert('Ralat menjana PDF. Sila cuba lagi.');
    } finally {
        showLoading(false);
    }
}

function buildPosterContent(data, filterLabel, orientation) {
    const posterBody = document.getElementById('posterBody');
    const posterFilterInfo = document.getElementById('posterFilterInfo');

    // Set filter info
    posterFilterInfo.textContent = filterLabel ? `${filterLabel} \u2022 ${data.length} Program` : `${data.length} Program`;

    // Group by date
    const grouped = new Map();
    data.forEach(item => {
        const key = item.tarikhFormatted;
        if (!grouped.has(key)) {
            grouped.set(key, {
                date: item.tarikhFormatted,
                hari: item.hari,
                dateObj: item.tarikhObj,
                items: []
            });
        }
        grouped.get(key).items.push(item);
    });

    let html = '';

    grouped.forEach((group) => {
        html += `<div class="poster-date-section">`;
        html += `<div class="poster-date-header">
            <div class="date-icon">${group.dateObj ? group.dateObj.getDate() : ''}</div>
            <div>
                <div class="date-text">${group.date}</div>
                <div class="date-day">${group.hari}</div>
            </div>
        </div>`;

        html += `<table class="poster-schedule-table">
            <thead>
                <tr>
                    <th>Masa</th>
                    <th>Program</th>
                    <th>Lokasi</th>
                    <th>VIP</th>
                </tr>
            </thead>
            <tbody>`;

        group.items.forEach(item => {
            html += `<tr>
                <td class="col-masa">${item.masa}</td>
                <td class="col-program">${escapeHtml(item.program)}</td>
                <td class="col-lokasi">${escapeHtml(item.lokasi)}</td>
                <td class="col-vip"><span class="vip-badge">${escapeHtml(item.vip)}</span></td>
            </tr>`;
        });

        html += `</tbody></table></div>`;
    });

    posterBody.innerHTML = html;
}

function getActiveFilterLabel() {
    const parts = [];
    const tarikh = document.getElementById('filterTarikh');
    const lokasi = document.getElementById('filterLokasi');
    const vip = document.getElementById('filterVIP');
    const status = document.getElementById('filterStatus');

    if (tarikh.value) parts.push(tarikh.options[tarikh.selectedIndex].text);
    if (lokasi.value) parts.push(lokasi.value);
    if (vip.value) parts.push(vip.value);
    if (status.value) parts.push(status.value);

    return parts.length > 0 ? parts.join(' • ') : 'Semua Program';
}
