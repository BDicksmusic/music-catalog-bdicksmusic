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
  {
    id: "3",
    slug: "evening-dance",
    title: "Evening Dance",
    instrumentation: "String Quartet",
    year: 2020,
    duration: "5:15",
    difficulty: "Easy",
    description: "A gentle, lyrical piece for string quartet.",
    tags: ["strings", "quartet", "lyrical"],
    coverImage: "/imgs/Coming Home (Cover Photo).png",
    paymentLink: "",
    stripeProductId: "",
    stripePriceId: "",
    price: 18
  },
  {
    id: "4",
    slug: "march-of-the-titans",
    title: "March of the Titans",
    instrumentation: "Wind Ensemble",
    year: 2019,
    duration: "7:00",
    difficulty: "Medium",
    description: "A bold, cinematic march for wind ensemble.",
    tags: ["wind", "ensemble", "march"],
    coverImage: "https://via.placeholder.com/350x200?text=March+of+the+Titans",
    paymentLink: "",
    stripeProductId: "",
    stripePriceId: "",
    price: 22
  },
  {
    id: "5",
    slug: "autumn-leaves",
    title: "Autumn Leaves",
    instrumentation: "Jazz Combo",
    year: 2023,
    duration: "4:45",
    difficulty: "Easy",
    description: "A smooth jazz arrangement for combo.",
    tags: ["jazz", "combo", "autumn"],
    coverImage: "https://via.placeholder.com/350x200?text=Autumn+Leaves",
    paymentLink: "",
    stripeProductId: "",
    stripePriceId: "",
    price: 16
  },
  {
    id: "6",
    slug: "celestial-waltz",
    title: "Celestial Waltz",
    instrumentation: "Orchestra",
    year: 2018,
    duration: "8:30",
    difficulty: "Hard",
    description: "A sweeping waltz for full orchestra.",
    tags: ["orchestra", "waltz", "celestial"],
    coverImage: "https://via.placeholder.com/350x200?text=Celestial+Waltz",
    paymentLink: "",
    stripeProductId: "",
    stripePriceId: "",
    price: 25
  },
  {
    id: "7",
    slug: "midnight-groove",
    title: "Midnight Groove",
    instrumentation: "Saxophone Quartet",
    year: 2022,
    duration: "3:50",
    difficulty: "Medium",
    description: "A funky, rhythmic piece for sax quartet.",
    tags: ["saxophone", "quartet", "groove"],
    coverImage: "https://via.placeholder.com/350x200?text=Midnight+Groove",
    paymentLink: "",
    stripeProductId: "",
    stripePriceId: "",
    price: 17
  },
  {
    id: "8",
    slug: "winter-solstice",
    title: "Winter Solstice",
    instrumentation: "Chamber Choir",
    year: 2021,
    duration: "6:10",
    difficulty: "Medium",
    description: "A serene choral work for winter.",
    tags: ["choir", "chamber", "winter"],
    coverImage: "https://via.placeholder.com/350x200?text=Winter+Solstice",
    paymentLink: "",
    stripeProductId: "",
    stripePriceId: "",
    price: 19
  },
  {
    id: "9",
    slug: "rising-sun",
    title: "Rising Sun",
    instrumentation: "Solo Flute",
    year: 2020,
    duration: "2:30",
    difficulty: "Easy",
    description: "A bright solo for flute.",
    tags: ["flute", "solo", "sunrise"],
    coverImage: "https://via.placeholder.com/350x200?text=Rising+Sun",
    paymentLink: "",
    stripeProductId: "",
    stripePriceId: "",
    price: 10
  },
  {
    id: "10",
    slug: "desert-mirage",
    title: "Desert Mirage",
    instrumentation: "Percussion Ensemble",
    year: 2017,
    duration: "5:40",
    difficulty: "Medium",
    description: "A mysterious, evocative piece for percussion.",
    tags: ["percussion", "ensemble", "desert"],
    coverImage: "https://via.placeholder.com/350x200?text=Desert+Mirage",
    paymentLink: "",
    stripeProductId: "",
    stripePriceId: "",
    price: 21
  },
  {
    id: "11",
    slug: "spring-awakening",
    title: "Spring Awakening",
    instrumentation: "Clarinet Trio",
    year: 2023,
    duration: "4:20",
    difficulty: "Easy",
    description: "A lively trio for clarinets.",
    tags: ["clarinet", "trio", "spring"],
    coverImage: "https://via.placeholder.com/350x200?text=Spring+Awakening",
    paymentLink: "",
    stripeProductId: "",
    stripePriceId: "",
    price: 14
  },
  {
    id: "12",
    slug: "harbor-lights",
    title: "Harbor Lights",
    instrumentation: "Brass Ensemble",
    year: 2019,
    duration: "6:50",
    difficulty: "Medium",
    description: "A shimmering brass ensemble work.",
    tags: ["brass", "ensemble", "harbor"],
    coverImage: "https://via.placeholder.com/350x200?text=Harbor+Lights",
    paymentLink: "",
    stripeProductId: "",
    stripePriceId: "",
    price: 20
  },
  {
    id: "13",
    slug: "mountain-echoes",
    title: "Mountain Echoes",
    instrumentation: "Solo Horn",
    year: 2022,
    duration: "3:10",
    difficulty: "Medium",
    description: "A solo horn piece inspired by mountains.",
    tags: ["horn", "solo", "mountain"],
    coverImage: "https://via.placeholder.com/350x200?text=Mountain+Echoes",
    paymentLink: "",
    stripeProductId: "",
    stripePriceId: "",
    price: 13
  },
  {
    id: "14",
    slug: "city-lights",
    title: "City Lights",
    instrumentation: "Big Band",
    year: 2021,
    duration: "5:00",
    difficulty: "Hard",
    description: "A vibrant big band chart.",
    tags: ["big band", "jazz", "city"],
    coverImage: "https://via.placeholder.com/350x200?text=City+Lights",
    paymentLink: "",
    stripeProductId: "",
    stripePriceId: "",
    price: 23
  },
  {
    id: "15",
    slug: "forest-whispers",
    title: "Forest Whispers",
    instrumentation: "Woodwind Quintet",
    year: 2020,
    duration: "4:55",
    difficulty: "Easy",
    description: "A gentle piece for woodwind quintet.",
    tags: ["woodwind", "quintet", "forest"],
    coverImage: "https://via.placeholder.com/350x200?text=Forest+Whispers",
    paymentLink: "",
    stripeProductId: "",
    stripePriceId: "",
    price: 15
  },
  {
    id: "16",
    slug: "river-run",
    title: "River Run",
    instrumentation: "Solo Violin",
    year: 2018,
    duration: "3:30",
    difficulty: "Medium",
    description: "A flowing solo for violin.",
    tags: ["violin", "solo", "river"],
    coverImage: "https://via.placeholder.com/350x200?text=River+Run",
    paymentLink: "",
    stripeProductId: "",
    stripePriceId: "",
    price: 12
  },
  {
    id: "17",
    slug: "golden-fields",
    title: "Golden Fields",
    instrumentation: "String Orchestra",
    year: 2017,
    duration: "6:20",
    difficulty: "Medium",
    description: "A pastoral work for string orchestra.",
    tags: ["strings", "orchestra", "fields"],
    coverImage: "https://via.placeholder.com/350x200?text=Golden+Fields",
    paymentLink: "",
    stripeProductId: "",
    stripePriceId: "",
    price: 19
  },
  {
    id: "18",
    slug: "firefly-nights",
    title: "Firefly Nights",
    instrumentation: "Solo Guitar",
    year: 2023,
    duration: "2:45",
    difficulty: "Easy",
    description: "A light, sparkling solo for guitar.",
    tags: ["guitar", "solo", "firefly"],
    coverImage: "https://via.placeholder.com/350x200?text=Firefly+Nights",
    paymentLink: "",
    stripeProductId: "",
    stripePriceId: "",
    price: 11
  }
];

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

async function loadCompositionDetail() {
    const slug = getQueryParam('slug');
    const container = document.getElementById('composition-detail');
    if (!slug) {
        container.innerHTML = '<div class="error">No composition slug provided.</div>';
        return;
    }
    container.innerHTML = '<div class="loading">Loading composition...</div>';
    try {
        const response = await fetch(`/api/compositions/slug/${slug}`);
        const data = await response.json();
        if (!data.success) {
            // Fallback to local data
            const comp = exampleCompositions.find(c => c.slug === slug);
            if (comp) {
                renderComposition(comp);
            } else {
                container.innerHTML = '<div class="error">Composition not found.</div>';
            }
            return;
        }
        renderComposition(data.composition);
    } catch (err) {
        // Fallback to local data
        const comp = exampleCompositions.find(c => c.slug === slug);
        if (comp) {
            renderComposition(comp);
        } else {
            container.innerHTML = '<div class="error">Error loading composition details.</div>';
        }
    }
}

function renderComposition(comp) {
    const container = document.getElementById('composition-detail');
    container.innerHTML = `
        <div class="composition-detail-card">
            <div class="composition-cover-container">
                ${comp.coverImage ? `<img src="${comp.coverImage}" alt="${comp.title}" class="composition-cover">` : ''}
            </div>
            <div class="composition-info">
                <div class="composition-title-instrument">
                    <div class="composition-title">${comp.title}</div>
                    <div class="composition-instrument">${comp.instrumentation}</div>
                </div>
                <div class="composition-meta">
                    ${comp.year ? `<span>📅 ${comp.year}</span>` : ''}
                    ${comp.duration ? `<span>⏱ ${comp.duration}</span>` : ''}
                </div>
                <div class="composition-description">${comp.description}</div>
                <div class="composition-actions">
                    ${comp.audioLink ? `<a href="${comp.audioLink}" target="_blank" class="composition-action-btn">🎵 Listen</a>` : ''}
                    ${comp.scoreLink ? `<a href="${comp.scoreLink}" target="_blank" class="composition-action-btn">📄 View Score</a>` : ''}
                    ${comp.purchaseLink ? `<a href="${comp.purchaseLink}" target="_blank" class="composition-action-btn">💳 Purchase</a>` : ''}
                </div>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', loadCompositionDetail); 