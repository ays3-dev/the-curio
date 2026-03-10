const searchInput = document.getElementById('search-input');
const searchIcon = document.getElementById('search-icon');
const imageInput = document.getElementById('image-input');
const imageDropZone = document.getElementById('image-drop-zone');
const cameraBtn = document.getElementById('camera-btn');
const mapContainer = document.getElementById('rabbit-hole-map');
const floatingBubbles = document.getElementById('floating-bubbles');
const centerBubble = document.getElementById('center-bubble');
const didYouKnow = document.getElementById('did-you-know');

searchIcon.addEventListener('click', () => performSearch(searchInput.value));
searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(searchInput.value); });
cameraBtn.addEventListener('click', () => { imageDropZone.style.display = imageDropZone.style.display === 'none' ? 'block' : 'none'; });

async function performSearch(query, imageFile = null) {
    if (!query && !imageFile) return;

    document.querySelector('.info-section').style.display = 'none';
    document.querySelector('.tags').style.display = 'none';
    centerBubble.innerText = "Synthesizing...";
    mapContainer.style.display = 'block';
    floatingBubbles.innerHTML = '';
    didYouKnow.innerText = 'Bypassing regional archives...';

    try {
        const aiResponse = await fetch('/api/callAI', { ... });
        const sourcesData = await sourcesResponse.json();

        let imageBase64 = null;
        if (imageFile) {
            const rawBase64 = await fileToBase64(imageFile);
            imageBase64 = rawBase64.split(",")[1];
        }

        const aiResponse = await fetch('/.netlify/functions/callAI', {
            method: 'POST',
            body: JSON.stringify({ 
                query, 
                context: sourcesData.context,
                image: imageBase64,
                mimeType: imageFile?.type 
            })
        });

        const data = await aiResponse.json();
        
        console.log("Raw AI Response:", data);

if (!data || typeof data !== 'object') {
    console.error("Critical: AI response is not a valid object!");
}
        
        if (data.error) throw new Error(data.error);

        renderMap(query, data);
        await saveSearch(query); 
        await renderRecentSearches(); 
    } catch (err) {
        console.error("Critical Error:", err);
        centerBubble.innerText = "Error!";
        renderMap(query, getFallbackData(query));
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = e => reject(e);
        reader.readAsDataURL(file);
    });
}

function renderMap(query, data) {
    centerBubble.innerText = query;
    const favBtn = document.createElement('button');
favBtn.className = 'favorite-btn';
favBtn.innerHTML = `⭐ Save Hole`;
favBtn.onclick = (e) => {
    e.stopPropagation(); 
    toggleFavorite(query, data, favBtn);
};
centerBubble.appendChild(favBtn);
    didYouKnow.innerHTML = data.didYouKnow;
    floatingBubbles.innerHTML = '';

    if (!data.categories) return;

    const positions = [];
    const containerW = mapContainer.clientWidth;
    const containerH = mapContainer.clientHeight;
    const bubbleRadius = 55;
    const minDistance = 120; 
    const centerAvoidRadius = 160; 

    data.categories.forEach((cat) => {
        const bubble = document.createElement('div');
        bubble.className = 'floating-bubble';
        bubble.innerText = cat.title;

        let x, y;
        let safe = false;
        let attempts = 0;

        while (!safe && attempts < 100) {

            x = Math.random() * (containerW - 110) + 55;
            y = Math.random() * (containerH - 110) + 55;

            const dxCenter = x - (containerW / 2);
            const dyCenter = y - (containerH / 2);
            const distToCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);

            if (distToCenter > centerAvoidRadius) {
                safe = positions.every(pos => {
                    const dx = x - pos.x;
                    const dy = y - pos.y;
                    return Math.sqrt(dx * dx + dy * dy) > minDistance;
                });
            }

            attempts++;
        }

        positions.push({ x, y });

        bubble.style.left = `${x - 50}px`;
        bubble.style.top = `${y - 50}px`;

        bubble.onclick = () => renderFactCards(cat);
        floatingBubbles.appendChild(bubble);
    });
}

function renderFactCards(category) {
    const panel = document.getElementById('fact-panel');
    panel.innerHTML = '';
    
    category.facts.forEach(fact => {
        let finalUrl = fact.url;
        if (!finalUrl || finalUrl === "#" || finalUrl.includes("URL") || finalUrl.length < 5) {
            const fallbackQuery = encodeURIComponent(`${fact.text} ${fact.source}`);
            finalUrl = `https://www.google.com/search?q=${fallbackQuery}`;
        }

        const card = document.createElement('div');
        card.className = 'fact-card';
        card.innerHTML = `
            <h3>${category.title}</h3>
            <p>${fact.text}</p>
            <div class="fact-source">
                ${getSourceIcon(fact.source)}
                <a href="${finalUrl}" target="_blank" rel="noopener noreferrer">Verify Source</a>
            </div>
        `;
        panel.appendChild(card);
    });
}

function getSourceIcon(source) {
    const s = source.toLowerCase();
    if (s.includes("reddit"))
        return `<img src="https://cdn.simpleicons.org/reddit/FF4500" width="16">`;
    if (s.includes("wiki"))
        return `<img src="https://cdn.simpleicons.org/wikipedia/000000" width="16">`;
    if (s.includes("openlibrary"))
        return `<img src="openlibrary.png" width="18" style="border-radius: 50%;">`;
    if (s.includes("archive"))
        return `<img src="https://cdn.simpleicons.org/internetarchive/00ADEF" width="16">`;
    if (s.includes("nasa"))
        return `<img src="https://cdn.simpleicons.org/nasa/FC3D21" width="16">`;
    if (s.includes("history"))
        return `<img src="history.png" width="16">`;
    if (s.includes("animal"))
        return `<img src="https://cdn.simpleicons.org/paw/FF9900" width="16">`;
    if (s.includes("cia"))
        return `<img src="cia.png"  width="18" style="border-radius: 50%;">`;
    if (s.includes("pubmed"))
        return `<img src="https://cdn.simpleicons.org/pubmed/339933" width="16">`;

    return `<span>🔗</span>`;
}

function getFallbackData(query) {
    return {
        categories: [
            { title: "Archive Busy", facts: [{ text: `The deep web archives are taking extra time for ${query}`, source: "System" }] }
        ],
        didYouKnow: "Some rabbit holes are deeper than others!"
    };
}

const recentDropdown = document.getElementById('recent-searches');

const LOCAL_HISTORY_KEY = 'curio_search_history';

async function getSearchHistory() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const user = session?.user;

    if (!user) return [];

    const { data, error } = await supabaseClient
        .from('search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20); 

    if (error) return [];
    
    return data;
}

async function saveSearch(query) {
    if (!query || !query.trim()) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    const user = session?.user;

    if (!user) return; 

    const { error } = await supabaseClient
        .from('search_history')
        .insert([{ 
            user_id: user.id, 
            query_term: query.trim(),
            fact_body: null, 
            source_link: null,
            is_favorite: false,
            created_at: new Date().toISOString() 
        }]);
    
    if (error) {
        console.error('Error saving search history:', error.message);
    } else {
        console.log('Search history updated for:', user.id);
    }
}

async function renderRecentSearches() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const user = session?.user;

    if (!user) {
        recentDropdown.style.display = 'none';
        return;
    }

    const historyRows = await getSearchHistory();
    
    if (historyRows.length === 0) {
        recentDropdown.style.display = 'none';
        return;
    }

    recentDropdown.innerHTML = '';
    historyRows.forEach(row => {
        const div = document.createElement('div');
        div.className = 'recent-item';
        
        const icon = row.fact_body ? '🌟' : '🕒';

        div.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; flex-grow: 1;">
                <span>${icon}</span>
                <span>${row.query_term}</span>
            </div>
            <span class="delete-history" title="Remove">×</span>
        `;

        div.addEventListener('click', () => {
            searchInput.value = row.query_term;
            recentDropdown.style.display = 'none';
            
            if (row.fact_body) {
                const savedData = typeof row.fact_body === 'string' ? JSON.parse(row.fact_body) : row.fact_body;
                document.querySelector('.info-section').style.display = 'none';
                document.querySelector('.tags').style.display = 'none';
                mapContainer.style.display = 'block';
                renderMap(row.query_term, savedData);
            } else {
                performSearch(row.query_term);
            }
        });

        const xButton = div.querySelector('.delete-history');
        xButton.addEventListener('click', (e) => {
            e.stopPropagation(); 
            deleteSearchItem(row.query_term, div);
        });

        recentDropdown.appendChild(div);
    });

    recentDropdown.style.display = 'block';
    recentDropdown.classList.remove('hidden');
}

async function deleteSearchItem(term, element) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const user = session?.user;

    if (!user) return;

    const { error } = await supabaseClient
        .from('search_history')
        .delete()
        .eq('user_id', user.id)
        .eq('query_term', term);

    if (!error) {
        element.remove(); 
        if (recentDropdown.children.length === 0) {
            recentDropdown.style.display = 'none';
        }
    } else {
        console.error("Error deleting:", error);
    }
}

async function toggleFavorite(query, data, btn) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const user = session?.user;
    if (!user) return alert("Sign in to save favorites!");

    const { error } = await supabaseClient
        .from('search_history')
        .insert([{ 
            user_id: user.id, 
            query_term: query,
            fact_body: JSON.stringify(data), 
            is_favorite: true,
            created_at: new Date().toISOString() 
        }]);

    if (!error) {
        btn.classList.add('active');
        btn.innerHTML = `<span>🌟</span> Saved!`;
    }
}

searchInput.addEventListener('focus', renderRecentSearches);
searchInput.addEventListener('input', renderRecentSearches);

document.addEventListener('mousedown', (e) => {
    if (!searchInput.contains(e.target) && !recentDropdown.contains(e.target)) {
        recentDropdown.style.display = 'none';
    }
});

const cleanHistoryBtn = document.getElementById('clean-history');

cleanHistoryBtn.addEventListener('click', async () => {
    const confirmClear = confirm("Are you sure? This will delete all recent searches and saved favorites permanently.");
    
    if (confirmClear) {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            const user = session?.user;

            if (!user) return alert("Please log in to manage history.");

            const { error } = await supabaseClient
                .from('search_history')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;

            alert("History cleared successfully.");
            
            recentDropdown.innerHTML = '';
            recentDropdown.style.display = 'none';
            
            location.reload(); 

        } catch (err) {
            console.error("Error cleaning history:", err.message);
            alert("Failed to clear history. Please try again.");
        }
    }
});
