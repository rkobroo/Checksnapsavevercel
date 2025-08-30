export interface SnapSaveDownloaderMedia {
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
