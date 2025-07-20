// GET single composition by ID
app.get('/api/compositions/:id', async (req, res) => {
    try {
        const response = await notion.pages.retrieve({
            page_id: req.params.id,
        });
        
        const properties = response.properties;
        
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
        
        const compositionData = {
            id: response.id,
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
            created: response.created_time,
            lastEdited: response.last_edited_time
        };
        
        res.json({ success: true, composition: compositionData });
        
    } catch (error) {
        console.error('Error fetching composition:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch composition' 
        });
    }
});