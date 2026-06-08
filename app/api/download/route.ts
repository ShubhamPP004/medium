import { NextResponse } from 'next/server';

const GITHUB_LATEST_DOCX = 'https://github.com/ShubhamPP004/medium/releases/latest/download/Marketing_Cloud_Next_Public.docx';

export async function GET() {
  try {
    // Always use GitHub latest release URL (auto-updates with each new release)
    return NextResponse.json({
      externalUrl: GITHUB_LATEST_DOCX,
      message: 'Redirect to latest release download',
    });
    console.error('Download error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to serve DOCX' },
      { status: 500 }
    );
  }
}
