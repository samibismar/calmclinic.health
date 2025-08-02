import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { HybridRAGService } from '@/lib/hybrid-rag-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ragService = new HybridRAGService();

// Helper function to check if user is a founder/admin
async function checkFounderAccess() {
  const cookieStore = await cookies();
  const authUserId = cookieStore.get('auth_user_id')?.value;
  
  if (!authUserId) {
    return null;
  }

  // Check if user has founder/admin privileges
  // This could be based on email, role, or other criteria
  const { data: clinic } = await supabase
    .from('clinics')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();

  return clinic;
}

/**
 * GET - Get comprehensive RAG monitoring data
 */
export async function GET(request: NextRequest) {
  try {
    const clinic = await checkFounderAccess();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId') ? parseInt(searchParams.get('clinicId')!) : clinic.id;
    const daysBack = parseInt(searchParams.get('daysBack') || '30');
    const includeDetails = searchParams.get('details') === 'true';

    // Get RAG analytics
    const analytics = await ragService.getAnalytics(clinicId, daysBack);
    
    // Get URL index health
    const indexHealth = await ragService.checkIndexHealth(clinicId);
    
    // Get recent query logs if details requested
    let recentQueries = [];
    if (includeDetails) {
      const { data: queries } = await supabase
        .from('rag_query_logs')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      recentQueries = queries || [];
    }

    // Get clinic information
    const { data: clinicInfo } = await supabase
      .from('clinics')
      .select('id, clinic_name, website_url, last_url_discovery, rag_confidence_threshold, enable_web_search')
      .eq('id', clinicId)
      .single();

    // Calculate derived metrics
    const derivedMetrics = calculateDerivedMetrics(analytics, indexHealth);

    // Get performance trends (simplified - you might want more sophisticated trending)
    const performanceTrends = await getPerformanceTrends(clinicId, daysBack);

    return NextResponse.json({
      clinic: clinicInfo,
      analytics: {
        ...analytics,
        ...derivedMetrics
      },
      indexHealth,
      performanceTrends,
      recentQueries: includeDetails ? recentQueries : [],
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to get RAG monitoring data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve monitoring data' },
      { status: 500 }
    );
  }
}

/**
 * POST - Get monitoring data for multiple clinics (founder overview)
 */
export async function POST(request: NextRequest) {
  try {
    const foundersClinic = await checkFounderAccess();
    
    if (!foundersClinic) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { clinicIds, daysBack = 30 } = await request.json();

    // If no specific clinics requested, get all clinics
    let targetClinicIds = clinicIds;
    if (!targetClinicIds || targetClinicIds.length === 0) {
      const { data: allClinics } = await supabase
        .from('clinics')
        .select('id')
        .limit(100); // Reasonable limit for founder dashboard
      
      targetClinicIds = allClinics?.map(c => c.id) || [];
    }

    // Get monitoring data for each clinic
    const clinicMonitoringData = await Promise.all(
      targetClinicIds.map(async (clinicId: number) => {
        try {
          const [analytics, indexHealth, clinicInfo] = await Promise.all([
            ragService.getAnalytics(clinicId, daysBack),
            ragService.checkIndexHealth(clinicId),
            supabase
              .from('clinics')
              .select('id, clinic_name, website_url, last_url_discovery, rag_confidence_threshold, enable_web_search')
              .eq('id', clinicId)
              .single()
              .then(({ data }) => data)
          ]);

          const derivedMetrics = calculateDerivedMetrics(analytics, indexHealth);

          return {
            clinicId,
            clinic: clinicInfo,
            analytics: { ...analytics, ...derivedMetrics },
            indexHealth,
            status: 'success'
          };
        } catch (error) {
          console.error(`❌ Failed to get data for clinic ${clinicId}:`, error);
          return {
            clinicId,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    // Calculate aggregate metrics
    const aggregateMetrics = calculateAggregateMetrics(clinicMonitoringData);

    return NextResponse.json({
      summary: aggregateMetrics,
      clinics: clinicMonitoringData,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to get multi-clinic monitoring data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve monitoring data' },
      { status: 500 }
    );
  }
}

/**
 * Calculate derived metrics from raw analytics
 */
function calculateDerivedMetrics(analytics: any, indexHealth: any) {
  const cacheHitRate = analytics.cache_hit_rate || 0;
  const webSearchRate = analytics.web_search_rate || 0;
  const avgConfidence = analytics.avg_confidence || 0;
  const totalQueries = analytics.total_queries || 0;

  // Performance scoring (0-100)
  const performanceScore = Math.round(
    (cacheHitRate * 30) + // 30% weight for cache efficiency
    (avgConfidence * 40) + // 40% weight for answer confidence
    ((1 - webSearchRate) * 20) + // 20% weight for not needing web search
    (Math.min(indexHealth?.accessible_urls / 20, 1) * 10) // 10% weight for URL coverage
  );

  // Health status
  let healthStatus = 'excellent';
  if (performanceScore < 70) healthStatus = 'good';
  if (performanceScore < 50) healthStatus = 'needs_attention';
  if (performanceScore < 30) healthStatus = 'poor';

  // Query velocity (queries per day)
  const queryVelocity = totalQueries / 30; // assuming 30-day period

  return {
    performance_score: performanceScore,
    health_status: healthStatus,
    query_velocity: Math.round(queryVelocity * 10) / 10,
    cache_efficiency: cacheHitRate,
    web_dependency: webSearchRate,
    content_coverage: indexHealth?.accessible_urls || 0
  };
}

/**
 * Get performance trends over time
 */
async function getPerformanceTrends(clinicId: number, daysBack: number) {
  try {
    // Get daily aggregated data for trending
    const { data: dailyStats } = await supabase
      .from('rag_query_logs')
      .select('created_at, rag_confidence, used_web_search, cache_hit, total_response_time_ms')
      .eq('clinic_id', clinicId)
      .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (!dailyStats || dailyStats.length === 0) {
      return {
        confidence_trend: [],
        response_time_trend: [],
        cache_hit_trend: [],
        query_volume_trend: []
      };
    }

    // Group by day and calculate daily averages
    const dailyGroups: { [key: string]: any[] } = {};
    
    dailyStats.forEach(stat => {
      const day = stat.created_at.split('T')[0]; // Get YYYY-MM-DD
      if (!dailyGroups[day]) {
        dailyGroups[day] = [];
      }
      dailyGroups[day].push(stat);
    });

    const trends = Object.entries(dailyGroups).map(([day, stats]) => {
      const avgConfidence = stats.reduce((sum, s) => sum + (s.rag_confidence || 0), 0) / stats.length;
      const avgResponseTime = stats.reduce((sum, s) => sum + (s.total_response_time_ms || 0), 0) / stats.length;
      const cacheHitRate = stats.filter(s => s.cache_hit).length / stats.length;
      const queryCount = stats.length;

      return {
        date: day,
        confidence: Math.round(avgConfidence * 1000) / 1000,
        response_time: Math.round(avgResponseTime),
        cache_hit_rate: Math.round(cacheHitRate * 1000) / 1000,
        query_count: queryCount
      };
    });

    return {
      confidence_trend: trends.map(t => ({ date: t.date, value: t.confidence })),
      response_time_trend: trends.map(t => ({ date: t.date, value: t.response_time })),
      cache_hit_trend: trends.map(t => ({ date: t.date, value: t.cache_hit_rate })),
      query_volume_trend: trends.map(t => ({ date: t.date, value: t.query_count }))
    };

  } catch (error) {
    console.error('❌ Failed to calculate performance trends:', error);
    return {
      confidence_trend: [],
      response_time_trend: [],
      cache_hit_trend: [],
      query_volume_trend: []
    };
  }
}

/**
 * Calculate aggregate metrics across multiple clinics
 */
function calculateAggregateMetrics(clinicData: any[]) {
  const successfulClinics = clinicData.filter(c => c.status === 'success');
  
  if (successfulClinics.length === 0) {
    return {
      total_clinics: clinicData.length,
      active_clinics: 0,
      avg_performance_score: 0,
      total_queries: 0,
      avg_cache_hit_rate: 0,
      avg_response_time: 0,
      health_distribution: { excellent: 0, good: 0, needs_attention: 0, poor: 0 }
    };
  }

  const totalQueries = successfulClinics.reduce((sum, c) => sum + (c.analytics.total_queries || 0), 0);
  const avgPerformanceScore = successfulClinics.reduce((sum, c) => sum + (c.analytics.performance_score || 0), 0) / successfulClinics.length;
  const avgCacheHitRate = successfulClinics.reduce((sum, c) => sum + (c.analytics.cache_hit_rate || 0), 0) / successfulClinics.length;
  const avgResponseTime = successfulClinics.reduce((sum, c) => sum + (c.analytics.avg_response_time_ms || 0), 0) / successfulClinics.length;

  // Health distribution
  const healthDistribution = successfulClinics.reduce((dist, c) => {
    const status = c.analytics.health_status || 'needs_attention';
    dist[status] = (dist[status] || 0) + 1;
    return dist;
  }, { excellent: 0, good: 0, needs_attention: 0, poor: 0 });

  return {
    total_clinics: clinicData.length,
    active_clinics: successfulClinics.length,
    avg_performance_score: Math.round(avgPerformanceScore),
    total_queries: totalQueries,
    avg_cache_hit_rate: Math.round(avgCacheHitRate * 1000) / 1000,
    avg_response_time: Math.round(avgResponseTime),
    health_distribution: healthDistribution
  };
}