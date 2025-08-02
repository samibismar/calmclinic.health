-- Fix insurance plan types for Fort Worth ENT (clinic_id = 45)
-- Update plan types to match UI expectations

UPDATE public.clinic_insurance 
SET plan_type = CASE 
    WHEN plan_name = 'Medicare' THEN 'medicare'
    WHEN plan_name = 'Medicaid' THEN 'medicaid'
    WHEN plan_name IN ('Aetna', 'Blue Cross Blue Shield', 'Cigna', 'UnitedHealthcare') THEN 'major'
    ELSE plan_type
END
WHERE clinic_id = 45;

-- Verify the update
SELECT id, clinic_id, plan_name, plan_type, is_active 
FROM public.clinic_insurance 
WHERE clinic_id = 45 
ORDER BY plan_type, plan_name;