const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Load environment variables
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function transcribeAudio() {
  const audioFile = path.join(__dirname, '..', '..', 'cover_and_preface.mp3');
  const outputFile = path.join(__dirname, '..', '..', 'transcription_with_timestamps.json');
  
  console.log('Transcribing audio file:', audioFile);
  
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFile),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word']
    });
    
    console.log('Transcription completed successfully!');
    console.log('Total words:', transcription.words.length);
    console.log('Duration:', transcription.duration, 'seconds');
    
    // Write the transcription to file
    fs.writeFileSync(outputFile, JSON.stringify(transcription, null, 2));
    console.log('Transcription saved to:', outputFile);
    
    // Show first few words for verification
    console.log('First 10 words:');
    transcription.words.slice(0, 10).forEach((word, i) => {
      console.log(`  ${i}: "${word.word}" (${word.start}s - ${word.end}s)`);
    });
    
  } catch (error) {
    console.error('Error transcribing audio:', error);
  }
}

transcribeAudio();