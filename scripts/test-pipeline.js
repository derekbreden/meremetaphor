/**
 * Test script to demonstrate the complete automated mapping pipeline
 * 
 * Uses the existing preface data to show how our new pipeline can:
 * - Process structured content data
 * - Automatically align transcription words
 * - Validate the results
 * - Generate quality reports
 * - Compare with our manual mapping baseline
 */

const fs = require('fs');
const path = require('path');

// Import our new pipeline components
const { AudioMapper } = require('../lib/audio-mapper');
const { Book, Chapter, Section, Sentence, Word } = require('../lib/data-structures');
const { AudioTextValidator, QualityMetrics } = require('../lib/validation');

async function testAutomatedPipeline() {
    console.log('=== Testing Automated Audio Mapping Pipeline ===\n');
    
    try {
        // Load existing data
        const transcriptionPath = path.join(__dirname, '..', 'transcription_with_timestamps.json');
        const structuredContentPath = path.join(__dirname, '..', 'content', 'preface-structured.json');
        
        if (!fs.existsSync(transcriptionPath)) {
            console.error('Transcription file not found. Please run transcribe-audio.js first.');
            return;
        }
        
        if (!fs.existsSync(structuredContentPath)) {
            console.error('Structured content not found. Please run extract-preface-data.js first.');
            return;
        }
        
        // Create output directory
        const outputDir = path.join(__dirname, '..', 'pipeline-test-output');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }
        
        // Initialize pipeline
        console.log('1. Initializing pipeline components...');
        const mapper = new AudioMapper();
        const validator = new AudioTextValidator();
        
        // Load data
        console.log('2. Loading content and transcription data...');
        const contentData = JSON.parse(fs.readFileSync(structuredContentPath, 'utf8'));
        const transcriptionData = JSON.parse(fs.readFileSync(transcriptionPath, 'utf8'));
        
        console.log(`   - Content: ${contentData.book.title}`);
        console.log(`   - Transcription: ${transcriptionData.words.length} words, ${transcriptionData.duration.toFixed(1)}s`);
        
        // Test different strategies
        const strategies = ['conservative', 'balanced', 'aggressive'];
        const results = {};
        
        for (const strategy of strategies) {
            console.log(`\n3. Testing ${strategy} strategy...`);
            
            try {
                // Run automated mapping
                const result = await mapper.createAutomatedMapping(
                    contentData,
                    transcriptionPath,
                    { strategy, outputPath: path.join(outputDir, strategy) }
                );
                
                results[strategy] = result;
                
                // Print summary
                const report = result.report.summary;
                console.log(`   ✓ Success: ${result.success}`);
                console.log(`   ✓ Quality: ${(report.averageQuality * 100).toFixed(1)}%`);
                console.log(`   ✓ Processing time: ${report.totalProcessingTime}ms`);
                
                if (result.mappingResult.results.length > 0) {
                    const chapterResult = result.mappingResult.results[0];
                    if (chapterResult.quality) {
                        console.log(`   ✓ Grade: ${chapterResult.quality.grade}`);
                        console.log(`   ✓ Matches: ${chapterResult.quality.totalMatches}`);
                        console.log(`   ✓ Coverage: ${(chapterResult.quality.coverage * 100).toFixed(1)}%`);
                    }
                }
                
            } catch (error) {
                console.error(`   ✗ Failed: ${error.message}`);
                results[strategy] = { error: error.message };
            }
        }
        
        // Generate comparison report
        console.log('\n4. Generating comparison report...');
        const comparisonReport = generateComparisonReport(results);
        
        const reportPath = path.join(outputDir, 'comparison-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(comparisonReport, null, 2));
        
        console.log('   ✓ Report saved to:', reportPath);
        
        // Compare with manual baseline
        console.log('\n5. Comparing with manual mapping baseline...');
        await compareWithManualBaseline(results, outputDir);
        
        // Print final summary
        console.log('\n=== Pipeline Test Complete ===');
        printFinalSummary(results);
        
    } catch (error) {
        console.error('Pipeline test failed:', error);
    }
}

function generateComparisonReport(results) {
    const report = {
        timestamp: new Date().toISOString(),
        strategies: {},
        bestStrategy: null,
        recommendations: []
    };
    
    let bestQuality = 0;
    let bestStrategy = null;
    
    for (const [strategy, result] of Object.entries(results)) {
        if (result.error) {
            report.strategies[strategy] = {
                status: 'failed',
                error: result.error
            };
            continue;
        }
        
        const summary = result.report.summary;
        const chapterResult = result.mappingResult.results[0];
        
        const strategyReport = {
            status: 'success',
            quality: summary.averageQuality,
            processingTime: summary.totalProcessingTime,
            grade: chapterResult.quality ? chapterResult.quality.grade : 'N/A',
            coverage: chapterResult.quality ? chapterResult.quality.coverage : 0,
            confidence: chapterResult.quality ? chapterResult.quality.confidence : 0,
            totalMatches: chapterResult.quality ? chapterResult.quality.totalMatches : 0,
            needsReview: chapterResult.needsReview || false,
            recommendations: result.report.recommendations
        };
        
        report.strategies[strategy] = strategyReport;
        
        if (summary.averageQuality > bestQuality) {
            bestQuality = summary.averageQuality;
            bestStrategy = strategy;
        }
    }
    
    report.bestStrategy = bestStrategy;
    
    // Generate overall recommendations
    if (bestQuality > 0.9) {
        report.recommendations.push('Excellent automation quality - ready for production use');
    } else if (bestQuality > 0.8) {
        report.recommendations.push('Good automation quality - minimal manual review needed');
    } else if (bestQuality > 0.7) {
        report.recommendations.push('Acceptable automation quality - some manual review recommended');
    } else {
        report.recommendations.push('Low automation quality - extensive manual review required');
    }
    
    return report;
}

async function compareWithManualBaseline(results, outputDir) {
    try {
        // Load our manual mapping for comparison
        const manualHTMLPath = path.join(__dirname, '..', 'index.html');
        if (!fs.existsSync(manualHTMLPath)) {
            console.log('   ! Manual baseline not available for comparison');
            return;
        }
        
        // Extract data-word attributes from manual HTML
        const manualHTML = fs.readFileSync(manualHTMLPath, 'utf8');
        const manualMappings = extractManualMappings(manualHTML);
        
        console.log(`   - Manual baseline: ${manualMappings.length} mapped words`);
        
        // Compare each strategy with manual baseline
        const comparison = {
            manualBaseline: {
                totalMappedWords: manualMappings.length,
                coverage: manualMappings.length > 0 ? 1.0 : 0
            },
            automatedResults: {}
        };
        
        for (const [strategy, result] of Object.entries(results)) {
            if (result.error) continue;
            
            const chapterResult = result.mappingResult.results[0];
            if (!chapterResult.quality) continue;
            
            comparison.automatedResults[strategy] = {
                totalMatches: chapterResult.quality.totalMatches,
                coverage: chapterResult.quality.coverage,
                comparisonWithManual: {
                    wordCountRatio: chapterResult.quality.totalMatches / manualMappings.length,
                    coverageComparison: chapterResult.quality.coverage
                }
            };
            
            console.log(`   - ${strategy}: ${chapterResult.quality.totalMatches} matches (${(chapterResult.quality.totalMatches / manualMappings.length * 100).toFixed(1)}% of manual)`);
        }
        
        const comparisonPath = path.join(outputDir, 'manual-comparison.json');
        fs.writeFileSync(comparisonPath, JSON.stringify(comparison, null, 2));
        
    } catch (error) {
        console.error('   ! Comparison with manual baseline failed:', error.message);
    }
}

function extractManualMappings(html) {
    const mappings = [];
    const dataWordPattern = /data-word="(\d+)">([^<]+)</g;
    let match;
    
    while ((match = dataWordPattern.exec(html)) !== null) {
        mappings.push({
            transcriptionIndex: parseInt(match[1]),
            word: match[2]
        });
    }
    
    // Sort by transcription index
    return mappings.sort((a, b) => a.transcriptionIndex - b.transcriptionIndex);
}

function printFinalSummary(results) {
    const successful = Object.entries(results).filter(([_, result]) => !result.error);
    const failed = Object.entries(results).filter(([_, result]) => result.error);
    
    console.log(`✓ Successful strategies: ${successful.length}`);
    console.log(`✗ Failed strategies: ${failed.length}`);
    
    if (successful.length > 0) {
        const bestResult = successful.reduce((best, [strategy, result]) => {
            const quality = result.report.summary.averageQuality;
            return quality > best.quality ? { strategy, quality, result } : best;
        }, { quality: 0 });
        
        console.log(`🏆 Best strategy: ${bestResult.strategy} (${(bestResult.quality * 100).toFixed(1)}% quality)`);
        
        const chapterResult = bestResult.result.mappingResult.results[0];
        if (chapterResult.quality) {
            console.log(`   Grade: ${chapterResult.quality.grade}`);
            console.log(`   Matches: ${chapterResult.quality.totalMatches}`);
            console.log(`   Coverage: ${(chapterResult.quality.coverage * 100).toFixed(1)}%`);
            console.log(`   Confidence: ${(chapterResult.quality.confidence * 100).toFixed(1)}%`);
        }
    }
    
    console.log('\n📊 Pipeline test results saved to: pipeline-test-output/');
    console.log('🔍 Review the generated files to understand the automated mapping quality');
}

// Run the test if this script is executed directly
if (require.main === module) {
    testAutomatedPipeline().catch(console.error);
}

module.exports = { testAutomatedPipeline };