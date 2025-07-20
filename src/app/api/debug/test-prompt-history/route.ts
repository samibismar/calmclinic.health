import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test if the table exists and what its structure is
    const { data: tableTest, error: tableError } = await supabase
      .from('ai_prompt_history')
      .select('*')
      .limit(1);

    if (tableError) {
      return NextResponse.json({
        error: 'Table access failed',
        details: tableError,
        message: 'ai_prompt_history table might not exist or have wrong permissions'
      });
    }

    // Test a simple insert to see what fields are missing
    const testInsert = {
      clinic_id: 999999, // Use a non-existent clinic ID for testing
      prompt_text: 'Test prompt',
      version: 1,
      version_name: 'Test Version',
      is_current: false,
      created_at: new Date().toISOString(),
      created_by: 'test'
    };

    const { data: insertTest, error: insertError } = await supabase
      .from('ai_prompt_history')
      .insert(testInsert)
      .select();

    if (insertError) {
      return NextResponse.json({
        error: 'Insert test failed',
        details: insertError,
        attempted_data: testInsert,
        message: 'This shows what columns are missing or have wrong types'
      });
    }

    // Clean up the test record
    if (insertTest && insertTest[0]) {
      await supabase
        .from('ai_prompt_history')
        .delete()
        .eq('id', insertTest[0].id);
    }

    return NextResponse.json({
      success: true,
      message: 'ai_prompt_history table is working correctly',
      test_result: insertTest
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}