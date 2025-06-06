import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// Helper function to create a URL-friendly slug
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Helper function to create a unique slug
async function createUniqueSlug(practiceName: string): Promise<string> {
  let baseSlug = createSlug(practiceName);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    // Check if slug exists
    const { data, error } = await supabase
      .from('clinics')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!data) {
      // Slug is available
      return slug;
    }

    // Try next slug
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export async function POST(request: Request) {
  try {
    const { practiceName, doctorName, email, password, specialty, phone } = await request.json();

    // Validate required fields
    if (!practiceName || !doctorName || !email || !password || !specialty) {
      return NextResponse.json(
        { error: 'All fields are required' },
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

    // Validate password strength (at least 8 characters)
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingClinic } = await supabase
      .from('clinics')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingClinic) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create unique slug for the clinic
    const clinicSlug = await createUniqueSlug(practiceName);

    // Generate a default welcome message
    const welcomeMessage = `Welcome to ${practiceName}! I'm here to help answer your questions while you wait to see Dr. ${doctorName}.`;

    // Choose a default color based on specialty
    const specialtyColors: Record<string, string> = {
      'General Practice': '#5BBAD5',
      'Pediatrics': '#81C784',
      'Cardiology': '#E57373',
      'Dermatology': '#BA68C8',
      'Orthopedics': '#4FC3F7',
      'Gastroenterology': '#FFB74D',
      'Neurology': '#9575CD',
      'Psychiatry': '#7986CB',
      'Obstetrics & Gynecology': '#F06292',
      'Ophthalmology': '#4DB6AC'
    };
    const primaryColor = specialtyColors[specialty] || '#5BBAD5';

    // Insert new clinic
    const { data: newClinic, error: insertError } = await supabase
      .from('clinics')
      .insert({
        slug: clinicSlug,
        practice_name: practiceName,
        doctor_name: doctorName,
        email: email.toLowerCase(),
        password_hash: passwordHash, // Store the hashed password
        specialty: specialty,
        phone: phone || null,
        primary_color: primaryColor,
        welcome_message: welcomeMessage,
        logo_url: null,
        ai_instructions: null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    // Return success (without sensitive data)
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      clinic: {
        id: newClinic.id,
        slug: newClinic.slug,
        practiceName: newClinic.practice_name,
        doctorName: newClinic.doctor_name,
        email: newClinic.email,
        specialty: newClinic.specialty
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Signup failed' },
      { status: 500 }
    );
  }
}