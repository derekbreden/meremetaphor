# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a GitHub Pages website for the book "Mere Metaphor" that lives at meremetaphor.com. The site automatically converts the book's PDF content into HTML with synchronized audio playback and word-by-word highlighting. **Project Status: COMPLETE** - Full audio book with 35:34 of recordings and 4,019 transcribed words.

## Project Structure

### Core Files
- `meremetaphor.pdf` - The source PDF of the book (exported from Apple Pages)
- `index.html` - The main website page with audio-enhanced reading experience
- `scripts/build.js` - Node.js script that parses the PDF and generates audio-enhanced HTML
- `scripts/build-original.js` - Archived original build script (non-audio version)
- `scripts/transcribe-audio.js` - OpenAI Whisper transcription script
- `book_audio.mp3` - Combined audio file used by the website
- `book_audio_transcription.json` - Transcription with word-level timestamps

### Supporting Files
- `.nojekyll` - Disables Jekyll processing on GitHub Pages
- `CNAME` - Custom domain configuration for GitHub Pages
- `package.json` - Node.js project configuration
- `/images/` - Extracted chapter illustrations from the PDF

## Development Commands

- `npm install` - Install dependencies (pdf-parse and openai)
- `npm run build` - Parse the PDF and generate audio-enhanced HTML with word-by-word highlighting
- `npm run dev` - Same as build (simplified from unnecessary local server)

### Audio File Management
The project uses separate source files combined into a single file for web delivery:

**Source Files (Originals - .m4a format):**
- `cover_and_preface.m4a` - Cover and preface audio recording
- `about_the_author.m4a` - About the author chapter recording
- `introduction_metaphor.m4a` - Introduction: Metaphor chapter
- `god_love_within_and_between_us.m4a` - God: Love Within and Between Us chapter
- `free_will_recursing_a_lifetime.m4a` - Free Will: Recursing a Lifetime chapter
- `good_a_direction_we_choose.m4a` - Good: A Direction We Choose chapter
- `sin_alignment_with_that_choice.m4a` - Sin: Alignment with That Choice chapter
- `redemption_making_new_choices.m4a` - Redemption: Making New Choices chapter
- `heaven_a_state_of_mind_and_being.m4a` - Heaven: A State of Mind and Being chapter
- `prayer_effects_of_self_reflection.m4a` - Prayer: Effects of Self-Reflection chapter
- `voices_what_inspires_shamans.m4a` - Voices: What Inspires Shamans chapter
- `afterword_and_glossary.m4a` - Afterword and Glossary combined

**Processed Files (with gentle gate noise reduction):**
- All corresponding `*_gentle_gate.mp3` files for each source file above

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
# 1. Record chapter as .m4a (voice memo or other recording)
# 2. Process directly from .m4a to filtered .mp3 (no intermediate conversion)
ffmpeg -i new_chapter.m4a -af "agate=threshold=0.05:ratio=1.5:attack=5:release=200" -codec:a libmp3lame -b:a 128k new_chapter_gentle_gate.mp3

# 3. Combine all processed audio files (example with all 12 current files)
ffmpeg -y -i cover_and_preface_gentle_gate.mp3 -i about_the_author_gentle_gate.mp3 -i introduction_metaphor_gentle_gate.mp3 -i god_love_within_and_between_us_gentle_gate.mp3 -i free_will_recursing_a_lifetime_gentle_gate.mp3 -i good_a_direction_we_choose_gentle_gate.mp3 -i sin_alignment_with_that_choice_gentle_gate.mp3 -i redemption_making_new_choices_gentle_gate.mp3 -i heaven_a_state_of_mind_and_being_gentle_gate.mp3 -i prayer_effects_of_self_reflection_gentle_gate.mp3 -i voices_what_inspires_shamans_gentle_gate.mp3 -i afterword_and_glossary_gentle_gate.mp3 -filter_complex "[0:0][1:0][2:0][3:0][4:0][5:0][6:0][7:0][8:0][9:0][10:0][11:0]concat=n=12:v=0:a=1" -c:a libmp3lame -b:a 96k book_audio.mp3

# Note: Use 96k bitrate to stay under OpenAI's 26MB file size limit for transcription

# 4. Transcribe combined audio
node transcribe-audio.js
```

## Architecture

The build process creates an audio-enhanced reading experience:
1. `pdf-parse` library extracts text from the PDF
2. OpenAI Whisper transcription provides word-level timestamps
3. Basic heuristics convert text to HTML with audio synchronization
4. Sequential word mapping applies transcription during HTML generation
5. The audio-enhanced HTML is generated as index.html

## Development Philosophy

- Minimal dependencies (pdf-parse for PDF extraction, openai for transcription)
- No static site generators or complex build tools
- Direct PDF to HTML conversion with audio enhancement
- Clean, simple HTML output focused on readability and audio synchronization

## Audio Enhancement Project

This repository is actively developing automated audio highlighting capabilities:

### Goal
Create a single command that generates HTML from PDF + audio recording with precise word-by-word highlighting synchronized to audio playback.

### Current Status
- ✅ **COMPLETE AUDIO BOOK** - All 12 sections recorded and integrated (35:34 duration)
- ✅ Audio transcription complete (OpenAI Whisper, 4,019 words with timestamps)
- ✅ Word-by-word highlighting working smoothly with timestamp expansion fix
- ✅ Audio player with speed controls (1×, 1.25×, 1.5×, 1.75×) and seeking
- ✅ Sequential word mapping achieving 94% match rate (3,777 of 4,019 words)
- ✅ Audio-enhanced build is the default website experience at meremetaphor.com
- ✅ iOS zoom prevention and touch handling optimized
- ✅ Special glossary formatting with bold terms

### Recent Improvements (July 2025)
- **Completed full audio book** - All chapters from cover to glossary now have audio
- **Speed controls** - Added 4 playback speeds with iOS-optimized touch handling
- **Smart word mapping** - Added special cases for "3rd" → "third" and "steiner" → "bredensteiner"
- **Audio compression** - Optimized for OpenAI's file size limits while maintaining quality
- **Enhanced UX** - Prevented iOS zoom, improved scrolling, better visual feedback
- **Special formatting** - Glossary terms are bolded and properly formatted
- **Noise reduction** - All audio processed with gentle gate filter for clean playback

### Build Process
- Audio-ready HTML generation from PDF with sequential word placement
- Key innovation: Sequential word placement during HTML generation rather than retrofitting
- Handles timestamp issues through intelligent expansion algorithm
- Produces index.html with full audio synchronization

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

## Project Status: COMPLETE

The audio book project is now **complete** with all chapters recorded, processed, and integrated with word-by-word highlighting.

### What's Included
- **Full audio coverage**: Cover through Glossary (35:34 total)
- **4,019 transcribed words** with precise timestamps
- **94% word matching rate** across all content
- **Speed controls**: 1×, 1.25×, 1.5×, 1.75× playback
- **iOS optimized**: Prevented zoom, optimized touch handling
- **Clean audio**: Gentle gate noise reduction applied to all recordings
- **Special formatting**: Glossary terms bolded, smart word mapping

### Future Improvements to Consider
- Add chapter navigation in audio player
- Better chapter/section detection from PDF structure  
- Typography and styling improvements
- Automatic build on PDF update
- Optional non-audio build mode for compatibility
- Multi-language support
- Download/offline reading capabilities