const fs = require('fs');
const path = require('path');

// Load the current HTML
const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

console.log('Fixing gap in word mapping...');

// Fix the gap between word 17 and 32 - need to map words 18-31
html = html.replace(
  '<span data-word="17">supernatural</span> entity or a creator of the universe, that\'s not what this book is about. <span data-word="32">This</span>',
  
  '<span data-word="17">supernatural</span> <span data-word="18">entity</span> <span data-word="19">or</span> <span data-word="20">a</span> <span data-word="21">creator</span> <span data-word="22">of</span> <span data-word="23">the</span> <span data-word="24">universe</span>, <span data-word="25">that\'s</span> <span data-word="26">not</span> <span data-word="27">what</span> <span data-word="28">this</span> <span data-word="29">book</span> <span data-word="30">is</span> <span data-word="31">about</span>. <span data-word="32">This</span>'
);

// Fix the gap for the second sentence - need to map words 69-91
html = html.replace(
  '<span data-word="68">faith</span>. I\'ve seen a spectrum of experience in my own family, from atheism, to conservative Christianity, to progressive Christianity, and many things in between. My intent isn\'t to challenge your path, but simply to share and explain a particular one — my own.',
  
  '<span data-word="68">faith</span>. <span data-word="69">I\'ve</span> <span data-word="70">seen</span> <span data-word="71">a</span> <span data-word="72">spectrum</span> <span data-word="73">of</span> <span data-word="74">experience</span> <span data-word="75">in</span> <span data-word="76">my</span> <span data-word="77">own</span> <span data-word="78">family</span>, <span data-word="79">from</span> <span data-word="80">atheism</span>, <span data-word="81">to</span> <span data-word="82">conservative</span> <span data-word="83">Christianity</span>, <span data-word="84">to</span> <span data-word="85">progressive</span> <span data-word="86">Christianity</span>, <span data-word="87">and</span> <span data-word="88">many</span> <span data-word="89">things</span> <span data-word="90">in</span> <span data-word="91">between</span>. <span data-word="92">My</span> <span data-word="93">intent</span> <span data-word="94">isn\'t</span> <span data-word="95">to</span> <span data-word="96">challenge</span> <span data-word="97">your</span> <span data-word="98">path</span>, <span data-word="99">but</span> <span data-word="100">simply</span> <span data-word="101">to</span> <span data-word="102">share</span> <span data-word="103">and</span> <span data-word="104">explain</span> <span data-word="105">a</span> <span data-word="106">particular</span> <span data-word="107">one</span> — <span data-word="108">my</span> <span data-word="109">own</span>.'
);

// Write the result
fs.writeFileSync(htmlPath, html);

console.log('Fixed gap in mapping successfully!');
console.log('Now covers words 0-109 continuously (first two full paragraphs of preface)');