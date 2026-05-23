const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`${name}=(.*)`));
  return match ? match[1].replace(/\r/g, '').trim() : null;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

console.log('URL:', JSON.stringify(supabaseUrl));
console.log('KEY length:', supabaseKey?.length);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing Supabase query on profiles...');
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, division, qualification, created_at')
    .limit(5);

  if (error) {
    console.error('Query Error:', error);
  } else {
    console.log('Query success! Data length:', data?.length);
    console.log('Sample data:', data?.[0]);
  }
}

test();
