import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";

/**
 * 检查管理员会话 API
 *
 * 用于客户端检查用户是否已登录
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员会话
    const sessionResult = await getAdminSession();

    if (sessionResult.valid && sessionResult.session) {
      return NextResponse.json({
        authenticated: true,
        admin: {
          username: sessionResult.session.username,
          role: sessionResult.session.role,
        },
      });
    }

    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  } catch (error) {
    console.error("检查会话失败:", error);
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}
