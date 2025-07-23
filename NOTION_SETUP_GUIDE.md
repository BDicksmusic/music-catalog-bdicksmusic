# Brandon Dicks - Notion Media Database Setup

## 🎯 Database Structure

Create a new Notion database called **"Media Portfolio"** with these exact properties:

### Required Properties:

| Property Name | Type | Options/Description |
|---------------|------|---------------------|
| **Title** | Title | The main title of your content |
| **Description** | Text | Detailed description of the content |
| **Category** | Select | Options: `performance`, `editing`, `composition`, `audio`, `teaching` |
| **Thumbnail** | File & Media | Upload image or paste URL |
| **VideoURL** | URL | YouTube links or direct video files |
| **AudioURL** | URL | Direct audio file links (.mp3, .wav, etc.) |
| **Duration** | Text | Format: "4:32" or "12:45" |
| **Featured** | Checkbox | Mark your best content |
| **Tags** | Multi-select | Custom tags like: `trumpet`, `jazz`, `classical`, `original`, `cover`, `lesson`, `technique` |
| **Instrument** | Select | Options: `trumpet`, `piano`, `ensemble`, `vocal`, `mixed` |
| **Venue** | Text | Where it was recorded/performed |
| **Year** | Number | Year of creation/performance |
| **Difficulty** | Select | Options: `beginner`, `intermediate`, `advanced`, `professional` |
| **Status** | Select | Options: `published`, `draft`, `archived` |
| **Created** | Created time | Auto-populated |

## 🎵 Sample Content Structure

Here are some example entries to get you started:

### Entry 1: YouTube Performance
- **Title**: "Jazz Improvisation - Blue Moon"
- **Description**: "Live jazz performance showcasing improvisational skills with contemporary arrangement of the classic standard Blue Moon."
- **Category**: `performance`
- **VideoURL**: `https://www.youtube.com/watch?v=YOUR_VIDEO_ID`
- **Duration**: "6:45"
- **Featured**: ✅ (checked)
- **Tags**: `jazz`, `trumpet`, `improvisation`, `standards`
- **Instrument**: `trumpet`
- **Year**: 2024
- **Difficulty**: `advanced`
- **Status**: `published`

### Entry 2: Original Composition
- **Title**: "Sunrise Fanfare"
- **Description**: "Original composition for brass quintet featuring dynamic rhythms and soaring melodic lines."
- **Category**: `composition`
- **AudioURL**: `https://yoursite.com/audio/sunrise-fanfare.mp3`
- **Duration**: "4:30"
- **Featured**: ✅ (checked)
- **Tags**: `original`, `brass-quintet`, `fanfare`, `composition`
- **Instrument**: `ensemble`
- **Year**: 2023
- **Difficulty**: `intermediate`
- **Status**: `published`

### Entry 3: Educational Content
- **Title**: "Trumpet Breathing Techniques"
- **Description**: "Comprehensive guide to proper breathing techniques for brass players, including exercises and common mistakes to avoid."
- **Category**: `teaching`
- **VideoURL**: `https://www.youtube.com/watch?v=YOUR_TEACHING_VIDEO`
- **Duration**: "8:20"
- **Tags**: `education`, `technique`, `breathing`, `trumpet`, `lesson`
- **Instrument**: `trumpet`
- **Difficulty**: `beginner`
- **Status**: `published`

## 🔧 Integration Setup

### Step 1: Create Notion Integration
1. Go to [https://developers.notion.com/](https://developers.notion.com/)
2. Click "Create new integration"
3. Name it "Brandon Dicks Media"
4. Select your workspace
5. Copy the integration token (starts with `secret_`)

### Step 2: Share Database
1. In your Notion database, click "Share"
2. Click "Invite" and search for your integration name
3. Give it "Full access"

### Step 3: Get Database ID
1. Copy your database URL
2. Extract the database ID (the long string between the last `/` and `?`)
3. Example: `https://notion.so/myworkspace/a8aec43384f447ed84390e8d42c2e089?v=...`
4. Database ID: `a8aec43384f447ed84390e8d42c2e089`

## 🎬 YouTube Integration Strategy

Since we're using Notion as primary, here's how to leverage your YouTube channel:

### Manual Curation (Recommended)
1. **Select your best YouTube videos** from your channel
2. **Add them to Notion** with enhanced metadata
3. **Use YouTube URLs** in the VideoURL field
4. **Add custom descriptions** that are more detailed than YouTube descriptions
5. **Categorize properly** (performance, teaching, etc.)
6. **Mark featured content** for homepage highlighting

### Benefits of This Approach:
- ✅ Full control over what appears on your site
- ✅ Enhanced metadata and descriptions
- ✅ Professional curation of your best work
- ✅ Custom categorization beyond YouTube's system
- ✅ Featured content highlighting
- ✅ Educational content properly organized

## 🚀 Content Strategy

### For Performances:
- Feature your best live performances
- Include venue and context information
- Add difficulty levels for educational value
- Use high-quality thumbnails

### For Compositions:
- Showcase original works
- Include both audio and video when available
- Add detailed program notes
- Link to sheet music if available

### For Educational Content:
- Organize by skill level
- Create series of related lessons
- Include technique demonstrations
- Add practice tips and exercises

### For Video Editing:
- Show behind-the-scenes content
- Demonstrate your video production skills
- Include before/after comparisons
- Showcase different editing techniques

This setup gives you maximum flexibility while maintaining professional presentation! 