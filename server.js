const express = require('express');
const path = require('path');
const app = express();

// Middleware to parse JSON (if you have API endpoints)
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Example API route (you can add your music catalog API here)
app.get('/api/songs', (req, res) => {
    // Your API logic here
    res.json({ message: 'Music catalog API endpoint' });
});

// Serve your main HTML file for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle all other routes by serving index.html (for single-page apps)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Use this:
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
