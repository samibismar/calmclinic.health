"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type Props = {
  session: Session | null;
  clinicName: string;
  setClinicName: (val: string) => void;
  brandColor: string;
  setBrandColor: (val: string) => void;
  doctorName: string;
  setDoctorName: (val: string) => void;
  specialty: string;
  setSpecialty: (val: string) => void;
  officeInstructions: string;
  setOfficeInstructions: (val: string) => void;
  logoUrl: string;
  setLogoUrl: (val: string) => void;
};

const ClinicIdentityForm = ({
  session: propSession,
  clinicName,
  setClinicName,
  brandColor,
  setBrandColor,
  doctorName,
  setDoctorName,
  specialty,
  setSpecialty,
  officeInstructions,
  setOfficeInstructions,
  logoUrl,
  setLogoUrl,
}: Props) => {
  const supabase = createClientComponentClient();

  // Maps frontend field names to Supabase column names
  const fieldMapping: Record<string, string> = {
    clinicName: 'clinic_name',
    brandColor: 'brand_color',
    doctorName: 'doctor_name',
    specialty: 'specialty',
    officeInstructions: 'office_instructions',
    logoUrl: 'logo_url',
  };
  const [currentSession, setCurrentSession] = useState<Session | null>(propSession);

  useEffect(() => {
    // Initialize session
    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Initialized session:", session);
      setCurrentSession(session);
    };

    initializeSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", session);
      setCurrentSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl shadow-xl border border-gray-700 p-8 space-y-8 text-white">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">🏥 Clinic Identity</h2>
        <p className="text-sm text-gray-200 mb-6">Personalize the assistant with your clinic&apos;s branding and details.</p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Clinic Name</label>
            <input
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="w-full px-4 py-2 bg-[#0f172a] text-white border border-gray-600 rounded-md shadow-sm focus:ring-cyan-400 focus:border-cyan-500"
              placeholder="e.g., Sunrise Health Center"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Brand Color</label>
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="w-20 h-10 rounded-md border border-gray-600 bg-[#0f172a]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Clinic Logo URL</label>
            <p className="text-sm text-gray-400 mb-2">
              Paste a public link to your logo image. We recommend uploading your image to <a href="https://postimages.org" target="_blank" rel="noopener noreferrer" className="underline text-cyan-300">postimages.org</a> and copying the <strong>Direct Link</strong> after upload.
            </p>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full px-4 py-2 bg-[#0f172a] text-white border border-gray-600 rounded-md shadow-sm focus:ring-cyan-400 focus:border-cyan-500"
              placeholder="e.g., https://i.imgur.com/your-logo.png"
            />
            {logoUrl && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-1">Preview:</p>
                <img src={logoUrl} alt="Clinic Logo" width={80} height={80} className="h-20 object-contain rounded-md border border-gray-600" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Doctor Name</label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              className="w-full px-4 py-2 bg-[#0f172a] text-white border border-gray-600 rounded-md shadow-sm focus:ring-cyan-400 focus:border-cyan-500"
              placeholder="e.g., Dr. Elena Ramirez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Specialty</label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full px-4 py-2 bg-[#0f172a] text-white border border-gray-600 rounded-md shadow-sm focus:ring-cyan-400 focus:border-cyan-500"
              placeholder="e.g., Pediatrics"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Office Instructions <span className="text-gray-400">(shown to patient when they arrive)</span>
            </label>
            <textarea
              value={officeInstructions || ""}
              onChange={(e) => setOfficeInstructions(e.target.value)}
              className="w-full px-4 py-2 bg-[#0f172a] text-white border border-gray-600 rounded-md shadow-sm focus:ring-cyan-400 focus:border-cyan-500"
              placeholder="e.g., Please turn off your phone and have your ID ready."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicIdentityForm;
