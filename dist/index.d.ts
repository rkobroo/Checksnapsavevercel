interface SnapSaveDownloaderMedia {
    resolution?: string;
    shouldRender?: boolean;
    thumbnail?: string;
    type?: "image" | "video";
    url?: string;
    title?: string;
    duration?: string;
    author?: string;
    description?: string;
    quality?: number;
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
 * Get download info without actually downloading (fast metadata response)
 */
declare const getDownloadInfo: (url: string) => Promise<EnhancedDownloadResponse>;

declare const snapsave: (url: string) => Promise<SnapSaveDownloaderResponse>;

export { batchDownload, enhancedDownload, getDownloadInfo, snapsave };
