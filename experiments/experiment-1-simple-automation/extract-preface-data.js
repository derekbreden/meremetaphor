const fs = require('fs');
const path = require('path');

/**
 * Proof of concept: Extract preface content to structured data format
 * This demonstrates how we could restructure our HTML generation pipeline
 * to be more audio-friendly from the start.
 */

function extractPrefaceToStructuredData() {
    console.log('Extracting preface to structured data format...');
    
    // Load existing transcription (our ground truth for audio timing)
    const transcriptionPath = path.join(__dirname, '..', '..', 'transcription_with_timestamps.json');
    const transcription = JSON.parse(fs.readFileSync(transcriptionPath, 'utf8'));
    
    // Define the preface content in structured format
    const prefaceData = {
        id: 'preface',
        title: 'Preface',
        type: 'preface',
        audioFile: 'cover_and_preface.mp3',
        transcriptionFile: 'transcription_with_timestamps.json',
        sections: [
            {
                id: 'preface-intro',
                type: 'paragraph',
                sentences: [
                    {
                        id: 'preface-s1',
                        text: 'If you believe in a supernatural entity or a creator of the universe, that\'s not what this book is about.',
                        transcriptionStart: 12, // Word index in transcription
                        transcriptionEnd: 31
                    },
                    {
                        id: 'preface-s2', 
                        text: 'This book is about an entirely naturalistic (non- supernatural), physicalist, determinist, materialist view of religion and the meaning of the metaphors within it from that (natural) perspective.',
                        transcriptionStart: 32,
                        transcriptionEnd: 58
                    }
                ]
            },
            {
                id: 'preface-journey',
                type: 'paragraph',
                sentences: [
                    {
                        id: 'preface-s3',
                        text: 'I understand each reader has their own journey of faith.',
                        transcriptionStart: 59,
                        transcriptionEnd: 68
                    },
                    {
                        id: 'preface-s4',
                        text: 'I\'ve seen a spectrum of experience in my own family, from atheism, to conservative Christianity, to progressive Christianity, and many things in between.',
                        transcriptionStart: 69,
                        transcriptionEnd: 91
                    },
                    {
                        id: 'preface-s5',
                        text: 'My intent isn\'t to challenge your path, but simply to share and explain a particular one — my own.',
                        transcriptionStart: 92,
                        transcriptionEnd: 109
                    }
                ]
            },
            {
                id: 'preface-perspective',
                type: 'paragraph', 
                sentences: [
                    {
                        id: 'preface-s6',
                        text: 'I realize not everyone reading this book will share my perspective, but hopefully what is presented here will not be a challenge, but simply information.',
                        transcriptionStart: 110,
                        transcriptionEnd: 134
                    }
                ]
            },
            {
                id: 'preface-audience',
                type: 'paragraph',
                sentences: [
                    {
                        id: 'preface-s7',
                        text: 'I see the audience here as Christians who struggle with believability, atheists who struggle with living as a minority in a Christian society, and most importantly — anyone who seeks to understand either of those two groups better.',
                        transcriptionStart: 135,
                        transcriptionEnd: 171
                    }
                ]
            },
            {
                id: 'preface-goal',
                type: 'paragraph',
                sentences: [
                    {
                        id: 'preface-s8',
                        text: 'I hope to present here an interpretation of Christianity (or at least some part of Christianity) that is compatible with an entirely natural universe.',
                        transcriptionStart: 172,
                        transcriptionEnd: 195
                    }
                ]
            }
        ]
    };
    
    // Add word-level breakdown for each sentence
    prefaceData.sections.forEach(section => {
        section.sentences.forEach(sentence => {
            sentence.words = extractWordsFromSentence(sentence, transcription);
        });
    });
    
    // Include cover page content that precedes preface text
    const coverContent = {
        id: 'cover',
        title: 'Cover',
        type: 'cover',
        audioFile: 'cover_and_preface.mp3',
        elements: [
            {
                type: 'title',
                text: 'Mere Metaphor',
                transcriptionStart: 0,
                transcriptionEnd: 1,
                words: [
                    { text: 'Mere', transcriptionIndex: 0 },
                    { text: 'Metaphor', transcriptionIndex: 1 }
                ]
            },
            {
                type: 'subtitle',
                text: 'Understanding Religious Language as a Materialist',
                transcriptionStart: 2,
                transcriptionEnd: 7,
                words: [
                    { text: 'Understanding', transcriptionIndex: 2 },
                    { text: 'Religious', transcriptionIndex: 3 },
                    { text: 'Language', transcriptionIndex: 4 },
                    { text: 'as', transcriptionIndex: 5 },
                    { text: 'a', transcriptionIndex: 6 },
                    { text: 'Materialist', transcriptionIndex: 7 }
                ]
            },
            {
                type: 'author',
                text: 'by Derek Bredensteiner',
                transcriptionStart: 8,
                transcriptionEnd: 10,
                words: [
                    { text: 'by', transcriptionIndex: 8 },
                    { text: 'Derek', transcriptionIndex: 9 },
                    { text: 'Bredensteiner', transcriptionIndex: 10 }
                ]
            },
            {
                type: 'heading',
                text: 'Preface',
                transcriptionStart: 11,
                transcriptionEnd: 11,
                words: [
                    { text: 'Preface', transcriptionIndex: 11 }
                ]
            }
        ]
    };
    
    // Combine into full content structure
    const fullContent = {
        book: {
            title: 'Mere Metaphor',
            subtitle: 'Understanding Religious Language as a Materialist',
            author: 'Derek Bredensteiner'
        },
        cover: coverContent,
        chapters: [prefaceData]
    };
    
    // Save structured data
    const outputPath = path.join(__dirname, '..', '..', 'content');
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath);
    }
    
    fs.writeFileSync(
        path.join(outputPath, 'preface-structured.json'),
        JSON.stringify(fullContent, null, 2)
    );
    
    console.log('✓ Extracted preface to structured format');
    console.log('✓ Saved to content/preface-structured.json');
    console.log(`✓ Mapped ${prefaceData.sections.length} sections`);
    console.log(`✓ Total sentences: ${prefaceData.sections.reduce((sum, s) => sum + s.sentences.length, 0)}`);
    
    return fullContent;
}

function extractWordsFromSentence(sentence, transcription) {
    const words = [];
    const sentenceWords = sentence.text
        .replace(/[.,!?;:"""''()—–-]/g, '') // Remove punctuation for matching
        .split(/\s+/)
        .filter(word => word.length > 0);
    
    // Map sentence words to transcription indices
    for (let i = 0; i < sentenceWords.length; i++) {
        const transcriptionIndex = sentence.transcriptionStart + i;
        if (transcriptionIndex <= sentence.transcriptionEnd && transcriptionIndex < transcription.words.length) {
            words.push({
                text: sentenceWords[i],
                transcriptionIndex: transcriptionIndex,
                timing: {
                    start: transcription.words[transcriptionIndex].start,
                    end: transcription.words[transcriptionIndex].end
                }
            });
        }
    }
    
    return words;
}

// Run the extraction
if (require.main === module) {
    extractPrefaceToStructuredData();
}

module.exports = { extractPrefaceToStructuredData };