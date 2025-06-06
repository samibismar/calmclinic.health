

async function isSessionValid(token: string): Promise<boolean> {
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!SERVICE_ROLE_KEY || !SUPABASE_URL) return false;

  const response = await fetch(`${SUPABASE_URL}/rest/v1/sessions?token=eq.${token}&select=expires_at`, {
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      Accept: 'application/json',
    },
  });

  if (!response.ok) return false;

  const sessions = await response.json();

  if (sessions.length === 0) return false;

  const expiresAt = new Date(sessions[0].expires_at);
  const now = new Date();

  return expiresAt > now;
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of protected routes
const protectedRoutes = ['/dashboard'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If the route is not protected, continue
  if (!protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Get the session token from cookies
  const token = request.cookies.get('session_token')?.value;

  // If no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (!(await isSessionValid(token))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Otherwise, continue
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*']
};