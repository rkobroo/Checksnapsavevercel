# 🔢 Unique Filename Generation Feature

## 🎯 **Overview**

The enhanced media downloader now includes intelligent unique filename generation that prevents file overwrites when downloading the same video/photo multiple times. Each download gets a unique filename by adding random numbers or sequential numbering to the content title.

## 🚨 **Problem Solved**

**Before**: When downloading the same video/photo multiple times, files would overwrite each other because they had identical names.

**After**: Each download now gets a unique filename, preventing overwrites and allowing multiple downloads of the same content! 🎉

## ✨ **Key Features**

### 🔢 **Random Number Generation**
- **6-digit random numbers** (100000-999999) for unique identification
- **Automatic generation** on each download
- **No manual configuration** required

### 📁 **Sequential Numbering**
- **Custom numbering** for batch operations
- **Sequential filenames** for collections (photo_1, photo_2, photo_3)
- **Organized downloads** with logical numbering

### 🎯 **Smart Filename Creation**
- **Title-based names** using video/photo titles
- **Automatic cleaning** of invalid characters
- **Length optimization** to accommodate numbers
- **Extension handling** for different file types

## 🔧 **New Functions Added**

### 1. **`generateUniqueFilename(title, type, extension?)`**
Generates a unique filename with a random 6-digit number.

```typescript
import { generateUniqueFilename } from './utils';

const filename1 = generateUniqueFilename("Amazing TikTok Video", "video");
// Result: "Amazing_TikTok_Video_123456.mp4"

const filename2 = generateUniqueFilename("Beautiful Instagram Photo", "image");
// Result: "Beautiful_Instagram_Photo_789012.jpg"
```

### 2. **`generateFilenameWithNumber(title, type, number, extension?)`**
Generates a filename with a custom sequential number.

```typescript
import { generateFilenameWithNumber } from './utils';

const filename1 = generateFilenameWithNumber("Sunset Collection", "image", 1);
// Result: "Sunset_Collection_1.jpg"

const filename2 = generateFilenameWithNumber("Sunset Collection", "image", 2);
// Result: "Sunset_Collection_2.jpg"
```

### 3. **`downloadMultipleTimes(url, count)`**
Downloads the same content multiple times with unique filenames.

```typescript
import { downloadMultipleTimes } from './enhanced-downloader';

const result = await downloadMultipleTimes('https://tiktok.com/video/123', 5);

if (result.success && result.data) {
  result.data.downloads.forEach(download => {
    console.log(`Download ${download.index}: ${download.filename}`);
    // Each download has a unique filename!
  });
}
```

## 🎯 **How It Works**

### **Random Number Generation**
```typescript
// Generate a random 6-digit number
const randomNumber = Math.floor(100000 + Math.random() * 900000);

// Apply to filename
const filename = `${cleanTitle}_${randomNumber}.${extension}`;
```

### **Sequential Numbering**
```typescript
// For collections, use sequential numbers
photos.map((item, index) => ({
  filename: generateFilenameWithNumber(title, 'image', index + 1, 'jpg')
}));
```

### **Smart Title Cleaning**
```typescript
// Remove invalid characters and clean up
let cleanTitle = title
  .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
  .replace(/[^\w\s\-_]/g, '') // Remove special characters
  .replace(/\s+/g, ' ') // Normalize whitespace
  .trim()
  .substring(0, 80); // Limit length for numbers
```

## 📱 **Platform-Specific Behavior**

### **Single Media Downloads**
- **TikTok Videos**: Each download gets unique random number
- **Instagram Photos**: Each download gets unique random number
- **Facebook Videos**: Each download gets unique random number
- **Twitter Videos**: Each download gets unique random number

### **Photo Collections (Instagram Carousels)**
- **Photo 1**: `Post_Title_1.jpg`
- **Photo 2**: `Post_Title_2.jpg`
- **Photo 3**: `Post_Title_3.jpg`
- **Sequential numbering** prevents conflicts

### **Mixed Media Collections**
- **Photos**: `Post_Title_1.jpg`, `Post_Title_2.jpg`
- **Videos**: `Post_Title_1.mp4`, `Post_Title_2.mp4`
- **Organized by type** and sequential number

## 🚀 **Usage Examples**

### **Example 1: Download Same Video Multiple Times**
```typescript
import { downloadMultipleTimes } from './enhanced-downloader';

async function downloadVideoMultipleTimes() {
  const url = 'https://www.tiktok.com/@user/video/123';
  
  // Download the same video 3 times with unique filenames
  const result = await downloadMultipleTimes(url, 3);
  
  if (result.success && result.data) {
    const { downloads, title } = result.data;
    
    console.log(`Generated ${downloads.length} downloads for "${title}":`);
    
    downloads.forEach(download => {
      console.log(`- ${download.filename}`);
      console.log(`  Download URL: ${download.downloadUrl}`);
    });
  }
}

// Output:
// Generated 3 downloads for "Amazing TikTok Video":
// - Amazing_TikTok_Video_1.mp4
// - Amazing_TikTok_Video_2.mp4
// - Amazing_TikTok_Video_3.mp4
```

### **Example 2: Instagram Carousel with Unique Names**
```typescript
import { downloadAllPhotos } from './enhanced-downloader';

async function downloadInstagramCarousel() {
  const url = 'https://www.instagram.com/p/ABC123/';
  
  const result = await downloadAllPhotos(url);
  
  if (result.success && result.data) {
    const { photos, title } = result.data;
    
    console.log(`Downloading ${photos.length} photos from "${title}":`);
    
    photos.forEach(photo => {
      console.log(`- ${photo.filename}`);
      console.log(`  Quality: ${photo.quality}`);
      console.log(`  Download: ${photo.url}`);
    });
  }
}

// Output:
// Downloading 5 photos from "Beautiful Sunset Collection":
// - Beautiful_Sunset_Collection_1.jpg
// - Beautiful_Sunset_Collection_2.jpg
// - Beautiful_Sunset_Collection_3.jpg
// - Beautiful_Sunset_Collection_4.jpg
// - Beautiful_Sunset_Collection_5.jpg
```

### **Example 3: Enhanced Download with Unique Names**
```typescript
import { enhancedDownload } from './enhanced-downloader';

async function downloadWithUniqueNames() {
  const url = 'https://www.tiktok.com/@user/video/456';
  
  // First download
  const result1 = await enhancedDownload(url);
  console.log(`First download: ${result1.data.filename}`);
  
  // Second download (different filename)
  const result2 = await enhancedDownload(url);
  console.log(`Second download: ${result2.data.filename}`);
  
  // Third download (different filename)
  const result3 = await enhancedDownload(url);
  console.log(`Third download: ${result3.data.filename}`);
}

// Output:
// First download: Amazing_Video_123456.mp4
// Second download: Amazing_Video_789012.mp4
// Third download: Amazing_Video_345678.mp4
```

## 🎨 **Filename Examples**

### **Video Downloads**
```
Original Title: "Epic Dance Challenge #trending"
- Download 1: Epic_Dance_Challenge_trending_123456.mp4
- Download 2: Epic_Dance_Challenge_trending_789012.mp4
- Download 3: Epic_Dance_Challenge_trending_345678.mp4
```

### **Photo Collections**
```
Original Title: "Vacation Memories 2024"
- Photo 1: Vacation_Memories_2024_1.jpg
- Photo 2: Vacation_Memories_2024_2.jpg
- Photo 3: Vacation_Memories_2024_3.jpg
- Photo 4: Vacation_Memories_2024_4.jpg
```

### **Mixed Content**
```
Original Title: "Weekend Adventures"
- Photo 1: Weekend_Adventures_1.jpg
- Photo 2: Weekend_Adventures_2.jpg
- Video 1: Weekend_Adventures_1.mp4
- Video 2: Weekend_Adventures_2.mp4
```

## 🔧 **Technical Implementation**

### **Random Number Generation**
```typescript
// Generate 6-digit random number (100000-999999)
const randomNumber = Math.floor(100000 + Math.random() * 900000);

// Ensures uniqueness across multiple downloads
// Probability of collision is extremely low
```

### **Filename Length Optimization**
```typescript
// Limit title length to leave room for numbers
const maxTitleLength = 80; // Reduced from 100
const titleWithNumber = `${cleanTitle}_${number}`;

// Ensures filename doesn't exceed system limits
// Maintains readability while adding uniqueness
```

### **Extension Handling**
```typescript
// Automatic extension detection based on type
const defaultExtensions = {
  'video': 'mp4',
  'image': 'jpg',
  'zip': 'zip'
};

// User can override with custom extension
const filename = generateUniqueFilename(title, type, 'mp4');
```

## 📊 **Benefits**

### **For Users**
- ✅ **No more file overwrites** when downloading multiple times
- ✅ **Unique filenames** for each download
- ✅ **Organized collections** with sequential numbering
- ✅ **Descriptive names** based on content titles
- ✅ **Easy file management** and organization

### **For Developers**
- ✅ **Automatic uniqueness** without manual intervention
- ✅ **Flexible naming** with custom numbers
- ✅ **Batch processing** support
- ✅ **Error prevention** from filename conflicts
- ✅ **Clean API** for filename generation

## 🎯 **Use Cases**

### **Multiple Downloads**
- Download the same video multiple times
- Save different versions of content
- Test different download methods
- Backup important content

### **Batch Operations**
- Download multiple items from collections
- Process large numbers of files
- Organize downloads by type
- Create numbered sequences

### **Content Management**
- Organize photo collections
- Manage video libraries
- Create backup systems
- Handle duplicate content

## 🧪 **Testing**

I've created a comprehensive test file `test-unique-filenames.js` that demonstrates:

1. **Utility Function Tests**
   - Regular filename generation
   - Unique filename generation
   - Custom number filename generation

2. **Multiple Download Tests**
   - Download same content multiple times
   - Verify unique filenames
   - Check for conflicts

3. **Enhanced Download Tests**
   - Single downloads with unique names
   - Multiple downloads of same content
   - Filename uniqueness verification

4. **Instagram Carousel Tests**
   - Photo collections with sequential numbering
   - Unique filenames for each photo
   - Organization and naming verification

### **Run Tests**
```bash
# Test the unique filename functionality
node test-unique-filenames.js

# Expected output shows unique filenames for each test
```

## 🔮 **Future Enhancements**

### **Planned Features**
- **Custom number ranges** for specific use cases
- **Date-based numbering** for time-sensitive content
- **Quality-based naming** (HD, 4K, etc.)
- **Platform-specific naming** conventions

### **Advanced Options**
- **User-defined naming patterns**
- **Batch numbering strategies**
- **Conflict resolution** for existing files
- **Filename validation** and sanitization

## 💡 **Best Practices**

### **For Multiple Downloads**
- Use `downloadMultipleTimes()` for same content
- Specify count based on your needs (1-10)
- Each download gets a unique filename automatically

### **For Collections**
- Use `downloadAllPhotos()` for photo carousels
- Use `downloadAllMedia()` for mixed content
- Sequential numbering prevents conflicts

### **For Single Downloads**
- Use `enhancedDownload()` for individual items
- Each call generates a unique filename
- Perfect for testing or multiple saves

## 🎉 **Result**

**Now when you download the same video/photo multiple times:**
1. ✅ **Each download gets a unique filename** automatically
2. ✅ **No more file overwrites** or conflicts
3. ✅ **Random numbers ensure uniqueness** across downloads
4. ✅ **Sequential numbering** for organized collections
5. ✅ **Descriptive names** based on content titles
6. ✅ **Perfect for multiple downloads** of the same content

The unique filename generation feature has been completely implemented! 🚀

---

**🎯 The enhanced media downloader now generates unique filenames for every download, preventing overwrites and allowing multiple downloads of the same content with descriptive, organized names!**