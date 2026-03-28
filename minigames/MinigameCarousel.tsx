import React, { useState, useCallback } from 'react';
import GoldenCipher from './game1';
import WordFillIn from './game2';
import TempleOfLogic from './game3';

const SLIDES = [
  { title: 'Cipher of Angkor', Component: GoldenCipher },
  { title: 'Fill in the Story', Component: WordFillIn },
  { title: 'Temple of Logic', Component: TempleOfLogic },
];

export default function MinigameCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < SLIDES.length - 1;

  const jumpTo = useCallback((index: number) => {
    if (index < 0 || index >= SLIDES.length) return;
    setCurrentIndex(index);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, SLIDES.length - 1));
  }, []);

  const previousSlide = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleComplete = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex]);


  const { title, Component } = SLIDES[currentIndex];

  return (
    <div
      className="h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' && hasPrev) previousSlide();
        if (e.key === 'ArrowRight' && hasNext) nextSlide();
      }}
    >
      <div className="absolute inset-0">
        <Component key={currentIndex} onComplete={handleComplete} />
      </div>

      <div className="fixed inset-x-0 top-0 z-50 p-3 backdrop-blur-sm bg-slate-900/60 border-b border-slate-700">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-yellow-300">
              {SLIDES[currentIndex].title} ({currentIndex + 1}/{SLIDES.length})
            </h2>
          </div>

          <div className="flex gap-2">
            <button
              onClick={previousSlide}
              disabled={!hasPrev}
              className={`px-3 py-1 rounded-md text-sm font-semibold transition ${hasPrev ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
            >
              Prev
            </button>
            <button
              onClick={nextSlide}
              disabled={!hasNext}
              className={`px-3 py-1 rounded-md text-sm font-semibold transition ${hasNext ? 'bg-amber-500 hover:bg-amber-400' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.title}
            onClick={() => jumpTo(i)}
            className={`h-2 w-2 rounded-full ring-1 ring-slate-500 transition ${currentIndex === i ? 'bg-yellow-300 ring-yellow-300' : 'bg-slate-500 hover:bg-slate-400'}`}
            aria-label={`Go to ${slide.title}`}
          />
        ))}
      </div>
    </div>
  );
}
