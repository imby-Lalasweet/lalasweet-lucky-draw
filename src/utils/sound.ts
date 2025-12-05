let audioContext: AudioContext | null = null;
const soundBuffers: { [key: string]: AudioBuffer | null } = {
    bgm: null,
    stop: null,
};
let bgmSource: AudioBufferSourceNode | null = null;

// Helper to get or create AudioContext
const getAudioContext = () => {
    if (!audioContext) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
            audioContext = new AudioContext();
        }
    }
    return audioContext;
};

const loadSound = async (url: string): Promise<AudioBuffer | null> => {
    const ctx = getAudioContext();
    if (!ctx) return null;

    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return await ctx.decodeAudioData(arrayBuffer);
    } catch (error) {
        console.error(`Failed to load sound from ${url}:`, error);
        return null;
    }
};

// Initialize audio context and preload sounds
export const initAudio = async () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
    }

    if (!soundBuffers.bgm) {
        soundBuffers.bgm = await loadSound('/sounds/D.wav');
    }
    if (!soundBuffers.stop) {
        soundBuffers.stop = await loadSound('/sounds/F.wav');
    }
};

export const playBGM = () => {
    const ctx = getAudioContext();
    if (!ctx || !soundBuffers.bgm) return;

    // Stop existing BGM if any
    if (bgmSource) {
        try {
            bgmSource.stop();
        } catch (e) {
            // Ignore if already stopped
        }
    }

    bgmSource = ctx.createBufferSource();
    bgmSource.buffer = soundBuffers.bgm;
    bgmSource.loop = true;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.5; // Adjust volume as needed

    bgmSource.connect(gainNode);
    gainNode.connect(ctx.destination);

    bgmSource.start(0);
};

export const stopBGM = () => {
    if (bgmSource) {
        try {
            bgmSource.stop();
        } catch (e) {
            // Ignore
        }
        bgmSource = null;
    }
};

export const playStopSound = () => {
    const ctx = getAudioContext();
    if (!ctx || !soundBuffers.stop) return;

    // Stop BGM just in case it wasn't stopped
    stopBGM();

    const source = ctx.createBufferSource();
    source.buffer = soundBuffers.stop;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.8;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(0);
};

export const playClickSound = () => {
    // Optional: Add a specific click sound if needed
};

// Deprecated functions kept to avoid breaking imports immediately, but should be removed from usage
export const playSlotSound = (intensity: number = 1) => { };
export const playJingSound = () => { };
export const increaseTension = () => { };
export const resetTension = () => { };

