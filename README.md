# Mere Metaphor: From PDF to Audio-Enhanced Website

A complete pipeline that automatically converts book PDFs into clean, readable websites with optional synchronized audio highlighting. Built collaboratively with Claude Code over ~1 month.

**Live Demo**: [meremetaphor.com](https://meremetaphor.com)

## What We Built

### Phase 1: PDF → HTML Pipeline (Foundation)
An automated system that takes a raw PDF export from Apple Pages and generates a clean, readable website:
- **Intelligent text extraction** with proper paragraph detection
- **Image extraction** with transparency mask handling (14 illustrations)
- **Chapter structure recognition** and table of contents generation
- **Typography optimization** for web reading

### Phase 2: Audio Enhancement (Extension)
Added synchronized word-by-word audio highlighting:
- **35+ minutes of voice memo recordings** processed automatically
- **4,019 words transcribed** with precise timestamps
- **94% automatic word matching** with smart edge case handling
- **Speed controls and mobile optimization**

**The Key Insight**: Most of the complexity was in the PDF processing foundation. Audio was surprisingly straightforward once we had clean HTML structure.

## Core Technical Challenges

### PDF Processing: The Hidden Complexity

Converting a PDF to clean HTML turned out to be surprisingly complex:

**Challenge 1: Text Structure Recognition**
- PDFs have no semantic structure - just positioned text fragments
- Had to infer paragraphs, headings, and chapters from font sizes and positioning
- Solution: Heuristic analysis of line lengths and text patterns

**Challenge 2: Image Extraction with Transparency**
- PDF contains 14 illustrations with complex transparency masks
- Standard extraction tools failed or produced poor quality
- Solution: Custom pipeline preserving transparency and optimizing file sizes

**Challenge 3: Chapter Detection**
- No structural markers in PDF for chapter boundaries  
- Needed to identify chapter titles, generate IDs, create navigation
- Solution: Pattern matching on title formatting and content analysis

**Challenge 4: Typography for Web**
- PDF formatting doesn't translate well to responsive web design
- Needed proper heading hierarchy, readable line lengths, mobile optimization
- Solution: CSS-based typography system with semantic HTML structure

### Audio Enhancement: Building on Solid Foundation

Once we had clean HTML structure, audio became much simpler:

**Sequential Word Mapping Innovation**
```
Traditional: PDF → HTML → Audio → Try to Match (fails)
Our Approach: PDF + Audio → Generate HTML with Audio Spans (works)
```

**Why This Works**: We consume transcription words sequentially during HTML generation, avoiding complex alignment algorithms.

## Architecture

### Tech Stack
- **PDF Processing**: `pdf-parse` library for text extraction
- **Audio Transcription**: OpenAI Whisper API with word-level timestamps
- **Audio Processing**: FFmpeg with custom noise reduction pipeline
- **Build System**: Single Node.js script with sequential word mapping
- **Deployment**: GitHub Pages with automated builds

### Data Flow
```
Raw .m4a recordings
  ↓ FFmpeg gentle gate filter
.mp3 files with noise reduction
  ↓ Combine with optimal bitrate
book_audio.mp3 (24MB, under API limits)
  ↓ OpenAI Whisper transcription
4,019 words with precise timestamps
  ↓ Sequential mapping during HTML generation
index.html with synchronized <span> elements
```

## Key Technical Challenges Solved

### 1. Word Timing Issues
**Problem**: Whisper sometimes assigns identical timestamps to consecutive words
**Solution**: Intelligent timestamp expansion based on word length (0.04s per character, 0.3s minimum)

### 2. Word Matching Edge Cases
**Problem**: "3rd" in text vs "third" in audio, name variations
**Solution**: Custom normalization with special cases:
```javascript
if (new_word === "rd") new_word = "third"  // "3rd" → "third"
if (new_word.includes("steiner")) new_word = "bredensteiner"
```

### 3. API File Size Limits
**Problem**: 35+ minutes of audio exceeded OpenAI's 26MB transcription limit
**Solution**: Optimized bitrate (96k vs 128k) with negligible quality loss for speech

### 4. iOS Safari Zoom Issues
**Problem**: Speed toggle button triggered zoom on rapid tapping
**Solution**: Comprehensive touch prevention:
```javascript
speedBtn.addEventListener('touchstart', function(e) {
    e.preventDefault();
    e.stopPropagation();
}, {passive: false});
```

### 5. Audio Processing Pipeline
**Problem**: Raw voice memos had background noise, inconsistent levels
**Solution**: Standardized FFmpeg gentle gate filter:
```bash
ffmpeg -i input.m4a -af "agate=threshold=0.05:ratio=1.5:attack=5:release=200" 
  -codec:a libmp3lame -b:a 128k output.mp3
```

## What Makes This Unique

### 1. **PDF as Primary Source**
- Starts with raw PDF export (not clean structured data)
- Automatically infers document structure from visual formatting
- Handles real-world messiness: inconsistent spacing, mixed fonts, embedded images
- Produces semantic HTML from visual-only input

### 2. **Complete Automation Pipeline**
- Zero manual intervention from PDF to finished website
- Handles both text extraction and image processing
- One command builds entire experience (with or without audio)
- Smart defaults with edge case handling

### 3. **Progressive Enhancement Architecture**
- Core functionality: Clean, readable website from PDF
- Enhancement layer: Synchronized audio highlighting
- Degrades gracefully: Works without JavaScript, works without audio
- Mobile-first design with speed controls and touch optimization

### 4. **Real-World Content Quality**
- Uses actual voice memo recordings (not studio quality)
- Handles background noise, breathing, natural speech patterns
- Still achieves 94% word matching accuracy
- Processes 35+ minutes of audio automatically

### 5. **Iterative Development with AI**
- Built through experiments, keeping what worked
- Frequent commits documenting problem-solving process
- Each iteration solved specific technical challenges
- Human insight + AI capability solving complex problems

## Lessons Learned

### What Worked Well
- **`pdf-parse` library**: Reliable text extraction from complex PDFs
- **Heuristic structure detection**: Simple rules worked better than ML approaches
- **Sequential word mapping**: Much simpler than traditional forced alignment
- **OpenAI Whisper**: Excellent accuracy for natural speech
- **Gentle gate audio filtering**: Effective noise reduction without artifacts
- **GitHub Pages**: Zero-config deployment for static sites

### What Was Challenging
- **PDF structure inference**: No semantic info, had to guess from visual formatting
- **Image extraction complexity**: Transparency masks and quality optimization
- **Cross-browser compatibility**: Especially iOS Safari touch handling
- **API limits**: Had to optimize for external service constraints (26MB)
- **Word boundary edge cases**: "3rd" vs "third", name variations

### Architecture Decisions That Paid Off
- **Build-time processing**: Generate static files rather than runtime processing
- **Progressive enhancement**: PDF→HTML works standalone, audio enhances
- **Single combined audio file**: Simpler than per-chapter synchronization
- **Generate don't retrofit**: Core insight for both PDF and audio processing
- **Minimal dependencies**: Only essential tools (pdf-parse, openai, ffmpeg)

## Code Organization

```
scripts/build.js           # Main build script with sequential mapping
scripts/transcribe-audio.js # OpenAI Whisper integration
meremetaphor.pdf           # Source content
book_audio.mp3             # Combined audio (96k, 24MB)
book_audio_transcription.json # 4,019 words with timestamps
index.html                 # Generated synchronized webpage
```

## Try It Yourself

1. `npm install`
2. `npm run build` 
3. Open `index.html`

The build process is completely automated - given the PDF and audio files, it generates the entire synchronized experience.

## Impact

### Technical Achievements
1. **PDF Structure Inference**: Automatically extracts semantic meaning from visual-only PDFs
2. **Image Processing Pipeline**: Handles complex transparency masks and optimization
3. **Audio-Text Synchronization**: 94% accuracy with real-world voice recordings
4. **Cross-Platform Compatibility**: Works on desktop, mobile, with accessibility considerations

### Development Insights
- **Simple solutions often work best**: Heuristics beat complex algorithms for this domain
- **Progressive enhancement**: Build solid foundation first, add features second  
- **Real-world testing matters**: iOS Safari taught us things desktop never would
- **AI pair programming**: Human domain knowledge + AI implementation = powerful combination

### Broader Applications
This approach could work for:
- Technical documentation (API docs → interactive guides)
- Educational content (textbooks → multimedia experiences)  
- Legal documents (contracts → searchable, navigable formats)
- Any PDF-first content that needs web distribution

**Built collaboratively with Claude Code** - demonstrating how human creativity and AI capability can solve complex problems that neither could tackle alone.