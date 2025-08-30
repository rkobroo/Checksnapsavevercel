export interface SnapSaveDownloaderMedia {
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

export interface SnapSaveDownloaderData {
  description?: string;
  preview?: string;
  title?: string;
  duration?: string;
  author?: string;
  thumbnail?: string;
  media?: SnapSaveDownloaderMedia[];
}

export interface SnapSaveDownloaderResponse {
  success: boolean;
  message?: string;
  data?: SnapSaveDownloaderData;
}

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
    qualityLabel: string;
    filename: string;
    platform: string;
    media?: SnapSaveDownloaderMedia[];
    isService?: boolean;
    serviceUrl?: string;
    serviceName?: string;
  };
}
