"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  AlertTriangle, 
  Calendar, 
  Check, 
  Megaphone, 
  Gift, 
  ChevronLeft, 
  ChevronRight,
  Sparkles
} from "lucide-react";

export interface Flashcard {
  id: string;
  type: string;
  title: string;
  titleUr?: string;
  description: string;
  descriptionUr?: string;
  link: string;
  badgeText: string;
  badgeTextUr?: string;
  badgeColor: 'blue' | 'red' | 'green' | 'purple' | string;
  iconName: 'book' | 'alert' | 'calendar' | 'check' | 'bell' | 'gift';
  progress?: number;
  isUrdu?: boolean;
}

interface DashboardFlashcardsProps {
  flashcards: Flashcard[];
}

export default function DashboardFlashcards({ flashcards }: DashboardFlashcardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);

  // Swipe gestures state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Safe navigation
  const prevSlide = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setCurrentIndex((prev) => (prev === 0 ? flashcards.length - 1 : prev - 1));
  };

  const nextSlide = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setCurrentIndex((prev) => (prev === flashcards.length - 1 ? 0 : prev + 1));
  };

  // Auto-play setup
  useEffect(() => {
    if (flashcards.length <= 1 || isPaused) {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
      return;
    }

    autoPlayTimer.current = setInterval(() => {
      nextSlide();
    }, 8000);

    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    };
  }, [flashcards, isPaused, currentIndex]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (diff > minSwipeDistance) {
      nextSlide();
    } else if (diff < -minSwipeDistance) {
      prevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!flashcards || flashcards.length === 0) return null;

  const currentCard = flashcards[currentIndex];
  const isUrdu = currentCard.isUrdu || false;

  // Determine styles dynamically based on color configuration
  const getThemeStyles = (color: string) => {
    switch (color) {
      case 'red':
        return {
          wrapper: "from-[#DD0408]/10 to-red-500/5 border-[#DD0408]/20 hover:border-[#DD0408]/40",
          iconContainer: "bg-[#DD0408]/10 text-[#DD0408]",
          badge: "bg-[#DD0408]/10 text-[#DD0408] border-[#DD0408]/20",
          progressBar: "bg-[#DD0408]"
        };
      case 'green':
        return {
          wrapper: "from-[#0BA242]/10 to-green-500/5 border-[#0BA242]/20 hover:border-[#0BA242]/40",
          iconContainer: "bg-[#0BA242]/10 text-[#0BA242]",
          badge: "bg-[#0BA242]/10 text-[#0BA242] border-[#0BA242]/20",
          progressBar: "bg-[#0BA242]"
        };
      case 'purple':
        return {
          wrapper: "from-purple-500/10 to-indigo-500/5 border-purple-500/20 hover:border-purple-500/40",
          iconContainer: "bg-purple-500/10 text-purple-600",
          badge: "bg-purple-500/10 text-purple-600 border-purple-500/20",
          progressBar: "bg-purple-500"
        };
      case 'blue':
      default:
        return {
          wrapper: "from-[#0A9EDE]/10 to-blue-500/5 border-[#0A9EDE]/20 hover:border-[#0A9EDE]/40",
          iconContainer: "bg-[#0A9EDE]/10 text-[#0A9EDE]",
          badge: "bg-[#0A9EDE]/10 text-[#0A9EDE] border-[#0A9EDE]/20",
          progressBar: "bg-[#0A9EDE]"
        };
    }
  };

  const styles = getThemeStyles(currentCard.badgeColor);

  const renderIcon = (name: string, className: string) => {
    switch (name) {
      case 'book': return <BookOpen className={className} size={20} />;
      case 'alert': return <AlertTriangle className={className} size={20} />;
      case 'calendar': return <Calendar className={className} size={20} />;
      case 'check': return <Check className={className} size={20} />;
      case 'bell': return <Megaphone className={className} size={20} />;
      case 'gift': return <Gift className={className} size={20} />;
      default: return <Sparkles className={className} size={20} />;
    }
  };

  return (
    <div 
      className="relative w-full overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Link 
        href={currentCard.link}
        className={`block bg-gradient-to-r ${styles.wrapper} border rounded-2xl p-4 flex items-center justify-between group transition-all duration-300 shadow-sm cursor-pointer min-h-[92px] ${isUrdu ? "flex-row-reverse text-right" : ""}`}
      >
        <div className={`flex items-center gap-4 flex-1 ${isUrdu ? "flex-row-reverse" : ""}`}>
          <div className={`w-12 h-12 rounded-full ${styles.iconContainer} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-300`}>
            {renderIcon(currentCard.iconName, "animate-none")}
          </div>
          
          <div className={`flex-1 min-w-0 ${isUrdu ? "pl-2 text-right" : "pr-2"}`}>
            <span className={`inline-block text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border ${styles.badge} mb-1.5 ${isUrdu ? "font-nastaliq" : ""}`}>
              {isUrdu && currentCard.badgeTextUr ? currentCard.badgeTextUr : currentCard.badgeText}
            </span>
            
            <h4 
              className={`font-bold text-sm text-[#1D1D1D] mb-1 truncate leading-tight ${isUrdu ? "font-nastaliq text-base" : ""}`}
              dir={isUrdu ? "rtl" : "ltr"}
            >
              {isUrdu && currentCard.titleUr ? currentCard.titleUr : currentCard.title}
            </h4>
            
            <p 
              className={`text-xs text-[#555555] truncate ${isUrdu ? "font-nastaliq text-sm leading-relaxed" : ""}`}
              dir={isUrdu ? "rtl" : "ltr"}
            >
              {isUrdu && currentCard.descriptionUr ? currentCard.descriptionUr : currentCard.description}
            </p>

            {/* Render Progress Bar if defined */}
            {typeof currentCard.progress === 'number' && (
              <div className="w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className={`h-full rounded-full ${styles.progressBar} transition-all duration-500`} 
                  style={{ width: `${currentCard.progress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>

        {/* Nav arrows / Indicator section */}
        <div className={`flex items-center self-center shrink-0 ml-2 ${isUrdu ? "flex-row-reverse mr-2 ml-0" : ""}`}>
          <ChevronRight size={18} className={`text-[#A3A3A3] group-hover:translate-x-0.5 transition-transform duration-300 ${isUrdu ? "rotate-180 group-hover:-translate-x-0.5" : ""}`} />
        </div>
      </Link>

      {/* Manual Switer overlay for multiple cards */}
      {flashcards.length > 1 && (
        <div className={`flex items-center justify-between px-3 mt-1.5 ${isUrdu ? "flex-row-reverse" : ""}`}>
          {/* Capsule indicators */}
          <div className={`flex gap-1.5 py-1 ${isUrdu ? "flex-row-reverse" : ""}`}>
            {flashcards.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex 
                    ? "w-4 bg-[#1D1D1D]/70" 
                    : "w-1.5 bg-[#E5E5E5]"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Micro arrow buttons */}
          <div className={`flex items-center gap-1 ${isUrdu ? "flex-row-reverse" : ""}`}>
            <button 
              onClick={prevSlide}
              className="w-5 h-5 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center text-[#A3A3A3] hover:text-[#1D1D1D] hover:border-[#1D1D1D]/30 transition"
            >
              <ChevronLeft size={12} />
            </button>
            <button 
              onClick={nextSlide}
              className="w-5 h-5 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center text-[#A3A3A3] hover:text-[#1D1D1D] hover:border-[#1D1D1D]/30 transition"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
