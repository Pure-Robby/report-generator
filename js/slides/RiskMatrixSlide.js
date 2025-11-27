/**
 * Risk matrix slide for retention risk by department
 * Shows risk scores with color coding
 */
class RiskMatrixSlide extends SlideBase {
    constructor(data, options = {}) {
        super(data, options);
        this.validateData(['title']);
        this.entityLabel = data.entityLabel || 'Department';
    }

    render() {
        // Use standard layout
        const pageNumber = this.options.pageNumber || 1;
        const { slide, contentArea } = this.createStandardLayout(
            this.data.title, 
            pageNumber, 
            'slide-table risk-matrix-slide'
        );
        
        const body = this.createBody();
        
        // Create risk matrix table
        const table = this.createRiskMatrixTable();
        body.appendChild(table);
        
        // Add legend
        const legend = document.createElement('div');
        legend.classList = 'risk-legend-wrapper mb-4';
        legend.innerHTML = ColorMapper.generateLegend('risk');
        body.appendChild(legend);
        
        // Add risk definitions if provided
        if (this.data.riskDefinitions) {
            const definitions = this.createRiskDefinitions();
            body.appendChild(definitions);
        }
        
        contentArea.appendChild(body);
        
        return slide;
    }

    createRiskMatrixTable() {
        const rows = this.getRows();
        if (!rows.length) {
            throw new Error('RiskMatrixSlide requires at least one row of data.');
        }

        const table = document.createElement('table');
        table.className = 'risk-matrix-table mb-3';
        
        // Create thead
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const entityHeader = this.entityLabel.toUpperCase();
        const headers = [entityHeader, 'n', 'RETENTION RISK OVERALL', 'RISK 1', 'RISK 2'];
        headers.forEach((header, index) => {
            const th = document.createElement('th');
            th.textContent = header;
            if (index === 0) th.className = 'text-start';
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create tbody
        const tbody = document.createElement('tbody');
        
        rows.forEach(dept => {
            const row = document.createElement('tr');
            
            // Department name
            const thName = document.createElement('th');
            thName.textContent = dept.name;
            row.appendChild(thName);
            
            // Sample size (n)
            const tdN = document.createElement('td');
            tdN.className = 'cell-n';
            tdN.textContent = dept.n;
            thName.className = 'text-start';
            row.appendChild(tdN);
            
            // Overall risk
            const tdOverall = document.createElement('td');
            tdOverall.textContent = dept.overall + '%';
            tdOverall.className = ColorMapper.getCellClass(dept.overall, 'risk');
            row.appendChild(tdOverall);
            
            // Risk 1
            const tdRisk1 = document.createElement('td');
            tdRisk1.textContent = dept.risk1 + '%';
            tdRisk1.className = ColorMapper.getCellClass(dept.risk1, 'risk');
            row.appendChild(tdRisk1);
            
            // Risk 2
            const tdRisk2 = document.createElement('td');
            tdRisk2.textContent = dept.risk2 + '%';
            tdRisk2.className = ColorMapper.getCellClass(dept.risk2, 'risk');
            row.appendChild(tdRisk2);
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        
        return table;
    }

    createRiskDefinitions() {
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; gap: 1rem; margin-top: 0.75rem;';
        
        const definitions = [
            {
                title: 'RISK 1',
                text: 'I intend to look for a job in another company in the near future',
                color: '#0B2265'
            },
            {
                title: 'RISK 2',
                text: 'At the present time, I am actively searching for another job',
                color: '#0B2265'
            }
        ];
        
        definitions.forEach(def => {
            const box = document.createElement('div');
            box.style.cssText = `flex: 1; padding: 0.5rem 0.75rem; border-left: 3px solid ${def.color}; background: #f8fafc;`;
            box.innerHTML = `
                <strong style="display: block; margin-bottom: 0.25rem; font-size: 0.75rem;">${def.title}</strong>
                <p style="margin: 0; color: #64748b; font-size: 0.8rem;">${def.text}</p>
            `;
            container.appendChild(box);
        });
        
        return container;
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
        
        // Prepare table data
        const tableData = [];
        
        const entityHeader = this.entityLabel.toUpperCase();

        // Header row
        const headerRow = [entityHeader, 'n', 'RETENTION RISK OVERALL', 'RISK 1', 'RISK 2'].map(text => ({
            text: text,
            options: {
                bold: true,
                color: 'FFFFFF',
                fill: '1e293b',
                fontSize: 10,
                align: 'center'
            }
        }));
        tableData.push(headerRow);
        
        // Data rows
        const rows = this.getRows();
        rows.forEach(dept => {
            const row = [];
            
            // Department name
            row.push({
                text: dept.name,
                options: {
                    bold: true,
                    fill: 'f8fafc',
                    color: '1e293b',
                    fontSize: 10
                }
            });
            
            // Sample size
            row.push({
                text: String(dept.n),
                options: {
                    color: '64748b',
                    fontSize: 10,
                    align: 'center'
                }
            });
            
            // Risk scores with colors
            [dept.overall, dept.risk1, dept.risk2].forEach(value => {
                const color = ColorMapper.getRiskColor(value);
                row.push({
                    text: value + '%',
                    options: {
                        bold: true,
                        fill: color.hex,
                        color: color.text === '#ffffff' ? 'FFFFFF' : '000000',
                        fontSize: 11,
                        align: 'center'
                    }
                });
            });
            
            tableData.push(row);
        });
        
        // Add table to slide
        slide.addTable(tableData, {
            x: 0.5,
            y: 1.5,
            w: 9,
            h: 3.5,
            fontSize: 10,
            border: { pt: 1, color: 'e2e8f0' },
            margin: 0.1
        });
        
        // Add risk definitions
        if (this.data.riskDefinitions) {
            slide.addShape(pptx.ShapeType.rect, {
                x: 0.5,
                y: 5.2,
                w: 4.25,
                h: 0.8,
                fill: { color: 'f8fafc' },
                line: { width: 0, color: '4472C4' }
            });
            slide.addText('RISK 1: At the present time, I am actively searching for another job.', {
                x: 0.6,
                y: 5.3,
                w: 4,
                h: 0.6,
                fontSize: 10,
                color: '64748b'
            });
            
            slide.addShape(pptx.ShapeType.rect, {
                x: 5.25,
                y: 5.2,
                w: 4.25,
                h: 0.8,
                fill: { color: 'f8fafc' },
                line: { width: 0, color: '000000' }
            });
            slide.addText('RISK 2: I intend to look for a job in another company in the near future.', {
                x: 5.35,
                y: 5.3,
                w: 4,
                h: 0.6,
                fontSize: 10,
                color: '64748b'
            });
        }
        
        return slide;
    }

    getRows() {
        if (Array.isArray(this.data.rows)) {
            return this.data.rows;
        }

        if (Array.isArray(this.data.departments)) {
            return this.data.departments;
        }

        return [];
    }
}

// Register slide type
SlideFactory.register('risk-matrix', RiskMatrixSlide);

