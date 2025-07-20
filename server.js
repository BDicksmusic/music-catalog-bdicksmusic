const express = require('express');
const path = require('path');
const cors = require('cors');
const { Client } = require('@notionhq/client');
require('dotenv').config();

// Install stripe: npm install stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

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
                // Add Stripe integration fields
                stripeProductId: properties['Stripe Product ID']?.rich_text[0]?.text?.content || '',
                stripePriceId: properties['Stripe Price ID']?.rich_text[0]?.text?.content || '',
                price: properties.Price?.number || null,
                tags: properties.Tags?.multi_select?.map(tag => tag.name) || [],
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
            lastEdited: response.last_edited_time
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
        notion: process.env.NOTION_API_KEY ? 'Connected' : 'Not configured',
        stripe: process.env.STRIPE_SECRET_KEY ? 'Connected' : 'Not configured'
    });
});

// Create Stripe checkout session
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { compositionId } = req.body;
        
        // Get composition details from Notion
        const composition = await notion.pages.retrieve({
            page_id: compositionId,
        });
        
        const properties = composition.properties;
        const title = properties.Name?.title[0]?.text?.content || 'Music Composition';
        const price = properties.Price?.number || 10; // Default $10
        const stripePriceId = properties['Stripe Price ID']?.rich_text[0]?.text?.content;
        
        let sessionConfig;
        
        if (stripePriceId) {
            // Use existing Stripe Price
            sessionConfig = {
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
                    compositionTitle: title
                }
            };
        } else {
            // Create price on the fly
            sessionConfig = {
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: title,
                            description: `Digital music composition: ${title}`,
                        },
                        unit_amount: Math.round(price * 100), // Convert to cents
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${req.headers.origin}/cancel`,
                metadata: {
                    compositionId: compositionId,
                    compositionTitle: title
                }
            };
        }
        
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
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Here you could:
        // - Send download links via email
        // - Update Notion with purchase info
        // - Log the sale
        
        console.log('Payment successful for:', session.metadata.compositionTitle);
    }

    res.json({received: true});
});

// Auto-create Stripe products for compositions without them
app.post('/api/auto-create-stripe-products', async (req, res) => {
    try {
        console.log('🔄 Starting auto-creation of Stripe products...');
        
        // Get all compositions from Notion
        const response = await notion.databases.query({
            database_id: process.env.NOTION_DATABASE_ID,
        });
        
        let created = 0;
        let updated = 0;
        let errors = 0;
        
        for (const page of response.results) {
            try {
                const properties = page.properties;
                const title = properties.Name?.title[0]?.text?.content || 'Untitled';
                const instrumentation = properties.Instrumentation?.rich_text[0]?.text?.content || 'Unknown';
                const price = properties.Price?.number || 10;
                const stripeProductId = properties['Stripe Product ID']?.rich_text[0]?.text?.content;
                
                // Skip if already has Stripe product
                if (stripeProductId) {
                    console.log(`⏭️  Skipping "${title}" - already has Stripe product`);
                    continue;
                }
                
                console.log(`🆕 Creating Stripe product for: "${title}"`);
                
                // Create Stripe product
                const product = await stripe.products.create({
                    name: title,
                    description: `Digital music composition: ${title} for ${instrumentation}`,
                    metadata: {
                        notionPageId: page.id,
                        instrumentation: instrumentation
                    }
                });
                
                // Create price for the product
                const priceObj = await stripe.prices.create({
                    unit_amount: Math.round(price * 100), // Convert to cents
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
                
                console.log(`✅ Created Stripe product for "${title}": ${product.id}`);
                created++;
                
            } catch (error) {
                console.error(`❌ Error processing "${title}":`, error.message);
                errors++;
            }
        }
        
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
        const page = await notion.pages.retrieve({
            page_id: compositionId,
        });
        
        const properties = page.properties;
        const title = properties.Name?.title[0]?.text?.content || 'Untitled';
        const instrumentation = properties.Instrumentation?.rich_text[0]?.text?.content || 'Unknown';
        const price = properties.Price?.number || 10;
        
        // Check if already has Stripe product
        const existingProductId = properties['Stripe Product ID']?.rich_text[0]?.text?.content;
        if (existingProductId) {
            return res.json({
                success: false,
                message: 'Stripe product already exists',
                productId: existingProductId
            });
        }
        
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
        
        res.json({
            success: true,
            message: `Stripe product created for "${title}"`,
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

// Handle all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Music Catalog Server running on port: ${PORT}`);
    console.log(`🔗 Notion integration: ${process.env.NOTION_API_KEY ? 'Connected' : 'Not configured'}`);
});