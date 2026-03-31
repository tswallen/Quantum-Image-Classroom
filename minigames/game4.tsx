import React, { useEffect, useRef, useState } from 'react';

type LevelDef = {
  spawn: { x: number; y: number };
  platforms: Array<{ x: number; y: number; w: number; h: number }>;
  equation: { text: string; answer: number };
  pickups: Array<{ x: number; y: number; value: number }>;
  door: { x: number; y: number; w: number; h: number };
};

const levels: LevelDef[] = [
  {
    spawn: { x: 50, y: 420 },
    platforms: [
      { x: 0, y: 470, w: 800, h: 130 },
      { x: 130, y: 370, w: 110, h: 20 },
      { x: 280, y: 310, w: 110, h: 20 },
      { x: 460, y: 270, w: 100, h: 20 },
      { x: 620, y: 330, w: 140, h: 20 }
    ],
    equation: { text: '2 + ? = 7', answer: 5 },
    pickups: [
      { x: 150, y: 340, value: 4 },
      { x: 300, y: 270, value: 5 },
      { x: 640, y: 300, value: 6 }
    ],
    door: { x: 750, y: 390, w: 40, h: 80 }
  },
  {
    spawn: { x: 60, y: 420 },
    platforms: [
      { x: 0, y: 470, w: 800, h: 130 },
      { x: 190, y: 380, w: 90, h: 20 },
      { x: 360, y: 340, w: 90, h: 20 },
      { x: 530, y: 290, w: 90, h: 20 }
    ],
    equation: { text: '5 - ? = 2', answer: 3 },
    pickups: [
      { x: 220, y: 350, value: 2 },
      { x: 380, y: 310, value: 3 },
      { x: 560, y: 260, value: 4 }
    ],
    door: { x: 760, y: 390, w: 40, h: 80 }
  },
  {
    spawn: { x: 40, y: 420 },
    platforms: [
      { x: 0, y: 470, w: 800, h: 130 },
      { x: 140, y: 360, w: 70, h: 20 },
      { x: 260, y: 300, w: 100, h: 20 },
      { x: 440, y: 240, w: 120, h: 20 },
      { x: 620, y: 340, w: 120, h: 20 }
    ],
    equation: { text: '? + 4 = 9', answer: 5 },
    pickups: [
      { x: 170, y: 330, value: 3 },
      { x: 295, y: 270, value: 5 },
      { x: 650, y: 310, value: 7 }
    ],
    door: { x: 760, y: 390, w: 40, h: 80 }
  }
];

function rectHit(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export default function MathJumper({ onComplete }: { onComplete?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [levelIndex, setLevelIndex] = useState(0);
  const [collected, setCollected] = useState<number[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetLevel = levels[levelIndex];
    const player = { x: targetLevel.spawn.x, y: targetLevel.spawn.y, w: 24, h: 34, vx: 0, vy: 0, grounded: false };
    let pickups = targetLevel.pickups.map((p) => ({ ...p, collected: false }));
    let doorOpen = false;
    let running = true;
    const keys = { left: false, right: false, up: false };

    const resize = () => {
      canvas.width = 800;
      canvas.height = 560;
    };

    const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

    const applyPhysics = () => {
      const GRAVITY = 0.8;
      const WALK = 2.6;
      const JUMP = -12;

      if (keys.left) player.vx = -WALK;
      else if (keys.right) player.vx = WALK;
      else player.vx *= 0.85;

      if (keys.up && player.grounded) {
        player.vy = JUMP;
        player.grounded = false;
      }

      player.vy += GRAVITY;
      player.x += player.vx;
      player.y += player.vy;
      player.x = clamp(player.x, 0, canvas.width - player.w);

      player.grounded = false;
      for (const platform of targetLevel.platforms) {
        const pRect = { x: platform.x, y: platform.y, w: platform.w, h: platform.h };
        const nextPos = { x: player.x, y: player.y, w: player.w, h: player.h };

        if (rectHit(nextPos, pRect)) {
          const prevY = player.y - player.vy;
          if (prevY + player.h <= platform.y) {
            player.y = platform.y - player.h;
            player.vy = 0;
            player.grounded = true;
          } else if (player.y <= platform.y + platform.h) {
            player.y = platform.y + platform.h;
            player.vy = 1;
          }
        }
      }

      if (player.y > canvas.height) {
        player.x = targetLevel.spawn.x;
        player.y = targetLevel.spawn.y;
        player.vx = 0;
        player.vy = 0;
      }
    };

    const updateGame = () => {
      if (!running) return;

      applyPhysics();

      for (const item of pickups) {
        if (!item.collected && rectHit({ x: player.x, y: player.y, w: player.w, h: player.h }, { x: item.x - 10, y: item.y - 10, w: 20, h: 20 })) {
          item.collected = true;
          setCollected((prev) => [...prev, item.value]);
          if (item.value === targetLevel.equation.answer) {
            doorOpen = true;
            setStatus('Correct number collected! Reach the door.');
          } else {
            setStatus(`Wrong number (${item.value}), try another.`);
          }
        }
      }

      if (doorOpen && rectHit({ x: player.x, y: player.y, w: player.w, h: player.h }, { x: targetLevel.door.x, y: targetLevel.door.y, w: targetLevel.door.w, h: targetLevel.door.h })) {
        if (levelIndex + 1 < levels.length) {
          setLevelIndex((i) => i + 1);
          setCollected([]);
          setStatus('Great! Next level...');
        } else {
          setStatus('All levels done!');
          onComplete?.();
          running = false;
        }
        return;
      }

      ctx.fillStyle = '#0b1c36';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // draw equation and progress
      ctx.fillStyle = '#fff';
      ctx.font = '18px Inter, sans-serif';
      ctx.fillText(`Level ${levelIndex + 1}/${levels.length}`, 8, 24);
      ctx.fillText(`${targetLevel.equation.text}`, 8, 48);
      ctx.fillText(`Collected: ${collected.join(', ') || '-'}`, 8, 72);
      ctx.fillText(status, 8, 96);

      // draw platforms
      for (const platform of targetLevel.platforms) {
        ctx.fillStyle = '#2c7';
        ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
      }

      // draw pickups
      for (const pickup of pickups) {
        if (!pickup.collected) {
          ctx.fillStyle = pickup.value === targetLevel.equation.answer ? '#ffd700' : '#ff8c00';
          ctx.beginPath();
          ctx.arc(pickup.x, pickup.y, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000';
          ctx.font = 'bold 14px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${pickup.value}`, pickup.x, pickup.y);
        }
      }

      // draw door
      ctx.fillStyle = doorOpen ? '#4ade80' : '#6b7280';
      ctx.fillRect(targetLevel.door.x, targetLevel.door.y, targetLevel.door.w, targetLevel.door.h);
      ctx.fillStyle = '#000';
      ctx.fillText('LOCK', targetLevel.door.x + targetLevel.door.w / 2, targetLevel.door.y + targetLevel.door.h / 2);

      // draw player
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(player.x, player.y, player.w, player.h);

      requestAnimationFrame(updateGame);
    };

    resize();
    updateGame();

    const down = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') keys.up = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') keys.up = false;
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);

    return () => {
      running = false;
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [levelIndex, collected, onComplete, status]);

  return (
    <div className="relative h-screen w-screen bg-sky-900">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute left-4 top-4 text-white p-2 bg-black/30 rounded-md text-sm">
        <div>Arrow keys or A/D to move, W/Up/Space to jump.</div>
        <div className="mt-1">Complete equation by grabbing correct value.</div>
      </div>
    </div>
  );
}
