const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PDFExtract } = require('pdf.js-extract');

async function buildSite() {
    console.log('Building site from PDF (embedded images + text)...');
    
    try {
        // Step 1: Extract embedded images
        await extractEmbeddedImages();
        
        // Step 2: Extract and process text
        await extractText();
        
        console.log('Build complete!');
        
    } catch (error) {
        console.error('Error building site:', error);
        process.exit(1);
    }
}

async function extractEmbeddedImages() {
    console.log('Extracting embedded images...');
    
    // Create images directory
    const imagesDir = path.join(__dirname, '..', 'images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir);
    }
    
    // Create temporary directory for extraction
    const tempDir = path.join(__dirname, '..', 'temp-extracted');
    if (fs.existsSync(tempDir)) {
        execSync(`rm -rf "${tempDir}"`);
    }
    fs.mkdirSync(tempDir);
    
    try {
        // Extract all embedded images using pdfimages
        console.log('  Running pdfimages...');
        execSync(`pdfimages -png "meremetaphor.pdf" "${path.join(tempDir, 'img')}"`, {
            cwd: path.join(__dirname, '..'),
            stdio: 'pipe'
        });
        
        // Map images based on the pdfimages -list output we saw earlier
        const imageMap = [
            { source: 'img-000.png', dest: 'cover.png', description: 'Cover tree illustration' },
            { source: 'img-002.png', dest: 'preface-illustration.png', description: 'Preface illustration' },
            { source: 'img-004.png', dest: 'about-author-illustration.png', description: 'About the Author illustration' },
            { source: 'img-006.png', dest: 'metaphor-illustration.png', description: 'Introduction: Metaphor illustration' },
            { source: 'img-008.png', dest: 'god-illustration.png', description: 'God: Love Within and Between Us illustration' },
            { source: 'img-010.png', dest: 'freewill-illustration.png', description: 'Free Will illustration' },
            { source: 'img-012.png', dest: 'good-illustration.png', description: 'Good: A Direction We Choose illustration' },
            { source: 'img-014.png', dest: 'sin-illustration.png', description: 'Sin illustration' },
            { source: 'img-016.png', dest: 'redemption-illustration.png', description: 'Redemption illustration' },
            { source: 'img-018.png', dest: 'heaven-illustration.png', description: 'Heaven illustration' },
            { source: 'img-020.png', dest: 'prayer-illustration.png', description: 'Prayer illustration' },
            { source: 'img-022.png', dest: 'voices-illustration.png', description: 'Voices illustration' },
            { source: 'img-024.png', dest: 'afterword-illustration.png', description: 'Afterword illustration' },
            { source: 'img-026.png', dest: 'glossary-illustration.png', description: 'Glossary illustration' }
        ];
        
        // Copy the main images (skip masks which are the odd-numbered ones)
        imageMap.forEach(({ source, dest, description }) => {
            const sourcePath = path.join(tempDir, source);
            const destPath = path.join(imagesDir, dest);
            
            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, destPath);
                const stats = fs.statSync(destPath);
                console.log(`    ✓ ${dest} (${Math.round(stats.size / 1024)}KB) - ${description}`);
            } else {
                console.log(`    ✗ ${source} not found`);
            }
        });
        
    } finally {
        // Clean up temp directory
        if (fs.existsSync(tempDir)) {
            execSync(`rm -rf "${tempDir}"`);
        }
    }
}

async function extractText() {
    console.log('Extracting text...');
    
    const pdfExtract = new PDFExtract();
    const pdfPath = path.join(__dirname, '..', 'meremetaphor.pdf');
    
    return new Promise((resolve, reject) => {
        pdfExtract.extract(pdfPath, {}, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            
            // Convert to HTML
            let htmlContent = '';
            
            // Process cover page with embedded image
            htmlContent += `
<div class="cover-page">
    <h1>Mere Metaphor</h1>
    <div class="cover-illustration">
        <img src="images/cover.png" alt="Tree illustration with profile and 'God is love'" class="cover-image">
    </div>
    <p class="subtitle">Understanding Religious<br>Language as a Materialist</p>
    <p class="author">by Derek Bredensteiner</p>
</div>
`;
            
            // Find and process Table of Contents
            const tocPageIndex = data.pages.findIndex(page => 
                page.content.some(item => item.str.includes('TABLE OF CONTENTS'))
            );
            
            if (tocPageIndex !== -1) {
                htmlContent += '<div class="table-of-contents">\n';
                htmlContent += '<h2>TABLE OF CONTENTS</h2>\n';
                
                const tocPage = data.pages[tocPageIndex];
                const tocStartIndex = tocPage.content.findIndex(item => 
                    item.str.includes('TABLE OF CONTENTS')
                );
                
                // Process TOC entries
                for (let i = tocStartIndex + 1; i < tocPage.content.length; i++) {
                    const item = tocPage.content[i];
                    const text = item.str.trim();
                    
                    // Skip empty strings and page numbers
                    if (!text || text.match(/^\d+$/)) continue;
                    
                    // Clean up TOC entries - remove dots and page numbers
                    const cleaned = text.replace(/\.+\d*$/, '').trim();
                    if (cleaned && cleaned !== '1') {
                        htmlContent += `<p>${escapeHtml(cleaned)}</p>\n`;
                    }
                }
                htmlContent += '</div>\n\n';
            }
            
            // Process chapters with their illustrations
            const chapters = [
                { name: 'PREFACE', image: 'preface-illustration.png' },
                { name: 'ABOUT THE AUTHOR', image: 'about-author-illustration.png' },
                { name: 'INTRODUCTION: METAPHOR', image: 'metaphor-illustration.png' },
                { name: 'GOD: LOVE WITHIN AND BETWEEN US', image: 'god-illustration.png' },
                { name: 'FREE WILL: RECURSING A LIFETIME', image: 'freewill-illustration.png' },
                { name: 'GOOD: A DIRECTION WE CHOOSE', image: 'good-illustration.png' },
                { name: 'SIN: ALIGNMENT WITH THAT CHOICE', image: 'sin-illustration.png' },
                { name: 'REDEMPTION: MAKING NEW CHOICES', image: 'redemption-illustration.png' },
                { name: 'HEAVEN: A STATE OF MIND AND BEING', image: 'heaven-illustration.png' },
                { name: 'PRAYER: EFFECTS OF SELF-REFLECTION', image: 'prayer-illustration.png' },
                { name: 'VOICES: WHAT INSPIRES SHAMANS', image: 'voices-illustration.png' },
                { name: 'AFTERWORD', image: 'afterword-illustration.png' },
                { name: 'GLOSSARY', image: 'glossary-illustration.png' }
            ];
            
            chapters.forEach(chapter => {
                // Find all pages containing this chapter
                const chapterPages = [];
                
                data.pages.forEach((page, pageIndex) => {
                    if (page.content.some(item => item.str === chapter.name)) {
                        chapterPages.push(pageIndex);
                    }
                });
                
                if (chapterPages.length === 0) return;
                
                htmlContent += `<h2 class="chapter-header">${escapeHtml(chapter.name)}</h2>\n`;
                
                // Add chapter illustration if the file exists
                const imagePath = path.join(__dirname, '..', 'images', chapter.image);
                if (fs.existsSync(imagePath)) {
                    htmlContent += `<div class="chapter-illustration">\n`;
                    htmlContent += `<img src="images/${chapter.image}" alt="Illustration for ${chapter.name}" class="chapter-image">\n`;
                    htmlContent += `</div>\n\n`;
                }
                
                // Process all pages for this chapter (same text processing as before)
                chapterPages.forEach(pageIndex => {
                    const page = data.pages[pageIndex];
                    let currentParagraph = [];
                    let lastY = null;
                    let foundChapterTitle = false;
                    
                    page.content.forEach((item, itemIndex) => {
                        const text = item.str.trim();
                        
                        // Skip empty strings and standalone page numbers
                        if (!text || text.match(/^\d+$/)) return;
                        
                        // Skip the chapter header itself
                        if (text === chapter.name) {
                            foundChapterTitle = true;
                            return;
                        }
                        
                        // Handle subtitle (first non-empty line after chapter header)
                        if (foundChapterTitle && pageIndex === chapterPages[0] && 
                            itemIndex < 10 && text.length < 50 && !text.match(/^[A-Z\s]+$/)) {
                            if (currentParagraph.length > 0) {
                                htmlContent += `<p>${escapeHtml(currentParagraph.join(' '))}</p>\n`;
                                currentParagraph = [];
                            }
                            htmlContent += `<h3>${escapeHtml(text)}</h3>\n`;
                            foundChapterTitle = false;
                            lastY = item.y;
                            return;
                        }
                        
                        // Detect paragraph breaks by Y-coordinate gaps
                        if (lastY !== null && item.y - lastY > 25) {
                            // New paragraph
                            if (currentParagraph.length > 0) {
                                htmlContent += `<p>${escapeHtml(currentParagraph.join(' '))}</p>\n`;
                                currentParagraph = [];
                            }
                        }
                        
                        currentParagraph.push(text);
                        lastY = item.y;
                    });
                    
                    // Don't forget the last paragraph
                    if (currentParagraph.length > 0) {
                        htmlContent += `<p>${escapeHtml(currentParagraph.join(' '))}</p>\n`;
                    }
                });
                
                htmlContent += '\n';
            });
            
            // Read the template and update it (same as before)
            const templatePath = path.join(__dirname, '..', 'index.html');
            let template = fs.readFileSync(templatePath, 'utf8');
            
            // Update styles with image support (same as before)
            if (!template.includes('.cover-image')) {
                template = template.replace(
                    '</style>',
                    `    .cover-page {
            text-align: center;
            margin: 4em 0;
            page-break-after: always;
        }
        .cover-page h1 {
            font-size: 3em;
            margin-bottom: 1em;
        }
        .cover-illustration {
            margin: 3em 0;
        }
        .cover-image {
            max-width: 400px;
            height: auto;
            margin: 2em 0;
        }
        .chapter-illustration {
            text-align: center;
            margin: 2em 0;
        }
        .chapter-image {
            max-width: 500px;
            height: auto;
            margin: 1em 0;
        }
        .subtitle {
            font-size: 1.2em;
            margin: 1em 0;
        }
        .author {
            margin-top: 2em;
        }
        .table-of-contents {
            margin: 3em 0;
            page-break-after: always;
        }
        .table-of-contents h2 {
            text-align: center;
            margin-bottom: 2em;
        }
        .chapter-header {
            text-align: center;
            font-size: 1.5em;
            margin: 3em 0 2em;
            page-break-before: always;
        }
        @media print {
            .cover-page, .table-of-contents, .chapter-header {
                page-break-inside: avoid;
            }
        }
    </style>`
                );
            }
            
            // Remove placeholder and replace content (same as before)
            template = template.replace(
                /<div class="placeholder">[\s\S]*?<\/div>\s*/,
                ''
            );
            
            template = template.replace(
                /<h1>Mere Metaphor<\/h1>\s*/,
                ''
            );
            
            template = template.replace(
                /<div id="book-content">[\s\S]*?<\/div>\s*<\/body>/,
                `<div id="book-content">\n${htmlContent}\n    </div>\n</body>`
            );
            
            // Write the updated HTML
            fs.writeFileSync(templatePath, template);
            
            console.log(`Processed ${data.pages.length} pages`);
            resolve();
        });
    });
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Run the build
buildSite();