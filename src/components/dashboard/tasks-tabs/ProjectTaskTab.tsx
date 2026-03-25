"use client";

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
    Plus,
    MoreVertical,
    Clock,
    CheckCircle2,
    AlertCircle,
    MessageSquare,
    Paperclip,
    ChevronRight,
    Search,
    Filter,
    Calendar
} from 'lucide-react';

// Mock types to match our SQL schema
type TaskStatus = 'todo' | 'in_progress' | 'done';
type TaskPriority = 'low' | 'medium' | 'high';

interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date?: string;
    assignees: string[];
    attachments_count: number;
    comments_count: number;
}

const INITIAL_TASKS: Task[] = [
    {
        id: '1',
        title: 'Design system audit',
        description: 'Review existing components and document inconsistencies in the color palette.',
        status: 'todo',
        priority: 'high',
        due_date: '2024-03-30',
        assignees: ['Jake', 'Finn'],
        attachments_count: 2,
        comments_count: 5
    },
    {
        id: '2',
        title: 'User interview synthesis',
        description: 'Synthesize findings from the last round of usability testing on the checkout flow.',
        status: 'in_progress',
        priority: 'medium',
        due_date: '2024-03-28',
        assignees: ['BMO'],
        attachments_count: 1,
        comments_count: 3
    },
    {
        id: '3',
        title: 'Landing page copy Refinement',
        description: 'Update the hero section copy to be more focused on conversion and trust building.',
        status: 'in_progress',
        priority: 'low',
        assignees: ['Princess bubblegum'],
        attachments_count: 0,
        comments_count: 1
    },
    {
        id: '4',
        title: 'Setup production environment',
        description: 'Configure Vercel project and connect the custom domain with SSL.',
        status: 'done',
        priority: 'high',
        due_date: '2024-03-25',
        assignees: ['Jake'],
        attachments_count: 0,
        comments_count: 8
    }
];

const COLUMNS = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-100', dot: 'bg-gray-400' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-emerald-50', dot: 'bg-emerald-500' },
    { id: 'done', title: 'Done', color: 'bg-purple-50', dot: 'bg-purple-500' }
];

const PriorityBadge = ({ priority }: { priority: TaskPriority }) => {
    const styles = {
        low: 'bg-gray-100 text-gray-600 border-gray-200',
        medium: 'bg-amber-50 text-amber-700 border-amber-100',
        high: 'bg-rose-50 text-rose-700 border-rose-100'
    };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${styles[priority]}`}>
            {priority}
        </span>
    );
};

const ProjectTaskTab = () => {
    const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTask, setNewTask] = useState<Partial<Task>>({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
    });

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) return;

        const newTasks = Array.from(tasks);
        const taskIndex = newTasks.findIndex(t => t.id === draggableId);

        if (taskIndex !== -1) {
            // Update status based on destination column
            newTasks[taskIndex] = {
                ...newTasks[taskIndex],
                status: destination.droppableId as TaskStatus
            };
            setTasks(newTasks);
        }
    };

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.title) return;

        const task: Task = {
            id: Math.random().toString(36).substr(2, 9),
            title: newTask.title || '',
            description: newTask.description || '',
            status: (newTask.status as TaskStatus) || 'todo',
            priority: (newTask.priority as TaskPriority) || 'medium',
            due_date: newTask.due_date,
            assignees: ['Jake'], // Default for mock
            attachments_count: 0,
            comments_count: 0,
        };

        setTasks([...tasks, task]);
        setIsModalOpen(false);
        setNewTask({ title: '', description: '', priority: 'medium', status: 'todo' });
    };

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return (
        <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm animate-in fade-in duration-500 relative">
            {/* Kanban Header / Controls */}
            <div className="p-4 border-b border-gray-50 bg-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all w-64"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2 mr-4">
                        {['Jake', 'Finn', 'BMO'].map((n, i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 ring-1 ring-gray-100">
                                {getInitials(n)}
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => {
                            setNewTask({ ...newTask, status: 'todo' });
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#2eb781] text-white rounded-lg text-sm font-bold hover:bg-[#259b6d] transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        New Task
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-6 p-6 h-full overflow-x-auto min-h-[600px] bg-gray-50/50">
                    {COLUMNS.map((column) => (
                        <div key={column.id} className="flex-1 min-w-[320px] flex flex-col group">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${column.dot}`} />
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                        {column.title}
                                        <span className="text-xs font-medium text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">
                                            {tasks.filter(t => t.status === column.id).length}
                                        </span>
                                    </h3>
                                </div>
                                <button className="p-1 hover:bg-white rounded transition-colors text-gray-400 group-hover:block hidden">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>

                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={`flex-1 flex flex-col gap-4 rounded-xl transition-all p-2 ${snapshot.isDraggingOver ? 'bg-[#2eb781]/5 ring-2 ring-[#2eb781]/20 ring-inset' : ''
                                            }`}
                                    >
                                        {tasks
                                            .filter((task) => task.status === column.id)
                                            .map((task, index) => (
                                                <Draggable
                                                    key={task.id}
                                                    draggableId={task.id}
                                                    index={index}
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#2eb781]/30 transition-all select-none group/card ${snapshot.isDragging ? 'shadow-xl scale-105 border-[#2eb781] ring-4 ring-[#2eb781]/10 z-50' : ''
                                                                }`}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <PriorityBadge priority={task.priority} />
                                                                <button className="p-1 text-gray-300 hover:text-gray-600 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                                                    <MoreVertical className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                            <h4 className="font-bold text-gray-900 leading-snug mb-2 group-hover/card:text-[#2eb781] transition-colors">
                                                                {task.title}
                                                            </h4>
                                                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">
                                                                {task.description}
                                                            </p>

                                                            {/* Card Footer */}
                                                            <div className="flex items-center justify-between mt-auto">
                                                                <div className="flex items-center gap-3">
                                                                    {task.due_date && (
                                                                        <div className="flex items-center gap-1 text-[10px] font-medium text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                                                                            <Calendar className="w-3 h-3" />
                                                                            {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-center gap-1 text-[10px] font-medium text-gray-400">
                                                                        <Paperclip className="w-3 h-3" />
                                                                        {task.attachments_count}
                                                                    </div>
                                                                    <div className="flex items-center gap-1 text-[10px] font-medium text-gray-400">
                                                                        <MessageSquare className="w-3 h-3" />
                                                                        {task.comments_count}
                                                                    </div>
                                                                </div>
                                                                <div className="flex -space-x-1.5">
                                                                    {task.assignees.map((a, i) => (
                                                                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-600" title={a}>
                                                                            {getInitials(a)}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                        {provided.placeholder}

                                        {/* Add Task Quick Action */}
                                        <button
                                            onClick={() => {
                                                setNewTask({ ...newTask, status: column.id as TaskStatus });
                                                setIsModalOpen(true);
                                            }}
                                            className="py-2.5 rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs font-medium hover:border-[#2eb781] hover:text-[#2eb781] hover:bg-white transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 bg-gray-50/50 mt-2"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Add Task
                                        </button>
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>

            {/* Quick Create Task Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="font-bold text-gray-900">Create New Task</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                            >
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTask} className="p-6 space-y-4 text-gray-900">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Task Title</label>
                                <input
                                    autoFocus
                                    type="text"
                                    required
                                    placeholder="Enter task title..."
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</label>
                                <textarea
                                    placeholder="Add more details..."
                                    value={newTask.description}
                                    rows={3}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Priority</label>
                                    <select
                                        value={newTask.priority}
                                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all appearance-none cursor-pointer"
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
                                        value={newTask.due_date}
                                        onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-2.5 bg-[#2eb781] text-white rounded-xl text-sm font-bold hover:bg-[#259b6d] transition-all shadow-lg shadow-[#2eb781]/20 active:scale-95"
                                >
                                    Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default ProjectTaskTab;