import Link from "next/link";
import { Award, Compass, Users, CheckCircle, ArrowRight, Flame, Coins, GraduationCap, Ticket, Database } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-[#1D1D1D] selection:bg-[#1D1D1D] selection:text-white">
      {/* Floating Navbar Pill */}
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <header className="w-full max-w-5xl bg-white/80 backdrop-blur-xl border border-[#E5E5E5] rounded-full shadow-xl shadow-black/5 px-8 h-20 flex items-center justify-between pointer-events-auto transition-all">
          <div className="flex items-center gap-3">
            <img src="/logocolor.png" alt="YDC Logo" className="h-14 w-auto drop-shadow-sm" />
          </div>

          <nav className="hidden md:flex items-center gap-10 text-base font-semibold text-[#555555]">
            <a href="#vision" className="hover:text-[#0A9EDE] transition-colors">Our Vision</a>
            <a href="#pillars" className="hover:text-[#0A9EDE] transition-colors">Methodology</a>
            <a href="#app" className="hover:text-[#0A9EDE] transition-colors">Digital Ecosystem</a>
          </nav>

          <div className="flex items-center gap-5">
            <Link 
              href="/auth/login" 
              className="text-base font-bold px-4 py-2 text-[#555555] hover:text-[#0A9EDE] transition-colors"
            >
              Sign In
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-[#0A9EDE] hover:bg-[#098bc1] text-white rounded-full px-8 text-base shadow-lg shadow-[#0A9EDE]/20 transition-transform hover:-translate-y-0.5" size="lg">
                Join the Movement
              </Button>
            </Link>
          </div>
        </header>
      </div>

      {/* Section 1: The Hero Area */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center w-full overflow-hidden">
        {/* Background Watermark */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
          <img src="/icontransparent.png" alt="" className="w-[800px] h-auto scale-150" />
        </div>
        
        <div className="fluid-bottom-gradient"></div>
        <div className="relative z-10 px-6 max-w-7xl mx-auto w-full">
          <div className="mb-4">
            <span className="font-nastaliq text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-[#DD0408] via-[#0A9EDE] to-[#0BA242]">
              ستاروں سے آگے
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-normal text-[#1D1D1D] mb-6">
            Inspiration Drives Transformation.
          </h1>
          <p className="text-lg md:text-xl text-[#555555] max-w-2xl mx-auto mb-10 leading-relaxed">
            A visionary initiative to engage, train, and empower educated youth in South Punjab.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto bg-[#1D1D1D] hover:bg-black text-white rounded-full px-8 shadow-xl shadow-black/10 transition-all hover:-translate-y-1 group" rightIcon={<ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}>
                Join the Movement
              </Button>
            </Link>
         
          </div>
        </div>
      </section>

      {/* Section 2: Core Challenge & Vision */}
      <section id="vision" className="py-20 border-t border-[#E5E5E5] bg-[#FAFAFA] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="mb-2">
              <span className="font-nastaliq text-2xl text-transparent bg-clip-text bg-gradient-to-r from-[#DD0408] to-[#0A9EDE]">
                وقت کی آواز
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#1D1D1D]">Built for the Connected Generation</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="p-8 rounded-2xl bg-white border border-[#E5E5E5] shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#FEF2F2] flex items-center justify-center mb-6">
                <span className="w-2 h-2 rounded-full bg-[#DD0408]"></span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-[#1D1D1D]">The Challenge</h3>
              <p className="text-[#555555] leading-relaxed">
                The youth of South Punjab face immense challenges, including scarce employment opportunities for graduates, a lack of quality higher education institutions, and a massive skill gap between university education and corporate sector needs.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-[#E5E5E5] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#0A9EDE] opacity-5 rounded-bl-full"></div>
              <div className="w-10 h-10 rounded-full bg-[#F0F9FF] flex items-center justify-center mb-6">
                <span className="w-2 h-2 rounded-full bg-[#0A9EDE]"></span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-[#1D1D1D]">The Solution</h3>
              <p className="text-[#555555] leading-relaxed">
                We understand Gen Z. You are the first digital-native generation—purpose-driven, tech-savvy, and socially conscious. YDC offers a consolidated model addressing the physical, intellectual, emotional, and spiritual needs of youth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Our Three Pillars */}
      <section id="pillars" className="py-24 border-t border-[#E5E5E5] bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#1D1D1D]">Our Core Methodology</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Character */}
            <div className="relative p-10 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] overflow-hidden group hover:border-[#1D1D1D] transition-all duration-300">
              <div className="absolute -right-4 -bottom-8 font-nastaliq text-[140px] text-[#1D1D1D] opacity-[0.03] pointer-events-none select-none transition-transform group-hover:scale-110 duration-500">
                کردار
              </div>
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E5E5] flex items-center justify-center text-[#1D1D1D] mb-6 shadow-sm">
                <Compass size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-[#1D1D1D]">Character</h3>
              <p className="text-[#555555] leading-relaxed relative z-10">
                Building moral and ethical strength drawn from the Qur'an and Seerah.
              </p>
            </div>

            {/* Career */}
            <div className="relative p-10 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] overflow-hidden group hover:border-[#1D1D1D] transition-all duration-300">
              <div className="absolute -right-4 -bottom-8 font-nastaliq text-[140px] text-[#1D1D1D] opacity-[0.03] pointer-events-none select-none transition-transform group-hover:scale-110 duration-500">
                کیریئر
              </div>
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E5E5] flex items-center justify-center text-[#1D1D1D] mb-6 shadow-sm">
                <Award size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-[#1D1D1D]">Career</h3>
              <p className="text-[#555555] leading-relaxed relative z-10">
                Fostering self-reliance, offering IT and professional training, and closing the corporate skill gap.
              </p>
            </div>

            {/* Community */}
            <div className="relative p-10 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA] overflow-hidden group hover:border-[#1D1D1D] transition-all duration-300">
              <div className="absolute -right-4 -bottom-8 font-nastaliq text-[140px] text-[#1D1D1D] opacity-[0.03] pointer-events-none select-none transition-transform group-hover:scale-110 duration-500">
                خدمت
              </div>
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E5E5] flex items-center justify-center text-[#1D1D1D] mb-6 shadow-sm">
                <Users size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-[#1D1D1D]">Community</h3>
              <p className="text-[#555555] leading-relaxed relative z-10">
                Promoting social responsibility and aiming to organize 1000+ Khidmat (community service) initiatives annually.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: The YDC Digital App Experience */}
      <section id="app" className="py-20 border-t border-[#E5E5E5] bg-[#1D1D1D] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="mb-2">
              <span className="font-nastaliq text-2xl text-[#0A9EDE]">
                ڈیجیٹل انقلاب
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">A Digital Ecosystem in Your Hands</h2>
            <p className="text-[#A3A3A3] max-w-2xl mx-auto">
              Our socio-behavioral engine is powered by a state-of-the-art progressive web application.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#2A2A2A] border border-[#333333] p-6 rounded-2xl">
              <Database className="text-[#0A9EDE] mb-4" size={28} />
              <h4 className="text-lg font-bold mb-2">Centralized Profiles</h4>
              <p className="text-[#A3A3A3] text-sm leading-relaxed">
                Fill out your membership form via the app to join our secure data bank.
              </p>
            </div>
            
            <div className="bg-[#2A2A2A] border border-[#333333] p-6 rounded-2xl">
              <Ticket className="text-[#0BA242]" size={28} />
              <h4 className="text-lg font-bold mb-2">Smart Event Ticketing</h4>
              <p className="text-[#A3A3A3] text-sm leading-relaxed">
                Register for physical events and receive a unique, secure QR ticket for instant attendance tracking.
              </p>
            </div>

            <div className="bg-[#2A2A2A] border border-[#333333] p-6 rounded-2xl">
              <Coins className="text-[#EAB308]" size={28} />
              <h4 className="text-lg font-bold mb-2">Gamification & YDC Coins</h4>
              <p className="text-[#A3A3A3] text-sm leading-relaxed">
                Earn "YDC Coins" by completing courses. Climb the Bronze, Silver, and Gold tiers and redeem your coins in our marketplace.
              </p>
            </div>

            <div className="bg-[#2A2A2A] border border-[#333333] p-6 rounded-2xl">
              <Flame className="text-[#DD0408]" size={28} />
              <h4 className="text-lg font-bold mb-2">Daily Goodness Streak</h4>
              <p className="text-[#A3A3A3] text-sm leading-relaxed">
                Build character by uploading photos or videos of your daily good deeds to maintain your streak and earn bonus rewards.
              </p>
            </div>

            <div className="bg-[#2A2A2A] border border-[#333333] p-6 rounded-2xl md:col-span-2 lg:col-span-1">
              <GraduationCap className="text-[#9333EA]" size={28} />
              <h4 className="text-lg font-bold mb-2">E-Learning & Skills</h4>
              <p className="text-[#A3A3A3] text-sm leading-relaxed">
                Access our built-in Learning Management System (LMS) to complete courses and unlock final quizzes for automatic coin rewards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Final CTA & 5-Year Vision */}
      <section className="py-24 bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="mb-4">
            <span className="font-nastaliq text-2xl text-transparent bg-clip-text bg-gradient-to-r from-[#DD0408] to-[#0A9EDE]">
              مستقبل کے معمار
            </span>
          </div>
          
          <h2 className="text-5xl font-extrabold text-[#1D1D1D] mb-8">Shape the Future.</h2>
          
          <p className="text-xl text-[#555555] leading-relaxed mb-12">
            Be part of our 5-Year Plan (2026–2030) to expose <strong className="text-[#1D1D1D]">10,000+</strong> youth to the Islamic worldview annually and train <strong className="text-[#1D1D1D]">1,200+</strong> youth for professional jobs.
          </p>

          <Link href="/auth/signup">
            <Button size="lg" className="px-10 py-6 text-lg bg-[#1D1D1D] hover:bg-black text-white rounded-full shadow-xl shadow-black/10 transition-transform hover:-translate-y-1">
              Create Your Profile Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E5E5] py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-[#555555] text-sm">
            &copy; {new Date().getFullYear()} Youth Development Center (YDC). All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-[#555555]">
            <a href="#vision" className="hover:text-[#1D1D1D] transition-colors">Vision</a>
            <a href="#pillars" className="hover:text-[#1D1D1D] transition-colors">Methodology</a>
            <a href="#app" className="hover:text-[#1D1D1D] transition-colors">The App</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
