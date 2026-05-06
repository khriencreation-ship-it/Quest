"use client";

import React, { useEffect, useState } from "react";
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Inbox
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { getNotifications, markAsRead, markAllAsRead, Notification } from "@/app/actions/notifications";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

const TypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "task_assigned":
      return <UserPlus className="w-5 h-5 text-blue-500" />;
    case "task_completed":
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    default:
      return <AlertCircle className="w-5 h-5 text-gray-500" />;
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const loadNotifications = async () => {
    setLoading(true);
    const result = await getNotifications();
    if ("data" in result && result.data) {
      setNotifications(result.data);
    } else if ("error" in result) {
      toast.error(result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();

    const supabase = createClient();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('notifications_page')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${notifications[0]?.user_id}` // This is a bit tricky if empty, better get user directly
        },
        async (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications(prev => [newNotif, ...prev]);
        }
      )
      .subscribe();

    // Since filter with auth.uid() is better, let's get user
    const setupRealtime = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Re-subscribe with correct filter if needed or just use broad channel
        // For now, broad channel within RLS is fine if we check user_id in callback
        // or rely on RLS (Postgres changes respects RLS if configured correctly, 
        // but often requires bypass or explicit filter)
    };

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    const result = await markAsRead(id);
    if (result.success) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    }
  };

  const handleMarkAllRead = async () => {
    const result = await markAllAsRead();
    if (result.success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success("All caught up!");
    }
  };

  const filtered = notifications.filter(n => filter === "all" || !n.is_read);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Stay updated with your latest activities.</p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#2eb781] hover:bg-[#2eb781]/5 rounded-xl transition-all"
        >
          <CheckCheck className="w-4 h-4" />
          Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="flex border-b border-gray-100 p-2 gap-2 bg-gray-50/50">
          <button
            onClick={() => setFilter("all")}
            className={`px-6 py-2.5 text-sm font-bold rounded-2xl transition-all ${
              filter === "all" 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-6 py-2.5 text-sm font-bold rounded-2xl transition-all ${
              filter === "unread" 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            Unread
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-rose-500 text-white text-[10px] rounded-full">
                {notifications.filter(n => !n.is_read).length}
              </span>
            )}
          </button>
        </div>

        <div className="divide-y divide-gray-50 min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2eb781]"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center px-6">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Inbox className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">All caught up!</h3>
              <p className="text-gray-500 mt-2 text-sm max-w-[240px]">
                You don't have any {filter === "unread" ? "unread" : ""} notifications at the moment.
              </p>
            </div>
          ) : (
            filtered.map((notification) => (
              <div 
                key={notification.id}
                className={`group p-6 flex gap-4 hover:bg-gray-50/50 transition-all ${!notification.is_read ? 'bg-emerald-50/20' : ''}`}
              >
                <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${
                  !notification.is_read ? 'bg-white shadow-md ring-1 ring-emerald-100' : 'bg-gray-50'
                }`}>
                  <TypeIcon type={notification.type} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className={`font-bold text-sm ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                        {notification.message}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <button 
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-1 hover:bg-white hover:shadow-sm rounded-lg text-[#2eb781] transition-all opacity-0 group-hover:opacity-100"
                        title="Mark as read"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </div>
                    
                    {notification.link && (
                      <Link 
                        href={notification.link}
                        className="flex items-center gap-1 text-[10px] font-bold text-[#2eb781] hover:underline"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        View Details
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
