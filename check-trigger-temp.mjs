import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hrcwybaukdyibnwayneq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyY3d5YmF1a2R5aWJud2F5bmVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzU0MTgyNywiZXhwIjoyMDgzMTE3ODI3fQ.uEQPgMwyUIPYHkSKB8fKXm7LeaXJm_8CjeH6dPtVs50';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTrigger() {
  console.log('🔍 检查Supabase数据库触发器...\n');

  try {
    // 检查profiles表是否存在
    console.log('1. 检查profiles表...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (profilesError) {
      console.log('❌ profiles表不存在或无法访问');
      console.log('   错误:', profilesError.message);
      return;
    }
    console.log('✅ profiles表存在\n');

    // 使用SQL查询检查触发器
    console.log('2. 检查触发器 on_auth_user_created...');
    const { data: triggerData, error: triggerError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT
          t.tgname as trigger_name,
          p.proname as function_name,
          c.relname as table_name
        FROM pg_trigger t
        JOIN pg_proc p ON t.tgfoid = p.oid
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'on_auth_user_created';
      `
    });

    if (triggerError) {
      console.log('⚠️  无法直接查询触发器（可能需要特殊权限）');
      console.log('   尝试备用方法...\n');

      // 备用方法：检查auth.users表的触发器
      console.log('3. 检查handle_new_user函数是否存在...');
      const { data: funcCheck, error: funcError } = await supabase.rpc('exec_sql', {
        query: `SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';`
      });

      if (funcError) {
        console.log('⚠️  无法查询函数（可能需要创建RPC函数）');
        console.log('\n📋 建议：');
        console.log('   请在Supabase Dashboard的SQL Editor中运行以下查询来检查：');
        console.log('   SELECT * FROM pg_trigger WHERE tgname = \'on_auth_user_created\';');
        console.log('   SELECT proname FROM pg_proc WHERE proname = \'handle_new_user\';');
      } else if (funcCheck && funcCheck.length > 0) {
        console.log('✅ 函数 handle_new_user 存在');
        console.log('✅ 触发器很可能已正确配置\n');
      } else {
        console.log('❌ 函数 handle_new_user 不存在');
        console.log('⚠️  需要创建触发器和函数\n');
      }
    } else if (triggerData && triggerData.length > 0) {
      console.log('✅ 触发器 on_auth_user_created 存在');
      console.log('   触发器名称:', triggerData[0].trigger_name);
      console.log('   函数名称:', triggerData[0].function_name);
      console.log('   表名:', triggerData[0].table_name);
      console.log('\n✅ 数据库触发器配置正确！\n');
    } else {
      console.log('❌ 触发器 on_auth_user_created 不存在');
      console.log('⚠️  需要创建触发器\n');
    }

  } catch (error) {
    console.log('❌ 检查过程出错:', error.message);
    console.log('\n📋 手动检查方法：');
    console.log('   1. 登录 Supabase Dashboard');
    console.log('   2. 进入 SQL Editor');
    console.log('   3. 运行以下查询：');
    console.log('      SELECT * FROM pg_trigger WHERE tgname = \'on_auth_user_created\';');
    console.log('      SELECT proname FROM pg_proc WHERE proname = \'handle_new_user\';');
  }
}

checkTrigger();
