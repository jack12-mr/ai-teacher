const fs = require('fs');

console.log('🚀 Running simplified profiles table migration...\n');

const sql = fs.readFileSync('./supabase/migrations/create_profiles_table_simple.sql', 'utf8');

console.log('📋 SQL to execute (copy this to Supabase SQL Editor):');
console.log('═══════════════════════════════════════════════════════════');
console.log(sql);
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('📝 Next steps:');
console.log('   1. Open Supabase Dashboard: https://supabase.com/dashboard');
console.log('   2. Go to your project');
console.log('   3. Click on "SQL Editor" in the left sidebar');
console.log('   4. Copy and paste the SQL above');
console.log('   5. Click "Run" to execute');
console.log('');
console.log('✅ This will DROP the old profiles table and create a new simplified one!');
