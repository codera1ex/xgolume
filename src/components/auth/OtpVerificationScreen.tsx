import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck, Sparkles, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundFx } from '../../utils/audio';

interface OtpVerificationScreenProps {
  phoneNumber: string;
  // Verifies the entered code against the real backend (Supabase Auth).
  // Resolves to `{ success: true }` on a valid code, or
  // `{ success: false, message }` with a human-readable reason otherwise.
  onVerifyOtp: (otp: string) => Promise<{ success: boolean; message?: string }>;
  onVerifySuccess: (otp: string) => void;
  onResendOtp: () => void;
  onBackToPhone: () => void;
}

const OTP_LENGTH = 6;
const OTP_VALIDITY_SECONDS = 120; // 2 Minutes
const RESEND_COOLDOWN_SECONDS = 25;

export const OtpVerificationScreen: React.FC<OtpVerificationScreenProps> = ({
  phoneNumber,
  onVerifyOtp,
  onVerifySuccess,
  onResendOtp,
  onBackToPhone,
}) => {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [activeBoxIndex, setActiveBoxIndex] = useState(0);
  const [validitySecondsLeft, setValiditySecondsLeft] = useState(OTP_VALIDITY_SECONDS);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(RESEND_COOLDOWN_SECONDS);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isMuted, setIsMuted] = useState(soundFx.getIsMuted());
  // Verification animation phase: 'idle' | 'merging' | 'verified'
  const [verificationPhase, setVerificationPhase] = useState<'idle' | 'merging' | 'verified'>('idle');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleToggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  const playKeypressSound = () => soundFx.playKeyPress();
  const playErrorSound = () => soundFx.playError();
  const playCelebrationChime = () => soundFx.playSuccessChime();

  // Mask phone number: e.g., "+91 98•• ••• 10" or "+91 98765 43210" -> "+91 98•• ••• 10"
  const getMaskedPhone = (phone: string) => {
    if (!phone) return '+91 98•• ••• 10';
    const parts = phone.split(' ');
    if (parts.length >= 2) {
      const code = parts[0];
      const rest = parts.slice(1).join('').replace(/\D/g, '');
      if (rest.length >= 8) {
        return `${code} ${rest.substring(0, 2)}•• ••• ${rest.substring(rest.length - 2)}`;
      }
    }
    return phone;
  };

  // Trigger Phone Vibration
  const triggerVibration = (pattern: number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (err) {
        // Ignore if unsupported or restricted in container
      }
    }
  };

  // Auto-verify as soon as the 6th digit is typed or pasted!
  useEffect(() => {
    const fullOtp = digits.join('');
    if (
      fullOtp.length === OTP_LENGTH &&
      !isVerifying &&
      verificationPhase === 'idle'
    ) {
      handleVerify(fullOtp);
    }
  }, [digits, isVerifying, verificationPhase]);

  // 2-Minute Validity Timer Countdown
  useEffect(() => {
    if (validitySecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setValiditySecondsLeft((prev) => {
        if (prev <= 1) {
          setIsError(true);
          setErrorMessage('OTP expired! Please request a new code.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [validitySecondsLeft]);

  // Resend Cooldown Countdown
  useEffect(() => {
    if (resendCooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setResendCooldownSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldownSeconds]);

  // Format seconds as MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle input change
  const handleDigitChange = (index: number, value: string) => {
    setIsError(false);
    setErrorMessage('');

    // Handle backspace or single digit input
    const cleaned = value.replace(/\D/g, '');
    const newDigits = [...digits];

    if (cleaned.length > 0) {
      // Pick last character if user typed multiple in one field
      newDigits[index] = cleaned[cleaned.length - 1];
      setDigits(newDigits);
      soundFx.playKeyPress();

      // Auto-focus next box if available
      if (index < OTP_LENGTH - 1) {
        setActiveBoxIndex(index + 1);
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      // Empty digit
      newDigits[index] = '';
      setDigits(newDigits);
      soundFx.playKeyPress();
    }
  };

  // Handle keydown for backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      soundFx.playKeyPress();
      if (!digits[index] && index > 0) {
        setActiveBoxIndex(index - 1);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Handle Paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pastedData) {
      const newDigits = Array(OTP_LENGTH).fill('');
      for (let i = 0; i < pastedData.length; i++) {
        newDigits[i] = pastedData[i];
      }
      setDigits(newDigits);
      const nextIndex = Math.min(pastedData.length, OTP_LENGTH - 1);
      setActiveBoxIndex(nextIndex);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  // Resend Handler
  const handleResend = () => {
    onResendOtp();
    setDigits(Array(OTP_LENGTH).fill(''));
    setActiveBoxIndex(0);
    setValiditySecondsLeft(OTP_VALIDITY_SECONDS); // Reset 2 minutes
    setResendCooldownSeconds(RESEND_COOLDOWN_SECONDS); // Reset cooldown
    setIsError(false);
    setErrorMessage('');
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  };

  // Submit & Verify
  const handleVerify = (customOtp?: string | React.FormEvent) => {
    let fullOtp = '';
    if (typeof customOtp === 'string') {
      fullOtp = customOtp;
    } else if (customOtp && 'preventDefault' in customOtp) {
      customOtp.preventDefault();
      fullOtp = digits.join('');
    } else {
      fullOtp = digits.join('');
    }

    if (validitySecondsLeft <= 0) {
      setIsError(true);
      setErrorMessage('OTP expired! Please click "Resend Code" to get a fresh OTP.');
      triggerVibration([120, 60, 120, 60, 200]);
      return;
    }

    if (fullOtp.length !== OTP_LENGTH) {
      setIsError(true);
      setErrorMessage('Please enter all 6 digits.');
      triggerVibration([120, 60, 120, 60, 200]);
      return;
    }

    setIsVerifying(true);

    onVerifyOtp(fullOtp).then(({ success, message }) => {
      if (success) {
        // Phase 1: All 6 boxes move up and collapse together in the center ("upr aake bhich me aa jae")
        setVerificationPhase('merging');
        triggerVibration([80, 50, 120]);

        // Phase 2: After 450ms, morph into glowing green Checkmark ("tick ka sign bane aur like number verified")
        setTimeout(() => {
          setVerificationPhase('verified');

          // Trigger celebratory confetti
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#60a5fa', '#34d399', '#a78bfa', '#fbbf24'],
          });

          // Final delay to let user enjoy "Number Verified" tick mark animation before transitioning to app
          setTimeout(() => {
            onVerifySuccess(fullOtp);
          }, 1200);
        }, 450);
      } else {
        setIsVerifying(false);
        setIsError(true);
        setErrorMessage(message || 'Invalid OTP code! Please check and try again.');
        triggerVibration([120, 60, 120, 60, 200]);
      }
    });
  };

  // Percentage of 2-minute validity remaining
  const validityPercent = Math.max(0, (validitySecondsLeft / OTP_VALIDITY_SECONDS) * 100);

  // Position offsets for the 6-box organic hexagonal cluster layout (like image_24.png extended to 6 boxes)
  // Box positions in relative pixel/percentage offsets over a circular light ring path
  const BOX_POSITIONS = [
    { top: '0px', left: '10px' },      // Top Left
    { top: '-20px', left: '110px' },  // Top Center (elevated)
    { top: '0px', left: '210px' },     // Top Right
    { top: '80px', left: '230px' },    // Bottom Right
    { top: '95px', left: '110px' },    // Bottom Center (lowered)
    { top: '80px', left: '-10px' },    // Bottom Left
  ];

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center">
      {/* Back Button & Main Title Above Panel */}
      <div className="w-full flex items-center justify-between mb-4 px-2">
        <button
          type="button"
          onClick={onBackToPhone}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-white/60 hover:bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/80 shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Change Number</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={isMuted ? "Unmute sound effects" : "Mute sound effects"}
            className="p-1.5 rounded-full bg-white/60 hover:bg-white/80 backdrop-blur-md border border-white/80 shadow-sm text-slate-700 hover:text-blue-700 transition-all cursor-pointer"
            title={isMuted ? "Audio muted (Click to unmute)" : "Audio enabled (Click to mute)"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-blue-600" />}
          </button>

          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-900 bg-blue-100/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            Valid for 2 min
          </span>
        </div>
      </div>

      <div className="mb-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-800 drop-shadow-sm font-sans">
          Verify Your Number
        </h1>
      </div>

      {/* Real SMS is sent via Supabase/Twilio — no demo code shown here. */}
      <div className="w-full mb-4 bg-white/80 backdrop-blur-xl border border-blue-200/70 rounded-2xl p-3 shadow-sm flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-blue-600" />
        </div>
        <p className="text-xs text-slate-600">
          We've sent a 6-digit code to your phone via SMS. Enter it below to continue.
        </p>
      </div>

      {/* Floating Translucent Frosted Glass Panel */}
      <div className="glass-panel w-full rounded-3xl p-6 sm:p-8 relative overflow-hidden transition-all duration-300">
        {verificationPhase === 'verified' ? (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-5 animate-scale-in-check">
            {/* Large Glowing Green Checkmark Icon */}
            <div className="relative flex items-center justify-center my-2">
              <div className="absolute -inset-4 rounded-full bg-emerald-500/25 blur-2xl animate-pulse" />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-1 shadow-2xl shadow-emerald-500/40 flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-emerald-500 flex items-center justify-center text-white border-2 border-white/80 shadow-inner">
                  <CheckCircle2 className="w-14 h-14 sm:w-16 sm:h-16 stroke-[2.2] text-white drop-shadow-md" />
                </div>
              </div>
            </div>

            {/* Verified Title */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                Number Verified!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xs mx-auto">
                Your phone number <span className="font-bold text-slate-900 font-mono">{phoneNumber}</span> has been authenticated successfully.
              </p>
            </div>

            {/* Security Pill */}
            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Redirecting to GoLumo...</span>
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Panel Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                Confirm Your Account
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 font-medium">
                We sent a 6-digit code to{' '}
                <span className="font-bold text-slate-900 font-mono">
                  {getMaskedPhone(phoneNumber)}
                </span>
              </p>

              {/* 2-Minute Validity Progress Meter */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <div className="w-32 sm:w-44 h-1.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5 border border-white/60">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      validitySecondsLeft < 30 ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${validityPercent}%` }}
                  />
                </div>
                <span className={`font-mono text-xs font-bold ${validitySecondsLeft < 30 ? 'text-amber-600' : 'text-slate-600'}`}>
                  {formatTime(validitySecondsLeft)}
                </span>
              </div>
            </div>

            {/* Refined Graphical OTP Input Cluster (Hexagonal Connected 6-Box Pattern) */}
            <div className="my-8 flex flex-col items-center justify-center">
              
              {/* Desktop/Tablet Organic Interconnected Hexagonal Cluster Container */}
              <div className="relative w-[290px] sm:w-[320px] h-[160px] hidden sm:flex items-center justify-center select-none">
                
                {/* Soft Glowing Integrated Light Path Ring & Connecting Arcs (like image_24.png) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 160">
                  <defs>
                    <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                      <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.6" />
                    </linearGradient>
                    <filter id="softGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Central Glowing Ring Path connecting the boxes */}
                  <ellipse
                    cx="160"
                    cy="80"
                    rx="110"
                    ry="45"
                    fill="none"
                    stroke="url(#glowGradient)"
                    strokeWidth="2"
                    filter="url(#softGlowFilter)"
                    strokeDasharray="6 4"
                    className="opacity-70"
                  />

                  {/* Connected node light paths between boxes */}
                  <path
                    d="M 40,30 Q 160,-10 280,30 Q 300,80 280,120 Q 160,150 40,120 Q 20,80 40,30 Z"
                    fill="none"
                    stroke="rgba(147, 197, 253, 0.4)"
                    strokeWidth="1.5"
                  />
                </svg>

                {/* 6 Interconnected Translucent OTP Boxes */}
                {digits.map((digit, index) => {
                  const isActive = activeBoxIndex === index;
                  const isFilled = Boolean(digit);
                  const pos = BOX_POSITIONS[index];

                  return (
                    <div
                      key={index}
                      style={{ top: pos.top, left: pos.left }}
                      className={`absolute w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        isError
                          ? 'otp-box-error animate-jiggle'
                          : isActive
                          ? 'otp-box-active scale-110 z-20'
                          : isFilled
                          ? 'otp-box-filled scale-105 z-10'
                          : 'otp-box hover:scale-105'
                      }`}
                    >
                      <input
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onFocus={() => setActiveBoxIndex(index)}
                        onChange={(e) => handleDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className="w-full h-full text-center font-mono font-bold text-xl text-slate-800 bg-transparent outline-none caret-blue-600"
                      />

                      {/* Internal Glow Dot when active */}
                      {isActive && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Responsive Compact Row for Mobile Screens */}
              <div className="flex sm:hidden items-center justify-center gap-2 w-full max-w-xs">
                {digits.map((digit, index) => {
                  const isActive = activeBoxIndex === index;
                  const isFilled = Boolean(digit);

                  return (
                    <div
                      key={index}
                      className={`w-11 h-13 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                        isError
                          ? 'otp-box-error animate-jiggle'
                          : isActive
                          ? 'otp-box-active scale-105 z-20'
                          : isFilled
                          ? 'otp-box-filled z-10'
                          : 'otp-box'
                      }`}
                    >
                      <input
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onFocus={() => setActiveBoxIndex(index)}
                        onChange={(e) => handleDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className="w-full h-full text-center font-mono font-bold text-lg text-slate-800 bg-transparent outline-none"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Error Message Display */}
              {errorMessage && (
                <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50/90 border border-red-200 px-3 py-1.5 rounded-xl animate-in fade-in duration-200">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* CTA Verify Button */}
            <button
              type="button"
              onClick={() => handleVerify()}
              disabled={digits.join('').length !== OTP_LENGTH || validitySecondsLeft <= 0 || isVerifying}
              className={`w-full py-3.5 px-4 rounded-2xl font-semibold text-sm transition-all duration-200 shadow-md ${
                digits.join('').length === OTP_LENGTH && validitySecondsLeft > 0 && !isVerifying
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 active:scale-[0.99] cursor-pointer'
                  : 'bg-slate-300/80 text-slate-500 cursor-not-allowed shadow-none'
              }`}
            >
              {isVerifying ? 'Verifying OTP...' : 'Verify and Login'}
            </button>

            {/* Resend Cooldown / Trigger Text */}
            <div className="mt-5 text-center">
              {resendCooldownSeconds > 0 ? (
                <p className="text-xs text-slate-600 font-medium">
                  Didn't receive the code?{' '}
                  <span className="font-bold text-slate-800">
                    Resend in {resendCooldownSeconds}s
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Resend Code</span>
                </button>
              )}
            </div>

            {/* Security Shield Badge */}
            <div className="mt-6 pt-4 border-t border-slate-200/50 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-bit Encrypted OTP Authentication</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
