import React from "react";
import { getCourses } from "@/lib/lms-data";
import { createClient } from "@/utils/supabase/server";
import CoursesClient from "./CoursesClient";

export const dynamic = "force-dynamic";

export default async function LmsCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const courses = await getCourses();
  
  const completedCourseIds: string[] = [];
  const courseProgressMap: Record<string, { completed: number; total: number; percent: number }> = {};

  if (user) {
    // 1. Fetch all modules & lessons to establish baseline counts
    const { data: allModules } = await supabase
      .from("modules")
      .select("id, course_id");
      
    const { data: allLessons } = await supabase
      .from("lessons")
      .select("id, module_id");

    // Establish mapping of module_id -> course_id
    const moduleToCourseMap: Record<string, string> = {};
    for (const mod of allModules || []) {
      moduleToCourseMap[mod.id] = mod.course_id;
    }

    // Accumulate total lessons count per course
    const courseLessonsCount: Record<string, number> = {};
    for (const les of allLessons || []) {
      const courseId = moduleToCourseMap[les.module_id];
      if (courseId) {
        courseLessonsCount[courseId] = (courseLessonsCount[courseId] || 0) + 1;
      }
    }

    // 2. Fetch all completed user progress records for this user
    const { data: userProgress } = await supabase
      .from("user_progress")
      .select("lesson_id, course_id")
      .eq("user_id", user.id)
      .eq("completed", true);

    const completedCountPerCourse: Record<string, number> = {};
    for (const prog of userProgress || []) {
      if (prog.course_id) {
        completedCountPerCourse[prog.course_id] = (completedCountPerCourse[prog.course_id] || 0) + 1;
      }
    }

    // 3. Populate progress mapping & completed course status
    for (const course of courses) {
      const total = courseLessonsCount[course.id] || 0;
      const completed = completedCountPerCourse[course.id] || 0;
      const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

      courseProgressMap[course.id] = { completed, total, percent };
      if (total > 0 && completed >= total) {
        completedCourseIds.push(course.id);
      }
    }
  }

  return (
    <div className="max-w-lg mx-auto w-full px-4 py-6 animate-in fade-in duration-500">
      <CoursesClient
        courses={courses}
        completedCourseIds={completedCourseIds}
        courseProgressMap={courseProgressMap}
      />
    </div>
  );
}
