const fetch = require('node-fetch');

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    const { query, context, image, mimeType } = JSON.parse(event.body);
    const API_KEY = process.env.GEMINI_API_KEY;
    
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


    for (const model of MODELS) {
        try {
            console.log(`📡 Rapid-Fire: Trying ${model}...`);
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

            const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${API_KEY}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            ...(image ? [{ inline_data: { mime_type: mimeType, data: image } }] : [])
                        ]
                    }]
                }),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (response.ok) {
                const result = await response.json();
                const text = result.candidates[0].content.parts[0].text;
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                const cleanedData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
                
                console.log(`✅ Success with ${model}`);
                
                return {
                    statusCode: 200,
                    body: JSON.stringify(cleanedData)
                };
            }
            console.warn(`⚠️ ${model} unavailable (Status ${response.status}).`);
        } catch (err) {
            console.error(`❌ ${model} skipped or timed out.`);
        }
    } 

    return {
        statusCode: 500,
        body: JSON.stringify({ error: "All archives are currently busy." })
    };
};