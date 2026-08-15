import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface SkyBackgroundProps {
  children: React.ReactNode;
}

// Fixed positions for multi-colored animated dots inspired by user image
const SKY_DOTS = [
  { id: 1, color: '#1d4ed8', size: 10, top: '12%', left: '42%', delay: '0s', duration: '7s' }, // Dark blue top center
  { id: 2, color: '#f97316', size: 8, top: '22%', left: '39%', delay: '1s', duration: '9s' },  // Orange
  { id: 3, color: '#1e40af', size: 11, top: '32%', left: '11%', delay: '2s', duration: '8s' },  // Dark blue left
  { id: 4, color: '#1d4ed8', size: 9, top: '36%', left: '62%', delay: '0.5s', duration: '6.5s' }, // Blue mid right
  { id: 5, color: '#14b8a6', size: 9, top: '48%', left: '21%', delay: '3s', duration: '10s' }, // Teal left
  { id: 6, color: '#22c55e', size: 8, top: '57%', left: '24%', delay: '1.5s', duration: '7.5s' }, // Green mid left
  { id: 7, color: '#1d4ed8', size: 9, top: '44%', left: '88%', delay: '2.5s', duration: '8.5s' }, // Blue right
  { id: 8, color: '#1e40af', size: 10, top: '49%', left: '85%', delay: '1.2s', duration: '6.8s' }, // Dark blue right
  { id: 9, color: '#a855f7', size: 9, top: '65%', left: '86%', delay: '0.8s', duration: '9.2s' }, // Purple bottom right
  { id: 10, color: '#1e40af', size: 10, top: '72%', left: '23%', delay: '3.5s', duration: '7.2s' }, // Blue bottom left
  { id: 11, color: '#f97316', size: 7, top: '33%', left: '93%', delay: '1.8s', duration: '8.2s' }, // Orange far right
  { id: 12, color: '#0d9488', size: 8, top: '18%', left: '80%', delay: '2.2s', duration: '7.8s' }, // Teal top right
  { id: 13, color: '#1e3a8a', size: 11, top: '82%', left: '48%', delay: '0.2s', duration: '9.5s' }, // Deep blue bottom
];

export const SkyBackground: React.FC<SkyBackgroundProps> = ({ children }) => {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(soundFx.getIsMuted());
  }, []);

  const toggleMute = () => {
    const nextState = soundFx.toggleMute();
    setMuted(nextState);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#bce0fd] via-[#d4ebff] to-[#eaf5ff] font-sans antialiased text-slate-800 selection:bg-blue-200">
      {/* Floating Sound Mute/Unmute Toggle Button */}
      <div className="absolute top-4 right-4 z-50">
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          className="flex items-center gap-1.5 bg-white/70 hover:bg-white/90 backdrop-blur-md border border-white/80 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm hover:shadow transition-all cursor-pointer"
        >
          {muted ? (
            <>
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Muted</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>Sound On</span>
            </>
          )}
        </button>
      </div>

      {/* Background Soft Sunlight / Sky Aura */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-white/80 to-transparent blur-3xl pointer-events-none" />

      {/* Slowly Drifting Fluffy Cumulus Clouds */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {/* Cloud Layer 1 - Upper Fluffy Cloud */}
        <div className="absolute top-[8%] left-[10%] w-[420px] sm:w-[560px] animate-cloud-drift-1 opacity-90">
          <svg viewBox="0 0 500 250" fill="none" className="w-full h-auto filter drop-shadow-[0_15px_25px_rgba(255,255,255,0.8)]">
            <path
              d="M120 180 C80 180 50 150 50 110 C50 75 75 45 110 40 C130 15 170 0 210 10 C250 -10 300 0 330 30 C360 15 400 25 420 55 C450 65 470 95 460 130 C470 160 440 180 400 180 Z"
              fill="url(#cloudGrad1)"
            />
            <defs>
              <linearGradient id="cloudGrad1" x1="250" y1="0" x2="250" y2="180" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" stopOpacity="0.98" />
                <stop offset="0.7" stopColor="#F0F7FF" stopOpacity="0.9" />
                <stop offset="1" stopColor="#D8EAFF" stopOpacity="0.7" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Cloud Layer 2 - Mid Right Cloud */}
        <div className="absolute top-[36%] right-[5%] w-[380px] sm:w-[500px] animate-cloud-drift-2 opacity-85">
          <svg viewBox="0 0 450 220" fill="none" className="w-full h-auto filter drop-shadow-[0_12px_20px_rgba(255,255,255,0.75)]">
            <path
              d="M100 160 C65 160 40 135 40 100 C40 70 60 45 90 40 C110 18 145 5 180 15 C215 -5 260 5 285 30 C310 18 345 25 365 50 C390 60 405 85 395 115 C405 140 380 160 345 160 Z"
              fill="url(#cloudGrad2)"
            />
            <defs>
              <linearGradient id="cloudGrad2" x1="225" y1="0" x2="225" y2="160" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="0.7" stopColor="#EEF6FF" stopOpacity="0.85" />
                <stop offset="1" stopColor="#D5E8FF" stopOpacity="0.65" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Cloud Layer 3 - Lower Left Cloud */}
        <div className="absolute bottom-[18%] left-[2%] w-[360px] sm:w-[480px] animate-cloud-drift-3 opacity-80">
          <svg viewBox="0 0 420 200" fill="none" className="w-full h-auto filter drop-shadow-[0_10px_18px_rgba(255,255,255,0.7)]">
            <path
              d="M90 150 C60 150 35 125 35 95 C35 65 55 42 82 38 C100 16 132 4 165 14 C198 -4 238 5 262 28 C285 16 318 22 336 46 C358 55 372 78 363 106 C372 130 350 150 318 150 Z"
              fill="url(#cloudGrad3)"
            />
            <defs>
              <linearGradient id="cloudGrad3" x1="210" y1="0" x2="210" y2="150" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" stopOpacity="0.92" />
                <stop offset="0.7" stopColor="#EBF4FF" stopOpacity="0.8" />
                <stop offset="1" stopColor="#D0E5FF" stopOpacity="0.6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Soft Ambient Diffused Blurs in Corners */}
        <div 
          className="absolute -top-10 -left-16 w-[480px] h-[260px] opacity-70 animate-float-cloud-slow pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.4) 60%, rgba(255, 255, 255, 0) 80%)',
            filter: 'blur(22px)',
          }}
        />
        <div 
          className="absolute -bottom-10 right-[5%] w-[500px] h-[240px] opacity-65 animate-float-cloud-medium pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.3) 65%, rgba(255, 255, 255, 0) 85%)',
            filter: 'blur(26px)',
          }}
        />
      </div>

      {/* Animated Multi-colored Drifting Sky Dots (matching reference image) */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {SKY_DOTS.map((dot) => (
          <div
            key={dot.id}
            className="absolute rounded-full shadow-sm"
            style={{
              top: dot.top,
              left: dot.left,
              width: `${dot.size}px`,
              height: `${dot.size}px`,
              backgroundColor: dot.color,
              boxShadow: `0 2px 8px ${dot.color}40`,
              animation: `driftDot ${dot.duration} infinite ease-in-out`,
              animationDelay: dot.delay,
            }}
          />
        ))}
      </div>

      {/* Main Page Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        {children}
      </div>
    </div>
  );
};
