console.log("Website loaded!");

// Add click handlers to buttons
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('button');
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            alert('Button clicked: ' + this.textContent);
        });
    });
});

// Load navigation on every page
document.addEventListener('DOMContentLoaded', function() {
    loadNavigation();
});

async function loadNavigation() {
    try {
        const response = await fetch('includes/nav.html');
        const navHTML = await response.text();
        document.getElementById('navigation').innerHTML = navHTML;
        
        // Set active page
        setActivePage();
        
        // Initialize mobile menu
        initMobileMenu();
    } catch (error) {
        console.error('Error loading navigation:', error);
    }
}

function setActivePage() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('active');
        }
    });
}

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



// Load compositions from Notion API
document.addEventListener('DOMContentLoaded', function() {
    loadCompositions();
    loadNavigation();
});

async function loadCompositions() {
    const grid = document.getElementById('compositionGrid');
    
    if (!grid) return; // Not on a page with composition grid
    
    try {
        showLoading(grid);
        
        const response = await fetch('/api/compositions');
        const result = await response.json();
        
        if (result.success) {
            renderCompositions(result.data);
            console.log(`✅ Loaded ${result.count} compositions from Notion`);
        } else {
            showError(grid, result.message);
        }
        
    } catch (error) {
        console.error('❌ Error loading compositions:', error);
        showError(grid, 'Failed to load compositions');
    }
}

function renderCompositions(compositions) {
    const grid = document.getElementById('compositionGrid');
    
    if (compositions.length === 0) {
        grid.innerHTML = '<p class="no-results">No compositions found.</p>';
        return;
    }
    
    grid.innerHTML = compositions.map(comp => `
        <div class="composition-card" data-genre="${comp.genre.toLowerCase()}">
            <h3 class="composition-title">${comp.title}</h3>
            
            <div class="composition-meta">
                <span class="genre-tag">${comp.genre}</span>
                <span class="bpm">${comp.bpm} BPM</span>
                <span class="duration">${comp.duration}</span>
            </div>
            
            ${comp.audioFile ? `
                <audio controls class="audio-player">
                    <source src="${comp.audioFile}" type="audio/mpeg">
                    Your browser does not support audio.
                </audio>
            ` : ''}
            
            <p class="composition-description">${comp.description}</p>
            
            <div class="composition-tags">
                ${comp.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            
            <div class="composition-actions">
                <span class="price">$${comp.price}</span>
                <button class="btn btn-primary" onclick="purchaseTrack('${comp.id}', '${comp.title}', ${comp.price})">
                    License Track
                </button>
            </div>
        </div>
    `).join('');
}

function showLoading(container) {
    container.innerHTML = `
        <div class="loading">
            <p>🎵 Loading compositions from Notion...</p>
            <div class="loading-spinner"></div>
        </div>
    `;
}

function showError(container, message) {
    container.innerHTML = `
        <div class="error">
            <p>❌ ${message}</p>
            <button onclick="loadCompositions()" class="btn btn-secondary">Try Again</button>
        </div>
    `;
}

async function purchaseTrack(id, title, price) {
    // Integrate with Stripe or other payment processor
    alert(`Purchasing "${title}" for $${price}\n\nID: ${id}`);
    
    // In real implementation:
    // window.location.href = `/checkout?track=${id}`;
}

// Filter compositions by genre
function filterByGenre(genre) {
    const cards = document.querySelectorAll('.composition-card');
    
    cards.forEach(card => {
        if (genre === 'all' || card.dataset.genre === genre) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Navigation loader (from previous examples)
async function loadNavigation() {
    try {
        const response = await fetch('includes/nav.html');
        const navHTML = await response.text();
        document.getElementById('navigation').innerHTML = navHTML;
        
        setActivePage();
        initMobileMenu();
    } catch (error) {
        console.error('Error loading navigation:', error);
    }
}

function setActivePage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });
}

function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
}