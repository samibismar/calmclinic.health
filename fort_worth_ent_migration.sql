-- Fort Worth ENT & Sinus Clinic Migration
-- Updates existing clinic ID 45 with ENT clinic data extracted from fortworthent.net
-- Run this script against your Supabase database

-- =============================================
-- STEP 1: UPDATE EXISTING CLINIC RECORD (ID 45)
-- =============================================

UPDATE public.clinics SET
    slug = 'fort-worth-ent',
    practice_name = 'Fort Worth ENT & Sinus',
    logo_url = NULL,
    primary_color = '#1e40af',
    tone = 'professional',
    languages = ARRAY['English'],
    ai_instructions = 'You are a knowledgeable assistant for Fort Worth ENT & Sinus, specializing in comprehensive ear, nose, throat, and sinus care. Our clinic offers advanced ENT treatments including balloon sinuplasty, VivAer nasal airway remodeling, sleep apnea treatment, voice disorders, thyroid surgery, and pediatric ENT care. Our three board-certified otolaryngologists (Dr. McIntyre, Dr. Watkins, and Dr. Callahan) provide expert care for conditions like chronic sinusitis, hearing loss, allergies, sleep apnea, and head/neck disorders. We have specialized centers for sinus care, thyroid treatment, and comprehensive audiology services.',
    doctor_name = 'Dr. J. Bradley McIntyre, MD',
    specialty = 'Otolaryngology (ENT)',
    example_questions = '[
        "What should I expect during balloon sinuplasty?",
        "How do I prepare for sinus surgery?",
        "What are the treatment options for sleep apnea?",
        "When should I see an ENT doctor for hearing loss?",
        "What is VivAer nasal airway remodeling?",
        "How is chronic sinusitis diagnosed and treated?"
    ]'::jsonb,
    has_completed_setup = true,
    updated_at = NOW()
WHERE id = 45;

-- Verify the clinic exists and was updated
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.clinics WHERE id = 45) THEN
        RAISE EXCEPTION 'Clinic with ID 45 does not exist. Please verify the clinic ID.';
    END IF;
END $$;

-- =============================================
-- STEP 2: CLEAN EXISTING DATA AND ADD NEW DATA
-- =============================================

-- Clean up any existing data for clinic ID 45 before inserting new data
DELETE FROM public.providers WHERE clinic_id = 45;
DELETE FROM public.clinic_scraped_data WHERE clinic_id = 45;
DELETE FROM public.clinic_services WHERE clinic_id = 45;
DELETE FROM public.clinic_insurance WHERE clinic_id = 45;
DELETE FROM public.clinic_policies WHERE clinic_id = 45;
DELETE FROM public.clinic_conditions WHERE clinic_id = 45;
DELETE FROM public.clinic_contact_info WHERE clinic_id = 45;
DELETE FROM public.clinic_hours WHERE clinic_id = 45;

-- Insert comprehensive clinic data from scraping
INSERT INTO public.clinic_scraped_data (
    clinic_id,
    data_category,
    data_json,
    confidence_level,
    source
) VALUES 
-- Contact Information
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    'contact_info',
    '{
        "phone_numbers": {
            "main": "817-332-8848",
            "secondary": "817-335-2670"
        },
        "address": {
            "street": "5751 Edwards Ranch Road",
            "city": "Fort Worth",
            "state": "TX",
            "zip_code": "76109",
            "full_address": "5751 Edwards Ranch Road, Fort Worth, TX 76109"
        },
        "email": null,
        "website": "https://fortworthent.net",
        "social_media": {
            "facebook": "https://www.facebook.com/FortWorthENT/",
            "linkedin": "https://www.linkedin.com/company/fort-worth-ent-p.a./about/"
        }
    }'::jsonb,
    0.90,
    'scraper'
),
-- Hours Information
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    'hours_info',
    '{
        "regular_hours": {
            "monday": "8:00 AM - 5:00 PM",
            "tuesday": "8:00 AM - 5:00 PM",
            "wednesday": "8:00 AM - 5:00 PM",
            "thursday": "8:00 AM - 5:00 PM",
            "friday": "8:00 AM - 5:00 PM",
            "saturday": "Closed",
            "sunday": "Closed"
        },
        "holiday_hours": null,
        "appointment_policies": {
            "scheduling_method": "Call 817-332-8848",
            "online_scheduling": "Available via patient portal",
            "cancellation_policy": "24 hours advance notice required"
        },
        "emergency_hours": null
    }'::jsonb,
    0.70,
    'scraper'
),
-- Services Information
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    'services_info',
    '{
        "medical_services": [
            "Nasal Endoscopy",
            "Hearing Evaluation",
            "Sleep Study",
            "Allergy Testing"
        ],
        "surgical_services": [
            "Balloon Sinuplasty",
            "Vivaer",
            "Septoplasty",
            "Turbinate Reduction",
            "Tonsillectomy",
            "Adenoidectomy",
            "Ear Tubes",
            "Thyroidectomy"
        ],
        "diagnostic_services": [
            "In-office CT Scans",
            "Allergy Testing",
            "Audiometry",
            "Tympanometry",
            "Nasal Endoscopy",
            "Laryngoscopy"
        ],
        "optical_services": [],
        "specialty_programs": [
            "Fort Worth Sinus Center",
            "Fort Worth Thyroid Center",
            "Pediatric ENT",
            "Sleep Apnea Treatment",
            "Voice Center",
            "Allergy and Immunotherapy Center"
        ],
        "conditions_treated": [
            "Sinusitis",
            "Sleep Apnea",
            "Hearing Loss",
            "Thyroid",
            "Allergies",
            "Nasal Polyps",
            "Deviated Septum",
            "Ear Infections",
            "Voice Disorders"
        ]
    }'::jsonb,
    0.85,
    'scraper'
),
-- Insurance Information
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    'insurance_info',
    '{
        "accepted_plans": [
            "Most major health insurance plans",
            "Medicare",
            "Medicaid",
            "Aetna",
            "Blue Cross Blue Shield",
            "Cigna",
            "UnitedHealthcare"
        ],
        "payment_policies": {
            "copays_due_at_service": true,
            "deductibles_due_at_service": true,
            "payment_methods": "Cash, check, credit cards accepted",
            "payment_plans": "Available upon request"
        },
        "special_notes": [
            "Insurance verification recommended prior to appointment",
            "Specialist referral may be required by insurance",
            "Coverage varies by procedure and insurance plan"
        ]
    }'::jsonb,
    0.70,
    'scraper'
),
-- Patient Experience
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    'patient_experience',
    '{
        "walk_in_policy": "Appointments required",
        "wait_time_expectations": null,
        "what_to_bring": [
            "Photo identification",
            "Insurance cards",
            "List of current medications",
            "Referral from primary care physician (if required)",
            "Previous medical records related to ENT issues"
        ],
        "facility_policies": [
            "Arrive 15 minutes early for appointments",
            "Complete patient forms before visit",
            "Children must be accompanied by parent/guardian",
            "New patients should arrive 30 minutes early",
            "Patient forms available online"
        ],
        "accessibility": "ADA compliant facility",
        "patient_portal": true,
        "communication_preferences": [
            "Phone calls for urgent matters",
            "Patient portal for routine communication"
        ]
    }'::jsonb,
    0.75,
    'scraper'
);

-- =============================================
-- STEP 3: ADD PROVIDERS
-- =============================================

INSERT INTO public.providers (clinic_id, name, title, specialties, bio, is_active, is_default, display_order)
VALUES 
(45, 'Dr. J. Bradley McIntyre, MD', 'Otolaryngologist', ARRAY['ENT', 'Sinus Surgery', 'Sleep Apnea'], 'Board-certified otolaryngologist specializing in comprehensive ear, nose, and throat care.', true, true, 1),
(45, 'Dr. Watkins', 'Otolaryngologist', ARRAY['ENT', 'Voice Disorders', 'Thyroid Surgery'], 'Experienced ENT specialist focusing on voice and thyroid conditions.', true, false, 2),
(45, 'Dr. Callahan', 'Otolaryngologist', ARRAY['ENT', 'Pediatric ENT', 'Hearing Loss'], 'Specialized in pediatric ENT care and hearing disorders.', true, false, 3);

-- =============================================
-- STEP 4: ADD INDIVIDUAL SERVICES
-- =============================================

-- Medical Services
INSERT INTO public.clinic_services (clinic_id, service_category, service_name, description, is_active, display_order) 
SELECT 
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent') as clinic_id,
    'medical' as service_category,
    unnest(ARRAY[
        'Comprehensive ENT Evaluation',
        'Allergy Testing and Treatment',
        'Hearing Evaluations', 
        'Voice Therapy',
        'Sleep Apnea Evaluation',
        'Nasal Endoscopy',
        'Laryngoscopy'
    ]) as service_name,
    NULL as description,
    true as is_active,
    row_number() OVER () as display_order;

-- Surgical Services
INSERT INTO public.clinic_services (clinic_id, service_category, service_name, description, is_active, display_order)
VALUES 
(45, 'surgical', 'Balloon Sinuplasty', 'Minimally invasive procedure to open blocked sinus pathways', true, 1),
(45, 'surgical', 'VivAer® Nasal Airway Remodeling', 'Non-invasive treatment to improve nasal breathing', true, 2),
(45, 'surgical', 'Septoplasty', NULL, true, 3),
(45, 'surgical', 'Turbinate Reduction', NULL, true, 4),
(45, 'surgical', 'Tonsillectomy', NULL, true, 5),
(45, 'surgical', 'Adenoidectomy', NULL, true, 6),
(45, 'surgical', 'Thyroid Surgery', NULL, true, 7),
(45, 'surgical', 'Ear Tube Placement', NULL, true, 8),
(45, 'surgical', 'Mastoidectomy', NULL, true, 9),
(45, 'surgical', 'Stapedectomy', NULL, true, 10);

-- Diagnostic Services
INSERT INTO public.clinic_services (clinic_id, service_category, service_name, description, is_active, display_order)
SELECT 
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent') as clinic_id,
    'diagnostic' as service_category,
    unnest(ARRAY[
        'In-office CT Scans',
        'Audiometry',
        'Tympanometry',
        'Allergy Testing',
        'Sleep Studies',
        'Voice Analysis'
    ]) as service_name,
    NULL as description,
    true as is_active,
    row_number() OVER () as display_order;

-- Specialty Programs
INSERT INTO public.clinic_services (clinic_id, service_category, service_name, description, is_active, display_order)
SELECT 
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent') as clinic_id,
    'specialty' as service_category,
    unnest(ARRAY[
        'Fort Worth Sinus Center',
        'Fort Worth Thyroid Center',
        'Pediatric ENT Services',
        'Sleep Apnea Treatment Center',
        'Voice and Swallowing Center',
        'Allergy and Immunotherapy Center'
    ]) as service_name,
    NULL as description,
    true as is_active,
    row_number() OVER () as display_order;

-- =============================================
-- STEP 5: ADD INSURANCE PLANS
-- =============================

INSERT INTO public.clinic_insurance (clinic_id, plan_name, plan_type, is_active)
VALUES 
(45, 'Aetna', 'commercial', true),
(45, 'Blue Cross Blue Shield', 'commercial', true),
(45, 'Cigna', 'commercial', true),
(45, 'UnitedHealthcare', 'commercial', true),
(45, 'Medicare', 'government', true),
(45, 'Medicaid', 'government', true);

-- =============================================
-- STEP 6: ADD POLICIES
-- =============================

INSERT INTO public.clinic_policies (clinic_id, policy_category, policy_name, policy_description, policy_value, is_active)
VALUES 
-- Appointment Policies
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    'appointment',
    'Scheduling Method',
    'Primary method for scheduling appointments',
    'Call 817-332-8848',
    true
),
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    'appointment',
    'Online Scheduling',
    'Online scheduling availability',
    'Available via patient portal',
    true
),
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    'appointment',
    'Cancellation Policy',
    'Required notice for appointment cancellations',
    '24 hours advance notice required',
    true
),
-- Facility Policies
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    'facility',
    'Arrival Time',
    'How early patients should arrive',
    'Arrive 15 minutes early for appointments',
    true
),
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    'facility',
    'New Patient Arrival',
    'Arrival time for new patients',
    'New patients should arrive 30 minutes early',
    true
),
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    'facility',
    'Guardian Requirement',
    'Policy for pediatric patients',
    'Children must be accompanied by parent/guardian',
    true
),
-- Payment Policies
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    'payment',
    'Copay Policy',
    'When copays are due',
    'Copays due at time of service',
    true
),
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    'payment',
    'Deductible Policy',
    'When deductibles are due',
    'Deductibles due at time of service',
    true
),
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    'payment',
    'Payment Methods',
    'Accepted payment methods',
    'Cash, check, credit cards accepted',
    true
);

-- =============================================
-- STEP 7: ADD CONDITIONS TREATED
-- =============================

INSERT INTO public.clinic_conditions (clinic_id, condition_name, condition_description, is_specialty, is_active)
VALUES 
(45, 'Chronic Sinusitis', NULL, false, true),
(45, 'Sleep Apnea', NULL, true, true),
(45, 'Hearing Loss', NULL, false, true),
(45, 'Voice Disorders', NULL, true, true),
(45, 'Thyroid Conditions', NULL, true, true),
(45, 'Allergies', NULL, false, true),
(45, 'Nasal Polyps', NULL, false, true),
(45, 'Deviated Septum', NULL, false, true),
(45, 'Ear Infections', NULL, false, true),
(45, 'Tinnitus', NULL, false, true),
(45, 'Vertigo and Balance Disorders', NULL, false, true),
(45, 'Head and Neck Tumors', NULL, true, true),
(45, 'Snoring', NULL, false, true),
(45, 'Swallowing Disorders', NULL, false, true);

-- =============================================
-- STEP 8: ADD CONTACT INFORMATION
-- =============================

INSERT INTO public.clinic_contact_info (clinic_id, contact_type, contact_value, contact_label, is_primary, is_active)
VALUES 
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    'phone',
    '817-332-8848',
    'Main Phone',
    true,
    true
),
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    'phone',
    '817-335-2670',
    'Secondary Phone',
    false,
    true
),
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    'address',
    '5751 Edwards Ranch Road, Fort Worth, TX 76109',
    'Main Office',
    true,
    true
),
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    'website',
    'https://fortworthent.net',
    'Website',
    true,
    true
),
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    'social',
    'https://www.facebook.com/FortWorthENT/',
    'Facebook',
    false,
    true
),
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    'social',
    'https://www.linkedin.com/company/fort-worth-ent-p.a./about/',
    'LinkedIn',
    false,
    true
);

-- =============================================
-- STEP 9: ADD OPERATING HOURS
-- =====

INSERT INTO public.clinic_hours (clinic_id, day_of_week, open_time, close_time, is_closed, is_active)
VALUES 
-- Monday through Friday 8 AM - 5 PM
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    1, -- Monday
    '08:00:00',
    '17:00:00',
    false,
    true
),
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    2, -- Tuesday
    '08:00:00',
    '17:00:00',
    false,
    true
),
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    3, -- Wednesday
    '08:00:00',
    '17:00:00',
    false,
    true
),
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    4, -- Thursday
    '08:00:00',
    '17:00:00',
    false,
    true
),
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    5, -- Friday
    '08:00:00',
    '17:00:00',
    false,
    true
),
-- Weekend - Closed
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    6, -- Saturday
    NULL,
    NULL,
    true,
    true
),
(
    (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent'),
    0, -- Sunday
    NULL,
    NULL,
    true,
    true
);

-- =============================================
-- MIGRATION SUMMARY
-- =============================================

-- Display summary of what was added
SELECT 
    'Fort Worth ENT & Sinus Migration Summary' as section,
    (SELECT COUNT(*) FROM public.clinics WHERE slug = 'fort-worth-ent') as clinics_added,
    (SELECT COUNT(*) FROM public.clinic_scraped_data WHERE clinic_id = (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent')) as scraped_data_entries,
    (SELECT COUNT(*) FROM public.clinic_services WHERE clinic_id = (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent')) as services_added,
    (SELECT COUNT(*) FROM public.clinic_insurance WHERE clinic_id = (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent')) as insurance_plans_added,
    (SELECT COUNT(*) FROM public.clinic_policies WHERE clinic_id = (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent')) as policies_added,
    (SELECT COUNT(*) FROM public.clinic_conditions WHERE clinic_id = (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent')) as conditions_added,
    (SELECT COUNT(*) FROM public.clinic_contact_info WHERE clinic_id = (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent')) as contact_entries_added,
    (SELECT COUNT(*) FROM public.clinic_hours WHERE clinic_id = (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent')) as hours_entries_added;

-- Show the new clinic details
SELECT 
    id,
    slug,
    clinic_name,
    specialty,
    doctor_name,
    has_completed_setup,
    created_at
FROM public.clinics 
WHERE slug = 'fort-worth-ent';

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify all data was inserted correctly
SELECT 'Services by Category' as check_type, service_category, COUNT(*) as count
FROM public.clinic_services 
WHERE clinic_id = (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent')
GROUP BY service_category
UNION ALL
SELECT 'Insurance Plans' as check_type, plan_type, COUNT(*) as count
FROM public.clinic_insurance 
WHERE clinic_id = (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent')
GROUP BY plan_type
UNION ALL  
SELECT 'Policies by Category' as check_type, policy_category, COUNT(*) as count
FROM public.clinic_policies 
WHERE clinic_id = (SELECT id FROM public.clinics WHERE slug = 'fort-worth-ent')
GROUP BY policy_category
ORDER BY check_type, count DESC;