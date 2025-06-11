"use client";

import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";

export default function QRCodeCard() {
  const [chatUrl, setChatUrl] = useState("/chat");

  useEffect(() => {
    const slug = localStorage.getItem("clinic_slug");
    const url = slug
      ? `${window.location.origin}/chat?c=${slug}`
      : `${window.location.origin}/chat`;
    setChatUrl(url);
  }, []);

  const downloadQRCode = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = "calmclinic-qr-code.png";
    link.click();
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
      <button
        onClick={downloadQRCode}
        className="mt-2 px-4 py-2 bg-white text-blue-900 font-semibold rounded hover:bg-blue-100 transition text-sm"
      >
        Download QR Code
      </button>
    </div>
  );
}
