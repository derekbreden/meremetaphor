/**
 * Core data structures for audio-HTML coordination system
 * 
 * These structures provide a solid foundation for:
 * - Content representation at multiple levels
 * - Audio timing coordination  
 * - Validation and quality control
 * - Multiple output generation
 */

/**
 * Represents timing information for audio segments
 */
class AudioTiming {
    constructor(start, end) {
        this.start = parseFloat(start);
        this.end = parseFloat(end);
        
        if (this.start < 0 || this.end < this.start) {
            throw new Error(`Invalid timing: start=${this.start}, end=${this.end}`);
        }
    }
    
    get duration() {
        return this.end - this.start;
    }
    
    contains(timestamp) {
        return timestamp >= this.start && timestamp < this.end;
    }
    
    overlaps(other) {
        return this.start < other.end && this.end > other.start;
    }
    
    toString() {
        return `${this.start.toFixed(3)}s-${this.end.toFixed(3)}s`;
    }
}

/**
 * Represents a single word with optional audio timing
 */
class Word {
    constructor(text, options = {}) {
        this.text = text.trim();
        this.originalText = text; // Preserve original with spacing/punctuation
        this.transcriptionIndex = options.transcriptionIndex || null;
        this.timing = options.timing ? new AudioTiming(options.timing.start, options.timing.end) : null;
        this.confidence = options.confidence || null; // For automated mapping confidence
        this.metadata = options.metadata || {}; // Extensible metadata
        
        if (!this.text) {
            throw new Error('Word text cannot be empty');
        }
    }
    
    /**
     * Get normalized version of word for matching
     */
    get normalized() {
        return this.text.toLowerCase()
            .replace(/[.,!?;:"""''()—–\-]/g, '') // Remove punctuation
            .replace(/['']/g, "'"); // Normalize quotes
    }
    
    /**
     * Check if this word matches another (fuzzy matching)
     */
    matches(other, threshold = 0.8) {
        if (this.normalized === other.normalized) return true;
        // TODO: Implement fuzzy matching algorithm
        return false;
    }
    
    toJSON() {
        return {
            text: this.text,
            originalText: this.originalText,
            transcriptionIndex: this.transcriptionIndex,
            timing: this.timing ? { start: this.timing.start, end: this.timing.end } : null,
            confidence: this.confidence,
            metadata: this.metadata
        };
    }
    
    static fromJSON(data) {
        return new Word(data.originalText || data.text, {
            transcriptionIndex: data.transcriptionIndex,
            timing: data.timing,
            confidence: data.confidence,
            metadata: data.metadata || {}
        });
    }
}

/**
 * Represents a sentence containing multiple words
 */
class Sentence {
    constructor(text, id, options = {}) {
        this.text = text;
        this.id = id;
        this.words = [];
        this.transcriptionStart = options.transcriptionStart || null;
        this.transcriptionEnd = options.transcriptionEnd || null;
        this.confidence = options.confidence || null;
        this.metadata = options.metadata || {};
    }
    
    /**
     * Add a word to this sentence
     */
    addWord(word) {
        if (!(word instanceof Word)) {
            throw new Error('Must add Word instance');
        }
        this.words.push(word);
        return this;
    }
    
    /**
     * Get all words as plain text
     */
    get plainText() {
        return this.words.map(w => w.text).join(' ');
    }
    
    /**
     * Get timing range for entire sentence
     */
    get timing() {
        const wordTimings = this.words
            .map(w => w.timing)
            .filter(t => t !== null);
            
        if (wordTimings.length === 0) return null;
        
        const start = Math.min(...wordTimings.map(t => t.start));
        const end = Math.max(...wordTimings.map(t => t.end));
        return new AudioTiming(start, end);
    }
    
    /**
     * Get average confidence for sentence
     */
    get averageConfidence() {
        const confidences = this.words
            .map(w => w.confidence)
            .filter(c => c !== null);
            
        if (confidences.length === 0) return null;
        return confidences.reduce((a, b) => a + b) / confidences.length;
    }
    
    /**
     * Check if sentence has complete audio mapping
     */
    get isFullyMapped() {
        return this.words.length > 0 && this.words.every(w => w.transcriptionIndex !== null);
    }
    
    toJSON() {
        return {
            text: this.text,
            id: this.id,
            words: this.words.map(w => w.toJSON()),
            transcriptionStart: this.transcriptionStart,
            transcriptionEnd: this.transcriptionEnd,
            confidence: this.confidence,
            metadata: this.metadata
        };
    }
    
    static fromJSON(data) {
        const sentence = new Sentence(data.text, data.id, {
            transcriptionStart: data.transcriptionStart,
            transcriptionEnd: data.transcriptionEnd,
            confidence: data.confidence,
            metadata: data.metadata || {}
        });
        
        if (data.words) {
            data.words.forEach(wordData => {
                sentence.addWord(Word.fromJSON(wordData));
            });
        }
        
        return sentence;
    }
}

/**
 * Represents a section containing multiple sentences
 */
class Section {
    constructor(id, type, options = {}) {
        this.id = id;
        this.type = type; // 'paragraph', 'quote', 'heading', etc.
        this.sentences = [];
        this.audioFile = options.audioFile || null;
        this.transcriptionFile = options.transcriptionFile || null;
        this.metadata = options.metadata || {};
    }
    
    /**
     * Add a sentence to this section
     */
    addSentence(sentence) {
        if (!(sentence instanceof Sentence)) {
            throw new Error('Must add Sentence instance');
        }
        this.sentences.push(sentence);
        return this;
    }
    
    /**
     * Get all words across all sentences
     */
    get allWords() {
        return this.sentences.flatMap(s => s.words);
    }
    
    /**
     * Get plain text for entire section
     */
    get plainText() {
        return this.sentences.map(s => s.text).join(' ');
    }
    
    /**
     * Get timing range for entire section
     */
    get timing() {
        const sentenceTimings = this.sentences
            .map(s => s.timing)
            .filter(t => t !== null);
            
        if (sentenceTimings.length === 0) return null;
        
        const start = Math.min(...sentenceTimings.map(t => t.start));
        const end = Math.max(...sentenceTimings.map(t => t.end));
        return new AudioTiming(start, end);
    }
    
    /**
     * Check if section has complete audio mapping
     */
    get isFullyMapped() {
        return this.sentences.length > 0 && this.sentences.every(s => s.isFullyMapped);
    }
    
    /**
     * Get mapping statistics for this section
     */
    get mappingStats() {
        const totalWords = this.allWords.length;
        const mappedWords = this.allWords.filter(w => w.transcriptionIndex !== null).length;
        const totalSentences = this.sentences.length;
        const mappedSentences = this.sentences.filter(s => s.isFullyMapped).length;
        
        return {
            totalWords,
            mappedWords,
            wordMappingPercentage: totalWords > 0 ? (mappedWords / totalWords) * 100 : 0,
            totalSentences,
            mappedSentences,
            sentenceMappingPercentage: totalSentences > 0 ? (mappedSentences / totalSentences) * 100 : 0
        };
    }
    
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            sentences: this.sentences.map(s => s.toJSON()),
            audioFile: this.audioFile,
            transcriptionFile: this.transcriptionFile,
            metadata: this.metadata
        };
    }
    
    static fromJSON(data) {
        const section = new Section(data.id, data.type, {
            audioFile: data.audioFile,
            transcriptionFile: data.transcriptionFile,
            metadata: data.metadata || {}
        });
        
        if (data.sentences) {
            data.sentences.forEach(sentenceData => {
                section.addSentence(Sentence.fromJSON(sentenceData));
            });
        }
        
        return section;
    }
}

/**
 * Represents a chapter containing multiple sections
 */
class Chapter {
    constructor(id, title, type, options = {}) {
        this.id = id;
        this.title = title;
        this.type = type; // 'preface', 'chapter', 'appendix', etc.
        this.sections = [];
        this.audioFile = options.audioFile || null;
        this.transcriptionFile = options.transcriptionFile || null;
        this.illustrationFile = options.illustrationFile || null;
        this.metadata = options.metadata || {};
    }
    
    /**
     * Add a section to this chapter
     */
    addSection(section) {
        if (!(section instanceof Section)) {
            throw new Error('Must add Section instance');
        }
        this.sections.push(section);
        return this;
    }
    
    /**
     * Get all words across all sections
     */
    get allWords() {
        return this.sections.flatMap(s => s.allWords);
    }
    
    /**
     * Get all sentences across all sections
     */
    get allSentences() {
        return this.sections.flatMap(s => s.sentences);
    }
    
    /**
     * Get plain text for entire chapter
     */
    get plainText() {
        return this.sections.map(s => s.plainText).join('\n\n');
    }
    
    /**
     * Get timing range for entire chapter
     */
    get timing() {
        const sectionTimings = this.sections
            .map(s => s.timing)
            .filter(t => t !== null);
            
        if (sectionTimings.length === 0) return null;
        
        const start = Math.min(...sectionTimings.map(t => t.start));
        const end = Math.max(...sectionTimings.map(t => t.end));
        return new AudioTiming(start, end);
    }
    
    /**
     * Check if chapter has complete audio mapping
     */
    get isFullyMapped() {
        return this.sections.length > 0 && this.sections.every(s => s.isFullyMapped);
    }
    
    /**
     * Get comprehensive mapping statistics
     */
    get mappingStats() {
        const sectionStats = this.sections.map(s => s.mappingStats);
        
        const totalWords = sectionStats.reduce((sum, stat) => sum + stat.totalWords, 0);
        const mappedWords = sectionStats.reduce((sum, stat) => sum + stat.mappedWords, 0);
        const totalSentences = sectionStats.reduce((sum, stat) => sum + stat.totalSentences, 0);
        const mappedSentences = sectionStats.reduce((sum, stat) => sum + stat.mappedSentences, 0);
        
        return {
            totalWords,
            mappedWords,
            wordMappingPercentage: totalWords > 0 ? (mappedWords / totalWords) * 100 : 0,
            totalSentences,
            mappedSentences,
            sentenceMappingPercentage: totalSentences > 0 ? (mappedSentences / totalSentences) * 100 : 0,
            totalSections: this.sections.length,
            mappedSections: this.sections.filter(s => s.isFullyMapped).length,
            sectionMappingPercentage: this.sections.length > 0 ? 
                (this.sections.filter(s => s.isFullyMapped).length / this.sections.length) * 100 : 0,
            sectionStats
        };
    }
    
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            type: this.type,
            sections: this.sections.map(s => s.toJSON()),
            audioFile: this.audioFile,
            transcriptionFile: this.transcriptionFile,
            illustrationFile: this.illustrationFile,
            metadata: this.metadata
        };
    }
    
    static fromJSON(data) {
        const chapter = new Chapter(data.id, data.title, data.type, {
            audioFile: data.audioFile,
            transcriptionFile: data.transcriptionFile,
            illustrationFile: data.illustrationFile,
            metadata: data.metadata || {}
        });
        
        if (data.sections) {
            data.sections.forEach(sectionData => {
                chapter.addSection(Section.fromJSON(sectionData));
            });
        }
        
        return chapter;
    }
}

/**
 * Represents the complete book with metadata and chapters
 */
class Book {
    constructor(title, subtitle, author, options = {}) {
        this.title = title;
        this.subtitle = subtitle;
        this.author = author;
        this.chapters = [];
        this.coverElements = [];
        this.metadata = options.metadata || {};
        this.version = options.version || '1.0.0';
        this.created = options.created || new Date().toISOString();
        this.modified = new Date().toISOString();
    }
    
    /**
     * Add a chapter to this book
     */
    addChapter(chapter) {
        if (!(chapter instanceof Chapter)) {
            throw new Error('Must add Chapter instance');
        }
        this.chapters.push(chapter);
        this.modified = new Date().toISOString();
        return this;
    }
    
    /**
     * Add a cover element (title, subtitle, author spans, etc.)
     */
    addCoverElement(element) {
        this.coverElements.push(element);
        this.modified = new Date().toISOString();
        return this;
    }
    
    /**
     * Get chapter by ID
     */
    getChapter(id) {
        return this.chapters.find(c => c.id === id);
    }
    
    /**
     * Get all words across entire book
     */
    get allWords() {
        const coverWords = this.coverElements.flatMap(e => e.words || []);
        const chapterWords = this.chapters.flatMap(c => c.allWords);
        return [...coverWords, ...chapterWords];
    }
    
    /**
     * Get comprehensive mapping statistics for entire book
     */
    get mappingStats() {
        const chapterStats = this.chapters.map(c => c.mappingStats);
        
        const totalWords = chapterStats.reduce((sum, stat) => sum + stat.totalWords, 0);
        const mappedWords = chapterStats.reduce((sum, stat) => sum + stat.mappedWords, 0);
        const totalSentences = chapterStats.reduce((sum, stat) => sum + stat.totalSentences, 0);
        const mappedSentences = chapterStats.reduce((sum, stat) => sum + stat.mappedSentences, 0);
        const totalSections = chapterStats.reduce((sum, stat) => sum + stat.totalSections, 0);
        const mappedSections = chapterStats.reduce((sum, stat) => sum + stat.mappedSections, 0);
        
        return {
            totalWords,
            mappedWords,
            wordMappingPercentage: totalWords > 0 ? (mappedWords / totalWords) * 100 : 0,
            totalSentences,
            mappedSentences,
            sentenceMappingPercentage: totalSentences > 0 ? (mappedSentences / totalSentences) * 100 : 0,
            totalSections,
            mappedSections,
            sectionMappingPercentage: totalSections > 0 ? (mappedSections / totalSections) * 100 : 0,
            totalChapters: this.chapters.length,
            mappedChapters: this.chapters.filter(c => c.isFullyMapped).length,
            chapterMappingPercentage: this.chapters.length > 0 ? 
                (this.chapters.filter(c => c.isFullyMapped).length / this.chapters.length) * 100 : 0,
            chapterStats
        };
    }
    
    toJSON() {
        return {
            title: this.title,
            subtitle: this.subtitle,
            author: this.author,
            chapters: this.chapters.map(c => c.toJSON()),
            coverElements: this.coverElements,
            metadata: this.metadata,
            version: this.version,
            created: this.created,
            modified: this.modified
        };
    }
    
    static fromJSON(data) {
        const book = new Book(data.title, data.subtitle, data.author, {
            metadata: data.metadata || {},
            version: data.version,
            created: data.created
        });
        
        if (data.chapters) {
            data.chapters.forEach(chapterData => {
                book.addChapter(Chapter.fromJSON(chapterData));
            });
        }
        
        if (data.coverElements) {
            book.coverElements = data.coverElements;
        }
        
        return book;
    }
}

/**
 * Represents transcription data from speech-to-text services
 */
class Transcription {
    constructor(text, duration, options = {}) {
        this.text = text;
        this.duration = duration;
        this.language = options.language || 'english';
        this.words = [];
        this.confidence = options.confidence || null;
        this.model = options.model || null;
        this.created = new Date().toISOString();
    }
    
    /**
     * Add a transcribed word with timing
     */
    addWord(word, start, end, confidence = null) {
        const timing = new AudioTiming(start, end);
        const transcriptionWord = new Word(word, {
            transcriptionIndex: this.words.length,
            timing,
            confidence
        });
        this.words.push(transcriptionWord);
        return this;
    }
    
    /**
     * Get word at specific time
     */
    getWordAtTime(timestamp) {
        return this.words.find(w => w.timing && w.timing.contains(timestamp));
    }
    
    /**
     * Get words within time range
     */
    getWordsInRange(startTime, endTime) {
        return this.words.filter(w => 
            w.timing && 
            w.timing.start >= startTime && 
            w.timing.end <= endTime
        );
    }
    
    toJSON() {
        return {
            text: this.text,
            duration: this.duration,
            language: this.language,
            words: this.words.map(w => w.toJSON()),
            confidence: this.confidence,
            model: this.model,
            created: this.created
        };
    }
    
    static fromJSON(data) {
        const transcription = new Transcription(data.text, data.duration, {
            language: data.language,
            confidence: data.confidence,
            model: data.model
        });
        
        if (data.words) {
            data.words.forEach(wordData => {
                transcription.addWord(
                    wordData.text,
                    wordData.timing.start,
                    wordData.timing.end,
                    wordData.confidence
                );
            });
        }
        
        return transcription;
    }
}

module.exports = {
    AudioTiming,
    Word,
    Sentence,
    Section,
    Chapter,
    Book,
    Transcription
};