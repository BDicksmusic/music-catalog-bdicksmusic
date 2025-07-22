// composition.js

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

async function loadCompositionDetail() {
    const id = getQueryParam('id');
    const container = document.getElementById('composition-detail');
    if (!id) {
        container.innerHTML = '<div class="error">No composition ID provided.</div>';
        return;
    }
    container.innerHTML = '<div class="loading">Loading composition...</div>';
    try {
        const response = await fetch(`/api/compositions/${id}`);
        const data = await response.json();
        if (!data.success) {
            container.innerHTML = '<div class="error">Composition not found.</div>';
            return;
        }
        const comp = data.composition;
        container.innerHTML = `
            <div class="composition-detail-card">
                <h1>${comp.title}</h1>
                <p><strong>Instrumentation:</strong> ${comp.instrumentation}</p>
                ${comp.year ? `<p><strong>Year:</strong> ${comp.year}</p>` : ''}
                ${comp.duration ? `<p><strong>Duration:</strong> ${comp.duration}</p>` : ''}
                ${comp.difficulty ? `<p><strong>Difficulty:</strong> ${comp.difficulty}</p>` : ''}
                ${comp.genre ? `<p><strong>Genre:</strong> ${comp.genre}</p>` : ''}
                <p><strong>Description:</strong> ${comp.description}</p>
                ${comp.coverImage ? `<img src="${comp.coverImage}" alt="${comp.title}" style="max-width:400px;">` : ''}
                <div>
                    ${comp.audioLink ? `<a href="${comp.audioLink}" target="_blank">🎵 Listen</a>` : ''}
                    ${comp.scoreLink ? `<a href="${comp.scoreLink}" target="_blank">📄 View Score</a>` : ''}
                    ${comp.purchaseLink ? `<a href="${comp.purchaseLink}" target="_blank">💳 Purchase</a>` : ''}
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = '<div class="error">Error loading composition details.</div>';
    }
}

document.addEventListener('DOMContentLoaded', loadCompositionDetail);
