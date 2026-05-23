"use client";

import React, { useState, useTransition } from "react";
import { User, Phone, BookOpen, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { updateProfile } from "./actions";
import PageHeader from "@/components/ui/PageHeader";

interface Profile {
  full_name: string;
  father_name: string | null;
  whatsapp: string | null;
  phone: string | null;
  qualification: string | null;
  division: string | null;
  district: string | null;
  city: string | null;
  address: string | null;
}

export default function SettingsForm({ initialProfile }: { initialProfile: Profile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);

    const formData = new FormData();
    formData.append("fullName", profile.full_name);
    formData.append("fatherName", profile.father_name || "");
    formData.append("whatsapp", profile.whatsapp || "");
    formData.append("phone", profile.phone || "");
    formData.append("qualification", profile.qualification || "");
    formData.append("division", profile.division || "");
    formData.append("district", profile.district || "");
    formData.append("city", profile.city || "");
    formData.append("address", profile.address || "");

    startTransition(async () => {
      const res = await updateProfile(formData);
      if (res.success) {
        setStatus({ type: "success", message: "Profile updated successfully! 🎉" });
        // Scroll to top to see success banner
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setStatus({ type: "error", message: res.error || "Failed to update profile." });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title="Profile Settings" backHref="/dashboard" />

      {status && (
        <div 
          className={`p-4 rounded-2xl flex items-start gap-3 border animate-in slide-in-from-top duration-300 ${
            status.type === "success" 
              ? "bg-green-50 border-green-200 text-green-800" 
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-green-600" />
          ) : (
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
          )}
          <span className="text-xs font-semibold">{status.message}</span>
        </div>
      )}

      {/* Profile Edit Card */}
      <form onSubmit={handleSubmit} className="bg-white border border-[#E5E5E5] rounded-3xl p-6 shadow-sm space-y-6">
        
        {/* Personal Details Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#F5F5F5] pb-2">
            <User size={18} className="text-[#0A9EDE]" />
            <h3 className="font-bold text-sm text-[#1D1D1D]">Personal Details</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="full_name" className="text-xs font-bold text-[#555555] block mb-1">
                Full Name <span className="text-[#DD0408]">*</span>
              </label>
              <input
                id="full_name"
                type="text"
                name="full_name"
                required
                value={profile.full_name || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#0A9EDE] transition-colors"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="father_name" className="text-xs font-bold text-[#555555] block mb-1">
                Father&apos;s Name
              </label>
              <input
                id="father_name"
                type="text"
                name="father_name"
                value={profile.father_name || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#0A9EDE] transition-colors"
                placeholder="Enter father's name"
              />
            </div>
          </div>
        </div>

        {/* Contact Numbers Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#F5F5F5] pb-2">
            <Phone size={18} className="text-[#DD0408]" />
            <h3 className="font-bold text-sm text-[#1D1D1D]">Contact Information</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="phone" className="text-xs font-bold text-[#555555] block mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={profile.phone || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#0A9EDE] transition-colors"
                placeholder="Phone"
              />
            </div>

            <div>
              <label htmlFor="whatsapp" className="text-xs font-bold text-[#555555] block mb-1">
                WhatsApp
              </label>
              <input
                id="whatsapp"
                type="tel"
                name="whatsapp"
                value={profile.whatsapp || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#0A9EDE] transition-colors"
                placeholder="WhatsApp"
              />
            </div>
          </div>
        </div>

        {/* Academic Qualification Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#F5F5F5] pb-2">
            <BookOpen size={18} className="text-[#0BA242]" />
            <h3 className="font-bold text-sm text-[#1D1D1D]">Academic Profile</h3>
          </div>

          <div>
            <label htmlFor="qualification" className="text-xs font-bold text-[#555555] block mb-1">
              Education / Qualification
            </label>
            <input
              id="qualification"
              type="text"
              name="qualification"
              value={profile.qualification || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#0A9EDE] transition-colors"
              placeholder="e.g. Matric, Intermediate, BS CS, etc."
            />
          </div>
        </div>

        {/* Regional Location Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#F5F5F5] pb-2">
            <MapPin size={18} className="text-orange-500" />
            <h3 className="font-bold text-sm text-[#1D1D1D]">Address & Location</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="division" className="text-xs font-bold text-[#555555] block mb-1">
                Division
              </label>
              <select
                id="division"
                name="division"
                value={profile.division || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm bg-white focus:outline-none focus:border-[#0A9EDE] transition-colors"
              >
                <option value="">Select Division</option>
                <option value="Karachi">Karachi</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Sukkur">Sukkur</option>
                <option value="Larkana">Larkana</option>
                <option value="Mirpur Khas">Mirpur Khas</option>
                <option value="Shaheed Benazirabad">Shaheed Benazirabad</option>
              </select>
            </div>

            <div>
              <label htmlFor="district" className="text-xs font-bold text-[#555555] block mb-1">
                District
              </label>
              <input
                id="district"
                type="text"
                name="district"
                value={profile.district || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#0A9EDE] transition-colors"
                placeholder="District"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label htmlFor="city" className="text-xs font-bold text-[#555555] block mb-1">
                City / Town
              </label>
              <input
                id="city"
                type="text"
                name="city"
                value={profile.city || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#0A9EDE] transition-colors"
                placeholder="City Name"
              />
            </div>

            <div>
              <label htmlFor="address" className="text-xs font-bold text-[#555555] block mb-1">
                Residential Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={2}
                value={profile.address || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#0A9EDE] transition-colors resize-none"
                placeholder="Street address, block, sector..."
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          isLoading={isPending}
          disabled={isPending}
          className="w-full bg-[#0A9EDE] hover:bg-[#0A9EDE]/90 text-white font-bold"
        >
          Save Profile Updates
        </Button>
      </form>
    </div>
  );
}
