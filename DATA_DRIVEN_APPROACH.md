# Data-Driven Audio-HTML Generation Approach

## Current Problem

We're treating HTML generation and audio coordination as separate problems:
1. **PDF → HTML** (build.js): Generate static HTML from PDF text extraction
2. **HTML → Audio-ready** (manual/automated): Retrofit audio spans onto existing HTML

This creates unnecessary complexity and limits our ability to handle larger content systematically.

## Proposed Solution: Intermediate Data Format

Insert a structured data layer between PDF extraction and HTML generation:

```
PDF → pdf.js-extract → Content Data → HTML + Audio Structure
                                   ↘ Review Interface
                                   ↘ Audio Metadata
```

## Content Data Format

Create a structured representation that bridges PDF parsing and multiple output formats:

```javascript
{
  "book": {
    "title": "Mere Metaphor",
    "subtitle": "Understanding Religious Language as a Materialist",
    "author": "Derek Bredensteiner"
  },
  "chapters": [
    {
      "id": "preface",
      "title": "Preface", 
      "type": "preface",
      "sections": [
        {
          "id": "preface-intro",
          "type": "paragraph",
          "sentences": [
            {
              "id": "preface-s1",
              "text": "If you believe in a supernatural entity or a creator of the universe, that's not what this book is about.",
              "words": [
                {"text": "If", "index": 0},
                {"text": "you", "index": 1},
                {"text": "believe", "index": 2}
                // ... etc
              ]
            }
          ],
          "audio": {
            "hasAudio": true,
            "audioFile": "preface.mp3",
            "transcription": "transcription_preface.json"
          }
        }
      ]
    }
  ]
}
```

## Benefits of This Approach

### 1. **Separation of Concerns**
- **Content extraction**: Focus purely on getting clean, structured text from PDF
- **Audio coordination**: Handle audio mapping against structured content
- **HTML generation**: Create optimized HTML for both reading and audio

### 2. **Chunk-Based Workflows**
- **Paragraph-level editing**: Review and adjust one paragraph at a time
- **Chapter-level processing**: Handle audio for complete chapters systematically  
- **Incremental progress**: Build up audio library section by section

### 3. **Multiple Output Targets**
- **Reading HTML**: Clean, fast-loading version without audio spans
- **Audio HTML**: Version with pre-wrapped words and audio player
- **Review interface**: Editor-friendly version for manual adjustments
- **API data**: Structured format for other tools/applications

### 4. **Scalability**
- **Automated preprocessing**: Generate initial word mappings automatically
- **Manual refinement**: Easy to review and adjust paragraph by paragraph
- **Quality control**: Validate audio timing before publishing
- **Batch processing**: Handle multiple chapters efficiently

## Implementation Plan

### Phase 1: Extract to Structured Data

Modify `build.js` to output structured content instead of HTML:

```javascript
// New: scripts/extract-content-data.js
async function extractContentData() {
  const pdfData = await extractPDFData();
  const structuredContent = {
    book: extractBookMetadata(pdfData),
    chapters: []
  };
  
  for (const chapterConfig of CHAPTER_CONFIGS) {
    const chapterData = await extractChapterData(pdfData, chapterConfig);
    const structuredChapter = {
      id: chapterConfig.id,
      title: chapterConfig.title,
      type: chapterConfig.type,
      sections: await extractSections(chapterData)
    };
    structuredContent.chapters.push(structuredChapter);
  }
  
  return structuredContent;
}

function extractSections(chapterData) {
  // Extract paragraphs/sentences with word-level breakdown
  // Preserve positioning info for later audio mapping
  // Include metadata about content type (narrative, quote, etc.)
}
```

### Phase 2: Build Audio Mapping Tools

Create tools that work on structured data rather than HTML:

```javascript
// New: scripts/build-audio-mapping.js
class AudioMapper {
  constructor(contentData, transcriptionData) {
    this.content = contentData;
    this.transcription = transcriptionData;
  }
  
  async mapChapter(chapterId) {
    const chapter = this.content.chapters.find(c => c.id === chapterId);
    const mapping = [];
    
    for (const section of chapter.sections) {
      const sectionMapping = await this.mapSection(section);
      mapping.push(sectionMapping);
    }
    
    return mapping;
  }
  
  async mapSection(section) {
    // Use fuzzy matching to align transcription words to content words
    // Return mapping data that can be used for HTML generation
  }
}
```

### Phase 3: Generate Multiple HTML Versions

Build HTML generators that use the structured data:

```javascript
// New: scripts/generate-html.js
class HTMLGenerator {
  constructor(contentData, audioMappings = null) {
    this.content = contentData;
    this.audioMappings = audioMappings;
  }
  
  generateReadingVersion() {
    // Clean HTML optimized for reading experience
    return this.buildHTML({ includeAudio: false });
  }
  
  generateAudioVersion() {
    // HTML with pre-wrapped words and audio player
    return this.buildHTML({ includeAudio: true });
  }
  
  generateReviewVersion() {
    // Editor interface for reviewing/adjusting mappings
    return this.buildReviewInterface();
  }
}
```

### Phase 4: Review Interface

Build a review tool that works paragraph by paragraph:

```javascript
// New: scripts/review-interface.js
class ContentReviewer {
  displaySection(sectionId) {
    // Show original text, transcription, and proposed mapping
    // Allow manual adjustment of word mappings
    // Preview audio timing
    // Save adjustments back to structured data
  }
  
  validateMapping(mapping) {
    // Check for missing words, timing gaps, etc.
    // Highlight potential issues for manual review
  }
}
```

## Directory Structure

```
meremetaphor/
├── content/
│   ├── book-data.json           # Master structured content
│   ├── audio-mappings/
│   │   ├── preface.json         # Audio mapping for preface
│   │   ├── chapter-1.json       # Audio mapping for chapter 1
│   │   └── ...
│   └── transcriptions/
│       ├── preface.json         # Whisper transcription
│       └── ...
├── audio/
│   ├── preface.mp3
│   └── ...
├── scripts/
│   ├── extract-content-data.js  # PDF → structured data
│   ├── build-audio-mapping.js   # Content + transcription → mapping
│   ├── generate-html.js         # Structured data → HTML
│   ├── review-interface.js      # Manual review tools
│   └── build.js                 # Orchestrates the whole process
└── output/
    ├── index.html               # Reading version
    ├── audio.html               # Audio version
    └── review.html              # Review interface
```

## Workflow Example

### For the Human (Manual Review)

1. **Generate structured content**: `npm run extract-content`
2. **Process audio for a chapter**: `npm run transcribe preface`
3. **Generate initial mapping**: `npm run map-audio preface`
4. **Review and adjust**: Open review interface, work paragraph by paragraph
5. **Generate final HTML**: `npm run build-audio preface`
6. **Test and iterate**: Preview, adjust, repeat until satisfied

### For Automation (Future)

1. **Batch process all chapters**: Generate content data for entire book
2. **Automated mapping**: Use improved algorithms to map transcriptions
3. **Quality validation**: Automated checks for common issues
4. **Bulk publishing**: Generate all HTML versions at once

## Advantages Over Current Approach

1. **Maintainable**: Clear separation between content, audio, and presentation
2. **Scalable**: Easy to add new chapters without starting from scratch
3. **Reviewable**: Work on manageable chunks instead of entire documents
4. **Flexible**: Generate different versions for different use cases
5. **Debuggable**: Easy to identify and fix issues in specific sections
6. **Collaborative**: Multiple people could work on different chapters
7. **Future-proof**: Structured data can be used for other applications

## Migration Strategy

Since we already have working manual mapping for the preface:

1. **Extract preface to structured format**: Create content data for existing preface
2. **Build HTML generator**: Create version that can reproduce current manual output
3. **Validate equivalence**: Ensure new approach matches manual results
4. **Add review interface**: Build tools for easier manual adjustment
5. **Expand to other chapters**: Apply systematic approach to remaining content

This approach leverages our control over the HTML generation process to make audio coordination much more systematic and scalable.