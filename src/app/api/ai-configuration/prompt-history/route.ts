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

    // Fetch prompt history
    const { data: history, error: historyError } = await supabase
      .from('ai_prompt_history')
      .select('*')
      .eq('clinic_id', clinic.id)
      .order('created_at', { ascending: false })
      .limit(20); // Limit to last 20 versions

    if (historyError) {
      return NextResponse.json({ 
        error: 'Failed to fetch prompt history', 
        details: historyError 
      }, { status: 500 });
    }

    // Format the history data
    const formattedHistory = (history || []).map(item => ({
      id: item.id,
      version: item.version,
      prompt_text: item.prompt_text,
      created_at: item.created_at,
      created_by: item.created_by,
      performance_metrics: item.performance_metrics || {
        satisfaction_rate: Math.random() * 5, // Mock data for now
        response_accuracy: Math.random() * 100,
        usage_count: Math.floor(Math.random() * 1000)
      }
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