const fs = require('fs');
const path = require('path');
const { PDFExtract } = require('pdf.js-extract');

async function buildSite() {
    console.log('Building site from PDF...');
    
    const pdfExtract = new PDFExtract();
    const pdfPath = path.join(__dirname, '..', 'meremetaphor.pdf');
    
    pdfExtract.extract(pdfPath, {}, (err, data) => {
        if (err) {
            console.error('Error extracting PDF:', err);
            process.exit(1);
        }
        
        // Convert to HTML
        let htmlContent = '';
        
        // Process cover page (page 1)
        const coverPage = data.pages[0];
        if (coverPage && coverPage.content.length > 0) {
            htmlContent += `
<div class="cover-page">
    <h1>Mere Metaphor</h1>
    <div class="cover-illustration">
        <p class="god-is-love">God is love</p>
    </div>
    <p class="subtitle">Understanding Religious<br>Language as a Materialist</p>
    <p class="author">by Derek Bredensteiner</p>
</div>
`;
        }
        
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
            'PREFACE', 'ABOUT THE AUTHOR', 'INTRODUCTION: METAPHOR',
            'GOD: LOVE WITHIN AND BETWEEN US', 'FREE WILL: RECURSING A LIFETIME',
            'GOOD: A DIRECTION WE CHOOSE', 'SIN: ALIGNMENT WITH THAT CHOICE',
            'REDEMPTION: MAKING NEW CHOICES', 'HEAVEN: A STATE OF MIND AND BEING',
            'PRAYER: EFFECTS OF SELF-REFLECTION', 'VOICES: WHAT INSPIRES SHAMANS',
            'AFTERWORD', 'GLOSSARY'
        ];
        
        chapters.forEach(chapterName => {
            // Find all pages containing this chapter
            const chapterPages = [];
            
            data.pages.forEach((page, pageIndex) => {
                if (page.content.some(item => item.str === chapterName)) {
                    chapterPages.push(pageIndex);
                }
            });
            
            if (chapterPages.length === 0) return;
            
            htmlContent += `<h2 class="chapter-header">${escapeHtml(chapterName)}</h2>\n`;
            
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
                    if (text === chapterName) {
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
        
        // Update styles if needed
        if (!template.includes('.cover-page')) {
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
            font-style: italic;
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
        
        console.log('Build complete!');
        console.log(`Processed ${data.pages.length} pages`);
        
        // Also save the extract for debugging
        fs.writeFileSync('pdf-extract-output.json', JSON.stringify(data, null, 2));
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