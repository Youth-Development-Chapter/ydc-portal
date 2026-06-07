const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}

envContent.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (!match) return
  let value = match[2] ? match[2].trim() : ''
  if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
  if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
  env[match[1]] = value
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, full_name, role, unit_id')
    .limit(10)

  if (pError) {
    console.error(pError)
    process.exit(1)
  }

  const { data: units, error: uError } = await supabase
    .from('units')
    .select('id, name')

  if (uError) {
    console.error(uError)
    process.exit(1)
  }

  console.log('Profiles:', JSON.stringify(profiles, null, 2))
  console.log('Units:', JSON.stringify(units, null, 2))
  process.exit(0)
}

run()
