import { enhancedDownload, batchDownload, getDownloadInfo } from '../src/enhanced-downloader.js';

// Example 1: Single video download with full metadata
async function downloadSingleVideo() {
  console.log('🚀 Downloading single video with enhanced metadata...');
  
  const url = 'https://www.tiktok.com/@username/video/1234567890';
  const result = await enhancedDownload(url);
  
  if (result.success && result.data) {
    console.log('✅ Download successful!');
    console.log('📹 Title:', result.data.title);
    console.log('📝 Description:', result.data.description);
    console.log('⏱️ Duration:', result.data.duration);
    console.log('👤 Author:', result.data.author);
    console.log('🖼️ Thumbnail:', result.data.thumbnail);
    console.log('📥 Download URL:', result.data.downloadUrl);
    console.log('📁 Filename:', result.data.filename);
    console.log('🏷️ Platform:', result.data.platform);
    console.log('🎯 Quality:', result.data.quality);
  } else {
    console.log('❌ Download failed:', result.message);
  }
}

// Example 2: Fast metadata response without downloading
async function getFastMetadata() {
  console.log('\n⚡ Getting fast metadata response...');
  
  const url = 'https://www.instagram.com/reel/ABC123/';
  const info = await getDownloadInfo(url);
  
  if (info.success && info.data) {
    console.log('✅ Fast response received!');
    console.log('📹 Title:', info.data.title);
    console.log('🏷️ Platform:', info.data.platform);
    console.log('📁 Filename:', info.data.filename);
    
    // Full metadata will be fetched in background and cached
    console.log('🔄 Full metadata being fetched in background...');
  }
}

// Example 3: Batch download multiple videos
async function batchDownloadVideos() {
  console.log('\n📦 Batch downloading multiple videos...');
  
  const urls = [
    'https://www.tiktok.com/@user1/video/123',
    'https://www.instagram.com/reel/ABC123/',
    'https://twitter.com/user/status/123456789'
  ];
  
  const results = await batchDownload(urls);
  
  if (results.success && results.data) {
    console.log(`✅ Successfully processed ${results.data.length} videos:`);
    
    results.data.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.title}`);
      console.log(`   Platform: ${item.platform}`);
      console.log(`   Author: ${item.author}`);
      console.log(`   Duration: ${item.duration}`);
      console.log(`   Filename: ${item.filename}`);
      console.log(`   Quality: ${item.quality}`);
    });
  } else {
    console.log('❌ Batch download failed:', results.message);
  }
}

// Example 4: Download with custom filename
async function downloadWithCustomFilename() {
  console.log('\n🎯 Downloading with custom filename...');
  
  const url = 'https://www.facebook.com/watch?v=123456789';
  const result = await enhancedDownload(url);
  
  if (result.success && result.data) {
    console.log('✅ Download ready!');
    console.log('📁 Generated filename:', result.data.filename);
    console.log('📹 Video title:', result.data.title);
    
    // The filename is automatically generated from the video title
    // and cleaned to be filesystem-safe
    console.log('✨ Filename is automatically cleaned and safe for your system');
  }
}

// Example 5: Performance comparison
async function performanceComparison() {
  console.log('\n⚡ Performance comparison...');
  
  const url = 'https://www.tiktok.com/@url';
  const start1 = Date.now();
  await enhancedDownload(url);
  const time1 = Date.now() - start1;
  console.log(`⏱️ First call took: ${time1}ms`);
  
  const start2 = Date.now();
  await enhancedDownload(url);
  const time2 = Date.now() - start2;
  console.log(`⏱️ Second call took: ${time2}ms`);
  
  console.log(`🚀 Speed improvement: ${Math.round(time1 / time2)}x faster!`);
}

export {
  downloadSingleVideo,
  getFastMetadata,
  batchDownloadVideos,
  downloadWithCustomFilename,
  performanceComparison
};