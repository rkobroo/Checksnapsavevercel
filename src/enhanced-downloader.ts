import { snapsave } from "./index";
import { generateCleanFilename, generateUniqueFilename, generateFilenameWithNumber } from "./utils";
import type { SnapSaveDownloaderResponse, SnapSaveDownloaderMedia } from "./types";

export interface EnhancedDownloadResponse {
  success: boolean;
  message?: string;
  data?: {
    title: string;
    description: string;
    duration: string;
    author: string;
    thumbnail: string;
    preview: string;
    downloadUrl: string;
    type: string;
    quality: number;
    filename: string;
    platform: string;
  };
}

export interface BatchDownloadResponse {
  success: boolean;
  message?: string;
  data?: EnhancedDownloadResponse["data"][];
}

/**
 * Enhanced downloader with fast response and comprehensive metadata
 */
export const enhancedDownload = async (url: string): Promise<EnhancedDownloadResponse> => {
  try {
    // Determine platform for better metadata handling
    const platform = getPlatform(url);
    
    // Get download data with caching (already implemented in snapsave)
    const result = await snapsave(url);
    
    if (!result.success || !result.data) {
      return { success: false, message: result.message || "Download failed" };
    }
    
    const { data } = result;
    
    // Get the best quality media item
    const bestMedia = getBestQualityMedia(data.media || []);
    
    if (!bestMedia || !bestMedia.url) {
      return { success: false, message: "No download links found" };
    }
    
    // Ensure we have the highest quality available
    const allMedia = data.media || [];
    const highestQuality = allMedia.reduce((best, current) => {
      return (current.quality || 0) > (best.quality || 0) ? current : best;
    }, bestMedia);
    
    // Generate unique filename with random number to prevent overwrites
    // This ensures each download gets a unique name even for the same video
    const filename = generateUniqueFilename(
      data.title || bestMedia.title || highestQuality.title || "video",
      highestQuality.type || bestMedia.type || "video"
    );
    
    return {
      success: true,
      data: {
        title: data.title || bestMedia.title || `${platform} Media`,
        description: data.description || bestMedia.description || "",
        duration: data.duration || bestMedia.duration || "",
        author: data.author || bestMedia.author || "",
        thumbnail: data.thumbnail || bestMedia.thumbnail || data.preview || "",
        preview: data.preview || "",
        downloadUrl: highestQuality.url || bestMedia.url,
        type: highestQuality.type || bestMedia.type || "video",
        quality: highestQuality.quality || bestMedia.quality || 0,
        filename,
        platform
      }
    };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Download failed" 
    };
  }
};

/**
 * Batch download multiple URLs with fast response
 */
export const batchDownload = async (urls: string[]): Promise<BatchDownloadResponse> => {
  try {
    const results = await Promise.allSettled(
      urls.map(url => enhancedDownload(url))
    );
    
    const successful = results
      .filter((result): result is PromiseFulfilledResult<EnhancedDownloadResponse> => 
        result.status === 'fulfilled' && result.value.success
      )
      .map(result => result.value.data)
      .filter(Boolean);
    
    const failed = results.filter(result => result.status === 'rejected').length;
    
    return {
      success: true,
      message: failed > 0 ? `${failed} downloads failed` : undefined,
      data: successful
    };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Batch download failed" 
    };
  }
};

/**
 * Download all photos from a single URL (Instagram carousels, etc.)
 */
export const downloadAllPhotos = async (url: string): Promise<{
  success: boolean;
  message?: string;
  data?: {
    title: string;
    description: string;
    author: string;
    totalPhotos: number;
    photos: Array<{
      url: string;
      filename: string;
      index: number;
      quality: number;
      thumbnail: string;
    }>;
    zipFilename?: string;
  };
}> => {
  try {
    // Get all media from the URL
    const result = await snapsave(url);
    
    if (!result.success || !result.data) {
      return { success: false, message: result.message || "Failed to get media data" };
    }
    
    const { data } = result;
    const allMedia = data.media || [];
    
    // Enhanced filtering for Instagram carousels
    // For Instagram, we want to include ALL media items as they're likely photos
    // For other platforms, filter by type
    const isInstagram = url.includes('instagram');
    
    let photos = allMedia;
    if (!isInstagram) {
      // For non-Instagram platforms, filter by type
      photos = allMedia.filter(item => item.type === 'image' || item.type === 'photo');
    }
    
    // Map to photo objects with enhanced information
    // Each photo gets a unique filename with a custom number to prevent conflicts
    const photoObjects = photos
      .map((item, index) => ({
        url: item.url || '',
        filename: generateFilenameWithNumber(
          data.title || (isInstagram ? 'instagram_photo' : 'photo'),
          'image',
          index + 1,
          'jpg'
        ),
        index: index + 1,
        quality: item.quality || 500,
        thumbnail: item.thumbnail || data.thumbnail || data.preview || '',
        originalType: item.type || 'unknown'
      }))
      .filter(photo => photo.url && photo.url.startsWith('http'));
    
    if (photoObjects.length === 0) {
      return { 
        success: false, 
        message: "No photos found. This might be a video-only post." 
      };
    }
    
    // Generate zip filename for bulk download
    const zipFilename = generateCleanFilename(
      `${data.title || 'photos'}_${photoObjects.length}_photos`,
      'zip'
    );
    
    return {
      success: true,
      data: {
        title: data.title || 'Photo Collection',
        description: data.description || '',
        author: data.author || '',
        totalPhotos: photoObjects.length,
        photos: photoObjects,
        zipFilename
      }
    };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to get photos" 
    };
  }
};

/**
 * Download all media (photos + videos) from a single URL
 */
export const downloadAllMedia = async (url: string): Promise<{
  success: boolean;
  message?: string;
  data?: {
    title: string;
    description: string;
    author: string;
    totalItems: number;
    photos: Array<{
      url: string;
      filename: string;
      index: number;
      quality: number;
      thumbnail: string;
    }>;
    videos: Array<{
      url: string;
      filename: string;
      index: number;
      quality: number;
      thumbnail: string;
      duration: string;
    }>;
    zipFilename?: string;
  };
}> => {
  try {
    // Get all media from the URL
    const result = await snapsave(url);
    
    if (!result.success || !result.data) {
      return { success: false, message: result.message || "Failed to get media data" };
    }
    
    const { data } = result;
    const allMedia = data.media || [];
    
    // Separate photos and videos with unique filenames
    const photos = allMedia
      .filter(item => item.type === 'image' || item.type === 'photo')
      .map((item, index) => ({
        url: item.url || '',
        filename: generateFilenameWithNumber(
          data.title || 'photo',
          'image',
          index + 1,
          'jpg'
        ),
        index: index + 1,
        quality: item.quality || 500,
        thumbnail: item.thumbnail || data.thumbnail || data.preview || ''
      }))
      .filter(photo => photo.url && photo.url.startsWith('http'));
    
    const videos = allMedia
      .filter(item => item.type === 'video')
      .map((item, index) => {
        const filename = generateFilenameWithNumber(
          data.title || 'video',
          'video',
          index + 1,
          'mp4'
        );
        return {
          url: item.url || '',
          filename,
          index: index + 1,
          quality: item.quality || 500,
          thumbnail: item.thumbnail || data.thumbnail || data.preview || '',
          duration: item.duration || ''
        };
      })
      .filter(video => video.url && video.url.startsWith('http'));
    
    if (photos.length === 0 && videos.length === 0) {
      return { 
        success: false, 
        message: "No media found to download." 
      };
    }
    
    // Generate zip filename for bulk download
    const zipFilename = generateCleanFilename(
      `${data.title || 'media'}_${photos.length + videos.length}_items`,
      'zip'
    );
    
    return {
      success: true,
      data: {
        title: data.title || 'Media Collection',
        description: data.description || '',
        author: data.author || '',
        totalItems: photos.length + videos.length,
        photos,
        videos,
        zipFilename
      }
    };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to get media" 
    };
  }
};

/**
 * Get platform from URL
 */
function getPlatform(url: string): string {
  if (url.includes('tiktok')) return 'TikTok';
  if (url.includes('twitter') || url.includes('x.com')) return 'Twitter/X';
  if (url.includes('facebook')) return 'Facebook';
  if (url.includes('instagram')) return 'Instagram';
  return 'Unknown';
}

/**
 * Get the best quality media item
 */
function getBestQualityMedia(media: SnapSaveDownloaderMedia[]): SnapSaveDownloaderMedia | null {
  if (!media.length) return null;
  
  // Sort by quality (highest first)
  const sortedMedia = [...media].sort((a, b) => (b.quality || 0) - (a.quality || 0));
  
  // Prefer video over image if available
  const videoItem = sortedMedia.find(item => item.type === 'video');
  if (videoItem) return videoItem;
  
  // Return best quality item
  return sortedMedia[0];
}

/**
 * Download the same video/photo multiple times with unique filenames
 * Perfect for when you want to download the same content multiple times
 */
export const downloadMultipleTimes = async (
  url: string, 
  count: number = 3
): Promise<{
  success: boolean;
  message?: string;
  data?: {
    title: string;
    description: string;
    author: string;
    thumbnail: string;
    originalUrl: string;
    downloads: Array<{
      index: number;
      filename: string;
      downloadUrl: string;
      quality: number;
      qualityLabel: string;
      type: string;
    }>;
  };
}> => {
  try {
    if (count < 1 || count > 10) {
      return { 
        success: false, 
        message: "Count must be between 1 and 10" 
      };
    }

    // Get the original media data
    const result = await enhancedDownload(url);
    
    if (!result.success || !result.data) {
      return { success: false, message: result.message || "Download failed" };
    }

    const { data } = result;
    const downloads = [];

    // Generate multiple downloads with unique filenames
    for (let i = 1; i <= count; i++) {
      const filename = generateFilenameWithNumber(
        data.title,
        data.type,
        i,
        data.type === 'video' ? 'mp4' : 'jpg'
      );

      downloads.push({
        index: i,
        filename,
        downloadUrl: data.downloadUrl,
        quality: data.quality,
        qualityLabel: data.qualityLabel || 'Standard',
        type: data.type
      });
    }

    return {
      success: true,
      data: {
        title: data.title,
        description: data.description,
        author: data.author,
        thumbnail: data.thumbnail,
        originalUrl: url,
        downloads
      }
    };

  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Multiple download failed" 
    };
  }
};

/**
 * Get download info without actually downloading (fast metadata response)
 */
export const getDownloadInfo = async (url: string): Promise<EnhancedDownloadResponse> => {
  try {
    const platform = getPlatform(url);
    
    // For fast response, we can return basic info immediately
    // and then enhance it with the full download data
    const basicInfo = {
      success: true,
      data: {
        title: `${platform} Media`,
        description: "",
        duration: "",
        author: "",
        thumbnail: "",
        preview: "",
        downloadUrl: "",
        type: "video",
        quality: 0,
        filename: `${platform.toLowerCase()}_media.mp4`,
        platform
      }
    };
    
    // Get full metadata in background
    enhancedDownload(url).then(result => {
      if (result.success && result.data) {
        // Update cache with full metadata for future requests
        // This is handled by the snapsave function's internal caching
      }
    }).catch(() => {
      // Ignore background errors for fast response
    });
    
    return basicInfo;
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to get download info" 
    };
  }
};