/**
 * Introductory slide for retention risk section.
 * Provides context, rating scale, question mapping, and legend before data tables.
 */
class RetentionIntroSlide extends SlideBase {
    constructor(data, options = {}) {
        super(data, options);
        this.validateData(['title', 'description', 'questions']);
    }

    render() {
        const pageNumber = this.options.pageNumber || 1;
        const { slide, contentArea } = this.createStandardLayout(
            this.data.title,
            pageNumber,
            'slide-table retention-intro-slide'
        );

        const body = this.createBody();
        contentArea.appendChild(body);

        // Description
        const description = document.createElement('p');
        description.className = 'retention-intro-description';
        description.textContent = this.data.description;
        body.appendChild(description);

        // Rating scale
        const ratingScale = RatingScaleComponent.createTable();
        ratingScale.classList.add('retention-rating-scale');
        body.appendChild(ratingScale);

        // Question mapping table
        const mappingTable = this.createQuestionsTable();
        body.appendChild(mappingTable);

        // Legend wrapper for risk legend
        const legendWrapper = document.createElement('div');
        legendWrapper.className = 'risk-legend-wrapper';
        legendWrapper.innerHTML = ColorMapper.generateLegend('risk');
        body.appendChild(legendWrapper);

        return slide;
    }

    createQuestionsTable() {
        const table = document.createElement('table');
        table.className = 'retention-questions-table';

        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th class="text-start">DIMENSION</th>
                <th class="text-start">QUESTION</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        (this.data.questions || []).forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="text-start">${item.dimension}</td>
                <td class="text-start">${item.question}</td>
            `;
            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        return table;
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
            fill: { color: '667eea' }
        });

        slide.addText(this.data.description, {
            x: 0.5,
            y: 1.4,
            w: 9,
            h: 0.5,
            fontSize: 12,
            color: '1e293b'
        });

        // Rating scale table
        slide.addTable([
            [
                { text: 'STRONGLY DISAGREE', options: this.getHeaderCellOptions() },
                { text: 'DISAGREE', options: this.getHeaderCellOptions() },
                { text: 'NEUTRAL', options: this.getHeaderCellOptions() },
                { text: 'AGREE', options: this.getHeaderCellOptions() },
                { text: 'STRONGLY AGREE', options: this.getHeaderCellOptions() }
            ],
            ['0%', '25%', '50%', '75%', '100%']
        ], {
            x: 0.5,
            y: 1.9,
            w: 9,
            h: 0.6,
            fontSize: 10,
            border: { pt: 1, color: 'cccccc' },
            align: 'center'
        });

        // Question mapping table for PPT
        const rows = [
            [
                { text: 'DIMENSION', options: this.getHeaderCellOptions() },
                { text: 'QUESTION', options: this.getHeaderCellOptions() }
            ],
            ...this.getQuestionRowsForExport()
        ];

        slide.addTable(rows, {
            x: 0.5,
            y: 2.7,
            w: 9,
            fontSize: 11,
            border: { pt: 1, color: 'cccccc' },
            colW: [2.5, 6.5]
        });

        // Legend text block
        slide.addText('Retention Risk Legend: Low (<20), Medium (20-35), High (35-50), Very High (>50)', {
            x: 0.5,
            y: 4.6,
            w: 9,
            h: 0.4,
            fontSize: 11,
            color: '64748b'
        });

        return slide;
    }

    getHeaderCellOptions() {
        return {
            bold: true,
            fill: '1e293b',
            color: 'ffffff'
        };
    }

    getQuestionRowsForExport() {
        return (this.data.questions || []).map(item => [
            item.dimension,
            item.question
        ]);
    }
}

SlideFactory.register('retention-intro', RetentionIntroSlide);


