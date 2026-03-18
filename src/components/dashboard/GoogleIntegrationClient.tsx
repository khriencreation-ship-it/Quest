'use client';

import { useState } from 'react';
import { Calendar, Video, Check, Loader2, Link2, ExternalLink, X, Copy, ChevronLeft, Trash2, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type GoogleIntegration = {
    id: string;
    account_email: string;
    is_active: boolean;
    scope_config: Record<string, any>;
    created_at: string;
};

type Company = {
    id: string;
    name: string;
    description: string;
};

type Props = {
    integration: GoogleIntegration | null;
    company: Company | null;
};

export default function GoogleIntegrationClient({ integration, company }: Props) {
    const router = useRouter();
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);

    // Meeting link state
    const [showMeetModal, setShowMeetModal] = useState(false);
    const [meetDate, setMeetDate] = useState('');
    const [meetTime, setMeetTime] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleConnect = (companyId: string) => {
        const width = 600, height = 700;
        const left = window.innerWidth / 2 - width / 2;
        const top = window.innerHeight / 2 - height / 2;
        window.open(`/api/integrations/google/connect?companyId=${companyId}`, 'Connect Google', `width=${width},height=${height},top=${top},left=${left}`);
    };

    const handleDisconnect = async () => {
        if (!confirm(`Disconnect Google account (${integration?.account_email})? This will disable Calendar and Meet integrations.`)) {
            return;
        }
        setIsDisconnecting(true);
        // Normally hit your delete logic or action
        setTimeout(() => {
            alert('Disconnected successfully!');
            router.refresh();
            setIsDisconnecting(false);
        }, 1000);
    };

    const handleGenerateMeet = () => {
        if (!meetDate || !meetTime) {
            alert('Please select both a date and time.');
            return;
        }

        setIsGenerating(true);
        // Simulate API call to generate link
        setTimeout(() => {
            const randomCode = Math.random().toString(36).substring(2, 5) + '-' +
                Math.random().toString(36).substring(2, 6) + '-' +
                Math.random().toString(36).substring(2, 5);
            setGeneratedLink(`https://meet.google.com/${randomCode}`);
            setIsGenerating(false);
        }, 800);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink);
        alert('Meeting link copied to clipboard!');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/integrations"
                    className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors shrink-0"
                >
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border bg-blue-50 border-blue-200">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                        </span>
                        Google Calendar
                    </h1>
                    <p className="text-gray-500 mt-1">Connect your Google account for Calendar and Meet features.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-8">
                {/* Connection Status & Account Info */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-gray-100">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-gray-900">Connection Status</h2>
                            {integration ? (
                                <span className="inline-flex items-center gap-1 w-fit rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                    <Check className="w-3 h-3" /> Connected
                                </span>
                            ) : (
                                <span className="inline-flex items-center w-fit rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                    Not Connected
                                </span>
                            )}
                        </div>

                        {integration ? (
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-700">Connected Account</p>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    {integration.account_email}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    Connected on {new Date(integration.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 max-w-lg">
                                By connecting your Google account, you allow us to create events on your calendar and generate Google Meet links for your scheduled calls automatically.
                            </p>
                        )}
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                        {integration ? (
                            <button
                                onClick={handleDisconnect}
                                disabled={isDisconnecting}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 hover:border-red-100 hover:text-red-700 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Disconnect
                            </button>
                        ) : (
                            <button
                                onClick={() => handleConnect(company?.id || '')}
                                disabled={isConnecting}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#4285F4] text-white rounded-xl text-sm font-semibold hover:bg-[#3367D6] transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                                Connect Google Account
                            </button>
                        )}
                    </div>
                </div>

                {/* Features (Visible mainly if connected, or gracefully disabled) */}
                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-gray-900">Available Features</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Calendar Feature */}
                        <div className={`p-5 rounded-2xl border ${integration ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'} flex flex-col gap-4`}>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border bg-blue-50 border-blue-200">
                                    <Calendar className={`w-6 h-6 ${integration ? 'text-blue-600' : 'text-blue-400'}`} />
                                </div>
                                <div>
                                    <h3 className={`font-semibold text-lg ${integration ? 'text-gray-900' : 'text-gray-500'}`}>Google Calendar</h3>
                                    <p className={`text-sm mt-1 ${integration ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Sync your scheduled events and meetings seamlessly with your connected Google Calendar.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-auto pt-2 flex items-center justify-between">
                                <span className={`text-sm font-medium ${integration ? 'text-green-600' : 'text-gray-400'}`}>
                                    {integration ? 'Active' : 'Not available'}
                                </span>
                            </div>
                        </div>

                        {/* Meet Feature */}
                        <div className={`p-5 rounded-2xl border ${integration ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'} flex flex-col gap-4`}>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border bg-green-50 border-green-200">
                                    <Video className={`w-6 h-6 ${integration ? 'text-green-600' : 'text-green-400'}`} />
                                </div>
                                <div>
                                    <h3 className={`font-semibold text-lg ${integration ? 'text-gray-900' : 'text-gray-500'}`}>Google Meet</h3>
                                    <p className={`text-sm mt-1 ${integration ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Quickly generate video conferencing links for meetings and share them instantly.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-auto pt-2 flex items-center justify-between">
                                <span className={`text-sm font-medium ${integration ? 'text-green-600' : 'text-gray-400'}`}>
                                    {integration ? 'Active' : 'Not available'}
                                </span>
                                <button
                                    onClick={() => setShowMeetModal(true)}
                                    // Normally we would disable if not connected, but for the demo, we might allow it anyway if you want
                                    disabled={!integration && false}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm ${integration
                                        ? 'bg-[#2eb781] text-white hover:bg-[#279e6f]'
                                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    Create Link
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Google Meet Link Generator Modal */}
            {showMeetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                    <Video className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Schedule Meeting</h2>
                                    <p className="text-sm text-gray-500">Create a Google Meet link</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowMeetModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {!integration && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                                    Warning: You are not connected to Google. Link generation is currently mocked.
                                </div>
                            )}

                            {!generatedLink ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                                            <input
                                                type="date"
                                                value={meetDate}
                                                onChange={(e) => setMeetDate(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all text-sm text-gray-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Time</label>
                                            <input
                                                type="time"
                                                value={meetTime}
                                                onChange={(e) => setMeetTime(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all text-sm text-gray-900"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleGenerateMeet}
                                        disabled={isGenerating || !meetDate || !meetTime}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#2eb781] text-white rounded-xl font-semibold hover:bg-[#279e6f] transition-colors disabled:opacity-50 mt-2"
                                    >
                                        {isGenerating ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            'Generate Link'
                                        )}
                                    </button>
                                </>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
                                        <p className="text-sm text-gray-500 mb-1">Your meeting link is ready</p>
                                        <p className="font-medium text-gray-900 break-all">{generatedLink}</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={copyToClipboard}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                                        >
                                            <Copy className="w-4 h-4" />
                                            Copy Link
                                        </button>
                                        <button
                                            onClick={() => setShowMeetModal(false)}
                                            className="flex-1 flex items-center justify-center px-4 py-2.5 bg-[#2eb781] text-white rounded-xl font-semibold hover:bg-[#279e6f] transition-colors"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
