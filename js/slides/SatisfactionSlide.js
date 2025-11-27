/**
 * Satisfaction slide with horizontal stacked bar chart and dimension breakdown
 * Displays comparison of current vs previous year satisfaction scores
 */
class SatisfactionSlide extends SlideBase {
    constructor(data, options = {}) {
        super(data, options);
        this.validateData(['title', 'dimension', 'currentData']);
        this.chartInstance = null;
    }

    render() {
        // Use standard layout
        const pageNumber = this.options.pageNumber || 1;
        const { slide, contentArea } = this.createStandardLayout(
            this.data.title, 
            pageNumber, 
            'slide-chart satisfaction-slide'
        );
        
        // Generate unique canvas ID for this instance
        this.canvasId = `satisfaction-chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const body = this.createBody();
        contentArea.appendChild(body);
        
        // Initialize chart after a slight delay to ensure DOM is ready
        // Using requestAnimationFrame for better timing
        requestAnimationFrame(() => {
            setTimeout(() => {
                const canvas = document.getElementById(this.canvasId);
                if (canvas) {
                    this.initStackedBarChart(canvas);
                }
            }, 50);
        });
        
        return slide;
    }

    createBody() {
        const body = document.createElement('div');
        body.className = 'satisfaction-content';
        
        // Question text
        const questionText = document.createElement('p');
        questionText.className = 'satisfaction-question';
        questionText.textContent = 'Overall, I would rate my level of satisfaction or dissatisfaction with the company as:';
        body.appendChild(questionText);
        
        // Stacked bar chart
        const chartContainer = document.createElement('div');
        chartContainer.className = 'stacked-chart-container';
        
        const canvas = document.createElement('canvas');
        canvas.className = 'satisfaction-chart-canvas';
        canvas.id = this.canvasId; // Use the unique ID generated in render()
        
        chartContainer.appendChild(canvas);
        body.appendChild(chartContainer);
        
        // Table
        const table = this.createTable();
        body.appendChild(table);
        
        return body;
    }

    createTable() {
        const table = document.createElement('table');
        table.className = 'satisfaction-table striped compact';
        
        // Get dimension label for header
        const dimensionLabels = {
            'location': 'LOCATION',
            'costCenter': 'COST CENTER',
            'department': 'DEPARTMENT'
        };
        const dimensionLabel = dimensionLabels[this.data.dimension] || 'DIMENSION';
        
        const yearLabels = this.data.yearLabels || {};
        const currentYearLabel = yearLabels.current || '2025';
        const previousYearLabel = yearLabels.previous || '2024';

        // Table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th class="text-start">${dimensionLabel}</th>
                <th>${currentYearLabel} % OF DISSATISFIED</th>
                <th>${currentYearLabel} % OF SATISFIED</th>
                <th>${previousYearLabel} % OF DISSATISFIED</th>
                <th>${previousYearLabel} % OF SATISFIED</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Table body
        const tbody = document.createElement('tbody');
        
        // Overall row (always first)
        const overallRow = document.createElement('tr');
        const currentData = this.data.currentData;
        const previousData = this.data.previousData;
        const previousHasData = previousData && previousData.hasData;
        
        const overallPrevious = previousHasData ? previousData.overall : null;
        
        overallRow.innerHTML = `
            <td>SEACOM ENGAGEMENT INDEX</td>
            <td>${currentData.overall.dissatisfied}%</td>
            <td>${currentData.overall.satisfied}%</td>
            <td>${overallPrevious ? overallPrevious.dissatisfied + '%' : ''}</td>
            <td>${overallPrevious ? overallPrevious.satisfied + '%' : ''}</td>
        `;
        tbody.appendChild(overallRow);
        
        // Breakdown rows
        const breakdown = this.getMergedBreakdown();
        const startIndex = this.data.startIndex || 0;
        const maxRows = this.data.maxRows || 13;
        const endIndex = Math.min(startIndex + maxRows - 1, breakdown.length); // -1 because overall takes one row
        
        for (let i = startIndex; i < endIndex; i++) {
            const item = breakdown[i];
            const row = document.createElement('tr');
            const currentItem = item.current;
            const previousItem = item.previous;
            
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${currentItem ? currentItem.dissatisfied + '%' : ''}</td>
                <td>${currentItem ? currentItem.satisfied + '%' : ''}</td>
                <td>${previousItem ? previousItem.dissatisfied + '%' : ''}</td>
                <td>${previousItem ? previousItem.satisfied + '%' : ''}</td>
            `;
            tbody.appendChild(row);
        }
        
        table.appendChild(tbody);
        return table;
    }

    getMergedBreakdown() {
        if (Array.isArray(this.data.mergedBreakdown) && this.data.mergedBreakdown.length > 0) {
            return this.data.mergedBreakdown;
        }

        const map = new Map();
        const currentBreakdown = (this.data.currentData && this.data.currentData.breakdown) || [];
        const previousBreakdown = (this.data.previousData && this.data.previousData.breakdown) || [];

        currentBreakdown.forEach(item => {
            map.set(item.name, { name: item.name, current: item, previous: null });
        });

        previousBreakdown.forEach(item => {
            if (map.has(item.name)) {
                map.get(item.name).previous = item;
            } else {
                map.set(item.name, { name: item.name, current: null, previous: item });
            }
        });

        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    initStackedBarChart(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Register datalabels plugin if available
        if (window.ChartDataLabels) {
            Chart.register(ChartDataLabels);
        }
        
        const currentData = this.data.currentData.overall;
        const previousHasData = this.data.previousData && this.data.previousData.hasData;
        const previousOverall = previousHasData ? this.data.previousData.overall : null;

        const yearLabels = this.data.yearLabels || {};
        const currentYearLabel = yearLabels.current || '2025';
        const previousYearLabel = yearLabels.previous || '2024';
        
        const config = {
            type: 'bar',
            data: {
                labels: [currentYearLabel, previousYearLabel],
                datasets: [
                    {
                        label: 'Dissatisfied',
                        data: [
                            currentData.dissatisfied,
                            previousOverall ? previousOverall.dissatisfied : null
                        ],
                        backgroundColor: '#ef4444',
                        borderColor: '#ef4444',
                        borderWidth: 0,
                        datalabels: {
                            color: '#ffffff',
                            font: {
                                size: 14,
                                family: 'Poppins',
                                weight: 600
                            },
                            formatter: (value) => value > 0 ? value + '%' : ''
                        }
                    },
                    {
                        label: 'Satisfied',
                        data: [
                            currentData.satisfied,
                            previousOverall ? previousOverall.satisfied : null
                        ],
                        backgroundColor: '#10b981',
                        borderColor: '#10b981',
                        borderWidth: 0,
                        datalabels: {
                            color: '#ffffff',
                            font: {
                                size: 14,
                                family: 'Poppins',
                                weight: 600
                            },
                            formatter: (value) => value > 0 ? value + '%' : ''
                        }
                    }
                ]
            },
            options: {
                indexAxis: 'y', // Horizontal bars
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            font: {
                                family: 'Poppins',
                                size: 11
                            },
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'rect'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { size: 14, family: 'Poppins' },
                        bodyFont: { size: 13, family: 'Poppins' },
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.x + '%';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            },
                            font: {
                                family: 'Poppins',
                                size: 11
                            }
                        },
                        grid: {
                            color: '#e5e7eb'
                        }
                    },
                    y: {
                        stacked: true,
                        ticks: {
                            font: {
                                family: 'Poppins',
                                size: 12,
                                weight: 600
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        };
        
        this.chartInstance = new Chart(ctx, config);
    }


    exportToPPT(pptx) {
        const slide = pptx.addSlide();
        
        // Title
        slide.addText(this.data.title, {
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 0.7,
            fontSize: 28,
            bold: true,
            color: '1e293b'
        });
        
        // Underline
        slide.addShape(pptx.ShapeType.rect, {
            x: 0.5,
            y: 1.2,
            w: 9,
            h: 0.05,
            fill: { color: '667eea' }
        });
        
        // Question text
        slide.addText('Overall, I would rate my level of satisfaction or dissatisfaction with the company as:', {
            x: 0.5,
            y: 1.5,
            w: 9,
            h: 0.3,
            fontSize: 14,
            color: '1e293b'
        });
        
        // Prepare stacked bar chart data
        const currentData = this.data.currentData.overall;
        const previousHasData = this.data.previousData && this.data.previousData.hasData;
        const previousOverall = previousHasData ? this.data.previousData.overall : null;
        const yearLabels = this.data.yearLabels || {};
        const currentYearLabel = yearLabels.current || '2025';
        const previousYearLabel = yearLabels.previous || '2024';
        
        const chartData = [
            {
                name: currentYearLabel,
                labels: ['Dissatisfied', 'Satisfied'],
                values: [currentData.dissatisfied, currentData.satisfied]
            },
            {
                name: previousYearLabel,
                labels: ['Dissatisfied', 'Satisfied'],
                values: [
                    previousOverall ? previousOverall.dissatisfied : 0,
                    previousOverall ? previousOverall.satisfied : 0
                ]
            }
        ];
        
        // Add stacked bar chart
        slide.addChart(pptx.ChartType.bar, chartData, {
            x: 0.5,
            y: 1.9,
            w: 9,
            h: 1.5,
            barDir: 'bar', // Horizontal
            barGrouping: 'stacked',
            chartColors: ['#ef4444', '#10b981'],
            showLegend: true,
            legendPos: 'b',
            showValue: true,
            valAxisMaxVal: 100
        });
        
        // Prepare table data
        const dimensionLabels = {
            'location': 'LOCATION',
            'costCenter': 'COST CENTER',
            'department': 'DEPARTMENT'
        };
        const dimensionLabel = dimensionLabels[this.data.dimension] || 'DIMENSION';
        
        const tableRows = [];
        
        // Header row
        tableRows.push([
            { text: dimensionLabel, options: { bold: true, fill: '1e293b', color: 'ffffff' } },
            { text: `${currentYearLabel} % OF DISSATISFIED`, options: { bold: true, fill: '1e293b', color: 'ffffff' } },
            { text: `${currentYearLabel} % OF SATISFIED`, options: { bold: true, fill: '1e293b', color: 'ffffff' } },
            { text: `${previousYearLabel} % OF DISSATISFIED`, options: { bold: true, fill: '1e293b', color: 'ffffff' } },
            { text: `${previousYearLabel} % OF SATISFIED`, options: { bold: true, fill: '1e293b', color: 'ffffff' } }
        ]);
        
        // Overall row
        const overallPrevious = previousHasData ? this.data.previousData.overall : null;
        
        tableRows.push([
            'SEACOM ENGAGEMENT INDEX',
            currentData.dissatisfied + '%',
            currentData.satisfied + '%',
            overallPrevious.dissatisfied ? overallPrevious.dissatisfied + '%' : '',
            overallPrevious.satisfied ? overallPrevious.satisfied + '%' : ''
        ]);
        
        // Breakdown rows
        const breakdown = this.getMergedBreakdown();
        const startIndex = this.data.startIndex || 0;
        const maxRows = this.data.maxRows || 13;
        const endIndex = Math.min(startIndex + maxRows - 1, breakdown.length);
        
        for (let i = startIndex; i < endIndex; i++) {
            const item = breakdown[i];
            const currentItem = item.current;
            const previousItem = item.previous || { dissatisfied: '', satisfied: '' };
            
            tableRows.push([
                item.name,
                currentItem ? currentItem.dissatisfied + '%' : '',
                currentItem ? currentItem.satisfied + '%' : '',
                previousItem.dissatisfied ? previousItem.dissatisfied + '%' : '',
                previousItem.satisfied ? previousItem.satisfied + '%' : ''
            ]);
        }
        
        // Add table
        slide.addTable(tableRows, {
            x: 0.5,
            y: 3.6,
            w: 9,
            h: 2.4,
            fontSize: 10,
            color: '1e293b',
            border: { pt: 1, color: 'cccccc' }
        });
        
        return slide;
    }

    destroy() {
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
    }
}

// Register slide type
SlideFactory.register('satisfaction', SatisfactionSlide);