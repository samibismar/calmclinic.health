# 🧪 Hybrid RAG Testing Guide

## 🚀 Quick Start Testing

### 1. **Database Setup** (Do this first!)
```sql
-- Run these in your SQL editor in this order:
-- 1. database/hybrid_rag_schema.sql
-- 2. database/hybrid_rag_functions.sql

-- Then verify setup:
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('clinic_pages', 'clinic_url_index', 'rag_query_logs', 'clinic_domains');
-- Should return 4 rows
```

### 2. **Install Dependencies**
```bash
npm install cheerio fast-xml-parser
```

### 3. **Access the Test Dashboard**
Navigate to: **`http://localhost:3000/debug/hybrid-rag-test`**

## 🎯 Testing Workflow

### Step 1: Clinic Setup
1. Go to **`/debug/clinic-setup`**
2. Find a clinic in your database
3. Set the **Website URL** (e.g., `https://www.fortworthent.com`)
4. Click **"Start Crawl"** to discover and index the website
5. Wait for crawl to complete (you'll see status updates)

### Step 2: Test the Hybrid RAG
1. Go to **`/debug/hybrid-rag-test`**
2. Select the clinic you just set up
3. Try these test queries:

**Good starter queries:**
- `"What are your office hours?"`
- `"Where do I park?"`
- `"What insurance do you accept?"`
- `"What forms do I need to bring?"`
- `"How do I prepare for my appointment?"`

### Step 3: Understand the Results

The dashboard shows you **exactly** what happens:

#### 📊 **Summary Section**
- **Confidence Score** (0.0-1.0): How confident the AI is in the answer
- **Used Cache**: ✅ if found cached content, ❌ if needed fresh fetch
- **Web Search**: ✅ if fetched from website, ❌ if used cache only
- **Total Time**: How long the entire process took

#### 🔍 **Step-by-Step Execution**
You'll see each step with detailed information:

1. **Initialization** - Query and clinic setup
2. **Clinic Configuration Loaded** - RAG settings for this clinic
3. **Query Embedding Generated** - Converting text to vector
4. **Local RAG Query Complete** - Searching cached content
5. **Decision: Use Cache/Web Search** - Why it chose cache vs web
6. **Web Content Fetched** (if needed) - Which URLs were selected and why
7. **AI Response Generated** - Final answer creation
8. **Query Logged** - Analytics tracking

#### 💬 **Final AI Response**
The actual answer that would be given to patients

## 🔍 What to Look For

### ✅ **Successful Test Indicators**
- All steps show ✅ (green checkmarks)
- Confidence score > 0.6
- Relevant URLs selected (if web search used)
- Coherent final answer
- Fast response time (< 3000ms)

### ⚠️ **Common Issues & Solutions**

**"No URLs found in clinic index"**
- Solution: Make sure you ran the crawl and it completed successfully
- Check that the website URL is accessible
- Look at crawl errors in the clinic setup page

**"Low confidence scores (< 0.5)"**
- Normal for first tests - system learns over time
- Try more specific queries
- Check if website content is relevant to the query

**"Web search always failing"**
- Check your OpenAI API key is set correctly
- Verify the clinic website is accessible
- Look at the error details in the step-by-step section

**"Embedding generation failed"**
- Check `OPENAI_API_KEY` environment variable
- Verify OpenAI account has sufficient credits

## 🎮 Advanced Testing Scenarios

### Test Cache Behavior
1. Ask the same question twice
2. First time should use web search
3. Second time should use cache (faster response)

### Test Confidence Thresholds
1. Go to clinic setup and adjust `rag_confidence_threshold`
2. Lower values (0.4) = more likely to use cache
3. Higher values (0.8) = more likely to use web search

### Test Different Question Types
- **Hours**: "When are you open?" / "Are you open Saturday?"
- **Location**: "Where do I park?" / "What's your address?"
- **Services**: "Do you do surgery?" / "What treatments do you offer?"
- **Insurance**: "Do you take Blue Cross?" / "What insurance do you accept?"
- **Forms**: "What do I need to bring?" / "Do you have patient forms?"

## 📊 Monitoring & Analytics

### View RAG Analytics
**URL**: `/api/rag-monitoring`

This shows:
- Cache hit rates
- Average confidence scores
- Response times
- Popular query types
- Web search frequency

### Check Crawl Status
**URL**: `/api/clinic-crawl`

This shows:
- Number of URLs discovered
- Pages accessible vs errors
- Last crawl timestamp
- Index health status

## 🐛 Troubleshooting

### Debug Mode
The test dashboard runs in debug mode, which means:
- It will always try web search even if cache is available
- You get detailed step-by-step information
- All errors are captured and displayed

### Database Queries
Check what's in your database:

```sql
-- Check URL index
SELECT COUNT(*) as total_urls, 
       COUNT(*) FILTER (WHERE is_accessible = true) as accessible_urls
FROM clinic_url_index WHERE clinic_id = 1;

-- Check cached content
SELECT COUNT(*) as cached_pages, 
       MAX(fetch_timestamp) as last_fetch
FROM clinic_pages WHERE clinic_id = 1;

-- Check recent queries
SELECT query_text, rag_confidence, used_web_search, created_at
FROM rag_query_logs 
WHERE clinic_id = 1 
ORDER BY created_at DESC 
LIMIT 10;
```

### API Testing
Test individual endpoints:

```bash
# Test clinic crawl
curl -X POST http://localhost:3000/api/clinic-crawl \
  -H "Content-Type: application/json" \
  -d '{"websiteUrl": "https://example-clinic.com"}'

# Test RAG monitoring
curl http://localhost:3000/api/rag-monitoring
```

## 🎯 Success Criteria

Your hybrid RAG system is working correctly when:

1. **URL Discovery Works**: Clinic websites are crawled and indexed automatically
2. **Smart Caching**: Repeated questions use cache (faster, cheaper)
3. **Intelligent Fallback**: When cache confidence is low, it fetches fresh content
4. **Relevant URL Selection**: It finds the right pages (e.g., /hours for time questions)
5. **Quality Answers**: Final responses are helpful and accurate
6. **Good Performance**: Most queries complete in under 3 seconds
7. **Error Handling**: System gracefully handles website errors and API failures

## 🚀 Ready for Production

Once testing is successful:
1. Update your main chat interface to use `/api/responses-hybrid`
2. Set up automated crawling for all clinic websites
3. Monitor performance with the analytics dashboard
4. Configure appropriate confidence thresholds per clinic

Your hybrid RAG system transforms clinic AI from static knowledge bases into intelligent agents that know exactly where to find information! 🎉