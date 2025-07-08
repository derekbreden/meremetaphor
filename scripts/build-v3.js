const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PDFExtract } = require('pdf.js-extract');

async function buildSite() {
    console.log('Building site from PDF (text + images)...');
    
    try {
        // Step 1: Extract images
        await extractImages();
        
        // Step 2: Extract and process text
        await extractText();
        
        console.log('Build complete!');
        
    } catch (error) {
        console.error('Error building site:', error);
        process.exit(1);
    }
}

async function extractImages() {
    console.log('Extracting images...');
    
    // Create images directory
    const imagesDir = path.join(__dirname, '..', 'images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir);
    }
    
    // Extract specific pages as PNG images
    const pagesToExtract = [
        { page: 1, name: 'cover' },
        { page: 4, name: 'preface-illustration' }
    ];
    
    pagesToExtract.forEach(({ page, name }) => {
        try {
            console.log(`  Extracting page ${page} as ${name}.png...`);
            
            // Use pdftoppm to convert specific page to PNG
            const command = `pdftoppm -png -f ${page} -l ${page} -scale-to-x 800 -scale-to-y -1 "meremetaphor.pdf" "${path.join(imagesDir, name)}"`;
            
            execSync(command, { 
                cwd: path.join(__dirname, '..'),
                stdio: 'pipe' 
            });
            
            // pdftoppm adds page number suffix, rename to clean name
            const generatedFile = path.join(imagesDir, `${name}-${page.toString().padStart(2, '0')}.png`);
            const finalFile = path.join(imagesDir, `${name}.png`);
            
            if (fs.existsSync(generatedFile)) {
                fs.renameSync(generatedFile, finalFile);
                console.log(`    ✓ Saved ${name}.png`);
            }
            
        } catch (error) {
            console.error(`    Failed to extract page ${page}:`, error.message);
        }
    });
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
            
            // Process cover page with image
            htmlContent += `
<div class="cover-page">
    <h1>Mere Metaphor</h1>
    <div class="cover-illustration">
        <img src="images/cover.png" alt="Cover illustration showing a tree profile with 'God is love'" class="cover-image">
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
            
            // Process chapters
            const chapters = [
                { name: 'PREFACE', image: 'preface-illustration.png' },
                { name: 'ABOUT THE AUTHOR', image: null },
                { name: 'INTRODUCTION: METAPHOR', image: null },
                { name: 'GOD: LOVE WITHIN AND BETWEEN US', image: null },
                { name: 'FREE WILL: RECURSING A LIFETIME', image: null },
                { name: 'GOOD: A DIRECTION WE CHOOSE', image: null },
                { name: 'SIN: ALIGNMENT WITH THAT CHOICE', image: null },
                { name: 'REDEMPTION: MAKING NEW CHOICES', image: null },
                { name: 'HEAVEN: A STATE OF MIND AND BEING', image: null },
                { name: 'PRAYER: EFFECTS OF SELF-REFLECTION', image: null },
                { name: 'VOICES: WHAT INSPIRES SHAMANS', image: null },
                { name: 'AFTERWORD', image: null },
                { name: 'GLOSSARY', image: null }
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
                
                // Add chapter illustration if it exists
                if (chapter.image) {
                    htmlContent += `<div class="chapter-illustration">\n`;
                    htmlContent += `<img src="images/${chapter.image}" alt="Illustration for ${chapter.name}" class="chapter-image">\n`;
                    htmlContent += `</div>\n\n`;
                }
                
                // Process all pages for this chapter
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
            
            // Read the template
            const templatePath = path.join(__dirname, '..', 'index.html');
            let template = fs.readFileSync(templatePath, 'utf8');
            
            // Update styles with image support
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
            
            // Remove placeholder if it exists
            template = template.replace(
                /<div class="placeholder">[\s\S]*?<\/div>\s*/,
                ''
            );
            
            // Remove standalone h1 if exists
            template = template.replace(
                /<h1>Mere Metaphor<\/h1>\s*/,
                ''
            );
            
            // Replace content
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