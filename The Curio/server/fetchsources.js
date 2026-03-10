const fetch = require('node-fetch');

exports.handler = async (event) => {
    const query = event.queryStringParameters.q || "";

    // --- INTERNAL FETCHERS ---
    
    const fetchWiki = async (q) => {
        try {
            const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
            const d = await res.json();
            return d.extract || "";
        } catch { return ""; }
    };

    const fetchReddit = async (q) => {
        try {
            const res = await fetch(`https://www.reddit.com/r/todayilearned/search.json?q=${encodeURIComponent(q)}&restrict_sr=on&limit=3`);
            const d = await res.json();
            return d.data.children.map(p => p.data.title).join(" ");
        } catch { return ""; }
    };

    const fetchWikidata = async (q) => {
        try {
            const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(q)}&language=en&format=json&origin=*`;
            const res = await fetch(searchUrl);
            const data = await res.json();
            if (!data.search.length) return "";
            const entityId = data.search[0].id;
            const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`;
            const entityRes = await fetch(entityUrl);
            const entityData = await entityRes.json();
            return JSON.stringify(entityData.entities[entityId].claims).substring(0, 2000);
        } catch { return ""; }
    };

    const fetchOpenLibrary = async (q) => {
        try {
            const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=5`);
            const data = await res.json();
            return data.docs ? data.docs.map(book => `${book.title} (${book.first_publish_year || "Unknown"})`).join(" ") : "";
        } catch { return ""; }
    };

    const fetchArchive = async (q) => {
        try {
            const res = await fetch(`https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&output=json&rows=5`);
            const data = await res.json();
            return data.response.docs ? data.response.docs.map(doc => doc.title).join(" ") : "";
        } catch { return ""; }
    };

    const fetchNASA = async () => {
        try {
            const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY`);
            const data = await res.json();
            return `${data.title}: ${data.explanation.substring(0, 500)}`;
        } catch { return ""; }
    };

    const fetchHistoryEvents = async (q) => {
        try {
            const res = await fetch(`https://history.muffinlabs.com/date`);
            const data = await res.json();
            return data.data.Events
                .filter(e => e.text.toLowerCase().includes(q.toLowerCase()))
                .map(e => `${e.year}: ${e.text}`)
                .join(" ");
        } catch { return ""; }
    };

    const fetchCIA = async (q) => {
        try {
            const res = await fetch(`https://www.cia.gov/readingroom/search/site/${encodeURIComponent(q)}`);
            const text = await res.text(); 
            return text.substring(0, 1000); 
        } catch { return ""; }
    };

    const fetchPubMed = async (q) => {
        try {
            const res = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(q)}&retmode=json`);
            const data = await res.json();
            return `PubMed IDs: ${data.esearchresult.idlist.join(", ")}`;
        } catch { return ""; }
    };

    try {
        const [wiki, reddit, wikidata, openLib, archive, nasa, history, cia, pubmed] = await Promise.all([
            fetchWiki(query),
            fetchReddit(query),
            fetchWikidata(query),
            fetchOpenLibrary(query),
            fetchArchive(query),
            fetchNASA(),
            fetchHistoryEvents(query),
            fetchCIA(query),
            fetchPubMed(query)
        ]);

        const fullContext = `
            Wiki: ${wiki}
            Wikidata: ${wikidata}
            OpenLibrary: ${openLib}
            Archive: ${archive}
            NASA: ${nasa}
            History: ${history}
            CIA: ${cia}
            PubMed: ${pubmed}
            Reddit: ${reddit}
        `;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ context: fullContext })
        };

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to aggregate sources", details: err.message })
        };
    }
};