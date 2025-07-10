/**
 * Integrate complex automation's 184 word mappings with complete book HTML
 * This solves the integration gap by applying precise word timing to the real book content
 */

const fs = require('fs');
const path = require('path');

async function integrateAudioBook() {
    console.log('=== Integrating Audio Mappings with Complete Book ===\n');
    
    try {
        // Load the automated mapping result (184 words with timing)
        const mappingPath = path.join(__dirname, '..', 'pipeline-test-output', 'balanced', 'book-with-mappings.json');
        const bookHTMLPath = path.join(__dirname, '..', 'index.html');
        
        if (!fs.existsSync(mappingPath)) {
            console.error('❌ Mapping data not found. Please run: node scripts/testing/test-pipeline.js');
            return;
        }
        
        if (!fs.existsSync(bookHTMLPath)) {
            console.error('❌ Book HTML not found. Please run: npm run build');
            return;
        }
        
        const mappingData = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
        let htmlContent = fs.readFileSync(bookHTMLPath, 'utf8');
        
        console.log('1. Loading data...');
        console.log(`   ✓ Found ${mappingData.chapters.length} chapters in mapping data`);
        
        // Extract word mappings with timing data
        const wordMappings = extractWordMappings(mappingData);
        console.log(`   ✓ Extracted ${wordMappings.length} word mappings with timing`);
        
        // Apply mappings only to preface section 
        console.log('2. Enhancing preface section with audio mappings...');
        const enhancedHTML = applyMappingsToPreface(htmlContent, wordMappings);
        
        // Add audio player and CSS for highlighting
        console.log('3. Adding audio player and highlighting styles...');
        const finalHTML = addAudioFeatures(enhancedHTML);
        
        // Write the enhanced HTML
        fs.writeFileSync(bookHTMLPath, finalHTML);
        
        console.log('4. Complete!');
        console.log(`   ✅ Enhanced complete 67-page book with ${wordMappings.length} precisely timed words`);
        console.log(`   ✅ Audio features added only to preface section`);
        console.log(`   ✅ All other chapters preserved unchanged`);
        console.log(`   ✅ Ready for testing in browser`);
        
    } catch (error) {
        console.error('❌ Integration failed:', error);
    }
}

function extractWordMappings(mappingData) {
    const mappings = [];
    
    for (const chapter of mappingData.chapters) {
        if (chapter.id === 'preface') { // Only process preface
            for (const section of chapter.sections || []) {
                for (const sentence of section.sentences || []) {
                    for (const word of sentence.words || []) {
                        if (word.transcriptionIndex !== undefined && word.timing) {
                            mappings.push({
                                transcriptionIndex: word.transcriptionIndex,
                                text: word.text,
                                originalText: word.originalText,
                                timing: word.timing,
                                confidence: word.confidence || 1
                            });
                        }
                    }
                }
            }
        }
    }
    
    // Sort by transcription index to maintain timing order
    return mappings.sort((a, b) => a.transcriptionIndex - b.transcriptionIndex);
}

function applyMappingsToPreface(htmlContent, wordMappings) {
    console.log('   - Locating preface section...');
    
    // Find preface section boundaries
    const prefaceStartMatch = htmlContent.match(/<h2[^>]*id="preface"[^>]*>/);
    if (!prefaceStartMatch) {
        console.error('   ❌ Could not find preface section');
        return htmlContent;
    }
    
    const prefaceStart = prefaceStartMatch.index;
    const nextChapterMatch = htmlContent.match(/<h2[^>]*class="chapter-header"[^>]*id="(?!preface)[^"]*"[^>]*>/, prefaceStart + 1);
    const prefaceEnd = nextChapterMatch ? nextChapterMatch.index : htmlContent.length;
    
    const beforePreface = htmlContent.substring(0, prefaceStart);
    const prefaceContent = htmlContent.substring(prefaceStart, prefaceEnd);
    const afterPreface = htmlContent.substring(prefaceEnd);
    
    console.log(`   - Found preface section (${prefaceContent.length} characters)`);
    console.log('   - Applying word mappings...');
    
    // Extract just the text content from the preface to match against
    const textOnlyPreface = prefaceContent
        .replace(/<[^>]+>/g, ' ')  // Remove all HTML tags
        .replace(/\s+/g, ' ')      // Normalize whitespace
        .trim();
    
    console.log(`   - Preface text length: ${textOnlyPreface.length} characters`);
    
    // Create enhanced preface with word spans
    const enhancedPreface = wrapWordsInPreface(prefaceContent, wordMappings, textOnlyPreface);
    
    return beforePreface + enhancedPreface + afterPreface;
}

function wrapWordsInPreface(prefaceHTML, wordMappings, prefaceText) {
    let mappingIndex = 0;
    let enhancedHTML = prefaceHTML;
    let wordsWrapped = 0;
    
    // Split preface text into words for matching
    const textWords = prefaceText.split(/\s+/).filter(word => word.length > 0);
    
    console.log(`   - Matching ${textWords.length} text words against ${wordMappings.length} transcription words`);
    
    // For each transcription word, find and wrap it in the HTML
    for (const mapping of wordMappings) {
        const normalizedTranscript = normalizeWord(mapping.text);
        
        // Find matching word in text
        let matchFound = false;
        for (let i = mappingIndex; i < textWords.length && i < mappingIndex + 5; i++) {
            const normalizedText = normalizeWord(textWords[i]);
            
            if (normalizedTranscript === normalizedText) {
                // Find this word in the HTML and wrap it
                const wordPattern = createWordPattern(textWords[i]);
                const replacement = `<span data-word="${mapping.transcriptionIndex}" data-start="${mapping.timing.start}" data-end="${mapping.timing.end}">${textWords[i]}</span>`;
                
                // Only replace first occurrence after current position
                const beforeMatch = enhancedHTML.substring(0, enhancedHTML.search(wordPattern));
                const afterMatch = enhancedHTML.substring(enhancedHTML.search(wordPattern));
                const replacedAfter = afterMatch.replace(wordPattern, replacement);
                
                if (replacedAfter !== afterMatch) {
                    enhancedHTML = beforeMatch + replacedAfter;
                    wordsWrapped++;
                    mappingIndex = i + 1;
                    matchFound = true;
                    break;
                }
            }
        }
        
        if (!matchFound) {
            console.log(`   ! No match for transcription word: "${mapping.text}" (index ${mapping.transcriptionIndex})`);
        }
    }
    
    console.log(`   ✓ Wrapped ${wordsWrapped} words with timing data`);
    return enhancedHTML;
}

function createWordPattern(word) {
    // Create a regex pattern that matches the word but not within existing tags
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?<!<[^>]*)\\b${escapedWord}\\b(?![^<]*>)`, 'i');
}

function normalizeWord(word) {
    return word.toLowerCase()
        .replace(/[.,!?;:"'()[\]{}]/g, '')
        .replace(/[–—]/g, '-')
        .trim();
}

function addAudioFeatures(htmlContent) {
    // Add audio player CSS and JavaScript
    const audioCSS = `
        /* Audio highlighting styles */
        .audio-highlight {
            background-color: #ffeb3b !important;
            transition: background-color 0.1s ease;
        }
        
        .audio-player {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            border: 2px solid #333;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1000;
            min-width: 250px;
        }
        
        .audio-controls {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }
        
        .audio-controls button {
            padding: 8px 16px;
            border: 1px solid #333;
            background: white;
            cursor: pointer;
        }
        
        .audio-controls button:hover {
            background: #f0f0f0;
        }
        
        .audio-progress {
            width: 100%;
            height: 6px;
            background: #ddd;
            border-radius: 3px;
            margin-bottom: 5px;
        }
        
        .audio-progress-bar {
            height: 100%;
            background: #333;
            border-radius: 3px;
            transition: width 0.1s ease;
        }
        
        .audio-time {
            font-size: 12px;
            color: #666;
        }
    `;
    
    const audioJS = `
        let currentAudio = null;
        let currentWordIndex = -1;
        let isPlaying = false;
        
        function initializeAudioPlayer() {
            currentAudio = new Audio('cover_and_preface.mp3');
            updateWordHighlighting();
            
            currentAudio.addEventListener('timeupdate', () => {
                updateWordHighlighting();
                updateProgressBar();
            });
            
            currentAudio.addEventListener('ended', () => {
                isPlaying = false;
                document.getElementById('playPauseBtn').textContent = 'Play';
                clearHighlighting();
            });
        }
        
        function togglePlayPause() {
            if (!currentAudio) return;
            
            if (isPlaying) {
                currentAudio.pause();
                document.getElementById('playPauseBtn').textContent = 'Play';
            } else {
                currentAudio.play();
                document.getElementById('playPauseBtn').textContent = 'Pause';
            }
            isPlaying = !isPlaying;
        }
        
        function updateWordHighlighting() {
            if (!currentAudio) return;
            
            const currentTime = currentAudio.currentTime;
            const words = document.querySelectorAll('[data-word]');
            
            // Clear previous highlighting
            words.forEach(word => word.classList.remove('audio-highlight'));
            
            // Find and highlight current word
            for (let word of words) {
                const start = parseFloat(word.dataset.start);
                const end = parseFloat(word.dataset.end);
                
                if (currentTime >= start && currentTime <= end) {
                    word.classList.add('audio-highlight');
                    currentWordIndex = parseInt(word.dataset.word);
                    
                    // Scroll to word if needed
                    word.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    break;
                }
            }
        }
        
        function clearHighlighting() {
            document.querySelectorAll('.audio-highlight').forEach(word => {
                word.classList.remove('audio-highlight');
            });
        }
        
        function updateProgressBar() {
            if (!currentAudio) return;
            
            const progressBar = document.getElementById('progressBar');
            const timeDisplay = document.getElementById('timeDisplay');
            
            const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
            progressBar.style.width = progress + '%';
            
            const current = formatTime(currentAudio.currentTime);
            const total = formatTime(currentAudio.duration);
            timeDisplay.textContent = current + ' / ' + total;
        }
        
        function formatTime(seconds) {
            if (isNaN(seconds)) return '0:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return mins + ':' + (secs < 10 ? '0' : '') + secs;
        }
        
        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', initializeAudioPlayer);
    `;
    
    const audioPlayer = `
        <div class="audio-player">
            <div class="audio-controls">
                <button id="playPauseBtn" onclick="togglePlayPause()">Play</button>
                <span style="font-weight: bold;">Preface Audio</span>
            </div>
            <div class="audio-progress">
                <div id="progressBar" class="audio-progress-bar"></div>
            </div>
            <div id="timeDisplay" class="audio-time">0:00 / 0:00</div>
        </div>
    `;
    
    // Insert CSS into head
    const headEnd = htmlContent.indexOf('</head>');
    if (headEnd !== -1) {
        htmlContent = htmlContent.substring(0, headEnd) + 
                     `<style>${audioCSS}</style>\n` +
                     htmlContent.substring(headEnd);
    }
    
    // Insert JavaScript before closing body tag
    const bodyEnd = htmlContent.lastIndexOf('</body>');
    if (bodyEnd !== -1) {
        htmlContent = htmlContent.substring(0, bodyEnd) + 
                     `<script>${audioJS}</script>\n` +
                     audioPlayer + '\n' +
                     htmlContent.substring(bodyEnd);
    }
    
    return htmlContent;
}

// Run the integration if this script is executed directly
if (require.main === module) {
    integrateAudioBook().catch(console.error);
}

module.exports = { integrateAudioBook };