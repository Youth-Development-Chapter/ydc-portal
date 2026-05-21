import React from "react";
import { getLessonById, getCourses } from "@/lib/wellms";
import InteractiveLesson from "@/components/lms/InteractiveLesson";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LessonViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = await getLessonById(id);
  const courses = await getCourses();

  if (!lesson) {
    return <div className="p-4 text-center">Lesson not found.</div>;
  }

  // Find which course this lesson belongs to in order to pass the courseId for localStorage saving
  let courseId = "";
  for (const c of courses) {
    if (c.modules.find(m => m.id === lesson.id)) {
      courseId = c.id;
      break;
    }
  }

  return (
    <div className="relative">
      <InteractiveLesson lesson={lesson} courseId={courseId} />
    </div>
  );
}
