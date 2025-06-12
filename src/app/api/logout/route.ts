import { NextResponse } from 'next/server';

export async function POST() {
  // Create response
  const response = NextResponse.json({ success: true });
  
  // Clear the auth cookie
  response.cookies.delete('auth_user_id');
  
  return response;
}