const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PDFExtract } = require('pdf.js-extract');

// Audio configuration
const AUDIO_SECTIONS = {
    'preface': {
        audioFile: 'cover_and_preface.mp3',
        transcriptionFile: 'transcription_with_timestamps.json',
        startText: 'If you believe in a supernatural entity',
        endText: 'entirely natural universe'
    }
};

// Constants for text processing (copied from build.js)
const PARAGRAPH_SPACING_THRESHOLD = 25;
const TITLE_ITEM_INDEX_LIMIT = 10;
const TITLE_TEXT_LENGTH_LIMIT = 50;

async function buildSiteWithAudio() {
    console.log('Building site with audio integration...');
    
    try {
        // Copy image extraction from build.js (same process)
        await extractEmbeddedImagesWithMasks();
        
        // Load transcription data
        const transcription = await loadTranscription();
        console.log(`Loaded ${transcription.words.length} transcription words`);
        
        // Extract text with audio integration
        await extractTextWithAudio(transcription);
        
        console.log('Build complete with audio integration!');
    } catch (error) {
        console.error('Error building site with audio:', error);
        process.exit(1);
    }
}

async function loadTranscription() {
    const transcriptionPath = path.join(__dirname, '..', '..', 'transcription_with_timestamps.json');
    if (!fs.existsSync(transcriptionPath)) {
        throw new Error('Transcription file not found. Please run transcription first.');
    }
    return JSON.parse(fs.readFileSync(transcriptionPath, 'utf8'));
}

async function extractEmbeddedImagesWithMasks() {
    console.log('Extracting embedded images with transparency masks...');
    
    const imagesDir = path.join(__dirname, '..', '..', 'images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir);
    }
    
    const tempDir = path.join(__dirname, '..', '..', 'temp-extracted');
    if (fs.existsSync(tempDir)) {
        execSync(`rm -rf "${tempDir}"`);
    }
    fs.mkdirSync(tempDir);
    
    try {
        execSync(`pdfimages -png "meremetaphor.pdf" "${path.join(tempDir, 'img')}"`, {
            cwd: path.join(__dirname, '..', '..'),
            stdio: 'pipe'
        });
        
        const imageMap = [
            { image: 'img-000.png', mask: 'img-001.png', dest: 'cover.png', description: 'Cover tree illustration' },
            { image: 'img-002.png', mask: 'img-003.png', dest: 'preface-illustration.png', description: 'Preface illustration' },
            { image: 'img-004.png', mask: 'img-005.png', dest: 'about-author-illustration.png', description: 'About the Author illustration' },
            { image: 'img-006.png', mask: 'img-007.png', dest: 'metaphor-illustration.png', description: 'Introduction: Metaphor illustration' },
            { image: 'img-008.png', mask: 'img-009.png', dest: 'god-illustration.png', description: 'God: Love Within and Between Us illustration' },
            { image: 'img-010.png', mask: 'img-011.png', dest: 'freewill-illustration.png', description: 'Free Will illustration' },
            { image: 'img-012.png', mask: 'img-013.png', dest: 'good-illustration.png', description: 'Good: A Direction We Choose illustration' },
            { image: 'img-014.png', mask: 'img-015.png', dest: 'sin-illustration.png', description: 'Sin illustration' },
            { image: 'img-016.png', mask: 'img-017.png', dest: 'redemption-illustration.png', description: 'Redemption illustration' },
            { image: 'img-018.png', mask: 'img-019.png', dest: 'heaven-illustration.png', description: 'Heaven illustration' },
            { image: 'img-020.png', mask: 'img-021.png', dest: 'prayer-illustration.png', description: 'Prayer illustration' },
            { image: 'img-022.png', mask: 'img-023.png', dest: 'voices-illustration.png', description: 'Voices illustration' },
            { image: 'img-024.png', mask: 'img-025.png', dest: 'afterword-illustration.png', description: 'Afterword illustration' },
            { image: 'img-026.png', mask: 'img-027.png', dest: 'glossary-illustration.png', description: 'Glossary illustration' }
        ];

        for (const mapping of imageMap) {
            const imagePath = path.join(tempDir, mapping.image);
            const maskPath = path.join(tempDir, mapping.mask);
            const destPath = path.join(imagesDir, mapping.dest);
            
            if (fs.existsSync(imagePath)) {
                if (fs.existsSync(maskPath)) {
                    execSync(`convert "${imagePath}" "${maskPath}" -alpha off -compose copy-opacity -composite "${destPath}"`, { stdio: 'pipe' });
                } else {
                    execSync(`cp "${imagePath}" "${destPath}"`, { stdio: 'pipe' });
                }
                
                const stats = fs.statSync(destPath);
                const sizeKB = Math.round(stats.size / 1024);
                console.log(`    ✓ ${mapping.dest} (${sizeKB}KB) - ${mapping.description}`);
            }
        }
        
        execSync(`rm -rf "${tempDir}"`);
    } catch (error) {
        console.error('Error extracting images:', error);
    }
}

async function extractTextWithAudio(transcription) {
    console.log('Extracting text...');
    
    const pdfPath = path.join(__dirname, '..', '..', 'meremetaphor.pdf');
    const pdfExtract = new PDFExtract();
    const data = await pdfExtract.extract(pdfPath, {});
    
    let htmlContent = '';
    let pageCounter = 0;
    let currentTranscriptionIndex = 0;
    let inAudioSection = false;
    let currentAudioSection = null;
    
    for (const page of data.pages) {
        pageCounter++;
        
        // Skip table of contents (pages 3-4)
        if (pageCounter >= 3 && pageCounter <= 4) {
            continue;
        }
        
        // Process page content
        const pageContent = await processPageWithAudio(
            page, 
            transcription, 
            currentTranscriptionIndex,
            inAudioSection,
            currentAudioSection
        );
        
        htmlContent += pageContent.html;
        currentTranscriptionIndex = pageContent.transcriptionIndex;
        inAudioSection = pageContent.inAudioSection;
        currentAudioSection = pageContent.audioSection;
    }
    
    console.log(`Processed ${pageCounter} pages`);
    console.log(`Used ${currentTranscriptionIndex} transcription words`);
    
    // Generate complete HTML with audio player
    const fullHTML = generateCompleteHTML(htmlContent, transcription);
    
    // Write to index.html
    const outputPath = path.join(__dirname, '..', '..', 'index.html');
    fs.writeFileSync(outputPath, fullHTML);
}

async function processPageWithAudio(page, transcription, transcriptionIndex, inAudioSection, currentAudioSection) {
    let html = '';
    let currentIndex = transcriptionIndex;
    let isInAudio = inAudioSection;
    let audioSection = currentAudioSection;
    
    // Group items by paragraph using Y-coordinate spacing
    const paragraphs = groupItemsIntoParagraphs(page.content);
    
    for (const paragraph of paragraphs) {
        const paragraphText = paragraph.map(item => item.str).join(' ').trim();
        
        // Skip empty paragraphs
        if (!paragraphText) continue;
        
        // Check if this starts an audio section
        if (!isInAudio) {
            for (const [sectionName, config] of Object.entries(AUDIO_SECTIONS)) {
                if (paragraphText.includes(config.startText)) {
                    isInAudio = true;
                    audioSection = sectionName;
                    console.log(`  ✓ Starting audio section: ${sectionName} at transcription index ${currentIndex}`);
                    break;
                }
            }
        }
        
        // Check if this ends the current audio section
        if (isInAudio && audioSection) {
            const config = AUDIO_SECTIONS[audioSection];
            if (paragraphText.includes(config.endText)) {
                console.log(`  ✓ Ending audio section: ${audioSection}`);
                // Process this paragraph with audio, then stop
                const result = processParagraphWithAudio(paragraphText, transcription, currentIndex);
                html += result.html;
                currentIndex = result.transcriptionIndex;
                isInAudio = false;
                audioSection = null;
            } else {
                // Continue audio section
                const result = processParagraphWithAudio(paragraphText, transcription, currentIndex);
                html += result.html;
                currentIndex = result.transcriptionIndex;
            }
        } else {
            // Regular paragraph without audio
            html += formatParagraph(paragraphText);
        }
    }
    
    return {
        html,
        transcriptionIndex: currentIndex,
        inAudioSection: isInAudio,
        audioSection
    };
}

function processParagraphWithAudio(text, transcription, startIndex) {
    // Split text into words for sequential processing
    const words = text.split(/\s+/).filter(w => w.length > 0);
    let currentIndex = startIndex;
    let htmlWords = [];
    
    for (const word of words) {
        if (currentIndex < transcription.words.length) {
            const cleanWord = word.replace(/[.,!?;:"'()[\]{}]/g, '');
            const transcriptionWord = transcription.words[currentIndex];
            
            // Create word span with timing data
            const wordSpan = `<span data-word="${currentIndex}" data-start="${transcriptionWord.start}" data-end="${transcriptionWord.end}">${word}</span>`;
            htmlWords.push(wordSpan);
            currentIndex++;
        } else {
            // No more transcription words, add without spans
            htmlWords.push(word);
        }
    }
    
    const paragraphHTML = `<p>${htmlWords.join(' ')}</p>\n`;
    
    return {
        html: paragraphHTML,
        transcriptionIndex: currentIndex
    };
}

function formatParagraph(text) {
    // Format regular paragraphs (copied logic from build.js)
    if (text.length <= TITLE_TEXT_LENGTH_LIMIT) {
        return `<h2 class="chapter-header" id="${createId(text)}">${text}</h2>\n`;
    } else {
        return `<p>${text}</p>\n`;
    }
}

function groupItemsIntoParagraphs(items) {
    if (items.length === 0) return [];
    
    const paragraphs = [];
    let currentParagraph = [items[0]];
    let lastY = items[0].y;
    
    for (let i = 1; i < items.length; i++) {
        const item = items[i];
        const yDiff = Math.abs(item.y - lastY);
        
        if (yDiff > PARAGRAPH_SPACING_THRESHOLD) {
            paragraphs.push(currentParagraph);
            currentParagraph = [item];
        } else {
            currentParagraph.push(item);
        }
        lastY = item.y;
    }
    
    paragraphs.push(currentParagraph);
    return paragraphs;
}

function createId(text) {
    return text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
}

function generateCompleteHTML(content, transcription) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Mere Metaphor</title>
    <style>
        body {
            font-family: Georgia, serif;
            line-height: 1.6;
            color: #333;
            max-width: 700px;
            margin: 0 auto;
            padding: 10px 20px 20px 20px;
        }
        h1, h2, h3 {
            font-weight: normal;
            margin-top: 2em;
        }
        h1 {
            font-size: 2.5em;
            text-align: center;
            margin-bottom: 2em;
        }
        .chapter {
            margin-bottom: 4em;
        }
        .cover-page {
            text-align: center;
            margin: 2em 0;
            padding: 1em;
            page-break-after: always;
        }
        .cover-page h1 {
            font-size: 2.5em;
            margin: 0.5em 0 1em 0;
            line-height: 1.2;
        }
        .cover-illustration {
            margin: 2em 0;
            max-width: 100%;
            overflow: hidden;
        }
        .cover-image {
            width: 100%;
            max-width: 300px;
            height: auto;
            margin: 1em 0;
            display: block;
            margin-left: auto;
            margin-right: auto;
        }
        .chapter-separator {
            text-align: center;
            font-size: 1.5em;
            margin: 4em 0 3em;
            color: #666;
            letter-spacing: 0.5em;
        }
        .toc-separator {
            margin: 2em 0;
            border-top: 1px solid #ccc;
            width: 60%;
            margin-left: auto;
            margin-right: auto;
        }
        .chapter-illustration {
            text-align: center;
            margin: 2em 0;
            max-width: 100%;
            overflow: hidden;
        }
        .chapter-image {
            width: 100%;
            max-width: 320px;
            height: auto;
            margin: 1em 0;
            display: block;
            margin-left: auto;
            margin-right: auto;
        }
        .subtitle {
            font-size: 1.1em;
            margin: 1em 0;
            line-height: 1.4;
        }
        .author {
            margin-top: 2em;
        }
        .table-of-contents {
            margin: 2em 0;
            page-break-after: always;
        }
        .table-of-contents h2 {
            text-align: center;
            margin-bottom: 2em;
        }
        .chapter-header {
            text-align: center;
            font-size: 1.3em;
            margin: 2em 0 1em;
            page-break-before: always;
            font-weight: bold;
        }
        
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
        
        @media (min-width: 768px) {
            .cover-page h1 {
                font-size: 3em;
            }
            .cover-illustration {
                margin: 3em 0;
            }
            .cover-image {
                max-width: 400px;
                max-height: 400px;
                object-fit: contain;
            }
            .chapter-image {
                max-width: 450px;
                max-height: 400px;
                object-fit: contain;
            }
            .subtitle {
                font-size: 1.2em;
            }
            .chapter-header {
                font-size: 1.5em;
                margin: 3em 0 2em;
            }
            .table-of-contents {
                margin: 3em 0;
            }
        }
        
        @media (min-width: 1024px) {
            .cover-image {
                max-width: 400px;
                max-height: 400px;
                object-fit: contain;
            }
            .chapter-image {
                max-width: 500px;
                max-height: 450px;
                object-fit: contain;
            }
        }
        
        @media print {
            .cover-page, .table-of-contents, .chapter-header {
                page-break-inside: avoid;
            }
            .chapter-separator {
                page-break-inside: avoid;
            }
            .audio-player {
                display: none;
            }
        }
        
        .table-of-contents .toc-link {
            color: #333;
            text-decoration: none;
            cursor: pointer;
            display: block;
            padding: 0.5em 0;
            margin: 0.5em 0;
        }
        
        .table-of-contents .toc-link:hover {
            color: #666;
            text-decoration: underline;
        }
        blockquote {
            background: #f2f2f2;
            border-left: 4px solid #ccc;
            margin: 2em 0;
            padding: 1.5em 2em;
            font-style: italic;
        }
        blockquote p {
            margin: 0 0 1em 0;
        }
        blockquote cite {
            display: block;
            text-align: right;
            font-style: normal;
            margin-top: 0.5em;
        }
    </style>
    <script>
        function scrollToChapter(chapterId) {
            const element = document.getElementById(chapterId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    </script>
</head>
<body>
    <div id="book-content">
${content}
    </div>
    
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
    
    <script>
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
    </script>
</body>
</html>`;
}

// Run the build if this script is executed directly
if (require.main === module) {
    buildSiteWithAudio().catch(console.error);
}

module.exports = { buildSiteWithAudio };