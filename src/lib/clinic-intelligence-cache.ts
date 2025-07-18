// Clinic Intelligence Caching Layer
// Provides intelligent caching for clinic data to improve Response API performance

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class ClinicIntelligenceCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly LONG_TTL = 30 * 60 * 1000; // 30 minutes for stable data

  // Generate cache key for clinic data
  private getCacheKey(clinicId: number, type: string, params?: Record<string, unknown>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `clinic:${clinicId}:${type}:${paramString}`;
  }

  // Check if cache entry is valid
  private isValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  // Get data from cache
  get<T>(clinicId: number, type: string, params?: Record<string, unknown>): T | null {
    const key = this.getCacheKey(clinicId, type, params);
    const entry = this.cache.get(key);
    
    if (entry && this.isValid(entry)) {
      console.log(`📋 Cache HIT for ${type}:`, clinicId);
      return entry.data as T;
    }
    
    if (entry) {
      this.cache.delete(key); // Remove expired entry
    }
    
    console.log(`🔍 Cache MISS for ${type}:`, clinicId);
    return null;
  }

  // Set data in cache
  set<T>(clinicId: number, type: string, data: T, params?: Record<string, unknown>, customTtl?: number): void {
    const key = this.getCacheKey(clinicId, type, params);
    const ttl = customTtl || this.getTtlForType(type);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    console.log(`💾 Cached ${type} for clinic ${clinicId} (TTL: ${ttl}ms)`);
  }

  // Get appropriate TTL based on data type
  private getTtlForType(type: string): number {
    // Stable data that rarely changes - longer TTL
    const stableTypes = ['contact_info', 'clinic_hours', 'insurance_info', 'provider_info'];
    
    // Dynamic data that may change more frequently - shorter TTL  
    // const dynamicTypes = ['services', 'conditions', 'policies'];
    
    if (stableTypes.includes(type)) {
      return this.LONG_TTL;
    }
    
    return this.DEFAULT_TTL;
  }

  // Clear cache for specific clinic
  clearClinic(clinicId: number): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.startsWith(`clinic:${clinicId}:`)
    );
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🗑️ Cleared cache for clinic ${clinicId}:`, keysToDelete.length, 'entries');
  }

  // Clear all cache
  clearAll(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ Cleared entire cache:`, size, 'entries');
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl,
        valid: this.isValid(entry)
      }))
    };
  }

  // Cleanup expired entries
  cleanup(): void {
    // const beforeSize = this.cache.size;
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (!this.isValid(entry)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`🧹 Cleaned up ${keysToDelete.length} expired cache entries`);
    }
  }
}

// Export singleton instance
export const clinicCache = new ClinicIntelligenceCache();

// Automatic cleanup every 10 minutes
if (typeof window === 'undefined') { // Only run on server
  setInterval(() => {
    clinicCache.cleanup();
  }, 10 * 60 * 1000);
}

// Context-aware tool selection based on conversation history
export class ToolContextAnalyzer {
  // Analyze conversation to suggest relevant tools
  static analyzeContext(messages: Array<{role: string, content: string}>): string[] {
    const recentMessages = messages.slice(-3); // Look at last 3 messages
    const conversationText = recentMessages
      .map(m => m.content.toLowerCase())
      .join(' ');

    const suggestedTools: string[] = [];

    // Service-related keywords
    if (this.hasKeywords(conversationText, ['service', 'services', 'treatment', 'procedure', 'surgery', 'exam'])) {
      suggestedTools.push('get_clinic_services');
    }

    // Hours/scheduling keywords
    if (this.hasKeywords(conversationText, ['hours', 'open', 'closed', 'schedule', 'appointment', 'time'])) {
      suggestedTools.push('get_clinic_hours', 'get_appointment_policies');
    }

    // Insurance keywords
    if (this.hasKeywords(conversationText, ['insurance', 'coverage', 'plan', 'pay', 'payment', 'cost', 'bill'])) {
      suggestedTools.push('get_insurance_info');
    }

    // Contact keywords
    if (this.hasKeywords(conversationText, ['phone', 'call', 'contact', 'address', 'location', 'reach'])) {
      suggestedTools.push('get_contact_info');
    }

    // Provider keywords
    if (this.hasKeywords(conversationText, ['doctor', 'provider', 'specialist', 'experience', 'background'])) {
      suggestedTools.push('get_provider_info');
    }

    // Condition keywords
    if (this.hasKeywords(conversationText, ['condition', 'disease', 'symptoms', 'diagnosis', 'treat'])) {
      suggestedTools.push('get_conditions_treated');
    }

    // General search keywords - removed search_clinic_knowledge tool
    // if (this.hasKeywords(conversationText, ['find', 'search', 'look', 'information', 'details', 'about'])) {
    //   suggestedTools.push('search_clinic_knowledge');
    // }

    return [...new Set(suggestedTools)]; // Remove duplicates
  }

  // Check if text contains any of the keywords
  private static hasKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  // Get priority order for tools based on context
  static getToolPriority(messages: Array<{role: string, content: string}>): Record<string, number> {
    const suggestedTools = this.analyzeContext(messages);
    const priority: Record<string, number> = {};

    suggestedTools.forEach((tool, index) => {
      priority[tool] = suggestedTools.length - index; // Higher number = higher priority
    });

    return priority;
  }
}

// Enhanced search with context
export class ContextualSearch {
  // Search with conversation context
  static buildContextualQuery(originalQuery: string, messages: Array<{role: string, content: string}>): string {
    const recentContext = messages.slice(-2)
      .map(m => m.content)
      .join(' ');

    // Extract key terms from recent conversation
    const contextTerms = this.extractKeyTerms(recentContext);
    
    // Combine original query with context terms
    if (contextTerms.length > 0) {
      return `${originalQuery} ${contextTerms.join(' ')}`.trim();
    }
    
    return originalQuery;
  }

  // Extract relevant terms from conversation context
  private static extractKeyTerms(text: string): string[] {
    const medicalTerms = [
      'eye', 'vision', 'cataract', 'glaucoma', 'diabetes', 'surgery',
      'exam', 'screening', 'treatment', 'glasses', 'contact', 'lens'
    ];

    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => 
      medicalTerms.includes(word) && word.length > 3
    ).slice(0, 3); // Limit to 3 terms
  }
}