/**
 * Questions slide showing survey dimensions and their associated questions
 * Displays dimensions grouped with their questions
 */
class QuestionsSlide extends SlideBase {
    constructor(data, options = {}) {
        super(data, options);
        this.validateData(['title', 'dimensions']);
    }

    render() {
        // Use standard layout
        const pageNumber = this.options.pageNumber || 1;
        const { slide, contentArea } = this.createStandardLayout(
            this.data.title, 
            pageNumber, 
            'slide-table questions-slide'
        );

        if (this.options.slideClass) {
            slide.classList.add(this.options.slideClass);
        }
        
        const body = this.createBody();
        contentArea.appendChild(body);
        
        return slide;
    }

    createBody() {
        const body = document.createElement('div');
        body.className = 'questions-content';
        
        // Description paragraph
        const description = document.createElement('p');
        description.className = 'questions-description';
        description.textContent = 'Statements with subsequent agreement factors that made use of a 5 point scale, which formed the base for the engagement index (%).';
        body.appendChild(description);
        
        // Rating scale table
        const ratingScale = this.createRatingScaleTable();
        body.appendChild(ratingScale);
        
        // Questions table - add compact class for pages 2 & 3 to prevent overflow
        const questionsTable = this.createQuestionsTable();
        body.appendChild(questionsTable);
        
        return body;
    }

    createRatingScaleTable() {
        return RatingScaleComponent.createTable();
    }

    createQuestionsTable() {
        const table = document.createElement('table');
        
        // Determine if this needs compact styling based on page indicator in options
        const pageNumber = this.options.pageNumber || 1;
        const isCompact = this.data.title && (
            this.data.title.includes('Page 2') || 
            this.data.title.includes('Page 3')
        );
        
        const tableClasses = ['survey-questions', 'striped'];
        if (isCompact) {
            tableClasses.push('compact');
        }
        if (this.options.extraCompact) {
            tableClasses.push('extra-compact');
        }
        if (this.options.tableClass) {
            tableClasses.push(this.options.tableClass);
        }
        table.className = tableClasses.join(' ');
        
        // Table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th class="dimension-col">DIMENSION</th>
                <th>QUESTIONS</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Table body
        const tbody = document.createElement('tbody');
        const dimensions = this.data.dimensions || [];
        
        // Handle pagination if provided
        const startIndex = this.data.startIndex || 0;
        const endIndex = this.data.endIndex || dimensions.length;
        const pageDimensions = dimensions.slice(startIndex, endIndex);
        
        // Build rows for each dimension and its questions
        // Track group index for consistent striping across rowspan
        let groupIndex = 0;
        
        pageDimensions.forEach(dimension => {
            const questions = dimension.questions || [];
            const backgroundClass = groupIndex % 2 === 0 ? 'odd-group' : 'even-group';
            
            if (questions.length === 0) {
                // No questions for this dimension
                const row = document.createElement('tr');
                row.className = backgroundClass;
                row.innerHTML = `
                    <td class="dimension-name">${dimension.name}</td>
                    <td>No questions defined</td>
                `;
                tbody.appendChild(row);
            } else if (questions.length === 1) {
                // Single question - simple row
                const row = document.createElement('tr');
                row.className = backgroundClass;
                row.innerHTML = `
                    <td class="dimension-name">${dimension.name}</td>
                    <td>${questions[0]}</td>
                `;
                tbody.appendChild(row);
            } else {
                // Multiple questions - first row with rowspan, all with same background
                questions.forEach((question, qIndex) => {
                    const row = document.createElement('tr');
                    row.className = backgroundClass; // Same class for all rows in this dimension
                    if (qIndex === 0) {
                        // First question - include dimension with rowspan
                        row.innerHTML = `
                            <td class="dimension-name" rowspan="${questions.length}">${dimension.name}</td>
                            <td>${question}</td>
                        `;
                    } else {
                        // Subsequent questions - no dimension cell
                        row.innerHTML = `<td>${question}</td>`;
                    }
                    tbody.appendChild(row);
                });
            }
            
            groupIndex++; // Increment for next dimension group
        });
        
        table.appendChild(tbody);
        return table;
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
        
        // Description
        slide.addText('Statements with subsequent agreement factors that made use of a 5 point scale, which formed the base for the engagement index (%).', {
            x: 0.5,
            y: 1.5,
            w: 9,
            h: 0.3,
            fontSize: 11,
            color: '1e293b'
        });
        
        // Rating scale table
        const ratingScaleRows = [
            [
                { text: 'STRONGLY DISAGREE', options: { bold: true, fill: '1e293b', color: 'ffffff' } },
                { text: 'DISAGREE', options: { bold: true, fill: '1e293b', color: 'ffffff' } },
                { text: 'NEUTRAL', options: { bold: true, fill: '1e293b', color: 'ffffff' } },
                { text: 'AGREE', options: { bold: true, fill: '1e293b', color: 'ffffff' } },
                { text: 'STRONGLY AGREE', options: { bold: true, fill: '1e293b', color: 'ffffff' } }
            ],
            ['0%', '25%', '50%', '75%', '100%']
        ];
        
        slide.addTable(ratingScaleRows, {
            x: 0.5,
            y: 1.9,
            w: 9,
            h: 0.6,
            fontSize: 10,
            color: '1e293b',
            align: 'center',
            border: { pt: 1, color: 'cccccc' }
        });
        
        // Questions table
        const dimensions = this.data.dimensions || [];
        const startIndex = this.data.startIndex || 0;
        const endIndex = this.data.endIndex || dimensions.length;
        const pageDimensions = dimensions.slice(startIndex, endIndex);
        
        const questionRows = [
            [
                { text: 'DIMENSION', options: { bold: true, fill: '1e293b', color: 'ffffff' } },
                { text: 'QUESTIONS', options: { bold: true, fill: '1e293b', color: 'ffffff' } }
            ]
        ];
        
        pageDimensions.forEach(dimension => {
            const questions = dimension.questions || [];
            if (questions.length === 0) {
                questionRows.push([dimension.name, 'No questions defined']);
            } else {
                questions.forEach((question, qIndex) => {
                    if (qIndex === 0) {
                        questionRows.push([dimension.name, question]);
                    } else {
                        questionRows.push(['', question]);
                    }
                });
            }
        });
        
        slide.addTable(questionRows, {
            x: 0.5,
            y: 2.6,
            w: 9,
            h: 3.4,
            fontSize: 9,
            color: '1e293b',
            border: { pt: 1, color: 'cccccc' },
            colW: [2, 7]
        });
        
        return slide;
    }
}

// Register slide type
SlideFactory.register('questions', QuestionsSlide);