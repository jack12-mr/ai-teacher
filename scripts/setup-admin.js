const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  console.log('Connecting to Supabase...');

  // Extract project ref from URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = supabaseUrl.match(/\/\/([^.]+)\.supabase/)[1];

  console.log(`Project ref: ${projectRef}`);

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Read the SQL file
  const sql = fs.readFileSync('./supabase/migrations/admin_tables.sql', 'utf8');

  // Use Supabase REST API to execute SQL
  const response = await fetch(`https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      sql_query: sql
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to execute SQL:', error);

    // Provide fallback instructions
    console.log('\n⚠️  Automatic migration failed.');
    console.log('\nPlease run the following SQL manually in Supabase SQL Editor:');
    console.log(`https://supabase.com/dashboard/project/${projectRef}/sql\n`);
    console.log(sql);
    console.log('\nAfter running the SQL, run: npx tsx scripts/create-admin.ts --username admin --password admin123 --force');
    process.exit(1);
  }

  const result = await response.json();
  console.log('Migration completed successfully!');

  // Now create admin
  console.log('\nCreating admin account...');
  const bcrypt = require('bcryptjs');
  const supabase = createClient(supabaseUrl, serviceKey);

  const username = 'admin';
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      username,
      password: hashedPassword,
      role: 'super_admin',
      status: 'active',
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create admin:', error);
    process.exit(1);
  }

  console.log('\n✓ Admin account created successfully!');
  console.log(`  Username: ${username}`);
  console.log(`  Password: ${password}`);
  console.log(`  Role: super_admin`);
  console.log('\nLogin at: http://localhost:3000/admin/login');
}

runMigration().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
