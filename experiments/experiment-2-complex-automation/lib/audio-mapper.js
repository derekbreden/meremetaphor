/**
 * Automated audio-text mapping pipeline
 * 
 * Orchestrates the complete process of:
 * - Loading and processing content and transcription data
 * - Extracting words with positioning information
 * - Performing fuzzy matching and alignment
 * - Validating results and providing quality feedback
 * - Generating structured output for HTML generation
 * - Providing suggestions for manual review
 */

const fs = require('fs');
const path = require('path');

const { Book, Chapter, Section, Sentence, Word, Transcription } = require('./data-structures');
const { TextProcessingUtils, HTMLTextExtractor } = require('./text-utils');
const { WordExtractor, ContextAwareExtractor } = require('./word-extractor');
const { FuzzyMatcher } = require('./fuzzy-matcher');
const { AudioTextValidator, QualityMetrics } = require('./validation');

/**
 * Configuration for the mapping pipeline
 */
const MAPPING_CONFIG = {
    // Processing strategies
    strategies: {
        conservative: {
            matching: 'strict',
            validation: 'strict',
            requireManualReview: true,
            minQualityScore: 0.9
        },
        balanced: {
            matching: 'balanced',
            validation: 'standard',
            requireManualReview: false,
            minQualityScore: 0.7
        },
        aggressive: {
            matching: 'permissive',
            validation: 'permissive',
            requireManualReview: false,
            minQualityScore: 0.6
        }
    },
    
    // Processing options
    processing: {
        chunkSize: 50,              // Process in chunks for large content
        maxRetries: 3,              // Retry failed mappings
        parallelProcessing: false,   // Enable for large datasets
        cacheResults: true,         // Cache intermediate results
        generateBackups: true       // Backup original data
    },
    
    // Output options
    output: {
        saveIntermediateResults: true,
        generateReports: true,
        includeStatistics: true,
        formatForReview: true
    }
};

/**
 * Result container for mapping operations
 */
class MappingResult {
    constructor(source, target, strategy) {
        this.source = source;
        this.target = target;
        this.strategy = strategy;
        this.alignment = null;
        this.validation = null;
        this.statistics = null;
        this.quality = null;
        this.suggestions = [];
        this.errors = [];
        this.warnings = [];
        this.processingTime = null;
        this.created = new Date().toISOString();
    }
    
    get isSuccess() {
        return this.errors.length === 0 && this.alignment !== null;
    }
    
    get needsReview() {
        return this.quality && this.quality.overallScore < 0.8;
    }
    
    toJSON() {
        return {
            source: this.source,
            target: this.target,
            strategy: this.strategy,
            alignment: this.alignment,
            validation: this.validation,
            statistics: this.statistics,
            quality: this.quality,
            suggestions: this.suggestions,
            errors: this.errors,
            warnings: this.warnings,
            processingTime: this.processingTime,
            created: this.created,
            isSuccess: this.isSuccess,
            needsReview: this.needsReview
        };
    }
}

/**
 * Main audio mapping engine
 */
class AudioMapper {
    constructor(config = MAPPING_CONFIG) {
        this.config = config;
        this.textProcessor = new TextProcessingUtils();
        this.wordExtractor = new WordExtractor();
        this.contextExtractor = new ContextAwareExtractor();
        this.fuzzyMatcher = new FuzzyMatcher();
        this.validator = new AudioTextValidator();
        
        // Statistics tracking
        this.stats = {
            totalProcessed: 0,
            successfulMappings: 0,
            failedMappings: 0,
            averageQuality: 0,
            totalProcessingTime: 0
        };
    }
    
    /**
     * Map transcription to a complete book
     */
    async mapBook(book, transcriptionData, strategy = 'balanced') {
        console.log(`Starting book mapping with strategy: ${strategy}`);
        const startTime = Date.now();
        
        try {
            const results = [];
            
            // Process each chapter
            for (const chapter of book.chapters) {
                console.log(`Processing chapter: ${chapter.title}`);
                
                if (chapter.audioFile && chapter.transcriptionFile) {
                    const chapterResult = await this.mapChapter(chapter, transcriptionData, strategy);
                    results.push(chapterResult);
                    
                    if (!chapterResult.isSuccess) {
                        console.warn(`Chapter mapping failed: ${chapter.title}`);
                    }
                } else {
                    console.log(`Skipping chapter without audio: ${chapter.title}`);
                }
            }
            
            // Generate book-level validation
            const bookValidation = this.validator.validateBook(book);
            
            const processingTime = Date.now() - startTime;
            this._updateStats(results, processingTime);
            
            return {
                results,
                bookValidation,
                processingTime,
                statistics: this._calculateBookStatistics(results)
            };
            
        } catch (error) {
            console.error('Book mapping failed:', error);
            throw error;
        }
    }
    
    /**
     * Map transcription to a single chapter
     */
    async mapChapter(chapter, transcriptionData, strategy = 'balanced') {
        const result = new MappingResult('chapter', chapter.id, strategy);
        const startTime = Date.now();
        
        try {
            // Load transcription if needed
            const transcription = await this._loadTranscription(transcriptionData);
            
            // Process chapter content
            const chapterContent = this._extractChapterContent(chapter);
            
            // Perform word extraction
            const contentWords = this._extractContentWords(chapterContent);
            const transcriptionWords = this._extractTranscriptionWords(transcription);
            
            console.log(`Extracted ${contentWords.length} content words and ${transcriptionWords.length} transcription words`);
            
            // Perform fuzzy matching
            const matchingResult = this.fuzzyMatcher.matchWords(contentWords, transcriptionWords, { strategy });
            result.alignment = matchingResult.alignment;
            result.statistics = matchingResult.statistics;
            
            // Validate results
            result.validation = this.validator.validateAlignment(contentWords, transcriptionWords, matchingResult.alignment);
            
            // Calculate quality metrics
            result.quality = QualityMetrics.calculateAlignmentQuality(matchingResult.alignment);
            
            // Generate suggestions if needed
            if (result.needsReview) {
                result.suggestions = this.fuzzyMatcher.getSuggestions(contentWords, transcriptionWords, { strategy });
            }
            
            // Apply mappings to chapter structure
            this._applyMappingsToChapter(chapter, matchingResult.alignment, contentWords, transcriptionWords);
            
            result.processingTime = Date.now() - startTime;
            
            console.log(`Chapter mapping complete: ${result.quality.grade} grade, ${(result.quality.overallScore * 100).toFixed(1)}% quality`);
            
        } catch (error) {
            result.errors.push(error.message);
            console.error(`Chapter mapping error: ${error.message}`);
        }
        
        return result;
    }
    
    /**
     * Map transcription to a single section
     */
    async mapSection(section, transcriptionData, strategy = 'balanced') {
        const result = new MappingResult('section', section.id, strategy);
        const startTime = Date.now();
        
        try {
            // Load transcription
            const transcription = await this._loadTranscription(transcriptionData);
            
            // Extract content from section
            const sectionContent = this._extractSectionContent(section);
            
            // Extract words
            const contentWords = this.contextExtractor.extractFromSection(sectionContent, section.type);
            const transcriptionWords = this._extractTranscriptionWords(transcription);
            
            // Perform matching
            const matchingResult = this.fuzzyMatcher.matchWords(contentWords, transcriptionWords, { strategy });
            result.alignment = matchingResult.alignment;
            result.statistics = matchingResult.statistics;
            
            // Validate
            result.validation = this.validator.validateAlignment(contentWords, transcriptionWords, matchingResult.alignment);
            result.quality = QualityMetrics.calculateAlignmentQuality(matchingResult.alignment);
            
            // Apply mappings
            this._applyMappingsToSection(section, matchingResult.alignment, contentWords, transcriptionWords);
            
            result.processingTime = Date.now() - startTime;
            
        } catch (error) {
            result.errors.push(error.message);
        }
        
        return result;
    }
    
    /**
     * Create automated mapping from structured content data
     */
    async createAutomatedMapping(contentData, transcriptionPath, options = {}) {
        const strategy = options.strategy || 'balanced';
        const outputPath = options.outputPath || null;
        
        console.log('Starting automated mapping process...');
        
        try {
            // Load transcription
            const transcription = await this._loadTranscriptionFromFile(transcriptionPath);
            
            // Create book structure from content data
            const book = this._createBookFromData(contentData);
            
            // Perform mapping
            const mappingResult = await this.mapBook(book, transcription, strategy);
            
            // Save results if output path provided
            if (outputPath) {
                await this._saveResults(mappingResult, book, outputPath);
            }
            
            // Generate report
            const report = this._generateMappingReport(mappingResult, book);
            
            return {
                book,
                mappingResult,
                report,
                success: mappingResult.results.every(r => r.isSuccess)
            };
            
        } catch (error) {
            console.error('Automated mapping failed:', error);
            throw error;
        }
    }
    
    /**
     * Batch process multiple content sections
     */
    async batchProcess(contentSections, transcriptionData, strategy = 'balanced') {
        const results = [];
        
        console.log(`Starting batch processing of ${contentSections.length} sections`);
        
        for (let i = 0; i < contentSections.length; i++) {
            const section = contentSections[i];
            console.log(`Processing section ${i + 1}/${contentSections.length}: ${section.id}`);
            
            try {
                const result = await this.mapSection(section, transcriptionData, strategy);
                results.push(result);
                
                // Progress reporting
                if ((i + 1) % 10 === 0) {
                    const successRate = results.filter(r => r.isSuccess).length / results.length;
                    console.log(`Progress: ${i + 1}/${contentSections.length} (${(successRate * 100).toFixed(1)}% success rate)`);
                }
                
            } catch (error) {
                console.error(`Failed to process section ${section.id}:`, error);
                results.push({
                    source: 'section',
                    target: section.id,
                    strategy,
                    isSuccess: false,
                    errors: [error.message]
                });
            }
        }
        
        return {
            results,
            summary: this._summarizeBatchResults(results)
        };
    }
    
    // Private helper methods
    
    async _loadTranscription(transcriptionData) {
        if (typeof transcriptionData === 'string') {
            // Assume it's a file path
            return this._loadTranscriptionFromFile(transcriptionData);
        } else if (transcriptionData && transcriptionData.words) {
            // Already loaded transcription data
            return transcriptionData;
        } else {
            throw new Error('Invalid transcription data provided');
        }
    }
    
    async _loadTranscriptionFromFile(filePath) {
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return data;
        } catch (error) {
            throw new Error(`Failed to load transcription from ${filePath}: ${error.message}`);
        }
    }
    
    _extractChapterContent(chapter) {
        return {
            title: chapter.title,
            sections: chapter.sections.map(section => ({
                id: section.id,
                type: section.type,
                text: section.sentences.map(s => s.text).join(' ')
            }))
        };
    }
    
    _extractSectionContent(section) {
        return {
            id: section.id,
            type: section.type,
            text: section.sentences.map(s => s.text).join(' ')
        };
    }
    
    _extractContentWords(content) {
        const words = [];
        let globalIndex = 0;
        
        if (content.sections) {
            // Chapter content
            for (const section of content.sections) {
                const sectionWords = this.contextExtractor.extractFromSection(section, section.type);
                sectionWords.forEach(word => {
                    word.metadata.globalIndex = globalIndex++;
                    word.metadata.sectionId = section.id;
                });
                words.push(...sectionWords);
            }
        } else {
            // Section content
            const sectionWords = this.contextExtractor.extractFromSection(content, content.type);
            sectionWords.forEach(word => {
                word.metadata.globalIndex = globalIndex++;
            });
            words.push(...sectionWords);
        }
        
        return words;
    }
    
    _extractTranscriptionWords(transcription) {
        return this.wordExtractor.extractFromTranscription(transcription);
    }
    
    _applyMappingsToChapter(chapter, alignment, contentWords, transcriptionWords) {
        const mappingLookup = new Map();
        
        // Build lookup table from alignment
        alignment.forEach(match => {
            if (match.type === 'match') {
                const contentWord = contentWords[match.contentIndex];
                const transcriptionWord = transcriptionWords[match.transcriptionIndex];
                
                mappingLookup.set(contentWord.metadata.globalIndex, {
                    transcriptionIndex: match.transcriptionIndex,
                    timing: transcriptionWord.metadata.timing,
                    confidence: match.confidence
                });
            }
        });
        
        // Apply mappings to chapter structure
        let wordIndex = 0;
        for (const section of chapter.sections) {
            for (const sentence of section.sentences) {
                for (const word of sentence.words) {
                    const mapping = mappingLookup.get(wordIndex);
                    if (mapping) {
                        word.transcriptionIndex = mapping.transcriptionIndex;
                        word.timing = mapping.timing;
                        word.confidence = mapping.confidence;
                    }
                    wordIndex++;
                }
            }
        }
    }
    
    _applyMappingsToSection(section, alignment, contentWords, transcriptionWords) {
        const mappingLookup = new Map();
        
        // Build lookup table
        alignment.forEach(match => {
            if (match.type === 'match') {
                const transcriptionWord = transcriptionWords[match.transcriptionIndex];
                mappingLookup.set(match.contentIndex, {
                    transcriptionIndex: match.transcriptionIndex,
                    timing: transcriptionWord.metadata.timing,
                    confidence: match.confidence
                });
            }
        });
        
        // Apply to section
        let wordIndex = 0;
        for (const sentence of section.sentences) {
            for (const word of sentence.words) {
                const mapping = mappingLookup.get(wordIndex);
                if (mapping) {
                    word.transcriptionIndex = mapping.transcriptionIndex;
                    word.timing = mapping.timing;
                    word.confidence = mapping.confidence;
                }
                wordIndex++;
            }
        }
    }
    
    _createBookFromData(contentData) {
        const book = new Book(contentData.title, contentData.subtitle, contentData.author);
        
        // Add cover elements if present
        if (contentData.cover && contentData.cover.elements) {
            book.coverElements = contentData.cover.elements;
        }
        
        // Add chapters
        if (contentData.chapters) {
            contentData.chapters.forEach(chapterData => {
                const chapter = Chapter.fromJSON(chapterData);
                book.addChapter(chapter);
            });
        }
        
        return book;
    }
    
    async _saveResults(mappingResult, book, outputPath) {
        try {
            // Create output directory
            if (!fs.existsSync(outputPath)) {
                fs.mkdirSync(outputPath, { recursive: true });
            }
            
            // Save book with mappings
            const bookPath = path.join(outputPath, 'book-with-mappings.json');
            fs.writeFileSync(bookPath, JSON.stringify(book.toJSON(), null, 2));
            
            // Save mapping results
            const resultsPath = path.join(outputPath, 'mapping-results.json');
            fs.writeFileSync(resultsPath, JSON.stringify(mappingResult, null, 2));
            
            console.log(`Results saved to ${outputPath}`);
        } catch (error) {
            console.error('Failed to save results:', error);
        }
    }
    
    _generateMappingReport(mappingResult, book) {
        const successfulMappings = mappingResult.results.filter(r => r.isSuccess);
        const avgQuality = successfulMappings.length > 0 ? 
            successfulMappings.reduce((sum, r) => sum + r.quality.overallScore, 0) / successfulMappings.length : 0;
        
        return {
            summary: {
                totalChapters: mappingResult.results.length,
                successfulMappings: successfulMappings.length,
                failedMappings: mappingResult.results.length - successfulMappings.length,
                averageQuality: avgQuality,
                totalProcessingTime: mappingResult.processingTime
            },
            details: mappingResult.results.map(r => ({
                target: r.target,
                success: r.isSuccess,
                quality: r.quality ? r.quality.grade : 'N/A',
                needsReview: r.needsReview,
                errors: r.errors,
                warnings: r.warnings
            })),
            recommendations: this._generateRecommendations(mappingResult)
        };
    }
    
    _generateRecommendations(mappingResult) {
        const recommendations = [];
        const lowQualityResults = mappingResult.results.filter(r => r.quality && r.quality.overallScore < 0.7);
        
        if (lowQualityResults.length > 0) {
            recommendations.push(`${lowQualityResults.length} chapters have low quality mappings and need manual review`);
        }
        
        const failedResults = mappingResult.results.filter(r => !r.isSuccess);
        if (failedResults.length > 0) {
            recommendations.push(`${failedResults.length} chapters failed to map and require attention`);
        }
        
        const avgQuality = mappingResult.results
            .filter(r => r.quality)
            .reduce((sum, r) => sum + r.quality.overallScore, 0) / mappingResult.results.length;
        
        if (avgQuality > 0.9) {
            recommendations.push('Excellent mapping quality - ready for production use');
        } else if (avgQuality > 0.8) {
            recommendations.push('Good mapping quality - minimal manual review needed');
        } else if (avgQuality > 0.7) {
            recommendations.push('Acceptable mapping quality - some manual review recommended');
        } else {
            recommendations.push('Low mapping quality - extensive manual review required');
        }
        
        return recommendations;
    }
    
    _summarizeBatchResults(results) {
        const successful = results.filter(r => r.isSuccess);
        const failed = results.filter(r => !r.isSuccess);
        
        return {
            total: results.length,
            successful: successful.length,
            failed: failed.length,
            successRate: successful.length / results.length,
            averageProcessingTime: successful.length > 0 ? 
                successful.reduce((sum, r) => sum + (r.processingTime || 0), 0) / successful.length : 0
        };
    }
    
    _updateStats(results, processingTime) {
        this.stats.totalProcessed += results.length;
        this.stats.successfulMappings += results.filter(r => r.isSuccess).length;
        this.stats.failedMappings += results.filter(r => !r.isSuccess).length;
        this.stats.totalProcessingTime += processingTime;
        
        const qualityScores = results.filter(r => r.quality).map(r => r.quality.overallScore);
        if (qualityScores.length > 0) {
            this.stats.averageQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
        }
    }
    
    _calculateBookStatistics(results) {
        const stats = {
            chaptersProcessed: results.length,
            successfulChapters: results.filter(r => r.isSuccess).length,
            averageQuality: 0,
            totalWords: 0,
            mappedWords: 0,
            averageConfidence: 0
        };
        
        const qualityScores = results.filter(r => r.quality).map(r => r.quality.overallScore);
        if (qualityScores.length > 0) {
            stats.averageQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
        }
        
        results.forEach(result => {
            if (result.statistics) {
                stats.totalWords += result.statistics.totalMatches || 0;
                stats.mappedWords += result.statistics.totalMatches || 0;
            }
        });
        
        if (stats.totalWords > 0) {
            stats.wordMappingRate = stats.mappedWords / stats.totalWords;
        }
        
        return stats;
    }
    
    /**
     * Get current processing statistics
     */
    getStatistics() {
        return { ...this.stats };
    }
    
    /**
     * Reset statistics
     */
    resetStatistics() {
        this.stats = {
            totalProcessed: 0,
            successfulMappings: 0,
            failedMappings: 0,
            averageQuality: 0,
            totalProcessingTime: 0
        };
    }
}

module.exports = {
    AudioMapper,
    MappingResult,
    MAPPING_CONFIG
};