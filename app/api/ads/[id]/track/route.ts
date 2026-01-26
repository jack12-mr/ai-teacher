/**
 * API to track ad clicks and impressions
 * POST /api/ads/[id]/track
 * Body: { type: 'click' | 'impression' }
 */

import { NextResponse } from "next/server";
import { CloudBaseConnector } from "@/lib/cloudbase/connector";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: adId } = await params;
    const { type } = await request.json();

    if (type !== 'click' && type !== 'impression') {
      return NextResponse.json({
        success: false,
        error: 'Invalid type. Must be "click" or "impression"',
      }, { status: 400 });
    }

    console.log(`📊 [Ad-Track] Recording ${type} for ad: ${adId}`);

    const connector = new CloudBaseConnector();
    await connector.initialize();
    const db = connector.getClient();

    // Get current ad data
    const { data: adData } = await db
      .collection('advertisements')
      .doc(adId)
      .get();

    if (!adData || adData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Advertisement not found',
      }, { status: 404 });
    }

    const ad = adData[0] || adData;

    // Update counters
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (type === 'click') {
      updateData.click_count = (ad.click_count || 0) + 1;
    } else if (type === 'impression') {
      updateData.impression_count = (ad.impression_count || 0) + 1;
    }

    // Update ad
    await db
      .collection('advertisements')
      .doc(adId)
      .update(updateData);

    console.log(`✅ [Ad-Track] Recorded ${type}:`, {
      adId,
      ...updateData
    });

    return NextResponse.json({
      success: true,
      message: `${type} recorded successfully`,
    });
  } catch (error: any) {
    console.error("❌ [Ad-Track] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to track ad",
      },
      { status: 500 }
    );
  }
}
