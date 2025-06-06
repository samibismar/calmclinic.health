import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    console.log('🔍 Checking session for debug...');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('Session data:', session);
    console.log('Session error:', error);
    
    return NextResponse.json({
      hasSession: !!session,
      user: session?.user || null,
      error: error
    });
    
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json({ error: 'Failed to check session' });
  }
}