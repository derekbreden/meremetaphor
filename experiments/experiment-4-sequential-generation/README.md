# Experiment 4: Sequential Generation Approach

## Core Insight
Instead of generating HTML first and then retrofitting audio spans, generate audio-ready HTML directly from PDF by integrating transcription during the HTML generation process.

## Strategy
1. **Fork the build process** - Create audio-enabled version of build.js
2. **Sequential word placement** - Apply transcription words in order as we generate HTML 
3. **Gap filling by sequence** - Use anchor words to fill gaps automatically
4. **No complex mapping** - Avoid fuzzy matching and duplicate word problems

## Key Advantages
- **Clean HTML output** - No nested spans or formatting issues
- **Sequential integrity** - Words placed in transcription order, no jumping
- **Controlled generation** - We decide paragraph breaks and structure
- **Scalable** - Can apply to any chapter with audio

## Implementation Plan
1. Copy build.js as foundation
2. Add transcription integration for audio sections
3. Implement sequential word wrapping during HTML generation
4. Handle table of contents exclusion (only manual intervention needed)

## Expected Outcome
Single command that generates complete 67-page book with perfect audio integration in preface section.