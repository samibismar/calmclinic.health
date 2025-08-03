import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { XMLParser } from 'fast-xml-parser';
import * as cheerio from 'cheerio';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface URLMetadata {
  url: string;
  title: string;
  description: string;
  keywords: string[];
  pageType: string;
  titleEmbedding?: number[];
  crawlDepth: number;
  isAccessible: boolean;
  httpStatus: number;
  wordCount: number;
  hasForms: boolean;
  hasContactInfo: boolean;
  hasScheduling: boolean;
}

export interface CrawlResult {
  discoveredUrls: URLMetadata[];
  totalPages: number;
  accessiblePages: number;
  errors: string[];
  crawlDuration: number;
}

interface URLClassification {
  url: string;
  page_type: string;
  confidence: number;
  reasoning: string;
}

export class URLDiscoveryService {
  private readonly maxConcurrentRequests = 5;
  private readonly requestDelay = 1000; // 1 second delay between requests
  private readonly timeout = 10000; // 10 second timeout

  /**
   * Main entry point for URL discovery - combines multiple strategies
   */
  async discoverUrls(
    clinicId: number, 
    domain: string, 
    maxDepth: number = 3,
    maxPages: number = 50
  ): Promise<CrawlResult> {
    const startTime = Date.now();
    const discoveredUrls: URLMetadata[] = [];
    const errors: string[] = [];
    // const visitedUrls = new Set<string>(); // Unused for now

    console.log(`🔍 Starting URL discovery for clinic ${clinicId} on ${domain}`);

    try {
      // Strategy 1: Try sitemap.xml first (fastest and most reliable)
      const sitemapUrls = await this.parseSitemap(domain);
      console.log(`📄 Found ${sitemapUrls.length} URLs from sitemap`);

      if (sitemapUrls.length > 0) {
        // Process sitemap URLs
        const sitemapMetadata = await this.processUrls(sitemapUrls.slice(0, maxPages), 0);
        discoveredUrls.push(...sitemapMetadata.validUrls);
        errors.push(...sitemapMetadata.errors);
      } else {
        // Strategy 2: Focused crawling if no sitemap
        console.log(`🕷️ No sitemap found, starting focused crawl`);
        const crawlResult = await this.crawlSite(domain, maxDepth, maxPages);
        discoveredUrls.push(...crawlResult.validUrls);
        errors.push(...crawlResult.errors);
      }

      // Strategy 3: AI-powered page classification and embedding generation
      console.log(`🧠 Classifying ${discoveredUrls.length} pages with AI`);
      const classifiedUrls = await this.classifyPages(discoveredUrls);
      
      // Store in database
      await this.storeUrlIndex(clinicId, classifiedUrls);

      const crawlDuration = Date.now() - startTime;
      const accessiblePages = classifiedUrls.filter(url => url.isAccessible).length;

      console.log(`✅ URL discovery completed in ${crawlDuration}ms`);
      console.log(`📊 Total: ${classifiedUrls.length}, Accessible: ${accessiblePages}, Errors: ${errors.length}`);

      return {
        discoveredUrls: classifiedUrls,
        totalPages: classifiedUrls.length,
        accessiblePages,
        errors,
        crawlDuration
      };

    } catch (error) {
      console.error('❌ URL discovery failed:', error);
      errors.push(`Discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        discoveredUrls,
        totalPages: discoveredUrls.length,
        accessiblePages: discoveredUrls.filter(url => url.isAccessible).length,
        errors,
        crawlDuration: Date.now() - startTime
      };
    }
  }

  /**
   * Strategy 1: Parse sitemap.xml for URL discovery
   */
  private async parseSitemap(domain: string): Promise<string[]> {
    const urls: string[] = [];
    const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
    
    const sitemapUrls = [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap_index.xml`, 
      `${baseUrl}/sitemap/sitemap.xml`,
      `${baseUrl}/sitemaps/sitemap.xml`
    ];

    for (const sitemapUrl of sitemapUrls) {
      try {
        console.log(`🔍 Checking sitemap: ${sitemapUrl}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const response = await fetch(sitemapUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'CalmClinic-Bot/1.0 (Healthcare Assistant)',
          }
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) continue;

        const xmlContent = await response.text();
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: "@_"
        });
        
        const result = parser.parse(xmlContent);
        
        // Handle different sitemap formats
        if (result.urlset && result.urlset.url) {
          const urlEntries = Array.isArray(result.urlset.url) ? result.urlset.url : [result.urlset.url];
          for (const entry of urlEntries) {
            if (entry.loc) {
              urls.push(entry.loc);
            }
          }
          console.log(`✅ Found ${urlEntries.length} URLs in sitemap`);
          break; // Found a working sitemap
        }
        
        // Handle sitemap index format
        if (result.sitemapindex && result.sitemapindex.sitemap) {
          const sitemapEntries = Array.isArray(result.sitemapindex.sitemap) 
            ? result.sitemapindex.sitemap 
            : [result.sitemapindex.sitemap];
          
          for (const sitemapEntry of sitemapEntries) {
            if (sitemapEntry.loc) {
              const subUrls = await this.parseSitemap(sitemapEntry.loc);
              urls.push(...subUrls);
            }
          }
          console.log(`✅ Found ${urls.length} URLs from sitemap index`);
          break;
        }

      } catch (error) {
        console.log(`⚠️ Failed to parse sitemap ${sitemapUrl}:`, error instanceof Error ? error.message : 'Unknown error');
        continue;
      }
    }

    // Filter to only include pages from the target domain
    const filteredUrls = urls.filter(url => {
      try {
        const urlObj = new URL(url);
        return urlObj.hostname.includes(domain.replace(/^https?:\/\//, '').replace(/^www\./, ''));
      } catch {
        return false;
      }
    });

    return [...new Set(filteredUrls)]; // Remove duplicates
  }

  /**
   * Strategy 2: Focused website crawling
   */
  private async crawlSite(domain: string, maxDepth: number, maxPages: number): Promise<{validUrls: URLMetadata[], errors: string[]}> {
    const validUrls: URLMetadata[] = [];
    const errors: string[] = [];
    const queue: {url: string, depth: number}[] = [];
    const visited = new Set<string>();
    
    const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
    queue.push({url: baseUrl, depth: 0});

    while (queue.length > 0 && validUrls.length < maxPages) {
      const batch = queue.splice(0, this.maxConcurrentRequests);
      
      const batchPromises = batch.map(async ({url, depth}) => {
        if (visited.has(url) || depth > maxDepth) return;
        visited.add(url);

        try {
          await new Promise(resolve => setTimeout(resolve, this.requestDelay));
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.timeout);
          
          const response = await fetch(url, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'CalmClinic-Bot/1.0 (Healthcare Assistant)',
            }
          });
          
          clearTimeout(timeoutId);

          const metadata: URLMetadata = {
            url,
            title: '',
            description: '',
            keywords: [],
            pageType: 'unknown',
            crawlDepth: depth,
            isAccessible: response.ok,
            httpStatus: response.status,
            wordCount: 0,
            hasForms: false,
            hasContactInfo: false,
            hasScheduling: false
          };

          if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
            const html = await response.text();
            const $ = cheerio.load(html);
            
            // Extract metadata
            metadata.title = $('title').text().trim() || $('h1').first().text().trim();
            metadata.description = $('meta[name="description"]').attr('content') || 
                                  $('meta[property="og:description"]').attr('content') || '';
            
            // Extract keywords
            const keywordsContent = $('meta[name="keywords"]').attr('content');
            if (keywordsContent) {
              metadata.keywords = keywordsContent.split(',').map(k => k.trim());
            }
            
            // Content analysis
            const bodyText = $('body').text();
            metadata.wordCount = bodyText.split(/\s+/).length;
            metadata.hasForms = $('form').length > 0;
            metadata.hasContactInfo = /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})|(@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/.test(bodyText);
            metadata.hasScheduling = /schedule|appointment|book|calendar|availability/i.test(bodyText);

            // Find internal links for next depth level
            if (depth < maxDepth && validUrls.length < maxPages) {
              const allLinks = $('a[href]').length;
              let internalLinksFound = 0;
              
              $('a[href]').each((_, element) => {
                const href = $(element).attr('href');
                if (href) {
                  try {
                    const linkUrl = new URL(href, url).href;
                    const linkDomain = new URL(linkUrl).hostname;
                    const targetDomain = new URL(baseUrl).hostname;
                    
                    if (linkDomain === targetDomain && !visited.has(linkUrl) && 
                        !linkUrl.includes('#') && !linkUrl.includes('?')) {
                      queue.push({url: linkUrl, depth: depth + 1});
                      internalLinksFound++;
                    }
                  } catch {
                    // Invalid URL, skip
                  }
                }
              });
              
              console.log(`🔗 Page ${url}: Found ${allLinks} total links, ${internalLinksFound} internal links added to queue`);
            }
          }

          validUrls.push(metadata);
          console.log(`📄 Discovered: ${url} (${metadata.title || 'No title'}) - Status: ${response.status}`);

        } catch (error) {
          errors.push(`Failed to crawl ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      await Promise.all(batchPromises);
    }

    return {validUrls, errors};
  }

  /**
   * Strategy 3: AI-powered page classification and metadata enhancement
   */
  private async classifyPages(urls: URLMetadata[]): Promise<URLMetadata[]> {
    const batchSize = 10; // Process URLs in batches to avoid rate limits
    const classifiedUrls: URLMetadata[] = [];

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      
      try {
        // Prepare batch for classification
        const urlsForClassification = batch.map(url => ({
          url: url.url,
          title: url.title,
          description: url.description,
          keywords: url.keywords.join(', '),
          wordCount: url.wordCount,
          hasForms: url.hasForms,
          hasContactInfo: url.hasContactInfo,
          hasScheduling: url.hasScheduling
        }));

        const classificationPrompt = `Classify these healthcare clinic website pages into categories. For each page, determine the most appropriate page_type from these options:

- "home" - Homepage/main landing page
- "about" - About us, our story, mission
- "services" - Medical services, treatments offered  
- "providers" - Doctors, staff, provider profiles
- "hours" - Office hours, scheduling information
- "location" - Address, directions, parking, maps
- "contact" - Contact information, phone numbers
- "forms" - Patient forms, documents, downloads
- "insurance" - Insurance accepted, billing information  
- "appointment" - Online scheduling, booking
- "patient-info" - Patient resources, preparation instructions
- "news" - News, blog, updates
- "careers" - Job opportunities, employment
- "other" - Anything that doesn't fit above categories

Pages to classify:
${JSON.stringify(urlsForClassification, null, 2)}

Return a JSON object with a "classifications" array containing the results:
{
  "classifications": [
    {
      "url": "page_url_here", 
      "page_type": "category_from_list_above",
      "confidence": 0.95,
      "reasoning": "brief explanation"
    }
  ]
}`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system", 
              content: "You are an expert at analyzing healthcare clinic websites. Classify pages accurately based on their content and purpose. Always respond with valid JSON only, no markdown formatting."
            },
            {
              role: "user", 
              content: classificationPrompt
            }
          ],
          temperature: 0.1,
          max_tokens: 2000,
          response_format: { type: "json_object" }
        });

        let classifications: URLClassification[] = [];
        try {
          const content = response.choices[0].message.content;
          if (content) {
            const parsed = JSON.parse(content);
            classifications = parsed.classifications || parsed; // Handle both formats
          }
        } catch (parseError) {
          console.error('❌ Failed to parse classification response:', parseError);
          console.error('❌ Raw content:', response.choices[0].message.content?.substring(0, 500));
          
          // Use fallback classification
          classifications = batch.map(url => ({
            url: url.url,
            page_type: this.fallbackClassification(url),
            confidence: 0.5,
            reasoning: "Fallback classification due to AI parsing error"
          }));
          // Using fallback classification due to AI parsing error
        }

        // Generate embeddings for semantic search
        const textsForEmbedding = batch.map(url => 
          `${url.title} ${url.description} ${url.keywords.join(' ')}`
        );

        let embeddings: number[][] = [];
        try {
          const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: textsForEmbedding
          });
          embeddings = embeddingResponse.data.map(e => e.embedding);
        } catch (embeddingError) {
          console.error('Failed to generate embeddings:', embeddingError);
          // Use empty embeddings as fallback
          embeddings = batch.map(() => new Array(1536).fill(0));
        }

        // Merge classifications and embeddings with original metadata
        for (let j = 0; j < batch.length; j++) {
          const originalUrl = batch[j];
          const classification = classifications.find(c => c.url === originalUrl.url) || 
                               {page_type: this.fallbackClassification(originalUrl), confidence: 0.5};
          
          classifiedUrls.push({
            ...originalUrl,
            pageType: classification.page_type,
            titleEmbedding: embeddings[j] || new Array(1536).fill(0)
          });
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Failed to classify batch starting at index ${i}:`, error);
        
        // Add original URLs with fallback classification
        for (const url of batch) {
          classifiedUrls.push({
            ...url,
            pageType: this.fallbackClassification(url),
            titleEmbedding: new Array(1536).fill(0)
          });
        }
      }
    }

    return classifiedUrls;
  }

  /**
   * Fallback classification when AI fails
   */
  private fallbackClassification(url: URLMetadata): string {
    const urlLower = url.url.toLowerCase();
    const titleLower = url.title.toLowerCase();
    const descLower = url.description.toLowerCase();
    const combined = `${urlLower} ${titleLower} ${descLower}`;

    if (combined.includes('contact') || url.hasContactInfo) return 'contact';
    if (combined.includes('hour') || combined.includes('schedule')) return 'hours';
    if (combined.includes('service') || combined.includes('treatment')) return 'services';
    if (combined.includes('doctor') || combined.includes('provider') || combined.includes('staff')) return 'providers';
    if (combined.includes('location') || combined.includes('direction') || combined.includes('parking')) return 'location';
    if (combined.includes('form') || url.hasForms) return 'forms';
    if (combined.includes('insurance') || combined.includes('billing')) return 'insurance';
    if (combined.includes('appointment') || url.hasScheduling) return 'appointment';
    if (combined.includes('about') || combined.includes('mission')) return 'about';
    if (urlLower.includes('home') || urlLower === url.url) return 'home';
    
    return 'other';
  }

  /**
   * Store URL index in database
   */
  private async storeUrlIndex(clinicId: number, urls: URLMetadata[]): Promise<void> {
    try {
      // Clear existing index for this clinic
      await supabase
        .from('clinic_url_index')
        .delete()
        .eq('clinic_id', clinicId);

      // Insert new index entries
      const indexEntries = urls.map(url => ({
        clinic_id: clinicId,
        url: url.url,
        title: url.title,
        description: url.description,
        keywords: url.keywords,
        page_type: url.pageType,
        title_embedding: url.titleEmbedding,
        crawl_depth: url.crawlDepth,
        is_accessible: url.isAccessible,
        http_status: url.httpStatus,
        word_count: url.wordCount,
        has_forms: url.hasForms,
        has_contact_info: url.hasContactInfo,
        has_scheduling: url.hasScheduling
      }));

      const { error } = await supabase
        .from('clinic_url_index')
        .insert(indexEntries);

      if (error) {
        throw new Error(`Failed to store URL index: ${error.message}`);
      }

      console.log(`✅ Stored ${indexEntries.length} URLs in index for clinic ${clinicId}`);

    } catch (error) {
      console.error('❌ Failed to store URL index:', error);
      throw error;
    }
  }

  /**
   * Update crawl status in clinic_domains table
   */
  async updateCrawlStatus(
    clinicId: number, 
    domain: string, 
    status: 'success' | 'partial' | 'failed',
    pagesDiscovered: number,
    pagesAccessible: number,
    errors: string[]
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('clinic_domains')
        .update({
          last_crawled: new Date().toISOString(),
          last_crawl_status: status,
          pages_discovered: pagesDiscovered,
          pages_accessible: pagesAccessible,
          crawl_errors: errors
        })
        .eq('clinic_id', clinicId)
        .eq('domain', domain);

      if (error) {
        throw new Error(`Failed to update crawl status: ${error.message}`);
      }

    } catch (error) {
      console.error('❌ Failed to update crawl status:', error);
    }
  }

  /**
   * Process a list of URLs and extract metadata
   */
  private async processUrls(urls: string[], depth: number): Promise<{validUrls: URLMetadata[], errors: string[]}> {
    const validUrls: URLMetadata[] = [];
    const errors: string[] = [];
    
    // Process URLs in batches to avoid overwhelming the server
    for (let i = 0; i < urls.length; i += this.maxConcurrentRequests) {
      const batch = urls.slice(i, i + this.maxConcurrentRequests);
      
      const batchPromises = batch.map(async (url) => {
        try {
          await new Promise(resolve => setTimeout(resolve, this.requestDelay));
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.timeout);
          
          const response = await fetch(url, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'CalmClinic-Bot/1.0 (Healthcare Assistant)',
            }
          });
          
          clearTimeout(timeoutId);

          const metadata: URLMetadata = {
            url,
            title: '',
            description: '',
            keywords: [],
            pageType: 'unknown',
            crawlDepth: depth,
            isAccessible: response.ok,
            httpStatus: response.status,
            wordCount: 0,
            hasForms: false,
            hasContactInfo: false,
            hasScheduling: false
          };

          if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
            const html = await response.text();
            const $ = cheerio.load(html);
            
            metadata.title = $('title').text().trim() || $('h1').first().text().trim();
            metadata.description = $('meta[name="description"]').attr('content') || 
                                  $('meta[property="og:description"]').attr('content') || '';
            
            const keywordsContent = $('meta[name="keywords"]').attr('content');
            if (keywordsContent) {
              metadata.keywords = keywordsContent.split(',').map(k => k.trim());
            }
            
            const bodyText = $('body').text();
            metadata.wordCount = bodyText.split(/\s+/).length;
            metadata.hasForms = $('form').length > 0;
            metadata.hasContactInfo = /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})|(@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/.test(bodyText);
            metadata.hasScheduling = /schedule|appointment|book|calendar|availability/i.test(bodyText);
          }

          validUrls.push(metadata);

        } catch (error) {
          errors.push(`Failed to process ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      await Promise.all(batchPromises);
    }

    return {validUrls, errors};
  }
}