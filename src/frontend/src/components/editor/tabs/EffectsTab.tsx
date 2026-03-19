import { Button } from "@/components/ui/button";
import { useEditor } from "@/contexts/EditorContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FACE_EFFECTS = [
  {
    id: "auto_enhance",
    label: "Auto Enhance",
    emoji: "✨",
    desc: "Smart brightness & contrast",
    adj: { brightness: 5, contrast: 10, saturation: 8 },
  },
  {
    id: "face_smooth",
    label: "Face Smooth",
    emoji: "🌸",
    desc: "Soft skin + brightness boost",
    adj: { brightness: 12, contrast: -5, saturation: 5, blur: 0.8 },
  },
  {
    id: "cartoon",
    label: "Cartoon",
    emoji: "🎨",
    desc: "High contrast + vivid colors",
    adj: { brightness: 5, contrast: 35, saturation: 55 },
  },
  {
    id: "old_age",
    label: "Old Age",
    emoji: "👴",
    desc: "Sepia tones + faded look",
    adj: { brightness: -5, contrast: -10, saturation: -40, temperature: 30 },
  },
  {
    id: "young",
    label: "Young",
    emoji: "🌱",
    desc: "Bright & smooth skin",
    adj: { brightness: 15, contrast: -8, saturation: 10 },
  },
  {
    id: "makeup",
    label: "Makeup",
    emoji: "💄",
    desc: "Warm & rich saturation",
    adj: { brightness: 8, contrast: 5, saturation: 30, temperature: 20 },
  },
];

const BG_PRESETS = [
  {
    id: "beach",
    label: "🏖️ Beach",
    gradient: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
  },
  {
    id: "office",
    label: "🏢 Office",
    gradient: "linear-gradient(135deg, #d7d7d7 0%, #a8b8c8 100%)",
  },
  {
    id: "city",
    label: "🌆 City",
    gradient: "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
  },
  {
    id: "forest",
    label: "🌲 Forest",
    gradient: "linear-gradient(135deg, #134e5e 0%, #71b280 100%)",
  },
  {
    id: "sunset",
    label: "🌅 Sunset",
    gradient: "linear-gradient(135deg, #f83600 0%, #f9d423 100%)",
  },
];

export default function EffectsTab() {
  const { state, dispatch } = useEditor();

  function applyEffect(adj: Record<string, number>) {
    for (const [key, value] of Object.entries(adj)) {
      dispatch({ type: "SET_ADJUSTMENT", key: key as any, value });
    }
    dispatch({ type: "PUSH_HISTORY" });
    toast.success("Effect applied!");
  }

  function applyBgPreset(gradient: string) {
    dispatch({ type: "SET_BACKGROUND", url: gradient });
    toast.success("Background applied!");
  }

  function openBgRemoveTab() {
    dispatch({ type: "SET_ACTIVE_PANEL", panel: "bg" });
    toast.info("BG Remove tab khola gaya!");
  }

  return (
    <div className="px-3 py-3 space-y-4 pb-20">
      <div>
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
          Face & Photo Effects
        </p>
        <div className="grid grid-cols-2 gap-2">
          {FACE_EFFECTS.map((effect) => (
            <button
              key={effect.id}
              type="button"
              onClick={() =>
                applyEffect(effect.adj as unknown as Record<string, number>)
              }
              disabled={!state.imageUrl}
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg p-2.5 border transition-all text-left",
                "border-border bg-card hover:border-primary hover:bg-primary/10",
                "disabled:opacity-40 disabled:cursor-not-allowed",
              )}
              data-ocid={`effects.${effect.id}.button`}
            >
              <span className="text-xl">{effect.emoji}</span>
              <span className="text-xs font-semibold text-foreground">
                {effect.label}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {effect.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
          Background Remove & Replace
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full h-8 text-xs gap-1.5 mb-3"
          disabled={!state.imageUrl}
          onClick={openBgRemoveTab}
          data-ocid="effects.remove_bg.button"
        >
          🗑️ Remove Background
        </Button>
        <p className="text-[11px] text-muted-foreground mb-2">
          Background Presets
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {BG_PRESETS.map((bg) => (
            <button
              key={bg.id}
              type="button"
              onClick={() => applyBgPreset(bg.gradient)}
              disabled={!state.imageUrl}
              className="flex flex-col items-center gap-1 group"
              data-ocid={`effects.bg_${bg.id}.button`}
            >
              <div
                className="w-full aspect-square rounded-md border border-border group-hover:border-primary transition-colors"
                style={{ background: bg.gradient }}
              />
              <span className="text-[9px] text-muted-foreground">
                {bg.label.split(" ")[1]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
