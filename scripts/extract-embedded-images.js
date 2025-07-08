const fs = require('fs');
const path = require('path');

// Try to use pdf.js directly to extract embedded images
async function extractEmbeddedImages() {
    console.log('Attempting to extract embedded images from PDF...');
    
    try {
        // Import pdf.js
        const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
        
        // Read PDF file
        const pdfPath = path.join(__dirname, '..', 'meremetaphor.pdf');
        const data = new Uint8Array(fs.readFileSync(pdfPath));
        
        // Load PDF document
        const loadingTask = pdfjsLib.getDocument({data});
        const pdf = await loadingTask.promise;
        
        console.log(`PDF loaded with ${pdf.numPages} pages`);
        
        // Check pages for images
        for (let pageNum = 1; pageNum <= Math.min(5, pdf.numPages); pageNum++) {
            console.log(`\nChecking page ${pageNum} for embedded images...`);
            
            const page = await pdf.getPage(pageNum);
            const operatorList = await page.getOperatorList();
            
            console.log(`Page ${pageNum} has ${operatorList.fnArray.length} operations`);
            
            // Look for image operations
            const imageOps = [];
            for (let i = 0; i < operatorList.fnArray.length; i++) {
                const op = operatorList.fnArray[i];
                const args = operatorList.argsArray[i];
                
                // Check for different image operation types
                if (op === pdfjsLib.OPS.paintImageXObject || 
                    op === pdfjsLib.OPS.paintJpegXObject ||
                    op === pdfjsLib.OPS.paintInlineImageXObject) {
                    
                    console.log(`  Found image operation: ${op} with args:`, args);
                    imageOps.push({ op, args, index: i });
                }
            }
            
            if (imageOps.length > 0) {
                console.log(`  Page ${pageNum} contains ${imageOps.length} image(s)`);
                
                // Try to get the actual image data
                const objs = page.objs;
                console.log(`  Available objects:`, Object.keys(objs.objs || {}));
                
                // Try to access the resources
                imageOps.forEach((imgOp, idx) => {
                    if (imgOp.args && imgOp.args[0]) {
                        const imgRef = imgOp.args[0];
                        console.log(`    Image ${idx + 1} reference:`, imgRef);
                        
                        // Try to get the image object
                        try {
                            if (objs.has && objs.has(imgRef)) {
                                const imgObj = objs.get(imgRef);
                                console.log(`    Image object type:`, typeof imgObj);
                                if (imgObj) {
                                    console.log(`    Image properties:`, Object.keys(imgObj));
                                }
                            }
                        } catch (e) {
                            console.log(`    Could not access image object:`, e.message);
                        }
                    }
                });
            } else {
                console.log(`  No embedded images found on page ${pageNum}`);
            }
        }
        
    } catch (error) {
        console.error('Error extracting embedded images:', error);
        
        // Try alternative approach with pdf.js-extract to see what we can find
        console.log('\nTrying alternative approach with pdf.js-extract...');
        await tryPdfExtractApproach();
    }
}

async function tryPdfExtractApproach() {
    const { PDFExtract } = require('pdf.js-extract');
    const pdfExtract = new PDFExtract();
    const pdfPath = path.join(__dirname, '..', 'meremetaphor.pdf');
    
    return new Promise((resolve) => {
        pdfExtract.extract(pdfPath, {}, (err, data) => {
            if (err) {
                console.error('pdf.js-extract error:', err);
                resolve();
                return;
            }
            
            // Check first few pages for any clues about images
            for (let i = 0; i < Math.min(5, data.pages.length); i++) {
                const page = data.pages[i];
                console.log(`\nPage ${i + 1} analysis:`);
                console.log(`  Content items: ${page.content.length}`);
                
                // Look for any image-related content or gaps that might indicate images
                const yPositions = page.content
                    .filter(item => item.str.trim())
                    .map(item => item.y)
                    .sort((a, b) => a - b);
                
                if (yPositions.length > 1) {
                    const gaps = [];
                    for (let j = 1; j < yPositions.length; j++) {
                        const gap = yPositions[j] - yPositions[j-1];
                        if (gap > 50) { // Large gaps might indicate images
                            gaps.push({ start: yPositions[j-1], end: yPositions[j], size: gap });
                        }
                    }
                    
                    if (gaps.length > 0) {
                        console.log(`  Large gaps (possible images):`, gaps);
                    }
                }
                
                // Check if page has very little text (might be mostly image)
                const textContent = page.content.map(item => item.str.trim()).join(' ');
                if (textContent.length < 100) {
                    console.log(`  Page has minimal text (${textContent.length} chars): "${textContent}"`);
                    console.log(`  This might be an image-heavy page`);
                }
            }
            
            resolve();
        });
    });
}

extractEmbeddedImages();