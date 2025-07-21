import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import { getClinicFromSession } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get clinic from session
    const clinic = await getClinicFromSession();

    if (!clinic) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get total interactions for this clinic's providers
    const { data: providers } = await supabase
      .from('providers')
      .select('id')
      .eq('clinic_id', clinic.id);

    if (!providers || providers.length === 0) {
      return NextResponse.json({
        totalInteractions: 0,
        todayInteractions: 0,
        thisWeekInteractions: 0
      });
    }

    const providerIds = providers.map(p => p.id);

    // Get total count
    const { count: totalCount } = await supabase
      .from('patient_interactions')
      .select('*', { count: 'exact', head: true })
      .in('provider_id', providerIds);

    // Get today's count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayCount } = await supabase
      .from('patient_interactions')
      .select('*', { count: 'exact', head: true })
      .in('provider_id', providerIds)
      .gte('created_at', today.toISOString());

    // Get this week's count
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: weekCount } = await supabase
      .from('patient_interactions')
      .select('*', { count: 'exact', head: true })
      .in('provider_id', providerIds)
      .gte('created_at', weekAgo.toISOString());

    return NextResponse.json({
      totalInteractions: totalCount || 0,
      todayInteractions: todayCount || 0,
      thisWeekInteractions: weekCount || 0
    });

  } catch (error) {
    console.error('Error getting interaction count:', error);
    return NextResponse.json(
      { error: 'Failed to get interaction count' },
      { status: 500 }
    );
  }
}