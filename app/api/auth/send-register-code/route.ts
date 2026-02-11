import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isChinaRegion } from '@/lib/config/region';
import { getDatabase } from '@/lib/cloudbase/cloudbase-service';
import { CLOUDBASE_COLLECTIONS } from '@/lib/database/cloudbase-schema';
import { verificationCodeService } from '@/lib/email/verification-code-service';
import { emailService } from '@/lib/email/email-service';
import { getRegisterVerificationTemplate } from '@/lib/email/templates';

const schema = z.object({
  email: z.string().email('邮箱格式不正确'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('[send-register-code] 收到发送验证码请求');

    if (!isChinaRegion()) {
      console.log('[send-register-code] 非中国区，拒绝请求');
      return NextResponse.json({ error: '当前区域不支持' }, { status: 400 });
    }

    const body = await request.json();
    console.log('[send-register-code] 请求体:', { email: body.email });

    const validationResult = schema.safeParse(body);

    if (!validationResult.success) {
      console.error('[send-register-code] 验证失败:', validationResult.error.errors);
      return NextResponse.json(
        { error: validationResult.error.errors[0]?.message || '输入格式不正确' },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;
    const clientIP = request.headers.get('x-forwarded-for') || undefined;
    console.log('[send-register-code] 客户端 IP:', clientIP);

    const db = getDatabase();
    const existingUser = await db
      .collection(CLOUDBASE_COLLECTIONS.WEB_USERS)
      .where({ email })
      .limit(1)
      .get();

    if (existingUser.data && existingUser.data.length > 0) {
      console.log('[send-register-code] 邮箱已被注册:', email);
      return NextResponse.json({ error: '该邮箱已被注册' }, { status: 400 });
    }

    console.log('[send-register-code] 开始创建验证码');
    const result = await verificationCodeService.createCode(email, 'register', clientIP);

    if (!result.success) {
      console.error('[send-register-code] 创建验证码失败:', result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    console.log('[send-register-code] 验证码创建成功，准备发送邮件');
    const emailHtml = getRegisterVerificationTemplate(result.code!);
    await emailService.sendEmail(email, '注册验证码', emailHtml);
    console.log('[send-register-code] 邮件发送成功');

    return NextResponse.json({ message: '验证码已发送，请查收邮件' });
  } catch (error) {
    console.error('[send-register-code] 异常:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
