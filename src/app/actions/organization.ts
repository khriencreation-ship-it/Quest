"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createOrganization(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  if (!name || name.trim() === "") {
    return { error: "Department name is required" };
  }

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      return { error: "Not authenticated" };
    }

    // Fetch the user's company
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", userData.user.id)
      .single();

    if (!company) {
      return { error: "Company not found" };
    }

    // Insert Department
    const { error: insertError } = await supabase.from("organizations").insert({
      company_id: company.id,
      name: name.trim(),
      description: description ? description.trim() : null,
    });

    if (insertError) {
      return { error: insertError.message };
    }

    // Revalidate layout and departments page to show new data
    revalidatePath("/dashboard", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Error creating department:", error);
    return { error: "Failed to create department" };
  }
}

export async function updateOrganization(id: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name || name.trim() === "") {
    return { error: "Department name is required" };
  }

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      return { error: "Not authenticated" };
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from("organizations")
      .update({
        name: name.trim(),
        description: description ? description.trim() : null,
      })
      .eq("id", id)
      .select();

    if (updateError) {
      return { error: updateError.message };
    }

    // If 0 rows were updated, RLS is silently blocking the write
    if (!updatedRows || updatedRows.length === 0) {
      return {
        error:
          "Update was blocked by database permissions. Please run the missing UPDATE policy in your Supabase dashboard.",
      };
    }

    revalidatePath(`/dashboard/departments/${id}`);
    revalidatePath("/dashboard/departments");
    revalidatePath("/dashboard", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Error updating department:", error);
    return { error: "Failed to update department" };
  }
}

export async function deleteOrganization(id: string) {
  const supabase = await createClient();

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      return { error: "Not authenticated" };
    }

    const { error: deleteError } = await supabase
      .from("organizations")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return { error: deleteError.message };
    }

    revalidatePath("/dashboard", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting department:", error);
    return { error: "Failed to delete department" };
  }
}
