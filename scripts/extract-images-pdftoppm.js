const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function extractImages() {
    console.log('Extracting images using pdftoppm...');
    
    try {
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
                console.log(`Extracting page ${page} as ${name}.png...`);
                
                // Use pdftoppm to convert specific page to PNG
                const command = `pdftoppm -png -f ${page} -l ${page} -scale-to-x 800 -scale-to-y -1 "meremetaphor.pdf" "${path.join(imagesDir, name)}"`;
                
                execSync(command, { 
                    cwd: path.join(__dirname, '..'),
                    stdio: 'inherit' 
                });
                
                // pdftoppm adds page number suffix, rename to clean name
                const generatedFile = path.join(imagesDir, `${name}-${page.toString().padStart(2, '0')}.png`);
                const finalFile = path.join(imagesDir, `${name}.png`);
                
                if (fs.existsSync(generatedFile)) {
                    fs.renameSync(generatedFile, finalFile);
                    console.log(`✓ Saved ${name}.png`);
                }
                
            } catch (error) {
                console.error(`Failed to extract page ${page}:`, error.message);
            }
        });
        
        console.log('Image extraction complete!');
        
        // List what we extracted
        const files = fs.readdirSync(imagesDir);
        console.log('\nExtracted images:');
        files.forEach(file => {
            const filePath = path.join(imagesDir, file);
            const stats = fs.statSync(filePath);
            console.log(`  ${file} (${Math.round(stats.size / 1024)}KB)`);
        });
        
    } catch (error) {
        console.error('Error extracting images:', error);
    }
}

extractImages();