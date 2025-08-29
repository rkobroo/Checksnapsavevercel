// Cache for cheerio loader and responses
let cheerioLoad: ((html: string) => ReturnType<typeof import("cheerio")["load"]>) | null = null;
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
import { facebookRegex, fixThumbnail, instagramRegex, normalizeURL, tiktokRegex, twitterRegex, userAgent } from "./utils";
import type { SnapSaveDownloaderData, SnapSaveDownloaderMedia, SnapSaveDownloaderResponse } from "./types";
import { decryptSnapSave, decryptSnaptik } from "./decrypter";

// Export enhanced functions
export { enhancedDownload, batchDownload, getDownloadInfo } from './enhanced-downloader';

export const snapsave = async (url: string): Promise<SnapSaveDownloaderResponse> => {
  try {
    // Check cache first for faster response
    const cacheKey = url;
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return { success: true, data: cached.data };
    }

    const regexList = [facebookRegex, instagramRegex, twitterRegex, tiktokRegex];
    const isValid = regexList.some(regex => url.match(regex));
    if (!isValid) return { success: false, message: "Invalid URL" };
    const isTwitter = url.match(twitterRegex);
    const isTiktok = url.match(tiktokRegex);

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
            quality: bestLink?.quality || 0
          }] 
        } 
      };
      
      // Cache the result for faster future responses
      responseCache.set(cacheKey, { data: result.data, timestamp: Date.now() });
      
      return result;
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
            quality: bestTwitterLink?.quality || 0
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
          type: resolution ? "video" : "image",
          title: data.title,
          duration: data.duration,
          author: data.author,
          thumbnail: data.thumbnail,
          quality: getQualityScore(resolution)
        });
        });
        
        // Sort by quality priority (HD first, then descending resolution)
        mediaItems.sort((a, b) => {
          return (b.quality || 0) - (a.quality || 0);
        });
        
        media.push(...mediaItems);
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
        
        // Sort by quality (HD first)
        cardItems.sort((a, b) => b.quality - a.quality);
        cardItems.forEach(item => {
          const { quality, ...mediaItem } = item;
          media.push(mediaItem);
        });
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
      
      // Sort by quality (HD first)  
      downloadItems.sort((a, b) => b.quality - a.quality);
      downloadItems.forEach(item => {
        const { quality, ...mediaItem } = item;
        media.push(mediaItem);
      });
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
