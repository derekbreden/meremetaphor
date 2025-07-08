const { PDFExtract } = require('pdf.js-extract');
const pdfExtract = new PDFExtract();
const options = {}; // no options for now

pdfExtract.extract('meremetaphor.pdf', options, (err, data) => {
    if (err) return console.log(err);
    
    console.log('Total pages:', data.pages.length);
    console.log('\n--- Page 1 Structure ---');
    const page1 = data.pages[0];
    console.log('Page 1 content items:', page1.content.length);
    
    // Show first few text items with their positions
    console.log('\nFirst 10 text items:');
    page1.content.slice(0, 10).forEach((item, i) => {
        console.log(`${i}: "${item.str}" at (${item.x}, ${item.y})`);
    });
    
    // Check for paragraph breaks
    console.log('\n--- Looking for paragraph structure ---');
    const prefacePage = data.pages.find(p => 
        p.content.some(item => item.str.includes('PREFACE'))
    );
    
    if (prefacePage) {
        console.log('\nPreface page found. Text items:');
        prefacePage.content.forEach((item, i) => {
            if (item.str.trim()) {
                console.log(`Y=${Math.round(item.y)}: "${item.str}"`);
            }
        });
    }
    
    // Save full data for inspection
    require('fs').writeFileSync(
        'pdf-extract-output.json', 
        JSON.stringify(data, null, 2)
    );
    console.log('\nFull output saved to pdf-extract-output.json');
});