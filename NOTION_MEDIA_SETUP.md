# Notion Database Setup Guide

## Overview
This guide explains how to set up your Notion databases to work with the music catalog website, including both compositions and media content.

## Compositions Database

### Required Properties

| Property Name | Type | Description |
|---------------|------|-------------|
| Name | Title | Composition title |
| Slug | Rich Text | URL-friendly identifier |
| Instrumentation | Rich Text | Instruments required |
| Year | Number | Year composed |
| Duration | Rich Text | Performance duration |
| Difficulty | Select | Easy, Medium, Hard |
| Description | Rich Text | Composition description |
| Audio Link | URL | Direct link to audio file |
| Score Link | URL | Direct link to PDF score |
| Purchase Link | URL | Link to purchase/buy page |
| Tags | Multi-select | Genre, style tags |
| Cover Image | Files & Media | Composition cover image |

### Enhanced Audio Properties (Choose One Approach)

#### **Option 1: Simple Audio Metadata (Recommended)**
Add these properties to your existing Compositions database:

| Property Name | Type | Description |
|---------------|------|-------------|
| Performance By | Rich Text | Who performed the recording |
| Recording Date | Date | When the recording was made |
| Audio Description | Rich Text | Additional audio details |

#### **Option 2: Advanced Media Relations**
Create a separate Media database and link to it:

**New Media Database Properties:**
| Property Name | Type | Description |
|---------------|------|-------------|
| Name | Title | Media title |
| Type | Select | Audio, Video, Score |
| URL | URL | Direct link to media file |
| Performance By | Rich Text | Performer information |
| Recording Date | Date | Recording date |
| Description | Rich Text | Media description |
| Thumbnail | Files & Media | Preview image |
| Duration | Rich Text | Media duration |
| Quality | Select | High, Medium, Standard |

**Updated Compositions Database:**
| Property Name | Type | Description |
|---------------|------|-------------|
| Media Relations | Relation | Link to Media database |
| *(Remove Audio Link)* | - | Replace with relation |

## Implementation Examples

### Option 1: Simple Audio Metadata
```javascript
// Your composition object will include:
{
  title: "Sunrise Fanfare",
  audioLink: "https://example.com/audio.mp3",
  performanceBy: "Brandon Dicks, Trumpet",
  recordingDate: "2023-10-15",
  audioDescription: "Live recording from NAU performance"
}
```

### Option 2: Media Relations
```javascript
// Your composition object will include:
{
  title: "Sunrise Fanfare",
  mediaRelations: [
    {
      type: "Audio",
      url: "https://example.com/audio.mp3",
      performanceBy: "Brandon Dicks, Trumpet",
      recordingDate: "2023-10-15",
      description: "Studio recording"
    },
    {
      type: "Video", 
      url: "https://example.com/video.mp4",
      performanceBy: "NAU Brass Quintet",
      recordingDate: "2023-11-20",
      description: "Live performance video"
    }
  ]
}
```

## Recommended Approach

**Start with Option 1 (Simple)** if you:
- Have one audio file per composition
- Want quick setup
- Don't need complex media management

**Upgrade to Option 2 (Relations)** if you:
- Have multiple recordings per composition
- Want to add videos
- Need detailed media metadata
- Plan to expand media content

## Next Steps

1. **Choose your approach** based on your needs
2. **Add the properties** to your Notion database
3. **Update your server.js** to handle the new fields
4. **Test with a sample composition**

The website will automatically display the enhanced audio player with metadata when these properties are available.

## Server Integration

### Option 1: Update server.js to include new fields
```javascript
// In your compositions API endpoint
audioLink: getFileUrl(properties['Audio Link']),
performanceBy: properties['Performance By']?.rich_text?.[0]?.plain_text || '',
recordingDate: properties['Recording Date']?.date?.start || '',
audioDescription: properties['Audio Description']?.rich_text?.[0]?.plain_text || ''
```

### Option 2: Handle media relations
```javascript
// Query related media items and include in composition object
const mediaRelations = await queryRelatedMedia(compositionId);
// Include in composition response
```

Contact me if you need help implementing either approach! 