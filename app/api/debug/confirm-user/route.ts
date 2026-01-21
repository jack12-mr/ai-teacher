/**
 * Debug API to confirm user email
 */

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/integrations/supabase-admin";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({
        success: false,
        error: "Email is required",
      }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    console.log(`✉️ [Debug-Confirm] Confirming email for user: ${email}`);

    // Get user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error("❌ [Debug-Confirm] Error listing users:", listError);
      return NextResponse.json({
        success: false,
        error: "Failed to list users",
        details: listError,
      });
    }

    const user = users.find(u => u.email === email);

    if (!user) {
      console.error(`❌ [Debug-Confirm] User not found: ${email}`);
      return NextResponse.json({
        success: false,
        error: "User not found",
      }, { status: 404 });
    }

    // Update user to confirm email
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    if (updateError) {
      console.error("❌ [Debug-Confirm] Error confirming email:", updateError);
      return NextResponse.json({
        success: false,
        error: "Failed to confirm email",
        details: updateError,
      });
    }

    console.log(`✅ [Debug-Confirm] Email confirmed successfully for: ${email}`);

    return NextResponse.json({
      success: true,
      message: `Email confirmed successfully for ${email}`,
      email,
      userId: user.id,
    });
  } catch (error: any) {
    console.error("❌ [Debug-Confirm] Error:", error);
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
