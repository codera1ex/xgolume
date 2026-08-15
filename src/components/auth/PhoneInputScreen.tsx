import React, { useState } from 'react';
import { Phone, ChevronDown, Check, Search } from 'lucide-react';
import { COUNTRIES } from '../../data/countries';
import { CountryCode } from '../../types/auth-types';

interface PhoneInputScreenProps {
  appName?: string;
  onRequestOtp: (phoneNumber: string, country: CountryCode) => void;
  // Triggers the real Google OAuth redirect (supabase.auth.signInWithOAuth).
  // The browser leaves the page, so there's nothing to pass back here.
  onGoogleLogin: () => void;
  googleError?: string | null;
}

export const PhoneInputScreen: React.FC<PhoneInputScreenProps> = ({
  appName = 'Welcome to GoLumo',
  onRequestOtp,
  onGoogleLogin,
  googleError,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRIES[0]); // India (+91)
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // Filter countries by search query
  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dialCode.includes(countrySearch) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Clean formatted phone number digits
  const rawDigits = phoneNumber.replace(/\D/g, '');
  const isValidNumber = rawDigits.length >= 8 && rawDigits.length <= 12;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow digits, spaces, hyphens
    if (/^[\d\s-]*$/.test(value)) {
      setPhoneNumber(value);
    }
  };

  const handleRequestOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidNumber) {
      const fullPhone = `${selectedCountry.dialCode} ${phoneNumber.trim()}`;
      onRequestOtp(fullPhone, selectedCountry);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center">
      {/* Main Title Above Panel */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-800 drop-shadow-sm font-sans">
          {appName}
        </h1>
      </div>

      {/* Floating Translucent Frosted Glass Panel */}
      <div className="glass-panel w-full rounded-3xl p-6 sm:p-8 relative overflow-hidden transition-all duration-300">
        
        {/* Panel Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Get Started
          </h2>
          <p className="mt-1 text-sm text-slate-600 font-medium">
            Sign in to your account or create a new one to continue.
          </p>
        </div>

        {/* Phone Number Form */}
        <form onSubmit={handleRequestOtpSubmit} className="space-y-4">
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Mobile Number
            </label>
            
            <div className="glass-input flex items-center rounded-2xl p-1.5 transition-all">
              {/* Country Code Dropdown Trigger */}
              <button
                type="button"
                onClick={() => setIsCountryMenuOpen(!isCountryMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-2 text-slate-800 font-semibold text-sm hover:bg-white/50 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <span className="text-lg leading-none">{selectedCountry.flag}</span>
                <span>{selectedCountry.dialCode}</span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              <div className="h-6 w-[1px] bg-slate-300/60 mx-1 shrink-0" />

              {/* Phone Input Box */}
              <div className="relative flex-1 flex items-center pl-2 pr-3">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="Enter your mobile number"
                  className="w-full bg-transparent text-slate-900 placeholder-slate-400 font-medium text-base outline-none py-2"
                  autoFocus
                />
                <Phone className="w-4 h-4 text-slate-400 ml-2 shrink-0 pointer-events-none" />
              </div>
            </div>

            {/* Country Selector Glass Dropdown */}
            {isCountryMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-white/90 backdrop-blur-xl border border-white/80 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                  <Search className="w-4 h-4 text-slate-400 ml-2" />
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search country or code..."
                    className="w-full bg-transparent text-xs text-slate-800 outline-none py-1.5"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto p-1 divide-y divide-slate-100/50">
                  {filteredCountries.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(c);
                        setIsCountryMenuOpen(false);
                        setCountrySearch('');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl hover:bg-blue-50/80 transition-colors text-left ${
                        selectedCountry.code === c.code ? 'bg-blue-100/60 font-semibold text-blue-900' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{c.flag}</span>
                        <span>{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500">{c.dialCode}</span>
                        {selectedCountry.code === c.code && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                    </button>
                  ))}
                  {filteredCountries.length === 0 && (
                    <p className="p-3 text-center text-xs text-slate-400">No countries found</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Request OTP CTA Button */}
          <button
            type="submit"
            disabled={!isValidNumber}
            className={`w-full py-3.5 px-4 rounded-2xl font-semibold text-sm transition-all duration-200 shadow-md ${
              isValidNumber
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 active:scale-[0.99] cursor-pointer'
                : 'bg-slate-300/80 text-slate-500 cursor-not-allowed shadow-none'
            }`}
          >
            Request OTP
          </button>
        </form>

        {/* OR Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="w-full border-t border-slate-300/60" />
          <span className="absolute bg-white/60 backdrop-blur-md px-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest rounded-full border border-white/80">
            OR
          </span>
        </div>

        {googleError && (
          <p className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-center">
            {googleError}
          </p>
        )}

        {/* Google Login Button */}
        <button
          type="button"
          onClick={onGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white/80 hover:bg-white border border-white/90 text-slate-700 font-semibold text-sm py-3 px-4 rounded-2xl shadow-sm hover:shadow transition-all duration-200 active:scale-[0.99] cursor-pointer"
        >
          {/* Multi-colored Google G Icon */}
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29c-.82 1.62-1.29 3.45-1.29 5.42s.47 3.8 1.29 5.42l3.99-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Footer Text */}
        <p className="mt-6 text-center text-[11px] text-slate-500 font-medium leading-relaxed">
          By continuing, you agree to our{' '}
          <button
            type="button"
            onClick={() => setShowPolicyModal(true)}
            className="text-blue-600 underline font-semibold hover:text-blue-800"
          >
            Terms of Service
          </button>{' '}
          and{' '}
          <button
            type="button"
            onClick={() => setShowPolicyModal(true)}
            className="text-blue-600 underline font-semibold hover:text-blue-800"
          >
            Privacy Policy
          </button>.
        </p>
      </div>

      {/* Terms & Privacy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl border border-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Terms & Privacy Policy</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-h-60 overflow-y-auto pr-1">
              Welcome to GoLumo. By logging in via Mobile OTP or Google Single Sign-On, you agree to our security practices. OTP tokens remain valid for exactly 2 minutes (120 seconds) from issuance. Personal data is encrypted in transit and at rest.
            </p>
            <button
              type="button"
              onClick={() => setShowPolicyModal(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
