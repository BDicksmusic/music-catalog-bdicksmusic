#!/usr/bin/env node

// Setup script for Brandon Dicks Media Portfolio
// Run: node setup-media.js

const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({
    auth: process.env.NOTION_API_KEY, // Use same variable as main server
});

const DATABASE_ID = process.env.NOTION_MEDIA_DATABASE_ID || process.env.NOTION_DATABASE_ID;

async function setupMediaDatabase() {
    console.log('🎵 Brandon Dicks Media Portfolio Setup');
    console.log('=====================================\n');

    // Check environment variables
    if (!process.env.NOTION_API_KEY) {
        console.error('❌ NOTION_API_KEY not found in environment variables');
        console.log('💡 Please add your Notion integration token to .env file');
        return;
    }

    if (!DATABASE_ID) {
        console.error('❌ NOTION_DATABASE_ID not found in environment variables');
        console.log('💡 Please add your Notion database ID to .env file');
        return;
    }

    try {
        // Test connection
        console.log('🔍 Testing Notion connection...');
        const testResponse = await notion.databases.retrieve({
            database_id: DATABASE_ID
        });
        
        console.log(`✅ Connected to database: "${testResponse.title[0]?.plain_text || 'Untitled'}"`);
        
        // Check existing content
        console.log('\n📊 Checking existing content...');
        const contentResponse = await notion.databases.query({
            database_id: DATABASE_ID,
            page_size: 5
        });
        
        console.log(`📄 Found ${contentResponse.results.length} existing entries`);
        
        if (contentResponse.results.length === 0) {
            console.log('\n🎯 No content found. Would you like to add sample entries?');
            console.log('💡 You can add sample data by running: node setup-media.js --sample');
        } else {
            console.log('\n🎉 Great! Your database has content. Testing API...');
            
            // Test local API if server is running
            try {
                const apiResponse = await fetch('http://localhost:3000/api/notion-media');
                if (apiResponse.ok) {
                    const data = await apiResponse.json();
                    console.log(`✅ API working! Found ${data.count || 0} media items`);
                } else {
                    console.log('⚠️  API not responding. Make sure server is running with: npm start');
                }
            } catch (error) {
                console.log('⚠️  Server not running. Start with: npm start');
            }
        }

        console.log('\n🚀 Setup complete! Next steps:');
        console.log('1. Start your server: npm start');
        console.log('2. Visit: http://localhost:3000/media.html');
        console.log('3. Add content to your Notion database');
        console.log('4. Refresh the media page to see your content!');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        
        if (error.code === 'unauthorized') {
            console.log('💡 Make sure your Notion integration has access to the database');
        } else if (error.code === 'object_not_found') {
            console.log('💡 Check that your database ID is correct');
        }
    }
}

async function createSampleData() {
    console.log('🎵 Creating sample media entries...\n');

    const sampleEntries = [
        {
            title: 'Jazz Improvisation - Blue Moon',
            description: 'Live jazz performance showcasing improvisational skills with contemporary arrangement of the classic standard Blue Moon.',
            category: 'performance',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Sample URL
            duration: '6:45',
            featured: true,
            tags: ['jazz', 'trumpet', 'improvisation', 'standards'],
            instrument: 'trumpet',
            venue: 'Blue Note Jazz Club',
            year: 2024,
            difficulty: 'advanced',
            status: 'published'
        },
        {
            title: 'Original Composition - Sunrise Fanfare',
            description: 'Original composition for brass quintet featuring dynamic rhythms and soaring melodic lines.',
            category: 'composition',
            audioUrl: 'https://example.com/audio/sunrise-fanfare.mp3',
            duration: '4:30',
            featured: true,
            tags: ['original', 'brass-quintet', 'fanfare', 'composition'],
            instrument: 'ensemble',
            year: 2023,
            difficulty: 'intermediate',
            status: 'published'
        },
        {
            title: 'Trumpet Breathing Techniques',
            description: 'Comprehensive guide to proper breathing techniques for brass players, including exercises and common mistakes to avoid.',
            category: 'teaching',
            videoUrl: 'https://www.youtube.com/watch?v=example2',
            duration: '8:20',
            featured: false,
            tags: ['education', 'technique', 'breathing', 'trumpet', 'lesson'],
            instrument: 'trumpet',
            year: 2024,
            difficulty: 'beginner',
            status: 'published'
        }
    ];

    for (const entry of sampleEntries) {
        try {
            const response = await notion.pages.create({
                parent: { database_id: DATABASE_ID },
                properties: {
                    Title: { title: [{ text: { content: entry.title } }] },
                    Description: { rich_text: [{ text: { content: entry.description } }] },
                    Category: { select: { name: entry.category } },
                    VideoURL: entry.videoUrl ? { url: entry.videoUrl } : undefined,
                    AudioURL: entry.audioUrl ? { url: entry.audioUrl } : undefined,
                    Duration: { rich_text: [{ text: { content: entry.duration } }] },
                    Featured: { checkbox: entry.featured },
                    Tags: { multi_select: entry.tags.map(tag => ({ name: tag })) },
                    Instrument: { select: { name: entry.instrument } },
                    Venue: entry.venue ? { rich_text: [{ text: { content: entry.venue } }] } : undefined,
                    Year: { number: entry.year },
                    Difficulty: { select: { name: entry.difficulty } },
                    Status: { select: { name: entry.status } }
                }
            });
            
            console.log(`✅ Created: "${entry.title}"`);
        } catch (error) {
            console.error(`❌ Failed to create "${entry.title}":`, error.message);
        }
    }

    console.log('\n🎉 Sample data created! Check your Notion database.');
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--sample')) {
    createSampleData();
} else {
    setupMediaDatabase();
} 