"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, Award, Flame, CheckCircle2 } from "lucide-react";

interface Course {
  id: string;
  title: string;
  author: string;
  description: string;
  imageUrl: string;
  modules: unknown[];
}

interface CoursesClientProps {
  courses: Course[];
  completedCourseIds: string[];
  courseProgressMap: Record<string, { completed: number; total: number; percent: number }>;
}

export default function CoursesClient({
  courses,
  completedCourseIds,
  courseProgressMap,
}: CoursesClientProps) {
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  const completedSet = new Set(completedCourseIds);
  const activeCourses = courses.filter((c) => !completedSet.has(c.id));
  const completedCourses = courses.filter((c) => completedSet.has(c.id));

  const listToRender = activeTab === "active" ? activeCourses : completedCourses;

  return (
    <div className="space-y-6">
      {/* Premium Header Banner */}
      <div className="bg-gradient-to-br from-[#1D1D1D] to-[#333333] text-white rounded-3xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <Award size={140} />
        </div>
        <div className="relative z-10 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A9EDE] bg-[#0A9EDE]/10 px-2.5 py-1 rounded-full border border-[#0A9EDE]/20">
            LMS Academy
          </span>
          <h1 className="text-3xl font-extrabold relative z-10 font-coolvetica pt-2">
            Academy Catalog
          </h1>
          <p className="text-sm text-[#A3A3A3] relative z-10 max-w-[85%] leading-relaxed pt-1">
            Expand your knowledge with authentic courses and build your character.
          </p>
        </div>
      </div>

      {/* Modern Glassmorphic Tab Selector */}
      <div className="flex bg-[#F5F5F5] p-1.5 rounded-2xl border border-[#E5E5E5] gap-1">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "active"
              ? "bg-white text-[#1D1D1D] shadow-sm border border-[#E5E5E5]"
              : "text-[#555555] hover:text-[#1D1D1D]"
          }`}
        >
          <Flame size={16} className={activeTab === "active" ? "text-[#DD0408]" : ""} />
          Active Courses ({activeCourses.length})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "completed"
              ? "bg-white text-[#1D1D1D] shadow-sm border border-[#E5E5E5]"
              : "text-[#555555] hover:text-[#1D1D1D]"
          }`}
        >
          <CheckCircle2 size={16} className={activeTab === "completed" ? "text-[#0BA242]" : ""} />
          Completed ({completedCourses.length})
        </button>
      </div>

      {/* Catalog List */}
      <div className="space-y-4">
        {listToRender.length === 0 ? (
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-[#F5F5F5] text-[#A3A3A3] rounded-full flex items-center justify-center mx-auto">
              {activeTab === "active" ? <BookOpen size={28} /> : <Award size={28} />}
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#1D1D1D]">
                {activeTab === "active" ? "All Caught Up!" : "No Completed Courses Yet"}
              </h3>
              <p className="text-sm text-[#555555] max-w-xs mx-auto mt-1">
                {activeTab === "active"
                  ? "You have completed all available courses in our academy catalog. Superb job! 🎉"
                  : "Finish your active chapters and pass the quizzes to unlock your certificates and rewards here."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {listToRender.map((course) => {
              const progress = courseProgressMap[course.id] || { completed: 0, total: 0, percent: 0 };
              const isDone = completedSet.has(course.id);
              
              return (
                <Link key={course.id} href={`/lms/courses/${course.id}`} className="block">
                  <div className="bg-white border border-[#E5E5E5] rounded-3xl p-4 shadow-sm hover:border-[#0A9EDE] transition-all group overflow-hidden relative">
                    <div 
                      className="absolute inset-0 z-0 opacity-5"
                      style={{ backgroundImage: `url(${course.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    />
                    
                    <div className="relative z-10 flex gap-4">
                      {/* Course Cover Image */}
                      <div className="w-16 h-20 rounded-xl overflow-hidden shrink-0 shadow-md relative">
                        <div 
                          className="w-full h-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${course.imageUrl})` }}
                        />
                        {isDone && (
                          <div className="absolute inset-0 bg-[#0BA242]/80 flex items-center justify-center text-white">
                            <CheckCircle2 size={24} className="animate-pulse" />
                          </div>
                        )}
                      </div>
                      
                      {/* Course Metadata */}
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <BookOpen size={13} className="text-[#DD0408]" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#555555]">
                              {course.modules.length} Chapters
                            </span>
                            {isDone && (
                              <span className="text-[9px] font-extrabold uppercase bg-[#0BA242]/10 text-[#0BA242] px-2 py-0.5 rounded-full border border-[#0BA242]/20 flex items-center gap-1">
                                <Award size={10} /> Completed
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-[#1D1D1D] text-base leading-tight mb-0.5">{course.title}</h3>
                          <p className="text-xs text-[#0A9EDE] font-semibold">{course.author}</p>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold text-[#555555]">
                            <span>Progress</span>
                            <span>{progress.percent}% ({progress.completed}/{progress.total} lessons)</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden border border-[#E5E5E5]">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isDone ? "bg-[#0BA242]" : "bg-[#0A9EDE]"
                              }`}
                              style={{ width: `${progress.percent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Chevron Action */}
                      <div className="flex items-center justify-center pl-2">
                        <div className="w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center group-hover:bg-[#0A9EDE] transition-colors">
                          <ChevronRight size={16} className="text-[#555555] group-hover:text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
