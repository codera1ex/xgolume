export interface CountryCode {
  name: string;
  code: string;
  flag: string;
  dialCode: string;
  format: string;
}

export type AuthStep = 'phone-input' | 'otp-verify' | 'authenticated';

export type LoginMethod = 'phone' | 'google';

export interface UserProfile {
  id: string;
  phoneNumber?: string;
  email?: string;
  displayName: string;
  avatarUrl?: string;
  loginMethod: LoginMethod;
  verifiedAt: string;
  sessionId: string;
}

export interface GoogleAccount {
  name: string;
  email: string;
  avatarUrl: string;
}
