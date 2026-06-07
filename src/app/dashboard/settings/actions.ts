"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

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
  const unit_id = formData.get("unit_id") as string;
  const address = formData.get("address") as string;
  const profile_pic = formData.get("profile_pic") as File | null;

  if (!fullName || fullName.trim() === "") {
    return { success: false, error: "Full Name is required." };
  }

  let avatarUrl = undefined;
  if (profile_pic && profile_pic.size > 0) {
    if (profile_pic.size > MAX_AVATAR_SIZE) {
      return { success: false, error: 'Profile picture must be smaller than 5 MB.' };
    }
    if (!ALLOWED_IMAGE_TYPES.has(profile_pic.type)) {
      return { success: false, error: 'Profile picture must be a JPEG, PNG, WEBP, GIF, or HEIC file.' };
    }

    const fileExt = profile_pic.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${user.id}/${randomUUID()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(`public/${fileName}`, profile_pic, { upsert: true });

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(`public/${fileName}`);
      avatarUrl = publicUrlData.publicUrl;
    }
  }

  const updates: any = {
      full_name: fullName,
      father_name: fatherName,
      whatsapp: whatsapp,
      phone: phone,
      qualification: qualification,
      unit_id: unit_id || null,
      address: address,
      updated_at: new Date().toISOString(),
  };

  if (avatarUrl !== undefined) {
    updates.avatar_url = avatarUrl;
  }

  // Update profile
  const { error } = await supabase
    .from("profiles")
    .update(updates)
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
