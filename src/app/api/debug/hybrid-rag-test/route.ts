import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { HybridRAGService } from '@/lib/hybrid-rag-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ragService = new HybridRAGService();

interface TestStep {
  step: string;
  status: 'pending' | 'running' | 'success' | 'error';
  details: any;
  timestamp: string;
  duration?: number;
}

export async function POST(request: NextRequest) {
  const steps: TestStep[] = [];
  let startTime = Date.now();
  
  const addStep = (step: string, status: 'pending' | 'running' | 'success' | 'error', details: any, duration?: number) => {
    steps.push({
      step,
      status,
      details,
      timestamp: new Date().toISOString(),
      duration
    });
  };

  try {
    const { clinicId, query, debug = true } = await request.json();
    
    if (!clinicId || !query) {
      return NextResponse.json(
        { error: 'clinicId and query are required' },
        { status: 400 }
      );
    }

    addStep('Initialization', 'running', { clinicId, query, debug });

    // Step 1: Get clinic configuration
    const stepStart = Date.now();
    let clinicConfig;
    try {
      const { data: clinic, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();

      if (error) throw error;
      
      clinicConfig = {
        id: clinic.id,
        name: clinic.clinic_name,
        websiteUrl: clinic.website_url,
        confidenceThreshold: clinic.rag_confidence_threshold || 0.6,
        enableWebSearch: clinic.enable_web_search !== false,
        maxWebPages: clinic.max_web_pages_per_query || 3,
        cacheExpiryHours: clinic.rag_cache_ttl_hours || 24
      };

      addStep('Clinic Configuration Loaded', 'success', clinicConfig, Date.now() - stepStart);
    } catch (error) {
      addStep('Clinic Configuration Failed', 'error', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }

    // Step 2: Generate query embedding
    const embeddingStart = Date.now();
    let queryEmbedding;
    try {
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "text-embedding-ada-002",
          input: query
        })
      });

      if (!embeddingResponse.ok) {
        throw new Error(`OpenAI API error: ${embeddingResponse.status}`);
      }

      const embeddingData = await embeddingResponse.json();
      queryEmbedding = embeddingData.data[0].embedding;

      addStep('Query Embedding Generated', 'success', {
        embeddingLength: queryEmbedding.length,
        firstFewValues: queryEmbedding.slice(0, 5)
      }, Date.now() - embeddingStart);
    } catch (error) {
      addStep('Query Embedding Failed', 'error', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }

    // Step 3: Query local vector store
    const ragStart = Date.now();
    let ragDecision;
    try {
      const { data, error } = await supabase.rpc('hybrid_rag_query', {
        clinic_id: clinicId,
        query_text: query,
        query_embedding: queryEmbedding,
        confidence_threshold: clinicConfig.confidenceThreshold
      });

      if (error) throw error;

      ragDecision = data[0];
      
      addStep('Local RAG Query Complete', 'success', {
        source: ragDecision.source,
        contentFound: ragDecision.content_found,
        confidenceScore: ragDecision.confidence_score,
        bestMatchUrl: ragDecision.best_match_url,
        recommendedUrls: ragDecision.recommended_urls
      }, Date.now() - ragStart);
    } catch (error) {
      addStep('Local RAG Query Failed', 'error', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }

    // Step 4: Decision point - use cache or web search
    let finalAnswer = '';
    let usedWebSearch = false;
    let urlsSelected: string[] = [];
    let contentSummaries = 0;
    let cacheHit = false;

    if (ragDecision.content_found && !debug) {
      // Use cached content
      cacheHit = true;
      addStep('Decision: Use Cached Content', 'success', {
        reason: `Confidence ${ragDecision.confidence_score} >= threshold ${clinicConfig.confidenceThreshold}`,
        cachedUrl: ragDecision.best_match_url,
        cachedTitle: ragDecision.best_match_title
      });

      finalAnswer = `Based on cached content from ${ragDecision.best_match_title}: ${ragDecision.best_match_summary}`;
      
    } else if (clinicConfig.enableWebSearch && ragDecision.recommended_urls.length > 0) {
      // Perform web search
      const webSearchStart = Date.now();
      usedWebSearch = true;
      urlsSelected = ragDecision.recommended_urls.slice(0, clinicConfig.maxWebPages);
      
      addStep('Decision: Perform Web Search', 'running', {
        reason: ragDecision.content_found 
          ? `Debug mode enabled - forcing web search` 
          : `Confidence ${ragDecision.confidence_score} < threshold ${clinicConfig.confidenceThreshold}`,
        urlsToFetch: urlsSelected
      });

      try {
        // Use the intelligent fetch service directly
        const { IntelligentFetchService } = await import('@/lib/intelligent-fetch-service');
        const fetchService = new IntelligentFetchService();
        
        const fetchResult = await fetchService.fetchRelevantContent(
          query, 
          clinicId, 
          clinicConfig.maxWebPages
        );
        
        contentSummaries = fetchResult.summaries.length;
        
        addStep('Web Content Fetched', 'success', {
          urlsFetched: fetchResult.summaries.map(s => s.url),
          summariesGenerated: contentSummaries,
          cacheHits: fetchResult.cacheHits,
          newFetches: fetchResult.newFetches,
          errors: fetchResult.errors
        }, Date.now() - webSearchStart);

        if (fetchResult.summaries.length > 0) {
          const combinedContent = fetchResult.summaries
            .map(s => `From ${s.title}: ${s.summary}`)
            .join('\n\n');
          
          finalAnswer = `Based on fresh content from clinic website:\n${combinedContent}`;
        } else {
          finalAnswer = 'No relevant content found on clinic website. Please contact the clinic directly.';
        }

      } catch (error) {
        addStep('Web Content Fetch Failed', 'error', { error: error instanceof Error ? error.message : 'Unknown error' });
        finalAnswer = 'Failed to fetch current information. Please contact the clinic directly.';
      }
      
    } else {
      // Fallback
      addStep('Decision: Use Fallback Response', 'success', {
        reason: ragDecision.recommended_urls.length === 0 
          ? 'No URLs found to search'
          : 'Web search disabled for this clinic'
      });
      
      finalAnswer = 'I\'d be happy to help with that information. For the most current details, please contact the clinic directly.';
    }

    // Step 5: Generate AI response (simulate)
    const aiStart = Date.now();
    try {
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a helpful clinic assistant. Answer the patient's question using the provided information. Be concise and helpful.`
            },
            {
              role: "user",
              content: `Question: ${query}\n\nInformation available: ${finalAnswer}`
            }
          ],
          temperature: 0.3,
          max_tokens: 300
        })
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        finalAnswer = aiData.choices[0].message.content;
        
        addStep('AI Response Generated', 'success', {
          model: 'gpt-4o-mini',
          tokensUsed: aiData.usage?.total_tokens || 0,
          responseLength: finalAnswer.length
        }, Date.now() - aiStart);
      } else {
        throw new Error(`OpenAI API error: ${aiResponse.status}`);
      }
    } catch (error) {
      addStep('AI Response Failed', 'error', { error: error instanceof Error ? error.message : 'Unknown error' });
      // Keep the fallback answer we already generated
    }

    // Step 6: Log query (simulate)
    const logStart = Date.now();
    try {
      await supabase
        .from('rag_query_logs')
        .insert({
          clinic_id: clinicId,
          query_text: query,
          query_intent: 'test',
          rag_confidence: ragDecision.confidence_score,
          used_web_search: usedWebSearch,
          urls_fetched: urlsSelected,
          cache_hit: cacheHit,
          total_response_time_ms: Date.now() - startTime,
          final_confidence: ragDecision.confidence_score
        });

      addStep('Query Logged', 'success', {
        logged: true,
        analytics: 'Available in monitoring dashboard'
      }, Date.now() - logStart);
    } catch (error) {
      addStep('Query Logging Failed', 'error', { error: error instanceof Error ? error.message : 'Unknown error' });
    }

    // Final step
    addStep('Test Complete', 'success', {
      totalSteps: steps.length,
      successfulSteps: steps.filter(s => s.status === 'success').length,
      errorSteps: steps.filter(s => s.status === 'error').length
    });

    const totalDuration = Date.now() - startTime;

    return NextResponse.json({
      query,
      clinicId,
      steps,
      finalAnswer,
      totalDuration,
      summary: {
        usedCache: cacheHit,
        usedWebSearch,
        confidence: ragDecision.confidence_score,
        urlsSelected,
        contentSummaries,
        errors: steps.filter(s => s.status === 'error').map(s => s.details.error || 'Unknown error')
      }
    });

  } catch (error) {
    console.error('Hybrid RAG test failed:', error);
    
    addStep('Test Failed', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      query: '',
      clinicId: 0,
      steps,
      finalAnswer: 'Test failed to complete',
      totalDuration: Date.now() - startTime,
      summary: {
        usedCache: false,
        usedWebSearch: false,
        confidence: 0,
        urlsSelected: [],
        contentSummaries: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }, { status: 500 });
  }
}