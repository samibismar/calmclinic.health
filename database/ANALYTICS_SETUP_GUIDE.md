# CalmClinic Analytics Database Setup Guide

This guide explains exactly what database changes need to be made to enable the analytics dashboard system.

## Overview

The analytics system tracks:
- **QR Scans**: When someone scans a QR code to access a clinic's chat
- **Sessions**: Chat conversations from start to finish  
- **Messages**: Individual user/AI messages with performance metrics
- **Feedback**: Thumbs up/down responses from users
- **Events**: General tracking events (page views, errors, etc.)

## Database Schema Changes

### Step 1: Run Analytics Tables Migration

Execute this SQL in your Supabase SQL editor:

```sql
-- File: database/001_create_analytics_tables.sql
-- Creates all new analytics tables

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

### Step 2: Enhance Existing Tables

Execute this SQL to connect analytics to existing tables:

```sql
-- File: database/002_enhance_existing_tables.sql
-- Connects analytics system to existing chat system

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

-- Create function to migrate existing sessions to analytics format
CREATE OR REPLACE FUNCTION migrate_existing_sessions() 
RETURNS INTEGER AS $$
DECLARE
    session_record RECORD;
    new_analytics_session_id UUID;
    migrated_count INTEGER := 0;
BEGIN
    -- Loop through existing chat_sessions that don't have analytics_session_id
    FOR session_record IN 
        SELECT cs.*, c.id as clinic_id_resolved
        FROM chat_sessions cs 
        JOIN clinics c ON c.slug = cs.clinic_slug 
        WHERE cs.analytics_session_id IS NULL
    LOOP
        -- Create corresponding analytics_session
        INSERT INTO analytics_sessions (
            clinic_id,
            clinic_slug,
            provider_id,
            started_at,
            session_status,
            language
        ) VALUES (
            session_record.clinic_id_resolved,
            session_record.clinic_slug,
            session_record.provider_id,
            session_record.created_at,
            'ended', -- Assume existing sessions are ended
            'en' -- Default language
        ) RETURNING id INTO new_analytics_session_id;
        
        -- Link the legacy session to the new analytics session
        UPDATE chat_sessions 
        SET analytics_session_id = new_analytics_session_id,
            session_start_tracked = TRUE
        WHERE id = session_record.id;
        
        migrated_count := migrated_count + 1;
    END LOOP;
    
    RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;
```

### Step 3: Migrate Existing Data (Optional)

If you have existing chat sessions you want to include in analytics:

```sql
-- Run the migration function
SELECT migrate_existing_sessions();

-- This will return the number of sessions migrated, e.g., "42"
```

### Step 4: Verify Clinic Data

Make sure your clinics table has the required data for clinics 44 and 45:

```sql
-- Check clinics 44 and 45 exist and have required fields
SELECT id, practice_name, slug, specialty 
FROM clinics 
WHERE id IN (44, 45);

-- Expected results:
-- 44 | Fort Worth Eye Associates | fort-worth-eye | Ophthalmology
-- 45 | Fort Worth ENT | fort-worth-ent | ENT
```

If specialty column doesn't exist:

```sql
-- Add specialty column if missing
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS specialty TEXT;

-- Update specialty for test clinics
UPDATE clinics SET specialty = 'Ophthalmology' WHERE id = 44;
UPDATE clinics SET specialty = 'ENT' WHERE id = 45;
```

## What This Creates

### New Tables:
- `analytics_qr_scans` - Tracks QR code scans and entry points
- `analytics_sessions` - Enhanced session tracking with metrics
- `analytics_messages` - Individual message tracking with AI performance
- `analytics_feedback` - User feedback (thumbs up/down)
- `analytics_events` - General event tracking

### Enhanced Existing Tables:
- `chat_sessions` - Linked to new analytics system
- `rag_query_logs` - Connected to sessions and messages

### Automatic Triggers:
- Session metrics automatically update when messages are added
- First response time is calculated automatically

## Testing the Setup

After running the SQL migrations:

1. **Test Analytics Dashboard:**
   - Go to `/ops` - should show clinic selector
   - Select "Fort Worth Eye Associates" or "Fort Worth ENT"
   - Should show empty metrics initially

2. **Test Session Creation:**
   - Go to `/experience/fort-worth-eye` or `/experience/fort-worth-ent` 
   - Send a message - this should create analytics records
   - Check `/ops/sessions` to see the session appear

3. **Verify Database Records:**
   ```sql
   -- Check sessions are being created
   SELECT * FROM analytics_sessions ORDER BY created_at DESC LIMIT 5;
   
   -- Check messages are being tracked
   SELECT * FROM analytics_messages ORDER BY timestamp DESC LIMIT 10;
   ```

## NO Tables Need to be Deleted

This analytics system is additive - it doesn't replace or remove existing functionality. Your existing `chat_sessions`, `rag_query_logs`, and other tables continue to work as before. The new analytics tables provide additional tracking capabilities.

## Next Steps

After database setup:
1. Integrate QR scan tracking in chat interface
2. Add message logging to responses API
3. Add feedback buttons to chat interface
4. Test with real conversations

The analytics will start collecting data as soon as the database schema is created and the tracking code is integrated into the chat system.