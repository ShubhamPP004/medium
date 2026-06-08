import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read current articles
    const articlesPath = path.join(process.cwd(), 'public', 'data', 'articles.json');
    let currentArticles: any[] = [];
    
    if (fs.existsSync(articlesPath)) {
      currentArticles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
    } else {
      const fallbackPath = path.join(process.cwd(), '..', 'marketing-cloud-next-public', 'articles.json');
      if (fs.existsSync(fallbackPath)) {
        currentArticles = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
      }
    }
    
    const currentUrls = new Set(currentArticles.map((a: any) => a.url));
    const currentTitles = new Set(currentArticles.map((a: any) => a.title));
    
    // Fetch RSS feed
    const rssRes = await fetch('https://medium.com/feed/@marketingcloudtips', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!rssRes.ok) {
      throw new Error(`RSS feed returned ${rssRes.status}`);
    }
    
    const rssText = await rssRes.text();
    
    // Parse RSS items
    const items: { title: string; link: string; pubDate: string | null }[] = [];
    const itemRegex = /<item[\s\S]*?<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(rssText)) !== null) {
      const itemXml = match[0];
      const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const linkMatch = itemXml.match(/<link>([^<]+)<\/link>/i);
      const pubDateMatch = itemXml.match(/<pubDate>([^<]+)<\/pubDate>/i);
      
      if (titleMatch && linkMatch) {
        let title = titleMatch[1]
          .replace(/<!\[CDATA\[/g, '')
          .replace(/\]\]>/g, '')
          .trim();
        // Decode XML entities
        title = title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
        
        const link = linkMatch[1].trim();
        const pubDate = pubDateMatch ? pubDateMatch[1].trim() : null;
        
        items.push({ title, link, pubDate });
      }
    }
    
    // Find new articles (by URL or by title)
    const newArticles = items.filter(
      item => !currentUrls.has(item.link) && !currentTitles.has(item.title)
    );
    
    return NextResponse.json({
      success: true,
      checkedAt: new Date().toISOString(),
      feedCount: items.length,
      currentCount: currentArticles.length,
      newCount: newArticles.length,
      hasNewArticles: newArticles.length > 0,
      newArticles: newArticles.map(a => ({
        title: a.title,
        url: a.link,
        pubDate: a.pubDate,
      })),
      latestFeedArticle: items[0] || null,
    });
  } catch (err) {
    console.error('Check updates error:', err);
    return NextResponse.json(
      { 
        success: false,
        error: err instanceof Error ? err.message : 'Failed to check updates',
        checkedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
