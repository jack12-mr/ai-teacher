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

// ============================================================================
// 文件管理相关
// ============================================================================

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CloudBaseConnector } from "@/lib/cloudbase/connector";

export interface SocialLinkFile {
  name: string;
  url: string;
  size?: number;
  lastModified?: string;
  source: "supabase" | "cloudbase";
  fileId?: string;
  linkId?: string;
}

export interface ListSocialLinkFilesResult {
  success: boolean;
  error?: string;
  supabaseFiles?: SocialLinkFile[];
  cloudbaseFiles?: SocialLinkFile[];
}

/**
 * 验证管理员权限
 */
async function requireAdminForFiles() {
  const session = await requireAdminSession();
  return session;
}

/**
 * 获取 CloudBase 客户端
 */
async function getCloudBaseForFiles() {
  const connector = new CloudBaseConnector();
  await connector.initialize();
  return {
    db: connector.getClient(),
    app: connector.getApp(),
  };
}

/**
 * 列出社交链接图标文件
 */
export async function listSocialLinkFiles(): Promise<ListSocialLinkFilesResult> {
  try {
    await requireAdminForFiles();

    const supabaseFiles: SocialLinkFile[] = [];
    const cloudbaseFiles: SocialLinkFile[] = [];

    // Supabase
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.storage
          .from("social-icons")
          .list("", { limit: 100 });

        if (!error && data) {
          for (const file of data) {
            const { data: urlData } = supabaseAdmin.storage
              .from("social-icons")
              .getPublicUrl(file.name);

            supabaseFiles.push({
              name: file.name,
              url: urlData.publicUrl,
              size: file.metadata?.size,
              lastModified: file.updated_at,
              source: "supabase",
            });
          }
        }
      } catch (err) {
        console.warn("List Supabase social icon files warning:", err);
      }
    }

    // CloudBase
    try {
      const connector = new CloudBaseConnector();
      await connector.initialize();
      const db = connector.getClient();
      const app = connector.getApp();

      const { data } = await db.collection("social_links").get();

      if (data && Array.isArray(data)) {
        const fileIdList: string[] = [];
        const linkMap: Map<string, { link: any; fileName: string }> = new Map();

        for (const link of data) {
          if (link.icon_url) {
            let fileId: string | null = null;
            let fileName: string;

            if (link.icon_url.startsWith("cloud://")) {
              fileId = link.icon_url;
              const pathParts = link.icon_url.split("/");
              fileName = pathParts[pathParts.length - 1] || link._id;
            } else {
              const urlParts = link.icon_url.split("/");
              fileName = urlParts[urlParts.length - 1]?.split("?")[0] || link._id;

              cloudbaseFiles.push({
                name: fileName,
                url: link.icon_url,
                size: link.file_size,
                lastModified: link.created_at,
                source: "cloudbase",
                fileId: undefined,
                linkId: link._id || link.id,
              });
              continue;
            }

            if (fileId) {
              fileIdList.push(fileId);
              linkMap.set(fileId, { link, fileName });
            }
          }
        }

        if (fileIdList.length > 0) {
          try {
            const urlResult = await app.getTempFileURL({
              fileList: fileIdList,
            });

            if (urlResult.fileList && Array.isArray(urlResult.fileList)) {
              for (const fileInfo of urlResult.fileList) {
                const mapEntry = linkMap.get(fileInfo.fileID);
                if (mapEntry) {
                  const { link, fileName } = mapEntry;
                  const isSuccess = fileInfo.code === "SUCCESS" && fileInfo.tempFileURL;
                  const displayUrl = isSuccess ? fileInfo.tempFileURL : link.icon_url;

                  cloudbaseFiles.push({
                    name: fileName,
                    url: displayUrl,
                    size: link.file_size,
                    lastModified: link.created_at,
                    source: "cloudbase",
                    fileId: fileInfo.fileID,
                    linkId: link._id || link.id,
                  });

                  linkMap.delete(fileInfo.fileID);
                }
              }
            }

            for (const [fileId, { link, fileName }] of linkMap) {
              cloudbaseFiles.push({
                name: fileName,
                url: link.icon_url,
                size: link.file_size,
                lastModified: link.created_at,
                source: "cloudbase",
                fileId: fileId,
                linkId: link._id || link.id,
              });
            }
          } catch (urlErr) {
            console.error("CloudBase getTempFileURL error:", urlErr);
            for (const [fileId, { link, fileName }] of linkMap) {
              cloudbaseFiles.push({
                name: fileName,
                url: link.icon_url,
                size: link.file_size,
                lastModified: link.created_at,
                source: "cloudbase",
                fileId: fileId,
                linkId: link._id || link.id,
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("List CloudBase social icon files error:", err);
    }

    return {
      success: true,
      supabaseFiles,
      cloudbaseFiles,
    };
  } catch (err) {
    console.error("List social link files error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "获取文件列表失败",
    };
  }
}

/**
 * 删除社交链接图标文件
 */
export async function deleteSocialLinkFile(
  fileName: string,
  source: "supabase" | "cloudbase",
  fileId?: string,
  linkId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminForFiles();

    if (source === "supabase") {
      if (!supabaseAdmin) {
        return { success: false, error: "Supabase 未配置" };
      }

      // 如果有关联的社交链接记录，先删除数据库记录
      if (linkId) {
        try {
          await supabaseAdmin.from("social_links").delete().eq("id", linkId);
          console.log("Supabase social link record deleted:", linkId);
        } catch (dbErr) {
          console.warn("Supabase delete social link record warning:", dbErr);
        }
      }

      const { error } = await supabaseAdmin.storage
        .from("social-icons")
        .remove([fileName]);

      if (error) {
        console.error("Supabase delete social icon error:", error);
        return { success: false, error: "删除文件失败" };
      }
    } else if (source === "cloudbase") {
      try {
        const connector = new CloudBaseConnector();
        await connector.initialize();
        const db = connector.getClient();
        const app = connector.getApp();

        if (linkId) {
          try {
            await db.collection("social_links").doc(linkId).remove();
          } catch (dbErr) {
            console.warn("CloudBase delete social link record warning:", dbErr);
          }
        }

        if (fileId && fileId.startsWith("cloud://")) {
          try {
            await app.deleteFile({ fileList: [fileId] });
          } catch (fileErr) {
            console.warn("CloudBase delete social icon file warning:", fileErr);
          }
        }
      } catch (err) {
        console.error("CloudBase delete social icon error:", err);
        return { success: false, error: "删除 CloudBase 文件失败" };
      }
    }

    revalidatePath("/admin/files");
    revalidatePath("/admin/social-links");
    return { success: true };
  } catch (err) {
    console.error("Delete social link file error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "删除文件失败",
    };
  }
}
