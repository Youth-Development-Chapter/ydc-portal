import React from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, Award } from "lucide-react";
import { getCourses } from "@/lib/wellms";

export const dynamic = "force-dynamic";

export default async function LmsCoursesPage() {
  const courses = await getCourses();

  return (
    <div className="px-4 pt-6 space-y-6 animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-[#1D1D1D] to-[#333333] text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <Award size={140} />
        </div>
        <h1 className="text-2xl font-bold mb-2 relative z-10 font-coolvetica">Academy</h1>
        <p className="text-sm text-[#A3A3A3] relative z-10 max-w-[80%]">
          Expand your knowledge with authentic courses and build your character.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="font-bold text-lg text-[#1D1D1D]">Available Courses</h2>
        
        <div className="grid gap-4">
          {courses.map((course) => (
            <Link key={course.id} href={`/lms/courses/${course.id}`} className="block">
              <div className="bg-white border border-[#E5E5E5] rounded-3xl p-4 shadow-sm hover:border-[#0A9EDE] transition-all group overflow-hidden relative">
                <div 
                  className="absolute inset-0 z-0 opacity-5"
                  style={{ backgroundImage: `url(${course.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                />
                
                <div className="relative z-10 flex gap-4">
                  <div className="w-16 h-20 rounded-xl overflow-hidden shrink-0 shadow-md">
                    <div 
                      className="w-full h-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${course.imageUrl})` }}
                    />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 mb-1">
                      <BookOpen size={14} className="text-[#DD0408]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#555555]">
                        {course.modules.length} Chapters
                      </span>
                    </div>
                    <h3 className="font-bold text-[#1D1D1D] text-lg leading-tight mb-1">{course.title}</h3>
                    <p className="text-xs text-[#0A9EDE] font-semibold">{course.author}</p>
                  </div>

                  <div className="flex items-center justify-center pr-2">
                    <div className="w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center group-hover:bg-[#0A9EDE] transition-colors">
                      <ChevronRight size={16} className="text-[#555555] group-hover:text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
