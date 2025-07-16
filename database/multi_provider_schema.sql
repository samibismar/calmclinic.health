-- Multi-Provider Chat System Database Schema
-- This schema extends the existing single-provider system to support multiple providers per clinic
-- with comprehensive clinic data structure

-- =============================================
-- 1. PROVIDERS TABLE
-- =============================================
-- Stores individual provider information for each clinic
CREATE TABLE public.providers (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255), -- e.g., "Ophthalmologist", "Therapeutic Optometrist"
    specialties TEXT[], -- Array of specialties like ["Comprehensive Ophthalmology", "Pediatric Ophthalmology"]
    bio TEXT, -- Provider biography/description
    education TEXT, -- Educational background
    experience TEXT, -- Years of experience, certifications
    languages TEXT[], -- Languages spoken by provider
    avatar_url VARCHAR(500), -- URL to provider's photo
    is_active BOOLEAN DEFAULT true, -- Whether provider is currently active
    is_default BOOLEAN DEFAULT false, -- Default provider for the clinic
    display_order INTEGER DEFAULT 0, -- Order for displaying providers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient provider lookups
CREATE INDEX idx_providers_clinic_id ON public.providers(clinic_id);
CREATE INDEX idx_providers_active ON public.providers(clinic_id, is_active);
CREATE INDEX idx_providers_default ON public.providers(clinic_id, is_default);

-- =============================================
-- 2. CLINIC_DATA TABLE
-- =============================================
-- Stores comprehensive clinic information for rich AI context
CREATE TABLE public.clinic_data (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    
    -- Contact Information
    contact_info JSONB DEFAULT '{}'::jsonb, -- Phone numbers, addresses, email, website, social media
    
    -- Hours & Scheduling
    hours_info JSONB DEFAULT '{}'::jsonb, -- Regular hours, holiday hours, appointment policies, emergency hours
    
    -- Services & Specialties
    services_info JSONB DEFAULT '{}'::jsonb, -- Medical services, surgical services, diagnostic services, conditions treated
    
    -- Insurance & Payment
    insurance_info JSONB DEFAULT '{}'::jsonb, -- Accepted plans, payment policies, special notes
    
    -- Patient Experience
    patient_experience JSONB DEFAULT '{}'::jsonb, -- Walk-in policy, wait times, what to bring, facility policies
    
    -- Data Quality Metrics
    data_completeness DECIMAL(3,2) DEFAULT 0.0, -- 0.0 to 1.0 completeness score
    confidence_levels JSONB DEFAULT '{}'::jsonb, -- Confidence levels for different data sections
    identified_gaps TEXT[], -- Array of missing data points
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Extraction Metadata
    extraction_source VARCHAR(255), -- Source of the data (manual, scraper, etc.)
    extraction_timestamp TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for clinic data lookups
CREATE INDEX idx_clinic_data_clinic_id ON public.clinic_data(clinic_id);

-- =============================================
-- 3. UPDATE EXISTING TABLES
-- =============================================

-- Add multi-provider support fields to clinics table
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS supports_multi_provider BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS default_provider_id INTEGER REFERENCES public.providers(id),
ADD COLUMN IF NOT EXISTS comprehensive_data_enabled BOOLEAN DEFAULT false;

-- Update chat_sessions to track provider context
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS provider_id INTEGER REFERENCES public.providers(id),
ADD COLUMN IF NOT EXISTS provider_context JSONB DEFAULT '{}'::jsonb;

-- Index for chat sessions with provider context
CREATE INDEX IF NOT EXISTS idx_chat_sessions_provider ON public.chat_sessions(provider_id);

-- =============================================
-- 4. EXAMPLE DATA STRUCTURE FOR CLINIC_DATA
-- =============================================
-- This shows the JSON structure based on Fort Worth Eye Associates data

/*
contact_info: {
  "phone_numbers": {
    "main": "817-732-5593",
    "optical_shop": "817-732-9307", 
    "fax": "817-732-5499"
  },
  "address": {
    "street": "5000 Collinwood Avenue",
    "city": "Fort Worth",
    "state": "TX",
    "zip_code": "76107",
    "full_address": "5000 Collinwood Avenue, Fort Worth, TX 76107"
  },
  "email": null,
  "website": "https://www.ranelle.com",
  "social_media": {}
}

hours_info: {
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
    "cancellation_policy": "24 hours advance notice required",
    "missed_appointment_fee": "$25",
    "scheduling_method": "Call 817-732-5593",
    "patient_portal_required": true
  },
  "emergency_hours": null
}

services_info: {
  "medical_services": ["Comprehensive vision screenings", "Annual ophthalmic exams", "Botox treatments"],
  "surgical_services": ["Light Adjustable Lens cataract surgery", "Strabismus surgery", "Blepharoplasty (eyelid surgery)"],
  "diagnostic_services": ["Glaucoma testing", "Visual acuity testing", "Color perception testing"],
  "optical_services": ["Comprehensive eye examinations", "Eyeglasses prescriptions", "Contact lens fittings"],
  "specialty_programs": ["Computer Vision Syndrome treatment", "Blue light reduction lenses"],
  "conditions_treated": ["Cataracts", "Diabetic Eye Disease", "Glaucoma", "Dry Eye Syndrome"]
}

insurance_info: {
  "accepted_plans": ["Most major health plans", "Aetna", "Aetna Better Health Medicaid", "Aetna Medicare"],
  "payment_policies": {
    "deductibles_due_at_service": true,
    "copays_due_at_service": true,
    "refraction_fee": "$25 (not covered by insurance)",
    "missed_appointment_fee": "$25"
  },
  "special_notes": ["No longer accepting new Medicaid or CHIP patients as of January 2, 2023"]
}

patient_experience: {
  "walk_in_policy": null,
  "wait_time_expectations": null,
  "what_to_bring": ["Identification", "Medical insurance card", "Current eye medications"],
  "facility_policies": ["No food or drinks in waiting room", "Patient Portal registration required"],
  "accessibility": null,
  "patient_portal": true,
  "communication_preferences": ["Clinical questions may have delayed response"]
}
*/

-- =============================================
-- 5. FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_providers_modtime 
    BEFORE UPDATE ON public.providers 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_clinic_data_modtime 
    BEFORE UPDATE ON public.clinic_data 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- =============================================
-- 6. CONSTRAINTS AND VALIDATION
-- =============================================

-- Ensure only one default provider per clinic
CREATE UNIQUE INDEX idx_unique_default_provider 
ON public.providers(clinic_id) 
WHERE is_default = true;

-- Ensure clinic_data is unique per clinic
CREATE UNIQUE INDEX idx_unique_clinic_data 
ON public.clinic_data(clinic_id);

-- =============================================
-- 7. COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE public.providers IS 'Stores individual provider information for multi-provider clinic support';
COMMENT ON TABLE public.clinic_data IS 'Stores comprehensive clinic information for rich AI context generation';
COMMENT ON COLUMN public.providers.specialties IS 'Array of provider specialties for specialty-specific routing';
COMMENT ON COLUMN public.providers.is_default IS 'Default provider for backward compatibility with single-provider setup';
COMMENT ON COLUMN public.clinic_data.contact_info IS 'JSON structure containing phone numbers, addresses, email, website, social media';
COMMENT ON COLUMN public.clinic_data.data_completeness IS 'Completeness score from 0.0 to 1.0 based on filled fields';
COMMENT ON COLUMN public.clinics.supports_multi_provider IS 'Feature flag for multi-provider functionality';
COMMENT ON COLUMN public.clinics.comprehensive_data_enabled IS 'Feature flag for rich clinic data usage in AI prompts';