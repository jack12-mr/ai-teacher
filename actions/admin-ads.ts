"use server";

/**
 * 管理后台 - 广告管理 Server Actions
 *
 * 提供广告的创建、编辑、删除、列表查看等功能
 * 支持双数据库（CloudBase + Supabase）
 */

import { requireAdminSession } from "@/lib/admin/session";
import { getDatabaseAdapter } from "@/lib/admin/database";
import type {
  Advertisement,
  AdFilters,
  ApiResponse,
  PaginatedResult,
  CreateAdData,
  UpdateAdData,
} from "@/lib/admin/types";
import { revalidatePath } from "next/cache";

/**
 * 获取广告列表
 */
export async function listAds(
  filters?: AdFilters
): Promise<ApiResponse<PaginatedResult<Advertisement>>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const ads = await db.listAds(filters || {});
    const total = await db.countAds(filters || {});

    const pageSize = filters?.limit || 20;
    const page = filters?.offset ? Math.floor(filters.offset / pageSize) + 1 : 1;

    return {
      success: true,
      data: {
        items: ads,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error: any) {
    console.error("获取广告列表失败:", error);
    return {
      success: false,
      error: error.message || "获取广告列表失败",
    };
  }
}

/**
 * 根据 ID 获取广告详情
 */
export async function getAdById(
  adId: string
): Promise<ApiResponse<Advertisement>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const ad = await db.getAdById(adId);

    if (!ad) {
      return {
        success: false,
        error: "广告不存在",
      };
    }

    return {
      success: true,
      data: ad,
    };
  } catch (error: any) {
    console.error("获取广告详情失败:", error);
    return {
      success: false,
      error: error.message || "获取广告详情失败",
    };
  }
}

/**
 * 创建广告
 */
export async function createAd(
  data: CreateAdData
): Promise<ApiResponse<Advertisement>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const ad = await db.createAd(data);

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "ad.create",
      resource_type: "ad",
      resource_id: ad.id,
      details: { title: data.title, position: data.position },
    });

    // 重新验证缓存
    revalidatePath("/admin/ads");
    revalidatePath("/");

    return {
      success: true,
      data: ad,
    };
  } catch (error: any) {
    console.error("创建广告失败:", error);
    return {
      success: false,
      error: error.message || "创建广告失败",
    };
  }
}

/**
 * 更新广告
 */
export async function updateAd(
  adId: string,
  data: UpdateAdData
): Promise<ApiResponse<Advertisement>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const ad = await db.updateAd(adId, data);

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "ad.update",
      resource_type: "ad",
      resource_id: adId,
      details: data,
    });

    // 重新验证缓存
    revalidatePath("/admin/ads");
    revalidatePath("/");

    return {
      success: true,
      data: ad,
    };
  } catch (error: any) {
    console.error("更新广告失败:", error);
    return {
      success: false,
      error: error.message || "更新广告失败",
    };
  }
}

/**
 * 删除广告
 */
export async function deleteAd(
  adId: string
): Promise<ApiResponse<void>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();

    // 先获取广告信息用于日志
    const ad = await db.getAdById(adId);
    if (!ad) {
      return {
        success: false,
        error: "广告不存在",
      };
    }

    await db.deleteAd(adId);

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "ad.delete",
      resource_type: "ad",
      resource_id: adId,
      details: { title: ad.title },
    });

    // 重新验证缓存
    revalidatePath("/admin/ads");
    revalidatePath("/");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("删除广告失败:", error);
    return {
      success: false,
      error: error.message || "删除广告失败",
    };
  }
}

/**
 * 切换广告状态（激活/禁用）
 */
export async function toggleAdStatus(
  adId: string
): Promise<ApiResponse<Advertisement>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const ad = await db.getAdById(adId);

    if (!ad) {
      return {
        success: false,
        error: "广告不存在",
      };
    }

    const newStatus = ad.status === "active" ? "inactive" : "active";
    const updatedAd = await db.updateAd(adId, { status: newStatus });

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "ad.update",
      resource_type: "ad",
      resource_id: adId,
      details: { previousStatus: ad.status, newStatus },
    });

    // 重新验证缓存
    revalidatePath("/admin/ads");
    revalidatePath("/");

    return {
      success: true,
      data: updatedAd,
    };
  } catch (error: any) {
    console.error("切换广告状态失败:", error);
    return {
      success: false,
      error: error.message || "切换广告状态失败",
    };
  }
}

/**
 * 获取广告统计信息
 */
export async function getAdStats(): Promise<ApiResponse<{
  total: number;
  active: number;
  inactive: number;
  byPosition: Record<string, number>;
  byType: Record<string, number>;
}>> {
  try {
    const session = await requireAdminSession();
    const db = await getDatabaseAdapter();

    const allAds = await db.listAds({ limit: 10000 });

    const active = allAds.filter((ad) => ad.status === "active").length;
    const inactive = allAds.filter((ad) => ad.status === "inactive").length;

    // 按位置统计
    const byPosition: Record<string, number> = {};
    allAds.forEach((ad) => {
      byPosition[ad.position] = (byPosition[ad.position] || 0) + 1;
    });

    // 按类型统计
    const byType: Record<string, number> = {};
    allAds.forEach((ad) => {
      byType[ad.type] = (byType[ad.type] || 0) + 1;
    });

    return {
      success: true,
      data: {
        total: allAds.length,
        active,
        inactive,
        byPosition,
        byType,
      },
    };
  } catch (error: any) {
    console.error("获取广告统计失败:", error);
    return {
      success: false,
      error: error.message || "获取广告统计失败",
    };
  }
}

/**
 * 批量更新广告优先级
 */
export async function updateAdPriorities(
  updates: Array<{ id: string; priority: number }>
): Promise<ApiResponse<void>> {
  try {
    const session = await requireAdminSession();
    const db = await getDatabaseAdapter();

    // 并发更新所有广告的优先级
    await Promise.all(
      updates.map(({ id, priority }) => db.updateAd(id, { priority }))
    );

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "ad.update",
      resource_type: "ad",
      details: { action: "bulk_update_priority", count: updates.length },
    });

    // 重新验证缓存
    revalidatePath("/admin/ads");
    revalidatePath("/");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("批量更新优先级失败:", error);
    return {
      success: false,
      error: error.message || "批量更新优先级失败",
    };
  }
}
