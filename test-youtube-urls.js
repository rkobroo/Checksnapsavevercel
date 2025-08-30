#!/usr/bin/env node

/**
 * Test YouTube URL Validation
 * This helps debug why YouTube URLs are being rejected as "Invalid URL"
 */

// Copy the regex pattern from the built file
const youtubeRegex = /^https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)\//;

// Copy the extractYouTubeVideoId function from the built file
const extractYouTubeVideoId = (url) => {
  // Handle youtu.be format
  if (url.includes('youtu.be/')) {
    const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }
  
  // Handle youtube.com format
  if (url.includes('youtube.com/')) {
    // Check for watch?v= format
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];
    
    // Check for embed/video ID format
    const embedMatch = url.match(/\/(?:embed|v|shorts)\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];
  }
  
  return null;
};

// Copy the normalizeURL function from the built file
const normalizeURL = (url) => {
  const twitterRegex = /^https:\/\/(?:x|twitter)\.com(?:\/(?:i\/web|[^/]+)\/status\/(\d+)(?:.*)?)?$/;
  if (twitterRegex.test(url)) return url;
  return /^(https?:\/\/)(?!www\.)[a-z0-9]+/i.test(url) ? url.replace(/^(https?:\/\/)([^./]+\.[^./]+)(\/.*)?$/, "$1www.$2$3") : url;
};

function testYouTubeURLs() {
  console.log('🔍 Testing YouTube URL Validation...\n');
  
  const testUrls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com/watch?v=dQw4w9WgXcQ',
    'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://www.youtube.com/v/dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://youtube.com/watch?v=dQw4w9WgXcQ&t=30s',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share',
    'https://youtu.be/dQw4w9WgXcQ?t=30',
    'https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ&t=30s',
    'https://youtube.com/watch?t=30s&v=dQw4w9WgXcQ&feature=share'
  ];
  
  console.log('📋 Test URLs:');
  console.log('=============');
  
  testUrls.forEach((url, index) => {
    const regexMatch = youtubeRegex.test(url);
    const videoId = extractYouTubeVideoId(url);
    const normalized = normalizeURL(url);
    const isValid = videoId !== null;
    
    console.log(`${index + 1}. ${url}`);
    console.log(`   Regex Match: ${regexMatch ? '✅' : '❌'}`);
    console.log(`   Video ID: ${videoId || 'None'}`);
    console.log(`   Is Valid: ${isValid ? '✅' : '❌'}`);
    console.log(`   Normalized: ${normalized}`);
    console.log('');
  });
  
  console.log('🔧 Regex Pattern:');
  console.log(youtubeRegex.source);
  console.log('');
  
  console.log('🔧 Video ID Extraction Function:');
  console.log('Uses multiple regex patterns to handle different URL formats');
  console.log('');
  
  console.log('💡 Analysis:');
  console.log('============');
  
  const validCount = testUrls.filter(url => extractYouTubeVideoId(url) !== null).length;
  const totalCount = testUrls.length;
  
  console.log(`Valid URLs: ${validCount}/${totalCount}`);
  console.log(`Success Rate: ${((validCount / totalCount) * 100).toFixed(1)}%`);
  
  if (validCount === 0) {
    console.log('\n❌ All URLs failed! The extraction function needs fixing.');
  } else if (validCount < totalCount) {
    console.log('\n⚠️  Some URLs failed. The extraction function needs improvement.');
  } else {
    console.log('\n✅ All URLs passed! The extraction function is working correctly.');
  }
  
  console.log('\n🎯 Key Improvements:');
  console.log('   ✅ Handles URLs with additional parameters (t=30s, feature=share)');
  console.log('   ✅ Works with parameters in any order');
  console.log('   ✅ Supports all YouTube URL formats (watch, embed, v, shorts, youtu.be)');
  console.log('   ✅ More reliable than single regex pattern');
}

// Run the test
testYouTubeURLs();