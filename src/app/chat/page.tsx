import { Suspense } from "react";
import ChatInterfaceWrapper from './chat-interface-wrapper';
import { getClinicSettings } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

export default async function Page() {
  const settings = await getClinicSettings();
  const backgroundStyle = settings?.background_style || "calm-gradient";
  const clinicName = settings?.clinic_name;
  const logoUrl = settings?.logo_url;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--clinic-color,#8b5cf6)]">
      <div className="w-full max-w-md p-4">
        {clinicName && (
          <div className="flex items-center justify-center gap-2 mb-4">
            {logoUrl && (
              <img src={logoUrl} alt="Clinic Logo" className="h-8 w-8 object-contain rounded-md border border-gray-300" />
            )}
            <h2 className="text-white text-lg font-semibold">Welcome to {clinicName}</h2>
          </div>
        )}
        <Suspense fallback={<div className="text-white text-center p-6">Loading assistant...</div>}>
          <ChatInterfaceWrapper backgroundStyle={backgroundStyle} />
        </Suspense>
      </div>
    </div>
  );
}