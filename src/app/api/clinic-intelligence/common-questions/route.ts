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

export async function GET() {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    // Fetch common questions for this clinic
    const { data: questions, error: questionsError } = await supabase
      .from('clinic_common_questions')
      .select('*')
      .eq('clinic_id', clinic.id)
      .order('usage_count', { ascending: false });

    if (questionsError) {
      return NextResponse.json({ 
        error: 'Failed to fetch common questions', 
        details: questionsError 
      }, { status: 500 });
    }

    return NextResponse.json({ questions: questions || [] });
  } catch (error) {
    console.error('Error fetching common questions:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch common questions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const body = await request.json();
    const { question_text, category } = body;

    if (!question_text?.trim()) {
      return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
    }

    // Insert new common question
    const { data: newQuestion, error: insertError } = await supabase
      .from('clinic_common_questions')
      .insert({
        clinic_id: clinic.id,
        question_text: question_text.trim(),
        category: category || 'general',
        usage_count: 0,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ 
        error: 'Failed to create common question', 
        details: insertError 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      question: newQuestion 
    });

  } catch (error) {
    console.error('Error creating common question:', error);
    return NextResponse.json({ 
      error: 'Failed to create common question',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const body = await request.json();
    const { id, question_text, category } = body;

    if (!id) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    if (!question_text?.trim()) {
      return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
    }

    // Update the common question
    const { data: updatedQuestion, error: updateError } = await supabase
      .from('clinic_common_questions')
      .update({
        question_text: question_text.trim(),
        category: category || 'general',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('clinic_id', clinic.id) // Ensure they can only update their own questions
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update common question', 
        details: updateError 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      question: updatedQuestion 
    });

  } catch (error) {
    console.error('Error updating common question:', error);
    return NextResponse.json({ 
      error: 'Failed to update common question',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    // Soft delete by setting is_active to false
    const { error: deleteError } = await supabase
      .from('clinic_common_questions')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('clinic_id', clinic.id); // Ensure they can only delete their own questions

    if (deleteError) {
      return NextResponse.json({ 
        error: 'Failed to delete common question', 
        details: deleteError 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting common question:', error);
    return NextResponse.json({ 
      error: 'Failed to delete common question',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}