# Audio Mapping Architecture

## Core Problem

Map transcription words (with timing data) to PDF text content to enable word-by-word audio highlighting. The challenge is that transcription and written text don't align perfectly due to:

1. **Words in transcription but not in PDF text** (filler words, mispronunciations)
2. **Words in PDF text but not in transcription** (punctuation, unspoken formatting)  
3. **Different word forms/variations** ("Bredensteiner" vs "Brettensteiner", "that's" vs "that is")

## Proposed Multi-Pass Solution

### Pass 1: Initial Matching and Gap Analysis

**Goal**: Identify clean matches and catalog gaps for further analysis.

**Process**:
1. **Simple exact matching** with basic normalization (lowercase, remove punctuation)
2. **Assign sequential numbers** to cleanly matched words
3. **Record gaps** on both sides between matched anchor points

**Data Structure**:
```javascript
{
  matches: [
    { pdfIndex: 0, transcriptionIndex: 12, word: "if", timing: {...} },
    { pdfIndex: 3, transcriptionIndex: 15, word: "in", timing: {...} }
  ],
  gaps: [
    {
      beforeAnchor: { pdfIndex: 0, transcriptionIndex: 12 },
      afterAnchor: { pdfIndex: 3, transcriptionIndex: 15 },
      pdfGap: ["you", "believe"],          // words 1-2 in PDF
      transcriptionGap: ["you", "believe"] // words 13-14 in transcription
    }
  ]
}
```

**Output**: Gap analysis showing alignment patterns and mismatch types.

### Pass 2: Gap Resolution (Future)

**Goal**: Apply fuzzy matching and multi-word alignment to resolve gaps.

**Strategy**: 
- Use matched anchor points to constrain gap resolution
- Apply fuzzy matching within gap boundaries
- Handle multi-word transformations ("that's" ↔ "that is")

**Note**: Implementation deferred until we analyze actual gap patterns from Pass 1.

## Implementation Plan

### Phase 1: Build Integration
- Modify `experiments/experiment-4-sequential-generation/build.js`
- Add transcription loading
- Implement Pass 1 matching in `formatParagraph` for PREFACE chapter
- Generate gap analysis data

### Phase 2: Gap Analysis
- Run Pass 1 on actual transcription + PDF data
- Analyze gap patterns and frequency
- Identify common mismatch types
- Design targeted solutions for observed patterns

### Phase 3: Gap Resolution (Future)
- Implement Pass 2 based on actual gap analysis
- Add fuzzy matching for systematic variations
- Handle multi-word alignments
- Optimize for observed mismatch patterns

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