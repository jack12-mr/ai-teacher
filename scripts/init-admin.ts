/**
 * 初始化管理员账号脚本
 *
 * 用于在数据库中创建初始管理员账号
 * 账号：morncoach
 * 密码：Zyx!213416
 */

import bcrypt from "bcryptjs";

async function initAdmin() {
  const region = process.env.NEXT_PUBLIC_DEPLOYMENT_REGION;
  console.log("[initAdmin] 当前环境:", region);

  if (!region || (region !== 'CN' && region !== 'INTL')) {
    console.error("[initAdmin] 错误: NEXT_PUBLIC_DEPLOYMENT_REGION 未设置或无效");
    console.error("[initAdmin] 请设置为 'CN' 或 'INTL'");
    process.exit(1);
  }

  const username = "morncoach";
  const password = "Zyx!213416";
  const role = "super_admin";

  console.log("[initAdmin] 开始初始化管理员账号");
  console.log("[initAdmin] 用户名:", username);
  console.log("[initAdmin] 角色:", role);

  // 生成密码哈希
  const passwordHash = await bcrypt.hash(password, 10);
  console.log("[initAdmin] 密码哈希生成成功");

  try {
    if (region === 'CN') {
      // 国内版：使用 CloudBase
      console.log("[initAdmin] 使用 CloudBase 数据库");
      const { getCloudBaseDatabase } = await import("../lib/cloudbase/init");
      const db = getCloudBaseDatabase();

      // 检查管理员是否已存在
      const existingAdmin = await db.collection("admin_users").where({ username }).get();

      if (existingAdmin.data && existingAdmin.data.length > 0) {
        console.log("[initAdmin] 管理员账号已存在，更新密码");
        await db.collection("admin_users")
          .doc(existingAdmin.data[0]._id)
          .update({
            password_hash: passwordHash,
            role,
            status: "active",
            updated_at: new Date().toISOString(),
          });
      } else {
        console.log("[initAdmin] 创建新的管理员账号");
        await db.collection("admin_users").add({
          username,
          password_hash: passwordHash,
          role,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      console.log("[initAdmin] CloudBase 管理员账号初始化成功");
    } else if (region === 'INTL') {
      // 国际版：使用 Supabase
      console.log("[initAdmin] 使用 Supabase 数据库");
      const { getSupabaseAdmin } = await import("../lib/integrations/supabase-admin");
      const supabase = getSupabaseAdmin();

      // 检查管理员是否已存在
      const { data: existingAdmin, error: checkError } = await supabase
        .from("admin_users")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      if (checkError) {
        console.error("[initAdmin] 查询管理员失败:", checkError);
        throw checkError;
      }

      if (existingAdmin) {
        console.log("[initAdmin] 管理员账号已存在，更新密码");
        const { error: updateError } = await supabase
          .from("admin_users")
          .update({
            password_hash: passwordHash,
            role,
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingAdmin.id);

        if (updateError) {
          console.error("[initAdmin] 更新管理员失败:", updateError);
          throw updateError;
        }
      } else {
        console.log("[initAdmin] 创建新的管理员账号");
        const { error: insertError } = await supabase
          .from("admin_users")
          .insert({
            username,
            password_hash: passwordHash,
            role,
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error("[initAdmin] 创建管理员失败:", insertError);
          throw insertError;
        }
      }

      console.log("[initAdmin] Supabase 管理员账号初始化成功");
    }

    console.log("\n========================================");
    console.log("管理员账号初始化完成！");
    console.log("========================================");
    console.log("用户名:", username);
    console.log("密码:", password);
    console.log("角色:", role);
    console.log("环境:", region);
    console.log("========================================\n");

  } catch (error) {
    console.error("[initAdmin] 初始化失败:", error);
    process.exit(1);
  }
}

// 运行初始化
initAdmin().catch((error) => {
  console.error("初始化脚本执行失败:", error);
  process.exit(1);
});
