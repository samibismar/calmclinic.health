-- Add wait_time_minutes column to providers table
-- This allows each provider to have their own expected wait time

-- Add the column (defaults to 5 minutes for existing providers)
ALTER TABLE providers 
ADD COLUMN wait_time_minutes INTEGER DEFAULT 5;

-- Add a comment explaining the column
COMMENT ON COLUMN providers.wait_time_minutes IS 'Expected wait time in minutes for this provider, shown to patients as countdown timer';

-- Optional: Set some reasonable default wait times for existing providers
-- UPDATE providers SET wait_time_minutes = 10 WHERE specialty LIKE '%Surgery%';
-- UPDATE providers SET wait_time_minutes = 15 WHERE specialty LIKE '%Specialist%';

-- Add an index for performance when fetching wait times
CREATE INDEX IF NOT EXISTS idx_providers_wait_time ON providers(clinic_id, is_active, wait_time_minutes);