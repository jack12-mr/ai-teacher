"use server";

/**
 * 发布版本管理 Server Actions
 * 根据环境变量自动选择数据库：Supabase (国际版) 或 CloudBase (国内版)
 * 专注于移动端/桌面应用版本管理
 */

import { getDatabaseAdapter } from "@/lib/admin/database";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CloudBaseConnector } from "@/lib/cloudbase/connector";
import { getAdminSession } from "@/lib/admin/session";
import { revalidatePath } from "next/cache";
import { RegionConfig } from "@/lib/config/region";

// 平台类型
export type Platform = "ios" | "android" | "windows" | "macos" | "linux";

// 变体类型（针对不同架构/格式）
export type Variant =
  | "default"
  // macOS
  | "intel" | "m"
  // Windows
  | "x64" | "x86" | "arm64"
  // Linux
  | "deb" | "appimage" | "snap" | "flatpak" | "aur" | "rpm";

// 发布版本类型定义
export interface AppRelease {
  id: string;
  version: string;
  platform: Platform;
  variant?: Variant;
  file_url: string;
  file_size?: number;
  release_notes?: string;
  is_active: boolean;
  is_mandatory: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreateReleaseResult {
  success: boolean;
  error?: string;
  data?: AppRelease;
}

export interface UpdateReleaseResult {
  success: boolean;
  error?: string;
}

export interface DeleteReleaseResult {
  success: boolean;
  error?: string;
}

export interface ListReleasesResult {
  success: boolean;
  error?: string;
  data?: AppRelease[];
}

/**
 * 验证管理员权限
 */
async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("未授权访问");
  }
  return session;
}

/**
 * 获取 CloudBase 客户端
 */
async function getCloudBase() {
  const connector = new CloudBaseConnector();
  await connector.initialize();
  return {
    db: connector.getClient(),
    app: connector.getApp(),
  };
}

/**
 * 上传文件到 Supabase Storage
 */
async function uploadToSupabase(
  file: File,
  fileName: string
): Promise<string | null> {
  if (!supabaseAdmin) return null;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = `${fileName}`;

    const { error } = await supabaseAdmin.storage
      .from("releases")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return null;
    }

    // 获取公开 URL
    const { data: urlData } = supabaseAdmin.storage
      .from("releases")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (err) {
    console.error("Supabase upload exception:", err);
    return null;
  }
}

/**
 * 上传文件到 CloudBase Storage - 使用API路由避免Server Actions限制
 */
async function uploadToCloudBase(
  file: File,
  fileName: string
): Promise<string | null> {
  try {
    // 检查文件大小（最大500MB）
    const MAX_FILE_SIZE = 500 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      console.error("File too large:", file.size);
      throw new Error("文件太大，最大支持500MB");
    }

    console.log("CloudBase uploading via API:", {
      fileSize: file.size,
      fileName
    });

    // 使用API路由上传，避免Server Actions的FormData限制
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", fileName);

    const response = await fetch("/api/upload/release", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "上传失败");
    }

    const result = await response.json();
    console.log("CloudBase upload success:", result.fileID);
    return result.fileID;
  } catch (err) {
    console.error("CloudBase upload exception:", err);
    throw err;
  }
}

/**
 * 创建发布版本 - 根据当前环境自动选择数据库
 */
export async function createRelease(
  formData: FormData
): Promise<CreateReleaseResult> {
  try {
    console.log("[createRelease] 函数开始执行");
    await requireAdmin();
    console.log("[createRelease] 权限验证通过");

    console.log("[createRelease] 开始读取FormData");
    const version = formData.get("version") as string;
    const platform = formData.get("platform") as Platform;
    const variant = (formData.get("variant") as Variant) || undefined;
    const releaseNotes = formData.get("releaseNotes") as string;
    const isActive = formData.get("isActive") === "true";
    const isMandatory = formData.get("isMandatory") === "true";

    // 文件已经通过API路由上传，这里只接收fileID和元数据
    const cloudbaseFileId = formData.get("cloudbaseFileId") as string | null;
    const fileName = formData.get("fileName") as string | null;
    const fileSizeStr = formData.get("fileSize") as string | null;
    const fileSize = fileSizeStr ? parseInt(fileSizeStr, 10) : 0;

    console.log("[createRelease] FormData读取完成:", {
      version,
      platform,
      variant,
      hasCloudbaseFileId: !!cloudbaseFileId,
      fileName,
      fileSize,
      region: RegionConfig.region
    });

    if (!version || !platform) {
      return { success: false, error: "请填写必要字段" };
    }

    if (!cloudbaseFileId) {
      return { success: false, error: "文件上传失败,请重试" };
    }

    console.log("[createRelease] 验证通过，准备写入数据库");

    // 生成 UUID
    const id = crypto.randomUUID();

    // 根据当前环境选择数据库
    if (RegionConfig.region === "INTL") {
      // 国际版：文件已经在 /api/upload/release 中上传到 Supabase Storage
      // cloudbaseFileId 实际上是 Supabase 的公开 URL
      console.log("[createRelease] 国际版：直接使用 Supabase URL");

      if (!supabaseAdmin) {
        return { success: false, error: "Supabase 未配置" };
      }

      try {
        const { error } = await supabaseAdmin.from("releases").insert({
          id,
          version,
          platform,
          variant: variant || null,
          file_url: cloudbaseFileId, // 这里是 Supabase Storage 的公开 URL
          file_size: fileSize,
          release_notes: releaseNotes || null,
          is_active: isActive,
          is_mandatory: isMandatory,
        });

        if (error) {
          console.error("[createRelease] Supabase insert error:", error);
          return { success: false, error: "保存到 Supabase 失败" };
        }

        revalidatePath("/admin/releases");

        return {
          success: true,
          data: {
            id,
            version,
            platform,
            variant,
            file_url: cloudbaseFileId,
            file_size: fileSize,
            release_notes: releaseNotes || undefined,
            is_active: isActive,
            is_mandatory: isMandatory,
            created_at: new Date().toISOString(),
          },
        };
      } catch (err) {
        console.error("[createRelease] 国际版保存失败:", err);
        return { success: false, error: "创建发布版本失败" };
      }
    } else {
      // 国内版：直接使用CloudBase fileID保存到CloudBase数据库
      try {
        const { db } = await getCloudBase();
        await db.collection("releases").doc(id).set({
          version,
          platform,
          variant: variant || null,
          file_url: cloudbaseFileId,
          file_size: fileSize,
          release_notes: releaseNotes || null,
          is_active: isActive,
          is_mandatory: isMandatory,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        revalidatePath("/admin/releases");

        return {
          success: true,
          data: {
            id,
            version,
            platform,
            variant,
            file_url: cloudbaseFileId,
            file_size: fileSize,
            release_notes: releaseNotes || undefined,
            is_active: isActive,
            is_mandatory: isMandatory,
            created_at: new Date().toISOString(),
          },
        };
      } catch (err) {
        console.error("CloudBase insert error:", err);
        return { success: false, error: "保存到 CloudBase 失败" };
      }
    }
  } catch (err) {
    console.error("Create release error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "创建发布版本失败",
    };
  }
}

/**
 * 获取发布版本列表 - 根据当前环境查询对应数据库
 */
export async function listReleases(): Promise<ListReleasesResult> {
  try {
    await requireAdmin();

    const releases: AppRelease[] = [];

    if (RegionConfig.region === "INTL") {
      // 国际版：从 Supabase 获取
      if (supabaseAdmin) {
        try {
          const { data, error } = await supabaseAdmin
            .from("releases")
            .select("*")
            .order("created_at", { ascending: false });

          if (!error && data) {
            releases.push(...data);
          }
        } catch (err) {
          console.warn("Supabase list warning:", err);
        }
      }
    } else {
      // 国内版：从 CloudBase 获取
      try {
        const connector = new CloudBaseConnector();
        await connector.initialize();
        const db = connector.getClient();
        const app = connector.getApp();

        const { data } = await db
          .collection("releases")
          .orderBy("created_at", "desc")
          .get();

        console.log("CloudBase releases count:", data?.length || 0);

        if (data && Array.isArray(data)) {
          // 收集需要获取临时 URL 的 fileID
          const cloudbaseReleases: { release: any; fileId: string }[] = [];

          for (const release of data) {
            const id = release._id || release.id;
            let fileId: string | null = null;

            // 检查 file_url 是否是 fileID 格式
            if (release.file_url && release.file_url.startsWith("cloud://")) {
              fileId = release.file_url;
              cloudbaseReleases.push({ release: { ...release, id }, fileId });
            }

            releases.push({
              id,
              version: release.version,
              platform: release.platform,
              variant: release.variant,
              file_url: release.file_url,
              file_size: release.file_size,
              release_notes: release.release_notes,
              is_active: release.is_active,
              is_mandatory: release.is_mandatory,
              created_at: release.created_at,
              updated_at: release.updated_at,
            });
          }

          // 批量获取 CloudBase 文件的临时 URL
          if (cloudbaseReleases.length > 0) {
            try {
              const fileIds = cloudbaseReleases.map((item) => item.fileId);
              const urlResult = await app.getTempFileURL({
                fileList: fileIds,
              });

              if (urlResult.fileList && Array.isArray(urlResult.fileList)) {
                const urlMap = new Map<string, string>();
                for (const fileInfo of urlResult.fileList) {
                  if (fileInfo.tempFileURL && fileInfo.code === "SUCCESS") {
                    urlMap.set(fileInfo.fileID, fileInfo.tempFileURL);
                  }
                }

                // 更新 releases 中的 file_url
                for (const release of releases) {
                  if (release.file_url && release.file_url.startsWith("cloud://")) {
                    const tempUrl = urlMap.get(release.file_url);
                    if (tempUrl) {
                      release.file_url = tempUrl;
                    }
                  }
                }
              }
            } catch (urlErr) {
              console.error("CloudBase getTempFileURL error:", urlErr);
            }
          }
        }
      } catch (err) {
        console.error("CloudBase list error:", err);
      }
    }

    // 按创建时间排序
    releases.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return { success: true, data: releases };
  } catch (err) {
    console.error("List releases error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "获取发布版本列表失败",
    };
  }
}

/**
 * 更新发布版本 - 根据当前环境更新对应数据库
 */
export async function updateRelease(
  id: string,
  formData: FormData
): Promise<UpdateReleaseResult> {
  try {
    await requireAdmin();

    const releaseNotes = formData.get("releaseNotes") as string;
    const isActive = formData.get("isActive") === "true";
    const isMandatory = formData.get("isMandatory") === "true";

    const updates = {
      release_notes: releaseNotes || null,
      is_active: isActive,
      is_mandatory: isMandatory,
      updated_at: new Date().toISOString(),
    };

    if (RegionConfig.region === "INTL") {
      // 国际版：更新 Supabase
      if (!supabaseAdmin) {
        return { success: false, error: "Supabase 未配置" };
      }

      const { error } = await supabaseAdmin.from("releases").update(updates).eq("id", id);

      if (error) {
        console.error("Supabase update error:", error);
        return { success: false, error: "更新失败" };
      }
    } else {
      // 国内版：更新 CloudBase
      try {
        const { db } = await getCloudBase();
        await db.collection("releases").doc(id).update(updates);
      } catch (err) {
        console.error("CloudBase update error:", err);
        return { success: false, error: "更新失败" };
      }
    }

    revalidatePath("/admin/releases");

    return { success: true };
  } catch (err) {
    console.error("Update release error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "更新发布版本失败",
    };
  }
}

/**
 * 切换发布版本状态（启用/禁用）- 根据当前环境更新对应数据库
 */
export async function toggleReleaseStatus(
  id: string,
  isActive: boolean
): Promise<UpdateReleaseResult> {
  try {
    await requireAdmin();

    const updates = {
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    if (RegionConfig.region === "INTL") {
      // 国际版：更新 Supabase
      if (!supabaseAdmin) {
        return { success: false, error: "Supabase 未配置" };
      }

      const { error } = await supabaseAdmin.from("releases").update(updates).eq("id", id);

      if (error) {
        console.error("Supabase toggle error:", error);
        return { success: false, error: "切换状态失败" };
      }
    } else {
      // 国内版：更新 CloudBase
      try {
        const { db } = await getCloudBase();
        await db.collection("releases").doc(id).update(updates);
      } catch (err) {
        console.error("CloudBase toggle error:", err);
        return { success: false, error: "切换状态失败" };
      }
    }

    revalidatePath("/admin/releases");

    return { success: true };
  } catch (err) {
    console.error("Toggle release error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "切换状态失败",
    };
  }
}

/**
 * 删除发布版本 - 根据当前环境删除对应数据库
 */
export async function deleteRelease(id: string): Promise<DeleteReleaseResult> {
  try {
    await requireAdmin();

    if (RegionConfig.region === "INTL") {
      // 国际版：删除 Supabase
      if (!supabaseAdmin) {
        return { success: false, error: "Supabase 未配置" };
      }

      // 先获取版本信息以便删除存储文件
      const { data } = await supabaseAdmin
        .from("releases")
        .select("file_url")
        .eq("id", id)
        .single();

      const fileUrl = data?.file_url;

      // 删除数据库记录
      const { error } = await supabaseAdmin.from("releases").delete().eq("id", id);

      if (error) {
        console.error("Supabase delete error:", error);
        return { success: false, error: "删除失败" };
      }

      // 尝试删除存储文件（可选，不影响主流程）
      if (fileUrl) {
        try {
          const urlParts = fileUrl.split("/releases/");
          if (urlParts.length > 1) {
            const fileName = urlParts[1].split("?")[0];
            await supabaseAdmin.storage.from("releases").remove([fileName]);
          }
        } catch (err) {
          console.warn("Delete storage file warning:", err);
        }
      }
    } else {
      // 国内版：删除 CloudBase
      try {
        const { db, app } = await getCloudBase();

        // 先获取版本信息以便删除存储文件
        const { data } = await db.collection("releases").doc(id).get();
        const fileUrl = data?.data?.[0]?.file_url;

        // 删除数据库记录
        await db.collection("releases").doc(id).remove();

        // 尝试删除存储文件（可选，不影响主流程）
        if (fileUrl && fileUrl.startsWith("cloud://")) {
          try {
            await app.deleteFile({ fileList: [fileUrl] });
          } catch (err) {
            console.warn("Delete CloudBase file warning:", err);
          }
        }
      } catch (err) {
        console.error("CloudBase delete error:", err);
        return { success: false, error: "删除失败" };
      }
    }

    revalidatePath("/admin/releases");

    return { success: true };
  } catch (err) {
    console.error("Delete release error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "删除发布版本失败",
    };
  }
}

/**
 * 获取最新版本（按平台）- 根据当前环境查询对应数据库
 * 用于客户端检查更新
 */
export async function getLatestRelease(
  platform: Platform
): Promise<{ success: boolean; data?: AppRelease; error?: string }> {
  try {
    if (RegionConfig.region === "INTL") {
      // 国际版：从 Supabase 获取
      if (!supabaseAdmin) {
        return { success: false, error: "Supabase 未配置" };
      }

      const { data, error } = await supabaseAdmin
        .from("releases")
        .select("*")
        .eq("platform", platform)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return { success: false, error: "未找到可用版本" };
      }

      return {
        success: true,
        data,
      };
    } else {
      // 国内版：从 CloudBase 获取
      try {
        const { db, app } = await getCloudBase();
        const { data } = await db
          .collection("releases")
          .where({
            platform,
            is_active: true,
          })
          .orderBy("created_at", "desc")
          .limit(1)
          .get();

        if (!data || data.length === 0) {
          return { success: false, error: "未找到可用版本" };
        }

        const release = data[0];

        // 如果是 cloud:// 格式，获取临时 URL
        let fileUrl = release.file_url;
        if (fileUrl && fileUrl.startsWith("cloud://")) {
          try {
            const urlResult = await app.getTempFileURL({
              fileList: [fileUrl],
            });
            if (urlResult.fileList?.[0]?.code === "SUCCESS") {
              fileUrl = urlResult.fileList[0].tempFileURL;
            }
          } catch {
            // 使用原 URL
          }
        }

        return {
          success: true,
          data: {
            id: release._id || release.id,
            version: release.version,
            platform: release.platform,
            variant: release.variant,
            file_url: fileUrl,
            file_size: release.file_size,
            release_notes: release.release_notes,
            is_active: release.is_active,
            is_mandatory: release.is_mandatory,
            created_at: release.created_at,
            updated_at: release.updated_at,
          },
        };
      } catch (err) {
        console.error("CloudBase getLatestRelease error:", err);
        return { success: false, error: "获取最新版本失败" };
      }
    }
  } catch (err) {
    console.error("Get latest release error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "获取最新版本失败",
    };
  }
}

// ============================================================================
// 文件管理相关
// ============================================================================

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
  files?: ReleaseFile[];
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
 * 列出发布版本文件 - 根据当前环境只列出对应的云存储文件
 */
export async function listReleaseFiles(): Promise<ListReleaseFilesResult> {
  try {
    await requireAdmin();

    const files: ReleaseFile[] = [];

    if (RegionConfig.region === "INTL") {
      // 国际版：只获取 Supabase Storage 文件
      if (supabaseAdmin) {
        try {
          // 获取 releases bucket 文件列表
          const { data: storageFiles, error } = await supabaseAdmin.storage
            .from("releases")
            .list("", { limit: 100 });

          if (!error && storageFiles) {
            // 同时获取数据库中的版本信息
            const { data: releases } = await supabaseAdmin
              .from("releases")
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

            for (const file of storageFiles) {
              if (file.name === ".emptyFolderPlaceholder") continue;

              const { data: urlData } = supabaseAdmin.storage
                .from("releases")
                .getPublicUrl(file.name);

              const release = urlToRelease.get(file.name);

              files.push({
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
    } else {
      // 国内版：只获取 CloudBase Storage 文件
      try {
        const connector = new CloudBaseConnector();
        await connector.initialize();
        const db = connector.getClient();
        const app = connector.getApp();

        const { data } = await db.collection("releases").get();

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

                files.push({
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

                    files.push({
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
                files.push({
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
                files.push({
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
    }

    return {
      success: true,
      files,
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
    await requireAdmin();

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
        await supabaseAdmin.from("releases").delete().eq("id", releaseId);
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
            await db.collection("releases").doc(releaseId).remove();
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
    await requireAdmin();

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
