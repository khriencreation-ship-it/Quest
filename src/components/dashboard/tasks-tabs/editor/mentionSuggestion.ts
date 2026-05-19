import { ReactRenderer } from "@tiptap/react";
import tippy, { Instance } from "tippy.js";
import { MentionList, MentionItem } from "./MentionList";
import { PluginKey } from "@tiptap/pm/state";


// `getItems` is called with the query string — return a filtered list of MentionItem.

export function buildMentionSuggestion(
  getItems: (query: string) => MentionItem[],
  char = "@",
  pluginKey?: PluginKey,
) {
  return {
    char,
    pluginKey,
    items: ({ query }: { query: string }) => getItems(query),
    render: () => {
      let component: ReactRenderer | null = null;
      let popup: Instance | null = null;

      return {
        onStart: (props: any) => {
          component = new ReactRenderer(MentionList, {
            props: { ...props, items: props.items },
            editor: props.editor,
          });

          if (!props.clientRect) return;

          popup = (tippy as any)("body", {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "top-start",
            arrow: false,
            offset: [0, 6],
          })[0];
        },

        onUpdate(props: any) {
          component?.updateProps(props);
          if (!props.clientRect) return;
          popup?.setProps({
            getReferenceClientRect: props.clientRect,
          });
        },

        onKeyDown(props: any) {
          if (props.event.key === "Escape") {
            popup?.hide();
            return true;
          }
          return (component?.ref as any)?.onKeyDown?.(props.event) ?? false;
        },

        onExit() {
          popup?.destroy();
          component?.destroy();
        },
      };
    },
  };
}
