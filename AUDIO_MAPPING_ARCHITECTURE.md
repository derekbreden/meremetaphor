# Audio Mapping Architecture

## Core Problem

Map transcription words (with timing data) to PDF text content to enable word-by-word audio highlighting. The transcription and written text don't align perfectly, so we need a systematic approach to identify and handle mismatches.

## Two-Pass Solution

### Pass 1: Initial Matching and Gap Detection

**Goal**: Find exact matches and identify the two types of gaps that occur.

**Process**:
1. **Attempt exact matching** with basic normalization (lowercase, remove punctuation)
2. **For each transcription word**: Look for match in next 1-10 PDF words
3. **For each PDF word**: Look for match in next 1-10 transcription words  
4. **When no match found**, record a gap of one of two types:

#### Gap Type 1: Transcription Word Missing from PDF
- **Example**: "that is" is spoken but only "that's" appears in written text
- **Detection**: Transcription word doesn't match anything in expected PDF window
- **Action**: Record transcription gap, advance transcription index

#### Gap Type 2: PDF Word Missing from Transcription  
- **Example**: "that is" is written but only "that's" appears in spoken transcription
- **Detection**: PDF word doesn't match anything in expected transcription window  
- **Action**: Record PDF gap, advance PDF index

#### Gap Tracking Structure
```javascript
{
  matches: [
    { pdfIndex: 0, transcriptionIndex: 12, word: "if", timing: {...} }
  ],
  gaps: [
    {
      type: "transcription_missing", // or "pdf_missing" 
      beforeMatch: { pdfIndex: 0, transcriptionIndex: 12, word: "if" },
      afterMatch: { pdfIndex: 3, transcriptionIndex: 15, word: "in" },
      gapWords: ["you", "believe"],
      gapIndices: [13, 14], // transcription indices or PDF indices
      sequenceId: "gap_001"
    }
  ]
}
```

**Output**: Detailed log of all gaps with context for pattern analysis.

### Pass 2: Gap Resolution (Future)

**Goal**: Analyze gap logs from Pass 1 and implement targeted solutions.

**Strategy**: 
- **Analyze gap patterns**: What types of mismatches actually occur?
- **Identify systematic variations**: "Bredensteiner"/"Brettensteiner", "that's"/"that is"
- **Design targeted solutions**: Fuzzy matching, contraction handling, etc.
- **Use anchor points**: Constrain gap resolution to areas between confirmed matches

**Note**: Implementation completely deferred until we have real gap data from Pass 1. The actual problems may be different than we expect.

## Implementation Plan

### Phase 1: Implement Pass 1 and Generate Gap Logs
- Modify `experiments/experiment-4-sequential-generation/build.js`
- Add transcription loading and Pass 1 matching logic
- **Skip Table of Contents during audio matching** - TOC is rendered normally but excluded from audio mapping since it's not in the transcription
- Implement gap detection starting from cover content flowing directly into preface
- Generate detailed gap logs with context

**Important**: The existing `build.js` renders TOC with special separators, but for audio mapping we must skip it entirely. The transcription flows directly from cover ("by Derek Bredensteiner") to preface ("Preface If...") with no TOC content in between.

### Phase 2: Analyze Real Gap Data  
- Run Pass 1 on actual transcription + PDF data
- Study gap logs to understand actual mismatch patterns
- Identify frequency and types of problems
- Document systematic variations found in real data

### Phase 3: Design Evidence-Based Solutions
- Based on Phase 2 analysis, design targeted gap resolution
- Implement only the gap handling that real data shows we need
- Test gap resolution against actual logged gaps
- Measure improvement in matching coverage

## Key Principles

1. **Use transcription as sequence guide** - transcription determines the order of `data-word` attributes
2. **PDF text as content source** - maintain original spelling and formatting in HTML output
3. **Evidence-based design** - analyze actual gaps before building complex matching logic
4. **Graceful degradation** - words that can't be matched simply don't get audio highlighting
5. **Sequential integrity** - maintain transcription order for timing-based highlighting

## Expected Outcome

Clean, sequential audio highlighting where:
- Matched words get precise timing data
- Unmatched words appear normally without highlighting
- No word jumping or duplicate highlighting issues
- Preserves all original book content and formatting

## Potential Starting Point for Consideration

The next instance may want to:

1. **Read this architecture document** to understand the two-pass approach and gap detection strategy
2. **Examine `experiments/experiment-4-sequential-generation/build.js`** to see what modifications have already been started (transcription loading, basic structure)
3. **Understand the existing build process** by studying how the original `build.js` works:
   - How it processes chapters and renders TOC
   - Where `formatParagraph` gets called during HTML generation  
   - How cover content flows into preface content
4. **Implement Pass 1 logic** in the `formatParagraphWithAudio` function:
   - Add logic to skip TOC during audio mapping
   - Implement "next 1-10 words" matching window for both directions
   - Add proper gap detection and logging with anchor point context
   - Replace current flawed matching approach with systematic gap tracking
5. **Test and analyze** by running the build script and examining the gap logs produced
6. **Use gap analysis** to understand what actual alignment problems exist before designing solutions

The foundation has been laid but the core matching logic needs to be implemented according to the two-pass strategy outlined above.