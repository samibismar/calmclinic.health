"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, User } from "lucide-react";
import Link from "next/link";

interface Provider {
  id: number;
  name: string;
  title: string;
  specialties: string[];
  bio?: string;
  experience?: string;
  languages?: string[];
  avatar_url?: string;
  is_active: boolean;
  is_default: boolean;
  display_order: number;
}

interface ProviderFormData {
  name: string;
  title: string;
  specialties: string[];
  bio: string;
  experience: string;
  languages: string[];
  avatar_url: string;
  is_default: boolean;
}

const specialtyOptions = [
  'General Practice', 'Family Medicine', 'Internal Medicine', 'Pediatrics', 
  'Cardiology', 'Dermatology', 'Gastroenterology', 'Neurology', 'Oncology',
  'Orthopedics', 'Psychiatry', 'Radiology', 'Surgery', 'Urology', 'Ophthalmology',
  'Otolaryngology', 'Obstetrics & Gynecology', 'Anesthesiology', 'Pathology',
  'Emergency Medicine', 'Endocrinology', 'Infectious Disease', 'Nephrology',
  'Pulmonology', 'Rheumatology', 'Allergy & Immunology'
];

const languageOptions = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese',
  'Japanese', 'Korean', 'Arabic', 'Hindi', 'Russian', 'Dutch', 'Swedish'
];

export default function EditProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [formData, setFormData] = useState<ProviderFormData>({
    name: '',
    title: '',
    specialties: [],
    bio: '',
    experience: '',
    languages: [],
    avatar_url: '',
    is_default: false
  });

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const resolvedParams = await params;
        const response = await fetch('/api/providers');
        const data = await response.json();
        
        if (response.ok) {
          const foundProvider = data.providers.find((p: Provider) => p.id === parseInt(resolvedParams.id));
          if (foundProvider) {
            setProvider(foundProvider);
            setFormData({
              name: foundProvider.name,
              title: foundProvider.title,
              specialties: foundProvider.specialties || [],
              bio: foundProvider.bio || '',
              experience: foundProvider.experience || '',
              languages: foundProvider.languages || [],
              avatar_url: foundProvider.avatar_url || '',
              is_default: foundProvider.is_default
            });
          } else {
            router.push('/dashboard/providers');
          }
        }
      } catch (error) {
        console.error('Error fetching provider:', error);
        router.push('/dashboard/providers');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProvider();
  }, [params, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.title || !provider) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: provider.id,
          ...formData
        })
      });

      if (response.ok) {
        router.push('/dashboard/providers');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating provider:', error);
      alert('Failed to update provider');
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialtyChange = (specialty: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, specialty]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        specialties: prev.specialties.filter(s => s !== specialty)
      }));
    }
  };

  const handleLanguageChange = (language: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, language]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        languages: prev.languages.filter(l => l !== language)
      }));
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded w-1/3 mb-8"></div>
            <div className="space-y-6">
              <div className="h-48 bg-white/20 rounded"></div>
              <div className="h-48 bg-white/20 rounded"></div>
              <div className="h-48 bg-white/20 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/providers"
            className="inline-flex items-center space-x-2 text-blue-200 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Providers</span>
          </Link>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Edit Provider</h1>
          </div>
          <p className="text-blue-100">Update {provider.name}&apos;s information</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Provider Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Dr. Sarah Johnson"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Professional Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Cardiologist"
                  required
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-blue-100 mb-2">
                Biography
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="Brief professional biography or description..."
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-blue-100 mb-2">
                Experience & Credentials
              </label>
              <input
                type="text"
                value={formData.experience}
                onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="15 years of experience in cardiology, Board certified"
              />
            </div>
          </div>

          {/* Specialties */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Medical Specialties</h2>
            <p className="text-blue-100 text-sm mb-4">Select all specialties that apply to this provider</p>
            
            <div className="bg-white/5 border border-white/20 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {specialtyOptions.map((specialty) => (
                  <label key={specialty} className="flex items-center space-x-2 text-sm text-blue-100 cursor-pointer hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.specialties.includes(specialty)}
                      onChange={(e) => handleSpecialtyChange(specialty, e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 bg-white/10 border-white/20"
                    />
                    <span>{specialty}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Languages */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Languages</h2>
            <p className="text-blue-100 text-sm mb-4">Select all languages this provider speaks</p>
            
            <div className="bg-white/5 border border-white/20 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {languageOptions.map((language) => (
                  <label key={language} className="flex items-center space-x-2 text-sm text-blue-100 cursor-pointer hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.languages.includes(language)}
                      onChange={(e) => handleLanguageChange(language, e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 bg-white/10 border-white/20"
                    />
                    <span>{language}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Provider Settings</h2>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                className="rounded text-blue-600 focus:ring-blue-500 bg-white/10 border-white/20"
              />
              <label htmlFor="is_default" className="text-sm text-blue-100">
                Set as default provider (patients will see this provider first)
              </label>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <Link
              href="/dashboard/providers"
              className="inline-flex items-center justify-center px-6 py-3 text-blue-200 hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center space-x-2 bg-white text-blue-900 font-semibold px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}