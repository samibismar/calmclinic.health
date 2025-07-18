import { NextResponse } from 'next/server';
import { clinicCache } from '@/lib/clinic-intelligence-cache';

// Simple stats endpoint for monitoring Response API performance
export async function GET() {
  try {
    const cacheStats = clinicCache.getStats();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      cache: {
        totalEntries: cacheStats.size,
        validEntries: cacheStats.entries.filter(e => e.valid).length,
        expiredEntries: cacheStats.entries.filter(e => !e.valid).length,
        oldestEntry: cacheStats.entries.length > 0 
          ? Math.max(...cacheStats.entries.map(e => e.age))
          : 0,
        averageAge: cacheStats.entries.length > 0
          ? cacheStats.entries.reduce((sum, e) => sum + e.age, 0) / cacheStats.entries.length
          : 0
      },
      system: {
        responseApiEnabled: true,
        toolsAvailable: 8,
        features: [
          'Real-time clinic data retrieval',
          'Context-aware tool selection', 
          'Intelligent caching',
          'Multi-language support',
          'Enhanced error handling'
        ]
      }
    });
  } catch (error) {
    console.error('Error getting Response API stats:', error);
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}