"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react";

export interface MentionItem {
  id: string;
  label: string;   // display name
  type: "member" | "subtask";
}

interface Props {
  items: MentionItem[];
  command: (item: MentionItem) => void;
}

export const MentionList = forwardRef<{ onKeyDown: (e: KeyboardEvent) => boolean }, Props>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => setSelectedIndex(0), [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((prev) => (prev >= items.length - 1 ? 0 : prev + 1));
          return true;
        }
        if (event.key === "Enter") {
          if (items[selectedIndex]) command(items[selectedIndex]);
          return true;
        }
        return false;
      },
    }));

    if (!items.length) return null;

    return (
      <div className="absolute bottom-full left-0 mb-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50 p-1">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => command(item)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
              i === selectedIndex
                ? item.type === "subtask"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-emerald-50 text-emerald-700"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            {item.type === "subtask" ? (
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                #
              </span>
            ) : (
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                {item.label[0].toUpperCase()}
              </span>
            )}
            <span className="font-medium truncate">{item.label}</span>
          </button>
        ))}
      </div>
    );
  },
);

MentionList.displayName = "MentionList";
