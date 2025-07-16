-- Migration Script: Single-Provider to Multi-Provider Architecture
-- This script safely migrates existing single-provider clinics to the new multi-provider system
-- while maintaining backward compatibility

-- =============================================
-- STEP 1: APPLY SCHEMA CHANGES
-- =============================================

-- First, run the multi_provider_schema.sql to create new tables and columns
-- \i database/multi_provider_schema.sql

-- =============================================
-- STEP 2: MIGRATE EXISTING SINGLE-PROVIDER DATA
-- =============================================

-- Create default providers for all existing clinics that have a doctor_name
INSERT INTO public.providers (clinic_id, name, title, specialties, is_active, is_default, display_order)
SELECT 
    id as clinic_id,
    doctor_name as name,
    COALESCE(specialty, 'General Practice') as title,
    CASE 
        WHEN specialty IS NOT NULL THEN ARRAY[specialty]
        ELSE ARRAY['General Practice']
    END as specialties,
    true as is_active,
    true as is_default,
    1 as display_order
FROM public.clinics 
WHERE doctor_name IS NOT NULL 
    AND doctor_name != ''
    AND NOT EXISTS (
        SELECT 1 FROM public.providers p WHERE p.clinic_id = clinics.id
    );

-- Update clinics to reference their default provider
UPDATE public.clinics 
SET default_provider_id = p.id
FROM public.providers p
WHERE p.clinic_id = clinics.id 
    AND p.is_default = true 
    AND clinics.default_provider_id IS NULL;

-- =============================================
-- STEP 3: CREATE BASIC CLINIC_DATA ENTRIES
-- =============================================

-- Create basic clinic_data entries for existing clinics
INSERT INTO public.clinic_data (clinic_id, contact_info, hours_info, services_info, insurance_info, patient_experience, data_completeness, extraction_source)
SELECT 
    id as clinic_id,
    COALESCE(
        jsonb_build_object(
            'phone_numbers', jsonb_build_object('main', phone),
            'address', jsonb_build_object(),
            'email', email,
            'website', NULL,
            'social_media', jsonb_build_object()
        ),
        '{}'::jsonb
    ) as contact_info,
    jsonb_build_object(
        'regular_hours', jsonb_build_object(),
        'holiday_hours', NULL,
        'appointment_policies', jsonb_build_object(),
        'emergency_hours', NULL
    ) as hours_info,
    jsonb_build_object(
        'medical_services', ARRAY[]::text[],
        'surgical_services', ARRAY[]::text[],
        'diagnostic_services', ARRAY[]::text[],
        'optical_services', ARRAY[]::text[],
        'specialty_programs', ARRAY[]::text[],
        'conditions_treated', ARRAY[]::text[]
    ) as services_info,
    jsonb_build_object(
        'accepted_plans', ARRAY[]::text[],
        'payment_policies', jsonb_build_object(),
        'special_notes', ARRAY[]::text[]
    ) as insurance_info,
    jsonb_build_object(
        'walk_in_policy', NULL,
        'wait_time_expectations', NULL,
        'what_to_bring', ARRAY[]::text[],
        'facility_policies', ARRAY[]::text[],
        'accessibility', NULL,
        'patient_portal', false,
        'communication_preferences', ARRAY[]::text[]
    ) as patient_experience,
    CASE 
        WHEN phone IS NOT NULL AND email IS NOT NULL THEN 0.3
        WHEN phone IS NOT NULL OR email IS NOT NULL THEN 0.2
        ELSE 0.1
    END as data_completeness,
    'migration' as extraction_source
FROM public.clinics
WHERE NOT EXISTS (
    SELECT 1 FROM public.clinic_data cd WHERE cd.clinic_id = clinics.id
);

-- =============================================
-- STEP 4: MIGRATE EXISTING CHAT SESSIONS
-- =============================================

-- Update existing chat sessions to reference the default provider
UPDATE public.chat_sessions 
SET provider_id = c.default_provider_id,
    provider_context = jsonb_build_object(
        'provider_name', p.name,
        'provider_specialty', p.title,
        'is_default', true
    )
FROM public.clinics c
JOIN public.providers p ON p.id = c.default_provider_id
WHERE chat_sessions.clinic_slug = c.slug 
    AND chat_sessions.provider_id IS NULL;

-- =============================================
-- STEP 5: UPDATE CLINIC FLAGS
-- =============================================

-- Enable multi-provider support for clinics that now have providers
UPDATE public.clinics 
SET supports_multi_provider = true,
    comprehensive_data_enabled = true
WHERE EXISTS (
    SELECT 1 FROM public.providers p WHERE p.clinic_id = clinics.id
);

-- =============================================
-- STEP 6: DATA VALIDATION AND CLEANUP
-- =============================================

-- Validate that all migrated clinics have default providers
DO $$
DECLARE
    missing_providers_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_providers_count
    FROM public.clinics c
    WHERE c.doctor_name IS NOT NULL 
        AND c.doctor_name != ''
        AND NOT EXISTS (
            SELECT 1 FROM public.providers p 
            WHERE p.clinic_id = c.id AND p.is_default = true
        );
    
    IF missing_providers_count > 0 THEN
        RAISE NOTICE 'Warning: % clinics with doctor_name but no default provider', missing_providers_count;
    ELSE
        RAISE NOTICE 'Success: All clinics with doctor_name have default providers';
    END IF;
END $$;

-- Validate that all clinics have clinic_data entries
DO $$
DECLARE
    missing_data_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_data_count
    FROM public.clinics c
    WHERE NOT EXISTS (
        SELECT 1 FROM public.clinic_data cd WHERE cd.clinic_id = c.id
    );
    
    IF missing_data_count > 0 THEN
        RAISE NOTICE 'Warning: % clinics missing clinic_data entries', missing_data_count;
    ELSE
        RAISE NOTICE 'Success: All clinics have clinic_data entries';
    END IF;
END $$;

-- =============================================
-- STEP 7: CREATE HELPFUL VIEWS
-- =============================================

-- View to see clinic overview with provider information
CREATE OR REPLACE VIEW clinic_overview AS
SELECT 
    c.id as clinic_id,
    c.slug,
    c.practice_name,
    c.supports_multi_provider,
    c.comprehensive_data_enabled,
    COUNT(p.id) as provider_count,
    STRING_AGG(p.name, ', ') as provider_names,
    dp.name as default_provider_name,
    cd.data_completeness,
    cd.extraction_source
FROM public.clinics c
LEFT JOIN public.providers p ON p.clinic_id = c.id AND p.is_active = true
LEFT JOIN public.providers dp ON dp.id = c.default_provider_id
LEFT JOIN public.clinic_data cd ON cd.clinic_id = c.id
GROUP BY c.id, c.slug, c.practice_name, c.supports_multi_provider, c.comprehensive_data_enabled, dp.name, cd.data_completeness, cd.extraction_source
ORDER BY c.id;

-- View to see provider details with clinic context
CREATE OR REPLACE VIEW provider_details AS
SELECT 
    p.id as provider_id,
    p.name as provider_name,
    p.title,
    p.specialties,
    p.is_default,
    p.is_active,
    c.slug as clinic_slug,
    c.practice_name,
    c.supports_multi_provider
FROM public.providers p
JOIN public.clinics c ON c.id = p.clinic_id
WHERE p.is_active = true
ORDER BY c.slug, p.display_order, p.name;

-- =============================================
-- STEP 8: POST-MIGRATION SUMMARY
-- =============================================

-- Summary of migration results
SELECT 
    'Migration Summary' as section,
    COUNT(DISTINCT c.id) as total_clinics,
    COUNT(DISTINCT p.id) as total_providers,
    COUNT(DISTINCT cd.id) as total_clinic_data_entries,
    COUNT(DISTINCT CASE WHEN c.supports_multi_provider THEN c.id END) as multi_provider_enabled_clinics,
    COUNT(DISTINCT CASE WHEN p.is_default THEN p.id END) as default_providers_created
FROM public.clinics c
LEFT JOIN public.providers p ON p.clinic_id = c.id
LEFT JOIN public.clinic_data cd ON cd.clinic_id = c.id;

-- Show clinics that might need manual attention
SELECT 
    c.id,
    c.slug,
    c.practice_name,
    c.doctor_name,
    c.supports_multi_provider,
    COUNT(p.id) as provider_count,
    cd.data_completeness
FROM public.clinics c
LEFT JOIN public.providers p ON p.clinic_id = c.id
LEFT JOIN public.clinic_data cd ON cd.clinic_id = c.id
WHERE c.doctor_name IS NOT NULL 
GROUP BY c.id, c.slug, c.practice_name, c.doctor_name, c.supports_multi_provider, cd.data_completeness
HAVING COUNT(p.id) = 0 OR cd.data_completeness < 0.2
ORDER BY cd.data_completeness ASC, c.id;

-- =============================================
-- STEP 9: CLEANUP COMMENTS
-- =============================================

COMMENT ON VIEW clinic_overview IS 'Overview of all clinics with their provider count and data completeness';
COMMENT ON VIEW provider_details IS 'Detailed view of all active providers with their clinic context';

-- Add helpful comments for troubleshooting
COMMENT ON COLUMN public.providers.is_default IS 'Migrated from clinics.doctor_name for backward compatibility';
COMMENT ON COLUMN public.clinic_data.extraction_source IS 'Source of data: migration, manual, scraper, etc.';

-- =============================================
-- ROLLBACK INSTRUCTIONS (IF NEEDED)
-- =============================================

/*
-- To rollback this migration (USE WITH CAUTION):

-- 1. Drop the views
DROP VIEW IF EXISTS clinic_overview;
DROP VIEW IF EXISTS provider_details;

-- 2. Remove the new columns from existing tables
ALTER TABLE public.clinics DROP COLUMN IF EXISTS supports_multi_provider;
ALTER TABLE public.clinics DROP COLUMN IF EXISTS default_provider_id;
ALTER TABLE public.clinics DROP COLUMN IF EXISTS comprehensive_data_enabled;
ALTER TABLE public.chat_sessions DROP COLUMN IF EXISTS provider_id;
ALTER TABLE public.chat_sessions DROP COLUMN IF EXISTS provider_context;

-- 3. Drop the new tables (THIS WILL DELETE ALL PROVIDER AND CLINIC DATA)
DROP TABLE IF EXISTS public.clinic_data;
DROP TABLE IF EXISTS public.providers;

-- 4. Drop the update function
DROP FUNCTION IF EXISTS update_modified_column();
*/