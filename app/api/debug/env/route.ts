import { NextRequest, NextResponse } from 'next/server';

/**
 * 诊断 API：查看运行时环境变量
 * 访问 /api/debug/env 查看当前环境变量配置
 */
export async function GET(request: NextRequest) {
  // 只在开发环境或调试时使用
  const envInfo = {
    NEXT_PUBLIC_WECHAT_CLOUDBASE_ID: process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID || '未设置',
    CLOUDBASE_SECRET_ID: process.env.CLOUDBASE_SECRET_ID ? '已设置 (***隐藏***)' : '未设置',
    CLOUDBASE_SECRET_KEY: process.env.CLOUDBASE_SECRET_KEY ? '已设置 (***隐藏***)' : '未设置',
    NEXT_PUBLIC_CLOUDBASE_ENV_ID: process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID || '未设置',
    NODE_ENV: process.env.NODE_ENV,
    // 显示所有 NEXT_PUBLIC_ 开头的环境变量
    allNextPublicEnvs: Object.keys(process.env)
      .filter(key => key.startsWith('NEXT_PUBLIC_'))
      .reduce((acc, key) => {
        acc[key] = process.env[key];
        return acc;
      }, {} as Record<string, string | undefined>),
  };

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    env: envInfo,
  });
}
