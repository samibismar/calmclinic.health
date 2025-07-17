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

// Update custom fallback
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const body = await request.json();
    const { trigger_type, trigger_description, response_text } = body;
    const resolvedParams = await params;
    const fallbackId = parseInt(resolvedParams.id);

    if (!trigger_type || !trigger_description || !response_text) {
      return NextResponse.json({ 
        error: 'All fields are required (trigger_type, trigger_description, response_text)' 
      }, { status: 400 });
    }

    // Verify the fallback belongs to this clinic
    const { data: existingFallback, error: fetchError } = await supabase
      .from('ai_custom_fallbacks')
      .select('*')
      .eq('id', fallbackId)
      .eq('clinic_id', clinic.id)
      .single();

    if (fetchError || !existingFallback) {
      return NextResponse.json({ error: 'Custom fallback not found' }, { status: 404 });
    }

    // Update the fallback
    const { data: updatedFallback, error: updateError } = await supabase
      .from('ai_custom_fallbacks')
      .update({
        trigger_type: trigger_type.trim(),
        trigger_description: trigger_description.trim(),
        response_text: response_text.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', fallbackId)
      .eq('clinic_id', clinic.id)
      .select('*')
      .single();

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update custom fallback', 
        details: updateError 
      }, { status: 500 });
    }

    // Log the update
    try {
      await supabase
        .from('ai_configuration_log')
        .insert({
          clinic_id: clinic.id,
          change_type: 'custom_fallback_updated',
          change_data: {
            fallback_id: fallbackId,
            old_data: {
              trigger_type: existingFallback.trigger_type,
              trigger_description: existingFallback.trigger_description,
              response_text: existingFallback.response_text
            },
            new_data: {
              trigger_type: trigger_type.trim(),
              trigger_description: trigger_description.trim(),
              response_text: response_text.trim()
            }
          },
          changed_by: 'user',
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging custom fallback update:', logError);
    }

    return NextResponse.json({ 
      success: true, 
      fallback: updatedFallback
    });

  } catch (error) {
    console.error('Error updating custom fallback:', error);
    return NextResponse.json({ 
      error: 'Failed to update custom fallback',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Delete custom fallback
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const resolvedParams = await params;
    const fallbackId = parseInt(resolvedParams.id);

    // Verify the fallback belongs to this clinic
    const { data: existingFallback, error: fetchError } = await supabase
      .from('ai_custom_fallbacks')
      .select('*')
      .eq('id', fallbackId)
      .eq('clinic_id', clinic.id)
      .single();

    if (fetchError || !existingFallback) {
      return NextResponse.json({ error: 'Custom fallback not found' }, { status: 404 });
    }

    // Delete the fallback
    const { error: deleteError } = await supabase
      .from('ai_custom_fallbacks')
      .delete()
      .eq('id', fallbackId)
      .eq('clinic_id', clinic.id);

    if (deleteError) {
      return NextResponse.json({ 
        error: 'Failed to delete custom fallback', 
        details: deleteError 
      }, { status: 500 });
    }

    // Log the deletion
    try {
      await supabase
        .from('ai_configuration_log')
        .insert({
          clinic_id: clinic.id,
          change_type: 'custom_fallback_deleted',
          change_data: {
            fallback_id: fallbackId,
            trigger_type: existingFallback.trigger_type,
            trigger_description: existingFallback.trigger_description,
            response_text: existingFallback.response_text,
            deleted_at: new Date().toISOString()
          },
          changed_by: 'user',
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging custom fallback deletion:', logError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Custom fallback deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting custom fallback:', error);
    return NextResponse.json({ 
      error: 'Failed to delete custom fallback',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}