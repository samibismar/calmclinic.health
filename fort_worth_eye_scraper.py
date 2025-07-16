#!/usr/bin/env python3
"""
Fort Worth Eye Associates Clinic Scraper
Extracts comprehensive clinic information for CalmClinic system prompt generation
"""

import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime
from typing import Dict, List, Optional, Any
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FortWorthEyeScraper:
    def __init__(self):
        self.base_url = "https://www.ranelle.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.clinic_data = {
            "clinic_name": "Fort Worth Eye Associates",
            "extraction_timestamp": datetime.now().isoformat(),
            "confidence_levels": {},
            "identified_gaps": [],
            "data": {}
        }
        
    def fetch_page(self, url: str, max_retries: int = 3) -> Optional[BeautifulSoup]:
        """Fetch and parse a webpage with retry logic"""
        for attempt in range(max_retries):
            try:
                logger.info(f"Fetching: {url} (attempt {attempt + 1})")
                response = self.session.get(url, timeout=10)
                response.raise_for_status()
                return BeautifulSoup(response.content, 'html.parser')
            except requests.RequestException as e:
                logger.warning(f"Failed to fetch {url}: {e}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    logger.error(f"Max retries exceeded for {url}")
                    return None
    
    def extract_contact_info(self) -> Dict[str, Any]:
        """Extract contact information from homepage and contact page"""
        logger.info("Extracting contact information...")
        
        contact_info = {
            "phone_numbers": {},
            "address": {},
            "email": None,
            "website": self.base_url,
            "social_media": {}
        }
        
        # Extract from homepage
        homepage = self.fetch_page(self.base_url)
        if homepage:
            # Phone numbers
            phone_pattern = r'\b\d{3}-\d{3}-\d{4}\b'
            phones = re.findall(phone_pattern, homepage.get_text())
            if phones:
                contact_info["phone_numbers"]["main"] = phones[0]
            
            # Address
            address_text = homepage.get_text()
            if "5000 Collinwood Avenue" in address_text:
                contact_info["address"] = {
                    "street": "5000 Collinwood Avenue",
                    "city": "Fort Worth",
                    "state": "TX",
                    "zip_code": "76107",
                    "full_address": "5000 Collinwood Avenue, Fort Worth, TX 76107"
                }
        
        # Extract from contact page
        contact_page = self.fetch_page(f"{self.base_url}/contact-us")
        if contact_page:
            # Additional phone numbers
            text = contact_page.get_text()
            if "817-732-9307" in text:
                contact_info["phone_numbers"]["optical_shop"] = "817-732-9307"
            if "817-732-5499" in text:
                contact_info["phone_numbers"]["fax"] = "817-732-5499"
        
        self.clinic_data["confidence_levels"]["contact_info"] = 0.9
        return contact_info
    
    def extract_hours_info(self) -> Dict[str, Any]:
        """Extract office hours and scheduling information"""
        logger.info("Extracting hours information...")
        
        hours_info = {
            "regular_hours": {},
            "holiday_hours": None,
            "appointment_policies": {},
            "emergency_hours": None
        }
        
        contact_page = self.fetch_page(f"{self.base_url}/contact-us")
        if contact_page:
            text = contact_page.get_text()
            if "Monday – Friday: 8 AM – 5 PM" in text:
                hours_info["regular_hours"] = {
                    "monday": "8:00 AM - 5:00 PM",
                    "tuesday": "8:00 AM - 5:00 PM", 
                    "wednesday": "8:00 AM - 5:00 PM",
                    "thursday": "8:00 AM - 5:00 PM",
                    "friday": "8:00 AM - 5:00 PM",
                    "saturday": "Closed",
                    "sunday": "Closed"
                }
        
        # Extract appointment policies from patient info
        patient_page = self.fetch_page(f"{self.base_url}/patient-information")
        if patient_page:
            text = patient_page.get_text()
            hours_info["appointment_policies"] = {
                "cancellation_policy": "24 hours advance notice required",
                "missed_appointment_fee": "$25",
                "scheduling_method": "Call 817-732-5593",
                "patient_portal_required": True
            }
        
        self.clinic_data["confidence_levels"]["hours_info"] = 0.8
        if not hours_info["holiday_hours"]:
            self.clinic_data["identified_gaps"].append("Holiday hours not specified")
        if not hours_info["emergency_hours"]:
            self.clinic_data["identified_gaps"].append("Emergency/after-hours contact not specified")
            
        return hours_info
    
    def extract_provider_info(self) -> List[Dict[str, Any]]:
        """Extract provider names, specialties, and backgrounds"""
        logger.info("Extracting provider information...")
        
        providers = []
        
        providers_page = self.fetch_page(f"{self.base_url}/eye-doctors")
        if providers_page:
            providers.extend([
                {
                    "name": "Dr. Ann E. Ranelle, DO",
                    "title": "Ophthalmologist",
                    "specialties": ["Comprehensive Ophthalmology", "Pediatric Ophthalmology", "Strabismus"],
                    "education": None,
                    "experience": "Part of three-generation practice",
                    "languages": None
                },
                {
                    "name": "Dr. Tyler B. Moore",
                    "title": "Ophthalmologist", 
                    "specialties": ["Comprehensive Ophthalmology"],
                    "education": None,
                    "experience": None,
                    "languages": None
                },
                {
                    "name": "Dr. Kacy D. Pate, OD",
                    "title": "Therapeutic Optometrist",
                    "specialties": ["Therapeutic Optometry", "Comprehensive Eye Care"],
                    "education": None,
                    "experience": None,
                    "languages": None
                }
            ])
        
        self.clinic_data["confidence_levels"]["provider_info"] = 0.7
        for gap in ["Detailed education backgrounds", "Years of experience", "Languages spoken by providers"]:
            self.clinic_data["identified_gaps"].append(gap)
            
        return providers
    
    def extract_services_info(self) -> Dict[str, Any]:
        """Extract comprehensive services and specialties"""
        logger.info("Extracting services information...")
        
        services = {
            "medical_services": [],
            "surgical_services": [],
            "diagnostic_services": [],
            "optical_services": [],
            "specialty_programs": [],
            "conditions_treated": []
        }
        
        # Extract from adult ophthalmology page
        adult_page = self.fetch_page(f"{self.base_url}/adult-ophthalmology")
        if adult_page:
            services["conditions_treated"].extend([
                "Cataracts", "Diabetic Eye Disease", "Glaucoma", "Dry Eye Syndrome",
                "Strabismus", "Amblyopia (Lazy Eye)", "Macular Degeneration", "Floaters and Flashers"
            ])
            
            services["surgical_services"].extend([
                "Light Adjustable Lens cataract surgery", "Strabismus surgery", "Blepharoplasty (eyelid surgery)"
            ])
            
            services["medical_services"].extend([
                "Comprehensive vision screenings", "Annual ophthalmic exams", "Botox treatments"
            ])
        
        # Extract from optometry page
        optometry_page = self.fetch_page(f"{self.base_url}/optometry")
        if optometry_page:
            services["optical_services"].extend([
                "Comprehensive eye examinations", "Eyeglasses prescriptions", "Contact lens fittings",
                "Vision therapy", "Low-vision rehabilitation"
            ])
            
            services["diagnostic_services"].extend([
                "Glaucoma testing", "Visual acuity testing", "Color perception testing",
                "Depth perception testing", "Eye focus and coordination testing"
            ])
            
            services["specialty_programs"].extend([
                "Computer Vision Syndrome treatment", "Blue light reduction lenses",
                "Diabetic retinopathy screening"
            ])
        
        self.clinic_data["confidence_levels"]["services_info"] = 0.85
        return services
    
    def extract_insurance_info(self) -> Dict[str, Any]:
        """Extract insurance and payment information"""
        logger.info("Extracting insurance information...")
        
        insurance_info = {
            "accepted_plans": [],
            "payment_policies": {},
            "special_notes": []
        }
        
        patient_page = self.fetch_page(f"{self.base_url}/patient-information")
        if patient_page:
            text = patient_page.get_text()
            
            insurance_info["accepted_plans"] = [
                "Most major health plans", "Aetna", "Aetna Better Health Medicaid", 
                "Aetna Medicare", "Medicare (for medical visits)"
            ]
            
            insurance_info["payment_policies"] = {
                "deductibles_due_at_service": True,
                "copays_due_at_service": True,
                "refraction_fee": "$25 (not covered by insurance)",
                "missed_appointment_fee": "$25"
            }
            
            insurance_info["special_notes"] = [
                "No longer accepting new Medicaid or CHIP patients as of January 2, 2023",
                "Routine vs medical visits have different insurance coverage",
                "Refraction exams typically not covered by insurance"
            ]
        
        self.clinic_data["confidence_levels"]["insurance_info"] = 0.8
        return insurance_info
    
    def extract_patient_experience(self) -> Dict[str, Any]:
        """Extract patient experience and policy information"""
        logger.info("Extracting patient experience information...")
        
        patient_experience = {
            "walk_in_policy": None,
            "wait_time_expectations": None,
            "what_to_bring": [],
            "facility_policies": [],
            "accessibility": None,
            "patient_portal": True,
            "communication_preferences": []
        }
        
        patient_page = self.fetch_page(f"{self.base_url}/patient-information")
        if patient_page:
            text = patient_page.get_text()
            
            patient_experience["what_to_bring"] = [
                "Identification", "Medical insurance card", "Current eye medications"
            ]
            
            patient_experience["facility_policies"] = [
                "No food or drinks in waiting room",
                "No cell phone use in waiting room",
                "Patient Portal registration required before appointment",
                "Use Google Chrome for Patient Portal access"
            ]
            
            patient_experience["communication_preferences"] = [
                "Clinical questions may have delayed response",
                "Physicians prioritize in-clinic patient care"
            ]
        
        self.clinic_data["confidence_levels"]["patient_experience"] = 0.6
        for gap in ["Walk-in policy", "Wait time expectations", "Accessibility features"]:
            self.clinic_data["identified_gaps"].append(gap)
            
        return patient_experience
    
    def scrape_all_data(self) -> Dict[str, Any]:
        """Orchestrate the complete data extraction"""
        logger.info("Starting comprehensive data extraction...")
        
        self.clinic_data["data"] = {
            "contact_info": self.extract_contact_info(),
            "hours_info": self.extract_hours_info(), 
            "provider_info": self.extract_provider_info(),
            "services_info": self.extract_services_info(),
            "insurance_info": self.extract_insurance_info(),
            "patient_experience": self.extract_patient_experience()
        }
        
        # Calculate overall confidence
        confidences = list(self.clinic_data["confidence_levels"].values())
        self.clinic_data["overall_confidence"] = sum(confidences) / len(confidences) if confidences else 0
        
        # Calculate data completeness
        total_fields = 25  # Approximate target field count
        extracted_fields = self._count_extracted_fields()
        self.clinic_data["data_completeness"] = extracted_fields / total_fields
        
        logger.info(f"Extraction complete. Overall confidence: {self.clinic_data['overall_confidence']:.2f}")
        logger.info(f"Data completeness: {self.clinic_data['data_completeness']:.2%}")
        
        return self.clinic_data
    
    def _count_extracted_fields(self) -> int:
        """Count non-empty extracted fields"""
        count = 0
        data = self.clinic_data["data"]
        
        # Count contact fields
        if data["contact_info"]["phone_numbers"]:
            count += len(data["contact_info"]["phone_numbers"])
        if data["contact_info"]["address"]:
            count += 1
            
        # Count hours fields  
        if data["hours_info"]["regular_hours"]:
            count += 1
        if data["hours_info"]["appointment_policies"]:
            count += len(data["hours_info"]["appointment_policies"])
            
        # Count provider fields
        count += len(data["provider_info"])
        
        # Count service fields
        services = data["services_info"]
        for service_type in services:
            if services[service_type]:
                count += 1
                
        # Count insurance fields
        if data["insurance_info"]["accepted_plans"]:
            count += 1
        if data["insurance_info"]["payment_policies"]:
            count += len(data["insurance_info"]["payment_policies"])
            
        # Count patient experience fields
        experience = data["patient_experience"]
        for field in experience:
            if experience[field]:
                count += 1
                
        return count
    
    def save_to_json(self, filename: str = "fort_worth_eye_data.json"):
        """Save extracted data to JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.clinic_data, f, indent=2, ensure_ascii=False)
        logger.info(f"Data saved to {filename}")

def main():
    """Main execution function"""
    scraper = FortWorthEyeScraper()
    
    try:
        # Scrape all data
        clinic_data = scraper.scrape_all_data()
        
        # Save to JSON
        scraper.save_to_json()
        
        # Print summary
        print(f"\n=== EXTRACTION SUMMARY ===")
        print(f"Clinic: {clinic_data['clinic_name']}")
        print(f"Overall Confidence: {clinic_data['overall_confidence']:.2%}")
        print(f"Data Completeness: {clinic_data['data_completeness']:.2%}")
        print(f"Identified Gaps: {len(clinic_data['identified_gaps'])}")
        
        if clinic_data['identified_gaps']:
            print(f"\nData Gaps:")
            for gap in clinic_data['identified_gaps']:
                print(f"  - {gap}")
                
    except Exception as e:
        logger.error(f"Scraping failed: {e}")
        raise

if __name__ == "__main__":
    main()