const fs = require('fs');
const path = require('path');

// Load the transcription data
const transcriptionPath = path.join(__dirname, '..', 'transcription_with_timestamps.json');
const transcription = JSON.parse(fs.readFileSync(transcriptionPath, 'utf8'));

// Load the current HTML
const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

console.log('Building sequential word audio player...');
console.log('Total transcription words:', transcription.words.length);

// Word similarity function to handle variations
function getWordSimilarity(word1, word2) {
  const lower1 = word1.toLowerCase().replace(/[^\w]/g, '');
  const lower2 = word2.toLowerCase().replace(/[^\w]/g, '');
  
  // Exact match
  if (lower1 === lower2) return 1.0;
  
  // Handle common transcription issues
  const variations = {
    'brettensteiner': ['bredensteiner'],
    'bredensteiner': ['brettensteiner']
  };
  
  if (variations[lower1] && variations[lower1].includes(lower2)) return 0.9;
  if (variations[lower2] && variations[lower2].includes(lower1)) return 0.9;
  
  // Partial match for longer words
  if (lower1.length > 3 && lower2.length > 3) {
    if (lower1.includes(lower2) || lower2.includes(lower1)) return 0.7;
  }
  
  return 0;
}

function addSequentialAudioPlayer(htmlContent) {
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
      padding: 2px 4px;
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
    class SequentialAudioPlayer {
      constructor(audioSrc, transcriptionData) {
        this.audio = new Audio(audioSrc);
        this.words = transcriptionData.words;
        this.isPlaying = false;
        this.currentWordIndex = -1;
        this.lastSearchPosition = 0; // Track position in text
        this.textNodes = this.getAllTextNodes();
        
        this.initializePlayer();
        this.bindEvents();
      }
      
      getAllTextNodes() {
        const walker = document.createTreeWalker(
          document.getElementById('book-content'),
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
          if (node.nodeValue.trim()) { // Only non-empty text nodes
            textNodes.push({
              node: node,
              text: node.nodeValue,
              searched: false
            });
          }
        }
        return textNodes;
      }
      
      getWordSimilarity(word1, word2) {
        const lower1 = word1.toLowerCase().replace(/[^\\w]/g, '');
        const lower2 = word2.toLowerCase().replace(/[^\\w]/g, '');
        
        // Exact match
        if (lower1 === lower2) return 1.0;
        
        // Handle common transcription issues
        const variations = {
          'brettensteiner': ['bredensteiner'],
          'bredensteiner': ['brettensteiner']
        };
        
        if (variations[lower1] && variations[lower1].includes(lower2)) return 0.9;
        if (variations[lower2] && variations[lower2].includes(lower1)) return 0.9;
        
        // Partial match for longer words
        if (lower1.length > 3 && lower2.length > 3) {
          if (lower1.includes(lower2) || lower2.includes(lower1)) return 0.7;
        }
        
        return 0;
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
        let activeWordIndex = -1;
        for (let i = 0; i < this.words.length; i++) {
          const word = this.words[i];
          if (currentTime >= word.start && currentTime < word.end) {
            activeWordIndex = i;
            break;
          }
        }
        
        // Only update if we've moved to a different word
        if (activeWordIndex !== this.currentWordIndex) {
          this.clearHighlighting();
          this.currentWordIndex = activeWordIndex;
          
          if (activeWordIndex >= 0) {
            this.highlightWordSequentially(this.words[activeWordIndex]);
          }
        }
      }
      
      highlightWordSequentially(targetWordObj) {
        const targetWord = targetWordObj.word;
        
        // Start searching from where we left off
        for (let i = this.lastSearchPosition; i < this.textNodes.length; i++) {
          const textNodeInfo = this.textNodes[i];
          const text = textNodeInfo.text;
          
          // Look for the word in this text node
          const words = text.split(/\\s+/);
          let textPosition = 0;
          
          for (let j = 0; j < words.length; j++) {
            const word = words[j];
            const similarity = this.getWordSimilarity(targetWord, word);
            
            if (similarity > 0.6) { // Good enough match
              // Found the word! Highlight it
              const wordStart = text.indexOf(word, textPosition);
              if (wordStart !== -1) {
                this.highlightWordInNode(textNodeInfo.node, wordStart, word.length);
                this.lastSearchPosition = i; // Update our position
                return;
              }
            }
            textPosition = text.indexOf(word, textPosition) + word.length;
          }
        }
        
        // If we didn't find it, maybe it's a partial word or punctuation issue
        console.log('Could not find word:', targetWord);
      }
      
      highlightWordInNode(textNode, start, length) {
        const text = textNode.nodeValue;
        const parent = textNode.parentNode;
        
        // Create the highlight span
        const span = document.createElement('span');
        span.className = 'word-highlight';
        span.textContent = text.substring(start, start + length);
        
        // Split the text node
        const beforeText = text.substring(0, start);
        const afterText = text.substring(start + length);
        
        if (beforeText) {
          parent.insertBefore(document.createTextNode(beforeText), textNode);
        }
        parent.insertBefore(span, textNode);
        if (afterText) {
          parent.insertBefore(document.createTextNode(afterText), textNode);
        }
        parent.removeChild(textNode);
        
        // Update our text nodes array to reflect the changes
        this.refreshTextNodes();
        
        // Scroll to the highlighted word
        span.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      refreshTextNodes() {
        // Refresh our text nodes array after DOM changes
        this.textNodes = this.getAllTextNodes();
      }
      
      clearHighlighting() {
        document.querySelectorAll('.word-highlight').forEach(span => {
          const parent = span.parentNode;
          parent.replaceChild(document.createTextNode(span.textContent), span);
          parent.normalize(); // Merge adjacent text nodes
        });
        
        // Refresh text nodes after clearing
        this.refreshTextNodes();
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
        this.currentWordIndex = -1;
        this.lastSearchPosition = 0; // Reset search position
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
      const transcriptionData = ${JSON.stringify(transcription)};
      audioPlayerInstance = new SequentialAudioPlayer('cover_and_preface.mp3', transcriptionData);
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
console.log('Adding sequential audio player to HTML...');
const processedHTML = addSequentialAudioPlayer(html);

// Write the result
fs.writeFileSync(htmlPath, processedHTML);

console.log('Sequential audio player implemented successfully!');
console.log('Features:');
console.log('- Progressive word matching (never goes backwards)');
console.log('- Handles word variations (Bredensteiner/Brettensteiner)');
console.log('- Position-aware search that continues forward through text');
console.log('- Smart word similarity matching for transcription errors');