# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a GitHub Pages website for the book "Mere Metaphor" that lives at meremetaphor.com. The site automatically converts the book's PDF content into HTML for web display.

## Project Structure

### Core Files
- `meremetaphor.pdf` - The source PDF of the book (exported from Apple Pages)
- `index.html` - The main website page that displays the book content (non-audio version)
- `audio-book.html` - Audio-enhanced version with word-by-word highlighting
- `scripts/build.js` - Node.js script that parses the PDF and generates index.html
- `cover_and_preface.mp3` - Audio recording for the audio-enhanced version
- `transcription_with_timestamps.json` - OpenAI Whisper transcription with word-level timestamps

### Supporting Files
- `.nojekyll` - Disables Jekyll processing on GitHub Pages
- `CNAME` - Custom domain configuration for GitHub Pages
- `package.json` - Node.js project configuration
- `/images/` - Extracted chapter illustrations from the PDF

## Development Commands

### Main Build (Non-Audio Version)
- `npm install` - Install dependencies (currently just pdf-parse)
- `npm run build` - Parse the PDF and update index.html with the book content
- `npm run dev` - Build the site and start a local server at http://localhost:8080

### Audio-Enhanced Build (Experiment 4)
- `cd experiments/experiment-4-sequential-generation`
- `node build.js` - Generate audio-book.html with word-by-word highlighting
- The output is written to the root directory as `audio-book.html`

### Audio File Management
The project uses separate source files combined into a single file for web delivery:

**Source Files:**
- `cover_and_preface.mp3` - Cover and preface audio
- `about_the_author.mp3` - About the author chapter
- `about_the_author.m4a` - Original m4a recording (kept for reference)

**Web Delivery:**
- `book_audio.mp3` - Combined audio file used by the website
- `book_audio_transcription.json` - Transcription with word-level timestamps

**Audio Processing Commands:**
```bash
# Convert m4a to mp3 with noise reduction (gentle gate is standard)
ffmpeg -i input.m4a -af "agate=threshold=0.05:ratio=1.5:attack=5:release=200" -codec:a libmp3lame -b:a 128k output.mp3

# Alternative: Ultra-gentle gate (tested - removes background noise, preserves more breathing)
# ffmpeg -i input.m4a -af "agate=threshold=0.03:ratio=1.2:attack=8:release=300" -codec:a libmp3lame -b:a 128k output_ultra_clean.mp3

# Complete workflow for new chapters:
# 1. Record chapter as .m4a
# 2. Apply gentle gate filter and convert to mp3
ffmpeg -i new_chapter.m4a -af "agate=threshold=0.05:ratio=1.5:attack=5:release=200" -codec:a libmp3lame -b:a 128k new_chapter_gentle_gate.mp3

# 3. Combine all clean audio files 
ffmpeg -i cover_and_preface_gentle_gate.mp3 -i about_the_author_gentle_gate.mp3 -filter_complex "[0:0][1:0]concat=n=2:v=0:a=1" -c:a libmp3lame -b:a 128k book_audio.mp3

# 4. Transcribe combined audio
node transcribe-audio.js
```

## Architecture

The build process is intentionally minimal:
1. `pdf-parse` library extracts text from the PDF
2. Basic heuristics convert text to HTML (short lines become headings, longer text becomes paragraphs)
3. The HTML is injected directly into index.html

## Development Philosophy

- Minimal dependencies (only pdf-parse for PDF extraction)
- No static site generators or complex build tools
- Direct PDF to HTML conversion
- Clean, simple HTML output focused on readability

## Audio Enhancement Project

This repository is actively developing automated audio highlighting capabilities:

### Goal
Create a single command that generates HTML from PDF + audio recording with precise word-by-word highlighting synchronized to audio playback.

### Current Status
- ✅ Audio transcription complete (OpenAI Whisper, 196 words with timestamps for cover + preface)
- ✅ Word-by-word highlighting working smoothly with timestamp expansion fix
- ✅ Audio player with seeking, smooth scrolling, and visual feedback
- ✅ Sequential word mapping achieving 97%+ match rate
- 🚧 Need to record audio for remaining chapters before promoting to main build

### Recent Improvements (January 2025)
- **Fixed "same timestamp" issue** - Implemented intelligent timestamp expansion based on word length
- **Enhanced audio player UX** - Removed transition animations, improved scrolling, better seeking behavior
- **Cleaned repository** - Removed experiments 1-3 and other obsolete files

### Current Approach (Experiment 4)
- `experiments/experiment-4-sequential-generation/` - Generate audio-ready HTML from PDF directly
- Key innovation: Sequential word placement during HTML generation rather than retrofitting
- Handles timestamp issues through intelligent expansion algorithm
- Produces `audio-book.html` with full audio synchronization

### Development Philosophy for Audio
- **Generate audio-ready HTML from start** - don't retrofit existing HTML
- **Use sequential word placement** - apply transcription words in order during HTML generation  
- **Leverage our control over build process** - we decide when to make paragraphs and structure
- **Gap filling by sequence** - use anchor words to fill missing words automatically
- **Only manual intervention**: exclude table of contents from audio processing

### Development Best Practices
- **Commit frequently** - After any significant changes, file reorganization, or working features
- **Use descriptive commit messages** - Explain what experiment or feature was added/modified
- **Test before committing** - Ensure scripts run and produce expected output
- **Document in commits** - Reference which experiment and what problem it solves

## Next Steps

### Immediate Tasks
1. Record audio for remaining chapters
2. Update transcription file with complete timestamps
3. Test audio synchronization across all chapters
4. Promote experiment 4 to main build process once all audio is ready

### Future Improvements to Consider
- Integrate audio and non-audio builds into single configurable script
- Add chapter navigation in audio player
- Implement playback speed controls
- Better chapter/section detection from PDF structure  
- Typography and styling improvements
- Automatic build on PDF update
- Support for multiple audio files (one per chapter)