/**
 * Debug API to test profile insertion
 */

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/integrations/supabase-admin";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    console.log("🔍 [Debug-Insert] Testing profile insertion...");

    // First, try to get a test user ID from auth.users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error("❌ [Debug-Insert] Error listing users:", listError);
      return NextResponse.json({
        success: false,
        error: "Failed to list auth users",
        details: listError,
      });
    }

    console.log(`✅ [Debug-Insert] Found ${users.length} users in auth.users`);

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No users found in auth.users",
      });
    }

    // Get the first user
    const testUser = users[0];
    console.log(`🔍 [Debug-Insert] Using user: ${testUser.id} (${testUser.email})`);

    // Try to insert a profile for this user
    const { data: profileData, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: testUser.id,
        email: testUser.email,
        name: "Test User",
        display_name: "Test User",
        region: "INTL",
      })
      .select();

    if (insertError) {
      console.error("❌ [Debug-Insert] Error inserting profile:", insertError);
      console.error("Error details:", JSON.stringify(insertError, null, 2));
      return NextResponse.json({
        success: false,
        error: "Failed to insert profile",
        details: insertError,
        message: insertError.message,
        hint: insertError.hint,
        code: insertError.code,
      });
    }

    console.log("✅ [Debug-Insert] Profile created successfully:", profileData);

    return NextResponse.json({
      success: true,
      profile: profileData,
      message: "Profile created successfully",
    });
  } catch (error: any) {
    console.error("❌ [Debug-Insert] Error:", error);
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
