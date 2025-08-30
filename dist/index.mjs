const facebookRegex = /^https?:\/\/(?:www\.|web\.|m\.)?facebook\.com\/(watch(\?v=|\/\?v=)[0-9]+(?!\/)|reel\/[0-9]+|[a-zA-Z0-9.\-_]+\/(videos|posts)\/[0-9]+|[0-9]+\/(videos|posts)\/[0-9]+|[a-zA-Z0-9]+\/(videos|posts)\/[0-9]+|share\/(v|r)\/[a-zA-Z0-9]+\/?)([^/?#&]+).*$|^https:\/\/fb\.watch\/[a-zA-Z0-9]+$/;
const instagramRegex = /^https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|reels|tv|stories|share)\/([^/?#&]+).*/;
const tiktokRegex = /^https?:\/\/(?:www\.|m\.|vm\.|vt\.)?tiktok\.com\/(?:@[^/]+\/(?:video|photo)\/\d+|v\/\d+|t\/[\w]+|[\w]+)\/?/;
const twitterRegex = /^https:\/\/(?:x|twitter)\.com(?:\/(?:i\/web|[^/]+)\/status\/(\d+)(?:.*)?)?$/;
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
  let cleanTitle = title.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, " ").trim().substring(0, 100);
  const defaultExtensions = {
    "video": "mp4",
    "image": "jpg"
  };
  const ext = defaultExtensions[type] || "mp4";
  return `${cleanTitle}.${ext}`;
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
    const filename = generateCleanFilename(
      data.title || bestMedia.title || "video",
      bestMedia.type || "video"
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
function getPlatform(url) {
  if (url.includes("tiktok")) return "TikTok";
  if (url.includes("twitter") || url.includes("x.com")) return "Twitter/X";
  if (url.includes("facebook")) return "Facebook";
  if (url.includes("instagram")) return "Instagram";
  return "Unknown";
}
function getBestQualityMedia(media) {
  if (!media.length) return null;
  const sortedMedia = [...media].sort((a, b) => (b.quality || 0) - (a.quality || 0));
  const videoItem = sortedMedia.find((item) => item.type === "video");
  if (videoItem) return videoItem;
  return sortedMedia[0];
}
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
  if (resolution.includes("1080") || resolution.includes("HD")) return 1e3;
  if (resolution.includes("720")) return 720;
  if (resolution.includes("480")) return 480;
  if (resolution.includes("360")) return 360;
  const match = resolution.match(/(\d+)p/);
  return match ? parseInt(match[1]) : 500;
}
const snapsave = async (url) => {
  try {
    const cacheKey = url;
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return { success: true, data: cached.data };
    }
    const regexList = [facebookRegex, instagramRegex, twitterRegex, tiktokRegex];
    const isValid = regexList.some((regex) => url.match(regex));
    if (!isValid) return { success: false, message: "Invalid URL" };
    const isTwitter = url.match(twitterRegex);
    const isTiktok = url.match(tiktokRegex);
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
            quality: bestLink?.quality || 0
          }]
        }
      };
      responseCache.set(cacheKey, { data: result2.data, timestamp: Date.now() });
      return result2;
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
            quality: bestTwitterLink?.quality || 0
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
    if (!response.ok) {
      throw new Error(`Facebook API request failed: ${response.status} ${response.statusText}`);
    }
    const html = await response.text();
    if (!html || html.length < 100) {
      throw new Error("Facebook API returned empty or invalid response");
    }
    const decode = decryptSnapSave(html);
    const load = await getCheerioLoad();
    const $ = load(decode);
    const data = {};
    const media = [];
    if ($("table.table").length || $("article.media > figure").length) {
      let description = $("span.video-des").text().trim() || $(".video-title").text().trim() || $("h1").first().text().trim() || $("h2").first().text().trim() || $("h3").first().text().trim() || $(".title").text().trim() || $(".desc").text().trim() || $(".video-description").text().trim() || $("p").first().text().trim() || $("meta[property='og:title']").attr("content") || $("title").text().trim() || $("h4").first().text().trim() || $(".video-info h3").text().trim() || $(".media-info h2").text().trim();
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
          if (_url) {
            const shouldRender = /get_progressApi/ig.test(_url);
            if (shouldRender) {
              const match = /get_progressApi\('(.*?)'\)/.exec(_url);
              if (match && match[1]) {
                _url = "https://snapsave.app" + match[1];
              }
            }
            if (_url.startsWith("javascript:")) {
              const match = /window\.open\('([^']+)'/.exec(_url);
              if (match && match[1]) {
                _url = match[1];
              }
            }
            if (_url.includes("&dl=1&dl=1")) {
              _url = _url.replace("&dl=1&dl=1", "&dl=1");
            }
            if (_url && _url.startsWith("http")) {
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
            }
          }
        });
        mediaItems.sort((a, b) => {
          return (b.quality || 0) - (a.quality || 0);
        });
        media.push(...mediaItems);
      } else if ($("div.card").length) {
        const cardItems = [];
        $("div.card").each((_, el) => {
          const cardBody = $(el).find("div.card-body");
          const aText = cardBody.find("a").text().trim();
          let url2 = cardBody.find("a").attr("href");
          const type = aText.includes("Photo") ? "image" : "video";
          if (url2) {
            if (url2.includes("get_progressApi")) {
              const match = /get_progressApi\('(.*?)'\)/.exec(url2);
              if (match && match[1]) {
                url2 = "https://snapsave.app" + match[1];
              }
            }
            if (url2.startsWith("javascript:")) {
              const match = /window\.open\('([^']+)'/.exec(url2);
              if (match && match[1]) {
                url2 = match[1];
              }
            }
            if (url2.includes("&dl=1&dl=1")) {
              url2 = url2.replace("&dl=1&dl=1", "&dl=1");
            }
            if (url2 && url2.startsWith("http")) {
              cardItems.push({
                url: url2,
                type,
                title: data.title,
                duration: data.duration,
                author: data.author,
                thumbnail: data.thumbnail,
                quality: aText.includes("HD") || aText.includes("1080") ? 1e3 : aText.includes("720") ? 720 : aText.includes("480") ? 480 : 360
              });
            }
          }
        });
        cardItems.sort((a, b) => b.quality - a.quality);
        cardItems.forEach((item) => {
          const { quality, ...mediaItem } = item;
          media.push(mediaItem);
        });
      } else {
        let url2 = $("a[href*='download']").attr("href") || $("a").first().attr("href") || $("button").attr("onclick");
        const aText = $("a").text().trim() || $("button").text().trim();
        const type = aText.includes("Photo") || aText.includes("photo") ? "image" : "video";
        if (url2) {
          if (url2.includes("get_progressApi")) {
            const match = /get_progressApi\('(.*?)'\)/.exec(url2);
            if (match && match[1]) {
              url2 = "https://snapsave.app" + match[1];
            }
          }
          if (url2.startsWith("javascript:")) {
            const match = /window\.open\('([^']+)'/.exec(url2);
            if (match && match[1]) {
              url2 = match[1];
            }
          }
          if (url2.includes("&dl=1&dl=1")) {
            url2 = url2.replace("&dl=1&dl=1", "&dl=1");
          }
        }
        if (!url2) {
          $("a").each((_, el) => {
            const href = $(el).attr("href");
            if (href && (href.includes("download") || href.includes("snapsave") || href.includes("rapidcdn"))) {
              url2 = href;
              return false;
            }
          });
        }
        if (url2 && url2.startsWith("http")) {
          media.push({
            url: url2,
            type,
            title: data.title,
            duration: data.duration,
            author: data.author,
            thumbnail: data.thumbnail,
            quality: 500
            // default quality
          });
        }
      }
    } else if ($("div.download-items").length) {
      const downloadItems = [];
      $("div.download-items").each((_, el) => {
        const itemThumbnail = $(el).find("div.download-items__thumb > img").attr("src");
        const itemBtn = $(el).find("div.download-items__btn");
        let url2 = itemBtn.find("a").attr("href");
        const spanText = itemBtn.find("span").text().trim();
        const type = spanText.includes("Photo") ? "image" : "video";
        if (url2) {
          if (url2.includes("get_progressApi")) {
            const match = /get_progressApi\('(.*?)'\)/.exec(url2);
            if (match && match[1]) {
              url2 = "https://snapsave.app" + match[1];
            }
          }
          if (url2.startsWith("javascript:")) {
            const match = /window\.open\('([^']+)'/.exec(url2);
            if (match && match[1]) {
              url2 = match[1];
            }
          }
          if (url2.includes("&dl=1&dl=1")) {
            url2 = url2.replace("&dl=1&dl=1", "&dl=1");
          }
          if (url2 && url2.startsWith("http")) {
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
          }
        }
      });
      downloadItems.sort((a, b) => b.quality - a.quality);
      downloadItems.forEach((item) => {
        const { quality, ...mediaItem } = item;
        media.push(mediaItem);
      });
    }
    if (!media.length) {
      const fallbackLinks = [];
      $("a").each((_, el) => {
        const href = $(el).attr("href");
        const text = $(el).text().trim();
        if (href && (href.includes("download") || href.includes("snapsave") || href.includes("rapidcdn") || href.includes("get_progressApi"))) {
          let cleanUrl = href;
          if (href.includes("get_progressApi")) {
            const match = /get_progressApi\('(.*?)'\)/.exec(href);
            if (match && match[1]) {
              cleanUrl = "https://snapsave.app" + match[1];
            }
          }
          if (href.startsWith("javascript:")) {
            const match = /window\.open\('([^']+)'/.exec(href);
            if (match && match[1]) {
              cleanUrl = match[1];
            }
          }
          if (cleanUrl && cleanUrl.startsWith("http")) {
            fallbackLinks.push({
              url: cleanUrl,
              type: text.includes("Photo") ? "image" : "video",
              title: data.title,
              duration: data.duration,
              author: data.author,
              thumbnail: data.thumbnail,
              quality: 500
            });
          }
        }
      });
      if (fallbackLinks.length > 0) {
        media.push(...fallbackLinks);
      }
    }
    if (!media.length) {
      return {
        success: false,
        message: "No download links found. Facebook may have changed their structure or the video is not accessible."
      };
    }
    const result = { success: true, data: { ...data, media } };
    responseCache.set(cacheKey, { data: result.data, timestamp: Date.now() });
    return result;
  } catch (e) {
    return { success: false, message: "Something went wrong" };
  }
};

export { batchDownload, enhancedDownload, getDownloadInfo, snapsave };
