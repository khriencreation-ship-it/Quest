"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import CalendarLayout from "./calender-layout";
import MeetingModal, { Attendee } from "./meeting-modal";
import { scheduleMeetingAndNotify } from "@/app/actions/calendar";

interface EventItem {
  title: string;
  date: string;
}

interface CalendarProps {
  initialStaff: Attendee[];
  currentUserId: string;
  isManager: boolean;
}

const Calendar: React.FC<CalendarProps> = ({
  initialStaff,
  currentUserId,
  isManager,
}) => {
  const [events, setEvents] = useState<EventItem[]>([
    {
      title: "Team Meeting",
      date: "2026-05-25",
    },
    {
      title: "Bible Study",
      date: "2026-05-28",
    },
  ]);

  // Modal, Date Selection
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  // Staff initialized with SSR props
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
    attendees: Attendee[];
  }) => {
    // 1. Add event locally to the calendar
    setEvents((prev) => [
      ...prev,
      {
        title: meeting.title,
        date: meeting.date,
      },
    ]);

    setIsModalOpen(false);
    toast.loading("Scheduling meeting and inviting team...");

    try {
      // 2. Call server action to send notifications to attendees
      const formattedAttendees = meeting.attendees.map((att) => ({
        staffId: att.id,
        userId: att.user_id,
        name: att.full_name,
      }));

      const res = await scheduleMeetingAndNotify({
        title: meeting.title,
        date: meeting.date,
        time: meeting.time,
        type: meeting.type,
        location: meeting.location,
        attendees: formattedAttendees,
      });

      toast.dismiss();
      if (res.error) {
        toast.error(`Meeting scheduled, but notifications failed: ${res.error}`);
      } else {
        toast.success("Meeting scheduled and invitations sent successfully!");
      }
    } catch (err) {
      console.error("Failed to notify attendees:", err);
      toast.dismiss();
      toast.error("Meeting scheduled, but invitation notifications failed");
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
      
      <CalendarLayout 
        events={events} 
        onDateSelect={handleOpenModal} 
      />

      <MeetingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateMeeting}
        initialDate={selectedDate}
        staff={staff}
      />
    </div>
  );
};

export default Calendar;
