/**
 * Debug API to check profiles table status
 */

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/integrations/supabase-admin";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // Test 1: Check if profiles table exists and is accessible
    console.log("🔍 [Debug] Testing profiles table access...");

    const { data: profiles, error: selectError, count } = await supabase
      .from("profiles")
      .select("*", { count: "exact" });

    if (selectError) {
      console.error("❌ [Debug] Error querying profiles:", selectError);
      return NextResponse.json({
        success: false,
        error: "Failed to query profiles table",
        details: selectError,
      });
    }

    console.log(`✅ [Debug] Profiles table accessible. Count: ${count}`);

    // Test 2: Check auth role
    const { data: authData } = await supabase.rpc("get_role_if_authenticated");
    console.log("🔍 [Debug] Auth role check:", authData);

    return NextResponse.json({
      success: true,
      profiles_count: count,
      profiles: profiles,
      message: "Profiles table is accessible",
    });
  } catch (error: any) {
    console.error("❌ [Debug] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
        details: error,
      },
      { status: 500 }
    );
  }
}
