"use client";
 
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, CheckCircle, PlayCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getProgress } from "@/lib/wellms";
 
interface Module {
  id: string;
  title: string;
  duration: string;
}
 
export default function CourseModulesList({ courseId, modules }: { courseId: string, modules: Module[] }) {
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();
 
  useEffect(() => {
    async function loadProgress() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const progress = await getProgress(user.id, courseId);
          setCompletedModules(progress);
        }
      } catch (err) {
        console.error("Error loading progress from backend:", err);
      } finally {
        setMounted(true);
      }
    }
    loadProgress();
  }, [courseId, supabase]);

  if (!mounted) return null;
 
  return (
    <div className="space-y-3">
      {modules.map((module, index) => {
        // A module is unlocked if it's the first one, or if the PREVIOUS module is completed.
        const isFirst = index === 0;
        const previousModuleId = index > 0 ? modules[index - 1].id : null;
        const isUnlocked = isFirst || (previousModuleId && completedModules.includes(previousModuleId));
        const isCompleted = completedModules.includes(module.id);

        return (
          <div key={module.id}>
            {isUnlocked ? (
              <Link href={`/lms/lessons/${module.id}`} className="block">
                <div className={`bg-white border rounded-2xl p-4 flex items-center justify-between transition-colors shadow-sm ${isCompleted ? 'border-[#0BA242] bg-green-50/30' : 'border-[#E5E5E5] hover:border-[#0A9EDE]'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? 'bg-[#0BA242]/10 text-[#0BA242]' : 'bg-[#0A9EDE]/10 text-[#0A9EDE]'}`}>
                      {isCompleted ? <CheckCircle size={20} /> : <PlayCircle size={20} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#1D1D1D]">{module.title}</h4>
                      <p className="text-xs text-[#555555] mt-0.5">{module.duration}</p>
                    </div>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#0A9EDE]">
                    {isCompleted ? 'Done' : 'Start'}
                  </div>
                </div>
              </Link>
            ) : (
              <div className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-2xl p-4 flex items-center justify-between opacity-70">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#E5E5E5] text-[#A3A3A3] flex items-center justify-center shrink-0">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#555555]">{module.title}</h4>
                    <p className="text-xs text-[#A3A3A3] mt-0.5">Locked</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
