const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function setupAdmin() {
  console.log('Setting up admin tables via Supabase...');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const username = 'admin';
  const password = 'admin123';
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(password, 10);

  // Try to create admin user - this will tell us if tables exist
  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      username,
      password: hashedPassword,
      role: 'super_admin',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('\n❌ Admin tables do not exist yet!');
    console.error('\n⚠️  You need to run the SQL migration manually:');
    console.error('\n1. Go to: https://supabase.com/dashboard/project/hrcwybaukdyibnwayneq/sql');
    console.error('2. Open the file: supabase/migrations/admin_tables.sql');
    console.error('3. Paste and execute the SQL');
    console.error('4. Then run: node scripts/setup-admin.js');
    process.exit(1);
  }

  console.log('\n✓ Admin account created successfully!');
  console.log(`  Username: ${username}`);
  console.log(`  Password: ${password}`);
  console.log('\nLogin at: http://localhost:3000/admin/login');
}

setupAdmin().catch(console.error);
