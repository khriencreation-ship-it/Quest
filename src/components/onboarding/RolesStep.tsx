import { Plus, X, UserCog } from 'lucide-react';
import { useState } from 'react';

interface RolesStepProps {
    roles: string[];
    setRoles: (roles: string[]) => void;
}

export default function RolesStep({ roles, setRoles }: RolesStepProps) {
    const [newRole, setNewRole] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newRole.trim() && !roles.includes(newRole.trim())) {
            setRoles([...roles, newRole.trim()]);
            setNewRole('');
        }
    };

    const handleRemove = (roleToRemove: string) => {
        setRoles(roles.filter(role => role !== roleToRemove));
    };

    const suggestedRoles = ['Admin', 'Manager', 'Developer', 'Designer', 'Viewer'];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-[#2eb781]/10 text-[#2eb781] rounded-xl flex items-center justify-center mb-4">
                    <UserCog className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Define staff roles</h2>
                <p className="text-gray-500 text-sm">
                    Set up the roles your staff members will have in Quest.
                </p>
            </div>

            <div className="pt-4 space-y-4">
                {/* Suggested Roles */}
                {roles.length === 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {suggestedRoles.map(role => (
                            <button
                                key={role}
                                onClick={() => setRoles([...roles, role])}
                                className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-full hover:bg-[#2eb781]/10 hover:text-[#2eb781] hover:border-[#2eb781]/30 transition-colors"
                            >
                                + {role}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input Role */}
                <form onSubmit={handleAdd} className="flex gap-2">
                    <input
                        type="text"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        placeholder="e.g. Lead Engineer, Content Editor"
                        className="flex-1 px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all text-sm"
                    />
                    <button
                        type="submit"
                        disabled={!newRole.trim()}
                        className="px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </form>

                {/* List of custom roles */}
                {roles.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl max-h-48 overflow-y-auto p-2 space-y-1">
                        {roles.map((role) => (
                            <div
                                key={role}
                                className="flex items-center justify-between px-3 py-2 bg-white border border-gray-100 rounded-lg shadow-sm"
                            >
                                <span className="text-sm text-gray-700 font-medium">{role}</span>
                                <button
                                    onClick={() => handleRemove(role)}
                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-md"
                                    aria-label={`Remove ${role}`}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
