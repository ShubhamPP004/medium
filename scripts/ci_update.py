#!/usr/bin/env python3
"""Public auto-update: no login required, all network requests via browser.

The system Python (3.9) with LibreSSL 2.8.3 cannot connect to medium.com.
Playwright browser uses its own TLS stack, so we use it for ALL requests:
- RSS feed fetch (via context.request API)
- Image downloads (via browser evaluate + fetch)
- No system urllib/curl needed at all for network
"""
import asyncio
import base64
import hashlib
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from playwright.async_api import async_playwright
import xml.etree.ElementTree as ET

# Paths
REPO_ROOT = Path(__file__).parent.parent.resolve()
LOGS_DIR = REPO_ROOT / ".logs"
IMAGES_DIR = REPO_ROOT / "images"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)
CHROME_PROFILE = REPO_ROOT / ".chrome_profile"

ARTICLES_FILE = REPO_ROOT / "public" / "data" / "articles.json"
URLS_FILE = REPO_ROOT / "urls.json"
NEW_URLS_FILE = REPO_ROOT / "new_urls.json"
STATS_FILE = REPO_ROOT / "public" / "data" / "stats.json"
IMAGE_MAP_FILE = REPO_ROOT / "image_map.json"

# Config
RSS_URL = "https://medium.com/feed/@marketingcloudtips"
EXCLUDED_URLS = {
    "https://medium.com/@marketingcloudtips",
    "https://medium.com/marketing-cloud-next-growth-advanced-deep-dives",
    "https://medium.com/@francois-perret",
}

CHROME_PATHS = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Chrome",
    "/Applications/Chrome.app/Contents/MacOS/Google Chrome",
]


def log(msg):
    print(f"[auto-update] {msg}")
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    with open(LOGS_DIR / "auto_update.log", "a") as f:
        f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')} {msg}\n")


def md5_hash(text):
    return hashlib.md5(text.encode()).hexdigest()


def find_chrome():
    for p in CHROME_PATHS:
        if os.path.exists(p):
            return p
    return None


def get_next_image_index():
    if not IMAGE_MAP_FILE.exists():
        return 0
    image_map = json.load(open(IMAGE_MAP_FILE))
    indices = []
    for path in image_map.values():
        match = re.match(r"img_(\d+)_", path)
        if match:
            indices.append(int(match.group(1)))
    return max(indices, default=-1) + 1


STEALTH_ARGS = [
    '--disable-blink-features=AutomationControlled',
    '--disable-features=IsolateOrigins,site-per-process',
    '--disable-site-isolation-trials',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-client-side-phishing-detection',
    '--disable-default-apps',
    '--disable-hang-monitor',
    '--disable-popup-blocking',
    '--disable-prompt-on-repost',
    '--disable-sync',
    '--disable-translate',
    '--metrics-recording-only',
    '--safebrowsing-disable-auto-update',
    '--ignore-certificate-errors',
    '--ignore-ssl-errors',
    '--ignore-certificate-errors-spki-list',
    '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
]


async def launch_browser(p, headless=True):
    """Launch Chrome or Playwright Chromium with persistent profile."""
    chrome = find_chrome()
    CHROME_PROFILE.mkdir(parents=True, exist_ok=True)

    args = STEALTH_ARGS.copy()
    if headless:
        args.append('--headless=new')

    if chrome:
        log(f"Using Chrome: {chrome}")
        try:
            context = await p.chromium.launch_persistent_context(
                str(CHROME_PROFILE),
                executable_path=chrome,
                headless=headless,
                args=args,
                no_viewport=False,
                viewport={'width': 1920, 'height': 1080},
            )
            page = await context.new_page()
            return None, page, context
        except Exception as e:
            log(f"Chrome persistent launch failed: {e}")
            log("Falling back to Playwright Chromium...")

    log("Using Playwright Chromium")
    context = await p.chromium.launch_persistent_context(
        str(CHROME_PROFILE),
        headless=headless,
        args=args,
        no_viewport=False,
        viewport={'width': 1920, 'height': 1080},
    )
    page = await context.new_page()
    return None, page, context


async def fetch_rss_via_api(context):
    """Fetch Medium RSS feed via Playwright API request (uses browser's TLS, no CORS)."""
    log("Fetching RSS feed via Playwright API request...")
    try:
        response = await context.request.get(RSS_URL, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
        })

        if not response.ok:
            log(f"API request failed: HTTP {response.status}")
            return None

        xml_text = await response.text()
        if not xml_text or not xml_text.strip():
            log("API request returned empty body")
            return None

        # Parse XML
        root = ET.fromstring(xml_text)
        channel = root.find('channel')
        items = channel.findall('item')
        log(f"RSS feed returned {len(items)} items")

        articles = []
        for item in items:
            title_elem = item.find('title')
            link_elem = item.find('link')
            guid_elem = item.find('guid')
            pubDate_elem = item.find('pubDate')
            content_elem = item.find('{http://purl.org/rss/1.0/modules/content/}encoded')

            if title_elem is None or link_elem is None:
                continue

            title = title_elem.text or ''
            link = link_elem.text or ''
            guid = guid_elem.text if guid_elem is not None else link
            pubDate = pubDate_elem.text if pubDate_elem is not None else ''
            content = content_elem.text if content_elem is not None else ''

            clean_url = link.split('?')[0] if '?' in link else link

            articles.append({
                'title': title,
                'url': clean_url,
                'guid': guid,
                'pubDate': pubDate,
                'content_html': content,
            })

        log(f"Parsed {len(articles)} articles from RSS")
        return articles
    except Exception as e:
        log(f"ERROR fetching RSS feed: {e}")
        import traceback
        log(traceback.format_exc())
        return None


async def download_image_via_browser(page, url):
    """Download image via browser fetch."""
    try:
        result = await page.evaluate(f"""
            async () => {{
                try {{
                    const res = await fetch('{url}');
                    if (!res.ok) return null;
                    const buf = await res.arrayBuffer();
                    const bytes = new Uint8Array(buf);
                    let binary = '';
                    for (let i = 0; i < bytes.length; i++) {{
                        binary += String.fromCharCode(bytes[i]);
                    }}
                    return btoa(binary);
                }} catch (e) {{
                    return null;
                }}
            }}
        """)
        if not result:
            return None
        return base64.b64decode(result)
    except Exception:
        return None


def save_image(img_data, idx, url):
    """Save image bytes to disk and return relative path."""
    if len(img_data) < 200:
        return None

    if img_data[:2] == b'\xff\xd8':
        ext = 'jpg'
    elif img_data[:4] == b'GIF8':
        ext = 'gif'
    elif img_data[:4] == b'\x89PNG':
        ext = 'png'
    else:
        ext = 'png'

    filename = f"img_{idx}_{md5_hash(url)[:8]}.{ext}"
    filepath = IMAGES_DIR / filename

    with open(filepath, 'wb') as f:
        f.write(img_data)

    return f"images/{filename}"


def extract_images_from_html(html):
    """Extract image URLs from Medium HTML content."""
    img_urls = []
    for m in re.finditer(r'<img[^>]+src="([^"]+)"', html):
        img_urls.append(m.group(1))
    for m in re.finditer(r'<img[^>]+src=\'([^\']+)\'', html):
        img_urls.append(m.group(1))
    for m in re.finditer(r'background-image:\s*url\(([^)]+)\)', html):
        img_urls.append(m.group(1).strip('"\''))
    content_imgs = [u for u in img_urls if 'medium.com' in u or 'cdn-images' in u]
    content_imgs = [u for u in content_imgs if 'resize:fill:40' not in u]
    return list(set(content_imgs))


def html_to_markdown(html):
    """Convert Medium HTML content to markdown-like text for DOCX generation."""
    text = html

    text = re.sub(r'<h1[^>]*>(.*?)</h1>', r'# \1\n\n', text, flags=re.DOTALL)
    text = re.sub(r'<h2[^>]*>(.*?)</h2>', r'## \1\n\n', text, flags=re.DOTALL)
    text = re.sub(r'<h3[^>]*>(.*?)</h3>', r'### \1\n\n', text, flags=re.DOTALL)
    text = re.sub(r'<h4[^>]*>(.*?)</h4>', r'#### \1\n\n', text, flags=re.DOTALL)

    text = re.sub(r'<strong[^>]*>(.*?)</strong>', r'**\1**', text, flags=re.DOTALL)
    text = re.sub(r'<b[^>]*>(.*?)</b>', r'**\1**', text, flags=re.DOTALL)

    text = re.sub(r'<em[^>]*>(.*?)</em>', r'*\1*', text, flags=re.DOTALL)
    text = re.sub(r'<i[^>]*>(.*?)</i>', r'*\1*', text, flags=re.DOTALL)

    def link_repl(m):
        href = m.group(1)
        link_text = re.sub(r'<[^>]+>', '', m.group(2)).strip()
        return f'[{link_text}]({href})'
    text = re.sub(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', link_repl, text, flags=re.DOTALL)

    def img_repl(m):
        src = m.group(1)
        alt = m.group(2) if m.group(2) else 'Image'
        return f'![{alt}]({src})'
    text = re.sub(r'<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*/>', img_repl, text, flags=re.DOTALL)
    text = re.sub(r'<img[^>]+alt="([^"]*)"[^>]*src="([^"]+)"[^>]*/>', lambda m: f'![{m.group(1)}]({m.group(2)})', text, flags=re.DOTALL)
    text = re.sub(r'<img[^>]+src="([^"]+)"[^>]*/>', lambda m: f'![Image]({m.group(1)})', text, flags=re.DOTALL)

    text = re.sub(r'<figure[^>]*>(.*?)</figure>', r'\1\n', text, flags=re.DOTALL)
    text = re.sub(r'<figcaption[^>]*>(.*?)</figcaption>', r'\1\n', text, flags=re.DOTALL)

    def blockquote_repl(m):
        inner = re.sub(r'<[^>]+>', '', m.group(1)).strip()
        lines = inner.split('\n')
        return '\n'.join(f'> {line}' for line in lines if line.strip()) + '\n\n'
    text = re.sub(r'<blockquote[^>]*>(.*?)</blockquote>', blockquote_repl, text, flags=re.DOTALL)

    def list_repl(m):
        inner = m.group(1)
        items = re.findall(r'<li[^>]*>(.*?)</li>', inner, flags=re.DOTALL)
        result = ''
        for item in items:
            item_text = re.sub(r'<[^>]+>', '', item).strip()
            if item_text:
                result += f'- {item_text}\n'
        return result + '\n'
    text = re.sub(r'<ul[^>]*>(.*?)</ul>', list_repl, text, flags=re.DOTALL)
    text = re.sub(r'<ol[^>]*>(.*?)</ol>', list_repl, text, flags=re.DOTALL)

    text = re.sub(r'<p[^>]*>(.*?)</p>', lambda m: re.sub(r'<[^>]+>', '', m.group(1)).strip() + '\n\n', text, flags=re.DOTALL)
    text = text.replace('<br>', '\n').replace('<br/>', '\n').replace('<br />', '\n')

    text = re.sub(r'<code[^>]*>(.*?)</code>', r'`\1`', text, flags=re.DOTALL)
    text = re.sub(r'<pre[^>]*>(.*?)</pre>', lambda m: '\n'.join('    ' + line for line in m.group(1).split('\n')) + '\n', text, flags=re.DOTALL)

    text = re.sub(r'<[^>]+>', '', text)

    lines = text.split('\n')
    cleaned = []
    for line in lines:
        line = line.strip()
        if line or (cleaned and cleaned[-1]):
            cleaned.append(line)
    text = '\n'.join(cleaned)

    return text


async def main(headless=True, force_rescrape=False, chrome_path=None, skip_check=False):
    LOGS_DIR.mkdir(parents=True, exist_ok=True)

    log("=" * 60)
    log("Starting Marketing Cloud Next Public Auto-Update")
    log("=" * 60)
    log(f"Mode: {'headless' if headless else 'visible'}")
    log(f"Date: {datetime.now().isoformat()}")

    if skip_check:
        log("Skipping check: regenerating DOCX from existing articles")
        result = subprocess.run(
            ["node", "generate_docx.js"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            log(f"ERROR: {result.stderr}")
            sys.exit(1)
        log("DOCX regenerated from existing articles.")
        return

    async with async_playwright() as p:
        browser, page, context = await launch_browser(p, headless=headless)
        log("Browser launched")

        # Step 1: Fetch RSS feed via browser API request
        rss_articles = await fetch_rss_via_api(context)

        if rss_articles is None:
            log("ERROR: Could not fetch RSS feed via browser. Aborting.")
            if browser:
                await browser.close()
            else:
                await context.close()
            sys.exit(1)

        # Step 2: Load existing articles
        articles = []
        if ARTICLES_FILE.exists() and not force_rescrape:
            articles = json.load(open(ARTICLES_FILE))
            log(f"Loaded {len(articles)} existing articles")

        existing_urls = {a['url'] for a in articles}
        existing_guids = {a.get('guid', a['url']) for a in articles}

        # Find new articles
        new_articles = []
        for rss_article in rss_articles:
            if rss_article['url'] not in existing_urls and rss_article['guid'] not in existing_guids:
                new_articles.append(rss_article)

        log(f"New articles found: {len(new_articles)}")
        if new_articles:
            for a in new_articles:
                log(f"  - {a['title'][:80]}")

        if not new_articles and not force_rescrape:
            log("No new articles. DOCX is up to date.")
        else:
            if force_rescrape:
                articles = []
                new_articles = rss_articles
                log(f"Force rescrape: processing all {len(new_articles)} RSS articles")

            # Step 3: Process new articles
            next_img_idx = get_next_image_index()
            image_map = json.load(open(IMAGE_MAP_FILE)) if IMAGE_MAP_FILE.exists() else {}

            for i, rss_article in enumerate(new_articles, 1):
                log(f"\n[{i}/{len(new_articles)}] Processing: {rss_article['title'][:80]}")

                markdown = html_to_markdown(rss_article['content_html'])
                all_imgs = extract_images_from_html(rss_article['content_html'])
                log(f"  Images found: {len(all_imgs)}")

                # Download images via browser
                for img_url in all_imgs:
                    if img_url in image_map:
                        continue
                    img_data = await download_image_via_browser(page, img_url)
                    if img_data:
                        file_path = save_image(img_data, next_img_idx, img_url)
                        if file_path:
                            image_map[img_url] = file_path
                            next_img_idx += 1
                            log(f"  Downloaded: {file_path}")
                    else:
                        log(f"  Failed to download: {img_url}")

                byline = "Nobuyuki Watanabe"
                author_match = re.search(r'by\s+([A-Z][a-zA-Z\s]+)', rss_article['content_html'])
                if author_match:
                    byline = author_match.group(1).strip()

                articles.append({
                    'url': rss_article['url'],
                    'title': rss_article['title'],
                    'byline': byline,
                    'markdown': markdown,
                    'images': all_imgs,
                    'guid': rss_article['guid'],
                    'pubDate': rss_article['pubDate'],
                })

            # Save articles
            with open(ARTICLES_FILE, 'w') as f:
                json.dump(articles, f, indent=2)

            with open(IMAGE_MAP_FILE, 'w') as f:
                json.dump(image_map, f, indent=2)

            # Save URLs
            all_urls = [a['url'] for a in articles]
            with open(URLS_FILE, 'w') as f:
                json.dump(sorted(all_urls), f, indent=2)

            with open(NEW_URLS_FILE, 'w') as f:
                json.dump([a['url'] for a in new_articles], f, indent=2)

            log(f"\nTotal articles now: {len(articles)}")

        if browser:
            await browser.close()
        else:
            await context.close()

    # Step 4: Regenerate DOCX
    log("\nRegenerating DOCX...")
    docx_script = REPO_ROOT / "generate_docx.js"
    result = subprocess.run(
        ["node", str(docx_script)],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        log(f"ERROR generating DOCX: {result.stderr}")
        sys.exit(1)

    log("DOCX generated successfully!")
    docx_path = REPO_ROOT / "Marketing_Cloud_Next_Public.docx"
    log(f"Output: {docx_path}")

    # Step 5: Update stats.json
    articles = json.load(open(ARTICLES_FILE)) if ARTICLES_FILE.exists() else []
    image_count = sum(len(a.get('images', [])) for a in articles)
    docx_size_mb = docx_path.stat().st_size / (1024 * 1024) if docx_path.exists() else 0
    stats = {
        'total': len(articles),
        'newCount': 0,
        'imageCount': image_count,
        'docxSize': f"{docx_size_mb:.2f} MB",
        'docxExists': docx_path.exists(),
        'lastUpdate': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    with open(STATS_FILE, 'w') as f:
        json.dump(stats, f, indent=2)
    log(f"Stats updated: {stats['total']} articles, {stats['imageCount']} images, {stats['docxSize']}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Marketing Cloud Next Public Auto-Update")
    parser.add_argument("--headless", action="store_true", default=True, help="Run headless (default)")
    parser.add_argument("--visible", action="store_true", help="Show browser window")
    parser.add_argument("--force", action="store_true", help="Re-process all RSS articles from scratch")
    parser.add_argument("--chrome", help="Path to Chrome executable")
    parser.add_argument("--skip-check", action="store_true", help="Skip scraping, just regenerate DOCX")
    args = parser.parse_args()

    headless = not args.visible
    asyncio.run(main(
        headless=headless,
        force_rescrape=args.force,
        chrome_path=args.chrome,
        skip_check=args.skip_check
    ))
