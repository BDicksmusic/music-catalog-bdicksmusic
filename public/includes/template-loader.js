/**
 * Template Loader Module - For injecting modular navigation and footer
 * Usage: Call loadNavigation() and loadFooter() to inject templates
 */

// Base path for template files
const TEMPLATE_BASE_PATH = '/includes/';

/**
 * ✨ SMOOTH LOADING SYSTEM - Eliminates pop-in effects
 */

/**
 * Show loading overlay to prevent content pop-in
 */
function showLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'template-loading-overlay';
    overlay.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading...</div>
    `;
    document.body.appendChild(overlay);
    document.body.classList.add('loading');
}

/**
 * Hide loading overlay with smooth transition
 */
function hideLoadingOverlay() {
    const overlay = document.getElementById('template-loading-overlay');
    if (overlay) {
        overlay.classList.add('fade-out');
        document.body.classList.remove('loading');
        
        // Remove overlay after transition
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
    }
}

/**
 * Apply smooth loading classes to body
 */
function preparePageForLoading() {
    document.body.classList.add('template-loading');
}

/**
 * Mark page as loaded with smooth transition
 */
function markPageAsLoaded() {
    document.body.classList.remove('template-loading');
    document.body.classList.add('template-loaded');
}

/**
 * Fetch and load a template file
 * @param {string} templateName - Name of the template file (without .html)
 * @returns {Promise<string>} - Template HTML content
 */
async function fetchTemplate(templateName) {
    try {
        const templateUrl = `${TEMPLATE_BASE_PATH}${templateName}.html`;
        console.log('🔄 Fetching template:', templateUrl);
        
        const response = await fetch(templateUrl);
        console.log('📡 Template response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Template ${templateName} not found: ${response.status}`);
        }
        
        const html = await response.text();
        console.log('📄 Template HTML received, length:', html.length);
        return html;
    } catch (error) {
        console.error(`❌ Failed to load template ${templateName}:`, error);
        return '';
    }
}

/**
 * Load and inject the navigation template
 * @param {string} targetSelector - CSS selector for injection target (default: 'body')
 * @param {string} position - Where to inject ('afterbegin', 'beforeend', etc.)
 */
async function loadNavigation(targetSelector = 'body', position = 'afterbegin') {
    console.log('🧭 Loading navigation template...');
    console.log('🎯 Navigation target selector:', targetSelector);
    console.log('📍 Navigation position:', position);
    
    const navigationHtml = await fetchTemplate('navigation');
    console.log('📄 Navigation HTML length:', navigationHtml ? navigationHtml.length : 'null');
    if (!navigationHtml) {
        console.error('❌ Navigation template could not be loaded');
        return;
    }
    
    const targetElement = document.querySelector(targetSelector);
    console.log('🎯 Target element found:', !!targetElement);
    if (!targetElement) {
        console.error(`❌ Target element "${targetSelector}" not found for navigation injection`);
        return;
    }
    
    console.log('💉 Injecting navigation HTML...');
    targetElement.insertAdjacentHTML(position, navigationHtml);
    console.log('✅ Navigation template injected successfully');
    
    // Check if navigation was actually injected
    const injectedNav = document.querySelector('.secondary-nav');
    const injectedButtons = document.querySelectorAll('.secondary-button');
    console.log('🔍 Secondary nav found in DOM after injection:', !!injectedNav);
    console.log('🔍 Secondary buttons found:', injectedButtons.length);
    
    // Initialize navigation functionality after injection
    initializeNavigation();
}

/**
 * Load and inject the footer template
 * @param {string} targetSelector - CSS selector for injection target (default: 'body')
 * @param {string} position - Where to inject ('beforeend' by default)
 */
async function loadFooter(targetSelector = 'body', position = 'beforeend') {
    console.log('🦶 Loading footer template...');
    console.log('🎯 Footer target selector:', targetSelector);
    console.log('📍 Footer position:', position);
    
    const footerHtml = await fetchTemplate('footer');
    console.log('📄 Footer HTML length:', footerHtml ? footerHtml.length : 'null');
    if (!footerHtml) {
        console.error('❌ Footer template could not be loaded');
        return;
    }
    
    const targetElement = document.querySelector(targetSelector);
    console.log('🎯 Target element found:', !!targetElement);
    if (!targetElement) {
        console.error(`❌ Target element "${targetSelector}" not found for footer injection`);
        return;
    }
    
    console.log('💉 Injecting footer HTML...');
    targetElement.insertAdjacentHTML(position, footerHtml);
    console.log('✅ Footer template loaded successfully');
    
    // Check if footer was actually injected
    const injectedFooter = document.querySelector('.main-footer');
    console.log('🔍 Footer found in DOM after injection:', !!injectedFooter);
    
    // Initialize footer functionality after injection
    initializeFooter();
}

/**
 * Initialize navigation functionality (theme toggle, hamburger menu, etc.)
 */
function initializeNavigation() {
    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
    
    // Hamburger menu functionality
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }
    
    // Dropdown menu functionality
    const dropdownItems = document.querySelectorAll('.nav-item.dropdown');
    dropdownItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.classList.add('active');
        });
        item.addEventListener('mouseleave', () => {
            item.classList.remove('active');
        });
    });
}

/**
 * Initialize footer functionality (newsletter form, etc.)
 */
function initializeFooter() {
    // Newsletter form functionality
    const newsletterForm = document.getElementById('newsletter-form');
    const newsletterSuccess = document.getElementById('newsletter-success');
    
    if (newsletterForm && newsletterSuccess) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('newsletter-email').value;
            if (!email) return;
            
            // Simulate newsletter signup (replace with actual API call)
            try {
                // Replace this with your actual newsletter signup logic
                console.log('Newsletter signup:', email);
                
                // Show success message
                newsletterForm.style.display = 'none';
                newsletterSuccess.style.display = 'block';
                
                // Reset form after delay
                setTimeout(() => {
                    newsletterForm.style.display = 'block';
                    newsletterSuccess.style.display = 'none';
                    newsletterForm.reset();
                }, 5000);
                
            } catch (error) {
                console.error('Newsletter signup failed:', error);
                alert('Newsletter signup failed. Please try again.');
            }
        });
    }
}

/**
 * Load both navigation and footer templates with smooth loading
 * @param {Object} options - Configuration options
 */
async function loadAllTemplates(options = {}) {
    const {
        navTarget = 'body',
        navPosition = 'afterbegin',
        footerTarget = 'body',
        footerPosition = 'beforeend',
        showOverlay = true
    } = options;
    
    try {
        // ✨ Start smooth loading
        if (showOverlay) {
            showLoadingOverlay();
        }
        preparePageForLoading();
        
        // Load templates in parallel for faster loading
        await Promise.all([
            loadNavigation(navTarget, navPosition),
            loadFooter(footerTarget, footerPosition)
        ]);
        
        // ✨ Small delay to ensure DOM is fully updated
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // ✨ Mark as loaded with smooth transition
        markPageAsLoaded();
        
        if (showOverlay) {
            // Small delay before hiding overlay for smoother experience
            setTimeout(() => {
                hideLoadingOverlay();
            }, 100);
        }
        
        console.log('✅ All templates loaded smoothly');
        
    } catch (error) {
        console.error('❌ Template loading failed:', error);
        
        // Clean up on error
        markPageAsLoaded();
        if (showOverlay) {
            hideLoadingOverlay();
        }
    }
}

/**
 * Load templates with ultra-fast loading (no overlay)
 */
async function loadAllTemplatesFast(options = {}) {
    return loadAllTemplates({ ...options, showOverlay: false });
}

/**
 * ✨ IMMEDIATE LOADING STATE - Set loading state as soon as possible
 */
(function() {
    // Apply loading state immediately when script loads
    if (document.body) {
        document.body.classList.add('template-loading');
    } else {
        // If body doesn't exist yet, wait for it
        document.addEventListener('DOMContentLoaded', () => {
            document.body.classList.add('template-loading');
        });
    }
})();

/**
 * Auto-load templates when DOM is ready (if auto-load attributes are present)
 */
document.addEventListener('DOMContentLoaded', () => {
    const autoLoadNav = document.querySelector('[data-auto-load-nav]');
    const autoLoadFooter = document.querySelector('[data-auto-load-footer]');
    
    if (autoLoadNav) {
        const target = autoLoadNav.dataset.autoLoadNav || 'body';
        const position = autoLoadNav.dataset.navPosition || 'afterbegin';
        loadNavigation(target, position);
    }
    
    if (autoLoadFooter) {
        const target = autoLoadFooter.dataset.autoLoadFooter || 'body';
        const position = autoLoadFooter.dataset.footerPosition || 'beforeend';
        loadFooter(target, position);
    }
});

// Export functions for use in other scripts
window.TemplateLoader = {
    loadNavigation,
    loadFooter,
    loadAllTemplates,
    loadAllTemplatesFast,
    fetchTemplate,
    showLoadingOverlay,
    hideLoadingOverlay,
    preparePageForLoading,
    markPageAsLoaded
}; 