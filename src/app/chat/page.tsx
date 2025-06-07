

'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ChatInterface from '../chat-interface';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const clinic = searchParams.get('c');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!clinic) {
      setError('Missing clinic identifier.');
    }
  }, [clinic]);

  if (error) {
    return <div className="p-6 text-red-500 text-center">{error}</div>;
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <ChatInterface clinic={clinic} />
    </main>
  );
}