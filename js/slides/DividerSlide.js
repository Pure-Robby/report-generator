/**
 * Divider slide for section breaks
 */
class DividerSlide extends SlideBase {
    constructor(data, options = {}) {
        super(data, options);
        this.validateData(['title']);
    }

    render() {
        const slide = this.createSlideContainer('slide-divider');
        
        slide.innerHTML = `
            <div class="divider-content">
                <h1>${this.data.title}</h1>
                ${this.data.subtitle ? `<p class="subtitle">${this.data.subtitle}</p>` : ''}
            </div>
        `;
        
        return slide;
    }

    exportToPPT(pptx) {
        const slide = pptx.addSlide();
        
        // Use divider image if available
        if (this.options.useBackground) {
            slide.background = { path: 'assets/divider.jpg' };
        } else {
            slide.background = { fill: '667eea' };
        }
        
        // Title
        slide.addText(this.data.title, {
            x: 1,
            y: 3,
            w: 8,
            h: 1.5,
            fontSize: 48,
            bold: true,
            color: 'FFFFFF',
            align: 'center',
            valign: 'middle'
        });
        
        // Subtitle if provided
        if (this.data.subtitle) {
            slide.addText(this.data.subtitle, {
                x: 1,
                y: 4.5,
                w: 8,
                h: 0.8,
                fontSize: 24,
                color: 'FFFFFF',
                align: 'center',
                valign: 'middle'
            });
        }

        return slide;
    }
}

// Register slide type
SlideFactory.register('divider', DividerSlide);

