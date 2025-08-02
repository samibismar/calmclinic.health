# SQL Setup Commands for Hybrid RAG System

Run these commands in your SQL editor **in this exact order**:

## 1. First, run the main schema:
```sql
-- Run the entire contents of: database/hybrid_rag_schema.sql
-- This creates all the tables, indexes, views, and triggers
```

## 2. Then run the database functions:
```sql
-- Run the entire contents of: database/hybrid_rag_functions.sql
-- This creates all the vector search and analytics functions
```

## 3. Verify the setup worked:
```sql
-- Check that all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN (
  'clinic_pages', 
  'clinic_url_index', 
  'rag_query_logs', 
  'clinic_domains'
) 
AND table_schema = 'public';

-- Should return 4 rows
```

## 4. Check that pgvector extension is enabled:
```sql
-- This should return the vector extension
SELECT * FROM pg_extension WHERE extname = 'vector';
```

## 5. Verify the new columns were added to clinics table:
```sql
-- Check that RAG config columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'clinics' 
AND column_name IN (
  'rag_confidence_threshold',
  'rag_cache_ttl_hours', 
  'enable_web_search',
  'max_web_pages_per_query',
  'website_url',
  'last_url_discovery'
);

-- Should return 6 rows
```

## 6. Test that vector functions work:
```sql
-- Test the hybrid RAG query function
SELECT hybrid_rag_query(
  1, -- clinic_id (use a real clinic ID from your database)
  'test query',
  ARRAY[0.1, 0.2, 0.3]::vector(3), -- dummy embedding for test
  0.6
);

-- This should return a result without errors
```

## 7. Set up a test clinic for development:
```sql
-- Update one of your existing clinics with RAG config
UPDATE clinics 
SET 
  rag_confidence_threshold = 0.60,
  rag_cache_ttl_hours = 24,
  enable_web_search = true,
  max_web_pages_per_query = 3,
  website_url = 'https://example-clinic.com' -- Replace with real clinic URL
WHERE id = 1; -- Replace with a real clinic ID

-- Verify it worked
SELECT id, clinic_name, website_url, rag_confidence_threshold 
FROM clinics 
WHERE id = 1; -- Replace with your clinic ID
```

## 🚨 If you get any errors:

**Error: "extension vector does not exist"**
```sql
-- Run this first
CREATE EXTENSION IF NOT EXISTS vector;
```

**Error: "function doesn't exist"**
- Make sure you ran `hybrid_rag_functions.sql` after `hybrid_rag_schema.sql`

**Error: "column doesn't exist"**
- The schema migration should have added columns to existing tables
- Check if your clinics table has the new RAG columns

**Error: "permission denied"**
- Make sure you're running as a user with CREATE permissions
- The service_role in Supabase should have the necessary permissions

## ✅ Success Checklist:

- [ ] 4 new tables created (clinic_pages, clinic_url_index, rag_query_logs, clinic_domains)
- [ ] 6 new columns added to clinics table  
- [ ] Vector extension enabled
- [ ] All database functions created without errors
- [ ] Test clinic configured with website URL
- [ ] Vector similarity search function works

Once all these check out, your database is ready for the hybrid RAG system! 🎉