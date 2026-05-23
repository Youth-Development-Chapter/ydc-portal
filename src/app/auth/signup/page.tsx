import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import SignupClient from "./SignupClient";

export default async function SignupPage() {
  // Session guard: if already authenticated, go straight to dashboard
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect("/dashboard");
  }

  return <SignupClient />;
}
