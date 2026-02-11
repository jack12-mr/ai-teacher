import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isChinaRegion } from '@/lib/config/region';
import { getDatabase } from '@/lib/cloudbase/cloudbase-service';
import { CLOUDBASE_COLLECTIONS } from '@/lib/database/cloudbase-schema';
import { verificationCodeService } from '@/lib/email/verification-code-service';
import { emailService } from '@/lib/email/email-service';
import { getPasswordResetTemplate } from '@/lib/email/templates';

const schema = z.object({
  email: z.string().email('邮箱格式不正确'),
});

export async function POST(request: NextRequest) {
  try {
    if (!isChinaRegion()) {
      return NextResponse.json({ error: '当前区域不支持' }, { status: 400 });
    }

    const body = await request.json();
    const validationResult = schema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0]?.message || '输入格式不正确' },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;
    const clientIP = request.headers.get('x-forwarded-for') || undefined;

    const db = getDatabase();
    const existingUser = await db
      .collection(CLOUDBASE_COLLECTIONS.WEB_USERS)
      .where({ email })
      .limit(1)
      .get();

    if (!existingUser.data || existingUser.data.length === 0) {
      return NextResponse.json({ message: '如果该邮箱已注册，验证码将发送到邮箱' });
    }

    const result = await verificationCodeService.createCode(email, 'reset_password', clientIP);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const emailHtml = getPasswordResetTemplate(result.code!);
    await emailService.sendEmail(email, '密码重置验证码', emailHtml);

    return NextResponse.json({ message: '如果该邮箱已注册，验证码将发送到邮箱' });
  } catch (error) {
    console.error('[/api/auth/send-reset-code] Error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
