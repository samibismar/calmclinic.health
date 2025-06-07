

'use client';

import { useSearchParams } from 'next/navigation';
 
import ChatInterface from '../chat-interface';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const clinic = searchParams.get('c');
  if (!clinic) {
    return <div className="p-6 text-red-500 text-center">Missing clinic identifier.</div>;
  }
  return (
    <main className="min-h-screen bg-black text-white">
      <ChatInterface clinic={clinic} />
    </main>
  );
}