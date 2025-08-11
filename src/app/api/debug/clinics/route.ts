import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: clinics, error } = await supabase
      .from('clinics')
      .select(`
        id,
        practice_name,
        slug,
        specialty,
        website_url,
        rag_confidence_threshold,
        rag_cache_ttl_hours,
        enable_web_search,
        max_web_pages_per_query,
        last_url_discovery
      `)
      .in('id', [41, 44, 45])
      .order('practice_name', { ascending: true });

    if (error) {
      throw error;
    }

    // Add some helpful metadata for both analytics and debug purposes
    const enrichedClinics = clinics?.map(clinic => ({
      ...clinic,
      hasWebsiteUrl: !!clinic.website_url,
      ragConfigured: !!(clinic.rag_confidence_threshold && clinic.enable_web_search !== null),
      lastDiscovery: clinic.last_url_discovery ? new Date(clinic.last_url_discovery).toLocaleDateString() : 'Never'
    })) || [];

    return NextResponse.json({ clinics: enrichedClinics });

  } catch (error) {
    console.error('Failed to fetch clinics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clinics' },
      { status: 500 }
    );
  }
}