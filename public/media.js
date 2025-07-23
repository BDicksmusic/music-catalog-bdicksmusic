// Media Portfolio JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initMediaFilters();
    initAudioPlayers();
    initVideoPlayers();
    initMobileMenu();
});

// Filter functionality
function initMediaFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const mediaItems = document.querySelectorAll('.media-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Filter media items
            mediaItems.forEach(item => {
                const category = item.getAttribute('data-category');
                
                if (filter === 'all' || category === filter) {
                    item.classList.remove('hidden');
                    item.classList.add('visible');
                } else {
                    item.classList.add('hidden');
                    item.classList.remove('visible');
                }
            });
        });
    });
}

// Audio player functionality
function initAudioPlayers() {
    const audioPlayers = document.querySelectorAll('.audio-player');
    
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
    const mediaItems = document.querySelectorAll('.media-item');
    
    mediaItems.forEach(item => {
        const playOverlay = item.querySelector('.play-overlay');
        
        if (playOverlay) {
            playOverlay.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Get video info
                const title = item.querySelector('h3').textContent;
                const description = item.querySelector('p').textContent;
                
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

// Mobile menu functionality
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }));
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