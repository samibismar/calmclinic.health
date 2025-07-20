import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const body = await request.json();
    const { interview_responses } = body;

    if (!interview_responses) {
      return NextResponse.json({ error: 'Interview responses are required' }, { status: 400 });
    }

    // Update clinic with interview responses
    const { data: updateResult, error: updateError } = await supabase
      .from('clinics')
      .update({
        interview_responses: interview_responses,
        updated_at: new Date().toISOString()
      })
      .eq('id', clinic.id)
      .select('*');

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to save interview responses', 
        details: updateError 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      clinic: updateResult?.[0]
    });

  } catch (error) {
    console.error('Error saving interview responses:', error);
    return NextResponse.json({ 
      error: 'Failed to save interview responses',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}