const fs = require('fs');
const path = require('path');

// Load the current HTML
const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

console.log('Extending to cover full preface...');

// Map the third paragraph: "I realize not everyone reading this book will share my perspective, but hopefully what is presented here will not be a challenge, but simply information."
// Words 110-131: "I realize not everyone reading this book will share my perspective, but hopefully what is presented here will not be a challenge, but simply information."
html = html.replace(
  'I realize not everyone reading this book will share my perspective, but hopefully what is presented here will not be a challenge, but simply information.',
  
  '<span data-word="110">I</span> <span data-word="111">realize</span> <span data-word="112">not</span> <span data-word="113">everyone</span> <span data-word="114">reading</span> <span data-word="115">this</span> <span data-word="116">book</span> <span data-word="117">will</span> <span data-word="118">share</span> <span data-word="119">my</span> <span data-word="120">perspective</span>, <span data-word="121">but</span> <span data-word="122">hopefully</span> <span data-word="123">what</span> <span data-word="124">is</span> <span data-word="125">presented</span> <span data-word="126">here</span> <span data-word="127">will</span> <span data-word="128">not</span> <span data-word="129">be</span> <span data-word="130">a</span> <span data-word="131">challenge</span>, <span data-word="132">but</span> <span data-word="133">simply</span> <span data-word="134">information</span>.'
);

// Map the fourth paragraph: "I see the audience here as Christians who struggle with believability, atheists who struggle with living as a minority in a Christian society, and most importantly — anyone who seeks to understand either of those two groups better."
// Words 135-163: "I see the audience here as Christians who struggle with believability, atheists who struggle with living as a minority in a Christian society, and most importantly — anyone who seeks to understand either of those two groups better."
html = html.replace(
  'I see the audience here as Christians who struggle with believability, atheists who struggle with living as a minority in a Christian society, and most importantly — anyone who seeks to understand either of those two groups better.',
  
  '<span data-word="135">I</span> <span data-word="136">see</span> <span data-word="137">the</span> <span data-word="138">audience</span> <span data-word="139">here</span> <span data-word="140">as</span> <span data-word="141">Christians</span> <span data-word="142">who</span> <span data-word="143">struggle</span> <span data-word="144">with</span> <span data-word="145">believability</span>, <span data-word="146">atheists</span> <span data-word="147">who</span> <span data-word="148">struggle</span> <span data-word="149">with</span> <span data-word="150">living</span> <span data-word="151">as</span> <span data-word="152">a</span> <span data-word="153">minority</span> <span data-word="154">in</span> <span data-word="155">a</span> <span data-word="156">Christian</span> <span data-word="157">society</span>, <span data-word="158">and</span> <span data-word="159">most</span> <span data-word="160">importantly</span> — <span data-word="161">anyone</span> <span data-word="162">who</span> <span data-word="163">seeks</span> <span data-word="164">to</span> <span data-word="165">understand</span> <span data-word="166">either</span> <span data-word="167">of</span> <span data-word="168">those</span> <span data-word="169">two</span> <span data-word="170">groups</span> <span data-word="171">better</span>.'
);

// Map the fifth paragraph: "I hope to present here an interpretation of Christianity (or at least some part of Christianity) that is compatible with an entirely natural universe."
// Words 172-195: "I hope to present here an interpretation of Christianity (or at least some part of Christianity) that is compatible with an entirely natural universe."
html = html.replace(
  'I hope to present here an interpretation of Christianity (or at least some part of Christianity) that is compatible with an entirely natural universe.',
  
  '<span data-word="172">I</span> <span data-word="173">hope</span> <span data-word="174">to</span> <span data-word="175">present</span> <span data-word="176">here</span> <span data-word="177">an</span> <span data-word="178">interpretation</span> <span data-word="179">of</span> <span data-word="180">Christianity</span> (<span data-word="181">or</span> <span data-word="182">at</span> <span data-word="183">least</span> <span data-word="184">some</span> <span data-word="185">part</span> <span data-word="186">of</span> <span data-word="187">Christianity</span>) <span data-word="188">that</span> <span data-word="189">is</span> <span data-word="190">compatible</span> <span data-word="191">with</span> <span data-word="192">an</span> <span data-word="193">entirely</span> <span data-word="194">natural</span> <span data-word="195">universe</span>.'
);

// Write the result
fs.writeFileSync(htmlPath, html);

console.log('Extended to full preface successfully!');
console.log('Now covers words 0-195 (complete preface section)');
console.log('This should provide highlighting for the entire 93-second audio clip');