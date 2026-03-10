import { Building2 } from 'lucide-react';

interface CompanyStepProps {
    companyName: string;
    setCompanyName: (name: string) => void;
}

export default function CompanyStep({ companyName, setCompanyName }: CompanyStepProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-[#2eb781]/10 text-[#2eb781] rounded-xl flex items-center justify-center mb-4">
                    <Building2 className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">What is the name of your company?</h2>
                <p className="text-gray-500 text-sm">
                    This will be the name of your workspace on Quest.
                </p>
            </div>

            <div className="pt-4">
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                </label>
                <input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all text-sm"
                    autoFocus
                />
            </div>
        </div>
    );
}
