# 🚀 CalmClinic Analytics Database Setup

## What You Need to Do

You need to run **2 SQL scripts** in your Supabase database to enable analytics tracking for clinics 44 and 45.

## Step 1: Run the Analytics Tables Creation

Copy and paste this entire SQL block into your Supabase SQL Editor and run it:

```sql
-- ===== ANALYTICS TABLES CREATION =====
-- Creates all new analytics tracking tables

-- QR Scan tracking table
CREATE TABLE analytics_qr_scans (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    scan_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    scan_source TEXT DEFAULT 'qr_code', -- qr_code, direct_link, etc
    session_id UUID, -- Will link to session if user continues
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced session tracking (extends existing chat_sessions)
CREATE TABLE analytics_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id INTEGER NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    clinic_slug TEXT NOT NULL, -- Denormalized for faster queries
    qr_scan_id INTEGER REFERENCES analytics_qr_scans(id),
    provider_id INTEGER REFERENCES providers(id),
    
    -- Session metrics
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    total_messages INTEGER DEFAULT 0,
    user_messages INTEGER DEFAULT 0,
    ai_messages INTEGER DEFAULT 0,
    
    -- Performance metrics
    first_response_time_ms INTEGER, -- Time from first user message to first AI response
    avg_response_time_ms INTEGER,
    total_session_duration_ms INTEGER,
    
    -- Session metadata
    user_agent TEXT,
    language TEXT DEFAULT 'en',
    session_status TEXT DEFAULT 'active', -- active, ended, abandoned
    abandonment_reason TEXT, -- timeout, user_left, error
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual message tracking
CREATE TABLE analytics_messages (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES analytics_sessions(id) ON DELETE CASCADE,
    clinic_id INTEGER NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    
    -- Message data
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')), 
    content TEXT NOT NULL,
    message_order INTEGER NOT NULL, -- 1st, 2nd, 3rd message in session
    
    -- Performance metrics
    response_time_ms INTEGER, -- For AI messages: processing time
    tools_used TEXT[], -- RAG tools used for this response
    rag_confidence DECIMAL(4,2), -- RAG confidence score
    
    -- Message metadata
    content_length INTEGER,
    contains_medical_terms BOOLEAN DEFAULT FALSE,
    message_intent TEXT, -- appointment, symptoms, services, etc
    
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback tracking (thumbs up/down)
CREATE TABLE analytics_feedback (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES analytics_messages(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES analytics_sessions(id) ON DELETE CASCADE,
    clinic_id INTEGER NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    
    -- Feedback data
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative')),
    feedback_text TEXT, -- Optional written feedback
    
    -- Context
    message_order INTEGER, -- Which message in conversation got feedback
    response_time_when_given INTEGER, -- How long after message was feedback given
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- General analytics events table (for future expansion)
CREATE TABLE analytics_events (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    session_id UUID REFERENCES analytics_sessions(id) ON DELETE CASCADE,
    
    -- Event data
    event_type TEXT NOT NULL, -- page_view, tool_usage, error, etc
    event_category TEXT, -- user_interaction, system_event, etc
    event_data JSONB DEFAULT '{}', -- Flexible event properties
    
    -- Context
    user_agent TEXT,
    ip_address INET,
    
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_analytics_qr_scans_clinic_timestamp ON analytics_qr_scans(clinic_id, scan_timestamp);
CREATE INDEX idx_analytics_sessions_clinic_started ON analytics_sessions(clinic_id, started_at);
CREATE INDEX idx_analytics_sessions_status ON analytics_sessions(session_status);
CREATE INDEX idx_analytics_messages_session_order ON analytics_messages(session_id, message_order);
CREATE INDEX idx_analytics_messages_clinic_timestamp ON analytics_messages(clinic_id, timestamp);
CREATE INDEX idx_analytics_feedback_clinic_type ON analytics_feedback(clinic_id, feedback_type);
CREATE INDEX idx_analytics_events_clinic_type_timestamp ON analytics_events(clinic_id, event_type, timestamp);

-- Add trigger to update session metrics when messages are added
CREATE OR REPLACE FUNCTION update_session_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update message counts and performance metrics
    UPDATE analytics_sessions 
    SET 
        total_messages = (SELECT COUNT(*) FROM analytics_messages WHERE session_id = NEW.session_id),
        user_messages = (SELECT COUNT(*) FROM analytics_messages WHERE session_id = NEW.session_id AND role = 'user'),
        ai_messages = (SELECT COUNT(*) FROM analytics_messages WHERE session_id = NEW.session_id AND role = 'assistant'),
        avg_response_time_ms = (SELECT AVG(response_time_ms) FROM analytics_messages WHERE session_id = NEW.session_id AND role = 'assistant' AND response_time_ms IS NOT NULL),
        updated_at = NOW()
    WHERE id = NEW.session_id;
    
    -- Set first response time if this is the first AI message
    IF NEW.role = 'assistant' AND NEW.message_order = 2 THEN
        UPDATE analytics_sessions 
        SET first_response_time_ms = NEW.response_time_ms 
        WHERE id = NEW.session_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_metrics 
    AFTER INSERT ON analytics_messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_session_metrics();
```

## Step 2: Connect to Existing Tables

Run this second SQL block to connect the new analytics system to your existing tables:

```sql
-- ===== CONNECT TO EXISTING TABLES =====
-- Links analytics to existing chat system

-- Add analytics tracking to existing chat_sessions table
ALTER TABLE chat_sessions 
ADD COLUMN IF NOT EXISTS analytics_session_id UUID REFERENCES analytics_sessions(id),
ADD COLUMN IF NOT EXISTS qr_scan_tracked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS session_start_tracked BOOLEAN DEFAULT FALSE;

-- Add analytics columns to existing rag_query_logs for better integration
ALTER TABLE rag_query_logs 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES analytics_sessions(id),
ADD COLUMN IF NOT EXISTS message_id INTEGER REFERENCES analytics_messages(id);

-- Create indexes for the enhanced tables
CREATE INDEX IF NOT EXISTS idx_chat_sessions_analytics_session ON chat_sessions(analytics_session_id);
CREATE INDEX IF NOT EXISTS idx_rag_query_logs_session ON rag_query_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_rag_query_logs_message ON rag_query_logs(message_id);
```

## Step 3: Verify Clinic Data

Run this to check your clinic data is set up correctly:

```sql
-- Check clinics 44 and 45 exist and have required fields
SELECT id, practice_name, slug, specialty 
FROM clinics 
WHERE id IN (44, 45);
```

**Expected results:**
- **44** | Fort Worth Eye Associates | fort-worth-eye | Ophthalmology (or similar)
- **45** | Fort Worth ENT | fort-worth-ent | ENT (or similar)

If the `specialty` column doesn't exist or is missing, run this:

```sql
-- Add specialty column if missing and update test clinics
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS specialty TEXT;
UPDATE clinics SET specialty = 'Ophthalmology' WHERE id = 44 AND (specialty IS NULL OR specialty = '');
UPDATE clinics SET specialty = 'ENT' WHERE id = 45 AND (specialty IS NULL OR specialty = '');
```

## What This Does

### 📊 Analytics Dashboard

After running these SQL commands, you'll have:

1. **Main Dashboard** at `/ops`
   - Shows clinic metrics, QR scans, sessions, messages, response times
   - Clinic selector to switch between Fort Worth Eye (44) and Fort Worth ENT (45)

2. **Sessions Browser** at `/ops/sessions` 
   - Lists all chat sessions with search and filtering
   - Click into individual sessions to see full conversations

3. **Session Detail Pages** at `/ops/sessions/[session-id]`
   - Full conversation history with timestamps
   - AI response times and tools used
   - User feedback tracking

### 🔍 What Gets Tracked

- **QR Code Scans**: When someone visits `/experience/fort-worth-eye` or `/experience/fort-worth-ent`
- **Chat Sessions**: Full conversations from start to finish
- **Messages**: Every user and AI message with performance data
- **Response Times**: How long AI takes to respond
- **Tools Used**: Which RAG tools or clinic intelligence was used
- **Medical Content**: Automatic detection of medical terms
- **User Feedback**: Thumbs up/down ratings (when we add the UI)

### ⚡ Testing

Once the SQL is run, you can test by:

1. Go to `/ops` - should show both clinics in dropdown
2. Go to `/experience/fort-worth-eye` - should track QR scan
3. Chat with the AI - should create session and message records
4. Go back to `/ops/sessions` - should see your new session

### 🗑️ No Data Loss

This system is **additive only** - it doesn't delete or modify any existing data. Your current `chat_sessions`, `rag_query_logs`, and all other tables continue to work exactly as before.

## Summary

1. **Run SQL Script 1** - Creates all analytics tables
2. **Run SQL Script 2** - Connects to existing tables  
3. **Verify clinics exist** - Checks clinic 44 and 45 data
4. **Test the system** - Visit chat pages and check analytics dashboard

The analytics will start collecting data immediately after the SQL is executed and you restart your Next.js application.