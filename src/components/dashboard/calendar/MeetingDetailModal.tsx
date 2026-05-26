"use client";
import React from "react";
import { X, MapPin, Video, Clock, Calendar, Users } from "lucide-react";

interface AttendeeInfo {
  staff_id: string;
  staffs: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

interface MeetingData {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  type: "physical" | "online";
  location: string;
  created_by: string;
  meeting_attendees: AttendeeInfo[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  meeting: MeetingData | null;
  currentUserId: string;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const getInitials = (name: string) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const getAvatarBg = (name: string) => {
  if (!name) return "bg-gray-100 text-gray-700";
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const colors = [
    "bg-amber-100 text-amber-700",
    "bg-emerald-100 text-emerald-700",
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
  ];
  return colors[hash % colors.length];
};

const MeetingDetailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  meeting,
  currentUserId,
}) => {
  if (!isOpen || !meeting) return null;

  const isHost = meeting.created_by === currentUserId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                meeting.type === "online"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {meeting.type === "online" ? (
                <Video className="w-5 h-5" />
              ) : (
                <MapPin className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {meeting.title}
              </h2>
              {isHost && (
                <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">
                  You are the host
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Date
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {formatDate(meeting.start_time)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Time
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {formatTime(meeting.start_time)} &ndash;{" "}
                {formatTime(meeting.end_time)}
              </p>
            </div>
          </div>

          {/* Type & Location */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              {meeting.type === "online" ? (
                <Video className="w-4 h-4" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
              <span className="text-xs font-semibold uppercase tracking-wider">
                {meeting.type === "online" ? "Meeting Link" : "Location"}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {meeting.location}
            </p>
          </div>

          {/* Description */}
          {meeting.description && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Description
              </label>
              <p className="mt-1.5 text-sm text-gray-700 leading-relaxed">
                {meeting.description}
              </p>
            </div>
          )}

          {/* Attendees */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Attendees ({meeting.meeting_attendees?.length || 0})
              </span>
            </div>

            {meeting.meeting_attendees && meeting.meeting_attendees.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {meeting.meeting_attendees.map((att) => {
                  const staff = att.staffs;
                  if (!staff) return null;
                  return (
                    <div
                      key={att.staff_id}
                      className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-xl"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] ${getAvatarBg(staff.full_name)}`}
                      >
                        {getInitials(staff.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          {staff.full_name}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {staff.email}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No attendees invited.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetailModal;
