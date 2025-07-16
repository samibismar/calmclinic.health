import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clinic_slug: string }> }
) {
  try {
    const { clinic_slug } = await params;

    // First, get the clinic information
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("id, practice_name, supports_multi_provider, default_provider_id")
      .eq("slug", clinic_slug)
      .single();

    if (clinicError || !clinic) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
    }

    // Get all active providers for this clinic
    const { data: providers, error: providersError } = await supabase
      .from("providers")
      .select("*")
      .eq("clinic_id", clinic.id)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (providersError) {
      console.error("Error fetching providers:", providersError);
      return NextResponse.json(
        { error: "Failed to fetch providers" },
        { status: 500 }
      );
    }

    // If no providers found, this might be a legacy clinic
    if (!providers || providers.length === 0) {
      // Check if this is a legacy single-provider clinic
      const { data: legacyClinic, error: legacyError } = await supabase
        .from("clinics")
        .select("doctor_name, specialty")
        .eq("slug", clinic_slug)
        .single();

      if (legacyError || !legacyClinic?.doctor_name) {
        return NextResponse.json(
          { error: "No providers found for this clinic" },
          { status: 404 }
        );
      }

      // Return legacy clinic data as a single provider
      return NextResponse.json({
        clinic: {
          id: clinic.id,
          name: clinic.practice_name,
          supports_multi_provider: false,
          default_provider_id: null
        },
        providers: [
          {
            id: -1, // Temporary ID for legacy provider
            name: legacyClinic.doctor_name,
            title: legacyClinic.specialty || "Doctor",
            specialties: legacyClinic.specialty ? [legacyClinic.specialty] : [],
            bio: null,
            experience: null,
            languages: null,
            avatar_url: null,
            is_active: true,
            is_default: true,
            is_legacy: true
          }
        ]
      });
    }

    // Sort providers to put default provider first
    const sortedProviders = providers.sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return a.display_order - b.display_order;
    });

    return NextResponse.json({
      clinic: {
        id: clinic.id,
        name: clinic.practice_name,
        supports_multi_provider: clinic.supports_multi_provider,
        default_provider_id: clinic.default_provider_id
      },
      providers: sortedProviders
    });

  } catch (error) {
    console.error("Error in providers API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}