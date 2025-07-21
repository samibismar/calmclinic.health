-- Simple patient interaction counter
CREATE TABLE IF NOT EXISTS patient_interactions (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES providers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast counting
CREATE INDEX IF NOT EXISTS idx_patient_interactions_provider ON patient_interactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_patient_interactions_date ON patient_interactions(created_at DESC);