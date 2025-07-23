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
    // Check if score is available (same logic as score carousel)
    const scoreFiles = comp.scoreFiles || [];
    const hasLegacyScore = comp.scoreLink && !scoreFiles.length;
    const hasScore = scoreFiles.length > 0 || hasLegacyScore;
    
    linksContainer.innerHTML = `
        ${comp.audioLink ? `<a href="${comp.audioLink}" target="_blank" class="btn-secondary">🎵 Listen</a>` : ''}
        ${hasScore ? `<button onclick="scrollToScore()" class="btn-secondary">📄 View Score</button>` : ''}
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
    
    // Movement-specific debug info
    if (audioFiles.length > 0) {
        console.log('🎼 Movement analysis:');
        audioFiles.forEach((audioFile, index) => {
            console.log(`  File ${index + 1}:`, {
                title: audioFile.title,
                movementTitle: audioFile.movementTitle,
                numberOfMovements: audioFile.numberOfMovements,
                shouldShow: audioFile.numberOfMovements > 1 || audioFile.movementTitle
            });
        });
    }
    
    if (audioFiles.length > 0 || hasLegacyAudio) {
        // Detect if this is a multi-movement composition
        const hasMovements = audioFiles.some(file => file.numberOfMovements > 1 || file.movementTitle);
        const isMultiMovement = hasMovements && audioFiles.length > 1;
        
        console.log('🎼 Composition analysis:', {
            hasMovements,
            isMultiMovement,
            totalFiles: audioFiles.length
        });
        
        // Add classes to container for styling
        audioContainer.className = `composition-audio-container ${hasMovements ? 'has-movements' : 'single-composition'} ${isMultiMovement ? 'multi-movement' : ''}`;
        
        let audioPlayersHtml = '';
        
        // Handle new relational audio files
        if (audioFiles.length > 0) {
            // Sort files by movement order (Roman numerals or numbers) with error handling
            try {
                audioFiles.sort((a, b) => {
                    try {
                        const orderA = extractMovementOrder(a.title);
                        const orderB = extractMovementOrder(b.title);
                        return orderA - orderB;
                    } catch (error) {
                        console.error('Error sorting audio files:', error);
                        return 0; // Keep original order if sorting fails
                    }
                });

                // Debug: Log movement analysis for sorted files
                console.log('🎵 Movement Analysis (sorted):');
                audioFiles.forEach((file, index) => {
                    try {
                        const order = extractMovementOrder(file.title);
                        const extractedTitle = extractMovementTitle(file.title);
                        console.log(`  ${index + 1}. Order: ${order}, Extracted: "${extractedTitle}" from "${file.title}"`);
                    } catch (error) {
                        console.log(`  ${index + 1}. Error processing: "${file.title}"`);
                    }
                });
            } catch (error) {
                console.error('Error in sorting process:', error);
                // Continue without sorting if there's an error
            }

            audioPlayersHtml = audioFiles.map((audioFile, index) => {
                // Simple approach: just show extracted movement titles
                let displayTitle = '';
                let shouldShowTitle = false;
                
                // Try to extract title from filename
                try {
                    const extractedTitle = extractMovementTitle(audioFile.title);
                    
                    if (extractedTitle && extractedTitle.length > 0) {
                        displayTitle = extractedTitle;
                        shouldShowTitle = true;
                        // Don't add Roman numeral prefix since API titles already contain them
                    }
                } catch (error) {
                    console.error('Error processing movement title:', error);
                    shouldShowTitle = false;
                }
                
                let titleHtml = '';
                if (shouldShowTitle) {
                    titleHtml = `
                        <div class="composition-audio-title movement-title">
                            🎵 ${displayTitle}
                        </div>
                    `;
                }
                // If no movement title to show, leave titleHtml empty (hidden by default)
                
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
                    <div class="composition-audio-player" data-audio-index="${index}" data-is-movement="${shouldShowTitle}">
                        ${titleHtml}
                        ${metadataHtml}
                        <audio controls preload="metadata" data-audio-id="${audioFile.id}">
                            <source src="${audioFile.url}" type="audio/mpeg">
                            <source src="${audioFile.url}" type="audio/mp4">
                            <source src="${audioFile.url}" type="audio/wav">
                            <source src="${audioFile.url}" type="audio/ogg">
                            Your browser does not support the audio element.
                        </audio>
                        ${audioFile.duration ? `<div class="audio-duration">Duration: ${audioFile.duration}</div>` : ''}
                        ${audioFiles.length > 1 ? `
                        <div class="audio-nav-divider"></div>
                        <div class="audio-nav-container">
                            <button class="audio-nav-btn" onclick="previousAudio()" id="prevAudioBtn">⏮ Previous</button>
                            <span class="audio-nav-info" id="audioNavInfo">Movement ${index + 1} of ${audioFiles.length}</span>
                            <button class="audio-nav-btn" onclick="nextAudio()" id="nextAudioBtn">Next ⏭</button>
                        </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        }
        // Handle legacy single audio link
        else if (hasLegacyAudio) {
            // Legacy audio - no movement data available, so hide title by default
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
                <div class="composition-audio-player legacy-audio" data-is-movement="false">
                    <!-- Title hidden by default for legacy audio (no movement data) -->
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
        
        // Reset audio index for new composition
        currentAudioIndex = 0;
        
        // Check if this should be treated as a multi-movement composition
        const compositionTitle = document.querySelector('.composition-title h1')?.textContent || '';
        const mightHaveMovements = /suite|symphony|sonata|concerto|movements?/i.test(compositionTitle);
        
        // Force multi-movement treatment for known compositions
        if (audioFiles.length === 1 && mightHaveMovements) {
            console.log('🎵 Single file detected for composition that might have movements');
            // Add a temporary message
            const tempMessage = document.createElement('div');
            tempMessage.style.cssText = 'padding: 10px; margin: 10px 0; background: #f0f8ff; border-left: 4px solid #4a90e2; border-radius: 4px; font-size: 0.9em; color: #2c5282;';
            tempMessage.innerHTML = '🎵 <strong>Note:</strong> Individual movement files may be available - check your Notion Media database to link them to this composition.';
            audioContainer.appendChild(tempMessage);
        }
        
        // For multiple audio files, show only the first one initially
        if (audioFiles.length > 1) {
            const audioPlayers = audioContainer.querySelectorAll('.composition-audio-player');
            audioPlayers.forEach((player, index) => {
                if (index === 0) {
                    player.style.display = 'block';
                } else {
                    player.style.display = 'none';
                }
            });
            // Navigation controls are now embedded within each audio player card
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
                
                // Check if this is a YouTube video or regular video file
                const isYouTube = isYouTubeUrl(videoFile.url);
                
                let videoPlayerHtml = '';
                if (isYouTube) {
                    // Use YouTube embed for YouTube URLs
                    videoPlayerHtml = createYouTubeEmbed(videoFile.url, displayName);
                } else {
                    // Use standard video element for direct video files
                    videoPlayerHtml = `
                        <video controls preload="metadata" data-video-id="${videoFile.id}">
                            <source src="${videoFile.url}" type="video/mp4">
                            <source src="${videoFile.url}" type="video/webm">
                            <source src="${videoFile.url}" type="video/ogg">
                            Your browser does not support the video element.
                        </video>
                    `;
                }
                
                return `
                    <div class="composition-video-player" data-video-index="${index}">
                        <div class="composition-video-title">
                            🎬 ${displayName}
                            ${videoFiles.length > 1 ? `<span class="video-counter">(${index + 1}/${videoFiles.length})</span>` : ''}
                        </div>
                        ${metadataHtml}
                        ${videoPlayerHtml}
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
            <div class="single-page-score-viewer">
                <div class="score-container">
                    <div class="score-iframe-container">
                        <iframe 
                            id="score-iframe"
                            src="/pdfjs/web/viewer.html?file=${encodeURIComponent(scoreUrl)}#page=1&zoom=page-fit&toolbar=0&navpanes=0&spreadModeOnLoad=0&scrollModeOnLoad=1"
                            width="100%"
                            height="700px"
                            style="border: none; border-radius: 8px;">
                        </iframe>
                    </div>
                    <div class="score-navigation-bottom">
                        <button class="score-nav-btn prev-btn" id="score-prev">
                            <span class="nav-icon">←</span>
                            <span class="nav-text">Previous Page</span>
                        </button>
                        <span class="score-page-info" id="score-page-info">Page 1 of ?</span>
                        <button class="score-nav-btn next-btn" id="score-next">
                            <span class="nav-text">Next Page</span>
                            <span class="nav-icon">→</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize single-page PDF navigation
        initSinglePagePDFNavigation(scoreUrl);
    }
}

// Single Page PDF Navigation Implementation
let currentPage = 1;
let totalPages = 0;
let scoreIframe = null;

function initSinglePagePDFNavigation(pdfUrl) {
    console.log('🔄 Initializing single-page PDF navigation for:', pdfUrl);
    
    /*
     * PDF.js URL Parameters for Single Page View:
     * - zoom=page-fit: Fits pages to viewport
     * - toolbar=0: Hides PDF.js toolbar
     * - navpanes=0: Hides navigation panes
     * - spreadModeOnLoad=0: Single page mode
     * - scrollModeOnLoad=1: Page scrolling mode
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
    
    // Set up single-page navigation buttons
    setupSinglePageNavigation();
}

function setupSinglePageNavigation() {
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
    scoreIframe.src = `${baseUrl}#page=${pageNumber}&zoom=page-fit&toolbar=0&navpanes=0&spreadModeOnLoad=0&scrollModeOnLoad=1`;
    
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

// ===== UTILITY FUNCTIONS FOR ENHANCED MEDIA =====

// YouTube URL helper functions
function isYouTubeUrl(url) {
    if (!url) return false;
    return /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i.test(url);
}

function getYouTubeVideoId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match ? match[1] : null;
}

function createYouTubeEmbed(url, title = 'Video') {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return null;
    
    return `
        <div class="youtube-embed-container">
            <iframe 
                width="100%" 
                height="315" 
                src="https://www.youtube.com/embed/${videoId}" 
                title="${title}"
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowfullscreen>
            </iframe>
        </div>
    `;
}

// Extract movement order from filename (Roman numerals or Arabic numbers)
function extractMovementOrder(title) {
    if (!title) return 999; // Put untitled at end
    
    try {
        // Look for Roman numerals (I, II, III, IV, V, VI, VII, VIII, IX, X)
        const romanMatch = title.match(/\b([IVX]+)\b[._-]/i);
        if (romanMatch) {
            const roman = romanMatch[1].toUpperCase();
            const romanToArabic = {
                'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 
                'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10
            };
            return romanToArabic[roman] || 999;
        }
        
        // Look for Arabic numbers (1, 2, 3, etc.)
        const numberMatch = title.match(/\b(\d+)\b[._-]/);
        if (numberMatch) {
            const num = parseInt(numberMatch[1]);
            return isNaN(num) ? 999 : num;
        }
        
        return 999; // Default for unordered files
    } catch (error) {
        console.error('Error extracting movement order:', error);
        return 999;
    }
}

// Convert number back to Roman numeral for display
function getRomanNumeral(number) {
    const arabicToRoman = {
        1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V',
        6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X'
    };
    return arabicToRoman[number] || 'Unknown';
}

// Extract movement title from API title
function extractMovementTitle(title) {
    if (!title) return '';
    
    try {
        // Handle API format: "Resolutions: Suite for Brass Trio - I. Agree to Disagree"
        // Look for pattern: "CompositionName - MovementTitle"
        const dashMatch = title.match(/^.+?\s*-\s*(.+)$/);
        if (dashMatch && dashMatch[1]) {
            return dashMatch[1].trim();
        }
        
        // Fallback: Handle old filename format
        // Remove common prefixes (Master_MP3_, etc.)
        let cleaned = title.replace(/^(Master_MP3_|Master_|MP3_|Audio_)/i, '');
        
        // Look for pattern: "Composition_Roman/Number_Title"
        // Example: "Resolutions_IV._Growing_Empathy" -> "IV. Growing Empathy"
        const fileMatch = cleaned.match(/.*?[._-]([IVX]+[._].*?)(?:\.(mp3|wav|m4a|aac))?$/i);
        if (fileMatch && fileMatch[1]) {
            const movementTitle = fileMatch[1]
                .replace(/[._]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            return movementTitle;
        }
        
        // If no pattern matches, return the original title
        return title;
    } catch (error) {
        console.error('Error extracting movement title:', error);
        return title; // Return original title on error instead of empty string
    }
}

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

// Global variable to track current audio player
let currentAudioIndex = 0;
let totalAudioCount = 0;

// Add controls for multiple audio files
function addMultiAudioControls(audioContainer, audioCount) {
    totalAudioCount = audioCount;
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
    
    // Add navigation controls
            const controlsHtml = `
            <div class="audio-nav-container">
                <button class="audio-nav-btn" onclick="previousAudio()" id="prevAudioBtn">⏮ Previous</button>
                <span class="audio-nav-info" id="audioNavInfo">Movement 1 of ${audioCount}</span>
                <button class="audio-nav-btn" onclick="nextAudio()" id="nextAudioBtn">Next ⏭</button>
            </div>
        `;
    audioContainer.insertAdjacentHTML('afterend', controlsHtml);
    
    // Update button states
    updateAudioNavButtons();
}

// (Navigation functions moved to bottom of file to avoid conflicts)

// Switch to specific audio player
function switchToAudio(index) {
    const audioContainer = document.querySelector('.composition-audio-container');
    const audioPlayers = audioContainer.querySelectorAll('.composition-audio-player');
    
    // Hide current audio player
    if (audioPlayers[currentAudioIndex]) {
        audioPlayers[currentAudioIndex].style.display = 'none';
        // Pause current audio if playing
        const currentAudio = audioPlayers[currentAudioIndex].querySelector('audio');
        if (currentAudio && !currentAudio.paused) {
            currentAudio.pause();
        }
    }
    
    // Show new audio player
    currentAudioIndex = index;
    if (audioPlayers[currentAudioIndex]) {
        audioPlayers[currentAudioIndex].style.display = 'block';
    }
    
    // Update navigation
    updateAudioNavButtons();
}

// Update navigation button states
function updateAudioNavButtons() {
    const prevBtn = document.getElementById('prevAudioBtn');
    const nextBtn = document.getElementById('nextAudioBtn');
    const navInfo = document.getElementById('audioNavInfo');
    
    if (prevBtn) prevBtn.disabled = currentAudioIndex === 0;
    if (nextBtn) nextBtn.disabled = currentAudioIndex === totalAudioCount - 1;
    if (navInfo) navInfo.textContent = `Movement ${currentAudioIndex + 1} of ${totalAudioCount}`;
}

// Navigation functions for multiple audio files
function previousAudio() {
    if (currentAudioIndex > 0) {
        switchToAudio(currentAudioIndex - 1);
    }
}

function nextAudio() {
    if (currentAudioIndex < totalAudioCount - 1) {
        switchToAudio(currentAudioIndex + 1);
    }
}

// Function to scroll to the score section
function scrollToScore() {
    const scoreContainer = document.querySelector('.score-carousel-container');
    if (scoreContainer) {
        scoreContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
        });
        
        // Optional: Add a subtle highlight effect
        scoreContainer.style.transition = 'all 0.3s ease';
        scoreContainer.style.transform = 'scale(1.02)';
        setTimeout(() => {
            scoreContainer.style.transform = 'scale(1)';
        }, 300);
    } else {
        console.warn('Score container not found - make sure the PDF is loaded');
    }
}

// Initialize when DOM is ready
// Call both loadCompositions and loadCompositionDetail after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing composition detail page...');
    loadCompositions();
    loadCompositionDetail();
});