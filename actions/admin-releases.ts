"use server";

/**
 * 管理后台 - 版本发布管理 Server Actions
 *
 * 提供版本发布的创建、编辑、删除、列表查看等功能
 * 支持双数据库（CloudBase + Supabase）
 */

import { requireAdminSession } from "@/lib/admin/session";
import { getDatabaseAdapter } from "@/lib/admin/database";
import type {
  Release,
  ApiResponse,
  PaginatedResult,
  CreateReleaseData,
  UpdateReleaseData,
  ReleaseFilters,
} from "@/lib/admin/types";
import { revalidatePath } from "next/cache";

/**
 * 获取版本发布列表
 */
export async function listReleases(
  filters?: ReleaseFilters
): Promise<ApiResponse<PaginatedResult<Release>>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const releases = await db.listReleases(filters || {});
    const total = await db.countReleases(filters || {});

    const pageSize = filters?.limit || 20;
    const page = filters?.offset ? Math.floor(filters.offset / pageSize) + 1 : 1;

    return {
      success: true,
      data: {
        items: releases,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error: any) {
    console.error("获取版本发布列表失败:", error);
    return {
      success: false,
      error: error.message || "获取版本发布列表失败",
    };
  }
}

/**
 * 根据 ID 获取版本发布
 */
export async function getReleaseById(
  releaseId: string
): Promise<ApiResponse<Release>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const release = await db.getReleaseById(releaseId);

    if (!release) {
      return {
        success: false,
        error: "版本发布不存在",
      };
    }

    return {
      success: true,
      data: release,
    };
  } catch (error: any) {
    console.error("获取版本发布详情失败:", error);
    return {
      success: false,
      error: error.message || "获取版本发布详情失败",
    };
  }
}

/**
 * 创建版本发布
 */
export async function createRelease(
  data: CreateReleaseData
): Promise<ApiResponse<Release>> {
  try {
    const session = await requireAdminSession();

    // 验证必填字段
    if (!data.version || !data.title) {
      return {
        success: false,
        error: "版本号和标题为必填项",
      };
    }

    const db = await getDatabaseAdapter();
    const release = await db.createRelease(data);

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "release.create",
      resource_type: "release",
      resource_id: release.id,
      details: { version: data.version, title: data.title },
    });

    // 重新验证缓存
    revalidatePath("/admin/releases");
    revalidatePath("/");

    return {
      success: true,
      data: release,
    };
  } catch (error: any) {
    console.error("创建版本发布失败:", error);
    return {
      success: false,
      error: error.message || "创建版本发布失败",
    };
  }
}

/**
 * 更新版本发布
 */
export async function updateRelease(
  releaseId: string,
  data: UpdateReleaseData
): Promise<ApiResponse<Release>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const release = await db.updateRelease(releaseId, data);

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "release.update",
      resource_type: "release",
      resource_id: releaseId,
      details: data,
    });

    // 重新验证缓存
    revalidatePath("/admin/releases");
    revalidatePath("/");

    return {
      success: true,
      data: release,
    };
  } catch (error: any) {
    console.error("更新版本发布失败:", error);
    return {
      success: false,
      error: error.message || "更新版本发布失败",
    };
  }
}

/**
 * 删除版本发布
 */
export async function deleteRelease(
  releaseId: string
): Promise<ApiResponse<void>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();

    // 先获取版本信息用于日志
    const release = await db.getReleaseById(releaseId);
    if (!release) {
      return {
        success: false,
        error: "版本发布不存在",
      };
    }

    await db.deleteRelease(releaseId);

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "release.delete",
      resource_type: "release",
      resource_id: releaseId,
      details: { version: release.version, title: release.title },
    });

    // 重新验证缓存
    revalidatePath("/admin/releases");
    revalidatePath("/");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("删除版本发布失败:", error);
    return {
      success: false,
      error: error.message || "删除版本发布失败",
    };
  }
}

/**
 * 发布版本（将草稿状态改为已发布）
 */
export async function publishRelease(
  releaseId: string
): Promise<ApiResponse<Release>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const release = await db.updateRelease(releaseId, {
      status: "published",
      published_at: new Date().toISOString(),
    });

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "release.update",
      resource_type: "release",
      resource_id: releaseId,
      details: { action: "publish", version: release.version },
    });

    // 重新验证缓存
    revalidatePath("/admin/releases");
    revalidatePath("/");

    return {
      success: true,
      data: release,
    };
  } catch (error: any) {
    console.error("发布版本失败:", error);
    return {
      success: false,
      error: error.message || "发布版本失败",
    };
  }
}

/**
 * 归档版本
 */
export async function archiveRelease(
  releaseId: string
): Promise<ApiResponse<Release>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const release = await db.updateRelease(releaseId, {
      status: "archived",
    });

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "release.update",
      resource_type: "release",
      resource_id: releaseId,
      details: { action: "archive", version: release.version },
    });

    // 重新验证缓存
    revalidatePath("/admin/releases");
    revalidatePath("/");

    return {
      success: true,
      data: release,
    };
  } catch (error: any) {
    console.error("归档版本失败:", error);
    return {
      success: false,
      error: error.message || "归档版本失败",
    };
  }
}

/**
 * 获取版本统计信息
 */
export async function getReleaseStats(): Promise<ApiResponse<{
  total: number;
  draft: number;
  published: number;
  archived: number;
  latestVersion?: string;
}>> {
  try {
    const session = await requireAdminSession();
    const db = await getDatabaseAdapter();

    const allReleases = await db.listReleases({ limit: 10000 });

    const draft = allReleases.filter((r) => r.status === "draft").length;
    const published = allReleases.filter((r) => r.status === "published").length;
    const archived = allReleases.filter((r) => r.status === "archived").length;

    // 获取最新已发布的版本
    const latestPublished = allReleases
      .filter((r) => r.status === "published")
      .sort((a, b) => b.published_at!.localeCompare(a.published_at!))[0];

    return {
      success: true,
      data: {
        total: allReleases.length,
        draft,
        published,
        archived,
        latestVersion: latestPublished?.version,
      },
    };
  } catch (error: any) {
    console.error("获取版本统计失败:", error);
    return {
      success: false,
      error: error.message || "获取版本统计失败",
    };
  }
}
