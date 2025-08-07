import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clinicId = searchParams.get('clinicId');

  if (!clinicId) {
    return NextResponse.json({ error: 'clinicId required' }, { status: 400 });
  }

  try {
    // Get URLs from index
    const { data: urlIndex, error: urlError } = await supabase
      .from('clinic_url_index')
      .select('url, title, page_type, is_accessible, http_status, created_at')
      .eq('clinic_id', parseInt(clinicId))
      .order('created_at', { ascending: false });

    if (urlError) throw urlError;

    // Get cached pages
    const { data: cachedPages, error: pagesError } = await supabase
      .from('clinic_pages')
      .select('url, title, created_at')
      .eq('clinic_id', parseInt(clinicId))
      .order('created_at', { ascending: false });

    if (pagesError) throw pagesError;

    return NextResponse.json({
      clinicId: parseInt(clinicId),
      urlIndex: urlIndex || [],
      cachedPages: cachedPages || [],
      summary: {
        totalUrls: urlIndex?.length || 0,
        accessibleUrls: urlIndex?.filter(u => u.is_accessible).length || 0,
        cachedPages: cachedPages?.length || 0,
        pageTypes: [...new Set(urlIndex?.map(u => u.page_type).filter(Boolean))]
      }
    });

  } catch (error) {
    console.error('Failed to check URLs:', error);
    return NextResponse.json({ error: 'Failed to check URLs' }, { status: 500 });
  }
}