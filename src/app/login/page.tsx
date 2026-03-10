'use client';

import { useState } from 'react';
import { Eye, EyeOff, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }

        setIsLoading(true);

        const { error: signInError } = await createClient().auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            setError(signInError.message);
            setIsLoading(false);
            return;
        }

        // Determine the correct destination based on role + onboarding status
        const res = await fetch('/api/auth/post-login');
        const { redirectTo } = await res.json();
        window.location.href = redirectTo;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center selection:bg-[#2eb781]/30 selection:text-gray-900">
            <div className="relative z-10 w-full max-w-md px-6 py-12">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-10">
                    <div className="h-10 w-10 bg-[#2eb781] rounded-xl flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-gray-900">Quest</span>
                </div>

                {/* Card */}
                <div className="relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold mb-2 text-gray-900">Welcome back</h1>
                        <p className="text-gray-500 text-sm">Sign in to your Quest account to continue.</p>
                    </div>

                    {error && (
                        <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <div className="relative">
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <a
                                    href="#"
                                    className="text-xs text-[#2eb781] hover:text-[#28a172] transition-colors"
                                >
                                    Forgot password?
                                </a>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 pr-12 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember me */}
                        <div className="flex items-center gap-3 mt-4">
                            <input
                                id="remember"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 bg-white accent-[#2eb781] cursor-pointer"
                            />
                            <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer select-none">
                                Remember me for 30 days
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group w-full flex items-center justify-center gap-2 px-6 py-3 mt-2 bg-[#2eb781] hover:bg-[#28a172] text-white disabled:opacity-60 disabled:cursor-not-allowed rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Signing in…
                                </>
                            ) : (
                                <>
                                    Sign in
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="mt-8 text-center text-xs text-gray-500">
                    &copy; {new Date().getFullYear()} Quest. All rights reserved.
                </p>
            </div>
        </div>
    );
}
