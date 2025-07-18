import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get clinic from session
    const { data: sessionData, error: sessionError } = await supabase
      .from("user_sessions")
      .select("clinic_id")
      .eq("session_token", token.value)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Get additional info
    const { data: additionalInfo, error } = await supabase
      .from("clinic_additional_info")
      .select("additional_info")
      .eq("clinic_id", sessionData.clinic_id)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 = no rows found
      console.error("Error fetching additional info:", error);
      return NextResponse.json({ error: "Failed to fetch additional info" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      additional_info: additionalInfo?.additional_info || ""
    });

  } catch (error) {
    console.error("Error in additional-info GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { additional_info } = await request.json();

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get clinic from session
    const { data: sessionData, error: sessionError } = await supabase
      .from("user_sessions")
      .select("clinic_id")
      .eq("session_token", token.value)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Upsert additional info
    const { error } = await supabase
      .from("clinic_additional_info")
      .upsert({
        clinic_id: sessionData.clinic_id,
        additional_info: additional_info || "",
        updated_at: new Date().toISOString()
      }, {
        onConflict: "clinic_id"
      });

    if (error) {
      console.error("Error saving additional info:", error);
      return NextResponse.json({ error: "Failed to save additional info" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Additional information saved successfully"
    });

  } catch (error) {
    console.error("Error in additional-info POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}