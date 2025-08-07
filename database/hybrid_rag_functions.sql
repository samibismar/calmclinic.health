-- Database functions to support hybrid RAG operations
-- These functions enable vector similarity search and analytics

-- =============================================
-- 1. VECTOR SIMILARITY SEARCH FUNCTION
-- =============================================
-- Function to find similar URLs based on vector embeddings
CREATE OR REPLACE FUNCTION match_clinic_urls(
  clinic_id INT,
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 10
)
RETURNS TABLE(
  url TEXT,
  title TEXT,
  description TEXT,
  page_type TEXT,
  crawl_depth INT,
  is_accessible BOOLEAN,
  word_count INT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cui.url,
    cui.title,
    cui.description,
    cui.page_type,
    cui.crawl_depth,
    cui.is_accessible,
    cui.word_count,
    1 - (cui.title_embedding <=> query_embedding) AS similarity
  FROM clinic_url_index cui
  WHERE cui.clinic_id = match_clinic_urls.clinic_id
    AND cui.is_accessible = true
    AND 1 - (cui.title_embedding <=> query_embedding) > match_threshold
  ORDER BY cui.title_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =============================================
-- 2. SEMANTIC CONTENT SEARCH FUNCTION
-- =============================================
-- Function to search cached page content by vector similarity
CREATE OR REPLACE FUNCTION match_clinic_content(
  clinic_id INT,
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE(
  url TEXT,
  title TEXT,
  summary TEXT,
  fetch_timestamp TIMESTAMP WITH TIME ZONE,
  access_count INT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.url,
    cp.title,
    cp.summary,
    cp.fetch_timestamp,
    cp.access_count,
    1 - (cp.embedding <=> query_embedding) AS similarity
  FROM clinic_pages cp
  WHERE cp.clinic_id = match_clinic_content.clinic_id
    AND 1 - (cp.embedding <=> query_embedding) > match_threshold
  ORDER BY cp.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =============================================
-- 3. PAGE ACCESS TRACKING FUNCTION
-- =============================================
-- Function to increment page access count for analytics
CREATE OR REPLACE FUNCTION increment_page_access(
  clinic_id INT,
  page_url TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE clinic_pages 
  SET access_count = access_count + 1,
      updated_at = NOW()
  WHERE clinic_pages.clinic_id = increment_page_access.clinic_id 
    AND clinic_pages.url = page_url;
    
  -- If no rows were updated, the page doesn't exist in cache yet
  -- This is normal and expected
END;
$$;

-- =============================================
-- 4. RAG PERFORMANCE ANALYTICS FUNCTION
-- =============================================
-- Function to get RAG performance metrics for a clinic
CREATE OR REPLACE FUNCTION get_rag_analytics(
  clinic_id INT,
  days_back INT DEFAULT 30
)
RETURNS TABLE(
  total_queries INT,
  avg_confidence DECIMAL(4,3),
  cache_hit_rate DECIMAL(4,3),
  web_search_rate DECIMAL(4,3),
  avg_response_time_ms INT,
  popular_intents TEXT[],
  top_fetched_urls TEXT[]
)
LANGUAGE plpgsql
AS $$
DECLARE
  start_date TIMESTAMP WITH TIME ZONE;
BEGIN
  start_date := NOW() - INTERVAL '1 day' * days_back;
  
  RETURN QUERY
  SELECT
    COUNT(*)::INT AS total_queries,
    AVG(rql.rag_confidence) AS avg_confidence,
    (COUNT(*) FILTER (WHERE rql.cache_hit = true)::DECIMAL / NULLIF(COUNT(*), 0)) AS cache_hit_rate,
    (COUNT(*) FILTER (WHERE rql.used_web_search = true)::DECIMAL / NULLIF(COUNT(*), 0)) AS web_search_rate,
    AVG(rql.total_response_time_ms)::INT AS avg_response_time_ms,
    ARRAY_AGG(DISTINCT rql.query_intent) FILTER (WHERE rql.query_intent IS NOT NULL) AS popular_intents,
    ARRAY_AGG(DISTINCT unnest(rql.urls_fetched)) FILTER (WHERE array_length(rql.urls_fetched, 1) > 0) AS top_fetched_urls
  FROM rag_query_logs rql
  WHERE rql.clinic_id = get_rag_analytics.clinic_id
    AND rql.created_at >= start_date;
END;
$$;

-- =============================================
-- 5. CONTENT FRESHNESS CHECK FUNCTION
-- =============================================
-- Function to identify stale cached content that needs refreshing
CREATE OR REPLACE FUNCTION find_stale_content(
  clinic_id INT,
  hours_threshold INT DEFAULT 48
)
RETURNS TABLE(
  url TEXT,
  title TEXT,
  fetch_timestamp TIMESTAMP WITH TIME ZONE,
  access_count INT,
  hours_old NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  cutoff_time TIMESTAMP WITH TIME ZONE;
BEGIN
  cutoff_time := NOW() - INTERVAL '1 hour' * hours_threshold;
  
  RETURN QUERY
  SELECT
    cp.url,
    cp.title,
    cp.fetch_timestamp,
    cp.access_count,
    EXTRACT(EPOCH FROM (NOW() - cp.fetch_timestamp)) / 3600 AS hours_old
  FROM clinic_pages cp
  WHERE cp.clinic_id = find_stale_content.clinic_id
    AND cp.fetch_timestamp < cutoff_time
    AND cp.access_count > 0  -- Only consider content that's actually been accessed
  ORDER BY cp.access_count DESC, cp.fetch_timestamp ASC;
END;
$$;

-- =============================================
-- 6. HYBRID RAG QUERY FUNCTION
-- =============================================
-- Main function that combines local RAG with web search decision logic
CREATE OR REPLACE FUNCTION hybrid_rag_query(
  clinic_id INT,
  query_text TEXT,
  query_embedding VECTOR(1536),
  confidence_threshold DECIMAL(3,2) DEFAULT 0.60
)
RETURNS TABLE(
  source TEXT, -- 'cache' or 'web_needed'
  content_found BOOLEAN,
  best_match_url TEXT,
  best_match_title TEXT,
  best_match_summary TEXT,
  confidence_score DECIMAL(4,3),
  recommended_urls TEXT[] -- URLs to fetch if web search needed
)
LANGUAGE plpgsql
AS $$
DECLARE
  best_cached_match RECORD;
  url_matches TEXT[];
BEGIN
  -- First, try to find cached content
  SELECT INTO best_cached_match
    url, title, summary, 
    1 - (embedding <=> query_embedding) AS similarity
  FROM clinic_pages cp
  WHERE cp.clinic_id = hybrid_rag_query.clinic_id
  ORDER BY cp.embedding <=> query_embedding
  LIMIT 1;
  
  -- If we found cached content with good confidence, return it
  IF best_cached_match IS NOT NULL AND best_cached_match.similarity >= confidence_threshold THEN
    RETURN QUERY
    SELECT
      'cache'::TEXT,
      true,
      best_cached_match.url,
      best_cached_match.title,
      best_cached_match.summary,
      best_cached_match.similarity,
      ARRAY[]::TEXT[]
    ;
    RETURN;
  END IF;
  
  -- Otherwise, find URLs that should be fetched from the web
  SELECT ARRAY_AGG(cui.url ORDER BY 1 - (cui.title_embedding <=> query_embedding) DESC)
  INTO url_matches
  FROM clinic_url_index cui
  WHERE cui.clinic_id = hybrid_rag_query.clinic_id
    AND cui.is_accessible = true
    AND 1 - (cui.title_embedding <=> query_embedding) > 0.3
  LIMIT 3;
  
  -- Return web search recommendation
  RETURN QUERY
  SELECT
    'web_needed'::TEXT,
    false,
    ''::TEXT,
    ''::TEXT,
    ''::TEXT,
    COALESCE(best_cached_match.similarity, 0.0),
    COALESCE(url_matches, ARRAY[]::TEXT[])
  ;
END;
$$;

-- =============================================
-- 7. CLINIC URL HEALTH CHECK FUNCTION
-- =============================================
-- Function to check the health of a clinic's URL index
CREATE OR REPLACE FUNCTION check_url_index_health(clinic_id INT)
RETURNS TABLE(
  total_urls INT,
  accessible_urls INT,
  recent_crawl_urls INT,
  page_types_covered TEXT[],
  avg_crawl_depth DECIMAL(3,1),
  needs_recrawl BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  recent_threshold TIMESTAMP WITH TIME ZONE;
BEGIN
  recent_threshold := NOW() - INTERVAL '7 days';
  
  RETURN QUERY
  SELECT
    COUNT(*)::INT AS total_urls,
    COUNT(*) FILTER (WHERE cui.is_accessible = true)::INT AS accessible_urls,
    COUNT(*) FILTER (WHERE cui.last_indexed >= recent_threshold)::INT AS recent_crawl_urls,
    ARRAY_AGG(DISTINCT cui.page_type) AS page_types_covered,
    AVG(cui.crawl_depth) AS avg_crawl_depth,
    (COUNT(*) FILTER (WHERE cui.last_indexed < recent_threshold)::FLOAT / NULLIF(COUNT(*), 0) > 0.5) AS needs_recrawl
  FROM clinic_url_index cui
  WHERE cui.clinic_id = check_url_index_health.clinic_id;
END;
$$;

-- =============================================
-- 8. GRANT PERMISSIONS
-- =============================================
-- Grant execute permissions to the application role
-- Note: Adjust role names based on your actual database setup

-- Grant permissions to service role (used by Supabase)
GRANT EXECUTE ON FUNCTION match_clinic_urls TO service_role;
GRANT EXECUTE ON FUNCTION match_clinic_content TO service_role;
GRANT EXECUTE ON FUNCTION increment_page_access TO service_role;
GRANT EXECUTE ON FUNCTION get_rag_analytics TO service_role;
GRANT EXECUTE ON FUNCTION find_stale_content TO service_role;
GRANT EXECUTE ON FUNCTION hybrid_rag_query TO service_role;
GRANT EXECUTE ON FUNCTION check_url_index_health TO service_role;

-- Grant permissions to authenticated users (if needed)
GRANT EXECUTE ON FUNCTION match_clinic_urls TO authenticated;
GRANT EXECUTE ON FUNCTION match_clinic_content TO authenticated;
GRANT EXECUTE ON FUNCTION get_rag_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION check_url_index_health TO authenticated;

-- =============================================
-- 9. INDEXES FOR OPTIMAL PERFORMANCE
-- =============================================
-- Additional indexes to optimize the functions above

-- Composite index for clinic + accessibility filtering
CREATE INDEX IF NOT EXISTS idx_clinic_url_index_clinic_accessible 
ON clinic_url_index(clinic_id, is_accessible) 
WHERE is_accessible = true;

-- Composite index for clinic + timestamp for freshness queries
CREATE INDEX IF NOT EXISTS idx_clinic_pages_clinic_timestamp 
ON clinic_pages(clinic_id, fetch_timestamp DESC);

-- Index for RAG query logs analytics
CREATE INDEX IF NOT EXISTS idx_rag_logs_clinic_created_confidence 
ON rag_query_logs(clinic_id, created_at DESC, rag_confidence);

-- =============================================
-- 10. SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Hybrid RAG database functions created successfully!';
    RAISE NOTICE '🔍 Vector similarity search functions ready';
    RAISE NOTICE '📊 Analytics and monitoring functions available';
    RAISE NOTICE '⚡ Performance indexes created';
    RAISE NOTICE '🔐 Permissions granted to service_role and authenticated users';
END $$;