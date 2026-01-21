/**
 * Debug API to set password for an existing user
 */

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/integrations/supabase-admin";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: "Email and password are required",
      }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    console.log(`🔑 [Debug-SetPassword] Setting password for user: ${email}`);

    // Get user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error("❌ [Debug-SetPassword] Error listing users:", listError);
      return NextResponse.json({
        success: false,
        error: "Failed to list users",
        details: listError,
      });
    }

    const user = users.find(u => u.email === email);

    if (!user) {
      console.error(`❌ [Debug-SetPassword] User not found: ${email}`);
      return NextResponse.json({
        success: false,
        error: "User not found",
      }, { status: 404 });
    }

    // Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (updateError) {
      console.error("❌ [Debug-SetPassword] Error updating password:", updateError);
      return NextResponse.json({
        success: false,
        error: "Failed to update password",
        details: updateError,
      });
    }

    console.log(`✅ [Debug-SetPassword] Password updated successfully for: ${email}`);

    return NextResponse.json({
      success: true,
      message: `Password set successfully for ${email}`,
      email,
      userId: user.id,
    });
  } catch (error: any) {
    console.error("❌ [Debug-SetPassword] Error:", error);
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
