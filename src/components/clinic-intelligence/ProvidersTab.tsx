"use client";

import { useState, useEffect } from "react";
import { Users, ArrowRight, User } from "lucide-react";
import Link from "next/link";

interface Provider {
  id: number;
  name: string;
  title: string;
  specialty: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  gender?: 'male' | 'female' | 'other' | 'not_specified';
}

export default function ProvidersTab() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/providers');
      const data = await response.json();
      if (response.ok) {
        setProviders(data.providers || []);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">Provider Management</h2>
          </div>
          <Link
            href="/dashboard/providers"
            className="flex items-center space-x-2 bg-white text-blue-900 font-semibold px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span>Manage Providers</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Provider Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Current Providers</h3>
            <span className="text-sm text-blue-200">
              {providers.length} provider{providers.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/5 border border-white/20 rounded-lg p-4">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-white/20 rounded w-1/3"></div>
                    <div className="h-3 bg-white/20 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-blue-300 mx-auto mb-3" />
              <h4 className="text-md font-medium text-white mb-2">No providers added yet</h4>
              <p className="text-blue-200 text-sm">
                Add your first provider to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {providers.slice(0, 4).map((provider) => (
                <div key={provider.id} className="bg-white/5 border border-white/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{provider.name}</h4>
                        <p className="text-sm text-blue-200">{provider.title}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-blue-300 capitalize">{provider.specialty}</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${provider.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-xs text-blue-200">
                          {provider.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {providers.length > 4 && (
                <div className="text-center py-2">
                  <p className="text-sm text-blue-300">
                    And {providers.length - 4} more provider{providers.length - 4 !== 1 ? 's' : ''}...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}