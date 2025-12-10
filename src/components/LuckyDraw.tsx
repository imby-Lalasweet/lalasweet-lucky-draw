'use client';

import React, { useState, useRef } from 'react';
import { NumberDisplay, animationClasses } from './NumberDisplay';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Play } from 'lucide-react';
import { playClickSound, playBGM, stopBGM, playStopSound, initAudio } from '@/utils/sound';

const MIN_NUMBER = 1;
const MAX_NUMBER = 100;

// Draw type configuration
type DrawType = 1 | 13 | 15 | 30;

interface Winner {
    number: number;
    drawType: DrawType;
}

// Color classes for each draw type
const drawTypeColors: Record<DrawType, string> = {
    1: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
    13: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
    15: 'text-pink-400 border-pink-400/30 bg-pink-400/10',
    30: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
};

// Button colors for each draw type
const buttonColors: Record<DrawType, { bg: string; border: string; glow: string }> = {
    1: { bg: 'bg-cyan-500/20 hover:bg-cyan-500/30', border: 'border-cyan-500/50', glow: 'bg-cyan-500/40' },
    13: { bg: 'bg-yellow-500/20 hover:bg-yellow-500/30', border: 'border-yellow-500/50', glow: 'bg-yellow-500/40' },
    15: { bg: 'bg-pink-500/20 hover:bg-pink-500/30', border: 'border-pink-500/50', glow: 'bg-pink-500/40' },
    30: { bg: 'bg-purple-500/20 hover:bg-purple-500/30', border: 'border-purple-500/50', glow: 'bg-purple-500/40' },
};

// Animation timing for each draw type (total ~40 seconds)
const drawTiming: Record<DrawType, { spinTime: number; slowDownTime: number; displayTime: number }> = {
    1: { spinTime: 0, slowDownTime: 0, displayTime: 0 }, // Manual stop
    13: { spinTime: 2000, slowDownTime: 500, displayTime: 500 }, // ~3s per number
    15: { spinTime: 1600, slowDownTime: 500, displayTime: 500 }, // ~2.6s per number
    30: { spinTime: 600, slowDownTime: 400, displayTime: 300 }, // ~1.3s per number
};

export const LuckyDraw: React.FC = () => {
    const [currentNumber, setCurrentNumber] = useState<number | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winners, setWinners] = useState<Winner[]>([]);
    const [targetNumber, setTargetNumber] = useState<number | null>(null);
    const [currentAnimation, setCurrentAnimation] = useState<string>('animate-pulse-scale');
    const [screenShake, setScreenShake] = useState(false);
    const [currentDrawType, setCurrentDrawType] = useState<DrawType>(1);
    const [multiDrawWinners, setMultiDrawWinners] = useState<number[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [currentDrawIndex, setCurrentDrawIndex] = useState(0);

    const animationRef = useRef<number | null>(null);
    const speedRef = useRef<number>(50);
    const lastUpdateRef = useRef<number>(0);
    const shuffledNumbersRef = useRef<number[]>([]);
    const shuffleIndexRef = useRef<number>(0);

    // Fisher-Yates shuffle algorithm
    const shuffleArray = (array: number[]) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // Initialize shuffled numbers array
    const initShuffledNumbers = () => {
        const numbers = Array.from({ length: MAX_NUMBER - MIN_NUMBER + 1 }, (_, i) => i + MIN_NUMBER);
        shuffledNumbersRef.current = shuffleArray(numbers);
        shuffleIndexRef.current = 0;
    };

    // Get next number from shuffled array
    const getNextDisplayNumber = () => {
        if (shuffledNumbersRef.current.length === 0) {
            initShuffledNumbers();
        }
        const num = shuffledNumbersRef.current[shuffleIndexRef.current];
        shuffleIndexRef.current = (shuffleIndexRef.current + 1) % shuffledNumbersRef.current.length;
        if (shuffleIndexRef.current === 0) {
            shuffledNumbersRef.current = shuffleArray(shuffledNumbersRef.current);
        }
        return num;
    };

    const generateRandomNumber = () => {
        return Math.floor(Math.random() * (MAX_NUMBER - MIN_NUMBER + 1)) + MIN_NUMBER;
    };

    const getRandomAnimation = () => {
        return animationClasses[Math.floor(Math.random() * animationClasses.length)];
    };

    // Get available numbers (not yet drawn)
    const getAvailableNumbers = (currentWinners: number[] = []) => {
        const allDrawn = [...winners.map(w => w.number), ...currentWinners];
        return Array.from({ length: MAX_NUMBER - MIN_NUMBER + 1 }, (_, i) => i + MIN_NUMBER)
            .filter(n => !allDrawn.includes(n));
    };

    // Single draw (original behavior with manual stop)
    const spinSingle = () => {
        if (isSpinning) return;

        const available = getAvailableNumbers();
        if (available.length === 0) {
            alert('All numbers have been drawn!');
            return;
        }

        setCurrentDrawType(1);
        setIsSpinning(true);
        setTargetNumber(null);
        setScreenShake(true);
        speedRef.current = 30;
        initShuffledNumbers();
        playBGM();
        setCurrentAnimation(getRandomAnimation());

        const animate = (time: number) => {
            if (time - lastUpdateRef.current > speedRef.current) {
                setCurrentNumber(getNextDisplayNumber());
                lastUpdateRef.current = time;
                if (Math.random() < 0.1) {
                    setCurrentAnimation(getRandomAnimation());
                }
            }
            animationRef.current = requestAnimationFrame(animate);
        };
        animationRef.current = requestAnimationFrame(animate);
    };

    // Stop single draw
    const stopSingle = () => {
        if (!isSpinning || targetNumber !== null || currentDrawType !== 1) return;

        const available = getAvailableNumbers();
        const winner = available[Math.floor(Math.random() * available.length)];

        setTargetNumber(winner);
        stopBGM();

        if (animationRef.current) cancelAnimationFrame(animationRef.current);

        let currentSpeed = 50;
        const maxSpeed = 800;
        const steps = 18;
        let stepCount = 0;

        const slowDown = () => {
            setCurrentNumber(getNextDisplayNumber());
            stepCount++;
            currentSpeed *= 1.27;
            if (stepCount % 3 === 0) {
                setCurrentAnimation(getRandomAnimation());
            }
            if (stepCount >= steps || currentSpeed > maxSpeed) {
                setCurrentNumber(winner);
                setIsSpinning(false);
                setScreenShake(false);
                setWinners(prev => [{ number: winner, drawType: 1 }, ...prev]);
                triggerConfetti();
                playStopSound();
            } else {
                setTimeout(slowDown, currentSpeed);
            }
        };
        slowDown();
    };

    // Multi-draw (automatic, 13/15/30 numbers)
    const spinMulti = async (drawType: DrawType) => {
        if (isSpinning) return;

        const count = drawType;
        const available = getAvailableNumbers();

        if (available.length < count) {
            alert(`Not enough numbers available! Only ${available.length} left.`);
            return;
        }

        setCurrentDrawType(drawType);
        setIsSpinning(true);
        setScreenShake(true);
        setMultiDrawWinners([]);
        setCurrentDrawIndex(0);

        await initAudio();
        playBGM();

        const timing = drawTiming[drawType];
        const drawnWinners: number[] = [];

        // Draw each number sequentially
        for (let i = 0; i < count; i++) {
            setCurrentDrawIndex(i + 1);

            // Pick winner
            const currentAvailable = getAvailableNumbers(drawnWinners);
            const winner = currentAvailable[Math.floor(Math.random() * currentAvailable.length)];
            drawnWinners.push(winner);

            // Spin phase
            initShuffledNumbers();
            setCurrentAnimation(getRandomAnimation());

            const spinStart = Date.now();
            while (Date.now() - spinStart < timing.spinTime) {
                setCurrentNumber(getNextDisplayNumber());
                if (Math.random() < 0.15) {
                    setCurrentAnimation(getRandomAnimation());
                }
                await new Promise(r => setTimeout(r, 30));
            }

            // Slow down phase
            let slowSpeed = 50;
            const slowDownStart = Date.now();
            while (Date.now() - slowDownStart < timing.slowDownTime) {
                setCurrentNumber(getNextDisplayNumber());
                slowSpeed *= 1.2;
                await new Promise(r => setTimeout(r, Math.min(slowSpeed, 200)));
            }

            // Show winner
            setCurrentNumber(winner);
            playStopSound();

            // Brief display before next
            await new Promise(r => setTimeout(r, timing.displayTime));
        }

        // All done
        stopBGM();
        setIsSpinning(false);
        setScreenShake(false);
        setMultiDrawWinners(drawnWinners);

        // Add all winners to history
        const newWinners = drawnWinners.map(n => ({ number: n, drawType }));
        setWinners(prev => [...newWinners.reverse(), ...prev]);

        // Show results modal
        setShowResults(true);
        triggerConfetti();
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
            setShowResults(false);
            setMultiDrawWinners([]);
            stopBGM();
        }
    };

    const closeResults = () => {
        setShowResults(false);
        setMultiDrawWinners([]);
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
            <div className="absolute top-8 right-8 w-72 bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center gap-2 mb-4 text-white/80">
                    <Trophy size={20} className="text-accent" />
                    <h2 className="font-semibold">Winners ({winners.length})</h2>
                </div>
                {/* Color legend */}
                <div className="flex gap-2 mb-3 text-xs">
                    <span className="text-cyan-400">×1</span>
                    <span className="text-yellow-400">×13</span>
                    <span className="text-pink-400">×15</span>
                    <span className="text-purple-400">×30</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {winners.map((w, idx) => (
                        <div
                            key={idx}
                            className={`rounded-md p-2 text-center font-mono text-sm border animate-in fade-in zoom-in duration-300 ${drawTypeColors[w.drawType]}`}
                        >
                            {w.number}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Stage */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl">
                {/* Progress indicator for multi-draw */}
                {isSpinning && currentDrawType !== 1 && (
                    <div className="mb-4 text-white/60 text-lg">
                        Drawing {currentDrawIndex} / {currentDrawType}
                    </div>
                )}

                <NumberDisplay
                    number={currentNumber}
                    isSpinning={isSpinning}
                    isWinner={!isSpinning && targetNumber !== null && currentNumber === targetNumber}
                    animationType={currentAnimation}
                />

                {/* Controls */}
                <div className="flex flex-wrap justify-center gap-4 mt-12">
                    {!isSpinning ? (
                        <>
                            {/* ×1 Button */}
                            <button
                                onClick={async () => { await initAudio(); playClickSound(); spinSingle(); }}
                                className={`group relative px-8 py-5 ${buttonColors[1].bg} border ${buttonColors[1].border} rounded-full transition-all duration-300 hover:scale-105 active:scale-95`}
                            >
                                <div className={`absolute inset-0 rounded-full blur-md ${buttonColors[1].glow} group-hover:opacity-80 transition-all`} />
                                <div className="relative flex items-center gap-2 text-xl font-bold text-white uppercase tracking-widest">
                                    <Play fill="currentColor" size={20} /> ×1
                                </div>
                            </button>

                            {/* ×13 Button */}
                            <button
                                onClick={async () => { await initAudio(); playClickSound(); spinMulti(13); }}
                                className={`group relative px-8 py-5 ${buttonColors[13].bg} border ${buttonColors[13].border} rounded-full transition-all duration-300 hover:scale-105 active:scale-95`}
                            >
                                <div className={`absolute inset-0 rounded-full blur-md ${buttonColors[13].glow} group-hover:opacity-80 transition-all`} />
                                <div className="relative flex items-center gap-2 text-xl font-bold text-white uppercase tracking-widest">
                                    <Play fill="currentColor" size={20} /> ×13
                                </div>
                            </button>

                            {/* ×15 Button */}
                            <button
                                onClick={async () => { await initAudio(); playClickSound(); spinMulti(15); }}
                                className={`group relative px-8 py-5 ${buttonColors[15].bg} border ${buttonColors[15].border} rounded-full transition-all duration-300 hover:scale-105 active:scale-95`}
                            >
                                <div className={`absolute inset-0 rounded-full blur-md ${buttonColors[15].glow} group-hover:opacity-80 transition-all`} />
                                <div className="relative flex items-center gap-2 text-xl font-bold text-white uppercase tracking-widest">
                                    <Play fill="currentColor" size={20} /> ×15
                                </div>
                            </button>

                            {/* ×30 Button */}
                            <button
                                onClick={async () => { await initAudio(); playClickSound(); spinMulti(30); }}
                                className={`group relative px-8 py-5 ${buttonColors[30].bg} border ${buttonColors[30].border} rounded-full transition-all duration-300 hover:scale-105 active:scale-95`}
                            >
                                <div className={`absolute inset-0 rounded-full blur-md ${buttonColors[30].glow} group-hover:opacity-80 transition-all`} />
                                <div className="relative flex items-center gap-2 text-xl font-bold text-white uppercase tracking-widest">
                                    <Play fill="currentColor" size={20} /> ×30
                                </div>
                            </button>
                        </>
                    ) : currentDrawType === 1 ? (
                        <button
                            onClick={() => { playClickSound(); stopSingle(); }}
                            className="group relative px-12 py-6 bg-secondary/20 hover:bg-secondary/30 border border-secondary/50 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 animate-pulse"
                        >
                            <div className="absolute inset-0 rounded-full blur-md bg-secondary/40 group-hover:bg-secondary/60 transition-all" />
                            <div className="relative flex items-center gap-3 text-2xl font-bold text-white uppercase tracking-widest">
                                Stop
                            </div>
                        </button>
                    ) : (
                        <div className="px-12 py-6 bg-white/10 border border-white/20 rounded-full">
                            <div className="text-xl font-bold text-white/60 uppercase tracking-widest animate-pulse">
                                Drawing...
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Results Modal */}
            {showResults && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-900/95 border border-white/20 rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <h2 className="text-3xl font-bold text-white text-center mb-6">
                            🎉 {multiDrawWinners.length} Winners! 🎉
                        </h2>
                        <div className="grid grid-cols-5 gap-3 mb-8">
                            {multiDrawWinners.map((num, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-lg text-center font-mono text-2xl font-bold border-2 animate-in fade-in zoom-in ${drawTypeColors[currentDrawType]}`}
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    {num}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={closeResults}
                            className="w-full py-4 bg-primary/30 hover:bg-primary/50 border border-primary/50 rounded-xl text-white font-bold text-xl transition-all"
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}

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
