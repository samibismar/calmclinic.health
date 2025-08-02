import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clinicId = searchParams.get('clinicId');
  const url = searchParams.get('url');

  if (!clinicId) {
    return NextResponse.json({ error: 'clinicId required' }, { status: 400 });
  }

  try {
    let query = supabase
      .from('clinic_pages')
      .select('url, title, summary, fetch_timestamp, access_count')
      .eq('clinic_id', parseInt(clinicId))
      .order('fetch_timestamp', { ascending: false });

    if (url) {
      query = query.eq('url', url);
    }

    const { data: cachedPages, error } = await query.limit(10);

    if (error) throw error;

    return NextResponse.json({
      clinicId: parseInt(clinicId),
      cachedPages: cachedPages || [],
      totalCached: cachedPages?.length || 0,
      latestFetch: cachedPages?.[0]?.fetch_timestamp || null
    });

  } catch (error) {
    console.error('Failed to get cached content:', error);
    return NextResponse.json({ error: 'Failed to get cached content' }, { status: 500 });
  }
}