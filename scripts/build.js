const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function buildSite() {
    console.log('Building site from PDF...');
    
    try {
        // Read the PDF
        const pdfPath = path.join(__dirname, '..', 'meremetaphor.pdf');
        const dataBuffer = fs.readFileSync(pdfPath);
        
        // Parse PDF
        const data = await pdf(dataBuffer);
        
        // Extract text
        const text = data.text;
        
        // Convert to HTML
        let htmlContent = '';
        
        // First, handle the cover page
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
        
        // Split text into sections
        const lines = text.split('\n').map(l => l.trim());
        
        // Find and process Table of Contents
        const tocStart = lines.findIndex(l => l.includes('TABLE OF CONTENTS'));
        if (tocStart !== -1) {
            htmlContent += '<div class="table-of-contents">\n';
            htmlContent += '<h2>TABLE OF CONTENTS</h2>\n';
            
            // Process TOC entries until we hit a page number or empty section
            for (let i = tocStart + 1; i < lines.length; i++) {
                const line = lines[i];
                if (!line || line.match(/^\d+$/)) break;
                
                // Clean up TOC entries - remove dots and page numbers
                const cleaned = line.replace(/\.+\d+$/, '').trim();
                if (cleaned) {
                    htmlContent += `<p>${escapeHtml(cleaned)}</p>\n`;
                }
            }
            htmlContent += '</div>\n\n';
        }
        
        // Process the main content
        const sections = ['PREFACE', 'ABOUT THE AUTHOR', 'INTRODUCTION: METAPHOR', 
                         'GOD: LOVE WITHIN AND BETWEEN US', 'FREE WILL: RECURSING A LIFETIME',
                         'GOOD: A DIRECTION WE CHOOSE', 'SIN: ALIGNMENT WITH THAT CHOICE',
                         'REDEMPTION: MAKING NEW CHOICES', 'HEAVEN: A STATE OF MIND AND BEING',
                         'PRAYER: EFFECTS OF SELF-REFLECTION', 'VOICES: WHAT INSPIRES SHAMANS',
                         'AFTERWORD', 'GLOSSARY'];
        
        sections.forEach(section => {
            const sectionIndex = lines.findIndex(l => l === section);
            if (sectionIndex !== -1) {
                htmlContent += `<h2 class="chapter-header">${escapeHtml(section)}</h2>\n`;
                
                // Find the next section or end of content
                let endIndex = lines.length;
                for (let i = sectionIndex + 1; i < lines.length; i++) {
                    if (sections.includes(lines[i])) {
                        endIndex = i;
                        break;
                    }
                }
                
                // Process content between sections
                let currentParagraph = [];
                for (let i = sectionIndex + 1; i < endIndex; i++) {
                    const line = lines[i];
                    
                    // Skip page numbers
                    if (line.match(/^\d+$/)) continue;
                    
                    // If we have a subtitle right after the section header
                    if (i === sectionIndex + 1 && line && !line.match(/^[A-Z\s]+$/)) {
                        htmlContent += `<h3>${escapeHtml(line)}</h3>\n`;
                        continue;
                    }
                    
                    // Empty line means end of paragraph
                    if (!line) {
                        if (currentParagraph.length > 0) {
                            htmlContent += `<p>${escapeHtml(currentParagraph.join(' '))}</p>\n`;
                            currentParagraph = [];
                        }
                    } else {
                        currentParagraph.push(line);
                    }
                }
                
                // Don't forget the last paragraph
                if (currentParagraph.length > 0) {
                    htmlContent += `<p>${escapeHtml(currentParagraph.join(' '))}</p>\n`;
                }
                
                htmlContent += '\n';
            }
        });
        
        // Read the template
        const templatePath = path.join(__dirname, '..', 'index.html');
        let template = fs.readFileSync(templatePath, 'utf8');
        
        // Update styles for better presentation
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
        
        // Remove placeholder if it exists
        template = template.replace(
            /<div class="placeholder">[\s\S]*?<\/div>\s*/,
            ''
        );
        
        // Replace content
        template = template.replace(
            /<div id="book-content">[\s\S]*?<\/div>/,
            `<div id="book-content">\n${htmlContent}\n    </div>`
        );
        
        // Remove the standalone h1 since we have it in the cover page
        template = template.replace(
            /<h1>Mere Metaphor<\/h1>\s*/,
            ''
        );
        
        // Write the updated HTML
        fs.writeFileSync(templatePath, template);
        
        console.log('Build complete!');
        console.log(`Extracted ${data.numpages} pages`);
        
    } catch (error) {
        console.error('Error building site:', error);
        process.exit(1);
    }
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