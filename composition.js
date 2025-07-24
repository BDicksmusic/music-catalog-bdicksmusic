function renderComposition(comp) {
    console.log('🎯 Starting renderComposition with:', comp);
    console.log('🎯 DEBUG - COMPREHENSIVE MEDIA ANALYSIS from server:', {
        // Raw arrays from server
        audioFiles: comp.audioFiles?.length || 0,
        videoFiles: comp.videoFiles?.length || 0,
        scoreFiles: comp.scoreFiles?.length || 0,
        allMedia: comp.allMedia?.length || 0,
        
        // Legacy properties
        audioLink: comp.audioLink ? 'PRESENT' : 'MISSING',
        scoreLink: comp.scoreLink ? 'PRESENT' : 'MISSING',
        
        // Media count summary
        mediaCount: comp.mediaCount || 'No mediaCount object',
        
        // Detailed arrays
        audioFilesList: comp.audioFiles?.map(a => ({ title: a.title, url: a.url ? 'YES' : 'NO' })) || [],
        videoFilesList: comp.videoFiles?.map(v => ({ title: v.title, type: v.type, url: v.url ? 'YES' : 'NO' })) || [],
        scoreFilesList: comp.scoreFiles?.map(s => ({ title: s.title, url: s.url ? 'YES' : 'NO' })) || []
    });
    
    // If no media found, provide diagnostic information
    if ((!comp.audioFiles || comp.audioFiles.length === 0) && 
        (!comp.videoFiles || comp.videoFiles.length === 0) && 
        (!comp.scoreFiles || comp.scoreFiles.length === 0) && 
        !comp.audioLink && !comp.scoreLink) {
        
        console.error('❌ NO MEDIA FOUND - Composition has no media relations or links:', {
            compositionId: comp.id,
            compositionTitle: comp.title,
            mediaArraysProvided: {
                audioFiles: !!comp.audioFiles,
                videoFiles: !!comp.videoFiles,
                scoreFiles: !!comp.scoreFiles,
                allMedia: !!comp.allMedia
            },
            legacyLinksProvided: {
                audioLink: !!comp.audioLink,
                scoreLink: !!comp.scoreLink
            },
            mediaCountProvided: !!comp.mediaCount,
            suggestion: 'Check Notion Media database relations for this composition'
        });
        
        // Show a notice on the page for missing media
        const audioContainer = document.querySelector('.composition-audio-container');
        if (audioContainer) {
            audioContainer.innerHTML = `
                <div style="padding: 20px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; margin: 1rem 0;">
                    <h4 style="color: #856404; margin: 0 0 10px 0;">⚠️ No Audio Found</h4>
                    <p style="color: #856404; margin: 0; font-size: 0.9rem;">
                        No audio files are linked to this composition in the Media database. 
                        Please check that audio files are properly related via "Audio to Comp" relations.
                    </p>
                </div>
            `;
        }
        
        const videoContainer = document.querySelector('#composition-video-container-main');
        if (videoContainer) {
            videoContainer.innerHTML = `
                <div style="padding: 20px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; margin: 1rem 0;">
                    <h4 style="color: #856404; margin: 0 0 10px 0;">⚠️ No Videos Found</h4>
                    <p style="color: #856404; margin: 0; font-size: 0.9rem;">
                        No video files are linked to this composition in the Media database. 
                        Please check that video files are properly related via "Video to Comp" relations.
                    </p>
                </div>
            `;
        }
    }
} 