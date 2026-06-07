import React from "react";
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import OnboardingClient from "./OnboardingClient";

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Fetch the active units
  const { data: units } = await supabase
    .from('units')
    .select('id, name, province')
    .order('name');

  return (
    <OnboardingClient 
      initialName={user.user_metadata?.full_name || ''}
      initialEmail={user.email || ''}
      units={units || []}
    />
  );
}
