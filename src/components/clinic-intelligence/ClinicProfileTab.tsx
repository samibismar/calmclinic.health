"use client";

import { useState, useEffect } from "react";
import { 
  Building2, 
  Phone, 
  Clock,
  Save,
  Edit2,
  X
} from "lucide-react";

interface ClinicData {
  id: number;
  practice_name: string;
  doctor_name: string;
  slug: string;
  specialty: string;
  primary_color: string;
}

interface ClinicProfileTabProps {
  clinicData: ClinicData | null;
}

interface ContactInfo {
  id: number;
  contact_type: string;
  contact_value: string;
  contact_label: string;
  is_primary: boolean;
}

interface ClinicHours {
  id: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ClinicProfileTab({ clinicData }: ClinicProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Contact info state
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([]);
  const [clinicHours, setClinicHours] = useState<ClinicHours[]>([]);
  
  // Form data state
  const [formData, setFormData] = useState({
    practice_name: '',
    website: '',
    primary_color: '#5BBAD5',
    phone: '',
    email: '',
    address: '',
    hours: {} as {[key: number]: {open_time: string, close_time: string, is_closed: boolean}}
  });

  useEffect(() => {
    if (clinicData) {
      fetchAllData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicData]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch contact info and hours in parallel
      const [contactResponse, hoursResponse] = await Promise.all([
        fetch('/api/clinic-intelligence/contact-info'),
        fetch('/api/clinic-intelligence/clinic-hours')
      ]);

      const contactData = await contactResponse.json();
      const hoursData = await hoursResponse.json();

      setContactInfo(contactData.contacts || []);
      setClinicHours(hoursData.hours || []);

      // Initialize form data
      const phone = contactData.contacts?.find((c: ContactInfo) => c.contact_type === 'phone')?.contact_value || '';
      const email = contactData.contacts?.find((c: ContactInfo) => c.contact_type === 'email')?.contact_value || '';
      const address = contactData.contacts?.find((c: ContactInfo) => c.contact_type === 'address')?.contact_value || '';
      const website = contactData.contacts?.find((c: ContactInfo) => c.contact_type === 'website')?.contact_value || '';

      // Initialize hours data
      const hoursObj: {[key: number]: {open_time: string, close_time: string, is_closed: boolean}} = {};
      for (let i = 0; i < 7; i++) {
        const dayHours = hoursData.hours?.find((h: ClinicHours) => h.day_of_week === i);
        hoursObj[i] = {
          open_time: dayHours?.open_time || '09:00',
          close_time: dayHours?.close_time || '17:00',
          is_closed: dayHours?.is_closed || false
        };
      }

      setFormData({
        practice_name: clinicData?.practice_name || '',
        website: website,
        primary_color: clinicData?.primary_color || '#5BBAD5',
        phone: phone,
        email: email,
        address: address,
        hours: hoursObj
      });

    } catch (error) {
      console.error('Error fetching clinic data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save basic clinic info
      await fetch('/api/clinic-intelligence/clinic-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practice_name: formData.practice_name,
          website: formData.website,
          email: formData.email,
          primary_color: formData.primary_color
        })
      });

      // Save contact info
      const contactTypes = [
        { type: 'phone', value: formData.phone, label: 'Main Phone' },
        { type: 'email', value: formData.email, label: 'Email' },
        { type: 'address', value: formData.address, label: 'Address' },
        { type: 'website', value: formData.website, label: 'Website' }
      ];

      for (const contact of contactTypes) {
        if (contact.value) {
          const existingContact = contactInfo.find(c => c.contact_type === contact.type);
          if (existingContact) {
            await fetch('/api/clinic-intelligence/contact-info', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: existingContact.id,
                contact_type: contact.type,
                contact_value: contact.value,
                contact_label: contact.label
              })
            });
          } else {
            await fetch('/api/clinic-intelligence/contact-info', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contact_type: contact.type,
                contact_value: contact.value,
                contact_label: contact.label,
                is_primary: contact.type === 'phone'
              })
            });
          }
        }
      }

      // Save operating hours
      for (const [dayNum, hours] of Object.entries(formData.hours)) {
        const existingHours = clinicHours.find(h => h.day_of_week === parseInt(dayNum));
        
        if (existingHours) {
          await fetch('/api/clinic-intelligence/clinic-hours', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: existingHours.id,
              day_of_week: parseInt(dayNum),
              open_time: hours.is_closed ? null : hours.open_time,
              close_time: hours.is_closed ? null : hours.close_time,
              is_closed: hours.is_closed
            })
          });
        } else {
          await fetch('/api/clinic-intelligence/clinic-hours', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              day_of_week: parseInt(dayNum),
              open_time: hours.is_closed ? null : hours.open_time,
              close_time: hours.is_closed ? null : hours.close_time,
              is_closed: hours.is_closed
            })
          });
        }
      }

      setIsEditing(false);
      await fetchAllData(); // Refresh data
    } catch (error) {
      console.error('Error saving clinic profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchAllData(); // Reset form data
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/20 rounded w-1/3"></div>
            <div className="h-32 bg-white/20 rounded"></div>
            <div className="h-32 bg-white/20 rounded"></div>
            <div className="h-32 bg-white/20 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Edit Button */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Clinic Profile</h2>
              <p className="text-blue-200">Manage your clinic&apos;s basic information and settings</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-6 py-2 bg-white text-blue-900 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
          <Building2 className="w-5 h-5 mr-2 text-blue-400" />
          Basic Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">Practice Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.practice_name}
                onChange={(e) => setFormData(prev => ({ ...prev, practice_name: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter practice name"
              />
            ) : (
              <div className="bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white">
                {formData.practice_name || 'Not specified'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">Website</label>
            {isEditing ? (
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="https://yourwebsite.com"
              />
            ) : (
              <div className="bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white">
                {formData.website || 'Not specified'}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-blue-100 mb-2">Brand Color</label>
            {isEditing ? (
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="w-16 h-12 rounded-lg border border-white/20 bg-white/10 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="#5BBAD5"
                />
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <div 
                  className="w-16 h-12 rounded-lg border border-white/20" 
                  style={{ backgroundColor: formData.primary_color }}
                ></div>
                <div className="flex-1 bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white">
                  {formData.primary_color}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
          <Phone className="w-5 h-5 mr-2 text-blue-400" />
          Contact Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">Phone Number</label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="(555) 123-4567"
              />
            ) : (
              <div className="bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white">
                {formData.phone || 'Not specified'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">Email Address</label>
            {isEditing ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="contact@clinic.com"
              />
            ) : (
              <div className="bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white">
                {formData.email || 'Not specified'}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-blue-100 mb-2">Address</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="123 Main Street, City, State 12345"
              />
            ) : (
              <div className="bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white">
                {formData.address || 'Not specified'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Operating Hours */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-400" />
          Operating Hours
        </h3>
        
        <div className="space-y-4">
          {dayNames.map((day, index) => (
            <div key={day} className="flex items-center justify-between p-4 bg-white/5 border border-white/20 rounded-lg">
              <div className="text-white font-medium w-24">{day}</div>
              
              {isEditing ? (
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.hours[index]?.is_closed || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        hours: {
                          ...prev.hours,
                          [index]: {
                            ...prev.hours[index],
                            is_closed: e.target.checked
                          }
                        }
                      }))}
                      className="rounded border-white/20 bg-white/10 text-blue-400 focus:ring-blue-400"
                    />
                    <span className="text-sm text-blue-200">Closed</span>
                  </label>
                  
                  {!formData.hours[index]?.is_closed && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={formData.hours[index]?.open_time || '09:00'}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          hours: {
                            ...prev.hours,
                            [index]: {
                              ...prev.hours[index],
                              open_time: e.target.value
                            }
                          }
                        }))}
                        className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <span className="text-blue-200">to</span>
                      <input
                        type="time"
                        value={formData.hours[index]?.close_time || '17:00'}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          hours: {
                            ...prev.hours,
                            [index]: {
                              ...prev.hours[index],
                              close_time: e.target.value
                            }
                          }
                        }))}
                        className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-blue-200">
                  {formData.hours[index]?.is_closed ? 
                    'Closed' : 
                    `${formData.hours[index]?.open_time || '09:00'} - ${formData.hours[index]?.close_time || '17:00'}`
                  }
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}