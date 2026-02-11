import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isChinaRegion } from "@/lib/config/region";
import { logSecurityEvent } from "@/lib/utils/logger";
import { signupUser } from "@/lib/cloudbase/cloudbase-service";
import { verificationCodeService } from "@/lib/email/verification-code-service";

const registerSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少需要6个字符"),
  confirmPassword: z.string(),
  name: z.string().optional(),
  verificationCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientIP = request.headers.get("x-forwarded-for") || "unknown";

    console.log('[register] 收到注册请求');
    console.log('[register] 请求数据:', {
      email: body.email,
      name: body.name,
      hasPassword: !!body.password,
      hasConfirmPassword: !!body.confirmPassword,
      verificationCode: body.verificationCode ? `${body.verificationCode.length}位` : '未提供'
    });

    // 验证输入
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('[register] 输入验证失败:', validationResult.error.errors);
      logSecurityEvent("register_validation_failed", undefined, clientIP, {
        errors: validationResult.error.errors,
      });
      return NextResponse.json(
        {
          error: validationResult.error.errors[0]?.message || "输入格式不正确"
        },
        { status: 400 }
      );
    }

    const { email, password, name, verificationCode } = validationResult.data;

    if (isChinaRegion()) {
      console.log("[register] 中国区注册:", email);

      if (!verificationCode || verificationCode.length !== 6) {
        console.error('[register] 验证码格式错误:', verificationCode);
        return NextResponse.json(
          { error: "请输入6位验证码" },
          { status: 400 }
        );
      }

      console.log('[register] 开始验证验证码');
      const verifyResult = await verificationCodeService.verifyCode(
        email,
        verificationCode,
        'register'
      );

      if (!verifyResult.success) {
        console.error('[register] 验证码验证失败:', verifyResult.error);
        logSecurityEvent("register_verification_failed", undefined, clientIP, {
          email,
          error: verifyResult.error,
        });
        return NextResponse.json(
          { error: verifyResult.error || "验证码验证失败" },
          { status: 400 }
        );
      }

      console.log('[register] 验证码验证成功，开始创建用户');
      const userAgent = request.headers.get("user-agent") || undefined;
      const ipAddress = clientIP !== "unknown" ? clientIP : undefined;

      const result = await signupUser(email, password, name, {
        deviceInfo: userAgent,
        ipAddress,
        userAgent,
      });

      if (!result.success) {
        console.error('[register] 用户创建失败:', result.error);
        logSecurityEvent("register_failed", undefined, clientIP, {
          email,
          error: result.error,
        });
        return NextResponse.json(
          { error: result.error || "注册失败" },
          { status: 400 }
        );
      }

      console.log('[register] 注册成功:', email);
      logSecurityEvent("register_success", result.userId, clientIP, { email });

      return NextResponse.json({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: {
          id: result.userId,
          email: email,
          name: name || email.split("@")[0],
        },
        tokenMeta: result.tokenMeta,
      });
    } else {
      console.log('[register] 非中国区，拒绝注册');
      return NextResponse.json(
        { error: "当前区域不支持" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("[register] 异常:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
