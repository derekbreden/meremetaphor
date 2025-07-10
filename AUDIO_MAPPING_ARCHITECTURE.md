# Audio Mapping Architecture

## Core Problem

Map transcription words (with timing data) to PDF text content to enable word-by-word audio highlighting. The transcription and written text don't align perfectly, so we need a systematic approach to identify and handle mismatches.

## Two-Pass Solution

### Pass 1: Initial Matching and Gap Detection (IMPLEMENTED)

**Status**: Pass 1 is fully implemented and producing detailed gap analysis.

**Process**:
1. **Exact matching** with basic normalization (lowercase, remove punctuation)
2. **For each PDF word**: Look for match in next 1-10 transcription words
3. **When no match found**, record gaps and continue sequential processing
4. **Gap detection** identifies two types of alignment issues

#### Gap Type 1: Transcription Word Missing from PDF
- **Example**: "Brettensteiner" in transcription vs "Bredensteiner" in PDF
- **Detection**: Transcription words skipped during matching
- **Action**: Record transcription gap with indices

#### Gap Type 2: PDF Word Missing from Transcription  
- **Example**: Em dashes ("—") in PDF not present in transcription
- **Detection**: PDF words that cannot be matched in transcription window
- **Action**: Record PDF gap with indices

#### Gap Tracking Structure
```javascript
{
  matches: [
    { pdfIndex: 0, transcriptionIndex: 8, word: "by", timing: {...} }
  ],
  gaps: [
    {
      type: "pdf_missing", // or "transcription_missing" 
      beforeMatch: { pdfIndex: 1, transcriptionIndex: 9, word: "Derek" },
      afterMatch: { pdfIndex: 3, transcriptionIndex: 12, word: "If" },
      gapWords: ["Bredensteiner"],
      gapIndices: [10],
      sequenceId: "gap_000"
    }
  ]
}
```

**Current Results**: 190 matches out of 196 transcription words (97% match rate), with 3,483 gaps detected for analysis.

### Pass 2: Gap Resolution (ANALYSIS PHASE)

**Status**: Gap analysis completed, revealing specific patterns for targeted solutions.

**Identified Patterns**:
1. **Name pronunciation**: "Bredensteiner" (PDF) vs "Brettensteiner" (transcription)
2. **Contractions**: "that's", "I've", "isn't" appearing differently between sources
3. **Punctuation**: Em dashes ("—") in PDF missing from transcription
4. **Content scope**: Transcription contains ~400 additional words beyond current PDF processing scope

**Next Phase Strategy**: 
- **Implement basic normalization** for contractions and punctuation
- **Add phonetic matching** for name variants
- **Investigate content scope** - determine full extent of transcription coverage vs PDF extraction
- **Apply solutions incrementally** with gap reduction measurement

## Implementation Status

### Phase 1: Pass 1 Implementation (COMPLETED)
- ✅ Modified `experiments/experiment-4-sequential-generation/build.js` with transcription loading
- ✅ Implemented Pass 1 matching logic with 1-10 word lookahead window
- ✅ Added TOC skipping - TOC rendered normally but excluded from audio mapping
- ✅ Implemented cover content processing for full transcription sequence
- ✅ Generated detailed gap logs with anchor point context
- ✅ Transcription flows: "Mere Metaphor Understanding Religious Language as a Materialist by Derek Brettensteiner Preface If..."

### Phase 2: Gap Analysis (COMPLETED)  
- ✅ Analyzed 3,483 gaps from real transcription + PDF data
- ✅ Identified specific mismatch patterns and frequencies
- ✅ Documented systematic variations in actual data
- ✅ Generated gap_analysis.json with complete gap tracking

### Phase 3: Targeted Solutions (READY)
- 🎯 Ready to implement evidence-based gap resolution
- 🎯 Apply incremental solutions with gap reduction measurement
- 🎯 Focus on high-impact patterns: name variants, contractions, punctuation

## Key Principles

1. **Use transcription as sequence guide** - transcription determines the order of `data-word` attributes
2. **PDF text as content source** - maintain original spelling and formatting in HTML output
3. **Evidence-based design** - analyze actual gaps before building complex matching logic
4. **Graceful degradation** - words that can't be matched simply don't get audio highlighting
5. **Sequential integrity** - maintain transcription order for timing-based highlighting

## Current Implementation

**Location**: `experiments/experiment-4-sequential-generation/build.js`

**Core Functions**:
- `formatParagraphWithAudio()` - processes PDF content through audio mapping
- `attemptWordMatch()` - implements 1-10 word lookahead matching
- `recordGap()` - tracks alignment gaps with context
- `outputGapAnalysis()` - generates detailed gap reports

**Audio Processing Flow**:
1. Cover content → Title, subtitle, author (transcription indices 0-10)
2. TOC skipped entirely (not in transcription)  
3. Preface content → Sequential word-by-word mapping (transcription indices 11+)
4. Gap detection and logging throughout

**Current Performance**: 97% match rate (190/196 words) with comprehensive gap analysis for targeted improvements.

## Expected Outcome

Clean, sequential audio highlighting where:
- Matched words get precise timing data (190 words currently)
- Unmatched words appear normally without highlighting
- No word jumping or duplicate highlighting issues
- Preserves all original book content and formatting
- Detailed gap logs enable evidence-based improvements