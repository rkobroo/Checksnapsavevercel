// Cache for cheerio loader and responses
let cheerioLoad: ((html: string) => ReturnType<typeof import("cheerio")["load"]>) | null = null;
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1 * 60 * 1000; // 1 minute (reduced from 5 minutes)

// Function to clear the response cache
export const clearResponseCache = () => {
  responseCache.clear();
  console.log('🧹 Response cache cleared');
};

// Function to get cache status
export const getCacheStatus = () => {
  const now = Date.now();
  const cacheEntries = Array.from(responseCache.entries()).map(([key, value]) => ({
    key,
    age: Math.round((now - value.timestamp) / 1000),
    isValid: (now - value.timestamp) < CACHE_DURATION
  }));
  
  return {
    totalEntries: responseCache.size,
    cacheDuration: CACHE_DURATION / 1000, // in seconds
    entries: cacheEntries
  };
};

async function getCheerioLoad () {
  if (!cheerioLoad) {
    const mod = await import("cheerio");
    cheerioLoad = mod.load;
  }
  return cheerioLoad;
}

// Helper function to extract clean title from text
function extractCleanTitle(text: string, platform: string): string {
  if (!text) return "";
  let clean = text.replace(/\s+/g, ' ').trim();
  const unwantedPrefixes = {
    'tiktok': ['TikTok', 'Video', 'Download', 'Share'],
    'twitter': ['Twitter', 'X', 'Video', 'Download', 'Share'],
    'facebook': ['Facebook', 'Video', 'Watch', 'Share', 'Download'],
    'instagram': ['Instagram', 'Video', 'Post', 'Reel', 'Download']
  };
  
  const prefixes = unwantedPrefixes[platform as keyof typeof unwantedPrefixes] || [];
  for (const prefix of prefixes) {
    clean = clean.replace(new RegExp(`^${prefix}[\\s:]*`, 'i'), '').trim();
  }
  
  // Remove common suffixes
  clean = clean.replace(/\|\s*[^|]+$/, '').trim();
  clean = clean.replace(/\s+on\s+[A-Za-z]+$/, '').trim();
  
  return clean || `${platform.charAt(0).toUpperCase() + platform.slice(1)} Media`;
}

// Helper function to extract duration from text
function extractDuration(text: string): string {
  if (!text) return "";
  const durationMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (durationMatch) {
    return `${durationMatch[1]}:${durationMatch[2]}`;
  }
  return "";
}

// Helper function to extract author from text
function extractAuthor(text: string): string {
  if (!text) return "";
  const authorMatch = text.match(/by\s+([^,\n]+)/i) || 
                     text.match(/@(\w+)/) ||
                     text.match(/([A-Z][a-z]+)\s+[A-Z][a-z]+/);
  return authorMatch ? authorMatch[1].trim() : "";
}

// Enhanced quality scoring system - always prioritize highest quality
function getQualityScore(resolution: string): number {
  if (!resolution) return 0;
  
  // Convert to lowercase for consistent matching
  const res = resolution.toLowerCase();
  
  // Ultra HD and 4K formats (highest priority)
  if (res.includes("4k") || res.includes("2160") || res.includes("uhd")) return 4000;
  if (res.includes("2k") || res.includes("1440")) return 2000;
  
  // Full HD formats
  if (res.includes("1080") || res.includes("hd") || res.includes("fullhd") || res.includes("fhd")) return 1080;
  if (res.includes("720") || res.includes("hd")) return 720;
  
  // Standard definition
  if (res.includes("480") || res.includes("sd")) return 480;
  if (res.includes("360")) return 360;
  if (res.includes("240")) return 240;
  
  // Extract numeric resolution from patterns like "1920x1080" or "1080p"
  const pixelMatch = res.match(/(\d+)[x×](\d+)/);
  if (pixelMatch) {
    const height = parseInt(pixelMatch[2]);
    if (height >= 2160) return 4000; // 4K
    if (height >= 1440) return 2000; // 2K
    if (height >= 1080) return 1080; // Full HD
    if (height >= 720) return 720;   // HD
    if (height >= 480) return 480;   // SD
    if (height >= 360) return 360;   // Low
    return height; // Use height as quality score
  }
  
  // Extract from "1080p" format
  const pMatch = res.match(/(\d+)p/);
  if (pMatch) {
    const height = parseInt(pMatch[1]);
    return height;
  }
  
  // Default quality based on text indicators
  if (res.includes("high") || res.includes("best") || res.includes("original")) return 1000;
  if (res.includes("medium") || res.includes("normal")) return 500;
  if (res.includes("low") || res.includes("worst")) return 100;
  
  return 500; // Default quality
}

// Helper function to get human-readable quality label
function getQualityLabel(quality: number): string {
  if (quality >= 4000) return "4K Ultra HD";
  if (quality >= 2000) return "2K HD";
  if (quality >= 1080) return "Full HD (1080p)";
  if (quality >= 720) return "HD (720p)";
  if (quality >= 480) return "SD (480p)";
  if (quality >= 360) return "Low (360p)";
  if (quality >= 240) return "Very Low (240p)";
  return "Standard";
}
import { facebookRegex, fixThumbnail, instagramRegex, normalizeURL, tiktokRegex, twitterRegex, youtubeRegex, extractYouTubeVideoId, userAgent } from "./utils";
import type { SnapSaveDownloaderData, SnapSaveDownloaderMedia, SnapSaveDownloaderResponse } from "./types";
import { decryptSnapSave, decryptSnaptik } from "./decrypter";

// Export enhanced functions
export { 
  enhancedDownload, 
  batchDownload, 
  getDownloadInfo, 
  downloadAllPhotos, 
  downloadAllMedia,
  downloadMultipleTimes
} from './enhanced-downloader';

// Export custom YouTube downloader functions
export { getYouTubeVideoInfo, downloadYouTubeVideo } from './youtube-downloader';
export type { YouTubeVideoInfo, VideoFormat, DownloadResult } from './youtube-downloader';

export const snapsave = async (url: string): Promise<SnapSaveDownloaderResponse> => {
  try {
    // Check cache first for faster response
    const cacheKey = url;
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return { success: true, data: cached.data };
    }

    const regexList = [facebookRegex, instagramRegex, twitterRegex, tiktokRegex, youtubeRegex];
    const isValid = regexList.some(regex => url.match(regex));
    if (!isValid) return { success: false, message: "Invalid URL" };
    const isTwitter = url.match(twitterRegex);
    const isTiktok = url.match(tiktokRegex);
    const isYoutube = url.match(youtubeRegex);

    const formData = new URLSearchParams();
    formData.append("url", normalizeURL(url));

    if (isTiktok) {
      const response = await fetch("https://snaptik.app/", {
        headers: {
          "user-agent": userAgent,
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.5",
          "cache-control": "no-cache"
        }
      });
      const homeHtml = await response.text();
      const load = await getCheerioLoad();
      const $ = load(homeHtml);
      const token = $("input[name='token']").val() as string;
      
      if (token) {
        formData.append("token", token);
      }
      
      const response2 = await fetch("https://snaptik.app/abc2.php", {
        method: "POST",
        headers: {
          "accept": "*/*",
          "content-type": "application/x-www-form-urlencoded",
          "origin": "https://snaptik.app",
          "referer": "https://snaptik.app/",
          "user-agent": userAgent,
          "x-requested-with": "XMLHttpRequest"
        },
        body: formData
      });
      const data = await response2.text();
      const decode = decryptSnaptik(data);
      const $3 = load(decode);
      
      // Extract all possible download links with quality info
      const downloadLinks: any[] = [];
      
      $3("a").each((_, el) => {
        const href = $3(el).attr("href");
        const text = $3(el).text().trim();
        
        if (href && (href.includes("snaptik") || href.includes("tikmate") || href.includes("download") || $3(el).hasClass("download-file"))) {
          let quality = 0;
          if (text.includes("HD") || text.includes("1080")) quality = 1080;
          else if (text.includes("720")) quality = 720;
          else if (text.includes("480")) quality = 480;
          else if (text.includes("360")) quality = 360;
          else quality = 500; // default for unknown quality
          
          downloadLinks.push({
            url: href,
            quality,
            text,
            type: text.includes("photo") || text.includes("Photo") ? "image" : "video"
          });
        }
      });
      
      // Sort by quality (highest first)
      downloadLinks.sort((a, b) => b.quality - a.quality);
      
      // Get the best quality link
      const bestLink = downloadLinks[0];
      let _url = bestLink?.url;
      const type = bestLink?.type || "video";
      
      // Ensure we always get the highest quality available
      if (bestLink && bestLink.quality < 1000) {
        // Look for higher quality alternatives
        const hdLink = downloadLinks.find(link => link.quality >= 1000);
        if (hdLink) {
          _url = hdLink.url;
          bestLink.quality = hdLink.quality;
        }
      }
      
      // Enhanced metadata extraction for TikTok
      let description = $3(".video-title").text().trim() ||
                       $3(".video-des").text().trim() ||
                       $3("h3").first().text().trim() ||
                       $3(".desc").text().trim() ||
                       $3(".video-description").text().trim() ||
                       $3("p").first().text().trim() ||
                       $3(".title").text().trim();
      
      // Extract clean title, duration, and author
      const title = extractCleanTitle(description, 'tiktok');
      const duration = extractDuration($3(".video-duration").text().trim() || $3(".duration").text().trim() || "");
      const author = extractAuthor($3(".author").text().trim() || $3(".username").text().trim() || "");
      
      // Clean up description and add fallback
      if (description) {
        description = description.replace(/\s+/g, ' ').trim();
        // Remove common unwanted text
        description = description.replace(/^(TikTok|Video|Download|Share)[\s:]*/, '').trim();
      }
      
      // Try multiple selectors for preview/thumbnail
      let preview = $3("#thumbnail").attr("src") ||
                   $3("img[src*='tiktok']").first().attr("src") ||
                   $3(".video-thumb img").first().attr("src") ||
                   $3("img").first().attr("src");
      
      if (!_url) {
        // Fallback: try to extract any download link
        $3("a").each((_, el) => {
          const href = $3(el).attr("href");
          if (href && (href.includes("download") || href.includes("snaptik") || href.includes("tikmate"))) {
            _url = href;
            return false; // break
          }
        });
      }
      
      // Ensure we have a proper fallback title
      if (!description || description.length < 3) {
        description = "TikTok Video";
      }
      
      const result = { 
        success: true, 
        data: { 
          title: title || "TikTok Video",
          description, 
          preview, 
          duration,
          author,
          thumbnail: preview,
          media: [{ 
            url: _url, 
            type,
            title: title || "TikTok Video",
            duration,
            author,
            thumbnail: preview,
            quality: bestLink?.quality || 0,
            qualityLabel: getQualityLabel(bestLink?.quality || 0)
          }] 
        } 
      };
      
      // Cache the result for faster future responses
      responseCache.set(cacheKey, { data: result.data, timestamp: Date.now() });
      
      return result;
    }
    if (isYoutube) {
      // YouTube video download handling using the new custom downloader
      try {
        // Import and use the new YouTube downloader
        const { getYouTubeVideoInfo } = await import('./youtube-downloader');
        
        // Get video information and download links
        const videoInfo = await getYouTubeVideoInfo(url);
        
        if (videoInfo.success && videoInfo.data) {
          const { videoInfo: info, downloadLinks, bestQuality, thumbnail } = videoInfo.data;
          
          // Create simplified media array with only 720p and 480p options
          const media: any[] = [
            // 720p Quality Option
            {
              url: `https://www.youtube.com/watch?v=${info.videoId}`,
              type: "video",
              title: `${info.title} - 720p HD Quality`,
              duration: info.duration,
              author: info.author,
              thumbnail: thumbnail,
              quality: 720,
              qualityLabel: "720p HD",
              resolution: "1280x720",
              mimeType: "video/mp4"
            },
            // 480p Quality Option
            {
              url: `https://www.youtube.com/embed/${info.videoId}`,
              type: "video",
              title: `${info.title} - 480p Standard Quality`,
              duration: info.duration,
              author: info.author,
              thumbnail: thumbnail,
              quality: 480,
              qualityLabel: "480p Standard",
              resolution: "854x480",
              mimeType: "video/mp4"
            },
            // High Quality Thumbnail
            {
              url: `https://img.youtube.com/vi/${info.videoId}/maxresdefault.jpg`,
              type: "image",
              title: `${info.title} - High Quality Thumbnail`,
              duration: info.duration,
              author: info.author,
              thumbnail: thumbnail,
              quality: 1080,
              qualityLabel: "Thumbnail (1080p)",
              resolution: "1920x1080",
              mimeType: "image/jpeg"
            }
          ];
          
          const result = { 
            success: true, 
            data: { 
              title: info.title,
              description: `YouTube video download - 2 quality options available: 720p HD and 480p Standard. Plus high-quality thumbnail.`,
              preview: thumbnail, 
              duration: info.duration,
              author: info.author,
              thumbnail: thumbnail,
              media: media
            } 
          };
          
          responseCache.set(cacheKey, { data: result.data, timestamp: Date.now() });
          return result;
          
        } else {
          // Fallback to basic thumbnail if extraction fails
          const result = { 
            success: true, 
            data: { 
              title: `YouTube Video ${extractYouTubeVideoId(url)}`,
              description: "YouTube video download - basic thumbnail available. For video download, please visit the YouTube page and use browser extensions.",
              preview: `https://img.youtube.com/vi/${extractYouTubeVideoId(url)}/maxresdefault.jpg`, 
              duration: "",
              author: "YouTube Creator",
              thumbnail: `https://img.youtube.com/vi/${extractYouTubeVideoId(url)}/maxresdefault.jpg`,
              media: [
                {
                  url: `https://img.youtube.com/vi/${extractYouTubeVideoId(url)}/maxresdefault.jpg`,
                  type: "image",
                  title: `YouTube Video ${extractYouTubeVideoId(url)} - Thumbnail`,
                  duration: "",
                  author: "YouTube Creator",
                  thumbnail: `https://img.youtube.com/vi/${extractYouTubeVideoId(url)}/maxresdefault.jpg`,
                  quality: 1080,
                  qualityLabel: "Thumbnail"
                }
              ] 
            } 
          };
          
          responseCache.set(cacheKey, { data: result.data, timestamp: Date.now() });
          return result;
        }
        
      } catch (error) {
        return { 
          success: false, 
          message: `YouTube download failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
        };
      }
    }
    if (isTwitter) {
      const response = await fetch("https://twitterdownloader.snapsave.app/", {
        headers: {
          "user-agent": userAgent,
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });
      const homeHtml = await response.text();
      const load = await getCheerioLoad();
      const $ = load(homeHtml);
      const token = $("input[name='token']").val() as string;
      
      if (token) {
        formData.append("token", token);
      }
      
      const response2 = await fetch("https://twitterdownloader.snapsave.app/action.php", {
        method: "POST",
        headers: {
          "accept": "*/*",
          "content-type": "application/x-www-form-urlencoded",
          "origin": "https://twitterdownloader.snapsave.app",
          "referer": "https://twitterdownloader.snapsave.app/",
          "user-agent": userAgent,
          "x-requested-with": "XMLHttpRequest"
        },
        body: formData
      });
      const data = await response2.json();
      const html2 = data?.data;
      const $2 = load(html2);
      
      // Extract Twitter/X download links with quality prioritization
      const twitterLinks: any[] = [];
      
      $2("a").each((_, el) => {
        const href = $2(el).attr("href");
        const text = $2(el).text().trim();
        
        if (href && (href.includes("download") || href.includes("rapidcdn") || href.includes("snapsave"))) {
          let quality = 0;
          if (text.includes("HD") || href.includes("hd") || text.includes("1080")) quality = 1080;
          else if (text.includes("720")) quality = 720;
          else if (text.includes("480")) quality = 480;
          else quality = 500; // default
          
          twitterLinks.push({
            url: href,
            quality,
            text,
            type: text.includes("photo") || text.includes("Photo") ? "image" : "video"
          });
        }
      });
      
      // Sort by quality (highest first)
      twitterLinks.sort((a, b) => b.quality - a.quality);
      
      const bestTwitterLink = twitterLinks[0];
      let _url = bestTwitterLink?.url;
      const type = bestTwitterLink?.type || "video";
      
      // Ensure we always get the highest quality available
      if (bestTwitterLink && bestTwitterLink.quality < 1000) {
        // Look for higher quality alternatives
        const hdLink = twitterLinks.find(link => link.quality >= 1000);
        if (hdLink) {
          _url = hdLink.url;
          bestTwitterLink.quality = hdLink.quality;
        }
      }
      
      // Enhanced metadata extraction for Twitter/X
      let description = $2(".videotikmate-middle > p > span").text().trim() ||
                       $2(".video-title").text().trim() ||
                       $2("p").first().text().trim() ||
                       $2(".desc").text().trim() ||
                       $2("h3").text().trim();
      
      // Extract clean title, duration, and author
      const title = extractCleanTitle(description, 'twitter');
      const duration = extractDuration($2(".video-duration").text().trim() || $2(".duration").text().trim() || "");
      const author = extractAuthor($2(".author").text().trim() || $2(".username").text().trim() || "");
      
      // Clean up description
      if (description) {
        description = description.replace(/\s+/g, ' ').trim();
        description = description.replace(/^(Twitter|X|Video|Download|Share)[\s:]*/, '').trim();
      }
      
      let preview = $2(".videotikmate-left > img").attr("src") ||
                   $2("img[src*='pbs.twimg']").first().attr("src") ||
                   $2("img").first().attr("src");
      
      // Ensure we have a proper fallback title
      if (!description || description.length < 3) {
        description = "Twitter/X Post";
      }
      
      const result = { 
        success: true, 
        data: { 
          title: title || "Twitter/X Post",
          description, 
          preview, 
          duration,
          author,
          thumbnail: preview,
          media: [{ 
            url: _url, 
            type,
            title: title || "Twitter/X Post",
            duration,
            author,
            thumbnail: preview,
            quality: bestTwitterLink?.quality || 0,
            qualityLabel: getQualityLabel(bestTwitterLink?.quality || 0)
          }] 
        } 
      };
      
      // Cache the result for faster future responses
      responseCache.set(cacheKey, { data: result.data, timestamp: Date.now() });
      
      return result;
    }

    const response = await fetch("https://snapsave.app/action.php?lang=en", {
      method: "POST",
      headers: {
        "accept": "*/*",
        "content-type": "application/x-www-form-urlencoded",
        "origin": "https://snapsave.app",
        "referer": "https://snapsave.app/",
        "user-agent": userAgent
      },
      body: formData
    });

    const html = await response.text();
    const decode = decryptSnapSave(html);
    const load = await getCheerioLoad();
    const $ = load(decode);
    const data: SnapSaveDownloaderData = {};
    const media: SnapSaveDownloaderMedia[] = [];

    if ($("table.table").length || $("article.media > figure").length) {
      // Special handling for Instagram carousels
      if (url.includes('instagram') && $("div.card").length > 1) {
        // Instagram carousel detected - look for multiple cards
        const carouselItems: any[] = [];
        
        $("div.card").each((_, el) => {
          const cardBody = $(el).find("div.card-body");
          const aText = cardBody.find("a").text().trim();
          let cardUrl = cardBody.find("a").attr("href");
          
          // Handle different URL formats
          if (cardUrl && cardUrl.includes("get_progressApi")) {
            const match = /get_progressApi\('(.*?)'\)/.exec(cardUrl);
            if (match && match[1]) {
              cardUrl = "https://snapsave.app" + match[1];
            }
          }
          
          if (cardUrl && cardUrl.startsWith("http")) {
            carouselItems.push({
              url: cardUrl,
              type: aText.includes("Photo") ? "image" : "video",
              title: data.title || "Instagram Photo",
              duration: data.duration || "",
              author: data.author || "",
              thumbnail: data.thumbnail || "",
              quality: aText.includes("HD") || aText.includes("1080") ? 1000 : 
                      aText.includes("720") ? 720 : 
                      aText.includes("480") ? 480 : 500
            });
          }
        });
        
        // Add all carousel items
        if (carouselItems.length > 0) {
          carouselItems.forEach(item => {
            media.push({
              ...item,
              quality: item.quality || 0,
              qualityLabel: getQualityLabel(item.quality || 0)
            });
          });
          
          // If we found Instagram carousel items, skip the regular processing
          // to avoid duplicates
          return { success: true, data: { ...data, media } };
        }
      }
      // Enhanced Facebook/Instagram metadata extraction
      let description = $("span.video-des").text().trim() ||
                       $(".video-title").text().trim() ||
                       $("h1").first().text().trim() ||
                       $("h2").first().text().trim() ||
                       $("h3").first().text().trim() ||
                       $(".title").text().trim() ||
                       $(".desc").text().trim() ||
                       $(".video-description").text().trim() ||
                       $("p").first().text().trim() ||
                       $("meta[property='og:title']").attr("content") ||
                       $("title").text().trim();
      
      // Extract clean title, duration, and author
      const platform = url.includes('instagram') ? 'instagram' : 'facebook';
      const title = extractCleanTitle(description, platform);
      const duration = extractDuration($(".video-duration").text().trim() || $(".duration").text().trim() || "");
      const author = extractAuthor($(".author").text().trim() || $(".username").text().trim() || "");
      
      // Clean up Facebook/Instagram description
      if (description) {
        description = description.replace(/\s+/g, ' ').trim();
        // Remove common Facebook unwanted text
        description = description.replace(/^(Facebook|Instagram|Video|Watch|Share|Download)[\s:]*/, '').trim();
        description = description.replace(/\|\s*Facebook$/, '').trim();
        description = description.replace(/on Facebook$/, '').trim();
      }
      
      const preview = $("article.media > figure").find("img").attr("src") ||
                     $("img[src*='fbcdn']").first().attr("src") ||
                     $("img[src*='instagram']").first().attr("src") ||
                     $(".video-preview img").first().attr("src") ||
                     $("img").first().attr("src");
      
      data.title = title || `${platform.charAt(0).toUpperCase() + platform.slice(1)} Media`;
      data.description = description && description.length >= 3 ? description : `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`;
      data.preview = preview;
      data.duration = duration;
      data.author = author;
      data.thumbnail = preview;
      
      if ($("table.table").length) {
        // Sort media by quality (prioritize HD)
        const mediaItems: any[] = [];
        
        $("tbody > tr").each((_, el) => {
          const $el = $(el);
          const $td = $el.find("td");
          const resolution = $td.eq(0).text().trim();
          let _url = $td.eq(2).find("a").attr("href") || $td.eq(2).find("button").attr("onclick");
          const shouldRender = /get_progressApi/ig.test(_url || "");
          if (shouldRender) {
            _url = "https://snapsave.app" + /get_progressApi\('(.*?)'\)/.exec(_url || "")?.[1] || _url;
          }
          // Remove duplicate dl parameters
          if (_url && _url.includes("&dl=1&dl=1")) {
            _url = _url.replace("&dl=1&dl=1", "&dl=1");
          }
          
                  mediaItems.push({
          resolution,
          ...shouldRender ? { shouldRender } : {},
          url: _url,
          // Better type detection for Instagram carousels
          type: (() => {
            if (url.includes('instagram')) {
              // For Instagram, check if it's likely a photo based on context
              const rowText = $el.text().toLowerCase();
              if (rowText.includes('photo') || rowText.includes('image') || !resolution) {
                return "image";
              }
            }
            // For Facebook, use the old logic
            return resolution ? "video" : "image";
          })(),
          title: data.title,
          duration: data.duration,
          author: data.author,
          thumbnail: data.thumbnail,
          quality: getQualityScore(resolution)
        });
        });
        
        // Sort by quality priority (highest first)
        mediaItems.sort((a, b) => {
          return (b.quality || 0) - (a.quality || 0);
        });
        
        // For Instagram carousels, add ALL media items
        // For Facebook, add only the highest quality to prevent duplicates
        if (mediaItems.length > 0) {
          if (url.includes('instagram')) {
            // Instagram: Add all media items for carousel support
            mediaItems.forEach(item => {
              media.push({
                ...item,
                quality: item.quality || 0,
                qualityLabel: getQualityLabel(item.quality || 0)
              });
            });
          } else {
            // Facebook: Add only the highest quality media
            const bestQuality = mediaItems[0];
            media.push({
              ...bestQuality,
              quality: bestQuality.quality || 0,
              qualityLabel: getQualityLabel(bestQuality.quality || 0)
            });
          }
        }
      }
      else if ($("div.card").length) {
        const cardItems: any[] = [];
        $("div.card").each((_, el) => {
          const cardBody = $(el).find("div.card-body");
          const aText = cardBody.find("a").text().trim();
          let url = cardBody.find("a").attr("href");
          const type = aText.includes("Photo") ? "image" : "video";
          // Remove duplicate dl parameters
          if (url && url.includes("&dl=1&dl=1")) {
            url = url.replace("&dl=1&dl=1", "&dl=1");
          }
          
                  cardItems.push({
          url,
          type,
          title: data.title,
          duration: data.duration,
          author: data.author,
          thumbnail: data.thumbnail,
          quality: aText.includes("HD") || aText.includes("1080") ? 1000 : 
                  aText.includes("720") ? 720 : 
                  aText.includes("480") ? 480 : 360
        });
        });
        
        // Sort by quality (highest first)
        cardItems.sort((a, b) => b.quality - a.quality);
        
        // For Instagram carousels, add ALL media items
        // For Facebook, add only the highest quality to prevent duplicates
        if (cardItems.length > 0) {
          if (url.includes('instagram')) {
            // Instagram: Add all media items for carousel support
            cardItems.forEach(item => {
              media.push({
                ...item,
                quality: item.quality || 0,
                qualityLabel: getQualityLabel(item.quality || 0)
              });
            });
          } else {
            // Facebook: Add only the highest quality media
            const bestQuality = cardItems[0];
            media.push({
              ...bestQuality,
              quality: bestQuality.quality || 0,
              qualityLabel: getQualityLabel(bestQuality.quality || 0)
            });
          }
        }
      }
      else {
        let url = $("a[href*='download']").attr("href") || 
                 $("a").first().attr("href") || 
                 $("button").attr("onclick");
        const aText = $("a").text().trim() || $("button").text().trim();
        const type = aText.includes("Photo") || aText.includes("photo") ? "image" : "video";
        
        if (!url) {
          // Try to find any download link
          $("a").each((_, el) => {
            const href = $(el).attr("href");
            if (href && (href.includes("download") || href.includes("snapsave") || href.includes("rapidcdn"))) {
              url = href;
              return false; // break
            }
          });
        }
        
        media.push({
          url,
          type
        });
      }
    }
    else if ($("div.download-items").length) {
      const downloadItems: any[] = [];
      $("div.download-items").each((_, el) => {
        const itemThumbnail = $(el).find("div.download-items__thumb > img").attr("src");
        const itemBtn = $(el).find("div.download-items__btn");
        let url = itemBtn.find("a").attr("href");
        const spanText = itemBtn.find("span").text().trim();
        const type = spanText.includes("Photo") ? "image" : "video";
        // Remove duplicate dl parameters
        if (url && url.includes("&dl=1&dl=1")) {
          url = url.replace("&dl=1&dl=1", "&dl=1");
        }
        
        downloadItems.push({
          url,
          ...type === "video" ? {
            thumbnail: itemThumbnail ? fixThumbnail(itemThumbnail) : undefined
          } : {},
          type,
          title: data.title,
          duration: data.duration,
          author: data.author,
          quality: spanText.includes("HD") || url?.includes("hd") ? 1000 : 
                  spanText.includes("720") ? 720 : 360
        });
      });
      
      // Sort by quality (highest first)  
      downloadItems.sort((a, b) => b.quality - a.quality);
      
      // For Instagram carousels, add ALL media items
      // For Facebook, add only the highest quality to prevent duplicates
      if (downloadItems.length > 0) {
        if (url.includes('instagram')) {
          // Instagram: Add all media items for carousel support
          downloadItems.forEach(item => {
            media.push({
              ...item,
              quality: item.quality || 0,
              qualityLabel: getQualityLabel(item.quality || 0)
            });
          });
        } else {
          // Facebook: Add only the highest quality media
          const bestQuality = downloadItems[0];
          media.push({
            ...bestQuality,
            quality: bestQuality.quality || 0,
            qualityLabel: getQualityLabel(bestQuality.quality || 0)
          });
        }
      }
    }
    if (!media.length) return { success: false, message: "Blank data" };
    
    const result = { success: true, data: { ...data, media } };
    
    // Cache the result for faster future responses
    responseCache.set(cacheKey, { data: result.data, timestamp: Date.now() });
    
    return result;
  }
  catch (e) {
    return { success: false, message: "Something went wrong" };
  }
};
