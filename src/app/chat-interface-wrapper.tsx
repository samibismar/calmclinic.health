'use client';

import ChatInterface from './chat-interface';

interface Clinic {
  id: number;
  slug: string;
  doctor_name: string;
  practice_name: string;
  email: string;
  specialty: string;
  primary_color: string;
}

export default function ChatInterfaceWrapper({ clinic }: { clinic: Clinic }) {
  return <ChatInterface clinic={clinic} />;
}