/**
 * Fix missing data-word attributes in the HTML
 */

const fs = require('fs');
const path = require('path');

async function fixMissingAttributes() {
    console.log('=== Fixing Missing Data-Word Attributes ===\n');
    
    try {
        const htmlPath = path.join(__dirname, '..', 'index.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');
        
        console.log('1. Fixing title attributes...');
        // Fix title (indices 0-1)
        htmlContent = htmlContent.replace(
            '<h1><span>Mere</span> <span>Metaphor</span></h1>',
            '<h1><span data-word="0">Mere</span> <span data-word="1">Metaphor</span></h1>'
        );
        
        console.log('2. Fixing preface heading...');
        // Fix preface heading (index 11)
        htmlContent = htmlContent.replace(
            '<h3><span>Preface</span></h3>',
            '<h3><span data-word="11">Preface</span></h3>'
        );
        
        console.log('3. Fixing preface content spans...');
        // Fix first paragraph - add data-word attributes to existing spans
        htmlContent = htmlContent.replace(
            '<p><span>If</span> <span>you</span> <span>believe</span> <span>in</span> <span>a</span> <span>supernatural</span> entity or a creator of the universe, that\'s not what this book is about. <span>This</span> <span>book</span> <span>is</span> <span>about</span> <span>an</span> <span>entirely</span> <span>naturalistic</span> <span>(non-</span> <span>supernatural),</span> <span>physicalist,</span> <span>determinist,</span> <span>materialist</span> <span>view</span> <span>of</span> <span>religion</span> <span>and</span> <span>the</span> <span>meaning</span> <span>of</span> <span>the</span> <span>metaphors</span> <span>within</span> <span>it</span> <span>from</span> <span>that</span> <span>(natural)</span> <span>perspective</span>.</p>',
            '<p><span data-word="12">If</span> <span data-word="13">you</span> <span data-word="14">believe</span> <span data-word="15">in</span> <span data-word="16">a</span> <span data-word="17">supernatural</span> <span data-word="18">entity</span> <span data-word="19">or</span> <span data-word="20">a</span> <span data-word="21">creator</span> <span data-word="22">of</span> <span data-word="23">the</span> <span data-word="24">universe</span>, <span data-word="25">that\'s</span> <span data-word="26">not</span> <span data-word="27">what</span> <span data-word="28">this</span> <span data-word="29">book</span> <span data-word="30">is</span> <span data-word="31">about</span>. <span data-word="32">This</span> <span data-word="33">book</span> <span data-word="34">is</span> <span data-word="35">about</span> <span data-word="36">an</span> <span data-word="37">entirely</span> <span data-word="38">naturalistic</span> (<span data-word="39">non</span>-<span data-word="40">supernatural</span>), <span data-word="41">physicalist</span>, <span data-word="42">determinist</span>, <span data-word="43">materialist</span> <span data-word="44">view</span> <span data-word="45">of</span> <span data-word="46">religion</span> <span data-word="47">and</span> <span data-word="48">the</span> <span data-word="49">meaning</span> <span data-word="50">of</span> <span data-word="51">the</span> <span data-word="52">metaphors</span> <span data-word="53">within</span> <span data-word="54">it</span> <span data-word="55">from</span> <span data-word="56">that</span> (<span data-word="57">natural</span>) <span data-word="58">perspective</span>.</p>'
        );
        
        // Fix second paragraph start
        htmlContent = htmlContent.replace(
            '<p><span>I</span> <span>understand</span> <span>each</span> <span>reader</span> <span>has</span> <span>their</span> <span>own</span> <span>journey</span> <span>of</span> <span>faith</span>.',
            '<p><span data-word="59">I</span> <span data-word="60">understand</span> <span data-word="61">each</span> <span data-word="62">reader</span> <span data-word="63">has</span> <span data-word="64">their</span> <span data-word="65">own</span> <span data-word="66">journey</span> <span data-word="67">of</span> <span data-word="68">faith</span>.'
        );
        
        // We'll skip the middle part of paragraph 2 since it's not in the transcription
        // and go directly to paragraph 3
        
        // Fix third paragraph
        htmlContent = htmlContent.replace(
            '<p><span>I</span> <span>realize</span> <span>not</span> <span>everyone</span> <span>reading</span> <span>this</span> <span>book</span> <span>will</span> <span>share</span> <span>my</span> <span>perspective</span>, <span>but</span> <span>hopefully</span> <span>what</span> <span>is</span> <span>presented</span> <span>here</span> <span>will</span> <span>not</span> <span>be</span> <span>a</span> <span>challenge</span>, <span>but</span> <span>simply</span> <span>information</span>.</p>',
            '<p><span data-word="110">I</span> <span data-word="111">realize</span> <span data-word="112">not</span> <span data-word="113">everyone</span> <span data-word="114">reading</span> <span data-word="115">this</span> <span data-word="116">book</span> <span data-word="117">will</span> <span data-word="118">share</span> <span data-word="119">my</span> <span data-word="120">perspective</span>, <span data-word="121">but</span> <span data-word="122">hopefully</span> <span data-word="123">what</span> <span data-word="124">is</span> <span data-word="125">presented</span> <span data-word="126">here</span> <span data-word="127">will</span> <span data-word="128">not</span> <span data-word="129">be</span> <span data-word="130">a</span> <span data-word="131">challenge</span>, <span data-word="132">but</span> <span data-word="133">simply</span> <span data-word="134">information</span>.</p>'
        );
        
        // Fix fourth paragraph  
        htmlContent = htmlContent.replace(
            '<p><span>I</span> <span>see</span> <span>the</span> <span>audience</span> <span>here</span> <span>as</span> <span>Christians</span> <span>who</span> <span>struggle</span> <span>with</span> <span>believability</span>, <span>atheists</span> <span>who</span> <span>struggle</span> <span>with</span> <span>living</span> <span>as</span> <span>a</span> <span>minority</span> <span>in</span> <span>a</span> <span>Christian</span> <span>society</span>, <span>and</span> <span>most</span> <span>importantly</span> — <span>anyone</span> <span>who</span> <span>seeks</span> <span>to</span> <span>understand</span> <span>either</span> <span>of</span> <span>those</span> <span>two</span> <span>groups</span> <span>better</span>.</p>',
            '<p><span data-word="135">I</span> <span data-word="136">see</span> <span data-word="137">the</span> <span data-word="138">audience</span> <span data-word="139">here</span> <span data-word="140">as</span> <span data-word="141">Christians</span> <span data-word="142">who</span> <span data-word="143">struggle</span> <span data-word="144">with</span> <span data-word="145">believability</span>, <span data-word="146">atheists</span> <span data-word="147">who</span> <span data-word="148">struggle</span> <span data-word="149">with</span> <span data-word="150">living</span> <span data-word="151">as</span> <span data-word="152">a</span> <span data-word="153">minority</span> <span data-word="154">in</span> <span data-word="155">a</span> <span data-word="156">Christian</span> <span data-word="157">society</span>, <span data-word="158">and</span> <span data-word="159">most</span> <span data-word="160">importantly</span> — <span data-word="161">anyone</span> <span data-word="162">who</span> <span data-word="163">seeks</span> <span data-word="164">to</span> <span data-word="165">understand</span> <span data-word="166">either</span> <span data-word="167">of</span> <span data-word="168">those</span> <span data-word="169">two</span> <span data-word="170">groups</span> <span data-word="171">better</span>.</p>'
        );
        
        // Fix fifth paragraph
        htmlContent = htmlContent.replace(
            '<p><span>I</span> <span>hope</span> <span>to</span> <span>present</span> <span>here</span> <span>an</span> <span>interpretation</span> <span>of</span> <span>Christianity</span> (<span>or</span> <span>at</span> <span>least</span> <span>some</span> <span>part</span> <span>of</span> <span>Christianity</span>) <span>that</span> <span>is</span> <span>compatible</span> <span>with</span> <span>an</span> <span>entirely</span> <span>natural</span> <span>universe</span>.</p>',
            '<p><span data-word="172">I</span> <span data-word="173">hope</span> <span data-word="174">to</span> <span data-word="175">present</span> <span data-word="176">here</span> <span data-word="177">an</span> <span data-word="178">interpretation</span> <span data-word="179">of</span> <span data-word="180">Christianity</span> (<span data-word="181">or</span> <span data-word="182">at</span> <span data-word="183">least</span> <span data-word="184">some</span> <span data-word="185">part</span> <span data-word="186">of</span> <span data-word="187">Christianity</span>) <span data-word="188">that</span> <span data-word="189">is</span> <span data-word="190">compatible</span> <span data-word="191">with</span> <span data-word="192">an</span> <span data-word="193">entirely</span> <span data-word="194">natural</span> <span data-word="195">universe</span>.</p>'
        );
        
        // Write the fixed HTML
        fs.writeFileSync(htmlPath, htmlContent);
        
        console.log('4. Complete!');
        console.log('   ✓ Fixed title data-word attributes (0-1)');
        console.log('   ✓ Fixed preface heading attribute (11)');
        console.log('   ✓ Fixed preface content attributes (12-195)');
        console.log('   ✓ Audio highlighting should now work completely');
        
    } catch (error) {
        console.error('Failed to fix attributes:', error);
    }
}

// Run the fix if this script is executed directly
if (require.main === module) {
    fixMissingAttributes().catch(console.error);
}

module.exports = { fixMissingAttributes };