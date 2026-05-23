import React from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCourseById } from "@/lib/lms-data";
import CourseModulesList from "@/components/lms/CourseModulesList";
import LanguageSelectModal from "@/components/lms/LanguageSelectModal";
import ChangeLanguageButton from "@/components/lms/ChangeLanguageButton";
import PageHeader from "@/components/ui/PageHeader";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function CourseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await getCourseById(id);

  if (!course) {
    return <div className="p-4 text-center">Course not found.</div>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=/lms/courses/${id}`);
  }

  // Session guard: check if user profile exists. If not, redirect to onboarding.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect(`/onboarding?next=/lms/courses/${id}&notice=profile`);
  }

  let lockedLanguage: "en" | "ur" | null = null;

  const { data: setting } = await supabase
    .from("user_course_settings")
    .select("language")
    .eq("user_id", user.id)
    .eq("course_id", id)
    .maybeSingle();

  if (setting) {
    lockedLanguage = setting.language as "en" | "ur";
  }

  const isUrdu = lockedLanguage === "ur";
  const displayTitle = isUrdu && course.titleUr ? course.titleUr : course.title;
  const displayDesc = isUrdu && course.descriptionUr ? course.descriptionUr : course.description;

  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-6">
      <PageHeader title="Course Details" backHref="/lms/courses" />

      {/* Course Hero */}
      <div className="relative p-6 bg-gradient-to-br from-[#1D1D1D] to-[#2D2D2D] text-white rounded-3xl shadow-xl overflow-hidden">
        {/* Subtle abstract background gradient glow */}
        <div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-[#0A9EDE]/15 blur-2xl pointer-events-none"></div>
        <div className="absolute -left-10 -top-10 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex gap-4 items-start">
          <div className="flex-1 min-w-0 space-y-2">
            <h1 
              className={`text-2xl font-bold font-coolvetica leading-tight text-white ${isUrdu ? "font-nastaliq text-3xl text-right" : ""}`}
              dir={isUrdu ? "rtl" : "ltr"}
            >
              {displayTitle}
            </h1>
            
            {/* Mixed Language Direction Bug Fix */}
            <div className={`flex items-center gap-1.5 text-xs font-bold text-[#0A9EDE] ${isUrdu ? "flex-row-reverse justify-start" : "justify-start"}`}>
              <span>{isUrdu ? "بذریعہ" : "By"}</span>
              <span>{course.author}</span>
            </div>

            <p 
              className={`text-xs text-[#CCCCCC] leading-relaxed line-clamp-4 ${isUrdu ? "font-nastaliq text-base text-right" : ""}`}
              dir={isUrdu ? "rtl" : "ltr"}
            >
              {displayDesc}
            </p>
          </div>

          {/* Separate Book Cover Thumbnail */}
          {course.imageUrl && (
            <div className="relative w-20 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden shrink-0 shadow-lg border border-white/10 bg-neutral-900">
              <Image
                src={course.imageUrl}
                fill
                sizes="96px"
                className="w-full h-full object-cover animate-fade-in"
                alt={course.title}
              />
            </div>
          )}
        </div>
      </div>

      {/* Course Content / Syllabus */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-[#1D1D1D]">
              Course Chapters
            </h2>
            {lockedLanguage && (
              <ChangeLanguageButton
                courseId={course.id}
                courseTitle={course.title}
                courseTitleUr={course.titleUr}
                currentLanguage={lockedLanguage}
              />
            )}
          </div>
          <span className="text-xs font-bold text-[#555555] bg-[#E5E5E5] px-2 py-1 rounded-full shrink-0">
            {course.modules.length} Modules
          </span>
        </div>
        
        <CourseModulesList 
          courseId={course.id} 
          modules={course.modules} 
          lockedLanguage={lockedLanguage || "en"} 
          rewardPoints={course.rewardPoints}
        />
      </div>

      {!lockedLanguage && (
        <LanguageSelectModal 
          courseId={course.id} 
          courseTitle={course.title} 
          courseTitleUr={course.titleUr} 
        />
      )}
    </div>
  );
}
