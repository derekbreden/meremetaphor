const { convert } = require('pdf-img-convert');
const fs = require('fs');
const path = require('path');

async function extractImages() {
    console.log('Extracting images from PDF...');
    
    try {
        // Try with simpler options first
        const outputImages = await convert('./meremetaphor.pdf', {
            width: 600,       
            height: 800,      
            page_numbers: [1], // Just try the cover first
            base64: false     
        });
        
        console.log(`Extracted ${outputImages.length} images`);
        
        // Create images directory
        const imagesDir = path.join(__dirname, '..', 'images');
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir);
        }
        
        // Save the image
        if (outputImages.length > 0) {
            const filename = 'cover.png';
            const filePath = path.join(imagesDir, filename);
            
            fs.writeFileSync(filePath, outputImages[0]);
            console.log(`Saved: ${filename}`);
        }
        
        console.log('Image extraction complete!');
        
    } catch (error) {
        console.error('Error extracting images:', error);
        console.log('Let me try a different approach...');
        
        // Fallback: try to convert all pages with minimal options
        try {
            const allImages = await convert('./meremetaphor.pdf');
            console.log(`Found ${allImages.length} pages total`);
            
            // Just save the first page as cover
            if (allImages.length > 0) {
                const imagesDir = path.join(__dirname, '..', 'images');
                if (!fs.existsSync(imagesDir)) {
                    fs.mkdirSync(imagesDir);
                }
                
                fs.writeFileSync(path.join(imagesDir, 'cover.png'), allImages[0]);
                console.log('Saved cover.png using fallback method');
            }
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
        }
    }
}

extractImages();