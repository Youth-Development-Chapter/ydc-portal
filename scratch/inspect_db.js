const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
  console.log("Testing streaks query...");
  const { data: streaks, error: sErr } = await supabase
    .from('streaks')
    .select('user_id, current_streak, longest_streak')
    .limit(1);
  if (sErr) console.error("Streaks query failed:", sErr);
  else console.log("Streaks query succeeded.");

  console.log("Testing coin_transactions query...");
  const { data: coinAggs, error: cErr } = await supabase
    .from('coin_transactions')
    .select('user_id, amount')
    .limit(1);
  if (cErr) console.error("Coin transactions query failed:", cErr);
  else console.log("Coin transactions query succeeded.");

  console.log("Testing admin_permissions query...");
  const { data: adminPerms, error: aErr } = await supabase
    .from('admin_permissions')
    .select('*')
    .limit(1);
  if (aErr) console.error("Admin permissions query failed:", aErr);
  else console.log("Admin permissions query succeeded.");
}

inspect();
