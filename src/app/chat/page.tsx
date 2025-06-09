import { Suspense } from "react";
import ChatInterfaceWrapper from './chat-interface-wrapper';
import { getClinicSettings } from "@/lib/supabase-server";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function Page(props: PageProps) {
  const { searchParams } = props;
  const slug = typeof searchParams?.c === 'string' ? searchParams.c : "";
  const settings = await getClinicSettings(slug);
  const backgroundStyle = settings?.background_style || "calm-gradient";
  const clinicName = typeof settings?.clinic_name === "string" ? settings.clinic_name : null;
  const logoUrl = typeof settings?.logo_url === "string" && settings.logo_url.startsWith("http") ? settings.logo_url : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--clinic-color,#8b5cf6)]">
      <div className="w-full max-w-md p-4">
        <Suspense fallback={<div className="text-white text-center p-6">Loading assistant...</div>}>
          {clinicName && (
            <div className="flex items-center justify-center gap-2 mb-4">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Clinic Logo"
                  className="h-8 w-8 object-contain rounded-md border border-gray-300"
                />
              )}
              <h2 className="text-white text-lg font-semibold">Welcome to {clinicName}</h2>
            </div>
          )}
          <ChatInterfaceWrapper backgroundStyle={backgroundStyle} />
        </Suspense>
      </div>
    </div>
  );
}