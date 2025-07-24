# 🎵 Modular Media Components System

A powerful, reusable component system for audio and video players, extracted from your composition page and designed for easy integration across your website.

## 📁 File Structure

```
/includes/components/
├── audio-player.html          # Audio player component template
├── video-player.html          # Standard video player template  
├── score-video-player.html    # Specialized score video template
├── example-usage.html         # Interactive examples and demos
├── README.md                  # This documentation
└── (future components...)
```

## 🚀 Quick Start

### 1. Include the Component Loader

```html
<script src="/includes/component-loader.js"></script>
```

### 2. Load a Component

```javascript
// Load audio player
await ComponentLoader.loadAudioPlayer('#audio-container', {
    audioData: [...],
    showNavigation: true
});

// Load video player  
await ComponentLoader.loadVideoPlayer('#video-container', {
    videoData: [...]
});

// Load score video player
await ComponentLoader.loadVideoPlayer('#score-container', {
    videoType: 'score',
    videoData: [...]
});
```

## 🎯 Available Components

### 🎵 Audio Player Component

**Perfect for:** Musical compositions, movement-based pieces, multi-track audio

**Features:**
- ✅ Multiple audio format support (MP3, WAV, OGG)
- ✅ Movement-based composition handling
- ✅ Track navigation controls
- ✅ Performance metadata display
- ✅ Responsive design
- ✅ Loading states and error handling

**Usage:**
```javascript
await ComponentLoader.loadAudioPlayer('#target', {
    audioData: [
        {
            title: "Movement I - Allegro",
            url: "/audio/track1.mp3",
            isMovement: true,
            metadata: {
                performanceInfo: "Brandon Dicks, trumpet",
                additionalInfo: "Recorded at Symphony Hall, 2023"
            }
        }
    ],
    showNavigation: true
});
```

### 🎬 Video Player Component

**Perfect for:** Performance videos, promotional content, educational videos

**Features:**
- ✅ YouTube embed support
- ✅ Direct video file support (MP4, WebM, OGG)
- ✅ Video metadata and descriptions
- ✅ Multiple video formats
- ✅ Responsive containers
- ✅ Custom thumbnails

**Usage:**
```javascript
await ComponentLoader.loadVideoPlayer('#target', {
    videoData: [
        {
            type: "youtube",
            videoId: "dQw4w9WgXcQ",
            title: "Live Performance",
            metadata: {
                performanceInfo: "Live at Carnegie Hall",
                additionalInfo: "December 15, 2023"
            }
        },
        {
            type: "direct",
            url: "/videos/performance.mp4",
            title: "Studio Recording"
        }
    ]
});
```

### 📄 Score Video Player Component

**Perfect for:** Sheet music follow-along, educational content, score demonstrations

**Features:**
- ✅ Specialized for musical scores
- ✅ Educational annotations
- ✅ Tempo and musical direction metadata
- ✅ Follow-along functionality
- ✅ Enhanced performance info

**Usage:**
```javascript
await ComponentLoader.loadVideoPlayer('#target', {
    videoType: 'score',
    videoData: [
        {
            type: "youtube",
            videoId: "score-video-id",
            title: "Score Follow-Along",
            metadata: {
                performanceInfo: "Sheet music display",
                additionalInfo: "Tempo: Allegro moderato ♩ = 120"
            }
        }
    ]
});
```

## 🔧 Configuration Options

### Common Options (All Components)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `containerId` | string | auto-generated | Unique ID for the component |
| `position` | string | `'beforeend'` | Where to inject (`beforeend`, `afterbegin`, etc.) |
| `compositionId` | string | `null` | ID to fetch data from API |
| `apiEndpoint` | string | `'/api/composition'` | API endpoint for data fetching |

### Audio Player Specific

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `audioData` | array | `[]` | Array of audio objects |
| `showNavigation` | boolean | `true` | Show track navigation controls |

### Video Player Specific

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `videoData` | array | `[]` | Array of video objects |
| `videoType` | string | `'standard'` | `'standard'` or `'score'` |

## 📊 Data Formats

### Audio Data Format

```javascript
{
    title: "Track Title",           // Required
    url: "/path/to/audio.mp3",      // Required  
    isMovement: false,              // Optional: true for classical movements
    metadata: {                     // Optional
        performanceInfo: "Performer info",
        additionalInfo: "Extra details"
    }
}
```

### Video Data Format

```javascript
{
    type: "youtube",                // Required: "youtube" or "direct"
    videoId: "YouTube-ID",          // Required for YouTube
    url: "/path/video.mp4",         // Required for direct
    title: "Video Title",           // Optional
    metadata: {                     // Optional
        performanceInfo: "Performance details",
        additionalInfo: "Additional context"
    }
}
```

## 🔗 API Integration

### Load from Your Backend

```javascript
// Components can automatically fetch data from your API
await ComponentLoader.loadAudioPlayer('#container', {
    compositionId: 'my-composition-123',
    apiEndpoint: '/api/compositions'
});
```

### Expected API Response Format

```javascript
{
    "audio": [
        // Array of audio objects
    ],
    "videos": [
        // Array of video objects  
    ],
    "scoreVideos": [
        // Array of score video objects
    ]
}
```

## 🔥 Batch Loading

Load multiple components simultaneously for better performance:

```javascript
const results = await ComponentLoader.loadMediaComponents([
    {
        type: 'audio',
        targetSelector: '#audio-section',
        options: { audioData: audioTracks }
    },
    {
        type: 'video',
        targetSelector: '#video-section', 
        options: { videoData: performanceVideos }
    },
    {
        type: 'score-video',
        targetSelector: '#score-section',
        options: { videoData: scoreVideos }
    }
]);
```

## 🎨 Styling

Components inherit styles from your existing CSS:
- `/variables.css` - CSS custom properties
- `/styles.css` - Main stylesheet

All components use existing classes from your composition page, ensuring visual consistency.

## 📱 Responsive Design

All components are fully responsive:
- **Desktop**: Full-featured layout with all controls
- **Tablet**: Optimized for touch interaction
- **Mobile**: Stacked layout with simplified controls

## 🔄 Integration with Existing Code

### Replace Existing Players

Instead of duplicating the audio/video HTML and JavaScript across pages:

**Before:**
```html
<!-- Duplicated across multiple pages -->
<div class="composition-audio-container">
    <!-- 50+ lines of HTML -->
</div>
<script>
    // 100+ lines of JavaScript
</script>
```

**After:**
```html
<div id="audio-player-here"></div>
<script src="/includes/component-loader.js"></script>
<script>
    ComponentLoader.loadAudioPlayer('#audio-player-here', {
        compositionId: 'current-composition'
    });
</script>
```

### Update Your Backend

Your existing composition API works perfectly! Just ensure it returns data in the expected format.

## 🧪 Testing

Visit `/includes/components/example-usage.html` for:
- ✅ Interactive component demos
- ✅ Code examples you can copy/paste  
- ✅ API integration examples
- ✅ Error handling demonstrations

## 🚀 Advanced Usage

### Custom Component IDs

```javascript
const audioPlayer = await ComponentLoader.loadAudioPlayer('#container', {
    containerId: 'my-custom-audio-player',
    audioData: tracks
});

console.log(audioPlayer.containerId); // 'my-custom-audio-player'
console.log(audioPlayer.element);    // DOM element reference
```

### Error Handling

```javascript
try {
    await ComponentLoader.loadAudioPlayer('#container', {
        compositionId: 'invalid-id'
    });
} catch (error) {
    console.error('Failed to load audio player:', error);
    // Handle error gracefully
}
```

### Dynamic Updates

```javascript
// Load initial component
const player = await ComponentLoader.loadAudioPlayer('#container', {
    audioData: initialTracks
});

// Later, update with new data
await ComponentLoader.loadAudioPlayer('#container', {
    audioData: updatedTracks,
    position: 'beforeend' // Will add to existing
});
```

## 🛠️ Development

### Creating New Components

1. Create HTML template in `/includes/components/`
2. Add template variables using `{{variableName}}` syntax
3. Update `component-loader.js` with new component logic
4. Add examples to `example-usage.html`
5. Update this README

### Template Variables

Use `{{variableName}}` in your HTML templates:

```html
<div id="my-component-{{containerId}}">
    <!-- Component content -->
</div>
```

The loader will automatically replace these with actual values.

## 🎯 Benefits

✅ **DRY Principle** - Write once, use everywhere  
✅ **Consistent Design** - Same styling across all pages  
✅ **Easy Maintenance** - Update one template, affects all instances  
✅ **Performance** - Lazy loading and efficient rendering  
✅ **Flexibility** - Use with static data or dynamic APIs  
✅ **Responsive** - Works perfectly on all devices  
✅ **Future-Proof** - Easy to extend with new component types  

## 🔮 Roadmap

- [ ] **Playlist Component** - For multiple compositions
- [ ] **Music Sheet Component** - Interactive sheet music display  
- [ ] **Performance Notes Component** - Expandable annotation system
- [ ] **Social Sharing Component** - Share compositions easily
- [ ] **Download Component** - Controlled access to audio/scores
- [ ] **Comment System Component** - User feedback on compositions
- [ ] **Analytics Component** - Track engagement with media

## 💡 Tips & Best Practices

1. **Use Semantic IDs**: Give your target containers meaningful IDs
2. **Handle Loading States**: Components show loading states automatically
3. **Batch Load**: Use `loadMediaComponents()` for better performance
4. **Error Gracefully**: Always handle API failures
5. **Test Responsive**: Check components on all device sizes
6. **Cache Data**: Consider caching API responses for better UX
7. **Progressive Enhancement**: Components degrade gracefully without JavaScript

---

**Ready to build amazing musical experiences!** 🎵✨ 