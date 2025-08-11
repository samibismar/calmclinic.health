-- CalmClinic Analytics Schema Migration 002
-- Enhances existing tables to work better with analytics system
-- Run this AFTER migration 001

-- Add analytics tracking to existing chat_sessions table
ALTER TABLE chat_sessions 
ADD COLUMN IF NOT EXISTS analytics_session_id UUID REFERENCES analytics_sessions(id),
ADD COLUMN IF NOT EXISTS qr_scan_tracked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS session_start_tracked BOOLEAN DEFAULT FALSE;

-- Create a view that combines old and new session data for backward compatibility
CREATE OR REPLACE VIEW unified_sessions AS
SELECT 
    cs.id as legacy_session_id,
    cs.created_at as legacy_created_at,
    cs.clinic_slug,
    cs.patient_first_name,
    cs.patient_last_name,
    cs.summary,
    cs.provider_id,
    cs.provider_context,
    
    -- Analytics session data
    ans.id as analytics_session_id,
    ans.clinic_id,
    ans.started_at,
    ans.ended_at,
    ans.total_messages,
    ans.user_messages,
    ans.ai_messages,
    ans.first_response_time_ms,
    ans.avg_response_time_ms,
    ans.session_status,
    
    -- QR scan data
    qs.scan_timestamp,
    qs.scan_source
FROM chat_sessions cs
LEFT JOIN analytics_sessions ans ON cs.analytics_session_id = ans.id
LEFT JOIN analytics_qr_scans qs ON ans.qr_scan_id = qs.id;

-- Add analytics columns to existing rag_query_logs for better integration
ALTER TABLE rag_query_logs 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES analytics_sessions(id),
ADD COLUMN IF NOT EXISTS message_id INTEGER REFERENCES analytics_messages(id);

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

-- Create indexes for the enhanced tables
CREATE INDEX IF NOT EXISTS idx_chat_sessions_analytics_session ON chat_sessions(analytics_session_id);
CREATE INDEX IF NOT EXISTS idx_rag_query_logs_session ON rag_query_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_rag_query_logs_message ON rag_query_logs(message_id);

-- Create a function to clean up old unused tables (run this manually after validation)
CREATE OR REPLACE FUNCTION cleanup_unused_tables() 
RETURNS TEXT AS $$
BEGIN
    -- This function can be called manually after validating the new system works
    -- DROP TABLE IF EXISTS chat_feedback; -- Old feedback system
    -- DROP TABLE IF EXISTS login_tokens; -- If not used
    -- DROP TABLE IF EXISTS sessions; -- Generic sessions table
    
    RETURN 'Cleanup function created - run manually after validation';
END;
$$ LANGUAGE plpgsql;

-- Log migration completion
INSERT INTO analytics_events (clinic_id, event_type, event_category, event_data)
SELECT c.id, 'schema_migration', 'system_event', '{"migration": "002_enhance_existing_tables", "status": "completed"}'
FROM clinics c 
LIMIT 1;