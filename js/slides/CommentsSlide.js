class CommentsSlide extends SlideBase {
    constructor(data, options = {}) {
        super(data, options);
        this.validateData(['title', 'questions']);
    }

    render() {
        const pageNumber = this.options.pageNumber || 1;
        const { slide, contentArea } = this.createStandardLayout(
            this.data.title,
            pageNumber,
            'comments-slide'
        );

        const body = this.createBody();
        contentArea.appendChild(body);

        (this.data.questions || []).forEach((question, index) => {
            body.appendChild(this.createQuestionCard(question, index));
        });

        return slide;
    }

    createQuestionCard(question, index) {
        const card = document.createElement('div');
        card.className = 'comment-card';

        const heading = document.createElement('h3');
        heading.textContent = question.questionRaw || question.question || `Question ${index + 1}`;
        card.appendChild(heading);

        const subHeading = document.createElement('p');
        subHeading.className = 'comment-subheading';
        subHeading.textContent = 'TOP 3 AREAS FOR IMPROVEMENT';
        card.appendChild(subHeading);

        const summary = document.createElement('div');
        summary.className = 'comment-summary';
        // Use innerHTML to render formatted text with line breaks and bold
        summary.innerHTML = question.summary || 'No responses were provided for this question.';
        card.appendChild(summary);

        return card;
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

        let currentY = 1.4;
        (this.data.questions || []).forEach((question, index) => {
            slide.addText(question.question || `Question ${index + 1}`, {
                x: 0.5,
                y: currentY,
                w: 9,
                h: 0.4,
                fontSize: 16,
                bold: true,
                color: '0f172a'
            });

            currentY += 0.45;

            slide.addText('TOP 3 AREAS FOR IMPROVEMENT', {
                x: 0.5,
                y: currentY,
                w: 9,
                h: 0.3,
                fontSize: 12,
                bold: true,
                color: '475569'
            });

            currentY += 0.35;

            // Convert HTML formatting to plain text for PPT (remove HTML tags, preserve line breaks)
            const summaryText = (question.summaryRaw || question.summary || 'No responses were provided for this question.')
                .replace(/<br\s*\/?>/gi, '\n') // Convert <br> to newlines
                .replace(/<strong>(.*?)<\/strong>/gi, '$1') // Remove bold tags (PPT will handle formatting separately if needed)
                .replace(/<[^>]+>/g, '') // Remove any remaining HTML tags
                .trim();

            slide.addText(summaryText, {
                x: 0.5,
                y: currentY,
                w: 9,
                h: 0.8,
                fontSize: 12,
                color: '475569',
                breakLine: true // Enable line breaks in PPT
            });

            currentY += 0.95;
        });

        return slide;
    }
}

SlideFactory.register('comments', CommentsSlide);


