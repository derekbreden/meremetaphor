const fs = require('fs');
const path = require('path');

// Load the current HTML
const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

console.log('Extending manual word mapping...');

// Extend the mapping to cover the entire first sentence and beyond
// Looking at the first paragraph: "If you believe in a supernatural entity or a creator of the universe, that's not what this book is about."

// Replace the current limited mapping with more complete coverage
html = html.replace(
  '<span data-word="12">If</span> <span data-word="13">you</span> <span data-word="14">believe</span> <span data-word="15">in</span> <span data-word="16">a</span> <span data-word="17">supernatural</span> entity or a creator of the universe, that\'s not what this book is about.',
  
  '<span data-word="12">If</span> <span data-word="13">you</span> <span data-word="14">believe</span> <span data-word="15">in</span> <span data-word="16">a</span> <span data-word="17">supernatural</span> <span data-word="18">entity</span> <span data-word="19">or</span> <span data-word="20">a</span> <span data-word="21">creator</span> <span data-word="22">of</span> <span data-word="23">the</span> <span data-word="24">universe</span>, <span data-word="25">that\'s</span> <span data-word="26">not</span> <span data-word="27">what</span> <span data-word="28">this</span> <span data-word="29">book</span> <span data-word="30">is</span> <span data-word="31">about</span>.'
);

// Continue with the second sentence: "This book is about an entirely naturalistic (non- supernatural), physicalist, determinist, materialist view..."
html = html.replace(
  'This book is about an entirely naturalistic (non- supernatural), physicalist, determinist, materialist view of religion and the meaning of the metaphors within it from that (natural) perspective.',
  
  '<span data-word="32">This</span> <span data-word="33">book</span> <span data-word="34">is</span> <span data-word="35">about</span> <span data-word="36">an</span> <span data-word="37">entirely</span> <span data-word="38">naturalistic</span> <span data-word="39">(non-</span> <span data-word="40">supernatural),</span> <span data-word="41">physicalist,</span> <span data-word="42">determinist,</span> <span data-word="43">materialist</span> <span data-word="44">view</span> <span data-word="45">of</span> <span data-word="46">religion</span> <span data-word="47">and</span> <span data-word="48">the</span> <span data-word="49">meaning</span> <span data-word="50">of</span> <span data-word="51">the</span> <span data-word="52">metaphors</span> <span data-word="53">within</span> <span data-word="54">it</span> <span data-word="55">from</span> <span data-word="56">that</span> <span data-word="57">(natural)</span> <span data-word="58">perspective</span>.'
);

// Write the result
fs.writeFileSync(htmlPath, html);

console.log('Extended manual mapping successfully!');
console.log('Now covers words 0-58 (first two sentences of preface)');
console.log('This should fix the "If" issue and extend highlighting much further');