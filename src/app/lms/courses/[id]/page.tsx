import React from "react";
import Link from "next/link";
import { getCourseById } from "@/lib/lms-data";
import CourseModulesList from "@/components/lms/CourseModulesList";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CourseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await getCourseById(id);

  if (!course) {
    return <div className="p-4 text-center">Course not found.</div>;
  }
  
  return (
    <div className="animate-in fade-in duration-500 pb-12">
      {/* Course Hero */}
      <div className="relative pt-4 pb-8 px-4 bg-gradient-to-br from-[#1D1D1D] to-[#333333] text-white rounded-b-[40px] shadow-lg">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none mix-blend-overlay">
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${course.imageUrl})` }}
          />
        </div>

        <div className="relative z-10">
          <Link href="/lms/courses" className="inline-flex items-center gap-1 text-sm font-medium text-white/70 hover:text-white mb-6 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
            <ChevronLeft size={16} /> Back to Catalog
          </Link>
          
          <h1 className="text-3xl font-coolvetica leading-tight mb-2">{course.title}</h1>
          <p className="text-sm font-semibold text-[#0A9EDE] mb-4">By {course.author}</p>
          <p className="text-sm text-white/80 leading-relaxed">
            {course.description}
          </p>
        </div>
      </div>

      {/* Course Content / Syllabus */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#1D1D1D]">Course Chapters</h2>
          <span className="text-xs font-bold text-[#555555] bg-[#E5E5E5] px-2 py-1 rounded-full">{course.modules.length} Modules</span>
        </div>
        
        <CourseModulesList courseId={course.id} modules={course.modules} />
      </div>
    </div>
  );
}
