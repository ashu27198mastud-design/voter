'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ConfirmationResult, ApplicationVerifier } from 'firebase/auth';
import { initRecaptcha, sendPhoneOtp } from '@/lib/auth';

interface PhoneAuthProps {
  onSuccess: (user: any) => void;
  onCancel: () => void;
}

type AuthStep = 'PHONE_INPUT' | 'OTP_INPUT' | 'VERIFYING' | 'SUCCESS';

export const PhoneAuth: React.FC<PhoneAuthProps> = ({ onSuccess, onCancel }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<AuthStep>('PHONE_INPUT');
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const appVerifierRef = useRef<ApplicationVerifier | null>(null);

  useEffect(() => {
    if (!appVerifierRef.current && step === 'PHONE_INPUT') {
      const verifier = initRecaptcha('recaptcha-container');
      if (verifier) {
        appVerifierRef.current = verifier;
      }
    }
  }, [step]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !appVerifierRef.current) return;

    setError(null);
    setStep('VERIFYING');

    try {
      // Ensure phone number has + and country code
      const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const result = await sendPhoneOtp(formattedNumber, appVerifierRef.current);
      setConfirmationResult(result);
      setStep('OTP_INPUT');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send OTP. Please try again.');
      setStep('PHONE_INPUT');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !confirmationResult) return;

    setError(null);
    setStep('VERIFYING');

    try {
      const result = await confirmationResult.confirm(otp);
      setStep('SUCCESS');
      onSuccess(result.user);
    } catch (err: any) {
      console.error(err);
      setError('Invalid code. Please check and try again.');
      setStep('OTP_INPUT');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative">
      {/* Invisible Recaptcha */}
      <div id="recaptcha-container"></div>

      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 'OTP_INPUT' ? 'Verify your number' : 'Sign in with Phone'}
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            {step === 'OTP_INPUT' 
              ? `We've sent a code to ${phoneNumber}` 
              : 'Enter your phone number to receive a secure code.'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <form onSubmit={step === 'OTP_INPUT' ? handleVerifyOtp : handleSendOtp} className="space-y-4">
          {step === 'OTP_INPUT' ? (
            <div className="space-y-4">
              <div className="flex justify-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={otp.length !== 6 || step === 'VERIFYING' as any}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {step === 'VERIFYING' ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Verify Code'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">+</span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d+]/g, ''))}
                  placeholder="1 555 000 0000"
                  className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-lg"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={phoneNumber.length < 10 || step === 'VERIFYING' as any}
                className="w-full py-3 bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white font-semibold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {step === 'VERIFYING' ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Send Security Code'}
              </button>
            </div>
          )}
        </form>

        <button
          onClick={onCancel}
          className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
        >
          Cancel and go back
        </button>
      </div>

      {/* Decorative background element */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
    </div>
  );
};
