import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to get clinic ID from session
async function getClinicFromSession() {
  const cookieStore = await cookies();
  const authUserId = cookieStore.get('auth_user_id')?.value;
  
  if (!authUserId) {
    return null;
  }

  const { data: clinic } = await supabase
    .from('clinics')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();

  return clinic;
}

// GET - Fetch providers for authenticated clinic
export async function GET() {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: providers, error } = await supabase
      .from('providers')
      .select('*')
      .eq('clinic_id', clinic.id)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching providers:', error);
      return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
    }

    return NextResponse.json({ providers: providers || [] });
  } catch (error) {
    console.error('Error in GET /api/providers:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new provider
export async function POST(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, title, specialties, bio, experience, languages, avatar_url, is_default, gender } = body;

    // Validate required fields
    if (!name || !title) {
      return NextResponse.json({ error: "Name and title are required" }, { status: 400 });
    }

    // If this is set as default, unset all other defaults
    if (is_default) {
      await supabase
        .from('providers')
        .update({ is_default: false })
        .eq('clinic_id', clinic.id);
    }

    // Get the next display order
    const { data: lastProvider } = await supabase
      .from('providers')
      .select('display_order')
      .eq('clinic_id', clinic.id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const nextDisplayOrder = lastProvider ? lastProvider.display_order + 1 : 1;

    const { data: provider, error } = await supabase
      .from('providers')
      .insert({
        clinic_id: clinic.id,
        name,
        title,
        specialties: specialties || [],
        bio,
        experience,
        languages: languages || [],
        avatar_url,
        is_default: is_default || false,
        is_active: true,
        display_order: nextDisplayOrder,
        gender: gender || 'not_specified'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating provider:', error);
      return NextResponse.json({ error: "Failed to create provider" }, { status: 500 });
    }

    return NextResponse.json({ provider });
  } catch (error) {
    console.error('Error in POST /api/providers:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update provider
export async function PUT(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, title, specialties, bio, experience, languages, avatar_url, is_default, is_active, gender } = body;

    // Validate required fields
    if (!id || !name || !title) {
      return NextResponse.json({ error: "ID, name, and title are required" }, { status: 400 });
    }

    // If this is set as default, unset all other defaults
    if (is_default) {
      await supabase
        .from('providers')
        .update({ is_default: false })
        .eq('clinic_id', clinic.id)
        .neq('id', id);
    }

    const { data: provider, error } = await supabase
      .from('providers')
      .update({
        name,
        title,
        specialties: specialties || [],
        bio,
        experience,
        languages: languages || [],
        avatar_url,
        is_default: is_default || false,
        is_active: is_active !== false,
        gender: gender || 'not_specified'
      })
      .eq('id', id)
      .eq('clinic_id', clinic.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating provider:', error);
      return NextResponse.json({ error: "Failed to update provider" }, { status: 500 });
    }

    return NextResponse.json({ provider });
  } catch (error) {
    console.error('Error in PUT /api/providers:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete provider
export async function DELETE(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Provider ID is required" }, { status: 400 });
    }

    // Check if this is the only provider
    const { data: providers } = await supabase
      .from('providers')
      .select('id')
      .eq('clinic_id', clinic.id)
      .eq('is_active', true);

    if (providers && providers.length <= 1) {
      return NextResponse.json({ error: "Cannot delete the only provider" }, { status: 400 });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('providers')
      .update({ is_active: false })
      .eq('id', id)
      .eq('clinic_id', clinic.id);

    if (error) {
      console.error('Error deleting provider:', error);
      return NextResponse.json({ error: "Failed to delete provider" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/providers:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}