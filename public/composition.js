// composition.js

// Example Data for Local Testing (copied from index.html)
const exampleCompositions = [
  {
    id: "1",
    slug: "sunrise-fanfare",
    title: "Sunrise Fanfare",
    instrumentation: "Brass Quintet",
    year: 2022,
    duration: "4:30",
    difficulty: "Medium",
    description: "A bright, energetic piece for brass quintet.",
    tags: ["brass", "fanfare", "modern"],
    coverImage: "/imgs/Coming Home (Cover Photo).png",
    paymentLink: "",
    stripeProductId: "",
    stripePriceId: "",
    price: 20
  },
  {
    id: "2",
    slug: "nocturne-in-blue",
    title: "Nocturne in Blue",
    instrumentation: "Solo Piano",
    year: 2021,
    duration: "6:00",
    difficulty: "Hard",
    description: "A reflective nocturne for solo piano.",
    tags: ["piano", "nocturne", "contemporary"],
    coverImage: "/imgs/Coming Home (Cover Photo).png",
    paymentLink: "",
    stripeProductId: "",
    stripePriceId: "",
    price: 15
  },
  // ... rest of your example compositions data ...
];

// Fetch all compositions
const response = await fetch('/api/compositions');
const data = await response.json();
const allCompositions = data.compositions;

// Filter for popular
const popularCompositions = allCompositions.filter(comp => comp.popular);

// Now use popularCompositions for your carousel
renderCarousel(popularCompositions);

function getSlugFromUrl() {
    // Extract slug from pathname for pretty URLs like /composition/slug-name
    const pathMatch = window.location.pathname.match(/^\/composition\/([^/?#]+)/);
    if (pathMatch && pathMatch[1]) {
        console.log('Found slug in path:', pathMatch[1]);
        return pathMatch[1];
    }
    
    // Fallback: try query param
    const params = new URLSearchParams(window.location.search);
    if (params.has('slug')) {
        console.log('Found slug in query params:', params.get('slug'));
        return params.get('slug');
    }
    
    console.log('No slug found in URL');
    return null;
}
// Call the function to run it
loadCompositions();

async function loadCompositionDetail() {
    const slug = getSlugFromUrl();
    console.log('Loading composition with slug:', slug);
    
    const container = document.getElementById('composition-info');
    
    if (!slug) {
        if (container) {
            container.innerHTML = '<div class="error">No composition specified.</div>';
        }
        return;
    }

    // Show loading state
    if (container) {
        container.innerHTML = '<div class="loading">Loading composition...</div>';
    }

    try {
        // Try API first
        const response = await fetch(`/api/compositions/slug/${encodeURIComponent(slug)}`);
        const data = await response.json();
        
        console.log('API response:', data);
        
        if (data.success && data.composition) {
            renderComposition(data.composition);
        } else {
            // Fallback to example data
            console.log('API failed, trying example data...');
            const comp = exampleCompositions.find(c => c.slug === slug);
            if (comp) {
                renderComposition(comp);
            } else {
                if (container) {
                    container.innerHTML = '<div class="error">Composition not found.</div>';
                }
            }
        }
    } catch (err) {
        console.error('Error loading composition:', err);
        
        // Fallback to example data
        const comp = exampleCompositions.find(c => c.slug === slug);
        if (comp) {
            console.log('Using fallback example data');
            renderComposition(comp);
        } else {
            if (container) {
                container.innerHTML = '<div class="error">Error loading composition details.</div>';
            }
        }
    }
}
loadCompositions();


function renderComposition(comp) {
    console.log('Rendering composition:', comp);
    
    // Update cover image
    const coverImg = document.getElementById('composition-cover');
    if (coverImg && comp.coverImage) {
        coverImg.src = comp.coverImage;
        coverImg.alt = comp.title;
    }
    
    // Build the info HTML
    const container = document.getElementById('composition-info');
    if (!container) return;
    
    const buyButtonHtml = comp.paymentLink || comp.stripePriceId ? 
        `<button class="composition-buy-btn" onclick="purchaseComposition('${comp.id}', '${comp.title.replace(/'/g, "\\'")}', ${comp.price || 10})">
            💳 Buy Now - $${comp.price || 10}
        </button>` : 
        `<button class="composition-buy-btn btn-disabled" onclick="showUnavailableMessage('${comp.title.replace(/'/g, "\\'")}')">
            🚫 Currently Not Available
        </button>`;
    
    container.innerHTML = `
        <h1 class="composition-title">${comp.title || 'Untitled'}</h1>
        <div class="composition-instrument">${comp.instrumentation || 'Unknown'}</div>
        
        <div class="composition-meta">
            ${comp.year ? `<span>Year: ${comp.year}</span>` : ''}
            ${comp.duration ? `<span>Duration: ${comp.duration}</span>` : ''}
            ${comp.difficulty ? `<span>Difficulty: ${comp.difficulty}</span>` : ''}
        </div>
        
        ${comp.description ? `<div class="composition-description">${comp.description}</div>` : ''}
        
        ${buyButtonHtml}
        
        <div class="composition-links">
            ${comp.audioLink ? `<a href="${comp.audioLink}" target="_blank" class="btn-secondary">🎵 Listen</a>` : ''}
            ${comp.scoreLink ? `<a href="${comp.scoreLink}" target="_blank" class="btn-secondary">📄 View Score</a>` : ''}
        </div>
    `;
}

// Purchase function for Stripe integration
async function purchaseComposition(compositionId, title, price) {
    try {
        const confirmed = confirm(`Purchase "${title}" for $${price}?\n\nYou'll be redirected to Stripe checkout.`);
        
        if (confirmed) {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ compositionId: compositionId })
            });
            
            const data = await response.json();
            
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                alert('Error creating checkout session. Please try again.');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error processing purchase. Please try again.');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing composition detail page...');
    loadCompositionDetail();
});