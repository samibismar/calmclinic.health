-- Hybrid RAG + Intelligent Website Navigation Database Schema
-- Extends CalmClinic to support intelligent clinic website content discovery and caching

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================
-- 1. CLINIC PAGES - Vector store for cached website content
-- =============================================
CREATE TABLE IF NOT EXISTS clinic_pages (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    summary TEXT, -- AI-generated summary of the page content
    content_hash TEXT, -- SHA-256 hash for cache invalidation
    embedding vector(1536), -- OpenAI ada-002 dimensions for semantic search
    fetch_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_count INTEGER DEFAULT 0, -- Track popular pages
    response_time_ms INTEGER, -- Track fetch performance
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_clinic_page UNIQUE(clinic_id, url)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_clinic_pages_clinic_id ON clinic_pages(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_pages_embedding ON clinic_pages USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_clinic_pages_access_count ON clinic_pages(clinic_id, access_count DESC);
CREATE INDEX IF NOT EXISTS idx_clinic_pages_updated ON clinic_pages(clinic_id, updated_at DESC);

-- =============================================
-- 2. CLINIC URL INDEX - Semantic metadata for intelligent URL selection
-- =============================================
CREATE TABLE IF NOT EXISTS clinic_url_index (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT, -- Meta description or extracted summary
    keywords TEXT[], -- Extracted keywords from page
    page_type TEXT, -- 'hours', 'parking', 'forms', 'services', 'insurance', 'providers', etc.
    title_embedding vector(1536), -- Embedding of title + description for semantic matching
    crawl_depth INTEGER DEFAULT 0, -- How many clicks from homepage
    last_indexed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_accessible BOOLEAN DEFAULT true, -- Whether page returned 200 status
    http_status INTEGER, -- Last HTTP status code
    
    -- Content metadata
    word_count INTEGER, -- Rough content size
    has_forms BOOLEAN DEFAULT false, -- Contains downloadable forms
    has_contact_info BOOLEAN DEFAULT false, -- Contains phone/address
    has_scheduling BOOLEAN DEFAULT false, -- Contains appointment scheduling
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_clinic_url UNIQUE(clinic_id, url)
);

-- Indexes for URL discovery and semantic search
CREATE INDEX IF NOT EXISTS idx_clinic_url_clinic_id ON clinic_url_index(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_url_page_type ON clinic_url_index(clinic_id, page_type);
CREATE INDEX IF NOT EXISTS idx_clinic_url_embedding ON clinic_url_index USING ivfflat (title_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_clinic_url_accessible ON clinic_url_index(clinic_id, is_accessible);
CREATE INDEX IF NOT EXISTS idx_clinic_url_keywords ON clinic_url_index USING GIN(keywords);

-- =============================================
-- 3. RAG QUERY LOGS - Performance monitoring and analytics
-- =============================================
CREATE TABLE IF NOT EXISTS rag_query_logs (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    query_intent TEXT, -- Classified intent: 'hours', 'parking', 'forms', etc.
    
    -- RAG Performance Metrics
    rag_confidence DECIMAL(4,3), -- 0.000 to 1.000
    used_web_search BOOLEAN DEFAULT false,
    urls_fetched TEXT[], -- URLs that were fetched for this query
    urls_matched INTEGER DEFAULT 0, -- Number of URLs found in index
    cache_hit BOOLEAN DEFAULT false, -- Whether response came from cache
    
    -- Performance Metrics
    total_response_time_ms INTEGER,
    rag_query_time_ms INTEGER,
    web_fetch_time_ms INTEGER,
    summarization_time_ms INTEGER,
    
    -- Results
    final_confidence DECIMAL(4,3), -- Final confidence after web search
    user_feedback TEXT, -- thumbs up/down if available
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics and monitoring
CREATE INDEX IF NOT EXISTS idx_rag_logs_clinic_id ON rag_query_logs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_rag_logs_created ON rag_query_logs(clinic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rag_logs_confidence ON rag_query_logs(clinic_id, rag_confidence);
CREATE INDEX IF NOT EXISTS idx_rag_logs_web_search ON rag_query_logs(clinic_id, used_web_search);
CREATE INDEX IF NOT EXISTS idx_rag_logs_intent ON rag_query_logs(clinic_id, query_intent);

-- =============================================
-- 4. CLINIC DOMAINS - Configuration for website crawling
-- =============================================
CREATE TABLE IF NOT EXISTS clinic_domains (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    domain TEXT NOT NULL, -- e.g., 'fortworthent.com'
    full_url TEXT, -- e.g., 'https://www.fortworthent.com'
    is_primary BOOLEAN DEFAULT false, -- Primary domain for this clinic
    
    -- Crawling Configuration
    max_crawl_depth INTEGER DEFAULT 3, -- Maximum clicks from homepage
    crawl_delay_ms INTEGER DEFAULT 1000, -- Polite crawling delay
    max_pages_per_crawl INTEGER DEFAULT 50, -- Limit to prevent overload
    
    -- Crawling Status
    last_crawled TIMESTAMP WITH TIME ZONE,
    last_crawl_status TEXT, -- 'success', 'partial', 'failed'
    pages_discovered INTEGER DEFAULT 0,
    pages_accessible INTEGER DEFAULT 0,
    crawl_errors TEXT[], -- Error messages from last crawl
    
    -- Domain Metadata
    has_sitemap BOOLEAN DEFAULT false,
    sitemap_url TEXT,
    robots_txt_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_clinic_domain UNIQUE(clinic_id, domain)
);

-- Indexes for domain management
CREATE INDEX IF NOT EXISTS idx_clinic_domains_clinic_id ON clinic_domains(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_domains_primary ON clinic_domains(clinic_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_clinic_domains_last_crawled ON clinic_domains(last_crawled);

-- =============================================
-- 5. EXTEND EXISTING CLINICS TABLE
-- =============================================
-- Add RAG configuration to existing clinics table
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS rag_confidence_threshold DECIMAL(3,2) DEFAULT 0.60,
    ADD COLUMN IF NOT EXISTS rag_cache_ttl_hours INTEGER DEFAULT 24,
    ADD COLUMN IF NOT EXISTS enable_web_search BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS max_web_pages_per_query INTEGER DEFAULT 3,
    ADD COLUMN IF NOT EXISTS website_url TEXT,
    ADD COLUMN IF NOT EXISTS last_url_discovery TIMESTAMP WITH TIME ZONE;

-- =============================================
-- 6. TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_clinic_pages_updated_at 
    BEFORE UPDATE ON clinic_pages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinic_url_index_updated_at 
    BEFORE UPDATE ON clinic_url_index 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinic_domains_updated_at 
    BEFORE UPDATE ON clinic_domains 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 7. HELPFUL VIEWS FOR MONITORING
-- =============================================

-- RAG Performance Summary per Clinic
CREATE OR REPLACE VIEW rag_performance_summary AS
SELECT 
    c.id as clinic_id,
    c.clinic_name,
    COUNT(rql.*) as total_queries,
    AVG(rql.rag_confidence) as avg_rag_confidence,
    COUNT(*) FILTER (WHERE rql.used_web_search = true) as web_searches,
    COUNT(*) FILTER (WHERE rql.cache_hit = true) as cache_hits,
    AVG(rql.total_response_time_ms) as avg_response_time_ms,
    COUNT(DISTINCT rql.query_intent) as unique_intents,
    MAX(rql.created_at) as last_query_at
FROM public.clinics c
LEFT JOIN rag_query_logs rql ON c.id = rql.clinic_id
WHERE rql.created_at >= NOW() - INTERVAL '30 days'
GROUP BY c.id, c.clinic_name;

-- URL Index Health per Clinic
CREATE OR REPLACE VIEW url_index_health AS
SELECT 
    c.id as clinic_id,
    c.clinic_name,
    COUNT(cui.*) as total_urls,
    COUNT(*) FILTER (WHERE cui.is_accessible = true) as accessible_urls,
    COUNT(*) FILTER (WHERE cui.last_indexed > NOW() - INTERVAL '7 days') as recently_indexed,
    COUNT(DISTINCT cui.page_type) as page_types_covered,
    cd.last_crawled,
    cd.pages_discovered,
    cd.pages_accessible
FROM public.clinics c
LEFT JOIN clinic_url_index cui ON c.id = cui.clinic_id
LEFT JOIN clinic_domains cd ON c.id = cd.clinic_id AND cd.is_primary = true
GROUP BY c.id, c.clinic_name, cd.last_crawled, cd.pages_discovered, cd.pages_accessible;

-- =============================================
-- 8. SAMPLE DATA AND COMMENTS
-- =============================================

-- Table comments for documentation
COMMENT ON TABLE clinic_pages IS 'Cached and summarized website content with vector embeddings for semantic search';
COMMENT ON TABLE clinic_url_index IS 'Complete URL index with semantic metadata for intelligent page selection';
COMMENT ON TABLE rag_query_logs IS 'Performance monitoring and analytics for RAG queries';
COMMENT ON TABLE clinic_domains IS 'Domain configuration and crawling status for each clinic';

COMMENT ON COLUMN clinic_pages.embedding IS 'OpenAI ada-002 embedding (1536 dimensions) of the page summary for semantic similarity search';
COMMENT ON COLUMN clinic_url_index.title_embedding IS 'Embedding of page title and description for semantic URL matching';
COMMENT ON COLUMN clinic_url_index.page_type IS 'Automatically classified page type: hours, parking, forms, services, insurance, providers, about, contact';
COMMENT ON COLUMN rag_query_logs.rag_confidence IS 'Confidence score from local vector search (0.0-1.0), triggers web search if below threshold';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Hybrid RAG schema created successfully!';
    RAISE NOTICE '📊 Tables: clinic_pages, clinic_url_index, rag_query_logs, clinic_domains';
    RAISE NOTICE '🔍 Vector indexes created for semantic search';
    RAISE NOTICE '📈 Performance monitoring views available';
END $$;