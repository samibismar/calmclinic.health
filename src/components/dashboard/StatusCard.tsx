

"use client";

import Link from "next/link";

interface StatusCardProps {
  clinic: {
    practice_name: string;
    doctor_name: string;
    specialty: string;
    has_completed_setup: boolean;
  };
}

export default function StatusCard({ clinic }: StatusCardProps) {
  const { practice_name, doctor_name, specialty, has_completed_setup } = clinic;

  if (!has_completed_setup) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">🚀 Let’s Launch Your Assistant</h2>
        <p className="text-blue-100 mb-3">
          Before your patients can start chatting, we need a few quick setup steps from you. This helps make sure your assistant sounds like your practice.
        </p>
        <ul className="text-sm text-blue-200 list-disc list-inside mb-4 space-y-2">
          <li>🗣️ Set your assistant’s tone and voice</li>
          <li>👨‍⚕️ Add your doctor’s name and specialty</li>
          <li>❓ Include common questions patients ask</li>
          <li>🌍 Choose your supported languages</li>
        </ul>
        <Link
          href="/dashboard/customize"
          className="inline-block mt-4 px-6 py-2 bg-white text-blue-900 font-semibold rounded-lg text-base shadow hover:bg-blue-100 transition"
        >
          Start Setup
        </Link>
      </div>
    );
  }

  // Placeholder for last updated, can be updated with real data later
  const lastUpdated = "—";

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">✅ Your Assistant Is Up and Running</h2>
      <ul className="text-sm text-blue-100 space-y-2 mb-4">
        <li><span className="font-semibold text-white">Practice:</span> {practice_name}</li>
        <li><span className="font-semibold text-white">Doctor:</span> Dr. {doctor_name}</li>
        <li><span className="font-semibold text-white">Specialty:</span> {specialty}</li>
        <li><span className="font-semibold text-white">Status:</span> Active and answering questions</li>
      </ul>
      <p className="text-sm text-blue-300 mb-2">Want to change something? You can update your assistant anytime.</p>
      {/* Optionally show last updated info in the future */}
      {/* <div className="text-xs text-blue-300 mb-2">Last customized: {lastUpdated}</div> */}
      <Link
        href="/dashboard/customize"
        className="inline-block mt-3 px-5 py-2 bg-white text-blue-900 font-semibold rounded-lg hover:bg-blue-100 transition"
      >
        Edit Assistant Settings
      </Link>
    </div>
  );
}