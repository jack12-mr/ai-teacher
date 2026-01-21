/**
 * API to get active advertisements
 * GET /api/ads/active?position=bottom&limit=1
 * Supports both CloudBase (NoSQL) and Supabase (PostgreSQL)
 */

import { NextResponse } from "next/server";
import { CloudBaseConnector } from "@/lib/cloudbase/connector";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get("position"); // top, middle, bottom
    const limit = parseInt(searchParams.get("limit") || "1");

    console.log(`📢 [Ads-API] Fetching active ads`, { position, limit });

    const connector = new CloudBaseConnector();
    await connector.initialize();
    const db = connector.getClient();

    // Build query for CloudBase NoSQL
    let query = db.collection('advertisements');

    // Build where condition
    const whereCondition: any = {
      status: 'active'
    };

    // Filter by position if provided
    if (position) {
      whereCondition.position = position;
    }

    console.log(`📢 [Ads-API] Query condition:`, whereCondition);

    // Execute query
    const { data } = await query
      .where(whereCondition)
      .orderBy('priority', 'desc')
      .orderBy('created_at', 'asc')
      .limit(limit)
      .get();

    const ads = data || [];

    // Filter ads by validity period
    const now = new Date();
    const validAds = ads.filter((ad: any) => {
      // Check if ad is within validity period
      if (ad.start_date && new Date(ad.start_date) > now) {
        return false;
      }
      if (ad.end_date && new Date(ad.end_date) < now) {
        return false;
      }
      return true;
    });

    console.log(`✅ [Ads-API] Found ${validAds.length} active ads`);

    return NextResponse.json({
      success: true,
      ads: validAds,
      count: validAds.length,
    });
  } catch (error: any) {
    console.error("❌ [Ads-API] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unexpected error",
        details: error,
      },
      { status: 500 }
    );
  }
}
