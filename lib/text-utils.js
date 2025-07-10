/**
 * Text processing utilities for audio-HTML coordination
 * 
 * Handles the complex task of normalizing and matching text between:
 * - Transcribed speech (from Whisper API)
 * - Written content (from PDF extraction)
 * - HTML formatting requirements
 */

/**
 * Configuration for text normalization
 */
const NORMALIZATION_CONFIG = {
    // Common contractions that appear differently in speech vs text
    contractions: {
        "can't": "cannot",
        "won't": "will not", 
        "n't": " not",
        "'ll": " will",
        "'re": " are",
        "'ve": " have",
        "'d": " would",
        "'m": " am",
        "'s": " is", // Note: Also possessive, context-dependent
    },
    
    // Punctuation to remove for matching (but preserve in display)
    removePunctuation: /[.,!?;:"""''()—–\-\[\]{}]/g,
    
    // Whitespace normalization
    normalizeWhitespace: /\s+/g,
    
    // Common word variations between speech and text
    speechVariations: {
        "gonna": "going to",
        "wanna": "want to",
        "gotta": "got to",
        "kinda": "kind of",
        "sorta": "sort of"
    },
    
    // Numbers that might be transcribed differently
    numberVariations: {
        "one": "1",
        "two": "2", 
        "three": "3",
        "four": "4",
        "five": "5",
        "six": "6",
        "seven": "7",
        "eight": "8", 
        "nine": "9",
        "ten": "10"
    }
};

/**
 * Core text normalization class
 */
class TextNormalizer {
    constructor(config = NORMALIZATION_CONFIG) {
        this.config = config;
    }
    
    /**
     * Normalize text for matching purposes (aggressive normalization)
     */
    normalizeForMatching(text) {
        if (!text) return '';
        
        let normalized = text.toLowerCase();
        
        // Handle contractions
        for (const [contraction, expansion] of Object.entries(this.config.contractions)) {
            normalized = normalized.replace(new RegExp(contraction, 'gi'), expansion);
        }
        
        // Handle speech variations
        for (const [speech, standard] of Object.entries(this.config.speechVariations)) {
            normalized = normalized.replace(new RegExp(`\\b${speech}\\b`, 'gi'), standard);
        }
        
        // Handle number variations
        for (const [word, number] of Object.entries(this.config.numberVariations)) {
            normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'gi'), number);
        }
        
        // Remove punctuation
        normalized = normalized.replace(this.config.removePunctuation, '');
        
        // Normalize whitespace
        normalized = normalized.replace(this.config.normalizeWhitespace, ' ').trim();
        
        return normalized;
    }
    
    /**
     * Light normalization for display purposes (preserve readability)
     */
    normalizeForDisplay(text) {
        if (!text) return '';
        
        // Only normalize whitespace for display
        return text.replace(this.config.normalizeWhitespace, ' ').trim();
    }
    
    /**
     * Extract words from text with position information
     */
    extractWords(text) {
        if (!text) return [];
        
        const words = [];
        const normalizedText = this.normalizeForMatching(text);
        const displayText = this.normalizeForDisplay(text);
        
        // Split on whitespace and track positions
        const normalizedWords = normalizedText.split(/\s+/).filter(w => w.length > 0);
        const displayWords = displayText.split(/\s+/).filter(w => w.length > 0);
        
        // Create word objects with both normalized and display versions
        for (let i = 0; i < Math.max(normalizedWords.length, displayWords.length); i++) {
            const normalizedWord = normalizedWords[i] || '';
            const displayWord = displayWords[i] || normalizedWord;
            
            if (normalizedWord) {
                words.push({
                    normalized: normalizedWord,
                    display: displayWord,
                    position: i,
                    originalText: text
                });
            }
        }
        
        return words;
    }
    
    /**
     * Split text into sentences with word-level breakdown
     */
    extractSentences(text) {
        if (!text) return [];
        
        // Split on sentence boundaries (basic implementation)
        const sentenceBoundaries = /[.!?]+\s+/g;
        const sentences = [];
        let lastIndex = 0;
        let match;
        
        while ((match = sentenceBoundaries.exec(text)) !== null) {
            const sentenceText = text.substring(lastIndex, match.index + match[0].length).trim();
            if (sentenceText) {
                sentences.push({
                    text: sentenceText,
                    startPosition: lastIndex,
                    endPosition: match.index + match[0].length,
                    words: this.extractWords(sentenceText)
                });
            }
            lastIndex = match.index + match[0].length;
        }
        
        // Handle final sentence if no trailing punctuation
        if (lastIndex < text.length) {
            const sentenceText = text.substring(lastIndex).trim();
            if (sentenceText) {
                sentences.push({
                    text: sentenceText,
                    startPosition: lastIndex,
                    endPosition: text.length,
                    words: this.extractWords(sentenceText)
                });
            }
        }
        
        return sentences;
    }
    
    /**
     * Calculate similarity between two text strings
     */
    calculateSimilarity(text1, text2) {
        const norm1 = this.normalizeForMatching(text1);
        const norm2 = this.normalizeForMatching(text2);
        
        if (norm1 === norm2) return 1.0;
        if (!norm1 || !norm2) return 0.0;
        
        // Use Jaccard similarity for word-level comparison
        const words1 = new Set(norm1.split(/\s+/));
        const words2 = new Set(norm2.split(/\s+/));
        
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        
        return intersection.size / union.size;
    }
}

/**
 * Utility for cleaning HTML content to extract plain text
 */
class HTMLTextExtractor {
    constructor() {
        this.normalizer = new TextNormalizer();
    }
    
    /**
     * Extract plain text from HTML, preserving structure information
     */
    extractText(html) {
        if (!html) return '';
        
        // Remove HTML tags but preserve some structure
        let text = html
            .replace(/<br\s*\/?>/gi, ' ') // Convert <br> to space
            .replace(/<\/p>/gi, '\n') // Convert </p> to newline
            .replace(/<\/h[1-6]>/gi, '\n') // Convert heading endings to newline
            .replace(/<[^>]*>/g, '') // Remove all other HTML tags
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
        
        return this.normalizer.normalizeForDisplay(text);
    }
    
    /**
     * Extract text with word position mapping to original HTML
     */
    extractWordsWithPositions(html) {
        const plainText = this.extractText(html);
        const words = this.normalizer.extractWords(plainText);
        
        // TODO: Add HTML position mapping for more precise alignment
        return {
            plainText,
            words,
            originalHTML: html
        };
    }
}

/**
 * Utility for processing transcription data
 */
class TranscriptionProcessor {
    constructor() {
        this.normalizer = new TextNormalizer();
    }
    
    /**
     * Process raw transcription data from Whisper API
     */
    processWhisperData(transcriptionData) {
        if (!transcriptionData || !transcriptionData.words) {
            throw new Error('Invalid transcription data');
        }
        
        const processedWords = transcriptionData.words.map((word, index) => ({
            text: word.word,
            normalizedText: this.normalizer.normalizeForMatching(word.word),
            start: parseFloat(word.start),
            end: parseFloat(word.end),
            index: index,
            confidence: word.confidence || null
        }));
        
        return {
            text: transcriptionData.text,
            duration: transcriptionData.duration,
            language: transcriptionData.language || 'english',
            words: processedWords,
            totalWords: processedWords.length
        };
    }
    
    /**
     * Group transcription words into logical segments
     */
    segmentTranscription(processedTranscription, segmentDuration = 10.0) {
        const segments = [];
        let currentSegment = [];
        let segmentStart = 0;
        
        for (const word of processedTranscription.words) {
            if (word.start - segmentStart > segmentDuration && currentSegment.length > 0) {
                // Start new segment
                segments.push({
                    words: [...currentSegment],
                    startTime: segmentStart,
                    endTime: currentSegment[currentSegment.length - 1].end,
                    text: currentSegment.map(w => w.text).join(' ')
                });
                
                currentSegment = [word];
                segmentStart = word.start;
            } else {
                currentSegment.push(word);
            }
        }
        
        // Add final segment
        if (currentSegment.length > 0) {
            segments.push({
                words: [...currentSegment],
                startTime: segmentStart,
                endTime: currentSegment[currentSegment.length - 1].end,
                text: currentSegment.map(w => w.text).join(' ')
            });
        }
        
        return segments;
    }
    
    /**
     * Find potential sentence boundaries in transcription
     */
    detectSentenceBoundaries(processedTranscription, pauseThreshold = 0.5) {
        const boundaries = [];
        
        for (let i = 1; i < processedTranscription.words.length; i++) {
            const prevWord = processedTranscription.words[i - 1];
            const currWord = processedTranscription.words[i];
            
            const pause = currWord.start - prevWord.end;
            
            if (pause > pauseThreshold) {
                boundaries.push({
                    position: i,
                    pauseDuration: pause,
                    beforeWord: prevWord,
                    afterWord: currWord
                });
            }
        }
        
        return boundaries;
    }
}

/**
 * Main utility class that coordinates text processing
 */
class TextProcessingUtils {
    constructor() {
        this.normalizer = new TextNormalizer();
        this.htmlExtractor = new HTMLTextExtractor();
        this.transcriptionProcessor = new TranscriptionProcessor();
    }
    
    /**
     * Process content and transcription for alignment
     */
    prepareForAlignment(htmlContent, transcriptionData) {
        // Extract text from HTML
        const contentData = this.htmlExtractor.extractWordsWithPositions(htmlContent);
        
        // Process transcription
        const processedTranscription = this.transcriptionProcessor.processWhisperData(transcriptionData);
        
        // Extract sentences from content
        const sentences = this.normalizer.extractSentences(contentData.plainText);
        
        return {
            content: {
                html: htmlContent,
                plainText: contentData.plainText,
                words: contentData.words,
                sentences: sentences
            },
            transcription: processedTranscription,
            stats: {
                contentWords: contentData.words.length,
                transcriptionWords: processedTranscription.words.length,
                sentences: sentences.length
            }
        };
    }
    
    /**
     * Validate alignment quality
     */
    validateAlignment(contentWords, transcriptionWords) {
        const validation = {
            isValid: true,
            warnings: [],
            errors: [],
            stats: {}
        };
        
        // Check word count similarity
        const wordCountRatio = transcriptionWords.length / contentWords.length;
        validation.stats.wordCountRatio = wordCountRatio;
        
        if (wordCountRatio < 0.8 || wordCountRatio > 1.2) {
            validation.warnings.push(`Word count mismatch: Content has ${contentWords.length} words, transcription has ${transcriptionWords.length} words (ratio: ${wordCountRatio.toFixed(2)})`);
        }
        
        // Check for common word overlap
        const contentWordSet = new Set(contentWords.map(w => w.normalized));
        const transcriptionWordSet = new Set(transcriptionWords.map(w => w.normalizedText));
        
        const overlap = new Set([...contentWordSet].filter(x => transcriptionWordSet.has(x)));
        const overlapRatio = overlap.size / Math.max(contentWordSet.size, transcriptionWordSet.size);
        validation.stats.wordOverlapRatio = overlapRatio;
        
        if (overlapRatio < 0.7) {
            validation.warnings.push(`Low word overlap: ${(overlapRatio * 100).toFixed(1)}% common words`);
        }
        
        // Check transcription duration reasonableness
        if (transcriptionWords.length > 0) {
            const totalDuration = Math.max(...transcriptionWords.map(w => w.end));
            const wordsPerMinute = (transcriptionWords.length / totalDuration) * 60;
            validation.stats.wordsPerMinute = wordsPerMinute;
            
            if (wordsPerMinute < 100 || wordsPerMinute > 250) {
                validation.warnings.push(`Unusual speaking rate: ${wordsPerMinute.toFixed(1)} words per minute`);
            }
        }
        
        validation.isValid = validation.errors.length === 0;
        return validation;
    }
}

module.exports = {
    TextNormalizer,
    HTMLTextExtractor,
    TranscriptionProcessor,
    TextProcessingUtils,
    NORMALIZATION_CONFIG
};