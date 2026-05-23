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
  difficulty: "beginner" | "advanced" | "expert";
}

interface Lesson {
  id: string;
  title: string;
  titleUr?: string;
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
  lockedLanguage,
}: {
  lesson: Lesson;
  courseId: string;
  lockedLanguage: "en" | "ur";
}) {
  const router = useRouter();
  const [view, setView] = useState<ViewState>({ kind: "content" });
  const [selectedDifficulty, setSelectedDifficulty] = useState<"beginner" | "advanced" | "expert">(
    () => {
      // Find first difficulty that actually has questions if possible
      const hasBeginner = lesson.mcq.some(q => q.difficulty === "beginner");
      const hasAdvanced = lesson.mcq.some(q => q.difficulty === "advanced");
      const hasExpert = lesson.mcq.some(q => q.difficulty === "expert");
      if (!hasBeginner) {
        if (hasAdvanced) return "advanced";
        if (hasExpert) return "expert";
      }
      return "beginner";
    }
  );
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isUrdu = lockedLanguage === "ur";
  const currentVideoUrl = (isUrdu && lesson.videoUrlUr) ? lesson.videoUrlUr : lesson.videoUrl;
  const currentTextContent = (isUrdu && lesson.textContentUr) ? lesson.textContentUr : lesson.textContent;

  const filteredMcqs = lesson.mcq.filter((q) => q.difficulty === selectedDifficulty);

  // One answer slot per filtered question. `null` means unanswered.
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  React.useEffect(() => {
    setAnswers(filteredMcqs.map(() => null));
    setError(null);
  }, [selectedDifficulty, lesson.id]);

  function startQuiz() {
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

  const allAnswered = answers.length > 0 && answers.every((a) => a !== null);

  const labels = {
    en: {
      beginner: "Beginner",
      advanced: "Advanced",
      expert: "Expert",
      selectDifficulty: "Select Difficulty Level",
      backToLesson: "Back to Lesson",
      hintNote: "One submission, no hints.",
      hintText: "Answer every question, then submit. You won't see which answers are right or wrong until the end. If you don't pass, the chapter resets and you'll need to redo it.",
      submitQuiz: "Submit Quiz",
      answerAllToSubmit: "Answer every question to submit",
      questionProgress: (current: number, total: number) => `Question ${current} of ${total}`,
      answered: "Answered",
      noQuestions: "No questions available for this difficulty level.",
      courseCompleted: "Course Completed! 🎉",
      chapterCompleted: "Chapter Completed!",
      congratsCourse: "Congratulations! You have passed the final questionnaire and successfully completed the entire course!",
      congratsChapter: "You passed the questionnaire. The next chapter is now unlocked.",
      scoreLabel: (score: number, total: number) => `Score: ${score} / ${total}`,
      completionBonus: "Completion Bonus!",
      rewardCredited: (coins: number) => `Reward credited: +${coins} YDC Coins`,
      returnToAcademy: "Return to Academy",
      returnToCourse: "Return to Course",
      testFailed: "Test Failed",
      failDesc1: "You didn't pass this chapter's questionnaire.",
      failDesc2: "The chapter has been reset — please review the content and try again.",
      attemptsLabel: (attempts: number) => `Attempts so far: ${attempts}`,
      reviewChapter: "Review Chapter",
      readyToTest: "Ready to test your knowledge?",
      readyDesc: "One submission. No hints, no per-question feedback. Pass and the chapter unlocks — fail and the chapter resets.",
      takeQuestionnaire: "Take Questionnaire",
    },
    ur: {
      beginner: "ابتدائی",
      advanced: "اعلیٰ",
      expert: "ماہر",
      selectDifficulty: "مشکل کی سطح منتخب کریں",
      backToLesson: "سبق پر واپس جائیں",
      hintNote: "صرف ایک کوشش، کوئی اشارہ نہیں۔",
      hintText: "تمام سوالات کے جوابات دیں، پھر جمع کریں۔ آپ کو آخر تک یہ معلوم نہیں ہوگا کہ کون سے جوابات درست ہیں یا غلط۔ اگر آپ کامیاب نہیں ہوئے تو سبق دوبارہ شروع ہو جائے گا۔",
      submitQuiz: "کوئز جمع کریں",
      answerAllToSubmit: "جمع کرنے کے لیے تمام سوالات کے جواب دیں",
      questionProgress: (current: number, total: number) => `سوال ${current} کا ${total}`,
      answered: "جواب دیا گیا",
      noQuestions: "اس سطح کے لیے کوئی سوالات دستیاب نہیں ہیں۔",
      courseCompleted: "کورس مکمل ہو گیا! 🎉",
      chapterCompleted: "سبق مکمل ہو گیا!",
      congratsCourse: "مبارک ہو! آپ نے آخری سوالات کا مرحلہ پاس کر لیا ہے اور پورے کورس کو کامیابی سے مکمل کر لیا ہے!",
      congratsChapter: "آپ نے سوالات پاس کر لیے ہیں۔ اگلا سبق اب کھل گیا ہے۔",
      scoreLabel: (score: number, total: number) => `سکور: ${score} / ${total}`,
      completionBonus: "تکمیل کا بونس!",
      rewardCredited: (coins: number) => `کریڈٹ انعام: +${coins} YDC سکے`,
      returnToAcademy: "اکیڈمی پر واپس جائیں",
      returnToCourse: "کورس پر واپس جائیں",
      testFailed: "امتحان ناکام ہو گیا",
      failDesc1: "آپ اس سبق کا امتحان پاس نہیں کر سکے۔",
      failDesc2: "سبق دوبارہ شروع کر دیا گیا ہے — براہ کرم مواد کا جائزہ لیں اور دوبارہ کوشش کریں۔",
      attemptsLabel: (attempts: number) => `اب تک کی کوششیں: ${attempts}`,
      reviewChapter: "سبق کا جائزہ لیں",
      readyToTest: "کیا آپ اپنی معلومات کا امتحان لینے کے لیے تیار ہیں؟",
      readyDesc: "صرف ایک کوشش۔ کوئی اشارہ نہیں، کوئی سوال وار فیڈ بیک نہیں۔ پاس کریں اور سبق انلاک کریں — ناکام ہو جائیں اور سبق ری سیٹ ہو جائے گا۔",
      takeQuestionnaire: "سوالات کے جواب دیں",
    }
  };

  const currentLabels = labels[lockedLanguage];

  const beginnerCount = lesson.mcq.filter((q) => q.difficulty === "beginner").length;
  const advancedCount = lesson.mcq.filter((q) => q.difficulty === "advanced").length;
  const expertCount = lesson.mcq.filter((q) => q.difficulty === "expert").length;

  function handleSubmit() {
    if (!allAnswered) return;
    setError(null);
    setView({ kind: "submitting" });
    startTransition(async () => {
      const result = await submitQuiz(lesson.id, answers as number[], selectedDifficulty, lockedLanguage);
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
    setAnswers(filteredMcqs.map(() => null));
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
        
        <h2 className={`text-2xl font-coolvetica mb-2 ${isUrdu ? "font-nastaliq text-3xl" : ""}`}>
          {isCourseDone ? currentLabels.courseCompleted : currentLabels.chapterCompleted}
        </h2>
        <p className={`text-[#555555] mb-2 max-w-md ${isUrdu ? "font-nastaliq text-lg leading-relaxed" : ""}`}>
          {isCourseDone ? currentLabels.congratsCourse : currentLabels.congratsChapter}
        </p>
        <p className="text-xs text-[#A3A3A3] mb-8">
          {currentLabels.scoreLabel(view.total, view.total)}
        </p>

        {isCourseDone && view.rewardCoins > 0 && (
          <div className="w-full max-w-sm bg-yellow-50 border border-yellow-200 rounded-2xl p-5 mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 text-white rounded-full flex items-center justify-center shrink-0">
              <Award size={20} />
            </div>
            <div className={`text-left ${isUrdu ? "text-right flex-1" : ""}`}>
              <p className={`font-bold text-sm text-[#1D1D1D] ${isUrdu ? "font-nastaliq" : ""}`}>
                {currentLabels.completionBonus}
              </p>
              <p className={`text-xs text-[#555555] ${isUrdu ? "font-nastaliq mt-0.5" : ""}`}>
                {currentLabels.rewardCredited(view.rewardCoins)}
              </p>
            </div>
          </div>
        )}

        <Button
          onClick={() => router.push(isCourseDone ? "/lms/courses" : `/lms/courses/${courseId}`)}
          className={`w-full max-w-sm bg-[#0A9EDE] hover:bg-[#0A9EDE]/90 ${isUrdu ? "font-nastaliq text-lg" : ""}`}
        >
          {isCourseDone ? currentLabels.returnToAcademy : currentLabels.returnToCourse}
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
        <h2 className={`text-2xl font-coolvetica mb-2 ${isUrdu ? "font-nastaliq text-3xl" : ""}`}>
          {currentLabels.testFailed}
        </h2>
        <p className={`text-[#555555] mb-1 ${isUrdu ? "font-nastaliq text-lg leading-relaxed" : ""}`}>
          {currentLabels.failDesc1}
        </p>
        <p className={`text-[#555555] mb-2 ${isUrdu ? "font-nastaliq text-lg leading-relaxed" : ""}`}>
          {currentLabels.failDesc2}
        </p>
        <p className="text-xs text-[#A3A3A3] mb-8">
          {currentLabels.attemptsLabel(view.failedAttempts)}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Button onClick={handleRetryAfterFail} className={`w-full ${isUrdu ? "font-nastaliq text-lg" : ""}`}>
            {currentLabels.reviewChapter}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/lms/courses/${courseId}`)}
            className={`w-full ${isUrdu ? "font-nastaliq text-lg" : ""}`}
          >
            {currentLabels.returnToCourse}
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
            className={`text-sm font-semibold text-[#0A9EDE] flex items-center gap-1 ${isUrdu ? "font-nastaliq flex-row-reverse" : ""}`}
            disabled={submitting}
          >
            {isUrdu ? (
              <>
                {currentLabels.backToLesson} <ChevronLeft size={16} className="rotate-180" />
              </>
            ) : (
              <>
                <ChevronLeft size={16} /> {currentLabels.backToLesson}
              </>
            )}
          </button>
        </div>

        {/* Difficulty Tab Selector inside Quiz View */}
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col gap-2">
            <label className={`text-xs font-semibold text-gray-500 uppercase ${isUrdu ? "text-right font-nastaliq" : ""}`}>
              {currentLabels.selectDifficulty}
            </label>
            <div className="grid grid-cols-3 gap-2 bg-[#F5F5F5] p-1 rounded-xl">
              {[
                { key: "beginner", label: currentLabels.beginner, count: beginnerCount },
                { key: "advanced", label: currentLabels.advanced, count: advancedCount },
                { key: "expert", label: currentLabels.expert, count: expertCount },
              ].map((tab) => {
                const isActive = selectedDifficulty === tab.key;
                const isDisabled = tab.count === 0;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    disabled={isDisabled || submitting}
                    onClick={() => setSelectedDifficulty(tab.key as any)}
                    className={`px-3 text-xs font-bold rounded-lg transition-colors flex flex-col items-center justify-center gap-0.5 ${
                      isUrdu ? "pt-1.5 pb-2.5" : "py-2"
                    } ${
                      isActive
                        ? "bg-[#0A9EDE] text-white shadow-sm"
                        : isDisabled
                        ? "text-gray-400 opacity-50 cursor-not-allowed"
                        : "text-[#555555] hover:bg-gray-200"
                    }`}
                  >
                    <span className={isUrdu ? "font-nastaliq pb-0.5" : ""}>{tab.label}</span>
                    <span className="text-[10px] font-normal opacity-80">({tab.count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`bg-[#0A9EDE]/5 border border-[#0A9EDE]/20 rounded-xl p-4 text-xs text-[#1D1D1D] ${isUrdu ? "text-right" : ""}`}>
          <p className={`font-semibold mb-1 ${isUrdu ? "font-nastaliq text-sm" : ""}`}>{currentLabels.hintNote}</p>
          <p className={`text-[#555555] ${isUrdu ? "font-nastaliq text-xs leading-relaxed" : ""}`}>
            {currentLabels.hintText}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {filteredMcqs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-[#E5E5E5] space-y-3">
            <AlertTriangle className="mx-auto text-yellow-500" size={36} />
            <p className={`text-sm text-[#555555] ${isUrdu ? "font-nastaliq" : ""}`}>
              {currentLabels.noQuestions}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredMcqs.map((q, qIdx) => {
              const qText = isUrdu && q.questionUr ? q.questionUr : q.question;
              const qOptions = isUrdu && q.optionsUr && q.optionsUr.length > 0 ? q.optionsUr : q.options;

              return (
                <div
                  key={qIdx}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E5E5]"
                >
                  <div className={`flex items-center justify-between mb-3 ${isUrdu ? "flex-row-reverse" : ""}`}>
                    <span className={`text-xs font-bold uppercase text-[#555555] ${isUrdu ? "font-nastaliq" : ""}`}>
                      {isUrdu ? currentLabels.questionProgress(qIdx + 1, filteredMcqs.length) : `Question ${qIdx + 1} of ${filteredMcqs.length}`}
                    </span>
                    {answers[qIdx] !== null && (
                      <span className={`text-[10px] font-semibold uppercase tracking-wider text-[#0A9EDE] ${isUrdu ? "font-nastaliq" : ""}`}>
                        {currentLabels.answered}
                      </span>
                    )}
                  </div>
                  <h3 
                    className={`text-base font-bold text-[#1D1D1D] mb-4 ${isUrdu ? "font-nastaliq text-right text-xl leading-relaxed" : ""}`}
                    dir={isUrdu ? "rtl" : "ltr"}
                  >
                    {qText}
                  </h3>

                  <div className="space-y-2">
                    {qOptions.map((option, optIdx) => {
                      const isSelected = answers[qIdx] === optIdx;
                      const cls = isSelected
                        ? "border-[#0A9EDE] bg-[#0A9EDE]/5 text-[#1D1D1D] font-semibold"
                        : "border-[#E5E5E5] hover:border-[#A3A3A3] bg-white text-[#1D1D1D]";
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          disabled={submitting}
                          onClick={() => pickAnswer(qIdx, optIdx)}
                          className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center gap-3 ${
                            isUrdu ? "flex-row-reverse text-right" : "flex-row text-left"
                          } ${cls}`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                              isSelected
                                ? "bg-[#0A9EDE] border-[#0A9EDE]"
                                : "border-[#A3A3A3]"
                            }`}
                          />
                          <span 
                            className={`text-sm flex-1 ${isUrdu ? "font-nastaliq text-right text-base leading-relaxed" : ""}`}
                            dir={isUrdu ? "rtl" : "ltr"}
                          >
                            {option}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          isLoading={submitting}
          className={`w-full ${isUrdu ? "font-nastaliq text-lg" : ""}`}
        >
          {allAnswered ? currentLabels.submitQuiz : currentLabels.answerAllToSubmit}
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
        <h1 className={`text-2xl font-bold font-coolvetica mb-6 ${isUrdu ? "font-nastaliq text-right text-3xl leading-relaxed" : ""}`} dir={isUrdu ? "rtl" : "ltr"}>
          {isUrdu && lesson.titleUr ? lesson.titleUr : lesson.title}
        </h1>

        <div
          className={`prose prose-sm text-[#1D1D1D] leading-relaxed max-w-none ${isUrdu ? "font-nastaliq text-right text-lg leading-relaxed" : ""}`}
          dir={isUrdu ? "rtl" : "ltr"}
          dangerouslySetInnerHTML={{ __html: currentTextContent }}
        />

        {lesson.mcq.length > 0 && (
          <div className="mt-12 pt-6 border-t border-[#E5E5E5]">
            <div className="bg-[#0A9EDE]/10 border border-[#0A9EDE]/20 rounded-2xl p-6 space-y-6">
              <div className="text-center">
                <h3 className={`font-bold text-[#1D1D1D] mb-2 ${isUrdu ? "font-nastaliq text-xl" : ""}`}>
                  {currentLabels.readyToTest}
                </h3>
                <p className={`text-xs text-[#555555] ${isUrdu ? "font-nastaliq" : ""}`}>
                  {currentLabels.readyDesc}
                </p>
              </div>

              {/* Difficulty Selector before starting */}
              <div className="flex flex-col gap-2 max-w-md mx-auto">
                <label className={`text-xs font-semibold text-gray-500 uppercase ${isUrdu ? "text-right font-nastaliq" : ""}`}>
                  {currentLabels.selectDifficulty}
                </label>
                <div className="grid grid-cols-3 gap-2 bg-[#F5F5F5] p-1 rounded-xl">
                  {[
                    { key: "beginner", label: currentLabels.beginner, count: beginnerCount },
                    { key: "advanced", label: currentLabels.advanced, count: advancedCount },
                    { key: "expert", label: currentLabels.expert, count: expertCount },
                  ].map((tab) => {
                    const isActive = selectedDifficulty === tab.key;
                    const isDisabled = tab.count === 0;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setSelectedDifficulty(tab.key as any)}
                        className={`px-3 text-xs font-bold rounded-lg transition-colors flex flex-col items-center justify-center gap-0.5 ${
                          isUrdu ? "pt-1.5 pb-2.5" : "py-2"
                        } ${
                          isActive
                            ? "bg-[#0A9EDE] text-white shadow-sm"
                            : isDisabled
                            ? "text-gray-400 opacity-50 cursor-not-allowed"
                            : "text-[#555555] hover:bg-gray-200"
                        }`}
                      >
                        <span className={isUrdu ? "font-nastaliq pb-0.5" : ""}>{tab.label}</span>
                        <span className="text-[10px] font-normal opacity-80">({tab.count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-center">
                <Button onClick={startQuiz} className={`w-full max-w-md bg-[#0A9EDE] hover:bg-[#0A9EDE]/90 ${isUrdu ? "font-nastaliq text-lg" : ""}`}>
                  {currentLabels.takeQuestionnaire}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
