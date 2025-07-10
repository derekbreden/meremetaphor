const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Load the transcription data
const transcriptionPath = path.join(__dirname, '..', 'transcription_with_timestamps.json');
const transcription = JSON.parse(fs.readFileSync(transcriptionPath, 'utf8'));

// Load the current HTML
const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

console.log('Building pre-processed audio player...');
console.log('Total transcription words:', transcription.words.length);

function preprocessHTML(htmlContent) {
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;
  
  let wordSpanId = 0;
  const wordMapping = []; // Maps transcription word index to span ID
  
  // Helper function to wrap words in a text node with spans
  function wrapWordsInTextNode(textNode) {
    const text = textNode.nodeValue;
    const words = text.split(/(\s+)/); // Split but keep whitespace
    const parent = textNode.parentNode;
    
    // Remove the original text node
    parent.removeChild(textNode);
    
    // Add each word and whitespace as separate elements
    words.forEach(segment => {
      if (segment.trim()) {
        // This is a word - wrap it in a span
        const span = document.createElement('span');
        span.id = `word-span-${wordSpanId}`;
        span.textContent = segment;
        parent.appendChild(span);
        wordSpanId++;
      } else {
        // This is whitespace - add as text node
        parent.appendChild(document.createTextNode(segment));
      }
    });
  }
  
  // Helper function to process all text nodes in an element
  function processElement(element) {
    const walker = document.createTreeWalker(
      element,
      dom.window.NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.nodeValue.trim()) {
        textNodes.push(node);
      }
    }
    
    // Process text nodes (in reverse order to avoid issues with DOM changes)
    textNodes.reverse().forEach(wrapWordsInTextNode);
  }
  
  // Process cover page elements
  const coverPage = document.querySelector('.cover-page');
  if (coverPage) {
    processElement(coverPage);
  }
  
  // Process preface section (find the preface heading and subsequent paragraphs)
  const prefaceHeading = document.querySelector('#preface');
  if (prefaceHeading) {
    let element = prefaceHeading.nextElementSibling;
    while (element && !element.classList.contains('chapter-separator')) {
      if (element.tagName === 'H3' || element.tagName === 'P') {
        processElement(element);
      }
      element = element.nextElementSibling;
    }
  }
  
  return {
    html: dom.serialize(),
    totalWordSpans: wordSpanId
  };
}

function createWordMapping(totalWordSpans, transcriptionWords) {
  // Simple sequential mapping - assumes transcription words map to spans in order
  const mapping = [];
  
  transcriptionWords.forEach((word, index) => {
    if (index < totalWordSpans) {
      mapping.push({
        transcriptionIndex: index,
        spanId: `word-span-${index}`,
        word: word.word,
        start: word.start,
        end: word.end
      });
    }
  });
  
  return mapping;
}

function addAudioPlayer(htmlContent, wordMapping) {
  const audioPlayerCSS = `
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
    
    .audio-progress {
      width: 100%;
      height: 6px;
      background: #555;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 5px;
    }
    
    .audio-progress-bar {
      height: 100%;
      background: #007bff;
      width: 0%;
      transition: width 0.1s;
    }
    
    .audio-time {
      font-size: 12px;
      color: #ccc;
    }
    
    .word-highlight {
      background-color: #007bff !important;
      color: white !important;
      padding: 1px 2px;
      border-radius: 3px;
      transition: all 0.2s ease;
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
    
    .audio-player-toggle:hover {
      background: #0056b3;
    }
    
    .audio-player.hidden {
      display: none;
    }
  `;

  const audioPlayerJS = `
    class PreprocessedAudioPlayer {
      constructor(audioSrc, wordMapping) {
        this.audio = new Audio(audioSrc);
        this.wordMapping = wordMapping;
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
            <div class="audio-progress">
              <div class="audio-progress-bar"></div>
            </div>
            <div class="audio-time">
              <span class="current-time">0:00</span> / <span class="total-time">0:00</span>
            </div>
          </div>
        \`;
        
        document.body.insertAdjacentHTML('beforeend', playerHTML);
        
        this.playerElement = document.querySelector('.audio-player');
        this.toggleButton = document.querySelector('.audio-player-toggle');
        this.progressBar = document.querySelector('.audio-progress-bar');
        this.currentTimeElement = document.querySelector('.current-time');
        this.totalTimeElement = document.querySelector('.total-time');
        this.playPauseText = document.querySelector('.play-pause-text');
        
        this.audio.addEventListener('loadedmetadata', () => {
          this.totalTimeElement.textContent = this.formatTime(this.audio.duration);
        });
      }
      
      bindEvents() {
        this.audio.addEventListener('timeupdate', () => {
          this.updateProgress();
          this.highlightCurrentWord();
        });
        
        this.audio.addEventListener('ended', () => {
          this.isPlaying = false;
          this.playPauseText.textContent = '▶️ Play';
          this.clearHighlighting();
        });
        
        this.audio.addEventListener('pause', () => {
          this.isPlaying = false;
          this.playPauseText.textContent = '▶️ Play';
        });
        
        this.audio.addEventListener('play', () => {
          this.isPlaying = true;
          this.playPauseText.textContent = '⏸️ Pause';
        });
      }
      
      highlightCurrentWord() {
        const currentTime = this.audio.currentTime;
        
        // Find the current word based on timing
        let activeMapping = null;
        for (let i = 0; i < this.wordMapping.length; i++) {
          const mapping = this.wordMapping[i];
          if (currentTime >= mapping.start && currentTime < mapping.end) {
            activeMapping = mapping;
            break;
          }
        }
        
        // Only update if we've moved to a different word
        if (activeMapping && activeMapping.transcriptionIndex !== this.currentWordIndex) {
          this.clearHighlighting();
          this.currentWordIndex = activeMapping.transcriptionIndex;
          
          // Highlight the span (no DOM manipulation, just CSS class)
          const span = document.getElementById(activeMapping.spanId);
          if (span) {
            span.classList.add('word-highlight');
            
            // Scroll to the highlighted word
            span.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else if (!activeMapping && this.currentWordIndex !== -1) {
          // No active word, clear highlighting
          this.clearHighlighting();
        }
      }
      
      clearHighlighting() {
        // Simply remove highlight class from all spans (very fast)
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
        this.scrollToStart();
      }
      
      pause() {
        this.audio.pause();
      }
      
      restart() {
        this.audio.currentTime = 0;
        this.clearHighlighting();
        this.scrollToStart();
      }
      
      updateProgress() {
        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        this.progressBar.style.width = progress + '%';
        this.currentTimeElement.textContent = this.formatTime(this.audio.currentTime);
      }
      
      scrollToStart() {
        const coverPage = document.querySelector('.cover-page');
        if (coverPage) {
          coverPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      
      formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return \`\${minutes}:\${remainingSeconds.toString().padStart(2, '0')}\`;
      }
    }
    
    let audioPlayerInstance;
    document.addEventListener('DOMContentLoaded', () => {
      const wordMapping = ${JSON.stringify(wordMapping)};
      audioPlayerInstance = new PreprocessedAudioPlayer('cover_and_preface.mp3', wordMapping);
    });
  `;

  // Insert CSS
  const styleEndIndex = htmlContent.indexOf('</style>');
  const htmlWithCSS = htmlContent.substring(0, styleEndIndex) + audioPlayerCSS + htmlContent.substring(styleEndIndex);

  // Insert JavaScript
  const bodyEndIndex = htmlWithCSS.indexOf('</body>');
  const htmlWithJS = htmlWithCSS.substring(0, bodyEndIndex) + `<script>${audioPlayerJS}</script>` + htmlWithCSS.substring(bodyEndIndex);

  return htmlWithJS;
}

// Main processing
console.log('Step 1: Pre-processing HTML to wrap words in spans...');
const { html: processedHTML, totalWordSpans } = preprocessHTML(html);

console.log('Step 2: Creating word mapping...');
const wordMapping = createWordMapping(totalWordSpans, transcription.words);

console.log('Step 3: Adding audio player...');
const finalHTML = addAudioPlayer(processedHTML, wordMapping);

// Write the result
fs.writeFileSync(htmlPath, finalHTML);

console.log('Pre-processed audio player implemented successfully!');
console.log(`- Wrapped ${totalWordSpans} words in spans`);
console.log(`- Created ${wordMapping.length} word mappings`);
console.log('Features:');
console.log('- No content shifting (all spans pre-exist)');
console.log('- Sequential word highlighting via CSS classes only');
console.log('- Fast, smooth highlighting with no DOM manipulation');