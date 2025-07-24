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

// Layout Builder Navigation Buttons
const linksContainer = document.querySelector('.composition-links-container');
if (linksContainer) {
    // Check availability of different sections
    const hasAudio = (comp.audioFiles && comp.audioFiles.length > 0) || comp.audioLink;
    const hasVideos = (comp.videoFiles && comp.videoFiles.filter(v => v.type !== 'Score Video').length > 0);
    const scoreFiles = comp.scoreFiles || [];
    const hasLegacyScore = comp.scoreLink && !scoreFiles.length;
    const hasScore = scoreFiles.length > 0 || hasLegacyScore;
    const hasSimilarWorks = comp.similarWorks && comp.similarWorks.length > 0;
    
    linksContainer.innerHTML = `
        <div class="layout-builder-nav">
            ${hasAudio ? `<button onclick="scrollToAudio()" class="btn-secondary layout-nav-btn">🎵 Listen</button>` : ''}
            ${hasVideos ? `<button onclick="scrollToVideos()" class="btn-secondary layout-nav-btn">📺 Watch</button>` : ''}
            ${hasScore ? `<button onclick="scrollToScore()" class="btn-secondary layout-nav-btn">📄 View Score</button>` : ''}
            <button onclick="scrollToMetadata()" class="btn-secondary layout-nav-btn">📊 Learn More</button>
            ${hasSimilarWorks ? `<button onclick="scrollToSimilarWorks()" class="btn-secondary layout-nav-btn">🔗 Similar Works</button>` : ''}
        </div>
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
                            <button class="audio-nav-btn" onclick="previousAudio()" data-nav-type="prev">⏮ Previous</button>
                            <span class="audio-nav-info">Movement ${index + 1} of ${audioFiles.length}</span>
                            <button class="audio-nav-btn" onclick="nextAudio()" data-nav-type="next">Next ⏭</button>
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

    // Enhanced video display with multiple videos (excluding score videos)
    const videoContainer = document.querySelector('#composition-video-container-main');
    if (videoContainer) {
        let videoFiles = (comp.videoFiles || []).filter(video => 
            video.type !== 'Score Video' && video.category !== 'score'
        );
        
        // Sort videos by Roman numerals in title
        videoFiles = videoFiles.sort((a, b) => {
            const romanToNumber = (roman) => {
                const romanNumerals = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10 };
                const match = (a.title || '').match(/\b(I{1,3}V?|IV|VI{0,3}|IX|X)\b/);
                return match ? romanNumerals[match[0]] || 0 : 0;
            };
            
            const aNum = romanToNumber(a.title || '');
            const bNum = romanToNumber(b.title || '');
            
            if (aNum === 0 && bNum === 0) return 0;
            if (aNum === 0) return 1;
            if (bNum === 0) return -1;
            return aNum - bNum;
        });
        
        if (videoFiles.length > 0) {
            // Initialize video navigation
            currentVideoIndex = 0;
            totalVideoCount = videoFiles.length;
            
            const videosHtml = videoFiles.map((videoFile, index) => {
                const displayName = videoFile.title || extractDisplayName(videoFile.url);
                
                
                
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
                    <div class="composition-video-player" data-video-index="${index}" style="${index === 0 ? 'display: flex;' : 'display: none;'}">
                        <div class="video-content">
                            ${videoPlayerHtml}
                            ${videoFile.duration ? `<div class="video-duration">Duration: ${videoFile.duration}</div>` : ''}
                            ${videoFiles.length > 1 ? `
                            <div class="audio-nav-divider"></div>
                            <div class="audio-nav-container">
                                <button class="audio-nav-btn" onclick="previousVideo()" data-nav-type="prev">⏮ Previous</button>
                                <span class="audio-nav-info">Video ${index + 1} of ${videoFiles.length}</span>
                                <button class="audio-nav-btn" onclick="nextVideo()" data-nav-type="next">Next ⏭</button>
                            </div>
                            ` : ''}
                        </div>
                        <div class="video-metadata-section">
                            <div class="composition-video-title">
                                ${displayName}
                            </div>
                            ${metadataHtml}
                        </div>
                    </div>
                `;
            }).join('');
            
            videoContainer.innerHTML = videosHtml;
            videoContainer.style.display = 'block';
        } else {
            videoContainer.style.display = 'none';
        }
    }

    // Score Video Display (separate from regular videos)
    const scoreVideoContainer = document.querySelector('#composition-score-video-container');
    if (scoreVideoContainer) {
        let scoreVideoFiles = (comp.videoFiles || []).filter(video => 
            video.type === 'Score Video' || video.category === 'score'
        );

        if (scoreVideoFiles.length > 0) {
            const scoreVideosHtml = scoreVideoFiles.map((scoreVideo, index) => {
                const videoPlayerHtml = createVideoPlayer(scoreVideo.url, scoreVideo.title);
                const metadataHtml = scoreVideo.performanceBy ? `
                    <div class="score-video-metadata">
                        <div class="performance-info">Performed by: ${scoreVideo.performanceBy}</div>
                    </div>
                ` : '';

                return `
                    <div class="composition-score-video-player" data-video-index="${index}" style="${index === 0 ? 'display: flex;' : 'display: none;'}">
                        <div class="score-video-content">
                            ${videoPlayerHtml}
                        </div>
                        <div class="score-video-metadata-section">
                            ${metadataHtml}
                        </div>
                    </div>
                `;
            }).join('');
            
            scoreVideoContainer.innerHTML = scoreVideosHtml;
            scoreVideoContainer.style.display = 'block';
        } else {
            scoreVideoContainer.style.display = 'none';
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
    
    // Metadata Toggle System
    const metadataContainer = document.querySelector('#metadata-toggle-system');
    if (metadataContainer) {
        const metadataToggles = [
            {
                title: 'Basic Information',
                items: [
                    { label: 'Title', value: comp.title || 'Unknown' },
                    { label: 'Year Composed', value: comp.year || 'Unknown' },
                    { label: 'Duration', value: comp.duration || 'Unknown' },
                    { label: 'Difficulty', value: comp.difficulty || 'Unknown' },
                    { label: 'Genre', value: comp.genre || 'Unknown' }
                ]
            },
            {
                title: 'Instrumentation',
                items: [
                    { label: 'Full Instrumentation', value: comp.instrumentation || 'Unknown' },
                    { label: 'Short Instrument List', value: comp.shortInstrumentList || 'Not provided' }
                ]
            },
            {
                title: 'Additional Details',
                items: [
                    { label: 'Created', value: formatDate(comp.created) || 'Unknown' },
                    { label: 'Last Edited', value: formatDate(comp.lastEdited) || 'Unknown' },
                    { label: 'Tags', value: comp.tags && comp.tags.length > 0 ? comp.tags.join(', ') : 'None' },
                    { label: 'Popular', value: comp.popular ? 'Yes' : 'No' }
                ]
            }
        ];

        const metadataHtml = metadataToggles.map((section, index) => `
            <div class="metadata-toggle-item" data-toggle="${index}">
                <div class="metadata-toggle-header" onclick="toggleMetadataSection(${index})">
                    <span>${section.title}</span>
                    <span class="metadata-toggle-icon">▼</span>
                </div>
                <div class="metadata-toggle-content">
                    ${section.items.map(item => `
                        <div class="metadata-item">
                            <div class="metadata-label">${item.label}:</div>
                            <div class="metadata-value">${item.value}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        metadataContainer.innerHTML = metadataHtml;
    }
    
    // Related Compositions Carousel
    if (comp.similarWorks && comp.similarWorks.length > 0) {
        renderRelatedCompositions(comp.similarWorks);
    } else {
        // Try to fetch related compositions if not provided
        fetchRelatedCompositions(comp.id);
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

// Global variables to track current audio player
let currentAudioIndex = 0;
let totalAudioCount = 0;

// Global variables to track current video player  
let currentVideoIndex = 0;
let totalVideoCount = 0;

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
    const currentPlayer = document.querySelector('.composition-audio-player[style*="block"], .composition-audio-player:not([style*="none"])');
    if (!currentPlayer) return;
    
    const prevBtn = currentPlayer.querySelector('[data-nav-type="prev"]');
    const nextBtn = currentPlayer.querySelector('[data-nav-type="next"]');
    const navInfo = currentPlayer.querySelector('.audio-nav-info');
    
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

// Helper function to stop a video (both HTML5 and YouTube)
function stopVideo(videoPlayer) {
    if (!videoPlayer) return;
    
    // Pause regular HTML5 videos
    const htmlVideo = videoPlayer.querySelector('video');
    if (htmlVideo && !htmlVideo.paused) {
        htmlVideo.pause();
    }
    
    // Stop YouTube videos by resetting iframe src
    const youtubeIframe = videoPlayer.querySelector('iframe[src*="youtube.com"]');
    if (youtubeIframe) {
        const originalSrc = youtubeIframe.src;
        youtubeIframe.src = '';
        // Restore src after a brief delay to stop the video
        setTimeout(() => {
            youtubeIframe.src = originalSrc;
        }, 100);
    }
}

// Switch to specific video player
function switchToVideo(index) {
    const videoContainer = document.querySelector('#composition-video-container-main');
    const videoPlayers = videoContainer.querySelectorAll('.composition-video-player');
    
    // Hide current video player and stop all videos
    if (videoPlayers[currentVideoIndex]) {
        videoPlayers[currentVideoIndex].style.display = 'none';
        stopVideo(videoPlayers[currentVideoIndex]);
    }
    
    // Show new video player
    currentVideoIndex = index;
    if (videoPlayers[currentVideoIndex]) {
        videoPlayers[currentVideoIndex].style.display = 'flex';
    }
    
    // Update navigation
    updateVideoNavButtons();
}

// Update video navigation button states
function updateVideoNavButtons() {
    const currentPlayer = document.querySelector(`.composition-video-player[data-video-index="${currentVideoIndex}"]`);
    if (!currentPlayer) return;
    
    const prevBtn = currentPlayer.querySelector('[data-nav-type="prev"]');
    const nextBtn = currentPlayer.querySelector('[data-nav-type="next"]');
    const navInfo = currentPlayer.querySelector('.audio-nav-info');
    
    if (prevBtn) prevBtn.disabled = currentVideoIndex === 0;
    if (nextBtn) nextBtn.disabled = currentVideoIndex === totalVideoCount - 1;
    if (navInfo) navInfo.textContent = `Video ${currentVideoIndex + 1} of ${totalVideoCount}`;
}

// Navigation functions for multiple video files
function previousVideo() {
    if (currentVideoIndex > 0) {
        switchToVideo(currentVideoIndex - 1);
    }
}

function nextVideo() {
    if (currentVideoIndex < totalVideoCount - 1) {
        switchToVideo(currentVideoIndex + 1);
    }
}

// Layout Builder Navigation Functions
function scrollToAudio() {
    const audioContainer = document.querySelector('.composition-audio-container');
    if (audioContainer) {
        audioContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
        });
        
        // Optional: Add a subtle highlight effect
        audioContainer.style.transition = 'all 0.3s ease';
        audioContainer.style.transform = 'scale(1.02)';
        setTimeout(() => {
            audioContainer.style.transform = 'scale(1)';
        }, 300);
    } else {
        console.warn('Audio container not found');
    }
}

function scrollToVideos() {
    const videosSection = document.querySelector('.program-video-section') || 
                         document.querySelector('#composition-video-container-main');
    if (videosSection) {
        videosSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
        });
        
        // Optional: Add a subtle highlight effect
        videosSection.style.transition = 'all 0.3s ease';
        videosSection.style.transform = 'scale(1.02)';
        setTimeout(() => {
            videosSection.style.transform = 'scale(1)';
        }, 300);
    } else {
        console.warn('Videos section not found');
    }
}

function scrollToScore() {
    const scoreContainer = document.querySelector('.score-carousel-container') ||
                          document.querySelector('.scores-section');
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

function scrollToMetadata() {
    const metadataSection = document.querySelector('.metadata-section') ||
                           document.querySelector('#metadata-toggle-system');
    if (metadataSection) {
        metadataSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
        });
        
        // Optional: Add a subtle highlight effect
        metadataSection.style.transition = 'all 0.3s ease';
        metadataSection.style.transform = 'scale(1.02)';
        setTimeout(() => {
            metadataSection.style.transform = 'scale(1)';
        }, 300);
    } else {
        console.warn('Metadata section not found');
    }
}

function scrollToSimilarWorks() {
    const similarWorksSection = document.querySelector('.related-compositions-section') ||
                               document.querySelector('#related-compositions-carousel');
    if (similarWorksSection) {
        similarWorksSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
        });
        
        // Optional: Add a subtle highlight effect
        similarWorksSection.style.transition = 'all 0.3s ease';
        similarWorksSection.style.transform = 'scale(1.02)';
        setTimeout(() => {
            similarWorksSection.style.transform = 'scale(1)';
        }, 300);
    } else {
        console.warn('Similar works section not found');
    }
}

// Function to stop all playing videos on the page
function stopAllVideos() {
    // Stop all regular HTML5 videos
    const htmlVideos = document.querySelectorAll('video');
    htmlVideos.forEach(video => {
        if (!video.paused) {
            video.pause();
        }
    });
    
    // Stop all YouTube videos by resetting their src
    const youtubeIframes = document.querySelectorAll('iframe[src*="youtube.com"]');
    youtubeIframes.forEach(iframe => {
        const originalSrc = iframe.src;
        iframe.src = '';
        setTimeout(() => {
            iframe.src = originalSrc;
        }, 100);
    });
}

// Metadata Toggle System Functions
function toggleMetadataSection(index) {
    const toggleItem = document.querySelector(`[data-toggle="${index}"]`);
    if (toggleItem) {
        toggleItem.classList.toggle('active');
    }
}

// Related Compositions Functions
function renderRelatedCompositions(compositions) {
    const carouselContainer = document.querySelector('#related-compositions-carousel');
    if (!carouselContainer || !compositions || compositions.length === 0) {
        return;
    }

    const carouselHtml = compositions.map(comp => `
        <div class="related-composition-card" onclick="navigateToComposition('${comp.slug}')">
            ${comp.coverImage ? `
                <img src="${comp.coverImage}" alt="${comp.title}" class="related-composition-image" loading="lazy">
            ` : ''}
            <div class="related-composition-content">
                <h4 class="related-composition-title">${comp.title}</h4>
                <div class="related-composition-instrumentation">${comp.instrumentation}</div>
                ${comp.year ? `<div class="related-composition-year">${comp.year}</div>` : ''}
            </div>
        </div>
    `).join('');

    carouselContainer.innerHTML = carouselHtml;
}

async function fetchRelatedCompositions(compositionId) {
    try {
        const response = await fetch(`/api/compositions/${compositionId}/similar`);
        const data = await response.json();
        
        if (data.success && data.compositions) {
            renderRelatedCompositions(data.compositions);
        }
    } catch (error) {
        console.error('Error fetching related compositions:', error);
    }
}

function navigateToComposition(slug) {
    if (slug) {
        window.location.href = `/composition/${slug}`;
    }
}

// Initialize when DOM is ready
// Call both loadCompositions and loadCompositionDetail after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing composition detail page...');
    loadCompositions();
    loadCompositionDetail();
    
    // Stop all videos when the user navigates away from the page
    window.addEventListener('beforeunload', stopAllVideos);
    
    // Stop all videos when the user navigates to a different page (for SPA navigation)
    window.addEventListener('pagehide', stopAllVideos);
});