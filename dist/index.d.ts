interface SnapSaveDownloaderMedia {
    resolution?: string;
    shouldRender?: boolean;
    thumbnail?: string;
    type?: "image" | "video" | "service";
    url?: string;
    title?: string;
    duration?: string;
    author?: string;
    description?: string;
    quality?: number;
    qualityLabel?: string;
}
interface SnapSaveDownloaderData {
    description?: string;
    preview?: string;
    title?: string;
    duration?: string;
    author?: string;
    thumbnail?: string;
    media?: SnapSaveDownloaderMedia[];
}
interface SnapSaveDownloaderResponse {
    success: boolean;
    message?: string;
    data?: SnapSaveDownloaderData;
}

interface EnhancedDownloadResponse {
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
interface BatchDownloadResponse {
    success: boolean;
    message?: string;
    data?: EnhancedDownloadResponse["data"][];
}
/**
 * Enhanced downloader with fast response and comprehensive metadata
 */
declare const enhancedDownload: (url: string) => Promise<EnhancedDownloadResponse>;
/**
 * Batch download multiple URLs with fast response
 */
declare const batchDownload: (urls: string[]) => Promise<BatchDownloadResponse>;
/**
 * Download all photos from a single URL (Instagram carousels, etc.)
 */
declare const downloadAllPhotos: (url: string) => Promise<{
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
}>;
/**
 * Download all media (photos + videos) from a single URL
 */
declare const downloadAllMedia: (url: string) => Promise<{
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
}>;
/**
 * Download the same video/photo multiple times with unique filenames
 * Perfect for when you want to download the same content multiple times
 */
declare const downloadMultipleTimes: (url: string, count?: number) => Promise<{
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
}>;
/**
 * Get download info without actually downloading (fast metadata response)
 */
declare const getDownloadInfo: (url: string) => Promise<EnhancedDownloadResponse>;

/**
 * Custom YouTube Video Downloader
 * This script can extract and download actual YouTube video files
 */
interface YouTubeVideoInfo {
    videoId: string;
    title: string;
    duration: string;
    author: string;
    thumbnail: string;
    description: string;
    formats: VideoFormat[];
}
interface VideoFormat {
    url: string;
    quality: string;
    resolution: string;
    fileSize?: string;
    mimeType: string;
    type: 'video' | 'audio' | 'video+audio';
}
interface DownloadResult {
    success: boolean;
    message?: string;
    data?: {
        videoInfo: YouTubeVideoInfo;
        downloadLinks: VideoFormat[];
        bestQuality: VideoFormat;
        thumbnail: string;
    };
}
/**
 * Extract video information and download links from YouTube
 */
declare const getYouTubeVideoInfo: (url: string) => Promise<DownloadResult>;
/**
 * Download YouTube video with progress tracking
 */
declare const downloadYouTubeVideo: (url: string, quality?: string, onProgress?: (progress: number, downloaded: number, total: number) => void) => Promise<{
    success: boolean;
    message?: string;
    filename?: string;
}>;

declare const clearResponseCache: () => void;
declare const getCacheStatus: () => {
    totalEntries: number;
    cacheDuration: number;
    entries: {
        key: string;
        age: number;
        isValid: boolean;
    }[];
};

declare const snapsave: (url: string) => Promise<SnapSaveDownloaderResponse>;

export { batchDownload, clearResponseCache, downloadAllMedia, downloadAllPhotos, downloadMultipleTimes, downloadYouTubeVideo, enhancedDownload, getCacheStatus, getDownloadInfo, getYouTubeVideoInfo, snapsave };
export type { DownloadResult, VideoFormat, YouTubeVideoInfo };
