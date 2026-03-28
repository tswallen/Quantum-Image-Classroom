import React, { useState, useEffect } from 'react';

const PASSAGE = [
  { type: 'text', content: 'Angkor Wat is a very big ' },
  { type: 'gap', id: 0, expected: 'temple' },
  { type: 'text', content: '. It is very ' },
  { type: 'gap', id: 1, expected: 'old' },
  { type: 'text', content: '. It was built by a ' },
  { type: 'gap', id: 2, expected: 'king' },
  { type: 'text', content: ' a long time ago. You can find it hidden in the green ' },
  { type: 'gap', id: 3, expected: 'jungle' },
  { type: 'text', content: '.' }
];

const INITIAL_WORDS = ['temple', 'old', 'king', 'jungle'];

export default function App({ onComplete }: { onComplete?: () => void }) {
  const [wordBank, setWordBank] = useState([]);
  const [answers, setAnswers] = useState({ 0: null, 1: null, 2: null, 3: null });
  const [activeWord, setActiveWord] = useState(null); // For click-to-place functionality (mobile friendly)
  const [status, setStatus] = useState('playing'); // 'playing' | 'checked'
  const [score, setScore] = useState(0);

  // Initialize and shuffle words on mount
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const shuffled = [...INITIAL_WORDS].sort(() => Math.random() - 0.5);
    setWordBank(shuffled);
    setAnswers({ 0: null, 1: null, 2: null, 3: null });
    setStatus('playing');
    setActiveWord(null);
    setScore(0);
  };

  const handleMove = (word, source, target) => {
    if (status === 'checked') return; // Disable moves after checking
    if (source === target) return;

    let newAnswers = { ...answers };
    let newBank = [...wordBank];

    // Remove from source
    if (source === 'bank') {
      newBank = newBank.filter((w) => w !== word);
    } else {
      newAnswers[source] = null;
    }

    // Place in target
    if (target === 'bank') {
      if (!newBank.includes(word)) newBank.push(word);
    } else {
      // Target is a gap
      const existingWord = newAnswers[target];
      if (existingWord) {
        // Swap or push back
        if (source !== 'bank') {
          newAnswers[source] = existingWord;
        } else {
          newBank.push(existingWord);
        }
      }
      newAnswers[target] = word;
    }

    setAnswers(newAnswers);
    setWordBank(newBank);
    setActiveWord(null);
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e, word, source) => {
    if (status === 'checked') {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', JSON.stringify({ word, source }));
    setActiveWord({ word, source });
  };

  const handleDrop = (e, target) => {
    e.preventDefault();
    if (status === 'checked') return;
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      handleMove(data.word, data.source, target);
    } catch (err) {
      console.error("Invalid drop data");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // --- Click to Place Handlers (Mobile Fallback) ---
  const handleWordClick = (e, word, source) => {
    e.stopPropagation();
    if (status === 'checked') return;
    
    if (activeWord && activeWord.word === word && activeWord.source === source) {
      // Deselect if clicking the same active word
      setActiveWord(null);
    } else {
      // Select the word
      setActiveWord({ word, source });
    }
  };

  const handleZoneClick = (target) => {
    if (status === 'checked') return;
    
    if (activeWord) {
      handleMove(activeWord.word, activeWord.source, target);
    }
  };

  // --- Evaluation ---
  const checkAnswers = () => {
    let currentScore = 0;
    PASSAGE.forEach((part) => {
      if (part.type === 'gap') {
        if (answers[part.id] === part.expected) {
          currentScore++;
        }
      }
    });
    setScore(currentScore);
    setStatus('checked');
    setActiveWord(null);

    if (currentScore === INITIAL_WORDS.length) {
      onComplete?.();
    }
  };

  // --- Render Helpers ---
  const renderDraggableWord = (word, source) => {
    const isActive = activeWord && activeWord.word === word && activeWord.source === source;
    
    let baseClasses = "inline-block px-4 py-1 m-1 text-md md:text-lg font-serif font-semibold border-2 rounded-sm cursor-pointer transition-all duration-200 select-none shadow-[2px_2px_4px_rgba(62,39,35,0.4)]";
    
    if (status === 'checked') {
      // Read-only styling when checked
      baseClasses += " bg-[#d4c3a3] border-[#8b5a2b] text-[#3e2723] opacity-80 cursor-default shadow-none";
    } else if (isActive) {
      baseClasses += " bg-[#ebd6b0] border-[#d2691e] text-[#5c2a08] scale-105 shadow-[0px_0px_8px_rgba(210,105,30,0.6)] animate-pulse";
    } else {
      baseClasses += " bg-[#e3cdab] border-[#8b5a2b] text-[#4a3018] hover:bg-[#ebd6b0] hover:-translate-y-0.5";
    }

    return (
      <div
        key={`${source}-${word}`}
        draggable={status !== 'checked'}
        onDragStart={(e) => handleDragStart(e, word, source)}
        onClick={(e) => handleWordClick(e, word, source)}
        className={baseClasses}
      >
        {word}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-900 p-4 md:p-8 flex items-center justify-center font-serif selection:bg-[#d2b48c] selection:text-[#3e2723]">
      
      {/* The Manuscript Container */}
      <div className="w-full max-w-4xl relative bg-[#f4e8d0] text-[#3b2a1a] shadow-[0_10px_30px_rgba(0,0,0,0.8),inset_0_0_120px_rgba(139,69,19,0.15),inset_0_0_20px_rgba(139,69,19,0.2)] border-[12px] border-double border-[#704214] p-6 md:p-12 rounded-sm overflow-hidden">
        
        {/* Decorative corner pieces (simulated with CSS) */}
        <div className="absolute top-2 left-2 text-[#704214] opacity-50 text-2xl">❦</div>
        <div className="absolute top-2 right-2 text-[#704214] opacity-50 text-2xl">❦</div>
        <div className="absolute bottom-2 left-2 text-[#704214] opacity-50 text-2xl rotate-180">❦</div>
        <div className="absolute bottom-2 right-2 text-[#704214] opacity-50 text-2xl rotate-180">❦</div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold text-[#4a2e15] uppercase tracking-widest border-b-2 border-[#8b5a2b] inline-block pb-4 px-8 shadow-sm">
            The Story of Angkor Wat
          </h1>
          <p className="mt-4 text-[#5c3e21] italic opacity-80 text-xl">
            {status === 'playing' ? "Drag the words into the correct boxes." : "You finished the story!"}
          </p>
        </div>

        {/* The Text Passage */}
        <div className="text-2xl md:text-3xl leading-[2.5] md:leading-[3] text-justify mb-10">
          {PASSAGE.map((part, index) => {
            if (part.type === 'text') {
              return <span key={index}>{part.content}</span>;
            }

            if (part.type === 'gap') {
              const currentWord = answers[part.id];
              const isCorrect = status === 'checked' && currentWord === part.expected;
              const isWrong = status === 'checked' && currentWord !== part.expected;
              const isActiveTarget = activeWord && !currentWord && status !== 'checked';

              let gapClasses = "inline-flex items-center justify-center min-w-[160px] h-[40px] px-2 mx-2 align-middle border-b-2 border-dashed transition-colors duration-300 relative ";
              
              if (status === 'checked') {
                 if (isCorrect) gapClasses += "border-[#2e4a2e] bg-[#d9e3d9]";
                 else gapClasses += "border-[#8b0000] bg-[#e6cccc]";
              } else if (isActiveTarget) {
                 gapClasses += "border-[#d2691e] bg-[#fdf5e6] shadow-[inset_0px_0px_10px_rgba(210,105,30,0.2)] cursor-pointer";
              } else {
                 gapClasses += "border-[#8b5a2b] bg-[#eaddc5] cursor-pointer hover:bg-[#f0e4cd]";
              }

              return (
                <span
                  key={index}
                  className={gapClasses}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, part.id)}
                  onClick={() => handleZoneClick(part.id)}
                >
                  {currentWord && renderDraggableWord(currentWord, part.id)}
                  
                  {/* Feedback icon on checked state */}
                  {status === 'checked' && (
                    <span className="absolute -top-4 -right-3 text-2xl filter drop-shadow-sm">
                      {isCorrect ? '✅' : '❌'}
                    </span>
                  )}
                </span>
              );
            }
            return null;
          })}
        </div>

        {/* Word Bank Area */}
        <div className="border-t-2 border-[#8b5a2b] border-dashed pt-6 mb-8 min-h-[100px]"
             onDragOver={handleDragOver}
             onDrop={(e) => handleDrop(e, 'bank')}
             onClick={() => handleZoneClick('bank')}
        >
          <div className="text-center text-[#5c3e21] text-lg font-bold uppercase tracking-widest mb-4">
            — Word Bank —
          </div>
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 p-4 bg-[#ece0c3] rounded-sm shadow-inner min-h-[80px]">
            {wordBank.length === 0 && status !== 'checked' && (
              <span className="text-[#8b5a2b] italic opacity-60">All words placed.</span>
            )}
            {wordBank.map((word) => renderDraggableWord(word, 'bank'))}
          </div>
        </div>

        {/* Controls and Results */}
        <div className="flex flex-col items-center gap-6">
          {status === 'playing' ? (
            <button
              onClick={checkAnswers}
              className="px-8 py-3 bg-[#4a2e15] text-[#f4e8d0] font-serif font-bold text-xl uppercase tracking-wider rounded shadow-[4px_4px_0px_#2b1a0a] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#2b1a0a] active:translate-y-1 active:shadow-[2px_2px_0px_#2b1a0a] transition-all"
            >
              Check Answers
            </button>
          ) : (
            <div className="flex flex-col items-center animate-fade-in">
              <div className={`text-2xl md:text-3xl font-bold mb-4 ${score === 4 ? 'text-[#2e4a2e]' : 'text-[#8b0000]'}`}>
                {score === 4 ? "Great job! All correct!" : 
                 score > 0 ? `Good try! You got ${score} out of 4 right.` :
                 `Oops! Let's try again.`}
              </div>
              <button
                onClick={initializeGame}
                className="px-8 py-3 bg-[#8b5a2b] text-[#f4e8d0] font-serif font-bold text-xl uppercase tracking-wider rounded shadow-[4px_4px_0px_#4a2e15] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#4a2e15] active:translate-y-1 active:shadow-[2px_2px_0px_#4a2e15] transition-all"
              >
                Play Again
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}