class TopBottomStatementsSlide extends SlideBase {
    constructor(data, options = {}) {
        super(data, options);
        this.validateData(['title', 'topStatements', 'bottomStatements', 'yearLabels']);
    }

    render() {
        const pageNumber = this.options.pageNumber || 1;
        const { slide, contentArea } = this.createStandardLayout(
            this.data.title,
            pageNumber,
            'slide-table top-bottom-statements'
        );

        const body = this.createBody();
        contentArea.appendChild(body);

        return slide;
    }

    createBody() {
        const container = document.createElement('div');
        container.className = 'top-bottom-content';

        const sectionsWrapper = document.createElement('div');
        sectionsWrapper.className = 'top-bottom-sections';

        sectionsWrapper.appendChild(
            this.createSection('Top 3 Scoring Statements', this.data.topStatements)
        );
        sectionsWrapper.appendChild(
            this.createSection('Bottom 3 Scoring Statements', this.data.bottomStatements)
        );

        container.appendChild(sectionsWrapper);

        const legendWrapper = document.createElement('div');
        legendWrapper.className = 'top-bottom-legend';
        legendWrapper.innerHTML = LegendComponent.generateEngagementLegend({
            showCategories: true,
            showShiftIndicators: false
        });
        container.appendChild(legendWrapper);

        return container;
    }

    createSection(title, statements) {
        const section = document.createElement('div');
        section.className = 'top-bottom-section';

        const heading = document.createElement('h3');
        heading.textContent = title;
        section.appendChild(heading);

        const table = document.createElement('table');
        table.className = 'top-bottom-table striped';

        const thead = document.createElement('thead');
        thead.appendChild(this.createHeaderRow());
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        statements.forEach(statement => {
            tbody.appendChild(this.createStatementRow(statement));
        });
        table.appendChild(tbody);

        section.appendChild(table);
        return section;
    }

    createHeaderRow() {
        const row = document.createElement('tr');
        const headers = [
            'Core Drivers',
            'Question',
            `${this.data.yearLabels.current} Score`,
            `${this.data.yearLabels.previous || '2024'} Score`,
            '% Shift'
        ];

        headers.forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            row.appendChild(th);
        });

        return row;
    }

    createStatementRow(statement) {
        const row = document.createElement('tr');

        const driverCell = document.createElement('td');
        driverCell.className = 'text-start';
        driverCell.textContent = statement.driver;
        row.appendChild(driverCell);

        const questionCell = document.createElement('td');
        questionCell.className = 'text-start question-cell';
        questionCell.textContent = statement.question;
        row.appendChild(questionCell);

        const currentCell = this.createScoreCell(statement.currentScore, statement.columnIndex);
        row.appendChild(currentCell);

        const previousCell = this.createScoreCell(statement.previousScore, statement.columnIndex);
        row.appendChild(previousCell);

        const shiftCell = document.createElement('td');
        shiftCell.className = 'shift-cell';
        shiftCell.textContent = this.formatShiftValue(statement.shiftValue, statement.columnIndex);
        row.appendChild(shiftCell);

        return row;
    }

    createScoreCell(score, columnIndex = null) {
        const cell = document.createElement('td');
        if (score === null || score === undefined) {
            cell.textContent = '—';
            cell.className = 'score-cell score-empty';
            return cell;
        }

        // Check if this is a 10-point scale column (don't add %)
        const isTenPoint = columnIndex !== null && DataCalculations.isTenPointScaleColumn(columnIndex);
        cell.textContent = isTenPoint ? score.toString() : `${score}%`;
        cell.className = `score-cell ${ColorMapper.getCellClass(score, 'engagement')}`;
        return cell;
    }

    formatShiftValue(shiftValue, columnIndex = null) {
        if (shiftValue === null || shiftValue === undefined) {
            return '—';
        }
        if (shiftValue === 0) {
            return '–';
        }
        // Check if this is a 10-point scale column (don't add %)
        const isTenPoint = columnIndex !== null && DataCalculations.isTenPointScaleColumn(columnIndex);
        const sign = shiftValue > 0 ? '+' : '';
        return isTenPoint ? `${sign}${shiftValue}` : `${sign}${shiftValue}%`;
    }

    exportToPPT(pptx) {
        const slide = pptx.addSlide();

        slide.addText(this.data.title, {
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 0.7,
            fontSize: 28,
            bold: true,
            color: '1e293b'
        });

        slide.addShape(pptx.ShapeType.rect, {
            x: 0.5,
            y: 1.2,
            w: 9,
            h: 0.05,
            fill: { color: '3b82f6' }
        });

        const tableData = [
            [
                { text: 'Core Drivers', options: { bold: true, fill: '1e293b', color: 'FFFFFF' } },
                { text: 'Question', options: { bold: true, fill: '1e293b', color: 'FFFFFF' } },
                { text: `${this.data.yearLabels.current} Score`, options: { bold: true, fill: '1e293b', color: 'FFFFFF' } },
                { text: `${this.data.yearLabels.previous || '2024'} Score`, options: { bold: true, fill: '1e293b', color: 'FFFFFF' } },
                { text: '% Shift', options: { bold: true, fill: '1e293b', color: 'FFFFFF' } }
            ]
        ];

        [...this.data.topStatements, ...this.data.bottomStatements].forEach(statement => {
            const isTenPoint = statement.columnIndex !== undefined && DataCalculations.isTenPointScaleColumn(statement.columnIndex);
            const currentScoreText = statement.currentScore !== null 
                ? (isTenPoint ? statement.currentScore.toString() : `${statement.currentScore}%`)
                : '—';
            const previousScoreText = statement.previousScore !== null 
                ? (isTenPoint ? statement.previousScore.toString() : `${statement.previousScore}%`)
                : '—';
            
            const row = [
                { text: statement.driver, options: { align: 'left' } },
                { text: statement.question, options: { align: 'left' } },
                { text: currentScoreText },
                { text: previousScoreText },
                { text: this.formatShiftValue(statement.shiftValue, statement.columnIndex) }
            ];
            tableData.push(row);
        });

        slide.addTable(tableData, {
            x: 0.5,
            y: 1.5,
            w: 9,
            fontSize: 12,
            colW: [1.5, 4.5, 1.2, 1.2, 0.9],
            border: { pt: 1, color: 'e2e8f0' }
        });
    }
}

SlideFactory.register('top-bottom-statements', TopBottomStatementsSlide);

