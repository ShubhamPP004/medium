import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const articlesPath = path.join(process.cwd(), 'public', 'data', 'articles.json');
    
    if (!fs.existsSync(articlesPath)) {
      // Fallback: try parent directory
      const fallbackPath = path.join(process.cwd(), '..', 'marketing-cloud-next-public', 'articles.json');
      if (fs.existsSync(fallbackPath)) {
        const data = fs.readFileSync(fallbackPath, 'utf8');
        return NextResponse.json(JSON.parse(data));
      }
      return NextResponse.json({ error: 'articles.json not found' }, { status: 404 });
    }
    
    const data = fs.readFileSync(articlesPath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load articles' },
      { status: 500 }
    );
  }
}
