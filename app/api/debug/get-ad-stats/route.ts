/**
 * Debug API to get advertisement statistics
 */

import { NextResponse } from "next/server";
import { CloudBaseConnector } from "@/lib/cloudbase/connector";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adId = searchParams.get("id");

    console.log(`📊 [Debug-AdStats] Getting ad stats${adId ? ` for ${adId}` : ''}`);

    const connector = new CloudBaseConnector();
    await connector.initialize();
    const db = connector.getClient();

    let result;

    if (adId) {
      // Get specific ad
      const { data } = await db
        .collection('advertisements')
        .doc(adId)
        .get();

      result = {
        ad: data,
        click_count: data?.[0]?.click_count || 0,
        impression_count: data?.[0]?.impression_count || 0
      };
    } else {
      // Get all ads with stats
      const { data } = await db
        .collection('advertisements')
        .field({
          id: true,
          title: true,
          status: true,
          position: true,
          click_count: true,
          impression_count: true
        })
        .get();

      result = {
        total_ads: data?.length || 0,
        ads: data
      };
    }

    console.log(`✅ [Debug-AdStats] Stats retrieved:`, result);

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error("❌ [Debug-AdStats] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get ad stats",
      },
      { status: 500 }
    );
  }
}
