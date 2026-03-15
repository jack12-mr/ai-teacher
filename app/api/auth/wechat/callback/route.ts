import { NextRequest, NextResponse } from "next/server";
import { logError, logInfo } from "@/lib/utils/logger";

/**
 * GET /api/auth/wechat/callback
 * 微信 OAuth 回调处理
 *
 * 流程：
 * 1. 接收微信返回的 code 和 state
 * 2. 重定向到前端页面，由前端处理登录
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const source = searchParams.get("source");
    
    logInfo("WeChat callback received", {
      hasCode: Boolean(code),
      hasState: Boolean(state),
      source,
    });

    if (!code) {
      // 用户拒绝授权或授权失败
      const error = searchParams.get("error") || "授权失败";
      const errorDescription = searchParams.get("error_description") || "用户取消授权";

      // 重定向到登录页面并显示错误
      const loginUrl = new URL("/login", process.env.NEXT_PUBLIC_APP_URL);
      loginUrl.searchParams.set("error", errorDescription);
      return NextResponse.redirect(loginUrl.toString());
    }

    // 将 code 发送到前端处理
    // 前端会调用 POST /api/auth/wechat 或 /api/auth/wechat/app 完成登录
    const callbackPageUrl = new URL("/auth/wechat-callback", process.env.NEXT_PUBLIC_APP_URL);
    callbackPageUrl.searchParams.set("code", code);
    callbackPageUrl.searchParams.set("redirect", parseRedirectFromState(state));

    // 保留 source 参数（用于区分 APP 端和网页端登录）
    if (source) {
      callbackPageUrl.searchParams.set("source", source);
    }

    return NextResponse.redirect(callbackPageUrl.toString());
  } catch (error) {
    logError("WeChat callback error", error as Error);
    console.error("WeChat callback error:", error);

    // 出错时重定向到登录页面
    const loginUrl = new URL("/login", process.env.NEXT_PUBLIC_APP_URL);
    loginUrl.searchParams.set("error", "微信登录失败，请重试");
    return NextResponse.redirect(loginUrl.toString());
  }
}

function parseRedirectFromState(state: string | null): string {
  if (!state) return "/";
  if (state.startsWith("/")) return state;

  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as { next?: string } | null;
    if (parsed?.next && parsed.next.startsWith("/")) {
      return parsed.next;
    }
  } catch {
    // ignore and fall through
  }

  return state;
}


