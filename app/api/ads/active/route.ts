/**
 * API to get active advertisements
 * GET /api/ads/active?position=bottom&limit=1
 * Supports both CloudBase (NoSQL) and Supabase (PostgreSQL)
 */

import { NextResponse } from "next/server";
import { getDatabaseAdapter } from "@/lib/admin/database";
import { RegionConfig } from "@/lib/config/region";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get("position"); // top, middle, bottom
    const limit = parseInt(searchParams.get("limit") || "1");

    console.log(`📢 [Ads-API] ========== 开始获取广告 ==========`);
    console.log(`📢 [Ads-API] 环境区域:`, RegionConfig.region);
    console.log(`📢 [Ads-API] 请求参数:`, { position, limit });

    // 使用数据库适配器，根据环境自动选择正确的数据库
    const db = await getDatabaseAdapter();
    console.log(`📢 [Ads-API] 数据库适配器类型:`, db.constructor.name);

    // 构建查询过滤条件
    const filters: any = {
      status: "active",
      limit,
    };

    if (position) {
      filters.position = position;
    }

    console.log(`📢 [Ads-API] 查询条件:`, filters);

    // 查询广告
    const ads = await db.listAds(filters);
    console.log(`📢 [Ads-API] 查询到 ${ads.length} 条广告`);

    if (ads.length > 0) {
      console.log(`📢 [Ads-API] 第一条广告详情:`, {
        id: ads[0].id,
        title: ads[0].title,
        status: ads[0].status,
        position: ads[0].position,
        priority: ads[0].priority,
      });
    }

    // 过滤有效期内的广告
    const now = new Date();
    const validAds = ads.filter((ad: any) => {
      if (ad.start_date && new Date(ad.start_date) > now) {
        console.log(`📢 [Ads-API] 广告 ${ad.id} 未到开始时间，过滤掉`);
        return false;
      }
      if (ad.end_date && new Date(ad.end_date) < now) {
        console.log(`📢 [Ads-API] 广告 ${ad.id} 已过结束时间，过滤掉`);
        return false;
      }
      return true;
    });

    console.log(`✅ [Ads-API] 最终返回 ${validAds.length} 条有效广告`);

    // 转换字段名以兼容前端
    const formattedAds = validAds.map((ad: any) => ({
      id: ad.id,
      title: ad.title,
      type: ad.type,
      position: ad.position,
      file_url: ad.fileUrl || ad.file_url || ad.media_url,
      link_url: ad.linkUrl || ad.link_url || ad.redirect_url,
      redirect_url: ad.linkUrl || ad.link_url || ad.redirect_url,
      priority: ad.priority,
      status: ad.status,
      start_date: ad.start_date || ad.startDate,
      end_date: ad.end_date || ad.endDate,
    }));

    return NextResponse.json({
      success: true,
      ads: formattedAds,
      count: formattedAds.length,
    });
  } catch (error: any) {
    console.error("❌ [Ads-API] 获取广告失败:", error);
    console.error("❌ [Ads-API] 错误详情:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        success: false,
        error: error.message || "获取广告失败",
        details: error,
      },
      { status: 500 }
    );
  }
}
