/**
 * Comprehensive validation and quality control utilities
 * 
 * Provides multi-level validation for:
 * - Data structure integrity
 * - Audio-text alignment quality
 * - Content consistency
 * - Performance metrics
 * - User experience impact assessment
 */

const { TextNormalizer } = require('./text-utils');
const { StringSimilarity } = require('./fuzzy-matcher');

/**
 * Validation configuration and thresholds
 */
const VALIDATION_CONFIG = {
    // Quality thresholds for different validation levels
    thresholds: {
        excellent: {
            wordCoverage: 0.95,
            averageConfidence: 0.9,
            sequenceConsistency: 0.9,
            timingConsistency: 0.95
        },
        good: {
            wordCoverage: 0.85,
            averageConfidence: 0.8,
            sequenceConsistency: 0.8,
            timingConsistency: 0.85
        },
        acceptable: {
            wordCoverage: 0.75,
            averageConfidence: 0.7,
            sequenceConsistency: 0.7,
            timingConsistency: 0.75
        },
        minimum: {
            wordCoverage: 0.6,
            averageConfidence: 0.6,
            sequenceConsistency: 0.6,
            timingConsistency: 0.6
        }
    },
    
    // Timing validation parameters
    timing: {
        maxWordDuration: 3.0,      // Seconds - unusually long word
        minWordDuration: 0.05,     // Seconds - unusually short word
        maxGapBetweenWords: 2.0,   // Seconds - unusual pause
        expectedWordsPerMinute: {
            min: 120,
            max: 200,
            average: 160
        }
    },
    
    // Content validation parameters
    content: {
        maxWordLengthDifference: 5,  // Characters
        commonWordThreshold: 0.7,    // Proportion of words that should be common
        maxSequenceGap: 5,           // Maximum gap in word sequence
        punctuationVarianceAllowed: true
    }
};

/**
 * Result classes for structured validation feedback
 */
class ValidationResult {
    constructor(level, category, message, details = {}) {
        this.level = level;         // 'error', 'warning', 'info', 'success'
        this.category = category;   // 'timing', 'content', 'coverage', 'sequence', etc.
        this.message = message;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
    
    toString() {
        return `[${this.level.toUpperCase()}] ${this.category}: ${this.message}`;
    }
}

class ValidationReport {
    constructor(target, targetType = 'unknown') {
        this.target = target;
        this.targetType = targetType; // 'word', 'sentence', 'section', 'chapter', 'book'
        this.results = [];
        this.summary = null;
        this.recommendations = [];
        this.score = null;
        this.created = new Date().toISOString();
    }
    
    addResult(result) {
        this.results.push(result);
        return this;
    }
    
    addRecommendation(recommendation) {
        this.recommendations.push(recommendation);
        return this;
    }
    
    getByLevel(level) {
        return this.results.filter(r => r.level === level);
    }
    
    getByCategory(category) {
        return this.results.filter(r => r.category === category);
    }
    
    get hasErrors() {
        return this.getByLevel('error').length > 0;
    }
    
    get hasWarnings() {
        return this.getByLevel('warning').length > 0;
    }
    
    get isValid() {
        return !this.hasErrors;
    }
    
    calculateScore() {
        const errors = this.getByLevel('error').length;
        const warnings = this.getByLevel('warning').length;
        const infos = this.getByLevel('info').length;
        const successes = this.getByLevel('success').length;
        
        // Calculate score based on issue severity (0-100)
        let score = 100;
        score -= errors * 15;      // Errors are heavily penalized
        score -= warnings * 5;    // Warnings moderately penalized
        score -= infos * 1;       // Info items slightly penalized
        score += successes * 2;   // Successes provide small bonus
        
        this.score = Math.max(0, Math.min(100, score));
        return this.score;
    }
    
    generateSummary() {
        const errors = this.getByLevel('error');
        const warnings = this.getByLevel('warning');
        const score = this.calculateScore();
        
        let quality = 'Poor';
        if (score >= 90) quality = 'Excellent';
        else if (score >= 80) quality = 'Good';
        else if (score >= 70) quality = 'Acceptable';
        else if (score >= 60) quality = 'Fair';
        
        this.summary = {
            quality,
            score,
            totalIssues: this.results.length,
            errorCount: errors.length,
            warningCount: warnings.length,
            isValid: this.isValid,
            timestamp: this.created
        };
        
        return this.summary;
    }
}

/**
 * Core validation engine
 */
class AudioTextValidator {
    constructor(config = VALIDATION_CONFIG) {
        this.config = config;
        this.normalizer = new TextNormalizer();
    }
    
    /**
     * Validate a complete book structure
     */
    validateBook(book) {
        const report = new ValidationReport(book.title, 'book');
        
        // Basic structure validation
        this._validateBookStructure(book, report);
        
        // Chapter-level validation
        for (const chapter of book.chapters) {
            const chapterReport = this.validateChapter(chapter);
            
            // Roll up significant issues to book level
            chapterReport.getByLevel('error').forEach(error => {
                report.addResult(new ValidationResult(
                    'error',
                    'chapter',
                    `Chapter "${chapter.title}": ${error.message}`,
                    { chapterId: chapter.id, originalError: error }
                ));
            });
            
            if (chapterReport.getByLevel('warning').length > 3) {
                report.addResult(new ValidationResult(
                    'warning',
                    'chapter',
                    `Chapter "${chapter.title}" has ${chapterReport.getByLevel('warning').length} warnings`,
                    { chapterId: chapter.id, warningCount: chapterReport.getByLevel('warning').length }
                ));
            }
        }
        
        // Overall book statistics
        this._validateBookStatistics(book, report);
        
        report.generateSummary();
        return report;
    }
    
    /**
     * Validate a chapter structure and content
     */
    validateChapter(chapter) {
        const report = new ValidationReport(chapter.title, 'chapter');
        
        // Basic structure validation
        this._validateChapterStructure(chapter, report);
        
        // Audio file validation
        if (chapter.audioFile) {
            this._validateAudioFile(chapter.audioFile, report);
        }
        
        // Section-level validation
        for (const section of chapter.sections) {
            const sectionReport = this.validateSection(section);
            
            // Roll up critical issues
            sectionReport.getByLevel('error').forEach(error => {
                report.addResult(new ValidationResult(
                    'error',
                    'section',
                    `Section "${section.id}": ${error.message}`,
                    { sectionId: section.id, originalError: error }
                ));
            });
        }
        
        // Chapter mapping statistics
        this._validateChapterMapping(chapter, report);
        
        report.generateSummary();
        return report;
    }
    
    /**
     * Validate a section structure and content
     */
    validateSection(section) {
        const report = new ValidationReport(section.id, 'section');
        
        // Basic structure validation
        this._validateSectionStructure(section, report);
        
        // Sentence-level validation
        for (const sentence of section.sentences) {
            const sentenceReport = this.validateSentence(sentence);
            
            // Roll up errors
            sentenceReport.getByLevel('error').forEach(error => {
                report.addResult(new ValidationResult(
                    'error',
                    'sentence',
                    `Sentence "${sentence.id}": ${error.message}`,
                    { sentenceId: sentence.id, originalError: error }
                ));
            });
        }
        
        // Section mapping quality
        this._validateSectionMapping(section, report);
        
        report.generateSummary();
        return report;
    }
    
    /**
     * Validate a sentence structure and word mapping
     */
    validateSentence(sentence) {
        const report = new ValidationReport(sentence.id, 'sentence');
        
        // Basic structure validation
        this._validateSentenceStructure(sentence, report);
        
        // Word-level validation
        this._validateWords(sentence.words, report);
        
        // Timing validation
        if (sentence.timing) {
            this._validateTiming(sentence.timing, sentence.words, report);
        }
        
        // Content consistency validation
        this._validateContentConsistency(sentence, report);
        
        report.generateSummary();
        return report;
    }
    
    /**
     * Validate audio-text alignment quality
     */
    validateAlignment(contentWords, transcriptionWords, alignment) {
        const report = new ValidationReport('alignment', 'alignment');
        
        // Coverage validation
        this._validateCoverage(contentWords, transcriptionWords, alignment, report);
        
        // Sequence consistency validation
        this._validateSequenceConsistency(alignment, report);
        
        // Confidence distribution validation
        this._validateConfidenceDistribution(alignment, report);
        
        // Timing validation
        this._validateAlignmentTiming(alignment, report);
        
        // Generate recommendations
        this._generateAlignmentRecommendations(alignment, report);
        
        report.generateSummary();
        return report;
    }
    
    // Private validation methods
    
    _validateBookStructure(book, report) {
        if (!book.title || book.title.trim().length === 0) {
            report.addResult(new ValidationResult('error', 'structure', 'Book title is missing or empty'));
        }
        
        if (!book.author || book.author.trim().length === 0) {
            report.addResult(new ValidationResult('error', 'structure', 'Book author is missing or empty'));
        }
        
        if (book.chapters.length === 0) {
            report.addResult(new ValidationResult('error', 'structure', 'Book has no chapters'));
        }
        
        // Check for duplicate chapter IDs
        const chapterIds = book.chapters.map(c => c.id);
        const duplicates = chapterIds.filter((id, index) => chapterIds.indexOf(id) !== index);
        if (duplicates.length > 0) {
            report.addResult(new ValidationResult('error', 'structure', `Duplicate chapter IDs found: ${duplicates.join(', ')}`));
        }
    }
    
    _validateChapterStructure(chapter, report) {
        if (!chapter.id || chapter.id.trim().length === 0) {
            report.addResult(new ValidationResult('error', 'structure', 'Chapter ID is missing or empty'));
        }
        
        if (!chapter.title || chapter.title.trim().length === 0) {
            report.addResult(new ValidationResult('error', 'structure', 'Chapter title is missing or empty'));
        }
        
        if (chapter.sections.length === 0) {
            report.addResult(new ValidationResult('warning', 'structure', 'Chapter has no sections'));
        }
    }
    
    _validateSectionStructure(section, report) {
        if (!section.id || section.id.trim().length === 0) {
            report.addResult(new ValidationResult('error', 'structure', 'Section ID is missing or empty'));
        }
        
        if (!section.type || section.type.trim().length === 0) {
            report.addResult(new ValidationResult('warning', 'structure', 'Section type is missing or empty'));
        }
        
        if (section.sentences.length === 0) {
            report.addResult(new ValidationResult('warning', 'structure', 'Section has no sentences'));
        }
    }
    
    _validateSentenceStructure(sentence, report) {
        if (!sentence.id || sentence.id.trim().length === 0) {
            report.addResult(new ValidationResult('error', 'structure', 'Sentence ID is missing or empty'));
        }
        
        if (!sentence.text || sentence.text.trim().length === 0) {
            report.addResult(new ValidationResult('error', 'structure', 'Sentence text is missing or empty'));
        }
        
        if (sentence.words.length === 0) {
            report.addResult(new ValidationResult('warning', 'structure', 'Sentence has no words'));
        }
    }
    
    _validateWords(words, report) {
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            
            if (!word.text || word.text.trim().length === 0) {
                report.addResult(new ValidationResult('error', 'content', `Word at position ${i} has no text`));
            }
            
            if (word.transcriptionIndex !== null && word.transcriptionIndex < 0) {
                report.addResult(new ValidationResult('error', 'mapping', `Word at position ${i} has invalid transcription index: ${word.transcriptionIndex}`));
            }
            
            if (word.timing) {
                if (word.timing.start < 0 || word.timing.end < word.timing.start) {
                    report.addResult(new ValidationResult('error', 'timing', `Word at position ${i} has invalid timing: ${word.timing.start}-${word.timing.end}`));
                }
                
                if (word.timing.duration > this.config.timing.maxWordDuration) {
                    report.addResult(new ValidationResult('warning', 'timing', `Word at position ${i} has unusually long duration: ${word.timing.duration.toFixed(2)}s`));
                }
                
                if (word.timing.duration < this.config.timing.minWordDuration) {
                    report.addResult(new ValidationResult('warning', 'timing', `Word at position ${i} has unusually short duration: ${word.timing.duration.toFixed(2)}s`));
                }
            }
        }
    }
    
    _validateTiming(sentenceTiming, words, report) {
        const timedWords = words.filter(w => w.timing);
        
        if (timedWords.length === 0) {
            report.addResult(new ValidationResult('warning', 'timing', 'Sentence has timing but no words have timing'));
            return;
        }
        
        // Check for timing consistency
        const firstWordStart = Math.min(...timedWords.map(w => w.timing.start));
        const lastWordEnd = Math.max(...timedWords.map(w => w.timing.end));
        
        if (Math.abs(sentenceTiming.start - firstWordStart) > 0.5) {
            report.addResult(new ValidationResult('warning', 'timing', 'Sentence start time doesn\'t match first word timing'));
        }
        
        if (Math.abs(sentenceTiming.end - lastWordEnd) > 0.5) {
            report.addResult(new ValidationResult('warning', 'timing', 'Sentence end time doesn\'t match last word timing'));
        }
        
        // Check for gaps or overlaps between words
        for (let i = 1; i < timedWords.length; i++) {
            const prevWord = timedWords[i - 1];
            const currWord = timedWords[i];
            
            const gap = currWord.timing.start - prevWord.timing.end;
            
            if (gap > this.config.timing.maxGapBetweenWords) {
                report.addResult(new ValidationResult('warning', 'timing', `Large gap between words: ${gap.toFixed(2)}s`));
            }
            
            if (gap < -0.1) { // Overlap
                report.addResult(new ValidationResult('warning', 'timing', `Word timing overlap: ${gap.toFixed(2)}s`));
            }
        }
    }
    
    _validateContentConsistency(sentence, report) {
        const sentenceWords = sentence.text.split(/\s+/).filter(w => w.trim().length > 0);
        const mappedWords = sentence.words.map(w => w.text);
        
        // Check word count consistency
        if (Math.abs(sentenceWords.length - mappedWords.length) > 2) {
            report.addResult(new ValidationResult('warning', 'content', `Word count mismatch: sentence has ${sentenceWords.length} words, mapping has ${mappedWords.length} words`));
        }
        
        // Check content similarity
        const sentenceText = this.normalizer.normalizeForMatching(sentence.text);
        const mappedText = this.normalizer.normalizeForMatching(mappedWords.join(' '));
        
        const similarity = StringSimilarity.jaroWinklerSimilarity(sentenceText, mappedText);
        
        if (similarity < 0.8) {
            report.addResult(new ValidationResult('warning', 'content', `Low content similarity between sentence text and mapped words: ${(similarity * 100).toFixed(1)}%`));
        }
    }
    
    _validateCoverage(contentWords, transcriptionWords, alignment, report) {
        const matchedContent = new Set();
        const matchedTranscription = new Set();
        
        alignment.forEach(match => {
            if (match.type === 'match') {
                matchedContent.add(match.contentIndex);
                matchedTranscription.add(match.transcriptionIndex);
            }
        });
        
        const contentCoverage = matchedContent.size / contentWords.length;
        const transcriptionCoverage = matchedTranscription.size / transcriptionWords.length;
        
        // Check coverage thresholds
        if (contentCoverage < this.config.thresholds.minimum.wordCoverage) {
            report.addResult(new ValidationResult('error', 'coverage', `Content coverage too low: ${(contentCoverage * 100).toFixed(1)}%`));
        } else if (contentCoverage < this.config.thresholds.acceptable.wordCoverage) {
            report.addResult(new ValidationResult('warning', 'coverage', `Content coverage below acceptable: ${(contentCoverage * 100).toFixed(1)}%`));
        }
        
        if (transcriptionCoverage < this.config.thresholds.minimum.wordCoverage) {
            report.addResult(new ValidationResult('error', 'coverage', `Transcription coverage too low: ${(transcriptionCoverage * 100).toFixed(1)}%`));
        } else if (transcriptionCoverage < this.config.thresholds.acceptable.wordCoverage) {
            report.addResult(new ValidationResult('warning', 'coverage', `Transcription coverage below acceptable: ${(transcriptionCoverage * 100).toFixed(1)}%`));
        }
        
        report.addResult(new ValidationResult('info', 'coverage', `Coverage: ${(contentCoverage * 100).toFixed(1)}% content, ${(transcriptionCoverage * 100).toFixed(1)}% transcription`));
    }
    
    _validateSequenceConsistency(alignment, report) {
        const matches = alignment.filter(a => a.type === 'match');
        let sequenceBreaks = 0;
        
        for (let i = 1; i < matches.length; i++) {
            const prev = matches[i - 1];
            const curr = matches[i];
            
            const contentGap = curr.contentIndex - prev.contentIndex;
            const transcriptionGap = curr.transcriptionIndex - prev.transcriptionIndex;
            
            // Check for sequence consistency
            if (contentGap <= 0 || transcriptionGap <= 0) {
                sequenceBreaks++;
                report.addResult(new ValidationResult('warning', 'sequence', `Sequence break at content index ${curr.contentIndex}`));
            }
            
            // Check for large gaps
            if (Math.abs(contentGap - transcriptionGap) > this.config.content.maxSequenceGap) {
                report.addResult(new ValidationResult('warning', 'sequence', `Large sequence gap: content=${contentGap}, transcription=${transcriptionGap}`));
            }
        }
        
        const sequenceConsistency = matches.length > 1 ? (matches.length - sequenceBreaks) / matches.length : 1;
        
        if (sequenceConsistency < this.config.thresholds.minimum.sequenceConsistency) {
            report.addResult(new ValidationResult('error', 'sequence', `Sequence consistency too low: ${(sequenceConsistency * 100).toFixed(1)}%`));
        }
    }
    
    _validateConfidenceDistribution(alignment, report) {
        const matches = alignment.filter(a => a.type === 'match');
        
        if (matches.length === 0) {
            report.addResult(new ValidationResult('error', 'confidence', 'No matches found'));
            return;
        }
        
        const avgConfidence = matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length;
        const lowConfidenceCount = matches.filter(m => m.confidence < 0.7).length;
        
        if (avgConfidence < this.config.thresholds.minimum.averageConfidence) {
            report.addResult(new ValidationResult('error', 'confidence', `Average confidence too low: ${(avgConfidence * 100).toFixed(1)}%`));
        } else if (avgConfidence < this.config.thresholds.acceptable.averageConfidence) {
            report.addResult(new ValidationResult('warning', 'confidence', `Average confidence below acceptable: ${(avgConfidence * 100).toFixed(1)}%`));
        }
        
        if (lowConfidenceCount / matches.length > 0.3) {
            report.addResult(new ValidationResult('warning', 'confidence', `High proportion of low-confidence matches: ${lowConfidenceCount}/${matches.length}`));
        }
    }
    
    _validateAlignmentTiming(alignment, report) {
        const matches = alignment.filter(a => a.type === 'match' && a.transcriptionWord.timing);
        
        if (matches.length < 2) return;
        
        const totalDuration = Math.max(...matches.map(m => m.transcriptionWord.timing.end));
        const wordsPerMinute = (matches.length / totalDuration) * 60;
        
        const expectedWPM = this.config.timing.expectedWordsPerMinute;
        
        if (wordsPerMinute < expectedWPM.min || wordsPerMinute > expectedWPM.max) {
            report.addResult(new ValidationResult('warning', 'timing', `Unusual speaking rate: ${wordsPerMinute.toFixed(1)} words per minute`));
        }
    }
    
    _validateBookStatistics(book, report) {
        const stats = book.mappingStats;
        
        if (stats) {
            report.addResult(new ValidationResult('info', 'statistics', `Book mapping: ${stats.wordMappingPercentage.toFixed(1)}% words, ${stats.chapterMappingPercentage.toFixed(1)}% chapters`));
            
            if (stats.wordMappingPercentage < 80) {
                report.addResult(new ValidationResult('warning', 'statistics', 'Low overall word mapping percentage'));
            }
        }
    }
    
    _validateChapterMapping(chapter, report) {
        const stats = chapter.mappingStats;
        
        if (stats) {
            if (stats.wordMappingPercentage < 75) {
                report.addResult(new ValidationResult('warning', 'mapping', `Low word mapping in chapter: ${stats.wordMappingPercentage.toFixed(1)}%`));
            }
        }
    }
    
    _validateSectionMapping(section, report) {
        const stats = section.mappingStats;
        
        if (stats) {
            if (stats.wordMappingPercentage < 70) {
                report.addResult(new ValidationResult('warning', 'mapping', `Low word mapping in section: ${stats.wordMappingPercentage.toFixed(1)}%`));
            }
        }
    }
    
    _validateAudioFile(audioFile, report) {
        // Placeholder for audio file validation
        // In a real implementation, this would check:
        // - File exists
        // - File format is supported
        // - Audio duration is reasonable
        // - Audio quality metrics
        
        if (!audioFile || audioFile.trim().length === 0) {
            report.addResult(new ValidationResult('warning', 'audio', 'No audio file specified'));
        }
    }
    
    _generateAlignmentRecommendations(alignment, report) {
        const matches = alignment.filter(a => a.type === 'match');
        const lowConfidenceMatches = matches.filter(m => m.confidence < 0.7);
        
        if (lowConfidenceMatches.length > 0) {
            report.addRecommendation(`Review ${lowConfidenceMatches.length} low-confidence matches manually`);
        }
        
        const skippedContent = alignment.filter(a => a.type === 'skip_content');
        if (skippedContent.length > 5) {
            report.addRecommendation('Consider using more permissive matching strategy due to high skip count');
        }
        
        if (matches.length > 0) {
            const avgConfidence = matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length;
            if (avgConfidence > 0.9) {
                report.addRecommendation('High quality alignment - suitable for automated processing');
            } else if (avgConfidence > 0.8) {
                report.addRecommendation('Good quality alignment - minimal manual review needed');
            } else {
                report.addRecommendation('Moderate quality alignment - manual review recommended');
            }
        }
    }
}

/**
 * Performance and quality metrics calculator
 */
class QualityMetrics {
    static calculateAlignmentQuality(alignment) {
        const matches = alignment.filter(a => a.type === 'match');
        
        if (matches.length === 0) {
            return {
                overallScore: 0,
                confidence: 0,
                coverage: 0,
                consistency: 0,
                grade: 'F'
            };
        }
        
        // Calculate component scores
        const avgConfidence = matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length;
        const coverage = matches.length / (matches.length + alignment.filter(a => a.type.includes('skip')).length);
        
        // Calculate sequence consistency
        let sequenceBreaks = 0;
        for (let i = 1; i < matches.length; i++) {
            const prev = matches[i - 1];
            const curr = matches[i];
            if (curr.contentIndex <= prev.contentIndex || curr.transcriptionIndex <= prev.transcriptionIndex) {
                sequenceBreaks++;
            }
        }
        const consistency = matches.length > 1 ? (matches.length - sequenceBreaks) / matches.length : 1;
        
        // Weighted overall score
        const overallScore = (avgConfidence * 0.4) + (coverage * 0.3) + (consistency * 0.3);
        
        // Assign letter grade
        let grade = 'F';
        if (overallScore >= 0.9) grade = 'A';
        else if (overallScore >= 0.8) grade = 'B';
        else if (overallScore >= 0.7) grade = 'C';
        else if (overallScore >= 0.6) grade = 'D';
        
        return {
            overallScore,
            confidence: avgConfidence,
            coverage,
            consistency,
            grade,
            totalMatches: matches.length,
            sequenceBreaks
        };
    }
}

module.exports = {
    AudioTextValidator,
    ValidationResult,
    ValidationReport,
    QualityMetrics,
    VALIDATION_CONFIG
};