const GEMINI_API_KEY = 'API_KEY_PLACEHOLDER';

const searchInput = document.getElementById('search-input');
const searchIcon = document.getElementById('search-icon');
const imageInput = document.getElementById('image-input');
const imageDropZone = document.getElementById('image-drop-zone');
const cameraBtn = document.getElementById('camera-btn');
const mapContainer = document.getElementById('rabbit-hole-map');
const floatingBubbles = document.getElementById('floating-bubbles');
const centerBubble = document.getElementById('center-bubble');
const didYouKnow = document.getElementById('did-you-know');

const MODELS = [
    "gemini-2.5-flash",
    "gemini-3-flash",
    "gemini-2.5-flash-lite",
    "gemma-2-9b-it",
    "gemma-2-27b-it",
    "gemma-3-4b-it",
    "gemma-3-12b-it",
    "gemma-3-27b-it"
];

document.querySelectorAll('.tag').forEach(tag => {
    tag.addEventListener('click', () => {
        searchInput.value = tag.innerText;
        performSearch(tag.innerText);
    });
});

searchIcon.addEventListener('click', () => performSearch(searchInput.value));
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch(searchInput.value);
});

cameraBtn.addEventListener('click', () => {
    imageDropZone.style.display = imageDropZone.style.display === 'none' ? 'block' : 'none';
});

imageDropZone.addEventListener('click', () => {
imageInput.click();
});

imageInput.addEventListener('change', async (e) => {
    if (e.target.files.length) {
        const file = e.target.files[0];
        await performSearch(searchInput.value, file);
    }
});

imageDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageDropZone.classList.add('dragover');
});
imageDropZone.addEventListener('dragleave', () => {
    imageDropZone.classList.remove('dragover');
});
imageDropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    imageDropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) await performSearch(searchInput.value, file);
});

document.addEventListener('paste', async (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            await performSearch(searchInput.value, file);
            break;
        }
    }
});

async function performSearch(query, imageFile = null) {
    if (!query && !imageFile) return;

    document.querySelector('.info-section').style.display = 'none';
    document.querySelector('.tags').style.display = 'none';
    centerBubble.innerText = "Synthesizing...";
    mapContainer.style.display = 'block';
    floatingBubbles.innerHTML = '';
    didYouKnow.innerText = 'Bypassing regional archives...';

    try {
        const [
            wiki,
            reddit,
            wikidata,
            openLibrary,
            archive,
            nasa,
            history,
            animals,
            cia,
            pubmed
        ] = await Promise.all([
            fetchWiki(query).catch(() => ""),
            fetchReddit(query).catch(() => ""),
            fetchWikidata(query).catch(() => ""),
            fetchOpenLibrary(query).catch(() => ""),
            fetchArchive(query).catch(() => ""),
            fetchNASA(query).catch(() => ""),
            fetchHistoryEvents(query).catch(() => ""),
            fetchAnimalFacts(query).catch(() => ""),
            fetchCIA(query).catch(() => ""),
            fetchPubMed(query).catch(() => "")
        ]);

        const context = `
Wiki: ${wiki}
Wikidata: ${wikidata}
OpenLibrary: ${openLibrary}
Archive: ${archive}
NASA: ${nasa}
History: ${history}
Animals: ${animals}
CIA: ${cia}
PubMed: ${pubmed}
Reddit: ${reddit}
        `;

        const data = await processWithAI(query, context, imageFile);
        renderMap(query, data);
        await saveSearch(query); 
        await renderRecentSearches(); 
    } catch (err) {
        console.error("Critical Error:", err);
        centerBubble.innerText = "Error!";
        renderMap(query, getFallbackData(query));
    }
}
async function processWithAI(query, context, imageFile = null) {
    const baseUrl = "https://generativelanguage.googleapis.com/v1/models";
    const MODELS = [
        "gemini-2.5-flash", "gemini-3-flash", "gemini-2.5-flash-lite",
        "gemma-2-9b-it", "gemma-2-27b-it", "gemma-3-4b-it",
        "gemma-3-12b-it", "gemma-3-27b-it"
    ];

    const prompt = `Topic: ${query}.
Context: ${context}.

Task:
Find AT LEAST 6 obscure, niche, or historically overlooked facts based on the context. 
Categorize them into distinct thematic bubbles (e.g., Law, Medicine, Scientific Anomalies).

Rules for URLs (CRITICAL):
1. Each fact MUST have a "url" field.
2. If the context contains a specific link, use it.
3. If not, construct a search link:
   - Wikipedia: https://en.wikipedia.org/wiki/[Title]
   - CIA: https://www.cia.gov/readingroom/search/site/[Topic]
   - PubMed: https://pubmed.ncbi.nlm.nih.gov/?term=[Topic]
   - Reddit: https://www.reddit.com/search/?q=[Topic]
   - OpenLibrary/Archive: Search link using the book title.
4. If you are absolutely unsure of the direct link, you MUST use: https://www.google.com/search?q=[Specific+Fact+Keywords+And+Source]
5. DO NOT use placeholders like "The URL" or "#".

Output Format (JSON Only):
{
  "categories": [
    {
      "title": "Category Name",
      "facts": [
        { 
          "text": "The obscure fact...", 
          "source": "Source Name", 
          "url": "COMPLETE_URL_HERE" 
        }
      ]
    }
  ],
  "didYouKnow": "<strong>Did you know?</strong> [Fact here]"
}`;

    let imageBase64 = null;
    if (imageFile) {
        const rawBase64 = await fileToBase64(imageFile);
        imageBase64 = rawBase64.split(",")[1];
    }

    for (const model of MODELS) {
        try {
            console.log(`📡 Rapid-Fire: Trying ${model}...`);
            
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 6000); 

            const response = await fetch(`${baseUrl}/${model}:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            ...(imageBase64 ? [{ inline_data: { mime_type: imageFile.type, data: imageBase64 } }] : [])
                        ]
                    }]
                }),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Success with ${model}`);
                return cleanAndParse(result);
            }

            console.warn(`⚠️ ${model} unavailable (Status ${response.status}).`);

        } catch (err) {
            console.error(`❌ ${model} skipped or timed out.`);
            continue; 
        }
    }

    throw new Error("All archives are currently busy.");
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

function cleanAndParse(result) {
    try {
        const text = result.candidates[0].content.parts[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found");
        return JSON.parse(jsonMatch[0]);
    } catch (e) {
        console.error("Parsing Error:", e);
        throw new Error("Invalid AI Response");
    }
}

async function fetchWiki(q) {
    try {
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
        if (!res.ok) return "";
        const d = await res.json();
        return d.extract || "";
    } catch {
        return "";
    }
}

async function fetchReddit(q) {
    try {
        const res = await fetch(`https://www.reddit.com/r/todayilearned/search.json?q=${encodeURIComponent(q)}&restrict_sr=on&limit=3`);
        const d = await res.json();
        return d.data.children.map(p => p.data.title).join(" ");
    } catch {
        return "";
    }
}

async function fetchWikidata(q) {
    try {
        const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(q)}&language=en&format=json&origin=*`;
        const res = await fetch(searchUrl);
        const data = await res.json();

        if (!data.search.length) return "";

        const entityId = data.search[0].id;

        const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`;
        const entityRes = await fetch(entityUrl);
        const entityData = await entityRes.json();

        return JSON.stringify(entityData.entities[entityId].claims).substring(0, 3000);
    } catch {
        return "";
    }
}

async function fetchOpenLibrary(q) {
    try {
        const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=5`);
        const data = await res.json();

        if (!data.docs) return "";

        return data.docs
            .map(book => `${book.title} (${book.first_publish_year || "Unknown year"})`)
            .join(" ");
    } catch {
        return "";
    }
}

async function fetchArchive(q) {
    try {
        const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&output=json&rows=5`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.response || !data.response.docs) return "";

        return data.response.docs
            .map(doc => doc.title)
            .join(" ");
    } catch {
        return "";
    }
}

async function fetchNASA(q) {
    try {
        const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY`);
        const data = await res.json();
        return `${data.title}: ${data.explanation.substring(0, 800)}`;
    } catch {
        return "";
    }
}

async function fetchHistoryEvents(q) {
    try {
        const res = await fetch(`https://history.muffinlabs.com/date`);
        const data = await res.json();
        return data.data.Events
            .filter(e => e.text.toLowerCase().includes(q.toLowerCase()))
            .map(e => `${e.year}: ${e.text}`)
            .join(" ");
    } catch {
        return "";
    }
}

async function fetchAnimalFacts(q) {
    try {
        const wiki = await fetchWikiFull(`${q} animal laws`);
        return wiki;
    } catch {
        return "";
    }
}

async function fetchCIA(q) {
    try {
        const res = await fetch(`https://www.cia.gov/readingroom/search/site/${encodeURIComponent(q)}?output=json`);
        const data = await res.json();
        return data.results?.map(d => d.title).join(" ") || "";
    } catch {
        return "";
    }
}

async function fetchPubMed(q) {
    try {
        const res = await fetch(`https://api.ncbi.nlm.nih.gov/lit/ctxp/v1/pubmed/?format=citation&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        return data?.records?.map(r => r.title).join(" ") || "";
    } catch {
        return "";
    }
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
        return `<img src="https://nekoweb.org/api/files/get?pathname=%2Fmedia%2Fopenlibrary.png&site=kaplumbagadeden" width="18" style="border-radius: 50%;">`;
    if (s.includes("archive"))
        return `<img src="https://cdn.simpleicons.org/internetarchive/00ADEF" width="16">`;
    if (s.includes("nasa"))
        return `<img src="https://cdn.simpleicons.org/nasa/FC3D21" width="16">`;
    if (s.includes("history"))
        return `<img src="https://cdn.simpleicons.org/historydotcom/ED1C24" width="16">`;
    if (s.includes("animal"))
        return `<img src="https://cdn.simpleicons.org/paw/FF9900" width="16">`;
    if (s.includes("cia"))
        return `<img src="https://nekoweb.org/api/files/get?pathname=%2Fmedia%2Fcia.png&site=kaplumbagadeden"  width="18" style="border-radius: 50%;">`;
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

const darkToggle = document.getElementById('dark-toggle');

if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    darkToggle.innerText = 'Light Mode';
}

darkToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    
    if (document.body.classList.contains('dark-mode')) {
        darkToggle.innerText = 'Light Mode';
        localStorage.setItem('theme', 'dark'); 
    } else {
        darkToggle.innerText = 'Dark Mode';
        localStorage.setItem('theme', 'light'); 
    }

});
