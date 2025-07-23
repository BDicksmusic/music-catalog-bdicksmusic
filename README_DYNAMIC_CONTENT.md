# Dynamic Content Setup Guide

Your media page now supports both **YouTube API integration** (automatic) and **Notion database** (curated) content loading.

## 🎯 Quick Start

The system works with static content by default. To enable dynamic content, choose one or both options below:

---

## 🔴 Option 1: YouTube API Integration (Automatic)

### What You Get:
- Automatically pulls your latest YouTube videos
- Updates content dynamically
- Shows video thumbnails, titles, descriptions
- Embedded YouTube player in modals

### Setup Steps:

1. **Get YouTube API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable YouTube Data API v3
   - Create credentials (API Key)

2. **Get Your Channel ID:**
   - Go to your YouTube channel
   - Copy the channel ID from the URL or use [this tool](https://commentpicker.com/youtube-channel-id.php)

3. **Configure in media.js:**
   ```javascript
   const YOUTUBE_API_KEY = 'AIzaSyC...'; // Your actual API key
   const YOUTUBE_CHANNEL_ID = 'UCxxxxxxx'; // Your actual channel ID
   ```

### Benefits:
- ✅ Fully automatic
- ✅ Always up-to-date
- ✅ No manual work needed
- ✅ Professional YouTube integration

---

## 🔵 Option 2: Notion Database (Curated)

### What You Get:
- Full control over content
- Custom categories and tags
- Featured content highlighting
- Mixed media types (video, audio, images)
- Rich descriptions and metadata

### Setup Steps:

1. **Create Notion Database:**
   Create a new database in Notion with these properties:
   
   | Property Name | Type | Description |
   |---------------|------|-------------|
   | Title | Title | Content title |
   | Description | Text | Content description |
   | Category | Select | performance, editing, composition, audio |
   | Thumbnail | URL/File | Image thumbnail |
   | VideoURL | URL | YouTube or direct video link |
   | AudioURL | URL | Direct audio file link |
   | Duration | Text | e.g., "4:32" |
   | Featured | Checkbox | Highlight as featured |
   | Tags | Multi-select | Custom tags |
   | Created | Created time | Auto-populated |

2. **Set up Notion API:**
   - Go to [Notion Developers](https://developers.notion.com/)
   - Create new integration
   - Get your integration token
   - Share your database with the integration

3. **Create API Endpoint:**
   You'll need a simple server endpoint that queries your Notion database:
   
   ```javascript
   // Example endpoint (Node.js/Express)
   app.post('/api/notion-media', async (req, res) => {
     const { Client } = require('@notionhq/client');
     const notion = new Client({ auth: process.env.NOTION_TOKEN });
     
     const response = await notion.databases.query({
       database_id: 'your-database-id',
       sorts: [{ property: 'Created', direction: 'descending' }]
     });
     
     res.json(response);
   });
   ```

4. **Configure in media.js:**
   ```javascript
   const NOTION_DATABASE_URL = 'https://yoursite.com/api/notion-media';
   ```

### Benefits:
- ✅ Full creative control
- ✅ Custom categorization
- ✅ Rich metadata
- ✅ Mixed content types
- ✅ Featured content system

---

## 🎨 Content Categories

The system automatically categorizes content:

- **performance** → Shows in "Performances" filter
- **editing** → Shows in "Video Editing" filter  
- **composition** → Shows in "Compositions" filter
- **audio** → Shows in "Audio Samples" filter + auto-scrolls to audio section

---

## 🚀 Advanced Features

### Automatic Filtering
- Secondary nav buttons (Composer/Trumpeter/Educator) automatically filter content
- Smooth animations and grid reflow
- Audio content auto-scrolls to audio showcase section

### Smart Modals
- YouTube videos → Embedded YouTube player
- Direct video links → HTML5 video player
- Audio content → Scrolls to audio section

### Visual Indicators
- YouTube content shows red "Live" badge
- Notion content shows blue "Notion" badge
- Featured content gets gold "Featured" badge
- Tags and metadata displayed beautifully

---

## 🔧 Testing

1. **With APIs configured:** Content loads dynamically
2. **Without APIs configured:** Falls back to static content gracefully
3. **Mixed setup:** Can use YouTube OR Notion OR both together

---

## 📱 Mobile Optimized

- Responsive grid layout
- Touch-friendly modals
- Optimized loading states
- Smooth animations on all devices

---

## 🎯 Recommendation

**For maximum impact:** Use **Notion** for curated, high-quality content that represents your best work, and **YouTube API** for staying current with your latest uploads.

This gives you both professional curation AND automatic updates! 