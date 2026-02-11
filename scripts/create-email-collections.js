/**
 * 使用 CloudBase Manager SDK 创建邮箱验证码相关集合和索引
 * 运行: node scripts/create-email-collections.js
 */

const CloudBase = require("@cloudbase/manager-node");
require("dotenv").config({ path: ".env.local" });

async function createCollections() {
  console.log("开始创建邮箱验证码相关集合...");
  console.log(`环境 ID: ${process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID}`);

  const manager = new CloudBase({
    secretId: process.env.CLOUDBASE_SECRET_ID,
    secretKey: process.env.CLOUDBASE_SECRET_KEY,
    envId: process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID,
  });

  try {
    // 创建 email_verification_codes 集合
    console.log("\n正在创建集合: email_verification_codes");
    try {
      await manager.database.createCollection("email_verification_codes");
      console.log("✓ 集合 email_verification_codes 创建成功");
    } catch (error) {
      if (error.message && error.message.includes("already exists")) {
        console.log("  集合 email_verification_codes 已存在，跳过");
      } else {
        throw error;
      }
    }

    // 创建 password_reset_tokens 集合
    console.log("\n正在创建集合: password_reset_tokens");
    try {
      await manager.database.createCollection("password_reset_tokens");
      console.log("✓ 集合 password_reset_tokens 创建成功");
    } catch (error) {
      if (error.message && error.message.includes("already exists")) {
        console.log("  集合 password_reset_tokens 已存在，跳过");
      } else {
        throw error;
      }
    }

    console.log("\n✅ 所有集合创建完成！");
    console.log("\n📝 接下来需要在 CloudBase 控制台手动创建索引：");
    console.log("\n1. 访问 CloudBase 控制台: https://console.cloud.tencent.com/tcb");
    console.log(`2. 选择环境: ${process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID}`);
    console.log("3. 进入「数据库」->「集合管理」");
    console.log("\n为 email_verification_codes 集合创建以下索引：");
    console.log("   索引 1: { email: 1, type: 1, verified: 1 }");
    console.log("   索引 2: { expires_at: 1 } (建议设置为 TTL 索引，过期时间字段)");
    console.log("   索引 3: { ip_address: 1, created_at: 1 }");
    console.log("\n为 password_reset_tokens 集合创建以下索引：");
    console.log("   索引 1: { email: 1, used: 1 }");
    console.log("   索引 2: { expires_at: 1 } (建议设置为 TTL 索引，过期时间字段)");
  } catch (error) {
    console.error("\n❌ 创建失败:", error.message);
    throw error;
  }
}

createCollections()
  .then(() => {
    console.log("\n🎉 邮箱验证码功能数据库配置完成！");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n初始化失败:", error);
    process.exit(1);
  });
