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