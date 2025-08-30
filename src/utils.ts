export const facebookRegex = /^https?:\/\/(?:www\.|web\.|m\.)?facebook\.com\/(watch(\?v=|\/\?v=)[0-9]+(?!\/)|reel\/[0-9]+|[a-zA-Z0-9.\-_]+\/(videos|posts)\/[0-9]+|[0-9]+\/(videos|posts)\/[0-9]+|[a-zA-Z0-9]+\/(videos|posts)\/[0-9]+|share\/(v|r)\/[a-zA-Z0-9]+\/?)([^/?#&]+).*$|^https:\/\/fb\.watch\/[a-zA-Z0-9]+$/;
export const instagramRegex = /^https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|reels|tv|stories|share)\/([^/?#&]+).*/;
export const tiktokRegex = /^https?:\/\/(?:www\.|m\.|vm\.|vt\.)?tiktok\.com\/(?:@[^/]+\/(?:video|photo)\/\d+|v\/\d+|t\/[\w]+|[\w]+)\/?/;
export const twitterRegex = /^https:\/\/(?:x|twitter)\.com(?:\/(?:i\/web|[^/]+)\/status\/(\d+)(?:.*)?)?$/;

export const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";

export const normalizeURL = (url: string) => {
  if (twitterRegex.test(url)) return url;
  return /^(https?:\/\/)(?!www\.)[a-z0-9]+/i.test(url) ? url.replace(/^(https?:\/\/)([^./]+\.[^./]+)(\/.*)?$/, "$1www.$2$3") : url;
};

export const fixThumbnail = (url: string) => {
  const toReplace = "https://snapinsta.app/photo.php?photo=";
  return url.includes(toReplace) ? decodeURIComponent(url.replace(toReplace, "")) : url;
};

export const generateCleanFilename = (title: string, type: string, extension?: string): string => {
  if (!title || title.trim().length === 0) {
    // Generate a timestamp-based filename if no title
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `video_${timestamp}.${extension || type}`;
  }
  
  // Remove invalid filename characters and clean up
  let cleanTitle = title
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/[^\w\s\-_]/g, '') // Remove special characters except spaces, hyphens, underscores
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 100); // Limit length
  
  // Ensure the title is not empty after cleaning
  if (cleanTitle.length === 0) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `video_${timestamp}.${extension || type}`;
  }
  
  // Add extension if provided
  if (extension) {
    return `${cleanTitle}.${extension}`;
  }
  
  // Default extensions based on type
  const defaultExtensions = {
    'video': 'mp4',
    'image': 'jpg',
    'zip': 'zip'
  };
  
  const ext = defaultExtensions[type as keyof typeof defaultExtensions] || 'mp4';
  return `${cleanTitle}.${ext}`;
};

/**
 * Generate download links for all photos in one click
 */
export const generatePhotoDownloadLinks = (photos: Array<{
  url: string;
  filename: string;
  index: number;
  quality: number;
  thumbnail: string;
}>) => {
  return photos.map(photo => ({
    ...photo,
    downloadLink: photo.url,
    // Add direct download attribute for browser download
    downloadAttribute: `download="${photo.filename}"`
  }));
};

/**
 * Generate bulk download instructions
 */
export const generateBulkDownloadInstructions = (totalPhotos: number, platform: string) => {
  const instructions = [
    `📸 Found ${totalPhotos} photos on ${platform}`,
    `🚀 All photos are ready for download in one click!`,
    `📁 Each photo will be saved with a unique filename`,
    `💡 Tip: Use browser's "Save all" feature or download individually`
  ];
  
  if (totalPhotos > 10) {
    instructions.push(`⚠️ Large collection detected (${totalPhotos} photos)`);
    instructions.push(`💾 Consider downloading in smaller batches for better performance`);
  }
  
  return instructions;
};