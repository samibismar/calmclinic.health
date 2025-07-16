"use client";

import { QRCodeCanvas } from "qrcode.react";
import { DEMO_CLINIC_CONFIG } from "./DemoClinicConfig";

interface DemoQRCardProps {
  size?: number;
  showInstructions?: boolean;
  printable?: boolean;
}

export default function DemoQRCard({ 
  size = 200, 
  showInstructions = true, 
  printable = false 
}: DemoQRCardProps) {
  const demoUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://calmclinic-health.vercel.app'}/demo/fort-worth-eye`;

  const downloadQRCode = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = "fort-worth-eye-qr-code.png";
    link.click();
  };

  const printCard = () => {
    // Open a new window with a printable version
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fort Worth Eye Associates - AI Assistant QR Code</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 40px;
              background: linear-gradient(135deg, #0ea5e9, #059669);
              color: white;
              text-align: center;
            }
            .card {
              background: white;
              color: #1f2937;
              max-width: 400px;
              margin: 0 auto;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 25px 50px rgba(0,0,0,0.2);
            }
            .header {
              margin-bottom: 30px;
            }
            .practice-name {
              font-size: 24px;
              font-weight: bold;
              color: #0ea5e9;
              margin-bottom: 8px;
            }
            .doctor-info {
              font-size: 16px;
              color: #059669;
              margin-bottom: 4px;
            }
            .specialty {
              font-size: 14px;
              color: #6b7280;
            }
            .qr-container {
              margin: 30px 0;
              padding: 20px;
              background: #f8fafc;
              border-radius: 15px;
              border: 2px solid #e2e8f0;
            }
            .instructions {
              margin-top: 30px;
              text-align: left;
              background: #f0f9ff;
              padding: 20px;
              border-radius: 12px;
              border-left: 4px solid #0ea5e9;
            }
            .instructions h3 {
              color: #0ea5e9;
              margin-top: 0;
              font-size: 18px;
            }
            .instructions ol {
              margin: 15px 0;
              padding-left: 20px;
            }
            .instructions li {
              margin-bottom: 8px;
              color: #374151;
            }
            .disclaimer {
              margin-top: 25px;
              font-size: 12px;
              color: #6b7280;
              text-align: center;
              font-style: italic;
            }
            @media print {
              body { background: white !important; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="practice-name">${DEMO_CLINIC_CONFIG.practice_name}</div>
              <div class="doctor-info">Dr. ${DEMO_CLINIC_CONFIG.doctor_name}</div>
              <div class="specialty">${DEMO_CLINIC_CONFIG.specialty}</div>
            </div>
            
            <div class="qr-container">
              <div id="qr-placeholder" style="display: flex; justify-content: center;">
                <!-- QR Code will be inserted here -->
              </div>
            </div>
            
            <div class="instructions">
              <h3>📱 How to Use Your AI Assistant</h3>
              <ol>
                <li>Open your phone's camera</li>
                <li>Point it at this QR code</li>
                <li>Tap the notification to open</li>
                <li>Start chatting with Dr. Ranelle's AI assistant!</li>
              </ol>
            </div>
            
            <div class="disclaimer">
              ${DEMO_CLINIC_CONFIG.disclaimer}
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for the document to load, then print
    setTimeout(() => {
      printWindow.print();
    }, 1000);
  };

  if (printable) {
    return (
      <div className="bg-white text-gray-900 max-w-md mx-auto p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-sky-600 mb-2">{DEMO_CLINIC_CONFIG.practice_name}</h2>
          <p className="text-lg text-emerald-600 font-semibold">Dr. {DEMO_CLINIC_CONFIG.doctor_name}</p>
          <p className="text-sm text-gray-600">{DEMO_CLINIC_CONFIG.specialty}</p>
        </div>
        
        <div className="flex justify-center mb-6 p-4 bg-gray-50 rounded-xl">
          <QRCodeCanvas
            value={demoUrl}
            size={size}
            bgColor="#ffffff"
            fgColor="#0ea5e9"
            level="M"
            includeMargin={true}
          />
        </div>
        
        {showInstructions && (
          <div className="bg-sky-50 p-4 rounded-lg border-l-4 border-sky-500">
            <h3 className="font-semibold text-sky-700 mb-3">📱 How to Use Your AI Assistant</h3>
            <ol className="text-sm text-gray-700 space-y-2">
              <li>1. Open your phone&apos;s camera</li>
              <li>2. Point it at this QR code</li>
              <li>3. Tap the notification to open</li>
              <li>4. Start chatting with Dr. Ranelle&apos;s AI assistant!</li>
            </ol>
          </div>
        )}
        
        <div className="mt-6 text-xs text-gray-500 text-center">
          {DEMO_CLINIC_CONFIG.disclaimer}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center text-white">
      <h3 className="text-lg font-semibold mb-4">Demo QR Code</h3>
      <p className="text-sm text-white/80 mb-4">{DEMO_CLINIC_CONFIG.practice_name}</p>
      
      <div className="flex justify-center mb-6 p-4 bg-white rounded-xl">
        <QRCodeCanvas
          value={demoUrl}
          size={size}
          bgColor="#ffffff"
          fgColor="#0ea5e9"
          level="M"
          includeMargin={true}
        />
      </div>
      
      <div className="space-y-2">
        <button
          onClick={downloadQRCode}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          Download QR Code
        </button>
        
        <button
          onClick={printCard}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          Print Demo Card
        </button>
      </div>
      
      <div className="mt-4 text-xs text-white/60">
        QR Code URL: /demo/fort-worth-eye
      </div>
    </div>
  );
}