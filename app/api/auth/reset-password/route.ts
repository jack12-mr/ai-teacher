import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { isChinaRegion } from '@/lib/config/region';
import { getCloudBaseDB } from '@/lib/cloudbase/cloudbase-service';
import { CLOUDBASE_COLLECTIONS, PasswordResetToken } from '@/lib/database/cloudbase-schema';

const schema = z.object({
  email: z.string().email('邮箱格式不正确'),
  resetToken: z.string().min(1, '重置令牌不能为空'),
  password: z.string().min(6, '密码至少需要6个字符'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
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

    const { email, resetToken, password } = validationResult.data;
    const db = await getCloudBaseDB();
    const now = new Date().toISOString();

    const result = await db
      .collection(CLOUDBASE_COLLECTIONS.PASSWORD_RESET_TOKENS)
      .where({
        email,
        used: false,
        expires_at: db.command.gte(now),
      })
      .orderBy('created_at', 'desc')
      .limit(1)
      .get();

    if (!result.data || result.data.length === 0) {
      return NextResponse.json({ error: '重置令牌无效或已过期' }, { status: 400 });
    }

    const tokenRecord = result.data[0] as PasswordResetToken;
    const isValid = await bcrypt.compare(resetToken, tokenRecord.token);

    if (!isValid) {
      return NextResponse.json({ error: '重置令牌无效' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db
      .collection(CLOUDBASE_COLLECTIONS.WEB_USERS)
      .where({ email })
      .update({
        password: hashedPassword,
        updated_at: now,
      });

    await db
      .collection(CLOUDBASE_COLLECTIONS.PASSWORD_RESET_TOKENS)
      .doc(tokenRecord._id!)
      .update({
        used: true,
      });

    return NextResponse.json({ message: '密码重置成功' });
  } catch (error) {
    console.error('[/api/auth/reset-password] Error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
