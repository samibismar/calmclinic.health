import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { URLDiscoveryService } from './url-discovery-service';
import { IntelligentFetchService } from './intelligent-fetch-service';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface RAGQuery {
  query: string;
  clinicId: number;
  maxWebPages?: number;
  forceWebSearch?: boolean;
}

export interface RAGResult {
  answer: string;
  confidence: number;
  sources: RAGSource[];
  usedWebSearch: boolean;
  cacheHit: boolean;
  responseTimeMs: number;
  queryIntent?: string;
}

export interface RAGSource {
  url: string;
  title: string;
  summary: string;
  type: 'cached' | 'fresh';
  relevanceScore: number;
}

export interface ClinicConfig {
  confidenceThreshold: number;
  cacheExpiryHours: number;
  enableWebSearch: boolean;
  maxWebPagesPerQuery: number;
  websiteUrl?: string;
}

export class HybridRAGService {
  private urlDiscovery: URLDiscoveryService;
  private intelligentFetch: IntelligentFetchService;

  constructor() {
    this.urlDiscovery = new URLDiscoveryService();
    this.intelligentFetch = new IntelligentFetchService();
  }

  /**
   * Main query method - orchestrates the entire hybrid RAG process
   */
  async query(ragQuery: RAGQuery): Promise<RAGResult> {
    const startTime = Date.now();
    let usedWebSearch = false;
    let cacheHit = false;
    const sources: RAGSource[] = [];

    console.log(`🧠 Processing RAG query for clinic ${ragQuery.clinicId}: "${ragQuery.query}"`);

    try {
      // Step 1: Get clinic configuration
      const clinicConfig = await this.getClinicConfig(ragQuery.clinicId);
      
      // Step 2: Generate query embedding
      const queryEmbedding = await this.generateQueryEmbedding(ragQuery.query);
      
      // Step 3: Classify query intent
      const queryIntent = await this.classifyQueryIntent(ragQuery.query);
      
      // Step 4: Try hybrid RAG query (checks cache first, recommends web search if needed)
      const ragDecision = await this.makeRAGDecision(
        ragQuery.clinicId,
        ragQuery.query,
        queryEmbedding,
        clinicConfig.confidenceThreshold
      );

      let finalAnswer = '';
      let finalConfidence = 0;

      if (ragDecision.contentFound && !ragQuery.forceWebSearch) {
        // We have good cached content
        console.log(`💾 Using cached content (confidence: ${ragDecision.confidenceScore})`);
        
        finalAnswer = await this.generateAnswerFromCache(
          ragQuery.query,
          ragDecision.bestMatchSummary,
          ragDecision.bestMatchTitle
        );
        
        finalConfidence = ragDecision.confidenceScore;
        cacheHit = true;
        
        sources.push({
          url: ragDecision.bestMatchUrl,
          title: ragDecision.bestMatchTitle,
          summary: ragDecision.bestMatchSummary,
          type: 'cached',
          relevanceScore: ragDecision.confidenceScore
        });

      } else if (clinicConfig.enableWebSearch && ragDecision.recommendedUrls.length > 0) {
        // Need to fetch fresh content
        console.log(`🌐 Fetching fresh content from ${ragDecision.recommendedUrls.length} URLs`);
        
        const maxPages = ragQuery.maxWebPages || clinicConfig.maxWebPagesPerQuery;
        const fetchResult = await this.intelligentFetch.fetchRelevantContent(
          ragQuery.query,
          ragQuery.clinicId,
          maxPages
        );

        if (fetchResult.summaries.length > 0) {
          finalAnswer = await this.generateAnswerFromFreshContent(
            ragQuery.query,
            fetchResult.summaries
          );
          
          // Calculate confidence based on content relevance
          finalConfidence = Math.max(0.7, ragDecision.confidenceScore + 0.2);
          usedWebSearch = true;
          cacheHit = fetchResult.cacheHits > 0;

          // Add sources from fetched content
          fetchResult.summaries.forEach((summary, index) => {
            sources.push({
              url: summary.url,
              title: summary.title,
              summary: summary.summary,
              type: fetchResult.cacheHits > index ? 'cached' : 'fresh',
              relevanceScore: Math.max(0.7 - (index * 0.1), 0.5) // Decreasing relevance
            });
          });

        } else {
          // Fallback to any cached content we have
          finalAnswer = await this.generateFallbackAnswer(ragQuery.query, queryIntent);
          finalConfidence = 0.3;
        }

      } else {
        // Web search disabled or no URLs to search - use fallback
        console.log(`⚠️ No suitable content found, using fallback answer`);
        finalAnswer = await this.generateFallbackAnswer(ragQuery.query, queryIntent);
        finalConfidence = 0.3;
      }

      const responseTimeMs = Date.now() - startTime;

      // Log the query for analytics
      await this.logRAGQuery({
        clinicId: ragQuery.clinicId,
        query: ragQuery.query,
        queryIntent,
        ragConfidence: ragDecision.confidenceScore,
        usedWebSearch,
        urlsFetched: sources.map(s => s.url),
        cacheHit,
        responseTimeMs,
        finalConfidence
      });

      console.log(`✅ RAG query completed in ${responseTimeMs}ms (confidence: ${finalConfidence})`);

      return {
        answer: finalAnswer,
        confidence: finalConfidence,
        sources,
        usedWebSearch,
        cacheHit,
        responseTimeMs,
        queryIntent
      };

    } catch (error) {
      console.error('❌ RAG query failed:', error);
      
      const responseTimeMs = Date.now() - startTime;
      const fallbackAnswer = await this.generateFallbackAnswer(ragQuery.query);
      
      // Log the error
      await this.logRAGQuery({
        clinicId: ragQuery.clinicId,
        query: ragQuery.query,
        ragConfidence: 0,
        usedWebSearch: false,
        urlsFetched: [],
        cacheHit: false,
        responseTimeMs,
        finalConfidence: 0.2,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        answer: fallbackAnswer,
        confidence: 0.2,
        sources: [],
        usedWebSearch: false,
        cacheHit: false,
        responseTimeMs,
        queryIntent: 'unknown'
      };
    }
  }

  /**
   * Initialize or update URL index for a clinic
   */
  async initializeClinicIndex(clinicId: number, websiteUrl: string): Promise<void> {
    console.log(`🚀 Initializing URL index for clinic ${clinicId} from ${websiteUrl}`);

    try {
      // Extract domain from URL
      const domain = new URL(websiteUrl).hostname.replace(/^www\./, '');
      
      // Store/update domain configuration
      await supabase
        .from('clinic_domains')
        .upsert({
          clinic_id: clinicId,
          domain,
          full_url: websiteUrl,
          is_primary: true,
          max_crawl_depth: 3,
          max_pages_per_crawl: 50
        }, {
          onConflict: 'clinic_id,domain'
        });

      // Update clinic configuration
      await supabase
        .from('clinics')
        .update({
          website_url: websiteUrl,
          last_url_discovery: new Date().toISOString()
        })
        .eq('id', clinicId);

      // Start URL discovery
      const crawlResult = await this.urlDiscovery.discoverUrls(clinicId, domain, 3, 50);
      
      // Update crawl status
      await this.urlDiscovery.updateCrawlStatus(
        clinicId,
        domain,
        crawlResult.errors.length === 0 ? 'success' : 'partial',
        crawlResult.totalPages,
        crawlResult.accessiblePages,
        crawlResult.errors
      );

      console.log(`✅ URL index initialization completed for clinic ${clinicId}`);
      console.log(`📊 Discovered ${crawlResult.totalPages} pages, ${crawlResult.accessiblePages} accessible`);

    } catch (error) {
      console.error(`❌ Failed to initialize clinic index:`, error);
      throw error;
    }
  }

  /**
   * Get clinic-specific RAG configuration
   */
  private async getClinicConfig(clinicId: number): Promise<ClinicConfig> {
    try {
      const { data: clinic, error } = await supabase
        .from('clinics')
        .select('rag_confidence_threshold, rag_cache_ttl_hours, enable_web_search, max_web_pages_per_query, website_url')
        .eq('id', clinicId)
        .single();

      if (error) {
        console.warn(`Failed to get clinic config for ${clinicId}, using defaults:`, error);
      }

      return {
        confidenceThreshold: clinic?.rag_confidence_threshold || 0.6,
        cacheExpiryHours: clinic?.rag_cache_ttl_hours || 24,
        enableWebSearch: clinic?.enable_web_search !== false,
        maxWebPagesPerQuery: clinic?.max_web_pages_per_query || 3,
        websiteUrl: clinic?.website_url
      };

    } catch (error) {
      console.warn(`Failed to fetch clinic config for ${clinicId}, using defaults`);
      return {
        confidenceThreshold: 0.6,
        cacheExpiryHours: 24,
        enableWebSearch: true,
        maxWebPagesPerQuery: 3
      };
    }
  }

  /**
   * Generate embedding for the query
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: query
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('❌ Failed to generate query embedding:', error);
      // Return zero vector as fallback
      return new Array(1536).fill(0);
    }
  }

  /**
   * Classify the intent of the user's query
   */
  private async classifyQueryIntent(query: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Classify this healthcare clinic query into one of these categories:
- hours: Office hours, scheduling, appointments
- location: Address, directions, parking, maps  
- contact: Phone numbers, email, communication
- services: Medical services, treatments, procedures
- providers: Doctors, staff information
- insurance: Insurance coverage, billing, payments
- forms: Patient forms, documents, paperwork
- preparation: What to bring, pre-appointment instructions
- general: General questions about the clinic
- other: Anything else

Respond with just the category name.`
          },
          {
            role: "user",
            content: query
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      });

      return response.choices[0].message.content?.toLowerCase().trim() || 'general';
    } catch (error) {
      console.error('❌ Failed to classify query intent:', error);
      return 'general';
    }
  }

  /**
   * Make RAG decision using the database function
   */
  private async makeRAGDecision(
    clinicId: number,
    query: string,
    queryEmbedding: number[],
    confidenceThreshold: number
  ): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('hybrid_rag_query', {
        clinic_id: clinicId,
        query_text: query,
        query_embedding: queryEmbedding,
        confidence_threshold: confidenceThreshold
      });

      if (error) {
        throw new Error(`RAG decision failed: ${error.message}`);
      }

      const result = data[0];
      return {
        source: result.source,
        contentFound: result.content_found,
        bestMatchUrl: result.best_match_url || '',
        bestMatchTitle: result.best_match_title || '',
        bestMatchSummary: result.best_match_summary || '',
        confidenceScore: result.confidence_score || 0,
        recommendedUrls: result.recommended_urls || []
      };

    } catch (error) {
      console.error('❌ RAG decision failed:', error);
      return {
        source: 'web_needed',
        contentFound: false,
        bestMatchUrl: '',
        bestMatchTitle: '',
        bestMatchSummary: '',
        confidenceScore: 0,
        recommendedUrls: []
      };
    }
  }

  /**
   * Generate answer from cached content
   */
  private async generateAnswerFromCache(
    query: string,
    cachedSummary: string,
    pageTitle: string
  ): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful healthcare clinic assistant. Answer the patient's question using the provided information from the clinic's website. Be concise, accurate, and patient-friendly. If the information doesn't fully answer their question, acknowledge what you can help with and suggest they contact the clinic for specific details.`
          },
          {
            role: "user",
            content: `Question: ${query}

Clinic Information (from ${pageTitle}):
${cachedSummary}

Please provide a helpful answer based on this information.`
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      });

      return response.choices[0].message.content || 'I found some information about your question. Please contact the clinic directly for the most current details.';

    } catch (error) {
      console.error('❌ Failed to generate answer from cache:', error);
      return 'I found some relevant information. Please contact the clinic for specific details about your question.';
    }
  }

  /**
   * Generate answer from fresh content
   */
  private async generateAnswerFromFreshContent(
    query: string,
    summaries: Array<{url: string, title: string, summary: string}>
  ): Promise<string> {
    try {
      const combinedContent = summaries
        .map(s => `From ${s.title}: ${s.summary}`)
        .join('\n\n');

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful healthcare clinic assistant. Answer the patient's question using the provided information from multiple pages on the clinic's website. Synthesize the information to give a comprehensive, accurate answer. Be patient-friendly and mention if they should contact the clinic for the most up-to-date information.`
          },
          {
            role: "user",
            content: `Question: ${query}

Information from clinic website:
${combinedContent}

Please provide a comprehensive answer based on this information.`
          }
        ],
        temperature: 0.3,
        max_tokens: 400
      });

      return response.choices[0].message.content || 'Based on the clinic\'s website, I found relevant information. Please contact the clinic directly for the most current details.';

    } catch (error) {
      console.error('❌ Failed to generate answer from fresh content:', error);
      return 'I found relevant information from the clinic\'s website. Please contact the clinic for specific details.';
    }
  }

  /**
   * Generate fallback answer when no good content is available
   */
  private async generateFallbackAnswer(query: string, intent: string = 'general'): Promise<string> {
    const fallbackResponses: Record<string, string> = {
      hours: "I'd be happy to help with information about office hours. For the most current hours and scheduling information, please call the clinic directly or check their website.",
      location: "For directions, parking information, and clinic location details, please check the clinic's website or call them directly for the most accurate information.",
      contact: "For contact information including phone numbers and how to reach the clinic, please check their website or look for their contact details.",
      services: "I'd be glad to help with information about medical services. For detailed information about treatments and services offered, please contact the clinic directly.",
      providers: "For information about healthcare providers and staff, please check the clinic's website or contact them directly for current provider information.",
      insurance: "For questions about insurance coverage and billing, I recommend contacting the clinic directly as insurance information can change frequently.",
      forms: "For patient forms and required documents, please check the clinic's website or contact them directly to ensure you have the most current forms.",
      preparation: "For appointment preparation instructions and what to bring, please contact the clinic directly as requirements may vary by appointment type.",
      general: "I'm here to help with information about the clinic. For the most accurate and current information, please contact the clinic directly or visit their website."
    };

    return fallbackResponses[intent] || fallbackResponses.general;
  }

  /**
   * Log RAG query for analytics
   */
  private async logRAGQuery(logData: {
    clinicId: number;
    query: string;
    queryIntent?: string;
    ragConfidence: number;
    usedWebSearch: boolean;
    urlsFetched: string[];
    cacheHit: boolean;
    responseTimeMs: number;
    finalConfidence: number;
    error?: string;
  }): Promise<void> {
    try {
      await supabase
        .from('rag_query_logs')
        .insert({
          clinic_id: logData.clinicId,
          query_text: logData.query,
          query_intent: logData.queryIntent,
          rag_confidence: logData.ragConfidence,
          used_web_search: logData.usedWebSearch,
          urls_fetched: logData.urlsFetched,
          cache_hit: logData.cacheHit,
          total_response_time_ms: logData.responseTimeMs,
          final_confidence: logData.finalConfidence
        });
    } catch (error) {
      console.error('❌ Failed to log RAG query:', error);
      // Don't throw - logging failure shouldn't break the main flow
    }
  }

  /**
   * Get RAG analytics for a clinic
   */
  async getAnalytics(clinicId: number, daysBack: number = 30): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_rag_analytics', {
        clinic_id: clinicId,
        days_back: daysBack
      });

      if (error) {
        throw new Error(`Analytics query failed: ${error.message}`);
      }

      return data[0] || {
        total_queries: 0,
        avg_confidence: 0,
        cache_hit_rate: 0,
        web_search_rate: 0,
        avg_response_time_ms: 0,
        popular_intents: [],
        top_fetched_urls: []
      };

    } catch (error) {
      console.error('❌ Failed to get RAG analytics:', error);
      throw error;
    }
  }

  /**
   * Check URL index health for a clinic
   */
  async checkIndexHealth(clinicId: number): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('check_url_index_health', {
        clinic_id: clinicId
      });

      if (error) {
        throw new Error(`Index health check failed: ${error.message}`);
      }

      return data[0];

    } catch (error) {
      console.error('❌ Failed to check index health:', error);
      throw error;
    }
  }
}