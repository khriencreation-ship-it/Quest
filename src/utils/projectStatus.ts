
export type ProjectStatusInfo = {
    id: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
    is_internal?: boolean;
};

export const getProjectLiveStatus = (project: ProjectStatusInfo) => {
    const { status, start_date, end_date } = project;
    
    if (status === 'completed') return 'Completed';
    if (status === 'cancelled') return 'Cancelled';
    if (status === 'on_hold') return 'On Hold';
    
    if (!start_date) return status.replace('_', ' ');
    
    const now = new Date();
    const start = new Date(start_date);
    const end = end_date ? new Date(end_date) : null;
    
    // Ongoing/Internal projects just need to have started
    if (!end) {
        return now >= start ? 'Active Now' : 'Planning';
    }
    
    if (now >= start && now <= end) return 'Active Now';
    if (now < start) return 'Upcoming';
    return 'Overdue'; // Passed end date but not completed/cancelled
};

export const getProjectStatusColor = (status: string, liveStatus: string) => {
    if (liveStatus === 'Active Now') {
        return 'bg-emerald-500 text-white shadow-sm shadow-emerald-200';
    }
    
    switch (status) {
        case 'active': return 'bg-emerald-100 text-emerald-700';
        case 'completed': return 'bg-blue-100 text-blue-700';
        case 'on_hold': return 'bg-amber-100 text-amber-700';
        case 'cancelled': return 'bg-red-100 text-red-700';
        case 'planning':
        case 'pending':
        default: 
            if (liveStatus === 'Overdue') return 'bg-rose-100 text-rose-700';
            if (liveStatus === 'Upcoming') return 'bg-sky-100 text-sky-700';
            return 'bg-gray-100 text-gray-700';
    }
};
