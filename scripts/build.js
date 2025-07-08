const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PDFExtract } = require('pdf.js-extract');

async function buildSite() {
    console.log('Building site from PDF...');
    
    try {
        await extractEmbeddedImagesWithMasks();
        await extractText();
        console.log('Build complete!');
    } catch (error) {
        console.error('Error building site:', error);
        process.exit(1);
    }
}

async function extractEmbeddedImagesWithMasks() {
    console.log('Extracting embedded images with transparency masks...');
    
    const imagesDir = path.join(__dirname, '..', 'images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir);
    }
    
    const tempDir = path.join(__dirname, '..', 'temp-extracted');
    if (fs.existsSync(tempDir)) {
        execSync(`rm -rf "${tempDir}"`);
    }
    fs.mkdirSync(tempDir);
    
    try {
        execSync(`pdfimages -png "meremetaphor.pdf" "${path.join(tempDir, 'img')}"`, {
            cwd: path.join(__dirname, '..'),
            stdio: 'pipe'
        });
        
        const imageMap = [
            { image: 'img-000.png', mask: 'img-001.png', dest: 'cover.png', description: 'Cover tree illustration' },
            { image: 'img-002.png', mask: 'img-003.png', dest: 'preface-illustration.png', description: 'Preface illustration' },
            { image: 'img-004.png', mask: 'img-005.png', dest: 'about-author-illustration.png', description: 'About the Author illustration' },
            { image: 'img-006.png', mask: 'img-007.png', dest: 'metaphor-illustration.png', description: 'Introduction: Metaphor illustration' },
            { image: 'img-008.png', mask: 'img-009.png', dest: 'god-illustration.png', description: 'God: Love Within and Between Us illustration' },
            { image: 'img-010.png', mask: 'img-011.png', dest: 'freewill-illustration.png', description: 'Free Will illustration' },
            { image: 'img-012.png', mask: 'img-013.png', dest: 'good-illustration.png', description: 'Good: A Direction We Choose illustration' },
            { image: 'img-014.png', mask: 'img-015.png', dest: 'sin-illustration.png', description: 'Sin illustration' },
            { image: 'img-016.png', mask: 'img-017.png', dest: 'redemption-illustration.png', description: 'Redemption illustration' },
            { image: 'img-018.png', mask: 'img-019.png', dest: 'heaven-illustration.png', description: 'Heaven illustration' },
            { image: 'img-020.png', mask: 'img-021.png', dest: 'prayer-illustration.png', description: 'Prayer illustration' },
            { image: 'img-022.png', mask: 'img-023.png', dest: 'voices-illustration.png', description: 'Voices illustration' },
            { image: 'img-024.png', mask: 'img-025.png', dest: 'afterword-illustration.png', description: 'Afterword illustration' },
            { image: 'img-026.png', mask: 'img-027.png', dest: 'glossary-illustration.png', description: 'Glossary illustration' }
        ];
        
        imageMap.forEach(({ image, mask, dest, description }) => {
            const imagePath = path.join(tempDir, image);
            const maskPath = path.join(tempDir, mask);
            const destPath = path.join(imagesDir, dest);
            
            if (fs.existsSync(imagePath) && fs.existsSync(maskPath)) {
                try {
                    execSync(`magick "${imagePath}" "${maskPath}" -alpha off -compose copy_opacity -composite "${destPath}"`, {
                        stdio: 'pipe'
                    });
                    
                    const stats = fs.statSync(destPath);
                    console.log(`    ✓ ${dest} (${Math.round(stats.size / 1024)}KB) - ${description}`);
                } catch (error) {
                    console.log(`    ✗ Failed to combine ${image} + ${mask}: ${error.message}`);
                }
            } else {
                console.log(`    ✗ Missing files: ${image} ${fs.existsSync(imagePath) ? '✓' : '✗'}, ${mask} ${fs.existsSync(maskPath) ? '✓' : '✗'}`);
            }
        });
        
    } finally {
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
            
            const cacheBuster = Date.now();
            let htmlContent = '';
            
            htmlContent += `
<div class="cover-page">
    <h1>Mere Metaphor</h1>
    <div class="cover-illustration">
        <img src="images/cover.png?v=${cacheBuster}" alt="Tree illustration with profile and 'God is love'" class="cover-image">
    </div>
    <p class="subtitle">Understanding Religious<br>Language as a Materialist</p>
    <p class="author">by Derek Bredensteiner</p>
</div>
`;
            
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
                
                for (let i = tocStartIndex + 1; i < tocPage.content.length; i++) {
                    const item = tocPage.content[i];
                    const text = item.str.trim();
                    
                    if (!text || text.match(/^\d+$/)) continue;
                    
                    const cleaned = text.replace(/\.+\d*$/, '').trim();
                    if (cleaned && cleaned !== '1') {
                        htmlContent += `<p>${escapeHtml(cleaned)}</p>\n`;
                    }
                }
                htmlContent += '</div>\n\n';
            }
            
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
            
            chapters.forEach((chapter, index) => {
                const chapterPages = [];
                
                data.pages.forEach((page, pageIndex) => {
                    if (page.content.some(item => item.str === chapter.name)) {
                        chapterPages.push(pageIndex);
                    }
                });
                
                if (chapterPages.length === 0) return;
                
                if (index > 0) {
                    htmlContent += '<div class="chapter-separator">◆ ◆ ◆</div>\n';
                }
                
                htmlContent += `<h2 class="chapter-header">${escapeHtml(chapter.name)}</h2>\n`;
                
                const imagePath = path.join(__dirname, '..', 'images', chapter.image);
                if (fs.existsSync(imagePath)) {
                    htmlContent += `<div class="chapter-illustration">\n`;
                    htmlContent += `<img src="images/${chapter.image}?v=${cacheBuster}" alt="Illustration for ${chapter.name}" class="chapter-image">\n`;
                    htmlContent += `</div>\n\n`;
                }
                
                chapterPages.forEach(pageIndex => {
                    const page = data.pages[pageIndex];
                    let currentParagraph = [];
                    let lastY = null;
                    let foundChapterTitle = false;
                    
                    page.content.forEach((item, itemIndex) => {
                        const text = item.str.trim();
                        
                        if (!text || text.match(/^\d+$/)) return;
                        
                        if (text === chapter.name) {
                            foundChapterTitle = true;
                            return;
                        }
                        
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
                        
                        if (lastY !== null && item.y - lastY > 25) {
                            if (currentParagraph.length > 0) {
                                htmlContent += `<p>${escapeHtml(currentParagraph.join(' '))}</p>\n`;
                                currentParagraph = [];
                            }
                        }
                        
                        currentParagraph.push(text);
                        lastY = item.y;
                    });
                    
                    if (currentParagraph.length > 0) {
                        htmlContent += `<p>${escapeHtml(currentParagraph.join(' '))}</p>\n`;
                    }
                });
                
                htmlContent += '\n';
            });
            
            const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Mere Metaphor</title>
    <style>
        body {
            font-family: Georgia, serif;
            line-height: 1.6;
            color: #333;
            max-width: 700px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2, h3 {
            font-weight: normal;
            margin-top: 2em;
        }
        h1 {
            font-size: 2.5em;
            text-align: center;
            margin-bottom: 2em;
        }
        .chapter {
            margin-bottom: 4em;
        }
        .cover-page {
            text-align: center;
            margin: 2em 0;
            padding: 1em;
            page-break-after: always;
        }
        .cover-page h1 {
            font-size: 2.5em;
            margin-bottom: 1em;
            line-height: 1.2;
        }
        .cover-illustration {
            margin: 2em 0;
            max-width: 100%;
            overflow: hidden;
        }
        .cover-image {
            width: 100%;
            max-width: 300px;
            height: auto;
            margin: 1em 0;
            display: block;
            margin-left: auto;
            margin-right: auto;
        }
        .chapter-separator {
            text-align: center;
            font-size: 1.5em;
            margin: 4em 0 3em;
            color: #666;
            letter-spacing: 0.5em;
        }
        .chapter-illustration {
            text-align: center;
            margin: 2em 0;
            max-width: 100%;
            overflow: hidden;
        }
        .chapter-image {
            width: 100%;
            max-width: 320px;
            height: auto;
            margin: 1em 0;
            display: block;
            margin-left: auto;
            margin-right: auto;
        }
        .subtitle {
            font-size: 1.1em;
            margin: 1em 0;
            line-height: 1.4;
        }
        .author {
            margin-top: 2em;
        }
        .table-of-contents {
            margin: 2em 0;
            page-break-after: always;
        }
        .table-of-contents h2 {
            text-align: center;
            margin-bottom: 2em;
        }
        .chapter-header {
            text-align: center;
            font-size: 1.3em;
            margin: 2em 0 1em;
            page-break-before: always;
            font-weight: bold;
        }
        
        @media (min-width: 768px) {
            .cover-page {
                margin: 3em 0;
                padding: 2em;
            }
            .cover-page h1 {
                font-size: 3em;
            }
            .cover-illustration {
                margin: 3em 0;
            }
            .cover-image {
                max-width: 400px;
            }
            .chapter-image {
                max-width: 450px;
            }
            .subtitle {
                font-size: 1.2em;
            }
            .chapter-header {
                font-size: 1.5em;
                margin: 3em 0 2em;
            }
            .table-of-contents {
                margin: 3em 0;
            }
        }
        
        @media (min-width: 1024px) {
            .cover-page {
                margin: 4em 0;
            }
            .cover-image {
                max-width: 400px;
            }
            .chapter-image {
                max-width: 500px;
            }
        }
        
        @media print {
            .cover-page, .table-of-contents, .chapter-header {
                page-break-inside: avoid;
            }
            .chapter-separator {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div id="book-content">
${htmlContent}
    </div>
</body>
</html>`;
            
            fs.writeFileSync(path.join(__dirname, '..', 'index.html'), html);
            
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

buildSite();