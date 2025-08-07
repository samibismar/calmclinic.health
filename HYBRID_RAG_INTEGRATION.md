# Hybrid RAG System Integration Guide

## 🚀 Quick Start

Your Enhanced Hybrid RAG + Intelligent Website Navigation System is now ready! Here's how to get it running:

### 1. Database Setup

```bash
# Run the database migrations
psql -d your_database -f database/hybrid_rag_schema.sql
psql -d your_database -f database/hybrid_rag_functions.sql
```

### 2. Install Dependencies

```bash
npm install cheerio fast-xml-parser
```

### 3. Environment Variables

Ensure you have these environment variables set:
```bash
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

## 🎯 How It Works

### For Your Users (Zero Configuration)
1. **Clinic provides their homepage URL** → System automatically discovers all sub-pages
2. **Builds semantic index** → AI classifies pages (hours, parking, forms, services, etc.)
3. **Ready to answer questions** → Intelligent routing to exact information

### Example User Journey
```
Patient: "Where do I park?"
System: 
├── Searches URL index semantically for "parking"
├── Finds /parking-info and /visitor-guide pages  
├── Fetches and summarizes relevant content
└── Provides specific parking instructions
```

## 🔧 Integration Points

### Replace Your Current Chat API
Update your chat components to use the new hybrid endpoint:

```typescript
// Instead of /api/chat, use:
const response = await fetch('/api/responses-hybrid', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages,
    clinicId: clinic.id,
    providerId: provider?.id,
    useHybridRAG: true,
    maxWebPages: 3
  })
});
```

### Initialize Clinic URL Index
For each clinic, run the URL discovery:

```typescript
// Trigger URL crawling for a clinic
await fetch('/api/clinic-crawl', {
  method: 'POST',
  body: JSON.stringify({
    websiteUrl: 'https://clinic-website.com',
    forceRecrawl: false
  })
});
```

## 📊 Monitoring Dashboard

Access RAG performance data:

```typescript
// Get analytics for founder dashboard
const analytics = await fetch('/api/rag-monitoring?details=true');
const data = await analytics.json();

// Key metrics available:
// - Cache hit rates
// - Web search frequency  
// - Response confidence scores
// - Popular query types
// - Performance trends
```

## 🎛️ System Configuration

Each clinic can customize their RAG behavior via the `clinics` table:

```sql
UPDATE clinics SET 
  rag_confidence_threshold = 0.65,  -- When to trigger web search
  rag_cache_ttl_hours = 48,         -- How long to cache content
  enable_web_search = true,         -- Allow live website fetching
  max_web_pages_per_query = 3       -- Limit pages fetched per query
WHERE id = clinic_id;
```

## 🔍 How the Hybrid RAG Works

### Phase 1: Local Knowledge Check
```
User Query → Generate Embedding → Search Vector Store → Check Confidence
```

### Phase 2: Intelligent Web Search (if needed)
```
Low Confidence → Find Relevant URLs → Semantic URL Matching → Fetch Top 1-3 Pages
```

### Phase 3: Smart Caching
```
Fresh Content → AI Summarization → Vector Embedding → Cache with Hash
```

### Phase 4: Continuous Learning
```
Each Query → Analytics Logging → Performance Monitoring → Index Health
```

## 🛠️ Advanced Features

### Cache Invalidation
```typescript
// Force refresh specific pages
await intelligentFetch.invalidateCache(clinicId, [
  'https://clinic.com/hours',
  'https://clinic.com/services'
]);
```

### Batch Clinic Setup
```typescript
// Initialize multiple clinics
const clinics = [
  { id: 1, website: 'https://clinic1.com' },
  { id: 2, website: 'https://clinic2.com' }
];

for (const clinic of clinics) {
  await ragService.initializeClinicIndex(clinic.id, clinic.website);
}
```

## 📈 Performance Monitoring

The system tracks:
- **Cache Hit Rate**: Percentage of queries answered from cache
- **Web Search Rate**: How often live fetching is needed
- **Response Confidence**: AI confidence in answers (0.0-1.0)
- **Response Time**: End-to-end query processing time
- **Popular Intents**: Most common question types
- **Content Coverage**: Number of indexed pages per clinic

## 🔐 Security & Privacy

- ✅ **Domain Scoping**: Only searches approved clinic domains
- ✅ **Rate Limiting**: Polite crawling with delays
- ✅ **Data Isolation**: Each clinic's data stays separate
- ✅ **Cache Expiry**: Automatic cleanup of stale content
- ✅ **Error Handling**: Graceful fallbacks when services fail

## 🚨 Troubleshooting

### Common Issues

**No URLs found during crawling:**
- Check if website has sitemap.xml
- Verify website is accessible
- Check crawl depth settings

**Low confidence scores:**
- Add more clinic data to vector store
- Adjust confidence threshold
- Check if website content is relevant

**Slow response times:**
- Monitor concurrent fetch limits
- Check database query performance
- Consider increasing cache TTL

### Debug Information

All operations are logged with detailed information:
```
🔍 Finding relevant content for query: "parking info"
📋 Found 3 relevant URLs
💾 Found 1 cached summaries  
🌐 Fetching 2 new pages
✅ Content fetch completed in 1,240ms
```

## 🎉 Benefits

### For Clinics
- **Zero Configuration**: Just provide homepage URL
- **Always Current**: Live content when cache expires
- **Intelligent**: Finds exact information patients need
- **Scalable**: Handles any size clinic website

### For Patients  
- **Precise Answers**: Gets specific information, not generic responses
- **Fast Response**: Cached content for common questions
- **Comprehensive**: Access to all clinic information
- **Reliable**: Graceful fallbacks when services are unavailable

### For You (Founder)
- **Rich Analytics**: Detailed performance monitoring
- **Continuous Learning**: System improves over time
- **Cost Efficient**: Smart caching reduces API calls
- **Maintainable**: Clean, modular architecture

## 🔄 Migration from Legacy System

The new system is designed to work alongside your existing setup:

1. **Database**: New tables don't interfere with existing ones
2. **APIs**: New endpoints, existing ones unchanged  
3. **Frontend**: Update components when ready
4. **Gradual Rollout**: Test with specific clinics first

Your hybrid RAG system is now ready to transform clinic AI from static knowledge bases into intelligent agents that know exactly where to find information! 🎊