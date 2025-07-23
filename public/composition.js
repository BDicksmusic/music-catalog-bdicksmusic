// composition.js

// Dummy renderCarousel to prevent errors (remove or replace with real implementation)
function renderCarousel(compositions) {
    // For now, just log the compositions
    console.log('renderCarousel called with:', compositions);
}

// Example Data for Local Testing (copied from index.html)
const exampleCompositions = [
  {
    id: "1",
    slug: "sunrise-fanfare",
    title: "Sunrise Fanfare",
    instrumentation: "Brass Quintet",
    year: 2022,
    duration: "4:30",
    difficulty: "Medium",
    description: "A bright, energetic piece for brass quintet.",
    tags: ["brass", "fanfare", "modern"],
    coverImage: "/imgs/Coming Home (Cover Photo).png",
    paymentLink: "",
    stripeProductId: "",
    stripePriceId: "",
    price: 20
  },
  {
    id: "2",
    slug: "nocturne-in-blue",
    title: "Nocturne in Blue",
    instrumentation: "Solo Piano",
    year: 2021,
    duration: "6:00",
    difficulty: "Hard",
    description: "A reflective nocturne for solo piano.",
    tags: ["piano", "nocturne", "contemporary"],
    coverImage: "/imgs/Coming Home (Cover Photo).png",
    paymentLink: "",
    stripeProductId: "",
    stripePriceId: "",
    price: 15
  },
  // ... rest of your example compositions data ...
];

// Fetch all compositions
async function loadCompositions() {
    const response = await fetch('/api/compositions');
    const data = await response.json();
    const allCompositions = data.compositions;
    // Filter for popular
    const popularCompositions = allCompositions.filter(comp => comp.popular);
    // Now use popularCompositions for your carousel
    renderCarousel(popularCompositions);
}

function getSlugFromUrl() {
    // Extract slug from pathname for pretty URLs like /composition/slug-name
    const pathMatch = window.location.pathname.match(/^\/composition\/([^/?#]+)/);
    if (pathMatch && pathMatch[1]) {
        console.log('Found slug in path:', pathMatch[1]);
        return pathMatch[1];
    }
    // Fallback: try query param
    const params = new URLSearchParams(window.location.search);
    if (params.has('slug')) {
        console.log('Found slug in query params:', params.get('slug'));
        return params.get('slug');
    }
    console.log('No slug found in URL');
    return null;
}

async function loadCompositionDetail() {
    const slug = getSlugFromUrl();
    console.log('Loading composition with slug:', slug);
    const container = document.getElementById('composition-info');
    if (!slug) {
        if (container) {
            container.innerHTML = '<div class="error">No composition specified.</div>';
        }
        return;
    }
    // Show loading state
    if (container) {
        container.innerHTML = '<div class="loading">Loading composition...</div>';
    }
    try {
        // Try API first
        const response = await fetch(`/api/compositions/slug/${encodeURIComponent(slug)}`);
        const data = await response.json();
        console.log('API response:', data);
        if (data.success && data.composition) {
            renderComposition(data.composition);
        } else {
            // Fallback to example data
            console.log('API failed, trying example data...');
            const comp = exampleCompositions.find(c => c.slug === slug);
            if (comp) {
                renderComposition(comp);
            } else {
                if (container) {
                    container.innerHTML = '<div class="error">Composition not found.</div>';
                }
            }
        }
    } catch (err) {
        console.error('Error loading composition:', err);
        // Fallback to example data
        const comp = exampleCompositions.find(c => c.slug === slug);
        if (comp) {
            console.log('Using fallback example data');
            renderComposition(comp);
        } else {
            if (container) {
                container.innerHTML = '<div class="error">Error loading composition details.</div>';
            }
        }
    }
}

function renderComposition(comp) {
    // Update cover image
    const coverImg = document.getElementById('composition-cover');
    if (coverImg && comp.coverImage) {
        coverImg.src = comp.coverImage;
        coverImg.alt = comp.title;
    }

    // Title
    const titleContainer = document.querySelector('.composition-title-container');
    if (titleContainer) {
        titleContainer.innerHTML = `<h1 class="composition-title">${comp.title || 'Untitled'}</h1>`;
    }

    // Instrument
    const instrumentContainer = document.querySelector('.composition-instrument-container');
    if (instrumentContainer) {
        instrumentContainer.innerHTML = `<div class="composition-instrument">${comp.instrumentation || 'Unknown'}</div>`;
    }


    const metaContainer = document.querySelector('.composition-meta-container');
    if (metaContainer) {
        metaContainer.innerHTML = `
            <div class="composition-meta">
                ${comp.year ? `<span>Year: ${comp.year}</span>` : ''}
                ${comp.duration ? `<span>Duration: ${comp.duration}</span>` : ''}
                ${comp.difficulty ? `<span>Difficulty: ${comp.difficulty}</span>` : ''}
            </div>
        `;
    }
    
    const buyContainer = document.querySelector('.composition-buy-container');
    if (buyContainer) {
        buyContainer.innerHTML = comp.paymentLink || comp.stripePriceId ? 
            `<button class="composition-buy-btn" onclick="purchaseComposition('${comp.id}', '${comp.title.replace(/'/g, "\\'")}', ${comp.price || 10})">
                💳 Buy Now - $${comp.price || 10}
            </button>` : 
            `<button class="composition-buy-btn btn-disabled" onclick="showUnavailableMessage('${comp.title.replace(/'/g, "\\'")}')">
                🚫 Currently Not Available
            </button>`;
    }

const linksContainer = document.querySelector('.composition-links-container');
if (linksContainer) {
    linksContainer.innerHTML = `
        ${comp.audioLink ? `<a href="${comp.audioLink}" target="_blank" class="btn-secondary">🎵 Listen</a>` : ''}
        ${comp.scoreLink ? `<a href="${comp.scoreLink}" target="_blank" class="btn-secondary">📄 View Score</a>` : ''}
    `;
}

const shortInstrContainer = document.querySelector('.composition-short-instrument-container');
if (shortInstrContainer && comp.shortInstrumentList) {
    shortInstrContainer.innerHTML = `<div class="short-instrument-list"><strong>Short Instrument List:</strong> ${comp.shortInstrumentList}</div>`;
}


// Program Notes
const notesContainer = document.querySelector('.composition-notes-container');
let notesHtml = '';
if (comp.programNotes) {
    notesHtml += `
        <section class="composition-program-notes">
            <h3>Program Notes</h3>
            <div class="program-notes-content">${comp.programNotes}</div>
        </section>
    `;
}
if (notesContainer) {
    notesContainer.innerHTML = notesHtml;
}

// Performance Notes
const perfContainer = document.querySelector('.composition-performance-container');
let perfHtml = '';
if (comp.performanceNotes) {
    // Convert markdown-style dashes to HTML list
    const formattedNotes = comp.performanceNotes
        .split('- ')
        .filter(item => item.trim()) // Remove empty items
        .map(item => `<li>${item.trim()}</li>`)
        .join('');
    
    perfHtml += `
        <section class="composition-performance-notes">
            <h3>Performance Notes</h3>
            <div class="performance-notes-content">
                <ul class="performance-notes-list">
                    ${formattedNotes}
                </ul>
            </div>
        </section>
    `;
}
if (perfContainer) {
    perfContainer.innerHTML = perfHtml;
}

    // Enhanced Score PDF Viewer
    const scoreCarouselContainer = document.querySelector('.score-carousel-container');
    if (scoreCarouselContainer && comp.scoreLink) {
        console.log('Score PDF link:', comp.scoreLink);
        scoreCarouselContainer.innerHTML = `
            <div class="enhanced-score-viewer">
                <div class="score-viewer-container">
                    <div class="score-pages-display" id="score-pages-display">
                        <!-- PDF pages will be rendered here -->
                    </div>
                    <div class="score-navigation">
                        <button class="nav-btn prev-btn" id="prev-pages">‹ Previous</button>
                        <span class="page-info" id="page-info">Pages 1-2 of ?</span>
                        <button class="nav-btn next-btn" id="next-pages">Next ›</button>
                    </div>
                </div>
                <div class="score-thumbnails" id="score-thumbnails">
                    <!-- Thumbnail navigation will be generated here -->
                </div>
            </div>
        `;
        
        // Initialize the enhanced PDF viewer
        initEnhancedPDFViewer(comp.scoreLink);
    }
}

// Enhanced PDF Viewer Implementation
let pdfDoc = null;
let currentPagePair = 1; // Starting with pages 1-2
let totalPages = 0;
let pageScale = 1.2;

async function initEnhancedPDFViewer(pdfUrl) {
    try {
        console.log('🔄 Loading PDF:', pdfUrl);
        
        // Load PDF.js if not already loaded
        if (!window.pdfjsLib) {
            await loadPDFJS();
        }
        
        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        pdfDoc = await loadingTask.promise;
        totalPages = pdfDoc.numPages;
        
        console.log(`✅ PDF loaded: ${totalPages} pages`);
        
        // Render initial pages (1-2)
        await renderPagePair(currentPagePair);
        
        // Generate thumbnails
        await generateThumbnails();
        
        // Set up navigation
        setupPDFNavigation();
        
        // Set up scroll navigation
        setupScrollNavigation();
        
    } catch (error) {
        console.error('❌ Error loading PDF:', error);
        const container = document.getElementById('score-pages-display');
        if (container) {
            container.innerHTML = `
                <div class="pdf-error">
                    <h3>Unable to load score</h3>
                    <p>Please try refreshing the page or contact support.</p>
                    <a href="${pdfUrl}" target="_blank" class="btn-primary">Open PDF in New Tab</a>
                </div>
            `;
        }
    }
}

async function loadPDFJS() {
    return new Promise((resolve, reject) => {
        if (window.pdfjsLib) {
            resolve();
            return;
        }
        
        // Try to load PDF.js as ES module
        import('/pdfjs/build/pdf.mjs').then((pdfjsLib) => {
            window.pdfjsLib = pdfjsLib;
            // Set worker source
            pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/build/pdf.worker.mjs';
            resolve();
        }).catch(() => {
            // Fallback to script tag method
            const script = document.createElement('script');
            script.src = '/pdfjs/build/pdf.mjs';
            script.type = 'module';
            script.onload = () => {
                // Set worker source
                if (window.pdfjsLib) {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/build/pdf.worker.mjs';
                }
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    });
}

async function renderPagePair(pairNumber) {
    if (!pdfDoc) return;
    
    const container = document.getElementById('score-pages-display');
    if (!container) return;
    
    // Calculate which pages to show
    const leftPageNum = (pairNumber - 1) * 2 + 1;
    const rightPageNum = leftPageNum + 1;
    
    console.log(`🔄 Rendering pages ${leftPageNum}-${rightPageNum}`);
    
    container.innerHTML = '<div class="loading-pages">Loading pages...</div>';
    
    try {
        const pagesHtml = [];
        
        // Render left page
        if (leftPageNum <= totalPages) {
            const leftPageCanvas = await renderSinglePage(leftPageNum);
            pagesHtml.push(`
                <div class="score-page left-page">
                    <div class="page-number">Page ${leftPageNum}</div>
                    ${leftPageCanvas.outerHTML}
                </div>
            `);
        }
        
        // Render right page
        if (rightPageNum <= totalPages) {
            const rightPageCanvas = await renderSinglePage(rightPageNum);
            pagesHtml.push(`
                <div class="score-page right-page">
                    <div class="page-number">Page ${rightPageNum}</div>
                    ${rightPageCanvas.outerHTML}
                </div>
            `);
        }
        
        container.innerHTML = `
            <div class="pages-container">
                ${pagesHtml.join('')}
            </div>
        `;
        
        // Update page info
        const pageInfo = document.getElementById('page-info');
        if (pageInfo) {
            const endPage = Math.min(rightPageNum, totalPages);
            pageInfo.textContent = `Pages ${leftPageNum}${endPage > leftPageNum ? `-${endPage}` : ''} of ${totalPages}`;
        }
        
        // Update navigation buttons
        updateNavigationButtons();
        
    } catch (error) {
        console.error('❌ Error rendering pages:', error);
        container.innerHTML = '<div class="pdf-error">Error rendering pages</div>';
    }
}

async function renderSinglePage(pageNumber) {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: pageScale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };
    
    await page.render(renderContext).promise;
    return canvas;
}

async function generateThumbnails() {
    const thumbnailsContainer = document.getElementById('score-thumbnails');
    if (!thumbnailsContainer || !pdfDoc) return;
    
    console.log('🖼️ Generating thumbnails...');
    
    const thumbnailsHtml = [];
    const maxPairs = Math.ceil(totalPages / 2);
    
    for (let pairNum = 1; pairNum <= maxPairs; pairNum++) {
        const leftPageNum = (pairNum - 1) * 2 + 1;
        const rightPageNum = leftPageNum + 1;
        
        try {
            // Generate thumbnail for the pair
            const leftThumb = await renderThumbnail(leftPageNum);
            const rightThumb = rightPageNum <= totalPages ? await renderThumbnail(rightPageNum) : null;
            
            thumbnailsHtml.push(`
                <div class="thumbnail-pair ${pairNum === currentPagePair ? 'active' : ''}" 
                     data-pair="${pairNum}" 
                     onclick="goToPagePair(${pairNum})">
                    <div class="thumb-pages">
                        ${leftThumb.outerHTML}
                        ${rightThumb ? rightThumb.outerHTML : '<div class="empty-page"></div>'}
                    </div>
                    <div class="thumb-label">
                        ${leftPageNum}${rightThumb ? `-${rightPageNum}` : ''}
                    </div>
                </div>
            `);
        } catch (error) {
            console.error(`Error generating thumbnail for pair ${pairNum}:`, error);
        }
    }
    
    thumbnailsContainer.innerHTML = `
        <div class="thumbnails-scroll">
            ${thumbnailsHtml.join('')}
        </div>
    `;
}

async function renderThumbnail(pageNumber) {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 0.2 }); // Small scale for thumbnails
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    canvas.className = 'thumbnail-canvas';
    
    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };
    
    await page.render(renderContext).promise;
    return canvas;
}

function setupPDFNavigation() {
    const prevBtn = document.getElementById('prev-pages');
    const nextBtn = document.getElementById('next-pages');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPagePair > 1) {
                goToPagePair(currentPagePair - 1);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const maxPairs = Math.ceil(totalPages / 2);
            if (currentPagePair < maxPairs) {
                goToPagePair(currentPagePair + 1);
            }
        });
    }
}

function setupScrollNavigation() {
    const container = document.querySelector('.enhanced-score-viewer');
    if (!container) return;
    
    let scrollTimeout;
    
    container.addEventListener('wheel', (e) => {
        // Clear existing timeout
        clearTimeout(scrollTimeout);
        
        // Prevent default scrolling
        e.preventDefault();
        
        // Set timeout to handle scroll after user stops scrolling
        scrollTimeout = setTimeout(() => {
            const maxPairs = Math.ceil(totalPages / 2);
            
            if (e.deltaY > 0 && currentPagePair < maxPairs) {
                // Scroll down - next pages
                goToPagePair(currentPagePair + 1);
            } else if (e.deltaY < 0 && currentPagePair > 1) {
                // Scroll up - previous pages
                goToPagePair(currentPagePair - 1);
            }
        }, 150); // Small delay to prevent too rapid navigation
    });
}

async function goToPagePair(pairNumber) {
    const maxPairs = Math.ceil(totalPages / 2);
    if (pairNumber < 1 || pairNumber > maxPairs) return;
    
    currentPagePair = pairNumber;
    await renderPagePair(currentPagePair);
    
    // Update thumbnail selection
    document.querySelectorAll('.thumbnail-pair').forEach(thumb => {
        thumb.classList.remove('active');
    });
    
    const activeThumb = document.querySelector(`[data-pair="${pairNumber}"]`);
    if (activeThumb) {
        activeThumb.classList.add('active');
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-pages');
    const nextBtn = document.getElementById('next-pages');
    const maxPairs = Math.ceil(totalPages / 2);
    
    if (prevBtn) {
        prevBtn.disabled = currentPagePair <= 1;
        prevBtn.style.opacity = currentPagePair <= 1 ? '0.5' : '1';
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPagePair >= maxPairs;
        nextBtn.style.opacity = currentPagePair >= maxPairs ? '0.5' : '1';
    }
}

// Purchase function for Stripe integration
async function purchaseComposition(compositionId, title, price) {
    try {
        // Remove the confirm() and always proceed
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ compositionId: compositionId })
        });
        const data = await response.json();
        if (data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
        } else {
            alert('Error creating checkout session. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error processing purchase. Please try again.');
    }
}

// Initialize when DOM is ready
// Call both loadCompositions and loadCompositionDetail after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing composition detail page...');
    loadCompositions();
    loadCompositionDetail();
});