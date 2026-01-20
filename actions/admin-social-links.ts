"use server";

/**
 * 管理后台 - 社交链接管理 Server Actions
 *
 * 提供社交链接的创建、编辑、删除、列表查看等功能
 * 支持双数据库（CloudBase + Supabase）
 */

import { requireAdminSession } from "@/lib/admin/session";
import { getDatabaseAdapter } from "@/lib/admin/database";
import type {
  SocialLink,
  ApiResponse,
  CreateSocialLinkData,
  UpdateSocialLinkData,
} from "@/lib/admin/types";
import { revalidatePath } from "next/cache";

/**
 * 获取所有社交链接
 */
export async function listSocialLinks(): Promise<ApiResponse<SocialLink[]>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const links = await db.listSocialLinks();

    return {
      success: true,
      data: links,
    };
  } catch (error: any) {
    console.error("获取社交链接失败:", error);
    return {
      success: false,
      error: error.message || "获取社交链接失败",
    };
  }
}

/**
 * 根据 ID 获取社交链接
 */
export async function getSocialLinkById(
  linkId: string
): Promise<ApiResponse<SocialLink>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const link = await db.getSocialLinkById(linkId);

    if (!link) {
      return {
        success: false,
        error: "社交链接不存在",
      };
    }

    return {
      success: true,
      data: link,
    };
  } catch (error: any) {
    console.error("获取社交链接详情失败:", error);
    return {
      success: false,
      error: error.message || "获取社交链接详情失败",
    };
  }
}

/**
 * 创建社交链接
 */
export async function createSocialLink(
  data: CreateSocialLinkData
): Promise<ApiResponse<SocialLink>> {
  try {
    const session = await requireAdminSession();

    // 验证必填字段
    if (!data.icon || !data.title || !data.url) {
      return {
        success: false,
        error: "图标、标题和链接为必填项",
      };
    }

    const db = await getDatabaseAdapter();
    const link = await db.createSocialLink(data);

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "social_link.create",
      resource_type: "social_link",
      resource_id: link.id,
      details: { title: data.title },
    });

    // 重新验证缓存
    revalidatePath("/admin/social-links");
    revalidatePath("/");

    return {
      success: true,
      data: link,
    };
  } catch (error: any) {
    console.error("创建社交链接失败:", error);
    return {
      success: false,
      error: error.message || "创建社交链接失败",
    };
  }
}

/**
 * 更新社交链接
 */
export async function updateSocialLink(
  linkId: string,
  data: UpdateSocialLinkData
): Promise<ApiResponse<SocialLink>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const link = await db.updateSocialLink(linkId, data);

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "social_link.update",
      resource_type: "social_link",
      resource_id: linkId,
      details: data,
    });

    // 重新验证缓存
    revalidatePath("/admin/social-links");
    revalidatePath("/");

    return {
      success: true,
      data: link,
    };
  } catch (error: any) {
    console.error("更新社交链接失败:", error);
    return {
      success: false,
      error: error.message || "更新社交链接失败",
    };
  }
}

/**
 * 删除社交链接
 */
export async function deleteSocialLink(
  linkId: string
): Promise<ApiResponse<void>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();

    // 先获取链接信息用于日志
    const link = await db.getSocialLinkById(linkId);
    if (!link) {
      return {
        success: false,
        error: "社交链接不存在",
      };
    }

    await db.deleteSocialLink(linkId);

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "social_link.delete",
      resource_type: "social_link",
      resource_id: linkId,
      details: { title: link.title },
    });

    // 重新验证缓存
    revalidatePath("/admin/social-links");
    revalidatePath("/");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("删除社交链接失败:", error);
    return {
      success: false,
      error: error.message || "删除社交链接失败",
    };
  }
}

/**
 * 批量更新社交链接排序
 */
export async function updateSocialLinksOrder(
  updates: Array<{ id: string; order: number }>
): Promise<ApiResponse<void>> {
  try {
    const session = await requireAdminSession();
    const db = await getDatabaseAdapter();

    // 并发更新所有链接的排序
    await Promise.all(
      updates.map(({ id, order }) => db.updateSocialLink(id, { order }))
    );

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "social_link.update",
      resource_type: "social_link",
      details: { action: "bulk_update_order", count: updates.length },
    });

    // 重新验证缓存
    revalidatePath("/admin/social-links");
    revalidatePath("/");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("批量更新排序失败:", error);
    return {
      success: false,
      error: error.message || "批量更新排序失败",
    };
  }
}
