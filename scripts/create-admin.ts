/**
 * 创建管理员账户脚本
 *
 * 支持双环境（CloudBase + Supabase）
 * 运行方式：
 *   - CloudBase: npm run create-admin -- --cloudbase
 *   - Supabase: npm run create-admin -- --supabase
 *   - 自动检测: npm run create-admin
 */

import { config } from "dotenv";
// 加载环境变量
config({ path: ".env.local" });

import { program } from "commander";
import bcrypt from "bcryptjs";
import readline from "readline";
import { getCloudBaseDatabase } from "../lib/cloudbase/init";
import { getSupabaseAdmin } from "../lib/integrations/supabase-admin";

// ==================== 类型定义 ====================

interface CreateAdminOptions {
  username?: string;
  password?: string;
  role?: "admin" | "super_admin";
  force?: boolean;
}

// ==================== 工具函数 ====================

/**
 * 从命令行读取输入
 */
function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * 验证密码强度
 */
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: "密码长度至少为 8 位" };
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return { valid: false, error: "密码必须包含字母和数字" };
  }

  return { valid: true };
}

/**
 * 验证用户名
 */
function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.length < 3) {
    return { valid: false, error: "用户名长度至少为 3 位" };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: "用户名只能包含字母、数字、下划线和连字符" };
  }

  return { valid: true };
}

// ==================== CloudBase 操作 ====================

/**
 * 在 CloudBase 中创建管理员
 */
async function createCloudBaseAdmin(
  username: string,
  password: string,
  role: "admin" | "super_admin"
): Promise<void> {
  console.log("\n正在连接 CloudBase...");

  const db = getCloudBaseDatabase();
  const now = new Date().toISOString();

  // 检查用户名是否已存在
  console.log(`检查用户名 "${username}" 是否已存在...`);
  const existing = await db.collection("admin_users").where({ username }).get();

  if (existing.data.length > 0) {
    throw new Error(`用户名 "${username}" 已存在`);
  }

  // 哈希密码
  console.log("正在加密密码...");
  const hashedPassword = await bcrypt.hash(password, 10);

  // 创建管理员
  console.log("正在创建管理员账户...");
  const result = await db.collection("admin_users").add({
    username,
    password: hashedPassword,
    role,
    status: "active",
    created_at: now,
    updated_at: now,
  });

  console.log(`\n✓ 管理员账户创建成功！`);
  console.log(`  ID: ${result.id}`);
  console.log(`  用户名: ${username}`);
  console.log(`  角色: ${role}`);
}

// ==================== Supabase 操作 ====================

/**
 * 在 Supabase 中创建管理员
 */
async function createSupabaseAdmin(
  username: string,
  password: string,
  role: "admin" | "super_admin"
): Promise<void> {
  console.log("\n正在连接 Supabase...");

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  // 检查用户名是否已存在
  console.log(`检查用户名 "${username}" 是否已存在...`);
  const { data: existing } = await supabase
    .from("admin_users")
    .select("username")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    throw new Error(`用户名 "${username}" 已存在`);
  }

  // 哈希密码
  console.log("正在加密密码...");
  const hashedPassword = await bcrypt.hash(password, 10);

  // 创建管理员
  console.log("正在创建管理员账户...");
  const { data, error } = await supabase
    .from("admin_users")
    .insert({
      username,
      password: hashedPassword,
      role,
      status: "active",
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  console.log(`\n✓ 管理员账户创建成功！`);
  console.log(`  ID: ${data.id}`);
  console.log(`  用户名: ${username}`);
  console.log(`  角色: ${role}`);
}

// ==================== 主函数 ====================

async function main(options: CreateAdminOptions): Promise<void> {
  console.log("=====================================");
  console.log("创建管理员账户");
  console.log("=====================================");

  // 确定数据库类型
  let dbType: "cloudbase" | "supabase" | "auto" = "auto";

  if (process.argv.includes("--cloudbase")) {
    dbType = "cloudbase";
  } else if (process.argv.includes("--supabase")) {
    dbType = "supabase";
  }

  if (dbType === "auto") {
    const region = process.env.NEXT_PUBLIC_DEPLOYMENT_REGION || "INTL";
    dbType = region === "CN" ? "cloudbase" : "supabase";
    console.log(`自动检测数据库类型: ${dbType.toUpperCase()}`);
  } else {
    console.log(`指定数据库类型: ${dbType.toUpperCase()}`);
  }

  // 获取用户名
  let username = options.username;
  if (!username) {
    while (true) {
      username = await askQuestion("请输入用户名: ");
      const validation = validateUsername(username);
      if (validation.valid) {
        break;
      }
      console.error(`错误: ${validation.error}`);
    }
  } else {
    const validation = validateUsername(username);
    if (!validation.valid) {
      console.error(`错误: ${validation.error}`);
      process.exit(1);
    }
  }

  // 获取密码
  let password = options.password;
  if (!password) {
    while (true) {
      password = await askQuestion("请输入密码: ");
      const validation = validatePassword(password);
      if (validation.valid) {
        // 确认密码
        const confirmPassword = await askQuestion("请再次输入密码: ");
        if (password === confirmPassword) {
          break;
        }
        console.error("错误: 两次输入的密码不一致");
      } else {
        console.error(`错误: ${validation.error}`);
      }
    }
  } else {
    const validation = validatePassword(password);
    if (!validation.valid) {
      console.error(`错误: ${validation.error}`);
      process.exit(1);
    }
  }

  // 获取角色
  let role: "admin" | "super_admin" = options.role || "admin";

  // 确认创建
  if (!options.force) {
    const confirm = await askQuestion(
      `\n即将创建以下管理员账户:\n  数据库: ${dbType}\n  用户名: ${username}\n  角色: ${role}\n\n确认创建? (yes/no): `
    );

    if (confirm.toLowerCase() !== "yes" && confirm.toLowerCase() !== "y") {
      console.log("\n操作已取消");
      process.exit(0);
    }
  }

  try {
    // 根据数据库类型创建管理员
    if (dbType === "cloudbase") {
      await createCloudBaseAdmin(username, password, role);
    } else {
      await createSupabaseAdmin(username, password, role);
    }

    console.log("\n=====================================");
    console.log("完成！");
    console.log("=====================================");
    console.log("\n现在可以使用以下地址登录管理后台:");
    console.log(`  ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/login`);
  } catch (error: any) {
    console.error("\n=====================================");
    console.error("创建失败！");
    console.error("=====================================");
    console.error(error.message);
    process.exit(1);
  }
}

// ==================== CLI 配置 ====================

program
  .name("create-admin")
  .description("创建管理员账户")
  .option("-u, --username <username>", "用户名")
  .option("-p, --password <password>", "密码")
  .option("-r, --role <role>", "角色 (admin|super_admin)", "admin")
  .option("-f, --force", "跳过确认")
  .action((options) => main(options));

program.parse();
