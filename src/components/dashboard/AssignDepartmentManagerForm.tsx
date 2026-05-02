"use client";

import { useState } from "react";
import { Loader2, Crown, UserCheck, X } from "lucide-react";
import { assignDepartmentManager } from "@/app/actions/organization_members";
import { useRouter } from "next/navigation";

type Props = {
  organizationId: string;
  members: { staff_id: string; full_name?: string; email?: string }[];
  currentManagerStaffId: string | null;
  isGeneral: boolean;
};

export default function AssignDepartmentManagerForm({
  organizationId,
  members,
  currentManagerStaffId,
  isGeneral,
}: Props) {
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showChangeForm, setShowChangeForm] = useState(false);
  const router = useRouter();

  const currentManager = currentManagerStaffId
    ? members.find((m) => m.staff_id === currentManagerStaffId)
    : null;

  // Show the dropdown when there is no manager yet, or the user clicked "Change Manager"
  const showDropdown = !currentManagerStaffId || showChangeForm;

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStaffId) {
      setError("Please select a staff member.");
      return;
    }

    setLoading(true);
    clearMessages();

    const result = await assignDepartmentManager(
      organizationId,
      selectedStaffId,
    );

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Department manager assigned successfully.");
      setSelectedStaffId("");
      setShowChangeForm(false);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleRemove() {
    if (!confirm("Are you sure you want to remove the department manager?")) {
      return;
    }

    setLoading(true);
    clearMessages();

    const result = await assignDepartmentManager(organizationId, null);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Department manager removed.");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="p-6 sm:p-8 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2eb781]/10 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-[#2eb781]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Department Manager
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Assign a staff member to lead this department.
            </p>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="p-6 sm:p-8">
        {/* General workspace: not applicable */}
        {isGeneral ? (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-700 font-medium">
            The General department does not have a department manager.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Error banner */}
            {error && (
              <div className="p-4 rounded-xl text-sm font-medium border bg-red-50 text-red-600 border-red-100">
                {error}
              </div>
            )}

            {/* Success banner */}
            {success && (
              <div className="p-4 rounded-xl text-sm font-medium border bg-emerald-50 text-emerald-600 border-emerald-100">
                {success}
              </div>
            )}

            {/* ── Current manager display ── */}
            {currentManagerStaffId && !showChangeForm && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-[#2eb781]/10 flex items-center justify-center text-[#2eb781] font-bold shrink-0 text-lg border border-[#2eb781]/20">
                    {(currentManager?.full_name || currentManager?.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  {/* Name + badge */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">
                        {currentManager?.full_name || "Unknown User"}
                      </p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#2eb781]/10 text-[#2eb781] border border-[#2eb781]/20">
                        <Crown className="w-3 h-3" />
                        Department Manager
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {currentManager?.email}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangeForm(true);
                      clearMessages();
                    }}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Change Manager
                  </button>

                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-100 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                    Remove Manager
                  </button>
                </div>
              </div>
            )}

            {/* ── Assign / Change form ── */}
            {showDropdown && (
              <form onSubmit={handleAssign} className="flex gap-3">
                <select
                  required
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className={`flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2eb781]/20 focus:border-[#2eb781] transition-all bg-gray-50 focus:bg-white text-sm ${
                    !selectedStaffId ? "text-gray-500" : "text-gray-900"
                  }`}
                >
                  <option value="" disabled className="text-gray-900">
                    Select a staff member...
                  </option>
                  {members.map((member) => (
                    <option
                      key={member.staff_id}
                      value={member.staff_id}
                      className="text-gray-900"
                    >
                      {member.full_name
                        ? `${member.full_name}${member.email ? ` (${member.email})` : ""}`
                        : member.email || member.staff_id}
                    </option>
                  ))}
                  {members.length === 0 && (
                    <option value="" disabled className="text-gray-900">
                      No staff members available.
                    </option>
                  )}
                </select>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Cancel button only appears when changing an existing manager */}
                  {showChangeForm && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowChangeForm(false);
                        setSelectedStaffId("");
                        clearMessages();
                      }}
                      disabled={loading}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !selectedStaffId}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#2eb781] text-white font-semibold hover:bg-[#279e6f] transition-all disabled:opacity-50 text-sm shadow-sm cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                    {showChangeForm ? "Confirm Change" : "Assign Manager"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
