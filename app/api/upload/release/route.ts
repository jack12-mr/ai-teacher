import { NextRequest, NextResponse } from "next/server";
import { CloudBaseConnector } from "@/lib/cloudbase/connector";
import { getAdminSession } from "@/lib/admin/session";
import { RegionConfig } from "@/lib/config/region";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5分钟超时

// Next.js App Router 使用这个配置来设置请求体大小限制
export const preferredRegion = 'auto';
// 注意: App Router 的 API 路由请求体大小限制需要在 next.config.mjs 中配置

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

async function requireAdmin() {
  const result = await getAdminSession();
  if (!result.valid || !result.session) {
    throw new Error(result.error || "未授权访问");
  }
  return result.session;
}

export async function POST(req: NextRequest) {
  try {
    console.log("[release upload] 开始处理上传请求");

    // 验证管理员权限
    try {
      await requireAdmin();
      console.log("[release upload] 权限验证通过");
    } catch (authError) {
      console.error("[release upload] 权限验证失败:", authError);
      return NextResponse.json(
        { error: authError instanceof Error ? authError.message : "权限验证失败" },
        { status: 401 }
      );
    }

    // 解析 FormData
    let form;
    try {
      form = await req.formData();
      console.log("[release upload] FormData 解析成功");
    } catch (formError) {
      console.error("[release upload] FormData 解析失败:", formError);
      return NextResponse.json(
        { error: "FormData 解析失败" },
        { status: 400 }
      );
    }

    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      console.error("[release upload] 文件无效");
      return NextResponse.json({ error: "请上传文件" }, { status: 400 });
    }

    console.log("[release upload] 文件信息:", {
      name: file.name,
      size: file.size,
      type: file.type
    });

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `文件太大，最大支持${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = form.get("fileName") as string;

    console.log("[release upload] ========== 开始上传流程 ==========");
    console.log("[release upload] 环境区域:", RegionConfig.region);
    console.log("[release upload] 文件名:", fileName);

    let fileUrl: string;

    if (RegionConfig.region === "INTL") {
      // 国际版：上传到 Supabase Storage
      console.log("[release upload] 使用 Supabase Storage");

      if (!supabaseAdmin) {
        console.error("[release upload] Supabase 未配置");
        return NextResponse.json(
          { error: "Supabase 未配置" },
          { status: 500 }
        );
      }

      try {
        const filePath = `releases/${fileName}`;
        console.log("[release upload] 上传到 Supabase:", filePath);

        const { error } = await supabaseAdmin.storage
          .from("releases")
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (error) {
          console.error("[release upload] Supabase 上传失败:", error);
          return NextResponse.json(
            { error: `Supabase 上传失败: ${error.message}` },
            { status: 500 }
          );
        }

        // 获取公开 URL
        const { data: urlData } = supabaseAdmin.storage
          .from("releases")
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        console.log("[release upload] Supabase 上传成功:", fileUrl);
      } catch (uploadError) {
        console.error("[release upload] Supabase 上传异常:", uploadError);
        return NextResponse.json(
          { error: uploadError instanceof Error ? uploadError.message : "Supabase 上传失败" },
          { status: 500 }
        );
      }
    } else {
      // 国内版：上传到 CloudBase Storage
      console.log("[release upload] 使用 CloudBase Storage");

      const cloudPath = `releases/${fileName}`;

      try {
        const connector = new CloudBaseConnector();
        await connector.initialize();
        const app = connector.getApp();
        console.log("[release upload] CloudBase 初始化成功");

        const uploadResult = await app.uploadFile({
          cloudPath,
          fileContent: buffer,
        });

        console.log("[release upload] CloudBase 上传结果:", uploadResult);

        if (!uploadResult.fileID) {
          console.error("[release upload] CloudBase 上传失败: 未返回 fileID");
          return NextResponse.json(
            { error: "CloudBase 上传失败: 未返回 fileID" },
            { status: 500 }
          );
        }

        fileUrl = uploadResult.fileID;
        console.log("[release upload] CloudBase 上传成功:", fileUrl);
      } catch (uploadError) {
        console.error("[release upload] CloudBase 上传异常:", uploadError);
        return NextResponse.json(
          { error: uploadError instanceof Error ? uploadError.message : "CloudBase 上传失败" },
          { status: 500 }
        );
      }
    }

    console.log("[release upload] ✅ 上传完成:", fileUrl);

    return NextResponse.json({
      success: true,
      fileID: fileUrl,
      fileUrl: fileUrl,
    });
  } catch (error) {
    console.error("[release upload] 未捕获的错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "上传失败" },
      { status: 500 }
    );
  }
}
