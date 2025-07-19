const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Music Catalog API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.get('/api/compositions', (req, res) => {
    // Your compositions API logic here
    res.json({ 
        message: 'Music compositions API endpoint',
        compositions: []
    });
});

app.get('/api/songs', (req, res) => {
    // Your songs API logic here
    res.json({ 
        message: 'Songs API endpoint',
        songs: []
    });
});

// Serve your main HTML file for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle all other routes by serving index.html (for single-page apps)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Use Railway's PORT environment variable
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('🎵 Music Catalog Server Started!');
    console.log(`📍 Running on port: ${PORT}`);
    console.log('🚀 Deployed on Railway!');
});