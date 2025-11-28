import React from 'react';

interface NumberDisplayProps {
  number: number | null;
  isSpinning: boolean;
  isWinner: boolean;
}

export const NumberDisplay: React.FC<NumberDisplayProps> = ({ number, isSpinning, isWinner }) => {
  return (
    <div className="flex items-center justify-center h-96 w-full">
      <div
        className={`
          text-[15rem] font-bold tabular-nums leading-none transition-all duration-300
          ${isWinner ? 'text-accent text-glow-gold scale-110' : 'text-primary text-glow'}
          ${isSpinning ? 'opacity-80 blur-sm' : 'opacity-100 blur-0'}
        `}
      >
        {number !== null ? number : '00'}
      </div>
    </div>
  );
};
