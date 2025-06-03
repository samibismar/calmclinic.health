import { Suspense } from 'react';
import ChatInterface from './chat-interface';

// Loading component for Suspense
function ChatLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-64 mx-auto animate-pulse"></div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatInterface />
    </Suspense>
  );
}