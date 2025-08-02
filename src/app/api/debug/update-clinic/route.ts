import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { clinicId, websiteUrl } = await request.json();

    if (!clinicId || !websiteUrl) {
      return NextResponse.json(
        { error: 'clinicId and websiteUrl are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(websiteUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Update the clinic with website URL and RAG configuration
    const { data, error } = await supabase
      .from('clinics')
      .update({
        website_url: websiteUrl,
        // Set default RAG configuration if not already set
        rag_confidence_threshold: 0.6,
        rag_cache_ttl_hours: 24,
        enable_web_search: true,
        max_web_pages_per_query: 3
      })
      .eq('id', clinicId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      clinic: data,
      message: 'Clinic website URL and RAG configuration updated successfully'
    });

  } catch (error) {
    console.error('Failed to update clinic:', error);
    return NextResponse.json(
      { error: 'Failed to update clinic' },
      { status: 500 }
    );
  }
}