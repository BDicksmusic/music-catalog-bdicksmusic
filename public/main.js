document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile hamburger menu
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger && navMenu) {
        hamburger.onclick = function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
        };
        
        // Close mobile menu when clicking nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
    
    // Initialize theme toggle
    initThemeToggle();
});

// Theme toggle functionality
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return; // Exit if theme toggle button doesn't exist on this page
    
    const html = document.documentElement;
    
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    
    // Update button state based on current theme
    updateThemeButton(savedTheme);
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // Update theme
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update button
        updateThemeButton(newTheme);
        
        // Add transition effect
        html.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            html.style.transition = '';
        }, 300);
    });
}

function updateThemeButton(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return; // Exit if theme toggle button doesn't exist
    
    const sunIcon = themeToggle.querySelector('.sun-icon');
    const moonIcon = themeToggle.querySelector('.moon-icon');
    
    if (!sunIcon || !moonIcon) return; // Exit if icons don't exist
    
    if (theme === 'dark') {
        sunIcon.style.opacity = '1';
        sunIcon.style.transform = 'rotate(0deg)';
        moonIcon.style.opacity = '0';
        moonIcon.style.transform = 'rotate(-90deg)';
    } else {
        sunIcon.style.opacity = '0';
        sunIcon.style.transform = 'rotate(90deg)';
        moonIcon.style.opacity = '1';
        moonIcon.style.transform = 'rotate(0deg)';
    }
}