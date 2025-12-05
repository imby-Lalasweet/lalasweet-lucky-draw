'use client';

import React, { useState, useRef, useEffect } from 'react';
import { NumberDisplay, animationClasses } from './NumberDisplay';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Play, Square } from 'lucide-react';
import { playClickSound, playBGM, stopBGM, playStopSound, initAudio } from '@/utils/sound';

const MIN_NUMBER = 1;
const MAX_NUMBER = 100;

export const LuckyDraw: React.FC = () => {
    const [currentNumber, setCurrentNumber] = useState<number | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winners, setWinners] = useState<number[]>([]);
    const [targetNumber, setTargetNumber] = useState<number | null>(null);
    const [currentAnimation, setCurrentAnimation] = useState<string>('animate-pulse-scale');
    const [screenShake, setScreenShake] = useState(false);

    const animationRef = useRef<number | null>(null);
    const speedRef = useRef<number>(50); // Interval in ms
    const lastUpdateRef = useRef<number>(0);

    const generateRandomNumber = () => {
        return Math.floor(Math.random() * (MAX_NUMBER - MIN_NUMBER + 1)) + MIN_NUMBER;
    };

    const getRandomAnimation = () => {
        return animationClasses[Math.floor(Math.random() * animationClasses.length)];
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
        setScreenShake(true);
        speedRef.current = 30; // Start faster

        playBGM();

        // Pick a random animation for this spin
        setCurrentAnimation(getRandomAnimation());

        const animate = (time: number) => {
            if (time - lastUpdateRef.current > speedRef.current) {
                setCurrentNumber(generateRandomNumber());
                lastUpdateRef.current = time;

                // Change animation occasionally for variety
                if (Math.random() < 0.1) {
                    setCurrentAnimation(getRandomAnimation());
                }
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

        // Stop BGM immediately
        stopBGM();



        // Slow down effect
        if (animationRef.current) cancelAnimationFrame(animationRef.current);

        let currentSpeed = 50;
        const maxSpeed = 800; // Longer duration
        const steps = 18; // Increased for 2x duration
        let stepCount = 0;

        const slowDown = () => {
            setCurrentNumber(generateRandomNumber());

            stepCount++;
            currentSpeed *= 1.27; // Slower increase for longer tension

            // Change animation as we slow down
            if (stepCount % 3 === 0) {
                setCurrentAnimation(getRandomAnimation());
            }

            if (stepCount >= steps || currentSpeed > maxSpeed) {
                // Final stop
                setCurrentNumber(winner);
                setIsSpinning(false);
                setScreenShake(false);
                setWinners(prev => [winner, ...prev]);
                triggerConfetti();
                playStopSound();
            } else {
                setTimeout(slowDown, currentSpeed);
            }
        };

        slowDown();
    };

    const triggerConfetti = () => {
        const duration = 4000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 7,
                angle: 60,
                spread: 70,
                origin: { x: 0 },
                colors: ['#00f0ff', '#ff00aa', '#ffd700'],
                gravity: 1.2,
                ticks: 300
            });
            confetti({
                particleCount: 7,
                angle: 120,
                spread: 70,
                origin: { x: 1 },
                colors: ['#00f0ff', '#ff00aa', '#ffd700'],
                gravity: 1.2,
                ticks: 300
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
            setScreenShake(false);
            stopBGM(); // Ensure sound stops on reset
        }
    };

    return (
        <div className={`flex flex-col items-center justify-center min-h-screen p-8 relative z-10 ${screenShake ? 'animate-screen-shake' : ''}`}>
            {/* Header */}
            <div className="absolute top-8 left-8">
                <img
                    src="/lalasweet-logo.png"
                    alt="Lalasweet"
                    className="h-12 w-auto"
                />
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
                    animationType={currentAnimation}
                />

                {/* Controls */}
                <div className="flex gap-6 mt-12">
                    {!isSpinning ? (
                        <button
                            onClick={() => { initAudio(); playClickSound(); spin(); }}
                            className="group relative px-12 py-6 bg-primary/20 hover:bg-primary/30 border border-primary/50 rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                            <div className="absolute inset-0 rounded-full blur-md bg-primary/40 group-hover:bg-primary/60 transition-all" />
                            <div className="relative flex items-center gap-3 text-2xl font-bold text-white uppercase tracking-widest">
                                <Play fill="currentColor" /> Spin
                            </div>
                        </button>
                    ) : (
                        <button
                            onClick={() => { playClickSound(); stop(); }}
                            className="group relative px-12 py-6 bg-secondary/20 hover:bg-secondary/30 border border-secondary/50 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 animate-pulse"
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
                    onClick={() => { playClickSound(); reset(); }}
                    className="p-3 text-white/30 hover:text-white/80 transition-colors"
                    title="Reset History"
                >
                    <RefreshCw size={24} />
                </button>
            </div>
        </div>
    );
};
