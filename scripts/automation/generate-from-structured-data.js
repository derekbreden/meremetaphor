const fs = require('fs');
const path = require('path');

/**
 * Proof of concept: Generate HTML from structured content data
 * Demonstrates how structured data enables multiple output formats
 */

class StructuredHTMLGenerator {
    constructor(contentData) {
        this.content = contentData;
    }
    
    /**
     * Generate clean reading version without audio features
     */
    generateReadingVersion() {
        console.log('Generating reading version...');
        
        let html = this.getHTMLTemplate('Mere Metaphor - Reading Version');
        
        // Add cover content
        html += this.generateCoverHTML(false);
        
        // Add chapter content
        for (const chapter of this.content.chapters) {
            html += this.generateChapterHTML(chapter, false);
        }
        
        html += this.getHTMLFooter();
        return html;
    }
    
    /**
     * Generate audio-enabled version with word spans and player
     */
    generateAudioVersion() {
        console.log('Generating audio version...');
        
        let html = this.getHTMLTemplate('Mere Metaphor - Audio Version', true);
        
        // Add cover content with audio spans
        html += this.generateCoverHTML(true);
        
        // Add chapter content with audio spans
        for (const chapter of this.content.chapters) {
            html += this.generateChapterHTML(chapter, true);
        }
        
        html += this.getAudioPlayerScript();
        html += this.getHTMLFooter();
        return html;
    }
    
    /**
     * Generate review interface for manual editing
     */
    generateReviewInterface() {
        console.log('Generating review interface...');
        
        let html = this.getReviewTemplate();
        
        // Add editable sections
        for (const chapter of this.content.chapters) {
            html += this.generateReviewChapterHTML(chapter);
        }
        
        html += this.getReviewScript();
        html += this.getHTMLFooter();
        return html;
    }
    
    generateCoverHTML(includeAudio) {
        const cover = this.content.cover;
        let html = '<div class="cover-page">\n';
        
        for (const element of cover.elements) {
            switch (element.type) {
                case 'title':
                    html += `    <h1>${this.formatTextWithAudio(element, includeAudio)}</h1>\n`;
                    break;
                case 'subtitle':
                    html += `    <p class="subtitle">${this.formatTextWithAudio(element, includeAudio, '<br>')}</p>\n`;
                    break;
                case 'author':
                    html += `    <p class="author">${this.formatTextWithAudio(element, includeAudio)}</p>\n`;
                    break;
            }
        }
        
        // Add cover image
        html += '    <div class="cover-illustration">\n';
        html += '        <img src="images/cover.png" alt="Tree illustration with profile and \'God is love\'" class="cover-image">\n';
        html += '    </div>\n';
        html += '</div>\n\n';
        
        return html;
    }
    
    generateChapterHTML(chapter, includeAudio) {
        let html = `<h2 class="chapter-header" id="${chapter.id}">${chapter.title.toUpperCase()}</h2>\n`;
        
        // Add chapter illustration
        html += '<div class="chapter-illustration">\n';
        html += `<img src="images/${chapter.id}-illustration.png" alt="Illustration for ${chapter.title.toUpperCase()}" class="chapter-image">\n`;
        html += '</div>\n\n';
        
        // Add chapter heading with audio if applicable
        if (includeAudio && this.content.cover.elements.find(e => e.type === 'heading')) {
            const headingElement = this.content.cover.elements.find(e => e.type === 'heading');
            html += `<h3>${this.formatTextWithAudio(headingElement, includeAudio)}</h3>\n`;
        } else {
            html += `<h3>${chapter.title}</h3>\n`;
        }
        
        // Add sections
        for (const section of chapter.sections) {
            html += this.generateSectionHTML(section, includeAudio);
        }
        
        return html;
    }
    
    generateSectionHTML(section, includeAudio) {
        let html = '<p>';
        
        for (let i = 0; i < section.sentences.length; i++) {
            const sentence = section.sentences[i];
            if (i > 0) html += ' ';
            html += this.formatSentenceWithAudio(sentence, includeAudio);
        }
        
        html += '</p>\n';
        return html;
    }
    
    formatTextWithAudio(element, includeAudio, separator = ' ') {
        if (!includeAudio || !element.words) {
            return this.escapeHtml(element.text);
        }
        
        return element.words.map(word => {
            return `<span data-word="${word.transcriptionIndex}">${this.escapeHtml(word.text)}</span>`;
        }).join(separator);
    }
    
    formatSentenceWithAudio(sentence, includeAudio) {
        if (!includeAudio || !sentence.words) {
            return this.escapeHtml(sentence.text);
        }
        
        // Reconstruct sentence with proper punctuation and spacing
        let formattedText = '';
        const originalText = sentence.text;
        let wordIndex = 0;
        let charIndex = 0;
        
        while (charIndex < originalText.length && wordIndex < sentence.words.length) {
            const word = sentence.words[wordIndex];
            const wordStart = originalText.indexOf(word.text, charIndex);
            
            if (wordStart === -1) break;
            
            // Add any punctuation/spaces before the word
            if (wordStart > charIndex) {
                formattedText += this.escapeHtml(originalText.substring(charIndex, wordStart));
            }
            
            // Add the word with span
            formattedText += `<span data-word="${word.transcriptionIndex}">${this.escapeHtml(word.text)}</span>`;
            
            charIndex = wordStart + word.text.length;
            wordIndex++;
        }
        
        // Add any remaining text
        if (charIndex < originalText.length) {
            formattedText += this.escapeHtml(originalText.substring(charIndex));
        }
        
        return formattedText;
    }
    
    generateReviewChapterHTML(chapter) {
        let html = `<div class="review-chapter" data-chapter="${chapter.id}">\n`;
        html += `    <h2>Review: ${chapter.title}</h2>\n`;
        
        for (const section of chapter.sections) {
            html += `    <div class="review-section" data-section="${section.id}">\n`;
            html += `        <h3>Section: ${section.id}</h3>\n`;
            
            for (const sentence of section.sentences) {
                html += `        <div class="review-sentence" data-sentence="${sentence.id}">\n`;
                html += `            <div class="sentence-text">${this.escapeHtml(sentence.text)}</div>\n`;
                html += `            <div class="sentence-mapping">Transcription: ${sentence.transcriptionStart}-${sentence.transcriptionEnd}</div>\n`;
                html += `            <div class="sentence-words">\n`;
                
                for (const word of sentence.words || []) {
                    html += `                <span class="word-mapping" data-index="${word.transcriptionIndex}">${this.escapeHtml(word.text)}</span>\n`;
                }
                
                html += `            </div>\n`;
                html += `            <button onclick="adjustMapping('${sentence.id}')">Adjust Mapping</button>\n`;
                html += `        </div>\n`;
            }
            
            html += `    </div>\n`;
        }
        
        html += `</div>\n`;
        return html;
    }
    
    getHTMLTemplate(title, includeAudio = false) {
        const audioCSS = includeAudio ? this.getAudioCSS() : '';
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>${title}</title>
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
        .cover-page {
            text-align: center;
            margin: 2em 0;
            padding: 1em;
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
        .subtitle {
            font-size: 1.1em;
            margin: 1em 0;
            line-height: 1.4;
        }
        .author {
            margin-top: 2em;
        }
        .chapter-header {
            text-align: center;
            font-size: 1.3em;
            margin: 2em 0 1em;
            font-weight: bold;
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
        ${audioCSS}
    </style>
</head>
<body>
    <div id="book-content">
`;
    }
    
    getAudioCSS() {
        return `
        .audio-player {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1000;
            min-width: 300px;
        }
        
        .audio-controls {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }
        
        .audio-button {
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .audio-button:hover {
            background: #0056b3;
        }
        
        .word-highlight {
            background-color: #007bff;
            color: white;
            border-radius: 2px;
        }
        
        .audio-player-toggle {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 50px;
            cursor: pointer;
            font-size: 14px;
            z-index: 999;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        
        .audio-player.hidden {
            display: none;
        }
        `;
    }
    
    getReviewTemplate() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Content Review Interface</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .review-chapter {
            border: 1px solid #ddd;
            margin: 20px 0;
            padding: 20px;
            border-radius: 8px;
        }
        .review-section {
            border-left: 3px solid #007bff;
            margin: 15px 0;
            padding-left: 15px;
        }
        .review-sentence {
            background: #f8f9fa;
            margin: 10px 0;
            padding: 15px;
            border-radius: 5px;
        }
        .sentence-text {
            font-weight: bold;
            margin-bottom: 10px;
        }
        .sentence-mapping {
            color: #666;
            font-size: 0.9em;
            margin-bottom: 10px;
        }
        .word-mapping {
            display: inline-block;
            background: #e9ecef;
            margin: 2px;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.8em;
        }
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <h1>Content Review Interface</h1>
    <p>Review and adjust audio mappings for each section.</p>
`;
    }
    
    getAudioPlayerScript() {
        // Include the audio player script from our transcription
        const transcriptionPath = path.join(__dirname, '..', '..', 'transcription_with_timestamps.json');
        const transcription = JSON.parse(fs.readFileSync(transcriptionPath, 'utf8'));
        
        return `
<script>
    // Include simplified audio player for structured data
    class StructuredAudioPlayer {
        constructor(audioSrc, transcriptionData) {
            this.audio = new Audio(audioSrc);
            this.words = transcriptionData.words;
            this.isPlaying = false;
            this.currentWordIndex = -1;
            this.initializePlayer();
            this.bindEvents();
        }
        
        initializePlayer() {
            const playerHTML = \`
                <button class="audio-player-toggle" onclick="audioPlayerInstance.togglePlayer()">
                    🎵 Listen
                </button>
                <div class="audio-player hidden">
                    <div class="audio-controls">
                        <button class="audio-button" onclick="audioPlayerInstance.togglePlayPause()">
                            <span class="play-pause-text">▶️ Play</span>
                        </button>
                        <button class="audio-button" onclick="audioPlayerInstance.restart()">
                            ⏮️ Restart
                        </button>
                        <button class="audio-button" onclick="audioPlayerInstance.togglePlayer()">
                            ✕ Close
                        </button>
                    </div>
                </div>
            \`;
            document.body.insertAdjacentHTML('beforeend', playerHTML);
            this.playerElement = document.querySelector('.audio-player');
            this.toggleButton = document.querySelector('.audio-player-toggle');
            this.playPauseText = document.querySelector('.play-pause-text');
        }
        
        bindEvents() {
            this.audio.addEventListener('timeupdate', () => this.highlightCurrentWord());
            this.audio.addEventListener('ended', () => {
                this.isPlaying = false;
                this.playPauseText.textContent = '▶️ Play';
                this.clearHighlighting();
            });
        }
        
        highlightCurrentWord() {
            const currentTime = this.audio.currentTime;
            let activeWordIndex = -1;
            
            for (let i = 0; i < this.words.length; i++) {
                const word = this.words[i];
                if (currentTime >= word.start && currentTime < word.end) {
                    activeWordIndex = i;
                    break;
                }
            }
            
            if (activeWordIndex !== this.currentWordIndex) {
                this.clearHighlighting();
                this.currentWordIndex = activeWordIndex;
                
                if (activeWordIndex >= 0) {
                    const span = document.querySelector(\`span[data-word="\${activeWordIndex}"]\`);
                    if (span) {
                        span.classList.add('word-highlight');
                        span.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }
        }
        
        clearHighlighting() {
            document.querySelectorAll('.word-highlight').forEach(span => {
                span.classList.remove('word-highlight');
            });
            this.currentWordIndex = -1;
        }
        
        togglePlayer() {
            if (this.playerElement.classList.contains('hidden')) {
                this.playerElement.classList.remove('hidden');
                this.toggleButton.style.display = 'none';
            } else {
                this.playerElement.classList.add('hidden');
                this.toggleButton.style.display = 'block';
                this.pause();
            }
        }
        
        togglePlayPause() {
            if (this.isPlaying) {
                this.pause();
            } else {
                this.play();
            }
        }
        
        play() {
            this.audio.play();
            this.isPlaying = true;
            this.playPauseText.textContent = '⏸️ Pause';
        }
        
        pause() {
            this.audio.pause();
            this.isPlaying = false;
            this.playPauseText.textContent = '▶️ Play';
        }
        
        restart() {
            this.audio.currentTime = 0;
            this.clearHighlighting();
        }
    }
    
    let audioPlayerInstance;
    document.addEventListener('DOMContentLoaded', () => {
        const transcriptionData = ${JSON.stringify(transcription)};
        audioPlayerInstance = new StructuredAudioPlayer('cover_and_preface.mp3', transcriptionData);
    });
</script>
`;
    }
    
    getReviewScript() {
        return `
<script>
    function adjustMapping(sentenceId) {
        alert('Adjust mapping for: ' + sentenceId);
        // TODO: Implement mapping adjustment interface
    }
    
    // Add review functionality here
    console.log('Review interface loaded');
</script>
`;
    }
    
    getHTMLFooter() {
        return `
    </div>
</body>
</html>`;
    }
    
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Demonstration function
function demonstrateStructuredApproach() {
    console.log('=== Demonstrating Structured Data Approach ===\n');
    
    // Load structured content
    const contentPath = path.join(__dirname, '..', '..', 'content', 'preface-structured.json');
    if (!fs.existsSync(contentPath)) {
        console.log('First run extract-preface-data.js to create structured content');
        return;
    }
    
    const contentData = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
    const generator = new StructuredHTMLGenerator(contentData);
    
    // Generate multiple versions
    const outputDir = path.join(__dirname, '..', '..', 'output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }
    
    // Reading version (clean, no audio)
    const readingHTML = generator.generateReadingVersion();
    fs.writeFileSync(path.join(outputDir, 'reading.html'), readingHTML);
    console.log('✓ Generated reading.html (clean version)');
    
    // Audio version (with spans and player)
    const audioHTML = generator.generateAudioVersion();
    fs.writeFileSync(path.join(outputDir, 'audio.html'), audioHTML);
    console.log('✓ Generated audio.html (with audio features)');
    
    // Review interface
    const reviewHTML = generator.generateReviewInterface();
    fs.writeFileSync(path.join(outputDir, 'review.html'), reviewHTML);
    console.log('✓ Generated review.html (editing interface)');
    
    console.log('\n=== Results ===');
    console.log('Three different HTML versions generated from same structured data:');
    console.log('1. reading.html - Clean reading experience');
    console.log('2. audio.html - Full audio highlighting experience');
    console.log('3. review.html - Manual review and editing interface');
    console.log('\nThis demonstrates how structured data enables multiple use cases!');
}

// Run demonstration if called directly
if (require.main === module) {
    demonstrateStructuredApproach();
}

module.exports = { StructuredHTMLGenerator, demonstrateStructuredApproach };