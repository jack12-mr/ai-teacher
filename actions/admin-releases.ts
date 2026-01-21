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

// ============================================================================
// 文件管理相关
// ============================================================================

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CloudBaseConnector } from "@/lib/cloudbase/connector";

// 平台类型
type Platform = "ios" | "android" | "windows" | "macos" | "linux";

export interface ReleaseFile {
  name: string;
  url: string;
  size?: number;
  lastModified?: string;
  source: "supabase" | "cloudbase";
  fileId?: string;
  releaseId?: string;
  version?: string;
  platform?: Platform;
}

export interface ListReleaseFilesResult {
  success: boolean;
  error?: string;
  supabaseFiles?: ReleaseFile[];
  cloudbaseFiles?: ReleaseFile[];
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
 * 列出发布版本文件 - 两个云存储
 */
export async function listReleaseFiles(): Promise<ListReleaseFilesResult> {
  try {
    const session = await requireAdminSession();

    const supabaseFiles: ReleaseFile[] = [];
    const cloudbaseFiles: ReleaseFile[] = [];

    // 获取 Supabase Storage 文件
    if (supabaseAdmin) {
      try {
        // 获取 releases bucket 文件列表
        const { data: files, error } = await supabaseAdmin.storage
          .from("releases")
          .list("", { limit: 100 });

        if (!error && files) {
          // 同时获取数据库中的版本信息
          const { data: releases } = await supabaseAdmin
            .from("app_releases")
            .select("id, version, platform, file_url, file_size, created_at");

          // 创建 URL -> release 映射
          const urlToRelease = new Map<string, any>();
          if (releases) {
            for (const release of releases) {
              if (release.file_url) {
                const urlParts = release.file_url.split("/releases/");
                if (urlParts.length > 1) {
                  const fileName = decodeURIComponent(urlParts[1].split("?")[0]);
                  urlToRelease.set(fileName, release);
                }
              }
            }
          }

          for (const file of files) {
            if (file.name === ".emptyFolderPlaceholder") continue;

            const { data: urlData } = supabaseAdmin.storage
              .from("releases")
              .getPublicUrl(file.name);

            const release = urlToRelease.get(file.name);

            supabaseFiles.push({
              name: file.name,
              url: urlData.publicUrl,
              size: release?.file_size || file.metadata?.size,
              lastModified: release?.created_at || file.updated_at,
              source: "supabase",
              releaseId: release?.id,
              version: release?.version,
              platform: release?.platform,
            });
          }
        }
      } catch (err) {
        console.warn("List Supabase release files warning:", err);
      }
    }

    // 获取 CloudBase Storage 文件
    try {
      const connector = new CloudBaseConnector();
      await connector.initialize();
      const db = connector.getClient();
      const app = connector.getApp();

      const { data } = await db.collection("app_releases").get();

      if (data && Array.isArray(data)) {
        const fileIdList: string[] = [];
        const releaseMap: Map<string, { release: any; fileName: string }> = new Map();

        for (const release of data) {
          if (release.file_url) {
            let fileId: string | null = null;
            let fileName: string;

            if (release.file_url.startsWith("cloud://")) {
              fileId = release.file_url;
              const pathParts = release.file_url.split("/");
              fileName = pathParts[pathParts.length - 1] || release._id;
            } else {
              const urlParts = release.file_url.split("/");
              fileName = urlParts[urlParts.length - 1]?.split("?")[0] || release._id;

              cloudbaseFiles.push({
                name: fileName,
                url: release.file_url,
                size: release.file_size,
                lastModified: release.created_at,
                source: "cloudbase",
                fileId: undefined,
                releaseId: release._id || release.id,
                version: release.version,
                platform: release.platform,
              });
              continue;
            }

            if (fileId) {
              fileIdList.push(fileId);
              releaseMap.set(fileId, { release, fileName });
            }
          }
        }

        // 批量获取临时访问 URL
        if (fileIdList.length > 0) {
          try {
            const urlResult = await app.getTempFileURL({
              fileList: fileIdList,
            });

            if (urlResult.fileList && Array.isArray(urlResult.fileList)) {
              for (const fileInfo of urlResult.fileList) {
                const mapEntry = releaseMap.get(fileInfo.fileID);
                if (mapEntry) {
                  const { release, fileName } = mapEntry;
                  const isSuccess = fileInfo.code === "SUCCESS" && fileInfo.tempFileURL;
                  const displayUrl = isSuccess ? fileInfo.tempFileURL : release.file_url;

                  cloudbaseFiles.push({
                    name: fileName,
                    url: displayUrl,
                    size: release.file_size,
                    lastModified: release.created_at,
                    source: "cloudbase",
                    fileId: fileInfo.fileID,
                    releaseId: release._id || release.id,
                    version: release.version,
                    platform: release.platform,
                  });

                  releaseMap.delete(fileInfo.fileID);
                }
              }
            }

            // 处理未能获取临时 URL 的文件
            for (const [fileId, { release, fileName }] of releaseMap) {
              cloudbaseFiles.push({
                name: fileName,
                url: release.file_url,
                size: release.file_size,
                lastModified: release.created_at,
                source: "cloudbase",
                fileId: fileId,
                releaseId: release._id || release.id,
                version: release.version,
                platform: release.platform,
              });
            }
          } catch (urlErr) {
            console.error("CloudBase getTempFileURL error:", urlErr);
            for (const [fileId, { release, fileName }] of releaseMap) {
              cloudbaseFiles.push({
                name: fileName,
                url: release.file_url,
                size: release.file_size,
                lastModified: release.created_at,
                source: "cloudbase",
                fileId: fileId,
                releaseId: release._id || release.id,
                version: release.version,
                platform: release.platform,
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("List CloudBase release files error:", err);
    }

    return {
      success: true,
      supabaseFiles,
      cloudbaseFiles,
    };
  } catch (err) {
    console.error("List release files error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "获取文件列表失败",
    };
  }
}

/**
 * 删除发布版本文件
 */
export async function deleteReleaseFile(
  fileName: string,
  source: "supabase" | "cloudbase",
  fileId?: string,
  releaseId?: string
): Promise<FileOperationResult> {
  try {
    const session = await requireAdminSession();

    if (source === "supabase") {
      if (!supabaseAdmin) {
        return { success: false, error: "Supabase 未配置" };
      }

      // 删除存储文件
      const { error } = await supabaseAdmin.storage
        .from("releases")
        .remove([fileName]);

      if (error) {
        console.error("Supabase delete file error:", error);
        return { success: false, error: "删除文件失败" };
      }

      // 如果有关联的版本记录，也删除
      if (releaseId) {
        await supabaseAdmin.from("app_releases").delete().eq("id", releaseId);
      }
    } else if (source === "cloudbase") {
      try {
        const connector = new CloudBaseConnector();
        await connector.initialize();
        const db = connector.getClient();
        const app = connector.getApp();

        // 删除版本记录
        if (releaseId) {
          try {
            await db.collection("app_releases").doc(releaseId).remove();
          } catch (dbErr) {
            console.warn("CloudBase delete release record warning:", dbErr);
          }
        }

        // 删除存储文件
        if (fileId && fileId.startsWith("cloud://")) {
          try {
            await app.deleteFile({ fileList: [fileId] });
          } catch (fileErr) {
            console.warn("CloudBase delete file warning:", fileErr);
          }
        }
      } catch (err) {
        console.error("CloudBase delete error:", err);
        return { success: false, error: "删除 CloudBase 文件失败" };
      }
    }

    revalidatePath("/admin/files");
    revalidatePath("/admin/releases");
    return { success: true };
  } catch (err) {
    console.error("Delete release file error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "删除文件失败",
    };
  }
}

/**
 * 下载发布版本文件
 */
export async function downloadReleaseFile(
  fileName: string,
  source: "supabase" | "cloudbase",
  fileId?: string
): Promise<DownloadResult> {
  try {
    const session = await requireAdminSession();

    if (source === "supabase") {
      if (!supabaseAdmin) {
        return { success: false, error: "Supabase 未配置" };
      }

      const { data, error } = await supabaseAdmin.storage
        .from("releases")
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

      // 根据文件扩展名推断 contentType
      const ext = fileName.split(".").pop()?.toLowerCase();
      let contentType = "application/octet-stream";
      if (ext) {
        const mimeTypes: Record<string, string> = {
          apk: "application/vnd.android.package-archive",
          ipa: "application/octet-stream",
          exe: "application/x-msdownload",
          dmg: "application/x-apple-diskimage",
          deb: "application/vnd.debian.binary-package",
          rpm: "application/x-rpm",
          zip: "application/zip",
          appimage: "application/x-executable",
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
    console.error("Download release file error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "下载文件失败",
    };
  }
}
