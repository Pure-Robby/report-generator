// Upload form handler
class UploadManager {
    constructor() {
        this.form = document.getElementById('upload-form');
        this.fileInput = document.getElementById('excel-file');
        this.uploadBtn = document.getElementById('upload-btn');
        this.isProcessing = false;
        this.parsedData = null;
        
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.fileInput.addEventListener('change', (e) => this.handleFileChange(e));
        
        // Filter control event listeners
        const enableFilter = document.getElementById('enable-filter');
        
        if (enableFilter) {
            // Check initial state on page load (in case browser remembered the checked state)
            const filterControls = document.getElementById('filter-controls');
            if (filterControls && enableFilter.checked) {
                filterControls.style.display = 'block';
            }
            
            enableFilter.addEventListener('change', (e) => {
                if (filterControls) {
                    filterControls.style.display = e.target.checked ? 'block' : 'none';
                }
            });
        }
        
        // Dimension toggle checkboxes
        document.querySelectorAll('.dimension-toggle').forEach(checkbox => {
            // Check initial state on page load (in case browser remembered the checked state)
            const dimension = checkbox.dataset.dimension;
            const select = document.querySelector(`.dimension-values[data-dimension="${dimension}"]`);
            if (select && checkbox.checked) {
                select.disabled = false;
            }
            
            checkbox.addEventListener('change', (e) => {
                const dimension = e.target.dataset.dimension;
                const select = document.querySelector(`.dimension-values[data-dimension="${dimension}"]`);
                if (select) {
                    select.disabled = !e.target.checked;
                    if (!e.target.checked) {
                        // Clear selection when disabled
                        select.querySelectorAll('option').forEach(opt => opt.selected = false);
                    }
                }
                this.updateFilterFeedback();
            });
        });
        
        // Value selection dropdowns
        document.querySelectorAll('.dimension-values').forEach(select => {
            select.addEventListener('change', () => {
                this.updateFilterFeedback();
            });
        });
        
        // If data is already loaded (from previous upload before refresh), populate filters
        if (this.parsedData) {
            this.populateFilterValues();
            this.updateFilterFeedback();
        }
    }

    async handleFileChange(e) {
        const file = e.target.files[0];
        if (file) {
            const fileName = document.querySelector('.file-name');
            if (fileName) {
                fileName.textContent = file.name;
                fileName.style.display = 'block';
            }
            
            // Parse file to enable filter controls
            if (this.validateFile(file)) {
                try {
                    showLoading();
                    this.parsedData = await this.processExcelFile(file);
                    hideLoading();
                    
                    // Populate all filter dropdowns with data from Excel
                    this.populateFilterValues();
                    
                    // Show filter section
                    const filterSection = document.getElementById('filter-section');
                    if (filterSection) {
                        filterSection.style.display = 'block';
                    }
                    
                    showToast('File loaded successfully. You can now configure filters.', 'success');
                } catch (error) {
                    hideLoading();
                    console.error('Error parsing file for filters:', error);
                    showToast('File loaded but filter setup failed: ' + error.message, 'warning');
                }
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
            // Use already parsed data or parse now
            const data = this.parsedData || await this.processExcelFile(file);
            
            // Check if filtering is enabled
            const enableFilter = document.getElementById('enable-filter');
            const isFilterEnabled = enableFilter && enableFilter.checked;
            
            let filterCriteria = null;
            let filteredData = null;
            
            if (isFilterEnabled) {
                const activeFilters = this.getActiveFilters();
                
                if (Object.keys(activeFilters).length === 0) {
                    showToast('Please select at least one filter dimension and values', 'error');
                    this.isProcessing = false;
                    this.uploadBtn.disabled = false;
                    hideLoading();
                    return;
                }
                
                filterCriteria = {
                    demographics: activeFilters,
                    logic: 'AND'
                };
                
                // Apply filters to create filtered dataset
                filteredData = this.applyFilters(data, filterCriteria);
            }
            
            const reportData = {
                surveyName,
                reportName,
                data,
                filteredData,
                filterCriteria,
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

    populateFilterValues() {
        if (!this.parsedData || !this.parsedData.current) {
            return;
        }
        
        // Map all dimensions to column indices
        const dimensionColumnMap = {
            location: 3,     // Column D
            department: 1,   // Column B
            costCenter: 2,   // Column C
            gender: 4,       // Column E
            race: 5,         // Column F
            age: 6,          // Column G
            tenure: 7        // Column H (LoS Group)
        };
        
        const rows = this.parsedData.current.rows || [];
        
        // Populate each dimension's dropdown
        Object.keys(dimensionColumnMap).forEach(dimension => {
            const columnIndex = dimensionColumnMap[dimension];
            const select = document.querySelector(`.dimension-values[data-dimension="${dimension}"]`);
            
            if (!select) return;
            
            // Clear existing options except the disabled placeholder
            select.innerHTML = '';
            
            // Extract unique values from the column
            const uniqueValues = new Set();
            rows.forEach(row => {
                const value = row[columnIndex];
                if (value && value.toString().trim() !== '') {
                    uniqueValues.add(value.toString().trim());
                }
            });
            
            // Sort and add options
            const sortedValues = Array.from(uniqueValues).sort();
            sortedValues.forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            });
        });
        
        // Reset feedback
        const feedback = document.getElementById('filter-feedback');
        if (feedback) {
            feedback.style.display = 'none';
        }
    }
    
    updateFilterFeedback() {
        if (!this.parsedData || !this.parsedData.current) {
            return;
        }
        
        // Collect all enabled dimensions and their selected values
        const activeFilters = this.getActiveFilters();
        
        if (Object.keys(activeFilters).length === 0) {
            const feedback = document.getElementById('filter-feedback');
            if (feedback) {
                feedback.style.display = 'none';
            }
            return;
        }
        
        // Count matching responses using multi-dimensional filter
        const rows = this.parsedData.current.rows || [];
        const dimensionColumnMap = {
            location: 3,
            department: 1,
            costCenter: 2,
            gender: 4,
            race: 5,
            age: 6,
            tenure: 7
        };
        
        const matchingCount = rows.filter(row => {
            // Check if row matches ALL active filters (AND logic)
            return Object.keys(activeFilters).every(dimension => {
                const columnIndex = dimensionColumnMap[dimension];
                const value = row[columnIndex];
                const allowedValues = activeFilters[dimension];
                
                // Row must have a value in this column that matches one of the selected values
                return value && allowedValues.includes(value.toString().trim());
            });
        }).length;
        
        // Update feedback
        const feedback = document.getElementById('filter-feedback');
        const countSpan = document.getElementById('filter-count');
        
        if (feedback && countSpan) {
            countSpan.textContent = matchingCount;
            feedback.style.display = 'block';
        }
    }
    
    getActiveFilters() {
        const activeFilters = {};
        
        document.querySelectorAll('.dimension-toggle:checked').forEach(checkbox => {
            const dimension = checkbox.dataset.dimension;
            const select = document.querySelector(`.dimension-values[data-dimension="${dimension}"]`);
            
            if (select && !select.disabled) {
                const selectedValues = Array.from(select.selectedOptions)
                    .map(opt => opt.value)
                    .filter(val => val); // Remove empty values
                
                if (selectedValues.length > 0) {
                    activeFilters[dimension] = selectedValues;
                }
            }
        });
        
        return activeFilters;
    }
    
    applyFilters(data, filterCriteria) {
        if (!filterCriteria || !data || !data.current) {
            return null;
        }
        
        const { demographics, logic } = filterCriteria;
        
        if (!demographics || Object.keys(demographics).length === 0) {
            return null;
        }
        
        // Map dimension to column index
        const dimensionColumnMap = {
            location: 3,
            department: 1,
            costCenter: 2,
            gender: 4,
            race: 5,
            age: 6,
            tenure: 7
        };
        
        // Filter function that checks all dimensions (AND logic)
        const matchesFilter = (row) => {
            return Object.keys(demographics).every(dimension => {
                const columnIndex = dimensionColumnMap[dimension];
                if (columnIndex === undefined) return true; // Skip unknown dimensions
                
                const value = row[columnIndex];
                const allowedValues = demographics[dimension];
                
                return value && allowedValues.includes(value.toString().trim());
            });
        };
        
        // Filter current year data
        const filteredCurrent = {
            ...data.current,
            rows: (data.current.rows || []).filter(matchesFilter),
            totalResponses: 0 // Will be recalculated
        };
        filteredCurrent.totalResponses = filteredCurrent.rows.length;
        
        // Filter previous year data if it exists
        let filteredPrevious = null;
        if (data.previous && data.previous.rows) {
            filteredPrevious = {
                ...data.previous,
                rows: (data.previous.rows || []).filter(matchesFilter),
                totalResponses: 0
            };
            filteredPrevious.totalResponses = filteredPrevious.rows.length;
        }
        
        return {
            current: filteredCurrent,
            previous: filteredPrevious,
            currentYearLabel: data.currentYearLabel,
            previousYearLabel: data.previousYearLabel
        };
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

                    const processSheet = (sheetIndex, { required = false } = {}) => {
                        const sheetName = workbook.SheetNames[sheetIndex];
                        if (!sheetName) return null;
                        
                        const sheet = workbook.Sheets[sheetName];
                        if (!sheet) return null;
                        
                        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                        if (!jsonData || jsonData.length === 0) {
                            return null;
                        }

                        const fail = (message) => {
                            if (required) {
                                throw new Error(message);
                            }
                            return null;
                        };

                        // Expected spreadsheet shape:
                        // - Excel Row 1: optional "grouping" headers (visual grouping only)
                        // - Excel Row 2: actual column headers / question text
                        // - Excel Row 3+: respondent rows
                        if (jsonData.length < 2) {
                            return fail(
                                `Sheet "${sheetName}" is missing required rows. ` +
                                `Expected: Row 1 (grouping, optional), Row 2 (headers, required), Row 3+ (responses, required).`
                            );
                        }

                        const groupHeaders = Array.isArray(jsonData[0]) ? jsonData[0] : [];
                        const headers = Array.isArray(jsonData[1]) ? jsonData[1] : [];
                        const rows = jsonData
                            .slice(2)
                            .filter(row => Array.isArray(row) && row.some(cell => cell !== undefined && cell !== ''));

                        const normalize = (value) => (value ?? '').toString().trim().toLowerCase();

                        // Minimal structural validation: this project relies on fixed column positions.
                        // Validate the first key columns to catch wrong header-row placement early.
                        const expectedHeaderChecks = [
                            { index: 0, contains: 'code', label: 'code' },
                            { index: 1, contains: 'department', label: 'department' },
                            { index: 2, contains: 'cost', label: 'cost centre' },
                            { index: 3, contains: 'location', label: 'location' }
                        ];

                        const headerLooksValid = expectedHeaderChecks.every(check => {
                            const cell = headers[check.index];
                            return normalize(cell).includes(check.contains);
                        });

                        if (!headers.length) {
                            return fail(
                                `Sheet "${sheetName}" header row is missing. ` +
                                `Expected headers in Excel Row 2 (e.g. "code", "department", "cost centre", "location").`
                            );
                        }

                        if (!headerLooksValid) {
                            const headerPreview = headers
                                .slice(0, 6)
                                .map(v => (v ?? '').toString().trim())
                                .filter(Boolean)
                                .join(', ') || '(empty)';

                            return fail(
                                `Sheet "${sheetName}" does not appear to have the expected headers in Excel Row 2. ` +
                                `The first columns should include: code, department, cost centre, location. ` +
                                `Detected header preview: ${headerPreview}`
                            );
                        }

                        if (!rows.length) {
                            return fail(
                                `Sheet "${sheetName}" contains no response rows. ` +
                                `Expected responses starting in Excel Row 3.`
                            );
                        }

                        return {
                            groupHeaders,
                            headers,
                            rows,
                            totalResponses: rows.length,
                            sheetName,
                            sheetIndex
                        };
                    };

                    let currentData;
                    try {
                        currentData = processSheet(0, { required: true });
                    } catch (error) {
                        reject(error);
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

