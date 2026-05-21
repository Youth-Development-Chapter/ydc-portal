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

  // Fetch upcoming events from Supabase ordered by date
  const { data: dbEvents } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });

  // Fetch current user registrations
  const { data: registrations } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("user_id", user.id);

  const registeredMap = new Map();
  registrations?.forEach(reg => {
    registeredMap.set(reg.event_id, reg);
  });

  const events = (dbEvents || []).map(event => {
    const reg = registeredMap.get(event.id);
    return {
      id: event.id,
      title: event.title,
      description: event.description || "",
      date: new Date(event.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      time: event.time,
      location: event.location,
      capacity: event.capacity,
      joined: !!reg,
      ticketCode: reg ? reg.ticket_code : null,
      attended: reg ? reg.attended : false
    };
  });

  // Find active registration for QR code display
  const activeRegWithEvent = (registrations || [])
    .filter(reg => !reg.attended)
    .map(reg => {
      const ev = (dbEvents || []).find(e => e.id === reg.event_id);
      return {
        ...reg,
        event: ev
      };
    })
    .find(reg => reg.event);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1D1D1D] pb-24">
      <main className="max-w-lg mx-auto w-full px-4 py-6">
        <EventsClient 
          events={events} 
          activeTicket={activeRegWithEvent || null} 
        />
      </main>
    </div>
  );
}
