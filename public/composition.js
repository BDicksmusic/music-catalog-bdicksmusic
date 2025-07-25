// composition.js

// Global variables for audio/video players
let currentAudioIndex = 0;
let totalAudioCount = 0;
let currentVideoIndex = 0;
let totalVideoCount = 0;
let videoPlayers = [];

// Loading state management - using component functions with fallback
function showLoading() {
    // Try both possible container IDs (with dash and underscore)
    if (window.showLoading_composition_loading) {
        window.showLoading_composition_loading();
    } else if (window.showLoading_composition_loading) {
        window.showLoading_composition_loading();
    } else {
        // Fallback loading screen
        const fallbackLoading = document.getElementById('fallback-loading');
        if (fallbackLoading) {
            fallbackLoading.style.display = 'flex';
        }
    }
}

function hideLoading() {
    // Try both possible container IDs (with dash and underscore)
    if (window.hideLoading_composition_loading) {
        window.hideLoading_composition_loading();
    } else if (window.hideLoading_composition_loading) {
        window.hideLoading_composition_loading();
    } else {
        // Hide fallback loading screen
        const fallbackLoading = document.getElementById('fallback-loading');
        if (fallbackLoading) {
            fallbackLoading.style.display = 'none';
        }
    }
}

function showLoadingError(message) {
    // Try both possible container IDs (with dash and underscore)
    if (window.showLoadingError_composition_loading) {
        window.showLoadingError_composition_loading(message);
    } else if (window.showLoadingError_composition_loading) {
        window.showLoadingError_composition_loading(message);
    } else {
        // Show error in fallback loading screen
        const fallbackLoading = document.getElementById('fallback-loading');
        if (fallbackLoading) {
            const content = fallbackLoading.querySelector('.fallback-loading-content');
            if (content) {
                content.innerHTML = `
                    <div class="fallback-loading-spinner" style="border-top-color: #e74c3c;"></div>
                    <h3 style="color: #e74c3c;">Error Loading Composition</h3>
                    <p style="color: #e74c3c;">${message || 'Failed to load composition data'}</p>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">Refresh Page</button>
                `;
            }
        }
    }
}

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
    
    // Show loading overlay
    showLoading();
    
    if (!slug) {
        showLoadingError('No composition specified.');
        if (container) {
            container.innerHTML = '<div class="error">No composition specified.</div>';
        }
        return;
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
            hideLoading(); // Hide loading overlay on success
        } else {
            // Fallback to example data
            console.log('API failed, trying example data...');
            const comp = exampleCompositions.find(c => c.slug === slug);
            if (comp) {
                renderComposition(comp);
                hideLoading(); // Hide loading overlay on fallback success
            } else {
                showLoadingError('Composition not found.');
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
            hideLoading(); // Hide loading overlay on fallback success
        } else {
            showLoadingError('Error loading composition details.');
            if (container) {
                container.innerHTML = '<div class="error">Error loading composition details.</div>';
            }
        }
    }
}

function renderComposition(comp) {
    console.log('🎯 Starting renderComposition with:', comp);
    console.log('🎯 DEBUG - COMPREHENSIVE MEDIA ANALYSIS from server:', {
        // Raw arrays from server
        audioFiles: comp.audioFiles?.length || 0,
        videoFiles: comp.videoFiles?.length || 0,
        scoreFiles: comp.scoreFiles?.length || 0,
        allMedia: comp.allMedia?.length || 0,
        
        // Legacy properties
        audioLink: comp.audioLink ? 'PRESENT' : 'MISSING',
        scoreLink: comp.scoreLink ? 'PRESENT' : 'MISSING',
        
        // Media count summary
        mediaCount: comp.mediaCount || 'No mediaCount object',
        
        // Detailed arrays
        audioFilesList: comp.audioFiles?.map(a => ({ title: a.title, url: a.url ? 'YES' : 'NO' })) || [],
        videoFilesList: comp.videoFiles?.map(v => ({ title: v.title, type: v.type, url: v.url ? 'YES' : 'NO' })) || [],
        scoreFilesList: comp.scoreFiles?.map(s => ({ title: s.title, url: s.url ? 'YES' : 'NO' })) || []
    });
    
    // If no media found, provide diagnostic information
    if ((!comp.audioFiles || comp.audioFiles.length === 0) && 
        (!comp.videoFiles || comp.videoFiles.length === 0) && 
        (!comp.scoreFiles || comp.scoreFiles.length === 0) && 
        !comp.audioLink && !comp.scoreLink) {
        
        console.error('❌ NO MEDIA FOUND - Composition has no media relations or links:', {
            compositionId: comp.id,
            compositionTitle: comp.title,
            mediaArraysProvided: {
                audioFiles: !!comp.audioFiles,
                videoFiles: !!comp.videoFiles,
                scoreFiles: !!comp.scoreFiles,
                allMedia: !!comp.allMedia
            },
            legacyLinksProvided: {
                audioLink: !!comp.audioLink,
                scoreLink: !!comp.scoreLink
            },
            mediaCountProvided: !!comp.mediaCount,
            suggestion: 'Check Notion Media database relations for this composition'
        });
        
        // Show helpful notices on the page for missing media
        const audioContainer = document.querySelector('.composition-audio-container');
        if (audioContainer) {
            audioContainer.innerHTML = `
                <div style="padding: 20px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; margin: 1rem 0;">
                    <h4 style="color: #856404; margin: 0 0 10px 0;">⚠️ No Audio Found</h4>
                    <p style="color: #856404; margin: 0; font-size: 0.9rem;">
                        No audio files are linked to this composition in the Media database. 
                        Please check that audio files are properly related via "Audio to Comp" relations.
                    </p>
                </div>
            `;
        }
        
        const videoContainer = document.querySelector('#composition-video-container-main');
        if (videoContainer) {
            videoContainer.innerHTML = `
                <div style="padding: 20px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; margin: 1rem 0;">
                    <h4 style="color: #856404; margin: 0 0 10px 0;">⚠️ No Videos Found</h4>
                    <p style="color: #856404; margin: 0; font-size: 0.9rem;">
                        No video files are linked to this composition in the Media database. 
                        Please check that video files are properly related via "Video to Comp" relations.
                    </p>
                </div>
            `;
        }
    }
    
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
    // YEAR CONTAINER: Faint year display under cover
    // ============================================
    console.log('📅 Rendering Year Container');
    console.log('📅 Year data:', comp.year);
    console.log('📅 Year type:', typeof comp.year);
    const yearContainer = document.querySelector('.composition-year-container');
    if (yearContainer && comp.year) {
        yearContainer.innerHTML = `${comp.year}`;
        console.log('✅ Year container populated with:', comp.year);
    } else if (yearContainer) {
        yearContainer.innerHTML = ''; // Clear if no year
        console.log('⚠️ Year container cleared - no year data');
    } else {
        console.log('❌ Year container not found in DOM');
    }

    // ============================================
    // TITLE SECTION: Title & Instrument (Left Side)
    // ============================================
    console.log('📝 Rendering Title Section');
    const titleSection = document.querySelector('.composition-title-section');
    if (titleSection) {
        titleSection.innerHTML = `
            <h1 class="composition-title">${comp.title || 'Untitled'}</h1>
            <div class="composition-instrument">${comp.instrumentation || 'Unknown'}</div>
        `;
    }

    // ============================================
    // META CONTAINER: Duration, Short Instruments & Difficulty (Right Side)
    // ============================================
    console.log('📊 Rendering Meta Container');
    const metaContainer = document.querySelector('.composition-meta-container');
    if (metaContainer) {
        // Use Notion short instrument list if available, otherwise extract from full instrumentation
        const shortInstrumentList = comp.shortInstrumentList || extractShortInstrumentList(comp.instrumentation || '');
        
        console.log('📊 Meta Container populated:', {
            duration: comp.duration,
            shortInstrumentList: shortInstrumentList,
            difficulty: comp.difficulty
        });
        
        let metaHtml = '';
        
        // Duration
        if (comp.duration) {
            metaHtml += `<div class="composition-meta"><strong>Duration:</strong> ${comp.duration}</div>`;
        }
        
        // Short Instruments (subtle styling)
        if (shortInstrumentList) {
            metaHtml += `<div class="composition-short-instruments">${shortInstrumentList}</div>`;
        }
        
        // Difficulty (low-profile badge)
        if (comp.difficulty) {
            metaHtml += `<div style="margin-top: 0.5rem;"><span class="composition-difficulty-badge">${comp.difficulty}</span></div>`;
        }
        
        metaContainer.innerHTML = metaHtml;
    }

    // ✅ UPDATED: Meta container now populated above with new structure

    // ============================================
    // CONTAINER 3: Layout Builder Navigation
    // ============================================
    console.log('🔗 Rendering Container 3: Layout Builder Navigation');
    const linksContainer = document.querySelector('.composition-links-container');
    if (linksContainer) {
        // Check availability of different sections
        const hasVideos = (comp.videoFiles && comp.videoFiles.filter(v => v.type !== 'Score Video').length > 0);
        const scoreFiles = comp.scoreFiles || [];
        const hasLegacyScore = comp.scoreLink && !scoreFiles.length;
        const hasScore = scoreFiles.length > 0 || hasLegacyScore;
        const hasSimilarWorks = comp.similarWorks && comp.similarWorks.length > 0;
        
        linksContainer.innerHTML = `
            <div class="layout-builder-nav">
                ${hasVideos ? `<button onclick="scrollToVideos()" class="btn-secondary layout-nav-btn">📺 Watch</button>` : ''}
                ${hasScore ? `<button onclick="scrollToScore()" class="btn-secondary layout-nav-btn">📄 View Score</button>` : ''}
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
    // MODULAR AUDIO PLAYER: Load Component and Initialize with Data
    // ============================================
    console.log('🎵 Loading Modular Audio Player Component');
    console.log('🎵 DEBUG - Audio data check:', {
        audioFiles: comp.audioFiles?.length || 0,
        audioLink: comp.audioLink ? 'YES' : 'NO',
        hasLegacyAudio: comp.audioLink && (!comp.audioFiles || comp.audioFiles.length === 0)
    });
    
    const audioPlaceholder = document.querySelector('#audio-player-placeholder');
    if (audioPlaceholder) {
        // Prepare audio data for the component
        const audioFiles = comp.audioFiles || [];
        const hasLegacyAudio = comp.audioLink && !audioFiles.length;
        
        console.log('🎵 Preparing audio data for component:', {
            audioFiles: audioFiles.length,
            hasLegacyAudio: hasLegacyAudio,
            audioFilesDetails: audioFiles.map(a => ({ title: a.title, url: a.url ? 'YES' : 'NO', type: a.type }))
        });
        
        let audioData = {
            audioFiles: [],
            hasMovements: false,
            isMultiMovement: false
        };
        
        if (audioFiles.length > 0) {
            // Sort audio files by movement order
            try {
                audioFiles.sort((a, b) => {
                    const orderA = extractMovementOrder(a.title);
                    const orderB = extractMovementOrder(b.title);
                    return orderA - orderB;
                });
            } catch (error) {
                console.error('Error sorting audio files:', error);
            }
            
            audioData.audioFiles = audioFiles;
            audioData.hasMovements = audioFiles.some(file => file.numberOfMovements > 1 || file.movementTitle);
            audioData.isMultiMovement = audioData.hasMovements && audioFiles.length > 1;
            
        } else if (hasLegacyAudio) {
            // Handle legacy single audio link
            audioData.audioFiles = [{
                id: 'legacy-audio',
                title: comp.title || 'Audio',
                url: comp.audioLink,
                performanceBy: comp.performanceBy,
                recordingDate: comp.recordingDate
            }];
        }
        
        console.log('🎵 Final audioData object:', audioData);
        
        // Load the audio player component
        loadAudioPlayerComponent(audioData, audioPlaceholder);
            } else {
            // No audio data available
            console.log('🎵 No audio data available for this composition');
            if (audioPlaceholder) {
                audioPlaceholder.innerHTML = `
                    <div style="padding: 20px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; margin: 1rem 0;">
                        <h4 style="color: #856404; margin: 0 0 10px 0;">⚠️ No Audio Found</h4>
                        <p style="color: #856404; margin: 0; font-size: 0.9rem;">
                            No audio files are linked to this composition in the Media database. 
                            Please check that audio files are properly related via "Audio to Comp" relations.
                        </p>
                    </div>
                `;
            }
        }
    


// ✅ REMOVED: Short instrument container now handled in meta container above


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
    // NOTE: Scores section is now inside main element for proper layout
    const scoreVideoContainer = document.querySelector('#composition-score-video-container');
    const scoreVideoContent = document.querySelector('#score-video-content');
    
    console.log('🎼 DEBUG - Score video DOM elements:', {
        container: !!scoreVideoContainer,
        content: !!scoreVideoContent
    });
    
    if (scoreVideoContainer) {
        // Ensure score video content element exists
        if (!scoreVideoContent) {
            console.warn('🎼 DEBUG - Score video content element missing, creating it');
            const contentDiv = document.createElement('div');
            contentDiv.id = 'score-video-content';
            scoreVideoContainer.appendChild(contentDiv);
        }
        
        const finalScoreVideoContent = document.querySelector('#score-video-content');
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
                // Clear any existing content
                finalScoreVideoContent.innerHTML = '';
                const scoreVideosHtml = allScoreVideos.map((scoreVideo, index) => {
                    console.log(`🎼 DEBUG - Processing score video ${index + 1}:`, scoreVideo);
                    
                    // Validate video data
                    if (!scoreVideo.url) {
                        console.error(`🎼 ERROR - Score video ${index + 1} has no URL:`, scoreVideo);
                        return `
                            <div class="composition-score-video-player">
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
                            <div class="composition-score-video-player">
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
                        <div class="composition-score-video-player">
                            <div class="score-video-content">
                                ${videoPlayerHtml}
                            </div>
                            ${metadataHtml ? `<div class="score-video-metadata-section">${metadataHtml}</div>` : ''}
                        </div>
                    `;
                }).join('');
                
                console.log('🎼 DEBUG - Final score videos HTML length:', scoreVideosHtml.length);
                finalScoreVideoContent.innerHTML = scoreVideosHtml;
                scoreVideoContainer.style.display = 'block';
                console.log('🎼 DEBUG - Score video container display set to block');
                console.log('🎼 SUCCESS - Score videos rendered successfully');
                
            } catch (error) {
                console.error('🎼 ERROR - Failed to render score videos:', error);
                finalScoreVideoContent.innerHTML = `
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
            scoreVideoContainer.style.display = 'none';
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

    // ===== SCORE CONTROL BUTTONS VISIBILITY & INITIAL LAYOUT =====
    const scoreToggleBtn = document.getElementById('score-toggle-btn');
    const scoreVideoToggleBtn = document.getElementById('score-video-toggle-btn');
    const audioControlBtn = document.getElementById('audio-control-btn');
    const videoColumn = document.getElementById('score-video-column');
    const scoreDivider = document.getElementById('score-divider');
    const layoutContainer = document.getElementById('score-layout-container');
    
    // Check if there's an audio player on the page
    const hasAudioPlayer = document.querySelector('.composition-audio-player audio') !== null;
    
    if (scoreToggleBtn) {
        if (hasPdfScore) {
            // Show toggle button if there's a PDF score available
            scoreToggleBtn.style.display = 'inline-flex';
            console.log('📄 DEBUG - Score toggle button shown (PDF score available)');
            
            // Set initial layout: PDF hidden, video in full width if it exists
            const scoreCarousel = document.getElementById('score-carousel-container');
            if (scoreCarousel) {
                scoreCarousel.classList.remove('show'); // PDF starts hidden
            }
            
            console.log('📄 DEBUG - Initial layout will be handled by ScoreLayoutManager');
        } else {
            // Hide toggle button if no PDF score available
            scoreToggleBtn.style.display = 'none';
            console.log('📄 DEBUG - Score toggle button hidden (no PDF score available)');
            
            console.log('📄 DEBUG - Layout will be handled by ScoreLayoutManager');
        }
    }
    
    // Show/hide score video toggle button
    if (scoreVideoToggleBtn) {
        if (hasScoreVideo) {
            scoreVideoToggleBtn.style.display = 'inline-flex';
            console.log('🎥 DEBUG - Score video toggle button shown (score video available)');
        } else {
            scoreVideoToggleBtn.style.display = 'none';
            console.log('🎥 DEBUG - Score video toggle button hidden (no score video available)');
        }
    }
    
    // Show/hide audio control button
    if (audioControlBtn) {
        if (hasAudioPlayer) {
            audioControlBtn.style.display = 'inline-flex';
            console.log('🎵 DEBUG - Audio control button shown (audio player available)');
        } else {
            audioControlBtn.style.display = 'none';
            console.log('🎵 DEBUG - Audio control button hidden (no audio player available)');
        }
    }

    // Layout management is now handled by ScoreLayoutManager
    console.log('🔧 DEBUG - Layout management delegated to ScoreLayoutManager');
    
    // New Structured Composition Details System
    // Related Works Carousel Component
    console.log('🔗 DEBUG - Similar works data:', comp.similarWorks?.length, comp.similarWorks);
    console.log('🔗 DEBUG - Similar works slugs data:', comp.similarWorksSlugs?.length, comp.similarWorksSlugs);
    
    const relatedWorksPlaceholder = document.querySelector('#related-works-placeholder');
    
    if (comp.similarWorks && comp.similarWorks.length > 0) {
        console.log('🔗 DEBUG - Loading related works carousel component with data:', comp.similarWorks.length);
        loadRelatedWorksCarouselComponent(comp.similarWorks, relatedWorksPlaceholder);
    } else if (comp.similarWorksSlugs && comp.similarWorksSlugs.length > 0) {
        console.log('🔗 DEBUG - Similar works slugs found but no compositions loaded, this indicates a server-side issue');
        // The server should have already fetched these, but fallback to API if needed
        fetchRelatedCompositionsForComponent(comp.id, relatedWorksPlaceholder);
    } else {
        console.log('🔗 DEBUG - No similar works or slugs found, fetching via API fallback...');
        // Try to fetch related compositions if not provided
        fetchRelatedCompositionsForComponent(comp.id, relatedWorksPlaceholder);
    }
}

// Audio Player Component Functions (moved outside renderComposition)
async function loadAudioPlayerComponent(audioData, audioPlaceholder) {
    try {
        console.log('🎵 Loading audio player component with data:', audioData);
        
        // Generate unique container ID
        const containerId = `composition-${Date.now()}`;
        
        // Use ComponentLoader to fetch and inject the component
        let componentHtml;
        if (typeof window.ComponentLoader !== 'undefined' && window.ComponentLoader.fetchComponent) {
            componentHtml = await window.ComponentLoader.fetchComponent('audio-player');
        } else if (typeof fetchComponent !== 'undefined') {
            componentHtml = await fetchComponent('audio-player');
        } else {
            console.error('🎵 No component loader available, using fallback audio player');
            createFallbackAudioPlayer(audioData, audioPlaceholder);
            return;
        }
            
        if (componentHtml) {
            // Replace template variables
            const processedHtml = componentHtml.replace(/{{containerId}}/g, containerId);
            audioPlaceholder.innerHTML = processedHtml;
            
            // Wait a bit for the component to initialize, then pass data
            setTimeout(() => {
                const initFunction = window[`initAudioPlayer_${containerId}`];
                if (initFunction && typeof initFunction === 'function') {
                    console.log('🎵 Initializing audio player component with data');
                    initFunction(audioData);
                } else {
                    console.error('🎵 Audio player initialization function not found:', `initAudioPlayer_${containerId}`);
                    createFallbackAudioPlayer(audioData, audioPlaceholder);
                }
            }, 200);
            
        } else {
            console.error('🎵 Failed to load audio player component, using fallback');
            createFallbackAudioPlayer(audioData, audioPlaceholder);
        }
        
    } catch (error) {
        console.error('🎵 Error loading audio player component:', error);
        showAudioLoadError(audioPlaceholder);
    }
}

function showAudioLoadError(audioPlaceholder) {
    if (audioPlaceholder) {
        audioPlaceholder.innerHTML = `
            <div style="padding: 20px; background: #ffe6e6; border: 2px solid #ff9999; border-radius: 8px; margin: 1rem 0;">
                <h4 style="color: #cc0000; margin: 0 0 10px 0;">⚠️ Audio Player Load Error</h4>
                <p style="color: #cc0000; margin: 0; font-size: 0.9rem;">
                    Failed to load the audio player component. Please refresh the page.
                </p>
            </div>
        `;
    }
}

function createFallbackAudioPlayer(audioData, audioPlaceholder) {
    console.log('🎵 Creating fallback audio player with data:', audioData);
    if (!audioPlaceholder) {
        console.error('🎵 No audio placeholder found for fallback player');
        return;
    }
    
    if (!audioData || !audioData.audioFiles || audioData.audioFiles.length === 0) {
        audioPlaceholder.innerHTML = `
            <div style="padding: 20px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; margin: 1rem 0;">
                <h4 style="color: #856404; margin: 0 0 10px 0;">⚠️ No Audio Available</h4>
                <p style="color: #856404; margin: 0; font-size: 0.9rem;">
                    No audio files are available for this composition.
                </p>
            </div>
        `;
        return;
    }
    
    const audioFiles = audioData.audioFiles;
    const isMultiTrack = audioFiles.length > 1;
    
    let audioHtml = `
        <div class="composition-audio-container" style="background: white; border: 1px solid var(--gray-200); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
    `;
    
    audioFiles.forEach((audioFile, index) => {
        const displayStyle = isMultiTrack && index > 0 ? 'display: none;' : 'display: block;';
        
        // Only show movement title for multi-movement pieces
        const displayTitle = extractMovementTitle(audioFile.title) || audioFile.title;
        const titleHtml = isMultiTrack && displayTitle ? 
            `<div style="font-size: 1.1rem; font-weight: 600; color: var(--primary-600); margin-bottom: 0.5rem;">${displayTitle}</div>` : '';
        
        // Performance info goes below the title
        let performanceHtml = '';
        if (audioFile.performanceBy || audioFile.recordingDate) {
            performanceHtml = `
                <div style="font-size: 0.9rem; color: var(--gray-600); margin-bottom: 0.75rem;">
                    ${audioFile.performanceBy ? `<div class="performance-info">Performed by: ${audioFile.performanceBy}</div>` : ''}
                    ${audioFile.recordingDate ? `<div>Recorded: ${new Date(audioFile.recordingDate).toLocaleDateString()}</div>` : ''}
                </div>
            `;
        }
        
        audioHtml += `
            <div class="audio-track" data-track="${index}" style="${displayStyle}">
                ${titleHtml}
                ${performanceHtml}
                <audio controls preload="metadata" style="width: 100%; margin-bottom: 0.75rem;">
                    <source src="${audioFile.url}" type="audio/mpeg">
                    <source src="${audioFile.url}" type="audio/mp4">
                    <source src="${audioFile.url}" type="audio/wav">
                    <source src="${audioFile.url}" type="audio/ogg">
                    Your browser does not support the audio element.
                </audio>
                ${audioFile.duration ? `<div style="font-size: 0.8rem; color: var(--gray-500);">Duration: ${audioFile.duration}</div>` : ''}
            </div>
        `;
    });
    
    // Add button navigation for multi-track
    if (isMultiTrack) {
        audioHtml += `
            <div style="height: 1px; background: var(--gray-200); margin: 0.75rem 0;"></div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; background: transparent;">
                <button class="audio-nav-btn" id="prev-audio-fallback" style="padding: 0.5rem 1rem; background: var(--primary-600); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; transition: background-color 0.2s;">Previous</button>
                <span class="audio-nav-info" id="audio-nav-info-fallback" style="font-weight: 600; color: var(--gray-700); font-size: 0.95rem;">Movement 1 of ${audioFiles.length}</span>
                <button class="audio-nav-btn" id="next-audio-fallback" style="padding: 0.5rem 1rem; background: var(--primary-600); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; transition: background-color 0.2s;">Next</button>
            </div>
        `;
    }
    
    audioHtml += `</div>`;
    
    audioPlaceholder.innerHTML = audioHtml;
    
    // Add track switching functionality for multi-track
    if (isMultiTrack) {
        let currentTrack = 0;
        const prevBtn = document.getElementById('prev-audio-fallback');
        const nextBtn = document.getElementById('next-audio-fallback');
        const navInfo = document.getElementById('audio-nav-info-fallback');
        
        function updateFallbackNavigation() {
            prevBtn.disabled = currentTrack === 0;
            nextBtn.disabled = currentTrack === audioFiles.length - 1;
            navInfo.textContent = `Movement ${currentTrack + 1} of ${audioFiles.length}`;
        }
        
        function switchTrack(index) {
            document.querySelectorAll('.audio-track').forEach((track, i) => {
                track.style.display = i === index ? 'block' : 'none';
            });
            currentTrack = index;
            updateFallbackNavigation();
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentTrack > 0) {
                    switchTrack(currentTrack - 1);
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (currentTrack < audioFiles.length - 1) {
                    switchTrack(currentTrack + 1);
                }
            });
        }
        
        updateFallbackNavigation();
    }
    
    console.log('✅ Fallback audio player created successfully');
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
    // Clean up any existing navigation controls first
    const existingNavControls = document.querySelectorAll('.audio-nav-container');
    existingNavControls.forEach(control => control.remove());
    
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
    
    // Add navigation controls INSIDE the audio container with a divider
    const controlsHtml = `
        <div class="audio-nav-divider" style="
            height: 1px; 
            background: linear-gradient(to right, transparent, #e2e8f0, transparent); 
            margin: 1.5rem 0 1rem 0;
        "></div>
        <div class="audio-nav-container" style="
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 0.75rem 1rem; 
            background: var(--gray-50); 
            border-radius: 8px; 
            margin-top: 1rem;
            border: 1px solid var(--gray-200);
        ">
            <button class="audio-nav-btn" id="prevAudioBtn" style="
                padding: 0.5rem 1rem; 
                background: var(--primary-600); 
                color: white; 
                border: none; 
                border-radius: 6px; 
                cursor: pointer;
                font-size: 0.9rem;
                transition: background-color 0.2s;
            ">⏮ Previous</button>
            <span class="audio-nav-info" id="audioNavInfo" style="
                font-weight: 600; 
                color: var(--gray-700);
                font-size: 0.95rem;
            ">Movement 1 of ${audioCount}</span>
            <button class="audio-nav-btn" id="nextAudioBtn" style="
                padding: 0.5rem 1rem; 
                background: var(--primary-600); 
                color: white; 
                border: none; 
                border-radius: 6px; 
                cursor: pointer;
                font-size: 0.9rem;
                transition: background-color 0.2s;
            ">Next ⏭</button>
        </div>
    `;
    
    // Insert navigation INSIDE the audio container (at the end)
    audioContainer.insertAdjacentHTML('beforeend', controlsHtml);
    
    // Also add event listeners as backup (in case onclick doesn't work)
    setTimeout(() => {
        const prevBtn = document.getElementById('prevAudioBtn');
        const nextBtn = document.getElementById('nextAudioBtn');
        
        console.log('🎵 BUTTON SETUP - Setting up event listeners:', {
            prevBtn: !!prevBtn,
            nextBtn: !!nextBtn,
            currentAudioIndex: currentAudioIndex,
            totalAudioCount: totalAudioCount
        });
        
        if (prevBtn) {
            // Clear any existing onclick to prevent double calls
            prevBtn.onclick = null;
            
            // Clone the button to remove all existing event listeners
            const newPrevBtn = prevBtn.cloneNode(true);
            prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
            
            console.log('🎵 BUTTON SETUP - Previous button cloned and replaced');
            
            // Add single event listener with debugging
            newPrevBtn.addEventListener('click', (e) => {
                console.log('🎵 PREV BUTTON CLICKED - event triggered, preventing default and propagation');
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation(); // Prevent other listeners on same element
                previousAudio();
            }, { once: false, passive: false });
            
            // Add hover effects
            newPrevBtn.addEventListener('mouseenter', () => {
                newPrevBtn.style.backgroundColor = 'var(--primary-700)';
            });
            newPrevBtn.addEventListener('mouseleave', () => {
                newPrevBtn.style.backgroundColor = newPrevBtn.disabled ? 'var(--gray-400)' : 'var(--primary-600)';
            });
            
            console.log('🎵 BUTTON SETUP - Previous button event listener attached');
        }
        
        if (nextBtn) {
            // Clear any existing onclick to prevent double calls
            nextBtn.onclick = null;
            
            // Clone the button to remove all existing event listeners
            const newNextBtn = nextBtn.cloneNode(true);
            nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
            
            console.log('🎵 BUTTON SETUP - Next button cloned and replaced');
            
            // Add single event listener with debugging
            newNextBtn.addEventListener('click', (e) => {
                console.log('🎵 NEXT BUTTON CLICKED - event triggered, preventing default and propagation');
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation(); // Prevent other listeners on same element
                nextAudio();
            }, { once: false, passive: false });
            
            // Add hover effects
            newNextBtn.addEventListener('mouseenter', () => {
                newNextBtn.style.backgroundColor = 'var(--primary-700)';
            });
            newNextBtn.addEventListener('mouseleave', () => {
                newNextBtn.style.backgroundColor = newNextBtn.disabled ? 'var(--gray-400)' : 'var(--primary-600)';
            });
            
            console.log('🎵 BUTTON SETUP - Next button event listener attached');
        }
        
        // Initial button state update
        updateAudioNavButtons();
        
        console.log('🎵 BUTTON SETUP - Initial setup complete');
    }, 100);
    
    // Update button states
    updateAudioNavButtons();
}

// (Navigation functions moved to bottom of file to avoid conflicts)

// Switch to specific audio player
function switchToAudio(index) {
    console.log('🎵 switchToAudio called - switching to index:', index, 'from currentIndex:', currentAudioIndex);
    
    // COMPREHENSIVE DOM INSPECTION
    const audioContainer = document.querySelector('.composition-audio-container');
    if (!audioContainer) {
        console.error('🚨 switchToAudio - audio container not found!');
        return;
    }
    
    const audioPlayers = audioContainer.querySelectorAll('.composition-audio-player');
    console.log('🔍 FULL DOM INSPECTION:');
    console.log('🔍 - Audio container found:', !!audioContainer);
    console.log('🔍 - Total players in DOM:', audioPlayers.length);
    console.log('🔍 - Expected totalAudioCount:', totalAudioCount);
    console.log('🔍 - Current index:', currentAudioIndex);
    console.log('🔍 - Target index:', index);
    
    // Log every single audio player with full details
    console.log('🔍 DETAILED PLAYER ANALYSIS:');
    Array.from(audioPlayers).forEach((player, i) => {
        const title = player.querySelector('.composition-audio-title')?.textContent?.trim() || 
                     player.querySelector('.audio-title')?.textContent?.trim() || 
                     player.querySelector('h4')?.textContent?.trim() || 'No title found';
        const isVisible = player.style.display !== 'none';
        const hasAudio = !!player.querySelector('audio');
        const dataIndex = player.getAttribute('data-audio-index');
        
        console.log(`🔍   Player ${i}:`, {
            title: title,
            visible: isVisible,
            hasAudio: hasAudio,
            dataIndex: dataIndex,
            element: player
        });
    });
    
    // Validate index
    if (index < 0 || index >= audioPlayers.length) {
        console.error('🚨 switchToAudio - Invalid audio index:', index, 'valid range: 0 to', audioPlayers.length - 1);
        console.error('🚨 Available players:', audioPlayers.length, 'Expected count:', totalAudioCount);
        return;
    }
    
    // Hide current audio player
    if (currentAudioIndex >= 0 && currentAudioIndex < audioPlayers.length && audioPlayers[currentAudioIndex]) {
        const currentTitle = audioPlayers[currentAudioIndex].querySelector('.composition-audio-title')?.textContent?.trim() || 
                           audioPlayers[currentAudioIndex].querySelector('.audio-title')?.textContent?.trim() || 
                           audioPlayers[currentAudioIndex].querySelector('h4')?.textContent?.trim() || 'No title';
        
        audioPlayers[currentAudioIndex].style.display = 'none';
        
        // Pause current audio if playing
        const currentAudio = audioPlayers[currentAudioIndex].querySelector('audio');
        if (currentAudio && !currentAudio.paused) {
            currentAudio.pause();
            console.log('🎵 PAUSED audio at index:', currentAudioIndex);
        }
        console.log('🎵 HIDING audio player at index:', currentAudioIndex, 'Title:', currentTitle);
    }
    
    // Show new audio player
    const previousIndex = currentAudioIndex;
    currentAudioIndex = index;
    
    if (audioPlayers[currentAudioIndex]) {
        const newTitle = audioPlayers[currentAudioIndex].querySelector('.composition-audio-title')?.textContent?.trim() || 
                        audioPlayers[currentAudioIndex].querySelector('.audio-title')?.textContent?.trim() || 
                        audioPlayers[currentAudioIndex].querySelector('h4')?.textContent?.trim() || 'No title';
        
        audioPlayers[currentAudioIndex].style.display = 'block';
        console.log('🎵 SHOWING audio player at index:', currentAudioIndex, 'Title:', newTitle);
        
        // Scroll the new audio player into view if needed
        audioPlayers[currentAudioIndex].scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
        });
        
        console.log('🎵 NAVIGATION SUMMARY:', {
            from: previousIndex,
            to: currentAudioIndex,
            fromTitle: previousIndex >= 0 ? (audioPlayers[previousIndex]?.querySelector('.composition-audio-title')?.textContent?.trim() || 'N/A') : 'N/A',
            toTitle: newTitle
        });
    } else {
        console.error('🚨 switchToAudio - Audio player not found at index:', currentAudioIndex);
    }
    
    // Update navigation
    updateAudioNavButtons();
}

// Update navigation button states
function updateAudioNavButtons() {
    // Use global button selectors since the navigation is now inside the audio container
    const prevBtn = document.getElementById('prevAudioBtn');
    const nextBtn = document.getElementById('nextAudioBtn');
    const navInfo = document.getElementById('audioNavInfo');
    
    if (prevBtn) {
        prevBtn.disabled = currentAudioIndex === 0;
        prevBtn.style.backgroundColor = prevBtn.disabled ? 'var(--gray-400)' : 'var(--primary-600)';
        prevBtn.style.cursor = prevBtn.disabled ? 'not-allowed' : 'pointer';
    }
    if (nextBtn) {
        nextBtn.disabled = currentAudioIndex === totalAudioCount - 1;
        nextBtn.style.backgroundColor = nextBtn.disabled ? 'var(--gray-400)' : 'var(--primary-600)';
        nextBtn.style.cursor = nextBtn.disabled ? 'not-allowed' : 'pointer';
    }
    if (navInfo) navInfo.textContent = `Movement ${currentAudioIndex + 1} of ${totalAudioCount}`;
}

// Navigation functions for multiple audio files
function previousAudio() {
    // Add call counter to detect double calls
    if (!window.prevAudioCallCount) window.prevAudioCallCount = 0;
    window.prevAudioCallCount++;
    
    console.log('🎵 previousAudio called - CALL #' + window.prevAudioCallCount + ' - currentIndex:', currentAudioIndex, 'totalCount:', totalAudioCount);
    console.log('🎵 previousAudio - DOM CHECK:', {
        audioContainer: !!document.querySelector('.composition-audio-container'),
        playersFound: document.querySelectorAll('.composition-audio-player').length,
        currentIndexValid: currentAudioIndex >= 0,
        canGoPrevious: currentAudioIndex > 0
    });
    
    if (currentAudioIndex > 0) {
        const newIndex = currentAudioIndex - 1;
        console.log('🎵 previousAudio - calling switchToAudio with index:', newIndex);
        switchToAudio(newIndex);
    } else {
        console.log('🎵 previousAudio - cannot go previous, already at index 0');
    }
    
    // Reset counter after a delay to detect rapid consecutive calls
    setTimeout(() => { window.prevAudioCallCount = 0; }, 1000);
}

function nextAudio() {
    // Add call counter to detect double calls
    if (!window.nextAudioCallCount) window.nextAudioCallCount = 0;
    window.nextAudioCallCount++;
    
    console.log('🎵 nextAudio called - CALL #' + window.nextAudioCallCount + ' - currentIndex:', currentAudioIndex, 'totalCount:', totalAudioCount);
    console.log('🎵 nextAudio - DOM CHECK:', {
        audioContainer: !!document.querySelector('.composition-audio-container'),
        playersFound: document.querySelectorAll('.composition-audio-player').length,
        currentIndexValid: currentAudioIndex >= 0,
        canGoNext: currentAudioIndex < totalAudioCount - 1
    });
    
    if (currentAudioIndex < totalAudioCount - 1) {
        const newIndex = currentAudioIndex + 1;
        console.log('🎵 nextAudio - calling switchToAudio with index:', newIndex);
        switchToAudio(newIndex);
    } else {
        console.log('🎵 nextAudio - cannot go next, already at index', currentAudioIndex, 'of', totalAudioCount - 1);
    }
    
    // Reset counter after a delay to detect rapid consecutive calls
    setTimeout(() => { window.nextAudioCallCount = 0; }, 1000);
}

// Make functions globally accessible for onclick handlers
window.previousAudio = previousAudio;
window.nextAudio = nextAudio;
window.switchToAudio = switchToAudio;

// Global debug function for inspecting audio player state
window.debugAudioPlayers = function() {
    console.log('🔍 DEBUG AUDIO PLAYERS - COMPLETE STATE INSPECTION');
    console.log('🔍 Global variables:', {
        currentAudioIndex: currentAudioIndex,
        totalAudioCount: totalAudioCount
    });
    
    const audioContainer = document.querySelector('.composition-audio-container');
    console.log('🔍 Container found:', !!audioContainer);
    
    if (audioContainer) {
        const audioPlayers = audioContainer.querySelectorAll('.composition-audio-player');
        console.log('🔍 Total players in DOM:', audioPlayers.length);
        
        Array.from(audioPlayers).forEach((player, i) => {
            const title = player.querySelector('.composition-audio-title')?.textContent?.trim() || 'No title';
            const isVisible = player.style.display !== 'none';
            const hasAudio = !!player.querySelector('audio');
            const dataIndex = player.getAttribute('data-audio-index');
            
            console.log(`🔍 Player ${i}:`, {
                title: title,
                visible: isVisible,
                hasAudio: hasAudio,
                dataIndex: dataIndex,
                currentlyActive: i === currentAudioIndex
            });
        });
    }
    
    const prevBtn = document.getElementById('prevAudioBtn');
    const nextBtn = document.getElementById('nextAudioBtn');
    console.log('🔍 Navigation buttons:', {
        prevBtn: !!prevBtn,
        nextBtn: !!nextBtn,
        prevDisabled: prevBtn?.disabled,
        nextDisabled: nextBtn?.disabled
    });
    
    console.log('🔍 ===== END DEBUG =====');
};

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
    const videosSection = document.querySelector('.program-video-section');
    if (videosSection) {
        videosSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
        });
        
        // Add a subtle highlight effect
        videosSection.style.transition = 'all 0.3s ease';
        videosSection.style.transform = 'scale(1.02)';
        setTimeout(() => {
            videosSection.style.transform = 'scale(1)';
        }, 300);
        
        console.log('✅ Scrolled to Videos section');
    } else {
        console.warn('Videos section not found');
    }
}

function scrollToScore() {
    const scoreSection = document.querySelector('.scores-section');
    if (scoreSection) {
        scoreSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
        });
        
        // Add a subtle highlight effect
        scoreSection.style.transition = 'all 0.3s ease';
        scoreSection.style.transform = 'scale(1.02)';
        setTimeout(() => {
            scoreSection.style.transform = 'scale(1)';
        }, 300);
        
        // Automatically show the PDF if it's hidden
        const scoreCarousel = document.getElementById('score-carousel-container');
        const toggleBtn = document.getElementById('score-toggle-btn');
        if (scoreCarousel && toggleBtn && !scoreCarousel.classList.contains('show')) {
            // Small delay to ensure scroll animation completes first
            setTimeout(() => {
                toggleScorePDF();
            }, 500);
        }
        
        console.log('✅ Scrolled to Score section');
    } else {
        console.warn('Score section not found');
    }
}

function scrollToMetadata() {
    const metadataSection = document.querySelector('.metadata-section');
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
    const similarWorksSection = document.querySelector('#related-works-placeholder');
    if (similarWorksSection) {
        similarWorksSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
        });
        
        // Add a subtle highlight effect
        similarWorksSection.style.transition = 'all 0.3s ease';
        similarWorksSection.style.transform = 'scale(1.02)';
        setTimeout(() => {
            similarWorksSection.style.transform = 'scale(1)';
        }, 300);
        
        console.log('✅ Scrolled to Similar Works section');
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

// Metadata toggle function removed - using new structured format

// Related Works Carousel Component Functions
async function loadRelatedWorksCarouselComponent(compositions, placeholder) {
    try {
        console.log('🎠 Loading related works carousel component with data:', compositions?.length);
        
        // Generate unique container ID
        const containerId = `related-works-${Date.now()}`;
        
        // Use ComponentLoader to fetch and inject the component
        let componentHtml;
        if (typeof window.ComponentLoader !== 'undefined' && window.ComponentLoader.fetchComponent) {
            componentHtml = await window.ComponentLoader.fetchComponent('related-works-carousel');
        } else if (typeof fetchComponent !== 'undefined') {
            componentHtml = await fetchComponent('related-works-carousel');
        } else {
            console.error('🎠 No component loader available, using fallback related works display');
            createFallbackRelatedWorksDisplay(compositions, placeholder);
            return;
        }
            
        if (componentHtml) {
            // Replace template variables
            const processedHtml = componentHtml
                .replace(/{{containerId}}/g, containerId)
                .replace(/{{title}}/g, 'Related Works');
            
            placeholder.innerHTML = processedHtml;
            
            // Wait a bit for the component to initialize, then pass data
            setTimeout(() => {
                const initFunction = window[`initRelatedWorksCarousel_${containerId}`];
                if (initFunction && typeof initFunction === 'function') {
                    console.log('🎠 Initializing related works carousel component with data');
                    initFunction(compositions);
                } else {
                    console.error('🎠 Related works carousel initialization function not found:', `initRelatedWorksCarousel_${containerId}`);
                    createFallbackRelatedWorksDisplay(compositions, placeholder);
                }
            }, 200);
            
        } else {
            console.error('🎠 Failed to load related works carousel component, using fallback');
            createFallbackRelatedWorksDisplay(compositions, placeholder);
        }
        
    } catch (error) {
        console.error('🎠 Error loading related works carousel component:', error);
        createFallbackRelatedWorksDisplay(compositions, placeholder);
    }
}

function createFallbackRelatedWorksDisplay(compositions, placeholder) {
    console.log('🎠 Creating fallback related works display with data:', compositions?.length);
    if (!placeholder) {
        console.error('🎠 No placeholder found for fallback related works display');
        return;
    }
    
    if (!compositions || compositions.length === 0) {
        placeholder.innerHTML = `
            <div style="padding: 20px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; margin: 1rem 0;">
                <h4 style="color: #856404; margin: 0 0 10px 0;">⚠️ No Related Works</h4>
                <p style="color: #856404; margin: 0; font-size: 0.9rem;">
                    No related works are available for this composition.
                </p>
            </div>
        `;
        return;
    }
    
    const carouselHtml = compositions.map(comp => `
        <div class="related-composition-card" onclick="navigateToComposition('${comp.slug}')" style="
            min-width: 200px; max-width: 200px; flex: 0 0 auto; 
            background: linear-gradient(145deg, var(--gray-50) 0%, var(--gray-100) 100%); 
            border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); 
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; 
            border: 1px solid var(--gray-200); position: relative; transform: translateY(0); opacity: 1;
        ">
            ${comp.coverImage ? `
                <img src="${comp.coverImage}" alt="${comp.title}" style="
                    width: 100%; height: 258px; object-fit: cover; object-position: center; 
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); background: var(--gray-200);
                " loading="lazy">
            ` : `
                <div style="
                    width: 100%; height: 258px; display: flex; align-items: center; 
                    justify-content: center; color: var(--gray-400); font-size: 2rem; background: var(--gray-200);
                ">♪</div>
            `}
            <div style="padding: 0.75rem;">
                <h4 style="
                    font-size: 0.9rem; font-weight: 600; color: var(--gray-900); 
                    margin-bottom: 0.25rem; line-height: 1.2; display: flex; align-items: center; gap: 0.25rem;
                ">♪ ${comp.title}</h4>
                <div style="
                    font-size: 0.75rem; color: var(--gray-600); font-weight: 500; 
                    margin-bottom: 0; line-height: 1.2;
                ">${comp.instrumentation}</div>
            </div>
        </div>
    `).join('');
    
    placeholder.innerHTML = `
        <div style="
            width: 100%; max-width: 1400px; margin: 2rem auto 0; padding: 0 1rem; box-sizing: border-box;
        ">
            <div style="
                background: white; border-radius: 12px; border: 1px solid var(--gray-200); 
                padding: 1.5rem; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
            ">
                <h3 style="
                    color: var(--primary-600); margin-bottom: 1.5rem; font-size: 1.25rem; 
                    font-weight: 600; text-align: center; padding-bottom: 0.75rem; 
                    border-bottom: 2px solid var(--primary-100);
                ">Related Works</h3>
                <div style="
                    display: flex; flex-direction: row; overflow-x: auto; overflow-y: hidden; 
                    gap: 1rem; padding: 0.5rem 0; width: 100%; scroll-behavior: smooth; 
                    -webkit-overflow-scrolling: touch;
                ">
                    ${carouselHtml}
                </div>
            </div>
        </div>
    `;
    
    console.log('✅ Fallback related works display created successfully');
}

async function fetchRelatedCompositionsForComponent(compositionId, placeholder) {
    if (!placeholder) {
        console.warn('Related works placeholder not found');
        return;
    }
    
    try {
        console.log('🔗 API - Fetching related compositions for:', compositionId);
        
        // Show loading state
        placeholder.innerHTML = `
            <div style="
                width: 100%; max-width: 1400px; margin: 2rem auto 0; padding: 0 1rem; box-sizing: border-box;
            ">
                <div style="
                    background: white; border-radius: 12px; border: 1px solid var(--gray-200); 
                    padding: 1.5rem; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
                ">
                    <h3 style="
                        color: var(--primary-600); margin-bottom: 1.5rem; font-size: 1.25rem; 
                        font-weight: 600; text-align: center; padding-bottom: 0.75rem; 
                        border-bottom: 2px solid var(--primary-100);
                    ">Related Works</h3>
                    <div style="
                        display: flex; flex-direction: column; align-items: center; justify-content: center; 
                        padding: 2rem 1rem; text-align: center; color: var(--gray-600);
                    ">
                        <div style="
                            width: 24px; height: 24px; border: 2px solid var(--gray-200); 
                            border-top: 2px solid var(--primary-500); border-radius: 50%; 
                            animation: spin 1s linear infinite; margin-bottom: 0.75rem;
                        "></div>
                        <p style="margin: 0; font-size: 0.85rem;">Loading related works...</p>
                    </div>
                </div>
            </div>
        `;
        
        const response = await fetch(`/api/compositions/${compositionId}/similar`);
        const data = await response.json();
        
        console.log('🔗 API - Response:', data);
        
        if (data.success && data.compositions && data.compositions.length > 0) {
            console.log('🔗 API - Loading component with', data.compositions.length, 'related compositions');
            loadRelatedWorksCarouselComponent(data.compositions, placeholder);
        } else {
            // Show "no related works" message
            placeholder.innerHTML = `
                <div style="
                    width: 100%; max-width: 1400px; margin: 2rem auto 0; padding: 0 1rem; box-sizing: border-box;
                ">
                    <div style="
                        background: white; border-radius: 12px; border: 1px solid var(--gray-200); 
                        padding: 1.5rem; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
                    ">
                        <h3 style="
                            color: var(--primary-600); margin-bottom: 1.5rem; font-size: 1.25rem; 
                            font-weight: 600; text-align: center; padding-bottom: 0.75rem; 
                            border-bottom: 2px solid var(--primary-100);
                        ">Related Works</h3>
                        <div style="
                            display: flex; flex-direction: column; align-items: center; justify-content: center; 
                            padding: 2rem 1rem; text-align: center; color: var(--gray-600);
                        ">
                            <p style="margin: 0; font-size: 0.85rem;">No related works available at this time.</p>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error fetching related compositions:', error);
        placeholder.innerHTML = `
            <div style="
                width: 100%; max-width: 1400px; margin: 2rem auto 0; padding: 0 1rem; box-sizing: border-box;
            ">
                <div style="
                    background: white; border-radius: 12px; border: 1px solid var(--gray-200); 
                    padding: 1.5rem; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
                ">
                    <h3 style="
                        color: var(--primary-600); margin-bottom: 1.5rem; font-size: 1.25rem; 
                        font-weight: 600; text-align: center; padding-bottom: 0.75rem; 
                        border-bottom: 2px solid var(--primary-100);
                    ">Related Works</h3>
                    <div style="
                        display: flex; flex-direction: column; align-items: center; justify-content: center; 
                        padding: 2rem 1rem; text-align: center; color: var(--gray-600);
                    ">
                        <p style="margin: 0; font-size: 0.85rem;">Unable to load related works.</p>
                    </div>
                </div>
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