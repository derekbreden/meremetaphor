/**
 * Advanced word extraction and positioning system
 * 
 * Handles the complex task of:
 * - Extracting words from various sources (HTML, plain text, transcription)
 * - Maintaining position information for accurate mapping
 * - Supporting different extraction strategies for different content types
 * - Providing utilities for word-level alignment
 */

const { TextNormalizer, HTMLTextExtractor } = require('./text-utils');
const { Word } = require('./data-structures');

/**
 * Configuration for different extraction strategies
 */
const EXTRACTION_CONFIG = {
    strategies: {
        // Conservative: Only extract clear word boundaries
        conservative: {
            splitPattern: /\s+/,
            minWordLength: 1,
            preservePunctuation: true,
            handleContractions: false
        },
        
        // Aggressive: More thorough word splitting
        aggressive: {
            splitPattern: /[\s\-—–]+/,
            minWordLength: 1,
            preservePunctuation: false,
            handleContractions: true
        },
        
        // Transcription-optimized: Match speech patterns
        transcription: {
            splitPattern: /\s+/,
            minWordLength: 1,
            preservePunctuation: false,
            handleContractions: true,
            normalizeNumbers: true
        }
    },
    
    // Patterns for different content types
    contentTypes: {
        paragraph: {
            sentenceBoundaries: /[.!?]+\s+/g,
            preserveFormatting: true
        },
        quote: {
            sentenceBoundaries: /[.!?]+\s+/g,
            preserveFormatting: true,
            indentationAware: true
        },
        heading: {
            sentenceBoundaries: null, // Headings typically don't have sentence structure
            preserveFormatting: true
        }
    }
};

/**
 * Represents a word extraction result with rich metadata
 */
class ExtractedWord {
    constructor(text, position, options = {}) {
        this.text = text;
        this.position = position; // Position within source text
        this.normalizedText = options.normalizedText || text.toLowerCase();
        this.originalContext = options.originalContext || null;
        this.punctuation = options.punctuation || null;
        this.confidence = options.confidence || 1.0;
        this.metadata = options.metadata || {};
        
        // Source tracking
        this.sourceType = options.sourceType || 'unknown'; // 'html', 'text', 'transcription'
        this.sourceElement = options.sourceElement || null; // For HTML sources
        this.sourceRange = options.sourceRange || null; // Character range in source
    }
    
    /**
     * Convert to our standard Word data structure
     */
    toWord(transcriptionIndex = null) {
        return new Word(this.text, {
            transcriptionIndex,
            confidence: this.confidence,
            metadata: {
                ...this.metadata,
                sourceType: this.sourceType,
                position: this.position,
                normalizedText: this.normalizedText,
                punctuation: this.punctuation
            }
        });
    }
}

/**
 * Advanced word extractor with multiple strategies
 */
class WordExtractor {
    constructor(strategy = 'conservative') {
        this.strategy = EXTRACTION_CONFIG.strategies[strategy] || EXTRACTION_CONFIG.strategies.conservative;
        this.normalizer = new TextNormalizer();
        this.htmlExtractor = new HTMLTextExtractor();
    }
    
    /**
     * Extract words from plain text with position tracking
     */
    extractFromText(text, contentType = 'paragraph') {
        if (!text || typeof text !== 'string') {
            return [];
        }
        
        const words = [];
        const typeConfig = EXTRACTION_CONFIG.contentTypes[contentType] || EXTRACTION_CONFIG.contentTypes.paragraph;
        
        // Split text preserving position information
        let currentPosition = 0;
        const segments = this._splitWithPositions(text, this.strategy.splitPattern);
        
        for (const segment of segments) {
            if (this._isValidWord(segment.text)) {
                const word = this._createExtractedWord(segment.text, currentPosition, segment.range, {
                    sourceType: 'text',
                    contentType,
                    originalContext: text
                });
                words.push(word);
            }
            currentPosition = segment.range.end;
        }
        
        return words;
    }
    
    /**
     * Extract words from HTML content with DOM awareness
     */
    extractFromHTML(html, options = {}) {
        const preserveStructure = options.preserveStructure !== false;
        const includeAttributes = options.includeAttributes || false;
        
        if (preserveStructure) {
            return this._extractFromHTMLStructured(html, options);
        } else {
            // Simple extraction - convert to text first
            const plainText = this.htmlExtractor.extractText(html);
            return this.extractFromText(plainText, 'paragraph').map(word => {
                word.sourceType = 'html';
                word.metadata.originalHTML = html;
                return word;
            });
        }
    }
    
    /**
     * Extract words from transcription data with timing information
     */
    extractFromTranscription(transcriptionData) {
        if (!transcriptionData || !transcriptionData.words) {
            throw new Error('Invalid transcription data');
        }
        
        return transcriptionData.words.map((word, index) => {
            const extractedWord = new ExtractedWord(
                word.word || word.text,
                index,
                {
                    normalizedText: this.normalizer.normalizeForMatching(word.word || word.text),
                    confidence: word.confidence || null,
                    sourceType: 'transcription',
                    metadata: {
                        timing: {
                            start: parseFloat(word.start),
                            end: parseFloat(word.end)
                        },
                        transcriptionIndex: index
                    }
                }
            );
            
            return extractedWord;
        });
    }
    
    /**
     * Extract words maintaining HTML structure information
     */
    _extractFromHTMLStructured(html, options) {
        // This is a simplified version - a full implementation would use a proper HTML parser
        const words = [];
        
        // Remove HTML tags but track their positions
        const textWithMarkers = this._htmlToTextWithMarkers(html);
        const textWords = this.extractFromText(textWithMarkers.text);
        
        // Map text positions back to HTML positions
        for (const word of textWords) {
            word.sourceType = 'html';
            word.metadata.htmlStructure = this._findHTMLContext(word.position, textWithMarkers.markers);
            words.push(word);
        }
        
        return words;
    }
    
    /**
     * Split text while preserving position information
     */
    _splitWithPositions(text, splitPattern) {
        const segments = [];
        let lastIndex = 0;
        let match;
        
        // Create a global version of the pattern
        const globalPattern = new RegExp(splitPattern.source, 'g');
        
        while ((match = globalPattern.exec(text)) !== null) {
            // Add text before the separator
            if (match.index > lastIndex) {
                const segmentText = text.substring(lastIndex, match.index);
                segments.push({
                    text: segmentText,
                    range: { start: lastIndex, end: match.index },
                    type: 'word'
                });
            }
            
            lastIndex = match.index + match[0].length;
        }
        
        // Add remaining text
        if (lastIndex < text.length) {
            const segmentText = text.substring(lastIndex);
            segments.push({
                text: segmentText,
                range: { start: lastIndex, end: text.length },
                type: 'word'
            });
        }
        
        return segments.filter(segment => segment.text.trim().length > 0);
    }
    
    /**
     * Check if a text segment qualifies as a valid word
     */
    _isValidWord(text) {
        if (!text || text.length < this.strategy.minWordLength) {
            return false;
        }
        
        // Skip pure punctuation or whitespace
        if (/^[\s\.,!?;:"""''()—–\-]*$/.test(text)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Create an ExtractedWord instance with proper metadata
     */
    _createExtractedWord(text, position, range, options = {}) {
        const cleanText = this._cleanWordText(text);
        const punctuation = this._extractPunctuation(text);
        
        return new ExtractedWord(cleanText, position, {
            normalizedText: this.normalizer.normalizeForMatching(cleanText),
            punctuation: punctuation,
            sourceRange: range,
            ...options
        });
    }
    
    /**
     * Clean word text according to strategy
     */
    _cleanWordText(text) {
        let cleaned = text;
        
        if (!this.strategy.preservePunctuation) {
            cleaned = cleaned.replace(/[.,!?;:"""''()—–\-]/g, '');
        }
        
        if (this.strategy.handleContractions) {
            // Handle common contractions
            cleaned = cleaned.replace(/n't/g, ' not');
            cleaned = cleaned.replace(/'ll/g, ' will');
            cleaned = cleaned.replace(/'re/g, ' are');
            // Add more as needed
        }
        
        return cleaned.trim();
    }
    
    /**
     * Extract punctuation from word text
     */
    _extractPunctuation(text) {
        const punctuation = text.match(/[.,!?;:"""''()—–\-]/g);
        return punctuation ? punctuation.join('') : null;
    }
    
    /**
     * Convert HTML to text while tracking element boundaries
     */
    _htmlToTextWithMarkers(html) {
        // Simplified implementation - would use proper HTML parser in production
        const markers = [];
        let text = html;
        let markerIndex = 0;
        
        // Track important HTML elements
        const elementPattern = /<(\w+)[^>]*>/g;
        let match;
        
        while ((match = elementPattern.exec(html)) !== null) {
            markers.push({
                position: match.index,
                element: match[1],
                type: 'open',
                id: markerIndex++
            });
        }
        
        // Convert to plain text
        text = this.htmlExtractor.extractText(html);
        
        return { text, markers };
    }
    
    /**
     * Find HTML context for a text position
     */
    _findHTMLContext(position, markers) {
        // Find the closest HTML element markers
        const context = {
            element: null,
            attributes: {},
            depth: 0
        };
        
        // Simple implementation - would be more sophisticated in production
        for (const marker of markers) {
            if (marker.position <= position) {
                if (marker.type === 'open') {
                    context.element = marker.element;
                    context.depth++;
                }
            }
        }
        
        return context;
    }
}

/**
 * Specialized extractor for different content types
 */
class ContextAwareExtractor {
    constructor() {
        this.extractor = new WordExtractor();
        this.normalizer = new TextNormalizer();
    }
    
    /**
     * Extract words from a specific content section with context awareness
     */
    extractFromSection(sectionData, contentType) {
        switch (contentType) {
            case 'paragraph':
                return this._extractFromParagraph(sectionData);
            case 'quote':
                return this._extractFromQuote(sectionData);
            case 'heading':
                return this._extractFromHeading(sectionData);
            default:
                return this._extractFromParagraph(sectionData);
        }
    }
    
    /**
     * Extract words from paragraph content
     */
    _extractFromParagraph(sectionData) {
        const sentences = this.normalizer.extractSentences(sectionData.text);
        const words = [];
        let wordIndex = 0;
        
        for (const sentence of sentences) {
            const sentenceWords = this.extractor.extractFromText(sentence.text, 'paragraph');
            
            for (const word of sentenceWords) {
                word.metadata.sentence = sentence.text;
                word.metadata.sentencePosition = wordIndex;
                word.metadata.globalPosition = words.length;
                words.push(word);
                wordIndex++;
            }
        }
        
        return words;
    }
    
    /**
     * Extract words from quote content (special handling for attribution)
     */
    _extractFromQuote(sectionData) {
        // Handle quotes differently - they might have attribution
        const words = this.extractor.extractFromText(sectionData.text, 'quote');
        
        // Mark words that might be attribution (starting with "—")
        words.forEach(word => {
            if (word.text.startsWith('—') || word.text.startsWith('-')) {
                word.metadata.isAttribution = true;
            }
        });
        
        return words;
    }
    
    /**
     * Extract words from heading content
     */
    _extractFromHeading(sectionData) {
        const words = this.extractor.extractFromText(sectionData.text, 'heading');
        
        // Mark all words as heading words
        words.forEach(word => {
            word.metadata.isHeading = true;
        });
        
        return words;
    }
    
    /**
     * Extract words from cover elements (title, subtitle, author)
     */
    extractFromCoverElement(element) {
        const words = this.extractor.extractFromText(element.text, 'heading');
        
        words.forEach(word => {
            word.metadata.coverElementType = element.type;
            word.metadata.isCoverElement = true;
        });
        
        return words;
    }
}

/**
 * Utility for comparing and aligning word sequences
 */
class WordSequenceAligner {
    constructor() {
        this.normalizer = new TextNormalizer();
    }
    
    /**
     * Find the best alignment between two word sequences
     */
    alignSequences(sourceWords, targetWords, options = {}) {
        const maxDistance = options.maxDistance || 3;
        const similarity = options.similarity || 0.8;
        
        const alignments = [];
        let sourceIndex = 0;
        let targetIndex = 0;
        
        while (sourceIndex < sourceWords.length && targetIndex < targetWords.length) {
            const sourceWord = sourceWords[sourceIndex];
            const targetWord = targetWords[targetIndex];
            
            if (this._wordsMatch(sourceWord, targetWord, similarity)) {
                // Direct match
                alignments.push({
                    sourceIndex,
                    targetIndex,
                    confidence: 1.0,
                    type: 'exact'
                });
                sourceIndex++;
                targetIndex++;
            } else {
                // Look for nearby matches
                const nearbyMatch = this._findNearbyMatch(
                    sourceWords, sourceIndex,
                    targetWords, targetIndex,
                    maxDistance, similarity
                );
                
                if (nearbyMatch) {
                    alignments.push(nearbyMatch);
                    sourceIndex = nearbyMatch.sourceIndex + 1;
                    targetIndex = nearbyMatch.targetIndex + 1;
                } else {
                    // Skip the word that couldn't be matched
                    if (sourceWords.length - sourceIndex > targetWords.length - targetIndex) {
                        sourceIndex++; // More source words remaining
                    } else {
                        targetIndex++; // More target words remaining
                    }
                }
            }
        }
        
        return {
            alignments,
            coverage: {
                source: alignments.length / sourceWords.length,
                target: alignments.length / targetWords.length
            }
        };
    }
    
    /**
     * Check if two words match according to criteria
     */
    _wordsMatch(word1, word2, threshold = 0.8) {
        const norm1 = word1.normalizedText || this.normalizer.normalizeForMatching(word1.text);
        const norm2 = word2.normalizedText || this.normalizer.normalizeForMatching(word2.text);
        
        if (norm1 === norm2) return true;
        
        // Calculate string similarity
        const similarity = this.normalizer.calculateSimilarity(norm1, norm2);
        return similarity >= threshold;
    }
    
    /**
     * Find a nearby match within a distance window
     */
    _findNearbyMatch(sourceWords, sourceIndex, targetWords, targetIndex, maxDistance, similarity) {
        // Look ahead in both sequences for a match
        for (let distance = 1; distance <= maxDistance; distance++) {
            // Check source sequence ahead
            if (sourceIndex + distance < sourceWords.length) {
                const sourceWord = sourceWords[sourceIndex + distance];
                if (this._wordsMatch(sourceWord, targetWords[targetIndex], similarity)) {
                    return {
                        sourceIndex: sourceIndex + distance,
                        targetIndex,
                        confidence: 1.0 - (distance * 0.1),
                        type: 'source_skip',
                        skippedWords: distance
                    };
                }
            }
            
            // Check target sequence ahead
            if (targetIndex + distance < targetWords.length) {
                const targetWord = targetWords[targetIndex + distance];
                if (this._wordsMatch(sourceWords[sourceIndex], targetWord, similarity)) {
                    return {
                        sourceIndex,
                        targetIndex: targetIndex + distance,
                        confidence: 1.0 - (distance * 0.1),
                        type: 'target_skip',
                        skippedWords: distance
                    };
                }
            }
        }
        
        return null;
    }
}

module.exports = {
    WordExtractor,
    ContextAwareExtractor,
    WordSequenceAligner,
    ExtractedWord,
    EXTRACTION_CONFIG
};