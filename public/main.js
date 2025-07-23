document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile hamburger menu
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger && navMenu) {
        hamburger.onclick = function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
        };
        
        // Handle mobile dropdown navigation
        document.querySelectorAll('.nav-item').forEach(navItem => {
            const navLink = navItem.querySelector('.nav-link');
            const dropdownMenu = navItem.querySelector('.dropdown-menu');
            
            if (dropdownMenu) {
                // Parent items with dropdowns - toggle submenu on mobile
                navLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // On mobile, toggle the dropdown
                    if (window.innerWidth <= 1080) {
                        navItem.classList.toggle('active');
                        
                        // Close other open dropdowns
                        document.querySelectorAll('.nav-item.active').forEach(item => {
                            if (item !== navItem) {
                                item.classList.remove('active');
                            }
                        });
                    }
                });
                
                // Submenu items - close entire menu when clicked
                dropdownMenu.querySelectorAll('a').forEach(subLink => {
                    subLink.addEventListener('click', function() {
                        hamburger.classList.remove('active');
                        navMenu.classList.remove('active');
                        // Reset all dropdowns
                        document.querySelectorAll('.nav-item.active').forEach(item => {
                            item.classList.remove('active');
                        });
                    });
                });
            } else {
                // Regular nav links - close menu when clicked
                navLink.addEventListener('click', function() {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                });
            }
        });
        
        // Close dropdowns when clicking outside on mobile
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 1080) {
                const clickedInsideNav = e.target.closest('.nav-menu');
                if (!clickedInsideNav) {
                    document.querySelectorAll('.nav-item.active').forEach(item => {
                        item.classList.remove('active');
                    });
                }
            }
        });
        
        // Close dropdowns on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && window.innerWidth <= 1080) {
                document.querySelectorAll('.nav-item.active').forEach(item => {
                    item.classList.remove('active');
                });
            }
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