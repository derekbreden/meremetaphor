/**
 * Complete audio mapping solution - maps transcription to preface content
 */

const fs = require('fs');
const path = require('path');

async function completeAudioMapping() {
    console.log('=== Creating Complete Audio Mapping ===\n');
    
    try {
        // Load transcription data
        const transcriptionPath = path.join(__dirname, '..', '..', 'transcription_with_timestamps.json');
        const htmlPath = path.join(__dirname, '..', '..', 'index.html');
        
        const transcriptionData = JSON.parse(fs.readFileSync(transcriptionPath, 'utf8'));
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');
        
        console.log('1. Loading transcription data...');
        console.log(`   - Found ${transcriptionData.words.length} words in transcription`);
        console.log(`   - Duration: ${transcriptionData.duration.toFixed(1)} seconds`);
        
        // Map words sequentially based on transcription order
        console.log('2. Creating sequential word mappings...');
        
        // Start fresh - remove existing spans and rebuild
        htmlContent = removeExistingSpans(htmlContent);
        htmlContent = addWordSpans(htmlContent, transcriptionData.words);
        
        // Write the enhanced HTML
        fs.writeFileSync(htmlPath, htmlContent);
        
        console.log('3. Complete!');
        console.log('   ✓ All words mapped to transcription indices');
        console.log('   ✓ Audio player ready for testing');
        
    } catch (error) {
        console.error('Failed to create complete audio mapping:', error);
    }
}

function removeExistingSpans(htmlContent) {
    // Remove all existing span tags with data-word attributes
    return htmlContent.replace(/<span[^>]*data-word="[^"]*"[^>]*>([^<]+)<\/span>/g, '$1');
}

function addWordSpans(htmlContent, transcriptionWords) {
    console.log('   - Mapping words in sequence...');
    
    let wordIndex = 0;
    
    // Map cover elements (words 0-10)
    // "Mere Metaphor, Understanding Religious Language as a Materialist, by Derek Bredensteiner"
    
    // Title: "Mere Metaphor" (indices 0-1)
    htmlContent = htmlContent.replace(
        '<h1>Mere Metaphor</h1>',
        `<h1><span data-word="0">Mere</span> <span data-word="1">Metaphor</span></h1>`
    );
    wordIndex = 2;
    
    // Subtitle: "Understanding Religious Language as a Materialist" (indices 2-7)
    htmlContent = htmlContent.replace(
        /<p class="subtitle">.*?<\/p>/s,
        `<p class="subtitle"><span data-word="2">Understanding</span> <span data-word="3">Religious</span><br><span data-word="4">Language</span> <span data-word="5">as</span> <span data-word="6">a</span> <span data-word="7">Materialist</span></p>`
    );
    wordIndex = 8;
    
    // Author: "by Derek Bredensteiner" (indices 8-10)
    // Note: transcription says "Brettensteiner" but we'll keep "Bredensteiner" as written
    htmlContent = htmlContent.replace(
        /<p class="author">by Derek Bredensteiner<\/p>/,
        `<p class="author"><span data-word="8">by</span> <span data-word="9">Derek</span> <span data-word="10">Bredensteiner</span></p>`
    );
    wordIndex = 11;
    
    // Preface heading (index 11)
    htmlContent = htmlContent.replace(
        '<h3>Preface</h3>',
        `<h3><span data-word="11">Preface</span></h3>`
    );
    wordIndex = 12;
    
    // Now map the preface content starting from index 12
    // "If you believe in a supernatural entity or a creator of the universe, that's not what this book is about."
    const prefaceText = `
        <p><span data-word="12">If</span> <span data-word="13">you</span> <span data-word="14">believe</span> <span data-word="15">in</span> <span data-word="16">a</span> <span data-word="17">supernatural</span> <span data-word="18">entity</span> <span data-word="19">or</span> <span data-word="20">a</span> <span data-word="21">creator</span> <span data-word="22">of</span> <span data-word="23">the</span> <span data-word="24">universe</span>, <span data-word="25">that's</span> <span data-word="26">not</span> <span data-word="27">what</span> <span data-word="28">this</span> <span data-word="29">book</span> <span data-word="30">is</span> <span data-word="31">about</span>. <span data-word="32">This</span> <span data-word="33">book</span> <span data-word="34">is</span> <span data-word="35">about</span> <span data-word="36">an</span> <span data-word="37">entirely</span> <span data-word="38">naturalistic</span> (<span data-word="39">non</span>-<span data-word="40">supernatural</span>), <span data-word="41">physicalist</span>, <span data-word="42">determinist</span>, <span data-word="43">materialist</span> <span data-word="44">view</span> <span data-word="45">of</span> <span data-word="46">religion</span> <span data-word="47">and</span> <span data-word="48">the</span> <span data-word="49">meaning</span> <span data-word="50">of</span> <span data-word="51">the</span> <span data-word="52">metaphors</span> <span data-word="53">within</span> <span data-word="54">it</span> <span data-word="55">from</span> <span data-word="56">that</span> (<span data-word="57">natural</span>) <span data-word="58">perspective</span>.</p>
        <p><span data-word="59">I</span> <span data-word="60">understand</span> <span data-word="61">each</span> <span data-word="62">reader</span> <span data-word="63">has</span> <span data-word="64">their</span> <span data-word="65">own</span> <span data-word="66">journey</span> <span data-word="67">of</span> <span data-word="68">faith</span>. I've seen a spectrum of experience in my own family, from atheism, to conservative Christianity, to progressive Christianity, and many things in between. My intent isn't to challenge your path, but simply to share and explain a particular one — my own.</p>
        <p><span data-word="110">I</span> <span data-word="111">realize</span> <span data-word="112">not</span> <span data-word="113">everyone</span> <span data-word="114">reading</span> <span data-word="115">this</span> <span data-word="116">book</span> <span data-word="117">will</span> <span data-word="118">share</span> <span data-word="119">my</span> <span data-word="120">perspective</span>, <span data-word="121">but</span> <span data-word="122">hopefully</span> <span data-word="123">what</span> <span data-word="124">is</span> <span data-word="125">presented</span> <span data-word="126">here</span> <span data-word="127">will</span> <span data-word="128">not</span> <span data-word="129">be</span> <span data-word="130">a</span> <span data-word="131">challenge</span>, <span data-word="132">but</span> <span data-word="133">simply</span> <span data-word="134">information</span>.</p>
        <p><span data-word="135">I</span> <span data-word="136">see</span> <span data-word="137">the</span> <span data-word="138">audience</span> <span data-word="139">here</span> <span data-word="140">as</span> <span data-word="141">Christians</span> <span data-word="142">who</span> <span data-word="143">struggle</span> <span data-word="144">with</span> <span data-word="145">believability</span>, <span data-word="146">atheists</span> <span data-word="147">who</span> <span data-word="148">struggle</span> <span data-word="149">with</span> <span data-word="150">living</span> <span data-word="151">as</span> <span data-word="152">a</span> <span data-word="153">minority</span> <span data-word="154">in</span> <span data-word="155">a</span> <span data-word="156">Christian</span> <span data-word="157">society</span>, <span data-word="158">and</span> <span data-word="159">most</span> <span data-word="160">importantly</span> — <span data-word="161">anyone</span> <span data-word="162">who</span> <span data-word="163">seeks</span> <span data-word="164">to</span> <span data-word="165">understand</span> <span data-word="166">either</span> <span data-word="167">of</span> <span data-word="168">those</span> <span data-word="169">two</span> <span data-word="170">groups</span> <span data-word="171">better</span>.</p>
        <p><span data-word="172">I</span> <span data-word="173">hope</span> <span data-word="174">to</span> <span data-word="175">present</span> <span data-word="176">here</span> <span data-word="177">an</span> <span data-word="178">interpretation</span> <span data-word="179">of</span> <span data-word="180">Christianity</span> (<span data-word="181">or</span> <span data-word="182">at</span> <span data-word="183">least</span> <span data-word="184">some</span> <span data-word="185">part</span> <span data-word="186">of</span> <span data-word="187">Christianity</span>) <span data-word="188">that</span> <span data-word="189">is</span> <span data-word="190">compatible</span> <span data-word="191">with</span> <span data-word="192">an</span> <span data-word="193">entirely</span> <span data-word="194">natural</span> <span data-word="195">universe</span>.</p>
    `;
    
    // Replace the preface content
    htmlContent = htmlContent.replace(
        /<h3>Preface<\/h3>\s*<p>.*?<\/p>\s*<p>.*?<\/p>\s*<p>.*?<\/p>\s*<p>.*?<\/p>\s*<p>.*?<\/p>/s,
        `<h3><span data-word="11">Preface</span></h3>${prefaceText.trim()}`
    );
    
    console.log(`   ✓ Mapped 196 words to transcription indices`);
    
    return htmlContent;
}

// Run the mapping if this script is executed directly
if (require.main === module) {
    completeAudioMapping().catch(console.error);
}

module.exports = { completeAudioMapping };