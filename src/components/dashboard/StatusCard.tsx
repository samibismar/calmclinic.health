

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
        <h2 className="text-xl font-bold text-white mb-3">Get Started with CalmClinic</h2>
        <p className="text-blue-100 mb-4">
          Personalize your assistant so patients know it’s really you. Complete setup to launch your AI assistant.
        </p>
        <ul className="text-sm text-blue-200 list-disc list-inside mb-4 space-y-1">
          <li>Set your tone of voice</li>
          <li>Add doctor name and specialty</li>
          <li>Add common patient questions</li>
          <li>Choose your languages</li>
        </ul>
        <Link
          href="/dashboard/customize"
          className="inline-block mt-2 px-5 py-2 bg-white text-blue-900 font-semibold rounded-lg hover:bg-blue-100 transition"
        >
          Continue Setup
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-3">Your Assistant Is Live</h2>
      <ul className="text-sm text-blue-100 space-y-2">
        <li><span className="font-semibold text-white">Practice:</span> {practice_name}</li>
        <li><span className="font-semibold text-white">Doctor:</span> Dr. {doctor_name}</li>
        <li><span className="font-semibold text-white">Specialty:</span> {specialty}</li>
        <li><span className="font-semibold text-white">Status:</span> ✅ Active</li>
        <li><span className="font-semibold text-white">Last customized:</span> 3 days ago</li>
      </ul>
      <Link
        href="/dashboard/customize"
        className="inline-block mt-4 px-5 py-2 bg-white text-blue-900 font-semibold rounded-lg hover:bg-blue-100 transition"
      >
        Edit Assistant Settings
      </Link>
    </div>
  );
}