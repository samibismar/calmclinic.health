"use client";

import { useState } from "react";
import { User, Stethoscope, Clock, ArrowRight, Users } from "lucide-react";

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
}

interface ProviderSelectionProps {
  clinicName: string;
  providers: Provider[];
  onProviderSelect: (providerId: number | null) => void;
  onSkipSelection: () => void;
  isLoading?: boolean;
}

export default function ProviderSelection({
  clinicName,
  providers,
  onProviderSelect,
  onSkipSelection,
  isLoading = false
}: ProviderSelectionProps) {
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);

  const handleProviderClick = (providerId: number) => {
    setSelectedProvider(providerId);
    // Add small delay for visual feedback
    setTimeout(() => {
      onProviderSelect(providerId);
    }, 200);
  };

  const handleSkipClick = () => {
    setSelectedProvider(null);
    setTimeout(() => {
      onSkipSelection();
    }, 200);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Loading providers...</p>
          </div>
        </div>
      </div>
    );
  }

  // Single provider case - auto-select default provider
  if (providers.length === 1) {
    const provider = providers[0];
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">Welcome to {clinicName}</h1>
            <p className="text-gray-600 text-sm">You&apos;ll be chatting with:</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">{provider.name}</h3>
                <p className="text-xs text-gray-600">{provider.title}</p>
                {provider.specialties.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    {provider.specialties.join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleProviderClick(provider.id)}
            className="w-full bg-blue-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center space-x-2 text-sm"
          >
            <span>Start Chat</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Welcome to {clinicName}</h1>
          <p className="text-gray-600 text-sm">Which provider would you like to chat with today?</p>
        </div>

        <div className="space-y-3 mb-6">
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleProviderClick(provider.id)}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                selectedProvider === provider.id
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-800 text-sm truncate">{provider.name}</h3>
                    {provider.is_default && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 truncate">{provider.title}</p>
                  {provider.specialties.length > 0 && (
                    <p className="text-xs text-blue-600 mt-1 truncate">
                      {provider.specialties.join(", ")}
                    </p>
                  )}
                  {provider.bio && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {provider.bio}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>

        {/* Skip/General Options */}
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleSkipClick}
              className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
            >
              <Clock className="w-4 h-4" />
              <span className="text-sm">Any available provider</span>
            </button>
            <button
              onClick={handleSkipClick}
              className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
            >
              <Users className="w-4 h-4" />
              <span className="text-sm">I&apos;m not sure</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Your conversation will be personalized based on your provider selection
          </p>
        </div>
      </div>
    </div>
  );
}