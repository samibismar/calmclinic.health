import { Suspense } from "react";
import ChatInterfaceWrapper from './chat-interface-wrapper';

export const dynamic = 'force-dynamic';

interface ChatPageProps {
  searchParams: Promise<{ c?: string | string[] }>;
}

// Simple loading component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center backdrop-blur-sm bg-white/95">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl shadow-lg animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-300 rounded-lg animate-pulse"></div>
          </div>
          <p className="text-blue-600 text-sm font-medium">Loading assistant...</p>
        </div>
      </div>
    </div>
  );
}

export default async function Page({ searchParams }: ChatPageProps) {
  // Await the searchParams promise for Next.js 15 compatibility
  const params = await searchParams;
  
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ChatInterfaceWrapper backgroundStyle="calm-gradient" />
    </Suspense>
  );
}