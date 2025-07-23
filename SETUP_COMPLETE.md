# 🎵 Brandon Dicks - Media Portfolio Setup Complete!

Your dynamic media system is ready! Here's everything you need to get it running.

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Environment Variables
1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` with your credentials:
   ```bash
   # Required for Notion integration
   NOTION_TOKEN=secret_your_integration_token_here
   NOTION_DATABASE_ID=your_database_id_here
   
   # Optional for YouTube (future)
   YOUTUBE_CHANNEL_ID=UCrKhLmCV6fTbM7oZMb6_Q1A
   ```

### Step 3: Create Notion Database
Follow the detailed structure in `NOTION_SETUP_GUIDE.md`, or use these key properties:

**Required Properties:**
- Title (Title)
- Description (Text) 
- Category (Select: performance, editing, composition, audio, teaching)
- VideoURL (URL)
- AudioURL (URL)
- Duration (Text)
- Featured (Checkbox)
- Tags (Multi-select)
- Status (Select: published, draft, archived)

### Step 4: Test Your Setup
```bash
# Test Notion connection
node setup-media.js

# Add sample data (optional)
node setup-media.js --sample

# Start the server
npm start
```

### Step 5: Visit Your Media Page
Open: http://localhost:3000/media.html

---

## 🎬 Your YouTube Channel Integration

I've already configured your YouTube channel ID: `UCrKhLmCV6fTbM7oZMb6_Q1A`

**Current Strategy:** Use Notion as primary content manager, manually curate your best YouTube videos.

**Benefits:**
- ✅ Full control over what appears
- ✅ Enhanced metadata and descriptions  
- ✅ Professional curation
- ✅ Custom categorization
- ✅ Featured content highlighting

---

## 🎯 Content Strategy for Your Channel

Based on your setup, here's how to organize content:

### 🎺 Performance Videos
- **Category**: `performance`
- **Tags**: `trumpet`, `jazz`, `classical`, `live`, `concert`
- **Use for**: Your best live performances, recitals, concerts
- **YouTube Integration**: Copy your best YouTube performance URLs

### 🎼 Original Compositions  
- **Category**: `composition`
- **Tags**: `original`, `brass`, `ensemble`, `solo`
- **Use for**: Your original works, both audio and video
- **Special**: Mark your best compositions as `Featured`

### 📚 Educational Content
- **Category**: `teaching`  
- **Tags**: `education`, `technique`, `lesson`, `tips`
- **Use for**: Instructional videos, masterclasses, tutorials
- **YouTube Integration**: Perfect for educational content from your channel

### 🎥 Video Production
- **Category**: `editing`
- **Tags**: `production`, `behind-scenes`, `editing`, `process`
- **Use for**: Showcase your video editing skills

### 🎵 Audio Samples
- **Category**: `audio`
- **Special**: Automatically scrolls to audio showcase section
- **Use for**: Pure audio content, recordings, demos

---

## 🛠️ Advanced Features

### Dynamic Grid System
- ✅ Automatically fills empty spaces when filtering
- ✅ Smooth animations and transitions
- ✅ Responsive on all devices

### Smart Content Handling
- ✅ YouTube videos → Embedded player
- ✅ Direct videos → HTML5 player  
- ✅ Audio content → Auto-scroll to audio section
- ✅ Mixed content types supported

### Secondary Navigation Integration
- **Composer** button → Shows `composition` content
- **Trumpeter** button → Shows `performance` content
- **Educator** button → Shows `teaching` content

---

## 📝 Adding Your First Content

### Example: Add a YouTube Performance

1. **In Notion, create new entry:**
   - **Title**: "Jazz Standards Medley - Live at Blue Note"
   - **Description**: "Live performance featuring improvisation on classic jazz standards including 'Autumn Leaves' and 'Blue Moon'."
   - **Category**: `performance`
   - **VideoURL**: `https://www.youtube.com/watch?v=YOUR_VIDEO_ID`
   - **Duration**: "8:45"
   - **Featured**: ✅ (for homepage)
   - **Tags**: `jazz`, `trumpet`, `live`, `standards`, `improvisation`
   - **Instrument**: `trumpet`
   - **Venue**: "Blue Note Jazz Club"
   - **Year**: 2024
   - **Difficulty**: `advanced`
   - **Status**: `published`

2. **Refresh your media page** - it should appear automatically!

### Example: Add Original Composition

1. **In Notion:**
   - **Title**: "Sunrise Fanfare"
   - **Category**: `composition`
   - **AudioURL**: Upload MP3 to Notion or link to external file
   - **Featured**: ✅
   - **Tags**: `original`, `brass-quintet`, `fanfare`

---

## 🔧 Troubleshooting

### "No content loading"
1. Check `.env` file has correct `NOTION_TOKEN` and `NOTION_DATABASE_ID`
2. Ensure Notion integration has access to your database
3. Run `node setup-media.js` to test connection

### "API not working"
1. Make sure server is running: `npm start`
2. Check console for error messages
3. Verify Notion database has `Status` property set to `published`

### "YouTube videos not embedding"
1. Ensure YouTube URLs are complete: `https://www.youtube.com/watch?v=VIDEO_ID`
2. Check that videos are public or unlisted (not private)

---

## 🎉 You're All Set!

Your media portfolio now has:
- ✅ Dynamic content loading from Notion
- ✅ Professional filtering and animations
- ✅ YouTube video integration
- ✅ Audio content management
- ✅ Featured content highlighting
- ✅ Mobile-responsive design
- ✅ Secondary navigation integration

**Next Steps:**
1. Add your content to the Notion database
2. Customize the categories and tags for your needs  
3. Mark your best work as "Featured"
4. Share your professional media portfolio!

**Your Media Page:** http://localhost:3000/media.html

---

*Need help? Check the setup script: `node setup-media.js`* 