'use client';

import ChatInterface from '@/components/ChatInterface';

export default function ChatInterfaceWrapper() {
  const clinic = "placeholder-clinic-slug";
  return (
    <>
      {clinic && <ChatInterface clinic={clinic} />}
    </>
  );
}