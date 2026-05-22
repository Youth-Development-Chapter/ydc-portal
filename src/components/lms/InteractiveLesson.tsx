"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle, AlertTriangle, Award } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { submitQuiz, type SubmitQuizResult } from "@/app/lms/lessons/actions";

interface LearnerMCQ {
  question: string;
  questionUr?: string;
  options: string[];
  optionsUr?: string[];
}

interface Lesson {
  id: string;
  title: string;
  videoUrl?: string;
  videoUrlUr?: string;
  textContent: string;
  textContentUr?: string;
  mcq: LearnerMCQ[];
}

type ViewState =
  | { kind: "content" }
  | { kind: "quiz" }
  | { kind: "submitting" }
  // Note: we intentionally show pass/fail ONLY after the server graded
  // the whole submission. During the quiz, no per-question feedback.
  | { kind: "result-pass"; total: number; completedCourseId: string | null; rewardCoins: number }
  | { kind: "result-fail"; total: number; failedAttempts: number };

function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  if (url.includes("youtube.com/embed/")) {
    return url;
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const matchSimple = url.match(/(?:v=|\/embed\/|\/v\/|youtu\.be\/|\/watch\?v=)?([a-zA-Z0-9_-]{11})/);
    if (matchSimple && matchSimple[1]) {
      return `https://www.youtube.com/embed/${matchSimple[1]}`;
    }
  }
  return null;
}

export default function InteractiveLesson({
  lesson,
  courseId,
}: {
  lesson: Lesson;
  courseId: string;
}) {
  const router = useRouter();
  const [view, setView] = useState<ViewState>({ kind: "content" });
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<"en" | "ur">("en");

  React.useEffect(() => {
    const savedLang = localStorage.getItem("ydc_course_language");
    if (savedLang === "ur") setLanguage("ur");
  }, []);

  const isUrdu = language === "ur";
  const currentVideoUrl = (isUrdu && lesson.videoUrlUr) ? lesson.videoUrlUr : lesson.videoUrl;
  const currentTextContent = (isUrdu && lesson.textContentUr) ? lesson.textContentUr : lesson.textContent;

  // One answer slot per question. `null` means unanswered.
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => lesson.mcq.map(() => null),
  );

  function startQuiz() {
    // Fresh slate every time so retries don't keep stale picks.
    setAnswers(lesson.mcq.map(() => null));
    setError(null);
    setView({ kind: "quiz" });
  }

  function pickAnswer(questionIndex: number, optionIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  }

  const allAnswered = answers.every((a) => a !== null);

  function handleSubmit() {
    if (!allAnswered) return;
    setError(null);
    setView({ kind: "submitting" });
    startTransition(async () => {
      const result = await submitQuiz(lesson.id, answers as number[]);
      if (!result.ok) {
        setError(result.error);
        setView({ kind: "quiz" });
        return;
      }
      const r = result as SubmitQuizResult;
      if (r.passed) {
        setView({
          kind: "result-pass",
          total: r.total,
          completedCourseId: r.completedCourseId,
          rewardCoins: r.rewardCoins,
        });
      } else {
        setView({
          kind: "result-fail",
          total: r.total,
          failedAttempts: r.failedAttempts,
        });
      }
    });
  }

  function handleRetryAfterFail() {
    // Test failed — chapter resets. Send the user back to the content
    // view so they have to study before re-attempting.
    setAnswers(lesson.mcq.map(() => null));
    setError(null);
    setView({ kind: "content" });
  }

  // ───────────────────────── Result: PASS ─────────────────────────
  if (view.kind === "result-pass") {
    const isCourseDone = !!view.completedCourseId;
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh] animate-in zoom-in duration-500">
        {isCourseDone ? (
          <div className="w-24 h-24 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-6 ring-8 ring-yellow-50 animate-bounce">
            <Award size={48} />
          </div>
        ) : (
          <div className="w-24 h-24 bg-green-100 text-[#0BA242] rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={48} />
          </div>
        )}
        
        <h2 className="text-2xl font-coolvetica mb-2">
          {isCourseDone ? "Course Completed! 🎉" : "Chapter Completed!"}
        </h2>
        <p className="text-[#555555] mb-2 max-w-md">
          {isCourseDone
            ? "Congratulations! You have passed the final questionnaire and successfully completed the entire course!"
            : "You passed the questionnaire. The next chapter is now unlocked."}
        </p>
        <p className="text-xs text-[#A3A3A3] mb-8">
          Score: {view.total} / {view.total}
        </p>

        {isCourseDone && view.rewardCoins > 0 && (
          <div className="w-full max-w-sm bg-yellow-50 border border-yellow-200 rounded-2xl p-5 mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 text-white rounded-full flex items-center justify-center shrink-0">
              <Award size={20} />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm text-[#1D1D1D]">Completion Bonus!</p>
              <p className="text-xs text-[#555555]">
                Reward credited:{" "}
                <span className="font-bold text-yellow-600">
                  +{view.rewardCoins} YDC Coins
                </span>
              </p>
            </div>
          </div>
        )}

        <Button
          onClick={() => router.push(isCourseDone ? "/lms/courses" : `/lms/courses/${courseId}`)}
          className="w-full max-w-sm bg-[#0A9EDE] hover:bg-[#0A9EDE]/90"
        >
          {isCourseDone ? "Return to Academy" : "Return to Course"}
        </Button>
      </div>
    );
  }

  // ───────────────────────── Result: FAIL ─────────────────────────
  if (view.kind === "result-fail") {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh] animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-[#DD0408]/10 text-[#DD0408] rounded-full flex items-center justify-center mb-6">
          <AlertTriangle size={48} />
        </div>
        <h2 className="text-2xl font-coolvetica mb-2">Test Failed</h2>
        <p className="text-[#555555] mb-1">
          You didn&apos;t pass this chapter&apos;s questionnaire.
        </p>
        <p className="text-[#555555] mb-2">
          The chapter has been reset — please review the content and try again.
        </p>
        <p className="text-xs text-[#A3A3A3] mb-8">
          Attempts so far: {view.failedAttempts}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Button onClick={handleRetryAfterFail} className="w-full">
            Review Chapter
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/lms/courses/${courseId}`)}
            className="w-full"
          >
            Back to Course
          </Button>
        </div>
      </div>
    );
  }

  // ───────────────────────── Quiz ─────────────────────────
  if (view.kind === "quiz" || view.kind === "submitting") {
    const submitting = view.kind === "submitting";
    return (
      <div className="p-4 space-y-6 animate-in slide-in-from-right duration-300">
        <div className="mb-4">
          <button
            onClick={() => setView({ kind: "content" })}
            className="text-sm font-semibold text-[#0A9EDE] flex items-center gap-1"
            disabled={submitting}
          >
            <ChevronLeft size={16} /> Back to Lesson
          </button>
        </div>

        <div className="bg-[#0A9EDE]/5 border border-[#0A9EDE]/20 rounded-xl p-4 text-xs text-[#1D1D1D]">
          <p className="font-semibold mb-1">One submission, no hints.</p>
          <p className="text-[#555555]">
            Answer every question, then submit. You won&apos;t see which answers
            are right or wrong until the end. If you don&apos;t pass, the chapter
            resets and you&apos;ll need to redo it.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {lesson.mcq.map((q, qIdx) => {
            const qText = isUrdu && q.questionUr ? q.questionUr : q.question;
            const qOptions = isUrdu && q.optionsUr && q.optionsUr.length > 0 ? q.optionsUr : q.options;

            return (
            <div
              key={qIdx}
              className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E5E5]"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase text-[#555555]">
                  Question {qIdx + 1} of {lesson.mcq.length}
                </span>
                {answers[qIdx] !== null && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0A9EDE]">
                    Answered
                  </span>
                )}
              </div>
              <h3 
                className={`text-base font-bold text-[#1D1D1D] mb-4 ${isUrdu ? "font-nastaliq text-right text-lg" : ""}`}
                dir={isUrdu ? "rtl" : "ltr"}
              >
                {qText}
              </h3>

              <div className="space-y-2">
                {qOptions.map((option, optIdx) => {
                  const isSelected = answers[qIdx] === optIdx;
                  // Deliberately neutral styling — selected vs unselected
                  // only. NEVER hint at correctness here.
                  const cls = isSelected
                    ? "border-[#0A9EDE] bg-[#0A9EDE]/5 text-[#1D1D1D] font-semibold"
                    : "border-[#E5E5E5] hover:border-[#A3A3A3] bg-white text-[#1D1D1D]";
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={submitting}
                      onClick={() => pickAnswer(qIdx, optIdx)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center gap-3 ${cls}`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                          isSelected
                            ? "bg-[#0A9EDE] border-[#0A9EDE]"
                            : "border-[#A3A3A3]"
                        }`}
                      />
                      <span 
                        className={`text-sm flex-1 ${isUrdu ? "font-nastaliq text-right text-base" : ""}`}
                        dir={isUrdu ? "rtl" : "ltr"}
                      >
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )})}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          isLoading={submitting}
          className="w-full"
        >
          {allAnswered ? "Submit Quiz" : "Answer every question to submit"}
        </Button>
      </div>
    );
  }

  // ───────────────────────── Content view ─────────────────────────
  return (
    <div className="pb-24 animate-in fade-in duration-500">
      {currentVideoUrl && (() => {
        const embedUrl = getYouTubeEmbedUrl(currentVideoUrl);
        return (
          <div className="w-full aspect-video bg-black sticky top-0 z-40 flex items-center justify-center">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video controls className="w-full h-full object-cover">
                <source src={currentVideoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        );
      })()}

      <div className="p-4 mt-2">
        <h1 className="text-2xl font-bold font-coolvetica mb-6">{lesson.title}</h1>

        <div
          className={`prose prose-sm text-[#1D1D1D] leading-relaxed max-w-none ${isUrdu ? "font-nastaliq text-right text-lg" : ""}`}
          dir={isUrdu ? "rtl" : "ltr"}
          dangerouslySetInnerHTML={{ __html: currentTextContent }}
        />

        {lesson.mcq.length > 0 && (
          <div className="mt-12 pt-6 border-t border-[#E5E5E5]">
            <div className="bg-[#0A9EDE]/10 border border-[#0A9EDE]/20 rounded-2xl p-6 text-center">
              <h3 className="font-bold text-[#1D1D1D] mb-2">
                Ready to test your knowledge?
              </h3>
              <p className="text-xs text-[#555555] mb-6">
                One submission. No hints, no per-question feedback. Pass and the
                chapter unlocks — fail and the chapter resets.
              </p>
              <Button onClick={startQuiz} className="w-full bg-[#0A9EDE] hover:bg-[#0A9EDE]/90">
                Take Questionnaire
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
