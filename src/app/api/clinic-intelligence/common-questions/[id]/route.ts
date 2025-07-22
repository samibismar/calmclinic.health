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

// PUT - Update a specific common question
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await request.json();
    const { question_text, category } = body;

    if (!question_text?.trim()) {
      return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
    }

    // Update the question
    const { data, error } = await supabase
      .from('clinic_common_questions')
      .update({
        question_text: question_text.trim(),
        category: category || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('clinic_id', clinic.id) // Ensure user can only update their own questions
      .select()
      .single();

    if (error) {
      console.error('Database error updating question:', error);
      return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
    }

    return NextResponse.json({ success: true, question: data });

  } catch (error) {
    console.error('Error updating common question:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

// DELETE - Delete a specific common question
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  console.log('🗑️ DELETE request received for question ID:', idParam);
  
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      console.log('❌ No clinic found in session');
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    console.log('✅ Clinic found:', clinic.id, clinic.practice_name);

    const id = parseInt(idParam);

    if (!id || isNaN(id)) {
      console.log('❌ Invalid question ID:', idParam);
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    console.log('🔍 Attempting to delete question ID:', id, 'for clinic:', clinic.id);

    // First, let's check if the question exists
    const { data: existingQuestion, error: fetchError } = await supabase
      .from('clinic_common_questions')
      .select('*')
      .eq('id', id)
      .eq('clinic_id', clinic.id)
      .single();

    if (fetchError) {
      console.log('❌ Error fetching question:', fetchError);
      return NextResponse.json({ error: 'Question not found', details: fetchError }, { status: 404 });
    }

    if (!existingQuestion) {
      console.log('❌ Question not found with ID:', id, 'for clinic:', clinic.id);
      return NextResponse.json({ error: 'Question not found or access denied' }, { status: 404 });
    }

    console.log('✅ Found question to delete:', existingQuestion);

    // Soft delete by setting is_active to false
    const { data, error } = await supabase
      .from('clinic_common_questions')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('clinic_id', clinic.id) // Ensure user can only delete their own questions
      .select(); // Add select to see what was updated

    if (error) {
      console.error('❌ Database error deleting question:', error);
      return NextResponse.json({ error: 'Failed to delete question', details: error }, { status: 500 });
    }

    console.log('✅ Database update result:', data);

    if (!data || data.length === 0) {
      console.log('⚠️ No rows were updated - question might not exist or belong to different clinic');
      return NextResponse.json({ error: 'Question not found or access denied' }, { status: 404 });
    }

    console.log('🎉 Question deleted successfully');
    return NextResponse.json({ success: true, deletedQuestion: data[0] });

  } catch (error) {
    console.error('❌ Error deleting common question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}