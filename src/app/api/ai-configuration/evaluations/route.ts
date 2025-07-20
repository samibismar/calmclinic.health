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

    // Try to fetch evaluations from database
    try {
      const { data: evaluations, error } = await supabase
        .from('ai_evaluations')
        .select('*')
        .eq('clinic_id', clinic.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Database error fetching evaluations:', error);
        // Return empty array if table doesn't exist yet
        return NextResponse.json({ evaluations: [] });
      }

      // Format evaluations for frontend
      const formattedEvaluations = (evaluations || []).map((evaluation: any) => ({
        id: evaluation.id.toString(),
        test_name: `Evaluation - ${new Date(evaluation.created_at).toLocaleDateString()}`,
        prompt_version: evaluation.prompt_version || 'Unknown',
        scenarios_tested: evaluation.test_scenarios || [],
        overall_score: evaluation.overall_score || 0,
        category_scores: evaluation.category_scores || {
          healthcare_compliance: 0,
          personality_match: 0,
          response_quality: 0,
          safety: 0
        },
        cost: evaluation.cost || 0,
        created_at: evaluation.created_at,
        detailed_feedback: evaluation.detailed_feedback || 'No feedback available'
      }));

      return NextResponse.json({ 
        evaluations: formattedEvaluations,
        total: formattedEvaluations.length
      });

    } catch (dbError) {
      console.error('Error fetching evaluations from database:', dbError);
      // Return empty array if there's any database issue
      return NextResponse.json({ evaluations: [] });
    }

  } catch (error) {
    console.error('Error in evaluations API:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch evaluations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}