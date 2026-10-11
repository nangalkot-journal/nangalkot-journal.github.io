// প্রতিটি খবরের জন্য আলাদা পেজ + sitemap.xml + robots.txt তৈরি করে
const fs = require("fs"), path = require("path");
const SITE = "https://nangalkot-journal.github.io";
const SB_URL = "https://hcvddvwmddjqcnncbgoy.supabase.co";
const SB_KEY = "sb_publishable_15vzB7rT8stqhG3m_LvmxA_L3WASI6p";
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const fmt = t => new Date(t).toLocaleString("bn-BD", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Dhaka" });

async function getNews() {
  if (process.env.NEWS_JSON) return JSON.parse(fs.readFileSync(process.env.NEWS_JSON, "utf8"));
  const r = await fetch(SB_URL + "/rest/v1/news?select=*&order=created_at.desc&limit=1000", { headers: { apikey: SB_KEY } });
  if (!r.ok) throw new Error("Supabase error " + r.status);
  return r.json();
}

function page(n) {
  const url = SITE + "/news/" + n.id + ".html";
  const desc = n.summary || n.body.replace(/\s+/g, " ").slice(0, 150);
  const body = n.body.split(/\n+/).filter(Boolean).map(p => "<p>" + esc(p) + "</p>").join("\n");
  const ld = {
    "@context": "https://schema.org", "@type": "NewsArticle", headline: n.title, description: desc,
    articleSection: n.category, datePublished: new Date(n.created_at).toISOString(), inLanguage: "bn",
    mainEntityOfPage: url, image: n.image_url ? [n.image_url] : undefined,
    author: { "@type": "Organization", name: "নাঙ্গলকোট জার্নাল" },
    publisher: { "@type": "Organization", name: "নাঙ্গলকোট জার্নাল", logo: { "@type": "ImageObject", url: SITE + "/logo.jpg" } }
  };
  return `<!DOCTYPE html>
<html lang="bn"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(n.title)} | নাঙ্গলকোট জার্নাল</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="../logo.jpg">
<meta name="theme-color" content="#a8101a">
<meta property="og:type" content="article"><meta property="og:locale" content="bn_BD">
<meta property="og:site_name" content="নাঙ্গলকোট জার্নাল">
<meta property="og:title" content="${esc(n.title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${esc(n.image_url || SITE + "/logo.jpg")}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&family=Noto+Serif+Bengali:wght@700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{font-family:"Hind Siliguri",system-ui,sans-serif;background:#fff;color:#000;line-height:1.7}
a{color:inherit;text-decoration:none}
.top{background:#fff;border-bottom:1px solid #dcd8d4}
.top div{max-width:780px;margin:0 auto;padding:8px 14px;display:flex;align-items:center;gap:12px}
.top img{width:52px;height:52px;object-fit:contain}
.top b{display:block;font:800 22px/1.2 "Noto Serif Bengali",serif}.top b i{font-style:normal;color:#a8101a}
.top small{color:#a8101a;font-weight:600}
nav{background:#000}nav div{max-width:780px;margin:0 auto;padding:0 14px}
nav a{display:inline-block;color:#fff;padding:9px 14px;font-weight:600}nav a:hover{background:#a8101a}
main{max-width:780px;margin:0 auto;padding:22px 14px 40px}
.k{color:#a8101a;font-weight:700}
h1{font:800 32px/1.35 "Noto Serif Bengali",serif;margin:4px 0 6px}
.m{color:#5b5b5b;font-size:14px}
.big{width:100%;height:auto;margin:16px 0;display:block}
.b p{font-size:19px;line-height:1.9;margin:0 0 1em}
.btn{display:inline-block;background:#a8101a;color:#fff;padding:8px 18px;border-radius:6px;font-weight:600;margin-top:10px}
footer{background:#000;color:#bbb;text-align:center;padding:18px 14px;font-size:14px}
@media(max-width:600px){h1{font-size:25px}.b p{font-size:17px}}
</style></head><body>
<header class="top"><div><a href="../"><img src="../logo.jpg" alt="নাঙ্গলকোট জার্নাল"></a>
<a href="../"><b>নাঙ্গলকোট <i>জার্নাল</i></b><small>সত্যের পক্ষে সবসময়</small></a></div></header>
<nav><div><a href="../">হোম</a></div></nav>
<main><article>
<div class="k">${esc(n.category)}</div>
<h1>${esc(n.title)}</h1>
<div class="m">${fmt(n.created_at)}</div>
${n.image_url ? `<img class="big" src="${esc(n.image_url)}" alt="${esc(n.title)}">` : ""}
<div class="b">${body}</div>
${n.video_url ? `<p><a class="btn" href="${esc(n.video_url)}" target="_blank" rel="noopener">ভিডিও দেখুন</a></p>` : ""}
<p><a class="btn" href="../">সব খবর</a></p>
</article></main>
<footer>© নাঙ্গলকোট জার্নাল। সর্বস্বত্ব সংরক্ষিত।</footer>
</body></html>`;
}

(async () => {
  const news = await getNews();
  fs.rmSync("news", { recursive: true, force: true });
  fs.mkdirSync("news", { recursive: true });
  news.forEach(n => fs.writeFileSync(path.join("news", n.id + ".html"), page(n)));
  const urls = [`<url><loc>${SITE}/</loc><changefreq>hourly</changefreq></url>`]
    .concat(news.map(n => `<url><loc>${SITE}/news/${n.id}.html</loc><lastmod>${new Date(n.created_at).toISOString().slice(0, 10)}</lastmod></url>`));
  fs.writeFileSync("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
  fs.writeFileSync("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
  console.log("পেজ তৈরি:", news.length);
})().catch(e => { console.error(e); process.exit(1); });
