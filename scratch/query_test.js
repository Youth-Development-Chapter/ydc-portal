const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const envLines = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8').split('\n');
const envConfig = {};
for (const line of envLines) {
  const trimLine = line.trim();
  if (trimLine && !trimLine.startsWith('#')) {
    const parts = trimLine.split('=');
    if (parts.length >= 2) {
      envConfig[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  }
}
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // 1. Fetch events
  const { data: events } = await supabase.from('events').select('*');
  console.log("EVENTS:", events.map(e => ({ id: e.id, title: e.title, is_compulsory: e.is_compulsory, unit_id: e.unit_id })));

  const eventId = events.find(e => e.title.includes('FDSAFSD'))?.id;
  if (!eventId) {
    console.log("No event found matching FDSAFSD");
    return;
  }
  console.log("\nFound event ID:", eventId);

  // 2. Fetch event registrations for this event
  const { data: regs } = await supabase
    .from('event_registrations')
    .select('*, profiles(id, full_name, unit_id, role)')
    .eq('event_id', eventId);
  console.log("\nREGISTRATIONS:", regs.map(r => ({
    id: r.id,
    user_id: r.user_id,
    attended: r.attended,
    status: r.status,
    profile_name: r.profiles?.full_name,
    profile_unit: r.profiles?.unit_id,
    profile_role: r.profiles?.role
  })));

  // 3. Fetch all volunteers in database
  const { data: volunteers } = await supabase.from('profiles').select('id, full_name, unit_id, role').eq('role', 'volunteer');
  console.log("\nALL VOLUNTEERS:", volunteers);

  // 4. Try running the exact query from page.tsx or getEventRoster compulsory branch
  // Without unit filter:
  let query = supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      qualification,
      unit_id,
      event_registrations(
        id,
        attended,
        attended_at,
        status,
        leave_note,
        ticket_code,
        event_id
      )
    `)
    .eq('role', 'volunteer')
    .eq('event_registrations.event_id', eventId);
  
  const { data: testResult1, error: err1 } = await query;
  if (err1) {
    console.error("Query 1 Error:", err1);
  } else {
    console.log("\nQUERY 1 RESULT (without unit filter):", testResult1.map(p => ({
      id: p.id,
      full_name: p.full_name,
      unit_id: p.unit_id,
      regs: p.event_registrations
    })));
  }

  // 5. Test regsQuery with profiles inner join and filter
  let regsQuery = supabase
    .from('event_registrations')
    .select(`
      id,
      attended,
      attended_at,
      status,
      leave_note,
      ticket_code,
      profiles!inner(
        id,
        full_name,
        qualification,
        unit_id,
        units:unit_id(name),
        role
      )
    `)
    .eq('event_id', eventId);

  // Test filter on nested property profiles.unit_id or profiles.role
  const { data: regsResult, error: regsErr } = await regsQuery;
  if (regsErr) {
    console.error("regsQuery Error:", regsErr);
  } else {
    console.log("\nREGS QUERY RESULT:", regsResult.map(r => ({
      id: r.id,
      user_id: r.profiles?.id,
      full_name: r.profiles?.full_name,
      role: r.profiles?.role,
      unit_id: r.profiles?.unit_id,
      unit_name: r.profiles?.units?.name
    })));
  }
}

run();
