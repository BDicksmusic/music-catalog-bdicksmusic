const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Basic route to serve your main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check route (useful for Railway)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Music catalog server is running!',
        timestamp: new Date().toISOString()
    });
});

// API Routes (you can expand these later)
app.get('/api/test', (req, res) => {
    res.json({
        message: 'API is working!',
        data: {
            compositions: [
                {
                    id: 1,
                    title: "Epic Journey",
                    genre: "Cinematic",
                    price: 49
                },
                {
                    id: 2,
                    title: "Peaceful Dawn", 
                    genre: "Ambient",
                    price: 35
                }
            ]
        }
    });
});

// Notion API route (add this when you're ready for Notion integration)
app.get('/api/compositions', async (req, res) => {
    try {
        // For now, return sample data
        // Later, this will connect to Notion
        const sampleCompositions = [
            {
                id: "1",
                title: "Epic Journey",
                genre: "Cinematic",
                bpm: 120,
                duration: "3:24",
                price: 49,
                description: "Soaring orchestral piece perfect for adventure scenes and triumphant moments.",
                tags: ["Cinematic", "Orchestra", "Adventure"],
                status: "Available"
            },
            {
                id: "2", 
                title: "Peaceful Dawn",
                genre: "Ambient",
                bpm: 85,
                duration: "4:12", 
                price: 35,
                description: "Gentle, contemplative piece ideal for meditation content and peaceful scenes.",
                tags: ["Ambient", "Piano", "Peaceful"],
                status: "Available"
            },
            {
                id: "3",
                title: "City Pulse",
                genre: "Electronic",
                bpm: 128,
                duration: "2:58",
                price: 42,
                description: "Energetic electronic track perfect for modern corporate videos and tech presentations.",
                tags: ["Electronic", "Corporate", "Modern"],
                status: "Available"
            }
        ];

        res.json({
            success: true,
            count: sampleCompositions.length,
            data: sampleCompositions
        });

    } catch (error) {
        console.error('Error fetching compositions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch compositions'
        });
    }
});

// Catch-all handler for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
    });
});

// Start the server
app.listen(port, () => {
    console.log(`🎵 Music Catalog Server Started!`);
    console.log(`📍 Running on port: ${port}`);
    console.log(`🌐 Access your site at: http://localhost:${port}`);
    console.log(`🔗 API health check: http://localhost:${port}/health`);
    console.log(`📝 Sample API: http://localhost:${port}/api/compositions`);
    
    if (process.env.RAILWAY_ENVIRONMENT) {
        console.log(`🚀 Deployed on Railway!`);
    }
});