import { config } from "dotenv";
config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "../lib/integrations/supabase-admin";

async function resetAdminPassword() {
  const supabase = getSupabaseAdmin();
  const username = "admin";
  const newPassword = "Zyx!213416";

  // 哈希新密码
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // 更新数据库
  const { data, error } = await supabase
    .from("admin_users")
    .update({ password_hash: passwordHash })
    .eq("username", username)
    .select();

  if (error) {
    console.error("更新失败:", error);
    process.exit(1);
  }

  console.log("密码重置成功!");
  console.log("用户名:", username);
  console.log("新密码:", newPassword);
}

resetAdminPassword().catch(console.error);
