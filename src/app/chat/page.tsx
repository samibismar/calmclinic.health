"use client";
import { Suspense } from "react";
import ChatInterfaceWrapper from './chat-interface-wrapper';

export default function Page() {
  return (
    <Suspense fallback={<div className="text-white text-center p-6">Loading assistant...</div>}>
      <ChatInterfaceWrapper />
    </Suspense>
  );
}