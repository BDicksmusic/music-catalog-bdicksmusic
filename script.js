const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const { Client } = require('@notionhq/client');
require('dotenv').config();

// Initialize Notion client
const notion = new Client({
    auth: process.env.NOTION_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ===== NOTION API ROUTES =====

// GET all compositions from Notion
app.get('/api/compositions', async (req, res) => {
    try {
        const response = await notion.databases.query({
            database_id: process.env.NOTION_DATABASE_ID,
            sorts: [
                {
                    property: 'Year',
                    direction: 'descending'
                }
            ]
        });
        
        // Transform Notion data to clean format
        const compositions = response.results.map(page => {
            const properties = page.properties;
            
            return {
                id: page.id,
                title: properties.Name?.title[0]?.text?.content || 
                       properties.Title?.title[0]?.text?.content || 
                       'Untitled',
                instrumentation: properties.Instrumentation?.rich_text[0]?.text?.content || 
                                properties.Instruments?.rich_text[0]?.text?.content || 
                                'Unknown',
                year: properties.Year?.number || null,
                duration: properties.Duration?.rich_text[0]?.text?.content || '',
                difficulty: properties.Difficulty?.select?.name || '',
                genre: properties.Genre?.select?.name || '',
                description: properties.Description?.rich_text[0]?.text?.content || '',
                audioLink: properties['Audio Link']?.url || '',
                scoreLink: properties['Score PDF']?.url || '',
                purchaseLink: properties['Purchase Link']?.url || '',
                paymentLink: properties['Payment Link']?.url || properties['Stripe Link']?.url || '',
                coverImage: properties['Cover Image']?.files[0]?.file?.url || properties['Cover Image']?.files[0]?.external?.url || '',
                tags: properties.Tags?.multi_select?.map(tag => tag.name) || [],
                programNotes: properties['Program Notes']?.rich_text?.map(rt => rt.plain_text || rt.text?.content || '').join('') || '',
                performanceNotes: properties['Performance Notes']?.rich_text?.map(rt => rt.plain_text || rt.text?.content || '').join('') || '',
                created: page.created_time,
                lastEdited: page.last_edited_time
            };
        });
        
        res.json({ 
            success: true,
            count: compositions.length,
            compositions: compositions 
        });
        
    } catch (error) {
        console.error('Error fetching compositions:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch compositions',
            message: error.message 
        });
    }
});

// GET single composition by ID
app.get('/api/compositions/:id', async (req, res) => {
    try {
        const response = await notion.pages.retrieve({
            page_id: req.params.id,
        });
        const properties = response.properties;
        const composition = {
            id: response.id,
            title: properties.Name?.title[0]?.text?.content || 
                   properties.Title?.title[0]?.text?.content || 
                   'Untitled',
            instrumentation: properties.Instrumentation?.rich_text[0]?.text?.content || 
                            properties.Instruments?.rich_text[0]?.text?.content || 
                            'Unknown',
            year: properties.Year?.number || null,
            duration: properties.Duration?.rich_text[0]?.text?.content || '',
            difficulty: properties.Difficulty?.select?.name || '',
            genre: properties.Genre?.select?.name || '',
            description: properties.Description?.rich_text[0]?.text?.content || '',
            audioLink: properties['Audio Link']?.url || '',
            scoreLink: properties['Score PDF']?.url || '',
            purchaseLink: properties['Purchase Link']?.url || '',
            tags: properties.Tags?.multi_select?.map(tag => tag.name) || [],
            created: response.created_time,
            lastEdited: response.last_edited_time,
            programNotes: properties['Program Notes']?.rich_text?.map(rt => rt.plain_text || rt.text?.content || '').join('') || '',
            performanceNotes: properties['Performance Notes']?.rich_text?.map(rt => rt.plain_text || rt.text?.content || '').join('') || ''
        };
        res.json({ success: true, composition });
    } catch (error) {
        console.error('Error fetching composition:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch composition' 
        });
    }
});

// Add this route after your existing /api/compositions/:id route

app.get('/api/compositions/slug/:slug', async (req, res) => {
    try {
        const response = await notion.databases.query({
            database_id: process.env.NOTION_DATABASE_ID,
            filter: {
                property: 'Slug',
                rich_text: {
                    equals: req.params.slug
                }
            }
        });

        if (response.results.length === 0) {
            return res.json({ success: false, error: 'Not found' });
        }

        const page = response.results[0];
        const properties = page.properties;
        const composition = {
            id: page.id,
            slug: properties.Slug?.rich_text[0]?.plain_text || '',
            title: properties.Name?.title[0]?.text?.content || 'Untitled',
            instrumentation: properties.Instrumentation?.rich_text[0]?.text?.content || 'Unknown',
            year: properties.Year?.number || null,
            duration: properties.Duration?.rich_text[0]?.text?.content || '',
            difficulty: properties.Difficulty?.select?.name || '',
            genre: properties.Genre?.select?.name || '',
            description: properties.Description?.rich_text[0]?.text?.content || '',
            audioLink: properties['Audio Link']?.url || '',
            scoreLink: properties['Score PDF']?.url || '',
            purchaseLink: properties['Purchase Link']?.url || '',
            coverImage: properties['Cover Image']?.files[0]?.file?.url || properties['Cover Image']?.files[0]?.external?.url || '',
            tags: properties.Tags?.multi_select?.map(tag => tag.name) || [],
            created: page.created_time,
            lastEdited: page.last_edited_time,
            programNotes: properties['Program Notes']?.rich_text?.map(rt => rt.plain_text || rt.text?.content || '').join('') || '',
            performanceNotes: properties['Performance Notes']?.rich_text?.map(rt => rt.plain_text || rt.text?.content || '').join('') || ''
        };

        res.json({ success: true, composition });
    } catch (error) {
        console.error('Error fetching composition by slug:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch composition by slug' });
    }
});

// POST new composition to Notion
app.post('/api/compositions', async (req, res) => {
    try {
        const { title, instrumentation, year, duration, difficulty, genre, description, audioLink, scoreLink, purchaseLink, tags } = req.body;
        
        // Prepare properties for Notion
        const properties = {
            Name: {
                title: [{ text: { content: title || 'Untitled' } }]
            },
            Instrumentation: {
                rich_text: [{ text: { content: instrumentation || '' } }]
            }
        };
        
        // Add optional properties if they exist
        if (year) properties.Year = { number: parseInt(year) };
        if (duration) properties.Duration = { rich_text: [{ text: { content: duration } }] };
        if (difficulty) properties.Difficulty = { select: { name: difficulty } };
        if (genre) properties.Genre = { select: { name: genre } };
        if (description) properties.Description = { rich_text: [{ text: { content: description } }] };
        if (audioLink) properties['Audio Link'] = { url: audioLink };
        if (scoreLink) properties['Score PDF'] = { url: scoreLink };
        if (purchaseLink) properties['Purchase Link'] = { url: purchaseLink };
        if (tags && Array.isArray(tags)) {
            properties.Tags = { multi_select: tags.map(tag => ({ name: tag })) };
        }
        
        const response = await notion.pages.create({
            parent: { database_id: process.env.NOTION_DATABASE_ID },
            properties: properties
        });
        
        res.json({ 
            success: true, 
            pageId: response.id,
            message: 'Composition added successfully!'
        });
        
    } catch (error) {
        console.error('Error creating composition:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to create composition',
            message: error.message 
        });
    }
});

// GET compositions filtered by genre
app.get('/api/compositions/genre/:genre', async (req, res) => {
    try {
        const response = await notion.databases.query({
            database_id: process.env.NOTION_DATABASE_ID,
            filter: {
                property: 'Genre',
                select: {
                    equals: req.params.genre
                }
            }
        });
        
        const compositions = response.results.map(page => {
            const properties = page.properties;
            return {
                id: page.id,
                title: properties.Name?.title[0]?.text?.content || 
                       properties.Title?.title[0]?.text?.content || 
                       'Untitled',
                instrumentation: properties.Instrumentation?.rich_text[0]?.text?.content || 
                                properties.Instruments?.rich_text[0]?.text?.content || 
                                'Unknown',
                year: properties.Year?.number || null,
                genre: properties.Genre?.select?.name || ''
            };
        });
        
        res.json({ success: true, compositions });
        
    } catch (error) {
        console.error('Error fetching compositions by genre:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch compositions' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Music Catalog API is running',
        timestamp: new Date().toISOString(),
        notion: process.env.NOTION_API_KEY ? 'Connected' : 'Not configured'
    });
});

// Serve main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Music Catalog Server running on port: ${PORT}`);
    console.log(`🔗 Notion integration: ${process.env.NOTION_API_KEY ? 'Connected' : 'Not configured'}`);
});
