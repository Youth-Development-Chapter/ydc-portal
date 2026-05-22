"use client";
 
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, CheckCircle, PlayCircle, Globe, Award } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getProgress } from "@/lib/wellms";
 
interface Module {
  id: string;
  title: string;
  titleUr?: string;
  duration: string;
}

interface CourseModulesListProps {
  courseId: string;
  modules: Module[];
  lockedLanguage: "en" | "ur";
}
 
export default function CourseModulesList({
  courseId,
  modules,
  lockedLanguage,
}: CourseModulesListProps) {
  const [userProgressList, setUserProgressList] = useState<{ lessonId: string; difficulty: string }[]>([]);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();
  
  const isUrdu = lockedLanguage === "ur";

  useEffect(() => {
    async function loadProgress() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const progress = await getProgress(user.id, courseId, lockedLanguage);
          setUserProgressList(progress);
        }
      } catch (err) {
        console.error("Error loading progress from backend:", err);
      } finally {
        setMounted(true);
      }
    }
    loadProgress();
  }, [courseId, lockedLanguage, supabase]);

  if (!mounted) return null;

  // Map lessonId to the list of difficulties completed
  const difficultiesMap: Record<string, string[]> = {};
  for (const p of userProgressList) {
    if (!difficultiesMap[p.lessonId]) {
      difficultiesMap[p.lessonId] = [];
    }
    difficultiesMap[p.lessonId].push(p.difficulty);
  }

  // A lesson/module is completed if it has progress recorded for at least one difficulty
  const completedModuleIds = Object.keys(difficultiesMap);

  return (
    <div className="space-y-4">
      {/* Active Locked Track Display Header */}
      <div className={`flex items-center justify-between bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-sm ${isUrdu ? "flex-row-reverse" : ""}`}>
        <div className={`flex items-center gap-2 text-[#555555] ${isUrdu ? "flex-row-reverse" : ""}`}>
          <Globe size={18} className="text-[#0A9EDE]" />
          <span className={`text-sm font-semibold ${isUrdu ? "font-nastaliq" : ""}`}>
            {isUrdu ? "سرگرم ٹریک" : "Active Language Track"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#0A9EDE]/10 border border-[#0A9EDE]/20 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#0A9EDE]">
          <span className={`inline-block w-2 h-2 rounded-full bg-[#0A9EDE] animate-pulse`} />
          <span className={isUrdu ? "font-nastaliq pt-0.5" : ""}>
            {isUrdu ? "اردو (محفوظ شدہ)" : "English (Locked)"}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {modules.map((module, index) => {
          const isFirst = index === 0;
          const previousModuleId = index > 0 ? modules[index - 1].id : null;
          
          // Unlocked if first module or previous module has been completed (any difficulty)
          const isUnlocked = isFirst || (previousModuleId && completedModuleIds.includes(previousModuleId));
          const isCompleted = completedModuleIds.includes(module.id);
          const completedDiffs = difficultiesMap[module.id] || [];

          return (
            <div key={module.id}>
              {isUnlocked ? (
                <Link href={`/lms/lessons/${module.id}`} className="block">
                  <div className={`bg-white border rounded-2xl p-4 flex items-center justify-between transition-all shadow-sm hover:shadow-md ${isUrdu ? "flex-row-reverse" : ""} ${isCompleted ? 'border-[#0BA242] bg-green-50/10' : 'border-[#E5E5E5] hover:border-[#0A9EDE]'}`}>
                    <div className={`flex items-center gap-4 flex-1 ${isUrdu ? "flex-row-reverse text-right" : ""}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? 'bg-[#0BA242]/10 text-[#0BA242]' : 'bg-[#0A9EDE]/10 text-[#0A9EDE]'}`}>
                        {isCompleted ? <CheckCircle size={20} /> : <PlayCircle size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold text-sm text-[#1D1D1D] truncate ${isUrdu ? "font-nastaliq text-right text-base leading-relaxed" : ""}`} dir={isUrdu ? "rtl" : "ltr"}>
                          {isUrdu && module.titleUr ? module.titleUr : module.title}
                        </h4>
                        
                        <div className={`flex flex-wrap items-center gap-2 mt-1.5 ${isUrdu ? "justify-end flex-row-reverse" : ""}`}>
                          <span className="text-xs text-[#555555]">{module.duration}</span>
                          
                          {/* Completed Difficulty Badges */}
                          {completedDiffs.map((diff) => (
                            <span 
                              key={diff}
                              className="text-[9px] font-extrabold uppercase tracking-wider bg-[#0BA242]/10 text-[#0BA242] px-2 py-0.5 rounded-full border border-[#0BA242]/20 flex items-center gap-0.5"
                            >
                              <Award size={8} />
                              <span className={isUrdu ? "font-nastaliq pt-0.5" : ""}>
                                {isUrdu
                                  ? diff === "beginner" ? "ابتدائی" : diff === "advanced" ? "اعلیٰ" : "ماہر"
                                  : diff}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className={`text-xs font-bold uppercase tracking-wider text-[#0A9EDE] shrink-0 ${isUrdu ? "font-nastaliq pr-4" : "pl-4"}`}>
                      {isCompleted ? (isUrdu ? 'مکمل' : 'Done') : (isUrdu ? 'شروع کریں' : 'Start')}
                    </div>
                  </div>
                </Link>
              ) : (
                <div className={`bg-[#F5F5F5] border border-[#E5E5E5] rounded-2xl p-4 flex items-center justify-between opacity-70 ${isUrdu ? "flex-row-reverse" : ""}`}>
                  <div className={`flex items-center gap-4 ${isUrdu ? "flex-row-reverse" : ""}`}>
                    <div className="w-10 h-10 rounded-full bg-[#E5E5E5] text-[#A3A3A3] flex items-center justify-center shrink-0">
                      <Lock size={18} />
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm text-[#555555] ${isUrdu ? "font-nastaliq text-right text-base leading-relaxed" : ""}`} dir={isUrdu ? "rtl" : "ltr"}>
                        {isUrdu && module.titleUr ? module.titleUr : module.title}
                      </h4>
                      <p className={`text-xs text-[#A3A3A3] mt-0.5 ${isUrdu ? "text-right font-nastaliq" : ""}`}>
                        {isUrdu ? "مقفل" : "Locked"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
