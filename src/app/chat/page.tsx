import { Suspense } from "react";
import ChatInterfaceWrapper from './chat-interface-wrapper';

export const dynamic = 'force-dynamic';

// Simple loading component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-purple-500 rounded-full shadow-lg animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 bg-white/20 rounded-full animate-pulse"></div>
          </div>
          <p className="text-white text-sm font-medium">Loading assistant...</p>
        </div>
      </div>
    </div>
  );
}

export default async function Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ChatInterfaceWrapper backgroundStyle="calm-gradient" />
    </Suspense>
  );
}