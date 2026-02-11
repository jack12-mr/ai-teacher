/**
 * 初始化邮箱验证码相关的 CloudBase 数据库集合
 * 运行: node scripts/init-email-collections.js
 */

const cloudbase = require("@cloudbase/node-sdk");
require("dotenv").config({ path: ".env.local" });

const app = cloudbase.init({
  env: process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID,
  secretId: process.env.CLOUDBASE_SECRET_ID,
  secretKey: process.env.CLOUDBASE_SECRET_KEY,
});

const db = app.database();

const collections = [
  {
    name: "email_verification_codes",
    description: "邮箱验证码",
  },
  {
    name: "password_reset_tokens",
    description: "密码重置令牌",
  },
];

async function initCollections() {
  console.log("开始初始化邮箱验证码相关集合...");
  console.log(`环境 ID: ${process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID}`);

  for (const collection of collections) {
    try {
      console.log(`\n正在创建集合: ${collection.name} (${collection.description})`);

      const collectionRef = db.collection(collection.name);

      // 插入一条临时数据来触发集合创建
      await collectionRef.add({
        _init: true,
        created_at: new Date().toISOString(),
      });

      console.log(`✓ 集合 ${collection.name} 创建成功`);

      // 删除临时数据
      const result = await collectionRef.where({ _init: true }).get();
      if (result.data && result.data.length > 0) {
        await collectionRef.doc(result.data[0]._id).remove();
        console.log(`  已清理临时数据`);
      }
    } catch (error) {
      if (error.message && error.message.includes("already exists")) {
        console.log(`  集合 ${collection.name} 已存在，跳过`);
      } else {
        console.error(`✗ 创建集合 ${collection.name} 失败:`, error.message);
      }
    }
  }

  console.log("\n✓ 邮箱验证码相关集合初始化完成！");
  console.log("\n注意：CloudBase 数据库索引需要在控制台手动创建：");
  console.log("\n1. email_verification_codes 集合索引：");
  console.log("   - { email: 1, type: 1, verified: 1 }");
  console.log("   - { expires_at: 1 } (TTL 索引)");
  console.log("   - { ip_address: 1, created_at: 1 }");
  console.log("\n2. password_reset_tokens 集合索引：");
  console.log("   - { email: 1, used: 1 }");
  console.log("   - { expires_at: 1 } (TTL 索引)");
}

initCollections()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("初始化失败:", error);
    process.exit(1);
  });
