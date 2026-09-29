import { useEffect, useRef } from 'react';

/**
 * High-performance, lightweight 3D Background Canvas.
 * Renders an interactive, perspective 3D particle constellation & wireframe data grid
 * with smooth camera rotation and subtle mouse parallax.
 */
export default function Background3D({ enabled = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Mouse tracking for parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e) => {
      targetMouseX = (e.clientX - width / 2) * 0.0008;
      targetMouseY = (e.clientY - height / 2) * 0.0008;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 3D Nodes Setup (Geometric floating data constellation)
    const NODE_COUNT = 48;
    const nodes = [];
    const FIELD_SIZE = 700;

    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: (Math.random() - 0.5) * FIELD_SIZE * 2,
        y: (Math.random() - 0.5) * FIELD_SIZE * 1.5,
        z: (Math.random() - 0.5) * FIELD_SIZE * 2,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        vz: (Math.random() - 0.5) * 0.25,
        baseSize: Math.random() * 2 + 1,
      });
    }

    // 3D Wireframe Cube vertices
    const cubeVertices = [
      { x: -120, y: -120, z: -120 },
      { x: 120, y: -120, z: -120 },
      { x: 120, y: 120, z: -120 },
      { x: -120, y: 120, z: -120 },
      { x: -120, y: -120, z: 120 },
      { x: 120, y: -120, z: 120 },
      { x: 120, y: 120, z: 120 },
      { x: -120, y: 120, z: 120 },
    ];

    const cubeEdges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ];

    let angleX = 0;
    let angleY = 0;
    const CAMERA_DISTANCE = 650;

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      angleX += 0.0015;
      angleY += 0.0025;

      const cosY = Math.cos(angleY + mouseX);
      const sinY = Math.sin(angleY + mouseX);
      const cosX = Math.cos(angleX + mouseY);
      const sinX = Math.sin(angleX + mouseY);

      // 1. Draw 3D Perspective Wireframe Horizon Grid at bottom
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;

      const gridY = 240;
      const gridSize = 1600;
      const gridStep = 100;

      for (let x = -gridSize; x <= gridSize; x += gridStep) {
        // Line from z = 200 to z = 1400
        const z1 = 200;
        const z2 = 1400;

        const scale1 = CAMERA_DISTANCE / (CAMERA_DISTANCE + z1);
        const scale2 = CAMERA_DISTANCE / (CAMERA_DISTANCE + z2);

        const px1 = width / 2 + (x - mouseX * 400) * scale1;
        const py1 = height / 2 + (gridY - mouseY * 300) * scale1;

        const px2 = width / 2 + (x - mouseX * 400) * scale2;
        const py2 = height / 2 + (gridY - mouseY * 300) * scale2;

        ctx.moveTo(px1, py1);
        ctx.lineTo(px2, py2);
      }

      for (let z = 200; z <= 1400; z += 120) {
        const scale = CAMERA_DISTANCE / (CAMERA_DISTANCE + z);
        const px1 = width / 2 + (-gridSize - mouseX * 400) * scale;
        const px2 = width / 2 + (gridSize - mouseX * 400) * scale;
        const py = height / 2 + (gridY - mouseY * 300) * scale;

        ctx.moveTo(px1, py);
        ctx.lineTo(px2, py);
      }
      ctx.stroke();

      // 2. Rotate & Project 3D Nodes
      const projectedNodes = [];

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // Animate positions
        n.x += n.vx;
        n.y += n.vy;
        n.z += n.vz;

        if (n.x < -FIELD_SIZE) n.x = FIELD_SIZE;
        if (n.x > FIELD_SIZE) n.x = -FIELD_SIZE;
        if (n.y < -FIELD_SIZE * 0.7) n.y = FIELD_SIZE * 0.7;
        if (n.y > FIELD_SIZE * 0.7) n.y = -FIELD_SIZE * 0.7;
        if (n.z < -FIELD_SIZE) n.z = FIELD_SIZE;
        if (n.z > FIELD_SIZE) n.z = -FIELD_SIZE;

        // 3D rotation
        let x1 = n.x * cosY - n.z * sinY;
        let z1 = n.z * cosY + n.x * sinY;
        let y1 = n.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + n.y * sinX + 500; // translate forward

        if (z2 > 10) {
          const scale = CAMERA_DISTANCE / z2;
          const px = width / 2 + x1 * scale;
          const py = height / 2 + y1 * scale;
          const alpha = Math.min(Math.max((1 - z2 / 1200) * 0.45, 0.05), 0.6);

          projectedNodes.push({ px, py, z: z2, alpha, size: n.baseSize * scale });

          // Render node point
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.arc(px, py, Math.max(n.baseSize * scale * 0.8, 1), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Connect close nodes with 3D hairline links
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 0.75;

      for (let i = 0; i < projectedNodes.length; i++) {
        for (let j = i + 1; j < projectedNodes.length; j++) {
          const p1 = projectedNodes[i];
          const p2 = projectedNodes[j];
          const distSq = (p1.px - p2.px) ** 2 + (p1.py - p2.py) ** 2;

          if (distSq < 13000) {
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
          }
        }
      }
      ctx.stroke();

      // 4. Rotating 3D Geometric Floating Cube (Top Right Ambient Accent)
      const cubeCenter = { x: width * 0.35, y: -height * 0.15, z: 600 };
      const projectedCube = cubeVertices.map((v) => {
        let x1 = v.x * cosY - v.z * sinY;
        let z1 = v.z * cosY + v.x * sinY;
        let y1 = v.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + v.y * sinX + cubeCenter.z;

        const scale = CAMERA_DISTANCE / z2;
        return {
          px: width / 2 + (x1 + cubeCenter.x) * scale,
          py: height / 2 + (y1 + cubeCenter.y) * scale,
        };
      });

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;

      cubeEdges.forEach(([start, end]) => {
        const p1 = projectedCube[start];
        const p2 = projectedCube[end];
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
      });
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
    />
  );
}
