import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

async function getClinicFromSession() {
  const cookieStore = await cookies();
  const authUserId = cookieStore.get('auth_user_id')?.value;
  
  if (!authUserId) return null;

  const { data: clinic } = await supabase
    .from('clinics')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();

  return clinic;
}

export async function GET() {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    // Fetch prompt history with clean schema
    const { data: history, error: historyError } = await supabase
      .from('ai_prompt_history')
      .select('id, clinic_id, prompt_text, version, version_name, is_current, created_at, created_by, generation_data')
      .eq('clinic_id', clinic.id)
      .order('version', { ascending: false })
      .limit(50);

    if (historyError) {
      console.error('Error fetching prompt history:', historyError);
      return NextResponse.json({ 
        error: 'Failed to fetch prompt history', 
        details: historyError 
      }, { status: 500 });
    }

    // Format the history data for frontend
    const formattedHistory = (history || []).map(item => ({
      id: item.id,
      version: item.version,
      version_name: item.version_name,
      prompt_text: item.prompt_text,
      created_at: item.created_at,
      created_by: item.created_by,
      is_current: Boolean(item.is_current),
      generation_data: item.generation_data
    }));

    return NextResponse.json({ 
      history: formattedHistory,
      current_version: clinic.ai_version || 1
    });

  } catch (error) {
    console.error('Error fetching prompt history:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch prompt history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}