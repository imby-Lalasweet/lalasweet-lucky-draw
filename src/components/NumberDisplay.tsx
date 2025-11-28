import React from 'react';

interface NumberDisplayProps {
  number: number | null;
  isSpinning: boolean;
  isWinner: boolean;
  animationType?: string;
}

const animationClasses = [
  'animate-spin-3d',
  'animate-pulse-scale',
  'animate-glitch',
  'animate-bounce-intense',
  'animate-flip',
  'animate-rotate-shake',
  'animate-wave',
  'animate-zoom-flash',
  'animate-spiral',
  'animate-shake-intense'
];

export const NumberDisplay: React.FC<NumberDisplayProps> = ({
  number,
  isSpinning,
  isWinner,
  animationType = 'animate-pulse-scale'
}) => {
  return (
    <div className="flex items-center justify-center h-96 w-full">
      <div
        className={`
          text-[15rem] font-bold tabular-nums leading-none transition-all duration-300
          ${isWinner ? 'text-accent text-glow-gold scale-110' : 'text-primary text-glow animate-neon-pulse'}
          ${isSpinning ? `opacity-80 ${animationType}` : 'opacity-100'}
        `}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {number !== null ? number : '00'}
      </div>
    </div>
  );
};

export { animationClasses };
