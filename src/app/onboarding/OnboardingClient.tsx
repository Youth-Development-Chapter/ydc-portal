"use client";

import React, { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Users, Calendar, Phone, MessageCircle, MapPin, 
  Building, Map, Camera, Loader2, AlertCircle, ArrowRight,
  Mail, User as UserIcon
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { completeProfile } from "../auth/actions";

type Unit = {
  id: string;
  name: string;
  province: string | null;
}

function FormContent({ initialName, initialEmail, units }: { initialName: string, initialEmail: string, units: Unit[] }) {
  const [state, action, pending] = useActionState(completeProfile, null);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "";
  const notice = searchParams.get("notice");

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1D1D1D] py-12 px-6">
      
      <div className="max-w-3xl mx-auto mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <img src="/logocolor.png" alt="YDC Logo" className="h-12 w-auto" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-[#1D1D1D] mb-3">
          Complete Your Profile
        </h1>
        <p className="text-[#555555] text-lg">
          Welcome to the YDC Portal! Let&apos;s get to know you better.
        </p>
      </div>

      <div className="max-w-3xl mx-auto bg-white border border-[#E5E5E5] rounded-2xl shadow-xl overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-[#0BA242]"></div>
        
        <div className="p-8 sm:p-10">
          {notice === "profile" && (
            <div className="mb-8 p-4 rounded-xl bg-blue-50 border border-blue-200 flex gap-3 text-sm text-blue-700 animate-in fade-in duration-300">
              <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold mb-1">Profile Onboarding Required</p>
                <p>Please complete your profile details to access the course catalog and track your progress.</p>
              </div>
            </div>
          )}

          {state?.error && (
            <div className="mb-8 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex gap-3">
              <AlertCircle className="text-[#DC2626] shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-[#991B1B] leading-relaxed">
                <p className="font-bold mb-1">Profile Update Failed</p>
                <p>{state.error}</p>
              </div>
            </div>
          )}

          <form className="space-y-8" action={action}>
            <input type="hidden" name="next" value={next} />
            
            {/* Account Info (Locked) */}
            <div>
              <h3 className="text-lg font-bold text-[#1D1D1D] mb-4 pb-2 border-b border-[#E5E5E5]">
                Account Information
              </h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <Input
                  id="full_name_display"
                  name="full_name_display"
                  type="text"
                  label="Full Name"
                  value={initialName}
                  disabled
                  leftIcon={<UserIcon size={18} />}
                  className="bg-gray-100 text-gray-500"
                />
                <Input
                  id="email_display"
                  name="email_display"
                  type="email"
                  label="Email Address"
                  value={initialEmail}
                  disabled
                  leftIcon={<Mail size={18} />}
                  className="bg-gray-100 text-gray-500"
                />
              </div>
            </div>

            {/* Personal Details */}
            <div>
              <h3 className="text-lg font-bold text-[#1D1D1D] mb-4 pb-2 border-b border-[#E5E5E5]">
                Personal Details
              </h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <Input
                  id="father_name"
                  name="father_name"
                  type="text"
                  label="Father's Name"
                  required
                  placeholder="Father's Name"
                  leftIcon={<Users size={18} />}
                />

                <Input
                  id="dob"
                  name="dob"
                  type="date"
                  label="Date of Birth"
                  required
                  leftIcon={<Calendar size={18} />}
                  className="cursor-pointer"
                />

                <Input
                  id="profile_pic"
                  name="profile_pic"
                  type="file"
                  accept="image/*"
                  label="Profile Picture"
                  required
                  leftIcon={<Camera size={18} />}
                  className="pt-3 pb-2 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#F5F5F5] file:text-[#1D1D1D] hover:file:bg-[#E5E5E5] cursor-pointer sm:col-span-2"
                />
              </div>
            </div>

            {/* Contact Details */}
            <div>
              <h3 className="text-lg font-bold text-[#1D1D1D] mb-4 pb-2 border-b border-[#E5E5E5]">
                Contact & Location
              </h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  label="WhatsApp Number"
                  required
                  placeholder="+92 300 1234567"
                  leftIcon={<MessageCircle size={18} />}
                />

                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  label="Alternative Mobile Number (Optional)"
                  placeholder="+92 300 1234567"
                  leftIcon={<Phone size={18} />}
                />
              </div>

              <div className="mt-6">
                <Input
                  id="address"
                  name="address"
                  type="text"
                  label="Residential Address"
                  required
                  placeholder="House #, Street, Block..."
                  leftIcon={<MapPin size={18} />}
                />
              </div>
            </div>

            {/* YDC Details */}
            <div>
              <h3 className="text-lg font-bold text-[#1D1D1D] mb-4 pb-2 border-b border-[#E5E5E5]">
                YDC Academic & Regional Details
              </h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <Select
                  id="unit_id"
                  name="unit_id"
                  label="City / Unit"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>Select City / Unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} {unit.province ? `(${unit.province})` : ''}
                    </option>
                  ))}
                </Select>

                <Select
                  id="qualification"
                  name="qualification"
                  label="Highest Qualification"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>Select Qualification</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="matric">Matric</option>
                  <option value="fsc">F.Sc / Intermediate</option>
                  <option value="graduate">Graduate</option>
                  <option value="ms">M.S / M.Phil</option>
                </Select>
              </div>
            </div>

            <div className="pt-6 border-t border-[#E5E5E5] flex justify-end">
              <Button
                type="submit"
                disabled={pending}
                className="bg-[#0BA242] hover:bg-[#098235] text-white border-transparent shadow-md focus:ring-[#0BA242] text-base cursor-pointer disabled:opacity-70 px-8 py-3 h-auto"
                size="lg"
              >
                {pending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={20} />
                    Saving Profile...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Complete Profile <ArrowRight size={18} />
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingClient({ initialName, initialEmail, units }: { initialName: string, initialEmail: string, units: Unit[] }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <Loader2 className="animate-spin text-[#0BA242]" size={36} />
      </div>
    }>
      <FormContent initialName={initialName} initialEmail={initialEmail} units={units} />
    </Suspense>
  );
}
