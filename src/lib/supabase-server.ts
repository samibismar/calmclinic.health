import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createRouteHandlerClient({
    cookies: () => cookieStore,
    isSingleton: true,
  });
}
