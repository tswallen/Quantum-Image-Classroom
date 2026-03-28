import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Droplets, Info, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

// --- DATA & CONFIG ---

const RUNES = {
  add: { id: 'add', symbol: 'योग', en: 'Add (+)' },
  sub: { id: 'sub', symbol: 'हीन', en: 'Subtract (-)' },
  gt:  { id: 'gt',  symbol: 'अधिक', en: 'Greater (>)' },
  lt:  { id: 'lt',  symbol: 'न्यून', en: 'Less (<)' },
  eq:  { id: 'eq',  symbol: 'सम', en: 'Equal (=)' },
  and: { id: 'and', symbol: 'तथा', en: 'AND' },
  or:  { id: 'or',  symbol: 'वा', en: 'OR' }
};

const LEVELS = [
  {
    id: 1,
    name: "The First Flow",
    clue: "The source stream carries a pressure of 10. The goal requires exactly 6. The modifier stone above the slot shows 4. What operation reduces the flow correctly?",
    nodes: [
      { id: 'src', type: 'source', value: 10, x: 15, y: 50 },
      { id: 'slot', type: 'math_slot', rightVal: 4, solution: 'sub', x: 50, y: 50 },
      { id: 'tgt', type: 'target', expectedVal: 6, x: 85, y: 50 }
    ],
    edges: [
      { id: 'e1', from: 'src', to: 'slot', dependsOn: null },
      { id: 'e2', from: 'slot', to: 'tgt', dependsOn: 'slot' }
    ]
  },
  {
    id: 2,
    name: "Scales of Judgment",
    clue: "The ancient gate opens only if the upper stream's pressure overcomes the lower stream's pressure. Place the correct comparison rune.",
    nodes: [
      { id: 'src1', type: 'source', value: 8, x: 20, y: 25 },
      { id: 'src2', type: 'source', value: 5, x: 20, y: 75 },
      { id: 'slot', type: 'logic_slot', solution: 'gt', x: 50, y: 50 },
      { id: 'tgt', type: 'target', expectedVal: 'True', x: 80, y: 50 }
    ],
    edges: [
      { id: 'e1', from: 'src1', to: 'slot', dependsOn: null },
      { id: 'e2', from: 'src2', to: 'slot', dependsOn: null },
      { id: 'e3', from: 'slot', to: 'tgt', dependsOn: 'slot' }
    ]
  },
  {
    id: 3,
    name: "The Dual Keys",
    clue: "Both the Sun (Top) and Moon (Bottom) sources are active. The ancient lock requires both elements to flow together.",
    nodes: [
      { id: 'src1', type: 'source', value: 'Active', x: 20, y: 25 },
      { id: 'src2', type: 'source', value: 'Active', x: 20, y: 75 },
      { id: 'slot', type: 'logic_slot', solution: 'and', x: 50, y: 50 },
      { id: 'tgt', type: 'target', expectedVal: 'Active', x: 80, y: 50 }
    ],
    edges: [
      { id: 'e1', from: 'src1', to: 'slot', dependsOn: null },
      { id: 'e2', from: 'src2', to: 'slot', dependsOn: null },
      { id: 'e3', from: 'slot', to: 'tgt', dependsOn: 'slot' }
    ]
  },
  {
    id: 4,
    name: "Perfect Balance",
    clue: "Reduce the furious upper stream to match the lower stream. Only perfect equality will open the final seal.",
    nodes: [
      { id: 'src1', type: 'source', value: 12, x: 10, y: 25 },
      { id: 'slot1', type: 'math_slot', rightVal: 4, solution: 'sub', x: 35, y: 25 },
      { id: 'src2', type: 'source', value: 8, x: 10, y: 75 },
      { id: 'slot2', type: 'logic_slot', solution: 'eq', x: 65, y: 50 },
      { id: 'tgt', type: 'target', expectedVal: 'True', x: 90, y: 50 }
    ],
    edges: [
      { id: 'e1', from: 'src1', to: 'slot1', dependsOn: null },
      { id: 'e2', from: 'slot1', to: 'slot2', dependsOn: 'slot1' },
      { id: 'e3', from: 'src2', to: 'slot2', dependsOn: null },
      { id: 'e4', from: 'slot2', to: 'tgt', dependsOn: 'slot2' }
    ]
  }
];

// --- MAIN COMPONENT ---

export default function TempleOfLogic({ onComplete }: { onComplete?: () => void }) {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [placedRunes, setPlacedRunes] = useState({});
  const [flowState, setFlowState] = useState('idle'); // idle, flowing, success, fail
  const [selectedRune, setSelectedRune] = useState(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  
  const level = LEVELS[currentLevelIdx];

  // Reset level state when changing levels
  useEffect(() => {
    setPlacedRunes({});
    setFlowState('idle');
    setSelectedRune(null);
    setHasCompleted(false);
  }, [currentLevelIdx]);

  useEffect(() => {
    if (flowState === 'success' && !hasCompleted) {
      setHasCompleted(true);
      onComplete?.();
    }
  }, [flowState, hasCompleted, onComplete]);

  // --- LOGIC ---

  const handlePlaceRune = (nodeId, runeId) => {
    if (flowState !== 'idle') setFlowState('idle'); // Reset simulation on change
    setPlacedRunes(prev => ({ ...prev, [nodeId]: runeId }));
    setSelectedRune(null);
  };

  const handleRemoveRune = (nodeId) => {
    if (flowState !== 'idle') setFlowState('idle');
    setPlacedRunes(prev => {
      const copy = { ...prev };
      delete copy[nodeId];
      return copy;
    });
  };

  const testFlow = () => {
    setFlowState('flowing');
    
    // Evaluate if all required slots have the correct runes
    let allCorrect = true;
    level.nodes.forEach(node => {
      if (node.type.includes('slot')) {
        if (placedRunes[node.id] !== node.solution) {
          allCorrect = false;
        }
      }
    });

    // Provide delayed feedback for the water animation to play out
    setTimeout(() => {
      if (allCorrect) {
        setFlowState('success');
      } else {
        setFlowState('fail');
      }
    }, 1500);
  };

  // Determine which edges have water flowing through them
  const getActiveEdges = () => {
    if (flowState === 'idle') return [];
    
    return level.edges.filter(edge => {
      if (!edge.dependsOn) return true; // Sources always flow
      const slotNode = level.nodes.find(n => n.id === edge.dependsOn);
      // Flow continues if the placed rune is correct
      return placedRunes[slotNode.id] === slotNode.solution;
    }).map(e => e.id);
  };

  const activeEdges = getActiveEdges();

  // --- DRAG AND DROP HANDLERS ---

  const onDragStart = (e, runeId) => {
    e.dataTransfer.setData('runeId', runeId);
  };

  const onDrop = (e, nodeId) => {
    e.preventDefault();
    const runeId = e.dataTransfer.getData('runeId');
    if (runeId) {
      handlePlaceRune(nodeId, runeId);
    }
  };

  const onDragOver = (e) => e.preventDefault();

  return (
    <div className="min-h-screen bg-stone-950 text-stone-300 font-sans flex flex-col items-center p-4 md:p-8 overflow-x-hidden selection:bg-cyan-900">
      
      {/* Header */}
      <div className="max-w-4xl w-full flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif text-yellow-500 tracking-wider shadow-yellow-900 drop-shadow-md">
            TEMPLE OF LOGIC
          </h1>
          <p className="text-stone-400 text-sm mt-1 uppercase tracking-widest">
            Level {level.id}: {level.name}
          </p>
        </div>
        <div className="flex gap-2">
          {LEVELS.map((l, i) => (
            <button
              key={l.id}
              onClick={() => setCurrentLevelIdx(i)}
              className={`w-8 h-8 rounded border-2 flex items-center justify-center font-bold text-sm transition-colors ${
                currentLevelIdx === i 
                  ? 'border-yellow-500 text-yellow-500 bg-stone-800' 
                  : 'border-stone-700 text-stone-500 hover:border-stone-500'
              }`}
            >
              {l.id}
            </button>
          ))}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Board */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Board Container */}
          <div className="relative w-full aspect-[4/3] bg-stone-900 rounded-xl shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] border-8 border-stone-800 overflow-hidden">
            
            {/* Texture Overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-[radial-gradient(circle_at_center,_white_0%,_black_100%)]"></div>

            {/* SVG Lines (Pipes) */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="waterFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0891b2" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
                <style>
                  {`
                    @keyframes flowAnim {
                      from { stroke-dashoffset: 24; }
                      to { stroke-dashoffset: 0; }
                    }
                    .flowing-water {
                      stroke-dasharray: 12;
                      animation: flowAnim 0.8s linear infinite;
                      filter: drop-shadow(0 0 4px #22d3ee);
                    }
                  `}
                </style>
              </defs>
              {level.edges.map(edge => {
                const fromNode = level.nodes.find(n => n.id === edge.from);
                const toNode = level.nodes.find(n => n.id === edge.to);
                const isFlowing = activeEdges.includes(edge.id);
                
                return (
                  <g key={edge.id}>
                    {/* Dark empty pipe groove */}
                    <line 
                      x1={fromNode.x} y1={fromNode.y} 
                      x2={toNode.x} y2={toNode.y} 
                      stroke="#1c1917" 
                      strokeWidth="6" 
                      strokeLinecap="round"
                    />
                    {/* Glowing water fill */}
                    {isFlowing && (
                      <line 
                        x1={fromNode.x} y1={fromNode.y} 
                        x2={toNode.x} y2={toNode.y} 
                        stroke="url(#waterFlow)" 
                        strokeWidth="4" 
                        strokeLinecap="round"
                        className="flowing-water transition-all duration-500"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* HTML Nodes */}
            {level.nodes.map(node => {
              
              // 1. Source Nodes
              if (node.type === 'source') {
                return (
                  <div 
                    key={node.id}
                    className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-stone-700 bg-stone-900 shadow-[0_0_15px_rgba(0,0,0,0.8)] flex items-center justify-center z-10"
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  >
                    <div className="w-8 h-8 rounded-full bg-cyan-600 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{node.value}</span>
                    </div>
                  </div>
                );
              }
              
              // 2. Target Nodes
              if (node.type === 'target') {
                const isReached = flowState === 'success';
                return (
                  <div 
                    key={node.id}
                    className={`absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 rotate-45 border-4 transition-colors duration-1000 z-10 ${isReached ? 'border-cyan-400 bg-cyan-950' : 'border-stone-700 bg-stone-900'} shadow-[0_0_15px_rgba(0,0,0,0.8)] flex items-center justify-center`}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  >
                    <div className="-rotate-45 flex flex-col items-center justify-center">
                      <span className={`text-xs uppercase font-bold tracking-widest ${isReached ? 'text-cyan-300' : 'text-stone-500'}`}>Goal</span>
                      <span className={`text-sm font-bold ${isReached ? 'text-white' : 'text-stone-400'}`}>{node.expectedVal}</span>
                    </div>
                  </div>
                );
              }

              // 3. Slot Nodes (Math / Logic)
              const placedRuneId = placedRunes[node.id];
              const isSelectedTarget = selectedRune !== null && !placedRuneId;
              
              return (
                <div 
                  key={node.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                >
                  {/* Modifer Label for Math slots */}
                  {node.type === 'math_slot' && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-800 border border-stone-600 text-stone-300 text-xs px-2 py-0.5 rounded font-mono shadow-md whitespace-nowrap">
                      Mod: {node.rightVal}
                    </div>
                  )}
                  
                  {/* The Drop Zone */}
                  <div 
                    onClick={() => {
                      if (selectedRune) handlePlaceRune(node.id, selectedRune);
                      else if (placedRuneId) handleRemoveRune(node.id);
                    }}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, node.id)}
                    className={`w-14 h-14 bg-stone-900 border-2 shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] flex items-center justify-center cursor-pointer transition-colors relative
                      ${isSelectedTarget ? 'border-yellow-500 animate-pulse' : 'border-stone-700 hover:border-stone-500'}
                    `}
                  >
                    {!placedRuneId ? (
                      <span className="text-stone-600 text-xs text-center opacity-50 px-1">Drop Rune</span>
                    ) : (
                      <div className="w-full h-full bg-stone-700 shadow-md border-t border-stone-500 flex items-center justify-center text-3xl text-yellow-400 font-serif">
                        {RUNES[placedRuneId].symbol}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Controls & Inventory */}
        <div className="flex flex-col gap-4">
          
          {/* Clue Panel */}
          <div className="bg-stone-800 border border-stone-700 rounded-lg p-5 shadow-lg">
            <h2 className="text-lg text-yellow-500 font-serif mb-2 flex items-center gap-2">
              <Info size={18} /> Ancient Inscription
            </h2>
            <p className="text-stone-300 text-sm leading-relaxed italic">
              "{level.clue}"
            </p>
          </div>

          {/* Rune Inventory */}
          <div className="bg-stone-800 border border-stone-700 rounded-lg p-5 shadow-lg flex-1">
            <h3 className="text-stone-400 text-xs uppercase tracking-widest mb-4">Available Runes</h3>
            <div className="grid grid-cols-3 gap-3">
              {Object.values(RUNES).map(rune => {
                const isSelected = selectedRune === rune.id;
                return (
                  <div 
                    key={rune.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, rune.id)}
                    onClick={() => setSelectedRune(isSelected ? null : rune.id)}
                    className={`aspect-square bg-stone-700 rounded border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg
                      ${isSelected ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'border-stone-600 shadow-md border-b-4 border-b-stone-900'}
                    `}
                  >
                    <span className="text-3xl text-yellow-500 font-serif drop-shadow-md pointer-events-none">{rune.symbol}</span>
                    <span className="text-[10px] text-stone-300 font-medium mt-1 uppercase tracking-wide pointer-events-none">{rune.en}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-stone-500 text-xs mt-4 text-center">Drag a rune, or tap it to select, then tap an empty slot on the tablet.</p>
          </div>

          {/* Action Panel */}
          <div className="bg-stone-800 border border-stone-700 rounded-lg p-4 shadow-lg flex flex-col gap-3">
            <button 
              onClick={testFlow}
              disabled={flowState === 'flowing'}
              className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-3 px-4 rounded shadow-[inset_0_-4px_rgba(0,0,0,0.3)] hover:shadow-[inset_0_-2px_rgba(0,0,0,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Droplets size={20} />
              Release Water
            </button>
            
            <button 
              onClick={() => { setPlacedRunes({}); setFlowState('idle'); }}
              className="w-full bg-stone-700 hover:bg-stone-600 text-stone-200 font-medium py-2 px-4 rounded transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              Reset Board
            </button>
          </div>

        </div>
      </div>

      {/* Success/Fail Modals */}
      {flowState === 'success' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300 px-4">
          <div className="bg-stone-800 border-2 border-yellow-500 p-8 rounded-xl max-w-sm w-full text-center shadow-2xl scale-in-center">
            <CheckCircle2 size={64} className="text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-serif text-yellow-500 mb-2">Mechanism Unlocked</h2>
            <p className="text-stone-300 mb-6">The logic holds true. The ancient waters flow correctly.</p>
            {currentLevelIdx < LEVELS.length - 1 ? (
              <button 
                onClick={() => setCurrentLevelIdx(prev => prev + 1)}
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-stone-900 font-bold py-3 px-4 rounded shadow-lg transition-colors flex items-center justify-center gap-2"
              >
                Proceed Deeper
                <ChevronRight size={20} />
              </button>
            ) : (
              <button 
                onClick={() => { setCurrentLevelIdx(0); setPlacedRunes({}); setFlowState('idle'); }}
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-stone-900 font-bold py-3 px-4 rounded shadow-lg transition-colors flex items-center justify-center gap-2"
              >
                Play Again
                <RotateCcw size={20} />
              </button>
            )}
          </div>
        </div>
      )}

      {flowState === 'fail' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300 px-4">
          <div className="bg-stone-800 border-2 border-red-500 p-8 rounded-xl max-w-sm w-full text-center shadow-2xl scale-in-center">
            <XCircle size={64} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-serif text-red-500 mb-2">Flow Interrupted</h2>
            <p className="text-stone-300 mb-6">The logic is flawed. The waters drain into the abyss. Check the required runes.</p>
            <button 
              onClick={() => setFlowState('idle')}
              className="w-full bg-stone-700 hover:bg-stone-600 text-white font-bold py-3 px-4 rounded shadow-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .scale-in-center {
          animation: scale-in-center 0.3s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
        }
        @keyframes scale-in-center {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}} />
    </div>
  );
}