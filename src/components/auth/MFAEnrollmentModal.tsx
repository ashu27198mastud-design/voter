'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ApplicationVerifier } from 'firebase/auth';
import { initRecaptcha, startMfaEnrollment, finishMfaEnrollment } from '@/lib/auth';

interface MFAEnrollmentModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

type EnrollmentStep = 'PHONE_INPUT' | 'OTP_INPUT' | 'SUCCESS';

export const MFAEnrollmentModal: React.FC<MFAEnrollmentModalProps> = ({ onSuccess, onCancel }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<EnrollmentStep>('PHONE_INPUT');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  
  const appVerifierRef = useRef<ApplicationVerifier | null>(null);

  useEffect(() => {
    // Initialize recaptcha when modal opens
    if (!appVerifierRef.current && step === 'PHONE_INPUT') {
      const verifier = initRecaptcha('mfa-recaptcha-container');
      if (verifier) {
        appVerifierRef.current = verifier;
      }
    }
  }, [step]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !appVerifierRef.current) return;

    setError(null);
    setIsLoading(true);

    try {
      const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const vid = await startMfaEnrollment(formattedNumber, appVerifierRef.current);
      setVerificationId(vid);
      setStep('OTP_INPUT');
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Failed to send OTP. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !verificationId) return;

    setError(null);
    setIsLoading(true);

    try {
      await finishMfaEnrollment(verificationId, otp);
      setStep('SUCCESS');
      setTimeout(() => onSuccess(), 1500);
    } catch (err) {
      console.error(err);
      setError('Invalid code or session expired. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative border border-gray-100">
        {/* Invisible Recaptcha */}
        <div id="mfa-recaptcha-container"></div>

        <div className="p-8">
          {step === 'SUCCESS' ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 animate-bounce">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">MFA Enabled!</h2>
              <p className="text-gray-500 text-sm">Your account is now more secure.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {step === 'OTP_INPUT' ? 'Enter Code' : 'Enable MFA'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {step === 'OTP_INPUT' 
                      ? `We sent a code to your phone` 
                      : 'Secure your account with two-factor authentication.'}
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={onCancel}
                  aria-label="Close modal"
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div 
                  role="alert"
                  aria-live="assertive"
                  className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl flex items-center gap-2"
                >
                   <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   {error}
                </div>
              )}

              <form onSubmit={step === 'OTP_INPUT' ? handleVerifyOtp : handleSendOtp} className="space-y-4">
                {step === 'OTP_INPUT' ? (
                  <div className="space-y-2">
                    <label htmlFor="mfa-otp-code" className="sr-only">Verification code</label>
                    <input
                      id="mfa-otp-code"
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit code"
                      className="w-full px-5 py-4 text-center text-3xl tracking-[0.5em] font-mono border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all bg-gray-50 focus:bg-white"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label htmlFor="mfa-phone-number" className="sr-only">Phone number for MFA</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg" aria-hidden="true">+</span>
                      <input
                        id="mfa-phone-number"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d+]/g, ''))}
                        placeholder="Country Code + Phone"
                        className="w-full pl-8 pr-4 py-4 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-lg bg-gray-50 focus:bg-white"
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || (step === 'PHONE_INPUT' && phoneNumber.length < 10) || (step === 'OTP_INPUT' && otp.length !== 6)}
                  className="w-full py-4 bg-gray-900 hover:bg-black disabled:bg-gray-200 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
                >
                  {isLoading ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true"></div>
                      <span className="sr-only">Processing...</span>
                    </>
                  ) : step === 'OTP_INPUT' ? 'Enable Security' : 'Send Code'}
                </button>
              </form>
            </div>
          )}
        </div>
        
        {/* Progress indicator */}
        <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-500" style={{ width: step === 'PHONE_INPUT' ? '33%' : step === 'OTP_INPUT' ? '66%' : '100%' }}></div>
      </div>
    </div>
  );
};
