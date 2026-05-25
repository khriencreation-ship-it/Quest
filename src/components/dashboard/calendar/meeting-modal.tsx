"use client";
import React, { useState, useEffect } from "react";
import { X, Search, Loader2 } from "lucide-react";

export interface Attendee {
  id: string;       // staffs.id
  user_id: string;  // staffs.user_id
  full_name: string;
  email: string;
  role_name?: string;
}

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (meeting: {
    title: string;
    description: string;
    date: string;
    time: string;
    type: "physical" | "online";
    location: string;
    attendees: Attendee[];
  }) => void;
  initialDate?: string;
  staff: Attendee[];
  isLoadingStaff?: boolean;
}

const getInitials = (name: string) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const getAvatarBg = (name: string) => {
  if (!name) return "bg-gray-100 text-gray-700";
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    "bg-amber-100 text-amber-700",
    "bg-emerald-100 text-emerald-700",
    "bg-teal-100 text-teal-700",
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-indigo-100 text-indigo-700",
    "bg-pink-100 text-pink-700",
    "bg-rose-100 text-rose-700",
  ];
  return colors[hash % colors.length];
};

const MeetingModal: React.FC<MeetingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialDate = "",
  staff,
  isLoadingStaff = false,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  
  // Time States
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState("AM");

  // Meeting Type & Location
  const [type, setType] = useState<"physical" | "online">("physical");
  const [location, setLocation] = useState("");

  // Attendees Search & Selection
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  // Update date state when initialDate changes
  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
    } else {
      const today = new Date().toISOString().split("T")[0];
      setDate(today);
    }
  }, [initialDate, isOpen]);

  // Reset form when opening/closing
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setHour("12");
      setMinute("00");
      setPeriod("AM");
      setType("physical");
      setLocation("");
      setSearchQuery("");
      setSelectedStaffIds([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAttendeeToggle = (id: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredAttendees = staff.filter(
    (att) =>
      att.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !location) return;

    // Get full objects of selected staff members to pass back
    const chosenStaff = staff.filter((s) => selectedStaffIds.includes(s.id));

    const formattedTime = `${hour}:${minute} ${period}`;
    onSubmit({
      title,
      description,
      date,
      time: formattedTime,
      type,
      location,
      attendees: chosenStaff,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-[#0c1e36]">Schedule Meeting</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Meeting Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Weekly Team Sync"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-800"
            />
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-800"
                />
              </div>
            </div>

            {/* Time Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Time *
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {/* Hour */}
                <select
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                  className="px-2 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-800 appearance-none text-center cursor-pointer"
                >
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>

                {/* Minute */}
                <select
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  className="px-2 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-800 appearance-none text-center cursor-pointer"
                >
                  {["00", "15", "30", "45"].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                {/* Period */}
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="px-2 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-800 appearance-none text-center cursor-pointer"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>

          {/* Meeting Type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Meeting Type
            </label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="meetingType"
                  checked={type === "physical"}
                  onChange={() => setType("physical")}
                  className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                  Physical
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="meetingType"
                  checked={type === "online"}
                  onChange={() => setType("online")}
                  className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                  Online
                </span>
              </label>
            </div>
          </div>

          {/* Location / Link */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {type === "physical" ? "Location *" : "Meeting Link *"}
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={type === "physical" ? "e.g., Conference Room A" : "e.g., https://meet.google.com/abc-defg-hij"}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-800"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add meeting agenda or notes..."
              rows={3}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-800 resize-none"
            />
          </div>

          {/* Attendees Selector (Staff only) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-sm font-semibold text-gray-800">
                Staff Members
              </span>
              {isLoadingStaff && (
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name or email..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs text-gray-800"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Attendees List */}
            <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 max-h-48 overflow-y-auto bg-gray-50/30">
              {isLoadingStaff ? (
                <div className="p-8 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                  Loading team members...
                </div>
              ) : filteredAttendees.length > 0 ? (
                filteredAttendees.map((att) => (
                  <label
                    key={att.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${getAvatarBg(att.full_name)}`}>
                        {getInitials(att.full_name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-gray-800">{att.full_name}</p>
                          {att.role_name && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">
                              {att.role_name}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400">{att.email}</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedStaffIds.includes(att.id)}
                      onChange={() => handleAttendeeToggle(att.id)}
                      className="w-4 h-4 rounded-sm border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-gray-400">
                  No staff members found in this department.
                </div>
              )}
            </div>
          </div>

          {/* Footer Submit Action inside scroll form */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-semibold text-white bg-[#2eb781] hover:bg-[#279e6f] rounded-xl transition-all cursor-pointer shadow-sm active:scale-98"
            >
              Schedule Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MeetingModal;
