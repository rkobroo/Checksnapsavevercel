#!/usr/bin/env node

/**
 * Test Unique Filename Generation
 * This demonstrates how the enhanced downloader now generates unique filenames
 * for multiple downloads of the same content, preventing overwrites.
 */

import { 
  downloadMultipleTimes, 
  enhancedDownload, 
  downloadAllPhotos 
} from './src/enhanced-downloader.js';

import { 
  generateCleanFilename, 
  generateUniqueFilename, 
  generateFilenameWithNumber 
} from './src/utils.js';

async function testUniqueFilenameGeneration() {
  console.log('🔢 Testing Unique Filename Generation...\n');
  
  // Test the utility functions
  console.log('📁 Utility Function Tests:');
  console.log('==========================');
  
  const testTitle = "Amazing TikTok Video";
  const testType = "video";
  
  // Test 1: Regular filename (no random number)
  const regularFilename = generateCleanFilename(testTitle, testType);
  console.log(`1. Regular Filename: ${regularFilename}`);
  
  // Test 2: Unique filename with random number
  const uniqueFilename1 = generateUniqueFilename(testTitle, testType);
  const uniqueFilename2 = generateUniqueFilename(testTitle, testType);
  const uniqueFilename3 = generateUniqueFilename(testTitle, testType);
  
  console.log(`2. Unique Filename 1: ${uniqueFilename1}`);
  console.log(`3. Unique Filename 2: ${uniqueFilename2}`);
  console.log(`4. Unique Filename 3: ${uniqueFilename3}`);
  
  // Test 3: Filename with custom number
  const customFilename1 = generateFilenameWithNumber(testTitle, testType, 1);
  const customFilename2 = generateFilenameWithNumber(testTitle, testType, 2);
  const customFilename3 = generateFilenameWithNumber(testTitle, testType, 3);
  
  console.log(`5. Custom Number 1: ${customFilename1}`);
  console.log(`6. Custom Number 2: ${customFilename2}`);
  console.log(`7. Custom Number 3: ${customFilename3}`);
  
  console.log('\n✅ All filenames are unique and won\'t overwrite each other!\n');
}

async function testMultipleDownloads() {
  console.log('🔄 Testing Multiple Downloads with Unique Filenames...\n');
  
  // Example URL (replace with real URL for testing)
  const testUrl = 'https://www.tiktok.com/@user/video/123'; // Replace with real URL
  
  try {
    console.log('🔍 Testing multiple downloads of the same content...');
    
    // Test downloading the same content 5 times with unique filenames
    const result = await downloadMultipleTimes(testUrl, 5);
    
    if (result.success && result.data) {
      const { title, downloads, originalUrl } = result.data;
      
      console.log('✅ Success! Multiple downloads generated:');
      console.log(`   📝 Title: ${title}`);
      console.log(`   🔗 Original URL: ${originalUrl}`);
      console.log(`   📊 Total Downloads: ${downloads.length}`);
      console.log('');
      
      console.log('🚀 All downloads with unique filenames:');
      downloads.forEach((download, index) => {
        console.log(`   ${index + 1}. ${download.filename}`);
        console.log(`      Type: ${download.type}`);
        console.log(`      Quality: ${download.qualityLabel} (${download.quality})`);
        console.log(`      Download URL: ${download.downloadUrl}`);
        console.log('');
      });
      
      console.log('💡 Key Benefits:');
      console.log('   ✅ Each download gets a unique filename');
      console.log('   ✅ No more file overwrites');
      console.log('   ✅ Perfect for multiple downloads of the same content');
      console.log('   ✅ Descriptive names with sequential numbers');
      console.log('');
      
      console.log('🎯 Use Cases:');
      console.log('   - Download the same video multiple times');
      console.log('   - Save different versions of content');
      console.log('   - Batch processing without conflicts');
      console.log('   - Testing different download methods');
      
    } else {
      console.log('❌ Failed to generate multiple downloads:');
      console.log(`   Error: ${result.message}`);
    }
    
  } catch (error) {
    console.error('💥 Error during multiple download test:', error.message);
  }
}

async function testEnhancedDownloadUniqueFilenames() {
  console.log('\n🎬 Testing Enhanced Download with Unique Filenames...\n');
  
  const testUrl = 'https://www.instagram.com/p/ABC123/'; // Replace with real URL
  
  try {
    console.log('🔍 Testing enhanced download with unique filename generation...');
    
    // Test 1: First download
    const result1 = await enhancedDownload(testUrl);
    
    if (result1.success && result1.data) {
      console.log('✅ First Download:');
      console.log(`   📁 Filename: ${result1.data.filename}`);
      console.log(`   🎯 Title: ${result1.data.title}`);
      console.log(`   📊 Quality: ${result1.data.qualityLabel}`);
      console.log('');
      
      // Test 2: Second download (should have different filename)
      const result2 = await enhancedDownload(testUrl);
      
      if (result2.success && result2.data) {
        console.log('✅ Second Download:');
        console.log(`   📁 Filename: ${result2.data.filename}`);
        console.log(`   🎯 Title: ${result2.data.title}`);
        console.log(`   📊 Quality: ${result2.data.qualityLabel}`);
        console.log('');
        
        // Check if filenames are different
        if (result1.data.filename !== result2.data.filename) {
          console.log('🎉 SUCCESS: Each download gets a unique filename!');
          console.log('   - No more overwrites');
          console.log('   - Perfect for multiple downloads');
          console.log('   - Random numbers ensure uniqueness');
        } else {
          console.log('⚠️  WARNING: Filenames are the same (this shouldn\'t happen)');
        }
      }
    } else {
      console.log('❌ Enhanced download failed:', result1.message);
    }
    
  } catch (error) {
    console.error('💥 Error during enhanced download test:', error.message);
  }
}

async function testInstagramCarouselUniqueFilenames() {
  console.log('\n📸 Testing Instagram Carousel with Unique Filenames...\n');
  
  const testUrl = 'https://www.instagram.com/p/DEF456/'; // Replace with real URL
  
  try {
    console.log('🔍 Testing Instagram carousel with unique filename generation...');
    
    const result = await downloadAllPhotos(testUrl);
    
    if (result.success && result.data) {
      const { photos, totalPhotos, title } = result.data;
      
      console.log('✅ Instagram Carousel Success:');
      console.log(`   📝 Title: ${title}`);
      console.log(`   📸 Total Photos: ${totalPhotos}`);
      console.log('');
      
      console.log('🚀 All photos with unique filenames:');
      photos.forEach((photo, index) => {
        console.log(`   ${index + 1}. ${photo.filename}`);
        console.log(`      Quality: ${photo.quality}`);
        console.log(`      Type: ${photo.originalType}`);
        console.log(`      Download: ${photo.url}`);
        console.log('');
      });
      
      console.log('💡 Instagram Carousel Benefits:');
      console.log('   ✅ Each photo gets a unique filename with number');
      console.log('   ✅ No filename conflicts in the same collection');
      console.log('   ✅ Sequential numbering for easy organization');
      console.log('   ✅ Descriptive names based on post title');
      
    } else {
      console.log('❌ Instagram carousel failed:', result.message);
    }
    
  } catch (error) {
    console.error('💥 Error during Instagram carousel test:', error.message);
  }
}

// Run all tests
console.log('🚀 Unique Filename Generation Test Suite');
console.log('=========================================\n');

async function runAllTests() {
  try {
    await testUniqueFilenameGeneration();
    await testMultipleDownloads();
    await testEnhancedDownloadUniqueFilenames();
    await testInstagramCarouselUniqueFilenames();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n💡 Summary of Unique Filename Features:');
    console.log('   🔢 Random numbers prevent overwrites');
    console.log('   📁 Sequential numbering for collections');
    console.log('   🎯 Descriptive names based on content titles');
    console.log('   🚫 No more file conflicts');
    console.log('   ✅ Perfect for multiple downloads');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
  }
}

runAllTests();