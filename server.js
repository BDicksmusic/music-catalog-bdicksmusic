const express = require('express');
const path = require('path');
const cors = require('cors');
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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ===== HELPER FUNCTIONS =====

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
        description: getTextContent(properties.Description) || '',
        audioLink: properties['Audio Link']?.url || '',
        scoreLink: properties['Score PDF']?.url || '',
        purchaseLink: properties['Purchase Link']?.url || '',
        paymentLink: properties['Payment Link']?.url || properties['Stripe Link']?.url || '',
        coverImage: getFileUrl(properties['Cover Image']),
        // Add Stripe integration fields
        stripeProductId: getTextContent(properties['Stripe Product ID']),
        stripePriceId: getTextContent(properties['Stripe Price ID']),
        price: properties.Price?.number || null,
        tags: properties.Tags?.multi_select?.map(tag => tag.name) || [],
        created: page.created_time,
        lastEdited: page.last_edited_time
    };
};

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

// GET single composition by ID (WITH CACHING)
app.get('/api/compositions/:id', async (req, res) => {
    try {
        const compositionId = req.params.id;
        
        const fetchSingleComposition = async () => {
            console.log(`🔄 Fetching composition ${compositionId} from Notion...`);
            const response = await notion.pages.retrieve({
                page_id: compositionId,
            });
            
            const compositionData = transformNotionPage(response);
            
            return { 
                success: true, 
                composition: compositionData,
                cached: false,
                timestamp: new Date().toISOString()
            };
        };

        // Use cache wrapper
        const result = await withCache(
            CACHE_KEYS.compositionById(compositionId),
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

// POST new composition to Notion (INVALIDATES CACHE)
app.post('/api/compositions', async (req, res) => {
    try {
        const { title, instrumentation, year, duration, difficulty, genre, description, audioLink, scoreLink, purchaseLink, tags } = req.body;
        
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
app.post('/api/stripe-webhook', async (req, res) => {
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
});