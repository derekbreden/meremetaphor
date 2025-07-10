const fs = require('fs');
const path = require('path');

// Load the transcription data
const transcriptionPath = path.join(__dirname, '..', 'transcription_with_timestamps.json');
const transcription = JSON.parse(fs.readFileSync(transcriptionPath, 'utf8'));

// Load the current HTML
const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

console.log('Building simple manual audio player...');
console.log('Total transcription words:', transcription.words.length);

// First, let's look at what we're working with
console.log('First 15 transcription words:');
transcription.words.slice(0, 15).forEach((word, i) => {
  console.log(`  ${i}: "${word.word}" (${word.start}s - ${word.end}s)`);
});

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
    
    .audio-player-toggle:hover {
      background: #0056b3;
    }
    
    .audio-player.hidden {
      display: none;
    }
  `;

  // Manually wrap specific sections with proper word mapping
  // Cover page: "Mere Metaphor" - words 0, 1
  htmlContent = htmlContent.replace(
    '<h1>Mere Metaphor</h1>',
    '<h1><span data-word="0">Mere</span> <span data-word="1">Metaphor</span></h1>'
  );

  // Subtitle: "Understanding Religious Language as a Materialist" - words 2-7
  htmlContent = htmlContent.replace(
    'Understanding Religious<br>Language as a Materialist',
    '<span data-word="2">Understanding</span> <span data-word="3">Religious</span><br><span data-word="4">Language</span> <span data-word="5">as</span> <span data-word="6">a</span> <span data-word="7">Materialist</span>'
  );

  // Author: "by Derek Bredensteiner" - words 8-10 (note: Brettensteiner in transcription)
  htmlContent = htmlContent.replace(
    'by Derek Bredensteiner',
    '<span data-word="8">by</span> <span data-word="9">Derek</span> <span data-word="10">Bredensteiner</span>'
  );

  // Preface heading: "Preface" - word 11
  htmlContent = htmlContent.replace(
    '<h3>Preface</h3>',
    '<h3><span data-word="11">Preface</span></h3>'
  );

  // First few words of preface text: "If you believe" - words 12-14
  htmlContent = htmlContent.replace(
    'If you believe in a supernatural',
    '<span data-word="12">If</span> <span data-word="13">you</span> <span data-word="14">believe</span> <span data-word="15">in</span> <span data-word="16">a</span> <span data-word="17">supernatural</span>'
  );

  const audioPlayerJS = `
    class SimpleManualAudioPlayer {
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
            // Find span with matching data-word attribute
            const span = document.querySelector(\`span[data-word="\${activeWordIndex}"]\`);
            if (span) {
              span.classList.add('word-highlight');
              
              // Scroll to the highlighted word
              span.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
              console.log(\`No span found for word \${activeWordIndex}: "\${this.words[activeWordIndex].word}"\`);
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
      const transcriptionData = ${JSON.stringify(transcription)};
      audioPlayerInstance = new SimpleManualAudioPlayer('cover_and_preface.mp3', transcriptionData);
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
console.log('Adding simple manual audio player...');
const processedHTML = addSimpleAudioPlayer(html);

// Write the result
fs.writeFileSync(htmlPath, processedHTML);

console.log('Simple manual audio player implemented successfully!');
console.log('Features:');
console.log('- Manual word mapping for first 18 words');
console.log('- No content shifting (removed padding from CSS)');
console.log('- Preserves original HTML structure');
console.log('- Should highlight: Mere (0s), Metaphor (1.56s), Understanding (3.24s), etc.');