"use client";
 
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Lock, CheckCircle, PlayCircle, Globe, Award, Coins } from "lucide-react";
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
  rewardPoints?: number;
}
 
export default function CourseModulesList({
  courseId,
  modules,
  lockedLanguage,
  rewardPoints,
}: CourseModulesListProps) {
  const [userProgressList, setUserProgressList] = useState<{ lessonId: string; difficulty: string }[]>([]);
  const [mounted, setMounted] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  
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
  const completedModuleSet = new Set(completedModuleIds);

  return (
    <div className="space-y-4">
      {/* Active Locked Track Display Header */}
      <div className="flex items-center justify-between bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 text-[#555555]">
          <Globe size={18} className="text-[#0A9EDE]" />
          <span className="text-sm font-semibold">
            Active Language Track
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#0A9EDE]/10 border border-[#0A9EDE]/20 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#0A9EDE]">
          <span className="inline-block w-2 h-2 rounded-full bg-[#0A9EDE] animate-pulse" />
          <span>
            {isUrdu ? "Urdu (Locked)" : "English (Locked)"}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {modules.map((module, index) => {
          const isFirst = index === 0;
          const previousModuleId = index > 0 ? modules[index - 1].id : null;
          
          // Unlocked if first module or previous module has been completed (any difficulty)
          const isUnlocked = isFirst || (previousModuleId && completedModuleSet.has(previousModuleId));
          const isCompleted = completedModuleSet.has(module.id);
          const completedDiffs = difficultiesMap[module.id] || [];

          // Coin calculations
          const getChapterBaseCoins = (idx: number) => {
            if (!rewardPoints) return 0;
            const currentAccumulated = Math.floor((0.6 * rewardPoints * idx) / modules.length);
            const prevAccumulated = Math.floor((0.6 * rewardPoints * (idx - 1)) / modules.length);
            return currentAccumulated - prevAccumulated;
          };

          const isLast = index === modules.length - 1;
          const baseCoins = getChapterBaseCoins(index + 1);
          const completionBonus = isLast && rewardPoints ? (rewardPoints - Math.floor(0.6 * rewardPoints)) : 0;
          
          const standardCoins = baseCoins + completionBonus;

          return (
            <div key={module.id}>
              {isUnlocked ? (
                <Link href={`/lms/lessons/${module.id}`} className="block" prefetch={false}>
                  <div className={`bg-white border rounded-2xl p-4 flex items-center justify-between transition-colors shadow-sm hover:shadow-md ${isCompleted ? 'border-[#0BA242] bg-green-50/10' : 'border-[#E5E5E5] hover:border-[#0A9EDE]'}`}>
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? 'bg-[#0BA242]/10 text-[#0BA242]' : 'bg-[#0A9EDE]/10 text-[#0A9EDE]'}`}>
                        {isCompleted ? <CheckCircle size={20} /> : <PlayCircle size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold text-sm text-[#1D1D1D] truncate ${isUrdu ? "font-nastaliq text-right text-base leading-relaxed" : ""}`} dir={isUrdu ? "rtl" : "ltr"}>
                          {isUrdu && module.titleUr ? module.titleUr : module.title}
                        </h4>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="text-xs text-[#555555]">{module.duration}</span>
                          
                          {rewardPoints && (
                            <>
                              <span className="text-[#E5E5E5]">•</span>
                              {isLast ? (
                                <span className="inline-flex items-center gap-1 bg-[#FFF9E6] border border-[#FDE047] text-[#B45309] rounded-full px-2.5 py-0.5 shadow-sm text-xs font-extrabold scale-105 origin-left">
                                  <Award size={13} className="text-[#D97706] shrink-0" />
                                  <span>
                                    {standardCoins} YDC Coins (includes bonus!)
                                  </span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#D97706]">
                                  <Coins size={12} className="text-[#D97706] shrink-0" />
                                  <span>
                                    {standardCoins} YDC Coins
                                  </span>
                                </span>
                              )}
                            </>
                          )}

                          {/* Completed Difficulty Badges */}
                          {completedDiffs.map((diff) => (
                            <span 
                              key={diff}
                              className="text-[9px] font-extrabold uppercase tracking-wider bg-[#0BA242]/10 text-[#0BA242] px-2 py-0.5 rounded-full border border-[#0BA242]/20 flex items-center gap-0.5"
                            >
                              <Award size={8} />
                              <span>
                                {diff}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs font-bold uppercase tracking-wider text-[#0A9EDE] shrink-0 pl-4">
                      {isCompleted ? 'Done' : 'Start'}
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-2xl p-4 flex items-center justify-between opacity-70">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-[#E5E5E5] text-[#A3A3A3] flex items-center justify-center shrink-0">
                      <Lock size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold text-sm text-[#555555] truncate ${isUrdu ? "font-nastaliq text-right text-base leading-relaxed" : ""}`} dir={isUrdu ? "rtl" : "ltr"}>
                        {isUrdu && module.titleUr ? module.titleUr : module.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-xs text-[#A3A3A3] font-semibold">
                          Locked
                        </span>
                        <span className="text-[#E5E5E5]">•</span>
                        <span className="text-xs text-[#555555]">{module.duration}</span>
                        {rewardPoints && (
                          <>
                            <span className="text-[#E5E5E5]">•</span>
                            {isLast ? (
                              <span className="inline-flex items-center gap-1 bg-[#FFF9E6]/60 border border-[#FDE047]/60 text-[#B45309]/80 rounded-full px-2.5 py-0.5 text-xs font-extrabold">
                                <Award size={13} className="text-[#D97706]/80 shrink-0" />
                                <span>
                                  {standardCoins} YDC Coins (includes bonus!)
                                </span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#D97706]/80">
                                <Coins size={12} className="text-[#D97706]/80 shrink-0" />
                                <span>
                                  {standardCoins} YDC Coins
                                </span>
                              </span>
                            )}
                          </>
                        )}
                      </div>
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
