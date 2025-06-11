// app/dashboard/print/page.tsx
"use client";

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PrintPage() {
  const searchParams = useSearchParams();
  const qrCodeRef = useRef<HTMLDivElement>(null);

  // Get parameters from URL
  const doctorName = searchParams.get('doctor') || 'Dr. Sam';
  const specialty = searchParams.get('specialty') || 'General Practice';
  const chatUrl = searchParams.get('url') || `${window.location.origin}/chat?c=default`;
  const primaryColor = searchParams.get('color') || '#007bff';

  useEffect(() => {
    // Dynamically import QRCode library and generate QR code
    const loadQRCode = async () => {
      const QRCode = (await import('qrcode')).default;
      
      if (qrCodeRef.current) {
        try {
          const canvas = document.createElement('canvas');
          await QRCode.toCanvas(canvas, chatUrl, {
            width: 400,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M',
            margin: 2
          });
          
          // Clear the container and add the canvas
          qrCodeRef.current.innerHTML = '';
          qrCodeRef.current.appendChild(canvas);
          canvas.style.width = '400px';
          canvas.style.height = '400px';
          canvas.style.display = 'block';
        } catch (error) {
          console.error('QR Code generation failed:', error);
          if (qrCodeRef.current) {
            qrCodeRef.current.innerHTML = '<div style="background: #f0f0f0; width: 400px; height: 400px; display: flex; align-items: center; justify-content: center; color: #666; border-radius: 8px;">QR Code Generation Failed</div>';
          }
        }
      }
    };

    loadQRCode();
  }, [chatUrl]);

  const printStyles = `
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      
      <div style={{
        fontFamily: 'Arial, sans-serif',
        maxWidth: '8.5in',
        margin: '0 auto',
        padding: '20px',
        background: 'white',
        color: 'black',
        minHeight: '100vh'
      }}>
        
        {/* Print and Close buttons (hidden when printing) */}
        <div className="no-print" style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={() => window.print()}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            🖨️ Print QR Code
          </button>
          <button
            onClick={() => window.close()}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Header with doctor info */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
            {doctorName}
          </div>
          <div style={{ fontSize: '20px', color: '#666', marginBottom: '20px' }}>
            {specialty}
          </div>
        </div>

        {/* Main QR Code Section */}
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <div style={{ fontSize: '26px', fontWeight: 'bold', margin: '0 0 15px 0', color: '#333' }}>
            Scan this QR code to chat with our AI assistant
          </div>
          <div style={{ fontSize: '18px', color: '#666', marginBottom: '30px', lineHeight: 1.4 }}>
            Get help with your questions while you wait for your appointment
          </div>
          
          <div style={{
            background: 'white',
            border: '3px solid #000',
            borderRadius: '15px',
            padding: '25px',
            margin: '0 auto 30px auto',
            display: 'inline-block',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
          }}>
            <div 
              ref={qrCodeRef} 
              style={{ 
                width: '400px', 
                height: '400px', 
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8f9fa',
                borderRadius: '8px',
                color: '#666'
              }}
            >
              Generating QR Code...
            </div>
          </div>
          
          <div style={{
            background: '#f8f9fa',
            border: '2px dashed #ddd',
            padding: '20px',
            margin: '30px auto',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '16px',
            wordBreak: 'break-all',
            maxWidth: '500px'
          }}>
            <strong>Direct Link:</strong><br />
            {chatUrl}
          </div>
        </div>

        {/* Features section */}
        <div style={{
          textAlign: 'left',
          maxWidth: '500px',
          margin: '30px auto',
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '10px',
          borderLeft: `4px solid ${primaryColor}`
        }}>
          <h3 style={{ marginTop: 0, color: primaryColor }}>
            🤖 What can the AI assistant help with?
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px', lineHeight: 1.4 }}>
              Answer questions about common symptoms and conditions
            </li>
            <li style={{ marginBottom: '8px', lineHeight: 1.4 }}>
              Help you prepare questions for your doctor visit
            </li>
            <li style={{ marginBottom: '8px', lineHeight: 1.4 }}>
              Provide general health education and wellness tips
            </li>
            <li style={{ marginBottom: '8px', lineHeight: 1.4 }}>
              Offer comfort and reassurance while you wait
            </li>
            <li style={{ marginBottom: '8px', lineHeight: 1.4 }}>
              Available in English and Spanish
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '2px solid #eee',
          textAlign: 'center',
          fontSize: '12px',
          color: '#888'
        }}>
          <p><strong>Note:</strong> This AI assistant is for educational purposes only and does not replace professional medical advice.</p>
          <p>Generated on {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </>
  );
}