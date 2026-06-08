import React from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import EventsClient from "./EventsClient";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const supabase = await createClient();

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Fetch user profile to get unit scoping
  const { data: profile } = await supabase
    .from("profiles")
    .select("unit_id, full_name")
    .eq("id", user.id)
    .single();
  const userUnitId = profile?.unit_id ?? null;

  // 1. Query all events and filter them locally by visibility rules.
  let eventsQuery = supabase
    .from('events')
    .select('id, title, description, date, time, location, capacity, unit_id, excluded_unit_ids, is_compulsory')
    .order('date', { ascending: true });

  const [eventsResult, registrationsResult] = await Promise.all([
    eventsQuery,
    supabase
      .from("event_registrations")
      .select("id, event_id, user_id, ticket_code, attended, attended_at, status")
      .eq("user_id", user.id),
  ]);

  const dbEvents = eventsResult.data || [];
  const registrations = registrationsResult.data || [];

  const registeredMap = new Map();
  registrations.forEach(reg => {
    registeredMap.set(reg.event_id, reg);
  });

  const now = new Date();
  // Strip time for simple date comparison if events only use date fields
  const todayStr = now.toISOString().split('T')[0];

  const visibleEvents = dbEvents.filter((event) => {
    // 1. Excluded units check
    const excludedUnits = Array.isArray(event.excluded_unit_ids) ? event.excluded_unit_ids : []
    if (userUnitId && excludedUnits.includes(userUnitId)) {
      return false
    }

    // 2. Compulsory events are always visible
    if (event.is_compulsory) {
      return true
    }

    // 3. Unit-specific optional event — only visible to members of that unit
    if (event.unit_id) {
      return userUnitId === event.unit_id
    }

    // 4. Global/National optional event (no unit_id) — visible to everyone
    return true
  })

  const processedEvents = visibleEvents.map(event => {
    const reg = registeredMap.get(event.id);
    let status = 'none';
    if (reg) {
      if (reg.status === 'present' || reg.attended) status = 'present';
      else if (reg.status === 'leave_pending') status = 'leave_pending';
      else if (reg.status === 'leave_approved') status = 'leave_approved';
      else if (reg.status === 'leave_rejected') status = 'leave_rejected';
      else status = 'registered';
    }

    // Determine past vs upcoming. We compare date.
    const isPast = event.date < todayStr;
    
    // If it's compulsory and past, and not present/leave, it's absent
    if (isPast && event.is_compulsory && status === 'none') {
      status = 'absent';
    } else if (isPast && event.is_compulsory && status === 'registered') {
      status = 'absent';
    }

    return {
      id: event.id,
      title: event.title,
      description: event.description || "",
      date: new Date(event.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      time: event.time,
      location: event.location,
      capacity: event.capacity,
      is_compulsory: event.is_compulsory || false,
      status: status as any,
      rawDate: event.date // internal sorting field
    };
  });

  const upcomingEvents = processedEvents.filter(e => e.rawDate >= todayStr);
  const pastEvents = processedEvents.filter(e => e.rawDate < todayStr).reverse(); // show most recent past first

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1D1D1D] pb-24 relative overflow-hidden">
      <div className="fluid-top-gradient"></div>
      <main className="max-w-lg mx-auto w-full px-4 py-6 relative z-10">
        <EventsClient 
          upcomingEvents={upcomingEvents}
          pastEvents={pastEvents}
          userId={user.id}
        />
      </main>
    </div>
  );
}
