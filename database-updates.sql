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

-- 5. CREATE AI EVALUATIONS TABLE
-- ============================================================================
-- Store evaluation results for prompt performance testing

CREATE TABLE IF NOT EXISTS ai_evaluations (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  system_prompt TEXT NOT NULL,
  test_scenarios TEXT[] NOT NULL,
  overall_score INTEGER NOT NULL DEFAULT 0,
  category_scores JSONB NOT NULL DEFAULT '{}',
  detailed_feedback TEXT,
  cost DECIMAL(10,4) DEFAULT 0.00,
  test_results JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  prompt_version INTEGER DEFAULT 1
);

COMMENT ON TABLE ai_evaluations IS 'AI prompt evaluation results and performance testing data';
COMMENT ON COLUMN ai_evaluations.clinic_id IS 'Reference to the clinic this evaluation belongs to';
COMMENT ON COLUMN ai_evaluations.system_prompt IS 'The system prompt that was evaluated';
COMMENT ON COLUMN ai_evaluations.test_scenarios IS 'Array of scenario categories tested (healthcare_compliance, personality_match, etc.)';
COMMENT ON COLUMN ai_evaluations.overall_score IS 'Overall evaluation score (0-100)';
COMMENT ON COLUMN ai_evaluations.category_scores IS 'JSON object with scores for each category (healthcare_compliance, personality_match, response_quality, safety)';
COMMENT ON COLUMN ai_evaluations.detailed_feedback IS 'Summary feedback and recommendations from the evaluation';
COMMENT ON COLUMN ai_evaluations.cost IS 'Cost of running this evaluation in USD';
COMMENT ON COLUMN ai_evaluations.test_results IS 'Detailed test results for each individual test case';
COMMENT ON COLUMN ai_evaluations.prompt_version IS 'Version number of the prompt that was evaluated';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_ai_evaluations_clinic_id ON ai_evaluations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_ai_evaluations_created_at ON ai_evaluations(created_at DESC);

-- 6. ENSURE AI_PROMPT_HISTORY TABLE HAS ALL REQUIRED COLUMNS
-- ============================================================================
-- Make sure the prompt history table has all columns the save APIs expect

-- Add missing columns to ai_prompt_history table if they don't exist
ALTER TABLE ai_prompt_history 
ADD COLUMN IF NOT EXISTS version_name TEXT,
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS interview_responses JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS selected_template TEXT DEFAULT NULL;

-- Set default version names for existing records
UPDATE ai_prompt_history 
SET version_name = 'Version ' || version::text 
WHERE version_name IS NULL;

-- Mark the most recent version as current for each clinic (if none are marked)
UPDATE ai_prompt_history 
SET is_current = true 
WHERE id IN (
    SELECT DISTINCT ON (clinic_id) id 
    FROM ai_prompt_history 
    WHERE clinic_id NOT IN (
        SELECT DISTINCT clinic_id 
        FROM ai_prompt_history 
        WHERE is_current = true
    )
    ORDER BY clinic_id, version DESC
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_prompt_history_clinic_current 
ON ai_prompt_history (clinic_id, is_current);

CREATE INDEX IF NOT EXISTS idx_ai_prompt_history_clinic_version 
ON ai_prompt_history (clinic_id, version DESC);

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================

-- Check that new columns were added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'clinics' 
AND column_name IN ('interview_responses', 'tone', 'languages', 'ai_always_include', 'ai_never_include', 'ai_intelligent_mode', 'ai_fallback_triggers');

-- Check that evaluations table was created
SELECT table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'ai_evaluations'
ORDER BY ordinal_position;

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