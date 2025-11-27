/**
 * Cover slide with background image
 */
class CoverSlide extends SlideBase {
    constructor(data, options = {}) {
        super(data, options);
        this.validateData(['surveyName', 'reportName', 'date']);
    }

    render() {
        const slide = this.createSlideContainer('slide-title');
        
        slide.innerHTML = `
            <div class="title-content">
                <h1 class="survey-name mb-4">${this.data.surveyName}</h1>
                <h2>${this.data.reportName}</h2>
                <p class="date">${this.data.date}</p>
            </div>
        `;
        
        return slide;
    }

    exportToPPT(pptx) {
        const slide = pptx.addSlide();
        slide.background = { path: 'assets/cover-image.jpg' };
        
        // Semi-transparent overlay
        slide.addShape(pptx.ShapeType.rect, {
            x: 0,
            y: 0,
            w: '100%',
            h: '100%',
            fill: { color: '000000', transparency: 30 },
            line: { width: 0 }
        });
        
        // Survey name (smaller, uppercase)
        slide.addText(this.data.surveyName.toUpperCase(), {
            x: 0.5,
            y: 2.5,
            w: 9,
            h: 0.8,
            fontSize: 24,
            color: 'b2b1b2',
            align: 'center',
            valign: 'middle',
            bold: true
        });
        
        // Report name (main title)
        slide.addText(this.data.reportName, {
            x: 0.5,
            y: 3.5,
            w: 9,
            h: 1,
            fontSize: 36,
            bold: true,
            color: 'FFFFFF',
            align: 'center',
            valign: 'middle'
        });
        
        // Date
        slide.addText(this.data.date, {
            x: 0.5,
            y: 4.7,
            w: 9,
            h: 0.5,
            fontSize: 20,
            color: 'FFFFFF',
            align: 'center',
            valign: 'middle'
        });

        return slide;
    }
}

// Register slide type
SlideFactory.register('cover', CoverSlide);

