import { Suspense } from "react";
import ChatInterfaceWrapper from './chat-interface-wrapper';
import { getClinicSettings } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

export default async function Page() {
  const settings = await getClinicSettings();
  const backgroundStyle = settings?.background_style || "calm-gradient";
  const clinicName = settings?.clinic_name;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--clinic-color,#8b5cf6)]">
      <div className="w-full max-w-md p-4">
        {clinicName && (
          <h2 className="text-center text-white text-lg font-semibold mb-4">
            Welcome to {clinicName}
          </h2>
        )}
        <Suspense fallback={<div className="text-white text-center p-6">Loading assistant...</div>}>
          <ChatInterfaceWrapper backgroundStyle={backgroundStyle} />
        </Suspense>
      </div>
    </div>
  );
}