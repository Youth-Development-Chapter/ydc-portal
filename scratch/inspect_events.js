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
  const titleFilter = process.argv.slice(2).join(' ') || 'DSA'
  const { data, error } = await supabase
    .from('events')
    .select('id,title,is_compulsory,unit_id,division,excluded_unit_ids,created_at')
    .ilike('title', `%${titleFilter}%`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    process.exit(1)
  }

  console.log(JSON.stringify(data, null, 2))
  process.exit(0)
}

run()