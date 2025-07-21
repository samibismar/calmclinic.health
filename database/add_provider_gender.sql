-- Add gender field to providers table
ALTER TABLE providers 
ADD COLUMN gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other', 'not_specified')) 
DEFAULT 'not_specified';

-- Add index for better performance on gender queries
CREATE INDEX IF NOT EXISTS idx_providers_gender ON providers(gender);

-- Update any existing providers to have a default value
UPDATE providers 
SET gender = 'not_specified' 
WHERE gender IS NULL;

-- Verify the change
SELECT id, name, title, gender 
FROM providers 
LIMIT 5;