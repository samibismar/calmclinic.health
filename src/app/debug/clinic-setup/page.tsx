'use client';

import { useState, useEffect } from 'react';

interface Clinic {
  id: number;
  practice_name: string;
  website_url: string;
}

export default function ClinicSetupPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{[key: number]: string}>({});

  useEffect(() => {
    loadClinics();
  }, []);

  const loadClinics = async () => {
    try {
      const response = await fetch('/api/debug/clinics');
      if (response.ok) {
        const data = await response.json();
        setClinics(data);
      }
    } catch (error) {
      console.error('Failed to load clinics:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateWebsiteUrl = async (clinicId: number, url: string) => {
    if (!url.trim()) return;
    
    setStatus(prev => ({ ...prev, [clinicId]: 'Updating...' }));
    
    try {
      const response = await fetch('/api/debug/update-clinic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId, websiteUrl: url })
      });

      if (response.ok) {
        setStatus(prev => ({ ...prev, [clinicId]: 'Updated ✓' }));
        await loadClinics();
      } else {
        setStatus(prev => ({ ...prev, [clinicId]: 'Update failed' }));
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, [clinicId]: 'Error' }));
    }
  };

  const startCrawl = async (clinicId: number, websiteUrl: string) => {
    setStatus(prev => ({ ...prev, [clinicId]: 'Starting crawl...' }));
    
    try {
      const response = await fetch('/api/debug/clinic-crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId, websiteUrl, forceRecrawl: true })
      });

      const result = await response.json();
      
      if (response.ok) {
        setStatus(prev => ({ ...prev, [clinicId]: 'Crawl started ✓' }));
        
        // Check status after a few seconds
        setTimeout(() => checkCrawlStatus(clinicId), 3000);
      } else {
        setStatus(prev => ({ ...prev, [clinicId]: `Crawl failed: ${result.error || 'Unknown error'}` }));
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, [clinicId]: 'Crawl error' }));
    }
  };

  const checkCrawlStatus = async (clinicId: number) => {
    try {
      const response = await fetch(`/api/debug/clinic-crawl?clinicId=${clinicId}`);
      if (response.ok) {
        const result = await response.json();
        setStatus(prev => ({ 
          ...prev, 
          [clinicId]: `Found ${result.urlsDiscovered} URLs, ${result.cachedPages} cached pages` 
        }));
      }
    } catch (error) {
      console.error('Failed to check crawl status:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">RAG Test Setup</h1>
      
      <div className="space-y-4">
        {clinics.map(clinic => (
          <div key={clinic.id} className="border p-4 rounded">
            <div className="mb-2">
              <strong>{clinic.practice_name}</strong> (ID: {clinic.id})
            </div>
            
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                defaultValue={clinic.website_url || ''}
                placeholder="https://example.com"
                className="flex-1 p-2 border rounded"
                onBlur={(e) => {
                  if (e.target.value !== clinic.website_url) {
                    updateWebsiteUrl(clinic.id, e.target.value);
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector(`input[defaultValue="${clinic.website_url || ''}"]`) as HTMLInputElement;
                  if (input?.value) {
                    updateWebsiteUrl(clinic.id, input.value);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Update
              </button>
            </div>

            <div className="flex gap-2 items-center">
              <button
                onClick={() => clinic.website_url && startCrawl(clinic.id, clinic.website_url)}
                disabled={!clinic.website_url}
                className={`px-4 py-2 rounded ${
                  clinic.website_url 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-300 text-gray-500'
                }`}
              >
                Start Crawl
              </button>
              
              <button
                onClick={() => window.open(`/debug/hybrid-rag-test?clinic=${clinic.id}`, '_blank')}
                className="px-4 py-2 bg-purple-600 text-white rounded"
              >
                Test RAG
              </button>
              
              <button
                onClick={() => window.open(`/api/debug/check-urls?clinicId=${clinic.id}`, '_blank')}
                className="px-4 py-2 bg-orange-600 text-white rounded"
              >
                View URLs
              </button>
              
              <button
                onClick={() => window.open(`/api/debug/cached-content?clinicId=${clinic.id}`, '_blank')}
                className="px-4 py-2 bg-teal-600 text-white rounded"
              >
                View Cache
              </button>
              
              {status[clinic.id] && (
                <span className="text-sm text-gray-600">{status[clinic.id]}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}