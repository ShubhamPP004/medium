import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const statsPath = path.join(process.cwd(), 'public', 'data', 'stats.json');
    
    if (!fs.existsSync(statsPath)) {
      const fallbackPath = path.join(process.cwd(), '..', 'marketing-cloud-next-public', 'stats.json');
      if (fs.existsSync(fallbackPath)) {
        const data = fs.readFileSync(fallbackPath, 'utf8');
        return NextResponse.json(JSON.parse(data));
      }
      return NextResponse.json({ error: 'stats.json not found' }, { status: 404 });
    }
    
    const data = fs.readFileSync(statsPath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load stats' },
      { status: 500 }
    );
  }
}
