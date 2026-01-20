const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  console.log('Connecting to Supabase...');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Running admin tables migration...\n');

  // Read and split the SQL file
  const sql = fs.readFileSync('./supabase/migrations/admin_tables.sql', 'utf8');

  // Execute each statement using Supabase RPC
  // We need to use the SQL approach differently since Supabase client doesn't support raw SQL directly

  // For now, let's create the tables individually using Supabase's table API is not possible
  // So we'll use a different approach - execute SQL via Supabase SQL execution API

  console.log('\n⚠️  Please run the following SQL in your Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/' + process.env.NEXT_PUBLIC_SUPABASE_URL.split('//')[1].split('.')[0] + '/sql\n');
  console.log(sql);

  console.log('\nAfter running the SQL, run: npx tsx scripts/create-admin.ts --username admin --password admin123 --force');
}

runMigration().catch(console.error);
