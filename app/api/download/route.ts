import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Option 1: External download URL (best for large files on Vercel)
    const externalUrl = process.env.DOCX_DOWNLOAD_URL;
    if (externalUrl) {
      return NextResponse.json(
        { 
          externalUrl,
          message: 'Redirect to external download',
        },
        { 
          status: 200,
          headers: {
            'X-Download-Url': externalUrl,
          }
        }
      );
    }

    // Option 2: Serve from local file system
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'Marketing_Cloud_Next_Public.docx'),
      path.join(process.cwd(), 'public', 'data', 'Marketing_Cloud_Next_Public.docx'),
      path.join(process.cwd(), '..', 'marketing-cloud-next-public', 'Marketing_Cloud_Next_Public.docx'),
      path.join(process.cwd(), 'Marketing_Cloud_Next_Public.docx'),
    ];
    
    let docxPath: string | null = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        docxPath = p;
        break;
      }
    }
    
    if (!docxPath) {
      return NextResponse.json(
        { 
          error: 'DOCX file not found',
          instructions: [
            'The DOCX file (163 MB) exceeds Vercel free tier file limits (100 MB).',
            'To enable downloads, choose one of these options:',
            '1. Set DOCX_DOWNLOAD_URL env var to an external hosting URL (Google Drive, S3, Dropbox, etc.)',
            '2. Upload the file to Vercel Blob Storage (paid feature)',
            '3. Upgrade to a hosting plan that supports larger files',
            '',
            'Example: DOCX_DOWNLOAD_URL=https://your-storage.com/Marketing_Cloud_Next_Public.docx',
          ].join('\n'),
        },
        { status: 404 }
      );
    }
    
    const stat = fs.statSync(docxPath);
    const fileStream = fs.createReadStream(docxPath);
    
    const webStream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(chunk));
        fileStream.on('end', () => controller.close());
        fileStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        fileStream.destroy();
      },
    });
    
    return new NextResponse(webStream, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="Marketing_Cloud_Next_Public.docx"',
        'Content-Length': stat.size.toString(),
      },
    });
  } catch (err) {
    console.error('Download error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to serve DOCX' },
      { status: 500 }
    );
  }
}
