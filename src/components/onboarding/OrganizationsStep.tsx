import { Plus, X, Users } from 'lucide-react';
import { useState } from 'react';

interface OrganizationsStepProps {
    organizations: string[];
    setOrganizations: (orgs: string[]) => void;
}

export default function OrganizationsStep({ organizations, setOrganizations }: OrganizationsStepProps) {
    const [newOrg, setNewOrg] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newOrg.trim() && !organizations.includes(newOrg.trim())) {
            setOrganizations([...organizations, newOrg.trim()]);
            setNewOrg('');
        }
    };

    const handleRemove = (orgToRemove: string) => {
        setOrganizations(organizations.filter(org => org !== orgToRemove));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-[#2eb781]/10 text-[#2eb781] rounded-xl flex items-center justify-center mb-4">
                    <Users className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Set up your organizations</h2>
                <p className="text-gray-500 text-sm">
                    Add the different departments, branches, or teams within your company.
                </p>
            </div>

            <div className="pt-4 space-y-4">
                <form onSubmit={handleAdd} className="flex gap-2">
                    <input
                        type="text"
                        value={newOrg}
                        onChange={(e) => setNewOrg(e.target.value)}
                        placeholder="e.g. Marketing, Engineering, Branch A"
                        className="flex-1 px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all text-sm"
                    />
                    <button
                        type="submit"
                        disabled={!newOrg.trim()}
                        className="px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </form>

                {organizations.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl max-h-48 overflow-y-auto p-2 space-y-1">
                        {organizations.map((org) => (
                            <div
                                key={org}
                                className="flex items-center justify-between px-3 py-2 bg-white border border-gray-100 rounded-lg shadow-sm"
                            >
                                <span className="text-sm text-gray-700 font-medium">{org}</span>
                                <button
                                    onClick={() => handleRemove(org)}
                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-md"
                                    aria-label={`Remove ${org}`}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {organizations.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                        <p className="text-sm text-gray-500">No organizations added yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
