const fs = require('fs');
const path = require('path');

// Load the transcription data
const transcriptionPath = path.join(__dirname, '..', 'transcription_with_timestamps.json');
const transcription = JSON.parse(fs.readFileSync(transcriptionPath, 'utf8'));

// Load the current HTML
const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

console.log('Building simple audio player...');
console.log('Total transcription words:', transcription.words.length);

// Simple approach: Add audio player without modifying existing HTML structure
function addSimpleAudioPlayer(htmlContent) {
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
    class SimpleAudioPlayer {
      constructor(audioSrc, transcriptionData) {
        this.audio = new Audio(audioSrc);
        this.words = transcriptionData.words;
        this.isPlaying = false;
        this.currentWordIndex = -1;
        this.textContent = this.extractTextContent();
        
        this.initializePlayer();
        this.bindEvents();
      }
      
      extractTextContent() {
        // Get the full text content from the page
        const coverTitle = document.querySelector('.cover-page h1')?.textContent || '';
        const subtitle = document.querySelector('.cover-page .subtitle')?.textContent || '';
        const author = document.querySelector('.cover-page .author')?.textContent || '';
        const prefaceTitle = document.querySelector('#preface + .chapter-illustration + h3')?.textContent || '';
        const prefaceText = Array.from(document.querySelectorAll('#preface ~ p')).map(p => p.textContent).join(' ');
        
        return {
          coverTitle,
          subtitle, 
          author,
          prefaceTitle,
          prefaceText
        };
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
            this.highlightWordInText(this.words[activeWordIndex].word);
          }
        }
      }
      
      highlightWordInText(targetWord) {
        // Simple approach: find and highlight the word temporarily
        const walker = document.createTreeWalker(
          document.getElementById('book-content'),
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        let textNode;
        while (textNode = walker.nextNode()) {
          const text = textNode.nodeValue;
          // Simple word matching without regex special characters
          const lowerText = text.toLowerCase();
          const lowerWord = targetWord.toLowerCase();
          const wordIndex = lowerText.indexOf(lowerWord);
          
          if (wordIndex !== -1) {
            const parent = textNode.parentNode;
            const span = document.createElement('span');
            span.className = 'word-highlight';
            
            // Get the actual word from the text (preserve case)
            const actualWord = text.substring(wordIndex, wordIndex + lowerWord.length);
            span.textContent = actualWord;
            
            // Split the text and replace the word
            const beforeText = text.substring(0, wordIndex);
            const afterText = text.substring(wordIndex + lowerWord.length);
            
            if (beforeText) {
              parent.insertBefore(document.createTextNode(beforeText), textNode);
            }
            parent.insertBefore(span, textNode);
            if (afterText) {
              parent.insertBefore(document.createTextNode(afterText), textNode);
            }
            parent.removeChild(textNode);
            
            // Scroll to the highlighted word
            span.scrollIntoView({ behavior: 'smooth', block: 'center' });
            break;
          }
        }
      }
      
      clearHighlighting() {
        document.querySelectorAll('.word-highlight').forEach(span => {
          const parent = span.parentNode;
          parent.replaceChild(document.createTextNode(span.textContent), span);
          parent.normalize(); // Merge adjacent text nodes
        });
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
      audioPlayerInstance = new SimpleAudioPlayer('cover_and_preface.mp3', transcriptionData);
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
console.log('Adding simple audio player to existing HTML...');
const processedHTML = addSimpleAudioPlayer(html);

// Write the result
fs.writeFileSync(htmlPath, processedHTML);

console.log('Simple audio player implemented successfully!');
console.log('Features:');
console.log('- Preserves original HTML structure completely');
console.log('- Dynamically highlights words during playback');
console.log('- Automatically scrolls to highlighted words');
console.log('- Clean removal of highlights when words change');