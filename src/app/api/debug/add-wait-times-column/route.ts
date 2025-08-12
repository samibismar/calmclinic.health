import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // Add the wait_time_minutes column to providers table
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add wait_time_minutes column if it doesn't exist
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'providers' AND column_name = 'wait_time_minutes'
          ) THEN
            ALTER TABLE providers ADD COLUMN wait_time_minutes INTEGER DEFAULT 5;
            CREATE INDEX IF NOT EXISTS idx_providers_wait_time ON providers(clinic_id, is_active, wait_time_minutes);
          END IF;
        END $$;
      `
    });

    if (error) {
      console.error('Migration error:', error);
      return NextResponse.json({ error: 'Migration failed', details: error }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully added wait_time_minutes column to providers table' 
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}