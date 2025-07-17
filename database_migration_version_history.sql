-- Database migration for Version History updates
-- Run these commands in your database to make it compatible with the new implementation

-- 1. Add missing columns to ai_prompt_history table
ALTER TABLE public.ai_prompt_history 
ADD COLUMN IF NOT EXISTS version_name text,
ADD COLUMN IF NOT EXISTS is_current boolean DEFAULT false;

-- 2. Set default version names for existing records
UPDATE public.ai_prompt_history 
SET version_name = 'Version ' || version::text 
WHERE version_name IS NULL;

-- 3. Mark the most recent version as current for each clinic
UPDATE public.ai_prompt_history 
SET is_current = true 
WHERE id IN (
    SELECT DISTINCT ON (clinic_id) id 
    FROM public.ai_prompt_history 
    ORDER BY clinic_id, version DESC
);

-- 4. Make version_name NOT NULL after setting defaults
ALTER TABLE public.ai_prompt_history 
ALTER COLUMN version_name SET NOT NULL;

-- 5. Add index for better performance
CREATE INDEX IF NOT EXISTS idx_ai_prompt_history_clinic_current 
ON public.ai_prompt_history (clinic_id, is_current);

-- 6. Add constraint to ensure only one current version per clinic
-- First, fix any potential duplicates
WITH current_versions AS (
    SELECT 
        clinic_id,
        id,
        ROW_NUMBER() OVER (PARTITION BY clinic_id ORDER BY version DESC) as rn
    FROM public.ai_prompt_history 
    WHERE is_current = true
)
UPDATE public.ai_prompt_history 
SET is_current = false 
WHERE id IN (
    SELECT id FROM current_versions WHERE rn > 1
);

-- Now add the constraint
-- Note: This creates a unique index that allows only one current version per clinic
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_prompt_history_unique_current 
ON public.ai_prompt_history (clinic_id) 
WHERE is_current = true;

-- 7. Optional: Clean up performance_metrics column since we're not using fake data
-- Uncomment the line below if you want to remove the performance_metrics column
-- ALTER TABLE public.ai_prompt_history DROP COLUMN IF EXISTS performance_metrics;

-- 8. Create sequence for ai_custom_fallbacks first (if it doesn't exist)
CREATE SEQUENCE IF NOT EXISTS ai_custom_fallbacks_id_seq;

-- 9. Add any missing API-related tables for custom fallbacks (if needed)
CREATE TABLE IF NOT EXISTS public.ai_custom_fallbacks (
    id integer NOT NULL DEFAULT nextval('ai_custom_fallbacks_id_seq'::regclass),
    clinic_id integer NOT NULL,
    trigger_type text NOT NULL,
    trigger_description text NOT NULL,
    response_text text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT ai_custom_fallbacks_pkey PRIMARY KEY (id),
    CONSTRAINT ai_custom_fallbacks_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);

-- 10. Add index for custom fallbacks
CREATE INDEX IF NOT EXISTS idx_ai_custom_fallbacks_clinic_active 
ON public.ai_custom_fallbacks (clinic_id, is_active);

-- Verification queries (run these to check if migration worked):
-- SELECT clinic_id, version, version_name, is_current FROM public.ai_prompt_history ORDER BY clinic_id, version;
-- SELECT clinic_id, COUNT(*) as current_count FROM public.ai_prompt_history WHERE is_current = true GROUP BY clinic_id;