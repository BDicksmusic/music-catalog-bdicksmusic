// composition.js

// Global variables for audio/video players
let currentAudioIndex = 0;
let totalAudioCount = 0;
let currentVideoIndex = 0;
let totalVideoCount = 0;
let videoPlayers = [];

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
        console.log('🔍 API response:', data);
        if (data.success && data.composition) {
            console.log('🔍 Composition data received:', data.composition);
            console.log('🔍 Video files in composition:', data.composition.videoFiles?.length || 0);
            if (data.composition.videoFiles?.length > 0) {
                console.log('🔍 All video files from API:', data.composition.videoFiles);
            }
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
    console.log('🎯 Starting renderComposition with:', comp);
    console.log('🎯 DEBUG - Media data received from server:', {
        audioFiles: comp.audioFiles?.length || 0,
        videoFiles: comp.videoFiles?.length || 0,
        scoreFiles: comp.scoreFiles?.length || 0,
        allMedia: comp.allMedia?.length || 0,
        scoreLink: comp.scoreLink
    });
    
    // Debug: Log all received media with details
    if (comp.audioFiles && comp.audioFiles.length > 0) {
        console.log('🎵 DEBUG CLIENT - Audio files received:');
        comp.audioFiles.forEach((audio, index) => {
            console.log(`  ${index + 1}. "${audio.title}" - URL: ${audio.url ? 'YES' : 'NO'}`);
        });
    }
    
    if (comp.videoFiles && comp.videoFiles.length > 0) {
        console.log('🎥 DEBUG CLIENT - Video files received:');
        comp.videoFiles.forEach((video, index) => {
            console.log(`  ${index + 1}. "${video.title}" - Type: ${video.type} - URL: ${video.url ? 'YES' : 'NO'}`);
        });
    }
    
    if (comp.scoreFiles && comp.scoreFiles.length > 0) {
        console.log('📄 DEBUG CLIENT - Score files received:');
        comp.scoreFiles.forEach((score, index) => {
            console.log(`  ${index + 1}. "${score.title}" - URL: ${score.url ? 'YES' : 'NO'}`);
        });
    }
    
    console.log('🎯 DEBUG - Score-related data in comp:', {
        scoreFiles: comp.scoreFiles,
        scoreLink: comp.scoreLink,
        allMedia: comp.allMedia?.filter(m => m.type === 'Score' || m.type === 'Score Video')
    });

    // Helper function to check if URL is a PDF (defined at top for global access)
    const isPdfUrl = (url) => {
        if (!url) return false;
        const urlLower = url.toLowerCase();
        return urlLower.includes('.pdf') || urlLower.includes('pdf') || 
               (!urlLower.includes('youtube.com') && !urlLower.includes('youtu.be'));
    };

    // FIXED: Server now properly separates PDF scores from score videos
    const scoreFiles = comp.scoreFiles || []; // Now contains PDF scores only from server
    const scoreVideoFiles = (comp.videoFiles || []).filter(video => video.type === 'Score Video' || video.category === 'score');
    
    // No need to filter scoreFiles anymore - server already provides PDF scores only
    const pdfScoreFiles = scoreFiles;

    // Priority: Direct scoreLink from Notion database, but only if it's a PDF
    const hasDirectPdfScore = comp.scoreLink && comp.scoreLink.trim() !== '' && isPdfUrl(comp.scoreLink);
    const hasMediaScore = pdfScoreFiles.length > 0;
    const hasPdfScore = hasDirectPdfScore || hasMediaScore;
    
    // Check if scoreLink is actually a video (should go to score video section)
    const scoreVideoFromLink = comp.scoreLink && !isPdfUrl(comp.scoreLink) ? {
        url: comp.scoreLink,
        title: `${comp.title} - Score Video`,
        type: 'Score Video',
        category: 'score'
    } : null;
    
    // Combine score videos from media database and potential score video from scoreLink
    const allScoreVideos = scoreVideoFiles.concat(scoreVideoFromLink ? [scoreVideoFromLink] : []);
    const hasScoreVideo = allScoreVideos.length > 0;
    
    // Update cover image
    const coverImg = document.getElementById('composition-cover');
    if (coverImg && comp.coverImage) {
        coverImg.src = comp.coverImage;
        coverImg.alt = comp.title;
    }

    // ============================================
    // NEW COMBINED CONTAINER: Title & Meta Information (Left-Right Layout)
    // ============================================
    console.log('📝 Rendering Combined Container: Title Left, Meta Right');
    const titleInstrumentContainer = document.querySelector('.composition-title-container');
    if (titleInstrumentContainer) {
        // Use Notion short instrument list if available, otherwise extract from full instrumentation
        const shortInstrumentList = comp.shortInstrumentList || extractShortInstrumentList(comp.instrumentation || '');
        
        // Debug log (browser-safe)
        console.log('📊 Combined Container populated:', {
            title: comp.title,
            instrumentation: comp.instrumentation,
            shortInstrumentList: shortInstrumentList,
            duration: comp.duration
        });
        
        titleInstrumentContainer.innerHTML = `
            <div class="composition-header-combined">
                <div class="composition-title-section">
                    <h1 class="composition-title">${comp.title || 'Untitled'}</h1>
                    <div class="composition-instrument">${comp.instrumentation || 'Unknown'}</div>
                </div>
                <div class="composition-meta-section">
                    <div class="composition-meta">
                        ${comp.duration ? `<strong>Duration:</strong> ${comp.duration}` : ''}
                    </div>
                    <div class="composition-short-instruments">
                        ${shortInstrumentList}
                    </div>
                </div>
            </div>
        `;
    }

    // Also populate individual containers for backwards compatibility
    const instrumentContainer = document.querySelector('.composition-instrument-container');
    if (instrumentContainer) {
        instrumentContainer.innerHTML = `<div class="composition-instrument">${comp.instrumentation || 'Unknown'}</div>`;
    }

    // Clear the old meta container since it's now part of the combined container
    const metaContainer = document.querySelector('.composition-meta-container');
    if (metaContainer) {
        metaContainer.innerHTML = '';
    }

    // ============================================
    // CONTAINER 3: Layout Builder Navigation
    // ============================================
    console.log('🔗 Rendering Container 3: Layout Builder Navigation');
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
                ${hasVideos ? `<button onclick="scrollToVideos()" class="btn-secondary layout-nav-btn">📺 Watch</button>` : ''}
                ${hasScore ? `<button onclick="scrollToScore()" class="btn-secondary layout-nav-btn">📄 View Score</button>` : ''}
                <button onclick="scrollToMetadata()" class="btn-secondary layout-nav-btn">📊 Learn More</button>
                ${hasSimilarWorks ? `<button onclick="scrollToSimilarWorks()" class="btn-secondary layout-nav-btn">🔗 Similar Works</button>` : ''}
            </div>
        `;
    }

    // ============================================
    // CONTAINER 4: Buy/Purchase Button (No Container)
    // ============================================
    console.log('💳 Rendering Container 4: Buy/Purchase Button');
    const buyWrapper = document.querySelector('.composition-buy-button-wrapper');
    if (buyWrapper) {
        buyWrapper.innerHTML = comp.paymentLink || comp.stripePriceId ? 
            `<button class="composition-buy-btn" onclick="purchaseComposition('${comp.id}', '${comp.title.replace(/'/g, "\\'")}', ${comp.price || 10})">
                💳 Buy Now - $${comp.price || 10}
            </button>` : 
            `<button class="composition-buy-btn btn-disabled" onclick="showUnavailableMessage('${comp.title.replace(/'/g, "\\'")}')">
                🚫 Currently Not Available
            </button>`;
    }

    // ============================================
    // CONTAINER 5: Audio Container (Enhanced Multi-Audio Player)
    // ============================================
    console.log('🎵 Rendering Container 5: Audio Container');
    console.log('🎵 DEBUG - Audio rendering check:', {
        audioFiles: comp.audioFiles?.length || 0,
        audioLink: comp.audioLink ? 'YES' : 'NO',
        hasLegacyAudio: comp.audioLink && (!comp.audioFiles || comp.audioFiles.length === 0)
    });
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


// Program Notes and Performance Notes (Combined)
const notesContainer = document.querySelector('.composition-notes-container');
let notesHtml = '';

// Add Program Notes if they exist
if (comp.programNotes) {
    notesHtml += `
        <section class="composition-program-notes">
            <h3>Program Notes</h3>
            <div class="program-notes-content">${comp.programNotes}</div>
        </section>
    `;
}

// Add Performance Notes if they exist (directly under Program Notes)
if (comp.performanceNotes) {
    // Convert markdown-style dashes to HTML list
    const formattedNotes = comp.performanceNotes
        .split('- ')
        .filter(item => item.trim()) // Remove empty items
        .map(item => `<li>${item.trim()}</li>`)
        .join('');
    
    notesHtml += `
        <section class="composition-performance-notes" style="margin-top: 1.5rem;">
            <h3>Performance Notes</h3>
            <div class="performance-notes-content">
                <ul class="performance-notes-list">
                    ${formattedNotes}
                </ul>
            </div>
        </section>
    `;
}

// Only show the notes container if there are program notes or performance notes
if (notesContainer) {
    if (notesHtml.trim()) {
        notesContainer.innerHTML = notesHtml;
        notesContainer.parentElement.style.display = 'block';
    } else {
        notesContainer.innerHTML = '';
        notesContainer.parentElement.style.display = 'none';
    }
}

    // Enhanced video display with multiple videos (excluding score videos)
    const videoContainer = document.querySelector('#composition-video-container-main');
    console.log('🎥 DEBUG - Video rendering check:', {
        videoContainer: !!videoContainer,
        totalVideoFiles: comp.videoFiles?.length || 0,
        videoFilesDetails: comp.videoFiles?.map(v => ({ title: v.title, type: v.type, category: v.category })) || []
    });
    if (videoContainer) {
        let videoFiles = (comp.videoFiles || []).filter(video => 
            video.type !== 'Score Video' && video.category !== 'score'
        );
        
        console.log('🎥 DEBUG - After filtering regular videos:', {
            originalCount: comp.videoFiles?.length || 0,
            filteredCount: videoFiles.length,
            filteredVideos: videoFiles.map(v => ({ title: v.title, type: v.type, url: v.url ? 'YES' : 'NO' }))
        });
        
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
                                 <div class="video-metadata-section">
                            <div class="composition-video-title">
                                ${displayName}
                            </div>
                            ${metadataHtml}
                        </div>
                    </div>
                            <div class="audio-nav-divider"></div>
                            <div class="audio-nav-container">
                                <button class="audio-nav-btn" onclick="previousVideo()" data-nav-type="prev">⏮ Previous</button>
                                <span class="audio-nav-info">Video ${index + 1} of ${videoFiles.length}</span>
                                <button class="audio-nav-btn" onclick="nextVideo()" data-nav-type="next">Next ⏭</button>
                            </div>
                            ` : ''}
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
        console.log('🎼 DEBUG - Score video container found:', !!scoreVideoContainer);
        console.log('🎼 DEBUG - Server properly separates videos now - videoFiles contains both regular and score videos');
        console.log('🎼 DEBUG - All video files from server:', comp.videoFiles?.length || 0);
        console.log('🎼 DEBUG - Score video analysis:', {
            totalVideoFiles: comp.videoFiles?.length || 0,
            scoreVideosByType: (comp.videoFiles || []).filter(video => video.type === 'Score Video').length,
            scoreVideosByCategory: (comp.videoFiles || []).filter(video => video.category === 'score').length,
            allScoreVideosLength: allScoreVideos.length
        });
        if (comp.videoFiles && comp.videoFiles.length > 0) {
            console.log('🎼 DEBUG - Video files detailed:', comp.videoFiles.map(v => ({ 
                title: v.title, 
                type: v.type, 
                category: v.category,
                url: v.url
            })));
        }
        
        // FIXED: Server now properly includes score videos in videoFiles, so filtering should work correctly
        console.log('🎼 DEBUG - Filtering score videos from properly structured server data:');
        
        // Primary method: Exact type match (should work now that server properly includes score videos)
        const scoreVideosFromServer = (comp.videoFiles || []).filter(video => video.type === 'Score Video');
        console.log('🎼 DEBUG - Score videos from server (type === "Score Video"):', scoreVideosFromServer.length, scoreVideosFromServer);
        
        // Backup method: Category match
        const scoreVideosByCategory = (comp.videoFiles || []).filter(video => video.category === 'score');
        console.log('🎼 DEBUG - Score videos by category (category === "score"):', scoreVideosByCategory.length, scoreVideosByCategory);
        
        // Use the combined score videos (from media database + potential scoreLink video)
        console.log('🎼 DEBUG - All combined score videos:', allScoreVideos.length, allScoreVideos);

        if (allScoreVideos.length > 0) {
            console.log('🎼 DEBUG - Rendering', allScoreVideos.length, 'score videos');
            
            try {
                const scoreVideosHtml = allScoreVideos.map((scoreVideo, index) => {
                    console.log(`🎼 DEBUG - Processing score video ${index + 1}:`, scoreVideo);
                    
                    // Validate video data
                    if (!scoreVideo.url) {
                        console.error(`🎼 ERROR - Score video ${index + 1} has no URL:`, scoreVideo);
                        return `
                            <div class="composition-score-video-player" data-video-index="${index}" style="${index === 0 ? 'display: flex;' : 'display: none;'}">
                                <div class="score-video-content">
                                    <div class="video-error">Score video URL not available</div>
                                </div>
                            </div>
                        `;
                    }
                    
                    const videoPlayerHtml = createVideoPlayer(scoreVideo.url, scoreVideo.title);
                    console.log(`🎼 DEBUG - Generated video player HTML length:`, videoPlayerHtml?.length || 0);
                    
                    // Validate generated HTML
                    if (!videoPlayerHtml || videoPlayerHtml.trim() === '') {
                        console.error(`🎼 ERROR - Failed to generate video player HTML for:`, scoreVideo);
                        return `
                            <div class="composition-score-video-player" data-video-index="${index}" style="${index === 0 ? 'display: flex;' : 'display: none;'}">
                                <div class="score-video-content">
                                    <div class="video-error">Failed to create video player</div>
                                </div>
                            </div>
                        `;
                    }
                    
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
                
                console.log('🎼 DEBUG - Final score videos HTML length:', scoreVideosHtml.length);
                scoreVideoContainer.innerHTML = scoreVideosHtml;
                scoreVideoContainer.style.display = 'block';
                console.log('🎼 DEBUG - Score video container display set to block');
                console.log('🎼 SUCCESS - Score videos rendered successfully');
                
            } catch (error) {
                console.error('🎼 ERROR - Failed to render score videos:', error);
                scoreVideoContainer.innerHTML = `
                    <div style="padding: 20px; background: #ffe6e6; border: 2px solid #ff9999; text-align: center; color: #cc0000;">
                        <strong>Error Rendering Score Videos</strong><br>
                        ${error.message}<br>
                        Check console for details.
                    </div>
                `;
                scoreVideoContainer.style.display = 'block';
            }
        } else {
            console.log('🎼 DEBUG - No score videos found, hiding container');
            // Add a temporary message to show that the container exists but has no videos
            scoreVideoContainer.innerHTML = `
                <div style="padding: 20px; background: #f0f0f0; border: 2px dashed #ccc; text-align: center;">
                    <strong>Score Video Container Active</strong><br>
                    No score videos found with current filtering.<br>
                    Check console for debugging info.
                </div>
            `;
            scoreVideoContainer.style.display = 'block';
        }
    }



    // Enhanced PDF Score Viewer with multiple scores support
    console.log('📄 DEBUG - Score rendering started');
    console.log('📄 DEBUG - comp.scoreFiles:', comp.scoreFiles?.length, comp.scoreFiles);
    console.log('📄 DEBUG - comp.scoreLink:', comp.scoreLink);
    
    const scoreCarouselContainer = document.querySelector('#score-carousel-container');
    console.log('📄 DEBUG - Score container found:', !!scoreCarouselContainer);
    
    console.log('📄 DEBUG - Final score check:', {
        hasDirectPdfScore: hasDirectPdfScore,
        directScoreUrl: comp.scoreLink,
        isPdfUrl: isPdfUrl(comp.scoreLink),
        serverScoreFilesLength: scoreFiles.length, // PDF scores from server
        pdfScoreFilesLength: pdfScoreFiles.length, // Should be same as above now
        scoreVideoFilesLength: scoreVideoFiles.length,
        allScoreVideosLength: allScoreVideos.length,
        scoreVideoFromLink: scoreVideoFromLink,
        hasPdfScore: hasPdfScore,
        hasScoreVideo: hasScoreVideo,
        willRenderScore: hasPdfScore || hasScoreVideo
    });
    
    if (scoreCarouselContainer && (hasPdfScore || hasScoreVideo)) {
        if (hasPdfScore) {
            // Priority: Use direct scoreLink from Notion database first, then media database
            const scoreUrl = hasDirectPdfScore ? comp.scoreLink : pdfScoreFiles[0].url;
            console.log('📄 DEBUG - Rendering PDF score with URL:', scoreUrl);
            console.log('📄 DEBUG - Using direct PDF score link:', hasDirectPdfScore);
            
            if (!scoreUrl || scoreUrl.trim() === '') {
                console.error('📄 ERROR - No valid score URL found');
                scoreCarouselContainer.innerHTML = `
                    <div class="score-error-notice">
                        <div class="score-notice-card">
                            <h3>⚠️ Score Not Available</h3>
                            <p>The score URL is not properly configured for this composition.</p>
                        </div>
                    </div>
                `;
                return;
            }
            
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
        } else if (hasScoreVideo) {
            // Show message that score is available as video
            console.log('📄 DEBUG - No PDF score available, showing score video notice');
            scoreCarouselContainer.innerHTML = `
                <div class="score-video-notice">
                    <div class="score-notice-card">
                        <h3>📼 Score Available as Video</h3>
                        <p>The score for this composition is available as a performance video in the video section above.</p>
                        <button onclick="scrollToVideos()" class="btn-primary">
                            🎥 View Score Video
                        </button>
                    </div>
                </div>
            `;
        }
        
        console.log('📄 DEBUG - Score rendering completed successfully');
    } else {
        console.log('📄 DEBUG - Score NOT rendered. Reasons:', {
            containerMissing: !scoreCarouselContainer,
            noPdfScore: !hasPdfScore,
            hasDirectPdfScore: hasDirectPdfScore,
            hasMediaScore: hasMediaScore,
            directScoreUrl: comp.scoreLink,
            isPdfUrl: isPdfUrl(comp.scoreLink),
            noScoreVideo: !hasScoreVideo
        });
    }
    
    // Essential Composition Details (Always Visible)
    const metadataContainer = document.querySelector('#metadata-toggle-system');
    if (metadataContainer) {
        // Create always-visible essential details section
        const essentialDetails = [
            { label: 'Year Composed', value: comp.year, icon: '📅' },
            { label: 'Duration', value: comp.duration, icon: '⏱️' },
            { label: 'Difficulty Level', value: comp.difficulty, icon: '🎯' },
            { label: 'Genre', value: comp.genre, icon: '🎵' },
            { label: 'Number of Parts', value: comp.numberOfParts, icon: '📄' }
        ].filter(item => item.value && item.value !== 'Not specified');

        let essentialHtml = '';
        if (essentialDetails.length > 0) {
            essentialHtml = `
                <div class="composition-essential-details">
                    <h4>Key Details</h4>
                    <div class="essential-details-grid">
                        ${essentialDetails.map(detail => `
                            <div class="essential-detail-item">
                                <span class="detail-icon">${detail.icon}</span>
                                <div class="detail-content">
                                    <div class="detail-label">${detail.label}</div>
                                    <div class="detail-value">${detail.value}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        const metadataToggles = [
            {
                title: '🎼 Instrumentation Details',
                items: [
                    { label: 'Full Instrumentation', value: comp.instrumentation || 'Not specified' },
                    { label: 'Short Instrument List', value: comp.shortInstrumentList || 'Not specified' }
                ].filter(item => item.value !== 'Not specified')
            },

            {
                title: '📊 Performance & Media',
                items: [
                    { label: 'Audio Recordings', value: comp.audioFiles?.length || 0 },
                    { label: 'Video Recordings', value: comp.videoFiles?.length || 0 },
                    { label: 'Score Available', value: comp.scoreLink || comp.scoreFiles?.length > 0 ? 'Yes' : 'No' },
                    { label: 'Featured Work', value: comp.featured ? 'Yes' : 'No' },
                    { label: 'Popular', value: comp.popular ? 'Yes' : 'No' }
                ]
            },
            {
                title: '🏷️ Additional Information',
                items: [
                    { label: 'Tags', value: comp.tags && comp.tags.length > 0 ? comp.tags.join(', ') : 'None' },
                    { label: 'Created', value: formatDate(comp.created) || 'Not specified' },
                    { label: 'Last Edited', value: formatDate(comp.lastEdited) || 'Not specified' },
                    { label: 'Related Works', value: comp.similarWorks?.length || 0 }
                ].filter((item, index) => {
                    // Keep tags and related works even if empty, filter others
                    if (item.label === 'Tags' || item.label === 'Related Works') return true;
                    return item.value !== 'Not specified';
                })
            }
        ].filter(section => section.items.length > 0); // Only show sections with items

        const metadataHtml = metadataToggles.map((section, index) => `
            <div class="metadata-toggle-item" data-toggle="${index}">
                <div class="metadata-toggle-header" onclick="toggleMetadataSection(${index})">
                    <span>${section.title}</span>
                    <span class="metadata-toggle-icon">⌄</span>
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

        // Combine essential details with collapsible metadata
        metadataContainer.innerHTML = essentialHtml + (metadataHtml ? `<div style="margin-top: 1.5rem;">${metadataHtml}</div>` : '');
    }
    
    // Related Compositions Carousel
    console.log('🔗 DEBUG - Similar works data:', comp.similarWorks?.length, comp.similarWorks);
    
    const relatedSection = document.querySelector('.related-compositions-section');
    
    if (comp.similarWorks && comp.similarWorks.length > 0) {
        console.log('🔗 DEBUG - Rendering related compositions from Notion:', comp.similarWorks.length);
        renderRelatedCompositions(comp.similarWorks);
        if (relatedSection) {
            relatedSection.style.display = 'block';
        }
    } else {
        console.log('🔗 DEBUG - No similar works from Notion, fetching via API...');
        // Keep the section visible and fetch related compositions via API
        if (relatedSection) {
            relatedSection.style.display = 'block';
        }
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
    if (!url) {
        console.log('🎬 DEBUG - No URL provided to getYouTubeVideoId');
        return null;
    }
    
    console.log('🎬 DEBUG - Attempting to extract video ID from:', url);
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    const videoId = match ? match[1] : null;
    console.log('🎬 DEBUG - RegEx match result:', match);
    console.log('🎬 DEBUG - Extracted video ID:', videoId);
    
    return videoId;
}

function createYouTubeEmbed(url, title = 'Video') {
    console.log('🎬 DEBUG - Creating YouTube embed for:', url);
    const videoId = getYouTubeVideoId(url);
    console.log('🎬 DEBUG - Extracted video ID:', videoId);
    
    if (!videoId) {
        console.warn('🎬 DEBUG - Could not extract YouTube video ID from URL:', url);
        return null;
    }
    
    const embedHtml = `
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
    
    console.log('🎬 DEBUG - YouTube embed HTML created successfully');
    return embedHtml;
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

// Extract short instrument list from full instrumentation
function extractShortInstrumentList(fullInstrumentation) {
    if (!fullInstrumentation) return 'Unknown';
    
    // Common instrument abbreviations and simplifications
    const instrumentMap = {
        'trumpet': 'Tpt',
        'trumpets': 'Tpt',
        'horn': 'Hn', 
        'horns': 'Hn',
        'french horn': 'F.Hn',
        'french horns': 'F.Hn',
        'trombone': 'Tbn',
        'trombones': 'Tbn',
        'tuba': 'Tuba',
        'tubas': 'Tuba',
        'euphonium': 'Euph',
        'euphoniums': 'Euph',
        'baritone': 'Bar',
        'baritones': 'Bar',
        'bass trombone': 'B.Tbn',
        'bass trombones': 'B.Tbn',
        'flute': 'Fl',
        'flutes': 'Fl',
        'oboe': 'Ob',
        'oboes': 'Ob',
        'clarinet': 'Cl',
        'clarinets': 'Cl',
        'bassoon': 'Bsn',
        'bassoons': 'Bsn',
        'saxophone': 'Sax',
        'saxophones': 'Sax',
        'alto saxophone': 'A.Sax',
        'tenor saxophone': 'T.Sax',
        'baritone saxophone': 'B.Sax',
        'soprano saxophone': 'S.Sax',
        'violin': 'Vln',
        'violins': 'Vln',
        'viola': 'Vla',
        'violas': 'Vla',
        'cello': 'Vc',
        'cellos': 'Vc',
        'double bass': 'Db',
        'bass': 'Bass',
        'piano': 'Pno',
        'harp': 'Hp',
        'percussion': 'Perc',
        'timpani': 'Timp',
        'marimba': 'Mrb',
        'xylophone': 'Xyl',
        'vibraphone': 'Vib'
    };
    
    // Special ensemble patterns
    const ensemblePatterns = {
        'brass quintet': 'Brass Quintet (2 Tpt, Hn, Tbn, Tuba)',
        'brass quartet': 'Brass Quartet',
        'brass trio': 'Brass Trio',
        'woodwind quintet': 'Woodwind Quintet (Fl, Ob, Cl, Bsn, Hn)',
        'string quartet': 'String Quartet (2 Vln, Vla, Vc)',
        'piano trio': 'Piano Trio (Pno, Vln, Vc)',
        'solo piano': 'Solo Piano',
        'solo guitar': 'Solo Guitar',
        'solo violin': 'Solo Violin'
    };
    
    const lower = fullInstrumentation.toLowerCase();
    
    // Check for known ensemble patterns first
    for (const [pattern, shortForm] of Object.entries(ensemblePatterns)) {
        if (lower.includes(pattern)) {
            return shortForm;
        }
    }
    
    // If no ensemble pattern matches, try to abbreviate individual instruments
    let result = fullInstrumentation;
    
    // Replace known instruments with abbreviations
    for (const [full, abbrev] of Object.entries(instrumentMap)) {
        const regex = new RegExp(`\\b${full}\\b`, 'gi');
        result = result.replace(regex, abbrev);
    }
    
    // Clean up extra spaces and common connecting words
    result = result
        .replace(/\s+and\s+/g, ', ')
        .replace(/\s+with\s+/g, ', ')
        .replace(/\s*,\s*/g, ', ')
        .replace(/\s+/g, ' ')
        .trim();
    
    // If result is too long (over 50 chars), try to shorten further
    if (result.length > 50) {
        // Count unique instrument types
        const instruments = result.split(',').map(i => i.trim());
        if (instruments.length > 3) {
            return `${instruments.length} instruments`;
        }
    }
    
    return result || 'Mixed Ensemble';
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

// Global variables moved to top of file for proper scope

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
    // Use global button selectors since the navigation is outside the audio players
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

// Create video player HTML (works for both YouTube and direct video files)
function createVideoPlayer(url, title = 'Video') {
    if (!url) {
        console.warn('No URL provided for video player');
        return '<div class="video-error">Video URL not available</div>';
    }
    
    console.log('🎥 DEBUG - Creating video player for URL:', url);
    
    // Check if this is a YouTube video
    const isYouTube = isYouTubeUrl(url);
    console.log('🎥 DEBUG - Is YouTube URL:', isYouTube);
    
    if (isYouTube) {
        // Use YouTube embed for YouTube URLs
        const youtubeEmbed = createYouTubeEmbed(url, title);
        if (youtubeEmbed) {
            console.log('🎥 DEBUG - YouTube embed created successfully');
            return youtubeEmbed;
        } else {
            console.warn('🎥 DEBUG - Failed to create YouTube embed, falling back to direct video');
            // Fall back to direct video if YouTube embed fails
            return `
                <video controls preload="metadata" style="width: 100%; height: auto;">
                    <source src="${url}" type="video/mp4">
                    Your browser does not support the video element.
                </video>
            `;
        }
    } else {
        // Use standard video element for direct video files
        console.log('🎥 DEBUG - Creating standard video element');
        return `
            <video controls preload="metadata" style="width: 100%; height: auto;">
                <source src="${url}" type="video/mp4">
                <source src="${url}" type="video/webm">
                <source src="${url}" type="video/ogg">
                Your browser does not support the video element.
            </video>
        `;
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
            const scoreContainer = document.querySelector('#score-carousel-container') ||
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
        // Close other open sections for accordion-style behavior
        const allToggles = document.querySelectorAll('.metadata-toggle-item');
        allToggles.forEach((item, i) => {
            if (i !== index && item.classList.contains('active')) {
                item.classList.remove('active');
            }
        });
        
        // Toggle the clicked section
        toggleItem.classList.toggle('active');
        
        // Add smooth scroll to the section if it's being opened
        if (toggleItem.classList.contains('active')) {
            setTimeout(() => {
                toggleItem.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest' 
                });
            }, 200);
        }
    }
}

// Related Compositions Functions
function renderRelatedCompositions(compositions) {
    console.log('🎠 DEBUG - renderRelatedCompositions called with:', compositions?.length, 'compositions');
    const carouselContainer = document.querySelector('#related-compositions-carousel');
    console.log('🎠 DEBUG - Carousel container found:', !!carouselContainer);
    
    if (!carouselContainer || !compositions || compositions.length === 0) {
        console.log('🎠 DEBUG - Early return:', { carouselContainer: !!carouselContainer, compositions: compositions?.length });
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

    console.log('🎠 DEBUG - Generated carousel HTML length:', carouselHtml.length);
    carouselContainer.innerHTML = carouselHtml;
    console.log('🎠 DEBUG - Carousel populated with:', carouselContainer.children.length, 'cards');
}

async function fetchRelatedCompositions(compositionId) {
    const carouselContainer = document.querySelector('#related-compositions-carousel');
    if (!carouselContainer) {
        console.warn('Related compositions carousel container not found');
        return;
    }
    
    try {
        console.log('🔗 API - Fetching related compositions for:', compositionId);
        
        // Show loading state
        carouselContainer.innerHTML = `
            <div class="related-composition-loading">
                <div class="loading-spinner"></div>
                <p>Loading related works...</p>
            </div>
        `;
        
        const response = await fetch(`/api/compositions/${compositionId}/similar`);
        const data = await response.json();
        
        console.log('🔗 API - Response:', data);
        
        if (data.success && data.compositions && data.compositions.length > 0) {
            console.log('🔗 API - Rendering', data.compositions.length, 'related compositions');
            renderRelatedCompositions(data.compositions);
        } else {
            // Show "no related works" message
            carouselContainer.innerHTML = `
                <div class="related-composition-empty">
                    <p>No related works available at this time.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error fetching related compositions:', error);
        carouselContainer.innerHTML = `
            <div class="related-composition-error">
                <p>Unable to load related works.</p>
            </div>
        `;
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