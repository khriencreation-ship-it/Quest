'use client';

import { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Sparkles, Loader2 } from 'lucide-react';
import CompanyStep from '@/components/onboarding/CompanyStep';
import OrganizationsStep from '@/components/onboarding/OrganizationsStep';
import RolesStep from '@/components/onboarding/RolesStep';
import { completeManagerOnboarding } from '@/app/actions/onboarding';

const steps = [
    { id: 1, title: 'Company' },
    { id: 2, title: 'Organizations' },
    { id: 3, title: 'Roles' },
];

export default function OnboardingClient() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [companyName, setCompanyName] = useState('');
    const [organizations, setOrganizations] = useState<string[]>([]);
    const [roles, setRoles] = useState<string[]>([]);

    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleFinish = async () => {
        setIsSubmitting(true);
        setError(null);

        const result = await completeManagerOnboarding({
            companyName,
            organizations,
            roles
        });

        if (result.success) {
            window.location.href = '/dashboard';
        } else {
            setError(result.error || 'Something went wrong.');
            setIsSubmitting(false);
        }
    };

    // Validation logic to determine if the user can proceed to the next step
    const canProceed = () => {
        if (currentStep === 1) return companyName.trim().length > 0;
        if (currentStep === 2) return organizations.length > 0;
        if (currentStep === 3) return roles.length > 0;
        return false;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center selection:bg-[#2eb781]/30 selection:text-gray-900 p-6">
            <div className="w-full max-w-xl">
                {/* Header / Logo */}
                <div className="flex items-center gap-2 mb-10">
                    <div className="h-8 w-8 bg-[#2eb781] rounded-lg flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-gray-900">Quest</span>
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Progress Bar */}
                    <div className="bg-gray-50 border-b border-gray-100 px-8 py-4 flex justify-between items-center relative">
                        {/* Connecting lines */}
                        <div className="absolute top-1/2 left-12 right-12 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
                        <div
                            className="absolute top-1/2 left-12 h-0.5 bg-[#2eb781] transition-all duration-500 ease-in-out -translate-y-1/2 z-0"
                            style={{ width: `calc(${(currentStep - 1) / (steps.length - 1)} * (100% - 6rem))` }}
                        />

                        {/* Step Indicators */}
                        {steps.map((step) => (
                            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 bg-gray-50 px-2">
                                <div
                                    className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300
                    ${currentStep > step.id ? 'bg-[#2eb781] text-white border-2 border-[#2eb781]' :
                                            currentStep === step.id ? 'bg-white text-[#2eb781] border-2 border-[#2eb781]' :
                                                'bg-white text-gray-400 border-2 border-gray-200'}
                  `}
                                >
                                    {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                                </div>
                                <span className={`text-xs font-medium absolute top-10 whitespace-nowrap ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {step.title}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Form Content */}
                    <div className="p-8 mt-4 min-h-[360px] flex flex-col justify-center">
                        {currentStep === 1 && (
                            <CompanyStep
                                companyName={companyName}
                                setCompanyName={setCompanyName}
                            />
                        )}

                        {currentStep === 2 && (
                            <OrganizationsStep
                                organizations={organizations}
                                setOrganizations={setOrganizations}
                            />
                        )}

                        {currentStep === 3 && (
                            <RolesStep
                                roles={roles}
                                setRoles={setRoles}
                            />
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="px-8 pb-2">
                            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                                {error}
                            </div>
                        </div>
                    )}

                    {/* Footer Controls */}
                    <div className="p-8 pt-0 flex items-center justify-between border-t border-transparent">
                        {currentStep > 1 ? (
                            <button
                                onClick={handleBack}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </button>
                        ) : (
                            <div /> // Spacer
                        )}

                        <button
                            onClick={currentStep === steps.length ? handleFinish : handleNext}
                            disabled={!canProceed() || isSubmitting}
                            className="group flex items-center justify-center gap-2 px-8 py-2.5 bg-[#2eb781] hover:bg-[#28a172] text-white disabled:opacity-60 disabled:cursor-not-allowed rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Setting up...
                                </>
                            ) : currentStep === steps.length ? (
                                <>
                                    Complete Setup
                                    <Check className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
