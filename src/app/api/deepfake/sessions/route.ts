import { NextRequest, NextResponse } from 'next/server';

// Legacy route - redirects to the DB-backed deepguard/sessions endpoint
export async function GET(request: NextRequest) {
  // Forward to the real DB-backed endpoint
  const baseUrl = new URL(request.url).origin;
  const response = await fetch(`${baseUrl}/api/deepguard/sessions`, {
    headers: request.headers,
  });
  const data = await response.json();
  return NextResponse.json(data);
}
