const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const { Client } = require('@notionhq/client');
require('dotenv').config();

// Import cache utilities
const { 
  CACHE_KEYS, 
  CACHE_DURATIONS, 
  withCache, 
  clearCompositionCaches, 
  getCacheStats,
  deleteFromCache
} = require('./lib/cache');

// Import the media API handler
const mediaApiHandler = require('./api/notion-media');

// Install stripe: npm install stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// Initialize Notion client
const notion = new Client({
    auth: process.env.NOTION_API_KEY,
});

// Middleware
// Middleware - IMPORTANT: Raw body parser for Stripe webhook MUST come before express.json()
app.use('/api/stripe-webhook', express.raw({type: 'application/json'}));
app.use(compression()); // Enable gzip compression for faster responses
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ===== HELPER FUNCTIONS =====

// Helper function to query related media for a composition
async function queryRelatedMedia(compositionId, mediaType = null) {
    try {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`🔍 Querying related media for composition: ${compositionId}`);
        }
        
            // Query the media database for items related to this composition
    // Check both audio and video relations
    let filter = {
        or: [
            {
                property: 'Audio to Comp',
                relation: {
                    contains: compositionId
                }
            },
            {
                property: 'Video to Comp', 
                relation: {
                    contains: compositionId
                }
            }
        ]
    };
        
        // Add media type filter if specified
        if (mediaType) {
            filter = {
                and: [
                    filter,
                    {
                        property: 'Type',
                        select: {
                            equals: mediaType
                        }
                    }
                ]
            };
        }
        
        const response = await notion.databases.query({
            database_id: process.env.NOTION_MEDIA_DATABASE_ID,
            filter: filter,
            page_size: 10, // Limit results to prevent large responses
            sorts: [
                {
                    property: 'Type',
                    direction: 'ascending'
                }
            ]
        });
        
        return response.results.map(transformMediaPage);
    } catch (error) {
        console.error('Error querying related media:', error);
        return [];
    }
}

// Helper function to query related compositions for a media item
async function queryRelatedCompositions(mediaId) {
    try {
        console.log(`🔍 Querying related compositions for media: ${mediaId}`);
        
            // First get the media item to see its composition relations
    const mediaPage = await notion.pages.retrieve({ page_id: mediaId });
    const audioRelations = mediaPage.properties['Audio to Comp']?.relation || [];
    const videoRelations = mediaPage.properties['Video to Comp']?.relation || [];
    const compositionRelations = [...audioRelations, ...videoRelations];
        
        if (compositionRelations.length === 0) {
            return [];
        }
        
        // Query each related composition
        const compositionPromises = compositionRelations.map(relation => 
            notion.pages.retrieve({ page_id: relation.id })
        );
        
        const compositions = await Promise.all(compositionPromises);
        return compositions.map(transformNotionPage);
    } catch (error) {
        console.error('Error querying related compositions:', error);
        return [];
    }
}

// Transform media page from Notion to clean format
function transformMediaPage(page) {
    const properties = page.properties;
    
    // Get URL - handle both uploaded files and URL properties
    let mediaUrl = '';
    
    // Try URL properties first
    if (properties.URL?.url) {
        mediaUrl = properties.URL.url;
    } else if (properties.VideoURL?.url) {
        mediaUrl = properties.VideoURL.url;
    } else if (properties.AudioURL?.url) {
        mediaUrl = properties.AudioURL.url;
    }
    // Try uploaded files (for direct audio file uploads)
    else if (properties['Audio File']?.files?.[0]) {
        mediaUrl = properties['Audio File'].files[0].file?.url || properties['Audio File'].files[0].external?.url || '';
    } else if (properties['Video File']?.files?.[0]) {
        mediaUrl = properties['Video File'].files[0].file?.url || properties['Video File'].files[0].external?.url || '';
    }
    // Fallback to any file property
    else {
        const fileProps = ['Media File', 'File', 'Upload'];
        for (const prop of fileProps) {
            if (properties[prop]?.files?.[0]) {
                mediaUrl = properties[prop].files[0].file?.url || properties[prop].files[0].external?.url || '';
                break;
            }
        }
    }
    
    // Only log in development mode to reduce processing time
    if (process.env.NODE_ENV !== 'production') {
        console.log(`🔍 Media: "${getTextContent(properties.Name)}" -> URL: ${mediaUrl}`);
    }
    
    return {
        id: page.id,
        title: getTextContent(properties.Name) || getTextContent(properties.Title) || 'Untitled Media',
        type: properties.Type?.select?.name || 'Unknown',
        category: properties.Category?.select?.name || 'performance',
        url: mediaUrl,
        thumbnail: getFileUrl(properties.Thumbnail),
        duration: getTextContent(properties.Duration) || '',
        performanceBy: getTextContent(properties['Performance By']) || '',
        recordingDate: properties['Recording Date']?.date?.start || '',
        venue: getTextContent(properties.Venue) || '',
        year: properties.Year?.number || null,
        description: notionRichTextToHtml(properties.Description?.rich_text) || '',
        featured: properties.Featured?.checkbox || false,
        tags: properties.Tags?.multi_select?.map(tag => tag.name) || [],
        quality: properties.Quality?.select?.name || 'Standard',
        instrument: properties.Instrument?.select?.name || '',
        difficulty: properties.Difficulty?.select?.name || '',
        status: properties.Status?.select?.name || 'published',
        
        // Movement-related properties
        movementTitle: getTextContent(properties['Movement Title']) || '',
        numberOfMovements: properties['Number of Movements']?.number || null,
        compositionRelations: [
            ...(properties['Audio to Comp']?.relation?.map(rel => rel.id) || []),
            ...(properties['Video to Comp']?.relation?.map(rel => rel.id) || [])
        ],
        created: page.created_time,
        lastEdited: page.last_edited_time
    };
}

// Enhanced transform function for compositions with media rollup
const transformNotionPageWithMedia = async (page, includeMedia = true) => {
    const baseComposition = transformNotionPage(page);
    
    if (!includeMedia) {
        return baseComposition;
    }
    
    try {
        // Query all related media with timeout and error handling
        const allMedia = await Promise.race([
            queryRelatedMedia(page.id),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Media query timeout')), 2500)
            )
        ]).catch(error => {
            console.warn(`⚠️ Media query failed for ${page.id}:`, error.message);
            return []; // Return empty array on error, don't break the page
        });
        
        // Separate by type
        const audioMedia = allMedia.filter(media => media.type === 'Audio');
        const videoMedia = allMedia.filter(media => media.type === 'Video');
        const scoreMedia = allMedia.filter(media => media.type === 'Score');
        
        // Roll up media data
        return {
            ...baseComposition,
            // Enhanced media arrays
            audioFiles: audioMedia,
            videoFiles: videoMedia,
            scoreFiles: scoreMedia,
            allMedia: allMedia,
            
            // Keep original single links for backward compatibility
            audioLink: audioMedia.length > 0 ? audioMedia[0].url : baseComposition.audioLink,
            scoreLink: scoreMedia.length > 0 ? scoreMedia[0].url : baseComposition.scoreLink,
            
            // Enhanced metadata from first audio file (for backward compatibility)
            performanceBy: audioMedia.length > 0 ? audioMedia[0].performanceBy : '',
            recordingDate: audioMedia.length > 0 ? audioMedia[0].recordingDate : '',
            audioDescription: audioMedia.length > 0 ? audioMedia[0].description : '',
            venue: audioMedia.length > 0 ? audioMedia[0].venue : '',
            quality: audioMedia.length > 0 ? audioMedia[0].quality : '',
            
            // Media counts for UI
            mediaCount: {
                audio: audioMedia.length,
                video: videoMedia.length,
                score: scoreMedia.length,
                total: allMedia.length
            }
        };
    } catch (error) {
        console.error('Error rolling up media for composition:', error);
        return baseComposition; // Return base composition if media rollup fails
    }
};

function notionRichTextToHtml(richTextArr) {
    if (!Array.isArray(richTextArr)) return '';
    return richTextArr.map(rt => {
        let text = rt.text?.content || '';
        if (rt.annotations) {
            if (rt.annotations.bold) text = `<strong>${text}</strong>`;
            if (rt.annotations.italic) text = `<em>${text}</em>`;
            if (rt.annotations.underline) text = `<u>${text}</u>`;
            if (rt.annotations.strikethrough) text = `<s>${text}</s>`;
            if (rt.annotations.code) text = `<code>${text}</code>`;
        }
        if (rt.href) text = `<a href="${rt.href}">${text}</a>`;
        return text;
    }).join('');
}

// Helper function to safely get text content
const getTextContent = (field) => {
    try {
        if (field && field.title && field.title.length > 0) {
            return field.title[0]?.text?.content || '';
        }
        if (field && field.rich_text && field.rich_text.length > 0) {
            return field.rich_text[0]?.text?.content || '';
        }
        return '';
    } catch (error) {
        console.log('Error reading field:', error);
        return '';
    }
};

// Helper function to safely get file URL
const getFileUrl = (field) => {
    try {
        if (field && field.files && field.files.length > 0) {
            return field.files[0]?.file?.url || field.files[0]?.external?.url || '';
        }
        return '';
    } catch (error) {
        console.log('Error reading file field:', error);
        return '';
    }
};

// Transform Notion page to clean format
const transformNotionPage = (page) => {
    const properties = page.properties;
    
    return {
        id: page.id,
        title: getTextContent(properties.Name) || 
               getTextContent(properties.Title) || 
               'Untitled',
        instrumentation: getTextContent(properties.Instrumentation) || 
                        getTextContent(properties.Instruments) || 
                        'Unknown',
        year: properties.Year?.number || null,
        duration: getTextContent(properties.Duration) || '',
        difficulty: properties.Difficulty?.select?.name || '',
        genre: properties.Genre?.select?.name || '',
        description: notionRichTextToHtml(properties.Description?.rich_text),
        audioLink: getFileUrl(properties['Audio Link']),
        scoreLink: properties['Score PDF']?.url || getFileUrl(properties['Score PDF']),
        purchaseLink: properties['Purchase Link']?.url || '',
        paymentLink: properties['Payment Link']?.url || properties['Stripe Link']?.url || '',
        coverImage: getFileUrl(properties['Cover Image']),
        // Add Stripe integration fields
        stripeProductId: getTextContent(properties['Stripe Product ID']),
        stripePriceId: getTextContent(properties['Stripe Price ID']),
        price: properties.Price?.number || null,
        tags: properties.Tags?.multi_select?.map(tag => tag.name) || [],
        programNotes: notionRichTextToHtml(properties['Program Notes']?.rich_text),
        performanceNotes: notionRichTextToHtml(properties['Performance Notes']?.rich_text),
        created: page.created_time,
        lastEdited: page.last_edited_time,
        popular: properties.Popular?.checkbox || false,
        slug: properties.Slug?.rich_text[0]?.plain_text || '',
        shortInstrumentList: notionRichTextToHtml(properties['Short Instrument List']?.rich_text) || '',
    };
};

// ===== MEDIA PORTFOLIO API ROUTES =====

// GET media content from Notion (for media page)
app.get('/api/notion-media', mediaApiHandler);
app.post('/api/notion-media', mediaApiHandler);

// ===== ENHANCED MEDIA RELATIONS API =====

// GET all media with composition relations
app.get('/api/media-with-compositions', async (req, res) => {
    try {
        console.log('🔄 Fetching media with composition relations...');
        
        const response = await notion.databases.query({
            database_id: process.env.NOTION_MEDIA_DATABASE_ID
        });
        
        const mediaWithCompositions = await Promise.all(
            response.results.map(async (mediaPage) => {
                const mediaData = transformMediaPage(mediaPage);
                const relatedCompositions = await queryRelatedCompositions(mediaPage.id);
                
                return {
                    ...mediaData,
                    relatedCompositions: relatedCompositions
                };
            })
        );
        
        res.json({
            success: true,
            count: mediaWithCompositions.length,
            media: mediaWithCompositions,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error fetching media with compositions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch media with compositions'
        });
    }
});

// GET specific media item with its composition relations
app.get('/api/media/:id/compositions', async (req, res) => {
    try {
        const mediaId = req.params.id;
        console.log(`🔄 Fetching compositions for media ${mediaId}...`);
        
        const relatedCompositions = await queryRelatedCompositions(mediaId);
        
        res.json({
            success: true,
            mediaId: mediaId,
            compositions: relatedCompositions,
            count: relatedCompositions.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error fetching compositions for media:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch compositions for media'
        });
    }
});

// GET specific composition's media by type
app.get('/api/compositions/:id/media/:type?', async (req, res) => {
    try {
        const compositionId = req.params.id;
        const mediaType = req.params.type; // Optional: 'audio', 'video', 'score'
        
        console.log(`🔄 Fetching ${mediaType || 'all'} media for composition ${compositionId}...`);
        
        const relatedMedia = await queryRelatedMedia(compositionId, mediaType);
        
        res.json({
            success: true,
            compositionId: compositionId,
            mediaType: mediaType || 'all',
            media: relatedMedia,
            count: relatedMedia.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error fetching media for composition:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch media for composition'
        });
    }
});

// ===== CACHED NOTION API ROUTES =====

// GET all compositions from Notion (WITH CACHING)
app.get('/api/compositions', async (req, res) => {
    try {
        const fetchCompositions = async () => {
            console.log('🔄 Fetching fresh compositions from Notion...');
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
            const compositions = response.results.map(transformNotionPage);
            
            return { 
                success: true,
                count: compositions.length,
                compositions: compositions,
                cached: false,
                timestamp: new Date().toISOString()
            };
        };

        // Use cache wrapper
        const result = await withCache(
            CACHE_KEYS.allCompositions,
            CACHE_DURATIONS.allCompositions,
            fetchCompositions
        );

        // Add cache indicator
        result.cached = true;
        res.json(result);
        
    } catch (error) {
        console.error('Error fetching compositions:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch compositions',
            message: error.message 
        });
    }
});

// GET single composition by ID (WITH CACHING & MEDIA ROLLUP)
app.get('/api/compositions/:id', async (req, res) => {
    try {
        const compositionId = req.params.id;
        const includeMedia = req.query.includeMedia !== 'false'; // Default to true
        
        const fetchSingleComposition = async () => {
            console.log(`🔄 Fetching composition ${compositionId} from Notion with media rollup...`);
            const response = await notion.pages.retrieve({
                page_id: compositionId,
            });
            
            const compositionData = await transformNotionPageWithMedia(response, includeMedia);
            
            return { 
                success: true, 
                composition: compositionData,
                cached: false,
                timestamp: new Date().toISOString()
            };
        };

        // Use cache wrapper with media inclusion in cache key
        const cacheKey = includeMedia ? 
            CACHE_KEYS.compositionById(compositionId) + '_with_media' :
            CACHE_KEYS.compositionById(compositionId);
            
        const result = await withCache(
            cacheKey,
            CACHE_DURATIONS.singleComposition,
            fetchSingleComposition
        );

        result.cached = true;
        res.json(result);
        
    } catch (error) {
        console.error('Error fetching composition:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch composition' 
        });
    }
});

// GET compositions filtered by genre (WITH CACHING)
app.get('/api/compositions/genre/:genre', async (req, res) => {
    try {
        const genre = req.params.genre;
        
        const fetchCompositionsByGenre = async () => {
            console.log(`🔄 Fetching ${genre} compositions from Notion...`);
            const response = await notion.databases.query({
                database_id: process.env.NOTION_DATABASE_ID,
                filter: {
                    property: 'Genre',
                    select: {
                        equals: genre
                    }
                }
            });
            
            const compositions = response.results.map(page => {
                const pageProps = page.properties;
                return {
                    id: page.id,
                    title: getTextContent(pageProps.Name) || 
                           getTextContent(pageProps.Title) || 
                           'Untitled',
                    instrumentation: getTextContent(pageProps.Instrumentation) || 
                                    getTextContent(pageProps.Instruments) || 
                                    'Unknown',
                    year: pageProps.Year?.number || null,
                    genre: pageProps.Genre?.select?.name || ''
                };
            });
            
            return { 
                success: true, 
                compositions,
                cached: false,
                timestamp: new Date().toISOString()
            };
        };

        // Use cache wrapper
        const result = await withCache(
            CACHE_KEYS.compositionsByGenre(genre),
            CACHE_DURATIONS.genreCompositions,
            fetchCompositionsByGenre
        );

        result.cached = true;
        res.json(result);
        
    } catch (error) {
        console.error('Error fetching compositions by genre:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch compositions' });
    }
});

// GET single composition by slug (WITH CACHING & MEDIA ROLLUP)
app.get('/api/compositions/slug/:slug', async (req, res) => {
    try {
        const slug = req.params.slug;
        const includeMedia = req.query.includeMedia !== 'false'; // Default to true
        
        const fetchCompositionBySlug = async () => {
            console.log(`🔄 Fetching composition with slug "${slug}" with media rollup...`);
            const response = await notion.databases.query({
                database_id: process.env.NOTION_DATABASE_ID,
                filter: {
                    property: 'Slug',
                    rich_text: {
                        equals: slug
                    }
                }
            });

            if (response.results.length === 0) {
                return { success: false, error: 'Not found' };
            }

            const page = response.results[0];
            const composition = await transformNotionPageWithMedia(page, includeMedia);

            return { success: true, composition };
        };

        // Use cache wrapper with media inclusion in cache key
        const cacheKey = includeMedia ? 
            `composition_slug_${slug}_with_media` :
            `composition_slug_${slug}`;
            
        const result = await withCache(
            cacheKey,
            CACHE_DURATIONS.singleComposition,
            fetchCompositionBySlug
        );

        // Add browser caching headers for better performance
        res.set({
            'Cache-Control': 'public, max-age=300', // Cache for 5 minutes in browser
            'ETag': `"${slug}-${Date.now()}"`
        });

        res.json(result);

    } catch (error) {
        console.error('Error fetching composition by slug:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch composition by slug' });
    }
});

// POST new composition to Notion (INVALIDATES CACHE)
app.post('/api/compositions', async (req, res) => {
    try {
        const { title, instrumentation, year, duration, difficulty, genre, description, audioLink, scoreLink, purchaseLink, tags, Slug } = req.body;
        
        // Prepare properties for Notion
        const newPageProperties = {
            Name: {
                title: [{ text: { content: title || 'Untitled' } }]
            },
            Instrumentation: {
                rich_text: [{ text: { content: instrumentation || '' } }]
            }
        };
        
        // Add optional properties if they exist
        if (year) newPageProperties.Year = { number: parseInt(year) };
        if (duration) newPageProperties.Duration = { rich_text: [{ text: { content: duration } }] };
        if (difficulty) newPageProperties.Difficulty = { select: { name: difficulty } };
        if (genre) newPageProperties.Genre = { select: { name: genre } };
        if (description) newPageProperties.Description = { rich_text: [{ text: { content: description } }] };
        if (audioLink) newPageProperties['Audio Link'] = { url: audioLink };
        if (scoreLink) newPageProperties['Score PDF'] = { url: scoreLink };
        if (purchaseLink) newPageProperties['Purchase Link'] = { url: purchaseLink };
        if (Slug) newPageProperties.Slug = { rich_text: [{ text: { content: Slug } }] };
        if (tags && Array.isArray(tags)) {
            newPageProperties.Tags = { multi_select: tags.map(tag => ({ name: tag })) };
        }
        
        const response = await notion.pages.create({
            parent: { database_id: process.env.NOTION_DATABASE_ID },
            properties: newPageProperties
        });
        
        // Clear caches after creating new composition
        await clearCompositionCaches();
        console.log('🧹 Cleared composition caches after creation');
        
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

// ===== CACHE MANAGEMENT ROUTES =====

// GET cache statistics
app.get('/api/cache/stats', async (req, res) => {
    try {
        const stats = await getCacheStats();
        res.json({
            success: true,
            cache: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get cache stats'
        });
    }
});

// POST clear all composition caches
app.post('/api/cache/clear', async (req, res) => {
    try {
        await clearCompositionCaches();
        res.json({
            success: true,
            message: 'All composition caches cleared',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to clear caches'
        });
    }
});

// Health check (WITH CACHING)
app.get('/api/health', async (req, res) => {
    try {
        const fetchHealthData = async () => {
            const cacheStats = await getCacheStats();
            return { 
                status: 'OK', 
                message: 'Music Catalog API is running',
                timestamp: new Date().toISOString(),
                notion: process.env.NOTION_API_KEY ? 'Connected' : 'Not configured',
                stripe: process.env.STRIPE_SECRET_KEY ? 'Connected' : 'Not configured',
                redis: cacheStats.connected ? 'Connected' : 'Disconnected',
                cache: cacheStats
            };
        };

        const result = await withCache(
            CACHE_KEYS.health,
            CACHE_DURATIONS.health,
            fetchHealthData
        );

        res.json(result);
        
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            error: error.message
        });
    }
});

// ===== STRIPE ROUTES (UNCHANGED BUT WITH CACHE INVALIDATION) =====

// Create Stripe checkout session (with auto-product creation)
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { compositionId } = req.body;
        
        // Get composition details from Notion (check cache first)
        let compositionData;
        try {
            const cachedResult = await withCache(
                CACHE_KEYS.compositionById(compositionId),
                CACHE_DURATIONS.singleComposition,
                async () => {
                    const response = await notion.pages.retrieve({ page_id: compositionId });
                    return { composition: transformNotionPage(response) };
                }
            );
            compositionData = cachedResult.composition;
        } catch (error) {
            // Fallback to direct Notion call
            const response = await notion.pages.retrieve({ page_id: compositionId });
            compositionData = transformNotionPage(response);
        }
        
        const title = compositionData.title;
        const instrumentation = compositionData.instrumentation;
        const price = compositionData.price || 10;
        let stripePriceId = compositionData.stripePriceId;
        let stripeProductId = compositionData.stripeProductId;
        
        // Auto-create Stripe product if it doesn't exist
        if (!stripePriceId && !stripeProductId) {
            console.log(`🎵 Auto-creating Stripe product for: "${title}"`);
            
            // Create Stripe product
            const product = await stripe.products.create({
                name: title,
                description: `Digital music composition: ${title} for ${instrumentation}`,
                metadata: {
                    notionPageId: compositionId,
                    instrumentation: instrumentation
                }
            });
            
            // Create price
            const priceObj = await stripe.prices.create({
                unit_amount: Math.round(price * 100),
                currency: 'usd',
                product: product.id,
            });
            
            // Update Notion with new IDs
            await notion.pages.update({
                page_id: compositionId,
                properties: {
                    'Stripe Product ID': {
                        rich_text: [{
                            text: { content: product.id }
                        }]
                    },
                    'Stripe Price ID': {
                        rich_text: [{
                            text: { content: priceObj.id }
                        }]
                    }
                }
            });
            
            // Invalidate cache for this composition
            await deleteFromCache([CACHE_KEYS.compositionById(compositionId)]);
            console.log(`🗑️ Invalidated cache for composition ${compositionId}`);
            
            stripePriceId = priceObj.id;
            stripeProductId = product.id;
            
            console.log(`✅ Created Stripe product: ${product.id}`);
        }
        
        // Create checkout session
        const sessionConfig = {
            payment_method_types: ['card'],
            line_items: [{
                price: stripePriceId,
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/cancel`,
            metadata: {
                compositionId: compositionId,
                compositionTitle: title,
                stripeProductId: stripeProductId
            }
        };
        
        const session = await stripe.checkout.sessions.create(sessionConfig);
        
        res.json({ checkoutUrl: session.url });
        
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// Webhook to handle successful payments
app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.log(`Webhook signature verification failed.`, err.message);
        console.log(`❌ Webhook signature verification failed:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`✅ Webhook received: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Here you could:
        // - Send download links via email
        // - Update Notion with purchase info
        // - Log the sale
        
        console.log('Payment successful for:', session.metadata.compositionTitle);
        console.log('💰 Payment successful for:', session.metadata.compositionTitle);
        console.log('📧 Customer email:', session.customer_details?.email);
    }

    res.json({received: true});
});

// Auto-create Stripe products for compositions without them
app.post('/api/auto-create-stripe-products', async (req, res) => {
    try {
        console.log('🚀 Starting auto-creation of Stripe products...');
        
        // Get all compositions from Notion (bypass cache for this operation)
        const notionResponse = await notion.databases.query({
            database_id: process.env.NOTION_DATABASE_ID,
        });
        
        let created = 0;
        let updated = 0;
        let errors = 0;
        
        for (const page of notionResponse.results) {
            try {
                const compositionData = transformNotionPage(page);
                
                // Skip if already has Stripe product
                if (compositionData.stripeProductId) {
                    console.log(`⏭️  Skipping "${compositionData.title}" - already has Stripe product`);
                    continue;
                }
                
                console.log(`🎵 Creating Stripe product for: "${compositionData.title}"`);
                
                // Create Stripe product
                const product = await stripe.products.create({
                    name: compositionData.title,
                    description: `Digital music composition: ${compositionData.title} for ${compositionData.instrumentation}`,
                    metadata: {
                        notionPageId: page.id,
                        instrumentation: compositionData.instrumentation
                    }
                });
                
                // Create price for the product
                const priceObj = await stripe.prices.create({
                    unit_amount: Math.round((compositionData.price || 10) * 100),
                    currency: 'usd',
                    product: product.id,
                });
                
                // Update Notion with Stripe IDs
                await notion.pages.update({
                    page_id: page.id,
                    properties: {
                        'Stripe Product ID': {
                            rich_text: [{
                                text: { content: product.id }
                            }]
                        },
                        'Stripe Price ID': {
                            rich_text: [{
                                text: { content: priceObj.id }
                            }]
                        }
                    }
                });
                
                // Invalidate cache for this composition
                await deleteFromCache([CACHE_KEYS.compositionById(page.id)]);
                
                console.log(`✅ Created Stripe product for "${compositionData.title}": ${product.id}`);
                created++;
                
            } catch (error) {
                console.error(`❌ Error processing composition:`, error.message);
                errors++;
            }
        }
        
        // Clear all caches since we updated multiple compositions
        await clearCompositionCaches();
        
        res.json({
            success: true,
            message: `Auto-creation complete: ${created} created, ${updated} updated, ${errors} errors`,
            stats: { created, updated, errors }
        });
        
    } catch (error) {
        console.error('❌ Error in auto-creation:', error);
        res.status(500).json({ error: 'Failed to auto-create Stripe products' });
    }
});

// Create Stripe product for single composition
app.post('/api/create-stripe-product/:compositionId', async (req, res) => {
    try {
        const compositionId = req.params.compositionId;
        
        // Get composition from Notion
        const pageData = await notion.pages.retrieve({
            page_id: compositionId,
        });
        
        const compositionData = transformNotionPage(pageData);
        
        // Check if already has Stripe product
        if (compositionData.stripeProductId) {
            return res.json({
                success: false,
                message: 'Stripe product already exists',
                productId: compositionData.stripeProductId
            });
        }
        
        // Create Stripe product
        const product = await stripe.products.create({
            name: compositionData.title,
            description: `Digital music composition: ${compositionData.title} for ${compositionData.instrumentation}`,
            metadata: {
                notionPageId: compositionId,
                instrumentation: compositionData.instrumentation
            }
        });
        
        // Create price
        const priceObj = await stripe.prices.create({
            unit_amount: Math.round((compositionData.price || 10) * 100),
            currency: 'usd',
            product: product.id,
        });
        
        // Update Notion
        await notion.pages.update({
            page_id: compositionId,
            properties: {
                'Stripe Product ID': {
                    rich_text: [{
                        text: { content: product.id }
                    }]
                },
                'Stripe Price ID': {
                    rich_text: [{
                        text: { content: priceObj.id }
                    }]
                }
            }
        });
        
        // Invalidate cache for this composition
        await deleteFromCache([CACHE_KEYS.compositionById(compositionId)]);
        
        res.json({
            success: true,
            message: `Stripe product created for "${compositionData.title}"`,
            productId: product.id,
            priceId: priceObj.id
        });
        
    } catch (error) {
        console.error('Error creating Stripe product:', error);
        res.status(500).json({ error: 'Failed to create Stripe product' });
    }
});

// Serve pretty URLs for compositions
app.get('/composition/:slug', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'composition.html'));
});

// Serve main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Handle all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🎵 Music Catalog Server running on port: ${PORT}`);
    console.log(`📝 Notion integration: ${process.env.NOTION_API_KEY ? 'Connected' : 'Not configured'}`);
    console.log(`💳 Stripe integration: ${process.env.STRIPE_SECRET_KEY ? 'Connected' : 'Not configured'}`);
    console.log(`🗄️ Redis caching: Enabled`);
});