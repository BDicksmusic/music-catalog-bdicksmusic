// Quick test script to verify relational setup
// Run with: node test-relations.js

require('dotenv').config();

console.log('🧪 Testing Relational Media Setup\n');

// Check environment variables
console.log('📋 Environment Check:');
console.log(`✅ NOTION_API_KEY: ${process.env.NOTION_API_KEY ? 'Set' : '❌ Missing'}`);
console.log(`✅ NOTION_DATABASE_ID: ${process.env.NOTION_DATABASE_ID ? 'Set' : '❌ Missing'}`);
console.log(`✅ NOTION_MEDIA_DATABASE_ID: ${process.env.NOTION_MEDIA_DATABASE_ID ? 'Set' : '❌ Missing'}`);

if (!process.env.NOTION_MEDIA_DATABASE_ID) {
    console.log('\n❌ NOTION_MEDIA_DATABASE_ID is missing!');
    console.log('Add this to your .env file:');
    console.log('NOTION_MEDIA_DATABASE_ID=your_media_database_id');
    process.exit(1);
}

console.log('\n🚀 Test URLs to try:');
console.log(`📡 Media API: http://localhost:3000/api/notion-media`);
console.log(`📡 Media with Relations: http://localhost:3000/api/media-with-compositions`);
console.log(`📡 Sample Composition: http://localhost:3000/api/compositions/[YOUR_ID]`);

console.log('\n✅ Setup looks good! Start your server and test the URLs above.'); 