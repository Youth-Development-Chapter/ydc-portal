import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import LoginClient from "./LoginClient";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  // Session guard: if already authenticated, go straight to next page or dashboard
  const { next } = await searchParams;
  const supabase = await createClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (e) {
    // Ignore auth api errors when not logged in
  }
  
  if (user) {
    redirect(next || "/dashboard");
  }

  return <LoginClient next={next} />;
}
