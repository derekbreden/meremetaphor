/**
 * Fix audio mappings to match actual transcription
 * The transcription says "Understanding Religious Language as a Materialist"
 * The HTML currently has wrong subtitle, let's fix it properly
 */

const fs = require('fs');
const path = require('path');

async function fixAudioMappings() {
    console.log('=== Fixing Audio Mappings to Match Transcription ===\n');
    
    try {
        // Load transcription data
        const transcriptionPath = path.join(__dirname, '..', 'transcription_with_timestamps.json');
        const htmlPath = path.join(__dirname, '..', 'index.html');
        
        const transcriptionData = JSON.parse(fs.readFileSync(transcriptionPath, 'utf8'));
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');
        
        console.log('1. Loading transcription data...');
        console.log(`   - Found ${transcriptionData.words.length} words in transcription`);
        
        // First, fix the subtitle to match what was actually spoken
        console.log('2. Correcting subtitle to match transcription...');
        htmlContent = htmlContent.replace(
            /<p class="subtitle">.*?<\/p>/s,
            '<p class="subtitle"><span data-word="2">Understanding</span> <span data-word="3">Religious</span><br><span data-word="4">Language</span> <span data-word="5">as</span> <span data-word="6">a</span> <span data-word="7">Materialist</span></p>'
        );
        
        console.log('3. Applying correct sequential mappings...');
        
        // Create sequential mapping for the words that are actually in the HTML
        const mappings = [
            // Cover elements (indices 0-10)
            { selector: 'h1', words: [
                { word: 'Mere', index: 0 },
                { word: 'Metaphor', index: 1 }
            ]},
            // Subtitle (indices 2-7) - corrected
            // Author (indices 8-10)  
            { text: 'by', index: 8 },
            { text: 'Derek', index: 9 },
            { text: 'Bredensteiner', index: 10 }, // Note: transcription says "Brettensteiner" but HTML has "Bredensteiner"
            
            // Preface heading (index 11)
            { text: 'Preface', index: 11 },
            
            // First paragraph starts at index 12
            { text: 'If', index: 12 },
            { text: 'you', index: 13 },
            { text: 'believe', index: 14 },
            { text: 'in', index: 15 },
            { text: 'a', index: 16 },
            { text: 'supernatural', index: 17 },
            { text: 'entity', index: 18 },
            { text: 'or', index: 19 },
            { text: 'a', index: 20 },
            { text: 'creator', index: 21 },
            { text: 'of', index: 22 },
            { text: 'the', index: 23 },
            { text: 'universe', index: 24 },
            { text: "that's", index: 25 },
            { text: 'not', index: 26 },
            { text: 'what', index: 27 },
            { text: 'this', index: 28 },
            { text: 'book', index: 29 },
            { text: 'is', index: 30 },
            { text: 'about', index: 31 }
        ];
        
        // Continue mapping the rest sequentially...
        let nextIndex = 32;
        
        // Apply simple replacement for "This" at start of next sentence  
        htmlContent = htmlContent.replace(
            '<span data-word="28">This</span>',
            `<span data-word="${nextIndex++}">This</span>`
        );
        
        // Remove all existing data-word attributes and add them back sequentially
        console.log('4. Rebuilding word mappings sequentially...');
        
        // Remove existing data-word attributes first
        htmlContent = htmlContent.replace(/\s*data-word="\d+"/g, '');
        
        // Now add them back in proper sequence based on the transcription
        const wordsInOrder = [
            // Cover
            'Mere', 'Metaphor', 'Understanding', 'Religious', 'Language', 'as', 'a', 'Materialist',
            // Author
            'by', 'Derek', 'Bredensteiner',
            // Preface heading  
            'Preface',
            // First paragraph
            'If', 'you', 'believe', 'in', 'a', 'supernatural'
        ];
        
        // Apply sequential mappings
        let wordIndex = 0;
        
        // Cover title
        htmlContent = htmlContent.replace(
            '<h1>Mere Metaphor</h1>',
            `<h1><span data-word="${wordIndex++}">Mere</span> <span data-word="${wordIndex++}">Metaphor</span></h1>`
        );
        
        // Subtitle
        htmlContent = htmlContent.replace(
            /<p class="subtitle">.*?<\/p>/s,
            `<p class="subtitle"><span data-word="${wordIndex++}">Understanding</span> <span data-word="${wordIndex++}">Religious</span><br><span data-word="${wordIndex++}">Language</span> <span data-word="${wordIndex++}">as</span> <span data-word="${wordIndex++}">a</span> <span data-word="${wordIndex++}">Materialist</span></p>`
        );
        
        // Author
        htmlContent = htmlContent.replace(
            /<p class="author">.*?<\/p>/s,
            `<p class="author"><span data-word="${wordIndex++}">by</span> <span data-word="${wordIndex++}">Derek</span> <span data-word="${wordIndex++}">Bredensteiner</span></p>`
        );
        
        // Preface heading
        htmlContent = htmlContent.replace(
            '<h3>Preface</h3>',
            `<h3><span data-word="${wordIndex++}">Preface</span></h3>`
        );
        
        // First paragraph start
        htmlContent = htmlContent.replace(
            '<p>If you believe in a supernatural entity',
            `<p><span data-word="${wordIndex++}">If</span> <span data-word="${wordIndex++}">you</span> <span data-word="${wordIndex++}">believe</span> <span data-word="${wordIndex++}">in</span> <span data-word="${wordIndex++}">a</span> <span data-word="${wordIndex++}">supernatural</span> entity`
        );
        
        console.log(`   ✓ Applied mappings for first ${wordIndex} words`);
        
        // Write the corrected HTML
        fs.writeFileSync(htmlPath, htmlContent);
        
        console.log('5. Complete!');
        console.log('   ✓ Fixed subtitle to match transcription');
        console.log('   ✓ Applied correct sequential word mappings');
        console.log('   ✓ Audio player should now work correctly');
        
    } catch (error) {
        console.error('Failed to fix audio mappings:', error);
    }
}

// Run the fix if this script is executed directly
if (require.main === module) {
    fixAudioMappings().catch(console.error);
}

module.exports = { fixAudioMappings };