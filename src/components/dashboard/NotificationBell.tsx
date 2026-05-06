"use client";

import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { getNotifications } from "@/app/actions/notifications";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const fetchCount = async () => {
    const result = await getNotifications();
    if ("data" in result && result.data) {
      const unread = result.data.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    }
  };

  useEffect(() => {
    fetchCount();
    
    // Subscribe to real-time notifications
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('new_notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            // Update count
            setUnreadCount(prev => prev + 1);
            
            // Show toast
            const newNotif = payload.new as any;
            toast(newNotif.title, {
                description: newNotif.message,
                action: {
                    label: 'View',
                    onClick: () => {
                        if (newNotif.link) router.push(newNotif.link);
                        else router.push('/dashboard/notifications');
                    }
                }
            });
          }
        )
        .subscribe();

      return channel;
    };

    const channelPromise = setupSubscription();

    return () => {
      channelPromise.then(channel => {
        if (channel) supabase.removeChannel(channel);
      });
    };
  }, [supabase]);

  // Refresh count when pathname changes (in case they visited the notifications page)
  useEffect(() => {
    fetchCount();
  }, [pathname]);

  const isActive = pathname === "/dashboard/notifications";

  return (
    <Link
      href="/dashboard/notifications"
      className="flex flex-col items-center gap-2 w-full px-2 mb-6 group relative"
    >
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm transition-all cursor-pointer ${
          isActive
            ? "bg-[#2eb781] text-white scale-105"
            : "bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 group-hover:scale-105"
        }`}
      >
        <Bell className={`w-6 h-6 ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-200"}`} />
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-3 w-5 h-5 bg-rose-500 border-2 border-gray-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>
      <span
        className={`text-[11px] font-medium text-center w-full truncate px-1 cursor-pointer transition-colors ${
          isActive
            ? "text-[#2eb781]"
            : "text-gray-400 group-hover:text-gray-200"
        }`}
      >
        Alerts
      </span>
    </Link>
  );
}
