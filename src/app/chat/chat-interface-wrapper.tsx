'use client';

import { useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import { Suspense } from 'react';

export default function ChatInterfaceWrapper() {
  const searchParams = useSearchParams();
  const clinic = searchParams.get('c');

  if (!clinic) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center text-red-500">
          Missing clinic identifier in the URL.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Suspense fallback={<div className="text-white text-center p-6">Loading assistant...</div>}>
        <ChatInterface clinic={clinic} />
      </Suspense>
    </main>
  );
}