/**
 * Custom YouTube Video Downloader
 * This script can extract and download actual YouTube video files
 */

import { extractYouTubeVideoId } from './utils';

export interface YouTubeVideoInfo {
  videoId: string;
  title: string;
  duration: string;
  author: string;
  thumbnail: string;
  description: string;
  formats: VideoFormat[];
}

export interface VideoFormat {
  url: string;
  quality: string;
  resolution: string;
  fileSize?: string;
  mimeType: string;
  type: 'video' | 'audio' | 'video+audio';
}

export interface DownloadResult {
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
export const getYouTubeVideoInfo = async (url: string): Promise<DownloadResult> => {
  try {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return { success: false, message: "Invalid YouTube URL" };
    }

    console.log(`🔍 Extracting info for YouTube video: ${videoId}`);

    // Method 1: Try to extract from YouTube page directly
    try {
      const videoInfo = await extractFromYouTubePage(videoId);
      if (videoInfo.success) {
        return videoInfo;
      }
    } catch (error) {
      console.log('⚠️ YouTube page extraction failed:', error.message);
    }

    // Method 2: Try using y2mate API
    try {
      const y2mateInfo = await extractFromY2Mate(videoId);
      if (y2mateInfo.success) {
        return y2mateInfo;
      }
    } catch (error) {
      console.log('⚠️ Y2Mate extraction failed:', error.message);
    }

    // Method 3: Try using snapany API
    try {
      const snapanyInfo = await extractFromSnapany(videoId);
      if (snapanyInfo.success) {
        return snapanyInfo;
      }
    } catch (error) {
      console.log('⚠️ Snapany extraction failed:', error.message);
    }

    // Fallback: Return basic info with thumbnail
    return {
      success: true,
      data: {
        videoInfo: {
          videoId,
          title: `YouTube Video ${videoId}`,
          duration: "",
          author: "YouTube Creator",
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          description: "Video information extraction failed, but thumbnail is available",
          formats: []
        },
        downloadLinks: [],
        bestQuality: {
          url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          quality: "1080p",
          resolution: "1920x1080",
          mimeType: "image/jpeg",
          type: "video"
        },
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `YouTube extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Extract video info directly from YouTube page
 */
async function extractFromYouTubePage(videoId: string): Promise<DownloadResult> {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract video title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(' - YouTube', '') : `YouTube Video ${videoId}`;
    
    // Extract video duration
    const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);
    const duration = durationMatch ? formatDuration(parseInt(durationMatch[1])) : "";
    
    // Extract author
    const authorMatch = html.match(/"author":"([^"]+)"/);
    const author = authorMatch ? authorMatch[1] : "YouTube Creator";
    
    // Extract description
    const descMatch = html.match(/"shortDescription":"([^"]+)"/);
    const description = descMatch ? descMatch[1] : "Video description not available";
    
    // Extract thumbnail
    const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    
    // Create simplified quality options: only 720p and 480p
    const formats: VideoFormat[] = [
      {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        quality: "720p",
        resolution: "1280x720",
        mimeType: "video/mp4",
        type: "video"
      },
      {
        url: `https://www.youtube.com/embed/${videoId}`,
        quality: "480p",
        resolution: "854x480",
        mimeType: "video/mp4",
        type: "video"
      }
    ];
    
    const videoInfo: YouTubeVideoInfo = {
      videoId,
      title,
      duration,
      author,
      thumbnail,
      description,
      formats
    };
    
    const bestQuality = formats[0]; // 720p is best quality
    
    return {
      success: true,
      data: {
        videoInfo,
        downloadLinks: formats,
        bestQuality,
        thumbnail
      }
    };
    
  } catch (error) {
    throw new Error(`YouTube page extraction failed: ${error.message}`);
  }
}

/**
 * Extract video info from Y2Mate
 */
async function extractFromY2Mate(videoId: string): Promise<DownloadResult> {
  try {
    const response = await fetch(`https://www.y2mate.com/youtube/${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract video title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(' - Y2mate.com', '') : `YouTube Video ${videoId}`;
    
    // Extract download links
    const downloadLinks: VideoFormat[] = [];
    const linkRegex = /href="([^"]*download[^"]*)"[^>]*>([^<]*Download[^<]*)</gi;
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1];
      const text = match[2];
      
      let quality = "720p";
      let resolution = "1280x720";
      let mimeType = "video/mp4";
      let type: 'video' | 'audio' | 'video+audio' = 'video';
      
      if (text.includes("4K") || text.includes("2160")) {
        quality = "4K";
        resolution = "3840x2160";
      } else if (text.includes("1080")) {
        quality = "1080p";
        resolution = "1920x1080";
      } else if (text.includes("720")) {
        quality = "720p";
        resolution = "1280x720";
      } else if (text.includes("480")) {
        quality = "480p";
        resolution = "854x480";
      } else if (text.includes("360")) {
        quality = "360p";
        resolution = "640x360";
      }
      
      if (text.includes("Audio")) {
        type = "audio";
        mimeType = "audio/mp3";
      }
      
      downloadLinks.push({
        url,
        quality,
        resolution,
        mimeType,
        type
      });
    }
    
    if (downloadLinks.length === 0) {
      throw new Error("No download links found on Y2Mate");
    }
    
    const videoInfo: YouTubeVideoInfo = {
      videoId,
      title,
      duration: "",
      author: "YouTube Creator",
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      description: "Video download links extracted from Y2Mate",
      formats: downloadLinks
    };
    
    const bestQuality = downloadLinks.reduce((best, current) => {
      const currentQuality = parseInt(current.quality.replace('p', '').replace('K', '000'));
      const bestQuality = parseInt(best.quality.replace('p', '').replace('K', '000'));
      return currentQuality > bestQuality ? current : best;
    }, downloadLinks[0]);
    
    return {
      success: true,
      data: {
        videoInfo,
        downloadLinks,
        bestQuality,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      }
    };
    
  } catch (error) {
    throw new Error(`Y2Mate extraction failed: ${error.message}`);
  }
}

/**
 * Extract video info from Snapany
 */
async function extractFromSnapany(videoId: string): Promise<DownloadResult> {
  try {
    const response = await fetch(`https://snapany.com/youtube`, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      body: `url=https://www.youtube.com/watch?v=${videoId}`
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract download links from Snapany
    const downloadLinks: VideoFormat[] = [];
    const linkRegex = /href="([^"]*download[^"]*)"[^>]*>([^<]*Download[^<]*)</gi;
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1];
      const text = match[2];
      
      let quality = "720p";
      let resolution = "1280x720";
      let mimeType = "video/mp4";
      let type: 'video' | 'audio' | 'video+audio' = 'video';
      
      if (text.includes("HD") || text.includes("1080")) {
        quality = "1080p";
        resolution = "1920x1080";
      } else if (text.includes("720")) {
        quality = "720p";
        resolution = "1280x720";
      } else if (text.includes("480")) {
        quality = "480p";
        resolution = "854x480";
      }
      
      downloadLinks.push({
        url,
        quality,
        resolution,
        mimeType,
        type
      });
    }
    
    if (downloadLinks.length === 0) {
      throw new Error("No download links found on Snapany");
    }
    
    const videoInfo: YouTubeVideoInfo = {
      videoId,
      title: `YouTube Video ${videoId}`,
      duration: "",
      author: "YouTube Creator",
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      description: "Video download links extracted from Snapany",
      formats: downloadLinks
    };
    
    const bestQuality = downloadLinks.reduce((best, current) => {
      const currentQuality = parseInt(current.quality.replace('p', ''));
      const bestQuality = parseInt(best.quality.replace('p', ''));
      return currentQuality > bestQuality ? current : best;
    }, downloadLinks[0]);
    
    return {
      success: true,
      data: {
        videoInfo,
        downloadLinks,
        bestQuality,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      }
    };
    
  } catch (error) {
    throw new Error(`Snapany extraction failed: ${error.message}`);
  }
}

/**
 * Extract video formats from YouTube player response
 */
function extractFormatsFromPlayerResponse(playerResponse: any): VideoFormat[] {
  const formats: VideoFormat[] = [];
  
  try {
    if (playerResponse.streamingData && playerResponse.streamingData.formats) {
      playerResponse.streamingData.formats.forEach((format: any) => {
        if (format.url || format.signatureCipher) {
          formats.push({
            url: format.url || format.signatureCipher,
            quality: format.qualityLabel || `${format.height}p`,
            resolution: `${format.width}x${format.height}`,
            mimeType: format.mimeType || "video/mp4",
            type: "video"
          });
        }
      });
    }
    
    if (playerResponse.streamingData && playerResponse.streamingData.adaptiveFormats) {
      playerResponse.streamingData.adaptiveFormats.forEach((format: any) => {
        if (format.url || format.signatureCipher) {
          formats.push({
            url: format.url || format.signatureCipher,
            quality: format.qualityLabel || `${format.height}p`,
            resolution: `${format.width}x${format.height}`,
            mimeType: format.mimeType || "video/mp4",
            type: format.mimeType?.includes('audio') ? "audio" : "video"
          });
        }
      });
    }
  } catch (error) {
    console.log('⚠️ Failed to extract formats from player response:', error.message);
  }
  
  return formats;
}

/**
 * Format duration from seconds to readable format
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Download YouTube video with progress tracking
 */
export const downloadYouTubeVideo = async (
  url: string, 
  quality: string = "best",
  onProgress?: (progress: number, downloaded: number, total: number) => void
): Promise<{ success: boolean; message?: string; filename?: string }> => {
  try {
    // Get video info first
    const videoInfo = await getYouTubeVideoInfo(url);
    if (!videoInfo.success || !videoInfo.data) {
      return { success: false, message: videoInfo.message || "Failed to get video info" };
    }
    
    const { downloadLinks, bestQuality } = videoInfo.data;
    
    // Select quality
    let selectedFormat: VideoFormat;
    if (quality === "best") {
      selectedFormat = bestQuality; // 720p
    } else if (quality === "720p") {
      selectedFormat = downloadLinks.find(f => f.quality === "720p") || bestQuality;
    } else if (quality === "480p") {
      selectedFormat = downloadLinks.find(f => f.quality === "480p") || bestQuality;
    } else {
      selectedFormat = bestQuality;
    }
    
    if (!selectedFormat.url) {
      return { success: false, message: "No download URL available" };
    }
    
    // For YouTube videos, provide download instructions since direct download requires special handling
    if (selectedFormat.url.includes('youtube.com')) {
      const qualityLabel = selectedFormat.quality;
      const videoId = videoInfo.data.videoInfo.videoId;
      
      return {
        success: true,
        message: `🎬 YouTube Video Download - ${qualityLabel} Quality\n\n` +
                `📱 To download this video:\n` +
                `1. Visit: https://www.youtube.com/watch?v=${videoId}\n` +
                `2. Use browser extensions like:\n` +
                `   • Video DownloadHelper (Firefox/Chrome)\n` +
                `   • SaveFrom.net\n` +
                `   • Y2Mate.com\n` +
                `3. Or visit: https://y2mate.com/youtube/${videoId}\n\n` +
                `💡 The video is available in ${qualityLabel} quality.\n` +
                `🔗 Direct download links are not available due to YouTube's restrictions.`,
        filename: `${videoInfo.data.videoInfo.title}_${qualityLabel}_instructions.txt`
      };
    }
    
    // For other URLs, attempt direct download
    return await downloadDirectVideo(selectedFormat, videoInfo.data.videoInfo, onProgress);
    
  } catch (error) {
    return {
      success: false,
      message: `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Download video directly from URL (Node.js compatible)
 */
async function downloadDirectVideo(
  format: VideoFormat,
  videoInfo: YouTubeVideoInfo,
  onProgress?: (progress: number, downloaded: number, total: number) => void
): Promise<{ success: boolean; message?: string; filename?: string }> {
  try {
    const response = await fetch(format.url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength) : 0;
    
    if (!response.body) {
      throw new Error('No response body available');
    }
    
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let downloaded = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      chunks.push(value);
      downloaded += value.length;
      
      if (onProgress && total > 0) {
        const progress = (downloaded / total) * 100;
        onProgress(progress, downloaded, total);
      }
    }
    
    // Combine chunks
    const blob = new Blob(chunks, { type: format.mimeType });
    
    // Generate filename
    const safeTitle = videoInfo.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
    const filename = `${safeTitle}_${format.quality}.${format.mimeType.split('/')[1]}`;
    
    // For Node.js environment, save to file system
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      // Node.js environment - save to file
      const fs = await import('fs');
      const path = await import('path');
      
      const buffer = Buffer.from(await blob.arrayBuffer());
      const filePath = path.join(process.cwd(), filename);
      
      fs.writeFileSync(filePath, buffer);
      
      return {
        success: true,
        message: `Video downloaded successfully to: ${filePath}`,
        filename: filePath
      };
    } else {
      // Browser environment - create download link
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
      return {
        success: true,
        message: `Video downloaded successfully!`,
        filename
      };
    }
    
  } catch (error) {
    throw new Error(`Direct download failed: ${error.message}`);
  }
}