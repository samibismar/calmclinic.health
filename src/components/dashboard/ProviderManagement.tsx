"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, User, Save, X } from "lucide-react";

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

export default function ProviderManagement() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
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
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/providers');
      const data = await response.json();
      
      if (response.ok) {
        setProviders(data.providers || []);
      } else {
        console.error('Failed to fetch providers:', data.error);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProvider = async () => {
    try {
      const response = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchProviders();
        setShowAddForm(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding provider:', error);
      alert('Failed to add provider');
    }
  };

  const handleUpdateProvider = async () => {
    if (!editingProvider) return;

    try {
      const response = await fetch('/api/providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProvider.id,
          ...formData
        })
      });

      if (response.ok) {
        await fetchProviders();
        setEditingProvider(null);
        resetForm();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating provider:', error);
      alert('Failed to update provider');
    }
  };

  const handleDeleteProvider = async (id: number) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;

    try {
      const response = await fetch(`/api/providers?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchProviders();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting provider:', error);
      alert('Failed to delete provider');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      specialties: [],
      bio: '',
      experience: '',
      languages: [],
      avatar_url: '',
      is_default: false
    });
  };

  const startEdit = (provider: Provider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      title: provider.title,
      specialties: provider.specialties || [],
      bio: provider.bio || '',
      experience: provider.experience || '',
      languages: provider.languages || [],
      avatar_url: provider.avatar_url || '',
      is_default: provider.is_default
    });
    setShowAddForm(true);
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Provider Management</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-white text-blue-900 font-semibold px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors hover:bg-blue-100"
        >
          <Plus className="w-4 h-4" />
          <span>Add Provider</span>
        </button>
      </div>

      {/* Provider List */}
      <div className="space-y-4 mb-6">
        {providers.map((provider) => (
          <div key={provider.id} className="border border-white/20 rounded-lg p-4 bg-white/5">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-white">{provider.name}</h3>
                    {provider.is_default && (
                      <span className="bg-blue-200 text-blue-900 text-xs px-2 py-1 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-blue-100">{provider.title}</p>
                  {provider.specialties.length > 0 && (
                    <p className="text-xs text-blue-300 mt-1">
                      {provider.specialties.join(', ')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => startEdit(provider)}
                  className="text-blue-300 hover:text-white p-1"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteProvider(provider.id)}
                  className="text-red-400 hover:text-white p-1"
                  disabled={providers.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingProvider ? 'Edit Provider' : 'Add New Provider'}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingProvider(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Dr. John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Cardiologist"
                  />
                </div>
              </div>

              {/* Specialties */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialties
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {specialtyOptions.map((specialty) => (
                    <label key={specialty} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.specialties.includes(specialty)}
                        onChange={(e) => handleSpecialtyChange(specialty, e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{specialty}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Languages
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {languageOptions.map((language) => (
                    <label key={language} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.languages.includes(language)}
                        onChange={(e) => handleLanguageChange(language, e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{language}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biography
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the provider..."
                />
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience
                </label>
                <input
                  type="text"
                  value={formData.experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10 years of experience in cardiology"
                />
              </div>

              {/* Default Provider */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_default" className="text-sm text-gray-700">
                  Set as default provider
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingProvider(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingProvider ? handleUpdateProvider : handleAddProvider}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{editingProvider ? 'Update' : 'Add'} Provider</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}