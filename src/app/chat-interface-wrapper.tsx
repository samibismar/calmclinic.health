'use client';

import ChatInterface from './chat-interface';

export default function ChatInterfaceWrapper() {
  const clinic = "placeholder-clinic-slug";
  return (
    <>
      {clinic && <ChatInterface clinic={clinic} />}
    </>
  );
}