import { Suspense } from "react";
import DemoChatInterface from './demo-chat-interface';

export const dynamic = 'force-dynamic';

// Loading component with Fort Worth Eye Associates branding
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#0ea5e9] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-[#101820] rounded-3xl shadow-2xl p-8 text-center backdrop-blur-sm bg-opacity-95">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#e0f7fa] to-[#bbf7d0] rounded-2xl shadow-lg animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 bg-[#0ea5e9] rounded-lg animate-pulse"></div>
          </div>
          <h2 className="text-lg font-semibold text-[#0ea5e9] mb-2">Fort Worth Eye Associates</h2>
          <p className="text-[#0ea5e9] text-sm font-medium">Loading your vision assistant...</p>
        </div>
      </div>
    </div>
  );
}

export default async function DemoPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DemoChatInterface />
    </Suspense>
  );
}