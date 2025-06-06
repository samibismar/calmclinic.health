import { Suspense } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import ChatInterfaceWrapper from './chat-interface-wrapper';

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

export default async function Home({ searchParams }: { searchParams: { [key: string]: string } }) {
  const supabase = await createSupabaseServerClient();

  const slug = searchParams?.c;
  if (!slug) {
    return <div className="p-4 text-center text-red-500">Missing clinic slug in URL (?c=your-clinic)</div>;
  }

  const { data: clinic, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!clinic || error) {
    notFound();
  }

  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatInterfaceWrapper clinic={clinic} />
    </Suspense>
  );
}