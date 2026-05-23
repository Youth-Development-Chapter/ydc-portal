import React from "react";
import { redirect } from "next/navigation";
import { getLessonForLearner } from "@/lib/lms-data";
import InteractiveLesson from "@/components/lms/InteractiveLesson";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function LessonViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = await getLessonForLearner(id);

  if (!lesson) {
    return <div className="p-4 text-center">Lesson not found.</div>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=/lms/lessons/${id}`);
  }

  let lockedLanguage: "en" | "ur" = "en";

  const { data: setting } = await supabase
    .from("user_course_settings")
    .select("language")
    .eq("user_id", user.id)
    .eq("course_id", lesson.courseId)
    .maybeSingle();

  if (setting) {
    lockedLanguage = setting.language as "en" | "ur";
  }

  return (
    <div className="relative">
      <InteractiveLesson 
        lesson={lesson} 
        courseId={lesson.courseId} 
        lockedLanguage={lockedLanguage} 
      />
    </div>
  );
}
