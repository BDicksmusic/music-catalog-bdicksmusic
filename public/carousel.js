// carousel.js
// Client-side carousel drag, momentum, and arrow scroll logic for the music catalog
// Usage: include <script src="carousel.js"></script> in your HTML after the carousel markup

// Enable smooth drag and momentum scrolling for the carousel
function enableCarouselDragScroll() {
    const carousel = document.getElementById('popular-works');
    if (!carousel) return;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let velocity = 0;
    let lastMove = 0;
    let lastTime = 0;
    let moved = false;
    let momentumID;
    let velocitySamples = [];

    function onMouseDown(e) {
        if (e.button !== 0) return;
        isDown = true;
        moved = false;
        carousel.classList.add('dragging');
        startX = e.pageX;
        scrollLeft = carousel.scrollLeft;
        velocity = 0;
        lastMove = e.pageX;
        lastTime = Date.now();
        velocitySamples = [];
        cancelMomentum();
        document.body.style.userSelect = 'none';
    }

    function onMouseMove(e) {
        if (!isDown) return;
        const x = e.pageX;
        const now = Date.now();
        const walk = x - startX;
        if (Math.abs(walk) > 2) moved = true;
        carousel.scrollLeft = scrollLeft - walk;
        // Calculate velocity based on distance/time
        const dt = now - lastTime;
        if (dt > 0) {
            const v = (x - lastMove) / dt;
            velocitySamples.push(v);
            if (velocitySamples.length > 5) velocitySamples.shift();
        }
        lastMove = x;
        lastTime = now;
    }

    function onMouseUp() {
        if (!isDown) return;
        isDown = false;
        carousel.classList.remove('dragging');
        document.body.style.userSelect = '';
        // Use the average of the last few velocity samples for momentum
        if (moved && velocitySamples.length) {
            velocity = velocitySamples.reduce((a, b) => a + b, 0) / velocitySamples.length * 16; // 16ms/frame
            startMomentum();
        }
    }

    function onMouseLeave() {
        if (!isDown) return;
        isDown = false;
        carousel.classList.remove('dragging');
        document.body.style.userSelect = '';
        if (moved && velocitySamples.length) {
            velocity = velocitySamples.reduce((a, b) => a + b, 0) / velocitySamples.length * 16;
            startMomentum();
        }
    }

    // Momentum/inertia
    function startMomentum() {
        cancelMomentum();
        const duration = 1500; // ms
        const start = performance.now();
        const initialVelocity = velocity;
        function momentum(now) {
            const elapsed = now - start;
            if (elapsed >= duration || Math.abs(velocity) < 0.1) {
                velocity = 0;
                return;
            }
            // Exponential decay: v = v0 * e^(-k*t)
            const t = elapsed / duration;
            const decay = Math.exp(-3 * t); // 3 is a decay constant, tweak for feel
            const currentVelocity = initialVelocity * decay;
            carousel.scrollLeft -= currentVelocity;
            velocity = currentVelocity;
            momentumID = requestAnimationFrame(momentum);
        }
        momentumID = requestAnimationFrame(momentum);
    }
    function cancelMomentum() {
        if (momentumID) cancelAnimationFrame(momentumID);
        momentumID = null;
    }

    // Mouse events
    carousel.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    carousel.addEventListener('mouseleave', onMouseLeave);

    // Touch events
    carousel.addEventListener('touchstart', (e) => {
        isDown = true;
        moved = false;
        carousel.classList.add('dragging');
        startX = e.touches[0].clientX;
        scrollLeft = carousel.scrollLeft;
        velocity = 0;
        lastMove = e.touches[0].clientX;
        lastTime = Date.now();
        velocitySamples = [];
        cancelMomentum();
    });
    carousel.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        const x = e.touches[0].clientX;
        const now = Date.now();
        const walk = x - startX;
        if (Math.abs(walk) > 2) moved = true;
        carousel.scrollLeft = scrollLeft - walk;
        const dt = now - lastTime;
        if (dt > 0) {
            const v = (x - lastMove) / dt;
            velocitySamples.push(v);
            if (velocitySamples.length > 5) velocitySamples.shift();
        }
        lastMove = x;
        lastTime = now;
    });
    window.addEventListener('touchend', () => {
        if (!isDown) return;
        isDown = false;
        carousel.classList.remove('dragging');
        if (moved && velocitySamples.length) {
            velocity = velocitySamples.reduce((a, b) => a + b, 0) / velocitySamples.length * 16;
            startMomentum();
        }
    });
    window.addEventListener('touchcancel', () => {
        if (!isDown) return;
        isDown = false;
        carousel.classList.remove('dragging');
        if (moved && velocitySamples.length) {
            velocity = velocitySamples.reduce((a, b) => a + b, 0) / velocitySamples.length * 16;
            startMomentum();
        }
    });
}

// Enable arrow button support for the carousel
function scrollWorks(direction) {
    const container = document.getElementById('popular-works');
    if (!container) return;
    // Scroll by 2.5 cards at a time for a more drastic effect
    const card = container.querySelector('.work-card');
    const cardWidth = card ? card.offsetWidth : 350;
    const scrollAmount = cardWidth * 2.5;
    container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
} 