const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runProfilesMigration() {
  console.log('🚀 Running profiles table migration...');

  try {
    // Read the SQL file
    const sql = fs.readFileSync('./supabase/migrations/create_profiles_table.sql', 'utf8');

    console.log('📄 SQL file loaded, executing...');
    console.log('⚠️  If this fails, please run the SQL manually in Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
    console.log('');

    // Note: Direct SQL execution from client-side is not supported by Supabase
    // You need to run this SQL in the Supabase Dashboard SQL Editor
    console.log('📋 SQL to execute (copy this to Supabase SQL Editor):');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(sql);
    console.log('═══════════════════════════════════════════════════════════');

    console.log('');
    console.log('✅ Migration file created at: ./supabase/migrations/create_profiles_table.sql');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Open Supabase Dashboard: https://supabase.com/dashboard');
    console.log('   2. Go to your project');
    console.log('   3. Click on "SQL Editor" in the left sidebar');
    console.log('   4. Copy and paste the SQL above');
    console.log('   5. Click "Run" to execute');
    console.log('');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runProfilesMigration().catch(console.error);
