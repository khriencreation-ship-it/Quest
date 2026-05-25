"use client";
import React, { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

interface EventItem {
  title: string;
  date: string;
}

interface CalendarLayoutProps {
  events: EventItem[];
  onDateSelect: (dateStr: string) => void;
}

const CalendarLayout: React.FC<CalendarLayoutProps> = ({ events, onDateSelect }) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [title, setTitle] = useState("");

  const handlePrev = () => {
    calendarRef.current?.getApi().prev();
  };

  const handleNext = () => {
    calendarRef.current?.getApi().next();
  };

  const handleToday = () => {
    calendarRef.current?.getApi().today();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden p-6">
      {/* Custom Header */}
      <div className="flex justify-between items-center mb-6">
        {/* Left side: Icon + Title */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center p-2 rounded-xl bg-orange-50 text-orange-600">
            <CalendarDays className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
        </div>

        {/* Right side: Flexed buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToday}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all cursor-pointer shadow-xs hover:border-gray-300"
          >
            Today
          </button>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-900 hover:bg-gray-800 text-white transition-all cursor-pointer shadow-xs active:scale-95"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-900 hover:bg-gray-800 text-white transition-all cursor-pointer shadow-xs active:scale-95"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="fc-custom-wrapper">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          height="auto"
          headerToolbar={false}
          selectable={true}
          dateClick={(info) => onDateSelect(info.dateStr)}
          datesSet={(dateInfo) => {
            setTitle(dateInfo.view.title);
          }}
          dayHeaderFormat={{ weekday: "short" }}
          fixedWeekCount={false}
          events={events}
        />
      </div>
    </div>
  );
};

export default CalendarLayout;
