import React from "react";
import { getCourses } from "@/lib/lms-data";
import { createClient } from "@/utils/supabase/server";
import CoursesClient from "./CoursesClient";
import PageHeader from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function LmsCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const courses = await getCourses();
  
  const completedCourseIds: string[] = [];
  const courseProgressMap: Record<string, { completed: number; total: number; percent: number }> = {};
  const lockedLanguages: Record<string, "en" | "ur"> = {};

  if (user) {
    // 1. Fetch all user course settings to get locked languages
    const { data: userSettings } = await supabase
      .from("user_course_settings")
      .select("course_id, language")
      .eq("user_id", user.id);

    for (const setting of userSettings || []) {
      lockedLanguages[setting.course_id] = setting.language as "en" | "ur";
    }

    // 2. Fetch all modules to establish baseline counts
    const { data: allModules } = await supabase
      .from("modules")
      .select("id, course_id");

    // Count modules per course (1 lesson per module in this LMS model)
    for (const mod of allModules || []) {
      courseProgressMap[mod.course_id] = courseProgressMap[mod.course_id] || { completed: 0, total: 0, percent: 0 };
      courseProgressMap[mod.course_id].total += 1;
    }

    // 3. Fetch all completed user progress records for this user
    const { data: userProgress } = await supabase
      .from("user_progress")
      .select("lesson_id, course_id, language")
      .eq("user_id", user.id)
      .eq("completed", true);

    const completedLessonsPerCourse: Record<string, Set<string>> = {};
    for (const prog of userProgress || []) {
      if (prog.course_id && prog.lesson_id) {
        const lockedLang = lockedLanguages[prog.course_id] || "en";
        if (prog.language === lockedLang) {
          if (!completedLessonsPerCourse[prog.course_id]) {
            completedLessonsPerCourse[prog.course_id] = new Set();
          }
          completedLessonsPerCourse[prog.course_id].add(prog.lesson_id);
        }
      }
    }

    // 4. Populate progress mapping & completed course status
    for (const course of courses) {
      const total = courseProgressMap[course.id]?.total || 0;
      const completed = completedLessonsPerCourse[course.id]?.size || 0;
      const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

      courseProgressMap[course.id] = { completed, total, percent };
      if (total > 0 && completed >= total) {
        completedCourseIds.push(course.id);
      }
    }
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <PageHeader title="Academy" backHref="/dashboard" />
      <CoursesClient
        courses={courses}
        completedCourseIds={completedCourseIds}
        courseProgressMap={courseProgressMap}
        lockedLanguages={lockedLanguages}
      />
    </div>
  );
}
