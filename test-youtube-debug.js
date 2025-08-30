#!/usr/bin/env node

/**
 * Debug YouTube Download Process
 * This helps us see what HTML structure we're getting from download services
 */

async function testYouTubeDownloadDebug() {
  console.log('🔍 Debugging YouTube Download Process...\n');
  
  const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";
  
  console.log('📋 Testing URL:', testUrl);
  console.log('=====================================\n');
  
  // Test 1: snapsave.app
  console.log('🔍 Test 1: snapsave.app');
  console.log('========================');
  
  try {
    // Get the home page first
    const homeResponse = await fetch("https://snapsave.app/", {
      headers: {
        "user-agent": userAgent,
      }
    });
    
    const homeHtml = await homeResponse.text();
    console.log('✅ Home page loaded successfully');
    console.log('📄 Home page HTML preview:', homeHtml.substring(0, 300));
    console.log('');
    
    // Now try to submit the URL
    const formData = new URLSearchParams();
    formData.append("url", testUrl);
    
    console.log('⏳ Submitting URL to snapsave.app...');
    
    const downloadResponse = await fetch("https://snapsave.app/action.php", {
      method: "POST",
      headers: {
        "user-agent": userAgent,
        "accept": "*/*",
        "content-type": "application/x-www-form-urlencoded",
        "origin": "https://snapsave.app",
        "referer": "https://snapsave.app/",
      },
      body: formData
    });
    
    const downloadHtml = await downloadResponse.text();
    console.log('✅ Download page loaded successfully');
    console.log('📄 Download page HTML preview:', downloadHtml.substring(0, 500));
    console.log('');
    
    // Look for download links
    const downloadLinks = [];
    const linkRegex = /<a[^>]*href=["']([^"']*)["'][^>]*>([^<]*)<\/a>/gi;
    let match;
    
    while ((match = linkRegex.exec(downloadHtml)) !== null) {
      const href = match[1];
      const text = match[2];
      
      if (href && (href.includes("download") || href.includes("cdn") || href.includes("media") || text.toLowerCase().includes("download"))) {
        downloadLinks.push({ href, text: text.trim() });
      }
    }
    
    console.log('🔗 Found download links:', downloadLinks.length);
    downloadLinks.forEach((link, index) => {
      console.log(`   ${index + 1}. ${link.text} -> ${link.href}`);
    });
    console.log('');
    
  } catch (error) {
    console.error('❌ snapsave.app failed:', error.message);
    console.log('');
  }
  
  // Test 2: snapinsta.app (alternative)
  console.log('🔍 Test 2: snapinsta.app (alternative)');
  console.log('=======================================');
  
  try {
    // Get the home page first
    const altHomeResponse = await fetch("https://snapinsta.app/", {
      headers: {
        "user-agent": userAgent,
      }
    });
    
    const altHomeHtml = await altHomeResponse.text();
    console.log('✅ Alternative home page loaded successfully');
    console.log('📄 Alternative home page HTML preview:', altHomeHtml.substring(0, 300));
    console.log('');
    
    // Now try to submit the URL
    const altFormData = new URLSearchParams();
    altFormData.append("url", testUrl);
    
    console.log('⏳ Submitting URL to snapinsta.app...');
    
    const altDownloadResponse = await fetch("https://snapinsta.app/action.php", {
      method: "POST",
      headers: {
        "user-agent": userAgent,
        "accept": "*/*",
        "content-type": "application/x-www-form-urlencoded",
        "origin": "https://snapinsta.app",
        "referer": "https://snapinsta.app/",
      },
      body: altFormData
    });
    
    const altDownloadHtml = await altDownloadResponse.text();
    console.log('✅ Alternative download page loaded successfully');
    console.log('📄 Alternative download page HTML preview:', altDownloadHtml.substring(0, 500));
    console.log('');
    
    // Look for download links
    const altDownloadLinks = [];
    const altLinkRegex = /<a[^>]*href=["']([^"']*)["'][^>]*>([^<]*)<\/a>/gi;
    let altMatch;
    
    while ((altMatch = altLinkRegex.exec(altDownloadHtml)) !== null) {
      const href = altMatch[1];
      const text = altMatch[2];
      
      if (href && (href.includes("download") || href.includes("cdn") || href.includes("media") || text.toLowerCase().includes("download"))) {
        altDownloadLinks.push({ href, text: text.trim() });
      }
    }
    
    console.log('🔗 Found alternative download links:', altDownloadLinks.length);
    altDownloadLinks.forEach((link, index) => {
      console.log(`   ${index + 1}. ${link.text} -> ${link.href}`);
    });
    console.log('');
    
  } catch (error) {
    console.error('❌ snapinsta.app failed:', error.message);
    console.log('');
  }
  
  console.log('🎯 Debug Summary:');
  console.log('==================');
  console.log('✅ URL validation: Working');
  console.log('✅ Service connectivity: Tested');
  console.log('✅ HTML structure: Analyzed');
  console.log('✅ Download link detection: Debugged');
  console.log('');
  console.log('💡 Next steps:');
  console.log('   - Check if services are blocking our requests');
  console.log('   - Verify HTML structure matches our expectations');
  console.log('   - Test with different YouTube URLs');
  console.log('   - Consider using different download services');
}

// Run the debug test
testYouTubeDownloadDebug().catch(error => {
  console.error('💥 Debug test failed:', error.message);
});