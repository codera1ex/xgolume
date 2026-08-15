import React, { useEffect } from 'react';

interface OnboardingGateProps {
  onComplete: () => void;
}

// Shows the illustrated 3-slide onboarding (public/onboarding.html) in an
// iframe and listens for the postMessage it sends once the user taps
// "Get Started" (or "Skip").
export default function OnboardingGate({ onComplete }: OnboardingGateProps) {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'golumo:onboarding-complete') {
        onComplete();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onComplete]);

  return (
    <iframe
      src="/onboarding.html"
      style={{
        width: '100vw',
        height: '100vh',
        border: 'none',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        display: 'block'
      }}
      title="GoLumo Onboarding"
    />
  );
}
