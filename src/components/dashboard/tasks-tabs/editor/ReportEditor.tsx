"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import { buildMentionSuggestion } from "./mentionSuggestion";
import type { StaffMember } from "@/types/task-details.types";
import type { SubTask } from "@/types/kanban-types";

interface ReportEditorProps {
  /** All task members (assignee + collaborators) who can be @-mentioned */
  members: StaffMember[];
  /** Subtasks that can be #-referenced */
  subTasks: SubTask[];
  /** Controlled content (plain text / HTML) */
  content: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
}

const SubtaskMention = Mention.extend({
  name: "subtask",
});

/* ── Component ────────────────────────────── */

export function ReportEditor({
  members,
  subTasks,
  content,
  onContentChange,
  placeholder = "Type a progress update... Use @ to mention a team member and # to reference a subtask.",
}: ReportEditorProps) {
  // Use refs to make sure the Tiptap editor callbacks always access the freshest data,
  // preventing stale closure issues since useEditor only configures extensions once on mount.
  const membersRef = useRef(members);
  const subTasksRef = useRef(subTasks);

  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  useEffect(() => {
    subTasksRef.current = subTasks;
  }, [subTasks]);

  const mentionSuggestion = useMemo(
    () =>
      buildMentionSuggestion((query: string) => {
        const q = query.toLowerCase();
        return membersRef.current
          .filter((m) => m.full_name.toLowerCase().includes(q))
          .slice(0, 8)
          .map((m) => ({
            id: m.user_id,
            label: m.full_name,
            type: "member" as const,
          }));
      }, "@"),
    [],
  );

  const subtaskSuggestion = useMemo(
    () =>
      buildMentionSuggestion((query: string) => {
        const q = query.toLowerCase();
        return subTasksRef.current
          .filter((st) => st.title.toLowerCase().includes(q))
          .slice(0, 8)
          .map((st) => ({
            id: st.id,
            label: st.title,
            type: "subtask" as const,
          }));
      }, "#"),
    [],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
        },
        suggestion: mentionSuggestion,
      }),
      SubtaskMention.configure({
        HTMLAttributes: {
          class: "subtask-mention",
        },
        suggestion: subtaskSuggestion,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[60px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 focus-within:ring-2 focus-within:ring-[#2eb781]/20 focus-within:border-[#2eb781] transition-all">
      <EditorContent editor={editor} />

      {/* Custom mention styling */}
      <style jsx global>{`
        .mention {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 1px 6px;
          border-radius: 6px;
          background: #ecfdf5;
          color: #059669;
          font-weight: 600;
          font-size: 0.8125rem;
          border: 1px solid #a7f3d0;
        }
        .mention::before {
          content: "@";
        }
        .subtask-mention {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 1px 6px;
          border-radius: 6px;
          background: #eff6ff;
          color: #2563eb;
          font-weight: 600;
          font-size: 0.8125rem;
          border: 1px solid #bfdbfe;
        }
        .subtask-mention::before {
          content: "#";
        }
      `}</style>
    </div>
  );
}
