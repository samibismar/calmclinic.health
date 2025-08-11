-- CalmClinic Analytics Schema Migration 001
-- Creates core analytics tables for tracking QR scans, sessions, messages, and feedback
-- Run this BEFORE deployment

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

-- Migration completed successfully
INSERT INTO analytics_events (clinic_id, event_type, event_category, event_data) 
SELECT 1, 'schema_migration', 'system_event', '{"migration": "001_create_analytics_tables", "status": "completed"}' 
WHERE EXISTS (SELECT 1 FROM clinics LIMIT 1);