const fs = require('fs');
const path = require('path');

// Load the transcription data
const transcriptionPath = path.join(__dirname, '..', 'transcription_with_timestamps.json');
const transcription = JSON.parse(fs.readFileSync(transcriptionPath, 'utf8'));

// Load the current HTML
const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

console.log('Building word-level audio player...');
console.log('Total transcription words:', transcription.words.length);

// Function to wrap words in the HTML content with spans
function wrapWordsWithSpans(htmlContent) {
  const words = transcription.words;
  
  // Create a mapping of text sections to word timings
  const textSections = [
    {
      selector: '.cover-page h1',
      text: 'Mere Metaphor',
      wordIndices: [0, 1] // Mere=0, Metaphor=1
    },
    {
      selector: '.cover-page .subtitle', 
      text: 'Understanding Religious Language as a Materialist',
      wordIndices: [2, 3, 4, 5, 6, 7] // Understanding=2, Religious=3, Language=4, as=5, a=6, Materialist=7
    },
    {
      selector: '.cover-page .author',
      text: 'by Derek Bredensteiner', 
      wordIndices: [8, 9, 10] // by=8, Derek=9, Bredensteiner=10
    },
    {
      selector: 'h3', // Preface heading
      text: 'Preface',
      wordIndices: [11] // Preface=11
    }
  ];
  
  let modifiedHTML = htmlContent;
  
  textSections.forEach(section => {
    const sectionWords = section.wordIndices.map(i => words[i]);
    
    // Create wrapped version of the text
    let wrappedText = '';
    sectionWords.forEach((word, index) => {
      const spanId = `word-${section.wordIndices[index]}`;
      wrappedText += `<span id="${spanId}" data-start="${word.start}" data-end="${word.end}">${word.word}</span>`;
      if (index < sectionWords.length - 1) {
        wrappedText += ' ';
      }
    });
    
    // Find and replace the text in the appropriate element
    const regex = new RegExp(`(<[^>]*class="[^"]*${section.selector.replace('.', '').replace(' ', '').replace('h3', 'chapter-header')}[^"]*"[^>]*>)([^<]+)(</[^>]*>)`);
    
    if (section.selector === 'h3') {
      // Special handling for Preface heading
      modifiedHTML = modifiedHTML.replace(
        /<h3[^>]*>Preface<\/h3>/, 
        `<h3>${wrappedText}</h3>`
      );
    } else {
      // Handle other sections by finding the element and replacing its text content
      const selectorClass = section.selector.split('.')[1];
      const elementRegex = new RegExp(`(<[^>]*class="[^"]*${selectorClass}[^"]*"[^>]*>)([^<]+)(</[^>]*>)`);
      modifiedHTML = modifiedHTML.replace(elementRegex, `$1${wrappedText}$3`);
    }
  });
  
  return modifiedHTML;
}

// Function to wrap preface paragraph words
function wrapPrefaceWords(htmlContent) {
  const words = transcription.words;
  
  // Find preface text starting from word index 12 ("If")
  const prefaceWords = words.slice(12); // Starting from "If you believe..."
  
  // Get the full preface text from transcription
  const prefaceText = prefaceWords.map(w => w.word).join(' ');
  
  // Create wrapped version
  let wrappedPrefaceText = '';
  prefaceWords.forEach((word, index) => {
    const actualIndex = index + 12; // Adjust for slice offset
    const spanId = `word-${actualIndex}`;
    wrappedPrefaceText += `<span id="${spanId}" data-start="${word.start}" data-end="${word.end}">${word.word}</span>`;
    if (index < prefaceWords.length - 1) {
      wrappedPrefaceText += ' ';
    }
  });
  
  // Split wrapped text into paragraphs based on sentence structure
  const sentences = wrappedPrefaceText.split(/(?<=\.)\s+/);
  
  // Group sentences into paragraphs (rough approximation)
  const paragraphs = [];
  let currentParagraph = '';
  let sentenceCount = 0;
  
  sentences.forEach(sentence => {
    currentParagraph += sentence + ' ';
    sentenceCount++;
    
    // Create paragraph breaks at logical points
    if (sentenceCount >= 2 || sentence.includes('natural perspective') || 
        sentence.includes('my own') || sentence.includes('simply information') ||
        sentence.includes('groups better')) {
      paragraphs.push(currentParagraph.trim());
      currentParagraph = '';
      sentenceCount = 0;
    }
  });
  
  if (currentParagraph.trim()) {
    paragraphs.push(currentParagraph.trim());
  }
  
  // Replace the preface content in HTML
  const prefaceRegex = /<h3>.*?Preface.*?<\/h3>([\s\S]*?)(?=<h[1-6]|<div class="chapter|$)/;
  const replacement = `<h3><span id="word-11" data-start="${words[11].start}" data-end="${words[11].end}">Preface</span></h3>\n${paragraphs.map(p => `<p>${p}</p>`).join('\n')}`;
  
  return htmlContent.replace(prefaceRegex, replacement);
}

// Add audio player functionality
function addWordLevelAudioPlayer(htmlContent) {
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
      border-radius: 3px;
      padding: 1px 2px;
      transition: all 0.15s ease;
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
    class WordLevelAudioPlayer {
      constructor(audioSrc, wordTimings) {
        this.audio = new Audio(audioSrc);
        this.wordTimings = wordTimings;
        this.isPlaying = false;
        this.currentHighlightedWord = null;
        
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
          this.updateWordHighlighting();
        });
        
        this.audio.addEventListener('ended', () => {
          this.isPlaying = false;
          this.playPauseText.textContent = '▶️ Play';
          this.clearWordHighlighting();
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
      
      updateWordHighlighting() {
        const currentTime = this.audio.currentTime;
        
        // Find the word that should be highlighted at current time
        const wordSpans = document.querySelectorAll('span[data-start]');
        let foundActiveWord = false;
        
        wordSpans.forEach(span => {
          const start = parseFloat(span.dataset.start);
          const end = parseFloat(span.dataset.end);
          
          if (currentTime >= start && currentTime < end) {
            // This word should be highlighted
            if (this.currentHighlightedWord !== span) {
              this.clearWordHighlighting();
              span.classList.add('word-highlight');
              this.currentHighlightedWord = span;
              this.scrollToWord(span);
            }
            foundActiveWord = true;
          }
        });
        
        // If no word is active, clear highlighting
        if (!foundActiveWord && this.currentHighlightedWord) {
          this.clearWordHighlighting();
        }
      }
      
      clearWordHighlighting() {
        if (this.currentHighlightedWord) {
          this.currentHighlightedWord.classList.remove('word-highlight');
          this.currentHighlightedWord = null;
        }
        
        // Also clear any other highlighted words
        document.querySelectorAll('.word-highlight').forEach(span => {
          span.classList.remove('word-highlight');
        });
      }
      
      scrollToWord(wordSpan) {
        const rect = wordSpan.getBoundingClientRect();
        const isInViewport = rect.top >= 100 && rect.bottom <= window.innerHeight - 100;
        
        if (!isInViewport) {
          wordSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
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
        this.clearWordHighlighting();
        this.scrollToCurrentSection();
      }
      
      updateProgress() {
        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        this.progressBar.style.width = progress + '%';
        this.currentTimeElement.textContent = this.formatTime(this.audio.currentTime);
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
      audioPlayerInstance = new WordLevelAudioPlayer('cover_and_preface.mp3', wordTimings);
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
console.log('Step 1: Wrapping cover page words with spans...');
let processedHTML = wrapWordsWithSpans(html);

console.log('Step 2: Wrapping preface words with spans...');
processedHTML = wrapPrefaceWords(processedHTML);

console.log('Step 3: Adding word-level audio player...');
processedHTML = addWordLevelAudioPlayer(processedHTML);

// Write the result
fs.writeFileSync(htmlPath, processedHTML);

console.log('Word-level audio player implemented successfully!');
console.log('Features:');
console.log('- Individual word highlighting with precise timing');
console.log('- Automatic scrolling to follow highlighted words');
console.log('- Proper handling of cover page and preface sections');
console.log('- Clean transitions between word highlights');