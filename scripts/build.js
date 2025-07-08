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
        
        // Basic text processing
        // Split by double newlines for paragraphs
        const paragraphs = text.split(/\n\n+/)
            .map(p => p.trim())
            .filter(p => p.length > 0);
        
        // Convert to HTML
        let htmlContent = '';
        
        paragraphs.forEach(para => {
            // Simple heuristic: if line is short and doesn't end with punctuation, 
            // it might be a heading
            if (para.length < 50 && !para.match(/[.!?]$/)) {
                htmlContent += `<h2>${escapeHtml(para)}</h2>\n`;
            } else {
                htmlContent += `<p>${escapeHtml(para)}</p>\n`;
            }
        });
        
        // Read the template
        const templatePath = path.join(__dirname, '..', 'index.html');
        let template = fs.readFileSync(templatePath, 'utf8');
        
        // Replace placeholder with actual content
        template = template.replace(
            '<div class="placeholder">\n        <p>Book content will be automatically generated here from the PDF.</p>\n        <p>This is a temporary placeholder page.</p>\n    </div>',
            ''
        );
        
        template = template.replace(
            '<div id="book-content">\n        <!-- Chapters will go here -->\n    </div>',
            `<div id="book-content">\n${htmlContent}\n    </div>`
        );
        
        // Write the updated HTML
        fs.writeFileSync(templatePath, template);
        
        console.log('Build complete!');
        console.log(`Extracted ${data.numpages} pages`);
        console.log(`Generated ${paragraphs.length} paragraphs`);
        
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