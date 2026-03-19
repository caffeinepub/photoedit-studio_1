import { useEditor } from "@/contexts/EditorContext";
import { cn } from "@/lib/utils";
import {
  Film,
  Grid2x2,
  Image,
  Layout,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Type,
  Video,
} from "lucide-react";

const TABS = [
  { id: "adjust", label: "Adjust", Icon: SlidersHorizontal },
  { id: "filters", label: "Filters", Icon: Film },
  { id: "text", label: "Text", Icon: Type },
  { id: "stickers", label: "Stickers", Icon: Smile },
  { id: "face", label: "Face", Icon: Sparkles },
  { id: "bg", label: "BG Remove", Icon: Image },
  { id: "templates", label: "Templates", Icon: Layout },
  { id: "collage", label: "Collage", Icon: Grid2x2 },
  { id: "reel", label: "Reel", Icon: Video },
] as const;

export default function BottomTabBar() {
  const { state, dispatch } = useEditor();

  return (
    <div
      className="flex-shrink-0 border-t border-border flex items-center overflow-x-auto scrollbar-none"
      style={{
        backgroundColor: "oklch(0.11 0.012 222 / 0.97)",
        backdropFilter: "blur(16px)",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        height: 64,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      data-ocid="toolbar.panel"
    >
      <div
        className="flex items-center gap-0.5 px-2 min-w-max"
        style={{ display: "flex", flexWrap: "nowrap" }}
      >
        {TABS.map(({ id, label, Icon }) => {
          const isActive = state.activePanel === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (state.activePanel === id) {
                  dispatch({ type: "SET_ACTIVE_PANEL", panel: "" });
                } else {
                  dispatch({ type: "SET_ACTIVE_PANEL", panel: id });
                }
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl min-w-[60px] transition-all duration-200",
                isActive
                  ? "text-primary bg-primary/15"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
              )}
              data-ocid={`toolbar.${id}.button`}
            >
              <Icon
                className={cn(
                  "transition-all",
                  isActive ? "w-5 h-5" : "w-4.5 h-4.5",
                )}
                style={{
                  width: isActive ? 20 : 18,
                  height: isActive ? 20 : 18,
                }}
              />
              <span
                className={cn(
                  "text-[10px] font-medium leading-none whitespace-nowrap",
                  isActive ? "text-primary" : "",
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
