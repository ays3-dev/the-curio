require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public')); 

app.post('/api/callAI', async (req, res) => {
    try {
        const { query, context, image, mimeType } = req.body;
        
    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Your Rabbit Hole is open at http://localhost:${PORT}`);
});