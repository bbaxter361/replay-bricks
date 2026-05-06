import { useEffect, useRef } from 'react';

const BRICK_COLORS = [
  '#E3000B', // LEGO red
  '#FFD700', // LEGO yellow
  '#0066CC', // LEGO blue
  '#009944', // LEGO green
  '#F5A623', // LEGO orange
  '#8B4513', // LEGO brown
  '#800080', // LEGO purple
  '#E3000B',
  '#FFD700',
  '#0066CC',
];

const BRICK_COUNT = 30; // Reduced slightly because isometric drawing is more complex

// True 3D Isometric Projection
// A real LEGO brick: 1 unit width = 8mm. Height = 9.6mm (1.2 units). Stud diam = 4.8mm (0.6 units), Stud height = 1.7mm (0.2125 units).
function drawIsometricBrick(ctx, screenX, screenY, cols, rows, color, scale, rotation, opacity) {
  const unit = 20 * scale; 
  const h = 1.2 * unit;    
  const studR = 0.3 * unit;
  const studH = 0.2125 * unit;
  
  // Isometric projection function
  const iso = (x, y, z) => {
    return {
      u: (x - y) * 0.866,
      v: (x + y) * 0.5 - z
    };
  };

  const w = cols * unit;
  const d = rows * unit;

  ctx.save();
  ctx.translate(screenX, screenY);
  ctx.rotate(rotation);
  ctx.globalAlpha = opacity;
  
  // Center the brick on its origin so rotation looks natural
  const offset = iso(w/2, d/2, h/2);
  ctx.translate(-offset.u, -offset.v);

  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1 * scale;

  // 1. Right Face (x = w)
  ctx.fillStyle = color;
  ctx.beginPath();
  let p1 = iso(w, 0, 0); ctx.moveTo(p1.u, p1.v);
  let p2 = iso(w, d, 0); ctx.lineTo(p2.u, p2.v);
  let p3 = iso(w, d, h); ctx.lineTo(p3.u, p3.v);
  let p4 = iso(w, 0, h); ctx.lineTo(p4.u, p4.v);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'; // shadow
  ctx.fill();
  ctx.stroke();

  // 2. Left Face (y = d)
  ctx.fillStyle = color;
  ctx.beginPath();
  p1 = iso(0, d, 0); ctx.moveTo(p1.u, p1.v);
  p2 = iso(w, d, 0); ctx.lineTo(p2.u, p2.v);
  p3 = iso(w, d, h); ctx.lineTo(p3.u, p3.v);
  p4 = iso(0, d, h); ctx.lineTo(p4.u, p4.v);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // mid-shadow
  ctx.fill();
  ctx.stroke();

  // 3. Top Face (z = h)
  ctx.fillStyle = color;
  ctx.beginPath();
  p1 = iso(0, 0, h); ctx.moveTo(p1.u, p1.v);
  p2 = iso(w, 0, h); ctx.lineTo(p2.u, p2.v);
  p3 = iso(w, d, h); ctx.lineTo(p3.u, p3.v);
  p4 = iso(0, d, h); ctx.lineTo(p4.u, p4.v);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; // highlight
  ctx.fill();
  ctx.stroke();

  // 4. Studs
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      // Studs are ordered back-to-front so they overlap correctly
      // In this isometric view, higher (c+r) means further front
      const cx = (c + 0.5) * unit;
      const cy = (r + 0.5) * unit;
      
      const cBase = iso(cx, cy, h);
      const cTop = iso(cx, cy, h + studH);
      const rx = studR * 0.866;
      const ry = studR * 0.5;

      // Stud Cylinder Side
      ctx.fillStyle = color;
      ctx.beginPath();
      // Right curve
      ctx.ellipse(cBase.u, cBase.v, rx, ry, 0, 0, Math.PI, false);
      ctx.lineTo(cTop.u - rx, cTop.v);
      ctx.ellipse(cTop.u, cTop.v, rx, ry, 0, Math.PI, 0, true);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fill();
      ctx.stroke();

      // Stud Top Face
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(cTop.u, cTop.v, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Stud Highlight
      const grad = ctx.createRadialGradient(cTop.u - rx*0.3, cTop.v - ry*0.3, 0, cTop.u, cTop.v, rx);
      grad.addColorStop(0, 'rgba(255,255,255,0.4)');
      grad.addColorStop(1, 'rgba(255,255,255,0.0)');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.stroke();

      // LEGO Logo Dimple
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.beginPath();
      ctx.ellipse(cTop.u, cTop.v, rx * 0.4, ry * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

export default function BrickBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    let bricks = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const randomStudConfig = () => {
      const configs = [
        { cols: 1, rows: 1 },   // 1x1
        { cols: 2, rows: 1 },   // 1x2
        { cols: 3, rows: 1 },   // 1x3
        { cols: 4, rows: 1 },   // 1x4
        { cols: 2, rows: 2 },   // 2x2
        { cols: 4, rows: 2 },   // 2x4
        { cols: 1, rows: 2 },   // 2x1 vertical
        { cols: 2, rows: 4 },   // 4x2 vertical
      ];
      return configs[Math.floor(Math.random() * configs.length)];
    };

    const createBricks = () => {
      bricks = [];
      for (let i = 0; i < BRICK_COUNT; i++) {
        const config = randomStudConfig();
        // Increased scale for bigger bricks (2.0 to 5.0)
        const scale = 2.0 + Math.random() * 3.0; 

        bricks.push({
          x: Math.random() * (canvas.width + 200) - 100,
          y: -(Math.random() * canvas.height) - 200,
          cols: config.cols,
          rows: config.rows,
          color: BRICK_COLORS[Math.floor(Math.random() * BRICK_COLORS.length)],
          // Faster fall speed
          speed: 1.5 + Math.random() * 2.5,
          // Slower rotation so the 3D effect is readable
          rotation: (Math.random() - 0.5) * 0.8,
          rotSpeed: (Math.random() - 0.5) * 0.002,
          // Higher opacity
          opacity: 0.1 + Math.random() * 0.15,
          scale: scale,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sort bricks by scale so smaller ones are "behind" larger ones (parallax)
      bricks.sort((a, b) => a.scale - b.scale);

      bricks.forEach((brick) => {
        // Apply parallax speed (bigger = closer = faster)
        brick.y += brick.speed * (brick.scale / 2);
        brick.rotation += brick.rotSpeed;

        if (brick.y > canvas.height + 300) {
          brick.y = -300;
          brick.x = Math.random() * (canvas.width + 200) - 100;
          brick.speed = 1.5 + Math.random() * 2.5;
        }

        drawIsometricBrick(
          ctx,
          brick.x, brick.y,
          brick.cols, brick.rows,
          brick.color,
          brick.scale,
          brick.rotation,
          brick.opacity
        );
      });

      animationId = requestAnimationFrame(animate);
    };

    resize();
    createBricks();
    animate();

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
}
