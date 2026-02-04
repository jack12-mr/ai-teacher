// 测试环境变量是否正确配置
const requiredEnvVars = [
  'WECHAT_APP_APPID',
  'WECHAT_APP_SECRET',
  'NEXT_PUBLIC_DEPLOYMENT_REGION',
  'NEXT_PUBLIC_CLOUDBASE_ENV_ID',
  'CLOUDBASE_SECRET_ID',
  'CLOUDBASE_SECRET_KEY',
  'JWT_SECRET',
  'OPENAI_API_KEY',
  'OPENAI_BASE_URL',
  'AI_MODEL_NAME',
  'NEXT_PUBLIC_APP_URL'
];

console.log('环境变量检查结果：\n');

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const display = value ? (varName.includes('SECRET') || varName.includes('KEY') ? '[已设置]' : value) : '[未设置]';
  console.log(`${status} ${varName}: ${display}`);
});

console.log('\n如果所有变量都显示 ✅，说明环境变量配置正确。');
