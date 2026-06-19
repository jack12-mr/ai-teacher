/**
 * PayPal Webhook 处理
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyPayPalWebhook } from "@/lib/payment/providers/paypal-provider";
import { getSupabaseAdmin } from "@/lib/integrations/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transmissionId = request.headers.get("paypal-transmission-id");
    const transmissionSig = request.headers.get("paypal-transmission-sig");
    const transmissionTime = request.headers.get("paypal-transmission-time");
    const certUrl = request.headers.get("paypal-cert-url");

    if (!transmissionId || !transmissionSig || !transmissionTime || !certUrl) {
      return NextResponse.json({ error: "Missing headers" }, { status: 400 });
    }


    

    const isValid = await verifyPayPalWebhook(
      body,
      transmissionId,
      transmissionSig,
      transmissionTime,
      certUrl
    );

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 检查是否已处理
    const existing = await supabase
      .from("webhook_events")
      .select("id")
      .eq("event_id", transmissionId)
      .single();

    if (existing.data) {
      return NextResponse.json({ received: true });
    }

    // 记录事件
    const { error: insertEventError } = await supabase.from("webhook_events").insert({
      provider: "paypal",
      event_id: transmissionId,
      event_type: body.event_type,
      processed: true,
    });

    if (insertEventError) {
      console.error(`[PayPal Webhook] Failed to record webhook event ${transmissionId}:`, insertEventError);
    }

    // 处理事件
    if (body.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const customId = JSON.parse(body.resource.custom_id || "{}");
      const userId = customId.userId;
      const days = customId.days || 0;

      if (userId && days > 0) {
        const { error: paymentUpdateError } = await supabase
          .from("payments")
          .update({ status: "paid" })
          .eq("payment_id", body.resource.id);

        if (paymentUpdateError) {
          console.error(`[PayPal Webhook] Failed to update payment status for ${body.resource.id}:`, paymentUpdateError);
        }

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        const { error: subscriptionError } = await supabase.from("subscriptions").upsert({
          user_id: userId,
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
          is_active: true,
          plan_type: customId.paymentType,
        });

        if (subscriptionError) {
          console.error(`[PayPal Webhook] Failed to upsert subscription for user ${userId}:`, subscriptionError);
          return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
        }

        // Update Supabase auth user metadata so session refresh picks up subscription
        const { error: metadataError } = await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            subscription_plan: customId.paymentType || "premium",
            subscription_status: "active",
            membership_expires_at: endDate.toISOString(),
          },
        });

        if (metadataError) {
          console.error(`[PayPal Webhook] Failed to update user metadata for user ${userId}:`, metadataError);
        }

        // Update web_users table to sync subscription_plan
        const { error: updateError } = await supabase
          .from("web_users")
          .update({
            subscription_plan: customId.paymentType || "monthly",
            subscription_status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (updateError) {
          console.error(`[PayPal Webhook] Failed to update web_users for user ${userId}:`, updateError);
        } else {
          console.log(`[PayPal Webhook] Updated subscription, user metadata, and web_users for user ${userId}`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("PayPal webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
