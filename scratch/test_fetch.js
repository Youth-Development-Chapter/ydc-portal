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

async function testFetch() {
  console.log('Fetching raw Supabase URL (Root):', supabaseUrl);
  try {
    const res = await fetch(supabaseUrl + '/', {
      headers: {
        'apikey': getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')
      }
    });
    console.log('Status:', res.status);
    console.log('Headers:', Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log('Body snippet:', text.substring(0, 500));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testFetch();
