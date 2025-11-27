// Export functions for PPT and PDF

// Export to PowerPoint using PptxGenJS
async function exportToPPT(reportData, slideInstances) {
    showLoading();

    try {
        const pptx = new PptxGenJS();
        
        // Set presentation properties
        pptx.layout = 'LAYOUT_16x9';
        pptx.author = 'PPT Report Generator';
        pptx.title = reportData.reportName;
        pptx.subject = reportData.surveyName;

        // Use the slide instances to export
        slideInstances.forEach((slideInstance, index) => {
            try {
                slideInstance.exportToPPT(pptx);
            } catch (error) {
                console.error(`Error exporting slide ${index + 1}:`, error);
            }
        });

        /* OLD APPROACH - Keeping as reference for now
        const stats = DataParser.calculateSummaryStats(reportData.data);
        const sampleData = DataParser.getSampleData(reportData.data);

        // Slide 1: Title Slide with background image (OLD)
        const titleSlide = pptx.addSlide();
        titleSlide.background = { path: 'assets/cover image.png' };
        
        // Add semi-transparent overlay
        titleSlide.addShape(pptx.ShapeType.rect, {
            x: 0,
            y: 0,
            w: '100%',
            h: '100%',
            fill: { color: '000000', transparency: 30 },
            line: { width: 0 }
        });
        
        // Report name (main title) - centered
        titleSlide.addText(reportData.reportName, {
            x: 0.5,
            y: 2.5,
            w: 9,
            h: 1.2,
            fontSize: 48,
            bold: true,
            color: 'FFFFFF',
            align: 'center',
            valign: 'middle'
        });
        
        // Survey name (subtitle)
        titleSlide.addText(reportData.surveyName, {
            x: 0.5,
            y: 3.9,
            w: 9,
            h: 0.8,
            fontSize: 28,
            color: 'FFFFFF',
            align: 'center',
            valign: 'middle'
        });
        
        // Date
        titleSlide.addText(DataParser.getCurrentDate(), {
            x: 0.5,
            y: 4.9,
            w: 9,
            h: 0.5,
            fontSize: 20,
            color: 'FFFFFF',
            align: 'center',
            valign: 'middle'
        });
        
        */ // End OLD APPROACH comment

        /* OLD APPROACH - Summary slide
        // Slide 2: Summary (OLD)
        const summarySlide = pptx.addSlide();
        summarySlide.addText('Survey Overview', {
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 0.7,
            fontSize: 36,
            bold: true,
            color: '1e293b'
        });
        summarySlide.addShape(pptx.ShapeType.rect, {
            x: 0.5,
            y: 1.2,
            w: 9,
            h: 0.05,
            fill: { color: '667eea' }
        });

        // Summary cards
        const summaryData = [
            { value: stats.totalResponses, label: 'Total Responses' },
            { value: stats.totalQuestions, label: 'Questions Asked' },
            { value: `${stats.completionRate}%`, label: 'Completion Rate' },
            { value: stats.dateRange, label: 'Collection Period' }
        ];

        summaryData.forEach((item, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const x = 0.5 + col * 5;
            const y = 2 + row * 2;

            summarySlide.addShape(pptx.ShapeType.rect, {
                x,
                y,
                w: 4,
                h: 1.5,
                fill: { color: '667eea' },
                line: { width: 0 }
            });

            summarySlide.addText(String(item.value), {
                x,
                y: y + 0.2,
                w: 4,
                h: 0.6,
                fontSize: 32,
                bold: true,
                color: 'FFFFFF',
                align: 'center'
            });

            summarySlide.addText(item.label, {
                x,
                y: y + 0.9,
                w: 4,
                h: 0.4,
                fontSize: 16,
                color: 'FFFFFF',
                align: 'center'
            });
        });
        */ // End OLD APPROACH - Summary slide

        /* OLD APPROACH - Data Table
        // Slide 3: Data Table (OLD)
        const tableSlide = pptx.addSlide();
        tableSlide.addText('Sample Data', {
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 0.7,
            fontSize: 36,
            bold: true,
            color: '1e293b'
        });
        tableSlide.addShape(pptx.ShapeType.rect, {
            x: 0.5,
            y: 1.2,
            w: 9,
            h: 0.05,
            fill: { color: '667eea' }
        });

        // Prepare table data
        const tableData = [
            sampleData.headers.map(h => ({
                text: h || 'N/A',
                options: { bold: true, color: 'FFFFFF', fill: '667eea' }
            })),
            ...sampleData.rows.slice(0, 8).map(row =>
                sampleData.headers.map((_, i) => ({
                    text: String(row[i] !== undefined ? row[i] : ''),
                    options: { color: '1e293b' }
                }))
            )
        ];

        tableSlide.addTable(tableData, {
            x: 0.5,
            y: 1.8,
            w: 9,
            h: 3.7,
            fontSize: 10,
            border: { pt: 1, color: 'e2e8f0' }
        });
        */ // End OLD APPROACH - Data Table

        /* OLD APPROACH - Chart Placeholder
        // Slide 4: Chart Placeholder (OLD)
        const chartSlide = pptx.addSlide();
        chartSlide.addText('Data Visualization', {
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 0.7,
            fontSize: 36,
            bold: true,
            color: '1e293b'
        });
        chartSlide.addShape(pptx.ShapeType.rect, {
            x: 0.5,
            y: 1.2,
            w: 9,
            h: 0.05,
            fill: { color: '667eea' }
        });
        chartSlide.addShape(pptx.ShapeType.rect, {
            x: 1,
            y: 2,
            w: 8,
            h: 3.5,
            fill: { color: 'f8fafc' },
            line: { width: 2, color: 'cbd5e1', dashType: 'dash' }
        });
        chartSlide.addText('Chart visualization coming soon', {
            x: 1,
            y: 3.5,
            w: 8,
            h: 0.5,
            fontSize: 20,
            color: '64748b',
            align: 'center'
        });
        */ // End OLD APPROACH - Chart Placeholder

        // Save the presentation
        const fileName = `${reportData.reportName.replace(/[^a-z0-9]/gi, '_')}.pptx`;
        await pptx.writeFile({ fileName });

        hideLoading();
        showToast('PowerPoint exported successfully!', 'success');

    } catch (error) {
        console.error('Error exporting to PPT:', error);
        hideLoading();
        showToast('Error exporting to PowerPoint: ' + error.message, 'error');
    }
}

// Export to PDF
function exportToPDF(reportData) {
    showLoading();

    try {
        // Use browser's print functionality for PDF export
        const originalTitle = document.title;
        document.title = reportData.reportName;

        // Show all slides for printing
        const slides = document.querySelectorAll('.slide');
        slides.forEach(slide => {
            slide.style.display = 'flex';
            slide.classList.remove('active');
        });

        // Trigger print dialog
        window.print();

        // Restore original state
        setTimeout(() => {
            document.title = originalTitle;
            slides.forEach((slide, index) => {
                if (index !== document.querySelector('.slide.active')) {
                    slide.style.display = 'none';
                }
            });
            hideLoading();
            showToast('PDF export initiated. Please save using your browser\'s print dialog.', 'success');
        }, 500);

    } catch (error) {
        console.error('Error exporting to PDF:', error);
        hideLoading();
        showToast('Error exporting to PDF: ' + error.message, 'error');
    }
}

// Toast and loading functions (shared with upload.js)
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠'
    };

    const isPersistent = type === 'error';
    if (isPersistent) {
        toast.classList.add('persistent');
    }

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || '•'}</span>
        <span class="toast-message">${message}</span>
        <button type="button" class="toast-close" aria-label="Dismiss notification">×</button>
    `;

    const removeToast = () => {
        if (toast.dataset.dismissed) return;
        toast.dataset.dismissed = 'true';
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector('.toast-close').addEventListener('click', removeToast);

    container.appendChild(toast);

    if (!isPersistent) {
        setTimeout(removeToast, 3000);
    }
}

function showLoading() {
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

