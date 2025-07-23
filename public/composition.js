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

    // Simple PDF Score Viewer with Carousel Navigation
    const scoreCarouselContainer = document.querySelector('.score-carousel-container');
    if (scoreCarouselContainer && comp.scoreLink) {
        console.log('Score PDF link:', comp.scoreLink);
        scoreCarouselContainer.innerHTML = `
            <div class="simple-score-viewer">
                <div class="score-container">
                    <div class="score-navigation-top">
                        <button class="score-nav-btn prev-btn" id="score-prev">‹ Previous Page</button>
                        <span class="score-page-info" id="score-page-info">Page 1 of ?</span>
                        <button class="score-nav-btn next-btn" id="score-next">Next Page ›</button>
                    </div>
                    <div class="score-iframe-container">
                        <iframe 
                            id="score-iframe"
                            src="/pdfjs/web/viewer.html?file=${encodeURIComponent(comp.scoreLink)}#page=1&zoom=page-fit&toolbar=0&navpanes=0"
                            width="100%"
                            height="700px"
                            style="border: none; border-radius: 8px;">
                        </iframe>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize simple PDF navigation
        initSimplePDFNavigation(comp.scoreLink);
    }
}

// Simple PDF Navigation Implementation
let currentPage = 1;
let totalPages = 0;
let scoreIframe = null;

function initSimplePDFNavigation(pdfUrl) {
    console.log('🔄 Initializing simple PDF navigation for:', pdfUrl);
    
    scoreIframe = document.getElementById('score-iframe');
    
    if (!scoreIframe) {
        console.error('❌ Score iframe not found');
        return;
    }
    
    // Wait for iframe to load, then get total pages
    scoreIframe.addEventListener('load', () => {
        console.log('✅ PDF iframe loaded');
        
        // Try to get page count from PDF.js viewer
        setTimeout(() => {
            try {
                const iframeWindow = scoreIframe.contentWindow;
                if (iframeWindow && iframeWindow.PDFViewerApplication) {
                    totalPages = iframeWindow.PDFViewerApplication.pagesCount;
                    console.log(`📄 Total pages: ${totalPages}`);
                    updatePageInfo();
                    updateNavigationButtons();
                } else {
                    // Fallback: estimate based on PDF or just enable navigation
                    console.log('⚠️ Could not get page count, enabling navigation anyway');
                    totalPages = 999; // Large number to allow navigation
                    updatePageInfo();
                    updateNavigationButtons();
                }
            } catch (error) {
                console.log('⚠️ Cannot access iframe content, enabling navigation anyway');
                totalPages = 999;
                updatePageInfo();
                updateNavigationButtons();
            }
        }, 1000);
    });
    
    // Set up navigation buttons
    setupSimpleNavigation();
}

function setupSimpleNavigation() {
    const prevBtn = document.getElementById('score-prev');
    const nextBtn = document.getElementById('score-next');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                goToPage(currentPage - 1);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                goToPage(currentPage + 1);
            }
        });
    }
    
    // Add keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            if (e.key === 'ArrowLeft' && currentPage > 1) {
                e.preventDefault();
                goToPage(currentPage - 1);
            } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
                e.preventDefault();
                goToPage(currentPage + 1);
            }
        }
    });
}

function goToPage(pageNumber) {
    if (pageNumber < 1 || (totalPages !== 999 && pageNumber > totalPages)) {
        return;
    }
    
    currentPage = pageNumber;
    
    // Update iframe src with new page
    const baseUrl = scoreIframe.src.split('#')[0];
    scoreIframe.src = `${baseUrl}#page=${pageNumber}&zoom=page-fit&toolbar=0&navpanes=0`;
    
    updatePageInfo();
    updateNavigationButtons();
    
    console.log(`📖 Navigated to page ${pageNumber}`);
}

function updatePageInfo() {
    const pageInfo = document.getElementById('score-page-info');
    if (pageInfo) {
        if (totalPages === 999) {
            pageInfo.textContent = `Page ${currentPage}`;
        } else {
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        }
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('score-prev');
    const nextBtn = document.getElementById('score-next');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
        prevBtn.style.opacity = currentPage <= 1 ? '0.5' : '1';
    }
    
    if (nextBtn) {
        nextBtn.disabled = totalPages !== 999 && currentPage >= totalPages;
        nextBtn.style.opacity = (totalPages !== 999 && currentPage >= totalPages) ? '0.5' : '1';
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