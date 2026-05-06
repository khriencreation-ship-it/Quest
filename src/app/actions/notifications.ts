"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

/**
 * Fetch notifications for the current user.
 */
export async function getNotifications() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notifications:", error);
    return { error: error.message };
  }

  return { data: data as Notification[] };
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/notifications");
  return { success: true };
}

/**
 * Mark all notifications as read for the current user.
 */
export async function markAllAsRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/notifications");
  return { success: true };
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  link: string | null = null
) {
  const adminClient = createAdminClient();
  
  const { error } = await adminClient
    .from("notifications")
    .insert({
      user_id: userId,
      title,
      message,
      type,
      link,
    });

  if (error) {
    console.error("Error creating notification:", error);
    return { error: error.message };
  }

  return { success: true };
}
