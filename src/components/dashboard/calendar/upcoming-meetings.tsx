import React from "react";

const UpcomingMeetings = () => {
  return (
    <div className="space-y-6 shadow rounded-2xl bg-white">
      <header className="flex justify-between items-center p-5 pb-0">
        <div>
          <h4 className="text-3xl font-bold text-gray-900">
            Upcoming Meetings
          </h4>
        </div>
        <div>
          <input
            type="date"
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm"
          />
        </div>
      </header>
      <section className="space-y-4 border-t border-gray-300 p-5">
        <div className="flex justify-center items-center h-20">
          <p className="text-gray-600">No upcoming meetings</p>
        </div>
      </section>
    </div>
  );
};

export default UpcomingMeetings;
