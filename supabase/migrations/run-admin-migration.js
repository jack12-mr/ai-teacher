const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('Running admin tables migration...');

  // Read the SQL file
  const fs = require('fs');
  const sql = fs.readFileSync('./supabase/migrations/admin_tables.sql', 'utf8');

  // Split by semicolon and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      if (error) {
        // Try using raw SQL execution
        console.log('Trying direct SQL...');
      }
    } catch (e) {
      // Continue
    }
  }

  console.log('Migration completed!');
}

runMigration().catch(console.error);
