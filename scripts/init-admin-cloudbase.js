/**
 * CloudBase 管理后台数据库初始化脚本
 *
 * 创建管理后台所需的数据库集合
 * 运行方式：node scripts/init-admin-cloudbase.js
 */

const cloudbase = require("@cloudbase/node-sdk");

// 环境变量
const envId = process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID;
const secretId = process.env.CLOUDBASE_SECRET_ID;
const secretKey = process.env.CLOUDBASE_SECRET_KEY;

if (!envId || !secretId || !secretKey) {
  console.error("错误：缺少环境变量");
  console.error("请设置以下环境变量：");
  console.error("  - NEXT_PUBLIC_WECHAT_CLOUDBASE_ID");
  console.error("  - CLOUDBASE_SECRET_ID");
  console.error("  - CLOUDBASE_SECRET_KEY");
  process.exit(1);
}

// 初始化 CloudBase
const app = cloudbase.init({
  env: envId,
  secretId: secretId,
  secretKey: secretKey,
});

const db = app.database();

// ==================== 集合定义 ====================

/**
 * admin_users 集合索引
 */
const adminUsersIndexes = [
  {
    name: "idx_username",
    fields: { username: 1 },
    unique: true,
  },
  {
    name: "idx_status",
    fields: { status: 1 },
  },
  {
    name: "idx_role",
    fields: { role: 1 },
  },
];

/**
 * system_logs 集合索引
 */
const systemLogsIndexes = [
  {
    name: "idx_admin_id",
    fields: { admin_id: 1 },
  },
  {
    name: "idx_action",
    fields: { action: 1 },
  },
  {
    name: "idx_resource_type",
    fields: { resource_type: 1 },
  },
  {
    name: "idx_created_at",
    fields: { created_at: -1 },
  },
];

/**
 * system_config 集合索引
 */
const systemConfigIndexes = [
  {
    name: "idx_key",
    fields: { key: 1 },
    unique: true,
  },
  {
    name: "idx_category",
    fields: { category: 1 },
  },
];

// ==================== 初始化函数 ====================

/**
 * 创建集合并添加索引
 */
async function createCollectionWithIndexes(collectionName, indexes) {
  console.log(`\n正在创建集合: ${collectionName}`);

  try {
    // 创建集合
    await db.createCollection(collectionName);
    console.log(`✓ 集合 ${collectionName} 创建成功`);
  } catch (error) {
    if (error.code === "DATABASE_COLLECTION_ALREADY_EXISTS") {
      console.log(`  集合 ${collectionName} 已存在，跳过创建`);
    } else {
      console.error(`✗ 创建集合 ${collectionName} 失败:`, error.message);
      throw error;
    }
  }

  // 创建索引
  for (const index of indexes) {
    try {
      await db.collection(collectionName).createIndex(index.fields, {
        unique: index.unique || false,
        name: index.name,
      });
      console.log(`  ✓ 索引 ${index.name} 创建成功`);
    } catch (error) {
      if (error.code === "DATABASE_INDEX_ALREADY_EXISTS") {
        console.log(`    索引 ${index.name} 已存在，跳过创建`);
      } else {
        console.error(`    ✗ 创建索引 ${index.name} 失败:`, error.message);
      }
    }
  }
}

/**
 * 插入初始配置
 */
async function insertInitialConfig() {
  console.log("\n正在插入初始配置...");

  const configs = [
    {
      key: "site_name",
      value: "AI Teacher",
      description: "网站名称",
      category: "general",
    },
    {
      key: "site_description",
      value: "AI 驱动的智能教学平台",
      description: "网站描述",
      category: "general",
    },
    {
      key: "maintenance_mode",
      value: false,
      description: "维护模式",
      category: "general",
    },
    {
      key: "max_free_assessments",
      value: 3,
      description: "免费用户最大评估次数",
      category: "ai",
    },
    {
      key: "admin_email",
      value: "",
      description: "管理员邮箱",
      category: "notification",
    },
  ];

  const collection = db.collection("system_config");
  const now = new Date().toISOString();

  for (const config of configs) {
    try {
      await collection.add({
        ...config,
        updated_at: now,
      });
      console.log(`  ✓ 配置 ${config.key} 插入成功`);
    } catch (error) {
      if (error.code === "DATABASE_RECORD_ALREADY_EXISTS") {
        console.log(`    配置 ${config.key} 已存在，跳过插入`);
      } else {
        console.error(`    ✗ 插入配置 ${config.key} 失败:`, error.message);
      }
    }
  }
}

// ==================== 主函数 ====================

async function main() {
  console.log("=====================================");
  console.log("CloudBase 管理后台数据库初始化");
  console.log("=====================================");
  console.log(`环境 ID: ${envId}`);

  try {
    // 创建 admin_users 集合
    await createCollectionWithIndexes("admin_users", adminUsersIndexes);

    // 创建 system_logs 集合
    await createCollectionWithIndexes("system_logs", systemLogsIndexes);

    // 创建 system_config 集合
    await createCollectionWithIndexes("system_config", systemConfigIndexes);

    // 插入初始配置
    await insertInitialConfig();

    console.log("\n=====================================");
    console.log("✓ 初始化完成！");
    console.log("=====================================");
    console.log("\n下一步：");
    console.log("  运行 npm run create-admin 创建管理员账户");
  } catch (error) {
    console.error("\n=====================================");
    console.error("✗ 初始化失败！");
    console.error("=====================================");
    console.error(error);
    process.exit(1);
  }
}

// 运行
main();
