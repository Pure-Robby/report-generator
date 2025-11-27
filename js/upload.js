// Upload form handler
class UploadManager {
    constructor() {
        this.form = document.getElementById('upload-form');
        this.fileInput = document.getElementById('excel-file');
        this.uploadBtn = document.getElementById('upload-btn');
        this.isProcessing = false;
        
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.fileInput.addEventListener('change', (e) => this.handleFileChange(e));
    }

    handleFileChange(e) {
        const file = e.target.files[0];
        if (file) {
            const fileName = document.querySelector('.file-name');
            if (fileName) {
                fileName.textContent = file.name;
                fileName.style.display = 'block';
            }
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (this.isProcessing) {
            showToast('Processing already in progress', 'warning');
            return;
        }

        const surveyName = document.getElementById('survey-name').value.trim();
        const reportName = document.getElementById('report-name').value.trim();
        const file = this.fileInput.files[0];

        if (!surveyName || !reportName || !file) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        if (!this.validateFile(file)) {
            return;
        }

        this.isProcessing = true;
        this.uploadBtn.disabled = true;
        showLoading();

        try {
            const data = await this.processExcelFile(file);
            
            const reportData = {
                surveyName,
                reportName,
                data,
                timestamp: new Date().toISOString()
            };

            sessionStorage.setItem('reportData', JSON.stringify(reportData));
            
            showToast('File processed successfully!', 'success');
            
            setTimeout(() => {
                window.location.href = 'preview.html';
            }, 1000);

        } catch (error) {
            console.error('Error processing file:', error);
            showToast('Error processing file: ' + error.message, 'error');
            this.isProcessing = false;
            this.uploadBtn.disabled = false;
            hideLoading();
        }
    }

    validateFile(file) {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        
        const validExtensions = ['.xlsx', '.xls'];
        const fileName = file.name.toLowerCase();
        const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

        if (!validTypes.includes(file.type) && !hasValidExtension) {
            showToast('Please upload a valid Excel file (.xlsx or .xls)', 'error');
            return false;
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            showToast('File size exceeds 10MB limit', 'error');
            return false;
        }

        return true;
    }

    async processExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                        reject(new Error('Excel file contains no sheets'));
                        return;
                    }

                    const processSheet = (sheetIndex) => {
                        const sheetName = workbook.SheetNames[sheetIndex];
                        if (!sheetName) return null;
                        
                        const sheet = workbook.Sheets[sheetName];
                        if (!sheet) return null;
                        
                        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                        if (!jsonData || jsonData.length === 0) return null;

                        const headers = jsonData[0];
                        const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));

                        if (headers.length === 0 || rows.length === 0) {
                            return null;
                        }

                        return {
                            headers,
                            rows,
                            totalResponses: rows.length,
                            sheetName,
                            sheetIndex
                        };
                    };

                    const currentData = processSheet(0);
                    if (!currentData) {
                        reject(new Error('Sheet 1 is empty or missing required data'));
                        return;
                    }

                    const previousData = workbook.SheetNames.length > 1 ? processSheet(1) : null;

                    const processedData = {
                        current: currentData,
                        previous: previousData,
                        currentYearLabel: '2025',
                        previousYearLabel: previousData ? '2024' : null
                    };

                    resolve(processedData);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }
}

// Toast notification system
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

// Loading overlay
function showLoading() {
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new UploadManager();
});

