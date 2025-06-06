'use client';

import ChatInterface from './chat-interface';
import { type Clinic } from "@/lib/supabase";

export default function ChatInterfaceWrapper({ clinic }: { clinic: Clinic }) {
  return <ChatInterface clinic={clinic} />;
}