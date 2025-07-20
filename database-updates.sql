-- ===============================================
-- CalmClinic AI System Database Updates
-- ===============================================
-- Simple, necessary updates only
-- ===============================================

-- 1. ADD INTERVIEW RESPONSES TO CLINICS TABLE
-- ============================================================================
-- Store the clinic's current interview responses (not in history, just current state)

ALTER TABLE clinics 
ADD COLUMN IF NOT EXISTS interview_responses JSONB DEFAULT NULL;

COMMENT ON COLUMN clinics.interview_responses IS 'Current interview responses for clinic personality (communicationStyle, anxietyHandling, etc.)';

-- 2. ADD PERSONALITY/CONFIG SETTINGS TO CLINICS TABLE
-- ============================================================================
-- Store personality settings that should always be included in prompts

ALTER TABLE clinics
ADD COLUMN IF NOT EXISTS tone VARCHAR(50) DEFAULT 'professional',
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['English'],
ADD COLUMN IF NOT EXISTS ai_always_include TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_never_include TEXT[] DEFAULT NULL;

COMMENT ON COLUMN clinics.tone IS 'Communication tone/personality (professional, friendly, calm, empathetic, efficient, custom)';
COMMENT ON COLUMN clinics.languages IS 'Array of supported languages for AI responses';
COMMENT ON COLUMN clinics.ai_always_include IS 'Array of things the AI should always mention when relevant';
COMMENT ON COLUMN clinics.ai_never_include IS 'Array of things the AI should never mention';

-- 3. ADD INTELLIGENT FALLBACK SETTINGS TO CLINICS TABLE  
-- ============================================================================
-- Store intelligent vs keyword-based fallback settings

ALTER TABLE clinics 
ADD COLUMN IF NOT EXISTS ai_intelligent_mode BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS ai_fallback_triggers JSONB DEFAULT NULL;

COMMENT ON COLUMN clinics.ai_intelligent_mode IS 'Whether to use intelligent context-aware fallback detection (true) or simple keyword matching (false)';
COMMENT ON COLUMN clinics.ai_fallback_triggers IS 'Keyword triggers for fallback responses when in keyword mode';

-- Set default fallback triggers for existing clinics
UPDATE clinics 
SET ai_fallback_triggers = '{
  "uncertain": ["not sure", "don''t know", "uncertain", "unclear"],
  "after_hours": ["closed", "hours", "open", "when"],
  "emergency": ["emergency", "urgent", "pain", "bleeding", "help"]
}'::jsonb
WHERE ai_fallback_triggers IS NULL;

-- 4. SET DEFAULTS FOR EXISTING CLINICS
-- ============================================================================
-- Set intelligent mode to true for existing clinics
UPDATE clinics 
SET ai_intelligent_mode = TRUE 
WHERE ai_intelligent_mode IS NULL;

-- Set default tone and languages for existing clinics
UPDATE clinics 
SET tone = 'professional' 
WHERE tone IS NULL;

UPDATE clinics 
SET languages = ARRAY['English'] 
WHERE languages IS NULL;

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================

-- Check that new columns were added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'clinics' 
AND column_name IN ('interview_responses', 'tone', 'languages', 'ai_always_include', 'ai_never_include', 'ai_intelligent_mode', 'ai_fallback_triggers');

-- Count clinics with intelligent mode enabled
SELECT 
  ai_intelligent_mode,
  COUNT(*) as clinic_count
FROM clinics 
GROUP BY ai_intelligent_mode;

-- ===============================================
-- ROLLBACK (if needed)
-- ===============================================
/*
ALTER TABLE clinics 
DROP COLUMN IF EXISTS interview_responses,
DROP COLUMN IF EXISTS tone,
DROP COLUMN IF EXISTS languages,
DROP COLUMN IF EXISTS ai_always_include,
DROP COLUMN IF EXISTS ai_never_include,
DROP COLUMN IF EXISTS ai_intelligent_mode,
DROP COLUMN IF EXISTS ai_fallback_triggers;
*/

COMMIT;