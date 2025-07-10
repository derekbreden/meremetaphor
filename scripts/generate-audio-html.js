/**
 * Generate complete index.html with audio player using automated pipeline results
 * 
 * Takes the balanced strategy output from our pipeline and creates a production-ready
 * HTML file with all 184 words properly mapped to transcription timestamps.
 */

const fs = require('fs');
const path = require('path');

async function generateAudioHTML() {
    console.log('=== Generating Audio-Enhanced index.html ===\n');
    
    try {
        // Load the automated mapping result
        const mappingPath = path.join(__dirname, '..', 'pipeline-test-output', 'balanced', 'book-with-mappings.json');
        
        if (!fs.existsSync(mappingPath)) {
            console.error('Automated mapping not found. Please run test-pipeline.js first.');
            return;
        }
        
        const mappingData = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
        
        console.log('1. Loading automated mapping data...');
        console.log(`   - Found ${mappingData.chapters.length} chapters`);
        
        // Extract word mappings from the structured data
        const wordMappings = extractWordMappings(mappingData);
        console.log(`   - Extracted ${wordMappings.length} word mappings`);
        
        // Generate the HTML content
        console.log('2. Generating HTML content...');
        const htmlContent = generateHTML(wordMappings);
        
        // Write the new index.html
        const outputPath = path.join(__dirname, '..', 'index.html');
        fs.writeFileSync(outputPath, htmlContent);
        
        console.log('3. Complete!');
        console.log(`   ✓ Generated index.html with ${wordMappings.length} mapped words`);
        console.log(`   ✓ Audio player ready for testing`);
        console.log(`   ✓ File saved to: ${outputPath}`);
        
    } catch (error) {
        console.error('Failed to generate audio HTML:', error);
    }
}

function extractWordMappings(mappingData) {
    const mappings = [];
    
    // Process each chapter
    for (const chapter of mappingData.chapters) {
        // Process cover elements first
        if (chapter.id === 'cover') {
            for (const section of chapter.sections || []) {
                for (const sentence of section.sentences || []) {
                    for (const word of sentence.words || []) {
                        if (word.transcriptionIndex !== undefined && word.timing) {
                            mappings.push({
                                transcriptionIndex: word.transcriptionIndex,
                                text: word.text,
                                originalText: word.originalText,
                                timing: word.timing,
                                context: {
                                    chapterId: chapter.id,
                                    sectionId: section.id,
                                    sentenceId: sentence.id
                                }
                            });
                        }
                    }
                }
            }
        }
        
        // Process chapter sections
        for (const section of chapter.sections || []) {
            for (const sentence of section.sentences || []) {
                for (const word of sentence.words || []) {
                    if (word.transcriptionIndex !== undefined && word.timing) {
                        mappings.push({
                            transcriptionIndex: word.transcriptionIndex,
                            text: word.text,
                            originalText: word.originalText,
                            timing: word.timing,
                            context: {
                                chapterId: chapter.id,
                                sectionId: section.id,
                                sentenceId: sentence.id
                            }
                        });
                    }
                }
            }
        }
    }
    
    // Sort by transcription index to ensure proper order
    return mappings.sort((a, b) => a.transcriptionIndex - b.transcriptionIndex);
}

function generateHTML(wordMappings) {
    // Create word timing data for JavaScript
    const wordTimings = wordMappings.map(mapping => ({
        index: mapping.transcriptionIndex,
        start: mapping.timing.start,
        end: mapping.timing.end,
        word: mapping.text
    }));
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mere Metaphor</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            background-color: #faf8f3;
            color: #333;
        }

        .cover {
            text-align: center;
            margin: 40px 0 60px 0;
            page-break-after: always;
        }

        .cover h1 {
            font-size: 3em;
            margin-bottom: 20px;
            font-weight: bold;
            color: #2c3e50;
        }

        .cover .subtitle {
            font-size: 1.5em;
            margin-bottom: 30px;
            font-style: italic;
            color: #7f8c8d;
        }

        .cover .author {
            font-size: 1.2em;
            margin-bottom: 40px;
            color: #34495e;
        }

        .cover-image {
            max-width: 400px;
            width: 100%;
            height: auto;
            border: 2px solid #bdc3c7;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .toc {
            margin: 40px 0;
            padding: 20px;
            background-color: #ecf0f1;
            border-radius: 8px;
        }

        .toc h2 {
            margin-top: 0;
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }

        .toc ul {
            list-style-type: none;
            padding-left: 0;
        }

        .toc li {
            margin: 10px 0;
            padding: 8px 15px;
            background-color: white;
            border-radius: 4px;
            border-left: 4px solid #3498db;
        }

        .toc a {
            text-decoration: none;
            color: #2c3e50;
            font-weight: 500;
        }

        .toc a:hover {
            color: #3498db;
        }

        .preface {
            margin: 40px 0;
            padding: 20px;
            background-color: #f8f9fa;
            border-left: 4px solid #e74c3c;
            border-radius: 0 8px 8px 0;
        }

        .preface h2 {
            color: #e74c3c;
            margin-top: 0;
            font-size: 2em;
        }

        .preface p {
            margin-bottom: 15px;
            text-align: justify;
        }

        .glossary {
            margin: 40px 0;
            padding: 20px;
            background-color: #f1f2f6;
            border-radius: 8px;
        }

        .glossary h2 {
            color: #2c3e50;
            margin-top: 0;
            border-bottom: 2px solid #27ae60;
            padding-bottom: 10px;
        }

        .glossary-entry {
            margin: 15px 0;
            padding: 10px;
            background-color: white;
            border-radius: 4px;
            border-left: 3px solid #27ae60;
        }

        .glossary-term {
            font-weight: bold;
            color: #27ae60;
            margin-bottom: 5px;
        }

        .glossary-definition {
            color: #555;
            line-height: 1.5;
        }

        .audio-player {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 15px 20px;
            border-radius: 25px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 1000;
            border: 2px solid #3498db;
        }

        .play-btn {
            background: #3498db;
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.3s;
        }

        .play-btn:hover {
            background: #2980b9;
        }

        .progress-container {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .progress-bar {
            flex: 1;
            height: 6px;
            background: #ecf0f1;
            border-radius: 3px;
            cursor: pointer;
            position: relative;
        }

        .progress-fill {
            height: 100%;
            background: #3498db;
            border-radius: 3px;
            width: 0%;
            transition: width 0.1s;
        }

        .time-display {
            color: #7f8c8d;
            font-size: 14px;
            min-width: 80px;
        }

        .word-highlight {
            background-color: #3498db;
            color: white;
            border-radius: 3px;
            transition: all 0.2s ease;
        }

        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .cover h1 {
                font-size: 2em;
            }
            
            .audio-player {
                bottom: 10px;
                left: 10px;
                right: 10px;
                transform: none;
                padding: 10px 15px;
            }
            
            .play-btn {
                width: 40px;
                height: 40px;
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="cover">
        <h1><span data-word="0">Mere</span> <span data-word="1">Metaphor</span></h1>
        <div class="subtitle"><span data-word="2">A</span> <span data-word="3">Science</span> <span data-word="4">Book</span> <span data-word="5">for</span> <span data-word="6">Everyone</span></div>
        <div class="author"><span data-word="7">by</span> <span data-word="8">Derek</span> <span data-word="9">Bredensteiner</span></div>
        <img src="cover-image.png" alt="Cover image" class="cover-image">
    </div>

    <div class="toc">
        <h2>Table of Contents</h2>
        <ul>
            <li><a href="#preface">Preface</a></li>
            <li><a href="#introduction">Introduction</a></li>
            <li><a href="#chapter1">Chapter 1: The Nature of Science</a></li>
            <li><a href="#chapter2">Chapter 2: Understanding Metaphor</a></li>
            <li><a href="#chapter3">Chapter 3: Science Communication</a></li>
            <li><a href="#conclusion">Conclusion</a></li>
            <li><a href="#glossary">Glossary</a></li>
        </ul>
    </div>

    <div class="preface" id="preface">
        <h2><span data-word="10">Preface</span></h2>
        
        <p><span data-word="12">If</span> <span data-word="13">you</span> <span data-word="14">believe</span> <span data-word="15">in</span> <span data-word="16">a</span> <span data-word="17">supernatural</span> <span data-word="18">entity</span> <span data-word="19">or</span> <span data-word="20">a</span> <span data-word="21">creator</span> <span data-word="22">of</span> <span data-word="23">the</span> <span data-word="24">universe</span>, <span data-word="25">that's</span> <span data-word="26">not</span> <span data-word="27">what</span> <span data-word="28">this</span> <span data-word="29">book</span> <span data-word="30">is</span> <span data-word="31">about</span>. <span data-word="32">This</span> <span data-word="33">book</span> <span data-word="34">is</span> <span data-word="35">about</span> <span data-word="36">an</span> <span data-word="37">entirely</span> <span data-word="38">naturalistic</span> (<span data-word="39">non</span>-<span data-word="40">supernatural</span>) <span data-word="41">understanding</span> <span data-word="42">of</span> <span data-word="43">the</span> <span data-word="44">universe</span>.</p>

        <p><span data-word="45">If</span> <span data-word="46">you</span> <span data-word="47">think</span> <span data-word="48">modern</span> <span data-word="49">society</span> <span data-word="50">is</span> <span data-word="51">too</span> <span data-word="52">scientific</span>, <span data-word="53">that</span> <span data-word="54">we</span> <span data-word="55">need</span> <span data-word="56">more</span> <span data-word="57">spirituality</span> <span data-word="58">and</span> <span data-word="59">less</span> <span data-word="60">materialism</span>, <span data-word="61">then</span> <span data-word="62">this</span> <span data-word="63">book</span> <span data-word="64">is</span> <span data-word="65">not</span> <span data-word="66">for</span> <span data-word="67">you</span> <span data-word="68">either</span>.</p>

        <p><span data-word="69">This</span> <span data-word="70">book</span> <span data-word="71">is</span> <span data-word="72">for</span> <span data-word="73">those</span> <span data-word="74">who</span> <span data-word="75">embrace</span> <span data-word="76">the</span> <span data-word="77">scientific</span> <span data-word="78">worldview</span>, <span data-word="79">but</span> <span data-word="80">who</span> <span data-word="81">recognize</span> <span data-word="82">that</span> <span data-word="83">science</span> <span data-word="84">communication</span> <span data-word="85">could</span> <span data-word="86">be</span> <span data-word="87">improved</span>. <span data-word="88">It</span> <span data-word="89">is</span> <span data-word="90">for</span> <span data-word="91">those</span> <span data-word="92">who</span> <span data-word="93">want</span> <span data-word="94">to</span> <span data-word="95">understand</span> <span data-word="96">how</span> <span data-word="97">metaphor</span> <span data-word="98">shapes</span> <span data-word="99">our</span> <span data-word="100">understanding</span> <span data-word="101">of</span> <span data-word="102">reality</span>, <span data-word="103">and</span> <span data-word="104">how</span> <span data-word="105">we</span> <span data-word="106">can</span> <span data-word="107">use</span> <span data-word="108">this</span> <span data-word="109">knowledge</span> <span data-word="110">to</span> <span data-word="111">communicate</span> <span data-word="112">science</span> <span data-word="113">more</span> <span data-word="114">effectively</span>.</p>

        <p><span data-word="115">The</span> <span data-word="116">central</span> <span data-word="117">thesis</span> <span data-word="118">of</span> <span data-word="119">this</span> <span data-word="120">book</span> <span data-word="121">is</span> <span data-word="122">that</span> <span data-word="123">all</span> <span data-word="124">human</span> <span data-word="125">understanding</span> <span data-word="126">is</span> <span data-word="127">metaphorical</span>. <span data-word="128">We</span> <span data-word="129">understand</span> <span data-word="130">new</span> <span data-word="131">and</span> <span data-word="132">abstract</span> <span data-word="133">concepts</span> <span data-word="134">by</span> <span data-word="135">relating</span> <span data-word="136">them</span> <span data-word="137">to</span> <span data-word="138">things</span> <span data-word="139">we</span> <span data-word="140">already</span> <span data-word="141">know</span>. <span data-word="142">This</span> <span data-word="143">is</span> <span data-word="144">true</span> <span data-word="145">not</span> <span data-word="146">just</span> <span data-word="147">in</span> <span data-word="148">poetry</span> <span data-word="149">and</span> <span data-word="150">literature</span>, <span data-word="151">but</span> <span data-word="152">in</span> <span data-word="153">science</span> <span data-word="154">as</span> <span data-word="155">well</span>.</p>

        <p><span data-word="156">By</span> <span data-word="157">understanding</span> <span data-word="158">how</span> <span data-word="159">metaphor</span> <span data-word="160">works</span>, <span data-word="161">we</span> <span data-word="162">can</span> <span data-word="163">become</span> <span data-word="164">better</span> <span data-word="165">science</span> <span data-word="166">communicators</span>, <span data-word="167">helping</span> <span data-word="168">others</span> <span data-word="169">to</span> <span data-word="170">see</span> <span data-word="171">the</span> <span data-word="172">beauty</span> <span data-word="173">and</span> <span data-word="174">wonder</span> <span data-word="175">of</span> <span data-word="176">the</span> <span data-word="177">natural</span> <span data-word="178">world</span> <span data-word="179">through</span> <span data-word="180">the</span> <span data-word="181">lens</span> <span data-word="182">of</span> <span data-word="183">science</span>.</p>
    </div>

    <div class="glossary" id="glossary">
        <h2>Glossary</h2>
        <div class="glossary-entry">
            <div class="glossary-term">Metaphor</div>
            <div class="glossary-definition">A figure of speech that describes an object or action in a way that isn't literally true but helps explain an idea or make a comparison.</div>
        </div>
        <div class="glossary-entry">
            <div class="glossary-term">Naturalistic</div>
            <div class="glossary-definition">Based on or characterized by the idea that everything arises from natural properties and causes, and supernatural or spiritual explanations are excluded or discounted.</div>
        </div>
        <div class="glossary-entry">
            <div class="glossary-term">Science Communication</div>
            <div class="glossary-definition">The practice of informing, educating, raising awareness of science-related topics, and sharing the wonder of scientific discovery with the general public.</div>
        </div>
    </div>

    <div class="audio-player" id="audioPlayer">
        <button class="play-btn" id="playBtn">▶</button>
        <div class="progress-container">
            <div class="progress-bar" id="progressBar">
                <div class="progress-fill" id="progressFill"></div>
            </div>
            <div class="time-display" id="timeDisplay">0:00 / 0:00</div>
        </div>
    </div>

    <audio id="audioElement" preload="metadata">
        <source src="cover_and_preface.mp3" type="audio/mpeg">
        Your browser does not support the audio element.
    </audio>

    <script>
        class AutomatedAudioPlayer {
            constructor() {
                this.audio = document.getElementById('audioElement');
                this.playBtn = document.getElementById('playBtn');
                this.progressBar = document.getElementById('progressBar');
                this.progressFill = document.getElementById('progressFill');
                this.timeDisplay = document.getElementById('timeDisplay');
                this.isPlaying = false;
                this.currentWordIndex = -1;
                this.wordTimings = ${JSON.stringify(wordTimings, null, 16)};
                
                this.initEventListeners();
            }
            
            initEventListeners() {
                this.playBtn.addEventListener('click', () => this.togglePlay());
                this.progressBar.addEventListener('click', (e) => this.seek(e));
                this.audio.addEventListener('timeupdate', () => this.updateProgress());
                this.audio.addEventListener('loadedmetadata', () => this.updateTimeDisplay());
                this.audio.addEventListener('ended', () => this.resetPlayer());
            }
            
            togglePlay() {
                if (this.isPlaying) {
                    this.pause();
                } else {
                    this.play();
                }
            }
            
            play() {
                this.audio.play();
                this.playBtn.textContent = '⏸';
                this.isPlaying = true;
            }
            
            pause() {
                this.audio.pause();
                this.playBtn.textContent = '▶';
                this.isPlaying = false;
            }
            
            seek(e) {
                const rect = this.progressBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                this.audio.currentTime = percent * this.audio.duration;
            }
            
            updateProgress() {
                const percent = (this.audio.currentTime / this.audio.duration) * 100;
                this.progressFill.style.width = percent + '%';
                this.updateTimeDisplay();
                this.highlightCurrentWord();
            }
            
            updateTimeDisplay() {
                const current = this.formatTime(this.audio.currentTime);
                const duration = this.formatTime(this.audio.duration);
                this.timeDisplay.textContent = current + ' / ' + duration;
            }
            
            formatTime(seconds) {
                if (isNaN(seconds)) return '0:00';
                const mins = Math.floor(seconds / 60);
                const secs = Math.floor(seconds % 60);
                return mins + ':' + (secs < 10 ? '0' : '') + secs;
            }
            
            highlightCurrentWord() {
                const currentTime = this.audio.currentTime;
                
                // Find the current word based on timing
                let targetWordIndex = -1;
                for (let i = 0; i < this.wordTimings.length; i++) {
                    const timing = this.wordTimings[i];
                    if (currentTime >= timing.start && currentTime <= timing.end) {
                        targetWordIndex = i;
                        break;
                    }
                }
                
                // Only update if we've moved to a different word
                if (targetWordIndex !== this.currentWordIndex) {
                    // Remove previous highlight
                    if (this.currentWordIndex >= 0) {
                        const prevElement = document.querySelector('[data-word="' + this.currentWordIndex + '"]');
                        if (prevElement) {
                            prevElement.classList.remove('word-highlight');
                        }
                    }
                    
                    // Add new highlight
                    if (targetWordIndex >= 0) {
                        const currentElement = document.querySelector('[data-word="' + targetWordIndex + '"]');
                        if (currentElement) {
                            currentElement.classList.add('word-highlight');
                        }
                    }
                    
                    this.currentWordIndex = targetWordIndex;
                }
            }
            
            resetPlayer() {
                this.playBtn.textContent = '▶';
                this.isPlaying = false;
                this.progressFill.style.width = '0%';
                
                // Remove any remaining highlights
                if (this.currentWordIndex >= 0) {
                    const currentElement = document.querySelector('[data-word="' + this.currentWordIndex + '"]');
                    if (currentElement) {
                        currentElement.classList.remove('word-highlight');
                    }
                }
                this.currentWordIndex = -1;
            }
        }
        
        // Initialize the audio player when the page loads
        document.addEventListener('DOMContentLoaded', () => {
            new AutomatedAudioPlayer();
        });
    </script>
</body>
</html>`;
}

// Run the generation if this script is executed directly
if (require.main === module) {
    generateAudioHTML().catch(console.error);
}

module.exports = { generateAudioHTML };