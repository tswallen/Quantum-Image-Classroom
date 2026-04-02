// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';

const GRAVITY = 0.6;
const FRICTION = 0.8;
const JUMP_POWER = -12;
const SPEED = 5;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const LEVELS = [
  {
    spawn: { x: 50, y: 400 },
    door: { x: 700, y: 440, w: 50, h: 60 },
    equation: { text: '2 + ? = 5', answer: 3 },
    pickups: [
      { x: 300, y: 470, val: 1 },
      { x: 450, y: 470, val: 3 },
      { x: 600, y: 470, val: 4 }
    ],
    platforms: [{ x: 0, y: 500, w: 800, h: 100 }]
  },
  {
    spawn: { x: 50, y: 300 },
    door: { x: 700, y: 440, w: 50, h: 60 },
    equation: { text: '10 - ? = 4', answer: 6 },
    pickups: [
      { x: 250, y: 350, val: 4 },
      { x: 400, y: 200, val: 6 },
      { x: 550, y: 470, val: 5 }
    ],
    platforms: [
      { x: 0, y: 500, w: 800, h: 100 },
      { x: 150, y: 400, w: 150, h: 20 },
      { x: 350, y: 280, w: 100, h: 20 }
    ]
  },
  {
    spawn: { x: 50, y: 250 },
    door: { x: 700, y: 290, w: 50, h: 60 },
    equation: { text: '8 + ? = 15', answer: 7 },
    pickups: [
      { x: 250, y: 210, val: 6 },
      { x: 410, y: 320, val: 7 },
      { x: 570, y: 210, val: 9 }
    ],
    platforms: [
      { x: 0, y: 350, w: 150, h: 250 },
      { x: 220, y: 250, w: 60, h: 20 },
      { x: 220, y: 450, w: 60, h: 20 },
      { x: 330, y: 350, w: 160, h: 250 },
      { x: 540, y: 250, w: 60, h: 20 },
      { x: 540, y: 450, w: 60, h: 20 },
      { x: 610, y: 350, w: 190, h: 250 }
    ]
  },
  {
    spawn: { x: 50, y: 100 },
    door: { x: 50, y: 440, w: 50, h: 60 },
    equation: { text: '20 - ? = 11', answer: 9 },
    pickups: [
      { x: 700, y: 100, val: 9 },
      { x: 400, y: 300, val: 8 },
      { x: 700, y: 470, val: 11 }
    ],
    platforms: [
      { x: 0, y: 150, w: 150, h: 20 },
      { x: 250, y: 220, w: 100, h: 20 },
      { x: 450, y: 150, w: 100, h: 20 },
      { x: 650, y: 150, w: 150, h: 20 },
      { x: 350, y: 350, w: 100, h: 20 },
      { x: 0, y: 500, w: 800, h: 100 }
    ]
  },
  {
    spawn: { x: 380, y: 450 },
    door: { x: 375, y: 40, w: 50, h: 60 },
    equation: { text: '? + 13 = 21', answer: 8 },
    pickups: [
      { x: 100, y: 350, val: 6 },
      { x: 700, y: 350, val: 7 },
      { x: 100, y: 150, val: 8 },
      { x: 700, y: 150, val: 9 }
    ],
    platforms: [
      { x: 300, y: 500, w: 200, h: 100 },
      { x: 150, y: 400, w: 80, h: 20 },
      { x: 570, y: 400, w: 80, h: 20 },
      { x: 50, y: 280, w: 80, h: 20 },
      { x: 670, y: 280, w: 80, h: 20 },
      { x: 150, y: 160, w: 80, h: 20 },
      { x: 570, y: 160, w: 80, h: 20 },
      { x: 350, y: 100, w: 100, h: 20 }
    ]
  }
];

const initialPlayer = { x: 0, y: 0, w: 32, h: 32, vx: 0, vy: 0, grounded: false, color: '#FFA500' };

const rectIntersect = (r1, r2) =>
  r1.x < r2.x + (r2.w || r2.width) &&
  r1.x + r1.w > r2.x &&
  r1.y < r2.y + (r2.h || r2.height) &&
  r1.y + r1.h > r2.y;

const circleRectIntersect = (circle, rect) => {
  let testX = circle.x;
  let testY = circle.y;

  if (circle.x < rect.x) testX = rect.x;
  else if (circle.x > rect.x + rect.w) testX = rect.x + rect.w;

  if (circle.y < rect.y) testY = rect.y;
  else if (circle.y > rect.y + rect.h) testY = rect.y + rect.h;

  const distX = circle.x - testX;
  const distY = circle.y - testY;
  return Math.sqrt(distX * distX + distY * distY) <= circle.r;
};

export default function MathJumper({ onComplete }: { onComplete?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number>(0);
  const messageTimeoutRef = useRef<number | null>(null);

  const playerRef = useRef({ ...initialPlayer });
  const platformsRef = useRef<any[]>([]);
  const pickupsRef = useRef<any[]>([]);
  const doorRef = useRef<any>(null);
  const equationRef = useRef<any>({ text: '', answer: 0 });
  const doorUnlockedRef = useRef(false);
  const keysRef = useRef({ left: false, right: false, up: false });

  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'END'>('START');
  const [levelText, setLevelText] = useState('Level 1');
  const [equationText, setEquationText] = useState('');
  const [message, setMessage] = useState<{ text: string; isSuccess: boolean; visible: boolean }>({ text: 'Ready?', isSuccess: true, visible: false });

  const loadLevel = (index: number) => {
    if (index >= LEVELS.length) {
      setGameState('END');
      setMessage({ text: 'You completed Math Jumper!', isSuccess: true, visible: true });
      onComplete?.();
      return;
    }

    const level = LEVELS[index];

    playerRef.current = { ...initialPlayer, x: level.spawn.x, y: level.spawn.y };
    platformsRef.current = JSON.parse(JSON.stringify(level.platforms));
    pickupsRef.current = JSON.parse(JSON.stringify(level.pickups)).map((p: any) => ({ ...p, r: 18 }));
    doorRef.current = { ...level.door };
    equationRef.current = { ...level.equation };
    doorUnlockedRef. current = false;

    setCurrentLevelIdx(index);
    setLevelText(`Level ${index + 1}`);
    setEquationText(level.equation.text);
  };

  const showMessage = (text: string, isSuccess: boolean) => {
    setMessage({ text, isSuccess, visible: true });
    if (messageTimeoutRef.current) {
      window.clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = window.setTimeout(() => {
      setMessage((m) => ({ ...m, visible: false }));
      messageTimeoutRef.current = null;
    }, 1500);
  };

  const startGame = () => {
    setGameState('PLAYING');
    loadLevel(0);
  };

  const resetGame = () => {
    startGame();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysRef.current.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keysRef.current.right = true;
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') keysRef.current.up = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysRef.current.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keysRef.current.right = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') keysRef.current.up = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const bindTouch = (id: string, key: 'left' | 'right' | 'up') => {
      const btn = document.getElementById(id);
      if (!btn) return () => {};
      const onTouchStart = (e: TouchEvent) => { e.preventDefault(); keysRef.current[key] = true; };
      const onTouchEnd = (e: TouchEvent) => { e.preventDefault(); keysRef.current[key] = false; };
      btn.addEventListener('touchstart', onTouchStart, { passive: false });
      btn.addEventListener('touchend', onTouchEnd, { passive: false });
      return () => {
        btn.removeEventListener('touchstart', onTouchStart);
        btn.removeEventListener('touchend', onTouchEnd);
      };
    };

    const unbindLeft = bindTouch('btn-left', 'left');
    const unbindRight = bindTouch('btn-right', 'right');
    const unbindJump = bindTouch('btn-jump', 'up');

    return () => {
      unbindLeft();
      unbindRight();
      unbindJump();
    };
  }, [gameState]);

  useEffect(() => {
    const update = () => {
      if (gameState !== 'PLAYING') return;

      const player = playerRef.current;
      const platforms = platformsRef.current;
      const pickups = pickupsRef.current;
      const door = doorRef.current;

      if (keysRef.current.left) player.vx -= 1.5;
      if (keysRef.current.right) player.vx += 1.5;

      player.vx *= FRICTION;
      player.vx = Math.max(-SPEED, Math.min(SPEED, player.vx));
      player.x += player.vx;

      for (const p of platforms) {
        if (rectIntersect(player, p)) {
          if (player.vx > 0) { player.x = p.x - player.w; player.vx = 0; }
          else if (player.vx < 0) { player.x = p.x + p.w; player.vx = 0; }
        }
      }

      if (player.x < 0) { player.x = 0; player.vx = 0; }
      if (player.x + player.w > CANVAS_WIDTH) { player.x = CANVAS_WIDTH - player.w; player.vx = 0; }

      player.vy += GRAVITY;
      if (keysRef.current.up && player.grounded) { player.vy = JUMP_POWER; player.grounded = false; }
      player.y += player.vy;
      player.grounded = false;

      for (const p of platforms) {
        if (rectIntersect(player, p)) {
          if (player.vy > 0) { player.y = p.y - player.h; player.vy = 0; player.grounded = true; }
          else if (player.vy < 0) { player.y = p.y + p.h; player.vy = 0; }
        }
      }

      if (player.y > CANVAS_HEIGHT + 100) {
        showMessage('Oh no! Try again.', false);
        loadLevel(currentLevelIdx);
        return;
      }

      for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        if (circleRectIntersect(p, player)) {
          if (p.val === equationRef.current.answer) {
            doorUnlockedRef.current = true;
            setEquationText(equationRef.current.text.replace('?', p.val.toString()));
            showMessage('CORRECT!', true);
          } else {
            showMessage('INCORRECT! Resetting...', false);
            window.setTimeout(() => loadLevel(currentLevelIdx), 500);
          }
          pickups.splice(i, 1);
        }
      }

      if (doorUnlockedRef.current && rectIntersect(player, door)) {
        const nextIndex = currentLevelIdx + 1;
        if (nextIndex >= LEVELS.length) {
          setGameState('END');
          setMessage({ text: 'You Win!', isSuccess: true, visible: true });
          onComplete?.();
          return;
        }
        loadLevel(nextIndex);
      }
    };

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#2d3748';
      for (const p of platformsRef.current) {
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(p.x, p.y, p.w, Math.min(10, p.h));
        ctx.fillStyle = '#2d3748';
      }

      const door = doorRef.current;
      if (door) {
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(door.x - 5, door.y - 5, door.w + 10, door.h + 5);
        ctx.fillStyle = doorUnlockedRef.current ? '#86efac' : '#fca5a5';
        ctx.fillRect(door.x, door.y, door.w, door.h);
        ctx.fillStyle = doorUnlockedRef.current ? '#16a34a' : '#dc2626';
        if (doorUnlockedRef.current) {
          ctx.beginPath();
          ctx.arc(door.x + 10, door.y + door.h / 2, 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(door.x + door.w / 2, door.y + door.h / 2, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(door.x + door.w / 2 - 4, door.y + door.h / 2, 8, 12);
        }
      }

      const now = Date.now();
      for (const p of pickupsRef.current) {
        const bobbing = Math.sin(now / 200 + p.x) * 5;
        const drawY = p.y + bobbing;
        const gradient = ctx.createRadialGradient(p.x, drawY, 0, p.x, drawY, p.r * 1.5);
        gradient.addColorStop(0, 'rgba(250, 204, 21, 0.8)');
        gradient.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, drawY, p.r * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(p.x, drawY, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ca8a04';
        ctx.stroke();

        ctx.fillStyle = '#713f12';
        ctx.font = 'bold 20px "Fredoka One", cursive';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.val.toString(), p.x, drawY + 2);
      }

      const player = playerRef.current;
      ctx.fillStyle = player.color;
      const radius = 8;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(player.x, player.y, player.w, player.h, radius);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(player.x + radius, player.y);
        ctx.lineTo(player.x + player.w - radius, player.y);
        ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + radius);
        ctx.lineTo(player.x + player.w, player.y + player.h - radius);
        ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - radius, player.y + player.h);
        ctx.lineTo(player.x + radius, player.y + player.h);
        ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - radius);
        ctx.lineTo(player.x, player.y + radius);
        ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = 'white';
      const faceOffset = (player.vx / SPEED) * 4;
      ctx.fillRect(player.x + 8 + faceOffset, player.y + 8, 6, 8);
      ctx.fillRect(player.x + 18 + faceOffset, player.y + 8, 6, 8);
      ctx.fillStyle = 'black';
      ctx.fillRect(player.x + 10 + faceOffset, player.y + 10, 4, 4);
      ctx.fillRect(player.x + 20 + faceOffset, player.y + 10, 4, 4);
    };

    const frame = () => {
      update();
      draw();
      requestRef.current = window.requestAnimationFrame(frame);
    };

    requestRef.current = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(requestRef.current);
  }, [gameState, currentLevelIdx]);

  useEffect(() => { loadLevel(0); }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden text-white">
      <style>{`#game-container{position:relative;width:100%;max-width:900px;aspect-ratio:4/3;background:#87CEEB;box-shadow:0 10px 30px rgba(0,0,0,0.5);border-radius:12px;overflow:hidden}canvas{display:block;width:100%;height:100%;border-radius:12px}#ui-layer{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;display:flex;flex-direction:column;justify-content:space-between;padding:20px;box-sizing:border-box}.hud-header{display:flex;justify-content:space-between;align-items:flex-start}.equation-box{background:rgba(255,255,255,0.9);padding:10px 25px;border-radius:30px;font-family:'Fredoka One',cursive;font-size:28px;color:#2d3748;box-shadow:0 4px 6px rgba(0,0,0,0.1);border:4px solid #4a5568;text-align:center}.level-text{font-family:'Fredoka One',cursive;font-size:24px;color:white;text-shadow:2px 2px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000}#message-box{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Fredoka One',cursive;font-size:48px;text-align:center;opacity:0;transition:opacity 0.3s ease-in-out;text-shadow:3px 3px 0 #000;pointer-events:none}.msg-success{color:#4ade80}.msg-error{color:#f87171}#start-screen,#end-screen{position:absolute;inset:0;background:rgba(0,0,0,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;z-index:50;pointer-events:all}.title{font-family:'Fredoka One',cursive;font-size:56px;margin-bottom:20px;color:#fbbf24;text-shadow:0 4px 0 #b45309;text-align:center}.btn-primary{background:#3b82f6;color:white;font-family:'Fredoka One',cursive;font-size:24px;padding:12px 32px;border-radius:999px;border:4px solid #1d4ed8;cursor:pointer;transition:transform 0.1s,filter 0.1s}.btn-primary:hover{filter:brightness(1.1)}.btn-primary:active{transform:scale(0.95)}#mobile-controls{display:none;width:100%;max-width:900px;justify-content:space-between;padding:15px 20px;box-sizing:border-box;margin-top:10px}.control-btn{background:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.5);border-radius:50%;width:60px;height:60px;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;user-select:none;-webkit-tap-highlight-color:transparent}.control-btn:active{background:rgba(255,255,255,0.4)}@media (max-width:768px){#mobile-controls{display:flex}.equation-box{font-size:20px;padding:8px 16px}.level-text{font-size:18px}}`}</style>
      <div id="game-container">
        <canvas id="gameCanvas" ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
        <div id="ui-layer">
          <div className="hud-header">
            <div className="level-text">{levelText}</div>
            <div className="equation-box">{equationText}</div>
            <div style={{ width: 70 }} />
          </div>
        </div>
        <div id="message-box" className={message.isSuccess ? 'msg-success' : 'msg-error'} style={{ opacity: message.visible ? 1 : 0 }}>{message.text}</div>
        {gameState === 'START' && ( <div id="start-screen"><h1 className="title">Math Jumper</h1><p className="text-xl mb-8 text-center max-w-md">Find the correct number to solve the equation and unlock the door. Use Arrow Keys or On-Screen buttons to move.</p><button className="btn-primary" type="button" onClick={startGame}>PLAY</button></div> )}
        {gameState === 'END' && ( <div id="end-screen"><h1 className="title" style={{ color: '#4ade80' }}>You Win!</h1><p className="text-xl mb-8">You're a math genius!</p><button className="btn-primary" type="button" onClick={resetGame}>PLAY AGAIN</button></div> )}
      </div>
      <div id="mobile-controls">
        <div className="d-pad"><div className="control-btn" id="btn-left">◀</div><div className="control-btn" id="btn-right">▶</div></div>
        <div className="control-btn" id="btn-jump">▲</div>
      </div>
    </div>
  );
}
