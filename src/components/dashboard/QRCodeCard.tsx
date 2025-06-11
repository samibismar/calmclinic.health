"use client";

import { QRCodeCanvas } from "qrcode.react";

interface QRCodeCardProps {
  slug: string;
  clinic?: {
    doctor_name?: string;
    specialty?: string;
    logo_url?: string;
    primary_color?: string;
  };
}

export default function QRCodeCard({ slug, clinic }: QRCodeCardProps) {
  const chatUrl = `https://calmclinic-health.vercel.app/chat?c=${slug}`;

  const downloadQRCode = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = "calmclinic-qr-code.png";
    link.click();
  };

  const openPrintablePage = () => {
    // Build URL parameters for the print page
    const params = new URLSearchParams({
      doctor: clinic?.doctor_name ? `Dr. ${clinic.doctor_name}` : 'Dr. Sam',
      specialty: clinic?.specialty || 'General Practice', 
      url: chatUrl,
    });
    
    // Add optional parameters only if they exist
    if (clinic?.logo_url) {
      params.append('logo', clinic.logo_url);
    }
    if (clinic?.primary_color) {
      params.append('color', clinic.primary_color);
    }
    
    // Open the print page in a new window
    const printUrl = `/dashboard/print?${params.toString()}`;
    window.open(printUrl, '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
      <h2 className="text-md font-semibold text-white mb-3">📎 QR Code</h2>
      <div className="bg-white p-3 inline-block rounded">
        <QRCodeCanvas
          value={chatUrl}
          size={120}
          bgColor="#ffffff"
          fgColor="#000000"
          level="H"
          includeMargin={true}
        />
      </div>
      <p className="text-blue-100 text-xs mt-2 max-w-xs mx-auto">
        Print and display this QR code at your front desk or in the waiting room. When scanned, patients are instantly directed to your AI assistant for help with common questions while they wait.
      </p>
      
      {/* Updated buttons with print option */}
      <div className="flex gap-2 mt-3 justify-center">
        <button
          onClick={openPrintablePage}
          className="px-4 py-2 bg-white text-blue-900 font-semibold rounded hover:bg-blue-100 transition text-sm flex items-center gap-1"
        >
          🖨️ Print QR Code
        </button>
        <button
          onClick={downloadQRCode}
          className="px-3 py-2 bg-white/20 text-white font-semibold rounded hover:bg-white/30 transition text-sm flex items-center gap-1"
        >
          📥 Download
        </button>
      </div>
    </div>
  );
}