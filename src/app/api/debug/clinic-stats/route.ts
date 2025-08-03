import { NextRequest } from 'next/server';
import { supabase } from '@/lib/shared/supabase-client';
import { createErrorResponse, parseNumericParam, createSuccessResponse } from '@/lib/shared/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');
    
    if (!clinicId) {
      return createErrorResponse('clinicId is required', 400);
    }

    const clinicIdNum = parseNumericParam(clinicId, 'clinicId');
    const days = parseNumericParam(searchParams.get('days'), 'days', 7);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get clinic basic info
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('id, practice_name, website_url, rag_confidence_threshold, enable_web_search')
      .eq('id', clinicIdNum)
      .single();

    if (clinicError || !clinic) {
      return createErrorResponse('Clinic not found', 404, clinicError?.message);
    }

    // Get RAG query logs for this clinic
    const { data: queryLogs, error: logsError } = await supabase
      .from('rag_query_logs')
      .select('*')
      .eq('clinic_id', clinicIdNum)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (logsError) {
      console.error('Error fetching query logs:', logsError);
    }

    const logs = queryLogs || [];

    // Calculate stats
    const totalQueries = logs.length;
    const avgConfidence = logs.length > 0 
      ? logs.reduce((sum, log) => sum + (log.rag_confidence || 0), 0) / logs.length 
      : 0;
    
    // Fix: Check both cache_hit field AND high confidence as cache indicators
    const cacheHits = logs.filter(log => 
      log.cache_hit === true || 
      (!log.used_web_search && log.rag_confidence > 0.6)
    ).length;
    const cacheHitRate = totalQueries > 0 ? cacheHits / totalQueries : 0;
    
    const webSearches = logs.filter(log => log.used_web_search === true).length;
    const webSearchRate = totalQueries > 0 ? webSearches / totalQueries : 0;
    
    const avgResponseTime = logs.length > 0 
      ? logs.reduce((sum, log) => sum + (log.total_response_time_ms || 0), 0) / logs.length 
      : 0;

    // Get URL index stats
    const { data: urlIndex } = await supabase
      .from('clinic_url_index')
      .select('url, is_accessible')
      .eq('clinic_id', clinicIdNum);

    const totalUrls = urlIndex?.length || 0;
    const accessibleUrls = urlIndex?.filter(u => u.is_accessible).length || 0;

    // Get cached pages count
    const { data: cachedPages } = await supabase
      .from('clinic_pages')
      .select('id')
      .eq('clinic_id', clinicIdNum);

    const cachedPagesCount = cachedPages?.length || 0;

    return createSuccessResponse({
      clinic_id: clinicIdNum,
      clinic_name: clinic.practice_name,
      website_url: clinic.website_url,
      
      // Query stats
      total_queries: totalQueries,
      avg_confidence: avgConfidence,
      cache_hit_rate: cacheHitRate,
      web_search_rate: webSearchRate,
      avg_response_time: avgResponseTime,
      
      // System stats
      total_urls_discovered: totalUrls,
      accessible_urls: accessibleUrls,
      cached_pages: cachedPagesCount,
      
      // Recent queries (last 20)
      recent_queries: logs.slice(0, 20),
      
      // Time period
      timeframe_days: days,
      data_from: startDate.toISOString()
    });

  } catch (error) {
    console.error('Failed to get clinic stats:', error);
    return createErrorResponse(
      'Failed to get clinic stats',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}