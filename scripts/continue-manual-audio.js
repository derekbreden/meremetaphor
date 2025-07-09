const fs = require('fs');
const path = require('path');

// Load the current HTML
const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

console.log('Continuing manual word mapping from word 59...');

// Continue with the third paragraph: "I understand each reader has their own journey of faith..."
// Words 59-68: "I understand each reader has their own journey of faith."
html = html.replace(
  'I understand each reader has their own journey of faith.',
  
  '<span data-word="59">I</span> <span data-word="60">understand</span> <span data-word="61">each</span> <span data-word="62">reader</span> <span data-word="63">has</span> <span data-word="64">their</span> <span data-word="65">own</span> <span data-word="66">journey</span> <span data-word="67">of</span> <span data-word="68">faith</span>.'
);

// Continue with next sentence: "I've seen a spectrum of experience in my own family, from atheism, to conservative Christianity, to progressive Christianity, and many things in between."
// Words 69-88: "I've seen a spectrum of experience in my own family, from atheism, to conservative Christianity, to progressive Christianity, and many things in between."
html = html.replace(
  "I've seen a spectrum of experience in my own family, from atheism, to conservative Christianity, to progressive Christianity, and many things in between.",
  
  '<span data-word="69">I\'ve</span> <span data-word="70">seen</span> <span data-word="71">a</span> <span data-word="72">spectrum</span> <span data-word="73">of</span> <span data-word="74">experience</span> <span data-word="75">in</span> <span data-word="76">my</span> <span data-word="77">own</span> <span data-word="78">family</span>, <span data-word="79">from</span> <span data-word="80">atheism</span>, <span data-word="81">to</span> <span data-word="82">conservative</span> <span data-word="83">Christianity</span>, <span data-word="84">to</span> <span data-word="85">progressive</span> <span data-word="86">Christianity</span>, <span data-word="87">and</span> <span data-word="88">many</span> <span data-word="89">things</span> <span data-word="90">in</span> <span data-word="91">between</span>.'
);

// Continue with next sentence: "My intent isn't to challenge your path, but simply to share and explain a particular one — my own."
// Words 92-108: "My intent isn't to challenge your path, but simply to share and explain a particular one — my own."
html = html.replace(
  "My intent isn't to challenge your path, but simply to share and explain a particular one — my own.",
  
  '<span data-word="92">My</span> <span data-word="93">intent</span> <span data-word="94">isn\'t</span> <span data-word="95">to</span> <span data-word="96">challenge</span> <span data-word="97">your</span> <span data-word="98">path</span>, <span data-word="99">but</span> <span data-word="100">simply</span> <span data-word="101">to</span> <span data-word="102">share</span> <span data-word="103">and</span> <span data-word="104">explain</span> <span data-word="105">a</span> <span data-word="106">particular</span> <span data-word="107">one</span> — <span data-word="108">my</span> <span data-word="109">own</span>.'
);

// Write the result
fs.writeFileSync(htmlPath, html);

console.log('Continued manual mapping successfully!');
console.log('Now covers words 0-109 (first three sentences of preface)');
console.log('Extended highlighting to cover the entire first paragraph');