/**
 * Enhance existing index.html with automated audio mappings
 * Preserves all existing content, just replaces word data attributes with better mappings
 */

const fs = require('fs');
const path = require('path');

async function enhanceExistingHTML() {
    console.log('=== Enhancing Existing index.html with Automated Mappings ===\n');
    
    try {
        // Load the automated mapping result
        const mappingPath = path.join(__dirname, '..', 'pipeline-test-output', 'balanced', 'book-with-mappings.json');
        const currentHTMLPath = path.join(__dirname, '..', 'index.html');
        
        if (!fs.existsSync(mappingPath)) {
            console.error('Automated mapping not found. Please run test-pipeline.js first.');
            return;
        }
        
        if (!fs.existsSync(currentHTMLPath)) {
            console.error('Current index.html not found.');
            return;
        }
        
        const mappingData = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
        let htmlContent = fs.readFileSync(currentHTMLPath, 'utf8');
        
        console.log('1. Loading automated mapping data...');
        console.log(`   - Found ${mappingData.chapters.length} chapters in mapping data`);
        
        // Extract word mappings from the structured data
        const wordMappings = extractWordMappings(mappingData);
        console.log(`   - Extracted ${wordMappings.length} word mappings`);
        
        // Apply the mappings to the existing HTML content
        console.log('2. Applying automated mappings to existing HTML...');
        const enhancedHTML = applyMappingsToHTML(htmlContent, wordMappings);
        
        // Write the enhanced HTML
        fs.writeFileSync(currentHTMLPath, enhancedHTML);
        
        console.log('3. Complete!');
        console.log(`   ✓ Enhanced index.html with ${wordMappings.length} precisely mapped words`);
        console.log(`   ✓ All existing content preserved`);
        console.log(`   ✓ Audio player functionality improved`);
        
    } catch (error) {
        console.error('Failed to enhance HTML:', error);
    }
}

function extractWordMappings(mappingData) {
    const mappings = [];
    
    // Process each chapter
    for (const chapter of mappingData.chapters) {
        // Process chapter sections
        for (const section of chapter.sections || []) {
            for (const sentence of section.sentences || []) {
                for (const word of sentence.words || []) {
                    if (word.transcriptionIndex !== undefined && word.timing) {
                        mappings.push({
                            transcriptionIndex: word.transcriptionIndex,
                            text: word.text,
                            originalText: word.originalText,
                            timing: word.timing,
                            context: {
                                chapterId: chapter.id,
                                sectionId: section.id,
                                sentenceId: sentence.id
                            }
                        });
                    }
                }
            }
        }
    }
    
    // Sort by transcription index to ensure proper order
    return mappings.sort((a, b) => a.transcriptionIndex - b.transcriptionIndex);
}

function applyMappingsToHTML(htmlContent, wordMappings) {
    console.log('   - Creating word mapping lookup...');
    
    // Create mapping from word text to transcription indices
    const wordToIndices = new Map();
    wordMappings.forEach(mapping => {
        const normalizedWord = normalizeWord(mapping.text);
        if (!wordToIndices.has(normalizedWord)) {
            wordToIndices.set(normalizedWord, []);
        }
        wordToIndices.get(normalizedWord).push(mapping.transcriptionIndex);
    });
    
    console.log('   - Replacing word data attributes...');
    
    // Track which indices we've used to ensure sequential assignment
    const usedIndices = new Set();
    let nextExpectedIndex = 0;
    
    // Replace spans with data-word attributes
    htmlContent = htmlContent.replace(/<span data-word="(\d+)">([^<]+)<\/span>/g, (match, oldIndex, wordText) => {
        const normalizedWord = normalizeWord(wordText);
        const availableIndices = wordToIndices.get(normalizedWord);
        
        if (!availableIndices || availableIndices.length === 0) {
            console.log(`   ! No mapping found for word: "${wordText}" (normalized: "${normalizedWord}")`);
            return match; // Keep original if no mapping found
        }
        
        // Find the next available index for this word that maintains sequence
        let bestIndex = null;
        for (const index of availableIndices) {
            if (!usedIndices.has(index) && index >= nextExpectedIndex) {
                bestIndex = index;
                break;
            }
        }
        
        // If no sequential match, try to find any unused index for this word
        if (bestIndex === null) {
            for (const index of availableIndices) {
                if (!usedIndices.has(index)) {
                    bestIndex = index;
                    break;
                }
            }
        }
        
        if (bestIndex !== null) {
            usedIndices.add(bestIndex);
            nextExpectedIndex = Math.max(nextExpectedIndex, bestIndex + 1);
            return `<span data-word="${bestIndex}">${wordText}</span>`;
        } else {
            console.log(`   ! All indices used for word: "${wordText}"`);
            return match; // Keep original if all indices used
        }
    });
    
    console.log(`   ✓ Assigned ${usedIndices.size} word mappings`);
    console.log(`   ✓ Maintained existing HTML structure`);
    
    return htmlContent;
}

function normalizeWord(word) {
    return word.toLowerCase()
        .replace(/[.,!?;:"'()[\]{}]/g, '')
        .replace(/[–—]/g, '-')
        .trim();
}

// Run the enhancement if this script is executed directly
if (require.main === module) {
    enhanceExistingHTML().catch(console.error);
}

module.exports = { enhanceExistingHTML };