# 🚀 Quick Start - Brandon's Media Portfolio

Since you already have your Notion integration set up, this will be super quick!

## ✅ What You Already Have:
- ✅ Notion database: [Media Portfolio](https://www.notion.so/bdicksmusic/2398cc9f36f1808dba9cfba175f0dbcc)
- ✅ Existing Notion integration token (`NOTION_API_KEY`)
- ✅ Server infrastructure
- ✅ YouTube channel configured: `UCrKhLmCV6fTbM7oZMb6_Q1A`

## 🎯 1-Minute Setup:

### Step 1: Add Media Database ID
Add this **single line** to your existing `.env` file:
```bash
NOTION_MEDIA_DATABASE_ID=2398cc9f36f1808dba9cfba175f0dbcc
```

### Step 2: Test & Launch
```bash
# Test your media database connection
node setup-media.js

# If empty, add sample data
node setup-media.js --sample

# Start server & view
npm start
# Visit: http://localhost:3000/media.html
```

## 🎵 Your Database Structure

Based on your Notion URL, make sure your database has these properties:

**Essential Properties:**
- **Title** (Title) - Content title
- **Description** (Text) - Content description  
- **Category** (Select) - Options: `performance`, `editing`, `composition`, `audio`, `teaching`
- **VideoURL** (URL) - YouTube or direct video links
- **AudioURL** (URL) - Direct audio file links
- **Duration** (Text) - e.g., "4:32"
- **Featured** (Checkbox) - Highlight best content
- **Tags** (Multi-select) - Custom tags
- **Status** (Select) - Options: `published`, `draft`, `archived`

**Optional but Recommended:**
- **Instrument** (Select) - `trumpet`, `piano`, `ensemble`, etc.
- **Venue** (Text) - Where recorded/performed
- **Year** (Number) - Year of creation
- **Difficulty** (Select) - `beginner`, `intermediate`, `advanced`
- **Thumbnail** (File & Media) - Custom thumbnails

## 🎬 Adding Your YouTube Content

### Example Entry:
1. **Title**: "Jazz Improvisation - Blue Moon"
2. **Description**: "Live performance featuring improvisation on the classic standard"
3. **Category**: `performance`
4. **VideoURL**: `https://www.youtube.com/watch?v=YOUR_VIDEO_ID`
5. **Duration**: "6:45"
6. **Featured**: ✅ (for your best work)
7. **Tags**: `jazz`, `trumpet`, `improvisation`, `live`
8. **Status**: `published`

## 🔧 Quick Test

After adding content to your Notion database:

1. **Refresh media page**: http://localhost:3000/media.html
2. **Test filtering**: Click filter buttons to see content appear
3. **Test secondary nav**: Click "Composer/Trumpeter/Educator" buttons
4. **Test audio**: Click audio items to auto-scroll to audio section

## 🎯 Content Strategy

**Primary Use Cases:**
- **Performance Videos**: Your best YouTube performances with enhanced descriptions
- **Original Compositions**: Audio/video of your compositions
- **Educational Content**: Teaching videos and tutorials
- **Featured Content**: Mark your absolute best work to highlight on homepage

**Secondary Navigation Integration:**
- **Composer** → Shows `composition` content
- **Trumpeter** → Shows `performance` content  
- **Educator** → Shows `teaching` content

## ✅ You're Ready!

Since you already have the Notion integration established, you just need to:
1. Add the media database ID to your `.env`
2. Populate your database with content
3. Enjoy your dynamic media portfolio!

**Your Media Page**: http://localhost:3000/media.html

---

*Having issues? Run `node setup-media.js` to test your connection.* 