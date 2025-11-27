// Slide generation logic (Class-based architecture)
class SlideGenerator {
    constructor() {
        this.reportData = DataParser.getReportData();
        if (!this.reportData) return;

        this.slideInstances = [];
        
        this.init();
    }

    init() {
        this.generateSlides();
        this.setupExportButtons();
        this.setupBackButton();
        
        document.getElementById('preview-title').textContent = this.reportData.reportName;
    }

    generateSlides() {
        const container = document.getElementById('slide-container');
        let slideNumber = 1;

        const dataSet = this.reportData.data || {};
        const currentData = dataSet.current;
        const previousData = dataSet.previous;

        if (!currentData) {
            showToast('Current year data is missing. Please upload a valid Sheet 1.', 'error');
            return;
        }

        const hasPreviousData = Boolean(previousData && previousData.rows && previousData.rows.length);
        const yearLabels = {
            current: this.getYearLabel(dataSet.currentYearLabel, '2025'),
            previous: hasPreviousData ? this.getYearLabel(dataSet.previousYearLabel, '2024') : null
        };

        if (!hasPreviousData) {
            showToast('Previous year sheet not found or empty. Showing current year only.', 'warning');
        }

        // Cover Slide
        this.addSlide('cover', {
            surveyName: this.reportData.surveyName,
            reportName: this.reportData.reportName,
            date: DataParser.getCurrentDate()
        }, container);

        slideNumber++; 

        // Report Methodology
        this.addSlide('methodology', {
            title: 'Methodology',
            uniqueResponses: currentData.totalResponses,
            totalHeadcount: 444, // TODO: Add this to Excel upload or make it dynamic
            responseRate: Math.round((currentData.totalResponses / 444) * 100)
        }, container, { pageNumber: slideNumber++ });

        // Divider Slide - Engagement Index Scores
        this.addSlide('divider', {
            title: 'Engagement Dimension Scores',
        }, container, { pageNumber: slideNumber++ });

        slideNumber++; 

        // Satisfaction Slides (Location, Cost Center, Department)
        try {
            // 1. Satisfaction - Location
            const locationData = DataCalculations.calculateSatisfactionData(this.reportData.data, 'location');
            this.addSlide('satisfaction', {
                title: 'Satisfaction - Location',
                dimension: 'location',
                currentData: locationData.current,
                previousData: locationData.previous,
                mergedBreakdown: locationData.mergedBreakdown,
                yearLabels
            }, container, { pageNumber: slideNumber++ });

            // 2. Satisfaction - Cost Center
            const costCenterData = DataCalculations.calculateSatisfactionData(this.reportData.data, 'costCenter');
            this.addSlide('satisfaction', {
                title: 'Satisfaction - Cost Center',
                dimension: 'costCenter',
                currentData: costCenterData.current,
                previousData: costCenterData.previous,
                mergedBreakdown: costCenterData.mergedBreakdown,
                yearLabels
            }, container, { pageNumber: slideNumber++ });

            // 3. Satisfaction - Department (with pagination if > 13 rows)
            const departmentData = DataCalculations.calculateSatisfactionData(this.reportData.data, 'department');
            const maxRowsPerSlide = 13;
            const departmentBreakdown = departmentData.mergedBreakdown || [];
            
            if (departmentBreakdown.length <= maxRowsPerSlide - 1) {
                // Fits on one slide (-1 because overall row takes one space)
                this.addSlide('satisfaction', {
                    title: 'Satisfaction - Department',
                    dimension: 'department',
                    currentData: departmentData.current,
                    previousData: departmentData.previous,
                    mergedBreakdown: departmentBreakdown,
                    maxRows: maxRowsPerSlide,
                    yearLabels
                }, container, { pageNumber: slideNumber++ });
            } else {
                // Need pagination - split into multiple slides
                const firstPageRows = maxRowsPerSlide - 1; // -1 for overall row
                
                // First page
                this.addSlide('satisfaction', {
                    title: 'Satisfaction - Department',
                    dimension: 'department',
                    currentData: departmentData.current,
                    previousData: departmentData.previous,
                    mergedBreakdown: departmentBreakdown,
                    startIndex: 0,
                    maxRows: maxRowsPerSlide,
                    yearLabels
                }, container, { pageNumber: slideNumber++ });
                
                // Second page (continuation)
                this.addSlide('satisfaction', {
                    title: 'Satisfaction - Department (Continued)',
                    dimension: 'department',
                    currentData: departmentData.current,
                    previousData: departmentData.previous,
                    mergedBreakdown: departmentBreakdown,
                    startIndex: firstPageRows,
                    maxRows: maxRowsPerSlide,
                    yearLabels
                }, container, { pageNumber: slideNumber++ });
            }
        } catch (error) {
            console.error('Failed to generate satisfaction slides:', error);
            showToast(error.message, 'error');
        }

        // Survey Questions Slides (3 pages) - Extract from Excel
        try {
            const questionPages = DataCalculations.paginateSurveyQuestions(this.reportData.data);
            const pageTitles = [
                'Survey Questions',
                'Survey Questions (Page 2)',
                'Survey Questions (Page 3)'
            ];
            
            questionPages.forEach((pageDimensions, pageIndex) => {
                const slideOptions = { pageNumber: slideNumber++ };
                
                if (pageIndex === 2) {
                    slideOptions.slideClass = 'questions-slide-page-3';
                    slideOptions.extraCompact = true;
                }

                this.addSlide('questions', {
                    title: pageTitles[pageIndex] || 'Survey Questions',
                    dimensions: pageDimensions
                }, container, slideOptions);
            });
        } catch (error) {
            console.error('Failed to generate questions slides:', error);
            showToast(`Survey questions could not be generated: ${error.message}`, 'error');
        }

        // Bar Chart - Engagement Index Scores (Dynamic from Excel)
        try {
            const barChartData = DataCalculations.calculateEngagementIndexScores(this.reportData.data);
            
            this.addSlide('barchart', {
                title: 'Engagement Index Scores',
                categories: barChartData.categories,
                current: barChartData.currentYear.scores,
                previous: barChartData.previousYear ? barChartData.previousYear.scores : null,
                currentLabel: barChartData.currentYear.label,
                previousLabel: barChartData.previousYear ? barChartData.previousYear.label : null
            }, container, { pageNumber: slideNumber++ });
        } catch (error) {
            console.error('Failed to generate bar chart:', error);
            showToast(error.message, 'error');
            // Skip bar chart slide if data is missing
        }

        // Top & Bottom Statements - Engagement Questions
        try {
            const engagementStatementsData = DataCalculations.calculateTopBottomStatements(this.reportData.data, 'engagement');
            this.addSlide('top-bottom-statements', {
                title: 'Top & Bottom Scoring Statements - Engagement',
                topStatements: engagementStatementsData.topStatements,
                bottomStatements: engagementStatementsData.bottomStatements,
                yearLabels: engagementStatementsData.yearLabels
            }, container, { pageNumber: slideNumber++ });
        } catch (error) {
            console.error('Failed to generate engagement top/bottom statements slide:', error);
            showToast(`Engagement statements error: ${error.message}`, 'error');
        }

        // Bar Chart - SEACOM Index & Additional Dimensions
        try {
            const seacomChartData = DataCalculations.calculateSeacomDimensionScores(this.reportData.data);

            this.addSlide('barchart', {
                title: 'SEACOM Index & Dimension Scores',
                categories: seacomChartData.categories,
                current: seacomChartData.currentYear.scores,
                previous: seacomChartData.previousYear ? seacomChartData.previousYear.scores : null,
                currentLabel: seacomChartData.currentYear.label,
                previousLabel: seacomChartData.previousYear ? seacomChartData.previousYear.label : null
            }, container, { pageNumber: slideNumber++ });
        } catch (error) {
            console.error('Failed to generate SEACOM dimension bar chart:', error);
            showToast(error.message, 'error');
        }

        // Top & Bottom Statements - SEACOM Questions
        try {
            const seacomStatementsData = DataCalculations.calculateTopBottomStatements(this.reportData.data, 'seacom');
            this.addSlide('top-bottom-statements', {
                title: 'Top & Bottom Scoring Statements - SEACOM',
                topStatements: seacomStatementsData.topStatements,
                bottomStatements: seacomStatementsData.bottomStatements,
                yearLabels: seacomStatementsData.yearLabels
            }, container, { pageNumber: slideNumber++ });
        } catch (error) {
            console.error('Failed to generate SEACOM top/bottom statements slide:', error);
            showToast(`SEACOM statements error: ${error.message}`, 'error');
        }

        // Divider Slide - Heatmap Slides
        this.addSlide('divider', {
            title: 'Heatmap Slides',
        }, container, { pageNumber: slideNumber++ });

        slideNumber++;

        // Heat Map Slides - Multiple breakdowns
        try {
            // 1. Location Heatmap
            const locationHeatmapData = DataCalculations.calculateHeatMapData(
                { current: currentData, previous: previousData },
                'location',
                { showShiftIndicators: hasPreviousData }
            );
            this.addSlide('heatmap', {
                title: 'Engagement by Location',
                breakdownType: 'location',
                rowData: locationHeatmapData,
                showShiftIndicators: hasPreviousData
            }, container, { pageNumber: slideNumber++ });

            // 2. Cost Centre Heatmap
            const costCentreHeatmapData = DataCalculations.calculateHeatMapData(
                { current: currentData, previous: previousData },
                'costCentre',
                { showShiftIndicators: hasPreviousData }
            );
            this.addSlide('heatmap', {
                title: 'Engagement by Cost Centre',
                breakdownType: 'costCentre',
                rowData: costCentreHeatmapData,
                showShiftIndicators: hasPreviousData
            }, container, { pageNumber: slideNumber++ });

            // 3. Department Heatmap (paginated if needed)
            const departmentHeatmapData = DataCalculations.calculateHeatMapData(
                { current: currentData, previous: previousData },
                'department',
                { showShiftIndicators: hasPreviousData }
            );
            
            const overallDepartmentRow = departmentHeatmapData.find(row => row.isOverall) || null;
            const departmentRows = departmentHeatmapData.filter(row => !row.isOverall);
            const maxRowsPerSlide = 9; // Overall row + 10 department rows
            const departmentRowsPerPage = maxRowsPerSlide - 1;
            
            if (departmentRows.length <= departmentRowsPerPage) {
                const singlePageRows = overallDepartmentRow
                    ? [overallDepartmentRow, ...departmentRows]
                    : departmentRows;

                this.addSlide('heatmap', {
                    title: 'Engagement by Department',
                    breakdownType: 'department',
                    rowData: singlePageRows,
                    showShiftIndicators: hasPreviousData
                }, container, { pageNumber: slideNumber++ });
            } else {
                const totalPages = Math.ceil(departmentRows.length / departmentRowsPerPage);
                
                for (let page = 0; page < totalPages; page++) {
                    const startIdx = page * departmentRowsPerPage;
                    const endIdx = Math.min((page + 1) * departmentRowsPerPage, departmentRows.length);
                    const chunk = departmentRows.slice(startIdx, endIdx);
                    const pageData = overallDepartmentRow
                        ? [overallDepartmentRow, ...chunk]
                        : chunk;
                    
                    this.addSlide('heatmap', {
                        title: `Engagement by Department ${totalPages > 1 ? `(${page + 1}/${totalPages})` : ''}`,
                        breakdownType: 'department',
                        rowData: pageData,
                        showShiftIndicators: hasPreviousData
                    }, container, { pageNumber: slideNumber++ });
                }
            }

            // 4. Demographics - Gender & Race (combined table)
            // NOTE: Column indices for gender, race, age, tenure in DataCalculations may need adjustment
            // Current placeholders: gender=5, race=6, age=7, tenure=8 (columns F, G, H, I)
            try {
                const genderData = DataCalculations.calculateHeatMapData(
                    { current: currentData, previous: previousData },
                    'gender',
                    { showShiftIndicators: hasPreviousData }
                );
                const raceData = DataCalculations.calculateHeatMapData(
                    { current: currentData, previous: previousData },
                    'race',
                    { showShiftIndicators: hasPreviousData }
                );
                
                this.addSlide('heatmap', {
                    title: 'Engagement by Demographics - Gender & Race',
                    breakdownType: 'demographics-gender-race',
                    rowData: [],
                    subTables: [
                        { subtitle: 'Gender', rowData: genderData },
                        { subtitle: 'Race', rowData: raceData }
                    ],
                    showShiftIndicators: hasPreviousData
                }, container, { pageNumber: slideNumber++ });
            } catch (error) {
                console.warn('Demographics (Gender/Race) slide skipped:', error.message);
                // Continue without this slide - likely missing demographic data
            }

            // 5. Demographics - Age & Tenure (combined table)
            try {
                const ageData = DataCalculations.calculateHeatMapData(
                    { current: currentData, previous: previousData },
                    'age',
                    { showShiftIndicators: hasPreviousData }
                );
                const tenureData = DataCalculations.calculateHeatMapData(
                    { current: currentData, previous: previousData },
                    'tenure',
                    { showShiftIndicators: hasPreviousData }
                );
                
                this.addSlide('heatmap', {
                    title: 'Engagement by Demographics - Age & Tenure',
                    breakdownType: 'demographics-age-tenure',
                    rowData: [],
                    subTables: [
                        { subtitle: 'Age', rowData: ageData },
                        { subtitle: 'Tenure', rowData: tenureData }
                    ],
                    showShiftIndicators: hasPreviousData
                }, container, { pageNumber: slideNumber++ });
            } catch (error) {
                console.warn('Demographics (Age/Tenure) slide skipped:', error.message);
                // Continue without this slide - likely missing demographic data
            }

        } catch (error) {
            console.error('Failed to generate heatmap slides:', error);
            showToast(`Heatmap slides error: ${error.message}`, 'error');
            // Continue without heatmap slides
        }

        // Divider Slide - Horizontal Bar Charts - Seacom Index Statement Scores
        this.addSlide('divider', {
            title: 'Seacom Index Statement Scores',
        }, container, { pageNumber: slideNumber++ });

        slideNumber++;

        // Horizontal Bar Charts - SEACOM Index Dimensions (one slide per dimension)
        try {
            const seacomDimensionData = DataCalculations.calculateSeacomDimensionStatements(this.reportData.data);
            
            seacomDimensionData.dimensions.forEach(dimension => {
                this.addSlide('horizontal-barchart', {
                    title: `${dimension.name} - Statement Scores`,
                    dimensionName: dimension.name,
                    statements: dimension.statements,
                    yearLabels: seacomDimensionData.yearLabels
                }, container, { pageNumber: slideNumber++ });
            });
        } catch (error) {
            console.error('Failed to generate SEACOM dimension horizontal bar charts:', error);
            showToast(`SEACOM dimension charts error: ${error.message}`, 'error');
        }

        // Divider Slide - Risk Matrix - Retention Risk
        this.addSlide('divider', {
            title: 'Retention Risk',
        }, container, { pageNumber: slideNumber++ });

        slideNumber++;

        // Retention Risk Intro slide
        const retentionQuestions = DataCalculations.getRetentionQuestionTexts(this.reportData.data);

        this.addSlide('retention-intro', {
            title: 'Retention Risk',
            description: 'Statements with subsequent agreement factors that made use of a 5 point scale, which were inverted to reflect the overall Retention Risk Index.',
            questions: [
                { dimension: 'Risk 1', question: retentionQuestions.risk1 },
                { dimension: 'Risk 2', question: retentionQuestions.risk2 }
            ]
        }, container, { pageNumber: slideNumber++ });

        // Risk Matrix Slides - Dynamic per dimension
        try {
            const riskSlideConfigs = [
                { type: 'location', title: 'Retention Risk - Location', entityLabel: 'Location' },
                { type: 'costCentre', title: 'Retention Risk - Cost Centre', entityLabel: 'Cost Centre' },
                { type: 'department', title: 'Retention Risk - Department', entityLabel: 'Department', paginate: true }
            ];

            const maxRowsPerRiskSlide = 13;

            riskSlideConfigs.forEach(config => {
                const rows = DataCalculations.calculateRetentionRiskByDimension(this.reportData.data, config.type);
                if (!rows || !rows.length) {
                    return;
                }

                if (config.paginate && rows.length > maxRowsPerRiskSlide) {
                    const overallRow = rows.find(row => row.isOverall) || null;
                    const detailRows = rows.filter(row => !row.isOverall);
                    const detailRowsPerPage = overallRow ? maxRowsPerRiskSlide - 1 : maxRowsPerRiskSlide;
                    const totalPages = Math.ceil(detailRows.length / detailRowsPerPage);

                    for (let page = 0; page < totalPages; page++) {
                        const startIdx = page * detailRowsPerPage;
                        const chunk = detailRows.slice(startIdx, startIdx + detailRowsPerPage);
                        const slideRows = overallRow ? [overallRow, ...chunk] : chunk;
                        const pageTitle = totalPages > 1
                            ? `${config.title} (${page + 1}/${totalPages})`
                            : config.title;

                        this.addSlide('risk-matrix', {
                            title: pageTitle,
                            rows: slideRows,
                            entityLabel: config.entityLabel,
                            riskDefinitions: true
                        }, container, { pageNumber: slideNumber++ });
                    }
                } else {
                    this.addSlide('risk-matrix', {
                        title: config.title,
                        rows,
                        entityLabel: config.entityLabel,
                        riskDefinitions: true
                    }, container, { pageNumber: slideNumber++ });
                }
            });
        } catch (error) {
            console.error('Failed to generate retention risk slides:', error);
            showToast(`Retention risk slides error: ${error.message}`, 'error');
        }

        // Divider Slide - Employee Net Promoter Score
        this.addSlide('divider', {
            title: 'Employee Net Promoter Score (eNPS)',
        }, container, { pageNumber: slideNumber++ });

        slideNumber++;

        // eNPS Intro slide (static context)
        this.addSlide('enps-intro', {
            title: 'eNPS'
        }, container, { pageNumber: slideNumber++ });

        // eNPS breakdown slides
        try {
            const enpsConfigs = [
                { type: 'location', label: 'Location' },
                { type: 'costCentre', label: 'Cost Centre' },
                { type: 'department', label: 'Department' }
            ];
            const maxRowsPerSlide = 10;

            enpsConfigs.forEach(config => {
                const enpsData = DataCalculations.calculateEnpsByDimension(this.reportData.data, config.type);
                const overallRow = enpsData.overall;
                const detailRows = enpsData.rows;
                const rowsPerPage = Math.max(1, maxRowsPerSlide - 1);
                const totalPages = Math.max(1, Math.ceil(detailRows.length / rowsPerPage) || 1);

                for (let page = 0; page < totalPages; page++) {
                    const startIdx = page * rowsPerPage;
                    const chunk = detailRows.slice(startIdx, startIdx + rowsPerPage);
                    const tableRows = [overallRow, ...chunk];
                    const title = totalPages > 1
                        ? `eNPS - ${config.label} (${page + 1}/${totalPages})`
                        : `eNPS - ${config.label}`;

                    this.addSlide('enps', {
                        title,
                        questionText: enpsData.questionText,
                        chartData: {
                            detractorsPct: overallRow.detractorsPct,
                            passivesPct: overallRow.passivesPct,
                            promotersPct: overallRow.promotersPct,
                            yearLabel: enpsData.yearLabel
                        },
                        rows: tableRows
                    }, container, { pageNumber: slideNumber++ });
                }
            });
        } catch (error) {
            console.error('Failed to generate eNPS slides:', error);
            showToast(`eNPS slides error: ${error.message}`, 'error');
        }

        // Divider Slide - Employee Comments
        this.addSlide('divider', {
            title: 'Employee Comments',
        }, container, { pageNumber: slideNumber++ });

        slideNumber++;

        // Employee Comments slides
        try {
            const commentsData = DataCalculations.calculateCommentSummaries(this.reportData.data);
            const questionsPerSlide = 2;
            const totalPages = Math.max(1, Math.ceil(commentsData.length / questionsPerSlide));

            for (let page = 0; page < totalPages; page++) {
                const startIdx = page * questionsPerSlide;
                const chunk = commentsData.slice(startIdx, startIdx + questionsPerSlide);
                if (!chunk.length) continue;

                const title = totalPages > 1
                    ? `Comments Summary (${page + 1}/${totalPages})`
                    : 'Comments Summary';

                this.addSlide('comments', {
                    title,
                    questions: chunk
                }, container, { pageNumber: slideNumber++ });
            }
        } catch (error) {
            console.error('Failed to generate comments slides:', error);
            showToast(`Comments slides error: ${error.message}`, 'error');
        }

        // Divider Slide - Thank You
        this.addSlide('divider', {
            title: 'Thank You',
        }, container, { pageNumber: slideNumber++ });

        slideNumber++;
    }

    /**
     * Add a slide using the factory pattern
     * @param {string} type - Slide type
     * @param {Object} data - Slide data
     * @param {HTMLElement} container - Container element
     * @param {Object} options - Additional options (pageNumber, logoPath, etc.)
     */
    addSlide(type, data, container, options = {}) {
        try {
            const slideInstance = SlideFactory.createSlide(type, data, options);
            const slideElement = slideInstance.getSlideElement();
            
            container.appendChild(slideElement);
            this.slideInstances.push(slideInstance);
        } catch (error) {
            console.error(`Error creating ${type} slide:`, error);
            showToast(`Error creating slide: ${error.message}`, 'error');
        }
    }

    setupBackButton() {
        document.getElementById('back-btn').addEventListener('click', () => {
            if (confirm('Return to upload page? Current progress will be lost.')) {
                sessionStorage.removeItem('reportData');
                window.location.href = 'index.html';
            }
        });
    }

    setupExportButtons() {
        document.getElementById('export-ppt-btn').addEventListener('click', () => {
            exportToPPT(this.reportData, this.slideInstances);
        });

        document.getElementById('export-pdf-btn').addEventListener('click', () => {
            exportToPDF(this.reportData);
        });
    }
    getYearLabel(label, fallback) {
        if (!label) return fallback;
        const match = label.toString().match(/(19|20)\d{2}/);
        if (match) return match[0];
        return label;
    }
}

// Helper function for toast notifications (if not already loaded)
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new SlideGenerator();
});

