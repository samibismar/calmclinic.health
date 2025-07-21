-- ===============================================
-- CalmClinic Analytics Schema
-- ===============================================
-- Track patient interactions for meaningful insights
-- ===============================================

-- Patient interactions table - tracks each conversation
CREATE TABLE IF NOT EXISTS patient_interactions (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    provider_id INTEGER REFERENCES providers(id) ON DELETE SET NULL,
    
    -- Interaction metadata
    session_id VARCHAR(255), -- For grouping messages from same conversation
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    tools_used TEXT[] DEFAULT '{}', -- Array of tool names used
    
    -- Analytics data
    response_length INTEGER NOT NULL DEFAULT 0, -- Character count of AI response
    processing_time_ms INTEGER DEFAULT NULL, -- How long it took to generate response
    was_helpful BOOLEAN DEFAULT NULL, -- User feedback if available
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE patient_interactions IS 'Tracks patient AI interactions for analytics and insights';
COMMENT ON COLUMN patient_interactions.session_id IS 'Groups messages from the same conversation';
COMMENT ON COLUMN patient_interactions.tools_used IS 'Array of tool names used (e.g., get_clinic_hours, get_insurance_info)';
COMMENT ON COLUMN patient_interactions.response_length IS 'Length of AI response in characters';
COMMENT ON COLUMN patient_interactions.was_helpful IS 'Patient feedback on response helpfulness (if collected)';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_patient_interactions_clinic_id ON patient_interactions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patient_interactions_created_at ON patient_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_interactions_clinic_date ON patient_interactions(clinic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_interactions_session ON patient_interactions(session_id);

-- Weekly analytics cache table (optional optimization)
CREATE TABLE IF NOT EXISTS weekly_analytics_cache (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    
    -- Analytics summary
    total_interactions INTEGER NOT NULL DEFAULT 0,
    unique_sessions INTEGER NOT NULL DEFAULT 0,
    avg_response_length DECIMAL(10,2) DEFAULT 0,
    most_used_tools TEXT[] DEFAULT '{}',
    top_questions TEXT[] DEFAULT '{}',
    estimated_time_saved_minutes INTEGER DEFAULT 0,
    
    -- Cache metadata
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_current_week BOOLEAN DEFAULT false,
    
    UNIQUE(clinic_id, week_start_date)
);

COMMENT ON TABLE weekly_analytics_cache IS 'Cached weekly analytics to avoid recalculating expensive aggregations';

-- Ensure unique constraint
CREATE INDEX IF NOT EXISTS idx_weekly_analytics_clinic_week 
ON weekly_analytics_cache(clinic_id, week_start_date DESC);

-- Set proper permissions (if using RLS)
-- ALTER TABLE patient_interactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE weekly_analytics_cache ENABLE ROW LEVEL SECURITY;

COMMIT;