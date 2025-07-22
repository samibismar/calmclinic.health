"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, User, Settings } from "lucide-react";
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
  gender?: 'male' | 'female' | 'other' | 'not_specified';
}


export default function ProviderManagement() {
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



  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-white">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-white/20 rounded w-full"></div>
            <div className="h-4 bg-white/20 rounded w-3/4"></div>
            <div className="h-4 bg-white/20 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Provider Management</h2>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/providers"
            className="text-blue-200 hover:text-white font-semibold px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors bg-white/10 hover:bg-white/20"
          >
            <Settings className="w-4 h-4" />
            <span>Manage Providers</span>
          </Link>
          <Link
            href="/dashboard/providers/add"
            className="bg-white text-blue-900 font-semibold px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors hover:bg-blue-100"
          >
            <Plus className="w-4 h-4" />
            <span>Add Provider</span>
          </Link>
        </div>
      </div>

      {/* Provider List */}
      <div className="space-y-4 mb-6">
        {providers.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-blue-300 mx-auto mb-3" />
            <p className="text-blue-100 mb-4">No providers added yet</p>
            <Link
              href="/dashboard/providers/add"
              className="bg-white text-blue-900 font-semibold px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Add Your First Provider
            </Link>
          </div>
        ) : (
          providers.slice(0, 3).map((provider) => (
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
                    {provider.gender && provider.gender !== 'not_specified' && (
                      <p className="text-xs text-blue-200 capitalize">{provider.gender}</p>
                    )}
                    {provider.specialties.length > 0 && (
                      <p className="text-xs text-blue-300 mt-1">
                        {provider.specialties.slice(0, 2).join(', ')}
                        {provider.specialties.length > 2 && '...'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Link
                    href={`/dashboard/providers/${provider.id}/edit`}
                    className="text-blue-300 hover:text-white p-1"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
        
        {providers.length > 3 && (
          <div className="text-center py-3">
            <Link
              href="/dashboard/providers"
              className="text-blue-200 hover:text-white text-sm underline"
            >
              View all {providers.length} providers
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}