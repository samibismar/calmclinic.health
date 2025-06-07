'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
 
import ChatInterface from '../chat-interface';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const clinic = searchParams.get('c');
  if (!clinic) {
    return <div className="p-6 text-red-500 text-center">Missing clinic identifier.</div>;
  }
  return (
    <main className="min-h-screen bg-black text-white">
      <Suspense fallback={<div className="text-white text-center p-6">Loading...</div>}>
        <ChatInterface clinic={clinic} />
      </Suspense>
    </main>
  );
}