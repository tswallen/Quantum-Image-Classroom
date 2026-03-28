import React, { useState, useEffect, useRef } from 'react';
import { Lock, RefreshCw, Star } from 'lucide-react';

// --- Types & Data ---

type Problem = {
  question: string;
  answer: number;
};

// We will have 3 rings. 
// Outer (Level 0), Middle (Level 1), Inner (Level 2).
// Radii adjusted for visual centering
const RING_CONFIG = [
  { radius: 180, width: 38, fontSize: 20, color: 'fill-amber-950' }, // Outer
  { radius: 135, width: 38, fontSize: 18, color: 'fill-amber-950' }, // Middle
  { radius: 90,  width: 38, fontSize: 16, color: 'fill-amber-950' },  // Inner
];

const PROBLEMS: Problem[] = [
  { question: "5 + 3", answer: 8 },
  { question: "9 - 4", answer: 5 },
  { question: "6 + 6", answer: 12 },
];

// Generate random numbers for the rings, ensuring the answer is present
const generateRingData = () => {
  const rings = [];
  for (let level = 0; level < 3; level++) {
    const numbers: number[] = [];
    const answerIndex = Math.floor(Math.random() * 12);
    
    for (let i = 0; i < 12; i++) {
      if (i === answerIndex) {
        numbers.push(PROBLEMS[level].answer);
      } else {
        let val = Math.floor(Math.random() * 50);
        while (val === PROBLEMS[level].answer) {
          val = Math.floor(Math.random() * 50);
        }
        numbers.push(val);
      }
    }
    rings.push(numbers);
  }
  return rings;
};

export default function GoldenCipher({ onComplete }: { onComplete?: () => void }) {
  const [level, setLevel] = useState(0); 
  const [ringValues, setRingValues] = useState<number[][]>([]);
  const [rotations, setRotations] = useState<number[]>([0, 0, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartAngle, setDragStartAngle] = useState(0);
  const [initialRotation, setInitialRotation] = useState(0);
  const [message, setMessage] = useState("Align the rings to solve the riddle.");
  const [shake, setShake] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setRingValues(generateRingData());
  }, []);

  useEffect(() => {
    if (level === 3 && !hasCompleted) {
      setHasCompleted(true);
      onComplete?.();
    }
  }, [level, hasCompleted, onComplete]);

  const getAngle = (clientX: number, clientY: number) => {
    if (!svgRef.current) return 0;
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (level >= 3) return;
    setIsDragging(true);
    const angle = getAngle(e.clientX, e.clientY);
    setDragStartAngle(angle);
    setInitialRotation(rotations[level]);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || level >= 3) return;
    const currentAngle = getAngle(e.clientX, e.clientY);
    const delta = currentAngle - dragStartAngle;
    const newRotations = [...rotations];
    newRotations[level] = (initialRotation + delta) % 360; 
    setRotations(newRotations);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);

    const currentRot = rotations[level];
    const snapped = Math.round(currentRot / 30) * 30;
    const newRotations = [...rotations];
    newRotations[level] = snapped;
    setRotations(newRotations);
  };

  const getSelectedIndex = (ringIndex: number) => {
    const rot = rotations[ringIndex];
    const normalizedRot = ((rot % 360) + 360) % 360;
    const steps = Math.round(normalizedRot / 30);
    return (12 - (steps % 12)) % 12;
  };

  const checkAnswer = () => {
    if (level >= 3) return;

    const selectedIndex = getSelectedIndex(level);
    const selectedValue = ringValues[level][selectedIndex];
    const correctValue = PROBLEMS[level].answer;

    if (selectedValue === correctValue) {
      setMessage("Correct! The mechanism shifts...");
      if (level === 2) {
        setLevel(3); 
        setMessage("The Treasure is Unlocked!");
      } else {
        setLevel(prev => prev + 1);
      }
    } else {
      setMessage("The mechanism is jammed. Incorrect answer.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const resetGame = () => {
    setRingValues(generateRingData());
    setRotations([0, 0, 0]);
    setLevel(0);
    setMessage("Align the rings to solve the riddle.");
  };

  // Helper to draw a sector path for the selection window
  const createSectorPath = (innerR: number, outerR: number, startAngle: number, endAngle: number) => {
    // Convert angles to radians (subtract 90 to align 0 with top)
    const start = (startAngle - 90) * (Math.PI / 180);
    const end = (endAngle - 90) * (Math.PI / 180);

    const x1 = outerR * Math.cos(start);
    const y1 = outerR * Math.sin(start);
    const x2 = outerR * Math.cos(end);
    const y2 = outerR * Math.sin(end);
    const x3 = innerR * Math.cos(end);
    const y3 = innerR * Math.sin(end);
    const x4 = innerR * Math.cos(start);
    const y4 = innerR * Math.sin(start);

    return `M ${x1} ${y1} A ${outerR} ${outerR} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 0 0 ${x4} ${y4} Z`;
  };

  const renderRingNumbers = (ringIndex: number) => {
    if (!ringValues[ringIndex]) return null;
    const config = RING_CONFIG[ringIndex];
    const numbers = ringValues[ringIndex];
    
    // Half-width for separator positioning
    const halfWidth = config.width / 2;

    return numbers.map((num, i) => {
      const angleDeg = i * 30;
      const angleRad = (angleDeg - 90) * (Math.PI / 180); 
      const x = config.radius * Math.cos(angleRad);
      const y = config.radius * Math.sin(angleRad);
      const textRotation = angleDeg;

      // Calculate separator position (halfway between numbers: +15 degrees)
      const sepAngleDeg = angleDeg + 15;
      const sepAngleRad = (sepAngleDeg - 90) * (Math.PI / 180);
      const sepX = config.radius * Math.cos(sepAngleRad);
      const sepY = config.radius * Math.sin(sepAngleRad);

      return (
        <g key={`r${ringIndex}-n${i}`}>
             {/* Number */}
             <g transform={`translate(${x}, ${y}) rotate(${textRotation})`}>
                <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`font-serif font-extrabold select-none pointer-events-none drop-shadow-[0_1px_0px_rgba(255,255,255,0.4)] ${config.color}`}
                    style={{ fontSize: config.fontSize }}
                >
                {num}
                </text>
                {/* Engraved tick marks under number */}
                <rect 
                    x="-1" 
                    y={14} 
                    width="2" 
                    height="4" 
                    fill="#502508" 
                    className="opacity-40"
                />
             </g>

             {/* Beveled Separator Groove */}
             <g transform={`translate(${sepX}, ${sepY}) rotate(${sepAngleDeg})`}>
                 {/* Dark "Groove" */}
                 <rect 
                    x="-2" 
                    y={-halfWidth} 
                    width="4" 
                    height={config.width} 
                    fill="url(#grooveGradient)"
                    opacity="0.8"
                 />
                 {/* Highlight Edge for Bevel Effect */}
                 <rect 
                    x="1" 
                    y={-halfWidth} 
                    width="1" 
                    height={config.width} 
                    fill="rgba(255,255,255,0.3)"
                 />
                 <rect 
                    x="-2" 
                    y={-halfWidth} 
                    width="1" 
                    height={config.width} 
                    fill="rgba(0,0,0,0.5)"
                 />
             </g>
        </g>
      );
    });
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4 text-amber-100 font-sans relative overflow-hidden">
      
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-40 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black via-stone-900 to-black -z-10"></div>

      <h1 className="text-3xl md:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600 mb-2 tracking-widest text-center uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-10 border-b-2 border-amber-800 pb-2">
        Cipher of Angkor
      </h1>
      
      <p className="text-amber-100/70 mb-8 text-center max-w-md z-10 font-serif italic text-sm">
        {message}
      </p>

      {/* Main Puzzle Interface */}
      <div className={`relative w-[360px] h-[360px] md:w-[450px] md:h-[450px] transition-transform duration-100 ${shake ? 'animate-shake' : ''} z-10`}>
        
        {/* The Dial SVG */}
        <svg 
            ref={svgRef}
            viewBox="-200 -200 400 400" 
            className="w-full h-full cursor-grab active:cursor-grabbing touch-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
          <defs>
            {/* Rich Metallic Gold Gradient */}
            <linearGradient id="metalGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bf953f" />
              <stop offset="25%" stopColor="#fcf6ba" />
              <stop offset="50%" stopColor="#b38728" />
              <stop offset="75%" stopColor="#fbf5b7" />
              <stop offset="100%" stopColor="#aa771c" />
            </linearGradient>

            {/* Darker Bronze for Recessed areas */}
            <radialGradient id="darkBronze" cx="50%" cy="50%" r="50%">
               <stop offset="70%" stopColor="#451a03" />
               <stop offset="100%" stopColor="#290f00" />
            </radialGradient>

            {/* Separator Groove Gradient */}
            <linearGradient id="grooveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#290f00" />
                <stop offset="50%" stopColor="#502508" />
                <stop offset="100%" stopColor="#290f00" />
            </linearGradient>

            {/* Bevel Filter for 3D look */}
            <filter id="bevel">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
                <feSpecularLighting in="blur" surfaceScale="5" specularConstant="0.75" specularExponent="20" lightingColor="#ffeeaa" result="specOut">
                    <fePointLight x="-5000" y="-10000" z="20000"/>
                </feSpecularLighting>
                <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
                <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint"/>
                <feMerge>
                    <feMergeNode in="litPaint"/>
                </feMerge>
            </filter>

            {/* Inset Shadow for tracks */}
            <filter id="inset">
                <feFlood floodColor="#3d1c02"/>
                <feComposite in2="SourceAlpha" operator="out"/>
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feComposite in2="SourceGraphic" operator="atop"/>
            </filter>
            
            {/* Window Glass Effect */}
            <linearGradient id="glassShine" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
            </linearGradient>
            <filter id="windowGlow">
                <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
          </defs>

          {/* Main Base Plate (Background) */}
          <circle r="198" fill="#2a1205" stroke="url(#metalGold)" strokeWidth="6" />
          <circle r="195" fill="url(#darkBronze)" />
          
          {/* --- RINGS --- */}
          
          {/* Ring 0: Outer */}
          <g transform={`rotate(${rotations[0]})`} className="transition-transform duration-75 ease-out">
            {/* Gold Ring Body - r=180 width=38 covers 161 to 199 */}
            <circle r="180" fill="none" stroke="url(#metalGold)" strokeWidth="38" filter="url(#bevel)" />
            {/* Inner groove simulation */}
            <circle r="161" fill="none" stroke="#502508" strokeWidth="0.5" strokeOpacity="0.5"/>
            <circle r="199" fill="none" stroke="#502508" strokeWidth="0.5" strokeOpacity="0.5"/>
            {/* Active Selection Highlight (subtle inner glow) */}
            {level === 0 && <circle r="180" fill="none" stroke="#fbbf24" strokeWidth="38" strokeOpacity="0.1" />}
            {renderRingNumbers(0)}
          </g>
          
          {/* Ring 1: Middle */}
          <g transform={`rotate(${rotations[1]})`} className="transition-transform duration-75 ease-out">
             <circle r="135" fill="none" stroke="url(#metalGold)" strokeWidth="38" filter="url(#bevel)" />
             <circle r="116" fill="none" stroke="#502508" strokeWidth="0.5" strokeOpacity="0.5"/>
             <circle r="154" fill="none" stroke="#502508" strokeWidth="0.5" strokeOpacity="0.5"/>
             {level === 1 && <circle r="135" fill="none" stroke="#fbbf24" strokeWidth="38" strokeOpacity="0.1" />}
             {renderRingNumbers(1)}
          </g>

          {/* Ring 2: Inner */}
          <g transform={`rotate(${rotations[2]})`} className="transition-transform duration-75 ease-out">
             <circle r="90" fill="none" stroke="url(#metalGold)" strokeWidth="38" filter="url(#bevel)" />
             <circle r="71" fill="none" stroke="#502508" strokeWidth="0.5" strokeOpacity="0.5"/>
             <circle r="109" fill="none" stroke="#502508" strokeWidth="0.5" strokeOpacity="0.5"/>
             {level === 2 && <circle r="90" fill="none" stroke="#fbbf24" strokeWidth="38" strokeOpacity="0.1" />}
             {renderRingNumbers(2)}
          </g>
          
          {/* --- SELECTION WINDOW (Overlay) --- */}
          {/* Spans across all 3 rings at top position (-15 to +15 deg) */}
          {/* Inner Ring Inner Edge ~71. Outer Ring Outer Edge ~199. */}
          <g className="pointer-events-none drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
             <path 
                d={createSectorPath(70, 200, -15, 15)} 
                fill="url(#glassShine)" 
                stroke="url(#metalGold)" 
                strokeWidth="4" 
                filter="url(#bevel)"
                className="opacity-90"
             />
             {/* Extra highlight border */}
             <path 
                d={createSectorPath(73, 197, -13, 13)} 
                fill="none" 
                stroke="#fbbf24" 
                strokeWidth="1" 
                opacity="0.5"
             />
             {/* Rivets on the window frame */}
             <circle cx="0" cy="-203" r="3" fill="#3d1c02" />
             <circle cx="0" cy="-67" r="3" fill="#3d1c02" />
          </g>

          {/* --- CENTER PIECE --- */}
          {/* Center Hub */}
          <circle r="55" fill="url(#metalGold)" stroke="#78350f" strokeWidth="1" filter="url(#bevel)" />
          
          {/* The Problem Window - "Cut out" look */}
          <rect x="-45" y="-12" width="90" height="24" rx="2" fill="#290f00" stroke="#78350f" strokeWidth="1" filter="url(#inset)" />
          
          {/* The Problem Text */}
          <foreignObject x="-45" y="-12" width="90" height="24">
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
                <div className={`transition-transform duration-500 flex flex-col items-center justify-center w-full h-full ${level < 3 ? 'text-amber-100' : 'text-yellow-400'}`}>
                    {level < 3 ? (
                        <span className="font-serif font-bold text-sm tracking-wider text-amber-50 drop-shadow-md whitespace-nowrap">
                           {PROBLEMS[level].question}
                        </span>
                    ) : (
                        <Star className="w-4 h-4 animate-spin-slow text-yellow-300" />
                    )}
                </div>
            </div>
          </foreignObject>

          {/* Decorative Ornaments on Center Hub */}
          <circle r="3" fill="#3d1c02" cy="-30" />
          <circle r="3" fill="#3d1c02" cy="30" />
          <path d="M -45 0 L -50 0 M 45 0 L 50 0" stroke="#3d1c02" strokeWidth="2" />

        </svg>

        {/* Ambient Glow */}
        <div className="absolute inset-0 rounded-full pointer-events-none shadow-[0_0_100px_rgba(251,191,36,0.1)]"></div>
      </div>

      {/* Controls */}
      <div className="mt-12 flex gap-4 z-10">
        {level < 3 ? (
            <button
                onClick={checkAnswer}
                className="group relative px-8 py-3 bg-gradient-to-b from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-amber-50 font-bold font-serif tracking-widest uppercase rounded-sm border border-amber-400 shadow-[0_4px_0_rgb(69,26,3),0_5px_10px_rgba(0,0,0,0.5)] active:shadow-none active:translate-y-1 transition-all flex items-center gap-2"
            >
                <Lock className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Lock Ring {level + 1}</span>
            </button>
        ) : (
            <button
                onClick={resetGame}
                className="px-8 py-3 bg-gradient-to-b from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-emerald-50 font-bold font-serif tracking-widest uppercase rounded-sm border border-emerald-400 shadow-[0_4px_0_rgb(6,78,59),0_5px_10px_rgba(0,0,0,0.5)] active:shadow-none active:translate-y-1 transition-all flex items-center gap-2"
            >
                <RefreshCw className="w-4 h-4 animate-spin-once" />
                <span>Reset Device</span>
            </button>
        )}
      </div>

      {/* Progress Dots */}
      <div className="mt-8 flex gap-3 z-10">
        {[0, 1, 2].map((i) => (
            <div 
                key={i} 
                className={`w-2 h-2 rotate-45 border border-amber-500 transition-all duration-300 ${i < level ? 'bg-amber-300 shadow-[0_0_8px_#fbbf24] scale-125' : i === level ? 'bg-amber-700 animate-pulse' : 'bg-stone-800'}`}
            />
        ))}
      </div>

      <style jsx>{`
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px) rotate(-1deg); }
            75% { transform: translateX(5px) rotate(1deg); }
        }
        .animate-shake {
            animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        .animate-spin-slow {
            animation: spin 3s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}