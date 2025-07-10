/**
 * Advanced fuzzy matching algorithms for transcription-to-text alignment
 * 
 * Implements multiple sophisticated matching strategies:
 * - String similarity algorithms (Levenshtein, Jaro-Winkler)
 * - Sequence alignment (dynamic programming)
 * - Contextual matching (surrounding words)
 * - Phonetic matching (for speech variations)
 * - Statistical validation
 */

const { TextNormalizer } = require('./text-utils');

/**
 * Configuration for different matching algorithms
 */
const MATCHING_CONFIG = {
    algorithms: {
        levenshtein: {
            threshold: 0.8,
            weight: 0.3
        },
        jaroWinkler: {
            threshold: 0.85,
            weight: 0.4
        },
        contextual: {
            windowSize: 3,
            weight: 0.2
        },
        phonetic: {
            weight: 0.1
        }
    },
    
    // Global matching parameters
    globalParams: {
        minConfidence: 0.7,
        maxSkipDistance: 5,
        sequenceBonus: 0.1, // Bonus for maintaining word sequence
        penaltyForSkips: 0.05
    },
    
    // Different matching strategies for different content types
    strategies: {
        strict: {
            requireHighConfidence: true,
            minConfidence: 0.9,
            allowSkips: false
        },
        balanced: {
            requireHighConfidence: false,
            minConfidence: 0.7,
            allowSkips: true,
            maxSkips: 2
        },
        permissive: {
            requireHighConfidence: false,
            minConfidence: 0.5,
            allowSkips: true,
            maxSkips: 5
        }
    }
};

/**
 * String similarity algorithms
 */
class StringSimilarity {
    /**
     * Calculate Levenshtein distance (edit distance)
     */
    static levenshteinDistance(str1, str2) {
        const matrix = [];
        const len1 = str1.length;
        const len2 = str2.length;
        
        // Initialize matrix
        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }
        
        // Fill matrix
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,     // deletion
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j - 1] + cost // substitution
                );
            }
        }
        
        return matrix[len1][len2];
    }
    
    /**
     * Calculate Levenshtein similarity (normalized)
     */
    static levenshteinSimilarity(str1, str2) {
        if (!str1 || !str2) return 0;
        if (str1 === str2) return 1;
        
        const maxLen = Math.max(str1.length, str2.length);
        if (maxLen === 0) return 1;
        
        const distance = this.levenshteinDistance(str1, str2);
        return (maxLen - distance) / maxLen;
    }
    
    /**
     * Calculate Jaro similarity
     */
    static jaroSimilarity(str1, str2) {
        if (!str1 || !str2) return 0;
        if (str1 === str2) return 1;
        
        const len1 = str1.length;
        const len2 = str2.length;
        
        if (len1 === 0 && len2 === 0) return 1;
        if (len1 === 0 || len2 === 0) return 0;
        
        const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
        if (matchWindow < 0) return 0;
        
        const matches1 = new Array(len1).fill(false);
        const matches2 = new Array(len2).fill(false);
        
        let matches = 0;
        let transpositions = 0;
        
        // Find matches
        for (let i = 0; i < len1; i++) {
            const start = Math.max(0, i - matchWindow);
            const end = Math.min(i + matchWindow + 1, len2);
            
            for (let j = start; j < end; j++) {
                if (matches2[j] || str1[i] !== str2[j]) continue;
                matches1[i] = matches2[j] = true;
                matches++;
                break;
            }
        }
        
        if (matches === 0) return 0;
        
        // Count transpositions
        let k = 0;
        for (let i = 0; i < len1; i++) {
            if (!matches1[i]) continue;
            while (!matches2[k]) k++;
            if (str1[i] !== str2[k]) transpositions++;
            k++;
        }
        
        return (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
    }
    
    /**
     * Calculate Jaro-Winkler similarity (with prefix bonus)
     */
    static jaroWinklerSimilarity(str1, str2, prefixScale = 0.1) {
        const jaroSim = this.jaroSimilarity(str1, str2);
        if (jaroSim === 0) return 0;
        
        // Calculate common prefix length (up to 4 characters)
        let prefixLength = 0;
        const maxPrefix = Math.min(4, Math.min(str1.length, str2.length));
        
        for (let i = 0; i < maxPrefix; i++) {
            if (str1[i] === str2[i]) {
                prefixLength++;
            } else {
                break;
            }
        }
        
        return jaroSim + (prefixLength * prefixScale * (1 - jaroSim));
    }
    
    /**
     * Calculate combined similarity score
     */
    static combinedSimilarity(str1, str2, weights = { levenshtein: 0.4, jaroWinkler: 0.6 }) {
        const levSim = this.levenshteinSimilarity(str1, str2);
        const jaroSim = this.jaroWinklerSimilarity(str1, str2);
        
        return (levSim * weights.levenshtein) + (jaroSim * weights.jaroWinkler);
    }
}

/**
 * Phonetic matching for speech variations
 */
class PhoneticMatcher {
    constructor() {
        // Simple phonetic rules - could be enhanced with Soundex, Metaphone, etc.
        this.phoneticRules = [
            // Common speech variations
            { pattern: /ph/g, replacement: 'f' },
            { pattern: /gh/g, replacement: 'f' },
            { pattern: /ck/g, replacement: 'k' },
            { pattern: /c([eiy])/g, replacement: 's$1' },
            { pattern: /c/g, replacement: 'k' },
            { pattern: /q/g, replacement: 'k' },
            { pattern: /x/g, replacement: 'ks' },
            { pattern: /z/g, replacement: 's' },
            
            // Vowel reductions (common in speech)
            { pattern: /[aeiou]+/g, replacement: 'a' }, // Reduce vowel clusters
        ];
    }
    
    /**
     * Convert word to phonetic representation
     */
    toPhonetic(word) {
        if (!word) return '';
        
        let phonetic = word.toLowerCase();
        
        // Apply phonetic rules
        for (const rule of this.phoneticRules) {
            phonetic = phonetic.replace(rule.pattern, rule.replacement);
        }
        
        return phonetic;
    }
    
    /**
     * Calculate phonetic similarity
     */
    phoneticSimilarity(word1, word2) {
        const phonetic1 = this.toPhonetic(word1);
        const phonetic2 = this.toPhonetic(word2);
        
        if (phonetic1 === phonetic2) return 1.0;
        
        return StringSimilarity.jaroWinklerSimilarity(phonetic1, phonetic2);
    }
}

/**
 * Contextual matching using surrounding words
 */
class ContextualMatcher {
    constructor(windowSize = 3) {
        this.windowSize = windowSize;
        this.normalizer = new TextNormalizer();
    }
    
    /**
     * Get context window around a word position
     */
    getContext(words, position, windowSize = this.windowSize) {
        const start = Math.max(0, position - windowSize);
        const end = Math.min(words.length, position + windowSize + 1);
        
        return {
            before: words.slice(start, position),
            word: words[position],
            after: words.slice(position + 1, end),
            fullContext: words.slice(start, end)
        };
    }
    
    /**
     * Calculate contextual similarity between two word positions
     */
    contextualSimilarity(words1, pos1, words2, pos2) {
        const context1 = this.getContext(words1, pos1);
        const context2 = this.getContext(words2, pos2);
        
        // Compare surrounding words
        const beforeSim = this._compareWordSequences(context1.before, context2.before);
        const afterSim = this._compareWordSequences(context1.after, context2.after);
        
        // Weight: after context is slightly more important than before
        return (beforeSim * 0.4) + (afterSim * 0.6);
    }
    
    /**
     * Compare two sequences of words
     */
    _compareWordSequences(seq1, seq2) {
        if (seq1.length === 0 && seq2.length === 0) return 1.0;
        if (seq1.length === 0 || seq2.length === 0) return 0.0;
        
        const minLen = Math.min(seq1.length, seq2.length);
        let matches = 0;
        
        for (let i = 0; i < minLen; i++) {
            const word1 = this.normalizer.normalizeForMatching(seq1[i].text || seq1[i]);
            const word2 = this.normalizer.normalizeForMatching(seq2[i].text || seq2[i]);
            
            if (word1 === word2) {
                matches++;
            } else if (StringSimilarity.jaroWinklerSimilarity(word1, word2) > 0.8) {
                matches += 0.7; // Partial credit for similar words
            }
        }
        
        return matches / Math.max(seq1.length, seq2.length);
    }
}

/**
 * Sequence alignment algorithm for optimal word matching
 */
class SequenceAligner {
    constructor(config = MATCHING_CONFIG) {
        this.config = config;
        this.normalizer = new TextNormalizer();
        this.phonetic = new PhoneticMatcher();
        this.contextual = new ContextualMatcher();
    }
    
    /**
     * Align two sequences of words using dynamic programming
     */
    alignSequences(contentWords, transcriptionWords, strategy = 'balanced') {
        const strategyConfig = this.config.strategies[strategy] || this.config.strategies.balanced;
        
        // Create scoring matrix
        const matrix = this._createScoringMatrix(contentWords, transcriptionWords);
        
        // Find optimal alignment path
        const alignment = this._findOptimalPath(matrix, contentWords, transcriptionWords, strategyConfig);
        
        // Post-process and validate alignment
        const processedAlignment = this._postProcessAlignment(alignment, contentWords, transcriptionWords);
        
        return {
            alignment: processedAlignment,
            confidence: this._calculateOverallConfidence(processedAlignment),
            statistics: this._calculateAlignmentStatistics(processedAlignment, contentWords, transcriptionWords)
        };
    }
    
    /**
     * Create scoring matrix for dynamic programming alignment
     */
    _createScoringMatrix(contentWords, transcriptionWords) {
        const rows = contentWords.length + 1;
        const cols = transcriptionWords.length + 1;
        const matrix = [];
        
        // Initialize matrix
        for (let i = 0; i < rows; i++) {
            matrix[i] = new Array(cols).fill(0);
        }
        
        // Fill matrix with similarity scores
        for (let i = 1; i < rows; i++) {
            for (let j = 1; j < cols; j++) {
                const contentWord = contentWords[i - 1];
                const transcriptionWord = transcriptionWords[j - 1];
                
                const similarity = this._calculateWordSimilarity(
                    contentWord, transcriptionWord,
                    contentWords, i - 1,
                    transcriptionWords, j - 1
                );
                
                matrix[i][j] = similarity;
            }
        }
        
        return matrix;
    }
    
    /**
     * Calculate comprehensive similarity between two words
     */
    _calculateWordSimilarity(word1, word2, context1, pos1, context2, pos2) {
        const text1 = word1.text || word1;
        const text2 = word2.text || word2;
        
        const norm1 = this.normalizer.normalizeForMatching(text1);
        const norm2 = this.normalizer.normalizeForMatching(text2);
        
        // Exact match bonus
        if (norm1 === norm2) return 1.0;
        
        // Calculate component similarities
        const levenshtein = StringSimilarity.levenshteinSimilarity(norm1, norm2);
        const jaroWinkler = StringSimilarity.jaroWinklerSimilarity(norm1, norm2);
        const phonetic = this.phonetic.phoneticSimilarity(norm1, norm2);
        const contextual = this.contextual.contextualSimilarity(context1, pos1, context2, pos2);
        
        // Weighted combination
        const config = this.config.algorithms;
        const combined = (
            (levenshtein * config.levenshtein.weight) +
            (jaroWinkler * config.jaroWinkler.weight) +
            (phonetic * config.phonetic.weight) +
            (contextual * config.contextual.weight)
        );
        
        return combined;
    }
    
    /**
     * Find optimal alignment path using dynamic programming
     */
    _findOptimalPath(matrix, contentWords, transcriptionWords, strategyConfig) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        
        // DP table for optimal alignment
        const dp = [];
        const path = [];
        
        // Initialize DP table
        for (let i = 0; i < rows; i++) {
            dp[i] = new Array(cols).fill(0);
            path[i] = new Array(cols).fill(null);
        }
        
        // Fill DP table
        for (let i = 1; i < rows; i++) {
            for (let j = 1; j < cols; j++) {
                const matchScore = matrix[i][j];
                const deleteScore = dp[i - 1][j] - this.config.globalParams.penaltyForSkips;
                const insertScore = dp[i][j - 1] - this.config.globalParams.penaltyForSkips;
                const alignScore = dp[i - 1][j - 1] + matchScore;
                
                // Choose best option
                if (alignScore >= deleteScore && alignScore >= insertScore) {
                    dp[i][j] = alignScore;
                    path[i][j] = 'align';
                } else if (deleteScore >= insertScore) {
                    dp[i][j] = deleteScore;
                    path[i][j] = 'delete';
                } else {
                    dp[i][j] = insertScore;
                    path[i][j] = 'insert';
                }
            }
        }
        
        // Trace back optimal path
        return this._tracePath(path, matrix, contentWords, transcriptionWords, strategyConfig);
    }
    
    /**
     * Trace back optimal alignment path
     */
    _tracePath(path, matrix, contentWords, transcriptionWords, strategyConfig) {
        const alignment = [];
        let i = path.length - 1;
        let j = path[0].length - 1;
        
        while (i > 0 && j > 0) {
            const operation = path[i][j];
            
            if (operation === 'align') {
                const similarity = matrix[i][j];
                if (similarity >= strategyConfig.minConfidence) {
                    alignment.unshift({
                        contentIndex: i - 1,
                        transcriptionIndex: j - 1,
                        contentWord: contentWords[i - 1],
                        transcriptionWord: transcriptionWords[j - 1],
                        confidence: similarity,
                        type: 'match'
                    });
                }
                i--;
                j--;
            } else if (operation === 'delete') {
                // Content word without transcription match
                if (strategyConfig.allowSkips) {
                    alignment.unshift({
                        contentIndex: i - 1,
                        transcriptionIndex: null,
                        contentWord: contentWords[i - 1],
                        transcriptionWord: null,
                        confidence: 0,
                        type: 'skip_content'
                    });
                }
                i--;
            } else if (operation === 'insert') {
                // Transcription word without content match
                if (strategyConfig.allowSkips) {
                    alignment.unshift({
                        contentIndex: null,
                        transcriptionIndex: j - 1,
                        contentWord: null,
                        transcriptionWord: transcriptionWords[j - 1],
                        confidence: 0,
                        type: 'skip_transcription'
                    });
                }
                j--;
            }
        }
        
        return alignment;
    }
    
    /**
     * Post-process alignment to fix common issues
     */
    _postProcessAlignment(alignment, contentWords, transcriptionWords) {
        // Remove low-confidence matches if they break sequence
        const processed = [];
        let lastContentIndex = -1;
        let lastTranscriptionIndex = -1;
        
        for (const match of alignment) {
            if (match.type === 'match') {
                const contentGap = match.contentIndex - lastContentIndex - 1;
                const transcriptionGap = match.transcriptionIndex - lastTranscriptionIndex - 1;
                
                // Check for reasonable sequence progression
                if (contentGap <= this.config.globalParams.maxSkipDistance &&
                    transcriptionGap <= this.config.globalParams.maxSkipDistance) {
                    
                    processed.push(match);
                    lastContentIndex = match.contentIndex;
                    lastTranscriptionIndex = match.transcriptionIndex;
                } else if (match.confidence > 0.9) {
                    // Keep very high confidence matches even if they break sequence
                    processed.push(match);
                    lastContentIndex = match.contentIndex;
                    lastTranscriptionIndex = match.transcriptionIndex;
                }
            } else {
                processed.push(match);
            }
        }
        
        return processed;
    }
    
    /**
     * Calculate overall confidence for the alignment
     */
    _calculateOverallConfidence(alignment) {
        const matches = alignment.filter(a => a.type === 'match');
        if (matches.length === 0) return 0;
        
        const avgConfidence = matches.reduce((sum, match) => sum + match.confidence, 0) / matches.length;
        const coverageBonus = Math.min(matches.length / 50, 0.2); // Bonus for more matches
        
        return Math.min(avgConfidence + coverageBonus, 1.0);
    }
    
    /**
     * Calculate detailed alignment statistics
     */
    _calculateAlignmentStatistics(alignment, contentWords, transcriptionWords) {
        const matches = alignment.filter(a => a.type === 'match');
        const skippedContent = alignment.filter(a => a.type === 'skip_content');
        const skippedTranscription = alignment.filter(a => a.type === 'skip_transcription');
        
        return {
            totalMatches: matches.length,
            totalSkippedContent: skippedContent.length,
            totalSkippedTranscription: skippedTranscription.length,
            contentCoverage: matches.length / contentWords.length,
            transcriptionCoverage: matches.length / transcriptionWords.length,
            averageConfidence: matches.length > 0 ? 
                matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length : 0,
            highConfidenceMatches: matches.filter(m => m.confidence > 0.9).length,
            mediumConfidenceMatches: matches.filter(m => m.confidence > 0.7 && m.confidence <= 0.9).length,
            lowConfidenceMatches: matches.filter(m => m.confidence <= 0.7).length
        };
    }
}

/**
 * Main fuzzy matching coordinator
 */
class FuzzyMatcher {
    constructor(config = MATCHING_CONFIG) {
        this.config = config;
        this.aligner = new SequenceAligner(config);
        this.normalizer = new TextNormalizer();
    }
    
    /**
     * Match transcription words to content words
     */
    matchWords(contentWords, transcriptionWords, options = {}) {
        const strategy = options.strategy || 'balanced';
        const validateResults = options.validate !== false;
        
        console.log(`Matching ${contentWords.length} content words to ${transcriptionWords.length} transcription words...`);
        
        // Perform alignment
        const result = this.aligner.alignSequences(contentWords, transcriptionWords, strategy);
        
        // Validate if requested
        if (validateResults) {
            result.validation = this._validateResults(result, contentWords, transcriptionWords);
        }
        
        console.log(`Match complete: ${result.statistics.totalMatches} matches, ${(result.confidence * 100).toFixed(1)}% confidence`);
        
        return result;
    }
    
    /**
     * Validate matching results
     */
    _validateResults(result, contentWords, transcriptionWords) {
        const validation = {
            isValid: true,
            warnings: [],
            errors: [],
            recommendations: []
        };
        
        const stats = result.statistics;
        
        // Check coverage
        if (stats.contentCoverage < 0.8) {
            validation.warnings.push(`Low content coverage: ${(stats.contentCoverage * 100).toFixed(1)}%`);
        }
        
        if (stats.transcriptionCoverage < 0.8) {
            validation.warnings.push(`Low transcription coverage: ${(stats.transcriptionCoverage * 100).toFixed(1)}%`);
        }
        
        // Check confidence distribution
        if (stats.lowConfidenceMatches / stats.totalMatches > 0.3) {
            validation.warnings.push(`High proportion of low-confidence matches: ${stats.lowConfidenceMatches}/${stats.totalMatches}`);
            validation.recommendations.push('Consider using more permissive matching strategy or manual review');
        }
        
        // Check for large gaps
        const alignment = result.alignment;
        for (let i = 1; i < alignment.length; i++) {
            const prev = alignment[i - 1];
            const curr = alignment[i];
            
            if (prev.type === 'match' && curr.type === 'match') {
                const contentGap = curr.contentIndex - prev.contentIndex - 1;
                const transcriptionGap = curr.transcriptionIndex - prev.transcriptionIndex - 1;
                
                if (Math.abs(contentGap - transcriptionGap) > 3) {
                    validation.warnings.push(`Large alignment gap detected at content index ${curr.contentIndex}`);
                }
            }
        }
        
        // Overall validation
        if (result.confidence < 0.6) {
            validation.errors.push('Overall confidence too low for reliable alignment');
            validation.isValid = false;
        }
        
        return validation;
    }
    
    /**
     * Get matching suggestions for manual review
     */
    getSuggestions(contentWords, transcriptionWords, options = {}) {
        const windowSize = options.windowSize || 5;
        const suggestions = [];
        
        // Find potential matches for unmatched words
        const result = this.matchWords(contentWords, transcriptionWords, options);
        const matched = new Set();
        
        result.alignment.forEach(match => {
            if (match.type === 'match') {
                matched.add(match.contentIndex);
            }
        });
        
        // Suggest matches for unmatched content words
        for (let i = 0; i < contentWords.length; i++) {
            if (!matched.has(i)) {
                const contentWord = contentWords[i];
                const candidates = this._findCandidates(contentWord, transcriptionWords, i, windowSize);
                
                if (candidates.length > 0) {
                    suggestions.push({
                        contentIndex: i,
                        contentWord: contentWord,
                        candidates: candidates.slice(0, 3) // Top 3 candidates
                    });
                }
            }
        }
        
        return suggestions;
    }
    
    /**
     * Find candidate matches for a word
     */
    _findCandidates(targetWord, candidateWords, targetIndex, windowSize) {
        const candidates = [];
        
        const startIndex = Math.max(0, targetIndex - windowSize);
        const endIndex = Math.min(candidateWords.length, targetIndex + windowSize);
        
        for (let i = startIndex; i < endIndex; i++) {
            const candidateWord = candidateWords[i];
            const similarity = this.aligner._calculateWordSimilarity(
                targetWord, candidateWord, [], 0, [], 0 // Simplified context for suggestions
            );
            
            if (similarity > 0.5) {
                candidates.push({
                    index: i,
                    word: candidateWord,
                    similarity: similarity,
                    distance: Math.abs(i - targetIndex)
                });
            }
        }
        
        // Sort by similarity (descending) and distance (ascending)
        return candidates.sort((a, b) => {
            const simDiff = b.similarity - a.similarity;
            if (Math.abs(simDiff) < 0.1) {
                return a.distance - b.distance; // Prefer closer matches if similarity is close
            }
            return simDiff;
        });
    }
}

module.exports = {
    FuzzyMatcher,
    SequenceAligner,
    StringSimilarity,
    PhoneticMatcher,
    ContextualMatcher,
    MATCHING_CONFIG
};