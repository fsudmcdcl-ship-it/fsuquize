import React, { useState, useEffect, useRef } from 'react';
import type { WinnerEntry, TieBreak } from '../types/quiz';
import { toNepaliDigits } from '../lib/nepaliUtils';
import confetti from 'canvas-confetti';

interface SpinningWheelProps {
  quizId: string;
  tiedScore: number;
  participants: WinnerEntry[];
  onWinnerSelected: (tieBreak: TieBreak) => void;
  onClose: () => void;
}

export const SpinningWheel: React.FC<SpinningWheelProps> = ({
  quizId,
  tiedScore,
  participants,
  onWinnerSelected,
  onClose,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<WinnerEntry | null>(null);
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const colors = [
    '#dc2626', // Red
    '#2563eb', // Blue
    '#16a34a', // Green
    '#d97706', // Amber
    '#7c3aed', // Purple
    '#0891b2', // Cyan
    '#ea580c', // Orange
    '#db2777', // Pink
  ];

  // Draw the wheel on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || participants.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 16;
    const sliceAngle = (2 * Math.PI) / participants.length;

    ctx.clearRect(0, 0, size, size);

    participants.forEach((p, i) => {
      const angle = i * sliceAngle;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px Mukta, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(p.name, radius - 20, 5);
      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(center, center, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#f8fafc';
    ctx.stroke();

    // Center star / text
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FSU', center, center);
  }, [participants]);

  const handleSpin = () => {
    if (isSpinning || participants.length === 0) return;
    setIsSpinning(true);
    setSelectedWinner(null);

    // Pick random participant using secure crypto where available
    const randomIndex = Math.floor(Math.random() * participants.length);
    const winner = participants[randomIndex];

    const sliceDegree = 360 / participants.length;
    // Calculate angle to land on pointer (pointer is at top 270 deg or right 0 deg)
    const targetDegree = 360 - (randomIndex * sliceDegree + sliceDegree / 2) + 270;
    const fullSpins = 5 + Math.floor(Math.random() * 3); // 5 to 7 full rounds
    const finalRotation = fullSpins * 360 + (targetDegree % 360);

    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setSelectedWinner(winner);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore if not loaded
      }

      const tieBreakRecord: TieBreak = {
        tieBreakId: `tb_${Date.now()}`,
        quizId,
        timestamp: new Date().toISOString(),
        tiedScore,
        participants,
        winnerStudentId: winner.studentId,
        winnerName: winner.name,
        method: 'wheel_draw',
      };

      onWinnerSelected(tieBreakRecord);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-5 text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-xl flex items-center gap-2">
              <span>🎯</span>
              <span>बराबर अंक भएका सहभागीहरू (टाई-ब्रेक)</span>
            </h3>
            <p className="text-xs text-rose-100 mt-1">
              समान अंक ({toNepaliDigits(tiedScore)}/१०) र समान समय भएका सहभागीहरू बीच पारदर्शी लक्की ड्र
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          {/* Wheel Container */}
          <div className="relative mb-6">
            {/* Top pointer needle */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-500 drop-shadow-md"></div>

            <div
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'transform 4s cubic-bezier(0.15, 0.9, 0.25, 1)' : 'none',
              }}
              className="rounded-full shadow-lg"
            >
              <canvas ref={canvasRef} width={300} height={300} className="rounded-full" />
            </div>
          </div>

          {/* Winner announcement or participant list */}
          {selectedWinner ? (
            <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4 text-center mb-5 animate-in bounce-in">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1">
                🎉 लक्की ड्र विजेता घोषित
              </span>
              <h4 className="text-xl font-bold text-slate-900">{selectedWinner.name}</h4>
              <p className="text-sm text-slate-600">
                रोल नम्बर: {toNepaliDigits(selectedWinner.rollNo)} | कक्षा: {selectedWinner.class} ({selectedWinner.semester} सेमेस्टर)
              </p>
              <p className="text-xs text-emerald-600 font-semibold mt-2">
                ✓ टाई-ब्रेक परिणाम सुरक्षित गरियो
              </p>
            </div>
          ) : (
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5">
              <h5 className="text-xs font-bold text-slate-600 mb-2">सहभागीहरू ({toNepaliDigits(participants.length)} जना):</h5>
              <div className="flex flex-wrap gap-2">
                {participants.map((p, idx) => (
                  <span
                    key={p.studentId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-xs"
                    style={{ backgroundColor: colors[idx % colors.length] }}
                  >
                    {p.name} (रोल {toNepaliDigits(p.rollNo)})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 w-full">
            <button
              onClick={handleSpin}
              disabled={isSpinning || !!selectedWinner}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSpinning ? (
                <>
                  <span className="animate-spin text-lg">⏳</span>
                  <span>घुम्दै छ...</span>
                </>
              ) : selectedWinner ? (
                <span>ड्र सम्पन्न भयो</span>
              ) : (
                <>
                  <span>🎡</span>
                  <span>ह्विल घुमाउनुहोस् (Spin Wheel)</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
            >
              बन्द गर्नुहोस्
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
