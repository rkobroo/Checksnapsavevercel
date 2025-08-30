#!/usr/bin/env node

/**
 * Test Instagram Carousel Download
 * This demonstrates how the enhanced downloader now handles Instagram carousels
 * to download ALL photos instead of just one.
 */

import { downloadAllPhotos, downloadAllMedia } from './src/enhanced-downloader.js';

async function testInstagramCarousel() {
  console.log('📸 Testing Instagram Carousel Download...\n');
  
  // Example Instagram carousel URL (replace with real URL for testing)
  const instagramUrl = 'https://www.instagram.com/p/ABC123/'; // Replace with real URL
  
  try {
    console.log('🔍 Analyzing Instagram post for carousel photos...');
    
    // Test downloadAllPhotos function
    const result = await downloadAllPhotos(instagramUrl);
    
    if (result.success && result.data) {
      const { photos, totalPhotos, title, author, zipFilename } = result.data;
      
      console.log('✅ Success! Instagram carousel detected:');
      console.log(`   📸 Total Photos Found: ${totalPhotos}`);
      console.log(`   📝 Post Title: ${title}`);
      console.log(`   👤 Author: ${author}`);
      console.log(`   📦 Zip Filename: ${zipFilename}`);
      console.log('');
      
      console.log('🚀 All photos ready for download:');
      photos.forEach((photo, index) => {
        console.log(`   ${index + 1}. ${photo.filename}`);
        console.log(`      Quality: ${photo.quality}`);
        console.log(`      Type: ${photo.originalType || 'image'}`);
        console.log(`      Download URL: ${photo.url}`);
        console.log('');
      });
      
      console.log('💡 How it works:');
      console.log('   1. The enhanced downloader detects Instagram carousels');
      console.log('   2. It extracts ALL media items, not just the highest quality');
      console.log('   3. Each photo gets a unique filename based on the post title');
      console.log('   4. All photos are available for one-click download');
      console.log('');
      
      console.log('🎯 Key improvements:');
      console.log('   ✅ Detects Instagram carousels automatically');
      console.log('   ✅ Downloads ALL photos, not just one');
      console.log('   ✅ Generates descriptive filenames');
      console.log('   ✅ Provides quality information for each photo');
      console.log('   ✅ Supports batch download operations');
      
    } else {
      console.log('❌ Failed to get Instagram carousel data:');
      console.log(`   Error: ${result.message}`);
      console.log('');
      console.log('💡 This might happen if:');
      console.log('   - The URL is not a valid Instagram post');
      console.log('   - The post is private or restricted');
      console.log('   - Instagram has changed their structure');
    }
    
  } catch (error) {
    console.error('💥 Error during Instagram carousel test:', error.message);
  }
}

async function testDownloadAllMedia() {
  console.log('\n🎬 Testing downloadAllMedia for mixed content...\n');
  
  const url = 'https://www.instagram.com/reel/XYZ789/'; // Replace with real URL
  
  try {
    const result = await downloadAllMedia(url);
    
    if (result.success && result.data) {
      const { photos, videos, totalItems, title } = result.data;
      
      console.log('✅ Success! Mixed media detected:');
      console.log(`   📸 Photos: ${photos.length}`);
      console.log(`   🎬 Videos: ${videos.length}`);
      console.log(`   📊 Total Items: ${totalItems}`);
      console.log(`   📝 Title: ${title}`);
      console.log('');
      
      if (photos.length > 0) {
        console.log('📸 Photos available:');
        photos.forEach((photo, index) => {
          console.log(`   ${index + 1}. ${photo.filename} (Quality: ${photo.quality})`);
        });
      }
      
      if (videos.length > 0) {
        console.log('\n🎬 Videos available:');
        videos.forEach((video, index) => {
          console.log(`   ${index + 1}. ${video.filename} (Quality: ${video.quality}, Duration: ${video.duration})`);
        });
      }
      
    } else {
      console.log('❌ Failed to get mixed media data:', result.message);
    }
    
  } catch (error) {
    console.error('💥 Error during mixed media test:', error.message);
  }
}

// Run tests
console.log('🚀 Instagram Carousel Download Test');
console.log('=====================================\n');

testInstagramCarousel()
  .then(() => testDownloadAllMedia())
  .then(() => {
    console.log('\n🎉 Test completed!');
    console.log('\n💡 To test with real URLs:');
    console.log('   1. Replace the example URLs with real Instagram post URLs');
    console.log('   2. Run: node test-instagram-carousel.js');
    console.log('   3. Check that ALL photos are detected and available for download');
  })
  .catch(error => {
    console.error('\n💥 Test failed:', error.message);
  });