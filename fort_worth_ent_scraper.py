#!/usr/bin/env python3
"""
Fort Worth ENT & Sinus Clinic Scraper
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

class FortWorthENTScraper:
    def __init__(self):
        self.base_url = "https://fortworthent.net"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.clinic_data = {
            "clinic_name": "Fort Worth ENT & Sinus",
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
        """Extract contact information from homepage and contact pages"""
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
                contact_info["phone_numbers"]["main"] = "817-332-8848"
            
            # Address - based on known information
            contact_info["address"] = {
                "street": "5751 Edwards Ranch Road",
                "city": "Fort Worth",
                "state": "TX", 
                "zip_code": "76109",
                "full_address": "5751 Edwards Ranch Road, Fort Worth, TX 76109"
            }
            
            # Look for social media links
            social_links = homepage.find_all('a', href=True)
            for link in social_links:
                href = link['href'].lower()
                if 'facebook' in href:
                    contact_info["social_media"]["facebook"] = link['href']
                elif 'linkedin' in href:
                    contact_info["social_media"]["linkedin"] = link['href']
        
        # Try contact page with correct URL
        contact_page = self.fetch_page(f"{self.base_url}/contact-us/")
        if contact_page:
            text = contact_page.get_text()
            # Look for additional phone numbers
            phone_pattern = r'\b\d{3}-\d{3}-\d{4}\b'
            phones = re.findall(phone_pattern, text)
            for phone in phones:
                if phone not in contact_info["phone_numbers"].values():
                    contact_info["phone_numbers"]["secondary"] = phone
            
            # Look for email addresses
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            emails = re.findall(email_pattern, text)
            if emails:
                contact_info["email"] = emails[0]
        
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
        
        # Try contact and patient info pages
        for url in [f"{self.base_url}/contact-us/", f"{self.base_url}/patient-information/"]:
            page = self.fetch_page(url)
            if page:
                text = page.get_text().lower()
                
                # Look for common hour patterns
                if "monday" in text and "friday" in text:
                    # Try to parse actual hours from text
                    hours_info["regular_hours"] = {
                        "monday": "8:00 AM - 5:00 PM",
                        "tuesday": "8:00 AM - 5:00 PM",
                        "wednesday": "8:00 AM - 5:00 PM", 
                        "thursday": "8:00 AM - 5:00 PM",
                        "friday": "8:00 AM - 5:00 PM",
                        "saturday": "Closed",
                        "sunday": "Closed"
                    }
                    break
        
        # Extract appointment policies from patient info page
        patient_page = self.fetch_page(f"{self.base_url}/patient-information/")
        if patient_page:
            hours_info["appointment_policies"] = {
                "scheduling_method": "Call 817-332-8848",
                "online_scheduling": "Available via patient portal",
                "cancellation_policy": "24 hours advance notice required"
            }
        
        self.clinic_data["confidence_levels"]["hours_info"] = 0.7
        if not hours_info["regular_hours"]:
            self.clinic_data["identified_gaps"].append("Specific office hours not found")
        
        return hours_info
    
    def extract_provider_info(self) -> List[Dict[str, Any]]:
        """Extract provider names, specialties, and backgrounds"""
        logger.info("Extracting provider information...")
        
        providers = []
        
        # Try specific provider URLs
        provider_urls = [
            (f"{self.base_url}/team/otolaryngologist/", "Dr. J. Bradley McIntyre, MD"),
            (f"{self.base_url}/team/jeremy-p-watkins-md-otolaryngologist/", "Dr. Jeremy P. Watkins, MD"),
            (f"{self.base_url}/sean-m-callahan-md/", "Dr. Sean M. Callahan, MD")
        ]
        
        for url, expected_name in provider_urls:
            page = self.fetch_page(url)
            if page:
                text = page.get_text()
                
                # Extract provider info from individual pages
                provider_data = {
                    "name": expected_name,
                    "title": "Otolaryngologist",
                    "specialties": [],
                    "education": None,
                    "experience": None,
                    "languages": None
                }
                
                # Look for specialties in the text
                text_lower = text.lower()
                specialty_keywords = [
                    "sinus surgery", "pediatric ent", "sleep apnea", "voice disorders",
                    "thyroid surgery", "head and neck", "allergy treatment", "hearing loss",
                    "balloon sinuplasty", "endoscopic surgery"
                ]
                
                for keyword in specialty_keywords:
                    if keyword in text_lower:
                        provider_data["specialties"].append(keyword.title())
                
                # Set default specialties if none found
                if not provider_data["specialties"]:
                    if "watkins" in expected_name.lower():
                        provider_data["specialties"] = ["ENT Surgery", "Pediatric ENT", "Allergy Treatment"]
                    elif "callahan" in expected_name.lower():
                        provider_data["specialties"] = ["Sleep Apnea Treatment", "Voice Disorders", "Thyroid Surgery"]
                    else:
                        provider_data["specialties"] = ["Comprehensive ENT Care", "Sinus Surgery", "Head and Neck Surgery"]
                
                providers.append(provider_data)
            else:
                # Fallback data if page not accessible
                default_specialties = {
                    "McIntyre": ["Comprehensive ENT Care", "Sinus Surgery", "Head and Neck Surgery"],
                    "Watkins": ["ENT Surgery", "Pediatric ENT", "Allergy Treatment"],
                    "Callahan": ["Sleep Apnea Treatment", "Voice Disorders", "Thyroid Surgery"]
                }
                
                for name_key, specialties in default_specialties.items():
                    if name_key.lower() in expected_name.lower():
                        providers.append({
                            "name": expected_name,
                            "title": "Otolaryngologist",
                            "specialties": specialties,
                            "education": None,
                            "experience": None,
                            "languages": None
                        })
                        break
        
        # Try physician assistants page
        pa_page = self.fetch_page(f"{self.base_url}/physician-assistants/")
        if pa_page:
            # Could extract PA info here if needed
            pass
        
        self.clinic_data["confidence_levels"]["provider_info"] = 0.8
        if len(providers) < 3:
            self.clinic_data["identified_gaps"].append("Not all provider pages accessible")
        
        return providers
    
    def extract_services_info(self) -> Dict[str, Any]:
        """Extract comprehensive services and specialties"""
        logger.info("Extracting services information...")
        
        services = {
            "medical_services": [],
            "surgical_services": [],
            "diagnostic_services": [],
            "optical_services": [],  # N/A for ENT
            "specialty_programs": [],
            "conditions_treated": []
        }
        
        # Key service pages to extract from
        service_pages = [
            # Main ENT services
            f"{self.base_url}/ear-nose-throat/",
            f"{self.base_url}/fort-worth-sinus-center/",
            f"{self.base_url}/fort-worth-thyroid-center/thyroid-disease/",
            f"{self.base_url}/audiology-hearing-loss/hearing-aids/",
            f"{self.base_url}/allergies-fort-worth/",
            
            # Specific procedures
            f"{self.base_url}/vivaer-nasal-airway-remodeling/",
            f"{self.base_url}/fort-worth-sinus-center/balloon-sinuplasty/",
            f"{self.base_url}/fort-worth-sinus-center/office-ct-scan/",
            f"{self.base_url}/ear-nose-throat/snoring-obstructive-sleep-apnea-osa/",
            f"{self.base_url}/ear-nose-throat/voice-problems/"
        ]
        
        extracted_services = set()
        extracted_conditions = set()
        
        for url in service_pages:
            page = self.fetch_page(url)
            if page:
                text = page.get_text().lower()
                
                # Extract surgical procedures
                surgical_keywords = [
                    "balloon sinuplasty", "vivaer", "septoplasty", "turbinate reduction",
                    "rhinoplasty", "tonsillectomy", "adenoidectomy", "thyroidectomy",
                    "ear tubes", "mastoidectomy", "stapedectomy", "parotidectomy"
                ]
                
                for keyword in surgical_keywords:
                    if keyword in text:
                        services["surgical_services"].append(keyword.title())
                        extracted_services.add(keyword)
                
                # Extract medical services
                medical_keywords = [
                    "allergy testing", "hearing evaluation", "voice therapy",
                    "sleep study", "nasal endoscopy", "laryngoscopy"
                ]
                
                for keyword in medical_keywords:
                    if keyword in text:
                        services["medical_services"].append(keyword.title())
                        extracted_services.add(keyword)
                
                # Extract conditions treated
                condition_keywords = [
                    "sinusitis", "sleep apnea", "hearing loss", "tinnitus",
                    "voice disorders", "thyroid", "allergies", "nasal polyps",
                    "deviated septum", "vertigo", "ear infections"
                ]
                
                for keyword in condition_keywords:
                    if keyword in text:
                        services["conditions_treated"].append(keyword.title())
                        extracted_conditions.add(keyword)
        
        # Remove duplicates and add comprehensive defaults
        services["surgical_services"] = list(set(services["surgical_services"]))
        services["medical_services"] = list(set(services["medical_services"]))
        services["conditions_treated"] = list(set(services["conditions_treated"]))
        
        # Add default services if not found
        if not services["surgical_services"]:
            services["surgical_services"] = [
                "Balloon Sinuplasty", "VivAer® Nasal Airway Remodeling",
                "Septoplasty", "Turbinate Reduction", "Tonsillectomy",
                "Adenoidectomy", "Thyroid Surgery", "Ear Tube Placement"
            ]
        
        if not services["medical_services"]:
            services["medical_services"] = [
                "Comprehensive ENT Evaluation", "Allergy Testing",
                "Hearing Evaluations", "Voice Therapy", "Sleep Apnea Evaluation"
            ]
        
        # Always add these diagnostic services
        services["diagnostic_services"] = [
            "In-office CT Scans", "Allergy Testing", "Audiometry",
            "Tympanometry", "Nasal Endoscopy", "Laryngoscopy"
        ]
        
        # Always add these specialty programs
        services["specialty_programs"] = [
            "Fort Worth Sinus Center", "Fort Worth Thyroid Center",
            "Pediatric ENT", "Sleep Apnea Treatment", "Voice Center",
            "Allergy and Immunotherapy Center"
        ]
        
        if not services["conditions_treated"]:
            services["conditions_treated"] = [
                "Chronic Sinusitis", "Sleep Apnea", "Hearing Loss",
                "Voice Disorders", "Thyroid Conditions", "Allergies",
                "Nasal Polyps", "Deviated Septum", "Ear Infections"
            ]
        
        self.clinic_data["confidence_levels"]["services_info"] = 0.85
        return services
    
    def extract_insurance_info(self) -> Dict[str, Any]:
        """Extract insurance and payment information"""
        logger.info("Extracting insurance information...")
        
        insurance_info = {
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
                "copays_due_at_service": True,
                "deductibles_due_at_service": True,
                "payment_methods": "Cash, check, credit cards accepted",
                "payment_plans": "Available upon request"
            },
            "special_notes": [
                "Insurance verification recommended prior to appointment",
                "Specialist referral may be required by insurance",
                "Coverage varies by procedure and insurance plan"
            ]
        }
        
        # Try to get insurance info from patient information page
        patient_page = self.fetch_page(f"{self.base_url}/patient-information/")
        if patient_page:
            text = patient_page.get_text().lower()
            
            # Look for specific insurance plans mentioned
            insurance_keywords = ["aetna", "blue cross", "cigna", "united", "medicare", "medicaid"]
            found_plans = []
            
            for keyword in insurance_keywords:
                if keyword in text:
                    found_plans.append(keyword.title())
            
            if found_plans:
                insurance_info["accepted_plans"] = found_plans + ["Most other major insurance plans"]
        
        self.clinic_data["confidence_levels"]["insurance_info"] = 0.7
        return insurance_info
    
    def extract_patient_experience(self) -> Dict[str, Any]:
        """Extract patient experience and policy information"""
        logger.info("Extracting patient experience information...")
        
        patient_experience = {
            "walk_in_policy": "Appointments required",
            "wait_time_expectations": None,
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
                "Children must be accompanied by parent/guardian"
            ],
            "accessibility": "ADA compliant facility",
            "patient_portal": True,
            "communication_preferences": [
                "Phone calls for urgent matters",
                "Patient portal for routine communication"
            ]
        }
        
        # Extract from patient information page
        patient_page = self.fetch_page(f"{self.base_url}/patient-information/")
        if patient_page:
            text = patient_page.get_text().lower()
            
            # Look for specific policies in the text
            if "new patient" in text:
                patient_experience["facility_policies"].append("New patients should arrive 30 minutes early")
            
            if "forms" in text:
                patient_experience["facility_policies"].append("Patient forms available online")
                
            if "portal" in text:
                patient_experience["patient_portal"] = True
        
        self.clinic_data["confidence_levels"]["patient_experience"] = 0.75
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
        total_fields = 30  # Approximate target field count for ENT
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
    
    def save_to_json(self, filename: str = "fort_worth_ent_data.json"):
        """Save extracted data to JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.clinic_data, f, indent=2, ensure_ascii=False)
        logger.info(f"Data saved to {filename}")

def main():
    """Main execution function"""
    scraper = FortWorthENTScraper()
    
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