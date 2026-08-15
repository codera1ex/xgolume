import React, { useState } from 'react';
import { SkyBackground } from './SkyBackground';
import { PhoneInputScreen } from './PhoneInputScreen';
import { OtpVerificationScreen } from './OtpVerificationScreen';
import { AuthStep, CountryCode, UserProfile as AuthUserProfile } from '../../types/auth-types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

// Helper used only in local demo mode (no Supabase keys configured yet)
function generateRandomOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

interface AuthScreenProps {
  // Called once the user has verified (phone+OTP or, in demo mode, the
  // fake Google login). The parent app (src/App.tsx) uses this to
  // create/update the GoLumo profile and move on to the Home screen.
  // Not used for the real Google OAuth path — that's a full page redirect,
  // handled by src/App.tsx checking supabase.auth.getSession() on load.
  onAuthenticated: (profile: AuthUserProfile) => void;
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [authStep, setAuthStep] = useState<AuthStep>('phone-input');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [otpRequestError, setOtpRequestError] = useState<string | null>(null);

  // --- Local demo mode (used only when Supabase env vars aren't set) ---
  const [demoGeneratedOtp, setDemoGeneratedOtp] = useState<string>(generateRandomOtp());

  // Handle Phone Number Submit -> send OTP -> go to OTP screen
  const handleRequestOtp = async (phone: string, _country: CountryCode) => {
    setPhoneNumber(phone);
    setOtpRequestError(null);

    if (!isSupabaseConfigured) {
      // Demo mode: "send" a locally generated OTP (nothing actually goes
      // out over SMS since there's no backend configured yet)
      setDemoGeneratedOtp(generateRandomOtp());
      setAuthStep('otp-verify');
      return;
    }

    const { error } = await supabase!.auth.signInWithOtp({
      phone: phone.replace(/\s+/g, '')
    });

    if (error) {
      setOtpRequestError(
        error.message.includes('provider')
          ? 'SMS provider not set up yet in Supabase (add Twilio under Authentication → Providers → Phone).'
          : error.message
      );
      return;
    }

    setAuthStep('otp-verify');
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (!isSupabaseConfigured) {
      setDemoGeneratedOtp(generateRandomOtp());
      return;
    }
    await supabase!.auth.signInWithOtp({ phone: phoneNumber.replace(/\s+/g, '') });
  };

  // Verifies the code the user typed. Real Supabase verification when
  // configured; local string comparison in demo mode.
  const handleVerifyOtp = async (otp: string): Promise<{ success: boolean; message?: string }> => {
    if (!isSupabaseConfigured) {
      if (otp === demoGeneratedOtp) return { success: true };
      return { success: false, message: 'Invalid OTP code! Please check and try again.' };
    }

    const { data, error } = await supabase!.auth.verifyOtp({
      phone: phoneNumber.replace(/\s+/g, ''),
      token: otp,
      type: 'sms'
    });

    if (error || !data.session) {
      return { success: false, message: error?.message || 'Invalid or expired code.' };
    }
    return { success: true };
  };

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setGoogleError(null);

    if (!isSupabaseConfigured) {
      // Demo mode: sign the user straight in with a fake profile
      onAuthenticated({
        id: `google-demo-${Date.now()}`,
        email: 'demo.user@gmail.com',
        displayName: 'Demo User',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
        loginMethod: 'google',
        verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sessionId: `GO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
      });
      return;
    }

    // Real Google OAuth: this redirects the whole page to Google, then back
    // to this app. src/App.tsx picks up the resulting session on load.
    const { error } = await supabase!.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });

    if (error) {
      setGoogleError(
        error.message.includes('provider')
          ? 'Google sign-in not set up yet in Supabase (add it under Authentication → Providers → Google).'
          : error.message
      );
    }
  };

  // OTP Success -> pull the now-authenticated Supabase user and hand off
  // to the parent app (works for both demo mode and real mode)
  const handleOtpVerifySuccess = async () => {
    if (!isSupabaseConfigured) {
      onAuthenticated({
        id: `phone-demo-${Date.now()}`,
        phoneNumber,
        displayName: `User (${phoneNumber.slice(-4)})`,
        loginMethod: 'phone',
        verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sessionId: `OTP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
      });
      return;
    }

    const { data } = await supabase!.auth.getUser();
    const user = data.user;

    onAuthenticated({
      id: user?.id || `phone-${Date.now()}`,
      phoneNumber: user?.phone || phoneNumber,
      displayName: user?.phone ? `User (${user.phone.slice(-4)})` : 'GoLumo User',
      loginMethod: 'phone',
      verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sessionId: user?.id || `OTP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
    });
  };

  return (
    <SkyBackground>
      <main className="w-full">
        {authStep === 'phone-input' && (
          <>
            {otpRequestError && (
              <p className="mb-3 max-w-md mx-auto text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-center">
                {otpRequestError}
              </p>
            )}
            <PhoneInputScreen
              appName="Welcome to GoLumo"
              onRequestOtp={handleRequestOtp}
              onGoogleLogin={handleGoogleLogin}
              googleError={googleError}
            />
          </>
        )}

        {authStep === 'otp-verify' && (
          <OtpVerificationScreen
            phoneNumber={phoneNumber}
            onVerifyOtp={handleVerifyOtp}
            onVerifySuccess={handleOtpVerifySuccess}
            onResendOtp={handleResendOtp}
            onBackToPhone={() => setAuthStep('phone-input')}
          />
        )}
      </main>
    </SkyBackground>
  );
}
