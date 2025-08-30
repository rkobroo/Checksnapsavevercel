import { 
  downloadAllPhotos, 
  downloadAllMedia, 
  generatePhotoDownloadLinks,
  generateBulkDownloadInstructions 
} from '../src/enhanced-downloader.js';

// Example 1: Download all photos from Instagram carousel
async function downloadInstagramPhotos() {
  console.log('📸 Downloading all photos from Instagram carousel...\n');
  
  const url = 'https://www.instagram.com/p/ABC123/'; // Replace with real URL
  
  try {
    const result = await downloadAllPhotos(url);
    
    if (result.success && result.data) {
      const { photos, totalPhotos, title, author, zipFilename } = result.data;
      
      console.log('✅ Success! Found photos:');
      console.log(`   📸 Total Photos: ${totalPhotos}`);
      console.log(`   📝 Title: ${title}`);
      console.log(`   👤 Author: ${author}`);
      console.log(`   📦 Zip Filename: ${zipFilename}`);
      console.log('');
      
      // Generate download links for all photos
      const downloadLinks = generatePhotoDownloadLinks(photos);
      
      console.log('🚀 All photos ready for download:');
      downloadLinks.forEach((photo, index) => {
        console.log(`   ${index + 1}. ${photo.filename}`);
        console.log(`      Quality: ${photo.quality}`);
        console.log(`      Download: ${photo.downloadLink}`);
        console.log('');
      });
      
      // Show bulk download instructions
      const instructions = generateBulkDownloadInstructions(totalPhotos, 'Instagram');
      console.log('📋 Download Instructions:');
      instructions.forEach(instruction => console.log(`   ${instruction}`));
      
    } else {
      console.log('❌ Failed:', result.message);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

// Example 2: Download all media (photos + videos)
async function downloadAllMedia() {
  console.log('\n🎬 Downloading all media (photos + videos)...\n');
  
  const url = 'https://www.instagram.com/reel/XYZ789/'; // Replace with real URL
  
  try {
    const result = await downloadAllMedia(url);
    
    if (result.success && result.data) {
      const { photos, videos, totalItems, title, author, zipFilename } = result.data;
      
      console.log('✅ Success! Found media:');
      console.log(`   📸 Photos: ${photos.length}`);
      console.log(`   🎬 Videos: ${videos.length}`);
      console.log(`   📊 Total Items: ${totalItems}`);
      console.log(`   📝 Title: ${title}`);
      console.log(`   👤 Author: ${author}`);
      console.log(`   📦 Zip Filename: ${zipFilename}`);
      console.log('');
      
      if (photos.length > 0) {
        console.log('📸 Photos available:');
        photos.forEach((photo, index) => {
          console.log(`   ${index + 1}. ${photo.filename} (Quality: ${photo.quality})`);
        });
        console.log('');
      }
      
      if (videos.length > 0) {
        console.log('🎬 Videos available:');
        videos.forEach((video, index) => {
          console.log(`   ${index + 1}. ${video.filename} (Quality: ${video.quality}, Duration: ${video.duration})`);
        });
        console.log('');
      }
      
      // Generate download links for all media
      const allMedia = [...photos, ...videos];
      const downloadLinks = allMedia.map((item, index) => ({
        ...item,
        downloadLink: item.url,
        downloadAttribute: `download="${item.filename}"`,
        type: photos.includes(item) ? 'photo' : 'video'
      }));
      
      console.log('🚀 All media ready for download:');
      downloadLinks.forEach((item, index) => {
        console.log(`   ${index + 1}. [${item.type.toUpperCase()}] ${item.filename}`);
        console.log(`      Download: ${item.downloadLink}`);
      });
      
    } else {
      console.log('❌ Failed:', result.message);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

// Example 3: Create HTML download page for all photos
function createDownloadPage(photos, title, author) {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Download ${title} - ${photos.length} Photos</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
        .photo-item { border: 1px solid #ddd; padding: 10px; text-align: center; }
        .photo-item img { max-width: 100%; height: auto; }
        .download-btn { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        .download-btn:hover { background: #0056b3; }
        .bulk-download { background: #28a745; color: white; padding: 15px 30px; font-size: 18px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>📸 ${title}</h1>
    <p><strong>Author:</strong> ${author}</p>
    <p><strong>Total Photos:</strong> ${photos.length}</p>
    
    <div class="bulk-download">
        <a href="#" onclick="downloadAllPhotos()" class="download-btn">🚀 Download All Photos (${photos.length})</a>
    </div>
    
    <div class="photo-grid">
        ${photos.map((photo, index) => `
            <div class="photo-item">
                <img src="${photo.thumbnail}" alt="Photo ${index + 1}" />
                <p><strong>${photo.filename}</strong></p>
                <p>Quality: ${photo.quality}</p>
                <a href="${photo.url}" download="${photo.filename}" class="download-btn">📥 Download</a>
            </div>
        `).join('')}
    </div>
    
    <script>
        function downloadAllPhotos() {
            const links = document.querySelectorAll('.photo-item .download-btn');
            links.forEach((link, index) => {
                setTimeout(() => {
                    link.click();
                }, index * 1000); // Download each photo with 1 second delay
            });
        }
    </script>
</body>
</html>`;
  
  return html;
}

// Example 4: Generate download page
async function generateDownloadPage() {
  console.log('\n🌐 Generating download page for all photos...\n');
  
  const url = 'https://www.instagram.com/p/DEF456/'; // Replace with real URL
  
  try {
    const result = await downloadAllPhotos(url);
    
    if (result.success && result.data) {
      const { photos, title, author } = result.data;
      
      // Create HTML download page
      const htmlPage = createDownloadPage(photos, title, author);
      
      console.log('✅ Download page generated!');
      console.log(`   📄 HTML Content Length: ${htmlPage.length} characters`);
      console.log(`   📸 Photos Included: ${photos.length}`);
      console.log(`   🎨 Page Title: ${title}`);
      console.log('');
      
      console.log('💡 Usage:');
      console.log('   1. Save the HTML content to a .html file');
      console.log('   2. Open in a web browser');
      console.log('   3. Click "Download All Photos" for one-click download');
      console.log('   4. Or download individual photos using the download buttons');
      
      // You can save this HTML to a file
      // require('fs').writeFileSync('download-page.html', htmlPage);
      
    } else {
      console.log('❌ Failed:', result.message);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

// Example 5: Batch download multiple photo collections
async function batchDownloadPhotoCollections() {
  console.log('\n📦 Batch downloading multiple photo collections...\n');
  
  const urls = [
    'https://www.instagram.com/p/ABC123/',
    'https://www.instagram.com/p/DEF456/',
    'https://www.instagram.com/p/GHI789/'
  ];
  
  try {
    const results = await Promise.allSettled(
      urls.map(url => downloadAllPhotos(url))
    );
    
    let totalPhotos = 0;
    let successfulCollections = 0;
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        const { totalPhotos: count, title } = result.value.data;
        totalPhotos += count;
        successfulCollections++;
        console.log(`✅ Collection ${index + 1}: ${title} (${count} photos)`);
      } else {
        console.log(`❌ Collection ${index + 1}: Failed`);
      }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   📸 Total Photos Found: ${totalPhotos}`);
    console.log(`   ✅ Successful Collections: ${successfulCollections}`);
    console.log(`   ❌ Failed Collections: ${results.length - successfulCollections}`);
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

// Export functions for use
export {
  downloadInstagramPhotos,
  downloadAllMedia,
  generateDownloadPage,
  batchDownloadPhotoCollections
};

// Uncomment to run examples
// downloadInstagramPhotos();
// downloadAllMedia();
// generateDownloadPage();
// batchDownloadPhotoCollections();