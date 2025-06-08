"use client";

import Image from 'next/image';

// no import needed unless hooks or types from React are used

type LivePreviewCardProps = {
  assistantName: string;
  welcomeMessage: string;
  doctorName: string;
  specialty: string;
  logoUrl?: string;
  brandColor?: string;
};

export default function LivePreviewCard({
  assistantName,
  welcomeMessage,
  doctorName,
  specialty,
  logoUrl,
  brandColor = "#5BBAD5",
}: LivePreviewCardProps) {
  return (
    <div className="max-w-md w-full mx-auto bg-white border border-gray-200 rounded-lg shadow-md p-6">
      <div className="flex items-center gap-4 mb-4">
        {logoUrl ? (
          <Image src={logoUrl} alt="Clinic Logo" width={48} height={48} className="w-12 h-12 rounded-full" />
        ) : (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: brandColor }}
          >
            {assistantName[0] || "A"}
          </div>
        )}
        <div>
          <div className="font-semibold text-gray-900">{assistantName || "Your Assistant"}</div>
          <div className="text-sm text-gray-500">Powered by CalmClinic</div>
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-2">
        <strong>{doctorName}</strong> – {specialty}
      </div>

      <div className="bg-gray-100 p-3 rounded-md text-gray-800 text-sm mb-4 italic">
        “{welcomeMessage || "Hi! I'm here to help while you wait."}”
      </div>

      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Example Interaction</div>
      <div className="space-y-2 text-sm">
        <div className="flex gap-2">
          <span className="font-semibold text-gray-700">Patient:</span>
          <span className="text-gray-600">How long is the wait today?</span>
        </div>
        <div className="flex gap-2">
          <span className="font-semibold text-gray-700">{assistantName || "Assistant"}:</span>
          <span className="text-gray-600">Dr. {doctorName} will see you shortly! Feel free to ask me anything in the meantime.</span>
        </div>
      </div>
    </div>
  );
}