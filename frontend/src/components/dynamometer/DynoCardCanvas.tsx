import React, { useEffect, useRef } from 'react';
import { DynamometerCardData } from '../../types';

interface DynoCardCanvasProps {
  cardData: DynamometerCardData;
  rodRatingLbs?: number;
  width?: number;
  height?: number;
  title?: string;
}

export const DynoCardCanvas: React.FC<DynoCardCanvasProps> = ({
  cardData,
  rodRatingLbs = 28000,
  width = 650,
  height = 420,
  title,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI Support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = '#070d18';
    ctx.fillRect(0, 0, width, height);

    const padLeft = 70;
    const padRight = 30;
    const padTop = 40;
    const padBottom = 50;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    // Compute coordinate extents
    const surfPos = cardData.surface_position_in || [];
    const surfLoad = cardData.surface_load_lbs || [];
    const pumpPos = cardData.pump_position_in || [];
    const pumpLoad = cardData.pump_load_lbs || [];

    const maxStroke = Math.max(120, ...(surfPos.length ? surfPos : [100]));
    const minLoad = Math.min(-2000, ...(surfLoad.length ? surfLoad : [0]), ...(pumpLoad.length ? pumpLoad : [0]));
    const maxLoad = Math.max(rodRatingLbs * 1.05, ...(surfLoad.length ? surfLoad : [25000]));

    // Coordinate mapping functions
    const mapX = (pos: number) => padLeft + (pos / maxStroke) * plotW;
    const mapY = (load: number) => padTop + plotH - ((load - minLoad) / (maxLoad - minLoad)) * plotH;

    // 1. Draw Grid Lines
    ctx.strokeStyle = '#162544';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    // Vertical grid (Stroke Position)
    const xSteps = 5;
    for (let i = 0; i <= xSteps; i++) {
      const strokeVal = (maxStroke / xSteps) * i;
      const x = mapX(strokeVal);
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, padTop + plotH);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(strokeVal)}"`, x, padTop + plotH + 18);
    }

    // Horizontal grid (Load in lbs)
    const ySteps = 6;
    for (let i = 0; i <= ySteps; i++) {
      const loadVal = minLoad + ((maxLoad - minLoad) / ySteps) * i;
      const y = mapY(loadVal);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + plotW, y);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(loadVal / 1000)}k`, padLeft - 10, y + 3);
    }

    // 2. Draw Zero Load Baseline & Rod Rating Line
    const zeroY = mapY(0);
    ctx.strokeStyle = '#475569';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padLeft, zeroY);
    ctx.lineTo(padLeft + plotW, zeroY);
    ctx.stroke();

    // 90% Rod Rating Limit (Critical boundary)
    const rating90 = rodRatingLbs * 0.9;
    const ratingY = mapY(rating90);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(padLeft, ratingY);
    ctx.lineTo(padLeft + plotW, ratingY);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`90% Rod Limit (${Math.round(rating90 / 1000)}k lbs)`, padLeft + plotW - 5, ratingY - 4);

    // 3. Draw Downhole Pump Dynamometer Card (Green/Cyan)
    if (pumpPos.length && pumpLoad.length) {
      ctx.setLineDash([]);
      ctx.strokeStyle = '#10b981';
      ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(mapX(pumpPos[0]), mapY(pumpLoad[0]));
      for (let i = 1; i < pumpPos.length; i++) {
        ctx.lineTo(mapX(pumpPos[i]), mapY(pumpLoad[i]));
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 4. Draw Surface Polished Rod Dynamometer Card (Blue/Cyan)
    if (surfPos.length && surfLoad.length) {
      ctx.setLineDash([]);
      ctx.strokeStyle = '#06b6d4';
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(mapX(surfPos[0]), mapY(surfLoad[0]));
      for (let i = 1; i < surfPos.length; i++) {
        ctx.lineTo(mapX(surfPos[i]), mapY(surfLoad[i]));
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 5. Axes Titles
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Polished Rod / Pump Stroke Position (Inches)', padLeft + plotW / 2, height - 12);

    ctx.save();
    ctx.translate(16, padTop + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Rod Load (lbs)', 0, 0);
    ctx.restore();

    // 6. Header Title inside canvas
    if (title) {
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, padLeft, padTop - 15);
    }
  }, [cardData, rodRatingLbs, width, height, title]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative border border-[#1f345e] rounded-xl overflow-hidden shadow-2xl bg-[#070d18]">
        <canvas ref={canvasRef} style={{ width: `${width}px`, height: `${height}px` }} />
      </div>

      {/* Legend & Summary */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-[650px] mt-3 px-2 text-xs font-mono text-slate-300">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400"></span>
            <span>Surface Dyno Card</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-400"></span>
            <span>Downhole Pump Card</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-slate-400">
          <span>PPRL: <strong className="text-white">{cardData.pprl_lbs?.toLocaleString() || '21,500'} lbs</strong></span>
          <span>MPRL: <strong className="text-white">{cardData.mprl_lbs?.toLocaleString() || '6,500'} lbs</strong></span>
        </div>
      </div>
    </div>
  );
};
