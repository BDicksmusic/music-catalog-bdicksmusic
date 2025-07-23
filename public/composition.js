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

// Enhanced multi-audio player with rollup data
const audioContainer = document.querySelector('.composition-audio-container');
if (audioContainer) {
    const audioFiles = comp.audioFiles || [];
    const hasLegacyAudio = comp.audioLink && !audioFiles.length;
    
    console.log('🎵 Audio debug info:');
    console.log('- audioFiles array:', audioFiles);
    console.log('- audioFiles.length:', audioFiles.length);
    console.log('- legacy audioLink:', comp.audioLink);
    console.log('- hasLegacyAudio:', hasLegacyAudio);
    console.log('- full composition object:', comp);
    
    if (audioFiles.length > 0 || hasLegacyAudio) {
        let audioPlayersHtml = '';
        
        // Handle new relational audio files
        if (audioFiles.length > 0) {
            audioPlayersHtml = audioFiles.map((audioFile, index) => {
                const displayName = audioFile.title || extractDisplayName(audioFile.url);
                
                let metadataHtml = '';
                if (audioFile.performanceBy || audioFile.recordingDate) {
                    metadataHtml = `
                        <div class="composition-audio-metadata">
                            ${audioFile.performanceBy ? `<div class="performance-info">Performed by: ${audioFile.performanceBy}</div>` : ''}
                            ${audioFile.recordingDate ? `<div>Recorded: ${formatDate(audioFile.recordingDate)}</div>` : ''}
                        </div>
                    `;
                }
                
                return `
                    <div class="composition-audio-player" data-audio-index="${index}">
                        <div class="composition-audio-title">
                            🎵 ${displayName}
                            ${audioFiles.length > 1 ? `<span class="audio-counter">(${index + 1}/${audioFiles.length})</span>` : ''}
                        </div>
                        ${metadataHtml}
                        <audio controls preload="metadata" data-audio-id="${audioFile.id}">
                            <source src="${audioFile.url}" type="audio/mpeg">
                            <source src="${audioFile.url}" type="audio/mp4">
                            <source src="${audioFile.url}" type="audio/wav">
                            <source src="${audioFile.url}" type="audio/ogg">
                            Your browser does not support the audio element.
                        </audio>
                        ${audioFile.duration ? `<div class="audio-duration">Duration: ${audioFile.duration}</div>` : ''}
                    </div>
                `;
            }).join('');
        }
        // Handle legacy single audio link
        else if (hasLegacyAudio) {
            const displayName = extractDisplayName(comp.audioLink);
            
            let metadataHtml = '';
            if (comp.performanceBy || comp.recordingDate) {
                metadataHtml = `
                    <div class="composition-audio-metadata">
                        ${comp.performanceBy ? `<div class="performance-info">Performed by: ${comp.performanceBy}</div>` : ''}
                        ${comp.recordingDate ? `<div>Recorded: ${comp.recordingDate}</div>` : ''}
                    </div>
                `;
            }
            
            audioPlayersHtml = `
                <div class="composition-audio-player">
                    <div class="composition-audio-title">🎵 ${displayName}</div>
                    ${metadataHtml}
                    <audio controls preload="metadata">
                        <source src="${comp.audioLink}" type="audio/mpeg">
                        <source src="${comp.audioLink}" type="audio/mp4">
                        <source src="${comp.audioLink}" type="audio/wav">
                        <source src="${comp.audioLink}" type="audio/ogg">
                        Your browser does not support the audio element.
                    </audio>
                </div>
            `;
        }
        
        audioContainer.innerHTML = audioPlayersHtml;
        
        // Add audio player controls for multiple files
        if (audioFiles.length > 1) {
            addMultiAudioControls(audioContainer);
        }
    } else {
        audioContainer.style.display = 'none';
    }
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

    // Enhanced video display with multiple videos
    const videoContainer = document.querySelector('.composition-video-container');
    if (videoContainer) {
        const videoFiles = comp.videoFiles || [];
        
        if (videoFiles.length > 0) {
            const videosHtml = videoFiles.map((videoFile, index) => {
                const displayName = videoFile.title || extractDisplayName(videoFile.url);
                
                let metadataHtml = '';
                if (videoFile.performanceBy || videoFile.recordingDate) {
                    metadataHtml = `
                        <div class="composition-video-metadata">
                            ${videoFile.performanceBy ? `<div class="performance-info">Performed by: ${videoFile.performanceBy}</div>` : ''}
                            ${videoFile.recordingDate ? `<div>Recorded: ${formatDate(videoFile.recordingDate)}</div>` : ''}
                        </div>
                    `;
                }
                
                return `
                    <div class="composition-video-player" data-video-index="${index}">
                        <div class="composition-video-title">
                            🎬 ${displayName}
                            ${videoFiles.length > 1 ? `<span class="video-counter">(${index + 1}/${videoFiles.length})</span>` : ''}
                        </div>
                        ${metadataHtml}
                        <video controls preload="metadata" data-video-id="${videoFile.id}">
                            <source src="${videoFile.url}" type="video/mp4">
                            <source src="${videoFile.url}" type="video/webm">
                            <source src="${videoFile.url}" type="video/ogg">
                            Your browser does not support the video element.
                        </video>
                        ${videoFile.duration ? `<div class="video-duration">Duration: ${videoFile.duration}</div>` : ''}
                    </div>
                `;
            }).join('');
            
            videoContainer.innerHTML = videosHtml;
            videoContainer.style.display = 'block';
        } else {
            videoContainer.style.display = 'none';
        }
    }

    // Enhanced PDF Score Viewer with multiple scores support
    const scoreCarouselContainer = document.querySelector('.score-carousel-container');
    const scoreFiles = comp.scoreFiles || [];
    const hasLegacyScore = comp.scoreLink && !scoreFiles.length;
    
    if (scoreCarouselContainer && (scoreFiles.length > 0 || hasLegacyScore)) {
        // Use first available score (relational or legacy)
        const scoreUrl = scoreFiles.length > 0 ? scoreFiles[0].url : comp.scoreLink;
        console.log('Score PDF link:', scoreUrl);
        scoreCarouselContainer.innerHTML = `
            <div class="spread-score-viewer">
                <div class="score-container">
                    <div class="score-iframe-container">
                        <iframe 
                            id="score-iframe"
                            src="/pdfjs/web/viewer.html?file=${encodeURIComponent(scoreUrl)}#page=1&zoom=page-fit&toolbar=0&navpanes=0&spreadModeOnLoad=2&scrollModeOnLoad=0"
                            width="100%"
                            height="700px"
                            style="border: none; border-radius: 8px;">
                        </iframe>
                    </div>
                    <div class="score-navigation-bottom">
                        <button class="score-nav-btn prev-btn" id="score-prev">
                            <span class="nav-icon">←</span>
                            <span class="nav-text">Previous Spread</span>
                        </button>
                        <span class="score-page-info" id="score-page-info">Pages 1-2 of ?</span>
                        <button class="score-nav-btn next-btn" id="score-next">
                            <span class="nav-text">Next Spread</span>
                            <span class="nav-icon">→</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize spread PDF navigation (2-page spread view)
        initSimplePDFNavigation(scoreUrl);
    }
}

// Spread PDF Navigation Implementation
let currentSpread = 1;
let totalPages = 0;
let scoreIframe = null;

function initSimplePDFNavigation(pdfUrl) {
    console.log('🔄 Initializing spread PDF navigation (17x11 two-page layout) for:', pdfUrl);
    
    /*
     * PDF.js URL Parameters for Spread View:
     * - zoom=page-fit: Fits pages to viewport
     * - toolbar=0: Hides PDF.js toolbar
     * - navpanes=0: Hides navigation panes
     * - spreadModeOnLoad=2: Forces spread mode (2 pages side by side)
     * - scrollModeOnLoad=0: Page scrolling mode (not horizontal)
     */
    
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
    
    // Set up spread navigation buttons
    setupSimpleNavigation();
}

function setupSimpleNavigation() {
    const prevBtn = document.getElementById('score-prev');
    const nextBtn = document.getElementById('score-next');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentSpread > 1) {
                goToSpread(currentSpread - 1);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const maxSpreads = Math.ceil(totalPages / 2);
            if (currentSpread < maxSpreads) {
                goToSpread(currentSpread + 1);
            }
        });
    }
    
    // Add keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            const maxSpreads = Math.ceil(totalPages / 2);
            if (e.key === 'ArrowLeft' && currentSpread > 1) {
                e.preventDefault();
                goToSpread(currentSpread - 1);
            } else if (e.key === 'ArrowRight' && currentSpread < maxSpreads) {
                e.preventDefault();
                goToSpread(currentSpread + 1);
            }
        }
    });
}

function goToSpread(spreadNumber) {
    const maxSpreads = Math.ceil(totalPages / 2);
    if (spreadNumber < 1 || (totalPages !== 999 && spreadNumber > maxSpreads)) {
        return;
    }
    
    currentSpread = spreadNumber;
    
    // Calculate the starting page for this spread
    // Spread 1: pages 1-2, Spread 2: pages 3-4, etc.
    const startPage = (spreadNumber - 1) * 2 + 1;
    
    // Update iframe src with new spread
    const baseUrl = scoreIframe.src.split('#')[0];
    scoreIframe.src = `${baseUrl}#page=${startPage}&zoom=page-fit&toolbar=0&navpanes=0&spreadModeOnLoad=2&scrollModeOnLoad=0`;
    
    updatePageInfo();
    updateNavigationButtons();
    
    console.log(`📖 Navigated to spread ${spreadNumber} (pages ${startPage}-${startPage + 1})`);
}

function updatePageInfo() {
    const pageInfo = document.getElementById('score-page-info');
    if (pageInfo) {
        const startPage = (currentSpread - 1) * 2 + 1;
        const endPage = Math.min(startPage + 1, totalPages);
        
        if (totalPages === 999) {
            pageInfo.textContent = `Pages ${startPage}-${endPage}`;
        } else {
            pageInfo.textContent = `Pages ${startPage}-${endPage} of ${totalPages}`;
        }
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('score-prev');
    const nextBtn = document.getElementById('score-next');
    const maxSpreads = Math.ceil(totalPages / 2);
    
    if (prevBtn) {
        prevBtn.disabled = currentSpread <= 1;
        prevBtn.style.opacity = currentSpread <= 1 ? '0.5' : '1';
    }
    
    if (nextBtn) {
        nextBtn.disabled = totalPages !== 999 && currentSpread >= maxSpreads;
        nextBtn.style.opacity = (totalPages !== 999 && currentSpread >= maxSpreads) ? '0.5' : '1';
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

// ===== UTILITY FUNCTIONS FOR ENHANCED MEDIA =====

// Extract display name from file URL
function extractDisplayName(url) {
    if (!url) return 'Unknown';
    const fileName = url.split('/').pop().replace(/\.[^/.]+$/, "");
    return fileName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Add controls for multiple audio files
function addMultiAudioControls(audioContainer) {
    const audioPlayers = audioContainer.querySelectorAll('audio');
    
    // Pause all other players when one starts playing
    audioPlayers.forEach((player, index) => {
        player.addEventListener('play', () => {
            audioPlayers.forEach((otherPlayer, otherIndex) => {
                if (otherIndex !== index && !otherPlayer.paused) {
                    otherPlayer.pause();
                }
            });
        });
    });
    
    // Add navigation controls if more than one audio file
    if (audioPlayers.length > 1) {
        const controlsHtml = `
            <div class="multi-audio-controls">
                <button class="audio-nav-btn" onclick="previousAudio()">⏮ Previous</button>
                <span class="audio-nav-info">Multiple recordings available</span>
                <button class="audio-nav-btn" onclick="nextAudio()">Next ⏭</button>
            </div>
        `;
        audioContainer.insertAdjacentHTML('afterend', controlsHtml);
    }
}

// Navigation functions for multiple audio files
let currentAudioIndex = 0;

function previousAudio() {
    const audioPlayers = document.querySelectorAll('.composition-audio-player');
    if (audioPlayers.length <= 1) return;
    
    audioPlayers[currentAudioIndex].style.display = 'none';
    currentAudioIndex = currentAudioIndex > 0 ? currentAudioIndex - 1 : audioPlayers.length - 1;
    audioPlayers[currentAudioIndex].style.display = 'block';
    
    // Pause current and start new one
    const newPlayer = audioPlayers[currentAudioIndex].querySelector('audio');
    if (newPlayer) newPlayer.play();
}

function nextAudio() {
    const audioPlayers = document.querySelectorAll('.composition-audio-player');
    if (audioPlayers.length <= 1) return;
    
    audioPlayers[currentAudioIndex].style.display = 'none';
    currentAudioIndex = currentAudioIndex < audioPlayers.length - 1 ? currentAudioIndex + 1 : 0;
    audioPlayers[currentAudioIndex].style.display = 'block';
    
    // Pause current and start new one
    const newPlayer = audioPlayers[currentAudioIndex].querySelector('audio');
    if (newPlayer) newPlayer.play();
}

// Initialize when DOM is ready
// Call both loadCompositions and loadCompositionDetail after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing composition detail page...');
    loadCompositions();
    loadCompositionDetail();
});