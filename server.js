require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch'); 
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' })); 
app.use(express.static('public')); 

app.post('/api/callAI', async (req, res) => {
    try {
        const { query, context, image, mimeType } = req.body;
        const parts = [{ text: `${context || ""}\n\nUser Query: ${query}` }];
        
        if (image && mimeType) {
            parts.push({
                inline_data: {
                    mime_type: mimeType,
                    data: image 
                }
            });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts }]
            })
        });

        const data = await response.json();
        if (data.error) {
            console.error("Gemini API Error details:", data.error);
            return res.status(response.status).json(data);
        }

        res.json(data);

    } catch (error) {
        console.error("Internal Server Error:", error); 
        res.status(500).json({ error: "The Rabbit Hole is temporarily blocked." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Your Rabbit Hole is open at http://localhost:${PORT}`);
});
