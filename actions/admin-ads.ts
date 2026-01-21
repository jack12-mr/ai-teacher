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
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CloudBaseConnector } from "@/lib/cloudbase/connector";

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

// ============================================================
// 文件管理相关类型和函数
// ============================================================

export interface StorageFile {
  name: string;
  url: string;
  size?: number;
  lastModified?: string;
  source: "supabase" | "cloudbase";
  fileId?: string;
  adId?: string;
}

export interface ListFilesResult {
  success: boolean;
  error?: string;
  supabaseFiles?: StorageFile[];
  cloudbaseFiles?: StorageFile[];
}

export interface FileOperationResult {
  success: boolean;
  error?: string;
}

export interface DownloadResult {
  success: boolean;
  error?: string;
  data?: string;
  contentType?: string;
  fileName?: string;
}

/**
 * 列出存储文件 - 两个云存储
 */
export async function listStorageFiles(): Promise<ListFilesResult> {
  try {
    await requireAdminSession();

    const supabaseFiles: StorageFile[] = [];
    const cloudbaseFiles: StorageFile[] = [];

    // 获取 Supabase Storage 文件
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.storage
          .from("ads")
          .list("", { limit: 100 });

        if (!error && data) {
          for (const file of data) {
            const { data: urlData } = supabaseAdmin.storage
              .from("ads")
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
        console.warn("List Supabase files warning:", err);
      }
    }

    // 获取 CloudBase Storage 文件
    try {
      const connector = new CloudBaseConnector();
      await connector.initialize();
      const db = connector.getClient();
      const app = connector.getApp();

      const { data } = await db.collection("advertisements").get();

      if (data && Array.isArray(data)) {
        const fileIdList: string[] = [];
        const adMap: Map<string, { ad: any; fileName: string }> = new Map();

        for (const ad of data) {
          if (ad.media_url) {
            let fileId: string | null = null;
            let fileName: string;

            if (ad.media_url.startsWith("cloud://")) {
              fileId = ad.media_url;
              const pathParts = ad.media_url.split("/");
              fileName = pathParts[pathParts.length - 1] || ad._id;
            } else {
              const urlParts = ad.media_url.split("/");
              fileName = urlParts[urlParts.length - 1]?.split("?")[0] || ad._id;

              cloudbaseFiles.push({
                name: fileName,
                url: ad.media_url,
                size: ad.file_size,
                lastModified: ad.created_at,
                source: "cloudbase",
                fileId: undefined,
                adId: ad._id || ad.id,
              });
              continue;
            }

            if (fileId) {
              fileIdList.push(fileId);
              adMap.set(fileId, { ad, fileName });
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
                const mapEntry = adMap.get(fileInfo.fileID);
                if (mapEntry) {
                  const { ad, fileName } = mapEntry;
                  const isSuccess = fileInfo.code === "SUCCESS" && fileInfo.tempFileURL;
                  const displayUrl = isSuccess ? fileInfo.tempFileURL : ad.media_url;

                  cloudbaseFiles.push({
                    name: fileName,
                    url: displayUrl,
                    size: ad.file_size,
                    lastModified: ad.created_at,
                    source: "cloudbase",
                    fileId: fileInfo.fileID,
                    adId: ad._id || ad.id,
                  });

                  adMap.delete(fileInfo.fileID);
                }
              }
            }

            for (const [fileId, { ad, fileName }] of adMap) {
              cloudbaseFiles.push({
                name: fileName,
                url: ad.media_url,
                size: ad.file_size,
                lastModified: ad.created_at,
                source: "cloudbase",
                fileId: fileId,
                adId: ad._id || ad.id,
              });
            }
          } catch (urlErr) {
            console.error("CloudBase getTempFileURL error:", urlErr);
            for (const [fileId, { ad, fileName }] of adMap) {
              cloudbaseFiles.push({
                name: fileName,
                url: ad.media_url,
                size: ad.file_size,
                lastModified: ad.created_at,
                source: "cloudbase",
                fileId: fileId,
                adId: ad._id || ad.id,
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("List CloudBase files error:", err);
    }

    return {
      success: true,
      supabaseFiles,
      cloudbaseFiles,
    };
  } catch (err) {
    console.error("List storage files error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "获取文件列表失败",
    };
  }
}

/**
 * 删除存储文件
 */
export async function deleteStorageFile(
  fileName: string,
  source: "supabase" | "cloudbase",
  fileId?: string,
  adId?: string
): Promise<FileOperationResult> {
  try {
    await requireAdminSession();

    if (source === "supabase") {
      if (!supabaseAdmin) {
        return { success: false, error: "Supabase 未配置" };
      }

      if (adId) {
        try {
          const db = await getDatabaseAdapter();
          await db.deleteAd(adId);
          console.log("Supabase ad record deleted:", adId);
        } catch (dbErr) {
          console.warn("Supabase delete ad record warning:", dbErr);
        }
      }

      const { error } = await supabaseAdmin.storage
        .from("ads")
        .remove([fileName]);

      if (error) {
        console.error("Supabase delete file error:", error);
        return { success: false, error: "删除文件失败" };
      }
    } else if (source === "cloudbase") {
      try {
        const connector = new CloudBaseConnector();
        await connector.initialize();
        const db = connector.getClient();
        const app = connector.getApp();

        if (adId) {
          try {
            await db.collection("advertisements").doc(adId).remove();
            console.log("CloudBase ad record deleted:", adId);
          } catch (dbErr) {
            console.warn("CloudBase delete ad record warning:", dbErr);
          }
        }

        if (fileId && fileId.startsWith("cloud://")) {
          try {
            await app.deleteFile({ fileList: [fileId] });
            console.log("CloudBase file deleted:", fileId);
          } catch (fileErr) {
            console.warn("CloudBase delete file warning:", fileErr);
          }
        } else {
          console.log("No valid CloudBase fileId provided, skipping file deletion");
        }
      } catch (err) {
        console.error("CloudBase delete error:", err);
        return { success: false, error: "删除 CloudBase 文件失败" };
      }
    }

    revalidatePath("/admin/files");
    revalidatePath("/admin/ads");
    return { success: true };
  } catch (err) {
    console.error("Delete storage file error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "删除文件失败",
    };
  }
}

/**
 * 重命名存储文件（Supabase）
 */
export async function renameStorageFile(
  oldName: string,
  newName: string,
  source: "supabase" | "cloudbase"
): Promise<FileOperationResult> {
  try {
    await requireAdminSession();

    if (source === "supabase") {
      if (!supabaseAdmin) {
        return { success: false, error: "Supabase 未配置" };
      }

      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from("ads")
        .download(oldName);

      if (downloadError || !fileData) {
        console.error("Supabase download error:", downloadError);
        return { success: false, error: "下载原文件失败" };
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      const { error: uploadError } = await supabaseAdmin.storage
        .from("ads")
        .upload(newName, buffer, {
          contentType: fileData.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return { success: false, error: "上传新文件失败" };
      }

      const { error: deleteError } = await supabaseAdmin.storage
        .from("ads")
        .remove([oldName]);

      if (deleteError) {
        console.warn("Supabase delete old file warning:", deleteError);
      }

      const { data: urlData } = supabaseAdmin.storage
        .from("ads")
        .getPublicUrl(newName);

      const oldUrl = supabaseAdmin.storage.from("ads").getPublicUrl(oldName).data.publicUrl;

      await supabaseAdmin
        .from("advertisements")
        .update({ media_url: urlData.publicUrl })
        .eq("media_url", oldUrl);

    } else if (source === "cloudbase") {
      return { success: false, error: "CloudBase 暂不支持重命名文件（需要提供 fileId 和 adId）" };
    }

    revalidatePath("/admin/files");
    revalidatePath("/admin/ads");
    return { success: true };
  } catch (err) {
    console.error("Rename storage file error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "重命名文件失败",
    };
  }
}

/**
 * CloudBase 文件重命名（需要 fileId 和 adId）
 */
export async function renameCloudBaseFile(
  oldName: string,
  newName: string,
  fileId: string,
  adId: string
): Promise<FileOperationResult> {
  try {
    await requireAdminSession();

    if (!fileId || !fileId.startsWith("cloud://")) {
      return { success: false, error: "无效的 CloudBase fileId" };
    }

    const connector = new CloudBaseConnector();
    await connector.initialize();
    const db = connector.getClient();
    const app = connector.getApp();

    console.log("CloudBase rename: downloading file", fileId);
    const downloadResult = await app.downloadFile({
      fileID: fileId,
    });

    if (!downloadResult.fileContent) {
      console.error("CloudBase download failed: no fileContent");
      return { success: false, error: "下载原文件失败" };
    }

    const newCloudPath = `ads/${newName}`;
    console.log("CloudBase rename: uploading to", newCloudPath);
    const uploadResult = await app.uploadFile({
      cloudPath: newCloudPath,
      fileContent: downloadResult.fileContent,
    });

    if (!uploadResult.fileID) {
      console.error("CloudBase upload failed: no fileID returned");
      return { success: false, error: "上传新文件失败" };
    }

    console.log("CloudBase rename: new fileID", uploadResult.fileID);

    try {
      await db.collection("advertisements").doc(adId).update({
        media_url: uploadResult.fileID,
      });
      console.log("CloudBase rename: database updated");
    } catch (dbErr) {
      console.error("CloudBase rename: database update failed", dbErr);
      try {
        await app.deleteFile({ fileList: [uploadResult.fileID] });
      } catch {}
      return { success: false, error: "更新数据库记录失败" };
    }

    try {
      await app.deleteFile({ fileList: [fileId] });
      console.log("CloudBase rename: old file deleted");
    } catch (deleteErr) {
      console.warn("CloudBase rename: delete old file warning", deleteErr);
    }

    revalidatePath("/admin/files");
    revalidatePath("/admin/ads");
    return { success: true };
  } catch (err) {
    console.error("CloudBase rename error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "重命名文件失败",
    };
  }
}

/**
 * 下载存储文件
 */
export async function downloadStorageFile(
  fileName: string,
  source: "supabase" | "cloudbase",
  fileId?: string
): Promise<DownloadResult> {
  try {
    await requireAdminSession();

    if (source === "supabase") {
      if (!supabaseAdmin) {
        return { success: false, error: "Supabase 未配置" };
      }

      const { data, error } = await supabaseAdmin.storage
        .from("ads")
        .download(fileName);

      if (error || !data) {
        console.error("Supabase download error:", error);
        return { success: false, error: "下载文件失败" };
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      return {
        success: true,
        data: buffer.toString("base64"),
        contentType: data.type,
        fileName,
      };
    } else if (source === "cloudbase") {
      if (!fileId || !fileId.startsWith("cloud://")) {
        return { success: false, error: "无效的 CloudBase fileId" };
      }

      const connector = new CloudBaseConnector();
      await connector.initialize();
      const app = connector.getApp();

      const downloadResult = await app.downloadFile({
        fileID: fileId,
      });

      if (!downloadResult.fileContent) {
        console.error("CloudBase download failed: no fileContent");
        return { success: false, error: "下载文件失败" };
      }

      const buffer = Buffer.from(downloadResult.fileContent);

      const ext = fileName.split(".").pop()?.toLowerCase();
      let contentType = "application/octet-stream";
      if (ext) {
        const mimeTypes: Record<string, string> = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          gif: "image/gif",
          webp: "image/webp",
          svg: "image/svg+xml",
          mp4: "video/mp4",
          webm: "video/webm",
          mov: "video/quicktime",
          avi: "video/x-msvideo",
        };
        contentType = mimeTypes[ext] || contentType;
      }

      return {
        success: true,
        data: buffer.toString("base64"),
        contentType,
        fileName,
      };
    }

    return { success: false, error: "不支持的数据源" };
  } catch (err) {
    console.error("Download storage file error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "下载文件失败",
    };
  }
}
