-- Clinic Intelligence Dashboard Database Schema
-- This schema stores comprehensive clinic data extracted from scraping

-- Enhanced clinic data storage for comprehensive information
CREATE TABLE IF NOT EXISTS clinic_scraped_data (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    data_category VARCHAR(50) NOT NULL, -- contact_info, hours_info, services_info, etc.
    data_json JSONB NOT NULL,
    confidence_level DECIMAL(3,2) DEFAULT 0.0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(100) DEFAULT 'scraper',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comprehensive services management
CREATE TABLE IF NOT EXISTS clinic_services (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    service_category VARCHAR(50) NOT NULL, -- medical, surgical, diagnostic, optical, specialty
    service_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insurance and billing details
CREATE TABLE IF NOT EXISTS clinic_insurance (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    plan_name VARCHAR(255) NOT NULL,
    plan_type VARCHAR(50), -- major, medicaid, medicare, etc.
    coverage_notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient experience settings and policies
CREATE TABLE IF NOT EXISTS clinic_policies (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    policy_category VARCHAR(50) NOT NULL, -- appointment, payment, facility, communication
    policy_name VARCHAR(255) NOT NULL,
    policy_description TEXT,
    policy_value VARCHAR(255), -- for fees, times, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conditions treated by the clinic
CREATE TABLE IF NOT EXISTS clinic_conditions (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    condition_name VARCHAR(255) NOT NULL,
    condition_description TEXT,
    is_specialty BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced contact information
CREATE TABLE IF NOT EXISTS clinic_contact_info (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    contact_type VARCHAR(50) NOT NULL, -- main, optical, fax, emergency
    contact_value VARCHAR(255) NOT NULL,
    contact_label VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Operating hours with detailed scheduling
CREATE TABLE IF NOT EXISTS clinic_hours (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT false,
    is_holiday_schedule BOOLEAN DEFAULT false,
    holiday_name VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data gaps and completeness tracking
CREATE TABLE IF NOT EXISTS clinic_data_gaps (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE,
    gap_category VARCHAR(50) NOT NULL,
    gap_description TEXT NOT NULL,
    is_filled BOOLEAN DEFAULT false,
    priority_level INTEGER DEFAULT 1, -- 1 = low, 2 = medium, 3 = high
    filled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clinic_scraped_data_clinic_id ON clinic_scraped_data(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_scraped_data_category ON clinic_scraped_data(data_category);
CREATE INDEX IF NOT EXISTS idx_clinic_services_clinic_id ON clinic_services(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_insurance_clinic_id ON clinic_insurance(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_policies_clinic_id ON clinic_policies(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_conditions_clinic_id ON clinic_conditions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_contact_info_clinic_id ON clinic_contact_info(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_hours_clinic_id ON clinic_hours(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_data_gaps_clinic_id ON clinic_data_gaps(clinic_id);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clinic_services_updated_at BEFORE UPDATE ON clinic_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinic_insurance_updated_at BEFORE UPDATE ON clinic_insurance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinic_policies_updated_at BEFORE UPDATE ON clinic_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();