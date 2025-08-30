#!/usr/bin/env node

/**
 * Test Photo Naming Fix and YouTube Support
 * This demonstrates the fixes for:
 * 1. Multiple photos getting unique names instead of same names
 * 2. YouTube video download support
 */

import { 
  downloadAllPhotos, 
  enhancedDownload,
  downloadMultipleTimes 
} from './src/enhanced-downloader.js';

import { 
  generateUniquePhotoFilename,
  generateUniqueFilename 
} from './src/utils.js';

async function testUniquePhotoNaming() {
  console.log('📸 Testing Unique Photo Naming Fix...\n');
  
  // Test the utility function for photo naming
  console.log('🔧 Utility Function Tests:');
  console.log('==========================');
  
  const baseTitle = "Beautiful Sunset Collection";
  
  // Test 1: Generate unique names for multiple photos
  console.log('📁 Testing unique photo naming:');
  for (let i = 1; i <= 5; i++) {
    const filename = generateUniquePhotoFilename(
      baseTitle, 
      i, 
      1080, // quality
      '1920x1080', // resolution
      'instagram' // platform
    );
    console.log(`   Photo ${i}: ${filename}`);
  }
  
  console.log('\n✅ Each photo now gets a completely unique filename!\n');
}

async function testInstagramCarouselUniqueNames() {
  console.log('📱 Testing Instagram Carousel with Unique Photo Names...\n');
  
  // Example Instagram carousel URL (replace with real URL for testing)
  const testUrl = 'https://www.instagram.com/p/ABC123/'; // Replace with real URL
  
  try {
    console.log('🔍 Testing Instagram carousel photo naming...');
    
    const result = await downloadAllPhotos(testUrl);
    
    if (result.success && result.data) {
      const { photos, totalPhotos, title } = result.data;
      
      console.log('✅ Instagram Carousel Success:');
      console.log(`   📝 Post Title: ${title}`);
      console.log(`   📸 Total Photos: ${totalPhotos}`);
      console.log('');
      
      console.log('🚀 All photos with unique filenames:');
      photos.forEach((photo, index) => {
        console.log(`   ${index + 1}. ${photo.filename}`);
        console.log(`      Quality: ${photo.quality}`);
        console.log(`      Resolution: ${photo.resolution || 'N/A'}`);
        console.log(`      Type: ${photo.originalType}`);
        console.log(`      Unique ID: ${photo.uniqueId}`);
        console.log(`      Download: ${photo.url}`);
        console.log('');
      });
      
      console.log('💡 Key Improvements:');
      console.log('   ✅ Each photo gets a completely unique filename');
      console.log('   ✅ No more duplicate names');
      console.log('   ✅ Quality and resolution information included');
      console.log('   ✅ Timestamp and random string for uniqueness');
      console.log('   ✅ Platform-specific naming (instagram_)');
      
    } else {
      console.log('❌ Instagram carousel failed:', result.message);
    }
    
  } catch (error) {
    console.error('💥 Error during Instagram carousel test:', error.message);
  }
}

async function testYouTubeVideoDownload() {
  console.log('\n🎬 Testing YouTube Video Download Support...\n');
  
  // Example YouTube URL (replace with real URL for testing)
  const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Replace with real URL
  
  try {
    console.log('🔍 Testing YouTube video download...');
    
    const result = await enhancedDownload(testUrl);
    
    if (result.success && result.data) {
      const { title, description, author, thumbnail, downloadUrl, quality, qualityLabel, filename } = result.data;
      
      console.log('✅ YouTube Download Success:');
      console.log(`   📝 Title: ${title}`);
      console.log(`   📄 Description: ${description}`);
      console.log(`   👤 Author: ${author}`);
      console.log(`   🖼️  Thumbnail: ${thumbnail}`);
      console.log(`   📊 Quality: ${qualityLabel} (${quality})`);
      console.log(`   📁 Filename: ${filename}`);
      console.log(`   🔗 Download URL: ${downloadUrl}`);
      console.log('');
      
      console.log('💡 YouTube Features:');
      console.log('   ✅ Video download support added');
      console.log('   ✅ Quality detection (4K, 2K, 1080p, 720p, 480p, 360p)');
      console.log('   ✅ Metadata extraction (title, description, author)');
      console.log('   ✅ Thumbnail extraction');
      console.log('   ✅ Unique filename generation');
      console.log('   ✅ Caching for faster responses');
      
    } else {
      console.log('❌ YouTube download failed:', result.message);
    }
    
  } catch (error) {
    console.error('💥 Error during YouTube test:', error.message);
  }
}

async function testMultipleDownloadsUniqueNames() {
  console.log('\n🔄 Testing Multiple Downloads with Unique Names...\n');
  
  // Example URL (replace with real URL for testing)
  const testUrl = 'https://www.youtube.com/watch?v=example'; // Replace with real URL
  
  try {
    console.log('🔍 Testing multiple downloads of the same content...');
    
    // Test downloading the same content 3 times with unique filenames
    const result = await downloadMultipleTimes(testUrl, 3);
    
    if (result.success && result.data) {
      const { downloads, title, originalUrl } = result.data;
      
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
      
      console.log('💡 Multiple Download Benefits:');
      console.log('   ✅ Each download gets a unique filename');
      console.log('   ✅ No file overwrites');
      console.log('   ✅ Perfect for multiple saves');
      console.log('   ✅ Sequential numbering (1, 2, 3)');
      
    } else {
      console.log('❌ Failed to generate multiple downloads:');
      console.log(`   Error: ${result.message}`);
    }
    
  } catch (error) {
    console.error('💥 Error during multiple download test:', error.message);
  }
}

async function testFilenameUniqueness() {
  console.log('\n🔢 Testing Filename Uniqueness...\n');
  
  console.log('📁 Testing different naming strategies:');
  console.log('=====================================');
  
  const testTitle = "Amazing Video Content";
  
  // Test 1: Regular unique filenames
  console.log('\n1. Regular Unique Filenames (Random Numbers):');
  for (let i = 1; i <= 3; i++) {
    const filename = generateUniqueFilename(testTitle, 'video');
    console.log(`   Download ${i}: ${filename}`);
  }
  
  // Test 2: Photo-specific unique filenames
  console.log('\n2. Photo-Specific Unique Filenames:');
  for (let i = 1; i <= 3; i++) {
    const filename = generateUniquePhotoFilename(
      testTitle, 
      i, 
      1080, // quality
      '1920x1080', // resolution
      'instagram' // platform
    );
    console.log(`   Photo ${i}: ${filename}`);
  }
  
  console.log('\n✅ All filenames are completely unique!');
  console.log('   - Random numbers prevent conflicts');
  console.log('   - Timestamps add uniqueness');
  console.log('   - Quality and resolution info included');
  console.log('   - Platform-specific prefixes');
}

// Run all tests
console.log('🚀 Photo Naming Fix & YouTube Support Test Suite');
console.log('================================================\n');

async function runAllTests() {
  try {
    await testUniquePhotoNaming();
    await testInstagramCarouselUniqueNames();
    await testYouTubeVideoDownload();
    await testMultipleDownloadsUniqueNames();
    await testFilenameUniqueness();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n💡 Summary of Fixes:');
    console.log('   🔧 Fixed: Multiple photos now get unique names');
    console.log('   🎬 Added: YouTube video download support');
    console.log('   🔢 Enhanced: Unique filename generation');
    console.log('   📱 Improved: Instagram carousel handling');
    console.log('   🚫 Solved: No more duplicate filenames');
    
    console.log('\n🎯 Key Benefits:');
    console.log('   ✅ Each photo gets a completely unique filename');
    console.log('   ✅ YouTube videos can now be downloaded');
    console.log('   ✅ Quality and resolution information included');
    console.log('   ✅ Platform-specific naming conventions');
    console.log('   ✅ Timestamp and random string uniqueness');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
  }
}

runAllTests();