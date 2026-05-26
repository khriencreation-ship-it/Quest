"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import CalendarLayout from "./calender-layout";
import MeetingModal, { Attendee } from "./meeting-modal";
import MyMeetingsList from "./MyMeetingsList";
import { scheduleMeetingAndNotify, getMeetings } from "@/app/actions/calendar";

interface EventItem {
  title: string;
  date: string;
}

interface Department {
  id: string;
  name: string;
}

interface CalendarProps {
  initialStaff: Attendee[];
  initialDepartments: Department[];
  initialMeetings: any[];
  initialMyMeetings: any[];
  currentUserId: string;
  isManager: boolean;
  companyId: string;
}

const Calendar: React.FC<CalendarProps> = ({
  initialStaff,
  initialDepartments,
  initialMeetings,
  initialMyMeetings,
  currentUserId,
  companyId,
}) => {
  const mapMeetingsToEvents = (meetings: any[]): EventItem[] =>
    meetings.map((m: any) => ({
      title: m.title,
      date: m.start_time ? m.start_time.split("T")[0] : "",
    }));

  const [events, setEvents] = useState<EventItem[]>(
    mapMeetingsToEvents(initialMeetings),
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [staff] = useState<Attendee[]>(initialStaff);

  const handleOpenModal = (dateStr?: string) => {
    if (dateStr) {
      setSelectedDate(dateStr);
    } else {
      const today = new Date().toISOString().split("T")[0];
      setSelectedDate(today);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleCreateMeeting = async (meeting: {
    title: string;
    description: string;
    date: string;
    time: string;
    type: "physical" | "online";
    location: string;
    organizationId?: string;
    attendees: Attendee[];
  }) => {
    setIsModalOpen(false);
    toast.loading("Scheduling meeting and saving to database...");

    try {
      const formattedAttendees = meeting.attendees.map((att) => ({
        staffId: att.id,
        userId: att.user_id,
        name: att.full_name,
      }));

      const res = await scheduleMeetingAndNotify({
        title: meeting.title,
        description: meeting.description,
        date: meeting.date,
        time: meeting.time,
        type: meeting.type,
        location: meeting.location,
        organizationId: meeting.organizationId,
        attendees: formattedAttendees,
      });

      toast.dismiss();
      if (res.error) {
        toast.error(`Failed: ${res.error}`);
      } else {
        toast.success("Meeting scheduled and saved successfully!");

        const { meetings } = await getMeetings(meeting.organizationId);
        if (meetings) {
          setEvents(mapMeetingsToEvents(meetings));
        } else {
          setEvents((prev) => [
            ...prev,
            { title: meeting.title, date: meeting.date },
          ]);
        }
      }
    } catch (err) {
      console.error("Failed to schedule meeting:", err);
      toast.dismiss();
      toast.error("Failed to schedule meeting");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-500 mt-1">
            View team schedules, meetings, and upcoming appointments.
          </p>
        </div>
        <div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-[#2eb781] text-white rounded-xl text-sm font-semibold hover:bg-[#279e6f] transition-colors shadow-sm cursor-pointer"
          >
            Schedule Meeting
          </button>
        </div>
      </header>

      <CalendarLayout events={events} onDateSelect={handleOpenModal} />

      <MeetingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateMeeting}
        initialDate={selectedDate}
        staff={staff}
        departments={initialDepartments}
        companyId={companyId}
      />

      <MyMeetingsList
        meetings={initialMyMeetings}
        currentUserId={currentUserId}
      />
    </div>
  );
};

export default Calendar;
