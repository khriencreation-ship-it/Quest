import React from 'react'
import { Task, TaskPriority } from '@/types/kanban-types';
import { Check, Plus } from 'lucide-react';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    staff: any[];
    selectedAssignee: string;
    toggleAssignee: (userId: string) => void;
    newTask: Partial<Task>;
    setNewTask: (task: Partial<Task>) => void;
    getInitials: (name: string) => string;
    hideAssignees?: boolean;
}
const CreateTaskModal = ({ isOpen, onClose, onSubmit, staff, selectedAssignee, toggleAssignee, newTask, setNewTask, getInitials, hideAssignees = false }: CreateTaskModalProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 p-4 font-sans">
            <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="font-bold text-gray-900">Create New Project Task</h3>
                    <button
                        onClick={() => onClose()}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                    >
                        <Plus className="w-5 h-5 rotate-45" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-6 overflow-y-auto">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Task Title</label>
                            <input
                                autoFocus
                                type="text"
                                required
                                placeholder="What needs to be done?"
                                value={newTask.title}
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all text-gray-900"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</label>
                            <textarea
                                placeholder="Add more context or sub-tasks..."
                                value={newTask.description}
                                rows={3}
                                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all resize-none text-gray-900"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Priority</label>
                                <select
                                    value={newTask.priority}
                                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all cursor-pointer text-gray-900"
                                >
                                    <option value="low">Low Priority</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="high">High Priority</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Due Date</label>
                                <input
                                    type="date"
                                    value={newTask.due_date || ''}
                                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all cursor-pointer text-gray-900"
                                />
                            </div>
                        </div>

                        {/* Assignees Selection - Hidden for staff */}
                        {!hideAssignees && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assign To Project Members</label>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {staff.length === 0 ? (
                                        <p className="text-xs text-gray-400 col-span-2 py-2 italic">No members found in this project.</p>
                                    ) : (
                                        staff.map((member) => (
                                            <button
                                                key={member.user_id}
                                                type="button"
                                                onClick={() => toggleAssignee(member.user_id)}
                                                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${selectedAssignee.includes(member.user_id)
                                                    ? 'bg-[#2eb781]/5 border-[#2eb781] text-[#2eb781]'
                                                    : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${selectedAssignee.includes(member.user_id) ? 'bg-[#2eb781] text-white' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {getInitials(member.full_name)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold truncate">{member.full_name}</p>
                                                </div>
                                                {selectedAssignee.includes(member.user_id) && (
                                                    <Check className="w-4 h-4" />
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => onClose()}
                            className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!newTask.title}
                            className="px-8 py-2.5 bg-[#2eb781] text-white rounded-xl text-sm font-bold hover:bg-[#259b6d] transition-all shadow-lg shadow-[#2eb781]/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                        >
                            Create Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CreateTaskModal