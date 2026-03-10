'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SeedUserPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

    const handleSeed = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!email || !password) {
            setMessage({ type: 'error', text: 'Please fill in all fields.' });
            return;
        }

        setIsLoading(true);

        const supabase = createClient();

        // Sign up the user and assign them 'manager' access in user_metadata
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: 'manager'
                }
            }
        });

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: 'Manager user successfully seeded! You can now log in.' });
            setEmail('');
            setPassword('');
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-8">
                    <div className="h-10 w-10 bg-[#2eb781] rounded-xl flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">Seed Manager</span>
                </div>

                <p className="text-sm text-gray-500 mb-6">
                    Use this tool to create a test user with built-in Manager access in the system metadata.
                </p>

                {message && (
                    <div className={`mb-6 px-4 py-3 rounded-lg border text-sm ${message.type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSeed} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] outline-none transition-all text-sm"
                            placeholder="admin@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] outline-none transition-all text-sm"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#2eb781] hover:bg-[#28a172] text-white disabled:opacity-60 rounded-xl font-semibold text-sm transition-all"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Seed User</>}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                    <Link href="/login" className="text-sm text-[#2eb781] hover:underline font-medium">
                        &larr; Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
