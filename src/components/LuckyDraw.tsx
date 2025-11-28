'use client';

import React, { useState, useRef, useEffect } from 'react';
import { NumberDisplay } from './NumberDisplay';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Play, Square } from 'lucide-react';
import { playTickSound, playWinSound } from '@/utils/sound';

const MIN_NUMBER = 1;
const MAX_NUMBER = 100;

export const LuckyDraw: React.FC = () => {
    const [currentNumber, setCurrentNumber] = useState<number | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winners, setWinners] = useState<number[]>([]);
    const [targetNumber, setTargetNumber] = useState<number | null>(null);

    const animationRef = useRef<number | null>(null);
    const speedRef = useRef<number>(50); // Interval in ms
    const lastUpdateRef = useRef<number>(0);

    const generateRandomNumber = () => {
        return Math.floor(Math.random() * (MAX_NUMBER - MIN_NUMBER + 1)) + MIN_NUMBER;
    };

    const spin = () => {
        if (isSpinning) return;

        // Check if all numbers are drawn
        if (winners.length >= (MAX_NUMBER - MIN_NUMBER + 1)) {
            alert('All numbers have been drawn!');
            return;
        }

        setIsSpinning(true);
        setTargetNumber(null);
        speedRef.current = 50; // Start fast

        const animate = (time: number) => {
            if (time - lastUpdateRef.current > speedRef.current) {
                setCurrentNumber(generateRandomNumber());
                playTickSound();
                lastUpdateRef.current = time;
            }
            animationRef.current = requestAnimationFrame(animate);
        };
        animationRef.current = requestAnimationFrame(animate);
    };

    const stop = () => {
        if (!isSpinning || targetNumber !== null) return;

        // Determine winner
        let winner: number;
        do {
            winner = generateRandomNumber();
        } while (winners.includes(winner));

        setTargetNumber(winner);

        // Slow down effect
        if (animationRef.current) cancelAnimationFrame(animationRef.current);

        let currentSpeed = 50;
        const maxSpeed = 800; // Slowest speed before stop
        const steps = 15; // Number of steps to slow down
        let stepCount = 0;

        const slowDown = () => {
            setCurrentNumber(generateRandomNumber());
            playTickSound();

            stepCount++;
            currentSpeed *= 1.2; // Exponential slow down

            if (stepCount >= steps || currentSpeed > maxSpeed) {
                // Final stop
                setCurrentNumber(winner);
                setIsSpinning(false);
                setWinners(prev => [winner, ...prev]);
                triggerConfetti();
                playWinSound();
            } else {
                setTimeout(slowDown, currentSpeed);
            }
        };

        slowDown();
    };

    const triggerConfetti = () => {
        const duration = 3000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#00f0ff', '#ff00aa', '#ffd700']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#00f0ff', '#ff00aa', '#ffd700']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    };

    const reset = () => {
        if (confirm('Are you sure you want to reset the history?')) {
            setWinners([]);
            setCurrentNumber(null);
            setIsSpinning(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 relative z-10">
            {/* Header */}
            <div className="absolute top-8 left-8">
                <h1 className="text-3xl font-bold text-white tracking-wider uppercase">
                    <span className="text-primary">Lalasweet</span> <span className="text-secondary">Lucky Draw</span>
                </h1>
            </div>

            {/* History Sidebar */}
            <div className="absolute top-8 right-8 w-64 bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center gap-2 mb-4 text-white/80">
                    <Trophy size={20} className="text-accent" />
                    <h2 className="font-semibold">Winners ({winners.length})</h2>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {winners.map((num, idx) => (
                        <div key={idx} className="bg-white/10 rounded-md p-2 text-center font-mono text-sm text-accent animate-in fade-in zoom-in duration-300">
                            {num}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Stage */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl">
                <NumberDisplay
                    number={currentNumber}
                    isSpinning={isSpinning}
                    isWinner={!isSpinning && targetNumber !== null && currentNumber === targetNumber}
                />

                {/* Controls */}
                <div className="flex gap-6 mt-12">
                    {!isSpinning ? (
                        <button
                            onClick={spin}
                            className="group relative px-12 py-6 bg-primary/20 hover:bg-primary/30 border border-primary/50 rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                            <div className="absolute inset-0 rounded-full blur-md bg-primary/40 group-hover:bg-primary/60 transition-all" />
                            <div className="relative flex items-center gap-3 text-2xl font-bold text-white uppercase tracking-widest">
                                <Play fill="currentColor" /> Spin
                            </div>
                        </button>
                    ) : (
                        <button
                            onClick={stop}
                            className="group relative px-12 py-6 bg-secondary/20 hover:bg-secondary/30 border border-secondary/50 rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                            <div className="absolute inset-0 rounded-full blur-md bg-secondary/40 group-hover:bg-secondary/60 transition-all" />
                            <div className="relative flex items-center gap-3 text-2xl font-bold text-white uppercase tracking-widest">
                                <Square fill="currentColor" /> Stop
                            </div>
                        </button>
                    )}
                </div>
            </div>

            {/* Footer Controls */}
            <div className="absolute bottom-8 right-8">
                <button
                    onClick={reset}
                    className="p-3 text-white/30 hover:text-white/80 transition-colors"
                    title="Reset History"
                >
                    <RefreshCw size={24} />
                </button>
            </div>
        </div>
    );
};
