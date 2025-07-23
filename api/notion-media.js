// API endpoint for Brandon Dicks Media Portfolio
// File: api/notion-media.js

const { Client } = require('@notionhq/client');

// Initialize Notion client
const notion = new Client({
    auth: process.env.NOTION_API_KEY, // Use same variable as main server
});

const DATABASE_ID = process.env.NOTION_MEDIA_DATABASE_ID || process.env.NOTION_DATABASE_ID; // Use media DB first, fallback to main DB

// Main API handler
async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST' && req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        // Check if compositions should be included
        const includeCompositions = req.query.includeCompositions === 'true' || req.body?.includeCompositions;
        
        // Query the Notion database
        const response = await notion.databases.query({
            database_id: DATABASE_ID,
            sorts: [
                {
                    property: 'Created',
                    direction: 'descending'
                }
            ]
        });

        // Transform the data for frontend consumption
        let mediaItems = response.results.map(transformNotionPage);
        
        // Optionally include related compositions
        if (includeCompositions) {
            console.log('🔗 Including composition relations...');
            mediaItems = await Promise.all(
                mediaItems.map(async (item) => {
                    const relatedCompositions = await queryRelatedCompositions(item.id);
                    return {
                        ...item,
                        relatedCompositions: relatedCompositions,
                        compositionCount: relatedCompositions.length
                    };
                })
            );
        }

        res.status(200).json({
            success: true,
            count: mediaItems.length,
            results: mediaItems,
            includesCompositions: includeCompositions
        });

    } catch (error) {
        console.error('Notion API Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch media content'
        });
    }
}

// Helper function to query related compositions for a media item
async function queryRelatedCompositions(mediaId) {
    try {
        console.log(`🔍 Querying related compositions for media: ${mediaId}`);
        
        // First get the media item to see its composition relations
        const mediaPage = await notion.pages.retrieve({ page_id: mediaId });
        const compositionRelations = mediaPage.properties['Composition Relations']?.relation || [];
        
        if (compositionRelations.length === 0) {
            return [];
        }
        
        // Query each related composition from the main compositions database
        const compositionPromises = compositionRelations.map(relation => 
            notion.pages.retrieve({ page_id: relation.id })
        );
        
        const compositions = await Promise.all(compositionPromises);
        return compositions.map(transformCompositionPage);
    } catch (error) {
        console.error('Error querying related compositions:', error);
        return [];
    }
}

// Transform composition page data
function transformCompositionPage(page) {
    const props = page.properties;
    
    return {
        id: page.id,
        title: getTextFromRichText(props.Name?.title) || getTextFromRichText(props.Title?.title) || 'Untitled',
        slug: getTextFromRichText(props.Slug?.rich_text) || '',
        instrumentation: getTextFromRichText(props.Instrumentation?.rich_text) || 'Unknown',
        year: props.Year?.number || null,
        duration: getTextFromRichText(props.Duration?.rich_text) || '',
        difficulty: props.Difficulty?.select?.name || '',
        genre: props.Genre?.select?.name || '',
        tags: props.Tags?.multi_select?.map(tag => tag.name) || [],
        popular: props.Popular?.checkbox || false,
        price: props.Price?.number || null
    };
}

// Transform Notion page data to frontend format
function transformNotionPage(page) {
    const props = page.properties;

    return {
        id: page.id,
        title: getTextFromRichText(props.Title?.title) || 'Untitled',
        description: getTextFromRichText(props.Description?.rich_text) || '',
        category: props.Category?.select?.name || 'performance',
        thumbnail: getThumbnailUrl(props.Thumbnail),
        videoUrl: props.VideoURL?.url || null,
        audioUrl: props.AudioURL?.url || null,
        duration: getTextFromRichText(props.Duration?.rich_text) || null,
        featured: props.Featured?.checkbox || false,
        tags: props.Tags?.multi_select?.map(tag => tag.name) || [],
        instrument: props.Instrument?.select?.name || null,
        venue: getTextFromRichText(props.Venue?.rich_text) || null,
        year: props.Year?.number || null,
        difficulty: props.Difficulty?.select?.name || null,
        status: props.Status?.select?.name || 'published',
        
        // Enhanced relational data
        type: props.Type?.select?.name || 'Unknown',
        url: props.URL?.url || props.VideoURL?.url || props.AudioURL?.url || '',
        performanceBy: getTextFromRichText(props['Performance By']?.rich_text) || '',
        recordingDate: props['Recording Date']?.date?.start || '',
        quality: props.Quality?.select?.name || 'Standard',
        compositionRelations: props['Composition Relations']?.relation?.map(rel => rel.id) || [],
        
        created: page.created_time,
        lastEdited: page.last_edited_time
    };
}

// Helper function to extract text from Notion rich text
function getTextFromRichText(richText) {
    if (!richText || !Array.isArray(richText)) return '';
    return richText.map(text => text.plain_text).join('');
}

// Helper function to get thumbnail URL
function getThumbnailUrl(thumbnailProperty) {
    if (!thumbnailProperty) return null;
    
    if (thumbnailProperty.type === 'file') {
        return thumbnailProperty.file?.url || null;
    } else if (thumbnailProperty.type === 'external') {
        return thumbnailProperty.external?.url || null;
    } else if (thumbnailProperty.type === 'url') {
        return thumbnailProperty.url || null;
    }
    
    return null;
}

module.exports = handler;

// For local testing
if (require.main === module) {
    const express = require('express');
    const app = express();
    
    app.use(express.json());
    app.post('/api/notion-media', handler);
    app.get('/api/notion-media', handler);
    
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`🚀 Notion Media API running on port ${PORT}`);
        console.log(`📊 Database ID: ${DATABASE_ID ? 'Configured' : 'Missing'}`);
        console.log(`🔑 Token: ${process.env.NOTION_TOKEN ? 'Configured' : 'Missing'}`);
    });
} 