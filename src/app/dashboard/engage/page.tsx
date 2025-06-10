"use client";

import { useRef, useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";
import type { Clinic } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// Mark this page as dynamic
export const dynamic = 'force-dynamic';

interface CustomSession extends Session {
  clinics?: Clinic[];
}

export default function EngagementToolkitPage() {
  const router = useRouter();
  const qrRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const { data: session, status } = useSession() as { data: CustomSession | null; status: string };
  const [chatUrl, setChatUrl] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (session?.clinics?.[0]?.slug) {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      setChatUrl(`${baseUrl}/chat?c=${session.clinics[0].slug}`);
    }
  }, [session, status, router]);

  const copyLink = () => {
    navigator.clipboard.writeText(chatUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQRCode = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = "calmclinic-qr-code.png";
    link.click();
  };

  if (status === "loading" || !chatUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-blue-200">Please wait while we prepare your engagement tools.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 text-white p-8 space-y-12">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-2">Engagement Toolkit</h1>
        <p className="text-blue-200 text-lg">
          Practical tools to help more patients use your CalmClinic assistant
        </p>
        <div className="mt-6">
          <a
            href="/dashboard"
            className="inline-block px-5 py-2 bg-white text-blue-900 font-semibold rounded-lg hover:bg-blue-100 transition"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 max-w-3xl mx-auto text-center space-y-4">
        <h2 className="text-xl font-semibold text-white">📎 QR Code</h2>
        <div className="bg-white p-4 inline-block rounded-xl">
          <QRCodeCanvas
            value={chatUrl}
            size={200}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
            includeMargin={true}
            ref={qrRef}
          />
        </div>
        <p className="text-blue-100 text-sm">Patients can scan this in your office to open the assistant instantly.</p>
        <button
          onClick={downloadQRCode}
          className="mt-2 px-4 py-2 bg-white text-blue-900 font-semibold rounded-lg hover:bg-blue-100 transition"
        >
          Download QR Code
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 max-w-3xl mx-auto space-y-4">
        <h2 className="text-xl font-semibold text-white">📱 Appointment Reminder Template</h2>
        <p className="text-blue-100 text-sm">Copy and paste this into your reminder messages:</p>
        <div className="bg-white/10 p-4 rounded text-sm text-blue-100 border border-white/20">
          <code>
            {"Hi! You can chat with our assistant before your visit here: " + chatUrl}
          </code>
        </div>
        <button
          onClick={copyLink}
          className="px-4 py-2 bg-white text-blue-900 font-semibold rounded-lg hover:bg-blue-100 transition"
        >
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 max-w-3xl mx-auto space-y-3">
        <h2 className="text-xl font-semibold text-white">🌐 Embed on Your Website</h2>
        <p className="text-blue-100 text-sm">Ask your web developer to embed this iframe where patients can see it:</p>
        <div className="bg-white/10 p-4 rounded text-sm text-blue-100 border border-white/20 overflow-x-auto">
          <code>
            {"<iframe src=\"" + chatUrl + "\" width=\"100%\" height=\"600\" style=\"border:none;\"></iframe>"}
          </code>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 max-w-3xl mx-auto space-y-3">
        <h2 className="text-xl font-semibold text-white">🌍 Languages</h2>
        <p className="text-blue-100 text-sm">
          Your assistant currently supports English. You can add more languages like Spanish, Vietnamese, or Arabic from the customization screen.
        </p>
      </div>
    </div>
  );
}