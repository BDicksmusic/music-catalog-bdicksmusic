/**
 * Component Loader Module - For injecting modular media components
 * Usage: Load audio players, video players, and other reusable components
 */

// Base path for component files
const COMPONENT_BASE_PATH = '/includes/components/';

// Generate unique IDs for components
let componentIdCounter = 0;
function generateComponentId(prefix = 'comp') {
    return `${prefix}-${++componentIdCounter}-${Date.now()}`;
}

/**
 * Fetch and load a component template
 * @param {string} componentName - Name of the component file (without .html)
 * @returns {Promise<string>} - Component HTML content
 */
async function fetchComponent(componentName) {
    try {
        const response = await fetch(`${COMPONENT_BASE_PATH}${componentName}.html`);
        if (!response.ok) {
            throw new Error(`Component ${componentName} not found: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        console.error(`Failed to load component ${componentName}:`, error);
        return '';
    }
}

/**
 * Replace template variables in component HTML
 * @param {string} html - Component HTML with template variables
 * @param {Object} variables - Key-value pairs for template replacement
 * @returns {string} - HTML with variables replaced
 */
function replaceTemplateVariables(html, variables = {}) {
    let result = html;
    
    // Replace {{variableName}} patterns
    Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, variables[key]);
    });
    
    // Replace any remaining {{}} patterns with empty string
    result = result.replace(/{{\w+}}/g, '');
    
    return result;
}

/**
 * Load Audio Player Component
 * @param {string} targetSelector - CSS selector for injection target
 * @param {Object} options - Configuration options
 */
async function loadAudioPlayer(targetSelector, options = {}) {
    const {
        containerId = generateComponentId('audio'),
        audioData = [],
        compositionId = null,
        apiEndpoint = '/api/composition',
        position = 'beforeend',
        showNavigation = true
    } = options;
    
    console.log('Loading audio player component...');
    
    // Fetch component template
    const componentHtml = await fetchComponent('audio-player');
    if (!componentHtml) {
        console.warn('Audio player component could not be loaded');
        return null;
    }
    
    // Replace template variables
    const finalHtml = replaceTemplateVariables(componentHtml, { containerId });
    
    // Inject component
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) {
        console.error(`Target element "${targetSelector}" not found for audio player injection`);
        return null;
    }
    
    targetElement.insertAdjacentHTML(position, finalHtml);
    
    // Initialize component with data
    const componentElement = document.getElementById(`audio-players-${containerId}`);
    
    if (audioData.length > 0) {
        // Use provided data
        await renderAudioPlayers(componentElement, audioData, containerId, showNavigation);
    } else if (compositionId) {
        // Fetch data from API
        await loadAudioFromAPI(componentElement, compositionId, apiEndpoint, containerId, showNavigation);
    } else {
        // Show empty state
        componentElement.innerHTML = '<p style="text-align: center; color: var(--gray-500);">No audio available</p>';
    }
    
    console.log('Audio player component loaded successfully');
    return { containerId, element: componentElement };
}

/**
 * Load Video Player Component
 * @param {string} targetSelector - CSS selector for injection target
 * @param {Object} options - Configuration options
 */
async function loadVideoPlayer(targetSelector, options = {}) {
    const {
        containerId = generateComponentId('video'),
        videoData = [],
        compositionId = null,
        apiEndpoint = '/api/composition',
        position = 'beforeend',
        videoType = 'standard' // 'standard' or 'score'
    } = options;
    
    console.log('Loading video player component...');
    
    // Choose component based on type
    const componentName = videoType === 'score' ? 'score-video-player' : 'video-player';
    const componentHtml = await fetchComponent(componentName);
    
    if (!componentHtml) {
        console.warn(`${componentName} component could not be loaded`);
        return null;
    }
    
    // Replace template variables
    const finalHtml = replaceTemplateVariables(componentHtml, { containerId });
    
    // Inject component
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) {
        console.error(`Target element "${targetSelector}" not found for video player injection`);
        return null;
    }
    
    targetElement.insertAdjacentHTML(position, finalHtml);
    
    // Initialize component with data
    const containerIdSuffix = videoType === 'score' ? `score-video-content-${containerId}` : `video-players-${containerId}`;
    const componentElement = document.getElementById(containerIdSuffix);
    
    if (videoData.length > 0) {
        // Use provided data
        await renderVideoPlayers(componentElement, videoData, videoType);
    } else if (compositionId) {
        // Fetch data from API
        await loadVideoFromAPI(componentElement, compositionId, apiEndpoint, videoType);
    } else {
        // Show empty state
        componentElement.innerHTML = '<p style="text-align: center; color: var(--gray-500);">No videos available</p>';
    }
    
    console.log('Video player component loaded successfully');
    return { containerId, element: componentElement };
}

/**
 * Render audio players from data
 */
async function renderAudioPlayers(container, audioData, containerId, showNavigation) {
    container.innerHTML = ''; // Clear loading state
    
    // Check if composition has movements
    const hasMovements = audioData.some(audio => audio.isMovement);
    const containerClass = hasMovements ? 'has-movements' : '';
    
    if (hasMovements) {
        container.parentElement.classList.add('multi-movement');
    }
    
    audioData.forEach((audio, index) => {
        const audioPlayerHtml = `
            <div class="composition-audio-player ${audio.isMovement ? 'movement-audio' : 'legacy-audio'}" 
                 data-is-movement="${audio.isMovement || false}">
                <div class="composition-audio-title ${audio.isMovement ? 'movement-title' : ''}">
                    ${audio.title || `Track ${index + 1}`}
                </div>
                <audio controls preload="metadata">
                    <source src="${audio.url}" type="audio/mpeg">
                    <source src="${audio.url}" type="audio/wav">
                    <source src="${audio.url}" type="audio/ogg">
                    Your browser does not support the audio element.
                </audio>
                ${audio.metadata ? `
                    <div class="composition-audio-metadata">
                        <div class="performance-info">${audio.metadata.performanceInfo || ''}</div>
                        ${audio.metadata.additionalInfo || ''}
                    </div>
                ` : ''}
            </div>
            ${index < audioData.length - 1 ? '<div class="audio-nav-divider"></div>' : ''}
        `;
        
        container.insertAdjacentHTML('beforeend', audioPlayerHtml);
    });
    
    // Setup navigation if multiple tracks and navigation is enabled
    if (showNavigation && audioData.length > 1) {
        setupAudioNavigation(containerId, audioData.length);
    }
}

/**
 * Render video players from data
 */
async function renderVideoPlayers(container, videoData, videoType) {
    container.innerHTML = ''; // Clear loading state
    
    videoData.forEach((video, index) => {
        let videoHtml = '';
        
        if (video.type === 'youtube') {
            videoHtml = `
                <div class="composition-video-player" data-video-type="${videoType}">
                    <div class="video-content">
                        <div class="youtube-embed-container">
                            <iframe src="https://www.youtube.com/embed/${video.videoId}" 
                                    frameborder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowfullscreen>
                            </iframe>
                        </div>
                    </div>
                    ${video.metadata ? `
                        <div class="video-metadata-section">
                            <div class="composition-video-title">
                                ${video.title || `Video ${index + 1}`}
                                ${index + 1 > 1 ? `<span class="video-counter">(${index + 1})</span>` : ''}
                            </div>
                            <div class="composition-video-metadata">
                                <div class="performance-info">${video.metadata.performanceInfo || ''}</div>
                                ${video.metadata.additionalInfo || ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        } else if (video.type === 'direct') {
            videoHtml = `
                <div class="composition-video-player" data-video-type="${videoType}">
                    <div class="video-content">
                        <video controls preload="metadata" style="width: 100%; border-radius: 8px;">
                            <source src="${video.url}" type="video/mp4">
                            <source src="${video.url}" type="video/webm">
                            <source src="${video.url}" type="video/ogg">
                            Your browser does not support the video element.
                        </video>
                    </div>
                    ${video.metadata ? `
                        <div class="video-metadata-section">
                            <div class="composition-video-title">
                                ${video.title || `Video ${index + 1}`}
                                ${index + 1 > 1 ? `<span class="video-counter">(${index + 1})</span>` : ''}
                            </div>
                            <div class="composition-video-metadata">
                                <div class="performance-info">${video.metadata.performanceInfo || ''}</div>
                                ${video.metadata.additionalInfo || ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        container.insertAdjacentHTML('beforeend', videoHtml);
    });
}

/**
 * Setup audio navigation controls
 */
function setupAudioNavigation(containerId, totalTracks) {
    const navContainer = document.getElementById(`audio-nav-${containerId}`);
    const prevBtn = document.getElementById(`prev-audio-${containerId}`);
    const nextBtn = document.getElementById(`next-audio-${containerId}`);
    const navInfo = document.getElementById(`audio-nav-info-${containerId}`);
    
    if (!navContainer) return;
    
    let currentTrack = 0;
    
    function updateNavigation() {
        prevBtn.disabled = currentTrack === 0;
        nextBtn.disabled = currentTrack === totalTracks - 1;
        navInfo.textContent = `Track ${currentTrack + 1} of ${totalTracks}`;
    }
    
    prevBtn.addEventListener('click', () => {
        if (currentTrack > 0) {
            currentTrack--;
            updateNavigation();
            // You can add logic here to actually switch tracks
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentTrack < totalTracks - 1) {
            currentTrack++;
            updateNavigation();
            // You can add logic here to actually switch tracks
        }
    });
    
    // Show navigation
    navContainer.style.display = 'flex';
    updateNavigation();
}

/**
 * Load audio data from API
 */
async function loadAudioFromAPI(container, compositionId, apiEndpoint, containerId, showNavigation) {
    try {
        const response = await fetch(`${apiEndpoint}/${compositionId}`);
        if (!response.ok) throw new Error(`API request failed: ${response.status}`);
        
        const data = await response.json();
        const audioData = data.audio || data.audioFiles || [];
        
        if (audioData.length > 0) {
            await renderAudioPlayers(container, audioData, containerId, showNavigation);
        } else {
            container.innerHTML = '<p style="text-align: center; color: var(--gray-500);">No audio available</p>';
        }
    } catch (error) {
        console.error('Failed to load audio from API:', error);
        container.innerHTML = '<p style="text-align: center; color: var(--red-500);">Error loading audio</p>';
    }
}

/**
 * Load video data from API
 */
async function loadVideoFromAPI(container, compositionId, apiEndpoint, videoType) {
    try {
        const response = await fetch(`${apiEndpoint}/${compositionId}`);
        if (!response.ok) throw new Error(`API request failed: ${response.status}`);
        
        const data = await response.json();
        const videoField = videoType === 'score' ? 'scoreVideos' : 'videos';
        const videoData = data[videoField] || data.videoFiles || [];
        
        if (videoData.length > 0) {
            await renderVideoPlayers(container, videoData, videoType);
        } else {
            container.innerHTML = '<p style="text-align: center; color: var(--gray-500);">No videos available</p>';
        }
    } catch (error) {
        console.error('Failed to load videos from API:', error);
        container.innerHTML = '<p style="text-align: center; color: var(--red-500);">Error loading videos</p>';
    }
}

/**
 * Load any component by name
 * @param {string} targetSelector - CSS selector for injection target
 * @param {string} componentName - Name of the component file (without .html)
 * @param {Object} variables - Template variables to replace
 * @param {string} position - Position to insert ('beforebegin', 'afterbegin', 'beforeend', 'afterend')
 */
async function loadComponent(targetSelector, componentName, variables = {}, position = 'beforeend') {
    console.log(`Loading component: ${componentName}`);
    
    // Fetch component template
    const componentHtml = await fetchComponent(componentName);
    if (!componentHtml) {
        console.warn(`Component ${componentName} could not be loaded`);
        return null;
    }
    
    // Replace template variables
    const finalHtml = replaceTemplateVariables(componentHtml, variables);
    
    // Inject component
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) {
        console.error(`Target element "${targetSelector}" not found for component injection`);
        return null;
    }
    
    targetElement.insertAdjacentHTML(position, finalHtml);
    
    console.log(`Component ${componentName} loaded successfully`);
    return { componentName, targetElement };
}

/**
 * Load multiple components at once
 */
async function loadMediaComponents(components = []) {
    const results = [];
    
    for (const component of components) {
        const { type, targetSelector, options } = component;
        
        let result = null;
        
        switch (type) {
            case 'audio':
                result = await loadAudioPlayer(targetSelector, options);
                break;
            case 'video':
                result = await loadVideoPlayer(targetSelector, options);
                break;
            case 'score-video':
                result = await loadVideoPlayer(targetSelector, { ...options, videoType: 'score' });
                break;
            default:
                console.warn(`Unknown component type: ${type}`);
        }
        
        if (result) {
            results.push({ type, ...result });
        }
    }
    
    return results;
}

// Export functions for use in other scripts
window.ComponentLoader = {
    loadAudioPlayer,
    loadVideoPlayer,
    loadMediaComponents,
    loadComponent,
    fetchComponent,
    generateComponentId
}; 