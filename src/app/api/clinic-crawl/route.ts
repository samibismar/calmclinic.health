import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { HybridRAGService } from '@/lib/hybrid-rag-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ragService = new HybridRAGService();

// Helper function to get clinic from session
async function getClinicFromSession() {
  const cookieStore = await cookies();
  const authUserId = cookieStore.get('auth_user_id')?.value;
  
  if (!authUserId) {
    return null;
  }

  const { data: clinic } = await supabase
    .from('clinics')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();

  return clinic;
}

/**
 * POST - Start URL crawling for a clinic
 */
export async function POST(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { websiteUrl, forceRecrawl = false } = await request.json();

    if (!websiteUrl) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(websiteUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid website URL format' }, { status: 400 });
    }

    console.log(`🚀 Starting crawl for clinic ${clinic.id}: ${websiteUrl}`);

    // Check if we need to crawl (avoid unnecessary crawls)
    if (!forceRecrawl) {
      const { data: indexHealth } = await supabase.rpc('check_url_index_health', {
        clinic_id: clinic.id
      });

      if (indexHealth?.[0]?.total_urls > 0 && !indexHealth[0].needs_recrawl) {
        return NextResponse.json({
          message: 'URL index is already up to date',
          indexHealth: indexHealth[0],
          crawlSkipped: true
        });
      }
    }

    // Initialize the URL index (this runs in the background)
    // In production, you might want to use a queue system for this
    const crawlPromise = ragService.initializeClinicIndex(clinic.id, websiteUrl);
    
    // Don't await the crawl - return immediately and let it run in background
    crawlPromise.catch(error => {
      console.error(`❌ Background crawl failed for clinic ${clinic.id}:`, error);
    });

    return NextResponse.json({
      message: 'URL crawling started',
      clinicId: clinic.id,
      websiteUrl,
      status: 'in_progress'
    });

  } catch (error) {
    console.error('❌ Crawl initiation failed:', error);
    return NextResponse.json(
      { error: 'Failed to start crawling process' },
      { status: 500 }
    );
  }
}

/**
 * GET - Check crawl status and URL index health
 */
export async function GET() {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get URL index health
    const { data: indexHealth, error: healthError } = await supabase.rpc('check_url_index_health', {
      clinic_id: clinic.id
    });

    if (healthError) {
      throw new Error(`Health check failed: ${healthError.message}`);
    }

    // Get crawl status from domains table
    const { data: domains, error: domainsError } = await supabase
      .from('clinic_domains')
      .select('*')
      .eq('clinic_id', clinic.id)
      .order('is_primary', { ascending: false });

    if (domainsError) {
      throw new Error(`Domain query failed: ${domainsError.message}`);
    }

    // Get recent RAG analytics
    const analyticsData = await ragService.getAnalytics(clinic.id, 7); // Last 7 days

    return NextResponse.json({
      indexHealth: indexHealth?.[0] || {
        total_urls: 0,
        accessible_urls: 0,
        recent_crawl_urls: 0,
        page_types_covered: [],
        avg_crawl_depth: 0,
        needs_recrawl: true
      },
      domains: domains || [],
      recentAnalytics: analyticsData,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to get crawl status:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve crawl status' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Clear URL index for clinic
 */
export async function DELETE() {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clear URL index
    const { error: indexError } = await supabase
      .from('clinic_url_index')
      .delete()
      .eq('clinic_id', clinic.id);

    if (indexError) {
      throw new Error(`Failed to clear URL index: ${indexError.message}`);
    }

    // Clear cached pages
    const { error: pagesError } = await supabase
      .from('clinic_pages')
      .delete()
      .eq('clinic_id', clinic.id);

    if (pagesError) {
      throw new Error(`Failed to clear cached pages: ${pagesError.message}`);
    }

    // Reset domain status
    const { error: domainError } = await supabase
      .from('clinic_domains')
      .update({
        last_crawled: null,
        last_crawl_status: null,
        pages_discovered: 0,
        pages_accessible: 0,
        crawl_errors: []
      })
      .eq('clinic_id', clinic.id);

    if (domainError) {
      console.warn('Failed to reset domain status:', domainError);
    }

    return NextResponse.json({
      message: 'URL index and cache cleared successfully',
      clinicId: clinic.id
    });

  } catch (error) {
    console.error('❌ Failed to clear URL index:', error);
    return NextResponse.json(
      { error: 'Failed to clear URL index' },
      { status: 500 }
    );
  }
}