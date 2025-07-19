console.log("Website loaded!");

// ===== NAVIGATION FUNCTIONS =====
document.addEventListener('DOMContentLoaded', function() {
    loadCompositions(); // Load compositions first
    // Navigation is now directly in HTML, no need to load
    setActivePage();
    initMobileMenu();
});

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

        document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }));
    }
}

// ===== COMPOSITION FUNCTIONS =====

// Load and display all compositions
async function loadCompositions() {
    try {
        showLoading('popular-works');
        
        const response = await fetch('/api/compositions');
        const data = await response.json();
        
        if (data.success) {
            displayCompositions(data.compositions, 'popular-works');
            console.log(`✅ Loaded ${data.count} compositions from Notion`);
        } else {
            showError('popular-works', 'Failed to load compositions');
        }
    } catch (error) {
        console.error('❌ Error loading compositions:', error);
        showError('popular-works', 'Error connecting to server');
    }
}

// Display compositions in beautiful cards
function displayCompositions(compositions, containerId) {
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
    }
    
    if (compositions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No compositions found</h3>
                <p>Check back soon for new musical works!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = compositions.map(comp => `
        <div class="work-card" onclick="viewComposition('${comp.id}')">
            <div class="work-header">
                <h3 class="work-title">${comp.title}</h3>
                <div class="work-instrument">${comp.instrumentation}</div>
            </div>
            
            <div class="work-content">
                ${(comp.year || comp.duration) ? `
                    <div class="work-meta">
                        ${comp.year ? `<div class="work-year">${comp.year}</div>` : ''}
                        ${comp.duration && comp.duration !== 'Duration:' ? `<div class="work-duration">${comp.duration}</div>` : ''}
                    </div>
                ` : ''}
                
                ${comp.difficulty ? `<div class="difficulty-badge ${comp.difficulty.toLowerCase()}">${comp.difficulty}</div>` : ''}
                
                ${comp.description ? `<p class="work-description">${comp.description}</p>` : ''}
                
                ${comp.tags && comp.tags.length > 0 ? `
                    <div class="work-tags">
                        ${comp.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
                
                <div class="work-links">
                    ${comp.audioLink ? `<a href="${comp.audioLink}" target="_blank" class="btn-secondary" onclick="event.stopPropagation()">🎵 Listen</a>` : ''}
                    ${comp.scoreLink ? `<a href="${comp.scoreLink}" target="_blank" class="btn-secondary" onclick="event.stopPropagation()">📄 Score</a>` : ''}
                    ${comp.purchaseLink ? `<a href="${comp.purchaseLink}" target="_blank" class="btn-primary" onclick="event.stopPropagation()">💳 Purchase</a>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// View single composition details
async function viewComposition(id) {
    try {
        const response = await fetch(`/api/compositions/${id}`);
        const data = await response.json();
        
        if (data.success) {
            showCompositionModal(data.composition);
        } else {
            alert('Failed to load composition details');
        }
    } catch (error) {
        console.error('Error loading composition:', error);
        alert('Error loading composition details');
    }
}

// Show composition in modal/popup
function showCompositionModal(comp) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal()">&times;</button>
            <h2>${comp.title}</h2>
            <p><strong>Instrumentation:</strong> ${comp.instrumentation}</p>
            ${comp.year ? `<p><strong>Year:</strong> ${comp.year}</p>` : ''}
            ${comp.duration ? `<p><strong>Duration:</strong> ${comp.duration}</p>` : ''}
            ${comp.difficulty ? `<p><strong>Difficulty:</strong> ${comp.difficulty}</p>` : ''}
            ${comp.genre ? `<p><strong>Genre:</strong> ${comp.genre}</p>` : ''}
            <p><strong>Description:</strong> ${comp.description}</p>
            
            <div class="modal-links">
                ${comp.audioLink ? `<a href="${comp.audioLink}" target="_blank" class="btn-primary">🎵 Listen</a>` : ''}
                ${comp.scoreLink ? `<a href="${comp.scoreLink}" target="_blank" class="btn-secondary">📄 View Score</a>` : ''}
                ${comp.purchaseLink ? `<a href="${comp.purchaseLink}" target="_blank" class="btn-primary">💳 Purchase</a>` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Close modal
function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// ===== FORM FUNCTIONS =====

// Add new composition form handler
async function submitComposition(event) {
    event.preventDefault();
    
    const formData = {
        title: document.getElementById('title').value,
        instrumentation: document.getElementById('instrumentation').value,
        year: document.getElementById('year').value,
        duration: document.getElementById('duration').value,
        difficulty: document.getElementById('difficulty').value,
        genre: document.getElementById('genre').value,
        description: document.getElementById('description').value,
        audioLink: document.getElementById('audioLink').value,
        scoreLink: document.getElementById('scoreLink').value,
        purchaseLink: document.getElementById('purchaseLink').value,
        tags: document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
    };
    
    try {
        const response = await fetch('/api/compositions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Composition added successfully!');
            document.getElementById('composition-form').reset();
            loadCompositions(); // Reload the list
        } else {
            alert('Error: ' + (result.message || result.error));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to add composition');
    }
}

// Set up form handler when page loads
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('composition-form');
    if (form) {
        form.addEventListener('submit', submitComposition);
    }
    
    // Set up modal close on background click
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            closeModal();
        }
    });
});

// ===== UTILITY FUNCTIONS =====

// Filter compositions by genre
async function filterByGenre(genre) {
    try {
        const response = await fetch(`/api/compositions/genre/${genre}`);
        const data = await response.json();
        
        if (data.success) {
            displayCompositions(data.compositions, 'popular-works');
        }
    } catch (error) {
        console.error('Error filtering compositions:', error);
    }
}

// Search functionality
function searchCompositions(searchTerm) {
    const cards = document.querySelectorAll('.work-card');
    cards.forEach(card => {
        const title = card.querySelector('.work-title').textContent.toLowerCase();
        const instrument = card.querySelector('.work-instrument').textContent.toLowerCase();
        const description = card.querySelector('.work-description')?.textContent.toLowerCase() || '';
        
        if (title.includes(searchTerm.toLowerCase()) || 
            instrument.includes(searchTerm.toLowerCase()) || 
            description.includes(searchTerm.toLowerCase())) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<div class="loading">Loading compositions...</div>';
    }
}

function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="error">${message}</div>`;
    }
}