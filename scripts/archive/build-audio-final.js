const fs = require('fs');
const path = require('path');

// Load the transcription data
const transcriptionPath = path.join(__dirname, '..', 'transcription_with_timestamps.json');
const transcription = JSON.parse(fs.readFileSync(transcriptionPath, 'utf8'));

// Load the current HTML
const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

console.log('Building final audio player...');
console.log('Total transcription words:', transcription.words.length);

// Add audio player functionality with simple approach
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
    
    .audio-highlight {
      background-color: #007bff !important;
      color: white !important;
      border-radius: 3px;
      padding: 2px 4px;
      transition: all 0.2s;
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
      constructor(audioSrc, wordTimings) {
        this.audio = new Audio(audioSrc);
        this.wordTimings = wordTimings;
        this.isPlaying = false;
        this.currentHighlight = null;
        
        this.initializePlayer();
        this.bindEvents();
        this.addAudioAttributes();
      }
      
      addAudioAttributes() {
        // Add data attributes to specific elements for audio synchronization
        const coverTitle = document.querySelector('.cover-page h1');
        if (coverTitle) {
          coverTitle.setAttribute('data-audio-start', '0');
          coverTitle.setAttribute('data-audio-end', '2.1');
          coverTitle.setAttribute('data-audio-words', 'Mere Metaphor');
        }
        
        const subtitle = document.querySelector('.cover-page .subtitle');
        if (subtitle) {
          subtitle.setAttribute('data-audio-start', '3.24');
          subtitle.setAttribute('data-audio-end', '6.16');
          subtitle.setAttribute('data-audio-words', 'Understanding Religious Language as a Materialist');
        }
        
        const author = document.querySelector('.cover-page .author');
        if (author) {
          author.setAttribute('data-audio-start', '6.4');
          author.setAttribute('data-audio-end', '8.46');
          author.setAttribute('data-audio-words', 'by Derek Bredensteiner');
        }
        
        const prefaceHeading = document.querySelector('#preface + .chapter-illustration + h3');
        if (prefaceHeading) {
          prefaceHeading.setAttribute('data-audio-start', '9.44');
          prefaceHeading.setAttribute('data-audio-end', '10.24');
          prefaceHeading.setAttribute('data-audio-words', 'Preface');
        }
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
          this.updateHighlighting();
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
        this.scrollToCurrentSection();
      }
      
      pause() {
        this.audio.pause();
      }
      
      restart() {
        this.audio.currentTime = 0;
        this.clearHighlighting();
        this.scrollToCurrentSection();
      }
      
      updateProgress() {
        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        this.progressBar.style.width = progress + '%';
        this.currentTimeElement.textContent = this.formatTime(this.audio.currentTime);
      }
      
      updateHighlighting() {
        const currentTime = this.audio.currentTime;
        
        // Clear previous highlighting
        this.clearHighlighting();
        
        // Check audio-enabled elements
        const audioElements = document.querySelectorAll('[data-audio-start]');
        audioElements.forEach(element => {
          const start = parseFloat(element.dataset.audioStart);
          const end = parseFloat(element.dataset.audioEnd);
          
          if (currentTime >= start && currentTime < end) {
            element.classList.add('audio-highlight');
            this.currentHighlight = element;
            this.scrollToElement(element);
          }
        });
        
        // If no block element is highlighted, check if we're in the preface text area
        if (!this.currentHighlight && currentTime >= 11.68) {
          this.highlightPrefaceText(currentTime);
        }
      }
      
      highlightPrefaceText(currentTime) {
        // Simple approach: highlight the preface paragraph that should be active
        const prefaceStart = 11.68; // "If you believe..."
        const prefaceEnd = 93; // End of transcription
        
        if (currentTime >= prefaceStart && currentTime < prefaceEnd) {
          // Find the first preface paragraph
          const prefaceH3 = document.querySelector('[data-audio-words="Preface"]');
          if (prefaceH3) {
            const firstP = prefaceH3.nextElementSibling;
            if (firstP && firstP.tagName === 'P') {
              firstP.style.backgroundColor = '#e3f2fd';
              firstP.style.padding = '10px';
              firstP.style.borderRadius = '5px';
              this.currentHighlight = firstP;
              this.scrollToElement(firstP);
            }
          }
        }
      }
      
      clearHighlighting() {
        // Remove audio highlight class
        document.querySelectorAll('.audio-highlight').forEach(element => {
          element.classList.remove('audio-highlight');
        });
        
        // Remove manual styling
        document.querySelectorAll('p[style]').forEach(element => {
          if (element.style.backgroundColor) {
            element.style.backgroundColor = '';
            element.style.padding = '';
            element.style.borderRadius = '';
          }
        });
        
        this.currentHighlight = null;
      }
      
      scrollToElement(element) {
        const rect = element.getBoundingClientRect();
        const isInViewport = rect.top >= 0 && rect.bottom <= window.innerHeight;
        
        if (!isInViewport) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      
      scrollToCurrentSection() {
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
      const wordTimings = ${JSON.stringify(transcription.words)};
      audioPlayerInstance = new SimpleAudioPlayer('cover_and_preface.mp3', wordTimings);
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

// Main function
const processedHTML = addSimpleAudioPlayer(html);
fs.writeFileSync(htmlPath, processedHTML);

console.log('Simple audio player implemented successfully!');
console.log('Features:');
console.log('- Cover page elements will highlight at correct times');
console.log('- Preface section will highlight during text reading');
console.log('- Clean, non-intrusive highlighting');
console.log('- All major timing issues should be resolved');