import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete({
    name: 'session_token',
    path: '/',
  });
  return NextResponse.json({ success: true });
} 