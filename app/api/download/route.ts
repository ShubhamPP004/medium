import { NextResponse } from 'next/server';

const GITHUB_LATEST_DOCX = 'https://github.com/ShubhamPP004/medium/releases/latest/download/Marketing_Cloud_Next_Public.docx';

export async function GET() {
  try {
    // Use env var if set, otherwise fallback to GitHub latest release (auto-updates)
    const externalUrl = process.env.DOCX_DOWNLOAD_URL || GITHUB_LATEST_DOCX;
    return NextResponse.json({
      externalUrl,
      message: 'Redirect to external download',
    });
  } catch (err) {
    console.error('Download error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to serve DOCX' },
      { status: 500 }
    );
  }
}
