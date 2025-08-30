const facebookRegex = /^https?:\/\/(?:www\.|web\.|m\.)?facebook\.com\/(watch(\?v=|\/\?v=)[0-9]+(?!\/)|reel\/[0-9]+|[a-zA-Z0-9.\-_]+\/(videos|posts)\/[0-9]+|[0-9]+\/(videos|posts)\/[0-9]+|[a-zA-Z0-9]+\/(videos|posts)\/[0-9]+|share\/(v|r)\/[a-zA-Z0-9]+\/?)([^/?#&]+).*$|^https:\/\/fb\.watch\/[a-zA-Z0-9]+$/;
const instagramRegex = /^https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|reels|tv|stories|share)\/([^/?#&]+).*/;
const tiktokRegex = /^https?:\/\/(?:www\.|m\.|vm\.|vt\.)?tiktok\.com\/(?:@[^/]+\/(?:video|photo)\/\d+|v\/\d+|t\/[\w]+|[\w]+)\/?/;
const twitterRegex = /^https:\/\/(?:x|twitter)\.com(?:\/(?:i\/web|[^/]+)\/status\/(\d+)(?:.*)?)?$/;
const youtubeRegex = /^https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)\//;
const extractYouTubeVideoId = (url) => {
  if (url.includes("youtu.be/")) {
    const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }
  if (url.includes("youtube.com/")) {
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];
    const embedMatch = url.match(/\/(?:embed|v|shorts)\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];
  }
  return null;
};
const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";
const normalizeURL = (url) => {
  if (twitterRegex.test(url)) return url;
  return /^(https?:\/\/)(?!www\.)[a-z0-9]+/i.test(url) ? url.replace(/^(https?:\/\/)([^./]+\.[^./]+)(\/.*)?$/, "$1www.$2$3") : url;
};
const fixThumbnail = (url) => {
  const toReplace = "https://snapinsta.app/photo.php?photo=";
  return url.includes(toReplace) ? decodeURIComponent(url.replace(toReplace, "")) : url;
};
const generateCleanFilename = (title, type, extension) => {
  if (!title || title.trim().length === 0) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
    return `video_${timestamp}.${extension || type}`;
  }
  let cleanTitle = title.replace(/[<>:"/\\|?*]/g, "").replace(/[^\w\s\-_]/g, "").replace(/\s+/g, " ").trim().substring(0, 100);
  if (cleanTitle.length === 0) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
    return `video_${timestamp}.${extension || type}`;
  }
  if (extension) {
    return `${cleanTitle}.${extension}`;
  }
  const defaultExtensions = {
    "video": "mp4",
    "image": "jpg",
    "zip": "zip"
  };
  const ext = defaultExtensions[type] || "mp4";
  return `${cleanTitle}.${ext}`;
};
const generateUniqueFilename = (title, type, extension) => {
  const randomNumber = Math.floor(1e5 + Math.random() * 9e5);
  if (title.trim().length === 0) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
    return `video_${timestamp}_${randomNumber}.${type}`;
  }
  let cleanTitle = title.replace(/[<>:"/\\|?*]/g, "").replace(/[^\w\s\-_]/g, "").replace(/\s+/g, " ").trim().substring(0, 80);
  if (cleanTitle.length === 0) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
    return `video_${timestamp}_${randomNumber}.${type}`;
  }
  const titleWithRandom = `${cleanTitle}_${randomNumber}`;
  const defaultExtensions = {
    "video": "mp4",
    "image": "jpg",
    "zip": "zip"
  };
  const ext = defaultExtensions[type] || "mp4";
  return `${titleWithRandom}.${ext}`;
};
const generateFilenameWithNumber = (title, type, number, extension) => {
  if (!title || title.trim().length === 0) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
    return `video_${timestamp}_${number}.${extension || type}`;
  }
  let cleanTitle = title.replace(/[<>:"/\\|?*]/g, "").replace(/[^\w\s\-_]/g, "").replace(/\s+/g, " ").trim().substring(0, 80);
  if (cleanTitle.length === 0) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
    return `video_${timestamp}_${number}.${extension || type}`;
  }
  const titleWithNumber = `${cleanTitle}_${number}`;
  if (extension) {
    return `${titleWithNumber}.${extension}`;
  }
  const defaultExtensions = {
    "video": "mp4",
    "image": "jpg",
    "zip": "zip"
  };
  const ext = defaultExtensions[type] || "mp4";
  return `${titleWithNumber}.${ext}`;
};
const generateUniquePhotoFilename = (baseTitle, index, quality, resolution, platform) => {
  let photoTitle = baseTitle || "photo";
  if (platform) {
    photoTitle = `${platform}_${photoTitle}`;
  }
  if (quality && quality > 0) {
    photoTitle = `${photoTitle}_${quality}p`;
  }
  if (resolution) {
    photoTitle = `${photoTitle}_${resolution}`;
  }
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substr(2, 6);
  const uniqueTitle = `${photoTitle}_${index}_${timestamp}_${randomString}`;
  return generateCleanFilename(uniqueTitle, "image", "jpg");
};

function decodeSnapApp(args) {
  let [h, u, n, t, e, r] = args;
  const tNum = Number(t);
  const eNum = Number(e);
  function decode(d, e2, f) {
    const g = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/".split("");
    const hArr = g.slice(0, e2);
    const iArr = g.slice(0, f);
    let j = d.split("").reverse().reduce((a, b, c) => {
      const idx = hArr.indexOf(b);
      if (idx !== -1) return a + idx * Math.pow(e2, c);
      return a;
    }, 0);
    let k = "";
    while (j > 0) {
      k = iArr[j % f] + k;
      j = Math.floor(j / f);
    }
    return k || "0";
  }
  let result = "";
  for (let i = 0, len = h.length; i < len; ) {
    let s = "";
    while (i < len && h[i] !== n[eNum]) {
      s += h[i];
      i++;
    }
    i++;
    for (let j = 0; j < n.length; j++)
      s = s.replace(new RegExp(n[j], "g"), j.toString());
    result += String.fromCharCode(Number(decode(s, eNum, 10)) - tNum);
  }
  const fixEncoding = (str) => {
    try {
      const bytes = new Uint8Array(str.split("").map((char) => char.charCodeAt(0)));
      return new TextDecoder("utf-8").decode(bytes);
    } catch (e2) {
      return str;
    }
  };
  return fixEncoding(result);
}
function getEncodedSnapApp(data) {
  return data.split("decodeURIComponent(escape(r))}(")[1].split("))")[0].split(",").map((v) => v.replace(/"/g, "").trim());
}
function getDecodedSnapSave(data) {
  return data.split('getElementById("download-section").innerHTML = "')[1].split('"; document.getElementById("inputData").remove(); ')[0].replace(/\\(\\)?/g, "");
}
function getDecodedSnaptik(data) {
  return data.split('$("#download").innerHTML = "')[1].split('"; document.getElementById("inputData").remove(); ')[0].replace(/\\(\\)?/g, "");
}
function decryptSnapSave(data) {
  return getDecodedSnapSave(decodeSnapApp(getEncodedSnapApp(data)));
}
function decryptSnaptik(data) {
  return getDecodedSnaptik(decodeSnapApp(getEncodedSnapApp(data)));
}

const enhancedDownload = async (url) => {
  try {
    const platform = getPlatform(url);
    const result = await snapsave(url);
    if (!result.success || !result.data) {
      return { success: false, message: result.message || "Download failed" };
    }
    const { data } = result;
    const bestMedia = getBestQualityMedia(data.media || []);
    if (!bestMedia || !bestMedia.url) {
      return { success: false, message: "No download links found" };
    }
    const allMedia = data.media || [];
    const highestQuality = allMedia.reduce((best, current) => {
      return (current.quality || 0) > (best.quality || 0) ? current : best;
    }, bestMedia);
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
        qualityLabel: highestQuality.qualityLabel || getQualityLabel(highestQuality.quality || bestMedia.quality || 0),
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
const batchDownload = async (urls) => {
  try {
    const results = await Promise.allSettled(
      urls.map((url) => enhancedDownload(url))
    );
    const successful = results.filter(
      (result) => result.status === "fulfilled" && result.value.success
    ).map((result) => result.value.data).filter(Boolean);
    const failed = results.filter((result) => result.status === "rejected").length;
    return {
      success: true,
      message: failed > 0 ? `${failed} downloads failed` : void 0,
      data: successful
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Batch download failed"
    };
  }
};
const downloadAllPhotos = async (url) => {
  try {
    const result = await snapsave(url);
    if (!result.success || !result.data) {
      return { success: false, message: result.message || "Failed to get media data" };
    }
    const { data } = result;
    const allMedia = data.media || [];
    const isInstagram = url.includes("instagram");
    let photos = allMedia;
    if (!isInstagram) {
      photos = allMedia.filter((item) => item.type === "image" || item.type === "photo");
    }
    const photoObjects = photos.map((item, index) => {
      let photoTitle = data.title || (isInstagram ? "instagram_photo" : "photo");
      if (photos.length > 1) {
        if (item.quality && item.quality > 0) {
          photoTitle = `${photoTitle}_${item.quality}p`;
        }
        if (item.resolution) {
          photoTitle = `${photoTitle}_${item.resolution}`;
        }
      }
      return {
        url: item.url || "",
        filename: generateUniquePhotoFilename(
          photoTitle,
          index + 1,
          item.quality,
          item.resolution,
          isInstagram ? "instagram" : "social"
        ),
        index: index + 1,
        quality: item.quality || 500,
        thumbnail: item.thumbnail || data.thumbnail || data.preview || "",
        originalType: item.type || "unknown",
        resolution: item.resolution || "",
        // Add more unique identifiers
        uniqueId: `${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
      };
    }).filter((photo) => photo.url && photo.url.startsWith("http"));
    if (photoObjects.length === 0) {
      return {
        success: false,
        message: "No photos found. This might be a video-only post."
      };
    }
    const zipFilename = generateCleanFilename(
      `${data.title || "photos"}_${photoObjects.length}_photos`,
      "zip"
    );
    return {
      success: true,
      data: {
        title: data.title || "Photo Collection",
        description: data.description || "",
        author: data.author || "",
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
const downloadAllMedia = async (url) => {
  try {
    const result = await snapsave(url);
    if (!result.success || !result.data) {
      return { success: false, message: result.message || "Failed to get media data" };
    }
    const { data } = result;
    const allMedia = data.media || [];
    const photos = allMedia.filter((item) => item.type === "image" || item.type === "photo").map((item, index) => ({
      url: item.url || "",
      filename: generateFilenameWithNumber(
        data.title || "photo",
        "image",
        index + 1,
        "jpg"
      ),
      index: index + 1,
      quality: item.quality || 500,
      thumbnail: item.thumbnail || data.thumbnail || data.preview || ""
    })).filter((photo) => photo.url && photo.url.startsWith("http"));
    const videos = allMedia.filter((item) => item.type === "video").map((item, index) => {
      const filename = generateFilenameWithNumber(
        data.title || "video",
        "video",
        index + 1,
        "mp4"
      );
      return {
        url: item.url || "",
        filename,
        index: index + 1,
        quality: item.quality || 500,
        thumbnail: item.thumbnail || data.thumbnail || data.preview || "",
        duration: item.duration || ""
      };
    }).filter((video) => video.url && video.url.startsWith("http"));
    if (photos.length === 0 && videos.length === 0) {
      return {
        success: false,
        message: "No media found to download."
      };
    }
    const zipFilename = generateCleanFilename(
      `${data.title || "media"}_${photos.length + videos.length}_items`,
      "zip"
    );
    return {
      success: true,
      data: {
        title: data.title || "Media Collection",
        description: data.description || "",
        author: data.author || "",
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
function getPlatform(url) {
  if (url.includes("tiktok")) return "TikTok";
  if (url.includes("twitter") || url.includes("x.com")) return "Twitter/X";
  if (url.includes("facebook")) return "Facebook";
  if (url.includes("instagram")) return "Instagram";
  if (url.includes("youtube") || url.includes("youtu.be")) return "YouTube";
  return "Unknown";
}
function getBestQualityMedia(media) {
  if (!media.length) return null;
  const sortedMedia = [...media].sort((a, b) => (b.quality || 0) - (a.quality || 0));
  const videoItem = sortedMedia.find((item) => item.type === "video");
  if (videoItem) return videoItem;
  return sortedMedia[0];
}
const downloadMultipleTimes = async (url, count = 3) => {
  try {
    if (count < 1 || count > 10) {
      return {
        success: false,
        message: "Count must be between 1 and 10"
      };
    }
    const result = await enhancedDownload(url);
    if (!result.success || !result.data) {
      return { success: false, message: result.message || "Download failed" };
    }
    const { data } = result;
    const downloads = [];
    for (let i = 1; i <= count; i++) {
      const filename = generateFilenameWithNumber(
        data.title,
        data.type,
        i,
        data.type === "video" ? "mp4" : "jpg"
      );
      downloads.push({
        index: i,
        filename,
        downloadUrl: data.downloadUrl,
        quality: data.quality,
        qualityLabel: data.qualityLabel || "Standard",
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
const getDownloadInfo = async (url) => {
  try {
    const platform = getPlatform(url);
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
    enhancedDownload(url).then((result) => {
      if (result.success && result.data) {
      }
    }).catch(() => {
    });
    return basicInfo;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to get download info"
    };
  }
};

let cheerioLoad = null;
const responseCache = /* @__PURE__ */ new Map();
const CACHE_DURATION = 5 * 60 * 1e3;
async function getCheerioLoad() {
  if (!cheerioLoad) {
    const mod = await import('cheerio');
    cheerioLoad = mod.load;
  }
  return cheerioLoad;
}
function extractCleanTitle(text, platform) {
  if (!text) return "";
  let clean = text.replace(/\s+/g, " ").trim();
  const unwantedPrefixes = {
    "tiktok": ["TikTok", "Video", "Download", "Share"],
    "twitter": ["Twitter", "X", "Video", "Download", "Share"],
    "facebook": ["Facebook", "Video", "Watch", "Share", "Download"],
    "instagram": ["Instagram", "Video", "Post", "Reel", "Download"]
  };
  const prefixes = unwantedPrefixes[platform] || [];
  for (const prefix of prefixes) {
    clean = clean.replace(new RegExp(`^${prefix}[\\s:]*`, "i"), "").trim();
  }
  clean = clean.replace(/\|\s*[^|]+$/, "").trim();
  clean = clean.replace(/\s+on\s+[A-Za-z]+$/, "").trim();
  return clean || `${platform.charAt(0).toUpperCase() + platform.slice(1)} Media`;
}
function extractDuration(text) {
  if (!text) return "";
  const durationMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (durationMatch) {
    return `${durationMatch[1]}:${durationMatch[2]}`;
  }
  return "";
}
function extractAuthor(text) {
  if (!text) return "";
  const authorMatch = text.match(/by\s+([^,\n]+)/i) || text.match(/@(\w+)/) || text.match(/([A-Z][a-z]+)\s+[A-Z][a-z]+/);
  return authorMatch ? authorMatch[1].trim() : "";
}
function getQualityScore(resolution) {
  if (!resolution) return 0;
  const res = resolution.toLowerCase();
  if (res.includes("4k") || res.includes("2160") || res.includes("uhd")) return 4e3;
  if (res.includes("2k") || res.includes("1440")) return 2e3;
  if (res.includes("1080") || res.includes("hd") || res.includes("fullhd") || res.includes("fhd")) return 1080;
  if (res.includes("720") || res.includes("hd")) return 720;
  if (res.includes("480") || res.includes("sd")) return 480;
  if (res.includes("360")) return 360;
  if (res.includes("240")) return 240;
  const pixelMatch = res.match(/(\d+)[x×](\d+)/);
  if (pixelMatch) {
    const height = parseInt(pixelMatch[2]);
    if (height >= 2160) return 4e3;
    if (height >= 1440) return 2e3;
    if (height >= 1080) return 1080;
    if (height >= 720) return 720;
    if (height >= 480) return 480;
    if (height >= 360) return 360;
    return height;
  }
  const pMatch = res.match(/(\d+)p/);
  if (pMatch) {
    const height = parseInt(pMatch[1]);
    return height;
  }
  if (res.includes("high") || res.includes("best") || res.includes("original")) return 1e3;
  if (res.includes("medium") || res.includes("normal")) return 500;
  if (res.includes("low") || res.includes("worst")) return 100;
  return 500;
}
function getQualityLabel$1(quality) {
  if (quality >= 4e3) return "4K Ultra HD";
  if (quality >= 2e3) return "2K HD";
  if (quality >= 1080) return "Full HD (1080p)";
  if (quality >= 720) return "HD (720p)";
  if (quality >= 480) return "SD (480p)";
  if (quality >= 360) return "Low (360p)";
  if (quality >= 240) return "Very Low (240p)";
  return "Standard";
}
const snapsave = async (url) => {
  try {
    const cacheKey = url;
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return { success: true, data: cached.data };
    }
    const regexList = [facebookRegex, instagramRegex, twitterRegex, tiktokRegex, youtubeRegex];
    const isValid = regexList.some((regex) => url.match(regex));
    if (!isValid) return { success: false, message: "Invalid URL" };
    const isTwitter = url.match(twitterRegex);
    const isTiktok = url.match(tiktokRegex);
    const isYoutube = url.match(youtubeRegex);
    const formData = new URLSearchParams();
    formData.append("url", normalizeURL(url));
    if (isTiktok) {
      const response2 = await fetch("https://snaptik.app/", {
        headers: {
          "user-agent": userAgent,
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.5",
          "cache-control": "no-cache"
        }
      });
      const homeHtml = await response2.text();
      const load2 = await getCheerioLoad();
      const $2 = load2(homeHtml);
      const token = $2("input[name='token']").val();
      if (token) {
        formData.append("token", token);
      }
      const response22 = await fetch("https://snaptik.app/abc2.php", {
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
      const data2 = await response22.text();
      const decode2 = decryptSnaptik(data2);
      const $3 = load2(decode2);
      const downloadLinks = [];
      $3("a").each((_, el) => {
        const href = $3(el).attr("href");
        const text = $3(el).text().trim();
        if (href && (href.includes("snaptik") || href.includes("tikmate") || href.includes("download") || $3(el).hasClass("download-file"))) {
          let quality = 0;
          if (text.includes("HD") || text.includes("1080")) quality = 1080;
          else if (text.includes("720")) quality = 720;
          else if (text.includes("480")) quality = 480;
          else if (text.includes("360")) quality = 360;
          else quality = 500;
          downloadLinks.push({
            url: href,
            quality,
            text,
            type: text.includes("photo") || text.includes("Photo") ? "image" : "video"
          });
        }
      });
      downloadLinks.sort((a, b) => b.quality - a.quality);
      const bestLink = downloadLinks[0];
      let _url = bestLink?.url;
      const type = bestLink?.type || "video";
      if (bestLink && bestLink.quality < 1e3) {
        const hdLink = downloadLinks.find((link) => link.quality >= 1e3);
        if (hdLink) {
          _url = hdLink.url;
          bestLink.quality = hdLink.quality;
        }
      }
      let description = $3(".video-title").text().trim() || $3(".video-des").text().trim() || $3("h3").first().text().trim() || $3(".desc").text().trim() || $3(".video-description").text().trim() || $3("p").first().text().trim() || $3(".title").text().trim();
      const title = extractCleanTitle(description, "tiktok");
      const duration = extractDuration($3(".video-duration").text().trim() || $3(".duration").text().trim() || "");
      const author = extractAuthor($3(".author").text().trim() || $3(".username").text().trim() || "");
      if (description) {
        description = description.replace(/\s+/g, " ").trim();
        description = description.replace(/^(TikTok|Video|Download|Share)[\s:]*/, "").trim();
      }
      let preview = $3("#thumbnail").attr("src") || $3("img[src*='tiktok']").first().attr("src") || $3(".video-thumb img").first().attr("src") || $3("img").first().attr("src");
      if (!_url) {
        $3("a").each((_, el) => {
          const href = $3(el).attr("href");
          if (href && (href.includes("download") || href.includes("snaptik") || href.includes("tikmate"))) {
            _url = href;
            return false;
          }
        });
      }
      if (!description || description.length < 3) {
        description = "TikTok Video";
      }
      const result2 = {
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
            qualityLabel: getQualityLabel$1(bestLink?.quality || 0)
          }]
        }
      };
      responseCache.set(cacheKey, { data: result2.data, timestamp: Date.now() });
      return result2;
    }
    if (isYoutube) {
      try {
        const videoId = extractYouTubeVideoId(url);
        if (!videoId) {
          return { success: false, message: "Invalid YouTube URL" };
        }
        try {
          const y2mateUrl = `https://www.y2mate.com/youtube/${videoId}`;
          const y2mateResponse = await fetch(y2mateUrl, {
            headers: {
              "user-agent": userAgent,
              "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "accept-language": "en-US,en;q=0.5",
              "cache-control": "no-cache",
              "pragma": "no-cache"
            }
          });
          if (y2mateResponse.ok) {
            const y2mateHtml = await y2mateResponse.text();
            const downloadLinkRegex = /href="([^"]*y2mate\.com\/download[^"]*)"[^>]*>([^<]*Download[^<]*)</gi;
            const y2mateLinks = [];
            let match;
            while ((match = downloadLinkRegex.exec(y2mateHtml)) !== null) {
              const href = match[1];
              const text = match[2];
              let quality = 0;
              if (text.includes("4K") || text.includes("2160")) quality = 4e3;
              else if (text.includes("2K") || text.includes("1440")) quality = 2e3;
              else if (text.includes("1080") || text.includes("HD")) quality = 1080;
              else if (text.includes("720")) quality = 720;
              else if (text.includes("480")) quality = 480;
              else if (text.includes("360")) quality = 360;
              else quality = 500;
              y2mateLinks.push({
                url: href,
                quality,
                text: text.trim(),
                type: "video"
              });
            }
            if (y2mateLinks.length > 0) {
              y2mateLinks.sort((a, b) => b.quality - a.quality);
              const bestLink = y2mateLinks[0];
              const result3 = {
                success: true,
                data: {
                  title: `YouTube Video ${videoId}`,
                  description: "YouTube video download via y2mate.com",
                  preview: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                  duration: "",
                  author: "YouTube Creator",
                  thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                  media: [{
                    url: bestLink.url,
                    type: "video",
                    title: `YouTube Video ${videoId}`,
                    duration: "",
                    author: "YouTube Creator",
                    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                    quality: bestLink.quality,
                    qualityLabel: getQualityLabel$1(bestLink.quality)
                  }]
                }
              };
              responseCache.set(cacheKey, { data: result3.data, timestamp: Date.now() });
              return result3;
            }
          }
        } catch (y2mateError) {
          console.log("\u26A0\uFE0F y2mate.com failed:", y2mateError.message);
        }
        try {
          const ytDownloadUrl = `https://yt-download.org/download/${videoId}`;
          const ytDownloadResponse = await fetch(ytDownloadUrl, {
            headers: {
              "user-agent": userAgent,
              "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "accept-language": "en-US,en;q=0.5"
            }
          });
          if (ytDownloadResponse.ok) {
            const ytDownloadHtml = await ytDownloadResponse.text();
            const downloadLinkRegex = /href="([^"]*download[^"]*)"[^>]*>([^<]*Download[^<]*)</gi;
            const ytDownloadLinks = [];
            let match;
            while ((match = downloadLinkRegex.exec(ytDownloadHtml)) !== null) {
              const href = match[1];
              const text = match[2];
              let quality = 0;
              if (text.includes("4K") || text.includes("2160")) quality = 4e3;
              else if (text.includes("2K") || text.includes("1440")) quality = 2e3;
              else if (text.includes("1080") || text.includes("HD")) quality = 1080;
              else if (text.includes("720")) quality = 720;
              else if (text.includes("480")) quality = 480;
              else if (text.includes("360")) quality = 360;
              else quality = 500;
              ytDownloadLinks.push({
                url: href,
                quality,
                text: text.trim(),
                type: "video"
              });
            }
            if (ytDownloadLinks.length > 0) {
              ytDownloadLinks.sort((a, b) => b.quality - a.quality);
              const bestLink = ytDownloadLinks[0];
              const result3 = {
                success: true,
                data: {
                  title: `YouTube Video ${videoId}`,
                  description: "YouTube video download via yt-download.org",
                  preview: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                  duration: "",
                  author: "YouTube Creator",
                  thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                  media: [{
                    url: bestLink.url,
                    type: "video",
                    title: `YouTube Video ${videoId}`,
                    duration: "",
                    author: "YouTube Creator",
                    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                    quality: bestLink.quality,
                    qualityLabel: getQualityLabel$1(bestLink.quality)
                  }]
                }
              };
              responseCache.set(cacheKey, { data: result3.data, timestamp: Date.now() });
              return result3;
            }
          }
        } catch (ytDownloadError) {
          console.log("\u26A0\uFE0F yt-download.org failed:", ytDownloadError.message);
        }
        const result2 = {
          success: true,
          data: {
            title: `YouTube Video ${videoId}`,
            description: "YouTube video download - direct download links available",
            preview: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            duration: "",
            author: "YouTube Creator",
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            media: [
              // High quality options
              {
                url: `https://www.y2mate.com/download-youtube/${videoId}_1080p`,
                type: "video",
                title: `YouTube Video ${videoId} - 1080p`,
                duration: "",
                author: "YouTube Creator",
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                quality: 1080,
                qualityLabel: getQualityLabel$1(1080)
              },
              {
                url: `https://www.y2mate.com/download-youtube/${videoId}_720p`,
                type: "video",
                title: `YouTube Video ${videoId} - 720p`,
                duration: "",
                author: "YouTube Creator",
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                quality: 720,
                qualityLabel: getQualityLabel$1(720)
              },
              {
                url: `https://www.y2mate.com/download-youtube/${videoId}_480p`,
                type: "video",
                title: `YouTube Video ${videoId} - 480p`,
                duration: "",
                author: "YouTube Creator",
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                quality: 480,
                qualityLabel: getQualityLabel$1(480)
              }
            ]
          }
        };
        responseCache.set(cacheKey, { data: result2.data, timestamp: Date.now() });
        return result2;
      } catch (error) {
        return {
          success: false,
          message: `YouTube download failed: ${error instanceof Error ? error.message : "Unknown error"}`
        };
      }
    }
    if (isTwitter) {
      const response2 = await fetch("https://twitterdownloader.snapsave.app/", {
        headers: {
          "user-agent": userAgent,
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });
      const homeHtml = await response2.text();
      const load2 = await getCheerioLoad();
      const $2 = load2(homeHtml);
      const token = $2("input[name='token']").val();
      if (token) {
        formData.append("token", token);
      }
      const response22 = await fetch("https://twitterdownloader.snapsave.app/action.php", {
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
      const data2 = await response22.json();
      const html2 = data2?.data;
      const $22 = load2(html2);
      const twitterLinks = [];
      $22("a").each((_, el) => {
        const href = $22(el).attr("href");
        const text = $22(el).text().trim();
        if (href && (href.includes("download") || href.includes("rapidcdn") || href.includes("snapsave"))) {
          let quality = 0;
          if (text.includes("HD") || href.includes("hd") || text.includes("1080")) quality = 1080;
          else if (text.includes("720")) quality = 720;
          else if (text.includes("480")) quality = 480;
          else quality = 500;
          twitterLinks.push({
            url: href,
            quality,
            text,
            type: text.includes("photo") || text.includes("Photo") ? "image" : "video"
          });
        }
      });
      twitterLinks.sort((a, b) => b.quality - a.quality);
      const bestTwitterLink = twitterLinks[0];
      let _url = bestTwitterLink?.url;
      const type = bestTwitterLink?.type || "video";
      if (bestTwitterLink && bestTwitterLink.quality < 1e3) {
        const hdLink = twitterLinks.find((link) => link.quality >= 1e3);
        if (hdLink) {
          _url = hdLink.url;
          bestTwitterLink.quality = hdLink.quality;
        }
      }
      let description = $22(".videotikmate-middle > p > span").text().trim() || $22(".video-title").text().trim() || $22("p").first().text().trim() || $22(".desc").text().trim() || $22("h3").text().trim();
      const title = extractCleanTitle(description, "twitter");
      const duration = extractDuration($22(".video-duration").text().trim() || $22(".duration").text().trim() || "");
      const author = extractAuthor($22(".author").text().trim() || $22(".username").text().trim() || "");
      if (description) {
        description = description.replace(/\s+/g, " ").trim();
        description = description.replace(/^(Twitter|X|Video|Download|Share)[\s:]*/, "").trim();
      }
      let preview = $22(".videotikmate-left > img").attr("src") || $22("img[src*='pbs.twimg']").first().attr("src") || $22("img").first().attr("src");
      if (!description || description.length < 3) {
        description = "Twitter/X Post";
      }
      const result2 = {
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
            qualityLabel: getQualityLabel$1(bestTwitterLink?.quality || 0)
          }]
        }
      };
      responseCache.set(cacheKey, { data: result2.data, timestamp: Date.now() });
      return result2;
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
    const data = {};
    const media = [];
    if ($("table.table").length || $("article.media > figure").length) {
      if (url.includes("instagram") && $("div.card").length > 1) {
        const carouselItems = [];
        $("div.card").each((_, el) => {
          const cardBody = $(el).find("div.card-body");
          const aText = cardBody.find("a").text().trim();
          let cardUrl = cardBody.find("a").attr("href");
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
              quality: aText.includes("HD") || aText.includes("1080") ? 1e3 : aText.includes("720") ? 720 : aText.includes("480") ? 480 : 500
            });
          }
        });
        if (carouselItems.length > 0) {
          carouselItems.forEach((item) => {
            media.push({
              ...item,
              quality: item.quality || 0,
              qualityLabel: getQualityLabel$1(item.quality || 0)
            });
          });
          return { success: true, data: { ...data, media } };
        }
      }
      let description = $("span.video-des").text().trim() || $(".video-title").text().trim() || $("h1").first().text().trim() || $("h2").first().text().trim() || $("h3").first().text().trim() || $(".title").text().trim() || $(".desc").text().trim() || $(".video-description").text().trim() || $("p").first().text().trim() || $("meta[property='og:title']").attr("content") || $("title").text().trim();
      const platform = url.includes("instagram") ? "instagram" : "facebook";
      const title = extractCleanTitle(description, platform);
      const duration = extractDuration($(".video-duration").text().trim() || $(".duration").text().trim() || "");
      const author = extractAuthor($(".author").text().trim() || $(".username").text().trim() || "");
      if (description) {
        description = description.replace(/\s+/g, " ").trim();
        description = description.replace(/^(Facebook|Instagram|Video|Watch|Share|Download)[\s:]*/, "").trim();
        description = description.replace(/\|\s*Facebook$/, "").trim();
        description = description.replace(/on Facebook$/, "").trim();
      }
      const preview = $("article.media > figure").find("img").attr("src") || $("img[src*='fbcdn']").first().attr("src") || $("img[src*='instagram']").first().attr("src") || $(".video-preview img").first().attr("src") || $("img").first().attr("src");
      data.title = title || `${platform.charAt(0).toUpperCase() + platform.slice(1)} Media`;
      data.description = description && description.length >= 3 ? description : `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`;
      data.preview = preview;
      data.duration = duration;
      data.author = author;
      data.thumbnail = preview;
      if ($("table.table").length) {
        const mediaItems = [];
        $("tbody > tr").each((_, el) => {
          const $el = $(el);
          const $td = $el.find("td");
          const resolution = $td.eq(0).text().trim();
          let _url = $td.eq(2).find("a").attr("href") || $td.eq(2).find("button").attr("onclick");
          const shouldRender = /get_progressApi/ig.test(_url || "");
          if (shouldRender) {
            _url = "https://snapsave.app" + /get_progressApi\('(.*?)'\)/.exec(_url || "")?.[1] || _url;
          }
          if (_url && _url.includes("&dl=1&dl=1")) {
            _url = _url.replace("&dl=1&dl=1", "&dl=1");
          }
          mediaItems.push({
            resolution,
            ...shouldRender ? { shouldRender } : {},
            url: _url,
            // Better type detection for Instagram carousels
            type: (() => {
              if (url.includes("instagram")) {
                const rowText = $el.text().toLowerCase();
                if (rowText.includes("photo") || rowText.includes("image") || !resolution) {
                  return "image";
                }
              }
              return resolution ? "video" : "image";
            })(),
            title: data.title,
            duration: data.duration,
            author: data.author,
            thumbnail: data.thumbnail,
            quality: getQualityScore(resolution)
          });
        });
        mediaItems.sort((a, b) => {
          return (b.quality || 0) - (a.quality || 0);
        });
        if (mediaItems.length > 0) {
          if (url.includes("instagram")) {
            mediaItems.forEach((item) => {
              media.push({
                ...item,
                quality: item.quality || 0,
                qualityLabel: getQualityLabel$1(item.quality || 0)
              });
            });
          } else {
            const bestQuality = mediaItems[0];
            media.push({
              ...bestQuality,
              quality: bestQuality.quality || 0,
              qualityLabel: getQualityLabel$1(bestQuality.quality || 0)
            });
          }
        }
      } else if ($("div.card").length) {
        const cardItems = [];
        $("div.card").each((_, el) => {
          const cardBody = $(el).find("div.card-body");
          const aText = cardBody.find("a").text().trim();
          let url2 = cardBody.find("a").attr("href");
          const type = aText.includes("Photo") ? "image" : "video";
          if (url2 && url2.includes("&dl=1&dl=1")) {
            url2 = url2.replace("&dl=1&dl=1", "&dl=1");
          }
          cardItems.push({
            url: url2,
            type,
            title: data.title,
            duration: data.duration,
            author: data.author,
            thumbnail: data.thumbnail,
            quality: aText.includes("HD") || aText.includes("1080") ? 1e3 : aText.includes("720") ? 720 : aText.includes("480") ? 480 : 360
          });
        });
        cardItems.sort((a, b) => b.quality - a.quality);
        if (cardItems.length > 0) {
          if (url.includes("instagram")) {
            cardItems.forEach((item) => {
              media.push({
                ...item,
                quality: item.quality || 0,
                qualityLabel: getQualityLabel$1(item.quality || 0)
              });
            });
          } else {
            const bestQuality = cardItems[0];
            media.push({
              ...bestQuality,
              quality: bestQuality.quality || 0,
              qualityLabel: getQualityLabel$1(bestQuality.quality || 0)
            });
          }
        }
      } else {
        let url2 = $("a[href*='download']").attr("href") || $("a").first().attr("href") || $("button").attr("onclick");
        const aText = $("a").text().trim() || $("button").text().trim();
        const type = aText.includes("Photo") || aText.includes("photo") ? "image" : "video";
        if (!url2) {
          $("a").each((_, el) => {
            const href = $(el).attr("href");
            if (href && (href.includes("download") || href.includes("snapsave") || href.includes("rapidcdn"))) {
              url2 = href;
              return false;
            }
          });
        }
        media.push({
          url: url2,
          type
        });
      }
    } else if ($("div.download-items").length) {
      const downloadItems = [];
      $("div.download-items").each((_, el) => {
        const itemThumbnail = $(el).find("div.download-items__thumb > img").attr("src");
        const itemBtn = $(el).find("div.download-items__btn");
        let url2 = itemBtn.find("a").attr("href");
        const spanText = itemBtn.find("span").text().trim();
        const type = spanText.includes("Photo") ? "image" : "video";
        if (url2 && url2.includes("&dl=1&dl=1")) {
          url2 = url2.replace("&dl=1&dl=1", "&dl=1");
        }
        downloadItems.push({
          url: url2,
          ...type === "video" ? {
            thumbnail: itemThumbnail ? fixThumbnail(itemThumbnail) : void 0
          } : {},
          type,
          title: data.title,
          duration: data.duration,
          author: data.author,
          quality: spanText.includes("HD") || url2?.includes("hd") ? 1e3 : spanText.includes("720") ? 720 : 360
        });
      });
      downloadItems.sort((a, b) => b.quality - a.quality);
      if (downloadItems.length > 0) {
        if (url.includes("instagram")) {
          downloadItems.forEach((item) => {
            media.push({
              ...item,
              quality: item.quality || 0,
              qualityLabel: getQualityLabel$1(item.quality || 0)
            });
          });
        } else {
          const bestQuality = downloadItems[0];
          media.push({
            ...bestQuality,
            quality: bestQuality.quality || 0,
            qualityLabel: getQualityLabel$1(bestQuality.quality || 0)
          });
        }
      }
    }
    if (!media.length) return { success: false, message: "Blank data" };
    const result = { success: true, data: { ...data, media } };
    responseCache.set(cacheKey, { data: result.data, timestamp: Date.now() });
    return result;
  } catch (e) {
    return { success: false, message: "Something went wrong" };
  }
};

export { batchDownload, downloadAllMedia, downloadAllPhotos, downloadMultipleTimes, enhancedDownload, getDownloadInfo, snapsave };
