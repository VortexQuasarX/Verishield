import { NextRequest, NextResponse } from 'next/server';

// Legacy route - redirects to the DB-backed nexus/tasks endpoint
export async function GET(request: NextRequest) {
  const baseUrl = new URL(request.url).origin;
  const response = await fetch(`${baseUrl}/api/nexus/tasks`, {
    headers: request.headers,
  });
  const data = await response.json();
  return NextResponse.json(data);
}
