import React from "react";
import CalendarLayout from "./calender-layout";

const Calendar = () => {
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
          <button className="flex items-center gap-2 px-4 py-2 bg-[#2eb781] text-white rounded-xl text-sm font-semibold hover:bg-[#279e6f] transition-colors shadow-sm">
            Schedule Meeting
          </button>
        </div>
      </header>
      <CalendarLayout />
    </div>
  );
};
export default Calendar;
