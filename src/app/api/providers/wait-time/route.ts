import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch wait time for a specific provider
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    // Fetch provider's wait time
    const { data: provider, error } = await supabase
      .from('providers')
      .select('wait_time_minutes')
      .eq('id', parseInt(providerId))
      .eq('is_active', true)
      .single();

    if (error || !provider) {
      console.error('Error fetching provider wait time:', error);
      return NextResponse.json({ wait_time_minutes: null });
    }

    return NextResponse.json({ 
      wait_time_minutes: provider.wait_time_minutes || 5 // Default to 5 minutes
    });
  } catch (error) {
    console.error('Wait time GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}