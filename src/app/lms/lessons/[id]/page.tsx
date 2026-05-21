import React from "react";
import { getLessonById } from "@/lib/wellms";
import InteractiveLesson from "@/components/lms/InteractiveLesson";

export const dynamic = "force-dynamic";

export default async function LessonViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = await getLessonById(id);

  if (!lesson) {
    return <div className="p-4 text-center">Lesson not found.</div>;
  }

  return (
    <div className="relative">
      <InteractiveLesson lesson={lesson} courseId={lesson.courseId} />
    </div>
  );
}
