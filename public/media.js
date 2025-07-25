// Media Portfolio JavaScript

// Configuration
const YOUTUBE_API_KEY = 'YOUR_YOUTUBE_API_KEY'; // Replace with your API key
const YOUTUBE_CHANNEL_ID = 'UCrKhLmCV6fTbM7oZMb6_Q1A'; // Your actual channel ID
const NOTION_DATABASE_URL = '/api/notion-media'; // Local API endpoint

document.addEventListener('DOMContentLoaded', function() {
    initMediaFilters();
    initAudioPlayers();
    initVideoPlayers();
    initSecondaryNavigation();
    
    // Test Notion connection first, then load content
    testNotionConnection().then(() => {
        loadDynamicContent();
    });
    
    // Mobile menu is now handled by main.js
});

// Enhanced filter functionality with immediate content display
function initMediaFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const compositionCards = document.querySelectorAll('.composition-card');
    const audioShowcase = document.querySelector('.audio-showcase');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.querySelector('.search-btn');

    // Filter button functionality
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Clear search input when filtering
            searchInput.value = '';
            
            // First, hide all items immediately
            compositionCards.forEach(item => {
                item.classList.add('hidden');
                item.classList.remove('visible');
            });
            
            // Small delay to allow hiding animation, then show relevant items
            setTimeout(() => {
                let visibleItems = [];
                
                compositionCards.forEach(item => {
                    const category = item.getAttribute('data-category');
                    
                    if (filter === 'all' || category === filter) {
                        visibleItems.push(item);
                    }
                });
                
                // Show visible items with staggered animation
                visibleItems.forEach((item, index) => {
                    setTimeout(() => {
                        item.classList.remove('hidden');
                        item.classList.add('visible');
                    }, index * 100); // Stagger by 100ms for smooth effect
                });
                
            }, 150); // Brief delay for hide animation
            
            // Special handling for audio filter - auto-scroll to audio section
            if (filter === 'audio') {
                setTimeout(() => {
                    if (audioShowcase) {
                        audioShowcase.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                        });
                        // Highlight the audio section briefly
                        audioShowcase.style.background = 'var(--primary-50)';
                        setTimeout(() => {
                            audioShowcase.style.background = '';
                        }, 2000);
                    }
                }, 600); // Wait for items to appear first
            }
        });
    });

    // Clear All button functionality
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function() {
            // Reset all filters to "All Media"
            filterBtns.forEach(b => b.classList.remove('active'));
            const allBtn = document.querySelector('[data-filter="all"]');
            if (allBtn) {
                allBtn.classList.add('active');
            }
            
            // Clear search
            searchInput.value = '';
            
            // Show all items
            compositionCards.forEach(item => {
                item.classList.remove('hidden');
                item.classList.add('visible');
            });
            
            // Visual feedback
            this.style.background = 'var(--green-500)';
            this.textContent = 'Cleared!';
            setTimeout(() => {
                this.style.background = 'var(--red-500)';
                this.textContent = 'Clear All';
            }, 1000);
        });
    }

    // Search functionality
    function performSearch() {
        const query = searchInput.value.toLowerCase().trim();
        
        if (query === '') {
            // If search is empty, show all items based on current filter
            const activeFilter = document.querySelector('.filter-btn.active');
            if (activeFilter) {
                activeFilter.click();
            }
            return;
        }
        
        // Clear active filter
        filterBtns.forEach(b => b.classList.remove('active'));
        
        // Hide all items first
        compositionCards.forEach(item => {
            item.classList.add('hidden');
            item.classList.remove('visible');
        });
        
        // Show matching items
        setTimeout(() => {
            let visibleItems = [];
            
            compositionCards.forEach(item => {
                const title = item.querySelector('.composition-title')?.textContent.toLowerCase() || '';
                const instrumentation = item.querySelector('.composition-instrumentation')?.textContent.toLowerCase() || '';
                
                if (title.includes(query) || instrumentation.includes(query)) {
                    visibleItems.push(item);
                }
            });
            
            // Show visible items with staggered animation
            visibleItems.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.remove('hidden');
                    item.classList.add('visible');
                }, index * 100);
            });
            
            // Update search button feedback
            if (visibleItems.length > 0) {
                searchBtn.style.background = 'var(--green-500)';
                setTimeout(() => {
                    searchBtn.style.background = 'var(--primary-500)';
                }, 1000);
            } else {
                searchBtn.style.background = 'var(--red-500)';
                setTimeout(() => {
                    searchBtn.style.background = 'var(--primary-500)';
                }, 1000);
            }
        }, 150);
    }

    // Search button click
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }

    // Search on Enter key
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        // Real-time search (optional - debounced)
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (this.value.length > 2 || this.value.length === 0) {
                    performSearch();
                }
            }, 300);
        });
    }
}

// New function to integrate secondary navigation
function initSecondaryNavigation() {
    const secondaryButtons = document.querySelectorAll('.secondary-button');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    // Map secondary nav to media filters
    const navToFilterMap = {
        'composer': 'composition',
        'trumpeter': 'performance', 
        'educator': 'editing' // or could be 'audio' for educational content
    };
    
    secondaryButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const role = this.getAttribute('href').replace('/', '');
            const correspondingFilter = navToFilterMap[role];
            
            if (correspondingFilter) {
                // Trigger the corresponding media filter
                const targetFilterBtn = document.querySelector(`[data-filter="${correspondingFilter}"]`);
                if (targetFilterBtn) {
                    targetFilterBtn.click();
                    
                    // Scroll to media grid
                    setTimeout(() => {
                        document.querySelector('.media-grid-section').scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }, 100);
                }
            }
        });
    });
}

// Enhanced audio player functionality with auto-scroll
function initAudioPlayers() {
    const audioPlayers = document.querySelectorAll('.audio-player');
    const audioItems = document.querySelectorAll('.composition-card.audio');
    
    // Handle clicks on audio media items - auto-scroll to audio section
    audioItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const title = this.querySelector('h3').textContent;
            const audioShowcase = document.querySelector('.audio-showcase');
            
            // Scroll to audio section
            audioShowcase.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            
            // Find and highlight the corresponding audio player
            setTimeout(() => {
                const matchingPlayer = Array.from(audioPlayers).find(player => {
                    const playerTitle = player.querySelector('h3').textContent;
                    return playerTitle.toLowerCase().includes(title.toLowerCase().split(' ')[0]);
                });
                
                if (matchingPlayer) {
                    // Highlight the player
                    matchingPlayer.style.background = 'var(--primary-100)';
                    matchingPlayer.style.transform = 'scale(1.02)';
                    matchingPlayer.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
                    
                    // Auto-play the audio
                    const playBtn = matchingPlayer.querySelector('.play-btn');
                    if (playBtn && playBtn.textContent === '▶') {
                        playBtn.click();
                    }
                    
                    // Remove highlight after a few seconds
                    setTimeout(() => {
                        matchingPlayer.style.background = '';
                        matchingPlayer.style.transform = '';
                        matchingPlayer.style.boxShadow = '';
                    }, 3000);
                }
            }, 500);
        });
    });
    
    // Original audio player functionality
    audioPlayers.forEach(player => {
        const playBtn = player.querySelector('.play-btn');
        const progressBar = player.querySelector('.progress-bar');
        const progress = player.querySelector('.progress');
        const timeDisplay = player.querySelector('.time');
        
        let isPlaying = false;
        let currentTime = 0;
        let duration = 0;
        
        // Mock audio data (replace with actual audio files)
        const audioData = {
            'Jazz Standards': { duration: '4:32', file: '/audio/jazz-standards.mp3' },
            'Classical Pieces': { duration: '8:15', file: '/audio/classical-pieces.mp3' }
        };
        
        const title = player.querySelector('h3').textContent;
        const audioInfo = audioData[title] || { duration: '4:00', file: '#' };
        
        // Set initial duration
        timeDisplay.textContent = `0:00 / ${audioInfo.duration}`;
        
        // Play button click
        playBtn.addEventListener('click', function() {
            // Stop other players first
            audioPlayers.forEach(otherPlayer => {
                if (otherPlayer !== player) {
                    const otherPlayBtn = otherPlayer.querySelector('.play-btn');
                    if (otherPlayBtn.textContent === '⏸') {
                        otherPlayBtn.click(); // Pause other players
                    }
                }
            });
            
            if (isPlaying) {
                pauseAudio();
            } else {
                playAudio();
            }
        });
        
        // Progress bar click
        progressBar.addEventListener('click', function(e) {
            const rect = progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            
            // Update progress (mock functionality)
            progress.style.width = (percentage * 100) + '%';
            currentTime = percentage * duration;
            updateTimeDisplay();
        });
        
        function playAudio() {
            isPlaying = true;
            playBtn.textContent = '⏸';
            playBtn.style.background = 'var(--primary-600)';
            
            // Mock progress animation
            const interval = setInterval(() => {
                if (!isPlaying) {
                    clearInterval(interval);
                    return;
                }
                
                currentTime += 0.1;
                const percentage = (currentTime / duration) * 100;
                
                if (percentage >= 100) {
                    pauseAudio();
                    clearInterval(interval);
                } else {
                    progress.style.width = percentage + '%';
                    updateTimeDisplay();
                }
            }, 100);
        }
        
        function pauseAudio() {
            isPlaying = false;
            playBtn.textContent = '▶';
            playBtn.style.background = 'var(--primary-500)';
        }
        
        function updateTimeDisplay() {
            const currentMinutes = Math.floor(currentTime / 60);
            const currentSeconds = Math.floor(currentTime % 60);
            const currentTimeStr = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')}`;
            timeDisplay.textContent = `${currentTimeStr} / ${audioInfo.duration}`;
        }
        
        // Set mock duration
        const durationParts = audioInfo.duration.split(':');
        duration = parseInt(durationParts[0]) * 60 + parseInt(durationParts[1]);
    });
}

// Video player functionality
function initVideoPlayers() {
    const compositionCards = document.querySelectorAll('.composition-card');
    
    compositionCards.forEach(item => {
        const playOverlay = item.querySelector('.play-overlay');
        
        if (playOverlay) {
            playOverlay.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Get video info
                const title = item.querySelector('.composition-title')?.textContent || 'Unknown Title';
                const description = item.querySelector('.composition-instrumentation')?.textContent || 'No description';
                
                // Create modal for video playback
                showVideoModal(title, description);
            });
        }
    });
}

// Video modal
function showVideoModal(title, description) {
    const modal = document.createElement('div');
    modal.className = 'video-modal-overlay';
    modal.innerHTML = `
        <div class="video-modal-content">
            <button class="modal-close">&times;</button>
            <h2>${title}</h2>
            <div class="video-container">
                <video controls>
                    <source src="/videos/${title.toLowerCase().replace(/\s+/g, '-')}.mp4" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            </div>
            <p>${description}</p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            modal.remove();
        }
    });
}

// Load dynamic content from YouTube and/or Notion
async function loadDynamicContent() {
    const compositionsList = document.getElementById('compositions-list');
    
    if (!compositionsList) {
        console.log('Compositions list container not found');
        return;
    }
    
    // Show loading state
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading-media';
    loadingElement.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Loading latest content...</p>
    `;
    compositionsList.appendChild(loadingElement);
    
    try {
        // Try to load from both sources
        const [youtubeVideos, notionContent] = await Promise.allSettled([
            loadYouTubeVideos(),
            loadNotionContent()
        ]);
        
        // Remove loading element
        loadingElement.remove();
        
        // Process YouTube videos
        if (youtubeVideos.status === 'fulfilled' && youtubeVideos.value.length > 0) {
            console.log(`✅ Loaded ${youtubeVideos.value.length} YouTube videos`);
            youtubeVideos.value.forEach(video => {
                const videoElement = createCompositionCard(video, 'youtube');
                compositionsList.appendChild(videoElement);
            });
        }
        
        // Process Notion content
        if (notionContent.status === 'fulfilled' && notionContent.value.length > 0) {
            console.log(`✅ Loaded ${notionContent.value.length} Notion media items`);
            notionContent.value.forEach(item => {
                console.log(`📹 Processing: ${item.title} - Video URL: ${item.videoUrl}`);
                const contentElement = createCompositionCard(item, 'notion');
                compositionsList.appendChild(contentElement);
            });
        } else {
            console.log('⚠️ No Notion media content loaded');
        }
        
        // Reinitialize video players for new content
        initVideoPlayers();
        
        // Update filter counts
        updateFilterCounts();
        
    } catch (error) {
        console.error('Error loading dynamic content:', error);
        loadingElement.innerHTML = `
            <p>Using static content. Dynamic loading will be available when APIs are configured.</p>
        `;
        setTimeout(() => loadingElement.remove(), 3000);
    }
}

// YouTube API Integration
async function loadYouTubeVideos() {
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY') {
        console.log('YouTube API key not configured');
        return [];
    }
    
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?` +
            `key=${YOUTUBE_API_KEY}&` +
            `channelId=${YOUTUBE_CHANNEL_ID}&` +
            `part=snippet,id&` +
            `order=date&` +
            `maxResults=10&` +
            `type=video`
        );
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }
        
        return data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium.url,
            publishedAt: item.snippet.publishedAt,
            channelTitle: item.snippet.channelTitle,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`
        }));
        
    } catch (error) {
        console.error('YouTube API Error:', error);
        return [];
    }
}

// Enhanced Notion API Integration with Composition Relations
async function loadNotionContent() {
    if (!NOTION_DATABASE_URL || NOTION_DATABASE_URL === 'YOUR_NOTION_API_ENDPOINT') {
        console.log('Notion API not configured');
        return [];
    }
    
    try {
        // Request media with composition relations included
        const response = await fetch(`${NOTION_DATABASE_URL}?includeCompositions=true`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch Notion content');
        }
        
        console.log(`📊 Loaded ${data.count} media items${data.includesCompositions ? ' with composition relations' : ''}`);
        
        return data.results.map(item => ({
            id: item.id,
            title: item.title || 'Untitled',
            description: item.description || '',
            category: item.category || 'performance',
            thumbnail: item.thumbnail || '/imgs/placeholder.png',
            videoUrl: item.videoUrl,
            audioUrl: item.audioUrl,
            url: item.url, // Enhanced URL property
            duration: item.duration,
            featured: item.featured || false,
            tags: item.tags || [],
            instrument: item.instrument,
            venue: item.venue,
            year: item.year,
            difficulty: item.difficulty,
            performanceBy: item.performanceBy || '',
            recordingDate: item.recordingDate || '',
            quality: item.quality || 'Standard',
            type: item.type || 'Unknown',
            
            // New relational data
            relatedCompositions: item.relatedCompositions || [],
            compositionCount: item.compositionCount || 0,
            compositionRelations: item.compositionRelations || []
        }));
        
    } catch (error) {
        console.error('Notion API Error:', error);
        return [];
    }
}

// Create composition card from data (unified function for YouTube and Notion)
function createCompositionCard(item, source) {
    const cardElement = document.createElement('div');
    
    // Determine category and data attributes
    let category = 'performance';
    let title = item.title || 'Untitled';
    let instrumentation = 'Unknown Instrumentation';
    let duration = 'Unknown';
    let year = new Date().getFullYear();
    let thumbnail = '/imgs/placeholder.png';
    let hasVideo = false;
    
    if (source === 'youtube') {
        category = 'performance';
        instrumentation = 'YouTube Performance';
        duration = 'Video';
        year = formatDate(item.publishedAt).split(',')[1]?.trim() || year;
        thumbnail = item.thumbnail;
        hasVideo = true;
    } else if (source === 'notion') {
        category = item.category || 'performance';
        instrumentation = item.instrument || item.description || 'Mixed Media';
        duration = item.duration || 'Unknown';
        year = item.year || year;
        thumbnail = item.thumbnail || '/imgs/placeholder.png';
        hasVideo = !!item.videoUrl;
    }
    
    cardElement.className = `composition-card ${category} dynamic-content ${source} visible`;
    cardElement.setAttribute('data-category', category);
    cardElement.setAttribute('data-content-id', item.id || item.videoId || Date.now());
    
    // Create cover element based on media type
    const isAudio = category === 'audio' || (!hasVideo && item.audioUrl);
    const coverContent = isAudio ? `
        <div class="waveform">
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
        </div>
    ` : `
        <img src="${thumbnail}" alt="${title}" loading="lazy">
    `;
    
    cardElement.innerHTML = `
        <div class="composition-content">
            <div class="composition-cover ${isAudio ? 'audio-cover' : ''}">
                ${coverContent}
                <div class="play-overlay">
                    <span class="play-icon">▶</span>
                </div>
            </div>
            <div class="composition-main">
                <div class="composition-title-section">
                    <h3 class="composition-title">${title}</h3>
                    <p class="composition-instrumentation">${instrumentation}</p>
                </div>
            </div>
            <div class="composition-actions">
                <button class="buy-btn">Buy Now</button>
                <div class="composition-meta">
                    <span class="duration">${duration}</span>
                    <span class="year">${year}</span>
                </div>
            </div>
        </div>
    `;
    
    // Add click handler based on source
    cardElement.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (source === 'youtube') {
            showYouTubeModal(item);
        } else if (source === 'notion') {
            if (item.audioUrl && category === 'audio') {
                // Handle audio content - scroll to audio section
                const audioShowcase = document.querySelector('.audio-showcase');
                if (audioShowcase) {
                    audioShowcase.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else if (item.videoUrl) {
                console.log(`🎬 Opening video modal for: ${item.title}`);
                showNotionVideoModal(item);
            } else {
                console.log(`⚠️ No video URL found for: ${item.title}`);
            }
        }
    });
    
    // Add buy button handler
    const buyBtn = cardElement.querySelector('.buy-btn');
    buyBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click
        
        // Visual feedback
        buyBtn.style.background = 'var(--green-500)';
        buyBtn.textContent = 'Added!';
        setTimeout(() => {
            buyBtn.style.background = 'var(--primary-500)';
            buyBtn.textContent = 'Buy Now';
        }, 1500);
        
        console.log(`🛒 Buy button clicked for: ${title}`);
        // Add actual purchase logic here
    });
    
    return cardElement;
}

// YouTube video modal
function showYouTubeModal(video) {
    const modal = document.createElement('div');
    modal.className = 'video-modal-overlay';
    modal.innerHTML = `
        <div class="video-modal-content">
            <button class="modal-close">&times;</button>
            <h2>${video.title}</h2>
            <div class="video-container">
                <iframe 
                    src="${video.embedUrl}?autoplay=1" 
                    frameborder="0" 
                    allowfullscreen
                    allow="autoplay; encrypted-media">
                </iframe>
            </div>
            <p>${video.description}</p>
            <div class="video-actions">
                <a href="${video.url}" target="_blank" class="btn-secondary">
                    Watch on YouTube
                </a>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    addModalCloseHandlers(modal);
}

// Notion video modal with enhanced error handling
function showNotionVideoModal(item) {
    if (!item.videoUrl) {
        console.error('❌ No video URL provided for modal');
        alert('Sorry, this video is not available.');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'video-modal-overlay';
    
    // Determine video type and create appropriate embed
    const isYouTube = item.videoUrl.includes('youtube.com') || item.videoUrl.includes('youtu.be');
    const videoEmbed = isYouTube ? 
        `<iframe 
            src="${getYouTubeEmbedUrl(item.videoUrl)}?autoplay=1" 
            frameborder="0" 
            allowfullscreen
            allow="autoplay; encrypted-media">
        </iframe>` :
        `<video controls autoplay>
            <source src="${item.videoUrl}" type="video/mp4">
            <source src="${item.videoUrl}" type="video/webm">
            <source src="${item.videoUrl}" type="video/ogg">
            Your browser does not support the video tag.
        </video>`;
    
    modal.innerHTML = `
        <div class="video-modal-content">
            <button class="modal-close">&times;</button>
            <h2>${item.title}</h2>
            <div class="video-container">
                ${videoEmbed}
            </div>
            <div class="video-info">
                <p>${item.description || 'No description available.'}</p>
                ${item.duration ? `<p><strong>Duration:</strong> ${item.duration}</p>` : ''}
                ${item.venue ? `<p><strong>Venue:</strong> ${item.venue}</p>` : ''}
                ${item.year ? `<p><strong>Year:</strong> ${item.year}</p>` : ''}
            </div>
            ${item.tags && item.tags.length > 0 ? `
                <div class="modal-tags">
                    ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
            <div class="video-actions">
                <a href="${item.videoUrl}" target="_blank" class="btn-secondary">
                    ${isYouTube ? 'Watch on YouTube' : 'Open Video'}
                </a>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    addModalCloseHandlers(modal);
    
    // Add error handling for video loading
    const video = modal.querySelector('video');
    if (video) {
        video.addEventListener('error', (e) => {
            console.error('❌ Video loading error:', e);
            const container = modal.querySelector('.video-container');
            container.innerHTML = `
                <div class="video-error">
                    <p>❌ Unable to load video</p>
                    <a href="${item.videoUrl}" target="_blank" class="btn-primary">
                        Open in New Tab
                    </a>
                </div>
            `;
        });
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function getYouTubeEmbedUrl(url) {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : url;
}

// Update filter button counts based on loaded content
function updateFilterCounts() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const compositionCards = document.querySelectorAll('.composition-card');
    
    filterBtns.forEach(btn => {
        const filter = btn.getAttribute('data-filter');
        let count = 0;
        
        if (filter === 'all') {
            count = compositionCards.length;
        } else {
            compositionCards.forEach(item => {
                const category = item.getAttribute('data-category');
                if (category === filter) count++;
            });
        }
        
        // Update button text with count (optional)
        const originalText = btn.textContent.split(' (')[0];
        if (count > 0) {
            btn.textContent = `${originalText} (${count})`;
        }
    });
}

// Test Notion API connection
async function testNotionConnection() {
    try {
        console.log('🔍 Testing Notion API connection...');
        const response = await fetch('/api/notion-media', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log(`✅ Notion API connected successfully`);
            console.log(`📊 Found ${data.count} media items`);
            
            // Log items with video URLs
            const videoItems = data.results.filter(item => item.videoUrl);
            console.log(`🎥 Items with video URLs: ${videoItems.length}`);
            videoItems.forEach(item => {
                console.log(`  - ${item.title}: ${item.videoUrl}`);
            });
        } else {
            console.error('❌ Notion API error:', data.error);
        }
        
        return data;
    } catch (error) {
        console.error('❌ Failed to connect to Notion API:', error);
        return null;
    }
}

function addModalCloseHandlers(modal) {
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => modal.remove());
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') modal.remove();
    });
}

// ===== ENHANCED COMPOSITION INTEGRATION =====

// Function to open a composition page
function openComposition(slugOrId) {
    if (!slugOrId) {
        console.error('No composition identifier provided');
        return;
    }
    
    // If it looks like a slug, use pretty URL
    if (slugOrId.includes('-') || !slugOrId.match(/^[a-f0-9]{32}$/i)) {
        window.open(`/composition/${slugOrId}`, '_blank');
    } else {
        // Use ID-based URL
        window.open(`/composition.html?id=${slugOrId}`, '_blank');
    }
}

// Enhanced format date function for media
function formatMediaDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (error) {
        return dateString; // Return original if parsing fails
    }
}

// Add CSS for video modal
const modalStyles = `
<style>
.video-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 2rem;
}

.video-modal-content {
    background: white;
    border-radius: 1rem;
    max-width: 90vw;
    max-height: 90vh;
    overflow: hidden;
    position: relative;
}

.modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: rgba(0,0,0,0.7);
    color: white;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.5rem;
    z-index: 10001;
}

.video-container {
    width: 100%;
    max-width: 800px;
}

.video-container video {
    width: 100%;
    height: auto;
    display: block;
}

.video-modal-content h2 {
    padding: 2rem 2rem 1rem 2rem;
    margin: 0;
    color: var(--gray-800);
}

.video-modal-content p {
    padding: 0 2rem 2rem 2rem;
    margin: 0;
    color: var(--gray-600);
    line-height: 1.6;
}

@media (max-width: 768px) {
    .video-modal-overlay {
        padding: 1rem;
    }
    
    .video-modal-content {
        max-width: 95vw;
        max-height: 95vh;
    }
    
    .video-modal-content h2,
    .video-modal-content p {
        padding-left: 1rem;
        padding-right: 1rem;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', modalStyles); 