// Export functions for PPT and PDF

/**
 * Convert an image file to base64 data URL
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<string>} Base64 data URL
 */
async function imageToBase64(imagePath) {
    // First try to fetch as blob (works for HTTP/HTTPS)
    try {
        const response = await fetch(imagePath);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => reject(new Error(`Failed to read image file: ${imagePath}`));
            reader.readAsDataURL(blob);
        });
    } catch (fetchError) {
        // If fetch fails, try using Image element with canvas (works for some local scenarios)
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = function() {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const dataURL = canvas.toDataURL('image/jpeg', 0.9);
                    resolve(dataURL);
                } catch (error) {
                    reject(new Error(`Failed to convert image to base64: ${error.message}`));
                }
            };
            
            img.onerror = function() {
                reject(new Error(`Failed to load image: ${imagePath}. Fetch error: ${fetchError.message}`));
            };
            
            img.src = imagePath;
        });
    }
}

/**
 * Capture a slide element as an image using html2canvas
 * @param {HTMLElement} slideElement - The slide DOM element to capture
 * @returns {Promise<string>} Base64 data URL of the captured image
 */
async function captureSlideAsImage(slideElement) {
    if (typeof html2canvas === 'undefined') {
        throw new Error('html2canvas library is not loaded. Please check the HTML file.');
    }

    // Store original scroll position and styles
    const originalScrollY = window.scrollY;
    const originalScrollX = window.scrollX;
    const originalPosition = slideElement.style.position;
    const originalTop = slideElement.style.top;
    const originalLeft = slideElement.style.left;
    const originalZIndex = slideElement.style.zIndex;
    
    // Store original styles for elements we'll modify
    const originalStyles = {
        images: [],
        header: null,
        contentArea: null
    };
    
    // Ensure slide is visible and maintains full width
    slideElement.style.display = 'flex';
    slideElement.style.visibility = 'visible';
    slideElement.style.opacity = '1';
    slideElement.style.width = '1280px'; // Explicit width to prevent clipping
    slideElement.style.maxWidth = '1280px';
    slideElement.style.minWidth = '1280px';
    
    // Temporarily position element at top of viewport for capture
    // Position at left: 0 to ensure full capture, but ensure viewport is wide enough
    slideElement.style.position = 'fixed';
    slideElement.style.top = '0';
    slideElement.style.left = '0';
    slideElement.style.zIndex = '1'; // Below overlay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Get natural dimensions - verify element is actually visible
    const rect = slideElement.getBoundingClientRect();
    
    const computedStyle = window.getComputedStyle(slideElement);
    const naturalWidth = parseInt(computedStyle.width) || 1280;
    const naturalHeight = parseInt(computedStyle.height) || 720;
    
    // Pre-load all images and ensure they're accessible
    const images = slideElement.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve) => {
            // Store original styles
            originalStyles.images.push({
                element: img,
                display: img.style.display,
                visibility: img.style.visibility,
                opacity: img.style.opacity,
                crossOrigin: img.crossOrigin
            });
            
            // Fix in original DOM: ensure visibility and CORS
            img.style.display = 'block';
            img.style.visibility = 'visible';
            img.style.opacity = '1';
            if (img.crossOrigin !== 'anonymous') {
                img.crossOrigin = 'anonymous';
            }
            
            if (img.complete && img.naturalWidth > 0) {
                resolve();
                return;
            }
            
            const timeout = setTimeout(() => resolve(), 5000);
            
            img.onload = () => {
                clearTimeout(timeout);
                resolve();
            };
            img.onerror = () => {
                clearTimeout(timeout);
                resolve(); // Continue even if image fails
            };
            
            // Force reload if needed
            if (img.src && !img.complete) {
                const src = img.src;
                img.src = '';
                img.src = src;
            }
        });
    });
    await Promise.all(imagePromises);
    
    // Pre-load background images (cover, divider)
    const bgImageUrls = [];
    const slideTitle = slideElement.querySelector('.slide-title');
    const slideDivider = slideElement.querySelector('.slide-divider');
    
    // Helper to resolve relative URLs to absolute
    const resolveUrl = (url) => {
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
            return url;
        }
        // Resolve relative path
        const a = document.createElement('a');
        a.href = url;
        return a.href;
    };
    
    if (slideTitle) {
        const bgStyle = window.getComputedStyle(slideTitle).backgroundImage;
        const urlMatch = bgStyle.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (urlMatch && urlMatch[1]) {
            bgImageUrls.push(resolveUrl(urlMatch[1]));
        }
    }
    
    if (slideDivider) {
        const bgStyle = window.getComputedStyle(slideDivider).backgroundImage;
        const urlMatch = bgStyle.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (urlMatch && urlMatch[1]) {
            bgImageUrls.push(resolveUrl(urlMatch[1]));
        }
    }
    
    // Pre-load background images
    const bgImagePromises = bgImageUrls.map(url => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            const timeout = setTimeout(() => resolve(), 5000);
            img.onload = () => {
                clearTimeout(timeout);
                resolve();
            };
            img.onerror = () => {
                clearTimeout(timeout);
                resolve(); // Continue even if fails
            };
            img.src = url;
        });
    });
    await Promise.all(bgImagePromises);
    
    // Wait for all images to be fully rendered
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Remove max-height constraint from content area
    const contentArea = slideElement.querySelector('.slide-page-content');
    if (contentArea) {
        originalStyles.contentArea = {
            element: contentArea,
            maxHeight: contentArea.style.maxHeight,
            overflow: contentArea.style.overflow
        };
        contentArea.style.maxHeight = 'none';
        contentArea.style.overflow = 'visible';
    }
    
    // Trigger Chart.js resize
    await new Promise(resolve => setTimeout(resolve, 200));
    const canvases = slideElement.querySelectorAll('canvas');
    canvases.forEach(canvas => {
        if (canvas.chart && typeof canvas.chart.resize === 'function') {
            canvas.chart.resize();
        }
    });
    await new Promise(resolve => setTimeout(resolve, 400));

    try {
        // Verify element is in viewport and visible before capture
        const checkRect = slideElement.getBoundingClientRect();
        const finalComputed = window.getComputedStyle(slideElement);
        
        // Element should now be at top of viewport (0,0)
        const finalRect = slideElement.getBoundingClientRect();
        
        // Capture the slide - element is now at top of viewport
        // Get the actual bounding rect to ensure we capture the full element
        const captureRect = slideElement.getBoundingClientRect();
        const canvas = await html2canvas(slideElement, {
            scale: 2,
            useCORS: true,
            logging: true, // Enable logging to debug - check console for errors
            backgroundColor: null,
            allowTaint: true, // Allow local images
            removeContainer: false,
            width: naturalWidth,
            height: naturalHeight,
            // Don't specify x/y - let html2canvas calculate from element's bounding rect
            // This ensures the full element is captured regardless of viewport size
            windowWidth: Math.max(window.innerWidth, naturalWidth), // Ensure viewport is wide enough
            windowHeight: Math.max(window.innerHeight, naturalHeight), // Ensure viewport is tall enough
            foreignObjectRendering: false, // Disable experimental feature - may cause blank captures
            imageTimeout: 20000, // Longer timeout for images
            ignoreElements: (element) => {
                return element.id === 'loading-overlay' || 
                       element.classList.contains('preview-header') ||
                       element.classList.contains('back-to-top') ||
                       element.id === 'toast-container' ||
                       element.id === 'export-thumbnails';
            },
            onclone: (clonedDoc, element) => {
                // Only handle background images in clone (html2canvas may not preserve CSS backgrounds)
                // Everything else is fixed in original DOM
                const elementsWithBg = element.querySelectorAll('.slide-title, .slide-divider');
                elementsWithBg.forEach(el => {
                    // Find matching element in original
                    const classMatch = Array.from(slideElement.querySelectorAll('*')).find(orig => {
                        return orig.classList.contains(el.classList[0]);
                    });
                    
                    if (classMatch) {
                        const computedStyle = window.getComputedStyle(classMatch);
                        if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
                            // Extract URL from background-image (handles url("...") format)
                            const bgImage = computedStyle.backgroundImage;
                            // Ensure the background image is set with all properties
                            el.style.backgroundImage = bgImage;
                            el.style.backgroundSize = computedStyle.backgroundSize || 'cover';
                            el.style.backgroundPosition = computedStyle.backgroundPosition || 'center center';
                            el.style.backgroundRepeat = computedStyle.backgroundRepeat || 'no-repeat';
                            el.style.backgroundAttachment = 'scroll';
                            // Force reflow to ensure background loads
                            void el.offsetHeight;
                        }
                    }
                });
            }
        });

        // Verify canvas has content
        if (canvas.width === 0 || canvas.height === 0) {
            console.error('Canvas has invalid dimensions:', canvas.width, 'x', canvas.height);
            console.error('Slide element:', slideElement);
            console.error('Slide rect:', slideElement.getBoundingClientRect());
            throw new Error(`Canvas has invalid dimensions: ${canvas.width}x${canvas.height}`);
        }
        
        // Check if canvas is actually blank (all white/transparent)
        const ctx = canvas.getContext('2d');
        const sampleData = ctx.getImageData(0, 0, Math.min(100, canvas.width), Math.min(100, canvas.height));
        const hasNonWhitePixels = sampleData.data.some((val, idx) => {
            return idx % 4 !== 3 && val !== 255; // Check RGB channels, skip alpha
        });
        
        if (!hasNonWhitePixels && canvas.width > 0 && canvas.height > 0) {
        }
        
        // Convert canvas to base64 image
        const imageDataUrl = canvas.toDataURL('image/png', 1.0);
        
        if (!imageDataUrl || imageDataUrl === 'data:,') {
            throw new Error('Failed to generate image data from slide');
        }
        
        return imageDataUrl;
    } finally {
        // Restore element position and styles
        slideElement.style.position = originalPosition;
        slideElement.style.top = originalTop;
        slideElement.style.left = originalLeft;
        slideElement.style.zIndex = originalZIndex;
        slideElement.style.width = '';
        slideElement.style.maxWidth = '';
        slideElement.style.minWidth = '';
        
        // Restore scroll position
        window.scrollTo(originalScrollX, originalScrollY);
        
        // Restore image styles
        originalStyles.images.forEach(({ element, display, visibility, opacity, crossOrigin }) => {
            element.style.display = display;
            element.style.visibility = visibility;
            element.style.opacity = opacity;
            if (crossOrigin) {
                element.crossOrigin = crossOrigin;
            }
        });
        
        // Restore header border
        if (originalStyles.header) {
            const { element, borderBottom } = originalStyles.header;
            element.style.borderBottom = borderBottom;
        }
        
        // Restore content area styles
        if (originalStyles.contentArea) {
            const { element, maxHeight, overflow } = originalStyles.contentArea;
            element.style.maxHeight = maxHeight;
            element.style.overflow = overflow;
        }
    }
}

// Export to PowerPoint using PptxGenJS - Image-based approach
async function exportToPPT(reportData, slideInstances) {
    showLoading();

    try {
        // Check if html2canvas is available
        if (typeof html2canvas === 'undefined') {
            throw new Error('html2canvas library is not loaded. Please check the HTML file.');
        }

        // Check if PptxGenJS is available, wait for it if needed
        if (typeof PptxGenJS === 'undefined') {
            // Try alternative global names
            if (typeof pptxgen !== 'undefined') {
                window.PptxGenJS = pptxgen;
            } else {
                // Wait for library to load (max 5 seconds)
                await new Promise((resolve, reject) => {
                    let attempts = 0;
                    const maxAttempts = 50;
                    const checkLibrary = () => {
                        // Check for PptxGenJS or alternative names
                        if (typeof PptxGenJS !== 'undefined') {
                            resolve();
                        } else if (typeof pptxgen !== 'undefined') {
                            window.PptxGenJS = pptxgen;
                            resolve();
                        } else if (typeof window.PptxGenJS !== 'undefined') {
                            resolve();
                        } else if (attempts < maxAttempts) {
                            attempts++;
                            setTimeout(checkLibrary, 100);
                        } else {
                            // Check if script tag exists and provide helpful error
                            const scriptTag = document.querySelector('script[src*="pptxgen"]');
                            if (!scriptTag) {
                                reject(new Error('PptxGenJS script tag not found. Please check the HTML file.'));
                            } else if (scriptTag.onerror || scriptTag.getAttribute('data-error')) {
                                reject(new Error('PptxGenJS failed to load from CDN. Please check your internet connection or try refreshing the page.'));
                            } else {
                                reject(new Error('PptxGenJS library failed to load. The script may still be loading. Please wait a moment and try again, or refresh the page.'));
                            }
                        }
                    };
                    checkLibrary();
                });
            }
        }

        const pptx = new PptxGenJS();
        
        // Set presentation properties
        pptx.layout = 'LAYOUT_16x9';
        pptx.author = 'PPT Report Generator';
        pptx.title = reportData.reportName;
        pptx.subject = reportData.surveyName;

        // Get all slide elements from the DOM
        const slideElements = document.querySelectorAll('.slide');
        
        if (slideElements.length === 0) {
            throw new Error('No slides found in the document. Please ensure slides have been generated.');
        }

        // Hide UI elements that shouldn't be in the capture (but keep loading overlay visible)
        const header = document.querySelector('.preview-header');
        const backToTop = document.querySelector('.back-to-top');
        const toastContainer = document.getElementById('toast-container');
        const loadingOverlay = document.getElementById('loading-overlay');
        const loadingText = loadingOverlay?.querySelector('p');
        
        const originalHeaderDisplay = header ? header.style.display : '';
        const originalBackToTopDisplay = backToTop ? backToTop.style.display : '';
        const originalToastDisplay = toastContainer ? toastContainer.style.display : '';

        if (header) header.style.display = 'none';
        if (backToTop) backToTop.style.display = 'none';
        if (toastContainer) toastContainer.style.display = 'none';
        // Keep loading overlay visible throughout the process
        // Ensure overlay is on top and covers everything
        if (loadingOverlay) {
            loadingOverlay.style.zIndex = '99999'; // Very high z-index
            loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)'; // More opaque
        }

        // Create thumbnail container for current slide preview (optional - can be disabled for performance)
        // Set to false to disable thumbnails and improve performance
        const SHOW_THUMBNAILS = true;
        let thumbnailContainer = null;
        let currentThumbnail = null;
        
        if (loadingOverlay && SHOW_THUMBNAILS) {
            thumbnailContainer = document.createElement('div');
            thumbnailContainer.id = 'export-thumbnails';
            thumbnailContainer.style.cssText = `
                margin-top: 1.5rem;
                display: flex;
                justify-content: center;
            `;
            loadingOverlay.appendChild(thumbnailContainer);
        }

        try {
            // Update loading message
            if (loadingText) {
                loadingText.textContent = `Preparing export...`;
            }

            // Ensure all slides are visible and charts are rendered
            slideElements.forEach((slide, index) => {
                slide.style.display = 'flex';
                slide.style.visibility = 'visible';
                // Add data attribute for identification
                if (!slide.dataset.slideId) {
                    slide.dataset.slideId = `slide-${index}`;
                }
            });

            // Wait a bit for charts to fully render
            await new Promise(resolve => setTimeout(resolve, 500));

            // Capture each slide as an image and add to PPT
            for (let i = 0; i < slideElements.length; i++) {
                const slideElement = slideElements[i];
                
                try {
                    // Update loading message
                    if (loadingText) {
                        loadingText.textContent = `Processing slide ${i + 1} of ${slideElements.length}...`;
                    }

                    // Capture slide as image
                    const imageData = await captureSlideAsImage(slideElement);
                    
                    // Show only current slide thumbnail (replace previous if exists)
                    if (thumbnailContainer) {
                        // Remove previous thumbnail
                        if (currentThumbnail && currentThumbnail.parentNode) {
                            currentThumbnail.parentNode.removeChild(currentThumbnail);
                        }
                        
                        // Create new thumbnail for current slide
                        currentThumbnail = document.createElement('div');
                        currentThumbnail.style.cssText = `
                            width: 120px;
                            height: 67.5px;
                            border: 2px solid rgba(255, 255, 255, 0.3);
                            border-radius: 4px;
                            overflow: hidden;
                            background: white;
                        `;
                        const thumbnailImg = document.createElement('img');
                        thumbnailImg.src = imageData;
                        thumbnailImg.style.cssText = `
                            width: 100%;
                            height: 100%;
                            object-fit: contain;
                        `;
                        currentThumbnail.appendChild(thumbnailImg);
                        thumbnailContainer.appendChild(currentThumbnail);
                    }
                    
                    // Create PPT slide and add image
                    // PPT 16:9 layout is 10" x 5.625" (960pt x 540pt)
                    // Our slides are 1280x720 pixels, so we maintain aspect ratio
                    const slide = pptx.addSlide();
                    slide.addImage({
                        data: imageData,
                        x: 0,
                        y: 0,
                        w: 10,  // 10 inches wide (full slide width)
                        h: 5.625 // 5.625 inches tall (16:9 aspect ratio)
                    });
                } catch (error) {
                    console.error(`Error capturing slide ${i + 1}:`, error);
                    // Continue with next slide even if one fails
                }
            }

            // Update loading message for final step
            if (loadingText) {
                loadingText.textContent = `Finalising PowerPoint file...`;
            }
        } finally {
            // Remove thumbnail container and current thumbnail
            if (currentThumbnail && currentThumbnail.parentNode) {
                currentThumbnail.parentNode.removeChild(currentThumbnail);
            }
            if (thumbnailContainer && thumbnailContainer.parentNode) {
                thumbnailContainer.parentNode.removeChild(thumbnailContainer);
            }
            
            // Restore UI elements
            if (header) header.style.display = originalHeaderDisplay;
            if (backToTop) backToTop.style.display = originalBackToTopDisplay;
            if (toastContainer) toastContainer.style.display = originalToastDisplay;
        }

        // Save the presentation
        const fileName = `${reportData.reportName.replace(/[^a-z0-9]/gi, '_')}.pptx`;
        await pptx.writeFile({ fileName });

        hideLoading();
        showToast('PowerPoint exported successfully!', 'success');

    } catch (error) {
        console.error('Error exporting to PPT:', error);
        hideLoading();
        showToast('Error exporting to PowerPoint: ' + error.message, 'error');
    }
}

// Export to PDF
function exportToPDF(reportData) {
    try {
        // Hide loading overlay before printing
        hideLoading();
        
        // Use browser's print functionality for PDF export
        const originalTitle = document.title;
        document.title = reportData.reportName;

        // Show all slides for printing
        const slides = document.querySelectorAll('.slide');
        const lastSlide = slides[slides.length - 1];
        
        slides.forEach((slide, index) => {
            slide.style.display = 'flex';
            slide.classList.remove('active');
            // Remove page-break-after from last slide to prevent blank page
            if (slide === lastSlide) {
                slide.style.pageBreakAfter = 'auto';
            }
        });

        // Hide all UI elements that shouldn't be printed
        const header = document.querySelector('.preview-header');
        const backToTop = document.querySelector('.back-to-top');
        const toastContainer = document.getElementById('toast-container');
        const loadingOverlay = document.getElementById('loading-overlay');
        
        if (header) header.style.display = 'none';
        if (backToTop) backToTop.style.display = 'none';
        if (toastContainer) toastContainer.style.display = 'none';
        if (loadingOverlay) loadingOverlay.style.display = 'none';

        // Small delay to ensure styles are applied before print
        setTimeout(() => {
            // Trigger print dialog
            window.print();

            // Restore original state after print dialog closes
            setTimeout(() => {
                document.title = originalTitle;
                slides.forEach((slide, index) => {
                    if (index !== document.querySelector('.slide.active')) {
                        slide.style.display = 'none';
                    }
                    // Restore page-break-after for all slides
                    slide.style.pageBreakAfter = '';
                });
                
                // Restore UI elements
                if (header) header.style.display = '';
                if (backToTop) backToTop.style.display = '';
                if (toastContainer) toastContainer.style.display = '';
                if (loadingOverlay) loadingOverlay.style.display = '';
                
                showToast('PDF export completed. If you saved the file, check your downloads folder.', 'success');
            }, 500);
        }, 100);

    } catch (error) {
        console.error('Error exporting to PDF:', error);
        hideLoading();
        showToast('Error exporting to PDF: ' + error.message, 'error');
    }
}

// Toast and loading functions (shared with upload.js)
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

function showLoading() {
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

