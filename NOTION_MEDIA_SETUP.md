# Notion Media Database Setup Guide

## Required Database Properties

Your Notion media database should include these properties:

### Core Properties:
- **Title** (Title) - Name of the media item
- **Description** (Rich Text) - Description of the content
- **Category** (Select) - Options: `performance`, `editing`, `composition`, `audio`
- **VideoURL** (URL) - Link to the video file or YouTube URL
- **Thumbnail** (File) - Preview image for the video

### Optional Properties:
- **AudioURL** (URL) - For audio-only content
- **Duration** (Rich Text) - Video/audio length (e.g., "5:32")
- **Featured** (Checkbox) - Mark as featured content
- **Tags** (Multi-select) - Categorization tags
- **Instrument** (Select) - Musical instrument featured
- **Venue** (Rich Text) - Performance venue
- **Year** (Number) - Year created/recorded
- **Difficulty** (Select) - Options: `Easy`, `Medium`, `Hard`
- **Status** (Select) - Options: `published`, `draft`

## Environment Variables

Add to your `.env` file:

```env
# Media Database (separate from compositions)
NOTION_MEDIA_DATABASE_ID=your_media_database_id_here

# Or use the same database as compositions
NOTION_DATABASE_ID=your_main_database_id_here
```

## Video URL Formats Supported

### YouTube URLs:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`

### Direct Video Files:
- `https://your-domain.com/videos/video.mp4`
- Notion file uploads (automatically handled)

## Testing the Integration

1. **Add test content** to your Notion database
2. **Visit** `/media.html` 
3. **Click** on video thumbnails to test playback
4. **Check browser console** for any API errors

## Current Features:

✅ **Automatic thumbnail loading** from Notion
✅ **Video modal playback** for all URL types  
✅ **Category filtering** (All, Performance, Editing, etc.)
✅ **Responsive design** for mobile/desktop
✅ **Loading states** and error handling 