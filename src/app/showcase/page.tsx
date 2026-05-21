"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import {
  Sparkles,
  User,
  Mail,
  Lock,
  Compass,
  Award,
  Users,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

export default function ShowcasePage() {
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    pillar: "character",
    newsletter: true,
  });

  const [formErrors, setFormErrors] = useState({
    name: "",
    email: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, newsletter: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let hasErrors = false;
    const errors = { name: "", email: "" };

    if (!formData.name.trim()) {
      errors.name = "Name is required to register.";
      hasErrors = true;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      errors.email = "Please enter a valid email address.";
      hasErrors = true;
    }

    if (hasErrors) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitLoading(true);
    setTimeout(() => {
      setIsSubmitLoading(false);
      alert(`Success! Registered volunteer ${formData.name} under ${formData.pillar.toUpperCase()}!`);
      setFormData({
        name: "",
        email: "",
        pillar: "character",
        newsletter: true,
      });
    }, 1500);
  };

  const triggerErrorDemo = () => {
    setShowError(!showError);
  };

  return (
    <div className="min-h-screen bg-white text-[#1D1D1D] selection:bg-[#1D1D1D] selection:text-white transition-colors duration-300">
      
      {/* Header section */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E5E5E5]">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logocolor.png" alt="YDC Logo" className="h-12 w-auto" />
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="inverse" className="text-[10px] tracking-widest px-2 py-0.5">V2.0.0</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-16">
        
        {/* Title Intro */}
        <section className="text-center md:text-left space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E5E5E5] bg-[#F5F5F5] text-[#1D1D1D] text-xs font-semibold">
            <Sparkles size={12} className="animate-spin" />
            Vercel-Inspired Minimal B&W UI
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1D1D1D]">
            Youth Development Center <br/>
            <span className="text-[#A3A3A3] font-black">
              Theme & UI Library
            </span>
          </h1>
          <p className="text-[#555555] text-base md:text-lg leading-relaxed">
            A premium, strictly black and white, ultra-lightweight, and mobile-centric design system featuring big touch inputs and a fluid brand gradient at the bottom.
          </p>
        </section>

        {/* 1. MOBILE PREVIEW PORT / FORM SIMULATOR */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#A3A3A3]">01 / MOBILE CENTRIC INTERACTIVE PREVIEW</h2>
            <p className="text-sm text-[#555555]">How the big inputs, select dropdowns, and switch inputs behave in a simulated mobile device layout.</p>
          </div>

          <div className="flex justify-center">
            {/* Simulated Phone Frame */}
            <div className="w-full max-w-sm border border-[#E5E5E5] rounded-[40px] bg-white overflow-hidden shadow-2xl relative">
              {/* Phone Notch/Island */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 rounded-full bg-black z-20 flex items-center justify-between px-2 text-[8px] text-white">
                <div className="w-1.5 h-1.5 rounded-full bg-[#333333]" />
                <div className="w-8 h-1 rounded-full bg-[#333333]" />
              </div>
              
              <div className="pt-8 px-6 pb-8 space-y-6">
                <div className="text-center space-y-1 mt-2">
                  <div className="inline-flex gap-1.5 items-center justify-center text-xs font-bold text-[#A3A3A3]">
                    <span>YDC PIONEER REGISTER</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#1D1D1D]">Become a Volunteer</h3>
                  <p className="text-xs text-[#555555] max-w-[240px] mx-auto">Fill in details. Touch targets are scaled to 48px height for easier mobile interactions.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Volunteer Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    leftIcon={<User size={16} />}
                    error={formErrors.name}
                  />

                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@domain.com"
                    leftIcon={<Mail size={16} />}
                    error={formErrors.email}
                  />

                  <Select
                    label="Pillar Focus Area"
                    name="pillar"
                    value={formData.pillar}
                    onChange={handleInputChange}
                  >
                    <option value="character">Character (Moral & Kindness)</option>
                    <option value="career">Career (Skills & Growth)</option>
                    <option value="community">Community (Local Service)</option>
                  </Select>

                  <Switch
                    label="Subscribe to YDC updates"
                    checked={formData.newsletter}
                    onChange={handleSwitchChange}
                    className="py-1"
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full mt-2"
                    isLoading={isSubmitLoading}
                  >
                    Register Now
                  </Button>
                </form>
              </div>
              
              {/* Simulated home bar */}
              <div className="h-6 flex items-center justify-center bg-[#FAFAFA] border-t border-[#E5E5E5]">
                <div className="w-24 h-1 rounded-full bg-[#A3A3A3]" />
              </div>
            </div>
          </div>
        </section>

        {/* 2. DETAILED COMPONENT GROUPS */}
        <section className="space-y-12">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#A3A3A3]">02 / COMPONENT LIBRARY DIRECTORY</h2>
            <p className="text-sm text-[#555555]">Detailed component variants and custom config flags.</p>
          </div>

          <Tabs defaultValue="buttons" className="space-y-6">
            <TabsList>
              <TabsTrigger value="buttons">Buttons</TabsTrigger>
              <TabsTrigger value="inputs">Inputs & Toggles</TabsTrigger>
              <TabsTrigger value="cards">Cards</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
            </TabsList>

            {/* BUTTONS PREVIEW */}
            <TabsContent value="buttons" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-[#A3A3A3] uppercase">Core Variants</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary">Primary Black</Button>
                    <Button variant="secondary">Secondary White</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost link</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-[#A3A3A3] uppercase">Touch/Sizing Configurations</h3>
                  <div className="flex items-end gap-3">
                    <Button size="sm">Small Target</Button>
                    <Button size="md">Medium Target</Button>
                    <Button size="lg">Large Target (Mobile)</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-[#A3A3A3] uppercase">States & Micro-animations</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button isLoading variant="primary">Loading State</Button>
                    <Button disabled variant="primary">Disabled Button</Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        alert("Haptic scale micro-animation triggered! Click is snappy.");
                      }}
                    >
                      Tap for Click Scale
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* INPUTS PREVIEW */}
            <TabsContent value="inputs" className="space-y-6">
              <div className="max-w-xl space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-[#A3A3A3] uppercase">Sleek Input Fields</h3>
                  <Input 
                    label="Username" 
                    placeholder="e.g. rohanghalib" 
                    leftIcon={<User size={16} />}
                  />
                  <Input 
                    label="Password" 
                    type="password" 
                    placeholder="••••••••" 
                    leftIcon={<Lock size={16} />}
                    rightIcon={
                      <button type="button" onClick={() => alert("Toggle visibility")} className="text-[#A3A3A3] hover:text-[#555555] focus:outline-none">
                        <HelpCircle size={16} />
                      </button>
                    }
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-[#A3A3A3] uppercase">Error States</h3>
                    <Button size="sm" variant="outline" onClick={triggerErrorDemo}>
                      {showError ? "Hide Error" : "Trigger Validation"}
                    </Button>
                  </div>
                  <Input 
                    label="Pioneers Referral Code" 
                    placeholder="Enter code" 
                    error={showError ? "Invalid referral code. Please check and try again." : undefined}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-[#A3A3A3] uppercase">Switch Toggles</h3>
                  <div className="space-y-3">
                    <Switch label="Dark mode enabled" defaultChecked={false} />
                    <Switch label="Notifications (Disabled)" disabled defaultChecked={true} />
                    <Switch label="Haptic feedback on inputs" defaultChecked={true} />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* CARDS PREVIEW */}
            <TabsContent value="cards" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card variant="default">
                  <CardHeader>
                    <CardTitle>Standard Card</CardTitle>
                    <CardDescription>Simple clean layout</CardDescription>
                  </CardHeader>
                  <CardContent>
                    Minimalist layout with thin borders, matching the stark white aesthetic. High legibility is ensured with generous sizing.
                  </CardContent>
                </Card>

                <Card interactive>
                  <CardHeader>
                    <CardTitle>Interactive Hover Card</CardTitle>
                    <CardDescription>Hover over me to view effect</CardDescription>
                  </CardHeader>
                  <CardContent>
                    This card dynamically activates a darker border frame and shifts up on hover, drawing heavy user engagement.
                  </CardContent>
                  <CardFooter className="text-xs text-[#A3A3A3]">
                    Hover status: Interactive
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            {/* BADGES PREVIEW */}
            <TabsContent value="badges" className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-[#A3A3A3] uppercase">Default / Outlines</h3>
                  <div className="flex gap-2">
                    <Badge variant="default">Default Tag</Badge>
                    <Badge variant="outline">Outline Tag</Badge>
                    <Badge variant="inverse">Inverse Black</Badge>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* 3. WEB ACCESSIBILITY & MOBILE CENTRIC POLISH SUMMARY */}
        <section className="border-t border-[#E5E5E5] pt-12">
          <div className="grid md:grid-cols-2 gap-8 items-center bg-white p-8 rounded-3xl border border-[#E5E5E5] shadow-sm">
            <div className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-[#1D1D1D]">Mobile & Accessible Design Values</h2>
              <p className="text-sm text-[#555555] leading-relaxed">
                Our UI component library is lightweight and performs optimally. It complies with modern WCAG accessibility rules:
              </p>
              
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="text-[#1D1D1D] shrink-0 mt-0.5" size={16} />
                  <span className="text-xs font-medium text-[#555555]">**48px Touch Heights** - Inputs and buttons fit natural mobile tap bounds.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="text-[#1D1D1D] shrink-0 mt-0.5" size={16} />
                  <span className="text-xs font-medium text-[#555555]">**Contrast Checked** - Text color `#1D1D1D` matches perfectly with white `#FFFFFF`.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="text-[#1D1D1D] shrink-0 mt-0.5" size={16} />
                  <span className="text-xs font-medium text-[#555555]">**Flexible Navigation** - Scrolling list elements adjust to narrow mobile viewport limits.</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4 bg-[#F5F5F5] p-6 rounded-2xl border border-[#E5E5E5]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#A3A3A3]">Lightweight Code</h3>
              <p className="text-xs text-[#555555] leading-relaxed">
                Zero third-party wrapper dependencies. Built using vanilla Next.js 16 + React 19 forwardRefs. Fast, type-safe, and fully compiled.
              </p>
              <div className="pt-2">
                <Button size="sm" variant="primary" className="w-full" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
                  Back to Top
                </Button>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E5E5] bg-white py-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A3A3A3]">
          <div>
            &copy; {new Date().getFullYear()} Youth Development Center (YDC). UI Component System.
          </div>
          <div className="flex gap-4">
            <span className="hover:text-[#555555] transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-[#555555] transition-colors cursor-pointer">Terms</span>
            <span className="hover:text-[#555555] transition-colors cursor-pointer">Licensing</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
