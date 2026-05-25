"use client";
import React, { useState } from "react";
import CalendarLayout from "./calender-layout";
import MeetingModal from "./meeting-modal";

interface EventItem {
  title: string;
  date: string;
}

const Calendar = () => {
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

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

  const handleCreateMeeting = (meeting: {
    title: string;
    date: string;
    time: string;
    type: "physical" | "online";
    location: string;
    attendees: string[];
  }) => {
    setEvents((prev) => [
      ...prev,
      {
        title: meeting.title,
        date: meeting.date,
      },
    ]);
    setIsModalOpen(false);
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
      />
    </div>
  );
};

export default Calendar;
