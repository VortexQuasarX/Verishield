import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

const ANGULAR_DIR = join(process.cwd(), 'public', 'angular', 'browser');

const CONTENT_TYPES: Record<string, string> = {
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  json: 'application/json',
  ico: 'image/x-icon',
  png: 'image/png',
  svg: 'image/svg+xml',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  map: 'application/json',
};

function getContentType(filename: string): string {
  const ext = filename.split('.').pop() || '';
  return CONTENT_TYPES[ext] || 'application/octet-stream';
}

export async function GET(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const relativePath = pathname.replace(/^\/angular\/?/, '') || 'index.html';
    const filePath = join(ANGULAR_DIR, relativePath);

    try {
      const fileStat = await stat(filePath);
      if (fileStat.isFile()) {
        const content = await readFile(filePath);
        const contentType = getContentType(relativePath);
        const isHashedAsset = contentType === 'application/javascript' || contentType === 'text/css';
        const cacheControl = contentType === 'text/html'
          ? 'no-cache, no-store, must-revalidate'
          : isHashedAsset
            ? 'public, max-age=3600, must-revalidate'
            : 'public, max-age=86400';
        return new NextResponse(content, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': cacheControl,
          },
        });
      }
    } catch {
      // File not found, fall through to SPA fallback
    }

    // SPA fallback
    const indexPath = join(ANGULAR_DIR, 'index.html');
    const html = await readFile(indexPath, 'utf-8');
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    return new NextResponse('Angular app not built', { status: 500 });
  }
}
