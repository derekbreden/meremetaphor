# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a GitHub Pages website for the book "Mere Metaphor" that lives at meremetaphor.com. The site automatically converts the book's PDF content into HTML for web display.

## Project Structure

- `meremetaphor.pdf` - The source PDF of the book (exported from Apple Pages)
- `index.html` - The main website page that displays the book content
- `scripts/build.js` - Node.js script that parses the PDF and generates HTML
- `.nojekyll` - Disables Jekyll processing on GitHub Pages
- `package.json` - Node.js project configuration

## Development Commands

- `npm install` - Install dependencies (currently just pdf-parse)
- `npm run build` - Parse the PDF and update index.html with the book content
- `npm run dev` - Build the site and start a local server at http://localhost:8080

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
- ✅ Audio transcription (OpenAI Whisper, 196 words with timestamps)
- ✅ Complex automation (finds 184/196 words, 94% coverage) 
- ⚠️ Integration gap between word finding and HTML generation

### Experiment Organization
- `experiments/experiment-1-simple-automation/` - Manual structured data approach (taught us sequential numbering works)
- `experiments/experiment-2-complex-automation/` - Fuzzy matching algorithms (taught us mapping is redundant)  
- `experiments/experiment-3-integration-attempts/` - HTML retrofitting attempts (taught us retrofitting fails)
- `experiments/experiment-4-sequential-generation/` - **CURRENT APPROACH** - Generate audio-ready HTML from PDF directly
- `scripts/archive/` - Historical iterations

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

## Future Improvements to Consider

- Complete automation integration (audio + PDF → HTML)
- Better chapter/section detection from PDF structure  
- Typography and styling improvements
- Automatic build on PDF update