import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const { data: clinic, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    return NextResponse.json(clinic);
  } catch (error) {
    console.error('Error fetching clinic settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}