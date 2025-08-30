import { snapsave } from "./index";
import { generateCleanFilename } from "./utils";
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
    
    // Generate clean filename using video title (always prioritize title)
    const filename = generateCleanFilename(
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
        downloadUrl: bestMedia.url,
        type: bestMedia.type || "video",
        quality: bestMedia.quality || 0,
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
    
    // Filter only photos/images
    const photos = allMedia
      .filter(item => item.type === 'image' || item.type === 'photo')
      .map((item, index) => ({
        url: item.url || '',
        filename: generateCleanFilename(
          `${data.title || 'photo'}_${index + 1}`,
          'image',
          'jpg'
        ),
        index: index + 1,
        quality: item.quality || 500,
        thumbnail: item.thumbnail || data.thumbnail || data.preview || ''
      }))
      .filter(photo => photo.url && photo.url.startsWith('http'));
    
    if (photos.length === 0) {
      return { 
        success: false, 
        message: "No photos found. This might be a video-only post." 
      };
    }
    
    // Generate zip filename for bulk download
    const zipFilename = generateCleanFilename(
      `${data.title || 'photos'}_${photos.length}_photos`,
      'zip'
    );
    
    return {
      success: true,
      data: {
        title: data.title || 'Photo Collection',
        description: data.description || '',
        author: data.author || '',
        totalPhotos: photos.length,
        photos,
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
    
    // Separate photos and videos
    const photos = allMedia
      .filter(item => item.type === 'image' || item.type === 'photo')
      .map((item, index) => ({
        url: item.url || '',
        filename: generateCleanFilename(
          `${data.title || 'photo'}_${index + 1}`,
          'image',
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
        const filename = generateCleanFilename(
          `${data.title || 'video'}_${index + 1}`,
          'video',
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
  if (url.includes('tiktok')) return 'Tiktok';
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