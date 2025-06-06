

'use client';

import ChatInterface from './chat-interface';

export default function ChatInterfaceWrapper({ clinic }: { clinic: any }) {
  return <ChatInterface clinic={clinic} />;
}