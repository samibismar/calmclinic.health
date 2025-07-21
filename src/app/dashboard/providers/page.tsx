"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Edit, Trash2, User, Settings } from "lucide-react";
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
  gender?: string; // Added gender to the interface
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded w-1/3 mb-8"></div>
            <div className="space-y-4">
              <div className="h-32 bg-white/20 rounded"></div>
              <div className="h-32 bg-white/20 rounded"></div>
              <div className="h-32 bg-white/20 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 text-blue-200 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Provider Management</h1>
              <p className="text-blue-100">Manage your clinic&apos;s providers and their specialties</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link
                href="/dashboard/providers/add"
                className="inline-flex items-center space-x-2 bg-white text-blue-900 font-semibold px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Provider</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Provider List */}
        <div className="space-y-4">
          {providers.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 text-center">
              <User className="w-12 h-12 text-blue-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No providers found</h3>
              <p className="text-blue-100 mb-6">Get started by adding your first provider</p>
              <Link
                href="/dashboard/providers/add"
                className="inline-flex items-center space-x-2 bg-white text-blue-900 font-semibold px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Provider</span>
              </Link>
            </div>
          ) : (
            providers.map((provider) => (
              <div key={provider.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-xl font-semibold text-white">{provider.name}</h3>
                        {provider.is_default && (
                          <span className="bg-blue-200 text-blue-900 text-xs px-2 py-1 rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-blue-100 mb-1">{provider.title}</p>
                      {provider.gender && provider.gender !== 'not_specified' && (
                        <span className="inline-block bg-blue-200 text-blue-900 text-xs px-2 py-1 rounded-full font-medium mb-1 mr-2">
                          {provider.gender.charAt(0).toUpperCase() + provider.gender.slice(1)}
                        </span>
                      )}
                      {provider.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {provider.specialties.map((specialty, index) => (
                            <span key={index} className="bg-blue-800/50 text-blue-200 text-xs px-2 py-1 rounded-full">
                              {specialty}
                            </span>
                          ))}
                        </div>
                      )}
                      {provider.bio && (
                        <p className="text-blue-200 text-sm max-w-2xl mb-2">
                          {provider.bio}
                        </p>
                      )}
                      {provider.experience && (
                        <p className="text-blue-200 text-sm">
                          <span className="font-medium">Experience:</span> {provider.experience}
                        </p>
                      )}
                      {provider.languages && provider.languages.length > 0 && (
                        <p className="text-blue-200 text-sm">
                          <span className="font-medium">Languages:</span> {provider.languages.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                    <Link
                      href={`/dashboard/providers/${provider.id}/edit`}
                      className="inline-flex items-center space-x-2 text-blue-300 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </Link>
                    <button
                      onClick={() => handleDeleteProvider(provider.id)}
                      className="inline-flex items-center space-x-2 text-red-400 hover:text-red-300 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
                      disabled={providers.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        {providers.length > 0 && (
          <div className="mt-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/dashboard/providers/add"
                className="inline-flex items-center space-x-2 text-blue-200 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Another Provider</span>
              </Link>
              <Link
                href="/dashboard/customize"
                className="inline-flex items-center space-x-2 text-blue-200 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span>Assistant Settings</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}