import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  
  // Delete the session cookie
  cookieStore.delete({
    name: 'session_token',
    path: '/',
  });
  
  // Redirect to login
  return NextResponse.redirect('/login');
}