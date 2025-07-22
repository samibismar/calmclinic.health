"use client";

import { User, Users, ArrowRight, Star } from "lucide-react";

const mockProviders = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    title: "Cardiologist",
    specialties: ["Cardiology", "Internal Medicine"],
    bio: "Board-certified cardiologist with 15+ years of experience specializing in preventive care and heart disease management.",
    is_default: true,
    gender: "female"
  },
  {
    id: 2,
    name: "Dr. Michael Chen",
    title: "Family Medicine Physician", 
    specialties: ["Family Medicine", "Pediatrics", "Geriatrics"],
    bio: "Comprehensive family care physician focused on treating patients of all ages with a holistic approach to healthcare.",
    is_default: false,
    gender: "male"
  },
  {
    id: 3,
    name: "Dr. Emily Rodriguez",
    title: "Psychiatrist",
    specialties: ["Psychiatry", "Mental Health"],
    bio: "Mental health specialist dedicated to providing compassionate care for anxiety, depression, and other mental health conditions.",
    is_default: false,
    gender: "female"
  }
];

export default function ProviderDesignTestPage() {

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
          Provider Selection Design Options
        </h1>

        {/* Design Option 1: Card Grid */}
        <div className="mb-16">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Option 1: Card Grid Layout</h2>
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Provider</h3>
              <p className="text-gray-600">Select from our experienced healthcare professionals</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {mockProviders.map((provider) => (
                <div key={provider.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{provider.name}</h4>
                        <p className="text-sm text-gray-600">{provider.title}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {provider.specialties.map((specialty) => (
                        <span key={specialty} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                          {specialty}
                        </span>
                      ))}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{provider.bio}</p>
                    
                    <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                      Select Provider
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Design Option 2: List with Photos */}
        <div className="mb-16">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Option 2: Enhanced List with Visual Elements</h2>
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Meet Our Providers</h3>
              <p className="text-gray-600">Expert care tailored to your needs</p>
            </div>
            
            <div className="max-w-3xl mx-auto space-y-4">
              {mockProviders.map((provider) => (
                <div key={provider.id} className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      {provider.is_default && (
                        <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1">
                          <Star className="w-3 h-3 text-yellow-800" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-bold text-gray-900 text-lg">{provider.name}</h4>
                        {provider.is_default && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                            Recommended
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 font-medium mb-2">{provider.title}</p>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {provider.specialties.map((specialty) => (
                          <span key={specialty} className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-md border border-blue-200">
                            {specialty}
                          </span>
                        ))}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">{provider.bio}</p>
                      
                      <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium">
                        Choose {provider.name.split(' ')[1]}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Design Option 3: Minimal Modern */}
        <div className="mb-16">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Option 3: Clean Minimal Design</h2>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-light text-gray-900 mb-3">Select Provider</h3>
              <div className="w-12 h-0.5 bg-blue-500 mx-auto"></div>
            </div>
            
            <div className="max-w-2xl mx-auto space-y-1">
              {mockProviders.map((provider) => (
                <button
                  key={provider.id}
                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{provider.name}</h4>
                      <p className="text-sm text-gray-600">{provider.title}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        {provider.specialties.join(" • ")}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <button className="text-gray-500 text-sm hover:text-gray-700 transition-colors">
                I&apos;m not sure who to choose
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-gray-600">
          <p>This is a design test page - let me know which style you prefer!</p>
        </div>
      </div>
    </div>
  );
}