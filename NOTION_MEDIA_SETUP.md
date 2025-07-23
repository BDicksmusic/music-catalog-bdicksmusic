# Enhanced Notion Database Setup Guide with Relations

## Overview
This guide explains how to set up your enhanced Notion databases with four key relational structures for the music catalog website. The new system supports rich media relationships between compositions and audio/video files.

## Database Structure Overview

### Primary Databases
1. **Compositions Database** - Your existing compositions
2. **Media Database** - Audio, video, and score files with metadata

### Four Key Relations
1. **Audio to Composition** - Audio files linked to compositions
2. **Video to Composition** - Video files linked to compositions  
3. **Audio to Relations** - Audio files with enhanced relational metadata
4. **Video to Relations** - Video files with enhanced relational metadata

## Enhanced Compositions Database

### Core Properties (Keep Existing)
| Property Name | Type | Description |
|---------------|------|-------------|
| Name | Title | Composition title |
| Slug | Rich Text | URL-friendly identifier |
| Instrumentation | Rich Text | Instruments required |
| Year | Number | Year composed |
| Duration | Rich Text | Performance duration |
| Difficulty | Select | Easy, Medium, Hard |
| Description | Rich Text | Composition description |
| Purchase Link | URL | Link to purchase/buy page |
| Tags | Multi-select | Genre, style tags |
| Cover Image | Files & Media | Composition cover image |

### Legacy Properties (Keep for Backward Compatibility)
| Property Name | Type | Description |
|---------------|------|-------------|
| Audio Link | URL | Single audio file (legacy) |
| Score Link | URL | Single PDF score (legacy) |

## New Media Database

### Required Properties
| Property Name | Type | Description |
|---------------|------|-------------|
| **Name** | Title | Media title |
| **Type** | Select | Audio, Video, Score |
| **Composition Relations** | Relation | Link to Compositions database |
| **Category** | Select | performance, composition, editing, audio |

### Media File Properties (Choose Based on Type)
| Property Name | Type | Description | Use For |
|---------------|------|-------------|---------|
| **Audio File** | Files & Media | Upload audio files directly | Audio files (.mp3, .wav, .m4a) |
| **VideoURL** | URL | Link to video (YouTube, etc.) | Video links |
| **URL** | URL | Generic media URL | Any URL-based media |

### Enhanced Metadata Properties
| Property Name | Type | Description | Frontend Display |
|---------------|------|-------------|------------------|
| **Performance By** | Rich Text | Performer information | ✅ Shown on compositions |
| **Recording Date** | Date | When recorded | ✅ Shown on compositions |
| **Duration** | Rich Text | Media length | ✅ Shown on compositions |
| **Venue** | Rich Text | Performance location | 📊 Data only |
| **Description** | Rich Text | Media description | 📊 Data only |
| **Quality** | Select | High, Standard, Demo | 📊 Data only |
| **Featured** | Checkbox | Featured content | 📊 Data only |
| **Tags** | Multi-select | Content tags | 📊 Data only |
| **Thumbnail** | Files & Media | Preview image | 📊 Data only |
| **Instrument** | Select | Primary instrument | 📊 Data only |
| **Difficulty** | Select | Performance difficulty | 📊 Data only |
| **Status** | Select | published, draft, archived | 📊 Data only |

> **Note**: All properties are stored in the database and available via API. Properties marked "📊 Data only" are available for organization, filtering, and future features but don't display on composition pages for a clean user experience.

## Implementation Steps

### Step 1: Create Media Database

1. **Create new database** named "Media Portfolio"
2. **Add all properties** from the table above
3. **Configure select options**:
   - Type: Audio, Video, Score
   - Category: performance, composition, editing, audio
   - Quality: High, Standard, Demo
   - Status: published, draft, archived

### Step 2: Set Up Relations

1. **In Media Database**:
   - Add "Composition Relations" property
   - Select "Relation" type
   - Connect to your Compositions database
   - Allow multiple selections

2. **In Compositions Database** (auto-created):
   - Notion will automatically create a "Media Database" relation property
   - This shows all media linked to each composition

### Step 3: Environment Variables

Add to your `.env` file:
```env
# Existing
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_compositions_database_id

# New Media Database
NOTION_MEDIA_DATABASE_ID=your_media_database_id
```

### Step 4: Populate Media Database

For each audio/video file:

1. **Create new Media entry**
2. **Set Type** (Audio/Video/Score)  
3. **Add URL** to your media file
4. **Link to Composition(s)** via "Composition Relations"
5. **Add metadata** (performer, venue, date, etc.)

## Data Rollup Examples

### Composition with Multiple Audio Files
```javascript
{
  "title": "Sunrise Fanfare",
  "audioFiles": [
    {
      "id": "audio1",
      "title": "Studio Recording",
      "url": "https://example.com/studio.mp3",
      "performanceBy": "Brandon Dicks, Trumpet",
      "recordingDate": "2023-10-15"
    },
    {
      "id": "audio2", 
      "title": "Live Performance",
      "url": "https://example.com/live.mp3",
      "performanceBy": "NAU Brass Quintet",
      "recordingDate": "2023-11-20"
    }
  ],
  "videoFiles": [
    {
      "id": "video1",
      "title": "Performance Video",
      "url": "https://example.com/performance.mp4",
      "performanceBy": "NAU Brass Quintet",
      "recordingDate": "2023-11-20"
    }
  ]
}
```

### Media with Composition Links
```javascript
{
  "title": "Studio Recording",
  "type": "Audio",
  "url": "https://example.com/studio.mp3",
  "relatedCompositions": [
    {
      "title": "Sunrise Fanfare",
      "slug": "sunrise-fanfare",
      "instrumentation": "Brass Quintet",
      "year": 2022
    }
  ]
}
```

## API Endpoints Available

### Enhanced Composition Endpoints
- `GET /api/compositions/:id` - Now includes related media
- `GET /api/compositions/:id?includeMedia=false` - Exclude media for faster loading
- `GET /api/compositions/:id/media/audio` - Get only audio files
- `GET /api/compositions/:id/media/video` - Get only video files

### New Media Endpoints  
- `GET /api/media-with-compositions` - All media with composition data
- `GET /api/media/:id/compositions` - Compositions for specific media
- `GET /api/notion-media?includeCompositions=true` - Include composition relations

## Frontend Features

### Composition Pages Display:
- **Multiple Audio Players** with clean metadata (performer, recording date)
- **Multiple Video Players** with clean metadata (performer, recording date)
- **Navigation Controls** for multiple files
- **Backward Compatibility** with single audio/score links

### Media Pages Display:
- **Related Compositions** as clickable chips  
- **Enhanced Metadata** (performer, recording date)
- **Direct Links** to composition pages

### Full Data Available via API:
- **All properties** are stored and queryable via API endpoints
- **Rich filtering capabilities** using venue, quality, instrument, etc.
- **Future-ready** for advanced features without database migration

## Migration Strategy

### Option 1: Gradual Migration
1. Keep existing Audio Link/Score Link properties
2. Start adding entries to new Media database
3. Link new media entries to compositions
4. System automatically uses relational data when available
5. Falls back to legacy links when needed

### Option 2: Full Migration
1. Create Media database entries for all existing files
2. Link all media to compositions
3. Remove legacy Audio Link/Score Link properties
4. System uses only relational data

## Benefits of This System

### For Content Management:
- **Rich Metadata** for each media file
- **Multiple Recordings** per composition
- **Flexible Categorization** (performance, demo, studio, etc.)
- **Better Organization** with venues, dates, performers

### For Users:
- **Multiple Audio Options** per composition
- **Enhanced Information** about recordings
- **Seamless Navigation** between compositions and media
- **Better Discovery** through related content

### For Development:
- **Scalable Structure** for growing content
- **Flexible Queries** for different views
- **API Efficiency** with optional data loading
- **Backward Compatibility** during migration

## Troubleshooting

### Common Issues:
1. **Media not showing**: Check Composition Relations are set in Media database
2. **Audio not playing**: Verify "Audio File" property has uploaded file OR "URL" property has link
3. **Video not loading**: Verify "VideoURL" property has valid YouTube/video link
4. **Performance slow**: Use `includeMedia=false` for list views
5. **Cache issues**: Use `/api/cache/clear` endpoint

### Database Property Setup:
```
For Audio: Use "Audio File" (Files & Media) property to upload .mp3/.wav files
For Video: Use "VideoURL" (URL) property for YouTube links  
For Relations: Use "Composition Relations" (Relation) to link to compositions
```

### Environment Setup:
```bash
# Test your setup
curl http://localhost:3000/api/media-with-compositions
curl http://localhost:3000/api/compositions/YOUR_ID?includeMedia=true

# Example API response showing all properties available:
# {
#   "audioFiles": [{
#     "title": "Studio Recording",
#     "performanceBy": "Brandon Dicks, Trumpet",     // ✅ Displays
#     "recordingDate": "2023-10-15",                // ✅ Displays  
#     "venue": "Studio A",                          // 📊 Available via API
#     "quality": "High",                            // 📊 Available via API
#     "description": "Professional recording",       // 📊 Available via API
#     "instrument": "Trumpet",                      // 📊 Available via API
#     "tags": ["studio", "professional"]           // 📊 Available via API
#   }]
# }
```

This enhanced relational system provides the four key relationships you requested while maintaining backward compatibility and providing a rich, scalable media management solution. 