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
        console.log(`🔍 QUERY MEDIA - Starting query for composition: ${compositionId}${mediaType ? ` (type: ${mediaType})` : ''}`);
        
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
            page_size: 100, // Increased to ensure we get all files
            sorts: [
                {
                    property: 'Type',
                    direction: 'ascending'
                }
            ]
        });
        
        console.log(`🔍 Found ${response.results.length} media items for composition ${compositionId}`);
        
        const transformedMedia = response.results.map(transformMediaPage);
        
        // Filter out media items without URLs (they're useless to the client)
        const validMedia = transformedMedia.filter(media => {
            if (!media.url) {
                console.log(`⚠️ FILTERED OUT - "${media.title}" has no URL`);
                return false;
            }
            return true;
        });
        
        console.log(`🔍 FINAL RESULT - Returning ${validMedia.length} valid media items (filtered out ${transformedMedia.length - validMedia.length} items without URLs)`);
        
        return validMedia;
    } catch (error) {
        console.error('❌ ERROR in queryRelatedMedia:', error);
        console.error('❌ Composition ID:', compositionId);
        console.error('❌ Media Database ID:', process.env.NOTION_MEDIA_DATABASE_ID);
        return [];
    }
}

// Helper function to find related movement files by pattern matching
async function findMovementFilesByPattern(compositionTitle, linkedMediaIds = []) {
    try {
        console.log(`🔍 Looking for movement files matching pattern: "${compositionTitle}"`);
        
        // Query all files from media database (don't filter by type yet)
        const response = await notion.databases.query({
            database_id: process.env.NOTION_MEDIA_DATABASE_ID,
            page_size: 100
        });
        
        console.log(`🔍 Pattern search found ${response.results.length} total items in media database`);
        
        // Look for files that match the composition name pattern
        const compositionPattern = compositionTitle.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 10); // First 10 chars for pattern matching
            
        const movementFiles = [];
        
        response.results.forEach(item => {
            const fileName = item.properties.Name?.title?.[0]?.text?.content || '';
            const fileNameNormalized = fileName.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            // Check if this file matches the composition pattern and has movement indicators
            const hasCompositionMatch = fileNameNormalized.includes(compositionPattern) || 
                                      fileNameNormalized.includes('resolutions') ||
                                      fileName.toLowerCase().includes('resolutions');
            
            // More flexible movement indicator patterns
            const hasMovementIndicator = /[._-](i{1,3}v?|v|[1-9])[._-]/i.test(fileName) ||
                                       /\b(i{1,3}v?|v)\b[._]/i.test(fileName) ||
                                       /movement|mvt/i.test(fileName);
            
            if (hasCompositionMatch && hasMovementIndicator && !linkedMediaIds.includes(item.id)) {
                const mediaItem = transformMediaPage(item);
                // Only include audio files in final results
                if (mediaItem.type === 'Audio') {
                    movementFiles.push(mediaItem);
                    console.log(`  ✅ Found movement file: "${fileName}"`);
                }
            }
        });
        
        console.log(`🔍 Found ${movementFiles.length} additional movement files by pattern matching`);
        return movementFiles;
        
    } catch (error) {
        console.error('Error finding movement files by pattern:', error);
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
    
    // Try URL properties first (most common)
    if (properties.URL?.url) {
        mediaUrl = properties.URL.url;
    } else if (properties.VideoURL?.url) {
        mediaUrl = properties.VideoURL.url;
    } else if (properties.AudioURL?.url) {
        mediaUrl = properties.AudioURL.url;
    } else if (properties.Link?.url) {
        mediaUrl = properties.Link.url;
    }
    // Try uploaded files (for direct file uploads)
    else if (properties['Audio File']?.files?.[0]) {
        mediaUrl = properties['Audio File'].files[0].file?.url || properties['Audio File'].files[0].external?.url || '';
    } else if (properties['Video File']?.files?.[0]) {
        mediaUrl = properties['Video File'].files[0].file?.url || properties['Video File'].files[0].external?.url || '';
    } else if (properties['Score File']?.files?.[0]) {
        mediaUrl = properties['Score File'].files[0].file?.url || properties['Score File'].files[0].external?.url || '';
    }
    // Fallback to any file property or URL-like property
    else {
        const fileProps = ['Media File', 'File', 'Upload', 'Attachment'];
        for (const prop of fileProps) {
            if (properties[prop]?.files?.[0]) {
                mediaUrl = properties[prop].files[0].file?.url || properties[prop].files[0].external?.url || '';
                break;
            }
        }
        
        // Last resort: check for any URL-like properties
        if (!mediaUrl) {
            for (const [key, value] of Object.entries(properties)) {
                if ((key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) && value?.url) {
                    mediaUrl = value.url;
                    break;
                }
            }
        }
    }
    
    // Enhanced debug logging for media items
    const mediaName = getTextContent(properties.Name) || 
                     getTextContent(properties.Title) || 
                     getTextContent(properties['File Name']) ||
                     'Unnamed';
    
    // Check composition relations
    const audioRelations = properties['Audio to Comp']?.relation || [];
    const videoRelations = properties['Video to Comp']?.relation || [];
    const compositionRelations = [...audioRelations, ...videoRelations];
    
    console.log(`🔍 MEDIA DEBUG - "${mediaName}":`, {
        url: mediaUrl ? 'FOUND' : 'MISSING',
        type: properties.Type?.select?.name || 'No Type',
        audioRelations: audioRelations.length,
        videoRelations: videoRelations.length,
        totalRelations: compositionRelations.length,
        availableProps: Object.keys(properties).filter(key => key.toLowerCase().includes('url') || key.toLowerCase().includes('file') || key.toLowerCase().includes('link'))
    });
    
    if (!mediaUrl) {
        console.log(`  ⚠️ NO URL FOUND for "${mediaName}" - Available properties:`, Object.keys(properties));
    }
    
    return {
        id: page.id,
        title: mediaName,
        type: properties.Type?.select?.name || 'Unknown',
        category: properties.Category?.select?.name || 'performance',
        url: mediaUrl,
        thumbnail: getFileUrl(properties.Thumbnail),
        duration: getTextContent(properties.Duration) || '',
        performanceBy: getTextContent(properties['Performance By']) || 
                      getTextContent(properties['Performed By']) || 
                      getTextContent(properties.Performer) || '',
        recordingDate: getTextContent(properties['Recording Date']) || 
                      getTextContent(properties.Date) || '',
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
        compositionRelations: compositionRelations.map(rel => rel.id),
        created: page.created_time,
        lastEdited: page.last_edited_time
    };
}

// Helper function to fetch similar works by IDs
const fetchSimilarWorksByIds = async (similarWorksIds) => {
    console.log('🔗 DEBUG - fetchSimilarWorksByIds called with IDs:', similarWorksIds?.length, similarWorksIds);
    
    if (!similarWorksIds || similarWorksIds.length === 0) {
        console.log('🔗 DEBUG - No similar works IDs found, returning empty array');
        return [];
    }

    try {
        console.log('🔗 DEBUG - Querying database for compositions with matching IDs...');
        
        // Query the database for compositions with matching IDs
        const response = await notion.databases.query({
            database_id: process.env.NOTION_DATABASE_ID,
            filter: {
                or: similarWorksIds.map(id => ({
                    property: 'ID',
                    number: {
                        equals: parseInt(id)
                    }
                }))
            }
        });
        
        console.log(`🔗 DEBUG - Database query returned ${response.results.length} matching compositions by ID`);
        
        // Transform the results
        const similarWorks = response.results.map(page => {
            const transformed = transformNotionPage(page);
            console.log(`🔗 DEBUG - Found similar work by ID: "${transformed.title}" (ID: ${transformed.id})`);
            return transformed;
        });
        
        // Sort to match the original order of IDs if possible
        const orderedSimilarWorks = similarWorksIds.map(id => 
            similarWorks.find(work => work.id === id)
        ).filter(work => work !== undefined);
        
        console.log(`🔗 DEBUG - Final results by ID: ${orderedSimilarWorks.length}/${similarWorksIds.length} similar works found`);
        console.log('🔗 DEBUG - Similar works by ID:', orderedSimilarWorks.map(w => `"${w.title}" (${w.id})`));
        
        return orderedSimilarWorks;
    } catch (error) {
        console.error('🔗 ERROR - Critical error in fetchSimilarWorksByIds:', error);
        return [];
    }
};

// Helper function to fetch similar works by relation property
const fetchSimilarWorksByRelation = async (similarWorksRelation) => {
    console.log('🔗 DEBUG - fetchSimilarWorksByRelation called with relations:', similarWorksRelation?.length, similarWorksRelation);
    
    if (!similarWorksRelation || similarWorksRelation.length === 0) {
        console.log('🔗 DEBUG - No similar works relations found, returning empty array');
        return [];
    }

    try {
        console.log('🔗 DEBUG - Fetching compositions from relation IDs...');
        
        // Fetch each related composition directly by ID
        const compositionPromises = similarWorksRelation.map(relation => 
            notion.pages.retrieve({ page_id: relation.id })
        );
        
        const compositions = await Promise.all(compositionPromises);
        
        // Transform the results
        const similarWorks = compositions.map(page => {
            const transformed = transformNotionPage(page);
            console.log(`🔗 DEBUG - Found similar work by relation: "${transformed.title}" (ID: ${transformed.id})`);
            return transformed;
        });
        
        console.log(`🔗 DEBUG - Final results by relation: ${similarWorks.length}/${similarWorksRelation.length} similar works found`);
        console.log('🔗 DEBUG - Similar works by relation:', similarWorks.map(w => `"${w.title}" (${w.id})`));
        
        return similarWorks;
    } catch (error) {
        console.error('🔗 ERROR - Critical error in fetchSimilarWorksByRelation:', error);
        return [];
    }
};

// Enhanced function to fetch similar works using RELATION PROPERTY as primary method
const fetchSimilarWorks = async (compositionPage) => {
    console.log('🔗 DEBUG - fetchSimilarWorks called for composition:', compositionPage.id);
    
    const properties = compositionPage.properties;
    let similarWorks = [];
    
    // PRIMARY METHOD: Check for "Similar Works" relation property (this is what we want!)
    const similarWorksRelation = properties['Similar Works']?.relation || [];
    if (similarWorksRelation.length > 0) {
        console.log('🔗 DEBUG - Found Similar Works relation property with', similarWorksRelation.length, 'relations');
        console.log('🔗 DEBUG - Relation IDs:', similarWorksRelation.map(r => r.id));
        const relationWorks = await fetchSimilarWorksByRelation(similarWorksRelation);
        similarWorks = similarWorks.concat(relationWorks);
        console.log('🔗 DEBUG - Successfully fetched', relationWorks.length, 'works from relation property');
    } else {
        console.log('🔗 DEBUG - No Similar Works relation property found');
    }
    
    // ONLY use fallback methods if NO relation property exists
    if (similarWorks.length === 0) {
        console.log('🔗 DEBUG - No relation works found, trying fallback methods...');
        
        // Fallback Method 1: Check for "Similar Works IDs" rollup property
        const similarWorksIdsField = properties['Similar Works IDs'];
        if (similarWorksIdsField?.rollup?.array) {
            console.log('🔗 DEBUG - Found Similar Works IDs rollup property (fallback)');
            const ids = similarWorksIdsField.rollup.array
                .map(item => {
                    if (item.type === 'number') {
                        return item.number;
                    }
                    return null;
                })
                .filter(id => id !== null);
            
            if (ids.length > 0) {
                console.log('🔗 DEBUG - Extracted IDs from rollup:', ids);
                const idWorks = await fetchSimilarWorksByIds(ids);
                similarWorks = similarWorks.concat(idWorks);
            }
        }
        
        // Fallback Method 2: Check for "Similar Works Slugs" rollup property (legacy)
        const similarWorksSlugsField = properties['Similar Works Slugs'];
        if (similarWorksSlugsField?.rollup?.array) {
            console.log('🔗 DEBUG - Found Similar Works Slugs rollup property (legacy fallback)');
            const slugs = similarWorksSlugsField.rollup.array
                .map(item => {
                    if (item.type === 'rich_text' && item.rich_text && item.rich_text.length > 0) {
                        return item.rich_text[0].text.content;
                    }
                    return null;
                })
                .filter(slug => slug && slug.trim() !== '');
            
            if (slugs.length > 0) {
                console.log('🔗 DEBUG - Extracted slugs from rollup:', slugs);
                const slugWorks = await fetchSimilarWorksBySlugs(slugs);
                similarWorks = similarWorks.concat(slugWorks);
            }
        }
    }
    
    // Remove duplicates based on ID
    const uniqueWorks = similarWorks.filter((work, index, self) => 
        index === self.findIndex(w => w.id === work.id)
    );
    
    if (process.env.NODE_ENV !== 'production' && uniqueWorks.length > 0) {
        console.log(`🔗 Found ${uniqueWorks.length} similar works`);
    }
    
    return uniqueWorks;
};

// Helper function to fetch similar works by slugs
const fetchSimilarWorksBySlugs = async (similarWorksSlugs) => {
    console.log('🔗 DEBUG - fetchSimilarWorksBySlugs called with slugs:', similarWorksSlugs?.length, similarWorksSlugs);
    
    if (!similarWorksSlugs || similarWorksSlugs.length === 0) {
        console.log('🔗 DEBUG - No similar works slugs found, returning empty array');
        return [];
    }

    try {
        console.log('🔗 DEBUG - Querying database for compositions with matching slugs...');
        
        // Query the database for compositions with matching slugs
        const response = await notion.databases.query({
            database_id: process.env.NOTION_DATABASE_ID,
            filter: {
                or: similarWorksSlugs.map(slug => ({
                    property: 'Slug',
                    rich_text: {
                        equals: slug
                    }
                }))
            }
        });
        
        console.log(`🔗 DEBUG - Database query returned ${response.results.length} matching compositions`);
        
        // Transform the results
        const similarWorks = response.results.map(page => {
            const transformed = transformNotionPage(page);
            console.log(`🔗 DEBUG - Found similar work: "${transformed.title}" (slug: ${transformed.slug})`);
            return transformed;
        });
        
        // Sort to match the original order of slugs if possible
        const orderedSimilarWorks = similarWorksSlugs.map(slug => 
            similarWorks.find(work => work.slug === slug)
        ).filter(work => work !== undefined);
        
        console.log(`🔗 DEBUG - Final results: ${orderedSimilarWorks.length}/${similarWorksSlugs.length} similar works found`);
        console.log('🔗 DEBUG - Similar works:', orderedSimilarWorks.map(w => `"${w.title}" (${w.slug})`));
        
        return orderedSimilarWorks;
    } catch (error) {
        console.error('🔗 ERROR - Critical error in fetchSimilarWorksBySlugs:', error);
        return [];
    }
};

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
        
        // If we have very few audio files but the composition suggests movements, try pattern matching
        const audioCount = allMedia.filter(m => m.type === 'Audio').length;
        const compositionTitle = baseComposition.title || '';
        const mightHaveMovements = /suite|symphony|sonata|concerto|movements?/i.test(compositionTitle);
        
        if (audioCount <= 1 && mightHaveMovements) {
            console.log(`🔍 Composition "${compositionTitle}" might have movements, searching by pattern...`);
            const linkedIds = allMedia.map(m => m.id);
            const movementFiles = await findMovementFilesByPattern(compositionTitle, linkedIds);
            allMedia.push(...movementFiles);
            
            // If pattern matching failed but this is "Resolutions", provide helpful message
            if (movementFiles.length === 0 && compositionTitle.toLowerCase().includes('resolutions')) {
                console.log(`⚠️ No movement files found for Resolutions. Make sure individual movement files are added to Media database with proper "Audio to Comp" relations.`);
            }
        }

        // Debug: Log what media was actually returned (reduced logging for performance)
        if (process.env.NODE_ENV !== 'production' && allMedia.length > 0) {
            console.log(`🔍 Found ${allMedia.length} media items for composition: ${baseComposition.title}`);
        }

        // Separate by type - FIXED: Properly separate score PDFs from score videos
        const audioMedia = allMedia.filter(media => media.type === 'Audio');
        const videoMedia = allMedia.filter(media => media.type === 'Video'); // Regular videos only
        const scorePdfMedia = allMedia.filter(media => media.type === 'Score'); // PDF scores only
        const scoreVideoMedia = allMedia.filter(media => media.type === 'Score Video'); // Score videos only
        
        // Combine all videos (regular + score videos) for client-side filtering
        const allVideoMedia = videoMedia.concat(scoreVideoMedia);
        
        // Debug: Log the filtering results (reduced for performance)
        if (process.env.NODE_ENV !== 'production') {
            console.log(`🔍 Media summary: ${audioMedia.length} audio, ${allVideoMedia.length} video, ${scorePdfMedia.length} score PDF, ${scoreVideoMedia.length} score video`);
        }
        
        // Fetch similar works using the new comprehensive function (with reduced logging)
        const similarWorks = await fetchSimilarWorks(page); // Use the new fetchSimilarWorks function
        if (process.env.NODE_ENV !== 'production' && similarWorks?.length > 0) {
            console.log(`🔗 Found ${similarWorks.length} similar works for: ${baseComposition.title}`);
        }
        
        // Roll up media data - FIXED: Use properly separated arrays
        return {
            ...baseComposition,
            // Enhanced media arrays with proper separation
            audioFiles: audioMedia,
            videoFiles: allVideoMedia, // Includes both regular videos and score videos for client filtering
            scoreFiles: scorePdfMedia, // PDF scores only
            allMedia: allMedia,
            
            // Similar works
            similarWorks: similarWorks,
            
            // Keep original single links for backward compatibility - FIXED: Only use PDF scores for scoreLink
            audioLink: audioMedia.length > 0 ? audioMedia[0].url : baseComposition.audioLink,
            scoreLink: scorePdfMedia.length > 0 ? scorePdfMedia[0].url : baseComposition.scoreLink, // PDF scores only
            
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
                score: scorePdfMedia.length,
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
        year: (() => {
            const yearText = getTextContent(properties.Year);
            const yearNumber = properties.Year?.number;
            const finalYear = yearText || yearNumber || null;
            
            console.log(`📅 DEBUG - Year property for "${getTextContent(properties.Name) || 'Unknown'}":`, {
                yearText,
                yearNumber,
                finalYear,
                propertyType: properties.Year?.type,
                hasRichText: !!properties.Year?.rich_text,
                hasNumber: !!properties.Year?.number
            });
            
            return finalYear;
        })(),
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
        type: properties.Type?.select?.name || 'Original',
        featured: properties.Featured?.checkbox || false,
        popular: properties.Popular?.checkbox || false,
        newInCatalog: properties['New in Catalog']?.checkbox || false,
        performedBy: getTextContent(properties['Performed By']) || '',
        slug: properties.Slug?.rich_text[0]?.plain_text || '',
        shortInstrumentList: notionRichTextToHtml(properties['Short Instrument List']?.rich_text) || '',
        similarWorksSlugs: (() => {
            // Debug: Check for the new "Similar Works Slugs" rollup field
            const slugsField = properties['Similar Works Slugs'];
            let foundSlugs = [];
            
            if (slugsField?.rollup?.array) {
                // Extract slugs from rollup array
                foundSlugs = slugsField.rollup.array
                    .map(item => {
                        if (item.type === 'rich_text' && item.rich_text && item.rich_text.length > 0) {
                            return item.rich_text[0].text.content;
                        }
                        return null;
                    })
                    .filter(slug => slug && slug.trim() !== '');
                
                console.log(`🔗 DEBUG - Found Similar Works Slugs: ${foundSlugs.length} items`);
                console.log(`🔗 DEBUG - Similar Works Slugs:`, foundSlugs);
            } else {
                console.log(`🔗 DEBUG - No Similar Works Slugs found for composition "${getTextContent(properties.Name) || 'Unknown'}"`);
            }
            
            return foundSlugs;
        })(),
        similarWorksIds: (() => {
            // Debug: Check for "Similar Works IDs" rollup field
            const idsField = properties['Similar Works IDs'];
            let foundIds = [];
            
            if (idsField?.rollup?.array) {
                // Extract IDs from rollup array
                foundIds = idsField.rollup.array
                    .map(item => {
                        if (item.type === 'number') {
                            return item.number;
                        }
                        return null;
                    })
                    .filter(id => id !== null);
                
                console.log(`🔗 DEBUG - Found Similar Works IDs: ${foundIds.length} items`);
                console.log(`🔗 DEBUG - Similar Works IDs:`, foundIds);
            } else {
                console.log(`🔗 DEBUG - No Similar Works IDs found for composition "${getTextContent(properties.Name) || 'Unknown'}"`);
            }
            
            return foundIds;
        })(),
        similarWorksRelation: (() => {
            // Debug: Check for "Similar Works" relation field
            const relationField = properties['Similar Works'];
            let foundRelations = [];
            
            if (relationField?.relation) {
                foundRelations = relationField.relation;
                console.log(`🔗 DEBUG - Found Similar Works relations: ${foundRelations.length} items`);
                console.log(`🔗 DEBUG - Similar Works relations:`, foundRelations.map(r => r.id));
            } else {
                console.log(`🔗 DEBUG - No Similar Works relations found for composition "${getTextContent(properties.Name) || 'Unknown'}"`);
            }
            
            return foundRelations;
        })(),
    };
};

// ===== MEDIA PORTFOLIO API ROUTES =====

// GET media content from Notion (for media page)
app.get('/api/notion-media', mediaApiHandler);
app.post('/api/notion-media', mediaApiHandler);

// ===== TEMPORARY DEBUG ENDPOINT =====
// DEBUG: Test specific composition's media relations
app.get('/api/debug/composition-media/:id', async (req, res) => {
    try {
        const compositionId = req.params.id;
        console.log('🔍 DEBUG - Testing media relations for composition:', compositionId);
        
        // First, get the composition details
        const composition = await notion.pages.retrieve({ page_id: compositionId });
        const compTitle = composition.properties.Name?.title?.[0]?.text?.content || 'Unknown';
        
        // Then query related media
        const relatedMedia = await queryRelatedMedia(compositionId);
        
        res.json({
            success: true,
            compositionId,
            compositionTitle: compTitle,
            mediaFound: relatedMedia.length,
            media: relatedMedia.map(media => ({
                id: media.id,
                title: media.title,
                type: media.type,
                category: media.category,
                hasUrl: !!media.url,
                url: media.url ? media.url.substring(0, 50) + '...' : 'NO URL'
            }))
        });
    } catch (error) {
        console.error('❌ Debug composition media error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DEBUG: Get all media items (no filtering)
app.get('/api/debug/all-media', async (req, res) => {
    try {
        console.log('🔍 DEBUG - Fetching ALL media items from database...');
        
        const response = await notion.databases.query({
            database_id: process.env.NOTION_MEDIA_DATABASE_ID,
            page_size: 100
        });
        
        console.log(`🔍 DEBUG - Found ${response.results.length} total media items`);
        
        // Debug: Log the actual property structure for first few items
        response.results.slice(0, 3).forEach((item, index) => {
            console.log(`🔍 DEBUG Item ${index + 1} (${item.id}):`);
            console.log(`  - Name property:`, item.properties.Name);
            console.log(`  - Title property:`, item.properties.Title);
            console.log(`  - Available properties:`, Object.keys(item.properties));
        });
        
        const mediaItems = response.results.map(item => {
            // Try multiple possible name properties
            const name = getTextContent(item.properties.Name) || 
                        getTextContent(item.properties.Title) ||
                        getTextContent(item.properties['File Name']) ||
                        getTextContent(item.properties.Filename) ||
                        'Unnamed';
            const type = item.properties.Type?.select?.name || 'No Type';
            const audioToComp = item.properties['Audio to Comp']?.relation?.length || 0;
            const videoToComp = item.properties['Video to Comp']?.relation?.length || 0;
            
            return {
                id: item.id,
                name,
                type,
                audioToComp,
                videoToComp,
                hasRelations: audioToComp > 0 || videoToComp > 0
            };
        });
        
        console.log('🔍 DEBUG - Media items breakdown:');
        mediaItems.forEach((item, index) => {
            console.log(`  ${index + 1}. "${item.name}" (${item.type}) - Relations: Audio:${item.audioToComp}, Video:${item.videoToComp}`);
        });
        
        res.json({
            success: true,
            totalCount: mediaItems.length,
            items: mediaItems
        });
    } catch (error) {
        console.error('❌ Debug endpoint error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DEBUG: Test media loading for first composition
app.get('/api/debug/test-media-loading', async (req, res) => {
    try {
        console.log('🧪 DEBUG TEST - Starting comprehensive media loading test...');
        
        // 1. Get the first composition from the database
        const compositionsResponse = await notion.databases.query({
            database_id: process.env.NOTION_DATABASE_ID,
            page_size: 1
        });
        
        if (compositionsResponse.results.length === 0) {
            return res.json({
                success: false,
                error: 'No compositions found in database'
            });
        }
        
        const testComposition = compositionsResponse.results[0];
        const compTitle = getTextContent(testComposition.properties.Name) || 'Unnamed';
        const compId = testComposition.id;
        
        console.log(`🧪 TEST - Using composition: "${compTitle}" (${compId})`);
        
        // 2. Test basic transformNotionPage (no media)
        const basicComposition = transformNotionPage(testComposition);
        
        // 3. Test transformNotionPageWithMedia (with media)
        const compositionWithMedia = await transformNotionPageWithMedia(testComposition, true);
        
        // 4. Directly test queryRelatedMedia
        const directMediaQuery = await queryRelatedMedia(compId);
        
        // 5. Get all media items for reference
        const allMediaResponse = await notion.databases.query({
            database_id: process.env.NOTION_MEDIA_DATABASE_ID,
            page_size: 10
        });
        
        const allMediaItems = allMediaResponse.results.map(item => ({
            id: item.id,
            name: getTextContent(item.properties.Name) || getTextContent(item.properties.Title) || 'Unnamed',
            type: item.properties.Type?.select?.name || 'No Type',
            audioRelations: item.properties['Audio to Comp']?.relation?.length || 0,
            videoRelations: item.properties['Video to Comp']?.relation?.length || 0,
            hasUrl: !!(item.properties.URL?.url || item.properties.VideoURL?.url || item.properties.AudioURL?.url || item.properties.Link?.url)
        }));
        
        // 6. Return comprehensive test results
        res.json({
            success: true,
            testResults: {
                composition: {
                    id: compId,
                    title: compTitle,
                    slug: basicComposition.slug
                },
                basicTransform: {
                    audioLink: basicComposition.audioLink || 'None',
                    scoreLink: basicComposition.scoreLink || 'None'
                },
                mediaTransform: {
                    audioFiles: compositionWithMedia.audioFiles?.length || 0,
                    videoFiles: compositionWithMedia.videoFiles?.length || 0,
                    scoreFiles: compositionWithMedia.scoreFiles?.length || 0,
                    allMedia: compositionWithMedia.allMedia?.length || 0,
                    audioLink: compositionWithMedia.audioLink || 'None',
                    scoreLink: compositionWithMedia.scoreLink || 'None',
                    mediaCount: compositionWithMedia.mediaCount
                },
                directMediaQuery: {
                    count: directMediaQuery.length,
                    items: directMediaQuery.map(media => ({
                        title: media.title,
                        type: media.type,
                        hasUrl: !!media.url,
                        url: media.url ? media.url.substring(0, 60) + '...' : 'No URL'
                    }))
                },
                allMediaSample: {
                    total: allMediaResponse.results.length,
                    items: allMediaItems,
                    mediaWithRelations: allMediaItems.filter(item => 
                        item.audioRelations > 0 || item.videoRelations > 0
                    ).length
                }
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ DEBUG TEST ERROR:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// DEBUG: Test similar works for a specific composition
app.get('/api/debug/similar-works/:id', async (req, res) => {
    try {
        const compositionId = req.params.id;
        console.log('🔗 DEBUG - Testing similar works for composition:', compositionId);
        
        // Get the composition page
        const compositionPage = await notion.pages.retrieve({ page_id: compositionId });
        const compositionData = transformNotionPage(compositionPage);
        
        console.log('🔗 DEBUG - Composition data:', {
            title: compositionData.title,
            similarWorksSlugs: compositionData.similarWorksSlugs,
            similarWorksIds: compositionData.similarWorksIds,
            similarWorksRelation: compositionData.similarWorksRelation,
            similarWorksSlugsCount: compositionData.similarWorksSlugs?.length || 0,
            similarWorksIdsCount: compositionData.similarWorksIds?.length || 0,
            similarWorksRelationCount: compositionData.similarWorksRelation?.length || 0
        });
        
        // Test fetching similar works
        const similarWorks = await fetchSimilarWorks(compositionPage);
        
        res.json({
            success: true,
            compositionId: compositionId,
            compositionTitle: compositionData.title,
            debug: {
                similarWorksSlugs: compositionData.similarWorksSlugs,
                similarWorksIds: compositionData.similarWorksIds,
                similarWorksRelation: compositionData.similarWorksRelation,
                expectedCount: (compositionData.similarWorksSlugs?.length || 0) + 
                              (compositionData.similarWorksIds?.length || 0) + 
                              (compositionData.similarWorksRelation?.length || 0),
                actualCount: similarWorks?.length || 0,
                similarWorks: similarWorks?.map(w => ({
                    id: w.id,
                    title: w.title,
                    slug: w.slug
                })) || []
            }
        });
    } catch (error) {
        console.error('❌ Debug similar works error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            stack: error.stack 
        });
    }
});

// DEBUG: Show all properties for a composition
app.get('/api/debug/composition-properties/:id', async (req, res) => {
    try {
        const compositionId = req.params.id;
        console.log('🔍 DEBUG - Showing all properties for composition:', compositionId);
        
        // Get the composition page
        const compositionPage = await notion.pages.retrieve({ page_id: compositionId });
        const properties = compositionPage.properties;
        
        // Extract all property names and their types
        const propertyInfo = Object.keys(properties).map(key => ({
            name: key,
            type: properties[key].type,
            hasValue: properties[key] !== null && properties[key] !== undefined
        }));
        
        // Show rollup properties in detail
        const rollupProperties = propertyInfo.filter(p => p.type === 'rollup');
        const relationProperties = propertyInfo.filter(p => p.type === 'relation');
        
        res.json({
            success: true,
            compositionId: compositionId,
            compositionTitle: properties.Name?.title?.[0]?.text?.content || 'Unknown',
            allProperties: propertyInfo,
            rollupProperties: rollupProperties,
            relationProperties: relationProperties,
            similarWorksProperty: {
                name: 'Similar Works',
                type: properties['Similar Works']?.type,
                hasValue: !!properties['Similar Works'],
                relationCount: properties['Similar Works']?.relation?.length || 0,
                relations: properties['Similar Works']?.relation?.map(r => ({
                    id: r.id,
                    type: r.type
                })) || []
            },
            similarWorksSlugsProperty: {
                name: 'Similar Works Slugs',
                type: properties['Similar Works Slugs']?.type,
                hasValue: !!properties['Similar Works Slugs'],
                rollupArray: properties['Similar Works Slugs']?.rollup?.array || []
            },
            similarWorksIdsProperty: {
                name: 'Similar Works IDs',
                type: properties['Similar Works IDs']?.type,
                hasValue: !!properties['Similar Works IDs'],
                rollupArray: properties['Similar Works IDs']?.rollup?.array || []
            }
        });
    } catch (error) {
        console.error('❌ Debug composition properties error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            stack: error.stack 
        });
    }
});

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
        const includeMedia = req.query.includeMedia === 'true'; // Default to false for performance
        
        const fetchCompositions = async () => {
            console.log(`🔄 Fetching fresh compositions from Notion${includeMedia ? ' with media' : ''}...`);
            
            // Build query with optional filters
            const queryParams = {
                database_id: process.env.NOTION_DATABASE_ID,
                sorts: [
                    {
                        property: 'Year',
                        direction: 'descending'
                    }
                ]
            };
            
            // Add filter if specified
            if (req.query.filter === 'newInCatalog') {
                queryParams.filter = {
                    property: 'New in Catalog',
                    checkbox: {
                        equals: true
                    }
                };
                console.log('🎯 Filtering for "New in Catalog" compositions only');
            } else if (req.query.filter === 'popular') {
                queryParams.filter = {
                    property: 'Popular',
                    checkbox: {
                        equals: true
                    }
                };
                console.log('🎯 Filtering for "Popular" compositions only');
            }
            
            const response = await notion.databases.query(queryParams);
            
            // Transform Notion data to clean format
            let compositions;
            if (includeMedia) {
                // Use transformNotionPageWithMedia for full media data
                compositions = await Promise.all(
                    response.results.map(page => transformNotionPageWithMedia(page, true))
                );
            } else {
                // Use basic transformNotionPage for performance
                compositions = response.results.map(transformNotionPage);
            }
            
            return { 
                success: true,
                count: compositions.length,
                compositions: compositions,
                cached: false,
                timestamp: new Date().toISOString()
            };
        };

        // Use cache wrapper with media inclusion in cache key
        const cacheKey = includeMedia ? 
            CACHE_KEYS.allCompositions + '_with_media' :
            CACHE_KEYS.allCompositions;
            
        const result = await withCache(
            cacheKey,
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

// OPTIMIZED: Load media data for specific compositions (for faster initial loading)
app.get('/api/compositions/:id/media', async (req, res) => {
    try {
        const compositionId = req.params.id;
        
        const fetchMediaData = async () => {
            console.log(`🎵 Loading media data for composition: ${compositionId}`);
            
            // Get the composition first
            const pageData = await notion.pages.retrieve({
                page_id: compositionId,
            });
            
            // Load media data with timeout
            const mediaData = await Promise.race([
                transformNotionPageWithMedia(pageData, true),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Media loading timeout')), 5000)
                )
            ]);
            
            return {
                success: true,
                composition: mediaData,
                cached: false,
                timestamp: new Date().toISOString()
            };
        };

        const cacheKey = `composition_media_${compositionId}`;
        const result = await withCache(
            cacheKey,
            CACHE_DURATIONS.singleComposition,
            fetchMediaData
        );

        result.cached = true;
        res.json(result);
        
    } catch (error) {
        console.error('Error loading composition media:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to load composition media',
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

// GET similar compositions for a given composition
app.get('/api/compositions/:id/similar', async (req, res) => {
    try {
        const compositionId = req.params.id;
        console.log(`🔗 Fetching similar compositions for: ${compositionId}`);
        
        // Get all compositions
        const allCompositionsResponse = await notion.databases.query({
            database_id: process.env.NOTION_DATABASE_ID,
            sorts: [
                {
                    property: 'Year',
                    direction: 'descending'
                }
            ]
        });
        
        // Filter out the current composition and return a subset of others
        const otherCompositions = allCompositionsResponse.results
            .filter(page => page.id !== compositionId)
            .slice(0, 4) // Return up to 4 similar compositions
            .map(transformNotionPage);
        
        console.log(`🔗 Found ${otherCompositions.length} similar compositions`);
        
        res.json({
            success: true,
            compositionId: compositionId,
            compositions: otherCompositions,
            count: otherCompositions.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error fetching similar compositions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch similar compositions'
        });
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