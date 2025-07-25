/**
 * Score Layout Manager
 * Manages the 4 distinct states of the score section layout
 */

class ScoreLayoutManager {
    constructor() {
        this.currentState = 'HIDDEN'; // HIDDEN, PDF_ONLY, VIDEO_ONLY, BOTH_VISIBLE
        this.elements = {};
        this.dividerPosition = { pdfPercentage: 60, videoPercentage: 40 };
        this.isDesktop = window.innerWidth >= 1024;
        
        this.init();
    }

    init() {
        // Cache DOM elements
        this.elements = {
            layoutContainer: document.getElementById('score-layout-container'),
            pdfColumn: document.getElementById('score-pdf-column'),
            videoColumn: document.getElementById('score-video-column'),
            divider: document.getElementById('score-divider'),
            scoreCarousel: document.getElementById('score-carousel-container'),
            pdfToggleBtn: document.getElementById('score-toggle-btn'),
            videoToggleBtn: document.getElementById('score-video-toggle-btn')
        };

        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize with current content
        this.detectInitialState();
        
        console.log('🎯 ScoreLayoutManager initialized');
    }

    setupEventListeners() {
        // Window resize handler
        window.addEventListener('resize', () => {
            this.isDesktop = window.innerWidth >= 1024;
            this.applyState(this.currentState);
        });

        // Divider resize functionality
        this.setupDividerResize();
    }

    detectInitialState() {
        const hasPdf = this.elements.scoreCarousel && this.elements.scoreCarousel.classList.contains('show');
        const hasVideo = this.elements.videoColumn && 
                         this.elements.videoColumn.children.length > 0 && 
                         !this.elements.videoColumn.classList.contains('hidden');

        if (hasPdf && hasVideo) {
            this.setState('BOTH_VISIBLE');
        } else if (hasPdf) {
            this.setState('PDF_ONLY');
        } else if (hasVideo) {
            this.setState('VIDEO_ONLY');
        } else {
            this.setState('HIDDEN');
        }
    }

    setState(newState) {
        console.log(`🎯 ScoreLayoutManager: ${this.currentState} → ${newState}`);
        this.currentState = newState;
        this.applyState(newState);
        this.updateToggleButtons();
    }

    applyState(state) {
        if (!this.elements.layoutContainer) return;

        // Reset all classes
        this.elements.layoutContainer.classList.remove('pdf-only', 'video-only', 'has-content');
        
        switch (state) {
            case 'HIDDEN':
                this.applyHiddenState();
                break;
            case 'PDF_ONLY':
                this.applyPdfOnlyState();
                break;
            case 'VIDEO_ONLY':
                this.applyVideoOnlyState();
                break;
            case 'BOTH_VISIBLE':
                this.applyBothVisibleState();
                break;
        }
    }

    applyHiddenState() {
        // Hide everything
        this.elements.layoutContainer.classList.remove('has-content');
        this.hideDivider();
        
        // Ensure both columns are hidden
        if (this.elements.scoreCarousel) {
            this.elements.scoreCarousel.classList.remove('show');
        }
        if (this.elements.videoColumn) {
            this.elements.videoColumn.classList.add('hidden');
        }
        
        console.log('🎯 Applied HIDDEN state');
    }

    applyPdfOnlyState() {
        this.elements.layoutContainer.classList.add('pdf-only', 'has-content');
        this.hideDivider();
        
        // Show PDF, hide video
        if (this.elements.scoreCarousel) {
            this.elements.scoreCarousel.classList.add('show');
        }
        if (this.elements.videoColumn) {
            this.elements.videoColumn.classList.add('hidden');
        }
        if (this.elements.pdfColumn) {
            this.elements.pdfColumn.style.flex = '';
        }
        
        console.log('🎯 Applied PDF_ONLY state');
    }

    applyVideoOnlyState() {
        this.elements.layoutContainer.classList.add('video-only', 'has-content');
        this.hideDivider();
        
        // Hide PDF, show video
        if (this.elements.scoreCarousel) {
            this.elements.scoreCarousel.classList.remove('show');
        }
        if (this.elements.videoColumn) {
            this.elements.videoColumn.classList.remove('hidden');
        }
        if (this.elements.videoColumn) {
            this.elements.videoColumn.style.flex = '';
        }
        
        console.log('🎯 Applied VIDEO_ONLY state');
    }

    applyBothVisibleState() {
        this.elements.layoutContainer.classList.add('has-content');
        this.elements.layoutContainer.classList.remove('pdf-only', 'video-only');
        
        // Show both
        if (this.elements.scoreCarousel) {
            this.elements.scoreCarousel.classList.add('show');
        }
        if (this.elements.videoColumn) {
            this.elements.videoColumn.classList.remove('hidden');
        }
        
        // Show divider on desktop, restore saved position
        if (this.isDesktop) {
            this.showDivider();
            this.restoreDividerPosition();
        } else {
            this.hideDivider();
        }
        
        console.log('🎯 Applied BOTH_VISIBLE state');
    }

    showDivider() {
        if (this.elements.divider) {
            this.elements.divider.classList.remove('divider-handle-hidden');
            this.elements.divider.style.display = 'flex';
        }
    }

    hideDivider() {
        if (this.elements.divider) {
            this.elements.divider.classList.add('divider-handle-hidden');
            this.elements.divider.style.display = 'none';
        }
    }

    restoreDividerPosition() {
        if (this.elements.pdfColumn && this.elements.videoColumn) {
            this.elements.pdfColumn.style.flex = `1 1 ${this.dividerPosition.pdfPercentage}%`;
            this.elements.videoColumn.style.flex = `1 1 ${this.dividerPosition.videoPercentage}%`;
        }
    }

    updateToggleButtons() {
        // Update PDF toggle button
        if (this.elements.pdfToggleBtn) {
            const pdfVisible = this.currentState === 'PDF_ONLY' || this.currentState === 'BOTH_VISIBLE';
            const toggleText = this.elements.pdfToggleBtn.querySelector('.toggle-text');
            const toggleIcon = this.elements.pdfToggleBtn.querySelector('.toggle-icon');
            
            if (pdfVisible) {
                toggleText.textContent = 'Hide Score PDF';
                toggleIcon.textContent = '●';
                this.elements.pdfToggleBtn.classList.add('toggled');
            } else {
                toggleText.textContent = 'Show Score PDF';
                toggleIcon.textContent = '○';
                this.elements.pdfToggleBtn.classList.remove('toggled');
            }
        }

        // Update video toggle button
        if (this.elements.videoToggleBtn) {
            const videoVisible = this.currentState === 'VIDEO_ONLY' || this.currentState === 'BOTH_VISIBLE';
            const toggleText = this.elements.videoToggleBtn.querySelector('.toggle-text');
            const toggleIcon = this.elements.videoToggleBtn.querySelector('.toggle-icon');
            
            if (videoVisible) {
                toggleText.textContent = 'Hide Score Video';
                toggleIcon.textContent = '●';
                this.elements.videoToggleBtn.classList.remove('toggled');
            } else {
                toggleText.textContent = 'Show Score Video';
                toggleIcon.textContent = '○';
                this.elements.videoToggleBtn.classList.add('toggled');
            }
        }
    }

    // Public methods for toggle functions
    togglePdf() {
        const pdfVisible = this.currentState === 'PDF_ONLY' || this.currentState === 'BOTH_VISIBLE';
        
        if (pdfVisible) {
            // Hide PDF
            if (this.currentState === 'BOTH_VISIBLE') {
                this.setState('VIDEO_ONLY');
            } else {
                this.setState('HIDDEN');
            }
        } else {
            // Show PDF
            if (this.currentState === 'VIDEO_ONLY') {
                this.setState('BOTH_VISIBLE');
            } else {
                this.setState('PDF_ONLY');
            }
        }
    }

    toggleVideo() {
        const videoVisible = this.currentState === 'VIDEO_ONLY' || this.currentState === 'BOTH_VISIBLE';
        
        // Stop any playing audio/video first
        this.stopAllAudio();
        
        if (videoVisible) {
            // Hide video
            if (this.currentState === 'BOTH_VISIBLE') {
                this.setState('PDF_ONLY');
            } else {
                this.setState('HIDDEN');
            }
        } else {
            // Show video
            if (this.currentState === 'PDF_ONLY') {
                this.setState('BOTH_VISIBLE');
            } else {
                this.setState('VIDEO_ONLY');
            }
        }
    }

    stopAllAudio() {
        const allAudioPlayers = document.querySelectorAll('audio, video');
        allAudioPlayers.forEach(player => {
            if (!player.paused) {
                player.pause();
                player.currentTime = 0;
            }
        });
        console.log('🔇 All audio/video stopped');
    }

    // Divider resize functionality
    setupDividerResize() {
        if (!this.elements.divider) return;

        let isResizing = false;
        let startX = 0;
        let startPdfFlex = 0;

        const startResize = (e) => {
            e.preventDefault();
            isResizing = true;
            
            startX = e.clientX || e.touches[0].clientX;
            startPdfFlex = this.elements.pdfColumn.offsetWidth;
            
            this.elements.divider.classList.add('resizing');
            this.elements.layoutContainer.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        };

        const doResize = (e) => {
            if (!isResizing) return;
            
            e.preventDefault();
            
            const currentX = e.clientX || e.touches[0].clientX;
            const delta = currentX - startX;
            const totalWidth = this.elements.layoutContainer.offsetWidth - this.elements.divider.offsetWidth;
            
            const pdfPercentage = Math.max(20, Math.min(80, (startPdfFlex / totalWidth * 100) + (delta / totalWidth * 100)));
            const videoPercentage = 100 - pdfPercentage;
            
            // Update saved position
            this.dividerPosition.pdfPercentage = pdfPercentage;
            this.dividerPosition.videoPercentage = videoPercentage;
            
            // Apply new position
            this.elements.pdfColumn.style.flex = `1 1 ${pdfPercentage}%`;
            this.elements.videoColumn.style.flex = `1 1 ${videoPercentage}%`;
        };

        const stopResize = () => {
            if (!isResizing) return;
            
            isResizing = false;
            this.elements.divider.classList.remove('resizing');
            this.elements.layoutContainer.classList.remove('resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            
            // Keep the current position
            this.elements.pdfColumn.style.flex = `1 1 ${this.dividerPosition.pdfPercentage}%`;
            this.elements.videoColumn.style.flex = `1 1 ${this.dividerPosition.videoPercentage}%`;
        };

        // Mouse events
        this.elements.divider.addEventListener('mousedown', startResize);
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
        document.addEventListener('mouseleave', stopResize);

        // Touch events
        this.elements.divider.addEventListener('touchstart', startResize, { passive: false });
        document.addEventListener('touchmove', doResize, { passive: false });
        document.addEventListener('touchend', stopResize);
    }

    // Utility method to check if content exists
    hasScoreVideo() {
        return this.elements.videoColumn && 
               this.elements.videoColumn.children.length > 0 && 
               this.elements.videoColumn.querySelector('#score-video-content') && 
               this.elements.videoColumn.querySelector('#score-video-content').children.length > 0;
    }

    hasScorePdf() {
        return this.elements.scoreCarousel && this.elements.scoreCarousel.children.length > 0;
    }
}

// Global instance
let scoreLayoutManager = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        scoreLayoutManager = new ScoreLayoutManager();
        
        // Make it globally accessible for debugging
        window.scoreLayoutManager = scoreLayoutManager;
    }, 600); // Small delay to ensure all elements are rendered
}); 