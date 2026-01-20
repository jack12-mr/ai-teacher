"use server";

/**
 * 管理后台 - 系统设置 Server Actions
 *
 * 提供系统配置的获取、设置、列表、删除等功能
 * 支持双数据库（CloudBase + Supabase）
 */

import { requireAdminSession } from "@/lib/admin/session";
import { getDatabaseAdapter } from "@/lib/admin/database";
import type {
  SystemConfig,
  ApiResponse,
  ConfigCategory,
} from "@/lib/admin/types";
import { revalidatePath } from "next/cache";

/**
 * 获取所有配置
 */
export async function listConfigs(
  category?: ConfigCategory
): Promise<ApiResponse<SystemConfig[]>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const configs = await db.listConfigs(category);

    return {
      success: true,
      data: configs,
    };
  } catch (error: any) {
    console.error("获取系统配置失败:", error);
    return {
      success: false,
      error: error.message || "获取系统配置失败",
    };
  }
}

/**
 * 获取单个配置值
 */
export async function getConfig(
  key: string
): Promise<ApiResponse<any>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    const value = await db.getConfig(key);

    return {
      success: true,
      data: value,
    };
  } catch (error: any) {
    console.error("获取配置值失败:", error);
    return {
      success: false,
      error: error.message || "获取配置值失败",
    };
  }
}

/**
 * 设置配置值
 */
export async function setConfig(
  key: string,
  value: any,
  category: ConfigCategory,
  description?: string
): Promise<ApiResponse<void>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();
    await db.setConfig(key, value, category, description);

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "config.update",
      resource_type: "config",
      details: { key, category },
    });

    // 重新验证缓存
    revalidatePath("/admin/settings");
    revalidatePath("/");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("设置配置失败:", error);
    return {
      success: false,
      error: error.message || "设置配置失败",
    };
  }
}

/**
 * 删除配置
 */
export async function deleteConfig(
  key: string
): Promise<ApiResponse<void>> {
  try {
    const session = await requireAdminSession();

    const db = await getDatabaseAdapter();

    // 先获取配置信息用于日志
    const configs = await db.listConfigs();
    const config = configs.find((c) => c.key === key);

    await db.deleteConfig(key);

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "config.update",
      resource_type: "config",
      details: { key, deleted: true, oldValue: config?.value },
    });

    // 重新验证缓存
    revalidatePath("/admin/settings");
    revalidatePath("/");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("删除配置失败:", error);
    return {
      success: false,
      error: error.message || "删除配置失败",
    };
  }
}

/**
 * 批量设置配置
 */
export async function setConfigs(
  configs: Array<{
    key: string;
    value: any;
    category: ConfigCategory;
    description?: string;
  }>
): Promise<ApiResponse<void>> {
  try {
    const session = await requireAdminSession();
    const db = await getDatabaseAdapter();

    // 并发设置所有配置
    await Promise.all(
      configs.map(({ key, value, category, description }) =>
        db.setConfig(key, value, category, description)
      )
    );

    // 记录操作日志
    await db.createLog({
      admin_id: session.adminId,
      admin_username: session.username,
      action: "config.update",
      resource_type: "config",
      details: { action: "bulk_update", count: configs.length },
    });

    // 重新验证缓存
    revalidatePath("/admin/settings");
    revalidatePath("/");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("批量设置配置失败:", error);
    return {
      success: false,
      error: error.message || "批量设置配置失败",
    };
  }
}

/**
 * 获取按分类分组的配置
 */
export async function getConfigsByCategory(): Promise<ApiResponse<
  Record<ConfigCategory, SystemConfig[]>
>> {
  try {
    const session = await requireAdminSession();
    const db = await getDatabaseAdapter();

    const categories: ConfigCategory[] = [
      "general",
      "payment",
      "ai",
      "storage",
      "security",
      "notification",
    ];

    const result: Record<string, SystemConfig[]> = {};

    for (const category of categories) {
      result[category] = await db.listConfigs(category);
    }

    return {
      success: true,
      data: result as Record<ConfigCategory, SystemConfig[]>,
    };
  } catch (error: any) {
    console.error("获取分类配置失败:", error);
    return {
      success: false,
      error: error.message || "获取分类配置失败",
    };
  }
}
