import { NextRequest, NextResponse } from "next/server";
import { verifyJwtToken, getUserById } from "@/lib/cloudbase/cloudbase-service";
import { getCloudBaseApp } from "@/lib/cloudbase/init";
import { CLOUDBASE_COLLECTIONS } from "@/lib/database/cloudbase-schema";

// 生成默认头像 SVG
function generateDefaultAvatar(name: string, email: string): string {
  const displayName = name || email.split("@")[0];
  const initial = displayName.charAt(0).toUpperCase();
  const colors = [
    "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
    "#f43f5e", "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1"
  ];
  const colorIndex = email.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="${bgColor}"/>
      <text x="50" y="50" font-family="Arial,sans-serif" font-size="45" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${initial}</text>
    </svg>`
  )}`;
}

export async function GET(request: NextRequest) {
  try {
    // 从 Authorization header 获取 token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "未提供认证信息" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // 验证 token
    const verifyResult = verifyJwtToken(token);
    if (!verifyResult.valid || !verifyResult.payload) {
      return NextResponse.json(
        { error: "无效的认证令牌" },
        { status: 401 }
      );
    }

    const { userId } = verifyResult.payload;

    // 获取用户信息
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    // 检查用户是否有 pro 状态但订阅已过期
    if (user.pro) {
      const db = getCloudBaseApp().database();
      const { data: subs } = await db
        .collection(CLOUDBASE_COLLECTIONS.SUBSCRIPTIONS)
        .where({ user_id: userId })
        .orderBy("created_at", "desc")
        .limit(1)
        .get();

      if (subs && subs.length > 0) {
        const sub = subs[0];
        const endDate = new Date(sub.end_date);
        const isExpired = endDate < new Date();

        if (isExpired && user.pro) {
          const now = new Date().toISOString();

          // 更新用户的 pro 状态
          await db
            .collection(CLOUDBASE_COLLECTIONS.WEB_USERS)
            .doc(userId)
            .update({
              pro: false,
              subscription_status: "expired",
              updated_at: now,
            });

          user.pro = false;
          user.subscription_status = "expired";
        }
      }
    }

    // 处理头像URL
    let avatar = user.avatar;

    // 如果用户有头像
    if (avatar) {
      // 如果是 CloudBase fileID (以 cloud:// 开头)，生成新的临时URL
      if (avatar.startsWith('cloud://')) {
        try {
          const db = getCloudBaseApp();
          const tempUrlResult = await db.getTempFileURL({
            fileList: [{ fileID: avatar, maxAge: 7 * 24 * 60 * 60 }], // 7 days
          });
          avatar = tempUrlResult?.fileList?.[0]?.tempFileURL || avatar;
        } catch (err) {
          console.warn('[/api/auth/me] Failed to generate temp URL for avatar:', err);
          // 如果生成失败，使用默认头像
          avatar = generateDefaultAvatar(user.name, user.email);
        }
      }
      // 如果是过期的临时URL（包含签名参数），生成默认头像
      else if (avatar.includes('sign=') && avatar.includes('t=')) {
        console.warn('[/api/auth/me] Detected expired temporary URL, using default avatar');
        avatar = generateDefaultAvatar(user.name, user.email);
      }
      // 否则使用原有的URL
    } else {
      // 如果没有头像，生成默认头像
      avatar = generateDefaultAvatar(user.name, user.email);
    }

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: avatar,
        pro: user.pro,
        subscription_plan: user.subscription_plan,
        subscription_status: user.subscription_status,
        membership_expires_at: user.membership_expires_at,
      },
    });
  } catch (error: any) {
    console.error("[/api/auth/me] Error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
