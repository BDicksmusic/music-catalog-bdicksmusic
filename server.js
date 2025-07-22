// Add this route to handle composition pages
const express = require('express');
const app = express();
const path = require('path');

app.get('/composition.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'composition.html'));
});

// Also ensure your slug route exists
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
            // If no slug found, try to find by ID as fallback
            try {
                const pageResponse = await notion.pages.retrieve({
                    page_id: req.params.slug,
                });
                const composition = transformNotionPage(pageResponse);
                return res.json({ success: true, composition });
            } catch (error) {
                return res.status(404).json({ success: false, error: 'Not found' });
            }
        }

        const page = response.results[0];
        const composition = transformNotionPage(page);
        res.json({ success: true, composition });
    } catch (error) {
        console.error('Error fetching composition by slug:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch composition' });
    }
});

// Update your transformNotionPage function to include slug
const transformNotionPage = (page) => {
    const properties = page.properties;
    
    return {
        id: page.id,
        slug: properties.Slug?.rich_text[0]?.plain_text || page.id,
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
        stripeProductId: getTextContent(properties['Stripe Product ID']),
        stripePriceId: getTextContent(properties['Stripe Price ID']),
        price: properties.Price?.number || null,
        tags: properties.Tags?.multi_select?.map(tag => tag.name) || [],
        created: page.created_time,
        lastEdited: page.last_edited_time
    };
};