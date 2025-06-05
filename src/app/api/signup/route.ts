import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Function to create a URL-friendly slug from practice name
function createSlug(practiceName: string): string {
  return practiceName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Function to ensure slug is unique
async function createUniqueSlug(baseName: string): Promise<string> {
  let slug = createSlug(baseName);
  let counter = 1;
  
  while (true) {
    // Check if slug already exists
    const { error } = await supabase
      .from('clinics')
      .select('slug')
      .eq('slug', slug)
      .single();
    
    // If no data found, slug is available
    if (error && error.code === 'PGRST116') {
      return slug;
    }
    
    // If slug exists, try with number suffix
    slug = `${createSlug(baseName)}-${counter}`;
    counter++;
    
    // Safety check to prevent infinite loop
    if (counter > 100) {
      throw new Error('Unable to create unique slug');
    }
  }
}

export async function POST(request: Request) {
  try {
    const { practiceName, doctorName, email, specialty, phone } = await request.json();

    // Validate required fields
    if (!practiceName || !doctorName || !email || !specialty) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email already exists  
    const { error: emailCheckError } = await supabase
      .from('clinics')
      .select('email')
      .eq('email', email)
      .single();

    // If no error, it means email exists (we found a record)
    if (!emailCheckError) {
      return NextResponse.json(
        { error: 'A clinic with this email already exists' },
        { status: 400 }
      );
    }

    // Create unique slug
    const clinicSlug = await createUniqueSlug(practiceName);

    // Generate welcome message based on language preference (defaulting to English for now)
    const welcomeMessage = `Hello! I'm Dr. ${doctorName}'s assistant. How can I help you prepare for your visit today?`;

    // Insert new clinic into database
    const { data: newClinic, error: insertError } = await supabase
      .from('clinics')
      .insert([
        {
          slug: clinicSlug,
          doctor_name: doctorName,
          practice_name: practiceName,
          email: email,
          phone: phone || null,
          logo_url: null, // Will be customizable later
          primary_color: '#5BBAD5', // Default color
          welcome_message: welcomeMessage,
          specialty: specialty,
          ai_instructions: null, // Can be customized later
          status: 'trial', // New field we'll add
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      console.error('Error details:', JSON.stringify(insertError, null, 2));
      return NextResponse.json(
        { error: `Database error: ${insertError.message}` },
        { status: 500 }
      );
    }

    // TODO: In next step, we'll add email sending here
    console.log('New clinic created:', newClinic);

    return NextResponse.json({ 
      success: true,
      clinicSlug: clinicSlug,
      message: 'Clinic created successfully'
    });

  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}