"use client";
import React from "react";
import { Calendar, MapPin, Video, Clock } from "lucide-react";

interface MeetingItem {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  type: "physical" | "online";
  location: string;
  created_by: string;
  meeting_attendees: any[];
}

interface Props {
  meetings: MeetingItem[];
  currentUserId: string;
  onMeetingClick?: (meeting: MeetingItem) => void;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const MyMeetingsList: React.FC<Props> = ({
  meetings,
  currentUserId,
  onMeetingClick,
}) => {
  if (!meetings || meetings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No upcoming meetings.</p>
        <p className="text-xs text-gray-400 mt-1">
          Meetings you schedule or are invited to will appear here.
        </p>
      </div>
    );
  }

  const now = new Date();
  const upcoming = meetings.filter((m) => new Date(m.start_time) >= now);
  const past = meetings.filter((m) => new Date(m.start_time) < now);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">My Meetings</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Meetings you&apos;ve scheduled or been invited to — click to view
          details
        </p>
      </div>

      <div className="divide-y divide-gray-50">
        {upcoming.length > 0 && (
          <>
            <div className="px-6 py-2 bg-gray-50/50">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Upcoming
              </span>
            </div>
            {upcoming.map((m) => (
              <MeetingRow
                key={m.id}
                meeting={m}
                currentUserId={currentUserId}
                onClick={onMeetingClick}
              />
            ))}
          </>
        )}

        {past.length > 0 && (
          <>
            <div className="px-6 py-2 bg-gray-50/50">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Past
              </span>
            </div>
            {past.map((m) => (
              <MeetingRow
                key={m.id}
                meeting={m}
                currentUserId={currentUserId}
                isPast
                onClick={onMeetingClick}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

const MeetingRow: React.FC<{
  meeting: MeetingItem;
  currentUserId: string;
  isPast?: boolean;
  onClick?: (meeting: MeetingItem) => void;
}> = ({ meeting, currentUserId, isPast, onClick }) => {
  const isOwner = meeting.created_by === currentUserId;
  const attendeeCount = meeting.meeting_attendees?.length || 0;

  return (
    <div
      onClick={() => onClick?.(meeting)}
      className={`px-6 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${
        isPast ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
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
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {meeting.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">
              {formatDate(meeting.start_time)}
            </span>
            <span className="text-gray-300">&middot;</span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(meeting.start_time)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {isOwner && (
          <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">
            Host
          </span>
        )}
        {attendeeCount > 0 && (
          <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-medium">
            {attendeeCount} {attendeeCount === 1 ? "guest" : "guests"}
          </span>
        )}
      </div>
    </div>
  );
};

export default MyMeetingsList;
