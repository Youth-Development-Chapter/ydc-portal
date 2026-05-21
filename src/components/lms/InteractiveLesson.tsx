"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Play, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/utils/supabase/client";
import { saveProgress } from "@/lib/wellms";

interface MCQ {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

interface Lesson {
  id: string;
  title: string;
  videoUrl?: string;
  textContent: string;
  mcq: MCQ[];
}

export default function InteractiveLesson({ lesson, courseId }: { lesson: Lesson, courseId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<'content' | 'mcq'>('content');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [completed, setCompleted] = useState(false);

  const handleAnswerSelect = (index: number) => {
    if (isAnswerCorrect !== null) return; // already answered
    setSelectedAnswer(index);
    const correct = index === lesson.mcq[currentQuestionIndex].correctAnswerIndex;
    setIsAnswerCorrect(correct);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < lesson.mcq.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
    } else {
      // Finished all MCQs successfully
      handleCompleteLesson();
    }
  };

  const handleRetryQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
  };

  const handleCompleteLesson = async () => {
    setCompleted(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await saveProgress(user.id, courseId, lesson.id);
      }
    } catch (err) {
      console.error("Error saving progress to backend:", err);
    }
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh] animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-100 text-[#0BA242] rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-2xl font-coolvetica mb-2">Chapter Completed!</h2>
        <p className="text-[#555555] mb-8">You have successfully passed the questionnaire. The next chapter is now unlocked.</p>
        <Button onClick={() => router.push(`/lms/courses/${courseId}`)} className="w-full">
          Return to Course
        </Button>
      </div>
    );
  }

  if (mode === 'mcq') {
    const currentQ = lesson.mcq[currentQuestionIndex];
    return (
      <div className="p-4 space-y-6 animate-in slide-in-from-right duration-300">
        <div className="mb-4">
          <button onClick={() => setMode('content')} className="text-sm font-semibold text-[#0A9EDE] flex items-center gap-1">
            <ChevronLeft size={16} /> Back to Lesson
          </button>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E5E5]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase text-[#555555]">Question {currentQuestionIndex + 1} of {lesson.mcq.length}</span>
          </div>
          <h3 className="text-lg font-bold text-[#1D1D1D] mb-6">{currentQ.question}</h3>
          
          <div className="space-y-3">
            {currentQ.options.map((option, index) => {
              let btnClass = "w-full text-left p-4 rounded-xl border transition-colors flex justify-between items-center ";
              
              if (selectedAnswer === null) {
                btnClass += "border-[#E5E5E5] hover:border-[#0A9EDE] bg-white text-[#1D1D1D]";
              } else if (index === currentQ.correctAnswerIndex) {
                btnClass += "border-[#0BA242] bg-[#0BA242]/10 text-[#0BA242] font-bold";
              } else if (index === selectedAnswer && !isAnswerCorrect) {
                btnClass += "border-[#DD0408] bg-[#DD0408]/10 text-[#DD0408] font-bold";
              } else {
                btnClass += "border-[#E5E5E5] bg-gray-50 text-[#A3A3A3] opacity-50";
              }

              return (
                <button 
                  key={index}
                  disabled={selectedAnswer !== null}
                  onClick={() => handleAnswerSelect(index)}
                  className={btnClass}
                >
                  <span>{option}</span>
                  {selectedAnswer !== null && index === currentQ.correctAnswerIndex && <CheckCircle size={20} />}
                  {selectedAnswer === index && !isAnswerCorrect && <XCircle size={20} />}
                </button>
              );
            })}
          </div>

          {selectedAnswer !== null && (
            <div className="mt-8 animate-in slide-in-from-bottom-2">
              {isAnswerCorrect ? (
                <Button onClick={handleNextQuestion} className="w-full bg-[#0BA242] hover:bg-[#0BA242]/90">
                  {currentQuestionIndex < lesson.mcq.length - 1 ? "Next Question" : "Complete Chapter"}
                </Button>
              ) : (
                <Button onClick={handleRetryQuestion} variant="outline" className="w-full text-[#DD0408] border-[#DD0408] hover:bg-[#DD0408]/10">
                  Try Again
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 animate-in fade-in duration-500">
      {/* Video Player Area */}
      {lesson.videoUrl && (
        <div className="w-full aspect-video bg-black sticky top-0 z-40 flex items-center justify-center">
           <video controls className="w-full h-full object-cover">
             <source src={lesson.videoUrl} type="video/mp4" />
             Your browser does not support the video tag.
           </video>
        </div>
      )}

      {/* Lesson Content Area */}
      <div className="p-4 mt-2">
        <h1 className="text-2xl font-bold font-coolvetica mb-6">{lesson.title}</h1>
        
        <div 
          className="prose prose-sm text-[#1D1D1D] leading-relaxed max-w-none"
          dangerouslySetInnerHTML={{ __html: lesson.textContent }}
        />

        <div className="mt-12 pt-6 border-t border-[#E5E5E5]">
          <div className="bg-[#0A9EDE]/10 border border-[#0A9EDE]/20 rounded-2xl p-6 text-center">
            <h3 className="font-bold text-[#1D1D1D] mb-2">Ready to test your knowledge?</h3>
            <p className="text-xs text-[#555555] mb-6">Complete the questionnaire to unlock the next chapter.</p>
            <Button onClick={() => setMode('mcq')} className="w-full bg-[#0A9EDE] hover:bg-[#0A9EDE]/90">
              Take Questionnaire
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
