'use client';

import { useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import ProviderSelection from '@/components/ProviderSelection';
import { Suspense, useState, useEffect } from 'react';

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
  is_legacy?: boolean;
}

interface ClinicInfo {
  id: number;
  name: string;
  supports_multi_provider: boolean;
  default_provider_id: number | null;
}

export default function ChatInterfaceWrapper() {
  const searchParams = useSearchParams();
  const clinic = searchParams.get('c');
  const providerId = searchParams.get('p');
  
  const [providers, setProviders] = useState<Provider[]>([]);
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clinic) return;

    async function fetchProviders() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/providers/${clinic}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch providers: ${response.status}`);
        }

        const data = await response.json();
        setProviders(data.providers || []);
        setClinicInfo(data.clinic);

        // Handle provider selection logic
        if (providerId) {
          // Provider specified in URL
          const provider = data.providers.find((p: Provider) => p.id === parseInt(providerId));
          if (provider) {
            setSelectedProvider(provider.id);
          } else {
            setError("Provider not found");
          }
        } else if (data.providers.length === 1) {
          // Single provider - auto-select
          setSelectedProvider(data.providers[0].id);
        } else if (!data.clinic.supports_multi_provider) {
          // Legacy single-provider clinic
          const defaultProvider = data.providers.find((p: Provider) => p.is_default);
          if (defaultProvider) {
            setSelectedProvider(defaultProvider.id);
          }
        }
        // Multi-provider case: show provider selection
        
      } catch (err) {
        console.error('Error fetching providers:', err);
        setError('Failed to load clinic information');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProviders();
  }, [clinic, providerId]);

  if (!clinic) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center text-red-500">
          Missing clinic identifier in the URL.
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </main>
    );
  }

  // Show provider selection if we have multiple providers and no provider is selected
  if (!isLoading && !selectedProvider && providers.length > 1 && clinicInfo?.supports_multi_provider) {
    return (
      <ProviderSelection
        clinicName={clinicInfo.name || "Medical Practice"}
        providers={providers}
        onProviderSelect={(id) => setSelectedProvider(id)}
        onSkipSelection={() => setSelectedProvider(clinicInfo.default_provider_id || providers[0]?.id)}
        isLoading={isLoading}
      />
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-sky-400 to-emerald-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assistant...</p>
        </div>
      </main>
    );
  }

  // Show chat interface
  return (
    <Suspense fallback={<div className="bg-white min-h-screen flex items-center justify-center"><div className="text-gray-600">Loading assistant...</div></div>}>
      <ChatInterface 
        clinic={clinic} 
        providerId={selectedProvider}
        providerInfo={providers.find(p => p.id === selectedProvider)}
      />
    </Suspense>
  );
}