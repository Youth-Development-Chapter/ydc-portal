"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface UpdateProfileResult {
  success: boolean;
  error?: string;
}

export async function updateProfile(formData: FormData): Promise<UpdateProfileResult> {
  const supabase = await createClient();

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not signed in." };
  }

  // Retrieve form values
  const fullName = formData.get("fullName") as string;
  const fatherName = formData.get("fatherName") as string;
  const whatsapp = formData.get("whatsapp") as string;
  const phone = formData.get("phone") as string;
  const qualification = formData.get("qualification") as string;
  const division = formData.get("division") as string;
  const district = formData.get("district") as string;
  const city = formData.get("city") as string;
  const address = formData.get("address") as string;

  if (!fullName || fullName.trim() === "") {
    return { success: false, error: "Full Name is required." };
  }

  // Update profile
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      father_name: fatherName,
      whatsapp: whatsapp,
      phone: phone,
      qualification: qualification,
      division: division,
      district: district,
      city: city,
      address: address,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("updateProfile error:", error);
    return { success: false, error: error.message };
  }

  // Revalidate paths to refresh profile details everywhere
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");

  return { success: true };
}
