'use client';

import { useSearchParams } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import { Suspense } from 'react';
import clsx from "clsx";

export default function ChatInterfaceWrapper({ backgroundStyle }: { backgroundStyle: string }) {
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
    <main
      className={clsx(
        "min-h-screen text-white flex items-center justify-center",
        backgroundStyle === "calm-gradient" && "bg-gradient-to-br from-[#0f172a] to-[#1e293b]",
        backgroundStyle === "light" && "bg-white text-black",
        backgroundStyle === "dark" && "bg-[#111827]"
      )}
    >
      <div className="w-full max-w-md p-4">
        <Suspense fallback={<div className="text-white text-center p-6">Loading assistant...</div>}>
          <ChatInterface clinic={clinic} />
        </Suspense>
      </div>
    </main>
  );
}