/**
 * Template Loader Module - For injecting modular navigation and footer
 * Usage: Call loadNavigation() and loadFooter() to inject templates
 */

// Base path for template files
const TEMPLATE_BASE_PATH = '/includes/';

/**
 * Fetch and load a template file
 * @param {string} templateName - Name of the template file (without .html)
 * @returns {Promise<string>} - Template HTML content
 */
async function fetchTemplate(templateName) {
    try {
        const response = await fetch(`${TEMPLATE_BASE_PATH}${templateName}.html`);
        if (!response.ok) {
            throw new Error(`Template ${templateName} not found: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        console.error(`Failed to load template ${templateName}:`, error);
        return '';
    }
}

/**
 * Load and inject the navigation template
 * @param {string} targetSelector - CSS selector for injection target (default: 'body')
 * @param {string} position - Where to inject ('afterbegin', 'beforeend', etc.)
 */
async function loadNavigation(targetSelector = 'body', position = 'afterbegin') {
    console.log('Loading navigation template...');
    
    const navigationHtml = await fetchTemplate('navigation');
    if (!navigationHtml) {
        console.warn('Navigation template could not be loaded');
        return;
    }
    
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) {
        console.error(`Target element "${targetSelector}" not found for navigation injection`);
        return;
    }
    
    targetElement.insertAdjacentHTML(position, navigationHtml);
    console.log('Navigation template loaded successfully');
    
    // Initialize navigation functionality after injection
    initializeNavigation();
}

/**
 * Load and inject the footer template
 * @param {string} targetSelector - CSS selector for injection target (default: 'body')
 * @param {string} position - Where to inject ('beforeend' by default)
 */
async function loadFooter(targetSelector = 'body', position = 'beforeend') {
    console.log('Loading footer template...');
    
    const footerHtml = await fetchTemplate('footer');
    if (!footerHtml) {
        console.warn('Footer template could not be loaded');
        return;
    }
    
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) {
        console.error(`Target element "${targetSelector}" not found for footer injection`);
        return;
    }
    
    targetElement.insertAdjacentHTML(position, footerHtml);
    console.log('Footer template loaded successfully');
    
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
 * Load both navigation and footer templates
 * @param {Object} options - Configuration options
 */
async function loadAllTemplates(options = {}) {
    const {
        navTarget = 'body',
        navPosition = 'afterbegin',
        footerTarget = 'body',
        footerPosition = 'beforeend'
    } = options;
    
    await Promise.all([
        loadNavigation(navTarget, navPosition),
        loadFooter(footerTarget, footerPosition)
    ]);
    
    console.log('All templates loaded successfully');
}

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
    fetchTemplate
}; 