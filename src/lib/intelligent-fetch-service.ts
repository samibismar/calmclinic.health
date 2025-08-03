import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface URLMatch {
  url: string;
  title: string;
  description: string;
  pageType: string;
  similarity: number;
  crawlDepth: number;
  isAccessible: boolean;
  wordCount: number;
}

export interface ContentSummary {
  url: string;
  title: string;
  summary: string;
  contentHash: string;
  embedding: number[];
  keyPoints: string[];
  fetchTimestamp: Date;
  responseTimeMs: number;
}

export interface FetchResult {
  summaries: ContentSummary[];
  totalFetchTime: number;
  cacheHits: number;
  newFetches: number;
  errors: string[];
}

interface DatabaseURLMatch {
  url: string;
  title?: string;
  description?: string;
  page_type?: string;
  similarity: number;
  crawl_depth?: number;
  is_accessible: boolean;
  word_count?: number;
}

export class IntelligentFetchService {
  private readonly maxConcurrentFetches = 3;
  private readonly fetchTimeout = 15000; // 15 seconds
  private readonly cacheExpiryHours = 24;

  /**
   * Main entry point: Find relevant URLs and fetch their content
   */
  async fetchRelevantContent(
    query: string,
    clinicId: number,
    maxPages: number = 3
  ): Promise<FetchResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let cacheHits = 0;
    let newFetches = 0;

    console.log(`🔍 Finding relevant content for query: "${query}" (clinic ${clinicId})`);

    try {
      // Step 1: Find semantically relevant URLs
      const relevantUrls = await this.findRelevantUrls(query, clinicId, maxPages);
      console.log(`📋 Found ${relevantUrls.length} relevant URLs`);

      if (relevantUrls.length === 0) {
        return {
          summaries: [],
          totalFetchTime: Date.now() - startTime,
          cacheHits: 0,
          newFetches: 0,
          errors: ['No relevant URLs found in clinic index']
        };
      }

      // Step 2: Check cache for existing summaries
      const cachedSummaries = await this.getCachedSummaries(clinicId, relevantUrls.map(u => u.url));
      cacheHits = cachedSummaries.length;
      console.log(`💾 Found ${cacheHits} cached summaries`);

      // Step 3: Identify URLs that need fresh fetching
      const cachedUrls = new Set(cachedSummaries.map(s => s.url));
      const urlsToFetch = relevantUrls.filter(url => !cachedUrls.has(url.url));
      newFetches = urlsToFetch.length;

      // Step 4: Fetch and summarize new content
      const newSummaries: ContentSummary[] = [];
      if (urlsToFetch.length > 0) {
        console.log(`🌐 Fetching ${urlsToFetch.length} new pages`);
        const fetchResults = await this.fetchAndSummarize(urlsToFetch);
        newSummaries.push(...fetchResults.summaries);
        errors.push(...fetchResults.errors);

        // Step 5: Cache new summaries
        if (newSummaries.length > 0) {
          await this.cacheSummaries(clinicId, newSummaries);
        }
      }

      // Combine cached and new summaries
      const allSummaries = [...cachedSummaries, ...newSummaries];
      
      // Sort by relevance (similarity score from URL matching)
      allSummaries.sort((a, b) => {
        const aMatch = relevantUrls.find(u => u.url === a.url);
        const bMatch = relevantUrls.find(u => u.url === b.url);
        return (bMatch?.similarity || 0) - (aMatch?.similarity || 0);
      });

      const totalFetchTime = Date.now() - startTime;
      console.log(`✅ Content fetch completed in ${totalFetchTime}ms`);
      console.log(`📊 Cache hits: ${cacheHits}, New fetches: ${newFetches}, Errors: ${errors.length}`);

      return {
        summaries: allSummaries,
        totalFetchTime,
        cacheHits,
        newFetches,
        errors
      };

    } catch (error) {
      console.error('❌ Intelligent fetch failed:', error);
      errors.push(`Fetch service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        summaries: [],
        totalFetchTime: Date.now() - startTime,
        cacheHits: 0,
        newFetches: 0,
        errors
      };
    }
  }

  /**
   * Find semantically relevant URLs using vector similarity search
   */
  private async findRelevantUrls(
    query: string,
    clinicId: number,
    maxResults: number
  ): Promise<URLMatch[]> {
    try {
      // Generate embedding for the query
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: query
      });
      
      const queryEmbedding = embeddingResponse.data[0].embedding;

      // Perform vector similarity search
      const { data: urlMatches, error } = await supabase.rpc('match_clinic_urls', {
        clinic_id: clinicId,
        query_embedding: queryEmbedding,
        match_threshold: 0.3, // Minimum similarity threshold
        match_count: maxResults * 2 // Get more results to filter from
      });

      if (error) {
        console.error('Vector search error:', error);
        throw new Error(`Vector search failed: ${error.message}`);
      }

      if (!urlMatches || urlMatches.length === 0) {
        console.log('⚠️ No URLs found via vector search, falling back to keyword search');
        return await this.fallbackKeywordSearch(query, clinicId, maxResults);
      }

      // Convert to URLMatch format
      const matches: URLMatch[] = urlMatches
        .filter((match: DatabaseURLMatch) => match.is_accessible) // Only accessible URLs
        .slice(0, maxResults) // Limit results
        .map((match: DatabaseURLMatch) => ({
          url: match.url,
          title: match.title || '',
          description: match.description || '',
          pageType: match.page_type || 'unknown',
          similarity: match.similarity,
          crawlDepth: match.crawl_depth || 0,
          isAccessible: match.is_accessible,
          wordCount: match.word_count || 0
        }));

      console.log(`🎯 Vector search found ${matches.length} relevant URLs`);
      matches.forEach(match => {
        console.log(`  - ${match.title} (${match.pageType}) - ${(match.similarity * 100).toFixed(1)}% match`);
      });

      return matches;

    } catch (error) {
      console.error('❌ Semantic URL search failed:', error);
      console.log('⚠️ Falling back to keyword search');
      return await this.fallbackKeywordSearch(query, clinicId, maxResults);
    }
  }

  /**
   * Fallback keyword-based URL search when vector search fails
   */
  private async fallbackKeywordSearch(
    query: string,
    clinicId: number,
    maxResults: number
  ): Promise<URLMatch[]> {
    try {
      const keywords = query.toLowerCase().split(/\s+/);

      const { data: urlMatches, error } = await supabase
        .from('clinic_url_index')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_accessible', true)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,keywords.cs.{${keywords.join(',')}}`)
        .limit(maxResults);

      if (error) {
        throw new Error(`Keyword search failed: ${error.message}`);
      }

      const matches: URLMatch[] = (urlMatches || []).map(match => ({
        url: match.url,
        title: match.title || '',
        description: match.description || '',
        pageType: match.page_type || 'unknown',
        similarity: 0.5, // Default similarity for keyword matches
        crawlDepth: match.crawl_depth || 0,
        isAccessible: match.is_accessible,
        wordCount: match.word_count || 0
      }));

      console.log(`🔤 Keyword search found ${matches.length} relevant URLs`);
      return matches;

    } catch (error) {
      console.error('❌ Fallback keyword search failed:', error);
      return [];
    }
  }

  /**
   * Check cache for existing content summaries
   */
  private async getCachedSummaries(clinicId: number, urls: string[]): Promise<ContentSummary[]> {
    try {
      const cacheExpiryTime = new Date();
      cacheExpiryTime.setHours(cacheExpiryTime.getHours() - this.cacheExpiryHours);

      const { data: cachedPages, error } = await supabase
        .from('clinic_pages')
        .select('*')
        .eq('clinic_id', clinicId)
        .in('url', urls)
        .gte('fetch_timestamp', cacheExpiryTime.toISOString());

      if (error) {
        console.error('Cache lookup error:', error);
        return [];
      }

      return (cachedPages || []).map(page => ({
        url: page.url,
        title: page.title || '',
        summary: page.summary || '',
        contentHash: page.content_hash || '',
        embedding: page.embedding || [],
        keyPoints: [], // TODO: Extract from summary if needed
        fetchTimestamp: new Date(page.fetch_timestamp),
        responseTimeMs: page.response_time_ms || 0
      }));

    } catch (error) {
      console.error('❌ Cache lookup failed:', error);
      return [];
    }
  }

  /**
   * Fetch and summarize content from URLs
   */
  private async fetchAndSummarize(urls: URLMatch[]): Promise<{summaries: ContentSummary[], errors: string[]}> {
    const summaries: ContentSummary[] = [];
    const errors: string[] = [];

    // Process URLs in batches to avoid overwhelming servers
    for (let i = 0; i < urls.length; i += this.maxConcurrentFetches) {
      const batch = urls.slice(i, i + this.maxConcurrentFetches);
      
      const batchPromises = batch.map(async (urlMatch) => {
        const fetchStartTime = Date.now();
        
        try {
          console.log(`🌐 Fetching: ${urlMatch.url}`);
          
          // Fetch the page content with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.fetchTimeout);
          
          const response = await fetch(urlMatch.url, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'CalmClinic-Bot/1.0 (Healthcare Assistant)',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
          });
          
          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const html = await response.text();
          const responseTime = Date.now() - fetchStartTime;

          // Extract and clean content
          const extractedContent = this.extractPageContent(html);
          
          // Generate content hash for cache invalidation
          const contentHash = crypto
            .createHash('sha256')
            .update(extractedContent.cleanText)
            .digest('hex');

          // Summarize content with AI
          const summaryResult = await this.summarizeContent(
            urlMatch.url,
            urlMatch.title,
            extractedContent.cleanText,
            urlMatch.pageType
          );

          const summary: ContentSummary = {
            url: urlMatch.url,
            title: urlMatch.title || extractedContent.title,
            summary: summaryResult.summary,
            contentHash,
            embedding: summaryResult.embedding,
            keyPoints: summaryResult.keyPoints,
            fetchTimestamp: new Date(),
            responseTimeMs: responseTime
          };

          summaries.push(summary);
          console.log(`✅ Summarized: ${urlMatch.url} (${responseTime}ms)`);

        } catch (error) {
          const errorMsg = `Failed to fetch ${urlMatch.url}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      });

      await Promise.all(batchPromises);
      
      // Rate limiting delay between batches
      if (i + this.maxConcurrentFetches < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { summaries, errors };
  }

  /**
   * Extract clean, relevant content from HTML
   */
  private extractPageContent(html: string): {title: string, cleanText: string} {
    const $ = cheerio.load(html);
    
    // Remove unwanted elements
    $('script, style, nav, header, footer, .menu, .navigation, .sidebar, .ads, .advertisement').remove();
    
    // Extract title
    const title = $('title').text().trim() || $('h1').first().text().trim();
    
    // Focus on main content areas
    let mainContent = '';
    const contentSelectors = [
      'main',
      '.main-content', 
      '.content',
      '#content',
      '.page-content',
      'article',
      '.post-content'
    ];
    
    // Try to find main content area
    for (const selector of contentSelectors) {
      const content = $(selector).text();
      if (content && content.length > mainContent.length) {
        mainContent = content;
      }
    }
    
    // Fallback to body content if no main content found
    if (!mainContent) {
      mainContent = $('body').text();
    }
    
    // Clean up text
    const cleanText = mainContent
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n+/g, '\n') // Normalize line breaks
      .trim();
    
    return { title, cleanText };
  }

  /**
   * Summarize content using AI
   */
  private async summarizeContent(
    url: string, 
    title: string, 
    content: string, 
    pageType: string
  ): Promise<{summary: string, embedding: number[], keyPoints: string[]}> {
    try {
      // Limit content length for API
      const maxContentLength = 8000; // Leave room for prompt
      const truncatedContent = content.length > maxContentLength 
        ? content.substring(0, maxContentLength) + '...'
        : content;

      const summaryPrompt = `Summarize this ${pageType} page from a healthcare clinic website. Focus on information that would be helpful for patients preparing for appointments.

URL: ${url}
Title: ${title}
Page Type: ${pageType}

Content:
${truncatedContent}

Please provide:
1. A concise 2-3 sentence summary focusing on the most important patient-relevant information
2. 3-5 key points that patients should know (bullet format)

Format your response as JSON:
{
  "summary": "2-3 sentence summary here",
  "keyPoints": ["key point 1", "key point 2", "key point 3"]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a healthcare communication expert. Create clear, patient-friendly summaries of clinic website content."
          },
          {
            role: "user",
            content: summaryPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      let summary = "Content available on this page.";
      let keyPoints: string[] = [];

      try {
        const result = JSON.parse(response.choices[0].message.content || '{}');
        summary = result.summary || summary;
        keyPoints = result.keyPoints || keyPoints;
      } catch (parseError) {
        console.error('Failed to parse AI summary response:', parseError);
        // Fallback: use the raw response as summary
        summary = response.choices[0].message.content?.substring(0, 200) || summary;
      }

      // Generate embedding for the summary
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: `${title} ${summary} ${keyPoints.join(' ')}`
      });

      return {
        summary,
        embedding: embeddingResponse.data[0].embedding,
        keyPoints
      };

    } catch (error) {
      console.error('❌ Content summarization failed:', error);
      
      // Fallback summary
      const fallbackSummary = content.substring(0, 200) + (content.length > 200 ? '...' : '');
      
      return {
        summary: fallbackSummary,
        embedding: new Array(1536).fill(0), // Zero embedding as fallback
        keyPoints: []
      };
    }
  }

  /**
   * Cache summaries in the database
   */
  private async cacheSummaries(clinicId: number, summaries: ContentSummary[]): Promise<void> {
    try {
      const cacheEntries = summaries.map(summary => ({
        clinic_id: clinicId,
        url: summary.url,
        title: summary.title,
        summary: summary.summary,
        content_hash: summary.contentHash,
        embedding: summary.embedding,
        response_time_ms: summary.responseTimeMs,
        access_count: 1
      }));

      // Use upsert to handle potential duplicates
      const { error } = await supabase
        .from('clinic_pages')
        .upsert(cacheEntries, {
          onConflict: 'clinic_id,url',
          ignoreDuplicates: false
        });

      if (error) {
        throw new Error(`Failed to cache summaries: ${error.message}`);
      }

      console.log(`💾 Cached ${summaries.length} content summaries`);

    } catch (error) {
      console.error('❌ Failed to cache summaries:', error);
      // Don't throw - caching failure shouldn't break the main flow
    }
  }

  /**
   * Invalidate cache for specific URLs (useful when content changes)
   */
  async invalidateCache(clinicId: number, urls: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('clinic_pages')
        .delete()
        .eq('clinic_id', clinicId)
        .in('url', urls);

      if (error) {
        throw new Error(`Failed to invalidate cache: ${error.message}`);
      }

      console.log(`🗑️ Invalidated cache for ${urls.length} URLs`);

    } catch (error) {
      console.error('❌ Cache invalidation failed:', error);
      throw error;
    }
  }

  /**
   * Update access count for cached pages (for analytics)
   */
  async trackPageAccess(clinicId: number, urls: string[]): Promise<void> {
    try {
      for (const url of urls) {
        await supabase.rpc('increment_page_access', {
          clinic_id: clinicId,
          page_url: url
        });
      }
    } catch (error) {
      console.error('❌ Failed to track page access:', error);
      // Don't throw - analytics failure shouldn't break main flow
    }
  }
}