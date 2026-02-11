import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { isChinaRegion } from '@/lib/config/region';
import { getCloudBaseDB } from '@/lib/cloudbase/cloudbase-service';
import { CLOUDBASE_COLLECTIONS } from '@/lib/database/cloudbase-schema';
import { verificationCodeService } from '@/lib/email/verification-code-service';

const schema = z.object({
  email: z.string().email('邮箱格式不正确'),
  code: z.string().length(6, '验证码必须是6位数字'),
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

    const { email, code } = validationResult.data;

    const result = await verificationCodeService.verifyCode(email, code, 'reset_password');

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

    const db = await getCloudBaseDB();
    await db.collection(CLOUDBASE_COLLECTIONS.PASSWORD_RESET_TOKENS).add({
      email,
      token: hashedToken,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      used: false,
    });

    return NextResponse.json({ resetToken });
  } catch (error) {
    console.error('[/api/auth/verify-reset-code] Error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
