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
  gender?: 'male' | 'female' | 'other' | 'not_specified';
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
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="w-18 h-18 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Stethoscope className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Welcome to {clinicName}</h1>
            <p className="text-gray-600 text-base leading-relaxed">You&apos;ll be chatting with our provider:</p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 mb-8 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                <User className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg mb-1">{provider.name}</h3>
                <p className="text-sm font-medium text-gray-700 mb-2">{provider.title}</p>
                {provider.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {provider.specialties.slice(0, 3).map((specialty, idx) => (
                      <span key={idx} className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-md font-medium">
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}
                {provider.bio && (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {provider.bio}
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleProviderClick(provider.id)}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-8 rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center space-x-3 text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <span>Start Your Consultation</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Welcome to {clinicName}</h1>
          <p className="text-gray-600 text-base leading-relaxed max-w-md mx-auto">
            Choose your preferred provider to begin your personalized consultation
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleProviderClick(provider.id)}
              className={`group w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5 ${
                selectedProvider === provider.id
                  ? "border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg scale-[1.02]"
                  : "border-gray-200 hover:border-blue-300 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  selectedProvider === provider.id
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg"
                    : "bg-gradient-to-br from-blue-400 to-blue-500 group-hover:shadow-md"
                }`}>
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{provider.name}</h3>
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-2">{provider.title}</p>
                  {provider.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {provider.specialties.slice(0, 3).map((specialty, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-md font-medium">
                          {specialty}
                        </span>
                      ))}
                      {provider.specialties.length > 3 && (
                        <span className="text-xs text-gray-500 px-1">+{provider.specialties.length - 3} more</span>
                      )}
                    </div>
                  )}
                  {provider.bio && (
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                      {provider.bio}
                    </p>
                  )}
                </div>
                <ArrowRight className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${
                  selectedProvider === provider.id
                    ? "text-blue-500 transform translate-x-1"
                    : "text-gray-400 group-hover:text-blue-400 group-hover:transform group-hover:translate-x-1"
                }`} />
              </div>
            </button>
          ))}
        </div>

        {/* Skip/General Options */}
        <div className="border-t border-gray-200 pt-6">
          <p className="text-center text-sm font-medium text-gray-700 mb-4">Or choose a general option:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleSkipClick}
              className="group flex items-center justify-center space-x-3 py-3 px-4 rounded-xl border-2 border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Clock className="w-5 h-5 group-hover:text-blue-600" />
              <span className="text-sm font-medium">Any available provider</span>
            </button>
            <button
              onClick={handleSkipClick}
              className="group flex items-center justify-center space-x-3 py-3 px-4 rounded-xl border-2 border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Users className="w-5 h-5 group-hover:text-blue-600" />
              <span className="text-sm font-medium">I&apos;m not sure</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="font-medium">Your conversation will be personalized for your chosen provider</p>
          </div>
        </div>
      </div>
    </div>
  );
}