/**
 * ========================================================
 * ROAD RIVALS - Modern Multiplayer Cyberpunk Racing Game
 * Pure HTML5, CSS3, & Vanilla JavaScript (Zero Dependencies)
 * ========================================================
 */

"use strict";

// Helper for DOM access
const $ = id => document.getElementById(id);

// Canvas & Context
const canvas = $("gameCanvas");
const ctx = canvas.getContext("2d");

// ========================================================
// 1. PROCEDURAL WEB AUDIO SYNTHESIZER (Pure Web Audio API)
// ========================================================
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.engineOsc = null;
        this.engineGain = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            this.ctx = new AudioContext();
            this.initialized = true;
            this.startEngineHum();
        } catch (e) {
            console.warn("Web Audio not supported:", e);
        }
    }

    startEngineHum() {
        if (!this.ctx || this.engineOsc) return;
        try {
            this.engineOsc = this.ctx.createOscillator();
            this.engineGain = this.ctx.createGain();

            this.engineOsc.type = "sawtooth";
            this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low idle hum

            // Lowpass filter to muffle harsh sawtooth
            const filter = this.ctx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(320, this.ctx.currentTime);

            this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

            this.engineOsc.connect(filter);
            filter.connect(this.engineGain);
            this.engineGain.connect(this.ctx.destination);

            this.engineOsc.start();
        } catch (e) {
            console.warn("Engine sound init error:", e);
        }
    }

    updateEngine(speed, isRacing) {
        if (!this.ctx || this.muted || !this.engineOsc || !isRacing) {
            if (this.engineGain) this.engineGain.gain.setValueAtTime(0, (this.ctx?.currentTime || 0));
            return;
        }
        const freq = 45 + (speed / 300) * 130; // 45Hz idle up to 175Hz high speed
        const volume = Math.min(0.12, 0.03 + (speed / 300) * 0.08);
        this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.08);
        this.engineGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.08);
    }

    playNitro() {
        if (!this.ctx || this.muted) return;
        try {
            const now = this.ctx.currentTime;
            // Noise burst for nitro whoosh
            const bufferSize = this.ctx.sampleRate * 0.4;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.4;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.setValueAtTime(1400, now);
            filter.frequency.exponentialRampToValueAtTime(400, now + 0.38);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(now);
        } catch (e) {}
    }

    playScreech() {
        if (!this.ctx || this.muted) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
            osc.frequency.linearRampToValueAtTime(300, now + 0.2);

            gain.gain.setValueAtTime(0.08, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
        } catch (e) {}
    }

    playCrash() {
        if (!this.ctx || this.muted) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "square";
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.4);
        } catch (e) {}
    }

    playBeep(isHigh = false) {
        if (!this.ctx || this.muted) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(isHigh ? 880 : 440, now);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + (isHigh ? 0.35 : 0.18));

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + (isHigh ? 0.35 : 0.18));
        } catch (e) {}
    }

    playVictory() {
        if (!this.ctx || this.muted) return;
        try {
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const now = this.ctx.currentTime + idx * 0.12;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, now);

                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.3);
            });
        } catch (e) {}
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted && this.engineGain) {
            this.engineGain.gain.setValueAtTime(0, (this.ctx?.currentTime || 0));
        }
        return this.muted;
    }
}

const audio = new SoundEngine();

// ========================================================
// 2. CONSTANTS & CONFIGURATION
// ========================================================
const GAME_CONFIG = {
    roadLeft: 60,
    roadRight: 420,
    lanes: [110, 175, 240, 305, 370],
    normalSpeed: 195,
    nitroSpeed: 285,
    brakeSpeed: 100,
    crashedSpeed: 60,
    steerSpeed: 1.5,
    crashDuration: 1100, // ms
    nitroMax: 100,
    nitroDrainRate: 35, // % per sec
    nitroRefillRate: 12 // % per sec
};

// ========================================================
// 3. GAME STATE
// ========================================================
let selectedMode = "ai"; // "ai", "local2p", "tabs", "webrtc"
let raceState = "LOBBY"; // "LOBBY", "COUNTDOWN", "RACING", "FINISHED"
let finishDistance = 1500;
let raceSeed = 42;
let raceStartTime = 0;
let raceDuration = 0;

// Particles & Effects
let particles = [];
let skidmarks = [];
let roadDust = [];
let speedLines = [];

// Screen shake
let screenShake = 0;

// Player 1 state
const p1 = {
    x: 0.5,             // 0.0 (left) to 1.0 (right)
    distance: 0,
    speed: 0,
    targetSpeed: GAME_CONFIG.normalSpeed,
    nitro: 100,
    isNitro: false,
    isBraking: false,
    crashed: false,
    crashUntil: 0,
    angle: 0,
    name: "Player 1",
    color: "#00f0ff",
    topSpeed: 0,
    crashCount: 0,
    finished: false,
    finishTime: 0
};

// Player 2 / Rival / AI state
const p2 = {
    x: 0.5,
    distance: 0,
    speed: 0,
    targetSpeed: GAME_CONFIG.normalSpeed,
    nitro: 100,
    isNitro: false,
    isBraking: false,
    crashed: false,
    crashUntil: 0,
    angle: 0,
    name: "Rival AI",
    color: "#ff0055",
    topSpeed: 0,
    crashCount: 0,
    finished: false,
    finishTime: 0
};

// Input state
const keys = {
    // Player 1 (WASD)
    a: false,
    d: false,
    w: false,
    s: false,
    // Player 2 or Single Player (Arrows)
    left: false,
    right: false,
    up: false,
    down: false
};

// Obstacle traffic cars
let obstacles = [];

// ========================================================
// 4. DETERMINISTIC PRNG TRAFFIC GENERATION
// ========================================================
function Mulberry32(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

const TRAFFIC_MODELS = [
    { type: "taxi", color: "#facc15", length: 54, width: 30, speedOffset: -30 },
    { type: "sedan", color: "#38bdf8", length: 54, width: 30, speedOffset: -20 },
    { type: "sports", color: "#ef4444", length: 56, width: 32, speedOffset: 0 },
    { type: "truck", color: "#fb923c", length: 82, width: 34, speedOffset: -50 }
];

function generateTrafficObstacles(seed, totalDist) {
    const random = Mulberry32(seed);
    const traffic = [];
    let currentD = 80; // First obstacle at 80m

    while (currentD < totalDist - 80) {
        currentD += 38 + random() * 45; // Spacing between obstacles
        const laneIdx = Math.floor(random() * GAME_CONFIG.lanes.length);
        const model = TRAFFIC_MODELS[Math.floor(random() * TRAFFIC_MODELS.length)];

        traffic.push({
            id: traffic.length,
            lane: laneIdx,
            x: GAME_CONFIG.lanes[laneIdx],
            distance: currentD,
            baseDistance: currentD,
            model: model,
            speed: 120 + model.speedOffset + (random() * 20 - 10),
            color: model.color,
            passed: false
        });
    }
    return traffic;
}

// ========================================================
// 5. MULTIPLAYER NETWORKING (BroadcastChannel + WebRTC)
// ========================================================

// 5A: BroadcastChannel for Two Tabs on same browser
let broadcastChannel = null;
let isBroadcastHost = false;

function initBroadcastChannel() {
    try {
        if (window.BroadcastChannel) {
            broadcastChannel = new BroadcastChannel("road-rivals-channel");
            broadcastChannel.onmessage = handleBroadcastMessage;
        }
    } catch (e) {
        console.warn("BroadcastChannel not available:", e);
    }
}

function handleBroadcastMessage(event) {
    const data = event.data;
    if (!data) return;

    if (data.type === "PING_HOST") {
        if (isBroadcastHost) {
            broadcastChannel.postMessage({
                type: "HOST_PONG",
                seed: raceSeed,
                finishDistance: finishDistance,
                p1Name: p1.name,
                p1Color: p1.color
            });
            setStatus("Player 2 detected! Ready to start.");
        }
    } else if (data.type === "HOST_PONG") {
        if (!isBroadcastHost) {
            raceSeed = data.seed;
            finishDistance = data.finishDistance;
            p2.name = data.p1Name;
            p2.color = data.p1Color;
            setStatus("Connected to Tab 1 (Host)! Waiting for start.");
            $("dashP2Dist").parentElement.querySelector(".card-label").textContent = p2.name.toUpperCase();
        }
    } else if (data.type === "START_RACE") {
        raceSeed = data.seed;
        finishDistance = data.finishDistance;
        obstacles = generateTrafficObstacles(raceSeed, finishDistance);
        beginCountdown();
    } else if (data.type === "PLAYER_STATE") {
        // Sync rival position
        p2.x = data.x;
        p2.distance = data.distance;
        p2.speed = data.speed;
        p2.nitro = data.nitro;
        p2.isNitro = data.isNitro;
        p2.isBraking = data.isBraking;
        p2.crashed = data.crashed;
        p2.angle = data.angle;
        p2.finished = data.finished;
    } else if (data.type === "REMATCH") {
        resetRace(data.seed);
        beginCountdown();
    }
}

// 5B: WebRTC Peer-to-Peer DataChannel
let rtcPeer = null;
let rtcChannel = null;
let isRtcHost = false;

function createRtcPeer() {
    if (rtcPeer) rtcPeer.close();
    rtcPeer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    rtcPeer.oniceconnectionstatechange = () => {
        setStatus("WebRTC: " + rtcPeer.iceConnectionState);
    };

    rtcPeer.ondatachannel = event => {
        setupDataChannel(event.channel);
    };

    rtcPeer.onconnectionstatechange = () => {
        if (rtcPeer.connectionState === "connected") {
            setStatus("Connected to Rival! Ready to race.");
        } else if (["disconnected", "failed"].includes(rtcPeer.connectionState)) {
            setStatus("Rival disconnected.");
        }
    };

    return rtcPeer;
}

function setupDataChannel(ch) {
    rtcChannel = ch;
    rtcChannel.onopen = () => {
        setStatus("DataChannel Open! Starting sync.");
        if (isRtcHost) {
            rtcChannel.send(JSON.stringify({
                type: "HOST_SYNC",
                seed: raceSeed,
                finishDistance: finishDistance,
                p1Name: p1.name,
                p1Color: p1.color
            }));
        }
    };

    rtcChannel.onmessage = event => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === "HOST_SYNC") {
                raceSeed = data.seed;
                finishDistance = data.finishDistance;
                p2.name = data.p1Name;
                p2.color = data.p1Color;
                setStatus("Synced with Host! Waiting for race to start.");
            } else if (data.type === "START_RACE") {
                raceSeed = data.seed;
                finishDistance = data.finishDistance;
                obstacles = generateTrafficObstacles(raceSeed, finishDistance);
                beginCountdown();
            } else if (data.type === "PLAYER_STATE") {
                p2.x = data.x;
                p2.distance = data.distance;
                p2.speed = data.speed;
                p2.nitro = data.nitro;
                p2.isNitro = data.isNitro;
                p2.isBraking = data.isBraking;
                p2.crashed = data.crashed;
                p2.angle = data.angle;
                p2.finished = data.finished;
            } else if (data.type === "REMATCH") {
                resetRace(data.seed);
                beginCountdown();
            }
        } catch (e) {
            console.error(e);
        }
    };
}

function waitForIceGathering(pc) {
    return new Promise(resolve => {
        if (pc.iceGatheringState === "complete") {
            resolve();
            return;
        }
        const timeout = setTimeout(() => {
            pc.removeEventListener("icegatheringstatechange", check);
            resolve();
        }, 10000);

        function check() {
            if (pc.iceGatheringState === "complete") {
                clearTimeout(timeout);
                pc.removeEventListener("icegatheringstatechange", check);
                resolve();
            }
        }
        pc.addEventListener("icegatheringstatechange", check);
    });
}

function encodeSdp(desc) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(desc))));
}

function decodeSdp(str) {
    return JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
}

// 5C: Multi-client state sender (called in loop)
let lastNetworkSend = 0;
function sendNetworkState() {
    const payload = {
        type: "PLAYER_STATE",
        x: p1.x,
        distance: p1.distance,
        speed: p1.speed,
        nitro: p1.nitro,
        isNitro: p1.isNitro,
        isBraking: p1.isBraking,
        crashed: p1.crashed,
        angle: p1.angle,
        finished: p1.finished
    };

    if (selectedMode === "tabs" && broadcastChannel) {
        broadcastChannel.postMessage(payload);
    } else if (selectedMode === "webrtc" && rtcChannel && rtcChannel.readyState === "open") {
        rtcChannel.send(JSON.stringify(payload));
    }
}

// ========================================================
// 6. SMART AI RIVAL LOGIC
// ========================================================
let aiThinkCooldown = 0;
let aiTargetLane = 2;

function updateAiRival(dt) {
    const diff = $("aiDifficulty").value;
    let maxSpeed = 190;
    let steerSensitivity = 1.3;
    let dodgeDistance = 90;

    if (diff === "easy") {
        maxSpeed = 175;
        steerSensitivity = 1.0;
        dodgeDistance = 75;
    } else if (diff === "hard") {
        maxSpeed = 225;
        steerSensitivity = 1.7;
        dodgeDistance = 110;
    }

    aiThinkCooldown -= dt;
    if (aiThinkCooldown <= 0) {
        aiThinkCooldown = 0.15; // Think 6 times per second

        // Scan upcoming traffic within dodge range
        const upcoming = obstacles.filter(
            obs => obs.distance > p2.distance - 5 && obs.distance < p2.distance + dodgeDistance
        );

        // Find lane with maximum safety
        const laneThreats = [0, 0, 0, 0, 0];
        upcoming.forEach(obs => {
            const urgency = 1 - (obs.distance - p2.distance) / dodgeDistance;
            laneThreats[obs.lane] += urgency * 2.5;
        });

        // Also avoid crashing directly into Player 1 if close
        if (Math.abs(p1.distance - p2.distance) < 25) {
            const p1Lane = Math.min(4, Math.max(0, Math.round(p1.x * 4)));
            laneThreats[p1Lane] += 1.5;
        }

        // Pick safest lane
        let lowestThreat = Infinity;
        let bestLane = aiTargetLane;
        for (let i = 0; i < laneThreats.length; i++) {
            if (laneThreats[i] < lowestThreat) {
                lowestThreat = laneThreats[i];
                bestLane = i;
            }
        }
        aiTargetLane = bestLane;
    }

    // Steer towards target lane center
    const targetX = aiTargetLane / (GAME_CONFIG.lanes.length - 1);
    const steerDelta = targetX - p2.x;

    if (Math.abs(steerDelta) > 0.02) {
        p2.x += Math.sign(steerDelta) * steerSensitivity * dt;
        p2.angle = Math.sign(steerDelta) * 0.12;
    } else {
        p2.angle *= 0.85;
    }
    p2.x = Math.max(0.08, Math.min(0.92, p2.x));

    // Handle speed & nitro
    const now = performance.now();
    const isCrashed = now < p2.crashUntil;
    p2.crashed = isCrashed;

    if (isCrashed) {
        p2.speed = GAME_CONFIG.crashedSpeed;
    } else {
        // Accelerate up to maxSpeed
        p2.targetSpeed = maxSpeed;
        // Hard AI uses nitro when behind
        if (diff === "hard" && p2.distance < p1.distance && p2.nitro > 25) {
            p2.isNitro = true;
            p2.targetSpeed = GAME_CONFIG.nitroSpeed;
            p2.nitro = Math.max(0, p2.nitro - GAME_CONFIG.nitroDrainRate * dt);
        } else {
            p2.isNitro = false;
            p2.nitro = Math.min(GAME_CONFIG.nitroMax, p2.nitro + GAME_CONFIG.nitroRefillRate * dt);
        }

        p2.speed += (p2.targetSpeed - p2.speed) * Math.min(1, 3.5 * dt);
    }

    // Distance update
    p2.distance += (p2.speed * dt) / 3.6;

    // AI Collision check with obstacles
    const aiCarX = GAME_CONFIG.roadLeft + p2.x * (GAME_CONFIG.roadRight - GAME_CONFIG.roadLeft);
    for (const obs of obstacles) {
        if (
            Math.abs(obs.distance - p2.distance) < 5 &&
            Math.abs(obs.x - aiCarX) < 28 &&
            !isCrashed
        ) {
            p2.crashUntil = now + GAME_CONFIG.crashDuration;
            p2.crashCount++;
            createSparks(aiCarX, canvas.height - 110, "#ff0055");
        }
    }

    // Finish line check
    if (p2.distance >= finishDistance && !p2.finished) {
        p2.distance = finishDistance;
        p2.finished = true;
        p2.finishTime = (performance.now() - raceStartTime) / 1000;
        checkRaceOver();
    }
}

// ========================================================
// 7. LOCAL 2-PLAYER UPDATE
// ========================================================
function updateLocalP2(dt) {
    const now = performance.now();
    const isCrashed = now < p2.crashUntil;
    p2.crashed = isCrashed;

    // Steering (Arrow Keys)
    let steerDir = 0;
    if (keys.left) steerDir -= 1;
    if (keys.right) steerDir += 1;

    p2.x += steerDir * GAME_CONFIG.steerSpeed * dt;
    p2.x = Math.max(0.08, Math.min(0.92, p2.x));
    p2.angle = steerDir * 0.14;

    // Nitro / Braking
    p2.isNitro = keys.up && p2.nitro > 0 && !isCrashed;
    p2.isBraking = keys.down && !isCrashed;

    if (isCrashed) {
        p2.speed = GAME_CONFIG.crashedSpeed;
    } else if (p2.isNitro) {
        p2.targetSpeed = GAME_CONFIG.nitroSpeed;
        p2.nitro = Math.max(0, p2.nitro - GAME_CONFIG.nitroDrainRate * dt);
        createExhaustFlames(
            GAME_CONFIG.roadLeft + p2.x * (GAME_CONFIG.roadRight - GAME_CONFIG.roadLeft),
            canvas.height - 85,
            p2.color
        );
    } else if (p2.isBraking) {
        p2.targetSpeed = GAME_CONFIG.brakeSpeed;
        p2.nitro = Math.min(GAME_CONFIG.nitroMax, p2.nitro + GAME_CONFIG.nitroRefillRate * dt);
    } else {
        p2.targetSpeed = GAME_CONFIG.normalSpeed;
        p2.nitro = Math.min(GAME_CONFIG.nitroMax, p2.nitro + GAME_CONFIG.nitroRefillRate * dt);
    }

    p2.speed += (p2.targetSpeed - p2.speed) * Math.min(1, 4 * dt);
    p2.distance += (p2.speed * dt) / 3.6;

    // Collision check
    const p2X = GAME_CONFIG.roadLeft + p2.x * (GAME_CONFIG.roadRight - GAME_CONFIG.roadLeft);
    for (const obs of obstacles) {
        if (
            Math.abs(obs.distance - p2.distance) < 5 &&
            Math.abs(obs.x - p2X) < 28 &&
            !isCrashed
        ) {
            p2.crashUntil = now + GAME_CONFIG.crashDuration;
            p2.crashCount++;
            createSparks(p2X, canvas.height - 110, p2.color);
        }
    }

    if (p2.distance >= finishDistance && !p2.finished) {
        p2.distance = finishDistance;
        p2.finished = true;
        p2.finishTime = (performance.now() - raceStartTime) / 1000;
        checkRaceOver();
    }
}

// ========================================================
// 8. PLAYER 1 UPDATE (Local Human Player)
// ========================================================
function updatePlayer1(dt) {
    const now = performance.now();
    const isCrashed = now < p1.crashUntil;
    p1.crashed = isCrashed;

    // Steering (A/D or Left/Right if solo)
    let steerDir = 0;
    if (selectedMode === "local2p") {
        if (keys.a) steerDir -= 1;
        if (keys.d) steerDir += 1;
    } else {
        if (keys.a || keys.left) steerDir -= 1;
        if (keys.d || keys.right) steerDir += 1;
    }

    p1.x += steerDir * GAME_CONFIG.steerSpeed * dt;
    p1.x = Math.max(0.08, Math.min(0.92, p1.x));
    p1.angle = steerDir * 0.14;

    if (steerDir !== 0 && Math.random() < 0.25) {
        audio.playScreech();
    }

    // Nitro & Brake
    const nitroPressed = selectedMode === "local2p" ? keys.w : (keys.w || keys.up);
    const brakePressed = selectedMode === "local2p" ? keys.s : (keys.s || keys.down);

    p1.isNitro = nitroPressed && p1.nitro > 0 && !isCrashed;
    p1.isBraking = brakePressed && !isCrashed;

    if (isCrashed) {
        p1.speed = GAME_CONFIG.crashedSpeed;
        $("crashAlert").classList.remove("hidden");
    } else {
        $("crashAlert").classList.add("hidden");

        if (p1.isNitro) {
            p1.targetSpeed = GAME_CONFIG.nitroSpeed;
            p1.nitro = Math.max(0, p1.nitro - GAME_CONFIG.nitroDrainRate * dt);
            screenShake = Math.max(screenShake, 2);
            audio.playNitro();

            createExhaustFlames(
                GAME_CONFIG.roadLeft + p1.x * (GAME_CONFIG.roadRight - GAME_CONFIG.roadLeft),
                canvas.height - 85,
                p1.color
            );
        } else if (p1.isBraking) {
            p1.targetSpeed = GAME_CONFIG.brakeSpeed;
            p1.nitro = Math.min(GAME_CONFIG.nitroMax, p1.nitro + GAME_CONFIG.nitroRefillRate * dt);
        } else {
            p1.targetSpeed = GAME_CONFIG.normalSpeed;
            p1.nitro = Math.min(GAME_CONFIG.nitroMax, p1.nitro + GAME_CONFIG.nitroRefillRate * dt);
        }
    }

    p1.speed += (p1.targetSpeed - p1.speed) * Math.min(1, 4.5 * dt);
    p1.distance += (p1.speed * dt) / 3.6;

    if (p1.speed > p1.topSpeed) {
        p1.topSpeed = p1.speed;
    }

    // P1 Collisions with obstacles
    const p1X = GAME_CONFIG.roadLeft + p1.x * (GAME_CONFIG.roadRight - GAME_CONFIG.roadLeft);
    for (const obs of obstacles) {
        const distDiff = Math.abs(obs.distance - p1.distance);
        const xDiff = Math.abs(obs.x - p1X);

        // Near-miss bonus
        if (!obs.passed && distDiff < 6 && xDiff > 28 && xDiff < 52 && !isCrashed) {
            obs.passed = true;
            p1.nitro = Math.min(GAME_CONFIG.nitroMax, p1.nitro + 18);
            showNearMissNotice();
        }

        // Crash collision
        if (distDiff < 5 && xDiff < 28 && !isCrashed) {
            p1.crashUntil = now + GAME_CONFIG.crashDuration;
            p1.crashCount++;
            screenShake = 12;
            audio.playCrash();
            createSparks(p1X, canvas.height - 110, p1.color);
        }
    }

    // Finish check
    if (p1.distance >= finishDistance && !p1.finished) {
        p1.distance = finishDistance;
        p1.finished = true;
        p1.finishTime = (performance.now() - raceStartTime) / 1000;
        checkRaceOver();
    }
}

// Check race end
function checkRaceOver() {
    if (p1.finished || p2.finished) {
        if (raceState !== "FINISHED") {
            raceState = "FINISHED";
            audio.playVictory();
            createConfetti();
            showFinishModal();
        }
    }
}

function showFinishModal() {
    const isP1Winner = p1.finished && (!p2.finished || p1.finishTime <= p2.finishTime);
    $("finishTrophy").textContent = isP1Winner ? "🏆" : "🥈";
    $("finishTitle").textContent = isP1Winner ? "VICTORY!" : "DEFEAT!";
    $("finishSubtitle").textContent = isP1Winner
        ? `${p1.name} crossed the finish line 1st!`
        : `${p2.name} won the race! Better luck next time!`;

    const mins = Math.floor(p1.finishTime / 60);
    const secs = (p1.finishTime % 60).toFixed(1);
    $("statTime").textContent = `${mins.toString().padStart(2, "0")}:${secs.padStart(4, "0")}`;
    $("statTopSpeed").textContent = `${Math.floor(p1.topSpeed)} km/h`;
    $("statCrashes").textContent = p1.crashCount;

    $("finishModal").classList.remove("hidden");
}

function showNearMissNotice() {
    const alert = $("crashAlert");
    alert.textContent = "⚡ NEAR MISS! +NITRO!";
    alert.style.background = "rgba(0, 240, 255, 0.9)";
    alert.classList.remove("hidden");
    setTimeout(() => {
        alert.classList.add("hidden");
        alert.textContent = "💥 CRASH! SPEED DROPPED!";
        alert.style.background = "rgba(255, 0, 85, 0.9)";
    }, 600);
}

// ========================================================
// 9. PARTICLE SYSTEMS & VISUAL FX
// ========================================================
function createSparks(x, y, color) {
    for (let i = 0; i < 24; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 40 + Math.random() * 120;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 0.35 + Math.random() * 0.25,
            maxLife: 0.6,
            size: 2 + Math.random() * 4,
            color: color || "#fff"
        });
    }
}

function createExhaustFlames(x, y, color) {
    [-10, 10].forEach(offset => {
        particles.push({
            x: x + offset,
            y: y,
            vx: (Math.random() - 0.5) * 15,
            vy: 60 + Math.random() * 80,
            life: 0.15 + Math.random() * 0.1,
            maxLife: 0.25,
            size: 4 + Math.random() * 5,
            color: Math.random() < 0.5 ? color : "#ffb703"
        });
    });
}

function createConfetti() {
    const colors = ["#00f0ff", "#ff0055", "#39ff14", "#ffb703", "#fff"];
    for (let i = 0; i < 80; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * 100,
            vx: (Math.random() - 0.5) * 100,
            vy: 80 + Math.random() * 120,
            life: 2.0 + Math.random() * 1.5,
            maxLife: 3.5,
            size: 4 + Math.random() * 6,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    if (screenShake > 0) {
        screenShake = Math.max(0, screenShake - 30 * dt);
    }
}

// ========================================================
// 10. RENDERING ENGINE (Canvas 2.5D)
// ========================================================
function drawSkyline(h) {
    // Parallax night grid and distant skyline silhouette
    ctx.fillStyle = "#040713";
    ctx.fillRect(0, 0, canvas.width, 100);

    // Distant neon skyscrapers
    ctx.fillStyle = "#0c152a";
    const buildings = [
        { x: 10, w: 35, h: 55 }, { x: 50, w: 40, h: 70 }, { x: 95, w: 30, h: 45 },
        { x: 130, w: 45, h: 80 }, { x: 180, w: 35, h: 60 }, { x: 220, w: 50, h: 75 },
        { x: 275, w: 30, h: 50 }, { x: 310, w: 45, h: 85 }, { x: 360, w: 40, h: 65 },
        { x: 405, w: 55, h: 70 }
    ];

    buildings.forEach(b => {
        ctx.fillRect(b.x, 100 - b.h, b.w, b.h);
        // Window dots
        ctx.fillStyle = "rgba(0, 240, 255, 0.4)";
        for (let wy = 100 - b.h + 8; wy < 95; wy += 10) {
            ctx.fillRect(b.x + 6, wy, 4, 3);
            ctx.fillRect(b.x + b.w - 10, wy, 4, 3);
        }
        ctx.fillStyle = "#0c152a";
    });

    // Horizon line
    ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 100);
    ctx.lineTo(canvas.width, 100);
    ctx.stroke();
}

function drawRoad(h) {
    const w = canvas.width;
    const roadW = GAME_CONFIG.roadRight - GAME_CONFIG.roadLeft;

    // Grass / Roadside verge
    ctx.fillStyle = "#070c18";
    ctx.fillRect(0, 100, w, h - 100);

    // Asphalt highway
    ctx.fillStyle = "#161d2d";
    ctx.fillRect(GAME_CONFIG.roadLeft, 100, roadW, h - 100);

    // Roadside Rumble Strips (Curbs)
    const curbW = 10;
    const curbScroll = (p1.distance * 8) % 40;
    for (let y = 100 - 40; y < h + 40; y += 20) {
        const isRed = Math.floor((y - curbScroll) / 20) % 2 === 0;
        ctx.fillStyle = isRed ? "#ff0055" : "#f0f4fc";
        ctx.fillRect(GAME_CONFIG.roadLeft - curbW, y + curbScroll, curbW, 20);
        ctx.fillRect(GAME_CONFIG.roadRight, y + curbScroll, curbW, 20);
    }

    // Outer Yellow Guard Lines
    ctx.strokeStyle = "#ffb703";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(GAME_CONFIG.roadLeft, 100);
    ctx.lineTo(GAME_CONFIG.roadLeft, h);
    ctx.moveTo(GAME_CONFIG.roadRight, 100);
    ctx.lineTo(GAME_CONFIG.roadRight, h);
    ctx.stroke();

    // Moving Lane Dashed Lines
    const dashOffset = (p1.distance * 5.2) % 60;
    ctx.strokeStyle = "rgba(220, 235, 255, 0.6)";
    ctx.lineWidth = 3;
    ctx.setLineDash([26, 34]);
    ctx.lineDashOffset = -dashOffset;

    for (let i = 1; i < GAME_CONFIG.lanes.length; i++) {
        const lx = (GAME_CONFIG.lanes[i - 1] + GAME_CONFIG.lanes[i]) / 2;
        ctx.beginPath();
        ctx.moveTo(lx, 100);
        ctx.lineTo(lx, h);
        ctx.stroke();
    }
    ctx.setLineDash([]); // Reset line dash

    // Finish Line Checkerboard (when approaching finish)
    const remainingToFinish = finishDistance - p1.distance;
    const finishY = h - 110 - (remainingToFinish * 5.2);
    if (finishY > 80 && finishY < h + 40) {
        const sq = 12;
        const rows = 2;
        for (let r = 0; r < rows; r++) {
            for (let c = GAME_CONFIG.roadLeft; c < GAME_CONFIG.roadRight; c += sq) {
                const isBlack = (Math.floor(c / sq) + r) % 2 === 0;
                ctx.fillStyle = isBlack ? "#000" : "#fff";
                ctx.fillRect(c, finishY + r * sq, sq, sq);
            }
        }
        ctx.fillStyle = "#ffb703";
        ctx.font = "bold 16px Orbitron, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🏁 FINISH LINE 🏁", w / 2, finishY - 10);
    }
}

function drawCar(x, y, color, label, angle = 0, isCrashed = false, isNitro = false, isBraking = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Car Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.beginPath();
    ctx.ellipse(0, 4, 19, 32, 0, 0, Math.PI * 2);
    ctx.fill();

    // Headlight Beams (cast onto road)
    const grad = ctx.createLinearGradient(0, -30, 0, -120);
    grad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-14, -30);
    ctx.lineTo(-32, -110);
    ctx.lineTo(32, -110);
    ctx.lineTo(14, -30);
    ctx.closePath();
    ctx.fill();

    // Wheels (4 Black Tires with rims)
    ctx.fillStyle = "#050811";
    ctx.fillRect(-20, -22, 6, 16); // Front Left
    ctx.fillRect(14, -22, 6, 16);  // Front Right
    ctx.fillRect(-20, 10, 6, 16);  // Rear Left
    ctx.fillRect(14, 10, 6, 16);   // Rear Right

    // Main Body Chassis
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-16, -30, 32, 60, 8);
    ctx.fill();

    // Sports Decal / Center Racing Stripe
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fillRect(-3, -30, 6, 60);

    // Front Windshield
    ctx.fillStyle = "#0c1524";
    ctx.beginPath();
    ctx.roundRect(-12, -22, 24, 15, 4);
    ctx.fill();
    // Glass Reflection
    ctx.fillStyle = "rgba(0, 240, 255, 0.5)";
    ctx.fillRect(-10, -20, 8, 11);

    // Roof & Rear Glass
    ctx.fillStyle = "#060a12";
    ctx.beginPath();
    ctx.roundRect(-11, 4, 22, 12, 3);
    ctx.fill();

    // Rear Spoiler
    ctx.fillStyle = "#000";
    ctx.fillRect(-17, 24, 34, 5);
    ctx.fillStyle = color;
    ctx.fillRect(-15, 23, 30, 2);

    // Taillights (Glow bright red when braking, dim red otherwise)
    ctx.fillStyle = isBraking ? "#ff0033" : "#880011";
    ctx.shadowColor = isBraking ? "#ff0033" : "transparent";
    ctx.shadowBlur = isBraking ? 15 : 0;
    ctx.fillRect(-14, 27, 8, 3);
    ctx.fillRect(6, 27, 8, 3);
    ctx.shadowBlur = 0; // reset

    // Label tag
    if (label) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px Orbitron, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(label, 0, -38);
    }

    ctx.restore();
}

function drawTrafficCar(obs) {
    const y = canvas.height - 110 - (obs.distance - p1.distance) * 5.2;
    if (y < -80 || y > canvas.height + 80) return;

    ctx.save();
    ctx.translate(obs.x, y);

    const m = obs.model;
    const halfW = m.width / 2;
    const halfL = m.length / 2;

    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.beginPath();
    ctx.ellipse(0, 4, halfW + 2, halfL + 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wheels
    ctx.fillStyle = "#050811";
    ctx.fillRect(-halfW - 3, -halfL + 6, 4, 14);
    ctx.fillRect(halfW - 1, -halfL + 6, 4, 14);
    ctx.fillRect(-halfW - 3, halfL - 18, 4, 14);
    ctx.fillRect(halfW - 1, halfL - 18, 4, 14);

    // Body
    ctx.fillStyle = obs.color;
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfL, m.width, m.length, 6);
    ctx.fill();

    // Windshield
    ctx.fillStyle = "#0c1524";
    ctx.beginPath();
    ctx.roundRect(-halfW + 3, -halfL + 8, m.width - 6, 12, 3);
    ctx.fill();

    // Taxi roof sign or Truck cargo details
    if (m.type === "taxi") {
        ctx.fillStyle = "#000";
        ctx.fillRect(-6, -2, 12, 6);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 8px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("TAXI", 0, 3);
    } else if (m.type === "truck") {
        // Cargo lines
        ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        ctx.lineWidth = 2;
        ctx.strokeRect(-halfW + 2, -halfL + 24, m.width - 4, m.length - 28);
    }

    ctx.restore();
}

function render() {
    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    // Screen shake on crash / nitro
    if (screenShake > 0) {
        const sx = (Math.random() - 0.5) * screenShake;
        const sy = (Math.random() - 0.5) * screenShake;
        ctx.translate(sx, sy);
    }

    ctx.clearRect(0, 0, w, h);

    // 1. Sky & City
    drawSkyline(h);

    // 2. Road & Curbs
    drawRoad(h);

    // 3. Traffic Obstacles
    obstacles.forEach(drawTrafficCar);

    // 4. Opponent / Rival Car (P2)
    const p2Delta = p2.distance - p1.distance;
    const p2Y = h - 110 - p2Delta * 5.2;
    if (p2Y > -60 && p2Y < h + 60) {
        const p2X = GAME_CONFIG.roadLeft + p2.x * (GAME_CONFIG.roadRight - GAME_CONFIG.roadLeft);
        drawCar(p2X, p2Y, p2.color, p2.name, p2.angle, p2.crashed, p2.isNitro, p2.isBraking);
    }

    // 5. Player 1 Car
    const p1X = GAME_CONFIG.roadLeft + p1.x * (GAME_CONFIG.roadRight - GAME_CONFIG.roadLeft);
    drawCar(p1X, h - 110, p1.color, p1.name, p1.angle, p1.crashed, p1.isNitro, p1.isBraking);

    // 6. Particle Effects (Sparks, Exhaust, Confetti)
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    ctx.restore();
}

// ========================================================
// 11. MAIN GAME LOOP
// ========================================================
let lastFrameTime = performance.now();

function gameLoop(now) {
    const dt = Math.min((now - lastFrameTime) / 1000, 0.05); // cap delta
    lastFrameTime = now;

    if (raceState === "RACING" || raceState === "FINISHED") {
        // Update Player 1
        updatePlayer1(dt);

        // Update Player 2 according to mode
        if (selectedMode === "ai") {
            updateAiRival(dt);
        } else if (selectedMode === "local2p") {
            updateLocalP2(dt);
        }

        // Send network state
        if (now - lastNetworkSend > 40) {
            sendNetworkState();
            lastNetworkSend = now;
        }

        // Update sound
        audio.updateEngine(p1.speed, raceState === "RACING");

        // Update HUD
        updateHUD();
    }

    updateParticles(dt);
    render();

    requestAnimationFrame(gameLoop);
}

// ========================================================
// 12. HUD & UI SYNCHRONIZATION
// ========================================================
function updateHUD() {
    // Speedometer
    $("dashSpeed").textContent = Math.floor(p1.speed);
    const speedPercent = Math.min(100, (p1.speed / GAME_CONFIG.nitroSpeed) * 100);
    $("dashSpeedBar").style.width = speedPercent + "%";

    // Nitro Bar
    $("dashNitroBar").style.width = p1.nitro + "%";

    // Distance Counters
    $("dashP1Dist").textContent = `${Math.floor(p1.distance)} m / ${finishDistance} m`;
    $("dashP2Dist").textContent = `${Math.floor(p2.distance)} m`;

    // Mini Track Progress Bar
    const p1Progress = Math.min(100, (p1.distance / finishDistance) * 100);
    const p2Progress = Math.min(100, (p2.distance / finishDistance) * 100);
    $("progressP1").style.left = p1Progress + "%";
    $("progressP2").style.left = p2Progress + "%";

    // Race Lead / Behind Split
    const splitDiff = Math.floor(p1.distance - p2.distance);
    const splitEl = $("dashSplit");
    if (splitDiff > 3) {
        splitEl.className = "split-status lead";
        splitEl.textContent = `+${splitDiff}m LEAD`;
    } else if (splitDiff < -3) {
        splitEl.className = "split-status behind";
        splitEl.textContent = `${splitDiff}m BEHIND`;
    } else {
        splitEl.className = "split-status tie";
        splitEl.textContent = "EVEN RACE";
    }
}

function setStatus(msg) {
    const el = $("connectionStatus");
    if (el) el.textContent = msg;
}

// ========================================================
// 13. COUNTDOWN & RACE START
// ========================================================
function beginCountdown() {
    raceState = "COUNTDOWN";
    $("countdownOverlay").classList.remove("hidden");
    const countEl = $("countdownText");

    let count = 3;
    countEl.textContent = count;
    audio.playBeep(false);

    const timer = setInterval(() => {
        count--;
        if (count > 0) {
            countEl.textContent = count;
            audio.playBeep(false);
        } else if (count === 0) {
            countEl.textContent = "GO!";
            audio.playBeep(true);
        } else {
            clearInterval(timer);
            $("countdownOverlay").classList.add("hidden");
            raceState = "RACING";
            raceStartTime = performance.now();
        }
    }, 1000);
}

function resetRace(seed) {
    raceSeed = seed || Math.floor(Math.random() * 99999);
    finishDistance = parseInt($("trackLength").value, 10) || 1500;
    obstacles = generateTrafficObstacles(raceSeed, finishDistance);

    p1.x = 0.42;
    p1.distance = 0;
    p1.speed = 0;
    p1.nitro = 100;
    p1.crashed = false;
    p1.crashUntil = 0;
    p1.angle = 0;
    p1.topSpeed = 0;
    p1.crashCount = 0;
    p1.finished = false;

    p2.x = 0.58;
    p2.distance = 0;
    p2.speed = 0;
    p2.nitro = 100;
    p2.crashed = false;
    p2.crashUntil = 0;
    p2.angle = 0;
    p2.topSpeed = 0;
    p2.crashCount = 0;
    p2.finished = false;

    particles = [];
    screenShake = 0;

    $("finishModal").classList.add("hidden");
    $("crashAlert").classList.add("hidden");
}

function startRaceSession() {
    audio.init();

    // Read customizations
    p1.name = $("playerName").value.trim() || "Player 1";
    $("hudP1Name").textContent = p1.name.toUpperCase();

    if (selectedMode === "ai") {
        p2.name = "Rival AI (" + $("aiDifficulty").value.toUpperCase() + ")";
        p2.color = "#ff0055";
    } else if (selectedMode === "local2p") {
        p2.name = "Player 2";
        p2.color = "#ff0055";
    }
    $("hudP2Name").textContent = p2.name.toUpperCase();

    // Show controls hint
    if (selectedMode === "local2p") {
        $("controlsHintLocal").classList.remove("hidden");
        $("controlsHintSingle").classList.add("hidden");
    } else {
        $("controlsHintLocal").classList.add("hidden");
        $("controlsHintSingle").classList.remove("hidden");
    }

    // Switch view to Game Arena
    $("lobbySection").classList.add("hidden");
    $("gameSection").classList.remove("hidden");

    resetRace();

    // If host in multiplayer, broadcast start
    if (selectedMode === "tabs" && broadcastChannel && isBroadcastHost) {
        broadcastChannel.postMessage({
            type: "START_RACE",
            seed: raceSeed,
            finishDistance: finishDistance
        });
    } else if (selectedMode === "webrtc" && rtcChannel && isRtcHost) {
        rtcChannel.send(JSON.stringify({
            type: "START_RACE",
            seed: raceSeed,
            finishDistance: finishDistance
        }));
    }

    beginCountdown();
}

// ========================================================
// 14. EVENT HANDLERS & CONTROLS
// ========================================================

// Keyboard controls
window.addEventListener("keydown", e => {
    audio.init();

    // Toggle mute with 'M'
    if (e.key.toLowerCase() === "m") {
        const muted = audio.toggleMute();
        $("audioIcon").textContent = muted ? "🔇" : "🔊";
        return;
    }

    // P1 Controls (WASD)
    if (e.key === "a" || e.key === "A") keys.a = true;
    if (e.key === "d" || e.key === "D") keys.d = true;
    if (e.key === "w" || e.key === "W") keys.w = true;
    if (e.key === "s" || e.key === "S") keys.s = true;

    // Arrow Controls (P2 in 2-player mode, or alternate single player)
    if (e.key === "ArrowLeft") { keys.left = true; e.preventDefault(); }
    if (e.key === "ArrowRight") { keys.right = true; e.preventDefault(); }
    if (e.key === "ArrowUp" || e.key === " ") { keys.up = true; e.preventDefault(); }
    if (e.key === "ArrowDown") { keys.down = true; e.preventDefault(); }
});

window.addEventListener("keyup", e => {
    if (e.key === "a" || e.key === "A") keys.a = false;
    if (e.key === "d" || e.key === "D") keys.d = false;
    if (e.key === "w" || e.key === "W") keys.w = false;
    if (e.key === "s" || e.key === "S") keys.s = false;

    if (e.key === "ArrowLeft") keys.left = false;
    if (e.key === "ArrowRight") keys.right = false;
    if (e.key === "ArrowUp" || e.key === " ") keys.up = false;
    if (e.key === "ArrowDown") keys.down = false;
});

// Mobile touch button binders
function bindTouchButton(id, onDown, onUp) {
    const btn = $(id);
    if (!btn) return;
    btn.addEventListener("pointerdown", e => {
        e.preventDefault();
        audio.init();
        onDown();
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(type => {
        btn.addEventListener(type, e => {
            e.preventDefault();
            onUp();
        });
    });
}

bindTouchButton("mBtnLeft", () => { keys.left = true; keys.a = true; }, () => { keys.left = false; keys.a = false; });
bindTouchButton("mBtnRight", () => { keys.right = true; keys.d = true; }, () => { keys.right = false; keys.d = false; });
bindTouchButton("mBtnNitro", () => { keys.up = true; keys.w = true; }, () => { keys.up = false; keys.w = false; });
bindTouchButton("mBtnBrake", () => { keys.down = true; keys.s = true; }, () => { keys.down = false; keys.s = false; });

// Mode Selector Click Handlers
document.querySelectorAll(".mode-card").forEach(card => {
    card.addEventListener("click", () => {
        document.querySelectorAll(".mode-card").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        selectedMode = card.dataset.mode;

        // Toggle sub-panels
        $("webrtcPanel").classList.toggle("hidden", selectedMode !== "webrtc");
        $("tabsPanel").classList.toggle("hidden", selectedMode !== "tabs");

        if (selectedMode === "tabs") {
            initBroadcastChannel();
        }
    });
});

// Car Color Palette Picker
document.querySelectorAll("#p1ColorPalette .color-dot").forEach(dot => {
    dot.addEventListener("click", () => {
        document.querySelectorAll("#p1ColorPalette .color-dot").forEach(d => d.classList.remove("active"));
        dot.classList.add("active");
        p1.color = dot.dataset.color;
    });
});

// Audio Toggle Button
$("audioToggle").addEventListener("click", () => {
    audio.init();
    const muted = audio.toggleMute();
    $("audioIcon").textContent = muted ? "🔇" : "🔊";
});

// Help Modal
$("helpToggle").addEventListener("click", () => $("helpModal").classList.remove("hidden"));
$("btnCloseHelp").addEventListener("click", () => $("helpModal").classList.add("hidden"));

// Fullscreen Toggle
$("fullscreenToggle").addEventListener("click", () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen().catch(() => {});
    }
});

// Start Game Launch Button
$("btnStartGame").addEventListener("click", startRaceSession);

// In-Game Restart & Exit
$("btnRestartRace").addEventListener("click", () => {
    resetRace();
    beginCountdown();
});

$("btnExitToLobby").addEventListener("click", () => {
    raceState = "LOBBY";
    audio.updateEngine(0, false);
    $("gameSection").classList.add("hidden");
    $("lobbySection").classList.remove("hidden");
});

// Rematch & Return buttons on Finish Modal
$("btnRematch").addEventListener("click", () => {
    const newSeed = Math.floor(Math.random() * 99999);
    resetRace(newSeed);
    if (selectedMode === "tabs" && broadcastChannel) {
        broadcastChannel.postMessage({ type: "REMATCH", seed: newSeed });
    } else if (selectedMode === "webrtc" && rtcChannel) {
        rtcChannel.send(JSON.stringify({ type: "REMATCH", seed: newSeed }));
    }
    beginCountdown();
});

$("btnReturnLobby").addEventListener("click", () => {
    raceState = "LOBBY";
    audio.updateEngine(0, false);
    $("finishModal").classList.add("hidden");
    $("gameSection").classList.add("hidden");
    $("lobbySection").classList.remove("hidden");
});

// ========================================================
// 15. TWO-TABS AUTO-SYNC HANDLERS
// ========================================================
$("btnTabsHost").addEventListener("click", () => {
    initBroadcastChannel();
    isBroadcastHost = true;
    p1.name = "Host (Tab 1)";
    $("playerName").value = p1.name;
    setStatus("Tab 1: Hosting room. Open Tab 2 and click 'Join as Player 2'!");
});

$("btnTabsJoin").addEventListener("click", () => {
    initBroadcastChannel();
    isBroadcastHost = false;
    p1.name = "Racer (Tab 2)";
    p1.color = "#ff0055";
    $("playerName").value = p1.name;
    setStatus("Tab 2: Searching for Tab 1 host...");
    broadcastChannel.postMessage({ type: "PING_HOST" });
});

// ========================================================
// 16. WEBRTC P2P ROOM HANDLERS
// ========================================================
$("btnCreateOffer").addEventListener("click", async () => {
    try {
        isRtcHost = true;
        const pc = createRtcPeer();
        setupDataChannel(pc.createDataChannel("road-rivals-data"));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        setStatus("Gathering connection information...");
        await waitForIceGathering(pc);

        const encOffer = encodeSdp(pc.localDescription);
        $("offerTextOut").value = encOffer;
        setStatus("Room Offer created! Send it to Player 2.");
    } catch (e) {
        setStatus("Offer error: " + e.message);
    }
});

$("btnCopyOffer").addEventListener("click", async () => {
    const text = $("offerTextOut").value;
    if (!text) return setStatus("No offer to copy!");
    await navigator.clipboard.writeText(text);
    setStatus("Offer copied to clipboard!");
});

$("btnCopyInviteLink").addEventListener("click", async () => {
    const text = $("offerTextOut").value;
    if (!text) return setStatus("Create room offer first!");
    const url = window.location.origin + window.location.pathname + "#offer=" + text;
    await navigator.clipboard.writeText(url);
    setStatus("Direct Invite Link copied!");
});

$("btnCreateAnswer").addEventListener("click", async () => {
    try {
        const offerStr = $("offerTextIn").value.trim();
        if (!offerStr) return setStatus("Paste Player 1 offer first!");

        isRtcHost = false;
        const pc = createRtcPeer();
        await pc.setRemoteDescription(decodeSdp(offerStr));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        setStatus("Gathering answer information...");
        await waitForIceGathering(pc);

        $("answerTextOut").value = encodeSdp(pc.localDescription);
        setStatus("Answer created! Copy it back to Player 1.");
    } catch (e) {
        setStatus("Answer error: " + e.message);
    }
});

$("btnCopyAnswer").addEventListener("click", async () => {
    const text = $("answerTextOut").value;
    if (!text) return setStatus("No answer to copy!");
    await navigator.clipboard.writeText(text);
    setStatus("Answer copied to clipboard!");
});

$("btnApplyAnswer").addEventListener("click", async () => {
    try {
        const answerStr = $("answerTextIn").value.trim();
        if (!answerStr) return setStatus("Paste Player 2 answer first!");
        await rtcPeer.setRemoteDescription(decodeSdp(answerStr));
        setStatus("Connecting with Player 2...");
    } catch (e) {
        setStatus("Connect error: " + e.message);
    }
});

// Auto-check URL hash for direct invite link
window.addEventListener("load", () => {
    if (window.location.hash.startsWith("#offer=")) {
        const offer = window.location.hash.replace("#offer=", "");
        selectedMode = "webrtc";
        document.querySelectorAll(".mode-card").forEach(c => {
            c.classList.toggle("active", c.dataset.mode === "webrtc");
        });
        $("webrtcPanel").classList.remove("hidden");
        $("offerTextIn").value = offer;
        setStatus("Invite link detected! Click 'Generate Answer' to join.");
    }
});

// Start loop
requestAnimationFrame(gameLoop);
