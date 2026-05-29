import { NextRequest, NextResponse } from 'next/server';

// Legacy route - redirects to the DB-backed liveid/verifications endpoint
export async function GET(request: NextRequest) {
  const baseUrl = new URL(request.url).origin;
  const response = await fetch(`${baseUrl}/api/liveid/verifications`, {
    headers: request.headers,
  });
  const data = await response.json();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const baseUrl = new URL(request.url).origin;
  const response = await fetch(`${baseUrl}/api/liveid/verifications`, {
    method: 'POST',
    headers: request.headers,
    body: await request.text(),
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
