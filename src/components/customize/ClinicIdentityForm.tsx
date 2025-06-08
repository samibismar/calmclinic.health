"use client";

import React from "react";

type Props = {
  clinicName: string;
  setClinicName: (val: string) => void;
  brandColor: string;
  setBrandColor: (val: string) => void;
  chatAvatarName: string;
  setChatAvatarName: (val: string) => void;
  setLogoFile: (file: File | null) => void;
  doctorName: string;
  setDoctorName: (val: string) => void;
  specialty: string;
  setSpecialty: (val: string) => void;
  officeInstructions: string;
  setOfficeInstructions: (val: string) => void;
};

const ClinicIdentityForm = ({
  clinicName,
  setClinicName,
  brandColor,
  setBrandColor,
  chatAvatarName,
  setChatAvatarName,
  setLogoFile,
  doctorName,
  setDoctorName,
  specialty,
  setSpecialty,
  officeInstructions,
  setOfficeInstructions,
}: Props) => {
  return (
    <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl shadow-xl border border-gray-700 p-8 space-y-8 text-white">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">🏥 Clinic Identity</h2>
        <p className="text-sm text-gray-200 mb-6">Personalize the assistant with your clinic's branding and details.</p>

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
            <label className="block text-sm font-medium text-gray-200 mb-1">Chat Avatar Name</label>
            <input
              type="text"
              value={chatAvatarName}
              onChange={(e) => setChatAvatarName(e.target.value)}
              className="w-full px-4 py-2 bg-[#0f172a] text-white border border-gray-600 rounded-md shadow-sm focus:ring-cyan-400 focus:border-cyan-500"
              placeholder="e.g., Sunny"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Clinic Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="w-full bg-[#0f172a] text-white border border-gray-600 rounded-md"
            />
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
