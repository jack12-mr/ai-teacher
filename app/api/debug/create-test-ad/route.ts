/**
 * Debug API to create a test advertisement in CloudBase
 */

import { NextResponse } from "next/server";
import { CloudBaseConnector } from "@/lib/cloudbase/connector";

export async function POST() {
  try {
    console.log("🎯 [Debug-CreateAd] Creating test advertisement...");

    const connector = new CloudBaseConnector();
    await connector.initialize();
    const db = connector.getClient();

    const testAd = {
      id: `test-ad-${Date.now()}`,
      title: "测试主页展示 - 超值会员优惠",
      type: "image",
      position: "bottom",
      file_url: "https://picsum.photos/800/200",
      link_url: "https://example.com/special-offer",
      redirect_url: "https://example.com/special-offer",
      priority: 100,
      status: "active",
      start_date: new Date().toISOString(),
      end_date: null, // 永不过期
      click_count: 0,
      impression_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const result = await db.collection('advertisements').add(testAd);

    console.log("✅ [Debug-CreateAd] Test ad created:", result);

    return NextResponse.json({
      success: true,
      message: "Test advertisement created successfully",
      ad: testAd,
      result
    });
  } catch (error: any) {
    console.error("❌ [Debug-CreateAd] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create test ad",
        details: error,
      },
      { status: 500 }
    );
  }
}

// GET请求返回说明
export async function GET() {
  return NextResponse.json({
    message: "Send POST request to create a test advertisement",
    usage: "POST /api/debug/create-test-ad"
  });
}
