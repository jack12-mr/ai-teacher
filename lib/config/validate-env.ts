/**
 * 环境变量验证
 *
 * 验证部署环境配置是否正确，确保必需的环境变量已设置
 */

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 验证环境配置
 *
 * 根据部署区域验证必需的环境变量是否正确配置
 */
export function validateEnvironmentConfig(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const region = process.env.NEXT_PUBLIC_DEPLOYMENT_REGION;

  console.log('[EnvValidation] 开始验证环境配置');
  console.log('[EnvValidation] 部署区域:', region);

  // 验证部署区域
  if (!region) {
    errors.push('NEXT_PUBLIC_DEPLOYMENT_REGION 未设置');
  } else if (region !== 'CN' && region !== 'INTL') {
    errors.push(`无效的 NEXT_PUBLIC_DEPLOYMENT_REGION: ${region}。必须是 'CN' 或 'INTL'`);
  }

  // 根据区域验证相应的数据库凭证
  if (region === 'CN') {
    console.log('[EnvValidation] 验证 CloudBase 配置...');

    // 验证 CloudBase 必需的环境变量
    if (!process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID) {
      errors.push('CN 区域需要 NEXT_PUBLIC_CLOUDBASE_ENV_ID');
    }
    if (!process.env.CLOUDBASE_SECRET_ID) {
      errors.push('CN 区域需要 CLOUDBASE_SECRET_ID');
    }
    if (!process.env.CLOUDBASE_SECRET_KEY) {
      errors.push('CN 区域需要 CLOUDBASE_SECRET_KEY');
    }

    // 警告：如果同时存在 Supabase 配置
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      warnings.push('检测到 Supabase 配置，但当前为 CN 区域，将使用 CloudBase 数据库');
    }
  } else if (region === 'INTL') {
    console.log('[EnvValidation] 验证 Supabase 配置...');

    // 验证 Supabase 必需的环境变量
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      errors.push('INTL 区域需要 NEXT_PUBLIC_SUPABASE_URL');
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      errors.push('INTL 区域需要 NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      errors.push('INTL 区域需要 SUPABASE_SERVICE_ROLE_KEY');
    }

    // 警告：如果同时存在 CloudBase 配置
    if (process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID) {
      warnings.push('检测到 CloudBase 配置，但当前为 INTL 区域，将使用 Supabase 数据库');
    }
  }

  // 输出验证结果
  if (errors.length > 0) {
    console.error('[EnvValidation] 验证失败，发现错误:');
    errors.forEach(error => console.error(`  - ${error}`));
  }

  if (warnings.length > 0) {
    console.warn('[EnvValidation] 验证警告:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('[EnvValidation] 环境配置验证通过');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
