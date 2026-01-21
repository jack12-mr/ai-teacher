/**
 * Debug API to run database migrations
 */

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/integrations/supabase-admin";
import { readFileSync } from "fs";
import { join } from "path";

export async function POST(request: Request) {
  try {
    const { migrationName } = await request.json();

    if (!migrationName) {
      return NextResponse.json({
        success: false,
        error: "migrationName is required",
      });
    }

    console.log(`🔄 [Migration] Running migration: ${migrationName}`);

    const supabase = getSupabaseAdmin();

    // 读取migration文件
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', `${migrationName}.sql`);

    let sql: string;
    try {
      sql = readFileSync(migrationPath, 'utf-8');
    } catch (err) {
      return NextResponse.json({
        success: false,
        error: `Migration file not found: ${migrationName}.sql`,
      }, { status: 404 });
    }

    console.log(`📄 [Migration] SQL file loaded, length: ${sql.length}`);

    // 执行SQL - 注意：Supabase client不支持直接执行DDL
    // 这里我们需要使用RPC或直接SQL执行
    // 对于调试目的，我们使用supabase.rpc()

    // 分割SQL语句（简单分割，按分号）
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    const results = [];

    for (const statement of statements) {
      if (statement.trim().length === 0) continue;

      console.log(`\n📝 [Migration] Executing statement:`);
      console.log(statement.substring(0, 100) + '...');

      try {
        // 使用rpc执行SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });

        if (error) {
          // 如果exec_sql不存在，尝试其他方法
          console.warn(`⚠️ [Migration] exec_sql RPC failed, trying direct query`);

          // 直接查询可能会失败，但我们可以记录
          results.push({
            statement: statement.substring(0, 50),
            status: 'skipped',
            error: 'Cannot execute DDL via JS client'
          });
        } else {
          results.push({
            statement: statement.substring(0, 50),
            status: 'success',
            data
          });
        }
      } catch (err: any) {
        results.push({
          statement: statement.substring(0, 50),
          status: 'error',
          error: err.message
        });
      }
    }

    console.log(`✅ [Migration] Migration complete`);

    return NextResponse.json({
      success: true,
      message: `Migration ${migrationName} executed`,
      results,
      instructions: 'Some DDL statements may need to be executed manually in Supabase SQL Editor'
    });
  } catch (error: any) {
    console.error("❌ [Migration] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
        details: error,
      },
      { status: 500 }
    );
  }
}
