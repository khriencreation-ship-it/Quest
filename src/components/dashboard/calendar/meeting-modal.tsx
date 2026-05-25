"use client";
import React, { useState, useEffect } from "react";
import { X, Calendar as CalendarIcon, MapPin, Video, Search } from "lucide-react";

interface Attendee {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  initial: string;
}

const STAFF_ATTENDEES: Attendee[] = [
  { id: "s1", name: "Bunmi", email: "bunmi@gmail.com", avatarColor: "bg-amber-100 text-amber-700", initial: "B" },
  { id: "s2", name: "Eniibukun Keji-Ayodeji", email: "eniibukun@gmail.com", avatarColor: "bg-emerald-100 text-emerald-700", initial: "EK" },
  { id: "s3", name: "Femi", email: "femi@gmail.com", avatarColor: "bg-teal-100 text-teal-700", initial: "F" },
  { id: "s4", name: "Alice Smith", email: "alice@gmail.com", avatarColor: "bg-blue-100 text-blue-700", initial: "AS" },
  { id: "s5", name: "Bob Johnson", email: "bob@gmail.com", avatarColor: "bg-purple-100 text-purple-700", initial: "BJ" },
];

const CLIENTS_ATTENDEES: Attendee[] = [
  { id: "c1", name: "John Doe", email: "john@client.com", avatarColor: "bg-indigo-100 text-indigo-700", initial: "JD" },
  { id: "c2", name: "Sarah Connor", email: "sarah@cyberdyne.com", avatarColor: "bg-pink-100 text-pink-700", initial: "SC" },
  { id: "c3", name: "Bruce Wayne", email: "bruce@waynecorp.com", avatarColor: "bg-slate-100 text-slate-700", initial: "BW" },
];

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (meeting: {
    title: string;
    date: string;
    time: string;
    type: "physical" | "online";
    location: string;
    attendees: string[];
  }) => void;
  initialDate?: string;
}

const MeetingModal: React.FC<MeetingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialDate = "",
}) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  
  // Time States
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState("AM");

  // Meeting Type & Location
  const [type, setType] = useState<"physical" | "online">("physical");
  const [location, setLocation] = useState("");

  // Attendees Search & Selection
  const [activeTab, setActiveTab] = useState<"staff" | "clients">("staff");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);

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
      setHour("12");
      setMinute("00");
      setPeriod("AM");
      setType("physical");
      setLocation("");
      setSearchQuery("");
      setSelectedAttendees([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAttendeeToggle = (id: string) => {
    setSelectedAttendees((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const currentAttendeeList = activeTab === "staff" ? STAFF_ATTENDEES : CLIENTS_ATTENDEES;

  const filteredAttendees = currentAttendeeList.filter(
    (att) =>
      att.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !location) return;

    const formattedTime = `${hour}:${minute} ${period}`;
    onSubmit({
      title,
      date,
      time: formattedTime,
      type,
      location,
      attendees: selectedAttendees,
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
                  className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-800"
                />
                <CalendarIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
                  <MapPin className="w-4 h-4 text-gray-400" /> Physical
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
                  <Video className="w-4 h-4 text-gray-400" /> Online
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

          {/* Attendees Selector */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Attendees
            </label>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("staff");
                  setSearchQuery("");
                }}
                className={`pb-2.5 px-4 text-sm font-semibold transition-all relative ${
                  activeTab === "staff"
                    ? "text-orange-500"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Staff
                {activeTab === "staff" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full animate-fade-in" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("clients");
                  setSearchQuery("");
                }}
                className={`pb-2.5 px-4 text-sm font-semibold transition-all relative ${
                  activeTab === "clients"
                    ? "text-orange-500"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Clients
                {activeTab === "clients" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full animate-fade-in" />
                )}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs text-gray-800"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Attendees List */}
            <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 max-h-48 overflow-y-auto bg-gray-50/30">
              {filteredAttendees.length > 0 ? (
                filteredAttendees.map((att) => (
                  <label
                    key={att.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${att.avatarColor}`}>
                        {att.initial}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{att.name}</p>
                        <p className="text-[10px] text-gray-400">{att.email}</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedAttendees.includes(att.id)}
                      onChange={() => handleAttendeeToggle(att.id)}
                      className="w-4 h-4 rounded-sm border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                    />
                  </label>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-gray-400">
                  No attendees found matching query.
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
