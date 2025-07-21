-- Clean up complex analytics and simplify to just basic interaction counting

-- Drop the weekly analytics cache table (we don't need it)
DROP TABLE IF EXISTS weekly_analytics_cache;

-- Remove the complex columns from patient_interactions, keep only what we need
ALTER TABLE patient_interactions 
DROP COLUMN IF EXISTS clinic_id,
DROP COLUMN IF EXISTS session_id,
DROP COLUMN IF EXISTS user_message,
DROP COLUMN IF EXISTS ai_response,
DROP COLUMN IF EXISTS tools_used,
DROP COLUMN IF EXISTS response_length,
DROP COLUMN IF EXISTS processing_time_ms,
DROP COLUMN IF EXISTS was_helpful;

-- Drop old indexes
DROP INDEX IF EXISTS idx_patient_interactions_clinic_id;
DROP INDEX IF EXISTS idx_patient_interactions_clinic_date;
DROP INDEX IF EXISTS idx_patient_interactions_session;
DROP INDEX IF EXISTS idx_weekly_analytics_clinic_week;

-- The table should now just have: id, provider_id, created_at
-- Add the indexes we actually need
CREATE INDEX IF NOT EXISTS idx_patient_interactions_provider ON patient_interactions(provider_id);

-- Clean up any existing data (optional - only run if you want to start fresh)
-- TRUNCATE TABLE patient_interactions;

-- Verify the final structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'patient_interactions' 
ORDER BY ordinal_position;